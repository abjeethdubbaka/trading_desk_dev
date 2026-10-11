import React, { useState } from 'react';
import { Image, Upload, X } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { useResolvedImages } from '@/lib/hooks/useLocalImages';

export const MAX_ENTRY_IMAGES = 5;

/** Below this width a chart was stored small, and no viewer can sharpen it. */
const LOW_RESOLUTION_WIDTH = 1200;

function ChartThumb({ url, index, onRemove }) {
  const [width, setWidth] = useState(null);
  const isLowResolution = width != null && width < LOW_RESOLUTION_WIDTH;

  return (
    <div className="relative group w-20 h-20 flex-shrink-0">
      {url ? (
      <img
        src={url}
        alt={`Chart ${index + 1}`}
        onLoad={(event) => setWidth(event.currentTarget.naturalWidth)}
        className={`w-20 h-20 object-cover rounded-lg border ${isLowResolution ? 'border-amber-400/50' : 'border-white/10'}`}
      />
      ) : (
        <div className="h-20 w-20 animate-pulse rounded-lg border border-white/10 bg-white/[0.05]" />
      )}
      {isLowResolution && (
        <span
          className="absolute bottom-0.5 left-0.5 rounded bg-amber-500/85 px-1 text-[8px] font-bold uppercase text-black"
          title={`Stored ${width}px wide. Remove it and upload the original screenshot for a sharp chart.`}
        >
          low-res
        </span>
      )}
      <button
        type="button"
        onClick={() => onRemove(index)}
        className="absolute top-0.5 right-0.5 p-0.5 rounded-full bg-black/75 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-rose-500/80"
      >
        <X className="w-3 h-3" />
      </button>
    </div>
  );
}

export default function EntryImagesField({ images = [], onUpload, onRemove }) {
  // A chart stored on disk is read on demand; an inline one passes straight
  // through, so both kinds show while a setup is being edited.
  // A chart on disk shows once it has been read; until then its slot holds
  // nothing. Never the raw "local:" reference — the page's security policy
  // blocks loading it, which only fills the console with errors.
  const resolved = useResolvedImages(images);

  return (
    <div className="space-y-2 rounded-xl border border-white/10 bg-black/20 p-3">
      <div className="flex items-center justify-between gap-2">
        <Label className="flex items-center gap-1.5"><Image className="w-3.5 h-3.5 opacity-60" />Chart Images</Label>
        <span className="text-[10px] text-white/35">{images.length}/{MAX_ENTRY_IMAGES}</span>
      </div>
      <div className="flex flex-wrap gap-2">
        {resolved.map((url, i) => (
          <ChartThumb key={`${i}-${String(url).length}`} url={url} index={i} onRemove={onRemove} />
        ))}
        {images.length < MAX_ENTRY_IMAGES && (
          <label className="w-20 h-20 border-2 border-dashed border-white/20 hover:border-white/40 rounded-lg flex flex-col items-center justify-center cursor-pointer transition-colors flex-shrink-0">
            <Upload className="w-5 h-5 text-white/40 mb-0.5" />
            <span className="text-[10px] text-white/40">Add</span>
            <input type="file" accept="image/*" multiple className="hidden" onChange={onUpload} />
          </label>
        )}
      </div>
      <p className="text-[10px] text-white/30">
        Upload chart examples (max {MAX_ENTRY_IMAGES}). Charts marked low-res were stored small by an earlier upload — remove and re-upload the original screenshot to get a sharp copy.
      </p>
    </div>
  );
}
