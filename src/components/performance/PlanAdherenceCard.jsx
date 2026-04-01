import React from 'react';
import { CheckCircle2, XCircle } from 'lucide-react';
import { computePlanAdherence } from '@/lib/calculations/trades';
import { cn } from '@/lib/utils/general';

function Row({ label, icon: Icon, iconColor, stats }) {
  return (
    <div className="flex items-center gap-3 py-2.5 border-b border-white/5 last:border-0">
      <Icon className={cn('w-4 h-4 flex-shrink-0', iconColor)} />
      <span className="text-sm text-white/70 w-28 flex-shrink-0">{label}</span>
      <div className="flex flex-1 gap-4 justify-end">
        {[['Trades', stats.totalTrades, 'text-white/70'], ['Win %', `${stats.winRate.toFixed(0)}%`, stats.winRate >= 50 ? 'text-emerald-400' : 'text-red-400'], ['Avg R', `${stats.avgR.toFixed(1)}R`, stats.avgR >= 1 ? 'text-emerald-400' : 'text-amber-400'], ['Avg P&L', `${stats.avgPnL >= 0 ? '+' : ''}$${stats.avgPnL.toFixed(0)}`, stats.avgPnL >= 0 ? 'text-emerald-400' : 'text-red-400']].map(([l, v, c]) => (
          <div key={l} className="text-right"><p className="text-[10px] text-white/30">{l}</p><p className={cn('font-mono font-semibold text-sm', c)}>{v}</p></div>
        ))}
      </div>
    </div>
  );
}

export default function PlanAdherenceCard({ trades = [] }) {
  const { followed, deviated } = computePlanAdherence(trades);
  if (!followed.totalTrades && !deviated.totalTrades) return null;
  const diff = followed.avgPnL - deviated.avgPnL;

  return (
    <div className="bg-[#13131e] border border-white/8 rounded-2xl p-5 space-y-3">
      <div><p className="text-sm font-semibold">Plan adherence</p><p className="text-xs text-white/40 mt-0.5">Does following your plan actually make a difference?</p></div>
      <div>
        <Row label="Followed plan" icon={CheckCircle2} iconColor="text-emerald-400" stats={followed} />
        <Row label="Deviated" icon={XCircle} iconColor="text-red-400" stats={deviated} />
      </div>
      {Math.abs(diff) > 0 && followed.totalTrades > 0 && deviated.totalTrades > 0 && (
        <div className={cn('rounded-lg px-3 py-2 text-xs', diff > 0 ? 'bg-emerald-500/8 border border-emerald-500/20 text-emerald-300/80' : 'bg-red-500/8 border border-red-500/20 text-red-300/80')}>
          {diff > 0 ? `✓ Following your plan earns $${diff.toFixed(0)} more per trade.` : `⚠ Deviating costs $${Math.abs(diff).toFixed(0)} per trade. Stick to the plan.`}
        </div>
      )}
    </div>
  );
}


