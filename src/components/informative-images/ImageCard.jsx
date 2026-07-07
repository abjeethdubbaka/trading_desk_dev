import React from 'react';
import { Images, Pencil, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';

const SETUP_TONE = 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300';
const OTHER_TONE = 'border-cyan-500/30 bg-cyan-500/10 text-cyan-300';

function formatDate(value) {
  const timestamp = Date.parse(String(value || ''));
  if (!Number.isFinite(timestamp)) return null;
  return new Date(timestamp).toLocaleDateString();
}

export default function ImageCard({ item, onView, onEdit, onDelete }) {
  const images = Array.isArray(item?.images) ? item.images : [];
  const coverImage = images[0];
  const tone = item?.category_type === 'setup' ? SETUP_TONE : OTHER_TONE;
  const dateLabel = formatDate(item?.created_date);

  return (
    <div className="group relative rounded-xl border border-white/10 bg-[#13131e] overflow-hidden">
      <button
        type="button"
        onClick={() => onView(0)}
        className="block w-full aspect-video bg-black/40"
      >
        {coverImage ? (
          <img src={coverImage} alt={item?.note || 'Informative image'} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-white/20">
            <Images className="w-8 h-8" />
          </div>
        )}
      </button>

      {images.length > 1 && (
        <span className="absolute top-2 right-2 rounded-full bg-black/60 border border-white/15 px-1.5 py-0.5 text-[10px] text-white/70">
          +{images.length - 1}
        </span>
      )}

      <div className="absolute top-2 left-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
        <button
          type="button"
          onClick={() => onEdit(item)}
          className="p-1.5 rounded-full bg-black/60 border border-white/15 text-white/50 hover:text-cyan-300 hover:border-cyan-400/40 transition-colors"
          title="Edit"
        >
          <Pencil className="w-3 h-3" />
        </button>
        <button
          type="button"
          onClick={() => onDelete(item.id)}
          className="p-1.5 rounded-full bg-black/60 border border-white/15 text-white/50 hover:text-rose-300 hover:border-rose-400/40 transition-colors"
          title="Delete"
        >
          <Trash2 className="w-3 h-3" />
        </button>
      </div>

      <div className="p-3 space-y-1.5">
        <div className="flex items-center justify-between gap-2">
          <span className={cn('rounded border px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide', tone)}>
            {item?.category || 'Other'}
          </span>
          {dateLabel && <span className="text-[10px] text-white/30">{dateLabel}</span>}
        </div>
        {item?.note && (
          <p className="text-xs text-white/65 line-clamp-2">{item.note}</p>
        )}
      </div>
    </div>
  );
}
