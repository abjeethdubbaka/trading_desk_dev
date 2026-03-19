import React from 'react';
import { AlertTriangle } from 'lucide-react';

export default function PositionWarning({ positionCost, accountBalance }) {
  const positionPercentage = (positionCost / accountBalance);
  
  if (positionPercentage <= 0.5) {
    return null;
  }

  return (
    <div className="flex items-start gap-2 bg-amber-500/10 border border-amber-500/20 rounded-lg p-3">
      <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
      <p className="text-xs text-amber-400">
        Warning: This position represents {(positionPercentage * 100).toFixed(1)}% of your account.
        Consider reducing position size.
      </p>
    </div>
  );
}
