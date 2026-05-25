import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils/general';

/**
 * Click-to-edit cell.
 *
 * Props:
 *   value       — current display value (string | number | boolean)
 *   displayNode — optional React node to show instead of raw value
 *   type        — 'text' | 'number' | 'select' | 'boolean'
 *   options     — [{ value, label }] for type='select'
 *   onSave      — async (newValue) => void; throw to signal error
 *   validate    — (rawValue) => string | null   (null = ok)
 *   loading     — show spinner instead of display node
 *   disabled    — prevent editing
 *   className
 */
export function EditableCell({
  value,
  displayNode,
  type = 'text',
  options,
  onSave,
  validate,
  loading = false,
  disabled = false,
  className,
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const inputRef = useRef(null);

  const startEdit = useCallback(() => {
    if (disabled || loading) return;
    setDraft(type === 'boolean' ? (value ? 'true' : 'false') : String(value ?? ''));
    setError(null);
    setEditing(true);
  }, [disabled, loading, type, value]);

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
      if (inputRef.current.select) inputRef.current.select();
    }
  }, [editing]);

  const commit = useCallback(async () => {
    let coerced = draft;
    if (type === 'number') {
      const n = Number(draft.replace(/[$,%\s]/g, ''));
      if (!Number.isFinite(n)) { setError('Must be a number'); return; }
      coerced = n;
    } else if (type === 'boolean') {
      coerced = draft === 'true';
    }

    if (validate) {
      const msg = validate(coerced);
      if (msg) { setError(msg); return; }
    }

    setSaving(true);
    try {
      await onSave(coerced);
      setEditing(false);
      setError(null);
    } catch (err) {
      setError(err?.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  }, [draft, type, validate, onSave]);

  const cancel = useCallback(() => {
    setEditing(false);
    setError(null);
  }, []);

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Enter' && type !== 'text') { e.preventDefault(); commit(); }
    if (e.key === 'Escape') cancel();
  }, [commit, cancel, type]);

  if (loading) {
    return <Loader2 className="w-3 h-3 animate-spin text-white/30" />;
  }

  if (!editing) {
    return (
      <span
        onClick={!disabled ? startEdit : undefined}
        className={cn(
          !disabled && 'cursor-text hover:underline hover:decoration-dotted hover:decoration-white/30',
          'transition-colors rounded px-0.5',
          className,
        )}
        title={!disabled ? 'Click to edit' : undefined}
      >
        {displayNode ?? String(value ?? '—')}
      </span>
    );
  }

  const inputClass = cn(
    'h-6 w-full bg-[#121824] border rounded px-1 text-xs text-white outline-none',
    error ? 'border-rose-500' : 'border-cyan-500/60',
  );

  let inputEl;
  if (type === 'select' && Array.isArray(options)) {
    inputEl = (
      <select
        ref={inputRef}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={handleKeyDown}
        className={cn(inputClass, 'appearance-none')}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    );
  } else if (type === 'boolean') {
    inputEl = (
      <select
        ref={inputRef}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={handleKeyDown}
        className={cn(inputClass, 'appearance-none')}
      >
        <option value="true">Yes</option>
        <option value="false">No</option>
      </select>
    );
  } else {
    inputEl = (
      <input
        ref={inputRef}
        type={type === 'number' ? 'text' : 'text'}
        inputMode={type === 'number' ? 'decimal' : 'text'}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={handleKeyDown}
        className={inputClass}
      />
    );
  }

  return (
    <div className="relative">
      {saving ? <Loader2 className="w-3 h-3 animate-spin text-cyan-400" /> : inputEl}
      {error && (
        <div className="absolute top-full left-0 z-50 mt-0.5 rounded bg-rose-900/90 border border-rose-500/50 px-1.5 py-0.5 text-[10px] text-rose-200 whitespace-nowrap">
          {error}
        </div>
      )}
    </div>
  );
}
