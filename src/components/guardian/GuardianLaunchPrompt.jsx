import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, ShieldCheck, ShieldOff } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { createPageUrl } from '@/utils';
import { useGuardianLimits } from '@/lib/hooks/useGuardianLimits';
import { getLocalDateKey } from '@/lib/reviews/utils';

const ASKED_KEY = 'tradedesk:guardian-asked';

function readAskedDate() {
  try {
    return localStorage.getItem(ASKED_KEY) || '';
  } catch {
    // No storage: treat as asked, so a broken API never shows it every launch.
    return getLocalDateKey();
  }
}

/** Whether today's "Guardian on or off?" question is still owed: weekdays, once a day. */
export function isGuardianPromptDue(guardian) {
  const status = guardian?.status;
  if (!guardian?.isAvailable || !status?.supported) return false;
  const day = new Date().getDay();
  if (day === 0 || day === 6) return false;
  // Mid-session (warned or locked) the answer is already yes: offering a
  // one-click "Turn off" here would undo a lock without asking.
  const session = status.day || {};
  if (status.enabled && (session.locked || session.warningMode)) return false;
  return readAskedDate() !== getLocalDateKey();
}

export function markGuardianPromptAsked() {
  try { localStorage.setItem(ASKED_KEY, getLocalDateKey()); } catch { /* storage unavailable */ }
}

/**
 * Asked as the app opens, after the morning check-in: is Guardian watching
 * Trade Terminal today? Shows the day's limits so the choice is made with
 * them in view.
 */
export default function GuardianLaunchPrompt({ guardian, onDone }) {
  const { limits } = useGuardianLimits();
  const navigate = useNavigate();
  const [isSwitching, setIsSwitching] = useState(false);
  const status = guardian.status || {};
  const enabled = Boolean(status.enabled);
  const needsSetup = (status.missingRegions?.length || 0) > 0;

  const finish = () => {
    markGuardianPromptAsked();
    onDone();
  };

  const choose = async (turnOn) => {
    if (turnOn === enabled) {
      finish();
      return;
    }
    setIsSwitching(true);
    try {
      await guardian.setEnabled(turnOn);
      toast.success(turnOn ? 'Guardian is watching Trade Terminal' : 'Guardian is off for now');
      finish();
    } catch (error) {
      toast.error(error?.message || 'Could not switch Guardian');
    } finally {
      setIsSwitching(false);
    }
  };

  const openSetup = () => {
    finish();
    navigate(createPageUrl('Settings'));
  };

  const rows = [
    ['Warning at', limits.hard ? `-$${limits.warning.toLocaleString()}` : '—', 'text-amber-300'],
    ['Final trade may lose', limits.finalTradeLoss ? `-$${limits.finalTradeLoss.toLocaleString()}` : '—', 'text-amber-200'],
    ['Hard limit', limits.hard ? `-$${limits.hard.toLocaleString()}` : 'Not set', 'text-rose-300'],
    ['Max trades', limits.maxTrades ? String(limits.maxTrades) : 'Off', 'text-white/85'],
    ['Cooldown after a loss', limits.cooldownMinutes ? `${limits.cooldownMinutes} min` : 'Off', 'text-white/85'],
  ];

  return (
    <div className="fixed inset-0 z-[105] flex items-center justify-center bg-black/70 backdrop-blur-md">
      <div className="relative mx-4 w-full max-w-sm rounded-2xl border border-emerald-500/25 bg-[#11131e] p-7 shadow-2xl">
        <div className="flex items-center gap-2.5">
          <span className={cn(
            'flex h-9 w-9 items-center justify-center rounded-xl border',
            enabled ? 'border-emerald-400/30 bg-emerald-500/15' : 'border-white/15 bg-white/[0.05]',
          )}>
            {enabled ? <ShieldCheck className="h-4 w-4 text-emerald-300" /> : <ShieldOff className="h-4 w-4 text-white/50" />}
          </span>
          <div>
            <p className="text-sm font-semibold text-white">Trading Guardian</p>
            <p className="text-[11px] text-white/40">Currently {enabled ? 'on' : 'off'}</p>
          </div>
        </div>

        <p className="mt-5 text-lg font-semibold text-white/90">Watch Trade Terminal today?</p>
        <p className="mt-1 text-xs text-white/45">
          Warnings at your limit, one final trade, and Trade Terminal locked until {status.rules?.unlockTime || '16:30'} once the day is done.
        </p>

        <div className="mt-4 space-y-1.5 rounded-xl border border-white/[0.07] bg-white/[0.03] px-4 py-3">
          {rows.map(([label, value, tone]) => (
            <div key={label} className="flex items-center justify-between text-xs">
              <span className="text-white/45">{label}</span>
              <span className={cn('font-mono font-semibold', tone)}>{value}</span>
            </div>
          ))}
          <p className="pt-1 text-[10px] text-white/30">From your settings · {limits.tierLabel} tier</p>
        </div>

        {limits.tightened && (
          <p className="mt-3 rounded-xl border border-rose-400/25 bg-rose-500/10 px-3 py-2.5 text-xs text-rose-100/90">
            Tightened for today ({limits.tightenReason}): earlier warning, fewer trades, longer cooldown.
          </p>
        )}

        {needsSetup && (
          <div className="mt-3 rounded-xl border border-amber-400/25 bg-amber-500/10 px-3 py-2.5 text-xs text-amber-100/90">
            Trade Terminal’s screen regions are not set up yet, so Guardian cannot read it.
            <button type="button" onClick={openSetup} className="ml-1 font-semibold text-amber-200 underline underline-offset-2">
              Set up now
            </button>
          </div>
        )}

        <div className="mt-5 grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => choose(false)}
            disabled={isSwitching}
            className="rounded-xl border border-white/12 py-3 text-sm font-semibold text-white/70 transition-colors hover:bg-white/5 disabled:opacity-40"
          >
            {enabled ? 'Turn off' : 'Leave off'}
          </button>
          <button
            type="button"
            onClick={() => choose(true)}
            disabled={isSwitching}
            className="flex items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3 text-sm font-semibold text-white transition-colors hover:bg-emerald-500 disabled:opacity-40"
          >
            {isSwitching && <Loader2 className="h-4 w-4 animate-spin" />}
            {enabled ? 'Keep on' : 'Turn on'}
          </button>
        </div>
      </div>
    </div>
  );
}
