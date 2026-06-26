import React from 'react';
import { ArrowDown, ArrowRight, ArrowUp } from 'lucide-react';
import { cn } from '@/lib/utils/general';

function DeltaRow({ label, current, prior, format, neutral = false }) {
  const delta = current - prior;
  const isFlat = Math.abs(delta) < 1e-9;
  const Icon = isFlat ? ArrowRight : delta > 0 ? ArrowUp : ArrowDown;
  const tone = neutral
    ? 'text-white/50'
    : isFlat
      ? 'text-white/30'
      : delta > 0
        ? 'text-emerald-400'
        : 'text-red-400';

  return (
    <div className="flex items-center justify-between border-b border-white/5 py-2 last:border-0">
      <span className="text-xs text-white/55">{label}</span>
      <div className="flex items-center gap-2.5">
        <span className="font-mono text-xs text-white/35">{format(prior)}</span>
        <span className="text-white/15">→</span>
        <span className="font-mono text-sm font-semibold text-white">{format(current)}</span>
        <span className={cn('flex items-center gap-0.5 text-xs font-medium', tone)}>
          <Icon className="w-3 h-3" />
          {format(Math.abs(delta))}
        </span>
      </div>
    </div>
  );
}

const fmtCurrency = (v) => `${v >= 0 ? '+' : ''}$${Math.abs(v).toFixed(0)}`;
const fmtPercent = (v) => `${v.toFixed(0)}%`;
const fmtR = (v) => `${v.toFixed(1)}R`;
const fmtCount = (v) => String(Math.round(v));

export default function MonthOverMonthCard({ currentLabel, priorLabel, current, prior }) {
  if (!prior.totalTrades) {
    return (
      <div className="rounded-2xl border border-white/8 bg-[#13131e] p-5">
        <p className="text-sm font-semibold text-white">Month over month</p>
        <p className="mt-2 text-xs text-white/35">No trades in {priorLabel} to compare against.</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-white/8 bg-[#13131e] p-5">
      <div className="mb-2 flex items-center justify-between">
        <p className="text-sm font-semibold text-white">Month over month</p>
        <p className="text-[10px] uppercase tracking-[0.14em] text-white/35">{priorLabel} → {currentLabel}</p>
      </div>
      <DeltaRow label="Total P&L" current={current.totalPnL} prior={prior.totalPnL} format={fmtCurrency} />
      <DeltaRow label="Win rate" current={current.winRate} prior={prior.winRate} format={fmtPercent} />
      <DeltaRow label="Avg R" current={current.avgR} prior={prior.avgR} format={fmtR} />
      <DeltaRow label="Trades" current={current.totalTrades} prior={prior.totalTrades} format={fmtCount} neutral />
    </div>
  );
}
