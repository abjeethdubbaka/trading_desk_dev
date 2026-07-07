import React, { useEffect, useRef } from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, Calendar, Plus } from 'lucide-react';
import { useSettings } from '@/lib/context/SettingsContext';
import { FILTER_OPTIONS, DATE_RANGE_OPTIONS } from '../utils/constants';
import { PresetMenu } from './PresetMenu';

export default function JournalToolbar({
  searchTerm,
  onSearchChange,
  filter,
  onFilterChange,
  dateRange,
  onDateRangeChange,
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

  useEffect(() => {
    const focusSearch = () => searchRef.current?.focus();
    window.addEventListener('journal-focus-search', focusSearch);
    return () => window.removeEventListener('journal-focus-search', focusSearch);
  }, []);

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-[260px] w-full md:w-auto md:flex-1 lg:max-w-[520px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          <Input
            ref={searchRef}
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search symbol, setup, notes…"
            className="pl-10 pr-3"
          />
        </div>

        <Select value={filter} onValueChange={onFilterChange}>
          <SelectTrigger className="w-32 border-white/10 bg-white/[0.03]">
            <SelectValue placeholder="Filter" />
          </SelectTrigger>
          <SelectContent className="border-white/10 bg-[#121824] text-white">
            {FILTER_OPTIONS.map(option => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={dateRange} onValueChange={onDateRangeChange}>
          <SelectTrigger className="w-36 border-white/10 bg-white/[0.03]">
            <Calendar className="w-4 h-4 mr-2" />
            <SelectValue placeholder="Date Range" />
          </SelectTrigger>
          <SelectContent className="border-white/10 bg-[#121824] text-white">
            {DATE_RANGE_OPTIONS.map(option => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {presets && (
          <PresetMenu
            presets={presets}
            onApply={onApplyPreset}
            onSave={onSavePreset}
            onDelete={onDeletePreset}
            onSetDefault={onSetDefaultPreset}
          />
        )}

        <Button onClick={onAddTrade} className="bg-emerald-600 hover:bg-emerald-700 flex items-center">
          <Plus className="w-4 h-4 mr-2 flex-shrink-0" />
          Add Trade
        </Button>

        <div className="ml-auto flex flex-wrap items-center gap-2 text-xs">
          <span className="rounded-lg border border-cyan-400/25 bg-cyan-500/12 px-2.5 py-1 text-cyan-200">
            Tier {accountTier}
          </span>
        </div>
      </div>
    </div>
  );
}
