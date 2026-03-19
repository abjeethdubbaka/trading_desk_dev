import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Search, BookOpen, Calendar } from 'lucide-react';
import AddTradeModal from '@/components/journal/AddTradeModal';
import JournalToolbar from '@/components/journal/components/JournalToolbar';
import CompactView from '@/components/journal/components/CompactView';
import DetailedView from '@/components/journal/components/DetailedView';
import EmptyState from '@/components/journal/components/EmptyState';
import AnalysisPanel from '@/components/journal/components/Analysis';
import { useJournalTrades } from '@/components/journal/hooks/useJournalTrades';
import { useJournalFilters } from '@/components/journal/hooks/useJournalFilters';
import { useJournalAnalytics } from '@/components/journal/hooks/useJournalAnalytics';
import { useJournalImagePreloader } from '@/components/journal/utils/imageUtils';
import { FILTER_OPTIONS, DATE_RANGE_OPTIONS, VIEW_MODES } from '@/components/journal/utils/constants';
import { validateTrade, sanitizeTrade } from '@/components/journal/utils/validators';
import { cn } from '@/lib/utils';
import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns';

export default function Journal() {
  const [showModal, setShowModal] = useState(false);
  const [editingTrade, setEditingTrade] = useState(null);
  const [viewMode, setViewMode] = useState(VIEW_MODES.COMPACT);
  const [isAnalysisPanelExpanded, setIsAnalysisPanelExpanded] = useState(false);

  // Use centralized hooks (now includes cross-tab sync automatically)
  const { trades, isLoading, error, createTrade, updateTrade, deleteTrade } = useJournalTrades();
  const { 
    searchTerm, 
    setSearchTerm, 
    filter, 
    setFilter, 
    dateRange, 
    setDateRange, 
    filteredTrades 
  } = useJournalFilters(trades);

  // Image preloader
  const { preloadImages } = useJournalImagePreloader(filteredTrades);

  // Preload images when trades change
  useEffect(() => {
    if (!isLoading && filteredTrades.length > 0) {
      // Delay preloading to avoid blocking initial render
      const timer = setTimeout(() => {
        preloadImages();
      }, 500);
      
      return () => clearTimeout(timer);
    }
  }, [filteredTrades, isLoading, preloadImages]);

  const handleSave = async (data) => {
    try {
      // Validate and sanitize trade data
      let sanitizedData = sanitizeTrade(data);
      
      // Fix floating point precision issues from calculator
      if (sanitizedData.entry_price) {
        sanitizedData.entry_price = parseFloat(sanitizedData.entry_price.toFixed(4));
      }
      if (sanitizedData.exit_price) {
        sanitizedData.exit_price = parseFloat(sanitizedData.exit_price.toFixed(4));
      }
      if (sanitizedData.fee) {
        sanitizedData.fee = parseFloat(sanitizedData.fee.toFixed(4));
      }
      
      const validation = validateTrade(sanitizedData);
      
      if (!validation.isValid) {
        alert(`Validation Error: ${validation.errors.join(', ')}`);
        return;
      }
      
      if (editingTrade) {
        // Fix: Pass the correct parameters to updateTrade
        await updateTrade({ id: editingTrade.id, data: sanitizedData });
        setShowModal(false);
        setEditingTrade(null);
      } else {
        await createTrade(sanitizedData);
        setShowModal(false);
      }
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Save error:', error);
      }
      alert('Failed to save trade. Please try again.');
    }
  };

  const handleEdit = (trade) => {
    setEditingTrade(trade);
    setShowModal(true);
  };

  const handleDelete = (id) => {
    deleteTrade(id);
  };

  // Listen for custom event from calculator
  useEffect(() => {
    const handleOpenAddTradeModal = (event) => {
      const { tradeData } = event.detail;
      setEditingTrade(tradeData);
      setShowModal(true);
    };

    window.addEventListener('open-add-trade-modal', handleOpenAddTradeModal);
    
    return () => {
      window.removeEventListener('open-add-trade-modal', handleOpenAddTradeModal);
    };
  }, []);

  return (
    <div className="space-y-5">
      {/* Toolbar */}
      <JournalToolbar
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        filter={filter}
        onFilterChange={setFilter}
        dateRange={dateRange}
        onDateRangeChange={setDateRange}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        onAddTrade={() => setShowModal(true)}
      />

      {/* Trades Display */}
      {isLoading ? (
        <div className="space-y-1">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="bg-white/5 border border-white/10 rounded p-2 h-12 animate-pulse" />
          ))}
        </div>
      ) : filteredTrades.length === 0 ? (
        <EmptyState
          hasFilters={!!(searchTerm || filter !== 'all' || dateRange !== 'all')}
          onAddTrade={() => setShowModal(true)}
        />
      ) : (
        <div className="flex gap-4">
          {/* Trades View */}
          <div className="flex-1 bg-[#1a1a24] border border-white/10 rounded overflow-hidden">
            {viewMode === 'compact' ? (
              <CompactView 
                trades={filteredTrades}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            ) : (
              <DetailedView 
                trades={filteredTrades}
                onEdit={handleEdit}
              />
            )}
          </div>

          {/* Analysis Panel */}
          <div 
            className="relative"
            onMouseEnter={() => setIsAnalysisPanelExpanded(true)}
            onMouseLeave={() => setIsAnalysisPanelExpanded(false)}
          >
            <div className={cn(
              "transition-all duration-300 ease-in-out",
              isAnalysisPanelExpanded ? "w-80 opacity-100" : "w-12 opacity-60"
            )}>
              <AnalysisPanel 
                trades={filteredTrades} 
                isCollapsed={!isAnalysisPanelExpanded}
              />
            </div>
          </div>
        </div>
      )}

      <AddTradeModal
        open={showModal}
        onClose={() => { setShowModal(false); setEditingTrade(null); }}
        onSave={handleSave}
        initialData={editingTrade}
      />
    </div>
  );
}