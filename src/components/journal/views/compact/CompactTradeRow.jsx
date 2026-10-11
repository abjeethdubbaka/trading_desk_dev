import React, { useCallback, useRef, useState } from 'react';
import { cn } from '@/lib/utils/general';
import { formatTime, formatCurrency } from '../../utils/formatters';
import { Image, AlertCircle, ChevronDown, Edit2, Trash2, NotebookPen } from 'lucide-react';
import { COLUMN_WIDTHS } from './CompactHeader';
import { getGradeLetters } from '@/lib/journal/dayGroups';
import { PnlBadge, DirectionBadge, RMultipleBadge, EmotionBadge, SetupBadge, GradeBadge } from '@/components/ui/TradeBadge';
import { TradeThumbnail } from './TradeThumbnail';
import { EditableCell } from '../cells/EditableCell';
import { useInlineTradeEdit } from '../../hooks/useInlineTradeEdit';
import { getTradePnL } from '@/lib/utils/tradeFields';
import { getTradeHoldDurationMinutes, formatHoldDuration } from '@/lib/calculations/trades';
import { TradeCompleteness } from '../../views/TradeCompleteness';
import { useQueryClient } from '@tanstack/react-query';
import { tradeKeys } from '@/lib/hooks/useTrades/queryKeys';

const DIRECTION_OPTIONS = [
  { value: 'long', label: 'Long' },
  { value: 'short', label: 'Short' },
];

const GRADE_OPTIONS = ['A+', 'A', 'B', 'C', 'D', 'E', 'F'].map((g) => ({ value: g, label: g }));

export function CompactTradeRow({
  trade,
  onEdit,
  onDelete,
  onInlineUpdateTrade,
  onViewDetails,
  columns,
  screenshotUrls,
  screenshotStatuses,
  onOpenImage,
  isSelected,
  onToggleSelect,
  riskLimit = 0,
  // true / false when the page knows; null when it has not been told
  isDebriefed = null,
}) {
  const [expanded, setExpanded] = useState(false);

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
  const exceededRisk = riskLimit > 0 && pnl < 0 && Math.abs(pnl) > riskLimit;
  const entryPrice = trade.entry_price || 0;
  const exitPrice = trade.exit_price || 0;
  const positionSize = trade.position_size || 0;
  const screenshots = trade.screenshots || [];
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
        exceededRisk
          ? 'border-l-[3px] border-l-rose-500 bg-rose-500/[0.12] hover:bg-rose-500/[0.18]'
          : isSelected ? 'bg-cyan-500/[0.06]' : 'hover:bg-white/[0.02]',
        'animate-fade-in',
      )}
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

        {/* Time in, time out, and how long — the day itself is the heading above */}
        <div className={cn(COLUMN_WIDTHS.time, 'flex-shrink-0')}>
          <div className="leading-tight">
            <span className="block font-mono text-[11px] text-white/55">{entryTimeLabel}</span>
            <span className="block font-mono text-[9px] text-white/30">
              → {exitTimeLabel} · {formatHoldDuration(getTradeHoldDurationMinutes(trade))}
            </span>
          </div>
        </div>

        {/* Symbol + Direction (direction is editable) */}
        <div className={cn(COLUMN_WIDTHS.symbol, 'flex flex-shrink-0 items-center gap-1.5')} onClick={(e) => e.stopPropagation()}>
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
        <div className={cn(COLUMN_WIDTHS.prices, 'hidden flex-shrink-0 sm:block')} onClick={(e) => e.stopPropagation()}>
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
        <div className={cn(COLUMN_WIDTHS.size, 'hidden flex-shrink-0 md:block')}>
          <span className="text-[11px] font-mono text-white/40">{positionSize || '-'}</span>
        </div>

        {/* P&L */}
        <div className={cn(COLUMN_WIDTHS.pnl, 'flex-shrink-0', columns?.pnl === false && 'hidden')}>
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
        <div className={cn(COLUMN_WIDTHS.r, 'hidden flex-shrink-0 lg:block')}>
          <RMultipleBadge value={trade.r_multiple} />
        </div>

        {/* Setup (editable) */}
        <div className={cn(COLUMN_WIDTHS.setup, 'flex-shrink-0', columns?.setup ? 'hidden xl:block' : 'hidden')} onClick={(e) => e.stopPropagation()}>
          <EditableCell
            value={trade.setup_type ?? ''}
            displayNode={<SetupBadge setup={trade.setup_type} />}
            type="text"
            onSave={(v) => editField('setup_type', v)}
            loading={savingField === 'setup_type'}
          />
        </div>


        {/* Grades — entry, stop, exit, size as one row of letters. Each letter
            is still a picker; an empty slot shows the slot's initial. */}
        <div className={cn(COLUMN_WIDTHS.grades, 'flex-shrink-0', columns?.grades ? 'hidden xl:block' : 'hidden')} onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center gap-1">
            {getGradeLetters(trade).map((slot) => (
              <EditableCell
                key={slot.key}
                value={slot.grade ?? ''}
                displayNode={slot.grade
                  ? <GradeBadge grade={slot.grade} className="px-1 text-[9px]" title={slot.label} />
                  : <span className="inline-flex h-[18px] w-[18px] items-center justify-center rounded border border-dashed border-white/10 text-[8px] text-white/25" title={`${slot.label}: not graded`}>{slot.short}</span>}
                type="select"
                options={GRADE_OPTIONS}
                onSave={(v) => editField(slot.key, v)}
                loading={savingField === slot.key}
              />
            ))}
            {trade.is_oversized && (
              <AlertCircle className="h-3 w-3 flex-shrink-0 text-rose-400" title="Oversized position" />
            )}
          </div>
        </div>

        {/* Emotions */}
        <div className={cn(COLUMN_WIDTHS.emotions, 'flex-shrink-0', columns?.emotions ? 'hidden xl:block' : 'hidden')}>
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

        {/* Overall Rating (out of 10) */}
        <div className={cn(COLUMN_WIDTHS.rating, 'flex-shrink-0', columns?.overallRating ? 'hidden xl:block' : 'hidden')}>
          {trade.overall_rating != null ? (
            <span className={cn(
              'rounded border px-1.5 py-0.5 text-[10px] font-bold tabular-nums',
              Number(trade.overall_rating) >= 7
                ? 'border-emerald-500/25 bg-emerald-500/8 text-emerald-300'
                : Number(trade.overall_rating) >= 4
                  ? 'border-amber-500/25 bg-amber-500/8 text-amber-300'
                  : 'border-rose-500/25 bg-rose-500/8 text-rose-300'
            )}>
              {trade.overall_rating}/10
            </span>
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
        <div className={cn(COLUMN_WIDTHS.done, 'hidden flex-shrink-0 items-center gap-1 lg:flex')}>
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
          {isDebriefed != null && (
            <span className={cn(
              'inline-flex items-center gap-1 rounded border px-1.5 py-0.5 text-[10px]',
              isDebriefed
                ? 'border-emerald-400/25 bg-emerald-500/10 text-emerald-200/80'
                : 'border-amber-400/25 bg-amber-500/10 text-amber-200/80',
            )}>
              <NotebookPen className="h-3 w-3" />
              {isDebriefed ? 'Debriefed in Setup Journal' : 'Not debriefed yet'}
            </span>
          )}


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

        </div>
      )}
    </div>
  );
}
