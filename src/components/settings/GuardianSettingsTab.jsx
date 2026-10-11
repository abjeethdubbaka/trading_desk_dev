import React, { useEffect, useState } from 'react';
import { Check, Crosshair, FileText, Loader2, Pencil, ScanText, ShieldCheck, X } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useSettings } from '@/lib/context/SettingsContext';
import { useGuardian, describeGuardianPhase } from '@/lib/hooks/useGuardian';
import {
  getGuardianProtection,
  getGuardianTimes,
  getGuardianTradeRules,
} from '@/lib/guardian/rules';
import { useGuardianLimits } from '@/lib/hooks/useGuardianLimits';
import GuardianControl from '@/components/guardian/GuardianControl';

// All in Trade Terminal's header and tab bar, which stay put in the window.
const REGIONS = [
  { key: 'account', label: 'Account number', hint: 'Under ACCOUNT, e.g. MAX2532704' },
  { key: 'balance', label: 'Balance', hint: 'Realized: daily P&L is this minus the day’s start' },
  { key: 'projectedBalance', label: 'Projected balance', hint: 'Includes the open trade: open P&L is this minus Balance' },
  { key: 'positions', label: 'Positions tab', hint: 'The label, e.g. Positions (0)' },
  { key: 'filledOrders', label: 'Filled orders tab', hint: 'The label, e.g. Filled orders (10)' },
  { key: 'alerts', label: 'Alerts list (optional)', hint: 'Every row of Trade Terminal’s alerts, filed under Playbook strategies', optional: true },
];

const money = (n) => (n == null ? '—' : `${n < 0 ? '-' : ''}$${Math.abs(n).toFixed(2)}`);

