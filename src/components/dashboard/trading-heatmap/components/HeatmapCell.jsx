import React from 'react';
import { cn } from '@/lib/utils/general';
import { getColorIntensity, formatTooltipContent } from '../utils/colorUtils';

const HeatmapCell = ({ data, minPnl, maxPnl, hasTrades, onClick }) => {
  const tooltip = formatTooltipContent(data);
  
  return (
    <div
      className={cn(
        "aspect-square rounded transition-all relative group cursor-pointer",
        hasTrades ? getColorIntensity(data.pnl, maxPnl, minPnl) : 'bg-white/5',
        hasTrades && 'hover:ring-2 hover:ring-white/30 hover:scale-105',
        'focus:outline-none focus:ring-2 focus:ring-blue-500'
      )}
      onClick={onClick}
      onKeyDown={(e) => e.key === 'Enter' && onClick?.()}
      role="button"
      tabIndex={hasTrades ? 0 : -1}
      aria-label={hasTrades ? 
        `${data.count} trades, ${data.pnl > 0 ? 'profit' : 'loss'} of $${Math.abs(data.pnl).toFixed(2)}` : 
        'No trades'
      }
    >
      {hasTrades && (
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 group-focus:opacity-100 transition-opacity z-10">
          <div className="bg-gray-900/95 text-white rounded-lg px-3 py-2 text-xs whitespace-nowrap shadow-xl border border-white/10">
            <div className="font-semibold text-sm">{tooltip.title}</div>
            {tooltip.lines.map((line, i) => (
              <div key={i} className="text-white/60 text-xs">{line}</div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default React.memo(HeatmapCell);


