import React, { useRef, useState } from 'react';
import { Download, Upload, Loader2, BookOpen, FileSpreadsheet } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { useTrades, useTradesMutation } from '@/lib/hooks/useTrades';
import { useSettings } from '@/lib/context/SettingsContext';
import { useConfirm } from '@/components/ui/ConfirmDialog';

function triggerDownload(content, filename, mimeType) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// Flattens a value for a CSV cell — arrays/objects (criteria lists, reflection
// answers, the graded { text, grade } items introduced for Playbook criteria,
// etc.) are serialized to JSON so nothing is silently dropped from the export.
function toCsvCell(value) {
  if (value === null || value === undefined) return '';
  const text = typeof value === 'object' ? JSON.stringify(value) : String(value);
  return `"${text.replace(/"/g, '""')}"`;
}

// Union of every field across every trade — including newer fields like
// mfe_price/mfe_r_multiple — so the CSV always reflects whatever the current
// trade schema actually contains rather than a hardcoded column list that
// would silently go stale as fields are added.
function tradesToCsv(trades) {
  const columns = [];
  const seen = new Set();
  for (const trade of trades) {
    for (const key of Object.keys(trade || {})) {
      if (!seen.has(key)) {
        seen.add(key);
        columns.push(key);
      }
    }
  }

  const headerRow = columns.map((col) => toCsvCell(col)).join(',');
  const dataRows = trades.map((trade) => columns.map((col) => toCsvCell(trade?.[col])).join(','));
  return [headerRow, ...dataRows].join('\n');
}

function parseJournalFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result);
        const trades = Array.isArray(data?.trades) ? data.trades : Array.isArray(data) ? data : null;
        if (!trades) {
          reject(new Error('Not a valid journal export file'));
          return;
        }
        resolve(trades);
      } catch {
        reject(new Error('File is not valid JSON'));
      }
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsText(file);
  });
}

