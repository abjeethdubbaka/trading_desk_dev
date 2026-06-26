import React from 'react';
import { Check } from 'lucide-react';
import { cn } from "@/lib/utils";

const normalizeList = (value) => (
  Array.isArray(value)
    ? value.map((v) => String(v ?? '').trim()).filter(Boolean)
    : (String(value ?? '').trim() ? [String(value).trim()] : [])
);

const KeywordToggleGroup = ({ options = [], value, onChange, emptyHint }) => {
  const selected = normalizeList(value);
  const extras = selected.filter((item) => !options.includes(item));

  const toggle = (item) => {
    const next = selected.includes(item)
      ? selected.filter((entry) => entry !== item)
      : [...selected, item];
    onChange(next);
  };

  const remove = (item) => {
    onChange(selected.filter((entry) => entry !== item));
  };

  return (
    <div className="flex flex-wrap gap-1.5">
      {extras.map((item) => (
        <button
          key={item}
          type="button"
          onClick={() => remove(item)}
          className="rounded-full border border-amber-400/30 bg-amber-500/10 px-2.5 py-1 text-xs text-amber-200/80"
          title="Legacy entry — click to remove"
        >
          {item} ×
        </button>
      ))}
      {options.map((option) => {
        const isSelected = selected.includes(option);
        return (
          <button
            key={option}
            type="button"
            onClick={() => toggle(option)}
            className={cn(
              "flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs transition-colors",
              isSelected
                ? "border-cyan-400/40 bg-cyan-500/15 text-cyan-200"
                : "border-white/10 bg-white/5 text-white/55 hover:border-white/20 hover:text-white/80"
            )}
          >
            {isSelected && <Check className="w-3 h-3" />}
            {option}
          </button>
        );
      })}
      {options.length === 0 && extras.length === 0 && emptyHint && (
        <p className="text-xs text-white/35">{emptyHint}</p>
      )}
    </div>
  );
};

export default React.memo(KeywordToggleGroup);
