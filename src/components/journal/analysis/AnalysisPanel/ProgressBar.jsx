import React from 'react';
import { cn } from '@/lib/utils/general';

const ProgressBar = ({ value, max, label, valueLabel, color = 'emerald', showValue = true }) => {
  const percentage = max > 0 ? (Math.abs(value) / max) * 100 : 0;
  
  const getColorClasses = (color) => {
    const colors = {
      emerald: 'bg-emerald-500',
      red: 'bg-red-500',
      blue: 'bg-blue-500',
      purple: 'bg-purple-500',
      amber: 'bg-amber-500'
    };
    return colors[color] || colors.emerald;
  };

  return (
    <div className="space-y-1">
      {label && (
        <div className="flex justify-between text-xs">
          <span className="text-white/70">{label}</span>
          {showValue && <span className="text-white/90 font-medium">{valueLabel || value}</span>}
        </div>
      )}
      <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden">
        <div 
          className={cn("h-full rounded-full transition-all duration-500", getColorClasses(color))}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};

export default ProgressBar;


