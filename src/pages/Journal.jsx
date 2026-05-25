/**
 * @file src/pages/Journal.jsx
 *
 * Batch-2 update: sort (#5), presets (#6), tags (#9), bulk select (#7), inline edit (#8).
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useJournal, useTradesMutation } from '@/lib/hooks/useTrades';
import { useTradeReview } from '@/lib/hooks/useTradeReview';
import { useSettings } from '@/lib/context/SettingsContext';
import { useTradesWithQuality } from '@/lib/hooks/useTradesWithQuality';
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
import { useJournalSort }      from '@/components/journal/shared/hooks/useJournalSort';
import { useJournalPresets }   from '@/components/journal/shared/hooks/useJournalPresets';
import { useJournalSelection } from '@/components/journal/shared/hooks/useJournalSelection';
import { BulkActionBar }       from '@/components/journal/toolbar/BulkActionBar';
import { TradeDetailDrawer }   from '@/components/journal/TradeDetailDrawer';
import { KeyboardShortcutsOverlay } from '@/components/journal/KeyboardShortcutsOverlay';
import { useJournalKeyboardShortcuts } from '@/components/journal/shared/hooks/useJournalKeyboardShortcuts';
import { useConfirm }          from '@/components/ui/ConfirmDialog';

const PAGE_SIZE = 20;

export default function Journal() {
  const [viewMode, setViewMode] = useState(VIEW_MODES.COMPACT);
  const [drawerTrade, setDrawerTrade] = useState(null);
  const [showShortcutsOverlay, setShowShortcutsOverlay] = useState(false);
  const [confirm, confirmDialog] = useConfirm();

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

  const tradesWithQuality = useTradesWithQuality(trades, riskLimit);

  // ── Filters ─────────────────────────────────────────────────────────────
  const {
    searchTerm, setSearchTerm,
    filter,     setFilter,
    dateRange,  setDateRange,
    tagFilter,  setTagFilter,
    filteredTrades,
    applyFilterState,
  } = useJournalFilters(tradesWithQuality);

  // ── Sort (after filter, before pagination) ───────────────────────────────
  const { sortKey, sortDir, sortedTrades, onSortChange, setSort } = useJournalSort(filteredTrades);

  // ── Presets ──────────────────────────────────────────────────────────────
  const { presets, applyPreset, savePreset, deletePreset, setDefaultPreset, getDefaultPreset } =
    useJournalPresets();

  // Apply the default preset on first mount
  useEffect(() => {
    const def = getDefaultPreset();
    if (def?.filters) applyFilterState(def.filters);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleApplyPreset = useCallback((id) => {
    applyPreset(id, (filters) => {
      applyFilterState(filters);
      if (filters.sortKey !== undefined) setSort(filters.sortKey, filters.sortDir);
    });
    setCurrentPage(1);
  }, [applyPreset, applyFilterState, setSort]);

  const handleSavePreset = useCallback((name) => {
    savePreset(name, { searchTerm, filter, dateRange, tagFilter, sortKey, sortDir });
  }, [savePreset, searchTerm, filter, dateRange, tagFilter, sortKey, sortDir]);

  // ── resetSignal drives pagination + selection resets ──────────────────────
  const resetSignal = useMemo(
    () => `${searchTerm}|${filter}|${dateRange}|${tagFilter.join(',')}|${sortKey}|${sortDir}`,
    [searchTerm, filter, dateRange, tagFilter, sortKey, sortDir],
  );

  // ── Pagination ───────────────────────────────────────────────────────────
  const {
    currentPage,
    setCurrentPage,
    totalPages,
    paginatedItems,
    pageStartNumber,
    pageEndNumber,
  } = useJournalPagination(sortedTrades, { pageSize: PAGE_SIZE, resetSignal });

  // ── Bulk selection ───────────────────────────────────────────────────────
  const {
    selectedIds,
    selectedTrades,
    toggle: toggleSelect,
    togglePage: toggleAllOnPage,
    clear: clearSelection,
    isAllSelected,
    isIndeterminate,
    count: selectionCount,
  } = useJournalSelection({ trades: paginatedItems, resetSignal });

  // ── Data transfer ─────────────────────────────────────────────────────────
  const { isImporting, importStatus, handleImportCsv, handleExportCsv } =
    useJournalDataTransfer({ filteredTrades, accountTier, bulkCreateTrades });

  const handleExportSelected = useCallback((selected) => {
    handleExportCsv(selected);
  }, [handleExportCsv]);

  // ── Trade management ──────────────────────────────────────────────────────
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
    handleBulkDelete,
    handleBulkTag,
    handleBulkMarkPlan,
  } = useJournalTradeManagement({ createTrade, updateTrade, deleteTrade, bulkCreateTrades, confirmFn: confirm });

  const {
    reviews, loading: reviewLoading, reviewTrade, clearReview, usefulnessById, rateReviewUsefulness,
  } = useTradeReview();

  useEffect(() => {
    window.addEventListener('trades-updated', refetch);
    return () => window.removeEventListener('trades-updated', refetch);
  }, [refetch]);

  const handleEscape = useCallback(() => {
    if (drawerTrade) { setDrawerTrade(null); return; }
    setShowShortcutsOverlay(false);
  }, [drawerTrade]);

  useJournalKeyboardShortcuts({
    onNewTrade: openCreateModal,
    onEscape: handleEscape,
    onToggleShortcutsOverlay: useCallback(() => setShowShortcutsOverlay((v) => !v), []),
  });

  const handleBulkDeleteWithClear = useCallback(async (ids) => {
    await handleBulkDelete(ids);
    clearSelection();
  }, [handleBulkDelete, clearSelection]);

  return (
    <div className="space-y-4">
      <JournalToolbar
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        filter={filter}
        onFilterChange={setFilter}
        dateRange={dateRange}
        onDateRangeChange={setDateRange}
        tagFilter={tagFilter}
        onTagFilterChange={setTagFilter}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        onAddTrade={openCreateModal}
        onExportCsv={handleExportCsv}
        canExport={filteredTrades.length > 0}
        onImportCsv={handleImportCsv}
        isImporting={isImporting}
        importStatus={importStatus}
        trades={filteredTrades}
        presets={presets}
        onApplyPreset={handleApplyPreset}
        onSavePreset={handleSavePreset}
        onDeletePreset={deletePreset}
        onSetDefaultPreset={setDefaultPreset}
      />

      {selectionCount > 0 && (
        <BulkActionBar
          count={selectionCount}
          selectedTrades={selectedTrades}
          onDelete={handleBulkDeleteWithClear}
          onExportSelected={handleExportSelected}
          onBulkTag={handleBulkTag}
          onBulkMarkPlan={handleBulkMarkPlan}
          onClear={clearSelection}
        />
      )}

      <JournalStatsBar trades={filteredTrades} />

      {isLoading ? (
        <div className="space-y-1">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-white/5 border border-white/10 rounded p-2 h-12 animate-pulse" />
          ))}
        </div>
      ) : filteredTrades.length === 0 ? (
        <EmptyState
          hasFilters={!!(searchTerm || filter !== 'all' || dateRange !== 'all' || tagFilter.length > 0)}
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
              onViewDetails={setDrawerTrade}
              reviews={reviews}
              reviewLoading={reviewLoading}
              onReviewTrade={reviewTrade}
              onClearReview={clearReview}
              reviewUsefulness={usefulnessById}
              onRateReviewUsefulness={rateReviewUsefulness}
              sortKey={sortKey}
              sortDir={sortDir}
              onSortChange={onSortChange}
              selectedIds={selectedIds}
              onToggleSelect={toggleSelect}
              onToggleAll={toggleAllOnPage}
              isAllSelected={isAllSelected}
              isIndeterminate={isIndeterminate}
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

      {drawerTrade && (
        <TradeDetailDrawer
          trade={drawerTrade}
          onClose={() => setDrawerTrade(null)}
          onEdit={() => { handleEdit(drawerTrade); setDrawerTrade(null); }}
        />
      )}

      {showShortcutsOverlay && (
        <KeyboardShortcutsOverlay onClose={() => setShowShortcutsOverlay(false)} />
      )}

      {confirmDialog}
    </div>
  );
}
