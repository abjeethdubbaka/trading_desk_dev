import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn } from '@/lib/utils/general';

/**
 * PnlBadge — compact profit/loss display with color and optional icon.
 *
 * Props:
 *   value   {number}  — dollar P&L
 *   showIcon {bool}   — show trend icon (default true)
 *   size    {'sm'|'md'|'lg'}
 *   className
 */
export function PnlBadge({ value = 0, showIcon = true, size = 'md', className }) {
  const pos      = value > 0;
  const neg      = value < 0;
  const Icon     = pos ? TrendingUp : neg ? TrendingDown : Minus;
  const colorCls = pos ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
                 : neg ? 'text-rose-400    bg-rose-500/10    border-rose-500/20'
                 :       'text-white/40    bg-white/5        border-white/10';

  const sizeCls = size === 'sm' ? 'text-[11px] px-1.5 py-0.5 gap-1'
                : size === 'lg' ? 'text-base   px-3    py-1   gap-1.5'
                :                 'text-xs     px-2    py-0.5 gap-1';

  const abs = Math.abs(value);
  const formatted = abs >= 10000
    ? `$${(abs / 1000).toFixed(1)}k`
    : `$${abs.toFixed(2)}`;

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border font-mono font-semibold',
        'font-variant-numeric tabular-nums',
        colorCls,
        sizeCls,
        className,
      )}
      style={{ fontVariantNumeric: 'tabular-nums' }}
    >
      {showIcon && <Icon className="w-3 h-3 flex-shrink-0" />}
      {pos ? '+' : neg ? '-' : ''}{formatted}
    </span>
  );
}

/**
 * DirectionBadge — Long / Short indicator.
 */
export function DirectionBadge({ direction, size = 'sm', className }) {
  const isLong = direction === 'long';
  const Icon   = isLong ? TrendingUp : TrendingDown;
  const cls    = isLong
    ? 'text-emerald-400 bg-emerald-500/12 border-emerald-500/20'
    : 'text-rose-400    bg-rose-500/12    border-rose-500/20';

  const sizeCls = size === 'xs' ? 'text-[9px]  px-1.5 py-0.5 gap-0.5'
                : size === 'sm' ? 'text-[11px] px-2   py-0.5 gap-1'
                :                 'text-xs     px-2.5 py-1   gap-1';

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-md border font-semibold uppercase tracking-wide',
        cls, sizeCls, className,
      )}
    >
      <Icon className="w-2.5 h-2.5 flex-shrink-0" />
      {direction}
    </span>
  );
}

/**
 * RMultipleBadge — e.g. "+2.3R"
 */
export function RMultipleBadge({ value, className }) {
  if (value == null) return null;
  const num  = parseFloat(value);
  const pos  = num >= 0;
  const cls  = num >= 1.5 ? 'text-purple-400 bg-purple-500/10 border-purple-500/20'
             : num >= 0   ? 'text-amber-400  bg-amber-500/10  border-amber-500/20'
             :              'text-rose-400   bg-rose-500/10   border-rose-500/20';
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border text-[10px] font-mono font-semibold px-1.5 py-0.5',
        cls, className,
      )}
      style={{ fontVariantNumeric: 'tabular-nums' }}
    >
      {pos ? '+' : ''}{num.toFixed(1)}R
    </span>
  );
}

/**
 * EmotionBadge
 */
const EMOTION_CFG = {
  confident:  { color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20', dot: 'bg-emerald-400' },
  disciplined:{ color: 'text-blue-400    bg-blue-500/10    border-blue-500/20',    dot: 'bg-blue-400'    },
  neutral:    { color: 'text-white/40    bg-white/5        border-white/10',        dot: 'bg-white/40'   },
  nervous:    { color: 'text-amber-400   bg-amber-500/10   border-amber-500/20',   dot: 'bg-amber-400'   },
  fomo:       { color: 'text-orange-400  bg-orange-500/10  border-orange-500/20',  dot: 'bg-orange-400'  },
  revenge:    { color: 'text-rose-400    bg-rose-500/10    border-rose-500/20',    dot: 'bg-rose-400'    },
};

export function EmotionBadge({ emotion, className }) {
  if (!emotion) return null;
  const cfg = EMOTION_CFG[emotion] ?? EMOTION_CFG.neutral;
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full border text-[10px] font-medium capitalize',
        cfg.color, className,
      )}
    >
      <span className={cn('w-1.5 h-1.5 rounded-full flex-shrink-0', cfg.dot)} />
      {emotion}
    </span>
  );
}

/**
 * SetupBadge
 */
export function SetupBadge({ setup, className }) {
  if (!setup) return null;
  return (
    <span
      className={cn(
        'inline-flex items-center px-1.5 py-0.5 rounded-md border text-[10px] font-medium',
        'text-white/55 bg-white/4 border-white/8',
        className,
      )}
    >
      {setup}
    </span>
  );
}


