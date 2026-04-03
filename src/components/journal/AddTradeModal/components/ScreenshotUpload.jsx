import React from 'react';
import { Label } from "@/components/ui/label";
import { Upload, X, Loader2, Maximize2, AlertCircle } from 'lucide-react';
import { cn } from "@/lib/utils";
import ImageLightbox from '@/components/ui/ImageLightbox';
import { useScreenshotIdsUrls } from '@/components/journal/shared/media/useScreenshotUrls';

const ScreenshotPreview = ({ id, index, onRemove, onView, url, status }) => {
  if (status === 'error') {
    return (
      <div className="w-20 h-20 rounded-lg border border-red-500/30 bg-red-500/10 flex items-center justify-center">
        <AlertCircle className="w-4 h-4 text-red-300" />
      </div>
    );
  }

  return (
    <div className="relative group w-20 h-20">
      {status !== 'loaded' && (
        <div className="absolute inset-0 rounded-lg border border-white/10 bg-white/5 animate-pulse" />
      )}
      {url && (
        <img
          src={url}
          alt={`Screenshot ${index + 1}`}
          className="w-20 h-20 object-cover rounded-lg cursor-pointer hover:opacity-80 transition-all hover:scale-105"
          onClick={() => onView(url)}
          loading="lazy"
        />
      )}
      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center gap-1">
        <button
          type="button"
          onClick={() => url && onView(url)}
          className="p-1 hover:bg-white/20 rounded"
          disabled={!url}
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
  const [lightboxUrl, setLightboxUrl] = React.useState(null);
  const { urlsById, statusById } = useScreenshotIdsUrls(screenshotIds);

  const handleFileChange = async (event) => {
    const files = Array.from(event.target.files);
    if (files.length === 0) return;

    await onUpload(files);
    event.target.value = '';
  };

  return (
    <div className="space-y-2">
      <Label>Screenshots</Label>
      <div className="flex flex-wrap gap-2">
        {screenshotIds.map((id, index) => (
          <ScreenshotPreview
            key={id}
            id={id}
            index={index}
            url={urlsById[id]}
            status={statusById[id] || 'loading'}
            onRemove={onRemove}
            onView={setLightboxUrl}
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

      <ImageLightbox
        isOpen={Boolean(lightboxUrl)}
        imageUrl={lightboxUrl}
        alt="Screenshot"
        onClose={() => setLightboxUrl(null)}
      />
    </div>
  );
};

export default React.memo(ScreenshotUpload);
