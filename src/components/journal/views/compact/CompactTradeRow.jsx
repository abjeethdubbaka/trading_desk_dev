import React, { useCallback, useRef, useState } from 'react';
import { cn } from '@/lib/utils/general';
import { formatDate, formatTime, formatCurrency } from '../../utils/formatters';
import { getTradeNotesText } from '../../utils/notes';
import { Image, AlertCircle, ChevronDown, Edit2, Star, Trash2 } from 'lucide-react';
import { PnlBadge, DirectionBadge, RMultipleBadge, EmotionBadge, SetupBadge } from '@/components/ui/TradeBadge';
import TradeReviewPanel from '../../analysis/TradeReviewPanel';
import { TradeThumbnail } from './TradeThumbnail';
import { TagChip } from '../../components/TagChip';
import { EditableCell } from '../cells/EditableCell';
import { useInlineTradeEdit } from '../../hooks/useInlineTradeEdit';
import { getTradePnL } from '@/lib/utils/tradeFields';
import { getTradeHoldDurationMinutes, formatHoldDuration } from '@/lib/calculations/trades';
import { TradeCompleteness } from '../../components/TradeCompleteness';
import { useQueryClient } from '@tanstack/react-query';
import { tradeKeys } from '@/lib/hooks/useTrades/queryKeys';

const DIRECTION_OPTIONS = [
  { value: 'long', label: 'Long' },
  { value: 'short', label: 'Short' },
];

