/**
 * @file src/pages/Journal.jsx
 *
 * Batch-2 update: sort (#5), presets (#6), tags (#9), bulk select (#7), inline edit (#8).
 */

import React, { useCallback, useEffect, useMemo } from 'react';
import { useJournal, useTradesMutation } from '@/lib/hooks/useTrades';
import { useSettings } from '@/lib/context/SettingsContext';
import { getDailyLossLimitsWeek1 } from '@/lib/config/dailyLossLimits';
import { useGuardianDays } from '@/lib/hooks/useGuardianDays';
import { useTradesWithQuality } from '@/lib/hooks/useTradesWithQuality';
import { Skeleton } from '@/components/ui/skeleton';
import {
  AddTradeModal,
  CompactView,
  EmptyState,
  JournalPagination,
  JournalToolbar,
  useJournalFilters,
  useJournalPagination,
  useJournalTradeManagement,
} from '@/components/journal';
import { useJournalSort }      from '@/components/journal/hooks/useJournalSort';
import { useJournalPresets }   from '@/components/journal/hooks/useJournalPresets';
import { useJournalSelection } from '@/components/journal/hooks/useJournalSelection';
import { BulkActionBar }       from '@/components/journal/toolbar/BulkActionBar';
import { TradeDetailDrawer }   from '@/components/journal/TradeDetailDrawer';
import { KeyboardShortcutsOverlay } from '@/components/journal/KeyboardShortcutsOverlay';
import { useJournalKeyboardShortcuts } from '@/components/journal/hooks/useJournalKeyboardShortcuts';
import { useColumnVisibility } from '@/components/journal/hooks/useColumnVisibility';
import { useJournalUi }        from '@/components/journal/hooks/useJournalUi';
import { useSetupJournal }     from '@/lib/hooks/useSetupJournal';
import { getJournaledTradeIds } from '@/lib/setupJournal/utils';
import { COLUMN_WIDTHS }       from '@/components/journal/views/compact/CompactHeader';

const PAGE_SIZE = 20;

export default function Journal() {
  const {
    drawerTradeId, openDrawer, closeDrawer,
    showShortcutsOverlay, toggleShortcuts, closeShortcuts,
    handleEscape,
  } = useJournalUi();
  const { columns, toggleColumn } = useColumnVisibility();

  const { trades, isLoading, refetch } = useJournal();
  const { settings } = useSettings();
  const { guardianDaysByDate } = useGuardianDays();
  const {
    createTrade,
    updateTrade,
    deleteTrade,
    bulkCreateTrades,
    isCreating,
    isUpdating,
    isBulkCreating,
  } = useTradesMutation();
  const isSaving = isCreating || isUpdating || isBulkCreating;
  const riskLimit = Number(settings?.risk_amount);

  const tradesWithQuality = useTradesWithQuality(trades, riskLimit);

  const { journalEntries } = useSetupJournal();
  const journaledTradeIds = useMemo(() => getJournaledTradeIds(journalEntries), [journalEntries]);
  const drawerTrade = useMemo(
    () => (drawerTradeId ? tradesWithQuality.find((t) => t.id === drawerTradeId) ?? null : null),
    [drawerTradeId, tradesWithQuality],
  );

  // ── Filters ─────────────────────────────────────────────────────────────
  const {
    searchTerm, setSearchTerm,
    filterKeys, toggleFilterKey,
    filter,
    dateRange,  setDateRange,
    clearFilters,
    hasActiveFilters,
    filteredTrades,
    applyFilterState,
  } = useJournalFilters(tradesWithQuality, { journaledTradeIds });

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
    savePreset(name, { searchTerm, filter, dateRange, sortKey, sortDir });
  }, [savePreset, searchTerm, filter, dateRange, sortKey, sortDir]);

  // ── resetSignal drives pagination + selection resets ──────────────────────
  const resetSignal = useMemo(
    () => `${searchTerm}|${filter}|${dateRange}|${sortKey}|${sortDir}`,
    [searchTerm, filter, dateRange, sortKey, sortDir],
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
    handleBulkMarkPlan,
  } = useJournalTradeManagement({ createTrade, updateTrade, deleteTrade, bulkCreateTrades });

  useEffect(() => {
    window.addEventListener('trades-updated', refetch);
    return () => window.removeEventListener('trades-updated', refetch);
  }, [refetch]);

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
        filterKeys={filterKeys}
        onToggleFilter={toggleFilterKey}
        dateRange={dateRange}
        onDateRangeChange={setDateRange}
        onClearFilters={clearFilters}
        hasActiveFilters={hasActiveFilters}
        onAddTrade={openCreateModal}
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
              <div className={`${COLUMN_WIDTHS.time} flex-shrink-0 space-y-1.5`}>
                <Skeleton className="h-2.5 w-10 rounded-full" />
                <Skeleton className="h-2 w-14 rounded-full" />
              </div>
              <div className={`flex ${COLUMN_WIDTHS.symbol} flex-shrink-0 items-center gap-1.5`}>
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
          hasFilters={hasActiveFilters}
          onAddTrade={openCreateModal}
          onClearFilters={clearFilters}
        />
      ) : (
        <div className="bg-[#1a1a24] border border-white/10 rounded overflow-hidden">
          <CompactView
            trades={paginatedItems}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onInlineUpdateTrade={handleInlineUpdateTrade}
            onViewDetails={(trade) => openDrawer(trade.id)}
            columns={columns}
            onToggleColumn={toggleColumn}
            riskLimit={riskLimit}
            maxDailyTrades={Number(settings?.max_daily_trades) || 0}
            dailyLossLimits={getDailyLossLimitsWeek1(settings)}
            guardianDaysByDate={guardianDaysByDate}
            sortKey={sortKey}
            sortDir={sortDir}
            onSortChange={onSortChange}
            selectedIds={selectedIds}
            onToggleSelect={toggleSelect}
            onToggleAll={toggleAllOnPage}
            isAllSelected={isAllSelected}
            isIndeterminate={isIndeterminate}
            journaledTradeIds={journaledTradeIds}
          />
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
          isDebriefed={drawerTrade ? journaledTradeIds.has(String(drawerTrade.id)) : null}
          trade={drawerTrade}
          onClose={closeDrawer}
          onEdit={() => { handleEdit(drawerTrade); closeDrawer(); }}
          updateTrade={updateTrade}
        />
      )}

      {showShortcutsOverlay && (
        <KeyboardShortcutsOverlay onClose={closeShortcuts} />
      )}

    </div>
  );
}
