/**
 * @file public/guardian/service.cjs
 *
 * Trading Guardian inside the desktop app. Once a second, while switched on,
 * it reads four regions of Trade Terminal's screen through the PowerShell
 * helper, runs the rules in engine.cjs, and carries out what they ask: an
 * always-on-top alert with a beep, or a normal close of Trade Terminal.
 *
 * Files, in the app's data folder under `guardian/`:
 *   config.json   on/off, the four screen regions, the process name, and
 *                 the last rules received from Settings
 *   state.json    today's warnings, final trade and lock — survives restarts,
 *                 so closing and reopening the app does not lift a lock
 *   log.txt       what Guardian saw and did
 *
 * Safety, as in the original: Trade Terminal is only ever asked to close the
 * way clicking X does. If it does not close within 30 seconds Guardian says
 * so and leaves it open; nothing is force-killed.
 */

const path = require('path');
const fs = require('fs');
const os = require('os');
const { spawn } = require('child_process');
const engine = require('./engine.cjs');
const alerts = require('./alerts.cjs');

const POLL_MS = 1000;
const CLOSE_WAIT_SECONDS = 30;
const CLOSE_RETRY_MS = 35 * 1000;
const MAX_LOG_BYTES = 2 * 1024 * 1024;
// The log is a live view of what Guardian sees, not a record: it is wiped
// on this interval. Today's warnings and lock live in state.json instead.
const LOG_CLEAR_MS = 5 * 60 * 1000;
// Trade Terminal's alert window is checked every few seconds, not every
// tick: alerts stay on screen, and OCR of a whole window costs more.
const ALERT_SCAN_EVERY_TICKS = 3;
const ALERT_WINDOW_TITLE = 'Alert';

// Read from Trade Terminal's header and tab bar, which never move inside
// the window: large, steady text, unlike a cell in a table.
const REGION_KEYS = ['account', 'balance', 'projectedBalance', 'positions', 'filledOrders'];
const REGION_PROMPTS = {
  account: 'Select the ACCOUNT number (e.g. MAX2532704)',
  balance: 'Select the BALANCE amount',
  projectedBalance: 'Select the PROJECTED BALANCE amount',
  positions: 'Select the POSITIONS tab label, e.g. Positions (0)',
  filledOrders: 'Select the FILLED ORDERS tab label, e.g. Filled orders (10)',
  alerts: 'Select Trade Terminal’s ALERTS list, every row of it',
};
// Read when set, never required: Trade Terminal's own alerts list, for
// filing triggers under Playbook strategies.
const OPTIONAL_REGION_KEYS = ['alerts'];

function scriptPath() {
  // Packaged builds unpack the script beside the archive: PowerShell cannot
  // read inside app.asar.
  return path.join(__dirname, 'worker.ps1').replace(`app.asar${path.sep}`, `app.asar.unpacked${path.sep}`);
}

