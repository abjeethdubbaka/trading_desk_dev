import React, { useEffect, useRef, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Plus, X, Eye, EyeOff } from 'lucide-react';
import { cn } from '@/lib/utils/general';
import { useSettings } from '@/lib/context/SettingsContext';
import { FILTER_OPTIONS, DATE_RANGE_OPTIONS } from '../utils/constants';
import { PresetMenu } from './PresetMenu';

/**
 * A row of toggles. Every choice is visible at once instead of hidden in a
 * dropdown, and the period chips are the same ones Performance uses, so the
 * two screens agree on what "this week" means.
 */
function Chip({ active, onClick, children, tone = 'cyan' }) {
  const activeClass = tone === 'emerald'
    ? 'border-emerald-400/40 bg-emerald-500/15 text-emerald-100'
    : 'border-cyan-400/40 bg-cyan-500/15 text-cyan-100';

  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        'rounded-lg border px-2.5 py-1 text-xs font-medium transition-colors',
        active ? activeClass : 'border-white/10 bg-white/[0.03] text-white/50 hover:border-white/20 hover:text-white/75',
      )}
    >
      {children}
    </button>
  );
}

// The outcome and period chips sit behind the eye beside the tier, hidden
// until asked for. Whether they are showing is remembered on this machine.
const SHOW_CHIPS_KEY = 'journal.showFilterChips';

function readShowChips() {
  try {
    return localStorage.getItem(SHOW_CHIPS_KEY) === 'true';
  } catch {
    return false;
  }
}

export default function JournalToolbar({
  searchTerm,
  onSearchChange,
  filterKeys,
  onToggleFilter,
  dateRange,
  onDateRangeChange,
  onClearFilters,
  hasActiveFilters = false,
  onAddTrade,
  // Presets
  presets,
  onApplyPreset,
  onSavePreset,
  onDeletePreset,
  onSetDefaultPreset,
}) {
  const { settings } = useSettings();
  const accountTier = settings?.account_tier || 'custom';

  const searchRef = useRef(null);
  const [showChips, setShowChips] = useState(readShowChips);

  const toggleChips = () => {
    setShowChips((prev) => {
      const next = !prev;
      try { localStorage.setItem(SHOW_CHIPS_KEY, String(next)); } catch { /* storage unavailable */ }
      return next;
    });
  };

  useEffect(() => {
    const focusSearch = () => searchRef.current?.focus();
    window.addEventListener('journal-focus-search', focusSearch);
    return () => window.removeEventListener('journal-focus-search', focusSearch);
  }, []);

  return (
    <div className="space-y-2.5">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-[240px] w-full md:w-auto md:flex-1 lg:max-w-[440px]">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/35" />
          <Input
            ref={searchRef}
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search symbol, setup, notes…"
            className="h-9 border-white/10 bg-white/[0.03] pl-10 pr-3 text-sm"
          />
        </div>

        {presets && (
          <PresetMenu
            presets={presets}
            onApply={onApplyPreset}
            onSave={onSavePreset}
            onDelete={onDeletePreset}
            onSetDefault={onSetDefaultPreset}
          />
        )}

        <Button onClick={onAddTrade} className="h-9 bg-emerald-600 px-3 text-sm hover:bg-emerald-700">
          <Plus className="mr-1.5 h-4 w-4 flex-shrink-0" />
          Add Trade
        </Button>

        {/* With the chips hidden, a preset's filter is still visible here and can be cleared. */}
        {!showChips && hasActiveFilters && (
          <button
            type="button"
            onClick={onClearFilters}
            className="inline-flex h-9 items-center gap-1 rounded-lg border border-amber-400/25 bg-amber-500/10 px-2.5 text-xs text-amber-200 transition-colors hover:bg-amber-500/15"
          >
            <X className="h-3 w-3" />
            Clear filters
          </button>
        )}

        <div className="ml-auto flex items-center gap-1.5">
          <button
            type="button"
            onClick={toggleChips}
            aria-pressed={showChips}
            title={showChips ? 'Hide filters' : 'Show filters'}
            className={cn(
              'rounded-lg border p-1.5 transition-colors',
              showChips
                ? 'border-cyan-400/30 bg-cyan-500/10 text-cyan-200'
                : 'border-white/10 bg-white/[0.03] text-white/45 hover:text-white/75',
            )}
          >
            {showChips ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
          </button>
          <span className="rounded-lg border border-cyan-400/25 bg-cyan-500/12 px-2.5 py-1 text-xs text-cyan-200">
            Tier {accountTier}
          </span>
        </div>
      </div>

      {showChips && (
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <div className="flex flex-wrap items-center gap-1.5">
          {FILTER_OPTIONS.map((option) => (
            <Chip
              key={option.value}
              active={filterKeys?.has(option.value)}
              onClick={() => onToggleFilter(option.value)}
            >
              {option.label}
            </Chip>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-1.5 lg:ml-auto">
          {DATE_RANGE_OPTIONS.map((option) => (
            <Chip
              key={option.value}
              tone="emerald"
              active={dateRange === option.value}
              onClick={() => onDateRangeChange(option.value)}
            >
              {option.label}
            </Chip>
          ))}
          {hasActiveFilters && (
            <button
              type="button"
              onClick={onClearFilters}
              className="ml-1 inline-flex items-center gap-1 text-xs text-white/40 transition-colors hover:text-white/75"
            >
              <X className="h-3 w-3" />
              Clear
            </button>
          )}
        </div>
      </div>
      )}
    </div>
  );
}
