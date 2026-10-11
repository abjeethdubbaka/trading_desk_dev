/**
 * @file public/guardian/engine.cjs
 *
 * Trading Guardian's rules, as a pure state machine: given the day's state,
 * one reading of Trade Terminal's screen and the time, it returns the next
 * state and what the service should do — show an alert, or close the
 * terminal. A port of TradingGuardian's guardian.py, rule for rule, reading
 * Trade Terminal's header rather than a P&L box:
 *
 *   Daily P&L      = Balance − the balance the day started at
 *   Open-trade P&L = Projected balance − Balance
 *   Trades today   = Filled orders ÷ fills per trade (2: in and out)
 *
 *   Warning level  → three warnings, five minutes apart, and the next trade
 *                    becomes the one final trade of the session.
 *   Final trade    → if its open loss reaches the final-trade limit, an
 *                    alert to flatten. When it closes, the session locks,
 *                    win or lose, so there is never a second "last trade".
 *   Hard limit     → the session locks once flat; until then, flatten now.
 *   Max trades     → a warning before the last allowed trade; once it is
 *                    done and flat, the session locks.
 *   Locked         → Trade Terminal is closed, and closed again if reopened,
 *                    until the unlock time (4:30 PM Toronto by default).
 *   Stop time      → monitoring ends for the day (4:35 PM by default).
 *   Cooldown       → a trade opened within the cooldown after a losing
 *                    trade closes gets an alert: the revenge-trade check.
 *   Green day      → reaching the day's target says so once; giving back
 *                    too much of the day's peak warns, or locks once flat.
 *   Unreadable     → if the account or balance cannot be read for 30
 *                    seconds while Trade Terminal is open, say so: silence
 *                    would look like protection that is not there.
 *
 * A value must read the same several times running before anything acts on
 * it, so one misread digit can never close the terminal or set the day's
 * starting balance. Nothing is guessed: an unreadable account or balance
 * means no rule fires.
 *
 * Pure CommonJS module: no Electron, no filesystem, so it can be tested.
 */

const WARNING_INTERVAL_MS = 5 * 60 * 1000;
const WARNING_COUNT = 3;
const UNREADABLE_ALERT_MS = 30 * 1000;
const MAX_EVENTS = 200;
// An alert that keeps coming back while a position stays open is recorded
// once, and again only if it returns after this long.
const EVENT_REPEAT_MS = 10 * 60 * 1000;

const DEFAULT_CONFIG = {
  timeZone: 'America/Toronto',
  unlockTime: '16:30',
  stopTime: '16:35',
  confirmReads: 3,
  fillsPerTrade: 2,
  // 'lock' closes Trade Terminal once the max is reached and flat;
  // 'warn' only says so, for traders who scale in and out.
  maxTradesAction: 'lock',
  accounts: [],
};

// ── Parsing what was read ────────────────────────────────────────────────────

