import React, { useState, useEffect } from 'react';
import AddTradeModal from '@/components/journal/AddTradeModal';
import JournalToolbar from '@/components/journal/components/JournalToolbar';
import CompactView from '@/components/journal/components/CompactView';
import DetailedView from '@/components/journal/components/DetailedView';
import EmptyState from '@/components/journal/components/EmptyState';
import AnalysisPanel from '@/components/journal/components/Analysis';
import JournalStatsBar from '@/components/journal/components/JournalStatsBar';
import { useJournalTrades } from '@/components/journal/hooks/useJournalTrades';
import { useJournalFilters } from '@/components/journal/hooks/useJournalFilters';
import { useJournalImagePreloader } from '@/components/journal/utils/imageUtils';
import { useTradeReview } from '@/lib/useTradeReview';
import { VIEW_MODES } from '@/components/journal/utils/constants';
import { validateTrade, sanitizeTrade } from '@/components/journal/utils/validators';
import { cn } from '@/lib/utils';

export default function Journal() {
  const [showModal, setShowModal] = useState(false);
  const [editingTrade, setEditingTrade] = useState(null);
  const [viewMode, setViewMode] = useState(VIEW_MODES.COMPACT);
  const [isPanelExpanded, setPanelExpanded] = useState(false);

  const { trades, isLoading, createTrade, updateTrade, deleteTrade } = useJournalTrades();
  const { searchTerm, setSearchTerm, filter, setFilter, dateRange, setDateRange, filteredTrades } = useJournalFilters(trades);
  const { preloadImages } = useJournalImagePreloader(filteredTrades);
  const { reviews, loading: reviewLoading, reviewTrade, clearReview } = useTradeReview();

  useEffect(() => {
    if (!isLoading && filteredTrades.length > 0) {
      const t = setTimeout(preloadImages, 500);
      return () => clearTimeout(t);
    }
  }, [filteredTrades, isLoading, preloadImages]);

  useEffect(() => {
    const h = (e) => {
      setEditingTrade(e.detail.tradeData);
      setShowModal(true);
    };

    window.addEventListener('open-add-trade-modal', h);
    return () => window.removeEventListener('open-add-trade-modal', h);
  }, []);

  const handleSave = async (data) => {
    try {
      let sanitizedData = sanitizeTrade(data);

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
        alert(`Validation: ${validation.errors.join(', ')}`);
        return;
      }

      if (editingTrade) {
        await updateTrade({ id: editingTrade.id, data: sanitizedData });
        setShowModal(false);
        setEditingTrade(null);
      } else {
        await createTrade(sanitizedData);
        setShowModal(false);
      }
    } catch {
      alert('Failed to save trade. Please try again.');
    }
  };

  return (
    <div className="space-y-4">
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

      <JournalStatsBar trades={filteredTrades} />

      {isLoading ? (
        <div className="space-y-1">
          {[1, 2, 3, 4, 5].map(i => (
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
          <div className="flex-1 bg-[#1a1a24] border border-white/10 rounded overflow-hidden">
            {viewMode === 'compact' ? (
              <CompactView
                trades={filteredTrades}
                onEdit={t => { setEditingTrade(t); setShowModal(true); }}
                onDelete={deleteTrade}
                reviews={reviews}
                reviewLoading={reviewLoading}
                onReviewTrade={reviewTrade}
                onClearReview={clearReview}
              />
            ) : (
              <DetailedView
                trades={filteredTrades}
                onEdit={t => { setEditingTrade(t); setShowModal(true); }}
                reviews={reviews}
                reviewLoading={reviewLoading}
                onReviewTrade={reviewTrade}
                onClearReview={clearReview}
              />
            )}
          </div>

          <div
            className="relative"
            onMouseEnter={() => setPanelExpanded(true)}
            onMouseLeave={() => setPanelExpanded(false)}
          >
            <div className={cn(
              "transition-all duration-300 ease-in-out",
              isPanelExpanded ? "w-80 opacity-100" : "w-12 opacity-60"
            )}>
              <AnalysisPanel 
                trades={filteredTrades} 
                isCollapsed={!isPanelExpanded}
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