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
    <div className="min-w-[120px] rounded-xl border border-white/10 bg-gradient-to-b from-white/10 to-white/5 px-3 py-2.5">
      <p className="flex items-center gap-1 text-[10px] uppercase tracking-wide text-white/45">
        <Icon className="w-3 h-3" /> {label}
      </p>
      <p className={`mt-1 text-sm font-semibold ${valueClassName}`}>{value}</p>
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
    <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-[#13131e] via-[#141a27] to-[#102233] p-4 shadow-[0_10px_30px_-18px_rgba(34,211,238,0.5)]">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-white">Float Position Sizer</h2>
          <p className="mt-0.5 text-xs text-white/50">Plan risk and exits with cleaner, float-aware structure.</p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 w-full lg:w-auto">
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

      <div className="flex flex-wrap gap-2 mt-3">
        {statusPills.map((pill) => (
          <div
            key={pill.label}
            className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] transition-colors ${
              pill.ready
                ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
                : 'bg-white/5 border-white/15 text-white/55'
            }`}
          >
            {pill.ready ? (
              <CheckCircle2 className="w-3 h-3" />
            ) : (
              <span className="w-1.5 h-1.5 rounded-full bg-white/35" />
            )}
            {pill.label}
          </div>
        ))}
      </div>
    </div>
  );
}