function normalizeAccountText(text) {
  return String(text || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
}

/**
 * The account on screen. With `limits` (Trade Desk's own settings), any
 * readable account number is the account, and the limits apply to it; the
 * number keeps each account's starting balance apart. Otherwise the
 * configured account whose match text appears in what was read.
 */
function resolveAccount(text, cfg) {
  if (cfg.limits) {
    const number = normalizeAccountText(text);
    // An account number has letters and digits; stray screen text does not.
    if (number.length < 4 || !/\d/.test(number)) return null;
    return { ...cfg.limits, match: number, label: number };
  }
  return matchAccount(text, cfg.accounts);
}

/** The configured account whose match text appears in what was read. */
function matchAccount(text, accounts = []) {
  const cleaned = normalizeAccountText(text);
  if (!cleaned) return null;
  return accounts.find((account) => {
    const match = normalizeAccountText(account?.match);
    return match && cleaned.includes(match);
  }) || null;
}

/** The last money amount in the text, e.g. "BALANCE 24,995.47 USD" → 24995.47. */
function parseMoney(text) {
  const s = String(text || '')
    .toUpperCase()
    .replace(/,/g, '')
    .replace(/\$/g, '')
    .replace(/USD/g, '')
    .replace(/[−–—]/g, '-')
    // Accounting style: (212.50) is a loss.
    .replace(/\((\d+(?:\.\d+)?)\)/g, '-$1');
  const values = s.match(/[-+]?\d+(?:\.\d{1,2})?/g);
  if (!values) return null;
  const value = Number(values[values.length - 1]);
  return Number.isFinite(value) ? value : null;
}

/** "Positions (2)" → 2, "Filled orders (10)" → 10; otherwise the last whole number. */
function parsePositions(text) {
  const s = String(text || '');
  const bracketed = s.match(/\((\d+)\)/);
  if (bracketed) return Number(bracketed[1]);
  const values = s.match(/\d+/g);
  if (!values) return null;
  const value = Number(values[values.length - 1]);
  return Number.isFinite(value) ? value : null;
}

const round2 = (value) => Math.round(value * 100) / 100;

// ── Time ─────────────────────────────────────────────────────────────────────

function toMinutes(hhmm) {
  const match = String(hhmm || '').match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return null;
  return Number(match[1]) * 60 + Number(match[2]);
}

/** The date and minute of the day in the configured time zone. */
function zonedClock(now, timeZone) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(now);
  const get = (type) => parts.find((part) => part.type === type)?.value;
  return {
    dateKey: `${get('year')}-${get('month')}-${get('day')}`,
    minutes: Number(get('hour')) * 60 + Number(get('minute')),
  };
}

// ── State ────────────────────────────────────────────────────────────────────

function createDayState(dateKey) {
  return {
    date: dateKey,
    warningMode: false,
    warningCount: 0,
    nextWarningAt: null,
    finalTradeStarted: false,
    finalLossWarningHit: false,
    locked: false,
    lockReason: '',
    account: null,
    triggerDailyPnl: null,
    // The balance each account started the day at, by account name:
    // { value, source: 'auto' | 'manual', at }.
    startBalances: {},
    tradesToday: null,
    lastTradeWarned: false,
    maxTradesWarned: false,
    unreadableSince: null,
    unreadableAlerted: false,
    // Green-day protection.
    peakDailyPnl: null,
    targetNotified: false,
    givebackWarned: false,
    // Cooldown after a losing trade, as a timestamp.
    cooldownUntil: null,
    // The day as it happened, for the journal: { at, key, text }.
    events: [],
    // Whether Guardian watched any of today's session: the end-of-day notice
    // is for a day it guarded, not for opening the app in the evening.
    watchedToday: false,
    finishedNotified: false,
  };
}

/** Per-run counters that are not worth persisting. */
function createRuntime() {
  return {
    hardCandidate: null,
    hardCount: 0,
    unrealCandidate: null,
    unrealCount: 0,
    startCandidate: null,
    startCount: 0,
    tradesCandidate: null,
    tradesCount: 0,
    givebackCandidate: null,
    givebackCount: 0,
    // The balance when the open position was opened, to tell a losing
    // trade from a winning one when it closes.
    balanceAtOpen: null,
    previousPositions: null,
  };
}

function isSessionActive(state) {
  return Boolean(state.locked || state.warningMode || state.finalTradeStarted || state.finalLossWarningHit);
}

function formatUsd(value) {
  return `${value < 0 ? '-' : ''}$${Math.abs(value).toFixed(2)}`;
}

function accountName(account) {
  return account.label || account.match;
}

function warningMessage(account, level) {
  return `${accountName(account)} has reached the daily warning level (${formatUsd(level)}).\n\n`
    + 'Take the NEXT trade ONLY if you have full confirmation.\n'
    + 'If there is no confirmation, DO NOT trade again and please exit.\n\n'
    + 'This is your FINAL trade for the session.';
}

