import React from 'react';
import { Cloud, CloudOff } from 'lucide-react';
import { IS_REMOTE } from '@/lib/db';

export default function SyncBadge() {
  if (!IS_REMOTE) {
    return (
      <span className="flex items-center gap-1.5 text-xs text-amber-400">
        <CloudOff className="w-3.5 h-3.5" />
        Local only
      </span>
    );
  }

  return (
    <span className="flex items-center gap-1.5 text-xs text-emerald-400">
      <Cloud className="w-3.5 h-3.5" />
      Synced to Firebase
    </span>
  );
}

