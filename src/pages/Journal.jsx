/**
 * @file src/pages/Journal.jsx
 *
 * Batch-2 update: sort (#5), presets (#6), tags (#9), bulk select (#7), inline edit (#8).
 */

import React, { useCallback, useEffect, useMemo } from 'react';
import { useJournal, useTradesMutation } from '@/lib/hooks/useTrades';
import { useTradeReview } from '@/lib/hooks/useTradeReview';
import { useSettings } from '@/lib/context/SettingsContext';
import { useTradesWithQuality } from '@/lib/hooks/useTradesWithQuality';
import { Skeleton } from '@/components/ui/skeleton';
import {
  AddTradeModal,
  CompactView,
  DetailedView,
  EmptyState,
  JournalPagination,
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
import { useColumnVisibility } from '@/components/journal/shared/hooks/useColumnVisibility';
import { useJournalUi }        from '@/components/journal/shared/hooks/useJournalUi';

const PAGE_SIZE = 20;

export default function Journal() {
  const {
    viewMode, setViewMode,
    drawerTradeId, openDrawer, closeDrawer,
    showShortcutsOverlay, toggleShortcuts, closeShortcuts,
    handleEscape,
  } = useJournalUi();
  const { columns, toggleColumn } = useColumnVisibility();

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
  const drawerTrade = useMemo(
    () => (drawerTradeId ? tradesWithQuality.find((t) => t.id === drawerTradeId) ?? null : null),
    [drawerTradeId, tradesWithQuality],
  );

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
  }, []);  

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
    useJournalDataTransfer({ filteredTrades, accountTier, bulkCreateTrades, existingTrades: trades });

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
    handleInlineUpdateTrade,
    handleBulkDelete,
    handleBulkTag,
    handleBulkMarkPlan,
  } = useJournalTradeManagement({ createTrade, updateTrade, deleteTrade, bulkCreateTrades });

  const {
    reviews, loading: reviewLoading, reviewTrade, clearReview, usefulnessById, rateReviewUsefulness,
  } = useTradeReview();

  useEffect(() => {
    window.addEventListener('trades-updated', refetch);
    return () => window.removeEventListener('trades-updated', refetch);
  }, [refetch]);

  const handleTagClick = useCallback((tagName) => {
    setTagFilter((prev) => (prev.includes(tagName) ? prev : [...prev, tagName]));
    closeDrawer();
  }, [setTagFilter, closeDrawer]);

  useJournalKeyboardShortcuts({
    onNewTrade: openCreateModal,
    onEscape: handleEscape,
    onToggleShortcutsOverlay: toggleShortcuts,
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

      {isLoading ? (
        <div className="overflow-hidden rounded border border-white/10 bg-[#1a1a24]">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="flex items-center gap-0 border-b border-white/[0.04] px-3 py-2.5 last:border-0"
            >
              <Skeleton className="mr-1 h-3 w-3 flex-shrink-0 rounded-sm" />
              <Skeleton className="mr-2 h-3 w-3 flex-shrink-0 rounded" />
              <div className="w-[82px] flex-shrink-0 space-y-1.5">
                <Skeleton className="h-2.5 w-14 rounded-full" />
                <Skeleton className="h-2 w-10 rounded-full" />
              </div>
              <div className="flex w-[110px] flex-shrink-0 items-center gap-1.5">
                <Skeleton className="h-4 w-12 rounded" />
                <Skeleton className="h-4 w-10 rounded-full" />
              </div>
              <div className="hidden w-[145px] flex-shrink-0 sm:block">
                <Skeleton className="h-2.5 w-20 rounded-full" />
              </div>
              <div className="hidden w-[58px] flex-shrink-0 md:block">
                <Skeleton className="h-2.5 w-10 rounded-full" />
              </div>
              <div className="w-[150px] flex-shrink-0">
                <Skeleton className="h-5 w-20 rounded-full" />
              </div>
              <div className="flex flex-1 items-center gap-2">
                <Skeleton className="h-4 w-16 rounded-full" />
                <Skeleton className="hidden h-4 w-12 rounded-full sm:block" />
              </div>
            </div>
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
              onInlineUpdateTrade={handleInlineUpdateTrade}
              onViewDetails={(trade) => openDrawer(trade.id)}
              onTagClick={handleTagClick}
              columns={columns}
              onToggleColumn={toggleColumn}
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
          onClose={closeDrawer}
          onEdit={() => { handleEdit(drawerTrade); closeDrawer(); }}
          onTagClick={handleTagClick}
          updateTrade={updateTrade}
        />
      )}

      {showShortcutsOverlay && (
        <KeyboardShortcutsOverlay onClose={closeShortcuts} />
      )}

    </div>
  );
}
