import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { formatDate, formatCurrency, formatPercent } from '../utils/formatters';
import { Image, Edit, Trash2, Maximize2, AlertCircle } from 'lucide-react';

export default function CompactView({ trades, onEdit, onDelete }) {
  const [expandedTrade, setExpandedTrade] = useState(null);
  const [imageStates, setImageStates] = useState({});

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

  // Debug: Log trade images to verify isolation
  if (process.env.NODE_ENV === 'development') {
    trades.forEach(trade => {
      if (trade.screenshots && trade.screenshots.length > 0) {
        console.log(`🖼️ Trade ${trade.id} has ${trade.screenshots.length} unique images:`, trade.screenshots);
      }
    });
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs border-collapse">
        <thead className="bg-white/5 border-b border-white/10">
          <tr className="text-white/70 font-semibold uppercase tracking-wider">
            <th className="p-2 text-left w-[90px]">Date</th>
            <th className="p-2 text-left w-[80px]">Symbol</th>
            <th className="p-2 text-left w-[60px]">Dir</th>
            <th className="p-2 text-right w-[90px]">Entry</th>
            <th className="p-2 text-right w-[90px]">Exit</th>
            <th className="p-2 text-right w-[70px]">Size</th>
            <th className="p-2 text-right w-[100px]">P&L ($)</th>
            <th className="p-2 text-right w-[80px]">P&L (%)</th>
            <th className="p-2 text-left w-[140px]">Setup / Quality</th>
            <th className="p-2 text-center w-[120px]">Images</th>
            <th className="p-2 text-center w-[80px]">Actions</th>
          </tr>
        </thead>
        
        <tbody className="divide-y divide-white/10">
          {trades.map(trade => {
            const pnl = trade.pnl || 0;
            const entryPrice = trade.entry_price || 0;
            const positionSize = trade.position_size || 0;
            const pnlPercent = entryPrice && positionSize 
              ? (pnl / (entryPrice * positionSize)) * 100 
              : 0;
            
            return (
              <tr 
                key={trade.id}
                className="hover:bg-white/5 transition-colors cursor-pointer group"
                onClick={() => onEdit(trade)}
              >
                <td className="p-2 text-white/60 whitespace-nowrap">
                  {formatDate(trade.entry_time || trade.created_date)}
                </td>
                
                <td className="p-2">
                  <span className="font-semibold text-white">
                    {trade.symbol || '-'}
                  </span>
                </td>
                
                <td className="p-2">
                  <span className={cn(
                    "inline-block px-1.5 py-0.5 rounded text-xs font-medium",
                    trade.direction === 'long' 
                      ? "bg-emerald-500/20 text-emerald-400" 
                      : "bg-red-500/20 text-red-400"
                  )}>
                    {trade.direction === 'long' ? 'L' : 'S'}
                  </span>
                </td>
                
                <td className="p-2 text-right text-white/80 whitespace-nowrap">
                  {formatCurrency(entryPrice)}
                </td>
                
                <td className="p-2 text-right text-white/80 whitespace-nowrap">
                  {formatCurrency(trade.exit_price)}
                </td>
                
                <td className="p-2 text-right text-white/80 whitespace-nowrap">
                  {positionSize || '-'}
                </td>
                
                <td className="p-2 text-right whitespace-nowrap">
                  <span className={cn(
                    "font-medium",
                    pnl >= 0 ? "text-emerald-400" : "text-red-400"
                  )}>
                    {formatCurrency(pnl)}
                  </span>
                </td>
                
                <td className="p-2 text-right whitespace-nowrap">
                  <span className={cn(
                    "font-medium",
                    pnl >= 0 ? "text-emerald-400" : "text-red-400"
                  )}>
                    {pnlPercent !== 0 ? formatPercent(pnlPercent) : '-'}
                  </span>
                </td>
                
                <td className="p-2 text-white/60 max-w-[140px]">
                  <div className="truncate" title={trade.setup_type || '-'}>{trade.setup_type || '-'}</div>
                  <div className="text-[10px] text-white/45 truncate" title={trade.setup_grade || 'No Grade'}>
                    Quality: {trade.setup_grade || 'No Grade'}
                  </div>
                </td>
                
                <td className="p-2 text-center">
                  {trade.screenshots && trade.screenshots.length > 0 ? (
                    <div className="flex gap-1 items-center justify-center">
                      {trade.screenshots.slice(0, 3).map((screenshot, index) => {
                        const imageKey = `${trade.id}-${index}`;
                        const imageState = imageStates[imageKey];
                        
                        return (
                          <div key={imageKey} className="w-8 h-8 relative">
                            {imageState !== 'loaded' && (
                              <div className="absolute inset-0 bg-white/10 rounded flex items-center justify-center">
                                {imageState === 'error' ? (
                                  <AlertCircle className="w-3 h-3 text-red-400" />
                                ) : (
                                  <div className="w-3 h-3 border-2 border-white/30 border-t-white/60 rounded-full animate-spin" />
                                )}
                              </div>
                            )}
                            <img
                              src={screenshot}
                              alt={`Trade ${trade.id} Screenshot ${index + 1}`}
                              className={cn(
                                "w-8 h-8 object-cover rounded cursor-pointer hover:opacity-80 transition-opacity",
                                imageState === 'error' && "opacity-50"
                              )}
                              onClick={(e) => {
                                e.stopPropagation();
                                if (imageState === 'loaded') {
                                  handleViewImage(screenshot);
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
                      {trade.screenshots.length > 3 && (
                        <span className="text-xs text-white/50 ml-1">
                          +{trade.screenshots.length - 3}
                        </span>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center justify-center">
                      <Image className="w-4 h-4 text-white/20" />
                    </div>
                  )}
                </td>
                
                <td className="p-2 text-center">
                  <div className="flex gap-1 justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onEdit(trade);
                      }}
                      className="text-white/60 hover:text-white px-1"
                    >
                      Edit
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDelete(trade.id);
                      }}
                      className="text-red-400/60 hover:text-red-400 px-1"
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
