/**
 * @file src/pages/Journal.jsx
 *
 * Phase 2 — rewired to useJournal() (Firebase-backed).
 * All trade CRUD flows through the new db layer.
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useJournal }           from '@/hooks/useTrades';
import { useJournalFilters }    from '@/components/journal/hooks/useJournalFilters';
import AddTradeModal            from '@/components/journal/AddTradeModal';
import JournalToolbar           from '@/components/journal/components/JournalToolbar';
import CompactView              from '@/components/journal/components/CompactView';
import DetailedView             from '@/components/journal/components/DetailedView';
import EmptyState               from '@/components/journal/components/EmptyState';
import AnalysisPanel            from '@/components/journal/components/Analysis';
import JournalStatsBar          from '@/components/journal/components/JournalStatsBar';
import { useTradeReview }       from '@/lib/useTradeReview';
import { VIEW_MODES }           from '@/components/journal/utils/constants';
import { validateTrade, sanitizeTrade } from '@/lib/validation/trades';
import { cn }                   from '@/lib/utils';
import { toast }                from 'sonner';

export default function Journal() {
  const [showModal,      setShowModal]      = useState(false);
  const [editingTrade,   setEditingTrade]   = useState(null);
  const [viewMode,       setViewMode]       = useState(VIEW_MODES.COMPACT);
  const [isPanelExpanded,setPanelExpanded]  = useState(false);

  // ── Data (Firebase via useTrades) ────────────────────────────────────────
  const { trades, isLoading, createTrade, updateTrade, deleteTrade, isSaving } = useJournal();

  // ── Filters (client-side on fetched data) ────────────────────────────────
  const {
    searchTerm, setSearchTerm,
    filter,     setFilter,
    dateRange,  setDateRange,
    filteredTrades,
  } = useJournalFilters(trades);

  const { reviews, loading: reviewLoading, reviewTrade, clearReview } = useTradeReview();

  // ── Listen for external "open modal" events (e.g. from Calculator) ───────
  useEffect(() => {
    const handler = (e) => {
      setEditingTrade(e.detail?.tradeData ?? null);
      setShowModal(true);
    };
    window.addEventListener('open-add-trade-modal', handler);
    return () => window.removeEventListener('open-add-trade-modal', handler);
  }, []);

  // ── Save handler ─────────────────────────────────────────────────────────
  const handleSave = useCallback(async (data) => {
    const validation = validateTrade(data);
    
    if (!validation.isValid) {
      console.error('❌ Journal Handle Save - Validation Failed:', validation.errors);
      toast.error('Please fix validation errors');
      return;
    }

    try {
      if (editingTrade) {
        await updateTrade(editingTrade.id, data);
        toast.success(`${data.symbol} updated`);
      } else {
        await createTrade(data);
        toast.success(`${data.symbol} logged`);
      }
      setShowModal(false);
      setEditingTrade(null);
    } catch (err) {
      console.error('💥 Journal Handle Save - ERROR:', err);
      console.error('💥 Journal Handle Save - ERROR MESSAGE:', err.message);
      toast.error(`Failed to save: ${err.message}`);
    }
  }, [editingTrade, createTrade, updateTrade]);

  const handleEdit = useCallback((trade) => {
    setEditingTrade(trade);
    setShowModal(true);
  }, []);

  const handleDelete = useCallback(async (id) => {
    if (!window.confirm('Delete this trade?')) return;
    try {
      await deleteTrade(id);
      toast.success('Trade deleted');
    } catch (err) {
      toast.error(`Delete failed: ${err.message}`);
    }
  }, [deleteTrade]);

  const handleClose = useCallback(() => {
    setShowModal(false);
    setEditingTrade(null);
  }, []);

  // ── Render ────────────────────────────────────────────────────────────────
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
        trades={filteredTrades}
      />

      <JournalStatsBar trades={filteredTrades} />

      {isLoading ? (
        <div className="space-y-1">
          {Array.from({ length: 6 }).map((_, i) => (
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
          {/* Trade list */}
          <div className="flex-1 bg-[#1a1a24] border border-white/10 rounded overflow-hidden">
            {viewMode === VIEW_MODES.COMPACT ? (
              <CompactView
                trades={filteredTrades}
                onEdit={handleEdit}
                onDelete={handleDelete}
                reviews={reviews}
                reviewLoading={reviewLoading}
                onReviewTrade={reviewTrade}
                onClearReview={clearReview}
              />
            ) : (
              <DetailedView
                trades={filteredTrades}
                onEdit={handleEdit}
                reviews={reviews}
                reviewLoading={reviewLoading}
                onReviewTrade={reviewTrade}
                onClearReview={clearReview}
              />
            )}
          </div>

          {/* Analysis panel — expands on hover */}
          <div
            onMouseEnter={() => setPanelExpanded(true)}
            onMouseLeave={() => setPanelExpanded(false)}
          >
            <div className={cn(
              'transition-all duration-300 ease-in-out',
              isPanelExpanded ? 'w-80 opacity-100' : 'w-12 opacity-60',
            )}>
              <AnalysisPanel trades={filteredTrades} isCollapsed={!isPanelExpanded} />
            </div>
          </div>
        </div>
      )}

      <AddTradeModal
        open={showModal}
        onClose={handleClose}
        onSave={handleSave}
        initialData={editingTrade}
        isSaving={isSaving}
      />
    </div>
  );
}