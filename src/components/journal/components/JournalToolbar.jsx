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
import { Search, Calendar, Plus, LayoutGrid, List } from 'lucide-react';
import { cn } from '@/lib/utils';
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
  onAddTrade
}) {
  return (
    <div className="flex flex-col md:flex-row gap-3 justify-between">
      {/* Search */}
      <div className="relative flex-1 max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <Input
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search trades by symbol, setup, notes..."
          className="pl-10"
        />
      </div>

      {/* Actions */}
      <div className="flex gap-3">
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
  );
}