function lockActions(state, reason, unlockTime) {
  if (state.locked) return [];
  state.locked = true;
  state.lockReason = reason;
  return [
    {
      type: 'alert',
      key: 'locked',
      severity: 'final',
      title: 'Session locked',
      message: `${reason}\n\nTrade Terminal will now close and stay blocked until ${unlockTime}.`,
    },
    { type: 'close' },
    { type: 'log', message: `Session locked: ${reason}` },
  ];
}

/** Counts one more identical read; true once it has repeated enough. */
function confirm(runtime, key, value, needed) {
  const countKey = `${key}Count`;
  const candidateKey = `${key}Candidate`;
  runtime[countKey] = value === runtime[candidateKey] ? runtime[countKey] + 1 : 1;
  runtime[candidateKey] = value;
  return runtime[countKey] >= needed;
}

/** Sets an account's starting balance by hand, e.g. Guardian started after trading. */
function setStartBalance(state, account, value, now = new Date()) {
  const amount = Number(value);
  if (!state || !account || !Number.isFinite(amount)) return state;
  return {
    ...state,
    startBalances: {
      ...(state.startBalances || {}),
      [account]: { value: round2(amount), source: 'manual', at: now.toISOString() },
    },
  };
}

/**
 * What the service should read on this tick, decided before the screen is
 * read so OCR only runs when a rule could act on it.
 */
function planTick({ state, config, now = new Date() }) {
  const cfg = { ...DEFAULT_CONFIG, ...config };
  const clock = zonedClock(now, cfg.timeZone);
  const sameDay = state && state.date === clock.dateKey;
  const locked = sameDay && state.locked;
  const stopMinutes = toMinutes(cfg.stopTime);
  const unlockMinutes = toMinutes(cfg.unlockTime);

  if (stopMinutes != null && clock.minutes >= stopMinutes) return { phase: 'finished', read: false };
  if (unlockMinutes != null && clock.minutes >= unlockMinutes) return { phase: 'unlocked', read: false };
  if (locked) return { phase: 'locked', read: false };
  return { phase: 'monitoring', read: true };
}

/**
 * One tick. `reading` is what the screen showed, already parsed:
 *   { running, accountText, balance, projectedBalance, positions, filledOrders }
 * Returns { state, runtime, actions, phase, account, computed }.
 */
