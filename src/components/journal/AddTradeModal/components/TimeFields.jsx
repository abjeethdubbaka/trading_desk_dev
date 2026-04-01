import React from 'react';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils/general';
import { isValidExitTime } from '../utils/dateUtils';

const TimeFields = ({ entryTime, exitTime, onEntryChange, onExitChange }) => {
  const isExitValid = isValidExitTime(entryTime, exitTime);

  return (
    <div className="grid grid-cols-2 gap-4">
      <div className="space-y-2">
        <Label htmlFor="entry-time">Entry Time</Label>
        <Input
          id="entry-time"
          type="datetime-local"
          value={entryTime}
          onChange={(e) => onEntryChange(e.target.value)}
          className="bg-white/5 border-white/10"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="exit-time">Exit Time</Label>
        <Input
          id="exit-time"
          type="datetime-local"
          value={exitTime}
          onChange={(e) => onExitChange(e.target.value)}
          className={cn(
            "bg-white/5 border-white/10",
            !isExitValid && "border-red-500/50 focus-visible:ring-red-500/30"
          )}
        />
        {!isExitValid && exitTime && (
          <p className="text-xs text-red-400 flex items-center gap-1 mt-1">
            <AlertCircle className="w-3 h-3" />
            Exit time must be after entry time
          </p>
        )}
      </div>
    </div>
  );
};

export default React.memo(TimeFields);


