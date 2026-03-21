import React from 'react';
import { computeEmotionStats } from '@/lib/calculations/trades';
import { cn } from '@/lib/utils';

const COLORS = {
  confident: { dot: 'bg-emerald-400', text: 'text-emerald-400' },
  disciplined: { dot: 'bg-blue-400', text: 'text-blue-400' },
  neutral: { dot: 'bg-white/40', text: 'text-white/60' },
  nervous: { dot: 'bg-amber-400', text: 'text-amber-400' },
  fomo: { dot: 'bg-orange-400', text: 'text-orange-400' },
  revenge: { dot: 'bg-red-400', text: 'text-red-400' },
};

export default function EmotionMatrix({ trades = [] }) {
  const stats = computeEmotionStats(trades);
  if (!stats.length) return null;
  
  // Calculate totalPnL for each emotion
  const statsWithTotal = stats.map(stat => ({
    ...stat,
    totalPnL: stat.avgPnL * stat.trades
  }));
  
  const best = [...statsWithTotal].sort((a, b) => b.avgPnL - a.avgPnL)[0];
  const worst = [...statsWithTotal].sort((a, b) => a.avgPnL - b.avgPnL)[0];

  return (
    <div className="bg-[#13131e] border border-white/8 rounded-2xl p-5 space-y-4">
      <div><p className="text-sm font-semibold">Emotion vs outcome</p><p className="text-xs text-white/40 mt-0.5">How your emotional state predicts trade quality</p></div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs border-collapse">
          <thead><tr className="text-[10px] font-semibold uppercase tracking-wider text-white/30">
            <th className="text-left pb-2 pr-4">Emotion</th>
            <th className="text-right pb-2 px-3">Trades</th>
            <th className="text-right pb-2 px-3">Win %</th>
            <th className="text-right pb-2 px-3">Avg R</th>
            <th className="text-right pb-2 px-3">Avg P&L</th>
            <th className="text-right pb-2 pl-3">Total</th>
          </tr></thead>
          <tbody className="divide-y divide-white/5">
            {statsWithTotal.map((row) => {
              const c = COLORS[row.emotion] || COLORS.neutral;
              return (
                <tr key={row.emotion} className="hover:bg-white/3 transition-colors">
                  <td className="py-2 pr-4"><div className="flex items-center gap-2"><div className={cn('w-2 h-2 rounded-full flex-shrink-0', c.dot)} /><span className="capitalize font-medium text-white/80">{row.emotion}</span></div></td>
                  <td className="py-2 px-3 text-right font-mono text-white/50">{row.trades}</td>
                  <td className={cn('py-2 px-3 text-right font-mono font-semibold', row.winRate >= 50 ? 'text-emerald-400' : row.winRate >= 40 ? 'text-amber-400' : 'text-red-400')}>{(row.winRate || 0).toFixed(0)}%</td>
                  <td className={cn('py-2 px-3 text-right font-mono font-semibold', (row.avgR || 0) >= 1 ? 'text-emerald-400' : (row.avgR || 0) >= 0 ? 'text-amber-400' : 'text-red-400')}>{(row.avgR || 0) >= 0 ? '+' : ''}{(row.avgR || 0).toFixed(1)}R</td>
                  <td className={cn('py-2 px-3 text-right font-mono font-semibold', (row.avgPnL || 0) >= 0 ? 'text-emerald-400' : 'text-red-400')}>{(row.avgPnL || 0) >= 0 ? '+' : ''}${(row.avgPnL || 0).toFixed(0)}</td>
                  <td className={cn('py-2 pl-3 text-right font-mono', (row.totalPnL || 0) >= 0 ? 'text-emerald-400/70' : 'text-red-400/70')}>{(row.totalPnL || 0) >= 0 ? '+' : ''}${(row.totalPnL || 0).toFixed(0)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {stats.length >= 2 && best.emotion !== worst.emotion && (
        <div className="bg-purple-500/8 border border-purple-500/20 rounded-lg px-3 py-2 text-xs text-purple-300/80">
          💡 Best when <span className="font-semibold text-purple-200">{best.emotion}</span> (avg +${best.avgPnL.toFixed(0)}). Worst when <span className="font-semibold text-purple-200">{worst.emotion}</span> (avg ${worst.avgPnL.toFixed(0)}).
        </div>
      )}
    </div>
  );
}
