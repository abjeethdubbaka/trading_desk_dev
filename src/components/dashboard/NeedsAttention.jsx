import React from 'react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { BookOpenCheck, ChevronRight, ClipboardList, PartyPopper } from 'lucide-react';
import { cn } from '@/lib/utils/general';
import { createPageUrl } from '@/utils';
import { ATTENTION_WINDOW_DAYS } from '@/lib/dashboard/attention';

const money = (n) => `${n >= 0 ? '+' : '-'}$${Math.abs(Math.round(n)).toLocaleString()}`;
const SHOWN = 3;

function Group({ icon: Icon, title, to, count, children }) {
  return (
    <div>
      <Link
        to={to}
        className="group flex items-center justify-between gap-2 rounded-lg px-1 py-1 transition-colors hover:bg-white/[0.04]"
      >
        <span className="flex items-center gap-2 text-xs font-semibold text-white/80">
          <Icon className="h-3.5 w-3.5 text-amber-300/80" />
          {title}
          <span className="rounded-full bg-amber-500/15 px-1.5 py-px text-[10px] font-semibold text-amber-300">{count}</span>
        </span>
        <ChevronRight className="h-3.5 w-3.5 text-white/30 transition-colors group-hover:text-white/60" />
      </Link>
      <ul className="mt-1 space-y-0.5 pl-6">{children}</ul>
    </div>
  );
}

function Row({ left, right, tone }) {
  return (
    <li className="flex items-center justify-between gap-2 text-[11px]">
      <span className="truncate text-white/50">{left}</span>
      <span className={cn('flex-shrink-0 font-mono', tone)}>{right}</span>
    </li>
  );
}

/**
 * The trader's unfinished homework from the last two weeks: days traded
 * without a Report Card, and trades still owed a Setup Journal debrief.
 */
export default function NeedsAttention({ unreviewedDays = [], undebriefedTrades = [] }) {
  const clear = unreviewedDays.length === 0 && undebriefedTrades.length === 0;

  return (
    <div className="rounded-2xl border border-white/10 bg-[#13131e] p-4">
      <div className="mb-3 flex items-baseline justify-between gap-2">
        <p className="text-sm font-semibold text-white">Needs attention</p>
        <span className="text-[10px] text-white/30">last {ATTENTION_WINDOW_DAYS} days</span>
      </div>

      {clear ? (
        <div className="flex items-center gap-2.5 rounded-lg border border-emerald-500/20 bg-emerald-500/[0.06] px-3 py-3">
          <PartyPopper className="h-4 w-4 flex-shrink-0 text-emerald-300" />
          <p className="text-xs text-emerald-200/80">All caught up. Every day is reviewed and every trade debriefed.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {unreviewedDays.length > 0 && (
            <Group icon={ClipboardList} title="Report cards to write" to={createPageUrl('DailyTradeReview')} count={unreviewedDays.length}>
              {unreviewedDays.slice(0, SHOWN).map((day) => (
                <Row
                  key={day.key}
                  left={`${format(day.date, 'EEE, MMM d')} · ${day.count} trade${day.count === 1 ? '' : 's'}`}
                  right={money(day.pnl)}
                  tone={day.pnl >= 0 ? 'text-emerald-300/80' : 'text-rose-300/80'}
                />
              ))}
              {unreviewedDays.length > SHOWN && (
                <li className="text-[10px] text-white/30">and {unreviewedDays.length - SHOWN} more</li>
              )}
            </Group>
          )}

          {undebriefedTrades.length > 0 && (
            <Group icon={BookOpenCheck} title="Trades to debrief" to={createPageUrl('SetupJournal')} count={undebriefedTrades.length}>
              {undebriefedTrades.slice(0, SHOWN).map((trade) => {
                const pnl = Number(trade.pnl ?? trade.total_pnl ?? 0);
                const date = new Date(trade.entry_time ?? trade.created_date);
                return (
                  <Row
                    key={trade.id}
                    left={`${trade.symbol || '—'} · ${trade.setup_type} · ${format(date, 'MMM d')}`}
                    right={money(pnl)}
                    tone={pnl >= 0 ? 'text-emerald-300/80' : 'text-rose-300/80'}
                  />
                );
              })}
              {undebriefedTrades.length > SHOWN && (
                <li className="text-[10px] text-white/30">and {undebriefedTrades.length - SHOWN} more</li>
              )}
            </Group>
          )}
        </div>
      )}
    </div>
  );
}
