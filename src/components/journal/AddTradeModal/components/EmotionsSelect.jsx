import React from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { DEFAULT_EMOTIONS, getEmotionDotClass, toEmotionKey } from '@/lib/constants/emotions';

const DEFAULT_OPTIONS = DEFAULT_EMOTIONS.map((label) => ({ value: toEmotionKey(label), label }));

/**
 * The emotion a trade was taken in. The list comes from Settings, so a
 * trader's own words ("Impatient", "Bored") sit beside the defaults.
 */
const EmotionsSelect = ({ value, onChange, options = DEFAULT_OPTIONS }) => {
  // A value saved before its emotion was removed from Settings still shows.
  const choices = value && !options.some((option) => option.value === value)
    ? [{ value, label: value }, ...options]
    : options;
  const selected = choices.find((option) => option.value === value);

  return (
    <div className="space-y-2">
      <Label>Emotions</Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="bg-white/5 border-white/10">
          <SelectValue placeholder="How were you feeling?">
            {selected && (
              <span className="flex items-center gap-2">
                <span className={cn('h-2 w-2 rounded-full', getEmotionDotClass(selected.value))} />
                {selected.label}
              </span>
            )}
          </SelectValue>
        </SelectTrigger>
        <SelectContent className="bg-[#1a1a24] border-white/10">
          {choices.map((option) => (
            <SelectItem
              key={option.value}
              value={option.value}
              className="focus:bg-white/10 focus:text-white"
            >
              <span className="flex items-center gap-2">
                <span className={cn('h-2 w-2 rounded-full', getEmotionDotClass(option.value))} />
                {option.label}
              </span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

export default React.memo(EmotionsSelect);
