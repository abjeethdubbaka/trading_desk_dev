import React from 'react';
import { Calculator } from 'lucide-react';
import { Badge } from "@/components/ui/badge";

export default function PositionSizeHeader({ riskAmount }) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <Calculator className="w-5 h-5 text-emerald-400" />
        <h2 className="text-xl font-bold">Position Size Calculator</h2>
      </div>
      <Badge className="bg-emerald-500/20 text-emerald-400 border-0">
        Risk: ${riskAmount.toFixed(2)}
      </Badge>
    </div>
  );
}


