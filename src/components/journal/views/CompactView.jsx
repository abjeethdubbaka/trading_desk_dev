import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils/general';
import { formatDate, formatTime, formatCurrency } from '../utils/formatters';
import { getTradeNotesText } from '../utils/notes';
import { Image, AlertCircle, ChevronDown, Edit2, Trash2, Copy, CopyPlus, Pencil, Check, X } from 'lucide-react';
import { PnlBadge, DirectionBadge, RMultipleBadge, EmotionBadge, SetupBadge } from '@/components/ui/TradeBadge';
import TradeReviewPanel from '../analysis/TradeReviewPanel';
import { createMediaService } from '@/lib/services/MediaService.js';
import { db } from '@/lib/db/index.js';
import { indexedDBAdapter } from '@/lib/db/adapters/IndexedDBAdapter.js';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

const mediaService = createMediaService(db, indexedDBAdapter);

/* ─── Thumbnail ────────────────────────────────────────────────────────── */
function Thumb({ screenshotId, index, onView }) {
  const [url,   setUrl]   = useState(null);
  const [state, setState] = useState('loading');

  useEffect(() => {
    let cancelled = false;
    mediaService.get(screenshotId).then(media => {
      if (cancelled) return;
      const u = media?.file_url || (media?.file ? URL.createObjectURL(media.file) : null);
      setUrl(u);
      setState(u ? 'loaded' : 'error');
    }).catch(() => setState('error'));
    return () => { cancelled = true; };
  }, [screenshotId]);

  if (state === 'error') return null;

  return (
    <button
      onClick={() => url && onView(url)}
      className="w-8 h-8 rounded overflow-hidden border border-white/10 flex-shrink-0 hover:border-white/25 transition-colors relative"
    >
      {state === 'loading' && (
        <div className="absolute inset-0 bg-white/5 animate-pulse" />
      )}
      {url && (
        <img
          src={url}
          alt={`Screenshot ${index + 1}`}
          className="w-full h-full object-cover"
          loading="lazy"
        />
      )}
    </button>
  );
}

/* ─── Lightbox ─────────────────────────────────────────────────────────── */
function openLightbox(url) {
  let scale = 1;
  const modal   = document.createElement('div');
  modal.className = 'fixed inset-0 z-[100] bg-black/95 flex items-center justify-center';
  const img = document.createElement('img');
  img.src = url;
  img.className = 'max-w-[92vw] max-h-[92vh] object-contain rounded-xl shadow-2xl select-none';
  img.style.transition = 'transform 120ms ease';

  const apply = () => { img.style.transform = `scale(${scale})`; };

  const close = () => { document.removeEventListener('keydown', onKey); modal.remove(); };
  const onKey = (e) => { if (e.key === 'Escape') close(); };
  document.addEventListener('keydown', onKey);

  modal.addEventListener('wheel', (e) => {
    e.preventDefault();
    scale = Math.min(5, Math.max(0.5, scale + (e.deltaY > 0 ? -0.1 : 0.1)));
    apply();
  }, { passive: false });
  modal.addEventListener('click', close);

  modal.appendChild(img);
  document.body.appendChild(modal);
  apply();
}

