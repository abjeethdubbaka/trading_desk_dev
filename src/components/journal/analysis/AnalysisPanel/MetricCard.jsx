import React from 'react';
import { cn } from '@/lib/utils/general';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';

const MetricCard = ({ label, value, change, icon: Icon, color = 'blue' }) => {
  const getColorClasses = (color) => {
    const colors = {
      blue: 'from-blue-500/10 to-cyan-500/10 border-blue-500/20 text-blue-400',
      emerald: 'from-emerald-500/10 to-green-500/10 border-emerald-500/20 text-emerald-400',
      purple: 'from-purple-500/10 to-pink-500/10 border-purple-500/20 text-purple-400',
      amber: 'from-amber-500/10 to-orange-500/10 border-amber-500/20 text-amber-400',
      red: 'from-red-500/10 to-rose-500/10 border-red-500/20 text-red-400'
    };
    return colors[color] || colors.blue;
  };

  return (
    <div className={cn(
      "bg-gradient-to-br rounded-xl p-3 border",
      getColorClasses(color)
    )}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-white/50">{label}</span>
        {Icon && <Icon className="w-4 h-4 opacity-60" />}
      </div>
      <div className="flex items-baseline justify-between">
        <span className="text-lg font-bold">{value}</span>
        {change && (
          <span className={cn(
            "text-xs flex items-center",
            change > 0 ? "text-emerald-400" : "text-red-400"
          )}>
            {change > 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
            {Math.abs(change)}%
          </span>
        )}
      </div>
    </div>
  );
};

export default MetricCard;


