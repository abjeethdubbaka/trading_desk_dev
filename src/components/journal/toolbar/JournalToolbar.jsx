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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Search, Calendar, Plus, LayoutGrid, List, Upload, Loader2, Download, ChevronDown, X } from 'lucide-react';
import { cn } from '@/lib/utils/general';
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
  tagFilter,
  onTagFilterChange,
  viewMode,
  onViewModeChange,
  onAddTrade,
  onExportCsv,
  canExport,
  onImportCsv,
  isImporting,
  importStatus,
  // Presets
  presets,
  onApplyPreset,
  onSavePreset,
  onDeletePreset,
  onSetDefaultPreset,
}) {
  const fileInputRef = React.useRef(null);
  const { settings } = useSettings();
  const accountTier = settings?.account_tier || 'custom';
  const todayLabel = React.useMemo(
    () => new Intl.DateTimeFormat('en-US', { weekday: 'short', month: 'short', day: 'numeric' }).format(new Date()),
    []
  );
  const statusClass = importStatus?.type === 'success'
    ? 'text-emerald-300'
    : importStatus?.type === 'warning'
      ? 'text-amber-300'
      : importStatus?.type === 'error'
        ? 'text-red-300'
        : 'text-sky-300';

  const searchRef = useRef(null);

  useEffect(() => {
    const focusSearch = () => searchRef.current?.focus();
    window.addEventListener('journal-focus-search', focusSearch);
    return () => window.removeEventListener('journal-focus-search', focusSearch);
  }, []);

  const handleFileSelect = (event) => {
    const file = event.target.files?.[0];
    if (file && typeof onImportCsv === 'function') {
      onImportCsv(file);
    }
    event.target.value = '';
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-[260px] w-full md:w-auto md:flex-1 lg:max-w-[520px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          <Input
            ref={searchRef}
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search symbol, setup, notes, #tag…"
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

        <div className="flex border border-white/10 rounded-xl overflow-hidden">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onViewModeChange('compact')}
            className={cn(
              "rounded-none px-2",
              viewMode === 'compact' ? "bg-white/10 text-white" : "text-gray-400 hover:text-white"
            )}
          >
            <List className="w-4 h-4" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onViewModeChange('detailed')}
            className={cn(
              "rounded-none px-2 border-l border-white/10",
              viewMode === 'detailed' ? "bg-white/10 text-white" : "text-gray-400 hover:text-white"
            )}
          >
            <LayoutGrid className="w-4 h-4" />
          </Button>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,text/csv"
          className="hidden"
          onChange={handleFileSelect}
        />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="border-white/10 bg-white/[0.02] hover:bg-white/10">
              {isImporting ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Upload className="w-4 h-4 mr-2 flex-shrink-0" />
              )}
              Import / Export
              <ChevronDown className="w-4 h-4 ml-2 opacity-70" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48 border-white/10 bg-[#121824] text-white">
            <DropdownMenuLabel>CSV Actions</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={() => fileInputRef.current?.click()} disabled={isImporting}>
              {isImporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
              {isImporting ? 'Importing...' : 'Import CSV'}
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => onExportCsv?.()} disabled={!canExport}>
              <Download className="w-4 h-4" />
              Export CSV
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <Button onClick={onAddTrade} className="bg-emerald-600 hover:bg-emerald-700 flex items-center">
          <Plus className="w-4 h-4 mr-2 flex-shrink-0" />
          Add Trade
        </Button>

        <div className="ml-auto flex flex-wrap items-center gap-2 text-xs">
          <span className="rounded-lg border border-white/15 bg-white/[0.04] px-2.5 py-1 text-white/75">
            {todayLabel}
          </span>
          <span className="rounded-lg border border-cyan-400/25 bg-cyan-500/12 px-2.5 py-1 text-cyan-200">
            Tier {accountTier}
          </span>
        </div>
      </div>

      {/* Active tag chips (set by clicking tag labels in trade rows) */}
      {tagFilter?.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[10px] text-white/30 uppercase tracking-wider">Tags:</span>
          {tagFilter.map((tag) => (
            <span
              key={tag}
              className="flex items-center gap-1 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-2 py-0.5 text-[11px] text-cyan-300"
            >
              #{tag}
              <button
                type="button"
                onClick={() => onTagFilterChange(tagFilter.filter((t) => t !== tag))}
                className="hover:text-white transition-colors"
              >
                <X className="w-2.5 h-2.5" />
              </button>
            </span>
          ))}
          <button
            type="button"
            onClick={() => onTagFilterChange([])}
            className="text-[10px] text-white/30 hover:text-white/60 transition-colors"
          >
            Clear all
          </button>
        </div>
      )}

      {importStatus?.message ? (
        <p className={cn('text-xs px-1', statusClass)}>
          {importStatus.message}
        </p>
      ) : null}
    </div>
  );
}