function escapeHtml(text) {
  return String(text ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ── The PowerShell helper ────────────────────────────────────────────────────

class GuardianWorker {
  constructor(onExit) {
    this.onExit = onExit;
    this.child = null;
    this.buffer = '';
    this.pending = new Map();
    this.nextId = 1;
    this.ready = null;
    this.ocr = false;
  }

  start() {
    if (this.ready) return this.ready;
    this.ready = new Promise((resolve, reject) => {
      const child = spawn('powershell.exe', [
        '-NoProfile', '-NonInteractive', '-ExecutionPolicy', 'Bypass', '-File', scriptPath(),
      ], { windowsHide: true });
      this.child = child;
      const startTimer = setTimeout(() => reject(new Error('Guardian helper did not start')), 30000);

      child.stdout.setEncoding('utf8');
      child.stdout.on('data', (chunk) => {
        this.buffer += chunk;
        let index;
        while ((index = this.buffer.indexOf('\n')) >= 0) {
          const line = this.buffer.slice(0, index).trim();
          this.buffer = this.buffer.slice(index + 1);
          if (!line) continue;
          let message;
          try { message = JSON.parse(line); } catch { continue; }
          if (message.ready) {
            clearTimeout(startTimer);
            this.ocr = Boolean(message.ocr);
            resolve(true);
            continue;
          }
          const entry = this.pending.get(message.id);
          if (!entry) continue;
          this.pending.delete(message.id);
          clearTimeout(entry.timer);
          if (message.ok) entry.resolve(message);
          else entry.reject(new Error(message.error || 'Guardian helper error'));
        }
      });
      child.stderr.on('data', () => {});
      child.on('exit', () => {
        clearTimeout(startTimer);
        for (const entry of this.pending.values()) {
          clearTimeout(entry.timer);
          entry.reject(new Error('Guardian helper stopped'));
        }
        this.pending.clear();
        this.child = null;
        this.ready = null;
        this.onExit?.();
        reject(new Error('Guardian helper stopped'));
      });
      child.on('error', (error) => {
        clearTimeout(startTimer);
        reject(error);
      });
    });
    // A rejected start must not leave an unhandled rejection behind.
    this.ready.catch(() => { this.ready = null; });
    return this.ready;
  }

  async request(payload, timeoutMs = 15000) {
    await this.start();
    return new Promise((resolve, reject) => {
      const id = this.nextId++;
      const timer = setTimeout(() => {
        this.pending.delete(id);
        reject(new Error(`Guardian helper timed out on ${payload.op}`));
      }, timeoutMs);
      this.pending.set(id, { resolve, reject, timer });
      this.child.stdin.write(`${JSON.stringify({ ...payload, id })}\n`);
    });
  }

  stop() {
    if (this.child) {
      try { this.child.stdin.end(); } catch { /* already closing */ }
      try { this.child.kill(); } catch { /* already gone */ }
    }
    this.child = null;
    this.ready = null;
  }
}

// ── The service ──────────────────────────────────────────────────────────────

function registerGuardian({ app, ipcMain, BrowserWindow, shell, screen, getMainWindow }) {
  const dir = path.join(app.getPath('userData'), 'guardian');
  const files = {
    config: path.join(dir, 'config.json'),
    state: path.join(dir, 'state.json'),
    log: path.join(dir, 'log.txt'),
    triggers: path.join(dir, 'triggers'),
  };
  fs.mkdirSync(dir, { recursive: true });

  const readJson = (file, fallback) => {
    try { return JSON.parse(fs.readFileSync(file, 'utf8')); } catch { return fallback; }
  };
  const writeJson = (file, value) => {
    const temp = `${file}.tmp`;
    fs.writeFileSync(temp, JSON.stringify(value, null, 2));
    fs.renameSync(temp, file);
  };

  let config = {
    enabled: false,
    processName: 'TradeTerminal.exe',
    regions: {},
    rules: null,
    ...readJson(files.config, {}),
  };
  let dayState = readJson(files.state, null);
  let runtime = engine.createRuntime();
  let phase = 'off';
  let lastReading = null;
  let lastReadingKey = '';
  let lastError = '';
  let timer = null;
  let ticking = false;
  let closing = false;
  let lastCloseAttemptAt = 0;
  let testRun = null;
  // Today's triggers from Trade Terminal's alerts, kept on disk per day so
  // none are lost before Trade Desk has filed them.
  let tickCount = 0;
  let triggerDate = '';
  let triggers = [];
  let triggerIds = new Set();
  const openAlerts = new Map();

  const worker = new GuardianWorker(() => {
    if (config.enabled) log('Guardian helper stopped; restarting.');
  });

  function log(message) {
    const stamp = new Date().toISOString().replace('T', ' ').slice(0, 19);
    try {
      if (fs.existsSync(files.log) && fs.statSync(files.log).size > MAX_LOG_BYTES) {
        fs.renameSync(files.log, `${files.log}.old`);
      }
      fs.appendFileSync(files.log, `[${stamp}] ${message}\n`);
    } catch { /* logging must never stop the guardian */ }
  }

  function saveConfig() {
    try { writeJson(files.config, config); } catch (error) { lastError = `Could not save Guardian settings: ${error.message}`; }
  }

  function saveState() {
    try { writeJson(files.state, dayState); } catch { /* retried next change */ }
  }

  function missingSetup() {
    const missing = REGION_KEYS.filter((key) => !Array.isArray(config.regions?.[key]));
    const accounts = Array.isArray(config.rules?.accounts) ? config.rules.accounts : [];
    const hasLimits = Number(config.rules?.limits?.hard) > 0;
    return { regions: missing, accounts: !hasLimits && accounts.length === 0 };
  }

  function getStatus() {
    const missing = missingSetup();
    return {
      supported: process.platform === 'win32',
      enabled: Boolean(config.enabled),
      phase,
      processName: config.processName,
      regions: config.regions || {},
      missingRegions: missing.regions,
      missingAccounts: missing.accounts,
      ocrAvailable: worker.ocr,
      rules: config.rules,
      reading: lastReading,
      day: dayState,
      closing,
      testRunning: Boolean(testRun),
      triggersToday: triggers.length,
      lastTrigger: triggers[triggers.length - 1] || null,
      lastError,
      logPath: files.log,
    };
  }

  let lastBroadcast = '';
  function broadcast(force = false) {
    const status = getStatus();
    const serialized = JSON.stringify(status);
    if (!force && serialized === lastBroadcast) return;
    lastBroadcast = serialized;
    const win = getMainWindow?.();
    if (win && !win.isDestroyed()) win.webContents.send('guardian:status', status);
  }

  // ── Alerts ────────────────────────────────────────────────────────────────

  function beep(severity) {
    const count = severity === 'final' ? 3 : severity === 'warning' ? 2 : 1;
    for (let i = 0; i < count; i += 1) setTimeout(() => shell.beep(), i * 450);
  }

  function showAlert({ key, title, message, severity = 'warning', test = false }) {
    if (test) {
      key = `test_${key}`;
      title = `TEST · ${title}`;
    }
    if (openAlerts.has(key)) return;
    beep(severity);
    const accent = severity === 'final' ? '#f43f5e' : severity === 'warning' ? '#f59e0b' : '#22d3ee';
    const html = `<!doctype html><html><head><meta charset="utf-8"><title>Trading Guardian</title>
<style>
  html,body{margin:0;height:100%;background:#11131e;color:#fff;font-family:'Segoe UI',sans-serif}
  .wrap{box-sizing:border-box;height:100%;display:flex;flex-direction:column;padding:26px 30px;border-top:6px solid ${accent}}
  .eyebrow{font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:${accent};font-weight:700}
  h1{margin:8px 0 14px;font-size:22px}
  p{white-space:pre-wrap;line-height:1.5;font-size:${severity === 'final' ? 16 : 15}px;margin:0;flex:1;color:rgba(255,255,255,.85);${severity === 'final' ? 'font-weight:600;' : ''}}
  button{margin-top:20px;align-self:center;background:${accent};color:#0b0d14;border:0;border-radius:10px;padding:12px 34px;font-size:14px;font-weight:800;cursor:pointer;letter-spacing:.04em}
</style></head><body><div class="wrap">
  <div class="eyebrow">Trading Guardian</div>
  <h1>${escapeHtml(title)}</h1>
  <p>${escapeHtml(message)}</p>
  <button autofocus onclick="window.close()">I UNDERSTAND</button>
</div></body></html>`;

    const display = screen.getPrimaryDisplay().workArea;
    const width = 620;
    const height = severity === 'final' ? 440 : 400;
    const win = new BrowserWindow({
      width,
      height,
      x: Math.round(display.x + (display.width - width) / 2),
      y: Math.round(display.y + Math.max(40, (display.height - height) / 3)),
      alwaysOnTop: true,
      resizable: false,
      minimizable: false,
      maximizable: false,
      skipTaskbar: false,
      title: `Trading Guardian - ${title}`,
      backgroundColor: '#11131e',
      autoHideMenuBar: true,
      webPreferences: { contextIsolation: true, nodeIntegration: false, sandbox: true },
    });
    // Above full-screen terminals too.
    win.setAlwaysOnTop(true, 'screen-saver');
    openAlerts.set(key, win);
    win.on('closed', () => openAlerts.delete(key));
    win.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(html)}`);
    win.once('ready-to-show', () => win.show());
    log(`Alert: ${title}`);
  }

  // ── Closing Trade Terminal, safely ────────────────────────────────────────

  async function isRunning() {
    const reply = await worker.request({ op: 'status', process: config.processName });
    return Boolean(reply.running);
  }

  async function safeClose() {
    if (closing || Date.now() - lastCloseAttemptAt < CLOSE_RETRY_MS) return;
    closing = true;
    lastCloseAttemptAt = Date.now();
    broadcast();
    try {
      const reply = await worker.request({ op: 'close', process: config.processName });
      if (!reply.requested) {
        log('Safe close: could not find the main Trade Terminal window. Left open.');
        showAlert({
          key: 'safe_close_manual',
          severity: 'final',
          title: 'Close Trade Terminal',
          message: 'The session is locked, but Guardian could not find the main Trade Terminal window.\n\nPlease close Trade Terminal yourself with its X button.',
        });
        return;
      }
      log('Safe close: sent the normal close request to Trade Terminal.');
      for (let second = 0; second < CLOSE_WAIT_SECONDS; second += 1) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
        if (!(await isRunning())) {
          log('Trade Terminal closed normally. Nothing was force-closed.');
          return;
        }
      }
      log(`Safe close: Trade Terminal still open after ${CLOSE_WAIT_SECONDS}s. Left open; no force-kill.`);
      showAlert({
        key: 'safe_close_manual',
        severity: 'final',
        title: 'Close Trade Terminal manually',
        message: `Guardian asked Trade Terminal to close normally, but it is still open after ${CLOSE_WAIT_SECONDS} seconds.\n\nFor safety Guardian will NOT force it closed. Please close Trade Terminal with its X button.`,
      });
    } catch (error) {
      log(`Safe close failed: ${error.message}`);
    } finally {
      closing = false;
      broadcast();
    }
  }

  // ── The loop ──────────────────────────────────────────────────────────────

  async function readScreen() {
    const regions = Object.fromEntries(REGION_KEYS.map((key) => [key, config.regions[key]]));
    const reply = await worker.request({ op: 'read', regions });
    const texts = reply.texts || {};
    const raw = Object.fromEntries(REGION_KEYS.map((key) => [key, texts[key] || '']));
    return {
      accountText: raw.account,
      balance: engine.parseMoney(raw.balance),
      projectedBalance: engine.parseMoney(raw.projectedBalance),
      positions: engine.parsePositions(raw.positions),
      filledOrders: engine.parsePositions(raw.filledOrders),
      raw,
    };
  }

  function triggerFile(dateKey) {
    return path.join(files.triggers, `${dateKey}.json`);
  }

  function loadTriggers(dateKey) {
    if (triggerDate === dateKey) return;
    triggerDate = dateKey;
    triggers = readJson(triggerFile(dateKey), []);
    if (!Array.isArray(triggers)) triggers = [];
    triggerIds = new Set(triggers.map((t) => t.id));
  }

  /** Reads Trade Terminal's alert windows and keeps any trigger not seen yet. */
  async function scanAlerts(running) {
    if (!running) return;
    const now = new Date();
    const clock = engine.zonedClock(now, config.rules?.timeZone || engine.DEFAULT_CONFIG.timeZone);
    loadTriggers(clock.dateKey);
    const panels = Array.isArray(config.regions?.alerts) ? [config.regions.alerts] : [];
    const reply = await worker.request({ op: 'alerts', process: config.processName, title: ALERT_WINDOW_TITLE, panels }, 20000);
    const windows = Array.isArray(reply.windows) ? reply.windows : (reply.windows ? [reply.windows] : []);
    const fresh = [];
    for (const text of windows) {
      for (const trigger of alerts.parseAlertWindow(text, { dateKey: clock.dateKey, nowMinutes: clock.minutes })) {
        if (triggerIds.has(trigger.id)) continue;
        triggerIds.add(trigger.id);
        fresh.push({
          ...trigger,
          capturedAt: now.toISOString(),
          // The moment it fired, as Guardian saw it, for judging it later.
          context: {
            account: lastReading?.account || dayState?.account || null,
            dailyPnl: lastReading?.dailyPnl ?? null,
            positions: lastReading?.positions ?? null,
            phase,
          },
        });
      }
    }
    if (fresh.length === 0) return;
    triggers = [...triggers, ...fresh];
    try {
      fs.mkdirSync(files.triggers, { recursive: true });
      writeJson(triggerFile(clock.dateKey), triggers);
    } catch (error) {
      log(`Could not save triggers: ${error.message}`);
    }
    for (const t of fresh) log(`Trigger: ${t.symbol} ${t.setupText || '?'} ${t.direction} @ ${t.price} ${t.timeEt} ET`);
    broadcast(true);
  }

  async function tick() {
    if (ticking || !config.enabled) return;
    ticking = true;
    try {
      tickCount += 1;
      if (tickCount % ALERT_SCAN_EVERY_TICKS === 0) {
        try {
          await scanAlerts(await isRunning());
        } catch (error) {
          if (lastError !== error.message) log(`Alert scan failed: ${error.message}`);
        }
      }

      const missing = missingSetup();
      if (missing.regions.length > 0 || missing.accounts) {
        phase = 'setup';
        return;
      }

      const now = new Date();
      const plan = engine.planTick({ state: dayState, config: config.rules, now });
      const reading = { running: await isRunning() };
      if (plan.read && reading.running) Object.assign(reading, await readScreen());

      const result = engine.step({ state: dayState, runtime, config: config.rules, reading, now });
      const stateChanged = JSON.stringify(result.state) !== JSON.stringify(dayState);
      dayState = result.state;
      runtime = result.runtime;
      phase = result.phase;
      if (stateChanged) saveState();

      const computed = result.computed || {};
      lastReading = {
        running: reading.running,
        account: result.account ? (result.account.label || result.account.match) : null,
        accountText: reading.accountText ?? null,
        balance: reading.balance ?? null,
        projectedBalance: reading.projectedBalance ?? null,
        startBalance: computed.startBalance ?? null,
        dailyPnl: computed.dailyPnl ?? null,
        positions: reading.positions ?? null,
        unrealizedPnl: computed.unrealizedPnl ?? null,
        filledOrders: reading.filledOrders ?? null,
        trades: computed.trades ?? null,
        at: now.toISOString(),
      };
      // Log what was seen only when it changes, not every second.
      const readingKey = `${phase}|${lastReading.account}|${lastReading.balance}|${lastReading.dailyPnl}|${lastReading.positions}|${lastReading.unrealizedPnl}|${lastReading.filledOrders}`;
      if (readingKey !== lastReadingKey) {
        lastReadingKey = readingKey;
        log(`Phase=${phase} Account=${lastReading.account || 'UNKNOWN'} Balance=${lastReading.balance ?? 'UNKNOWN'} DailyPnL=${lastReading.dailyPnl ?? 'UNKNOWN'} Positions=${lastReading.positions ?? 'UNKNOWN'} Open=${lastReading.unrealizedPnl ?? 'N/A'} Fills=${lastReading.filledOrders ?? 'UNKNOWN'}`);
      }

      for (const action of result.actions) {
        if (action.type === 'alert') showAlert(action);
        else if (action.type === 'log') log(action.message);
        else if (action.type === 'close') safeClose();
      }
      lastError = '';
    } catch (error) {
      phase = 'error';
      if (lastError !== error.message) log(`ERROR: ${error.message}`);
      lastError = error.message;
    } finally {
      ticking = false;
      broadcast();
    }
  }

  function schedule() {
    clearTimeout(timer);
    if (!config.enabled) return;
    timer = setTimeout(async () => {
      await tick();
      schedule();
    }, POLL_MS);
  }

  function setEnabled(enabled) {
    config.enabled = Boolean(enabled);
    saveConfig();
    log(config.enabled ? 'Guardian switched ON.' : 'Guardian switched OFF.');
    if (config.enabled) {
      phase = 'starting';
      worker.start().catch((error) => { lastError = error.message; phase = 'error'; broadcast(); });
      schedule();
    } else {
      clearTimeout(timer);
      phase = 'off';
      worker.stop();
    }
    broadcast(true);
    return getStatus();
  }

  // ── Drawing the regions ───────────────────────────────────────────────────

  async function pickRegion(key) {
    if (!REGION_KEYS.includes(key) && !OPTIONAL_REGION_KEYS.includes(key)) throw new Error(`Unknown region: ${key}`);
    const main = getMainWindow?.();
    const shotPath = path.join(os.tmpdir(), `tradedesk-guardian-${Date.now()}.png`);

    // Out of the way, so the screenshot shows Trade Terminal, not Trade Desk.
    const wasVisible = main && !main.isDestroyed() && main.isVisible() && !main.isMinimized();
    if (wasVisible) main.minimize();
    await new Promise((resolve) => setTimeout(resolve, 600));

    let shot;
    try {
      shot = await worker.request({ op: 'shot', path: shotPath }, 30000);
    } catch (error) {
      if (wasVisible) main.restore();
      throw error;
    }
    const imageData = fs.readFileSync(shotPath).toString('base64');
    try { fs.unlinkSync(shotPath); } catch { /* temp file */ }

    const display = screen.getPrimaryDisplay();
    const prompt = REGION_PROMPTS[key];
    const html = `<!doctype html><html><head><meta charset="utf-8"><style>
  html,body{margin:0;height:100%;overflow:hidden;cursor:crosshair;background:#000;user-select:none}
  img{position:fixed;inset:0;width:100vw;height:100vh;object-fit:fill}
  .bar{position:fixed;left:0;right:0;top:0;height:48px;background:rgba(0,0,0,.85);color:#fff;font:600 16px 'Segoe UI',sans-serif;display:flex;align-items:center;padding:0 20px}
  .bar span{color:#facc15;margin-left:10px;font-weight:400}
  .box{position:fixed;border:3px solid #facc15;box-shadow:0 0 0 9999px rgba(0,0,0,.35);display:none}
</style></head><body>
<img id="shot" src="data:image/png;base64,${imageData}" draggable="false">
<div class="bar">${escapeHtml(prompt)} — drag a tight box around the value.<span>Esc = cancel</span></div>
<div class="box" id="box"></div>
<script>
  const img = document.getElementById('shot');
  const box = document.getElementById('box');
  let start = null;
  const done = (region) => { document.title = 'RESULT:' + JSON.stringify(region); };
  addEventListener('keydown', (e) => { if (e.key === 'Escape') done(null); });
  addEventListener('mousedown', (e) => { start = { x: e.clientX, y: e.clientY }; box.style.display = 'block'; move(e); });
  addEventListener('mousemove', (e) => { if (start) move(e); });
  function move(e) {
    const x = Math.min(start.x, e.clientX), y = Math.min(start.y, e.clientY);
    Object.assign(box.style, { left: x + 'px', top: y + 'px', width: Math.abs(e.clientX - start.x) + 'px', height: Math.abs(e.clientY - start.y) + 'px' });
  }
  addEventListener('mouseup', (e) => {
    if (!start) return;
    const sx = img.naturalWidth / innerWidth, sy = img.naturalHeight / innerHeight;
    const x1 = Math.round(Math.min(start.x, e.clientX) * sx), y1 = Math.round(Math.min(start.y, e.clientY) * sy);
    const x2 = Math.round(Math.max(start.x, e.clientX) * sx), y2 = Math.round(Math.max(start.y, e.clientY) * sy);
    start = null;
    if (x2 - x1 >= 20 && y2 - y1 >= 10) done([x1 + ${Number(shot.x) || 0}, y1 + ${Number(shot.y) || 0}, x2 + ${Number(shot.x) || 0}, y2 + ${Number(shot.y) || 0}]);
    else box.style.display = 'none';
  });
</script></body></html>`;

    const picker = new BrowserWindow({
      x: display.bounds.x,
      y: display.bounds.y,
      width: display.bounds.width,
      height: display.bounds.height,
      frame: false,
      fullscreen: true,
      alwaysOnTop: true,
      skipTaskbar: true,
      backgroundColor: '#000000',
      webPreferences: { contextIsolation: true, nodeIntegration: false, sandbox: true },
    });
    picker.setAlwaysOnTop(true, 'screen-saver');

    // The page reports through its title: no Node access needed in it.
    const region = await new Promise((resolve) => {
      let settled = false;
      const finish = (value) => {
        if (settled) return;
        settled = true;
        resolve(value);
        if (!picker.isDestroyed()) setTimeout(() => picker.close(), 150);
      };
      picker.on('page-title-updated', (event, title) => {
        event.preventDefault();
        if (!title.startsWith('RESULT:')) return;
        try { finish(JSON.parse(title.slice(7))); } catch { finish(null); }
      });
      picker.on('closed', () => finish(null));
      picker.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(html)}`);
      picker.once('ready-to-show', () => { picker.show(); picker.focus(); });
    });

    if (wasVisible && main && !main.isDestroyed()) main.restore();

    if (region) {
      config.regions = { ...config.regions, [key]: region };
      saveConfig();
      log(`Region set: ${key} = [${region.join(', ')}]`);
      broadcast(true);
    }
    return region;
  }

  async function testRead() {
    const missing = missingSetup().regions;
    if (missing.length > 0) throw new Error(`Set these regions first: ${missing.join(', ')}`);
    const running = await isRunning();
    const reading = await readScreen();
    const account = engine.resolveAccount(reading.accountText, { ...engine.DEFAULT_CONFIG, ...config.rules });
    const name = account ? (account.label || account.match) : null;
    // The alerts list, if one is set: what it shows, as triggers.
    let alertsFound = null;
    if (Array.isArray(config.regions?.alerts) && running) {
      const clock = engine.zonedClock(new Date(), config.rules?.timeZone || engine.DEFAULT_CONFIG.timeZone);
      const reply = await worker.request({ op: 'alerts', process: config.processName, title: ' ', panels: [config.regions.alerts] }, 20000);
      const texts = Array.isArray(reply.windows) ? reply.windows : (reply.windows ? [reply.windows] : []);
      const found = texts.flatMap((text) => alerts.parseAlertWindow(text, { dateKey: clock.dateKey, nowMinutes: clock.minutes }));
      alertsFound = {
        count: found.length,
        sample: found.slice(0, 3).map((t) => `${t.timeEt} ${t.symbol} ${t.setupText} ${t.direction} @ ${t.price}`),
      };
    }
    const start = name && dayState?.startBalances?.[name]?.value;
    const fillsPerTrade = Math.max(1, Number(config.rules?.fillsPerTrade) || 2);
    return {
      running,
      raw: reading.raw,
      account: name,
      alertsFound,
      balance: reading.balance,
      projectedBalance: reading.projectedBalance,
      positions: reading.positions,
      filledOrders: reading.filledOrders,
      trades: reading.filledOrders != null ? Math.floor(reading.filledOrders / fillsPerTrade) : null,
      startBalance: start ?? null,
      dailyPnl: start != null && reading.balance != null ? Math.round((reading.balance - start) * 100) / 100 : null,
      unrealizedPnl: reading.balance != null && reading.projectedBalance != null
        ? Math.round((reading.projectedBalance - reading.balance) * 100) / 100
        : null,
    };
  }

  // ── Test mode ─────────────────────────────────────────────────────────────
  //
  // Replays a scenario through the real rules at speed: every alert appears
  // as it would live, marked TEST. Trade Terminal is never touched — where
  // Guardian would close it, a TEST alert says so instead. The real day's
  // state is not read or changed.

  function scenarioSteps(name, limits) {
    const start = 25000;
    const read = (pnl, positions, open = 0, fills = 0) => ({
      running: true,
      accountText: 'TEST1234',
      balance: start + pnl,
      projectedBalance: start + pnl + open,
      positions,
      filledOrders: fills,
    });
    const hard = limits.hard || 250;
    const warning = limits.warning || hard / 2;
    const maxTrades = limits.maxTrades || 4;
    const peak = Math.max(limits.dailyTarget || 0, (limits.gainProtectFrom || 100) * 2, 200);
    const day = [[0, read(0, 0)], [1, read(0, 0)], [2, read(0, 0)]];
    const W = engine.WARNING_INTERVAL_MS / 1000;
    switch (name) {
      case 'warning':
        return [...day,
          [10, read(-warning - 5, 0)],
          [10 + W, read(-warning - 5, 0)],
          [10 + 2 * W, read(-warning - 5, 0)],
          [10 + 2 * W + 20, read(-warning - 5, 1, -10)],
          [10 + 2 * W + 40, read(-warning - 30, 0)]];
      case 'finalLoss':
        return [...day,
          [10, read(-warning - 5, 0)],
          [20, read(-warning - 5, 1, -10)],
          ...[30, 31, 32].map((t) => [t, read(-warning - 5, 1, -(limits.finalTradeLoss || 50) - 5)]),
          [60, read(-warning - 5 - (limits.finalTradeLoss || 50) - 5, 0)]];
      case 'hard':
        return [...day, ...[10, 11, 12].map((t) => [t, read(-hard - 5, 0)])];
      case 'maxTrades':
        return [...day,
          ...[10, 11, 12].map((t) => [t, read(10, 0, 0, (maxTrades - 1) * 2)]),
          [20, read(10, 1, 0, (maxTrades - 1) * 2 + 1)],
          ...[30, 31, 32].map((t) => [t, read(15, 0, 0, maxTrades * 2)])];
      case 'cooldown':
        return [...day, [10, read(0, 1, -20)], [40, read(-40, 0)], [100, read(-40, 1)]];
      case 'greenDay':
        return [...day, [10, read(peak, 0)], ...[20, 21, 22].map((t) => [t, read(Math.round(peak * 0.3), 0)])];
      case 'unreadable':
        return [0, 10, 20, 31].map((t) => [t, { running: true, accountText: '', balance: null, positions: 0 }]);
      default:
        throw new Error(`Unknown test: ${name}`);
    }
  }

  function runTest(name) {
    if (testRun) throw new Error('A test is already running');
    const rules = { ...engine.DEFAULT_CONFIG, ...config.rules, unlockTime: '23:58', stopTime: '23:59' };
    if (!rules.limits) throw new Error('Set a max daily loss on the Account tab first');
    const steps = scenarioSteps(name, rules.limits);

    // 10:00 in Guardian's time zone today, so the rules are in session.
    const now = new Date();
    const minutes = engine.zonedClock(now, rules.timeZone).minutes;
    const base = now.getTime() - (minutes - 600) * 60000;

    let state = null;
    let rt = engine.createRuntime();
    let index = 0;
    log(`TEST started: ${name}`);
    testRun = setInterval(() => {
      if (index >= steps.length) {
        clearInterval(testRun);
        testRun = null;
        log(`TEST finished: ${name}`);
        showAlert({ key: 'done', test: true, severity: 'info', title: 'Test finished', message: `The "${name}" test is done. Your real session was not touched.` });
        broadcast(true);
        return;
      }
      const [seconds, reading] = steps[index];
      index += 1;
      const out = engine.step({ state, runtime: rt, config: rules, reading, now: new Date(base + seconds * 1000) });
      state = out.state;
      rt = out.runtime;
      for (const action of out.actions) {
        if (action.type === 'alert') showAlert({ ...action, test: true });
        else if (action.type === 'close') {
          showAlert({ key: 'close', test: true, severity: 'final', title: 'Trade Terminal would close now', message: 'In a real session Guardian would now ask Trade Terminal to close, and keep it closed until the unlock time.' });
        }
      }
    }, 1200);
    broadcast(true);
    return getStatus();
  }

  // ── IPC ───────────────────────────────────────────────────────────────────

  ipcMain.handle('guardian:get-status', () => getStatus());
  ipcMain.handle('guardian:set-enabled', (_event, enabled) => setEnabled(enabled));
  ipcMain.handle('guardian:set-rules', (_event, rules = {}) => {
    const next = {
      timeZone: String(rules.timeZone || engine.DEFAULT_CONFIG.timeZone),
      unlockTime: String(rules.unlockTime || engine.DEFAULT_CONFIG.unlockTime),
      stopTime: String(rules.stopTime || engine.DEFAULT_CONFIG.stopTime),
      confirmReads: Number(rules.confirmReads) || engine.DEFAULT_CONFIG.confirmReads,
      fillsPerTrade: Math.max(1, Math.floor(Number(rules.fillsPerTrade) || engine.DEFAULT_CONFIG.fillsPerTrade)),
      maxTradesAction: rules.maxTradesAction === 'warn' ? 'warn' : 'lock',
      // The day's limits from Trade Desk's own settings, for whatever
      // account Trade Terminal shows.
      limits: rules.limits && Number(rules.limits.hard) > 0
        ? {
            tier: String(rules.limits.tier || ''),
            hard: Math.abs(Number(rules.limits.hard) || 0),
            warning: Math.abs(Number(rules.limits.warning) || 0),
            finalTradeLoss: Math.abs(Number(rules.limits.finalTradeLoss) || 0),
            maxTrades: Math.max(0, Math.floor(Number(rules.limits.maxTrades) || 0)),
            cooldownMinutes: Math.max(0, Number(rules.limits.cooldownMinutes) || 0),
            dailyTarget: Math.max(0, Number(rules.limits.dailyTarget) || 0),
            gainProtectFrom: Math.max(0, Number(rules.limits.gainProtectFrom) || 0),
            givebackPercent: Math.min(100, Math.max(0, Number(rules.limits.givebackPercent) || 0)),
            givebackAction: rules.limits.givebackAction === 'lock' ? 'lock' : 'warn',
            tightened: Boolean(rules.limits.tightened),
          }
        : null,
      accounts: (Array.isArray(rules.accounts) ? rules.accounts : [])
        .filter((account) => String(account?.match || '').trim())
        .map((account) => ({
          match: String(account.match).trim(),
          label: String(account.label || account.match).trim(),
          warning: Math.abs(Number(account.warning) || 0),
          hard: Math.abs(Number(account.hard) || 0),
          finalTradeLoss: Math.abs(Number(account.finalTradeLoss) || 0),
          maxTrades: Math.max(0, Math.floor(Number(account.maxTrades) || 0)),
        })),
    };
    if (JSON.stringify(next) !== JSON.stringify(config.rules)) {
      config.rules = next;
      saveConfig();
      const l = next.limits;
      log(l
        ? `Rules updated: tier ${l.tier} warn -${l.warning} hard -${l.hard} final trade -${l.finalTradeLoss} max trades ${l.maxTrades || 'off'} (${next.maxTradesAction})`
        : `Rules updated: ${next.accounts.map((a) => `${a.label} warn -${a.warning} hard -${a.hard} final -${a.finalTradeLoss}`).join('; ') || 'no limits'}`);
    }
    broadcast(true);
    return getStatus();
  });
  ipcMain.handle('guardian:set-process-name', (_event, name) => {
    const cleaned = String(name || '').trim();
    if (!/^[\w .()-]+$/.test(cleaned)) throw new Error('Enter a program name such as TradeTerminal.exe');
    config.processName = cleaned;
    saveConfig();
    broadcast(true);
    return getStatus();
  });
  ipcMain.handle('guardian:pick-region', (_event, key) => pickRegion(key));
  // The day's starting balance, corrected by hand — e.g. Guardian was
  // switched on after the day's first trades.
  ipcMain.handle('guardian:set-start-balance', (_event, { account, value } = {}) => {
    const name = String(account || '').trim();
    const amount = Number(value);
    if (!name || !Number.isFinite(amount) || amount <= 0) throw new Error('Enter the balance the day started at');
    const today = engine.zonedClock(new Date(), config.rules?.timeZone || engine.DEFAULT_CONFIG.timeZone).dateKey;
    const base = dayState && dayState.date === today ? dayState : engine.createDayState(today);
    dayState = engine.setStartBalance(base, name, amount);
    saveState();
    log(`${name} starting balance set by hand to ${amount.toFixed(2)}.`);
    broadcast(true);
    return getStatus();
  });
  ipcMain.handle('guardian:test-read', () => testRead());
  ipcMain.handle('guardian:run-test', (_event, name) => runTest(String(name || '')));
  // Triggers for a day, for Trade Desk to file under Playbook strategies.
  ipcMain.handle('guardian:get-triggers', (_event, dateKey) => {
    const key = /^\d{4}-\d{2}-\d{2}$/.test(String(dateKey || '')) ? String(dateKey) : triggerDate;
    if (!key) return [];
    if (key === triggerDate) return triggers;
    const stored = readJson(triggerFile(key), []);
    return Array.isArray(stored) ? stored : [];
  });
  ipcMain.handle('guardian:open-log', () => {
    if (!fs.existsSync(files.log)) fs.writeFileSync(files.log, '');
    return shell.openPath(files.log);
  });

  function clearLog() {
    try {
      fs.writeFileSync(files.log, '');
      if (fs.existsSync(`${files.log}.old`)) fs.unlinkSync(`${files.log}.old`);
      // The next reading is written in full, so the fresh log says where things stand.
      lastReadingKey = '';
    } catch { /* clearing must never stop the guardian */ }
  }
  const logClearTimer = setInterval(clearLog, LOG_CLEAR_MS);

  // Resume where the app left off: a lock set before a restart still holds.
  if (config.enabled) setEnabled(true);

  return {
    /**
     * True while quitting would lift protection: Guardian is on and today
     * is locked or past the warning level.
     */
    isProtecting() {
      if (!config.enabled || !dayState) return false;
      const today = engine.zonedClock(new Date(), config.rules?.timeZone || engine.DEFAULT_CONFIG.timeZone).dateKey;
      if (dayState.date !== today) return false;
      return Boolean(dayState.locked || dayState.warningMode);
    },
    protectionReason() {
      if (!dayState) return '';
      if (dayState.locked) return dayState.lockReason || 'Your session is locked for today.';
      if (dayState.warningMode) return 'You have reached your warning level.';
      return '';
    },
    dispose() {
      if (testRun) clearInterval(testRun);
      clearInterval(logClearTimer);
      clearTimeout(timer);
      worker.stop();
      for (const win of openAlerts.values()) if (!win.isDestroyed()) win.destroy();
    },
  };
}

module.exports = { registerGuardian, REGION_KEYS, REGION_PROMPTS };
