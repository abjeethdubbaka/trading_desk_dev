import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { X, Edit2, Upload, Loader2, Maximize2, AlertCircle, NotebookPen, GitBranch } from 'lucide-react';
import { createPageUrl } from '@/utils';
import { EXIT_LEVELS } from '@/lib/dataPoints/utils';
import { cn } from '@/lib/utils/general';
import { PnlBadge, DirectionBadge, RMultipleBadge, EmotionBadge, SetupBadge, GradeBadge } from '@/components/ui/TradeBadge';
import { getTradePnL } from '@/lib/utils/tradeFields';
import { formatDate, formatTime, formatCurrency } from './utils/formatters';
import { getTradeNotesText } from './utils/notes';
import { useScreenshotIdsUrls } from './media/useScreenshotUrls';
import { imageFileToDataUrl } from './media/imageUtils';
import MultiImageLightbox from '@/components/ui/MultiImageLightbox';
import { toast } from 'sonner';

function DetailRow({ label, children }) {
  return (
    <div className="grid grid-cols-[96px_1fr] gap-2 py-1.5 border-b border-white/[0.04] last:border-0">
      <span className="text-[11px] text-white/40 self-start pt-0.5">{label}</span>
      <div className="text-[13px] text-white/85">{children}</div>
    </div>
  );
}

function ScreenshotThumb({ id, url, status, onView, onRemove }) {
  if (status === 'error') {
    return (
      <div className="w-16 h-16 rounded-lg border border-red-500/30 bg-red-500/10 flex items-center justify-center flex-shrink-0">
        <AlertCircle className="w-3.5 h-3.5 text-red-300" />
      </div>
    );
  }
  return (
    <div className="relative group w-16 h-16 flex-shrink-0">
      {status !== 'loaded' && (
        <div className="absolute inset-0 rounded-lg border border-white/10 bg-white/5 animate-pulse" />
      )}
      {url && (
        <img
          src={url}
          alt="Screenshot"
          className="w-16 h-16 object-cover rounded-lg cursor-pointer"
          onClick={() => onView(url)}
          loading="lazy"
        />
      )}
      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center gap-1">
        <button type="button" onClick={() => url && onView(url)} className="p-1 hover:bg-white/20 rounded" disabled={!url}>
          <Maximize2 className="w-3 h-3 text-white" />
        </button>
        {onRemove && (
          <button type="button" onClick={() => onRemove(id)} className="p-1 hover:bg-red-500/80 rounded">
            <X className="w-3 h-3 text-white" />
          </button>
        )}
      </div>
    </div>
  );
}

/** Yes, no, or unanswered — for each rung of the setup's exit ladder. */
function RungMark({ label, value }) {
  const answered = typeof value === 'boolean';
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded border px-1.5 py-0.5 text-[10px]',
        !answered ? 'border-white/10 text-white/30'
          : value ? 'border-emerald-400/30 bg-emerald-500/10 text-emerald-200'
          : 'border-rose-400/30 bg-rose-500/10 text-rose-200',
      )}
      title={`${label}: ${!answered ? 'not answered' : value ? 'reached' : 'not reached'}`}
    >
      {label.split(' ')[0]}
      <span className="font-semibold">{!answered ? '—' : value ? 'Y' : 'N'}</span>
    </span>
  );
}

