import React, { useState } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils/general';
import { getColorSwatch } from '@/lib/rules/utils';

/**
 * Steps through the rules one category at a time — shown automatically on
 * app launch, and available on demand from the Rules page.
 */
export default function RulesReadThroughModal({ categories, onDismiss }) {
  const [index, setIndex] = useState(0);

  if (!categories?.length) return null;

  const current = categories[Math.min(index, categories.length - 1)];
  const swatch = getColorSwatch(current.color);
  const isLast = index >= categories.length - 1;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-md"
      onClick={onDismiss}
    >
      <div
        className="relative mx-4 w-full max-w-md rounded-2xl border border-white/12 bg-[#11131e] p-8 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onDismiss}
          className="absolute right-3 top-3 rounded p-1 text-white/20 hover:text-white/50 transition-colors"
        >
          <X className="h-4 w-4" />
        </button>

        <p className={cn('text-[10px] font-semibold uppercase tracking-widest', swatch.className.split(' ').find((c) => c.startsWith('text-')))}>
          Category {index + 1} of {categories.length}
        </p>

        <p className="mt-2 flex items-center gap-2 text-xl font-semibold leading-snug text-white/95">
          <span className={cn('h-2.5 w-2.5 flex-shrink-0 rounded-full', swatch.dot)} />
          {current.name}
        </p>

        {current.description ? (
          <p className="mt-1.5 text-sm leading-relaxed text-white/45">{current.description}</p>
        ) : null}

        <div className="mt-4 max-h-[45vh] space-y-2 overflow-y-auto">
          {current.pointers.map((pointer) => (
            <p key={pointer.id} className="text-base leading-relaxed text-white/85">
              - {pointer.text}
            </p>
          ))}
        </div>

        <div className="mt-5 flex gap-1.5">
          {categories.map((_, i) => (
            <div
              key={i}
              className={cn('h-1.5 flex-1 rounded-full', i <= index ? swatch.dot : 'bg-white/10')}
            />
          ))}
        </div>

        <div className="mt-5 flex gap-2">
          {index > 0 && (
            <button
              type="button"
              onClick={() => setIndex((i) => i - 1)}
              className="rounded-xl border border-white/12 px-4 py-3 text-sm font-semibold text-white/60 transition-colors hover:bg-white/5"
            >
              Back
            </button>
          )}
          <button
            type="button"
            onClick={() => (isLast ? onDismiss() : setIndex((i) => i + 1))}
            className="flex-1 rounded-xl bg-violet-600 py-3 text-sm font-semibold text-white transition-colors hover:bg-violet-500"
          >
            {isLast ? "Let's go →" : 'Next →'}
          </button>
        </div>
      </div>
    </div>
  );
}
