import React, { useEffect } from 'react';
import { X, Edit2 } from 'lucide-react';
import { cn } from '@/lib/utils/general';
import { PnlBadge, DirectionBadge, RMultipleBadge, EmotionBadge, SetupBadge } from '@/components/ui/TradeBadge';
import { getTradePnL } from '@/lib/utils/tradeFields';
import { formatDate, formatTime, formatCurrency } from './utils/formatters';
import { getTradeNotesText } from './utils/notes';
import { TagChip } from './components/TagChip';

function DetailRow({ label, children }) {
  return (
    <div className="grid grid-cols-[96px_1fr] gap-2 py-1.5 border-b border-white/[0.04] last:border-0">
      <span className="text-[11px] text-white/40 self-start pt-0.5">{label}</span>
      <div className="text-[13px] text-white/85">{children}</div>
    </div>
  );
}

export function TradeDetailDrawer({ trade, onClose, onEdit }) {
  // Close on Escape
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  if (!trade) return null;

  const pnl = getTradePnL(trade);
  const entryPrice = trade.entry_price || 0;
  const exitPrice = trade.exit_price || 0;
  const positionSize = trade.position_size || 0;
  const notes = getTradeNotesText(trade);
  const tags = Array.isArray(trade.tags) ? trade.tags.filter(Boolean) : [];
  const emotions = Array.isArray(trade.emotions)
    ? trade.emotions.filter(Boolean)
    : trade.emotions ? [trade.emotions] : [];
  const mistakes = Array.isArray(trade.mistakes)
    ? trade.mistakes.filter(Boolean)
    : trade.mistakes ? [trade.mistakes] : [];
  const pnlPct = entryPrice && positionSize
    ? ((pnl / (entryPrice * positionSize)) * 100).toFixed(1)
    : null;
  const qualityScore = Number(trade?.setup_quality_score);
  const hasQuality = Number.isFinite(qualityScore);

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      <div className="fixed right-0 top-0 bottom-0 z-50 flex w-full max-w-sm flex-col border-l border-white/10 bg-[#111827] shadow-2xl">
        {/* Header */}
        <div className="flex flex-shrink-0 items-center justify-between border-b border-white/10 px-4 py-3">
          <div className="flex min-w-0 items-center gap-2">
            <span className="truncate text-lg font-bold text-white">{trade.symbol || '--'}</span>
            <DirectionBadge direction={trade.direction} size="xs" />
          </div>
          <div className="flex flex-shrink-0 items-center gap-1.5">
            <button
              onClick={onEdit}
              className="flex items-center gap-1.5 rounded-md border border-white/15 bg-white/[0.04] px-2.5 py-1 text-[12px] text-white/75 transition-colors hover:bg-white/10 hover:text-white"
            >
              <Edit2 className="h-3 w-3" />
              Edit
            </button>
            <button
              onClick={onClose}
              className="rounded p-1.5 text-white/40 transition-colors hover:bg-white/8 hover:text-white/80"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 space-y-4 overflow-y-auto px-4 py-3">
          {/* Timestamp */}
          <p className="text-[11px] text-white/40">
            {formatDate(trade.entry_time || trade.created_date)}
            {trade.entry_time && <span className="ml-2">{formatTime(trade.entry_time)}</span>}
            {trade.exit_time && <span className="ml-1 text-white/25">→ {formatTime(trade.exit_time)}</span>}
          </p>

          {/* P&L summary */}
          <div className="flex items-center gap-3 rounded-xl border border-white/8 bg-white/[0.03] p-3">
            <PnlBadge value={pnl} size="lg" />
            {pnlPct && (
              <span className={cn('font-mono text-[12px]', pnl >= 0 ? 'text-emerald-400/60' : 'text-rose-400/60')}>
                {pnl >= 0 ? '+' : ''}{pnlPct}%
              </span>
            )}
            <RMultipleBadge value={trade.r_multiple} />
          </div>

          {/* Trade details grid */}
          <div>
            <DetailRow label="Entry">{formatCurrency(entryPrice)}</DetailRow>
            <DetailRow label="Exit">{exitPrice ? formatCurrency(exitPrice) : '—'}</DetailRow>
            <DetailRow label="Size">{positionSize || '—'}</DetailRow>
            {trade.stop_loss != null && (
              <DetailRow label="Stop loss">{formatCurrency(trade.stop_loss)}</DetailRow>
            )}
            {trade.take_profit != null && (
              <DetailRow label="Take profit">{formatCurrency(trade.take_profit)}</DetailRow>
            )}
            {trade.setup_type && (
              <DetailRow label="Setup"><SetupBadge setup={trade.setup_type} /></DetailRow>
            )}
            {(hasQuality || trade.setup_grade) && (
              <DetailRow label="Quality">
                <span className="rounded border border-blue-500/20 bg-blue-500/10 px-1.5 py-0.5 text-[12px] text-blue-300/70">
                  {hasQuality ? Math.round(qualityScore) : ''}
                  {trade.setup_grade ? ` ${trade.setup_grade}` : ''}
                </span>
              </DetailRow>
            )}
            {trade.followed_plan !== null && trade.followed_plan !== undefined && (
              <DetailRow label="Plan">
                <span className={cn(
                  'rounded border px-1.5 py-0.5 text-[12px]',
                  trade.followed_plan
                    ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-300'
                    : 'border-rose-500/20 bg-rose-500/10 text-rose-300'
                )}>
                  {trade.followed_plan ? 'Followed' : 'Violated'}
                </span>
              </DetailRow>
            )}
            {emotions.length > 0 && (
              <DetailRow label="Emotions">
                <div className="flex flex-wrap gap-1">
                  {emotions.map((e) => <EmotionBadge key={e} emotion={e} />)}
                </div>
              </DetailRow>
            )}
          </div>

          {tags.length > 0 && (
            <div>
              <p className="mb-1.5 text-[10px] uppercase tracking-[0.16em] text-white/35">Tags</p>
              <div className="flex flex-wrap gap-1">
                {tags.map((name) => <TagChip key={name} name={name} size="xs" />)}
              </div>
            </div>
          )}

          {notes && (
            <div>
              <p className="mb-1.5 text-[10px] uppercase tracking-[0.16em] text-white/35">Notes</p>
              <p className="whitespace-pre-wrap break-words text-[13px] leading-relaxed text-white/70">{notes}</p>
            </div>
          )}

          {mistakes.length > 0 && (
            <div>
              <p className="mb-1.5 text-[10px] uppercase tracking-[0.16em] text-white/35">Mistakes</p>
              <div className="flex flex-wrap gap-1">
                {mistakes.map((m, i) => (
                  <span key={i} className="rounded border border-amber-500/15 bg-amber-500/8 px-1.5 py-0.5 text-[11px] text-amber-300/70">
                    {m}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