export function CompactTradeRow({
  trade,
  onEdit,
  onDelete,
  onInlineUpdateTrade,
  onViewDetails,
  onTagClick,
  columns,
  review,
  reviewLoading,
  onReviewTrade,
  onClearReview,
  reviewUsefulness,
  onRateReviewUsefulness,
  screenshotUrls,
  screenshotStatuses,
  onOpenImage,
  index,
  isSelected,
  onToggleSelect,
}) {
  const [expanded, setExpanded] = useState(false);
  const [reviewOpen, setReviewOpen] = useState(false);
  const cleanedTradeNotes = getTradeNotesText(trade);

  const { savingField, editField } = useInlineTradeEdit({ trade, onInlineUpdateTrade });

  // Pre-warm React Query detail cache on hover so drawer opens with data ready
  const queryClient = useQueryClient();
  const hoverTimer = useRef(null);
  const handleMouseEnter = useCallback(() => {
    hoverTimer.current = setTimeout(() => {
      queryClient.setQueryData(tradeKeys.detail(trade.id), trade);
    }, 300);
  }, [queryClient, trade]);
  const handleMouseLeave = useCallback(() => {
    clearTimeout(hoverTimer.current);
  }, []);

  const pnl = getTradePnL(trade);
  const entryPrice = trade.entry_price || 0;
  const exitPrice = trade.exit_price || 0;
  const positionSize = trade.position_size || 0;
  const screenshots = trade.screenshots || [];
  const tags = Array.isArray(trade.tags) ? trade.tags.filter(Boolean) : [];
  const emotionList = Array.isArray(trade.emotions)
    ? trade.emotions.filter(Boolean)
    : (trade.emotions ? [trade.emotions] : []);
  const primaryEmotion = emotionList[0] || null;
  const entryTimeLabel = trade.entry_time ? formatTime(trade.entry_time) : '--';
  const exitTimeLabel = trade.exit_time ? formatTime(trade.exit_time) : '--';
  const pnlPct = entryPrice && positionSize
    ? ((pnl / (entryPrice * positionSize)) * 100).toFixed(1)
    : null;

  return (
    <div
      className={cn(
        'group border-b border-white/[0.04] last:border-0',
        'transition-colors duration-150',
        isSelected ? 'bg-cyan-500/[0.06]' : 'hover:bg-white/[0.02]',
        'animate-fade-in',
      )}
      style={{ animationDelay: `${Math.min(index * 20, 200)}ms` }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div
        className="flex items-center gap-0 px-3 py-2.5 cursor-pointer"
        onClick={() => onViewDetails?.(trade)}
      >
        {/* Checkbox — stop propagation so clicking it doesn't open drawer */}
        {onToggleSelect && (
          <div className="w-6 flex-shrink-0 mr-1" onClick={(e) => e.stopPropagation()}>
            <input
              type="checkbox"
              checked={Boolean(isSelected)}
              onChange={() => onToggleSelect(trade.id)}
              className="w-3 h-3 rounded accent-cyan-500 cursor-pointer"
            />
          </div>
        )}

        {/* Chevron toggles inline notes expand without opening the drawer */}
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); setExpanded((v) => !v); }}
          className="mr-2 flex-shrink-0 rounded p-0.5 text-white/20 hover:text-white/50 transition-colors"
        >
          <ChevronDown className={cn('w-3 h-3 transition-transform duration-200', expanded && 'rotate-180')} />
        </button>

        {/* Date / Time / Duration */}
        <div className="w-[82px] flex-shrink-0">
          <div className="leading-tight">
            <span className="block text-[11px] text-white/40 font-mono">
              {formatDate(trade.entry_time || trade.created_date)}
            </span>
            <span className="block text-[9px] text-white/30 font-mono">
              {entryTimeLabel} | {exitTimeLabel}
            </span>
            <span className="block text-[9px] text-white/25 font-mono">
              {formatHoldDuration(getTradeHoldDurationMinutes(trade))}
            </span>
          </div>
        </div>

        {/* Symbol + Direction (direction is editable) */}
        <div className="w-[110px] flex-shrink-0 flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
          <span className="font-semibold text-[13px] text-white tracking-wide">
            {trade.symbol || '-'}
          </span>
          <EditableCell
            value={trade.direction}
            displayNode={<DirectionBadge direction={trade.direction} size="xs" />}
            type="select"
            options={DIRECTION_OPTIONS}
            onSave={(v) => editField('direction', v)}
            loading={savingField === 'direction'}
          />
        </div>

        {/* Entry → Exit (exit_price is editable) */}
        <div className="w-[145px] flex-shrink-0 hidden sm:block" onClick={(e) => e.stopPropagation()}>
          <span className="text-[11px] font-mono text-white/50">
            {formatCurrency(entryPrice)}
            {exitPrice ? (
              <span className="text-white/25"> →{' '}
                <EditableCell
                  value={exitPrice}
                  displayNode={<span className="text-white/50">{formatCurrency(exitPrice)}</span>}
                  type="number"
                  onSave={(v) => editField('exit_price', v)}
                  loading={savingField === 'exit_price'}
                  validate={(v) => v > 0 ? null : 'Must be positive'}
                />
              </span>
            ) : null}
          </span>
        </div>

        {/* Size */}
        <div className="w-[58px] flex-shrink-0 hidden md:block">
          <span className="text-[11px] font-mono text-white/40">{positionSize || '-'}</span>
        </div>

        {/* P&L */}
        <div className="w-[150px] flex-shrink-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <PnlBadge value={pnl} size="sm" />
            {pnlPct && (
              <span className={cn('text-[10px] font-mono', pnl >= 0 ? 'text-emerald-400/50' : 'text-rose-400/50')}>
                {pnl >= 0 ? '+' : ''}{pnlPct}%
              </span>
            )}
          </div>
        </div>

        {/* R */}
        <div className="w-[52px] flex-shrink-0 hidden lg:block">
          <RMultipleBadge value={trade.r_multiple} />
        </div>

        {/* Setup (editable) */}
        <div className={cn('w-[110px] flex-shrink-0', columns?.setup ? 'hidden xl:block' : 'hidden')} onClick={(e) => e.stopPropagation()}>
          <EditableCell
            value={trade.setup_type ?? ''}
            displayNode={<SetupBadge setup={trade.setup_type} />}
            type="text"
            onSave={(v) => editField('setup_type', v)}
            loading={savingField === 'setup_type'}
          />
        </div>

        {/* Tags */}
        <div className="flex items-center gap-1 flex-wrap mx-2 flex-shrink-0 min-w-0" onClick={(e) => e.stopPropagation()}>
          {tags.length > 0 ? (
            tags.map((name) => (
              <TagChip key={name} name={name} size="xs" onClick={onTagClick} />
            ))
          ) : (
            <span className="text-[10px] text-white/25">-</span>
          )}
        </div>

        {/* Exit Reason */}
        <div className={cn('w-[110px] flex-shrink-0', columns?.exitReason ? 'hidden xl:block' : 'hidden')}>
          <span className="text-[10px] text-white/40 truncate">{trade.exit_reason || '-'}</span>
        </div>

        {/* Stop Loss Reason */}
        <div className={cn('w-[120px] flex-shrink-0', columns?.stopLossReason ? 'hidden xl:block' : 'hidden')}>
          <span className="text-[10px] text-white/40 truncate">{trade.stop_loss_reason || '-'}</span>
        </div>

        {/* Market Environment */}
        <div className={cn('w-[120px] flex-shrink-0', columns?.marketEnvironment ? 'hidden xl:block' : 'hidden')}>
          <span className="text-[10px] text-white/40 truncate">{trade.market_condition || '-'}</span>
        </div>

        {/* Emotions */}
        <div className={cn('w-[120px] flex-shrink-0', columns?.emotions ? 'hidden xl:block' : 'hidden')}>
          <div className="flex items-center gap-1">
            {primaryEmotion ? (
              <EmotionBadge emotion={primaryEmotion} />
            ) : (
              <span className="text-[10px] text-white/25">-</span>
            )}
            {emotionList.length > 1 ? (
              <span className="text-[10px] text-white/35">+{emotionList.length - 1}</span>
            ) : null}
          </div>
        </div>

        {/* Overall Rating */}
        <div className={cn('w-[90px] flex-shrink-0', columns?.overallRating ? 'hidden xl:block' : 'hidden')}>
          {trade.overall_rating ? (
            <div className="flex items-center gap-0.5">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={cn(
                    'w-2.5 h-2.5',
                    Number(trade.overall_rating) >= star ? 'fill-amber-400 text-amber-400' : 'text-white/15'
                  )}
                />
              ))}
            </div>
          ) : (
            <span className="text-[10px] text-white/25">-</span>
          )}
        </div>

        {/* Screenshots */}
        <div className="flex items-center gap-1.5 mx-2 flex-shrink-0 min-w-0" onClick={(e) => e.stopPropagation()}>
          {screenshots.slice(0, 2).map((id, i) => (
            <TradeThumbnail
              key={id ?? i}
              index={i}
              url={screenshotUrls?.[id]}
              status={screenshotStatuses?.[id] || 'loading'}
              onView={onOpenImage}
            />
          ))}
          {screenshots.length > 2 && (
            <span className="text-[10px] text-white/25 font-mono">+{screenshots.length - 2}</span>
          )}
          {!screenshots.length && (
            <Image className="w-3.5 h-3.5 text-white/12" />
          )}
        </div>

        {/* Completeness */}
        <div className="hidden lg:flex items-center w-[60px] flex-shrink-0">
          <TradeCompleteness trade={trade} />
        </div>

        {/* Actions */}
        <div
          className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-150 flex-shrink-0"
          onClick={(event) => event.stopPropagation()}
        >
          <button onClick={() => onEdit(trade)} className="p-1.5 rounded text-white/30 hover:text-white/70 hover:bg-white/8 transition-colors" title="Edit">
            <Edit2 className="w-3 h-3" />
          </button>
          <button onClick={() => onDelete(trade)} className="p-1.5 rounded text-white/30 hover:text-rose-400 hover:bg-rose-500/10 transition-colors" title="Delete">
            <Trash2 className="w-3 h-3" />
          </button>
        </div>
      </div>

      {expanded && (
        <div
          className="px-8 pb-3 space-y-2 animate-fade-in border-t border-white/[0.03]"
          onClick={(event) => event.stopPropagation()}
        >
          <p className="text-[11px] text-white/40 leading-relaxed max-w-xl whitespace-pre-wrap break-words">
            {cleanedTradeNotes || 'No notes added.'}
          </p>

          {trade.mistakes?.length > 0 && (
            <div className="flex items-center gap-1.5 flex-wrap">
              <AlertCircle className="w-3 h-3 text-amber-400/60 flex-shrink-0" />
              {(Array.isArray(trade.mistakes) ? trade.mistakes : [trade.mistakes]).map((mistake, i) => (
                <span key={i} className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/8 border border-amber-500/15 text-amber-300/60">
                  {mistake}
                </span>
              ))}
            </div>
          )}

          <TradeReviewPanel
            trade={trade}
            review={review}
            isLoading={Boolean(reviewLoading)}
            onRequest={onReviewTrade}
            isOpen={reviewOpen}
            onToggle={() => setReviewOpen((open) => !open)}
            onClear={onClearReview}
            usefulness={reviewUsefulness}
            onSetUsefulness={onRateReviewUsefulness}
          />
        </div>
      )}
    </div>
  );
}