export default function JournalBackupCard() {
  const fileInputRef = useRef(null);
  const { data: trades = [] } = useTrades();
  const { bulkCreateTrades, isBulkCreating, deleteTrade } = useTradesMutation();
  const { settings } = useSettings();
  const accountType = settings?.account_type || 'demo';
  const [confirm, confirmDialog] = useConfirm();
  const [isExporting, setIsExporting] = useState(false);
  const [isReplacing, setIsReplacing] = useState(false);
  const [parsedFile, setParsedFile] = useState(null);

  const handleExportJson = () => {
    setIsExporting(true);
    try {
      const backup = {
        version: 2,
        app: 'TradeDesk Pro',
        exported_at: new Date().toISOString(),
        trade_count: trades.length,
        trades,
      };
      const date = new Date().toISOString().slice(0, 10);
      triggerDownload(JSON.stringify(backup, null, 2), `tradedesk-journal-${date}.json`, 'application/json');
      toast.success(`Exported ${trades.length} trade(s)`);
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportCsv = () => {
    setIsExporting(true);
    try {
      const date = new Date().toISOString().slice(0, 10);
      triggerDownload(tradesToCsv(trades), `tradedesk-journal-${date}.csv`, 'text/csv');
      toast.success(`Exported ${trades.length} trade(s) as CSV`);
    } finally {
      setIsExporting(false);
    }
  };

  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';
    try {
      const parsedTrades = await parseJournalFile(file);
      setParsedFile({ trades: parsedTrades, filename: file.name });
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleImport = async () => {
    if (!parsedFile) return;

    // The file is the journal: importing it replaces this tier's trades
    // rather than layering a second copy of the same history on top.
    const current = trades.filter((trade) => (trade?.account_type || 'demo') === accountType);
    const shouldReplace = await confirm({
      title: `Replace the ${accountType} journal?`,
      description: `${current.length} trade(s) in this tier will be deleted and replaced by the ${parsedFile.trades.length} in the file. This cannot be undone.`,
      confirmLabel: 'Replace trades',
      destructive: true,
    });
    if (!shouldReplace) return;

    setIsReplacing(true);
    try {
      for (const trade of current) {
        if (trade?.id) await deleteTrade(trade.id);
      }

      const stripped = parsedFile.trades.map(({ id: _id, ...tradeData }) => ({
        ...tradeData,
        account_type: tradeData.account_type || accountType,
      }));
      const created = await bulkCreateTrades(stripped);
      toast.success(`Imported ${created.length} trade(s), replacing ${current.length}`);
      setParsedFile(null);
    } catch (err) {
      toast.error(`Import failed: ${err.message}`);
    } finally {
      setIsReplacing(false);
    }
  };

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      {/* ── Export ─────────────────────────────────────────────── */}
      <div className="flex flex-col gap-3 rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4">
        <div className="flex items-center gap-2">
          <BookOpen className="h-4 w-4 text-emerald-400" />
          <span className="text-sm font-semibold text-emerald-300">Export Journal</span>
        </div>
        <p className="text-xs text-white/50 leading-relaxed">
          Exports all {trades.length} trade(s) in your journal, including every field you've logged —
          grades (A+ through F), Price Reached (MFE), R-multiples, and reflections.
        </p>
        <div className="mt-auto flex gap-2">
          <Button
            onClick={handleExportJson}
            disabled={isExporting || trades.length === 0}
            className="flex-1 h-9 bg-emerald-600/80 hover:bg-emerald-600 text-white font-semibold text-sm"
          >
            {isExporting ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Exporting…</>
            ) : (
              <><Download className="mr-2 h-4 w-4" />JSON</>
            )}
          </Button>
          <Button
            onClick={handleExportCsv}
            disabled={isExporting || trades.length === 0}
            variant="ghost"
            className="flex-1 h-9 border border-emerald-500/25 text-emerald-200 text-sm font-semibold hover:bg-emerald-500/10"
          >
            <FileSpreadsheet className="mr-2 h-4 w-4" />CSV
          </Button>
        </div>
        <p className="text-[10px] text-white/30">
          JSON preserves everything for re-import here. CSV is for opening in a spreadsheet.
        </p>
      </div>

      {/* ── Import ─────────────────────────────────────────────── */}
      <div className="flex flex-col gap-3 rounded-xl border border-cyan-500/20 bg-cyan-500/5 p-4">
        <div className="flex items-center gap-2">
          <Upload className="h-4 w-4 text-cyan-400" />
          <span className="text-sm font-semibold text-cyan-300">Import Journal</span>
        </div>

        {parsedFile ? (
          <div className="flex flex-col gap-3">
            <div className="rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-xs text-white/60 space-y-0.5">
              <p className="font-semibold text-white/80 truncate">{parsedFile.filename}</p>
              <p>{parsedFile.trades.length} trade(s) found</p>
            </div>
            <p className="text-[11px] text-white/35">
              This tier&apos;s existing trades are deleted first — the file replaces your journal rather than adding to it.
            </p>
            <div className="flex gap-2 mt-auto">
              <Button size="sm" variant="ghost" className="flex-1 text-xs text-white/40" onClick={() => setParsedFile(null)}>
                Cancel
              </Button>
              <Button
                size="sm"
                disabled={isBulkCreating || isReplacing}
                onClick={handleImport}
                className="flex-1 bg-cyan-600/80 hover:bg-cyan-600 text-white text-xs font-semibold"
              >
                {isBulkCreating || isReplacing
                  ? <><Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />Importing…</>
                  : 'Replace Trades'}
              </Button>
            </div>
          </div>
        ) : (
          <>
            <p className="text-xs text-white/50 leading-relaxed">
              Upload a previously exported journal file to add trades.
            </p>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="mt-auto flex h-20 flex-col items-center justify-center gap-1.5 rounded-lg border-2 border-dashed border-white/15 text-white/40 transition-colors hover:border-cyan-400/40 hover:text-cyan-300"
            >
              <Upload className="h-5 w-5" />
              <span className="text-xs">Choose journal file</span>
            </button>
            <input ref={fileInputRef} type="file" accept=".json" className="hidden" onChange={handleFileSelect} />
          </>
        )}
      </div>
      {confirmDialog}
    </div>
  );
}
