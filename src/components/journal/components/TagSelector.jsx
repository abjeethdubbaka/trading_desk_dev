import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import { TagsService, normalizeTagName, tagNameKey } from '@/lib/services/TagsService';
import { TagChip } from './TagChip';
import { cn } from '@/lib/utils/general';

/**
 * Multi-select tag input with autocomplete + create-on-the-fly.
 * `value`   — string[] of tag names currently selected
 * `onChange` — (string[]) => void
 */
export function TagSelector({ value = [], onChange, placeholder = 'Add tag…', className }) {
  const [input, setInput] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [open, setOpen] = useState(false);
  const inputRef = useRef(null);
  const containerRef = useRef(null);

  const allTags = TagsService.getAll();
  const valueKeys = value.map(tagNameKey);

  useEffect(() => {
    if (!input.trim()) {
      // Dropdown with no typed query yet — show existing tags as suggestions.
      setSuggestions(allTags.filter((t) => !valueKeys.includes(tagNameKey(t.name))).slice(0, 8));
      return;
    }
    const q = tagNameKey(input);
    const matches = allTags
      .filter((t) => tagNameKey(t.name).includes(q) && !valueKeys.includes(tagNameKey(t.name)))
      .slice(0, 8);

    const normalized = normalizeTagName(input);
    const normalizedKey = tagNameKey(normalized);
    const exactExists = allTags.some((t) => tagNameKey(t.name) === normalizedKey) || valueKeys.includes(normalizedKey);
    if (normalized && !exactExists) {
      setSuggestions([...matches, { id: '__new__', name: normalized, isNew: true }]);
    } else {
      setSuggestions(matches);
    }
  }, [input, value]); // eslint-disable-line react-hooks/exhaustive-deps

  const addTag = (name) => {
    const normalized = normalizeTagName(name);
    if (!normalized || valueKeys.includes(tagNameKey(normalized))) return;
    const tag = TagsService.findOrCreate(normalized);
    onChange([...value, tag?.name ?? normalized]);
    setInput('');
    setSuggestions([]);
    inputRef.current?.focus();
  };

  const removeTag = (name) => onChange(value.filter((t) => t !== name));

  const handleKeyDown = (e) => {
    if ((e.key === 'Enter' || e.key === ',') && input.trim()) {
      e.preventDefault();
      addTag(input.trim());
    } else if (e.key === 'Backspace' && !input && value.length) {
      removeTag(value[value.length - 1]);
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  };

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (!containerRef.current?.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      <div
        className={cn(
          'flex flex-wrap gap-1 min-h-[36px] px-2 py-1.5 rounded-md',
          'border border-white/10 bg-white/5 cursor-text',
          'focus-within:border-white/25 transition-colors',
        )}
        onClick={() => inputRef.current?.focus()}
      >
        {value.map((name) => (
          <TagChip key={name} name={name} size="xs" onRemove={removeTag} />
        ))}
        <input
          ref={inputRef}
          value={input}
          onChange={(e) => { setInput(e.target.value); setOpen(true); }}
          onKeyDown={handleKeyDown}
          onFocus={() => setOpen(true)}
          placeholder={value.length ? '' : placeholder}
          className="flex-1 min-w-[80px] bg-transparent text-xs text-white outline-none placeholder:text-white/30"
        />
        <button
          type="button"
          onMouseDown={(e) => { e.preventDefault(); setOpen((prev) => !prev); inputRef.current?.focus(); }}
          className="flex-shrink-0 p-0.5 text-white/30 hover:text-white/60 transition-colors"
        >
          <ChevronDown className={cn('w-3.5 h-3.5 transition-transform', open && 'rotate-180')} />
        </button>
      </div>

      {open && suggestions.length > 0 && (
        <div className="absolute z-50 top-full mt-1 left-0 right-0 rounded-md border border-white/10 bg-[#121824] shadow-lg overflow-hidden">
          {suggestions.map((tag) => (
            <button
              key={tag.id}
              type="button"
              onMouseDown={(e) => { e.preventDefault(); addTag(tag.name); }}
              className="w-full px-3 py-1.5 text-left text-xs hover:bg-white/10 transition-colors flex items-center gap-2"
            >
              {tag.isNew ? (
                <>
                  <span className="text-cyan-400/70 text-[10px]">Create</span>
                  <span className="text-white/80">{tag.name}</span>
                </>
              ) : (
                <span
                  className="text-[11px] font-medium"
                  style={{ color: tag.color }}
                >
                  {tag.name}
                </span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
