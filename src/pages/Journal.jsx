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
import { addRuleFromTradeNote } from '@/components/dosanddonts/storage';
import { useTradeReview } from '@/lib/hooks/useTradeReview';
import { VIEW_MODES } from '@/components/journal/utils/constants';
import { parseTradesCsv } from '@/components/journal/utils/csvImport';
import { validateTrade /* , sanitizeTrade */ } from '@/lib/validation/trades';
import { useSettings } from '@/lib/context/SettingsContext';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

const PAGE_SIZE = 20;

const csvEscape = (value) => {
  if (value === null || value === undefined) return '';
  const text = String(value);
  if (/[",\n\r]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
};

export default function Journal() {
  const [showModal, setShowModal] = useState(false);
  const [editingTrade, setEditingTrade] = useState(null);
  const [viewMode, setViewMode] = useState(VIEW_MODES.COMPACT);
  const [isImporting, setIsImporting] = useState(false);
  const [importStatus, setImportStatus] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);

  const { trades, isLoading, refetch } = useJournal();
  const { settings } = useSettings();
  const {
    createTrade,
    updateTrade,
    deleteTrade,
    bulkCreateTrades,
    isCreating,
    isUpdating,
    isBulkCreating
  } = useTradesMutation();
  const isSaving = isCreating || isUpdating || isBulkCreating;
  const accountTier = settings?.account_tier || 'custom';

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
  const totalPages = Math.max(1, Math.ceil(filteredTrades.length / PAGE_SIZE));
  const pageStartIndex = (currentPage - 1) * PAGE_SIZE;
  const paginatedTrades = filteredTrades.slice(pageStartIndex, pageStartIndex + PAGE_SIZE);
  const pageStartNumber = filteredTrades.length === 0 ? 0 : pageStartIndex + 1;
  const pageEndNumber = Math.min(filteredTrades.length, pageStartIndex + paginatedTrades.length);

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

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filter, dateRange]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

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

  const handleImportCsv = useCallback(async (file) => {
    if (!file) return;

    setImportStatus({
      type: 'info',
      message: `Importing ${file.name}...`,
    });
    setIsImporting(true);
    try {
      const csvText = await file.text();
      const { trades: importedTrades, errors, totalRows } = parseTradesCsv(csvText, {
        defaultAccountTier: accountTier,
      });

      if (totalRows === 0) {
        setImportStatus({
          type: 'error',
          message: 'CSV has no importable rows.',
        });
        toast.error('CSV has no importable rows.');
        return;
      }

      if (importedTrades.length === 0) {
        const preview = errors.slice(0, 3).map((item) => `Row ${item.row}: ${item.error}`).join(' | ');
        setImportStatus({
          type: 'error',
          message: preview || 'No valid trades found in CSV.',
        });
        toast.error(preview || 'No valid trades found in CSV.');
        return;
      }

      const createdTrades = await bulkCreateTrades(importedTrades);
      const importedCount = Array.isArray(createdTrades) ? createdTrades.length : 0;
      const writeFailures = Math.max(0, importedTrades.length - importedCount);
      const skippedCount = errors.length + writeFailures;

      if (importedCount > 0) {
        toast.success(`Imported ${importedCount} trade${importedCount === 1 ? '' : 's'} from CSV.`);
      }

      if (skippedCount > 0) {
        toast.warning(`${skippedCount} row${skippedCount === 1 ? '' : 's'} were skipped during import.`);
      }

      setImportStatus({
        type: skippedCount > 0 ? 'warning' : 'success',
        message: `Import complete: ${importedCount} imported${skippedCount > 0 ? `, ${skippedCount} skipped` : ''}.`,
      });

      if (errors.length > 0) {
        console.warn('[Journal][CSV Import] Skipped rows', errors);
      }
    } catch (error) {
      setImportStatus({
        type: 'error',
        message: `CSV import failed: ${error?.message || 'Unknown error'}`,
      });
      toast.error(`CSV import failed: ${error?.message || 'Unknown error'}`);
    } finally {
      setIsImporting(false);
    }
  }, [accountTier, bulkCreateTrades]);

  const handleExportCsv = useCallback(() => {
    if (!filteredTrades.length) {
      toast.error('No trades to export.');
      return;
    }

    const headers = [
      'date',
      'symbol',
      'direction',
      'entry_price',
      'exit_price',
      'quantity',
      'pnl',
      'r_multiple',
      'setup_type',
      'emotions',
      'followed_plan',
      'notes',
    ];

    const rows = filteredTrades.map((trade) => {
      const emotions = Array.isArray(trade.emotions) ? trade.emotions.join('|') : (trade.emotions || '');
      const tradeDate = trade.entry_time || trade.created_date || '';
      return [
        tradeDate,
        trade.symbol || '',
        trade.direction || '',
        trade.entry_price ?? '',
        trade.exit_price ?? '',
        trade.quantity ?? trade.position_size ?? '',
        trade.pnl ?? '',
        trade.r_multiple ?? '',
        trade.setup_type || '',
        emotions,
        trade.followed_plan ?? '',
        trade.notes || '',
      ];
    });

    const csvContent = [
      headers.map(csvEscape).join(','),
      ...rows.map((row) => row.map(csvEscape).join(',')),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `journal_export_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);

    toast.success(`Exported ${filteredTrades.length} trade${filteredTrades.length === 1 ? '' : 's'}.`);
  }, [filteredTrades]);

  const handleSaveNoteAsRule = useCallback((trade, type = 'do', noteOverride) => {
    const result = addRuleFromTradeNote({ trade, type, note: noteOverride });
    if (result.ok) {
      toast.success(`Saved note as ${type === 'dont' ? "Don't" : 'Do'} rule.`);
      return;
    }

    if (result.reason === 'empty_note') {
      toast.error('This trade has no note to save.');
      return;
    }

    if (result.reason === 'duplicate') {
      toast.warning('This note is already in Dos & Don\'ts.');
      return;
    }

    toast.error('Could not save note to Dos & Don\'ts.');
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
          onAddTrade={() => setShowModal(true)}
        />
      ) : (
        <div className="bg-[#1a1a24] border border-white/10 rounded overflow-hidden">
          {viewMode === VIEW_MODES.COMPACT ? (
            <CompactView
              trades={paginatedTrades}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onSaveNoteAsRule={handleSaveNoteAsRule}
              reviews={reviews}
              reviewLoading={reviewLoading}
              onReviewTrade={reviewTrade}
              onClearReview={clearReview}
            />
          ) : (
            <DetailedView
              trades={paginatedTrades}
              onEdit={handleEdit}
              onSaveNoteAsRule={handleSaveNoteAsRule}
              reviews={reviews}
              reviewLoading={reviewLoading}
              onReviewTrade={reviewTrade}
              onClearReview={clearReview}
            />
          )}
        </div>
      )}

      {filteredTrades.length > 0 && totalPages > 1 ? (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border border-white/10 rounded-md bg-[#12121a] px-3 py-2">
          <p className="text-xs text-white/60">
            Showing {pageStartNumber}-{pageEndNumber} of {filteredTrades.length}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
              className="border-white/10"
            >
              Prev
            </Button>
            <span className="text-xs text-white/70 min-w-[90px] text-center">
              Page {currentPage} / {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
              className="border-white/10"
            >
              Next
            </Button>
          </div>
        </div>
      ) : null}

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
