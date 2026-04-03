import React from 'react';
import { Label } from '@/components/ui/label';
import InfoHint from '@/components/ui/InfoHint';

export default function Field({ label, hint, children }) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-1.5">
        <Label className="text-xs text-white/60">{label}</Label>
        <InfoHint text={hint} />
      </div>
      {children}
    </div>
  );
}
