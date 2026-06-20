/**
 * Side-by-side screenshot viewer for trade charts.
 * Single image → classic full-screen view.
 * Multiple images → panels shown side by side, per-panel zoom, thumbnail strip.
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Minus, Plus, LayoutPanelLeft, Maximize2 } from 'lucide-react';
import { cn } from '@/lib/utils';

const ZOOM_MIN = 0.25;
const ZOOM_MAX = 5;
const ZOOM_STEP = 0.15;
const MAX_SIDE_BY_SIDE = 3;

function clampZoom(z) {
  return Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, Math.round(z * 100) / 100));
}

// ── Single panel ──────────────────────────────────────────────────────────────
function ImagePanel({ url, index, scale, onZoom, label, onClick, isFocused }) {
  const panelRef = useRef(null);

  useEffect(() => {
    const el = panelRef.current;
    if (!el) return;
    const handler = (e) => {
      e.preventDefault();
      onZoom(index, e.deltaY > 0 ? -ZOOM_STEP : ZOOM_STEP);
    };
    el.addEventListener('wheel', handler, { passive: false });
    return () => el.removeEventListener('wheel', handler);
  }, [index, onZoom]);

  return (
    <div
      ref={panelRef}
      className={cn(
        'relative flex-1 min-w-0 overflow-auto flex items-center justify-center',
        'border-r border-white/10 last:border-r-0',
        isFocused && 'ring-1 ring-inset ring-cyan-500/30',
      )}
      onClick={onClick}
    >
      {/* Panel label */}
      <div className="absolute top-2 left-2 z-10 px-1.5 py-0.5 rounded bg-black/50 border border-white/15 text-[10px] text-white/55 font-mono select-none">
        {label}
      </div>

      {/* Zoom badge */}
      {scale !== 1 && (
        <div className="absolute top-2 right-2 z-10 px-1.5 py-0.5 rounded bg-black/50 border border-white/15 text-[10px] text-white/55 font-mono select-none">
          {Math.round(scale * 100)}%
        </div>
      )}

      <img
        src={url}
        alt={label}
        draggable={false}
        className="max-w-full max-h-full object-contain select-none rounded"
        style={{
          transform: `scale(${scale})`,
          transformOrigin: 'center center',
          transition: 'transform 100ms ease-out',
        }}
      />
    </div>
  );
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function MultiImageLightbox({ isOpen, images = [], startIndex = 0, onClose }) {
  const [mode, setMode] = useState('side');   // 'side' | 'single'
  const [focusIdx, setFocusIdx] = useState(0);
  const [scales, setScales] = useState([]);
  const stripRef = useRef(null);

  // Reset when opened
  useEffect(() => {
    if (!isOpen) return;
    setFocusIdx(Math.min(startIndex, Math.max(0, images.length - 1)));
    setScales(Array(images.length).fill(1));
    setMode(images.length > 1 ? 'side' : 'single');
  }, [isOpen, startIndex, images.length]);

  // Keyboard
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e) => {
      if (e.key === 'Escape') { onClose?.(); return; }
      if (e.key === 'ArrowRight') setFocusIdx((i) => Math.min(i + 1, images.length - 1));
      if (e.key === 'ArrowLeft')  setFocusIdx((i) => Math.max(i - 1, 0));
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isOpen, onClose, images.length]);

  // Scroll thumbnail strip to keep focused thumb visible
  useEffect(() => {
    if (!stripRef.current) return;
    const thumb = stripRef.current.children[focusIdx];
    thumb?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
  }, [focusIdx]);

  const handleZoom = useCallback((idx, delta) => {
    setScales((prev) => {
      const next = [...prev];
      next[idx] = clampZoom((next[idx] ?? 1) + delta);
      return next;
    });
  }, []);

  const resetZoom = useCallback((idx) => {
    setScales((prev) => { const n = [...prev]; n[idx] = 1; return n; });
  }, []);

  const resetAllZoom = useCallback(() => setScales(Array(images.length).fill(1)), [images.length]);

  if (!isOpen || images.length === 0 || typeof document === 'undefined') return null;

  // Which images to show as panels
  const visibleCount = mode === 'single' ? 1 : Math.min(images.length, MAX_SIDE_BY_SIDE);
  // In side mode, start panels from focusIdx (clamped so we don't run off the end)
  const panelStart = mode === 'single'
    ? focusIdx
    : Math.min(focusIdx, Math.max(0, images.length - visibleCount));
  const panelImages = images.slice(panelStart, panelStart + visibleCount);

  const focusedScale = scales[focusIdx] ?? 1;
  const isMulti = images.length > 1;

  return createPortal(
    <div
      className="fixed inset-0 z-[120] bg-black/97 flex flex-col"
      onClick={onClose}
    >
      {/* ── Toolbar ── */}
      <div
        className="flex-shrink-0 flex items-center gap-2 px-3 py-2 border-b border-white/10 bg-black/60"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Image count */}
        <span className="text-[11px] text-white/40 font-mono mr-1">
          {isMulti ? `${focusIdx + 1} / ${images.length}` : '1 / 1'}
        </span>

        {/* Zoom controls for focused panel */}
        <div className="flex items-center gap-1 bg-white/[0.06] border border-white/10 rounded-lg px-2 py-1">
          <button
            type="button"
            onClick={() => handleZoom(focusIdx, -ZOOM_STEP)}
            className="p-0.5 rounded hover:bg-white/15 text-white/60 hover:text-white transition-colors"
          >
            <Minus className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => resetZoom(focusIdx)}
            className="text-[11px] text-white/50 hover:text-white min-w-[44px] text-center font-mono transition-colors"
          >
            {Math.round(focusedScale * 100)}%
          </button>
          <button
            type="button"
            onClick={() => handleZoom(focusIdx, ZOOM_STEP)}
            className="p-0.5 rounded hover:bg-white/15 text-white/60 hover:text-white transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>

        {focusedScale !== 1 && (
          <button
            type="button"
            onClick={resetAllZoom}
            className="text-[10px] text-white/35 hover:text-white/70 transition-colors"
          >
            Reset all
          </button>
        )}

        <div className="flex-1" />

        {/* Layout toggle — only when multiple images */}
        {isMulti && (
          <div className="flex items-center gap-1 bg-white/[0.06] border border-white/10 rounded-lg p-0.5">
            <button
              type="button"
              onClick={() => setMode('side')}
              title="Side by side"
              className={cn(
                'flex items-center gap-1 px-2.5 py-1 rounded text-[11px] transition-colors',
                mode === 'side'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                  : 'text-white/40 hover:text-white/70',
              )}
            >
              <LayoutPanelLeft className="w-3.5 h-3.5" />
              Side by side
            </button>
            <button
              type="button"
              onClick={() => setMode('single')}
              title="Focus one"
              className={cn(
                'flex items-center gap-1 px-2.5 py-1 rounded text-[11px] transition-colors',
                mode === 'single'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                  : 'text-white/40 hover:text-white/70',
              )}
            >
              <Maximize2 className="w-3.5 h-3.5" />
              Focus
            </button>
          </div>
        )}

        {/* Close */}
        <button
          type="button"
          onClick={onClose}
          className="ml-1 p-1.5 rounded-full bg-white/[0.06] border border-white/10 text-white/50 hover:bg-white/15 hover:text-white transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* ── Panels ── */}
      <div
        className="flex flex-1 min-h-0 divide-x divide-white/10"
        onClick={(e) => e.stopPropagation()}
      >
        {panelImages.map((url, i) => {
          const globalIdx = panelStart + i;
          return (
            <ImagePanel
              key={globalIdx}
              url={url}
              index={globalIdx}
              scale={scales[globalIdx] ?? 1}
              onZoom={handleZoom}
              label={`Chart ${globalIdx + 1}`}
              isFocused={globalIdx === focusIdx}
              onClick={() => setFocusIdx(globalIdx)}
            />
          );
        })}
      </div>

      {/* ── Thumbnail strip — only when 2+ images ── */}
      {isMulti && (
        <div
          className="flex-shrink-0 border-t border-white/10 bg-black/60 px-3 py-2"
          onClick={(e) => e.stopPropagation()}
        >
          <div
            ref={stripRef}
            className="flex gap-2 overflow-x-auto scrollbar-thin"
          >
            {images.map((url, i) => {
              const isInView = i >= panelStart && i < panelStart + visibleCount;
              const isFocused = i === focusIdx;
              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => {
                    setFocusIdx(i);
                    if (mode === 'side') {
                      // nothing extra needed — panelStart recalculates
                    }
                  }}
                  className={cn(
                    'flex-shrink-0 w-14 h-14 rounded-lg overflow-hidden border-2 transition-all',
                    isFocused
                      ? 'border-cyan-400 scale-105 shadow-[0_0_8px_rgba(34,211,238,0.5)]'
                      : isInView
                        ? 'border-white/30 opacity-80'
                        : 'border-white/10 opacity-45 hover:opacity-70 hover:border-white/25',
                  )}
                >
                  <img src={url} alt={`Chart ${i + 1}`} className="w-full h-full object-cover" />
                </button>
              );
            })}
          </div>
          <p className="mt-1.5 text-[9px] text-white/25 text-center select-none">
            {mode === 'side'
              ? 'Click thumbnail to navigate · Scroll on panel to zoom · ← → arrow keys'
              : 'Click thumbnail to switch · Scroll to zoom · ← → arrow keys'}
          </p>
        </div>
      )}
    </div>,
    document.body,
  );
}
