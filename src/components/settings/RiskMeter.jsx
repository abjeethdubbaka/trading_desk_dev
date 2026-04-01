import React from 'react';
import { cn } from '@/lib/utils/general';

export default function RiskMeter({ settings }) {
  const parsedPct = Number(settings.position_sizing_percent);
  const parsedStop = Number(settings.default_stop_loss_percent);
  const pct = Number.isFinite(parsedPct) ? parsedPct : 0.01;
  const stop = Number.isFinite(parsedStop) ? parsedStop : 0.04;
  const score = Math.min(100, (pct * 1500) + (stop * 400));
  const label = score < 30 ? 'Conservative' : score < 60 ? 'Moderate' : score < 80 ? 'Aggressive' : 'Very aggressive';
  const color = score < 30 ? 'text-blue-400' : score < 60 ? 'text-amber-400' : 'text-red-400';
  const tip = score < 30
    ? 'Professional range: 0.5-1% risk per trade.'
    : score < 60
      ? 'Moderate - most professionals stay under 1%.'
      : 'High risk - consider reducing position sizing.';

  return (
    <div className="bg-[#13131e] border border-white/8 rounded-xl p-4 space-y-3">
      <p className="text-xs font-semibold text-white/40 uppercase tracking-wider">Risk profile</p>
      <div className="relative">
        <div
          className="h-3 rounded-full"
          style={{ background: 'linear-gradient(90deg,rgba(96,165,250,.6),rgba(245,158,11,.6),rgba(248,113,113,.8))' }}
        >
          <div
            className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-4 h-4 bg-white rounded-full shadow-lg border-2 border-white/80 transition-all duration-300"
            style={{ left: `${score}%` }}
          />
        </div>
        <div className="flex justify-between text-[10px] text-white/30 mt-1.5">
          <span>Conservative</span>
          <span>Moderate</span>
          <span>Aggressive</span>
        </div>
      </div>
      <p className="text-xs">
        <span className={cn('font-semibold', color)}>{label}</span> - <span className="text-white/40">{tip}</span>
      </p>
    </div>
  );
}

