import React from 'react';
import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown } from 'lucide-react';

export default function StatsCard({ title, value, subtitle, trend, trendValue, icon: Icon, variant = 'default' }) {
  const isPositive = trend === 'up';
  
  const variants = {
    default: 'from-white/5 to-transparent',
    success: 'from-emerald-500/10 to-transparent',
    danger: 'from-red-500/10 to-transparent',
    warning: 'from-amber-500/10 to-transparent',
  };

  return (
    <div className={cn(
      "relative overflow-hidden rounded-2xl p-6 glass-card gradient-border",
      variant === 'success' && 'glow-green',
      variant === 'danger' && 'glow-red'
    )}>
      <div className={cn(
        "absolute inset-0 bg-gradient-to-br opacity-50",
        variants[variant]
      )} />
      
      <div className="relative">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-2">
            {Icon && (
              <div className={cn(
                "w-10 h-10 rounded-xl flex items-center justify-center",
                variant === 'success' && 'bg-emerald-500/20 text-emerald-400',
                variant === 'danger' && 'bg-red-500/20 text-red-400',
                variant === 'warning' && 'bg-amber-500/20 text-amber-400',
                variant === 'default' && 'bg-white/10 text-white/60'
              )}>
                <Icon className="w-5 h-5" />
              </div>
            )}
            <span className="text-sm text-white/50 font-medium">{title}</span>
          </div>
          
          {trendValue && (
            <div className={cn(
              "flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full",
              isPositive ? "bg-emerald-500/20 text-emerald-400" : "bg-red-500/20 text-red-400"
            )}>
              {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
              {trendValue}
            </div>
          )}
        </div>
        
        <div className="space-y-1">
          <p className={cn(
            "text-3xl font-bold tracking-tight",
            variant === 'success' && 'text-emerald-400',
            variant === 'danger' && 'text-red-400',
            variant === 'warning' && 'text-amber-400'
          )}>
            {value}
          </p>
          {subtitle && (
            <p className="text-sm text-white/40">{subtitle}</p>
          )}
        </div>
      </div>
    </div>
  );
}