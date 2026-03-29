import React from 'react';
import { Button } from "@/components/ui/button";
import { TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from "@/lib/utils";

export default function DirectionToggle({ direction, setDirection }) {
  return (
    <div className="flex gap-2">
      <Button
        onClick={() => {
          
          setDirection('long');
        }}
        className={cn(
          "flex-1",
          direction === 'long'
            ? "bg-emerald-600 hover:bg-emerald-700"
            : "bg-white/5 hover:bg-white/10 text-white/60"
        )}
      >
        <TrendingUp className="w-4 h-4 mr-2" />
        Long
      </Button>
      <Button
        onClick={() => {
          
          setDirection('short');
        }}
        className={cn(
          "flex-1",
          direction === 'short'
            ? "bg-red-600 hover:bg-red-700"
            : "bg-white/5 hover:bg-white/10 text-white/60"
        )}
      >
        <TrendingDown className="w-4 h-4 mr-2" />
        Short
      </Button>
    </div>
  );
}