/* ─── Row component ────────────────────────────────────────────────────── */
function TradeRow({
  trade,
  onEdit,
  onDelete,
  onDuplicateTrade,
  onCopyNotes,
  onInlineUpdateTrade,
  review,
  reviewLoading,
  onReviewTrade,
  onClearReview,
  index,
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

  const pnl = trade.pnl || 0;
  const entryPrice   = trade.entry_price    || 0;
  const exitPrice    = trade.exit_price     || 0;
  const positionSize = trade.position_size  || 0;
  const screenshots  = trade.screenshots   || [];
  const emotionList = Array.isArray(trade.emotions)
    ? trade.emotions.filter(Boolean)
    : (trade.emotions ? [trade.emotions] : []);
  const primaryEmotion = emotionList[0] || null;
  const entryTimeLabel = trade.entry_time ? formatTime(trade.entry_time) : '--';
  const exitTimeLabel = trade.exit_time ? formatTime(trade.exit_time) : '--';
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
        'hover:bg-white/[0.02]',
        'animate-fade-in',
      )}
      style={{ animationDelay: `${Math.min(index * 20, 200)}ms` }}
    >
      {/* ── Main row ── */}
      <div className="flex items-center gap-0 px-3 py-2.5 cursor-pointer" onClick={() => setExpanded(e => !e)}>

        {/* Expand toggle */}
        <ChevronDown
          className={cn('w-3 h-3 text-white/20 flex-shrink-0 mr-2 transition-transform duration-200', expanded && 'rotate-180')}
        />

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

        {/* Symbol + direction */}
        <div className="w-[110px] flex-shrink-0 flex items-center gap-1.5">
          <span className="font-semibold text-[13px] text-white tracking-wide">
            {trade.symbol || '—'}
          </span>
          <DirectionBadge direction={trade.direction} size="xs" />
        </div>

        {/* Entry / Exit */}
        <div className="w-[100px] flex-shrink-0 hidden sm:block">
          <span className="text-[11px] font-mono text-white/50">
            {formatCurrency(entryPrice)}
            {exitPrice ? <span className="text-white/25"> → {formatCurrency(exitPrice)}</span> : null}
          </span>
        </div>

        {/* Size */}
        <div className="w-[58px] flex-shrink-0 hidden md:block">
          <span className="text-[11px] font-mono text-white/40">{positionSize || '—'}</span>
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

        {/* R-multiple */}
        <div className="w-[52px] flex-shrink-0 hidden lg:block">
          <RMultipleBadge value={trade.r_multiple} />
        </div>

        {/* Setup */}
        <div className="w-[110px] flex-shrink-0 hidden xl:block">
          <SetupBadge setup={trade.setup_type} />
        </div>

        {/* Emotions */}
        <div className="w-[120px] flex-shrink-0 hidden xl:block">
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

        {/* Grade */}
        <div className="w-[90px] flex-shrink-0 hidden xl:block">
          {trade.setup_grade ? (
            <span className="text-[10px] px-1.5 py-0.5 rounded border border-blue-500/20 bg-blue-500/10 text-blue-300/70 whitespace-nowrap">
              Grade: {trade.setup_grade}
            </span>
          ) : (
            <span className="text-[10px] text-white/25">-</span>
          )}
        </div>

        {/* Plan */}
        <div className="w-[120px] flex-shrink-0 hidden xl:block">
          {followedPlanLabel ? (
            <span className={cn(
              'text-[10px] px-1.5 py-0.5 rounded border whitespace-nowrap',
              trade.followed_plan
                ? 'border-emerald-500/15 bg-emerald-500/8 text-emerald-300/60'
                : 'border-rose-500/20 bg-rose-500/10 text-rose-300/70'
            )}>
              {followedPlanLabel}
            </span>
          ) : (
            <span className="text-[10px] text-white/25">-</span>
          )}
        </div>
        {/* Thumbnails */}
        <div className="flex items-center gap-1 mx-2 flex-shrink-0">
          {screenshots.slice(0, 2).map((id, i) => (
            <Thumb
              key={id ?? i}
              screenshotId={id}
              index={i}
              onView={openLightbox}
            />
          ))}
          {screenshots.length > 2 && (
            <span className="text-[10px] text-white/25 font-mono">+{screenshots.length - 2}</span>
          )}
          {!screenshots.length && (
            <Image className="w-3.5 h-3.5 text-white/12" />
          )}
        </div>

        {/* Actions — only on hover */}
        <div
          className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-150 flex-shrink-0"
          onClick={e => e.stopPropagation()}
        >
          <button
            onClick={startInlineEdit}
            className="p-1.5 rounded text-white/30 hover:text-cyan-300 hover:bg-cyan-500/10 transition-colors"
            title="Inline edit"
          >
            <Pencil className="w-3 h-3" />
          </button>
          <button
            onClick={() => onDuplicateTrade?.(trade)}
            className="p-1.5 rounded text-white/30 hover:text-sky-300 hover:bg-sky-500/10 transition-colors"
            title="Duplicate trade"
          >
            <CopyPlus className="w-3 h-3" />
          </button>
          <button
            onClick={() => onCopyNotes?.(trade)}
            className="p-1.5 rounded text-white/30 hover:text-emerald-300 hover:bg-emerald-500/10 transition-colors"
            title="Copy notes"
          >
            <Copy className="w-3 h-3" />
          </button>
          <button
            onClick={() => onEdit(trade)}
            className="p-1.5 rounded text-white/30 hover:text-white/70 hover:bg-white/8 transition-colors"
            title="Edit"
          >
            <Edit2 className="w-3 h-3" />
          </button>
          <button
            onClick={() => onDelete(trade.id)}
            className="p-1.5 rounded text-white/30 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
            title="Delete"
          >
            <Trash2 className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* ── Expanded detail ── */}
      {expanded && (
        <div
          className="px-8 pb-3 space-y-2 animate-fade-in border-t border-white/[0.03]"
          onClick={e => e.stopPropagation()}
        >
          {isInlineEditing ? (
            <div className="space-y-2.5 rounded-lg border border-cyan-500/20 bg-cyan-500/[0.06] p-2.5">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 items-end">
                <div className="sm:col-span-2">
                  <p className="text-[10px] uppercase tracking-[0.16em] text-white/50 mb-1">Setup Type</p>
                  <Input
                    value={inlineDraft.setup_type}
                    onChange={(e) => setInlineDraft((prev) => ({ ...prev, setup_type: e.target.value }))}
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
                  onChange={(e) => setInlineDraft((prev) => ({ ...prev, notes: e.target.value }))}
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

          {/* Mistakes */}
          {trade.mistakes?.length > 0 && (
            <div className="flex items-center gap-1.5 flex-wrap">
              <AlertCircle className="w-3 h-3 text-amber-400/60 flex-shrink-0" />
              {(Array.isArray(trade.mistakes) ? trade.mistakes : [trade.mistakes]).map((m, i) => (
                <span key={i} className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/8 border border-amber-500/15 text-amber-300/60">
                  {m}
                </span>
              ))}
            </div>
          )}

          {/* AI Review */}
          <TradeReviewPanel
            trade={trade}
            review={review}
            isLoading={reviewLoading?.[trade.id]}
            onRequest={onReviewTrade}
            isOpen={reviewOpen}
            onToggle={() => setReviewOpen(o => !o)}
            onClear={onClearReview}
          />
        </div>
      )}
    </div>
  );
}

