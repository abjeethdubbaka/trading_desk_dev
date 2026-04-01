import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils/general';
import { formatDate, formatCurrency } from '../utils/formatters';
import { Image, AlertCircle, ChevronDown, Edit2, Trash2 } from 'lucide-react';
import { PnlBadge, DirectionBadge, RMultipleBadge, EmotionBadge, SetupBadge } from '@/components/ui/TradeBadge';
import TradeReviewPanel from '../analysis/TradeReviewPanel';
import { createMediaService } from '@/lib/services/MediaService.js';
import { db } from '@/lib/db/index.js';
import { indexedDBAdapter } from '@/lib/db/adapters/IndexedDBAdapter.js';

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
  review,
  reviewLoading,
  onReviewTrade,
  onClearReview,
  index,
}) {
  const [expanded, setExpanded] = useState(false);
  const [reviewOpen, setReviewOpen] = useState(false);

  const pnl = trade.pnl || 0;
  const entryPrice   = trade.entry_price    || 0;
  const exitPrice    = trade.exit_price     || 0;
  const positionSize = trade.position_size  || 0;
  const screenshots  = trade.screenshots   || [];

  const pnlPct = entryPrice && positionSize
    ? ((pnl / (entryPrice * positionSize)) * 100).toFixed(1)
    : null;

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
          <span className="text-[11px] text-white/40 font-mono">
            {formatDate(trade.entry_time || trade.created_date)}
          </span>
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
        <div className="flex-1 min-w-[90px]">
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
          {/* Meta row */}
          <div className="flex flex-wrap items-center gap-2 pt-2">
            {trade.emotions    && <EmotionBadge emotion={trade.emotions} />}
            {trade.setup_grade && (
              <span className="text-[10px] px-1.5 py-0.5 rounded border border-blue-500/20 bg-blue-500/10 text-blue-300/70">
                Grade: {trade.setup_grade}
              </span>
            )}
            {trade.followed_plan === false && (
              <span className="text-[10px] px-1.5 py-0.5 rounded border border-rose-500/20 bg-rose-500/10 text-rose-300/70">
                Deviated from plan
              </span>
            )}
            {trade.followed_plan === true && (
              <span className="text-[10px] px-1.5 py-0.5 rounded border border-emerald-500/15 bg-emerald-500/8 text-emerald-300/60">
                Followed plan
              </span>
            )}
          </div>

          {/* Notes */}
          {trade.notes && (
            <p className="text-[11px] text-white/40 leading-relaxed max-w-xl">{trade.notes}</p>
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
        <span className="text-[9px] font-semibold uppercase tracking-widest text-white/25">Date</span>
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
      <div className="flex-1 min-w-[90px]">
        <span className="text-[9px] font-semibold uppercase tracking-widest text-white/25">P&L</span>
      </div>
      <div className="w-[52px] flex-shrink-0 hidden lg:block">
        <span className="text-[9px] font-semibold uppercase tracking-widest text-white/25">R</span>
      </div>
      <div className="w-[110px] flex-shrink-0 hidden xl:block">
        <span className="text-[9px] font-semibold uppercase tracking-widest text-white/25">Setup</span>
      </div>
      <div className="w-20 flex-shrink-0">
        <span className="text-[9px] font-semibold uppercase tracking-widest text-white/25">Img</span>
      </div>
    </div>
  );
}

/* ─── Main export ──────────────────────────────────────────────────────── */
export default function CompactView({ trades, onEdit, onDelete, reviews, reviewLoading, onReviewTrade, onClearReview }) {
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


