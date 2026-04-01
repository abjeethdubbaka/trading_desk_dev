import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils/general';
import { formatDate, formatTime, formatCurrency } from '../utils/formatters';
import { AlertCircle } from 'lucide-react';
import { createMediaService } from '@/lib/services/MediaService.js';
import { db } from '@/lib/db/index.js';
import { indexedDBAdapter } from '@/lib/db/adapters/IndexedDBAdapter.js';
import { getRuleSuggestionsFromTrade } from '@/components/dosanddonts/storage';

// Create media service instance
const mediaService = createMediaService(db, indexedDBAdapter);

export default function DetailedView({ trades, onEdit, onSaveNoteAsRule }) {
  const [imageStates, setImageStates] = useState({});
  const [screenshotUrls, setScreenshotUrls] = useState({});

  // Resolve screenshot URLs from IDs
  useEffect(() => {
    const allScreenshotIds = trades.flatMap(trade => trade.screenshots || []);
    
    if (allScreenshotIds.length === 0) {
      setScreenshotUrls({});
      return;
    }

    Promise.all(
      allScreenshotIds.map(async (id) => {
        try {
          const media = await mediaService.get(id);
          const url = media?.file_url || URL.createObjectURL(media?.file);
          return [id, url];
        } catch (error) {
          
          return [id, null];
        }
      })
    ).then(pairs => {
      setScreenshotUrls(Object.fromEntries(pairs.filter(([_, url]) => url !== null)));
    });
  }, [trades]);

  const isVWAPPullback = (setupType) => (setupType || '').toLowerCase().trim() === 'vwap pullback';
  const getStepStatus = (step, keys) => keys.every((key) => !!step?.[key]);

  const handleImageLoad = (tradeId, index) => {
    setImageStates(prev => ({
      ...prev,
      [`${tradeId}-${index}`]: 'loaded'
    }));
  };

  const handleImageError = (tradeId, index) => {
    setImageStates(prev => ({
      ...prev,
      [`${tradeId}-${index}`]: 'error'
    }));
  };

  const handleViewImage = (url) => {
    let scale = 1;
    const minScale = 0.5;
    const maxScale = 5;

    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 z-50 bg-black/95 p-3';

    const stage = document.createElement('div');
    stage.className = 'relative w-full h-full flex items-center justify-center';

    const controls = document.createElement('div');
    controls.className = 'absolute top-3 left-3 z-10 flex items-center gap-2 bg-black/60 border border-white/20 rounded-md px-2 py-1 text-white';

    const zoomOutBtn = document.createElement('button');
    zoomOutBtn.type = 'button';
    zoomOutBtn.className = 'px-2 py-1 bg-white/10 rounded hover:bg-white/20 transition-colors';
    zoomOutBtn.textContent = '-';

    const zoomLabel = document.createElement('span');
    zoomLabel.className = 'text-xs min-w-[48px] text-center';

    const zoomInBtn = document.createElement('button');
    zoomInBtn.type = 'button';
    zoomInBtn.className = 'px-2 py-1 bg-white/10 rounded hover:bg-white/20 transition-colors';
    zoomInBtn.textContent = '+';

    const resetBtn = document.createElement('button');
    resetBtn.type = 'button';
    resetBtn.className = 'px-2 py-1 bg-white/10 rounded hover:bg-white/20 transition-colors text-xs';
    resetBtn.textContent = 'Reset';

    const closeBtn = document.createElement('button');
    closeBtn.type = 'button';
    closeBtn.className = 'absolute top-3 right-3 z-10 p-2 bg-white/10 rounded-full hover:bg-white/20 transition-colors text-white';
    closeBtn.innerHTML = '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>';

    const imageWrap = document.createElement('div');
    imageWrap.className = 'w-full h-full overflow-auto flex items-center justify-center';

    const img = document.createElement('img');
    img.src = url;
    img.alt = 'Trade screenshot';
    img.className = 'max-w-[92vw] max-h-[92vh] object-contain rounded-lg shadow-2xl select-none';
    img.style.transformOrigin = 'center center';
    img.style.transition = 'transform 120ms ease-out';

    const applyScale = () => {
      img.style.transform = `scale(${scale})`;
      zoomLabel.textContent = `${Math.round(scale * 100)}%`;
    };

    const closeModal = () => {
      window.removeEventListener('keydown', onKeyDown);
      modal.remove();
    };

    const onKeyDown = (event) => {
      if (event.key === 'Escape') {
        closeModal();
      }
    };

    zoomOutBtn.onclick = (event) => {
      event.stopPropagation();
      scale = Math.max(minScale, Math.round((scale - 0.1) * 10) / 10);
      applyScale();
    };

    zoomInBtn.onclick = (event) => {
      event.stopPropagation();
      scale = Math.min(maxScale, Math.round((scale + 0.1) * 10) / 10);
      applyScale();
    };

    resetBtn.onclick = (event) => {
      event.stopPropagation();
      scale = 1;
      applyScale();
    };

    imageWrap.onwheel = (event) => {
      event.preventDefault();
      const delta = event.deltaY > 0 ? -0.1 : 0.1;
      scale = Math.min(maxScale, Math.max(minScale, Math.round((scale + delta) * 10) / 10));
      applyScale();
    };

    modal.onclick = closeModal;
    stage.onclick = (event) => event.stopPropagation();
    closeBtn.onclick = (event) => {
      event.stopPropagation();
      closeModal();
    };

    controls.appendChild(zoomOutBtn);
    controls.appendChild(zoomLabel);
    controls.appendChild(zoomInBtn);
    controls.appendChild(resetBtn);

    imageWrap.appendChild(img);
    stage.appendChild(controls);
    stage.appendChild(closeBtn);
    stage.appendChild(imageWrap);
    modal.appendChild(stage);
    document.body.appendChild(modal);
    window.addEventListener('keydown', onKeyDown);
    applyScale();
  };

  return (
    <div className="grid grid-cols-2 gap-3 p-3 max-h-[600px] overflow-y-auto">
      {trades.map((trade) => {
        const suggestionLists = getRuleSuggestionsFromTrade(trade);
        return (
        <div
          key={trade.id}
          className="bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg p-3 transition-colors cursor-pointer"
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
              <div className="text-[11px] text-white/45">
                Entry: {trade.entry_time ? formatTime(trade.entry_time) : '-'} | Exit: {trade.exit_time ? formatTime(trade.exit_time) : '-'}
              </div>
            </div>
            <div className={cn(
              "text-sm font-semibold",
              (trade.pnl || 0) >= 0 ? "text-emerald-400" : "text-red-400"
            )}>
              {formatCurrency(trade.pnl)}
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

          {trade.setup_type && (
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs px-2 py-1 bg-white/10 rounded text-white/80">
                {trade.setup_type}
              </span>
              <span
                className={cn(
                  'text-xs px-2 py-1 rounded',
                  trade.setup_grade ? 'bg-blue-500/20 text-blue-300' : 'bg-white/10 text-white/60'
                )}
              >
                Setup Quality: {trade.setup_grade || 'No Grade'}
              </span>
            </div>
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

          <div className="text-xs text-white/60 border-t border-white/10 pt-2 mt-1 whitespace-pre-wrap break-words">
            {trade.notes ? trade.notes : 'No notes added.'}
          </div>
          {trade.notes && typeof onSaveNoteAsRule === 'function' && (
            <div className="mt-2 space-y-2" onClick={(event) => event.stopPropagation()}>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => onSaveNoteAsRule(trade, 'do')}
                  className="text-[10px] px-2 py-1 rounded border border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/15 transition-colors"
                >
                  Save Note as Do
                </button>
                <button
                  type="button"
                  onClick={() => onSaveNoteAsRule(trade, 'dont')}
                  className="text-[10px] px-2 py-1 rounded border border-rose-500/30 text-rose-300 hover:bg-rose-500/15 transition-colors"
                >
                  Save Note as Don&apos;t
                </button>
              </div>

              <div className="grid sm:grid-cols-2 gap-2">
                <div className="rounded border border-emerald-500/20 bg-emerald-500/5 p-2 space-y-1.5">
                  <p className="text-[10px] uppercase tracking-wide text-emerald-300/85">Suggestions: Repeat (Do)</p>
                  {suggestionLists.dos.map((suggestion, suggestionIndex) => (
                    <button
                      key={`do-${trade.id}-${suggestionIndex}`}
                      type="button"
                      onClick={() => onSaveNoteAsRule(trade, 'do', suggestion)}
                      className="w-full text-left text-[10px] text-emerald-100/85 border border-emerald-500/20 rounded px-2 py-1 hover:bg-emerald-500/15 transition-colors"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
                <div className="rounded border border-rose-500/20 bg-rose-500/5 p-2 space-y-1.5">
                  <p className="text-[10px] uppercase tracking-wide text-rose-300/85">Suggestions: What Went Wrong (Don&apos;t)</p>
                  {suggestionLists.donts.map((suggestion, suggestionIndex) => (
                    <button
                      key={`dont-${trade.id}-${suggestionIndex}`}
                      type="button"
                      onClick={() => onSaveNoteAsRule(trade, 'dont', suggestion)}
                      className="w-full text-left text-[10px] text-rose-100/85 border border-rose-500/20 rounded px-2 py-1 hover:bg-rose-500/15 transition-colors"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Images Section */}
          {trade.screenshots && trade.screenshots.length > 0 && (
            <div className="mt-2 pt-2 border-t border-white/10">
              <div className="flex gap-1 flex-wrap">
                {trade.screenshots.slice(0, 4).map((screenshotId, index) => {
                  const imageKey = `${trade.id}-${index}`;
                  const imageState = imageStates[imageKey];
                  const screenshotUrl = screenshotUrls[screenshotId];
                  
                  return (
                    <div key={imageKey} className="w-12 h-12 relative">
                      {imageState !== 'loaded' && (
                        <div className="absolute inset-0 bg-white/10 rounded flex items-center justify-center">
                          {imageState === 'error' ? (
                            <AlertCircle className="w-4 h-4 text-red-400" />
                          ) : (
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white/60 rounded-full animate-spin" />
                          )}
                        </div>
                      )}
                      <img
                        src={screenshotUrl}
                        alt={`Trade ${trade.id} Screenshot ${index + 1}`}
                        className={cn(
                          "w-12 h-12 object-cover rounded cursor-pointer hover:opacity-80 transition-opacity",
                          imageState === 'error' && "opacity-50"
                        )}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (imageState === 'loaded' && screenshotUrl) {
                            handleViewImage(screenshotUrl);
                          }
                        }}
                        onLoad={() => handleImageLoad(trade.id, index)}
                        onError={() => handleImageError(trade.id, index)}
                        loading="lazy"
                        style={{ display: imageState === 'loaded' || imageState === 'error' ? 'block' : 'none' }}
                      />
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
      })}
    </div>
  );
}


