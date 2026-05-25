import React from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils/general';
import { TagsService } from '@/lib/services/TagsService';

export function TagChip({ name, color, onRemove, size = 'sm', className }) {
  const resolvedColor = color ?? TagsService.findOrCreate(name)?.color ?? '#06b6d4';

  return (
    <span
      className={cn(
        'inline-flex items-center gap-0.5 rounded-full font-medium leading-none whitespace-nowrap',
        size === 'xs' ? 'px-1.5 py-0.5 text-[9px]' : 'px-2 py-1 text-[10px]',
        className,
      )}
      style={{
        backgroundColor: `${resolvedColor}22`,
        color: resolvedColor,
        border: `1px solid ${resolvedColor}44`,
      }}
    >
      {name}
      {onRemove && (
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onRemove(name); }}
          className="rounded-full hover:opacity-70 transition-opacity ml-0.5"
          aria-label={`Remove tag ${name}`}
        >
          <X className="w-2.5 h-2.5" />
        </button>
      )}
    </span>
  );
}
