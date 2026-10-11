import React, { useEffect, useMemo, useRef } from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, ShieldOff, ShieldAlert } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { createPageUrl } from '@/utils';
import { useConfirm } from '@/components/ui/ConfirmDialog';
import { useGuardian, describeGuardianPhase } from '@/lib/hooks/useGuardian';
import { useGuardianLimits } from '@/lib/hooks/useGuardianLimits';
import { useGuardianDaySync } from '@/lib/hooks/useGuardianDays';
import { useAlertTriggerSync } from '@/lib/hooks/useAlertTriggers';
import { buildGuardianRules } from '@/lib/guardian/rules';

const buildRules = (settings, mentalScore) => buildGuardianRules(settings, { mentalScore });

const TONE = {
  ok: 'border-emerald-400/30 bg-emerald-500/10 text-emerald-200',
  warning: 'border-amber-400/35 bg-amber-500/12 text-amber-200',
  danger: 'border-rose-500/40 bg-rose-500/15 text-rose-200',
  idle: 'border-white/12 bg-white/[0.04] text-white/60',
  off: 'border-white/10 bg-white/[0.03] text-white/40',
};

const money = (n) => (n == null ? '—' : `${n < 0 ? '-' : ''}$${Math.abs(n).toFixed(2)}`);

/**
 * Keeps the desktop Guardian's rules in step with Settings and the morning's
 * check-in. The hard limit and target follow the weekday, so the rules are
 * rebuilt each minute too, not only when Settings change.
 */
function useGuardianRulesSync(setRules, isAvailable) {
  const { settings, mentalScore } = useGuardianLimits();
  const lastSent = useRef('');
  const [minute, setMinute] = React.useState(() => Math.floor(Date.now() / 60000));

  useEffect(() => {
    const id = setInterval(() => setMinute(Math.floor(Date.now() / 60000)), 60000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (!isAvailable || !settings) return;
    // Rebuilt here rather than taken from the hook, so the weekday is read fresh each minute.
    const rules = buildRules(settings, mentalScore);
    const serialized = JSON.stringify(rules);
    if (serialized === lastSent.current) return;
    lastSent.current = serialized;
    setRules(rules).catch(() => { lastSent.current = ''; });
  }, [settings, mentalScore, minute, isAvailable, setRules]);
}

/**
 * The Guardian's switch and status, in view on every page. Switching it off
 * mid-session asks first: a lock is only worth something if it is hard to
 * undo in the moment.
 */
export default function GuardianControl({ className }) {
  const guardian = useGuardian();
  const { status, isAvailable, setEnabled, setRules } = guardian;
  const [confirm, confirmDialog] = useConfirm();
  useGuardianRulesSync(setRules, isAvailable);
  // Keep the day's timeline for the journal as it happens.
  useGuardianDaySync(isAvailable ? status : null);
  // File Trade Terminal's alert triggers under Playbook strategies.
  useAlertTriggerSync(isAvailable ? status : null, isAvailable ? guardian.bridge : null);

  const phase = useMemo(() => describeGuardianPhase(status), [status]);
  if (!isAvailable || !status?.supported) return null;

  const enabled = Boolean(status.enabled);
  const day = status.day || {};
  const inSession = enabled && (day.locked || day.warningMode || day.finalTradeStarted);
  const Icon = !enabled ? ShieldOff : phase.tone === 'danger' || phase.tone === 'warning' ? ShieldAlert : ShieldCheck;
  const reading = status.reading;

  const toggle = async () => {
    if (enabled && inSession) {
      const ok = await confirm({
        title: day.locked ? 'Turn off Guardian while locked?' : 'Turn off Guardian mid-session?',
        description: day.locked
          ? 'Your session is locked for today. Turning Guardian off lets Trade Terminal reopen. The lock comes back if you turn it on again today.'
          : 'You have reached your warning level. Turning Guardian off stops the final-trade and hard-limit protection.',
        confirmLabel: 'Turn off',
        destructive: true,
      });
      if (!ok) return;
    }
    try {
      await setEnabled(!enabled);
    } catch (error) {
      toast.error(error?.message || 'Could not switch Guardian');
    }
  };

  const title = reading && enabled
    ? `${reading.account || 'Account ?'} · Daily ${money(reading.dailyPnl)} · Positions ${reading.positions ?? '?'}${reading.unrealizedPnl != null ? ` · Open ${money(reading.unrealizedPnl)}` : ''}`
    : 'Trading Guardian';

  return (
    <div className={cn('flex items-center gap-1.5 rounded-xl border px-2 py-1', TONE[phase.tone], className)} title={title}>
      <Link to={createPageUrl('Settings')} className="flex items-center gap-1.5">
        <Icon className={cn('h-3.5 w-3.5', phase.tone === 'danger' && 'animate-pulse')} />
        <span className="whitespace-nowrap text-[11px] font-semibold">Guardian · {phase.label}</span>
      </Link>
      <button
        type="button"
        role="switch"
        aria-checked={enabled}
        aria-label={enabled ? 'Turn Trading Guardian off' : 'Turn Trading Guardian on'}
        onClick={toggle}
        className={cn(
          'relative ml-1 h-4 w-7 flex-shrink-0 rounded-full transition-colors',
          enabled ? 'bg-emerald-500' : 'bg-white/20',
        )}
      >
        <span className={cn('absolute top-0.5 h-3 w-3 rounded-full bg-white transition-all', enabled ? 'left-3.5' : 'left-0.5')} />
      </button>
      {confirmDialog}
    </div>
  );
}