function Section({ title, description, children, action }) {
  return (
    <section className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-white">{title}</h3>
          {description && <p className="mt-1 max-w-xl text-xs text-white/45">{description}</p>}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

function Stat({ label, value, tone }) {
  return (
    <div className="rounded-lg border border-white/[0.07] bg-white/[0.03] px-3 py-2">
      <p className="text-[10px] uppercase tracking-widest text-white/35">{label}</p>
      <p className={cn('mt-0.5 font-mono text-sm font-semibold', tone || 'text-white/85')}>{value}</p>
    </div>
  );
}

/**
 * The limits Guardian holds the day to, read from the Account and Defaults
 * tabs. Shown here, not edited here: one number, one place.
 */
function LimitsPanel() {
  const { limits } = useGuardianLimits();
  const rows = [
    {
      label: 'Hard limit',
      value: limits.hard ? `-$${limits.hard.toLocaleString()}` : 'Not set',
      source: `Today's max daily loss · Account tab (${limits.tierLabel})`,
      tone: 'text-rose-300',
    },
    {
      label: 'Warning level',
      value: limits.hard ? `-$${limits.warning.toLocaleString()}` : '—',
      source: 'Hard limit less one trade’s risk',
      tone: 'text-amber-300',
    },
    {
      label: 'Final trade may lose',
      value: limits.finalTradeLoss ? `-$${limits.finalTradeLoss.toLocaleString()}` : '—',
      source: 'Risk amount · half of today’s max daily loss',
      tone: 'text-amber-200',
    },
    {
      label: 'Max trades',
      value: limits.maxTrades ? `${limits.maxTrades} a day` : 'Off',
      source: 'Max trades per day · Defaults tab',
      tone: 'text-white/85',
    },
    {
      label: 'Daily target',
      value: limits.dailyTarget ? `+$${limits.dailyTarget.toLocaleString()}` : 'None today',
      source: 'Today’s daily target · Account tab',
      tone: 'text-emerald-300',
    },
    {
      label: 'Green day protected from',
      value: limits.gainProtectFrom ? `+$${limits.gainProtectFrom.toLocaleString()}` : '—',
      source: `One trade’s risk up, then ${limits.givebackPercent}% given back ${limits.givebackAction === 'lock' ? 'locks' : 'warns'}`,
      tone: 'text-emerald-200',
    },
  ];

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {rows.map((row) => (
          <div key={row.label} className="rounded-lg border border-white/[0.07] bg-white/[0.03] px-3 py-2.5">
            <div className="flex items-baseline justify-between gap-2">
              <p className="text-[10px] uppercase tracking-widest text-white/40">{row.label}</p>
              <p className={cn('font-mono text-sm font-semibold', row.tone)}>{row.value}</p>
            </div>
            <p className="mt-1 text-[11px] text-white/35">{row.source}</p>
          </div>
        ))}
      </div>
      {limits.tightened && (
        <p className="rounded-lg border border-rose-400/25 bg-rose-500/10 px-3 py-2 text-xs text-rose-100/90">
          Tightened for today ({limits.tightenReason}): warning at half the loss, max trades halved, cooldown doubled.
        </p>
      )}
      {!limits.hard && (
        <p className="text-xs text-amber-300">Set a max daily loss for this tier on the Account tab. Guardian has no limits to hold until then.</p>
      )}
    </div>
  );
}

function TimesEditor({ settings, saveImmediately }) {
  const times = getGuardianTimes(settings);
  const [draft, setDraft] = useState(times);
  useEffect(() => { setDraft(getGuardianTimes(settings)); }, [settings]);

  const save = async (field, key) => {
    const value = String(draft[key] || '').trim();
    if (key !== 'timeZone' && !/^\d{1,2}:\d{2}$/.test(value)) {
      toast.error('Use 24-hour time, e.g. 16:30');
      setDraft(times);
      return;
    }
    try {
      new Intl.DateTimeFormat('en-CA', { timeZone: key === 'timeZone' ? value : times.timeZone });
    } catch {
      toast.error('Unknown time zone, e.g. America/Toronto');
      setDraft(times);
      return;
    }
    try {
      await saveImmediately({ [field]: value });
    } catch (error) {
      toast.error(`Could not save: ${error?.message || 'Unknown error'}`);
    }
  };

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
      {[
        ['guardian_unlock_time', 'unlockTime', 'Unlock time', 'Lock lifts; Trade Terminal allowed for review'],
        ['guardian_stop_time', 'stopTime', 'Stop time', 'Guardian finishes for the day'],
        ['guardian_time_zone', 'timeZone', 'Time zone', 'Times are in this zone'],
      ].map(([field, key, label, hint]) => (
        <label key={key} className="space-y-1">
          <span className="text-[10px] uppercase tracking-widest text-white/40">{label}</span>
          <Input
            value={draft[key]}
            onChange={(e) => setDraft((prev) => ({ ...prev, [key]: e.target.value }))}
            onBlur={() => save(field, key)}
            className="h-9 font-mono"
          />
          <span className="block text-[10px] text-white/30">{hint}</span>
        </label>
      ))}
    </div>
  );
}

/**
 * The balance the day started at. Guardian records it on its own; this is
 * for when it was switched on after the day's first trades.
 */
function StartBalance({ account, start, onSave }) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState('');

  if (!account) return <Stat label="Day started at" value="—" />;

  const save = async () => {
    try {
      await onSave(account, value);
      setEditing(false);
      toast.success(`${account} starting balance saved`);
    } catch (error) {
      toast.error(error?.message || 'Could not save');
    }
  };

  return (
    <div className="rounded-lg border border-white/[0.07] bg-white/[0.03] px-3 py-2">
      <p className="text-[10px] uppercase tracking-widest text-white/35">
        Day started at{start?.source === 'manual' ? ' · set by hand' : ''}
      </p>
      {editing ? (
        <div className="mt-0.5 flex items-center gap-1">
          <Input
            autoFocus
            type="number"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') save(); if (e.key === 'Escape') setEditing(false); }}
            className="h-7 px-2 font-mono text-sm"
          />
          <button type="button" onClick={save} className="rounded p-1 text-emerald-300 hover:bg-white/10" aria-label="Save"><Check className="h-3.5 w-3.5" /></button>
          <button type="button" onClick={() => setEditing(false)} className="rounded p-1 text-white/40 hover:bg-white/10" aria-label="Cancel"><X className="h-3.5 w-3.5" /></button>
        </div>
      ) : (
        <div className="mt-0.5 flex items-center gap-1.5">
          <p className="font-mono text-sm font-semibold text-white/85">{start ? money(start.value) : 'Reading…'}</p>
          <button
            type="button"
            onClick={() => { setValue(start?.value ?? ''); setEditing(true); }}
            className="rounded p-0.5 text-white/35 hover:bg-white/10 hover:text-white/75"
            title="Correct the starting balance, e.g. Guardian was switched on after trading"
          >
            <Pencil className="h-3 w-3" />
          </button>
        </div>
      )}
    </div>
  );
}

