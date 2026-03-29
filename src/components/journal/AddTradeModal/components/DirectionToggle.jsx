import React from 'react';
import { Button } from "@/components/ui/button";
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { cn } from "@/lib/utils";
import { DIRECTION_OPTIONS } from '../constants/tradeConstants';

const DirectionToggle = ({ value, onChange }) => {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">Direction *</label>
      <div className="flex gap-2">
        <Button
          type="button"
          onClick={() => onChange(DIRECTION_OPTIONS.LONG)}
          className={cn(
            "flex-1 transition-all",
            value === DIRECTION_OPTIONS.LONG
              ? "bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-600/20"
              : "bg-white/5 hover:bg-white/10 text-white/60"
          )}
        >
          <ArrowUpRight className="w-4 h-4 mr-1" />
          Long
        </Button>
        <Button
          type="button"
          onClick={() => onChange(DIRECTION_OPTIONS.SHORT)}
          className={cn(
            "flex-1 transition-all",
            value === DIRECTION_OPTIONS.SHORT
              ? "bg-red-600 hover:bg-red-700 shadow-lg shadow-red-600/20"
              : "bg-white/5 hover:bg-white/10 text-white/60"
          )}
        >
          <ArrowDownRight className="w-4 h-4 mr-1" />
          Short
        </Button>
      </div>
    </div>
  );
};

export default React.memo(DirectionToggle);


