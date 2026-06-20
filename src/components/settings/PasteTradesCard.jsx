import React, { useMemo, useState } from 'react';
import { ClipboardPaste, Upload } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { parseTradesPastedText } from '@/components/journal/utils/csvImport';

const SAMPLE_HEADERS = [
  'ID',
  'Open Date',
  'Close Date',
  'Symbol',
  'Side',
  'Entry',
  'Exit',
  'Qty',
  'Fee',
  'P&L',
  'Status',
].join('\t');

const DEFAULT_ROLLOVER_DAYS = [1, 2, 3];

const toYearValue = (value, fallback) => {
  const parsed = Number(value);
  return Number.isInteger(parsed) ? parsed : (fallback ?? new Date().getFullYear());
};

export default function PasteTradesCard({
  accountTier = 'custom',
  onImportTrades,
  isImporting = false,
}) {
  const [pasteValue, setPasteValue] = useState('');
  const [parseResult, setParseResult] = useState(null);
  const missingYearBase = String(new Date().getFullYear());

  const canParse = String(pasteValue || '').trim().length > 0;
  const parsedTrades = Array.isArray(parseResult?.trades) ? parseResult.trades : [];
  const parseErrors = Array.isArray(parseResult?.errors) ? parseResult.errors : [];
  const previewTrades = useMemo(() => parsedTrades.slice(0, 4), [parsedTrades]);

  const handleParse = () => {
    if (!canParse) {
      toast.error('Paste trades first.');
      return;
    }

    const year = toYearValue(missingYearBase, 2025);
    const result = parseTradesPastedText(pasteValue, {
      defaultAccountTier: accountTier,
      missingYearBase: year,
      missingYearRolloverDays: DEFAULT_ROLLOVER_DAYS,
    });

    setParseResult(result);

    if (result.totalRows === 0) {
      toast.error('No importable rows found.');
      return;
    }

    if (result.trades.length === 0) {
      toast.error('No valid trades found. Check the pasted format.');
      return;
    }

    const skipped = Math.max(0, result.totalRows - result.trades.length);
    if (skipped > 0) {
      toast.warning(`Parsed ${result.trades.length} trades, ${skipped} skipped.`);
      return;
    }

    toast.success(`Parsed ${result.trades.length} trades.`);
  };

  const handleImport = async () => {
    if (typeof onImportTrades !== 'function') {
      toast.error('Import action is unavailable right now.');
      return;
    }

    if (parsedTrades.length === 0) {
      toast.error('Parse trades before importing.');
      return;
    }

    try {
      const created = await onImportTrades(parsedTrades);
      const importedCount = Array.isArray(created) ? created.length : 0;
      const skipped = Math.max(0, parsedTrades.length - importedCount);

      if (importedCount > 0) {
        toast.success(`Imported ${importedCount} trade${importedCount === 1 ? '' : 's'}.`);
      }

      if (skipped > 0) {
        toast.warning(`${skipped} trade${skipped === 1 ? '' : 's'} were skipped during write.`);
      }
    } catch (error) {
      toast.error(`Import failed: ${error?.message || 'Unknown error'}`);
    }
  };

  return (
    <div className="space-y-3 rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4">
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <ClipboardPaste className="h-4 w-4 text-emerald-300" />
          <h3 className="text-sm font-semibold text-emerald-200">Paste Trades</h3>
        </div>
        <p className="text-xs text-white/50">
          Paste Trade The Pool table text directly. No CSV/export needed.
        </p>
      </div>

      <Textarea
        value={pasteValue}
        onChange={(event) => setPasteValue(event.target.value)}
        placeholder={`Paste table with headers, e.g.\n${SAMPLE_HEADERS}\n...`}
        className="min-h-[180px] bg-black/20 border-white/10 text-xs font-mono"
      />

      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="secondary"
          className="bg-white/10 hover:bg-white/15 text-white"
          onClick={handleParse}
          disabled={!canParse || isImporting}
        >
          Parse Paste
        </Button>
        <Button
          type="button"
          className="bg-emerald-600 hover:bg-emerald-700"
          onClick={handleImport}
          disabled={parsedTrades.length === 0 || isImporting}
        >
          <Upload className="mr-1.5 h-4 w-4" />
          {isImporting ? 'Importing...' : 'Import Trades'}
        </Button>
      </div>

      {parseResult ? (
        <div className="space-y-2 rounded-lg border border-white/10 bg-black/25 p-3">
          <p className="text-[11px] text-white/70">
            Parsed: {parsedTrades.length} valid / {parseResult.totalRows || 0} rows
          </p>

          {previewTrades.length > 0 ? (
            <div className="space-y-1">
              {previewTrades.map((trade, index) => (
                <div key={`${trade.symbol}-${trade.entry_time}-${index}`} className="text-[11px] text-white/65">
                  {trade.symbol} | {trade.direction} | {trade.quantity} @ {trade.entry_price}
                </div>
              ))}
            </div>
          ) : null}

          {parseErrors.length > 0 ? (
            <div className="space-y-1 rounded border border-rose-500/25 bg-rose-500/10 p-2">
              <p className="text-[10px] uppercase tracking-wide text-rose-300/90">Skipped Rows</p>
              {parseErrors.slice(0, 4).map((entry) => (
                <p key={`parse-error-${entry.row}-${entry.error}`} className="text-[11px] text-rose-100/80">
                  Row {entry.row}: {entry.error}
                </p>
              ))}
              {parseErrors.length > 4 ? (
                <p className="text-[10px] text-rose-100/65">+{parseErrors.length - 4} more</p>
              ) : null}
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

