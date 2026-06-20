import React from 'react';
import { Wallet, Shield, Percent, Target, CheckCircle2 } from 'lucide-react';

const formatCurrency = (value, fallback = '--') => {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return fallback;
  return `$${numeric.toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;
};

function SummaryTile({ icon: Icon, label, value, valueClassName = 'text-white' }) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.04] px-2.5 py-1.5">
      <p className="flex items-center gap-1 text-[9px] uppercase tracking-wide text-white/40">
        <Icon className="w-2.5 h-2.5" /> {label}
      </p>
      <p className={`mt-0.5 text-xs font-semibold tabular-nums ${valueClassName}`}>{value}</p>
    </div>
  );
}

export function SummaryPanel({
  accountSize,
  riskAmount,
  positionSizingPct,
  targetProfitDollars,
  statusPills,
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-[#0d1520] px-3 py-2.5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="min-w-0">
          <h2 className="text-sm font-semibold text-white leading-tight">Float Position Sizer</h2>
          <p className="text-[10px] text-white/40">Float-aware risk sizing</p>
        </div>

        <div className="flex gap-1.5 flex-wrap">
          <SummaryTile icon={Wallet} label="Account" value={formatCurrency(accountSize)} />
          <SummaryTile icon={Shield} label="Risk" value={formatCurrency(riskAmount)} valueClassName="text-red-300" />
          <SummaryTile
            icon={Percent}
            label="Position"
            value={Number.isFinite(Number(positionSizingPct)) ? `${Number(positionSizingPct)}%` : '--'}
          />
          <SummaryTile icon={Target} label="Target" value={formatCurrency(targetProfitDollars)} valueClassName="text-emerald-300" />
        </div>
      </div>

      {statusPills.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-2">
          {statusPills.map((pill) => (
            <div
              key={pill.label}
              className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] transition-colors ${
                pill.ready
                  ? 'bg-emerald-500/12 border-emerald-500/25 text-emerald-300'
                  : 'bg-white/[0.03] border-white/12 text-white/45'
              }`}
            >
              {pill.ready ? (
                <CheckCircle2 className="w-2.5 h-2.5" />
              ) : (
                <span className="w-1.5 h-1.5 rounded-full bg-white/30" />
              )}
              {pill.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
