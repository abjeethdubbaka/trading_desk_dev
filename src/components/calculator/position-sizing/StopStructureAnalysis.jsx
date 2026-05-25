import React from 'react';
import { AlertTriangle, CheckCircle2, XCircle, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

// Gauge spans 0–10%. Segment boundaries in pct-of-price:
const TOO_TIGHT_END   = 0.4;
const TIGHT_WARN_END  = 0.75;
const VALID_END       = 4.0;
const WIDE_WARN_END   = 6.0;
const GAUGE_MAX       = 10.0;

// Pixel-gauge segment widths as % of the bar (based on GAUGE_MAX)
const SEG = [
  { end: TOO_TIGHT_END,  cls: 'bg-rose-500/50' },
  { end: TIGHT_WARN_END, cls: 'bg-amber-400/40' },
  { end: VALID_END,      cls: 'bg-emerald-500/40' },
  { end: WIDE_WARN_END,  cls: 'bg-amber-400/40' },
  { end: GAUGE_MAX,      cls: 'bg-rose-500/50' },
].reduce((acc, seg, i, arr) => {
  const prev = i === 0 ? 0 : arr[i - 1].end;
  acc.push({ ...seg, width: ((seg.end - prev) / GAUGE_MAX) * 100 });
  return acc;
}, []);

function classify(riskPct) {
  if (riskPct < TOO_TIGHT_END)  return 'too_tight';
  if (riskPct < TIGHT_WARN_END) return 'tight_warn';
  if (riskPct <= VALID_END)     return 'valid';
  if (riskPct <= WIDE_WARN_END) return 'wide_warn';
  return 'too_wide';
}

const STATUS_META = {
  too_tight: {
    icon: XCircle,
    label: 'Stop Too Tight',
    color: 'text-rose-400',
    border: 'border-rose-500/25',
    bg: 'from-rose-500/8',
    getMessage: (riskPct) =>
      `${riskPct.toFixed(2)}% risk is inside typical candle noise (0.4–0.75%). Random fluctuations will stop you out even when direction is correct.`,
    suggestion: 'Place the stop beyond a real structure level — a swing high/low, VWAP reclaim, or liquidity zone — where your thesis is objectively wrong.',
    causes: ['Trying to maximize share size', 'Unrealistic precision entry', 'Stop inside bid/ask spread or liquidity zone', 'Ignoring volatility and candle range'],
  },
  tight_warn: {
    icon: AlertTriangle,
    label: 'Tight — Watch Noise',
    color: 'text-amber-400',
    border: 'border-amber-500/25',
    bg: 'from-amber-500/6',
    getMessage: (riskPct) =>
      `${riskPct.toFixed(2)}% is borderline. Small spreads or wicks near your level could trigger invalidation before the move develops.`,
    suggestion: 'Verify entry precision. Confirm the stop is past any liquidity sweep zone, not just at a round number.',
    causes: [],
  },
  valid: {
    icon: CheckCircle2,
    label: 'Structure Valid',
    color: 'text-emerald-400',
    border: 'border-emerald-500/20',
    bg: 'from-emerald-500/6',
    getMessage: (riskPct) =>
      `${riskPct.toFixed(2)}% stop is in the tradeable zone — outside noise but not so wide that asymmetry breaks down.`,
    suggestion: 'Confirm the 2R+ target is reachable before the next key structure level. Good risk placement is necessary but not sufficient.',
    causes: [],
  },
  wide_warn: {
    icon: AlertTriangle,
    label: 'Wide — Asymmetry Challenged',
    color: 'text-amber-400',
    border: 'border-amber-500/25',
    bg: 'from-amber-500/6',
    getMessage: (riskPct, reward2R) =>
      `${riskPct.toFixed(2)}% risk requires a $${reward2R.toFixed(2)} move for 2R. Verify enough room exists before the next structural resistance.`,
    suggestion: 'Check the chart: is there open space for 2× your stop distance before the next major level? If not, this trade lacks asymmetry.',
    causes: [],
  },
  too_wide: {
    icon: XCircle,
    label: 'Stop Too Wide',
    color: 'text-rose-400',
    border: 'border-rose-500/25',
    bg: 'from-rose-500/8',
    getMessage: (riskPct, reward2R) =>
      `${riskPct.toFixed(2)}% risk requires a $${reward2R.toFixed(2)} (${(riskPct * 2).toFixed(1)}%) move for 2R — typically unrealistic intraday.`,
    suggestion: 'Look for an entry closer to your invalidation level, or wait for price to come to structure before committing.',
    causes: ['Chasing after a big move', 'Entering far from structure', 'No clear nearby invalidation level', 'Emotional entry after missing the ideal point'],
  },
};

export function StopStructureAnalysis({ entryPrice, stopLoss }) {
  const entry = Number(entryPrice);
  const stop  = Number(stopLoss);

  if (!Number.isFinite(entry) || !Number.isFinite(stop) || entry <= 0 || stop <= 0 || entry === stop) {
    return null;
  }

  const riskAmt   = Math.abs(entry - stop);
  const riskPct   = (riskAmt / entry) * 100;
  const reward2R  = riskAmt * 2;
  const direction = stop > entry ? 'SHORT' : 'LONG';
  const gaugePos  = Math.min(100, (riskPct / GAUGE_MAX) * 100);
  const status    = classify(riskPct);
  const meta      = STATUS_META[status];
  const Icon      = meta.icon;
  const message   = meta.getMessage(riskPct, reward2R);

  return (
    <div className={cn(
      'rounded-xl border p-4 bg-gradient-to-br to-transparent',
      meta.border, meta.bg,
    )}>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-white/80">Stop Structure</span>
          <span className={cn('text-[10px] uppercase tracking-widest font-semibold px-1.5 py-0.5 rounded-full border', meta.color,
            status === 'valid' ? 'border-emerald-500/30 bg-emerald-500/10' :
            status.includes('warn') ? 'border-amber-500/30 bg-amber-500/10' :
            'border-rose-500/30 bg-rose-500/10'
          )}>
            {meta.label}
          </span>
        </div>
        <span className={cn('text-[10px] font-mono font-semibold px-2 py-0.5 rounded border border-white/10 bg-white/5', meta.color)}>
          {direction}
        </span>
      </div>

      {/* Quick metrics */}
      <div className="flex items-center gap-4 mb-3 flex-wrap">
        <div>
          <p className="text-[9px] uppercase tracking-widest text-white/35">Risk / share</p>
          <p className={cn('text-sm font-bold font-mono', meta.color)}>${riskAmt.toFixed(2)}</p>
        </div>
        <div>
          <p className="text-[9px] uppercase tracking-widest text-white/35">Risk %</p>
          <p className={cn('text-sm font-bold font-mono', meta.color)}>{riskPct.toFixed(2)}%</p>
        </div>
        <div>
          <p className="text-[9px] uppercase tracking-widest text-white/35">2R needs</p>
          <p className="text-sm font-bold font-mono text-white/60">${reward2R.toFixed(2)}</p>
        </div>
        <div>
          <p className="text-[9px] uppercase tracking-widest text-white/35">Noise floor ~</p>
          <p className="text-sm font-bold font-mono text-white/40">${Math.max(0.05, entry * 0.005).toFixed(2)}</p>
        </div>
      </div>

      {/* Gauge */}
      <div className="mb-3">
        <div className="relative h-2.5 flex rounded-full overflow-hidden border border-white/10">
          {SEG.map((s, i) => (
            <div key={i} style={{ width: `${s.width}%` }} className={s.cls} />
          ))}
          {/* Marker */}
          <div
            className="absolute top-0 bottom-0 w-[2px] bg-white shadow-[0_0_6px_rgba(255,255,255,0.8)]"
            style={{ left: `${Math.min(98.5, Math.max(1.5, gaugePos))}%` }}
          />
        </div>
        <div className="flex justify-between mt-0.5 text-[8px] text-white/30 font-mono">
          <span>0%</span>
          <span>{TOO_TIGHT_END}%</span>
          <span>{TIGHT_WARN_END}%</span>
          <span>{VALID_END}%</span>
          <span>{WIDE_WARN_END}%</span>
          <span>{GAUGE_MAX}%+</span>
        </div>
        <div className="flex text-[8px] text-white/25 mt-0.5">
          <span style={{ width: `${SEG[0].width}%` }} className="text-center">tight</span>
          <span style={{ width: `${SEG[1].width + SEG[2].width}%` }} className="text-center">valid</span>
          <span style={{ width: `${SEG[3].width + SEG[4].width}%` }} className="text-center">wide</span>
        </div>
      </div>

      {/* Insight */}
      <div className="space-y-1.5">
        <div className="flex items-start gap-1.5">
          <Icon className={cn('w-3.5 h-3.5 mt-0.5 flex-shrink-0', meta.color)} />
          <p className="text-[11px] text-white/70 leading-relaxed">{message}</p>
        </div>
        {meta.suggestion && (
          <div className="flex items-start gap-1.5">
            <ChevronRight className="w-3 h-3 mt-0.5 flex-shrink-0 text-white/30" />
            <p className="text-[10px] text-white/45 leading-relaxed italic">{meta.suggestion}</p>
          </div>
        )}
        {meta.causes.length > 0 && (
          <div className="mt-1.5 flex flex-wrap gap-1">
            {meta.causes.map((c) => (
              <span key={c} className="text-[9px] px-1.5 py-0.5 rounded border border-white/8 bg-white/[0.03] text-white/35">
                {c}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
