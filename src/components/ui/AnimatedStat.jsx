import React, { useEffect, useRef, useState, useCallback } from 'react';
import { cn } from '@/lib/utils';

/**
 * AnimatedStat — renders a number with a count-up animation whenever the value changes.
 *
 * Props:
 *   value        {number}  — the target numeric value
 *   format       {fn}      — (n: number) => string  (default: n.toFixed(2))
 *   duration     {number}  — animation ms (default: 600)
 *   className    {string}
 *   colorize     {bool}    — apply green/red class based on sign (default: true)
 *   prefix       {string}  — e.g. '$'
 *   suffix       {string}  — e.g. '%'
 */
export default function AnimatedStat({
  value = 0,
  format,
  duration = 600,
  className,
  colorize = true,
  prefix = '',
  suffix = '',
}) {
  const [display, setDisplay]   = useState(value);
  const [flashing, setFlashing] = useState(false);
  const prevRef  = useRef(value);
  const rafRef   = useRef(null);
  const startRef = useRef(null);

  const easeOut = (t) => 1 - Math.pow(1 - t, 3);

  const animate = useCallback((from, to) => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    startRef.current = null;

    const tick = (ts) => {
      if (!startRef.current) startRef.current = ts;
      const elapsed = ts - startRef.current;
      const progress = Math.min(elapsed / duration, 1);
      const current  = from + (to - from) * easeOut(progress);
      setDisplay(current);
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        setDisplay(to);
      }
    };
    rafRef.current = requestAnimationFrame(tick);
  }, [duration]);

  useEffect(() => {
    const prev = prevRef.current;
    if (prev !== value) {
      setFlashing(true);
      animate(prev, value);
      prevRef.current = value;
      const t = setTimeout(() => setFlashing(false), 400);
      return () => clearTimeout(t);
    }
  }, [value, animate]);

  useEffect(() => () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); }, []);

  const defaultFormat = (n) => {
    if (Math.abs(n) >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
    if (Math.abs(n) >= 10_000)    return `${Math.round(n).toLocaleString()}`;
    return n.toFixed(2);
  };
  const formatted = (format ?? defaultFormat)(display);

  const colorClass = colorize
    ? value > 0 ? 'text-emerald-400' : value < 0 ? 'text-rose-400' : 'text-white/70'
    : '';

  return (
    <span
      className={cn(
        'font-mono transition-opacity duration-200',
        flashing && 'opacity-75',
        colorClass,
        className,
      )}
      style={{ fontVariantNumeric: 'tabular-nums' }}
    >
      {prefix}{formatted}{suffix}
    </span>
  );
}

/**
 * MiniSparkline — tiny 8-bar history chart.
 * bars: number[]  — recent daily P&L values (newest last)
 */
export function MiniSparkline({ bars = [], height = 20, className }) {
  if (!bars.length) return null;
  const max = Math.max(...bars.map(Math.abs), 1);
  return (
    <svg
      width={bars.length * 5 + (bars.length - 1) * 2}
      height={height}
      className={cn('overflow-visible', className)}
      aria-hidden="true"
    >
      {bars.map((v, i) => {
        const barH  = Math.max(2, (Math.abs(v) / max) * height);
        const y     = height - barH;
        const color = v >= 0 ? '#10b981' : '#f43f5e';
        const opacity = 0.5 + (i / bars.length) * 0.5;
        return (
          <rect
            key={i}
            x={i * 7}
            y={y}
            width={5}
            height={barH}
            rx={1.5}
            fill={color}
            opacity={opacity}
          />
        );
      })}
    </svg>
  );
}

/**
 * TrendArrow — shows ▲ or ▼ with a percentage delta
 */
export function TrendArrow({ delta, className }) {
  if (delta == null) return null;
  const pos   = delta >= 0;
  const arrow = pos ? '▲' : '▼';
  const abs   = Math.abs(delta).toFixed(1);
  return (
    <span
      className={cn(
        'inline-flex items-center gap-0.5 text-[10px] font-semibold font-mono',
        pos ? 'text-emerald-400/70' : 'text-rose-400/70',
        className,
      )}
    >
      {arrow} {abs}%
    </span>
  );
}