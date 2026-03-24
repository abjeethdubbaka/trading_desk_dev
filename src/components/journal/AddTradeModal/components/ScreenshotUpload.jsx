import React, { useState, useEffect } from 'react';
import { Label } from "@/components/ui/label";
import { Upload, X, Loader2, Maximize2 } from 'lucide-react';
import { cn } from "@/lib/utils";
import { createMediaService } from '@/lib/services/MediaService.js';
import { db } from '@/lib/db/index.js';
import { indexedDBAdapter } from '@/lib/db/adapters/IndexedDBAdapter.js';

// Create media service instance
const mediaService = createMediaService(db, indexedDBAdapter);

const ScreenshotPreview = ({ id, index, onRemove, onView, url }) => {
  return (
    <div className="relative group">
      <img
        src={url}
        alt={`Screenshot ${index + 1}`}
        className="w-20 h-20 object-cover rounded-lg cursor-pointer hover:opacity-80 transition-all hover:scale-105"
        onClick={() => onView(url)}
        loading="lazy"
      />
      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center gap-1">
        <button
          type="button"
          onClick={() => onView(url)}
          className="p-1 hover:bg-white/20 rounded"
        >
          <Maximize2 className="w-3 h-3 text-white" />
        </button>
        <button
          type="button"
          onClick={() => onRemove(id)}
          className="p-1 hover:bg-red-500/80 rounded"
        >
          <X className="w-4 h-4 text-white" />
        </button>
      </div>
    </div>
  );
};

const ScreenshotUpload = ({ screenshotIds, uploading, onUpload, onRemove }) => {
  const fileInputRef = React.useRef(null);
  const [urls, setUrls] = useState({});

  // Resolve URLs from media IDs
  useEffect(() => {
    if (!screenshotIds || screenshotIds.length === 0) {
      setUrls({});
      return;
    }

    Promise.all(
      screenshotIds.map(async (id) => {
        try {
          const media = await mediaService.get(id);
          const url = media?.file_url || URL.createObjectURL(media?.file);
          return [id, url];
        } catch (error) {
          console.error('Failed to load screenshot:', id, error);
          return [id, null];
        }
      })
    ).then(pairs => {
      setUrls(Object.fromEntries(pairs.filter(([_, url]) => url !== null)));
    });
  }, [screenshotIds]);

  const handleFileChange = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;
    
    await onUpload(files);
    e.target.value = ''; // Reset input
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
    img.alt = 'Screenshot';
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
    <div className="space-y-2">
      <Label>Screenshots</Label>
      <div className="flex flex-wrap gap-2">
        {screenshotIds.map((id, i) => (
          <ScreenshotPreview
            key={id}
            id={id}
            index={i}
            url={urls[id]}
            onRemove={onRemove}
            onView={handleViewImage}
          />
        ))}
        
        <label className={cn(
          "w-20 h-20 border-2 border-dashed rounded-lg flex items-center justify-center cursor-pointer transition-all",
          uploading ? 'border-white/10 bg-white/5' : 'border-white/20 hover:border-white/40 hover:bg-white/5'
        )}>
          {uploading ? (
            <div className="flex flex-col items-center">
              <Loader2 className="w-5 h-5 animate-spin text-white/50 mb-1" />
              <span className="text-[10px] text-white/50">Uploading...</span>
            </div>
          ) : (
            <div className="flex flex-col items-center">
              <Upload className="w-5 h-5 text-white/50 mb-1" />
              <span className="text-[10px] text-white/50">Add</span>
            </div>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleFileChange}
            className="hidden"
            disabled={uploading}
          />
        </label>
      </div>
      
      {screenshotIds.length > 0 && (
        <p className="text-xs text-white/50 mt-2">
          {screenshotIds.length} screenshot(s) added. Click to view full size.
        </p>
      )}
    </div>
  );
};

export default React.memo(ScreenshotUpload);
