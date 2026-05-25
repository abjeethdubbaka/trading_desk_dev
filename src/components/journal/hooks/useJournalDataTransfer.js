import { useCallback, useState } from 'react';
import { toast } from 'sonner';
import { parseTradesCsv } from '@/components/journal/utils/csvImport';
import { getTradeNotesText } from '@/components/journal/utils/notes';
import { TagsService } from '@/lib/services/TagsService';

const csvEscape = (value) => {
  if (value === null || value === undefined) return '';
  const text = String(value);
  if (/[",\n\r]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
};

export function useJournalDataTransfer({ filteredTrades, accountTier, bulkCreateTrades }) {
  const [isImporting, setIsImporting] = useState(false);
  const [importStatus, setImportStatus] = useState(null);

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
        const preview = errors
          .slice(0, 3)
          .map((item) => `Row ${item.row}: ${item.error}`)
          .join(' | ');
        setImportStatus({
          type: 'error',
          message: preview || 'No valid trades found in CSV.',
        });
        toast.error(preview || 'No valid trades found in CSV.');
        return;
      }

      // Register any new tag names so they get a color assigned
      const allTagNames = [...new Set(importedTrades.flatMap((t) => Array.isArray(t.tags) ? t.tags : []))];
      allTagNames.forEach((name) => TagsService.findOrCreate(name));

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

  const handleExportCsv = useCallback((overrideTrades) => {
    const tradesToExport = Array.isArray(overrideTrades) ? overrideTrades : filteredTrades;
    if (!tradesToExport.length) {
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
      'tags',
      'notes',
    ];

    const rows = tradesToExport.map((trade) => {
      const emotions = Array.isArray(trade.emotions) ? trade.emotions.join('|') : (trade.emotions || '');
      const tags = Array.isArray(trade.tags) ? trade.tags.join('|') : '';
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
        tags,
        getTradeNotesText(trade),
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

    toast.success(`Exported ${tradesToExport.length} trade${tradesToExport.length === 1 ? '' : 's'}.`);
  }, [filteredTrades]);

  return {
    isImporting,
    importStatus,
    handleImportCsv,
    handleExportCsv,
  };
}
