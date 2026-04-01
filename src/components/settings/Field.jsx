import React from 'react';
import { Label } from '@/components/ui/label';

export default function Field({ label, hint, children }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs text-white/60">{label}</Label>
      {children}
      {hint && <p className="text-[10px] text-white/30">{hint}</p>}
    </div>
  );
}