function TradeCountEditor({ settings, saveImmediately }) {
  const rules = getGuardianTradeRules(settings);
  const [fills, setFills] = useState(String(rules.fillsPerTrade));
  useEffect(() => { setFills(String(getGuardianTradeRules(settings).fillsPerTrade)); }, [settings]);

  const save = async (patch) => {
    try {
      await saveImmediately(patch);
    } catch (error) {
      toast.error(`Could not save: ${error?.message || 'Unknown error'}`);
    }
  };

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      <label className="space-y-1">
        <span className="text-[10px] uppercase tracking-widest text-white/40">Fills per trade</span>
        <Input
          type="number"
          min="1"
          value={fills}
          onChange={(e) => setFills(e.target.value)}
          onBlur={() => {
            const n = Math.floor(Number(fills));
            if (!(n >= 1)) { setFills(String(rules.fillsPerTrade)); return; }
            save({ guardian_fills_per_trade: n });
          }}
          className="h-9 font-mono"
        />
        <span className="block text-[10px] text-white/30">Trades = filled orders ÷ this. 2 is one fill in and one out.</span>
      </label>
      <div className="space-y-1">
        <span className="text-[10px] uppercase tracking-widest text-white/40">At max trades</span>
        <div className="flex gap-1.5">
          {[['lock', 'Lock the session'], ['warn', 'Warn only']].map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => save({ guardian_max_trades_action: value })}
              className={cn(
                'h-9 flex-1 rounded-lg border px-3 text-xs font-medium transition-colors',
                rules.maxTradesAction === value
                  ? 'border-cyan-400/40 bg-cyan-500/15 text-cyan-100'
                  : 'border-white/10 bg-white/[0.03] text-white/55 hover:text-white/80',
              )}
            >
              {label}
            </button>
          ))}
        </div>
        <span className="block text-[10px] text-white/30">Scaling in or out adds fills, so the count runs high. Choose warn only if you scale.</span>
      </div>
    </div>
  );
}

/** Cooldown, green-day protection and Morning Brief tightening: Guardian-only settings. */
function ProtectionEditor({ settings, saveImmediately }) {
  const protection = getGuardianProtection(settings);
  const [cooldown, setCooldown] = useState(String(protection.cooldownMinutes));
  const [giveback, setGiveback] = useState(String(protection.givebackPercent));
  useEffect(() => {
    const next = getGuardianProtection(settings);
    setCooldown(String(next.cooldownMinutes));
    setGiveback(String(next.givebackPercent));
  }, [settings]);

  const save = async (patch) => {
    try {
      await saveImmediately(patch);
    } catch (error) {
      toast.error(`Could not save: ${error?.message || 'Unknown error'}`);
    }
  };
  const number = (value, fallback, max = Infinity) => {
    const n = Number(value);
    return Number.isFinite(n) && n >= 0 ? Math.min(max, n) : fallback;
  };
  const Choice = ({ field, value, current, children }) => (
    <button
      type="button"
      onClick={() => save({ [field]: value })}
      className={cn(
        'h-9 flex-1 rounded-lg border px-3 text-xs font-medium transition-colors',
        current === value ? 'border-cyan-400/40 bg-cyan-500/15 text-cyan-100' : 'border-white/10 bg-white/[0.03] text-white/55 hover:text-white/80',
      )}
    >
      {children}
    </button>
  );

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <label className="space-y-1">
        <span className="text-[10px] uppercase tracking-widest text-white/40">Cooldown after a loss (minutes)</span>
        <Input
          type="number"
          min="0"
          value={cooldown}
          onChange={(e) => setCooldown(e.target.value)}
          onBlur={() => save({ guardian_cooldown_minutes: number(cooldown, protection.cooldownMinutes, 120) })}
          className="h-9 font-mono"
        />
        <span className="block text-[10px] text-white/30">Opening a trade this soon after a losing one raises an alert. 0 turns it off.</span>
      </label>
      <label className="space-y-1">
        <span className="text-[10px] uppercase tracking-widest text-white/40">Green day: give back at most (%)</span>
        <Input
          type="number"
          min="0"
          max="100"
          value={giveback}
          onChange={(e) => setGiveback(e.target.value)}
          onBlur={() => save({ guardian_giveback_percent: number(giveback, protection.givebackPercent, 100) })}
          className="h-9 font-mono"
        />
        <span className="block text-[10px] text-white/30">Of the day’s peak, once up one trade’s risk. 0 turns it off.</span>
      </label>
      <div className="space-y-1">
        <span className="text-[10px] uppercase tracking-widest text-white/40">When too much is given back</span>
        <div className="flex gap-1.5">
          <Choice field="guardian_giveback_action" value="warn" current={protection.givebackAction}>Warn</Choice>
          <Choice field="guardian_giveback_action" value="lock" current={protection.givebackAction}>Lock the session</Choice>
        </div>
      </div>
      <div className="space-y-1">
        <span className="text-[10px] uppercase tracking-widest text-white/40">Low Morning Brief score (under 5)</span>
        <div className="flex gap-1.5">
          <Choice field="guardian_tighten_low_score" value={true} current={protection.tightenOnLowScore}>Tighten the day</Choice>
          <Choice field="guardian_tighten_low_score" value={false} current={protection.tightenOnLowScore}>No change</Choice>
        </div>
        <span className="block text-[10px] text-white/30">Warning at half the loss, max trades halved, cooldown doubled.</span>
      </div>
    </div>
  );
}

