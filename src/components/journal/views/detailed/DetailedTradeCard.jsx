import React, { useState } from 'react';
import { cn } from '@/lib/utils/general';
import { formatDate, formatCurrency } from '../../utils/formatters';
import { getTradeNotesText } from '../../utils/notes';
import { AlertCircle, Copy, CopyPlus, Pencil, Check, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

const isVWAPPullback = (setupType) => (setupType || '').toLowerCase().trim() === 'vwap pullback';
const getStepStatus = (step, keys) => keys.every((key) => !!step?.[key]);

export function DetailedTradeCard({
  trade,
  onEdit,
  onDuplicateTrade,
  onCopyNotes,
  onInlineUpdateTrade,
  screenshotUrls,
  screenshotStatuses,
  onOpenImage,
}) {
  const [imageStates, setImageStates] = useState({});
  const [isInlineEditing, setIsInlineEditing] = useState(false);
  const [isInlineSaving, setIsInlineSaving] = useState(false);
  const cleanedTradeNotes = getTradeNotesText(trade);
  const [inlineDraft, setInlineDraft] = useState({
    setup_type: String(trade?.setup_type || ''),
    notes: cleanedTradeNotes,
  });

  const setupQualityScore = Number(trade?.setup_quality_score);
  const hasSetupQualityScore = Number.isFinite(setupQualityScore);
  const normalizedSetupGrade = String(trade?.setup_grade || '').trim();
  const setupQualityLabel = hasSetupQualityScore
    ? `${Math.round(setupQualityScore)}/100${normalizedSetupGrade ? ` (${normalizedSetupGrade})` : ''}`
    : (normalizedSetupGrade || 'No Grade');

  const handleImageLoad = (index) => {
    setImageStates((prev) => ({
      ...prev,
      [index]: 'loaded',
    }));
  };

  const handleImageError = (index) => {
    setImageStates((prev) => ({
      ...prev,
      [index]: 'error',
    }));
  };

  const startInlineEdit = () => {
    setInlineDraft({
      setup_type: String(trade?.setup_type || ''),
      notes: getTradeNotesText(trade),
    });
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
      className="group bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg p-3 transition-colors cursor-pointer"
      onClick={() => onEdit(trade)}
    >
      <div className="flex justify-between items-start mb-2">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-semibold text-white">{trade.symbol}</span>
            <span className={cn(
              "text-xs px-1.5 py-0.5 rounded",
              trade.direction === 'long'
                ? "bg-emerald-500/20 text-emerald-400"
                : "bg-red-500/20 text-red-400"
            )}>
              {trade.direction === 'long' ? 'Long' : 'Short'}
            </span>
          </div>
          <div className="text-xs text-white/50">
            {formatDate(trade.entry_time || trade.created_date)}
          </div>
        </div>
        <div className="flex items-start gap-2">
          <div className={cn(
            "text-sm font-semibold",
            (trade.pnl || 0) >= 0 ? "text-emerald-400" : "text-red-400"
          )}>
            {formatCurrency(trade.pnl)}
          </div>
          <div
            className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              onClick={startInlineEdit}
              className="p-1.5 rounded text-white/35 hover:text-cyan-300 hover:bg-cyan-500/10 transition-colors"
              title="Inline edit"
            >
              <Pencil className="w-3 h-3" />
            </button>
            <button
              onClick={() => onDuplicateTrade?.(trade)}
              className="p-1.5 rounded text-white/35 hover:text-sky-300 hover:bg-sky-500/10 transition-colors"
              title="Duplicate trade"
            >
              <CopyPlus className="w-3 h-3" />
            </button>
            <button
              onClick={() => onCopyNotes?.(trade)}
              className="p-1.5 rounded text-white/35 hover:text-emerald-300 hover:bg-emerald-500/10 transition-colors"
              title="Copy notes"
            >
              <Copy className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-2 text-xs mb-2">
        <div>
          <div className="text-white/40">Entry</div>
          <div className="text-white">{formatCurrency(trade.entry_price)}</div>
        </div>
        <div>
          <div className="text-white/40">Exit</div>
          <div className="text-white">{formatCurrency(trade.exit_price)}</div>
        </div>
        <div>
          <div className="text-white/40">Stop</div>
          <div className="text-white">{formatCurrency(trade.stop_loss) || '-'}</div>
        </div>
        <div>
          <div className="text-white/40">R:R</div>
          <div className="text-white">{trade.r_multiple ? `${trade.r_multiple}:1` : '-'}</div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 text-xs mb-2">
        <div>
          <div className="text-white/40">Size</div>
          <div className="text-white">{trade.position_size || '0'}</div>
        </div>
        <div>
          <div className="text-white/40">P&L</div>
          <div className={cn(
            "text-white",
            (trade.pnl || 0) >= 0 ? "text-emerald-400" : "text-red-400"
          )}>
            {formatCurrency(trade.pnl)}
          </div>
        </div>
        <div>
          <div className="text-white/40">P&L %</div>
          <div className={cn(
            "text-white",
            (trade.pnl || 0) >= 0 ? "text-emerald-400" : "text-red-400"
          )}>
            {trade.pnl_percent ? `${trade.pnl_percent.toFixed(2)}%` : '-'}
          </div>
        </div>
      </div>

      {isInlineEditing ? (
        <div
          className="mb-2 space-y-2 rounded-lg border border-cyan-500/20 bg-cyan-500/[0.06] p-2"
          onClick={(event) => event.stopPropagation()}
        >
          <div>
            <p className="mb-1 text-[10px] uppercase tracking-[0.16em] text-white/50">Setup Type</p>
            <Input
              value={inlineDraft.setup_type}
              onChange={(event) => setInlineDraft((prev) => ({ ...prev, setup_type: event.target.value }))}
              placeholder="Setup type"
              className="h-9 text-xs"
            />
          </div>
          <div>
            <p className="mb-1 text-[10px] uppercase tracking-[0.16em] text-white/50">Notes</p>
            <Textarea
              value={inlineDraft.notes}
              onChange={(event) => setInlineDraft((prev) => ({ ...prev, notes: event.target.value }))}
              placeholder="Quick notes"
              className="min-h-[84px] text-xs leading-relaxed"
            />
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={cancelInlineEdit}
              disabled={isInlineSaving}
              className="inline-flex items-center gap-1 rounded-md border border-white/15 bg-white/[0.03] px-2 py-1 text-[11px] text-white/75 hover:bg-white/[0.07] disabled:opacity-50"
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
      ) : (
        <>
          {trade.setup_type && (
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs px-2 py-1 bg-white/10 rounded text-white/80">
                {trade.setup_type}
              </span>
              <span
                className={cn(
                  'text-xs px-2 py-1 rounded',
                  hasSetupQualityScore || normalizedSetupGrade
                    ? 'bg-blue-500/20 text-blue-300'
                    : 'bg-white/10 text-white/60'
                )}
              >
                Setup Quality: {setupQualityLabel}
              </span>
            </div>
          )}
        </>
      )}

      {isVWAPPullback(trade.setup_type) && trade.breakout_checklist && (
        <div className="text-[11px] border border-blue-500/20 bg-blue-500/10 rounded p-2 mb-2 space-y-1">
          {(() => {
            const step1Keys = ['smoothVWAPPullback', 'controlledRedCandles', 'holdsAboveVWAP', 'lowerWicksDipBuyers'];
            const step2Keys = ['tightRange3to6Candles', 'volumeDriesUp', 'higherLowsForming', 'vwapSlopesUpward'];
            const step3Keys = ['breakAboveBaseHigh', 'volumeIncreases', 'vwapRising'];
            const s1 = getStepStatus(trade.breakout_checklist.step1, step1Keys);
            const s2 = getStepStatus(trade.breakout_checklist.step2, step2Keys);
            const s3 = getStepStatus(trade.breakout_checklist.step3, step3Keys);

            return (
              <>
                <div className="flex items-center justify-between gap-2">
                  <span className={cn('font-medium', s1 ? 'text-emerald-300' : 'text-red-300')}>
                    VWAP Touch: {s1 ? 'YES' : 'NO'}
                  </span>
                  {trade.breakout_checklist.step1Time && (
                    <span className="text-white/60">Time: {trade.breakout_checklist.step1Time}</span>
                  )}
                </div>
                {trade.breakout_checklist?.step1?.notes && (
                  <p className="text-white/60">S1 Notes: {trade.breakout_checklist.step1.notes}</p>
                )}

                <div className="flex items-center justify-between gap-2">
                  <span className={cn('font-medium', s2 ? 'text-emerald-300' : 'text-red-300')}>
                    Base Build: {s2 ? 'YES' : 'NO'}
                  </span>
                  {trade.breakout_checklist.step2DurationMins && (
                    <span className="text-white/60">Duration: {trade.breakout_checklist.step2DurationMins}m</span>
                  )}
                </div>
                {trade.breakout_checklist?.step2?.notes && (
                  <p className="text-white/60">S2 Notes: {trade.breakout_checklist.step2.notes}</p>
                )}

                <div className="flex items-center justify-between gap-2">
                  <span className={cn('font-medium', s3 ? 'text-emerald-300' : 'text-red-300')}>
                    Breakout Trigger: {s3 ? 'YES' : 'NO'}
                  </span>
                  {trade.breakout_checklist.step3Time && (
                    <span className="text-white/60">Entry: {trade.breakout_checklist.step3Time}</span>
                  )}
                </div>
                {trade.breakout_checklist?.step3?.notes && (
                  <p className="text-white/60">S3 Notes: {trade.breakout_checklist.step3.notes}</p>
                )}
              </>
            );
          })()}
        </div>
      )}

      {!isInlineEditing && (
        <div className="text-xs text-white/60 border-t border-white/10 pt-2 mt-1 whitespace-pre-wrap break-words">
          {cleanedTradeNotes || 'No notes added.'}
        </div>
      )}

      {trade.screenshots && trade.screenshots.length > 0 && (
        <div className="mt-2 pt-2 border-t border-white/10">
          <div className="flex gap-1 flex-wrap">
            {trade.screenshots.slice(0, 4).map((screenshotId, index) => {
              const imageState = screenshotStatuses?.[screenshotId] === 'error'
                ? 'error'
                : imageStates[index];
              const screenshotUrl = screenshotUrls?.[screenshotId];

              return (
                <div key={`${trade.id}-${index}`} className="w-12 h-12 relative">
                  {imageState !== 'loaded' && (
                    <div className="absolute inset-0 bg-white/10 rounded flex items-center justify-center">
                      {imageState === 'error' ? (
                        <AlertCircle className="w-4 h-4 text-red-400" />
                      ) : (
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white/60 rounded-full animate-spin" />
                      )}
                    </div>
                  )}
                  {screenshotUrl && (
                    <img
                      src={screenshotUrl}
                      alt={`Trade ${trade.id} Screenshot ${index + 1}`}
                      className={cn(
                        "w-12 h-12 object-cover rounded cursor-pointer hover:opacity-80 transition-opacity",
                        imageState === 'error' && "opacity-50"
                      )}
                      onClick={(event) => {
                        event.stopPropagation();
                        if (imageState === 'loaded') {
                          onOpenImage(screenshotUrl);
                        }
                      }}
                      onLoad={() => handleImageLoad(index)}
                      onError={() => handleImageError(index)}
                      loading="lazy"
                    />
                  )}
                </div>
              );
            })}
            {trade.screenshots.length > 4 && (
              <div className="w-12 h-12 bg-white/10 rounded flex items-center justify-center text-xs text-white/60">
                +{trade.screenshots.length - 4}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