/* ─── Table header ─────────────────────────────────────────────────────── */
function Header() {
  return (
    <div className="flex items-center gap-0 px-3 py-2 border-b border-white/[0.06] bg-white/[0.015]">
      <div className="w-5 mr-2 flex-shrink-0" />
      <div className="w-[82px] flex-shrink-0">
        <span className="text-[9px] font-semibold uppercase tracking-widest text-white/25">Date/Time</span>
      </div>
      <div className="w-[110px] flex-shrink-0">
        <span className="text-[9px] font-semibold uppercase tracking-widest text-white/25">Symbol</span>
      </div>
      <div className="w-[100px] flex-shrink-0 hidden sm:block">
        <span className="text-[9px] font-semibold uppercase tracking-widest text-white/25">Entry → Exit</span>
      </div>
      <div className="w-[58px] flex-shrink-0 hidden md:block">
        <span className="text-[9px] font-semibold uppercase tracking-widest text-white/25">Size</span>
      </div>
      <div className="w-[150px] flex-shrink-0">
        <span className="text-[9px] font-semibold uppercase tracking-widest text-white/25">P&L</span>
      </div>
      <div className="w-[52px] flex-shrink-0 hidden lg:block">
        <span className="text-[9px] font-semibold uppercase tracking-widest text-white/25">R</span>
      </div>
      <div className="w-[110px] flex-shrink-0 hidden xl:block">
        <span className="text-[9px] font-semibold uppercase tracking-widest text-white/25">Setup</span>
      </div>
      <div className="w-[120px] flex-shrink-0 hidden xl:block">
        <span className="text-[9px] font-semibold uppercase tracking-widest text-white/25">Emotions</span>
      </div>
      <div className="w-[90px] flex-shrink-0 hidden xl:block">
        <span className="text-[9px] font-semibold uppercase tracking-widest text-white/25">Grade</span>
      </div>
      <div className="w-[120px] flex-shrink-0 hidden xl:block">
        <span className="text-[9px] font-semibold uppercase tracking-widest text-white/25">Plan</span>
      </div>

      <div className="w-20 flex-shrink-0">
        <span className="text-[9px] font-semibold uppercase tracking-widest text-white/25">Img</span>
      </div>
    </div>
  );
}

/* ─── Main export ──────────────────────────────────────────────────────── */
export default function CompactView({
  trades,
  onEdit,
  onDelete,
  onDuplicateTrade,
  onCopyNotes,
  onInlineUpdateTrade,
  reviews,
  reviewLoading,
  onReviewTrade,
  onClearReview,
}) {
  return (
    <div className="overflow-x-auto">
      <Header />
      <div>
        {trades.map((trade, i) => (
          <TradeRow
            key={trade.id}
            trade={trade}
            index={i}
            onEdit={onEdit}
            onDelete={onDelete}
            onDuplicateTrade={onDuplicateTrade}
            onCopyNotes={onCopyNotes}
            onInlineUpdateTrade={onInlineUpdateTrade}
            review={reviews?.[trade.id]}
            reviewLoading={reviewLoading?.[trade.id]}
            onReviewTrade={onReviewTrade}
            onClearReview={onClearReview}
          />
        ))}
      </div>
    </div>
  );
}