const TESTS = [
  { key: 'warning', label: 'Warning → final trade → lock' },
  { key: 'finalLoss', label: 'Final trade loss warning' },
  { key: 'hard', label: 'Hard limit' },
  { key: 'maxTrades', label: 'Max trades' },
  { key: 'cooldown', label: 'Cooldown after a loss' },
  { key: 'greenDay', label: 'Green day given back' },
  { key: 'unreadable', label: 'Screen unreadable' },
];

/** Plays a scenario through the real rules, alerts and all, without touching Trade Terminal. */
function TestModePanel({ guardian, running }) {
  const run = async (key) => {
    try {
      await guardian.runTest(key);
      toast.message('Test running. Alerts will appear over the next few seconds.');
    } catch (error) {
      toast.error(error?.message || 'Could not start the test');
    }
  };

  return (
    <div className="flex flex-wrap gap-2">
      {TESTS.map((test) => (
        <Button key={test.key} type="button" variant="outline" size="sm" className="h-8 text-xs" disabled={running} onClick={() => run(test.key)}>
          {test.label}
        </Button>
      ))}
      {running && <span className="flex items-center gap-1.5 text-xs text-cyan-200"><Loader2 className="h-3.5 w-3.5 animate-spin" /> Test running…</span>}
    </div>
  );
}

/**
 * Trading Guardian: watches Trade Terminal's screen during the session and
 * holds the day to its loss rules — three warnings, one final trade, and a
 * locked terminal once the session is over.
 */
