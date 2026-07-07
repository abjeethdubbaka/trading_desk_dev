import React from 'react';
import { Image, Upload, X } from 'lucide-react';
import { Label } from '@/components/ui/label';

export const MAX_ENTRY_IMAGES = 5;

export default function EntryImagesField({ images = [], onUpload, onRemove }) {
  return (
    <div className="space-y-2 rounded-xl border border-white/10 bg-black/20 p-3">
      <div className="flex items-center justify-between gap-2">
        <Label className="flex items-center gap-1.5"><Image className="w-3.5 h-3.5 opacity-60" />Chart Images</Label>
        <span className="text-[10px] text-white/35">{images.length}/{MAX_ENTRY_IMAGES}</span>
      </div>
      <div className="flex flex-wrap gap-2">
        {images.map((url, i) => (
          <div key={i} className="relative group w-20 h-20 flex-shrink-0">
            <img src={url} alt={`Chart ${i + 1}`} className="w-20 h-20 object-cover rounded-lg border border-white/10" />
            <button
              type="button"
              onClick={() => onRemove(i)}
              className="absolute top-0.5 right-0.5 p-0.5 rounded-full bg-black/75 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-rose-500/80"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        ))}
        {images.length < MAX_ENTRY_IMAGES && (
          <label className="w-20 h-20 border-2 border-dashed border-white/20 hover:border-white/40 rounded-lg flex flex-col items-center justify-center cursor-pointer transition-colors flex-shrink-0">
            <Upload className="w-5 h-5 text-white/40 mb-0.5" />
            <span className="text-[10px] text-white/40">Add</span>
            <input type="file" accept="image/*" multiple className="hidden" onChange={onUpload} />
          </label>
        )}
      </div>
      <p className="text-[10px] text-white/30">Upload chart examples (max {MAX_ENTRY_IMAGES}). Images are compressed and stored with the setup.</p>
    </div>
  );
}
