import React, { useState } from 'react';
import { BellRing, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils/general';

const SHOWN = 5;

function TriggerRow({ trigger, children }) {
  const isLong = trigger.direction === 'long';
  return (
    <li className="flex items-center gap-2 text-[11px]">
      <span className="w-[86px] flex-shrink-0 font-mono text-white/40">{trigger.date?.slice(5)} {trigger.time_et}</span>
      <span className="w-12 flex-shrink-0 font-semibold text-white/85">{trigger.symbol}</span>
      <span className={cn('w-10 flex-shrink-0 font-semibold uppercase', isLong ? 'text-emerald-300' : 'text-rose-300')}>
        {trigger.direction}
      </span>
      <span className="w-16 flex-shrink-0 font-mono text-white/70">{Number(trigger.price).toFixed(2)}</span>
      {children}
    </li>
  );
}

/**
 * A strategy's alert triggers from Trade Terminal: how often it fired, and
 * the latest few. Kept, not judged — the record a later review works from.
 */
export function StrategyTriggers({ summary }) {
  const [showAll, setShowAll] = useState(false);
  if (!summary || summary.total === 0) return null;
  const rows = showAll ? summary.recent : summary.recent.slice(0, SHOWN);

  return (
    <div className="mt-3 rounded-xl border border-white/10 bg-black/25 p-2.5">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="text-[10px] uppercase tracking-[0.14em] text-white/45">
          <BellRing className="mr-1 inline h-3 w-3 opacity-60" />
          Alert triggers
        </p>
        <p className="text-[11px] text-white/50">
          <span className="font-semibold text-white/80">{summary.total}</span> total
          {summary.today > 0 && <> · <span className="font-semibold text-cyan-200">{summary.today}</span> today</>}
          {summary.long > 0 && summary.short > 0 && <> · {summary.long} long / {summary.short} short</>}
        </p>
      </div>
      <ul className="mt-1.5 space-y-0.5">
        {rows.map((trigger) => <TriggerRow key={trigger.id} trigger={trigger} />)}
      </ul>
      {summary.recent.length > SHOWN && (
        <button type="button" onClick={() => setShowAll((v) => !v)} className="mt-1 text-[10px] text-cyan-300/80 hover:text-cyan-200">
          {showAll ? 'Show fewer' : `Show all ${summary.recent.length}`}
        </button>
      )}
    </div>
  );
}

/**
 * Triggers no strategy's keywords matched. Each can be filed by hand; adding
 * the keyword to a strategy files the rest automatically.
 */
export function UnassignedTriggers({ triggers, entries, onAssign, onRemove }) {
  const [expanded, setExpanded] = useState(false);
  if (!triggers || triggers.length === 0) return null;
  const sorted = [...triggers].sort((a, b) => `${b.date} ${b.time_et}`.localeCompare(`${a.date} ${a.time_et}`));
  const rows = expanded ? sorted : sorted.slice(0, SHOWN);
  const active = entries.filter((entry) => entry.is_active !== false);

  const assign = async (trigger, entryId) => {
    const entry = active.find((e) => e.id === entryId);
    if (!entry) return;
    try {
      await onAssign(trigger, entry);
      toast.success(`Filed under ${entry.name}. Add "${trigger.setup_text || trigger.setup_raw}" to its alert keywords to file these automatically.`);
    } catch (error) {
      toast.error(error?.message || 'Could not file the trigger');
    }
  };

  return (
    <div className="rounded-2xl border border-amber-400/20 bg-amber-500/[0.05] p-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="text-sm font-semibold text-amber-100">
          <BellRing className="mr-1.5 inline h-4 w-4 text-amber-300" />
          Unassigned triggers <span className="text-amber-200/70">({triggers.length})</span>
        </p>
        <p className="text-[11px] text-white/45">Alerts whose setup matched no strategy’s alert keywords.</p>
      </div>
      <ul className="mt-3 space-y-1">
        {rows.map((trigger) => (
          <TriggerRow key={trigger.id} trigger={trigger}>
            <span className="min-w-0 flex-1 truncate font-mono text-white/45" title={trigger.raw}>
              “{trigger.setup_raw || trigger.setup_text || '?'}”
            </span>
            <select
              defaultValue=""
              onChange={(event) => assign(trigger, event.target.value)}
              className="h-7 max-w-[160px] rounded-md border border-white/10 bg-[#0d1520] px-2 text-[11px] text-white/80"
            >
              <option value="" disabled>File under…</option>
              {active.map((entry) => <option key={entry.id} value={entry.id}>{entry.name}</option>)}
            </select>
            <button
              type="button"
              onClick={() => onRemove(trigger.id).catch(() => toast.error('Could not remove'))}
              className="rounded p-1 text-white/30 hover:bg-rose-500/15 hover:text-rose-200"
              title="Not a real trigger: remove it"
            >
              <Trash2 className="h-3 w-3" />
            </button>
          </TriggerRow>
        ))}
      </ul>
      {sorted.length > SHOWN && (
        <button type="button" onClick={() => setExpanded((v) => !v)} className="mt-2 text-[11px] text-amber-200/80 hover:text-amber-100">
          {expanded ? 'Show fewer' : `Show all ${sorted.length}`}
        </button>
      )}
    </div>
  );
}