export function TradeDetailDrawer({ trade, onClose, onEdit, updateTrade, isDebriefed = null }) {
  const [lightbox, setLightbox] = useState(null);
  const fileInputRef = React.useRef(null);

  const screenshotIds = Array.isArray(trade?.screenshots) ? trade.screenshots : [];
  const { urlsById, statusById } = useScreenshotIdsUrls(screenshotIds);
  const [uploading, setUploading] = useState(false);

  const openLightbox = useCallback((url) => {
    const urls = screenshotIds.map((id) => urlsById[id]).filter(Boolean);
    const startIndex = Math.max(0, urls.indexOf(url));
    setLightbox({ urls: urls.length > 0 ? urls : [url], startIndex });
  }, [screenshotIds, urlsById]);

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const handleUpload = useCallback(async (event) => {
    const files = Array.from(event.target.files);
    if (!files.length || !updateTrade || !trade?.id) return;
    event.target.value = '';
    setUploading(true);
    try {
      const dataUrls = await Promise.all(files.map((f) => imageFileToDataUrl(f)));
      const merged = [...screenshotIds, ...dataUrls];
      await updateTrade({ id: trade.id, data: { ...trade, screenshots: merged } });
    } catch (err) {
      toast.error(`Upload failed: ${err?.message || 'Unknown error'}`);
    } finally {
      setUploading(false);
    }
  }, [updateTrade, trade, screenshotIds]);

  const handleRemove = useCallback(async (id) => {
    if (!updateTrade || !trade?.id) return;
    try {
      const updated = screenshotIds.filter((s) => s !== id);
      await updateTrade({ id: trade.id, data: { ...trade, screenshots: updated } });
    } catch (err) {
      toast.error(`Remove failed: ${err?.message || 'Unknown error'}`);
    }
  }, [updateTrade, trade, screenshotIds]);

  if (!trade) return null;

  const pnl = getTradePnL(trade);
  const entryPrice = trade.entry_price || 0;
  const exitPrice = trade.exit_price || 0;
  const positionSize = trade.position_size || 0;
  const notes = getTradeNotesText(trade);
  const emotions = Array.isArray(trade.emotions)
    ? trade.emotions.filter(Boolean)
    : trade.emotions ? [trade.emotions] : [];
  const mistakes = Array.isArray(trade.mistakes)
    ? trade.mistakes.filter(Boolean)
    : trade.mistakes ? [trade.mistakes] : [];
  const pnlPct = entryPrice && positionSize
    ? ((pnl / (entryPrice * positionSize)) * 100).toFixed(1)
    : null;
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
              <DetailRow label="Setup">
                <span className="inline-flex items-center gap-1.5">
                  <SetupBadge setup={trade.setup_type} />
                  {trade.setup_version != null && (
                    <span
                      className="inline-flex items-center gap-1 rounded border border-white/12 bg-white/[0.04] px-1.5 py-0.5 font-mono text-[10px] text-white/55"
                      title="The version of this setup's rules that was live when the trade was taken"
                    >
                      <GitBranch className="h-3 w-3" />v{trade.setup_version}
                    </span>
                  )}
                </span>
              </DetailRow>
            )}
            {trade.risk_per_share != null && (
              <DetailRow label="Risk / share">
                <span className="font-mono">{formatCurrency(trade.risk_per_share)}</span>
                {trade.risk_amount != null && (
                  <span className="ml-2 text-[11px] text-white/40">{formatCurrency(trade.risk_amount)} total</span>
                )}
              </DetailRow>
            )}
            {(trade.mfe_r_multiple != null || trade.mfe_price != null) && (
              <DetailRow label="MFE">
                {trade.mfe_r_multiple != null && (
                  <span className="font-mono text-cyan-200">{Number(trade.mfe_r_multiple) > 0 ? '+' : ''}{trade.mfe_r_multiple}R</span>
                )}
                {trade.mfe_price != null && (
                  <span className="ml-2 text-[11px] text-white/40">at {formatCurrency(trade.mfe_price)}</span>
                )}
                {trade.mfe_r_multiple != null && trade.r_multiple != null && Number(trade.mfe_r_multiple) - Number(trade.r_multiple) >= 0.5 && (
                  <span className="ml-2 text-[11px] text-amber-300/80">
                    left {(Number(trade.mfe_r_multiple) - Number(trade.r_multiple)).toFixed(1)}R on the table
                  </span>
                )}
              </DetailRow>
            )}
            {EXIT_LEVELS.some((level) => typeof trade[`exit_${level.key}_r_taken`] === 'boolean') && (
              <DetailRow label="Exit ladder">
                <span className="flex flex-wrap gap-1">
                  {EXIT_LEVELS.map((level) => (
                    <RungMark key={level.key} label={level.label} value={trade[`exit_${level.key}_r_taken`]} />
                  ))}
                </span>
              </DetailRow>
            )}
            {trade.entry_grade && (
              <DetailRow label="Entry-Grade"><GradeBadge grade={trade.entry_grade} /></DetailRow>
            )}
            {trade.sl_grade && (
              <DetailRow label="SL-Grade"><GradeBadge grade={trade.sl_grade} /></DetailRow>
            )}
            {trade.exit_grade && (
              <DetailRow label="Exit-Grade"><GradeBadge grade={trade.exit_grade} /></DetailRow>
            )}
            {(trade.size_grade || trade.is_oversized) && (
              <DetailRow label="Size-Grade">
                <div className="flex items-center gap-1.5">
                  {trade.size_grade && <GradeBadge grade={trade.size_grade} />}
                  {trade.is_oversized && (
                    <span className="rounded border border-rose-500/20 bg-rose-500/10 px-1.5 py-0.5 text-[12px] text-rose-300">
                      Oversized
                    </span>
                  )}
                </div>
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

          {isDebriefed != null && (
            <Link
              to={createPageUrl('SetupJournal')}
              className={cn(
                'flex items-center justify-between gap-2 rounded-lg border px-3 py-2 text-xs transition-colors',
                isDebriefed
                  ? 'border-emerald-400/25 bg-emerald-500/[0.08] text-emerald-200/85 hover:bg-emerald-500/[0.14]'
                  : 'border-amber-400/25 bg-amber-500/[0.08] text-amber-200/85 hover:bg-amber-500/[0.14]',
              )}
            >
              <span className="inline-flex items-center gap-1.5">
                <NotebookPen className="h-3.5 w-3.5" />
                {isDebriefed ? 'Debriefed in Setup Journal' : 'Not debriefed yet'}
              </span>
              <span className="text-[11px] opacity-70">{isDebriefed ? 'Open →' : 'Debrief →'}</span>
            </Link>
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

          {/* Screenshots */}
          {updateTrade && (
            <div>
              <p className="mb-1.5 text-[10px] uppercase tracking-[0.16em] text-white/35">Screenshots</p>
              <div className="flex flex-wrap gap-2">
                {screenshotIds.map((id) => (
                  <ScreenshotThumb
                    key={id}
                    id={id}
                    url={urlsById[id]}
                    status={statusById[id] || 'loading'}
                    onView={openLightbox}
                    onRemove={handleRemove}
                  />
                ))}
                <label className={cn(
                  'flex w-16 h-16 cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed transition-all flex-shrink-0',
                  uploading ? 'border-white/10 bg-white/5' : 'border-white/20 hover:border-white/40 hover:bg-white/5',
                )}>
                  {uploading ? (
                    <Loader2 className="w-4 h-4 animate-spin text-white/40" />
                  ) : (
                    <>
                      <Upload className="w-4 h-4 text-white/40 mb-0.5" />
                      <span className="text-[9px] text-white/40">Add</span>
                    </>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleUpload}
                    className="hidden"
                    disabled={uploading}
                  />
                </label>
              </div>
            </div>
          )}
        </div>
      </div>

      <MultiImageLightbox
        isOpen={Boolean(lightbox)}
        images={lightbox?.urls ?? []}
        startIndex={lightbox?.startIndex ?? 0}
        onClose={() => setLightbox(null)}
      />
    </>
  );
}
