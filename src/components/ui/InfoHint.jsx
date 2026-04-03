import React from 'react';
import { cn } from '@/lib/utils/general';

export default function InfoHint({ text, className = '' }) {
  if (!text) return null;

  return (
    <span
      className={cn(
        'inline-flex h-4 w-4 cursor-help items-center justify-center rounded-full border border-white/25 text-[10px] text-white/65',
        className
      )}
      title={text}
      aria-label={text}
    >
      ?
    </span>
  );
}
