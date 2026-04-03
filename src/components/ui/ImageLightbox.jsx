import React, { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { Minus, Plus, X } from 'lucide-react';

export default function ImageLightbox({ isOpen, imageUrl, alt = 'Image', onClose }) {
  const [scale, setScale] = useState(1);
  const minScale = 0.5;
  const maxScale = 5;

  useEffect(() => {
    if (!isOpen) return;
    setScale(1);
  }, [isOpen, imageUrl]);

  useEffect(() => {
    if (!isOpen) return;

    const onKeyDown = (event) => {
      if (event.key === 'Escape') onClose?.();
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, onClose]);

  const content = useMemo(() => {
    if (!isOpen || !imageUrl) return null;

    const zoomOut = () => setScale((prev) => Math.max(minScale, Math.round((prev - 0.1) * 10) / 10));
    const zoomIn = () => setScale((prev) => Math.min(maxScale, Math.round((prev + 0.1) * 10) / 10));
    const resetZoom = () => setScale(1);

    return (
      <div
        className="fixed inset-0 z-[120] bg-black/95 p-3"
        role="dialog"
        aria-modal="true"
        aria-label="Image preview"
        onClick={onClose}
      >
        <div
          className="relative w-full h-full flex items-center justify-center"
          onClick={(event) => event.stopPropagation()}
        >
          <div className="absolute top-3 left-3 z-10 flex items-center gap-2 bg-black/60 border border-white/20 rounded-md px-2 py-1 text-white">
            <button
              type="button"
              onClick={zoomOut}
              className="px-2 py-1 bg-white/10 rounded hover:bg-white/20 transition-colors"
              aria-label="Zoom out"
            >
              <Minus className="w-3.5 h-3.5" />
            </button>
            <span className="text-xs min-w-[48px] text-center">{Math.round(scale * 100)}%</span>
            <button
              type="button"
              onClick={zoomIn}
              className="px-2 py-1 bg-white/10 rounded hover:bg-white/20 transition-colors"
              aria-label="Zoom in"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={resetZoom}
              className="px-2 py-1 bg-white/10 rounded hover:bg-white/20 transition-colors text-xs"
            >
              Reset
            </button>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="absolute top-3 right-3 z-10 p-2 bg-white/10 rounded-full hover:bg-white/20 transition-colors text-white"
            aria-label="Close image preview"
          >
            <X className="w-5 h-5" />
          </button>

          <div
            className="w-full h-full overflow-auto flex items-center justify-center"
            onWheel={(event) => {
              event.preventDefault();
              const delta = event.deltaY > 0 ? -0.1 : 0.1;
              setScale((prev) => Math.min(maxScale, Math.max(minScale, Math.round((prev + delta) * 10) / 10)));
            }}
          >
            <img
              src={imageUrl}
              alt={alt}
              className="max-w-[92vw] max-h-[92vh] object-contain rounded-lg shadow-2xl select-none"
              style={{
                transform: `scale(${scale})`,
                transformOrigin: 'center center',
                transition: 'transform 120ms ease-out',
              }}
            />
          </div>
        </div>
      </div>
    );
  }, [alt, imageUrl, isOpen, maxScale, minScale, onClose, scale]);

  if (!content || typeof document === 'undefined') return null;
  return createPortal(content, document.body);
}