function step({ state: previousState, runtime: previousRuntime, config, reading = {}, now = new Date() }) {
  const cfg = { ...DEFAULT_CONFIG, ...config };
  const clock = zonedClock(now, cfg.timeZone);
  const nowMs = now.getTime();
  const actions = [];
  const runtime = { ...createRuntime(), ...previousRuntime };
  let state = previousState && previousState.date === clock.dateKey
    ? { ...createDayState(clock.dateKey), ...previousState }
    : createDayState(clock.dateKey);

  const confirmReads = Math.max(1, Number(cfg.confirmReads) || 1);
  const fillsPerTrade = Math.max(1, Number(cfg.fillsPerTrade) || 2);
  const stopMinutes = toMinutes(cfg.stopTime);
  const unlockMinutes = toMinutes(cfg.unlockTime);
  let computed = null;
  const result = (phase, account = null) => {
    // Every alert, and the moments marked as worth keeping, become the
    // day's timeline. Repeats of the same alert while it is open do not.
    const at = now.toISOString();
    const fresh = actions
      .filter((action) => (action.type === 'alert' && action.key !== 'finished') || action.event)
      .map((action) => ({ at, key: action.key || action.event, text: action.type === 'alert' ? action.title : action.message }));
    if (fresh.length > 0) {
      const events = Array.isArray(state.events) ? state.events : [];
      const lastAt = new Map(events.map((event) => [event.key, Date.parse(event.at)]));
      const deduped = fresh.filter((event) => {
        const previous = lastAt.get(event.key);
        return previous == null || nowMs - previous >= EVENT_REPEAT_MS;
      });
      state.events = [...events, ...deduped].slice(-MAX_EVENTS);
    }
    return { state, runtime, actions, phase, account, computed };
  };

  // Stop time: the day is over. Clear any session and say so once.
  if (stopMinutes != null && clock.minutes >= stopMinutes) {
    if (isSessionActive(state)) {
      state = { ...createDayState(clock.dateKey), watchedToday: state.watchedToday, finishedNotified: state.finishedNotified };
    }
    if (state.watchedToday && !state.finishedNotified) {
      state.finishedNotified = true;
      actions.push({
        type: 'alert',
        key: 'finished',
        severity: 'info',
        title: 'Guardian finished for today',
        message: `Trade Terminal has been unlocked since ${cfg.unlockTime}. Guardian stops watching until tomorrow.`,
      });
      actions.push({ type: 'log', message: 'Stop time reached. Guardian finished for the day.' });
    }
    return result('finished');
  }

  // Unlock time: rules stop; Trade Terminal may be opened for review.
  if (unlockMinutes != null && clock.minutes >= unlockMinutes) {
    if (isSessionActive(state)) {
      state = { ...createDayState(clock.dateKey), watchedToday: true, startBalances: state.startBalances };
      actions.push({ type: 'log', message: `${cfg.unlockTime} reached. Session cleared; Trade Terminal allowed for review.` });
    }
    return result('unlocked');
  }

  state.watchedToday = true;

  // Locked: a reopened terminal is closed again.
  if (state.locked) {
    if (reading.running) actions.push({ type: 'close' });
    return result('locked');
  }

  if (!reading.running) {
    runtime.previousPositions = null;
    state.unreadableSince = null;
    return result('waiting');
  }

  const account = resolveAccount(reading.accountText, cfg);
  const balance = typeof reading.balance === 'number' ? reading.balance : null;
  const projectedBalance = typeof reading.projectedBalance === 'number' ? reading.projectedBalance : null;
  const positions = typeof reading.positions === 'number' ? reading.positions : null;
  const filledOrders = typeof reading.filledOrders === 'number' ? reading.filledOrders : null;

  // Never guess the account or the balance — but never go quiet about it.
  if (!account || balance == null) {
    runtime.previousPositions = positions;
    if (state.unreadableSince == null) {
      state.unreadableSince = nowMs;
    } else if (!state.unreadableAlerted && nowMs - state.unreadableSince >= UNREADABLE_ALERT_MS) {
      state.unreadableAlerted = true;
      const missing = [!account && 'which account is open', balance == null && 'the balance'].filter(Boolean).join(' or ');
      actions.push({
        type: 'alert',
        key: 'unreadable',
        severity: 'final',
        title: "Guardian can't read Trade Terminal",
        message: `For the last ${UNREADABLE_ALERT_MS / 1000} seconds Guardian could not read ${missing}.\n\n`
          + 'YOU ARE NOT PROTECTED until it can. Make sure Trade Terminal is maximized and nothing covers its header, '
          + 'or redo the screen regions in Trade Desk → Settings → Guardian.',
      });
      actions.push({ type: 'log', message: `Unreadable for ${UNREADABLE_ALERT_MS / 1000}s: ${missing}.` });
    }
    return result('unreadable', account);
  }
  if (state.unreadableAlerted) actions.push({ type: 'log', message: 'Trade Terminal readable again.' });
  state.unreadableSince = null;
  state.unreadableAlerted = false;

  const name = accountName(account);
  state.account = name;

  // The day's starting balance: set by hand, or the first balance that
  // reads the same several times running.
  const start = state.startBalances?.[name];
  if (!start) {
    if (confirm(runtime, 'start', `${name}|${balance.toFixed(2)}`, confirmReads)) {
      state.startBalances = { ...state.startBalances, [name]: { value: round2(balance), source: 'auto', at: now.toISOString() } };
      actions.push({ type: 'log', event: 'day_start', message: `${name} day started at ${formatUsd(balance)}.` });
    } else {
      runtime.previousPositions = positions;
      return result('starting', account);
    }
  }
  const startBalance = state.startBalances[name].value;
  const dailyPnl = round2(balance - startBalance);
  const unrealizedPnl = positions === 0
    ? 0
    : positions != null && projectedBalance != null ? round2(projectedBalance - balance) : null;
  const trades = filledOrders != null ? Math.floor(filledOrders / fillsPerTrade) : null;
  if (trades != null) state.tradesToday = trades;
  computed = { startBalance, dailyPnl, unrealizedPnl, trades, balance, projectedBalance, peakDailyPnl: null };

  const warningLevel = -Math.abs(Number(account.warning) || 0);
  const hardLevel = -Math.abs(Number(account.hard) || 0);
  const finalTradeLevel = -Math.abs(Number(account.finalTradeLoss) || 0);
  const maxTrades = Math.max(0, Math.floor(Number(account.maxTrades) || 0));
  const cooldownMs = Math.max(0, Number(account.cooldownMinutes) || 0) * 60 * 1000;
  const dailyTarget = Math.max(0, Number(account.dailyTarget) || 0);
  const protectFrom = Math.max(0, Number(account.gainProtectFrom) || 0);
  const givebackShare = Math.min(1, Math.max(0, (Number(account.givebackPercent) || 0) / 100));
  const opened = runtime.previousPositions === 0 && positions != null && positions > 0;
  const closed = runtime.previousPositions != null && runtime.previousPositions > 0 && positions === 0;

  // Cooldown: a position opened too soon after a losing trade.
  if (opened) {
    if (cooldownMs > 0 && state.cooldownUntil != null && nowMs < state.cooldownUntil) {
      const minutesLeft = Math.ceil((state.cooldownUntil - nowMs) / 60000);
      actions.push({
        type: 'alert',
        key: `cooldown_${state.cooldownUntil}`,
        severity: 'warning',
        title: 'Inside your cooldown',
        message: `You opened a trade ${minutesLeft} minute${minutesLeft === 1 ? '' : 's'} before your cooldown after a loss ended.\n\n`
          + 'Is this your setup, or the last trade talking? If it is not an A setup, close it.',
      });
    }
    runtime.balanceAtOpen = balance;
  }
  if (closed) {
    if (runtime.balanceAtOpen != null && balance < runtime.balanceAtOpen - 0.005) {
      const loss = round2(balance - runtime.balanceAtOpen);
      if (cooldownMs > 0) {
        state.cooldownUntil = nowMs + cooldownMs;
        actions.push({ type: 'log', event: 'cooldown', message: `Losing trade ${formatUsd(loss)}. Cooldown ${cooldownMs / 60000} min.` });
      } else {
        actions.push({ type: 'log', event: 'loss', message: `Losing trade ${formatUsd(loss)}.` });
      }
    }
    runtime.balanceAtOpen = null;
  }

  // Green day: the target, and how much of the day's best is given back.
  state.peakDailyPnl = state.peakDailyPnl == null ? dailyPnl : Math.max(state.peakDailyPnl, dailyPnl);
  if (dailyTarget > 0 && dailyPnl >= dailyTarget && !state.targetNotified) {
    state.targetNotified = true;
    actions.push({
      type: 'alert',
      key: 'target',
      severity: 'info',
      title: 'Daily target reached',
      message: `You are up ${formatUsd(dailyPnl)} against a ${formatUsd(dailyTarget)} target.\n\nA good day is one you keep. Consider stopping here.`,
    });
  }
  const peak = state.peakDailyPnl;
  computed.peakDailyPnl = peak;
  if (givebackShare > 0 && protectFrom > 0 && peak >= protectFrom && dailyPnl <= round2(peak * (1 - givebackShare))) {
    if (confirm(runtime, 'giveback', dailyPnl.toFixed(2), confirmReads)) {
      const given = Math.round((1 - dailyPnl / peak) * 100);
      const reason = `Gave back ${given}% of today's peak (${formatUsd(peak)} → ${formatUsd(dailyPnl)}).`;
      if (account.givebackAction === 'lock') {
        if (positions === 0) {
          actions.push(...lockActions(state, reason, cfg.unlockTime));
        } else if (positions != null) {
          actions.push({
            type: 'alert',
            key: 'giveback_position_open',
            severity: 'final',
            title: 'Protect the green day',
            message: `${reason}\n\nClose the open trade. Trade Terminal will close once Positions = 0.`,
          });
        }
      } else if (!state.givebackWarned) {
        state.givebackWarned = true;
        actions.push({
          type: 'alert',
          key: 'giveback',
          severity: 'warning',
          title: 'Protect the green day',
          message: `${reason}\n\nStop here and keep what is left.`,
        });
      }
      runtime.givebackCount = 0;
      runtime.givebackCandidate = null;
    }
  } else {
    runtime.givebackCount = 0;
    runtime.givebackCandidate = null;
  }

  // Hard daily limit.
  if (hardLevel < 0 && dailyPnl <= hardLevel) {
    if (confirm(runtime, 'hard', `${name}|${dailyPnl.toFixed(2)}`, confirmReads)) {
      if (positions === 0) {
        actions.push(...lockActions(state, `Daily hard-loss limit reached: ${formatUsd(dailyPnl)}.`, cfg.unlockTime));
      } else {
        actions.push({
          type: 'alert',
          key: 'hard_position_open',
          severity: 'final',
          title: 'Hard limit reached',
          message: `Daily hard-loss limit reached (${formatUsd(dailyPnl)}), but a position is still open.\n\n`
            + 'FLATTEN THE POSITION NOW.\n\nTrade Terminal will close only once Positions = 0.',
        });
      }
      runtime.hardCount = 0;
      runtime.hardCandidate = null;
    }
  } else {
    runtime.hardCount = 0;
    runtime.hardCandidate = null;
  }

  // Max trades for the day.
  if (maxTrades > 0 && trades != null && confirm(runtime, 'trades', `${name}|${filledOrders}`, confirmReads)) {
    if (trades >= maxTrades && cfg.maxTradesAction === 'warn') {
      if (!state.maxTradesWarned) {
        state.maxTradesWarned = true;
        actions.push({
          type: 'alert',
          key: 'max_trades_reached',
          severity: 'final',
          title: 'Max trades reached',
          message: `${trades} of ${maxTrades} trades done today.

That is your limit. STOP TRADING for today.`,
        });
        actions.push({ type: 'log', message: `Max trades reached (warn only): ${trades} of ${maxTrades}.` });
      }
    } else if (trades >= maxTrades) {
      if (positions === 0) {
        actions.push(...lockActions(state, `Max trades reached: ${trades} of ${maxTrades} for today.`, cfg.unlockTime));
      } else if (positions != null) {
        actions.push({
          type: 'alert',
          key: 'max_trades_position_open',
          severity: 'final',
          title: 'Past your max trades',
          message: `You have done ${trades} of ${maxTrades} trades today and have another position open.\n\n`
            + 'FLATTEN IT NOW.\n\nTrade Terminal will close once Positions = 0.',
        });
      }
    } else if (trades === maxTrades - 1 && positions === 0 && !state.lastTradeWarned) {
      state.lastTradeWarned = true;
      actions.push({
        type: 'alert',
        key: 'last_trade',
        severity: 'warning',
        title: 'One trade left today',
        message: `${trades} of ${maxTrades} trades done.\n\nYour NEXT trade is your LAST for today. Take it only with full confirmation.`,
      });
      actions.push({ type: 'log', message: `Last-trade warning at ${trades} of ${maxTrades}.` });
    }
  }

  // Warning level: three warnings, five minutes apart.
  if (warningLevel < 0 && dailyPnl <= warningLevel && !state.warningMode) {
    state.warningMode = true;
    state.triggerDailyPnl = dailyPnl;
    state.warningCount = 1;
    state.nextWarningAt = nowMs + WARNING_INTERVAL_MS;
    actions.push({
      type: 'alert',
      key: 'daily_warning_1',
      severity: 'warning',
      title: `Warning 1 of ${WARNING_COUNT}`,
      message: warningMessage(account, warningLevel),
    });
    actions.push({ type: 'log', message: `Warning 1/${WARNING_COUNT} for ${name} at ${formatUsd(dailyPnl)}.` });
  } else if (state.warningMode && state.warningCount < WARNING_COUNT && state.nextWarningAt != null && nowMs >= state.nextWarningAt) {
    state.warningCount += 1;
    state.nextWarningAt = state.warningCount < WARNING_COUNT ? nowMs + WARNING_INTERVAL_MS : null;
    actions.push({
      type: 'alert',
      key: `daily_warning_${state.warningCount}`,
      severity: 'warning',
      title: `Warning ${state.warningCount} of ${WARNING_COUNT}`,
      message: warningMessage(account, warningLevel),
    });
    actions.push({ type: 'log', message: `Warning ${state.warningCount}/${WARNING_COUNT} shown.` });
  }

  // The one final trade: the first position opened after the warning.
  if (state.warningMode && !state.finalTradeStarted && runtime.previousPositions === 0 && positions != null && positions > 0) {
    state.finalTradeStarted = true;
    actions.push({ type: 'log', event: 'final_trade', message: 'Final trade opened. No more trades once it closes.' });
  }

  // The final trade's open loss.
  if (state.warningMode && state.finalTradeStarted && positions != null && positions > 0 && unrealizedPnl != null && finalTradeLevel < 0) {
    if (unrealizedPnl <= finalTradeLevel) {
      if (confirm(runtime, 'unreal', unrealizedPnl.toFixed(2), confirmReads) && !state.finalLossWarningHit) {
        state.finalLossWarningHit = true;
        actions.push({
          type: 'alert',
          key: 'final_loss_warning',
          severity: 'final',
          title: 'FINAL LOSS WARNING',
          message: `Your open trade is at about ${formatUsd(unrealizedPnl)}.\n\n`
            + `The most this final trade may lose is ${formatUsd(finalTradeLevel)}.\n`
            + 'EXIT / FLATTEN THE POSITION NOW.\n\n'
            + `Once Positions is 0, Trade Terminal will close and stay blocked until ${cfg.unlockTime}.`,
        });
        actions.push({ type: 'log', message: `Final-trade open loss reached ${formatUsd(unrealizedPnl)}.` });
        runtime.unrealCount = 0;
        runtime.unrealCandidate = null;
      }
    } else {
      runtime.unrealCount = 0;
      runtime.unrealCandidate = null;
    }
  }

  // The final trade has closed: the session ends, win or lose.
  if (state.warningMode && state.finalTradeStarted && runtime.previousPositions != null && runtime.previousPositions > 0 && positions === 0) {
    actions.push(...lockActions(state, 'Your one final trade after the warning level has ended.', cfg.unlockTime));
  }

  runtime.previousPositions = positions;
  return result(state.locked ? 'locked' : state.warningMode ? 'warning' : 'monitoring', account);
}

module.exports = {
  DEFAULT_CONFIG,
  WARNING_INTERVAL_MS,
  WARNING_COUNT,
  UNREADABLE_ALERT_MS,
  matchAccount,
  resolveAccount,
  parseMoney,
  parsePositions,
  toMinutes,
  zonedClock,
  createDayState,
  createRuntime,
  setStartBalance,
  planTick,
  step,
};