export default function GuardianSettingsTab() {
  const { settings, saveImmediately } = useSettings();
  const guardian = useGuardian();
  const { status } = guardian;
  const [picking, setPicking] = useState(null);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [processName, setProcessName] = useState('');

  useEffect(() => { if (status?.processName) setProcessName(status.processName); }, [status?.processName]);

  if (guardian.needsRestart) {
    return <p className="rounded-xl border border-amber-400/25 bg-amber-500/10 p-4 text-sm text-amber-100">Restart TradeDesk to finish installing Trading Guardian. It was added after this session started.</p>;
  }
  if (!guardian.isAvailable || (status && !status.supported)) {
    return <p className="rounded-xl border border-white/10 bg-white/[0.02] p-4 text-sm text-white/55">Trading Guardian reads Trade Terminal’s screen, which only the Windows desktop app can do. Open TradeDesk as the installed app to use it.</p>;
  }

  const phase = describeGuardianPhase(status);
  const reading = status?.reading;
  const day = status?.day || {};
  const activeMaxTrades = status?.rules?.limits?.maxTrades || 0;

  const pick = async (key) => {
    setPicking(key);
    try {
      const region = await guardian.pickRegion(key);
      if (region) toast.success('Region saved');
    } catch (error) {
      toast.error(error?.message || 'Could not select the region');
    } finally {
      setPicking(null);
    }
  };

  const runTest = async () => {
    setTesting(true);
    try {
      setTestResult(await guardian.testRead());
    } catch (error) {
      toast.error(error?.message || 'Test read failed');
    } finally {
      setTesting(false);
    }
  };

  const saveProcessName = async () => {
    if (processName === status?.processName) return;
    try {
      await guardian.setProcessName(processName);
      toast.success('Program name saved');
    } catch (error) {
      toast.error(error?.message || 'Could not save');
      setProcessName(status?.processName || '');
    }
  };

  return (
    <div className="space-y-5">
      <Section
        title="Trading Guardian"
        description="Watches Trade Terminal while you trade. At the warning level you get three warnings, five minutes apart, and one final trade. When that trade closes, or the hard limit is hit, Trade Terminal is closed the normal way and kept closed until the unlock time. It is never force-closed, and never closed with a position open."
        action={<GuardianControl />}
      >
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <Stat label="Status" value={phase.label} />
          <Stat label="Account" value={reading?.account || (reading?.running === false ? 'Terminal closed' : '—')} />
          <Stat label="Balance" value={money(reading?.balance)} />
          <StartBalance
            account={reading?.account || day.account}
            start={day.startBalances?.[reading?.account || day.account]}
            onSave={guardian.setStartBalance}
          />
          <Stat label="Daily P&L" value={money(reading?.dailyPnl)} tone={reading?.dailyPnl < 0 ? 'text-rose-300' : 'text-emerald-300'} />
          <Stat label="Open trade" value={reading?.positions ? money(reading?.unrealizedPnl) : 'Flat'} tone={reading?.unrealizedPnl < 0 ? 'text-rose-300' : undefined} />
          <Stat label="Trades today" value={reading?.trades != null ? `${reading.trades}${activeMaxTrades ? ` / ${activeMaxTrades}` : ''}` : '—'} tone={activeMaxTrades && reading?.trades >= activeMaxTrades ? 'text-rose-300' : undefined} />
          <Stat
            label="Session"
            value={day.locked ? 'Locked' : day.finalTradeStarted ? 'Final trade' : day.warningMode ? `Warning ${day.warningCount}/3` : 'Open'}
            tone={day.locked ? 'text-rose-300' : day.warningMode ? 'text-amber-300' : 'text-emerald-300'}
          />
        </div>
        {day.locked && day.lockReason && <p className="mt-3 text-xs text-rose-200/80">{day.lockReason}</p>}
        {status?.lastError && <p className="mt-3 text-xs text-rose-300">{status.lastError}</p>}
        {status && !status.ocrAvailable && status.enabled && (
          <p className="mt-3 text-xs text-amber-300">Windows text recognition is not ready. Add an English language pack in Windows Settings → Time &amp; language.</p>
        )}
        <div className="mt-4 flex justify-end">
          <Button type="button" variant="ghost" size="sm" className="h-8 text-xs" onClick={() => guardian.openLog().catch((e) => toast.error(e.message))}>
            <FileText className="mr-1.5 h-3.5 w-3.5" /> Open log
          </Button>
        </div>
      </Section>

      <Section
        title="Screen regions"
        description="Keep Trade Terminal open, visible and maximized, then select each value with a tight box. Everything is read from the header and tab bar. Redo this only if Trade Terminal moves or resizes, or your monitors or display scaling change. If Trade Terminal is open but cannot be read for 30 seconds, Guardian alerts you."
        action={
          <Button type="button" size="sm" onClick={runTest} disabled={testing} className="h-8 text-xs">
            {testing ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <ScanText className="mr-1.5 h-3.5 w-3.5" />}
            Test read
          </Button>
        }
      >
        <div className="space-y-2">
          {REGIONS.map(({ key, label, hint, optional }) => {
            const region = status?.regions?.[key];
            const raw = testResult?.raw?.[key];
            return (
              <div key={key} className="flex flex-wrap items-center gap-3 rounded-lg border border-white/[0.07] bg-white/[0.02] px-3 py-2">
                <div className="min-w-[180px] flex-1">
                  <p className="text-sm text-white/85">{label}</p>
                  <p className="text-[11px] text-white/35">{hint}</p>
                </div>
                <span className={cn('font-mono text-[11px]', region ? 'text-white/45' : optional ? 'text-white/30' : 'text-amber-300/80')}>
                  {region ? `${region[2] - region[0]}×${region[3] - region[1]} at ${region[0]},${region[1]}` : optional ? 'Not set · optional' : 'Not set'}
                </span>
                {testResult && (
                  <span className="max-w-[220px] truncate rounded bg-black/30 px-2 py-0.5 font-mono text-[11px] text-cyan-200" title={raw}>
                    {raw ? `“${raw}”` : 'read nothing'}
                  </span>
                )}
                <Button type="button" variant="outline" size="sm" className="h-8 text-xs" disabled={Boolean(picking)} onClick={() => pick(key)}>
                  {picking === key ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <Crosshair className="mr-1.5 h-3.5 w-3.5" />}
                  {region ? 'Reselect' : 'Select on screen'}
                </Button>
              </div>
            );
          })}
        </div>
        {testResult && (
          <p className="mt-3 text-xs text-white/55">
            Understood as: account <b className="text-white/85">{testResult.account || 'not read, reselect the account number'}</b>,
            balance <b className="text-white/85">{money(testResult.balance)}</b>,
            open trade <b className="text-white/85">{money(testResult.unrealizedPnl)}</b>,
            positions <b className="text-white/85">{testResult.positions ?? '?'}</b>,
            trades <b className="text-white/85">{testResult.trades ?? '?'}</b> ({testResult.filledOrders ?? '?'} fills)
            {testResult.startBalance != null && <>, daily P&L <b className="text-white/85">{money(testResult.dailyPnl)}</b></>}
            {testResult.alertsFound && (
              <>
                {' · '}alerts list: <b className="text-white/85">{testResult.alertsFound.count}</b> trigger{testResult.alertsFound.count === 1 ? '' : 's'}
                {testResult.alertsFound.sample.length > 0 && <span className="font-mono text-cyan-200/70"> ({testResult.alertsFound.sample.join('; ')})</span>}
              </>
            )}
            {testResult.running ? '' : ' · Trade Terminal is not running'}
          </p>
        )}
        <label className="mt-4 flex max-w-sm flex-col gap-1">
          <span className="text-[10px] uppercase tracking-widest text-white/40">Trade Terminal program</span>
          <Input value={processName} onChange={(e) => setProcessName(e.target.value)} onBlur={saveProcessName} className="h-9 font-mono" />
        </label>
      </Section>

      <Section
        title="Limits"
        description="Taken from your settings for the current tier, and applied to whichever account Trade Terminal shows. Change them on the Account and Defaults tabs; Guardian follows, including each weekday's own max daily loss."
        action={<ShieldCheck className="h-4 w-4 text-white/25" />}
      >
        <LimitsPanel />
      </Section>

      <Section
        title="Protection"
        description="The rules beyond the loss limits: a cooldown after losing trades, keeping a green day green, and a tighter day after a poor Morning Brief."
      >
        <ProtectionEditor settings={settings} saveImmediately={saveImmediately} />
      </Section>

      <Section
        title="Test mode"
        description="Plays a scenario through the real rules: every alert appears as it would live, marked TEST. Trade Terminal is never closed and today’s real session is not touched."
      >
        <TestModePanel guardian={guardian} running={Boolean(status?.testRunning)} />
      </Section>

      <Section title="Counting trades" description="Trades are counted from Trade Terminal’s Filled orders tab.">
        <TradeCountEditor settings={settings} saveImmediately={saveImmediately} />
      </Section>

      <Section title="Session times" description="When the lock lifts so Trade Terminal can be used for review, and when Guardian stops for the day.">
        <TimesEditor settings={settings} saveImmediately={saveImmediately} />
      </Section>
    </div>
  );
}
