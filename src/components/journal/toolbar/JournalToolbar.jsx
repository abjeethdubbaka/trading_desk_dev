import React from 'react';
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
import { Search, Calendar, Plus, LayoutGrid, List, Upload, Loader2, Download, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils/general';
import { FILTER_OPTIONS, DATE_RANGE_OPTIONS } from '../utils/constants';

export default function JournalToolbar({
  searchTerm,
  onSearchChange,
  filter,
  onFilterChange,
  dateRange,
  onDateRangeChange,
  viewMode,
  onViewModeChange,
  onAddTrade,
  onExportCsv,
  canExport,
  onImportCsv,
  isImporting,
  importStatus
}) {
  const fileInputRef = React.useRef(null);
  const statusClass = importStatus?.type === 'success'
    ? 'text-emerald-300'
    : importStatus?.type === 'warning'
      ? 'text-amber-300'
      : importStatus?.type === 'error'
        ? 'text-red-300'
        : 'text-sky-300';

  const handleFileSelect = (event) => {
    const file = event.target.files?.[0];
    if (file && typeof onImportCsv === 'function') {
      onImportCsv(file);
    }
    event.target.value = '';
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-3">
        {/* Search */}
        <div className="relative flex-1 min-w-[260px] max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search trades by symbol, setup, notes..."
            className="pl-10"
          />
        </div>

        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Filter Dropdown */}
          <Select value={filter} onValueChange={onFilterChange}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Filter" />
            </SelectTrigger>
            <SelectContent>
              {FILTER_OPTIONS.map(option => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Date Range Dropdown */}
          <Select value={dateRange} onValueChange={onDateRangeChange}>
            <SelectTrigger className="w-36">
              <Calendar className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Date Range" />
            </SelectTrigger>
            <SelectContent>
              {DATE_RANGE_OPTIONS.map(option => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* View Mode Toggle */}
          <div className="flex border border-white/10 rounded">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onViewModeChange('compact')}
              className={cn(
                "rounded-r-none px-2",
                viewMode === 'compact'
                  ? "bg-white/10 text-white"
                  : "text-gray-400 hover:text-white"
              )}
            >
              <List className="w-4 h-4" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onViewModeChange('detailed')}
              className={cn(
                "rounded-l-none px-2",
                viewMode === 'detailed'
                  ? "bg-white/10 text-white"
                  : "text-gray-400 hover:text-white"
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
              <Button
                variant="outline"
                className="border-white/10 bg-white/[0.02] hover:bg-white/10"
              >
                {isImporting ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Upload className="w-4 h-4 mr-2 flex-shrink-0" />
                )}
                Import / Export
                <ChevronDown className="w-4 h-4 ml-2 opacity-70" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuLabel>CSV Actions</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onSelect={() => fileInputRef.current?.click()}
                disabled={isImporting}
              >
                {isImporting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Upload className="w-4 h-4" />
                )}
                {isImporting ? 'Importing...' : 'Import CSV'}
              </DropdownMenuItem>
              <DropdownMenuItem
                onSelect={() => onExportCsv?.()}
                disabled={!canExport}
              >
                <Download className="w-4 h-4" />
                Export CSV
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Add Trade Button */}
          <Button
            onClick={onAddTrade}
            className="bg-emerald-600 hover:bg-emerald-700 flex items-center"
          >
            <Plus className="w-4 h-4 mr-2 flex-shrink-0" />
            Add Trade
          </Button>
        </div>
      </div>
      {importStatus?.message ? (
        <p className={cn('text-xs px-1', statusClass)}>
          {importStatus.message}
        </p>
      ) : null}
    </div>
  );
}


