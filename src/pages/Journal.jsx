/**
 * @file src/pages/Journal.jsx
 *
 * Phase 2 - rewired to useJournal() (Firebase-backed).
 * All trade CRUD flows through the new db layer.
 */

import React, { useEffect, useMemo, useState } from 'react';
import { useJournal, useTradesMutation } from '@/lib/hooks/useTrades';
import { useTradeReview } from '@/lib/hooks/useTradeReview';
import { useSettings } from '@/lib/context/SettingsContext';
import { computeTradeSetupQuality } from '@/lib/calculations/trades';
import {
  AddTradeModal,
  CompactView,
  DetailedView,
  EmptyState,
  JournalPagination,
  JournalStatsBar,
  JournalToolbar,
  VIEW_MODES,
  useJournalDataTransfer,
  useJournalFilters,
  useJournalPagination,
  useJournalTradeManagement,
} from '@/components/journal';

const PAGE_SIZE = 20;

export default function Journal() {
  const [viewMode, setViewMode] = useState(VIEW_MODES.COMPACT);

  const { trades, isLoading, refetch } = useJournal();
  const { settings } = useSettings();
  const {
    createTrade,
    updateTrade,
    deleteTrade,
    bulkCreateTrades,
    isCreating,
    isUpdating,
    isBulkCreating,
  } = useTradesMutation();
  const accountTier = settings?.account_tier || 'custom';
  const isSaving = isCreating || isUpdating || isBulkCreating;
  const riskLimit = Number(settings?.risk_amount);

  const tradesWithQuality = useMemo(() => {
    if (!Array.isArray(trades)) return [];

    return trades.map((trade) => {
      const quality = computeTradeSetupQuality(trade, { riskLimit });
      if (!Number.isFinite(quality?.score)) return trade;

      const normalizedScore = Math.round(quality.score);
      const currentScore = Number.isFinite(Number(trade?.setup_quality_score))
        ? Math.round(Number(trade.setup_quality_score))
        : null;
      const currentGrade = String(trade?.setup_grade || '').trim();
      const nextGrade = String(quality.grade || '').trim();

      if (currentScore === normalizedScore && currentGrade === nextGrade) {
        return trade;
      }

      return {
        ...trade,
        setup_quality_score: normalizedScore,
        setup_grade: nextGrade || trade?.setup_grade || '',
      };
    });
  }, [riskLimit, trades]);

  const {
    searchTerm,
    setSearchTerm,
    filter,
    setFilter,
    dateRange,
    setDateRange,
    filteredTrades,
  } = useJournalFilters(tradesWithQuality);

  const resetSignal = useMemo(() => `${searchTerm}|${filter}|${dateRange}`, [searchTerm, filter, dateRange]);

  const {
    currentPage,
    setCurrentPage,
    totalPages,
    paginatedItems,
    pageStartNumber,
    pageEndNumber,
  } = useJournalPagination(filteredTrades, {
    pageSize: PAGE_SIZE,
    resetSignal,
  });

  const {
    isImporting,
    importStatus,
    handleImportCsv,
    handleExportCsv,
  } = useJournalDataTransfer({
    filteredTrades,
    accountTier,
    bulkCreateTrades,
  });

  const {
    showModal,
    editingTrade,
    openCreateModal,
    handleEdit,
    handleClose,
    handleSave,
    handleDelete,
    handleDuplicateTrade,
    handleCopyNotes,
    handleInlineUpdateTrade,
  } = useJournalTradeManagement({
    createTrade,
    updateTrade,
    deleteTrade,
  });

  const {
    reviews,
    loading: reviewLoading,
    reviewTrade,
    clearReview,
    usefulnessById,
    rateReviewUsefulness,
  } = useTradeReview();

  useEffect(() => {
    const handleTradesUpdated = () => {
      refetch();
    };

    window.addEventListener('trades-updated', handleTradesUpdated);
    return () => window.removeEventListener('trades-updated', handleTradesUpdated);
  }, [refetch]);

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
        onAddTrade={openCreateModal}
        onExportCsv={handleExportCsv}
        canExport={filteredTrades.length > 0}
        onImportCsv={handleImportCsv}
        isImporting={isImporting}
        importStatus={importStatus}
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
          onAddTrade={openCreateModal}
        />
      ) : (
        <div className="bg-[#1a1a24] border border-white/10 rounded overflow-hidden">
          {viewMode === VIEW_MODES.COMPACT ? (
            <CompactView
              trades={paginatedItems}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onDuplicateTrade={handleDuplicateTrade}
              onCopyNotes={handleCopyNotes}
              onInlineUpdateTrade={handleInlineUpdateTrade}
              reviews={reviews}
              reviewLoading={reviewLoading}
              onReviewTrade={reviewTrade}
              onClearReview={clearReview}
              reviewUsefulness={usefulnessById}
              onRateReviewUsefulness={rateReviewUsefulness}
            />
          ) : (
            <DetailedView
              trades={paginatedItems}
              onEdit={handleEdit}
              onDuplicateTrade={handleDuplicateTrade}
              onCopyNotes={handleCopyNotes}
              onInlineUpdateTrade={handleInlineUpdateTrade}
            />
          )}
        </div>
      )}

      <JournalPagination
        totalItems={filteredTrades.length}
        totalPages={totalPages}
        currentPage={currentPage}
        onPageChange={setCurrentPage}
        pageStartNumber={pageStartNumber}
        pageEndNumber={pageEndNumber}
      />

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
