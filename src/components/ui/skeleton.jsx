import React from 'react';
import { cn } from '@/lib/utils';

export function Skeleton({ className, ...props }) {
  return (
    <div
      className={cn('animate-pulse rounded bg-white/[0.06]', className)}
      {...props}
    />
  );
}
