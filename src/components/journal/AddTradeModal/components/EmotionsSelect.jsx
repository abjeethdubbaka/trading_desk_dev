import React from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { EMOTION_OPTIONS } from '../constants/tradeConstants';
import { cn } from "@/lib/utils";

const emotionColors = {
  confident: 'text-emerald-400 border-emerald-400/30',
  disciplined: 'text-blue-400 border-blue-400/30',
  neutral: 'text-gray-400 border-gray-400/30',
  nervous: 'text-amber-400 border-amber-400/30',
  fomo: 'text-orange-400 border-orange-400/30',
  revenge: 'text-red-400 border-red-400/30'
};

const EmotionsSelect = ({ value, onChange }) => {
  const selectedEmotion = EMOTION_OPTIONS.find(e => e.value === value);

  return (
    <div className="space-y-2">
      <Label>Emotions</Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className={cn(
          "bg-white/5 border-white/10",
          value && emotionColors[value]
        )}>
          <SelectValue>
            {selectedEmotion && (
              <span className="flex items-center gap-2">
                <span className={cn(
                  "w-2 h-2 rounded-full",
                  value === 'confident' && "bg-emerald-400",
                  value === 'disciplined' && "bg-blue-400",
                  value === 'neutral' && "bg-gray-400",
                  value === 'nervous' && "bg-amber-400",
                  value === 'fomo' && "bg-orange-400",
                  value === 'revenge' && "bg-red-400"
                )} />
                {selectedEmotion.label}
              </span>
            )}
          </SelectValue>
        </SelectTrigger>
        <SelectContent className="bg-[#1a1a24] border-white/10">
          {EMOTION_OPTIONS.map(emotion => (
            <SelectItem 
              key={emotion.value} 
              value={emotion.value}
              className="focus:bg-white/10 focus:text-white"
            >
              <span className="flex items-center gap-2">
                <span className={cn(
                  "w-2 h-2 rounded-full",
                  emotion.value === 'confident' && "bg-emerald-400",
                  emotion.value === 'disciplined' && "bg-blue-400",
                  emotion.value === 'neutral' && "bg-gray-400",
                  emotion.value === 'nervous' && "bg-amber-400",
                  emotion.value === 'fomo' && "bg-orange-400",
                  emotion.value === 'revenge' && "bg-red-400"
                )} />
                {emotion.label}
              </span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

export default React.memo(EmotionsSelect);
