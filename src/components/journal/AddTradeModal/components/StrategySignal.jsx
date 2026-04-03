import React from 'react';
import { AlertTriangle, Ban, CheckCircle2, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

const STATUS_META = {
  approved: {
    title: 'Strategy signal: Approved',
    icon: CheckCircle2,
    border: 'border-emerald-400/30',
    bg: 'bg-emerald-500/10',
    titleColor: 'text-emerald-200',
    bodyColor: 'text-emerald-100/90',
  },
  caution: {
    title: 'Strategy signal: Caution',
    icon: AlertTriangle,
    border: 'border-amber-400/30',
    bg: 'bg-amber-500/10',
    titleColor: 'text-amber-200',
    bodyColor: 'text-amber-100/90',
  },
  avoid: {
    title: 'Strategy signal: Avoid',
    icon: Ban,
    border: 'border-rose-400/30',
    bg: 'bg-rose-500/10',
    titleColor: 'text-rose-200',
    bodyColor: 'text-rose-100/90',
  },
  developing: {
    title: 'Strategy signal: Developing',
    icon: Sparkles,
    border: 'border-sky-400/30',
    bg: 'bg-sky-500/10',
    titleColor: 'text-sky-200',
    bodyColor: 'text-sky-100/90',
  },
  unknown: {
    title: 'Strategy signal: No history',
    icon: Sparkles,
    border: 'border-white/20',
    bg: 'bg-white/5',
    titleColor: 'text-white',
    bodyColor: 'text-white/75',
  },
};

const formatMoney = (value) => {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return '--';
  const sign = numeric > 0 ? '+' : numeric < 0 ? '-' : '';
  return `${sign}$${Math.abs(numeric).toFixed(0)}`;
};

const formatProfitFactor = (value) => {
  if (value === Infinity) return 'inf';
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric.toFixed(2) : '--';
};

export default function StrategySignal({ recommendation, recommendedNow = [] }) {
  if (!recommendation) return null;

  const meta = STATUS_META[recommendation.status] || STATUS_META.unknown;
  const Icon = meta.icon;
  const metrics = recommendation?.metrics;

  return (
    <div className={cn('rounded-lg border px-3 py-2.5', meta.border, meta.bg)}>
      <div className="flex items-start gap-2">
        <Icon className={cn('mt-0.5 h-4 w-4 flex-shrink-0', meta.titleColor)} />
        <div className="min-w-0">
          <p className={cn('text-xs font-semibold', meta.titleColor)}>
            {meta.title}
          </p>
          <p className={cn('mt-0.5 text-xs', meta.bodyColor)}>
            {recommendation.title}
          </p>
          <p className={cn('mt-0.5 text-[11px]', meta.bodyColor)}>
            {recommendation.message}
          </p>
          {recommendation.contextMessage && (
            <p className={cn('mt-1 text-[11px]', meta.bodyColor)}>
              {recommendation.contextMessage}
            </p>
          )}
          {metrics && (
            <p className={cn('mt-1.5 text-[10px]', meta.bodyColor)}>
              {metrics.trades} trades | Exp {formatMoney(metrics.expectancy)} | {metrics.winRate.toFixed(0)}% W | PF {formatProfitFactor(metrics.profitFactor)} | {metrics.confidence}% confidence
            </p>
          )}
        </div>
      </div>

      {recommendedNow.length > 0 && (
        <div className="mt-2 border-t border-white/10 pt-2">
          <p className={cn('text-[10px] uppercase tracking-[0.12em]', meta.bodyColor)}>
            Top now
          </p>
          <p className={cn('mt-0.5 text-[11px]', meta.bodyColor)}>
            {recommendedNow.map((item) => item.setup).join(' | ')}
          </p>
        </div>
      )}
    </div>
  );
}

