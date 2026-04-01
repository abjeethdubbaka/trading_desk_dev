/**
 * @file src/pages/Journal.jsx
 *
 * Phase 2 - rewired to useJournal() (Firebase-backed).
 * All trade CRUD flows through the new db layer.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useJournal, useTradesMutation } from '@/lib/hooks/useTrades';
import { useJournalFilters } from '@/components/journal';
import AddTradeModal from '@/components/journal/AddTradeModal';
import JournalToolbar from '@/components/journal/toolbar/JournalToolbar';
import CompactView from '@/components/journal/views/CompactView';
import DetailedView from '@/components/journal/views/DetailedView';
import EmptyState from '@/components/journal/views/EmptyState';
import JournalStatsBar from '@/components/journal/views/JournalStatsBar';
import { useTradeReview } from '@/lib/hooks/useTradeReview';
import { VIEW_MODES } from '@/components/journal/utils/constants';
import { validateTrade /* , sanitizeTrade */ } from '@/lib/validation/trades';
import { toast } from 'sonner';

export default function Journal() {
  const [showModal, setShowModal] = useState(false);
  const [editingTrade, setEditingTrade] = useState(null);
  const [viewMode, setViewMode] = useState(VIEW_MODES.COMPACT);

  const { trades, isLoading, refetch } = useJournal();
  const { createTrade, updateTrade, deleteTrade, isSaving } = useTradesMutation();

  const {
    searchTerm,
    setSearchTerm,
    filter,
    setFilter,
    dateRange,
    setDateRange,
    filteredTrades,
  } = useJournalFilters(trades);

  const { reviews, loading: reviewLoading, reviewTrade, clearReview } = useTradeReview();

  useEffect(() => {
    const handler = (e) => {
      setEditingTrade(e.detail?.tradeData ?? null);
      setShowModal(true);
    };
    window.addEventListener('open-add-trade-modal', handler);
    return () => window.removeEventListener('open-add-trade-modal', handler);
  }, []);

  useEffect(() => {
    const handler = () => {
      refetch();
    };
    window.addEventListener('trades-updated', handler);
    return () => window.removeEventListener('trades-updated', handler);
  }, [refetch]);

  const handleSave = useCallback(async (data) => {
    const validation = validateTrade(data);

    if (!validation.isValid) {
      toast.error(`Trade validation failed: ${(validation.errors || []).join(', ')}`);
      throw new Error(`Trade validation failed: ${(validation.errors || []).join(', ')}`);
    }

    try {
      if (editingTrade) {
        await updateTrade({ id: editingTrade.id, data });
        toast.success(`${data.symbol} updated`);
      } else {
        await createTrade(data);
        toast.success(`${data.symbol} logged`);
      }
      setShowModal(false);
      setEditingTrade(null);
      return true;
    } catch (err) {
      const codeText = err?.code ? ` (${err.code})` : '';
      toast.error(`Failed to save${codeText}: ${err?.message || 'Unknown error'}`);
      throw err;
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
        <div className="bg-[#1a1a24] border border-white/10 rounded overflow-hidden">
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
