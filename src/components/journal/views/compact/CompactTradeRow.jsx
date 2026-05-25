import React, { useCallback, useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils/general';
import { formatDate, formatTime, formatCurrency } from '../../utils/formatters';
import { getTradeNotesText } from '../../utils/notes';
import { Image, AlertCircle, ChevronDown, Edit2, Trash2, Copy, CopyPlus, Pencil, Check, X } from 'lucide-react';
import { PnlBadge, DirectionBadge, RMultipleBadge, EmotionBadge, SetupBadge } from '@/components/ui/TradeBadge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import TradeReviewPanel from '../../analysis/TradeReviewPanel';
import { TradeThumbnail } from './TradeThumbnail';
import { TagChip } from '../../components/TagChip';
import { EditableCell } from '../cells/EditableCell';
import { useInlineTradeEdit } from '../../hooks/useInlineTradeEdit';
import { getTradePnL } from '@/lib/utils/tradeFields';
import { TradeCompleteness } from '../../components/TradeCompleteness';
import { useQueryClient } from '@tanstack/react-query';
import { tradeKeys } from '@/lib/hooks/useTrades/queryKeys';

const DIRECTION_OPTIONS = [
  { value: 'long', label: 'Long' },
  { value: 'short', label: 'Short' },
];

const PLAN_OPTIONS = [
  { value: 'true', label: 'Followed' },
  { value: 'false', label: 'Violated' },
];

export function CompactTradeRow({
  trade,
  onEdit,
  onDelete,
  onDuplicateTrade,
  onCopyNotes,
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
  const [isInlineEditing, setIsInlineEditing] = useState(false);
  const [isInlineSaving, setIsInlineSaving] = useState(false);
  const cleanedTradeNotes = getTradeNotesText(trade);
  const [inlineDraft, setInlineDraft] = useState({
    setup_type: String(trade?.setup_type || ''),
    notes: cleanedTradeNotes,
  });

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
  const setupQualityScore = Number(trade?.setup_quality_score);
  const hasSetupQualityScore = Number.isFinite(setupQualityScore);
  const normalizedSetupGrade = String(trade?.setup_grade || '').trim();
  const followedPlanLabel = trade.followed_plan === true
    ? 'Followed plan'
    : trade.followed_plan === false
      ? 'Plan deviation'
      : null;

  const pnlPct = entryPrice && positionSize
    ? ((pnl / (entryPrice * positionSize)) * 100).toFixed(1)
    : null;

  useEffect(() => {
    setInlineDraft({
      setup_type: String(trade?.setup_type || ''),
      notes: getTradeNotesText(trade),
    });
    setIsInlineEditing(false);
    setIsInlineSaving(false);
  }, [trade?.id, trade?.setup_type, trade?.notes]);

  const startInlineEdit = () => {
    setInlineDraft({
      setup_type: String(trade?.setup_type || ''),
      notes: getTradeNotesText(trade),
    });
    setExpanded(true);
    setIsInlineEditing(true);
  };

  const cancelInlineEdit = () => {
    setInlineDraft({
      setup_type: String(trade?.setup_type || ''),
      notes: getTradeNotesText(trade),
    });
    setIsInlineEditing(false);
  };

  const saveInlineEdit = async () => {
    if (!onInlineUpdateTrade) return;
    setIsInlineSaving(true);
    try {
      await onInlineUpdateTrade(trade, {
        setup_type: String(inlineDraft.setup_type || '').trim(),
        notes: String(inlineDraft.notes || ''),
      });
      setIsInlineEditing(false);
    } finally {
      setIsInlineSaving(false);
    }
  };

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

        {/* Date */}
        <div className="w-[82px] flex-shrink-0">
          <div className="leading-tight">
            <span className="block text-[11px] text-white/40 font-mono">
              {formatDate(trade.entry_time || trade.created_date)}
            </span>
            <span className="block text-[9px] text-white/30 font-mono">
              {entryTimeLabel} | {exitTimeLabel}
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
        <div className="w-[100px] flex-shrink-0 hidden sm:block" onClick={(e) => e.stopPropagation()}>
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

        {/* Quality */}
        <div className={cn('w-[90px] flex-shrink-0', columns?.quality ? 'hidden xl:block' : 'hidden')}>
          {hasSetupQualityScore || normalizedSetupGrade ? (
            <span className="text-[10px] px-1.5 py-0.5 rounded border border-blue-500/20 bg-blue-500/10 text-blue-300/70 whitespace-nowrap">
              {hasSetupQualityScore
                ? `${Math.round(setupQualityScore)}${normalizedSetupGrade ? ` ${normalizedSetupGrade}` : ''}`
                : `Grade ${normalizedSetupGrade}`}
            </span>
          ) : (
            <span className="text-[10px] text-white/25">-</span>
          )}
        </div>

        {/* Followed plan (editable) */}
        <div className={cn('w-[120px] flex-shrink-0', columns?.plan ? 'hidden xl:block' : 'hidden')} onClick={(e) => e.stopPropagation()}>
          <EditableCell
            value={trade.followed_plan}
            displayNode={followedPlanLabel ? (
              <span className={cn(
                'text-[10px] px-1.5 py-0.5 rounded border whitespace-nowrap',
                trade.followed_plan
                  ? 'border-emerald-500/15 bg-emerald-500/8 text-emerald-300/60'
                  : 'border-rose-500/20 bg-rose-500/10 text-rose-300/70'
              )}>
                {followedPlanLabel}
              </span>
            ) : <span className="text-[10px] text-white/25">-</span>}
            type="boolean"
            options={PLAN_OPTIONS}
            onSave={(v) => editField('followed_plan', v)}
            loading={savingField === 'followed_plan'}
          />
        </div>

        {/* Screenshots */}
        <div className="flex items-center gap-1 mx-2 flex-shrink-0">
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
          <button onClick={startInlineEdit} className="p-1.5 rounded text-white/30 hover:text-cyan-300 hover:bg-cyan-500/10 transition-colors" title="Inline edit">
            <Pencil className="w-3 h-3" />
          </button>
          <button onClick={() => onDuplicateTrade?.(trade)} className="p-1.5 rounded text-white/30 hover:text-sky-300 hover:bg-sky-500/10 transition-colors" title="Duplicate">
            <CopyPlus className="w-3 h-3" />
          </button>
          <button onClick={() => onCopyNotes?.(trade)} className="p-1.5 rounded text-white/30 hover:text-emerald-300 hover:bg-emerald-500/10 transition-colors" title="Copy notes">
            <Copy className="w-3 h-3" />
          </button>
          <button onClick={() => onEdit(trade)} className="p-1.5 rounded text-white/30 hover:text-white/70 hover:bg-white/8 transition-colors" title="Edit">
            <Edit2 className="w-3 h-3" />
          </button>
          <button onClick={() => onDelete(trade)} className="p-1.5 rounded text-white/30 hover:text-rose-400 hover:bg-rose-500/10 transition-colors" title="Delete">
            <Trash2 className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Tags row (shown when present) */}
      {tags.length > 0 && (
        <div className="flex items-center gap-1 flex-wrap px-8 pb-1">
          {tags.map((name) => (
            <TagChip key={name} name={name} size="xs" onClick={onTagClick} />
          ))}
        </div>
      )}

      {expanded && (
        <div
          className="px-8 pb-3 space-y-2 animate-fade-in border-t border-white/[0.03]"
          onClick={(event) => event.stopPropagation()}
        >
          {isInlineEditing ? (
            <div className="space-y-2.5 rounded-lg border border-cyan-500/20 bg-cyan-500/[0.06] p-2.5">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 items-end">
                <div className="sm:col-span-2">
                  <p className="text-[10px] uppercase tracking-[0.16em] text-white/50 mb-1">Setup Type</p>
                  <Input
                    value={inlineDraft.setup_type}
                    onChange={(event) => setInlineDraft((prev) => ({ ...prev, setup_type: event.target.value }))}
                    placeholder="Setup type"
                    className="h-9 text-xs"
                  />
                </div>
                <div className="flex gap-2 justify-end sm:justify-start">
                  <button
                    type="button"
                    onClick={cancelInlineEdit}
                    disabled={isInlineSaving}
                    className="inline-flex items-center gap-1 rounded-md border border-white/15 bg-white/[0.02] px-2 py-1 text-[11px] text-white/75 hover:bg-white/[0.06] disabled:opacity-50"
                  >
                    <X className="w-3 h-3" />
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={saveInlineEdit}
                    disabled={isInlineSaving}
                    className="inline-flex items-center gap-1 rounded-md border border-emerald-400/25 bg-emerald-500/15 px-2 py-1 text-[11px] text-emerald-200 hover:bg-emerald-500/25 disabled:opacity-50"
                  >
                    <Check className="w-3 h-3" />
                    Save
                  </button>
                </div>
              </div>

              <div>
                <p className="text-[10px] uppercase tracking-[0.16em] text-white/50 mb-1">Notes</p>
                <Textarea
                  value={inlineDraft.notes}
                  onChange={(event) => setInlineDraft((prev) => ({ ...prev, notes: event.target.value }))}
                  placeholder="Quick notes"
                  className="min-h-[84px] text-xs leading-relaxed"
                />
              </div>
            </div>
          ) : (
            <p className="text-[11px] text-white/40 leading-relaxed max-w-xl whitespace-pre-wrap break-words">
              {cleanedTradeNotes || 'No notes added.'}
            </p>
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
