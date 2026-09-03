import React, { useRef, useState } from 'react';
import { Download, Upload, Loader2, BookOpenCheck } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { usePlaybook } from '@/lib/hooks/usePlaybook';

function triggerDownload(content, filename) {
  const blob = new Blob([content], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function parseStrategiesFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result);
        const strategies = Array.isArray(data?.strategies) ? data.strategies : Array.isArray(data) ? data : null;
        if (!strategies) {
          reject(new Error('Not a valid strategies file'));
          return;
        }
        resolve(strategies);
      } catch {
        reject(new Error('File is not valid JSON'));
      }
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsText(file);
  });
}

export default function StrategiesBackupCard() {
  const fileInputRef = useRef(null);
  const { playbookEntries, importEntries, isSaving } = usePlaybook();
  const [isExporting, setIsExporting] = useState(false);
  const [parsedFile, setParsedFile] = useState(null);

  const handleExport = () => {
    setIsExporting(true);
    try {
      // Loss (R) / Win Rate are computed live from this account's trade history,
      // not portable strategy config — strip them so an export/import round trip
      // never carries stale performance numbers into another account.
      const exportableStrategies = playbookEntries.map((entry) => ({
        ...entry,
        trigger_spec: entry.trigger_spec
          ? { ...entry.trigger_spec, loss_r: null, win_rate: null }
          : entry.trigger_spec,
      }));

      const backup = {
        version: 1,
        app: 'TradeDesk Pro',
        exported_at: new Date().toISOString(),
        strategies: exportableStrategies,
      };
      const date = new Date().toISOString().slice(0, 10);
      triggerDownload(JSON.stringify(backup, null, 2), `tradedesk-strategies-${date}.json`);
      toast.success(`Exported ${playbookEntries.length} strategy setup(s)`);
    } finally {
      setIsExporting(false);
    }
  };

  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';
    try {
      const strategies = await parseStrategiesFile(file);
      setParsedFile({ strategies, filename: file.name });
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleImport = async () => {
    if (!parsedFile) return;
    try {
      const result = await importEntries(parsedFile.strategies);
      toast.success(`Strategies imported — ${result.created} added, ${result.updated} updated`);
      setParsedFile(null);
    } catch (err) {
      toast.error(`Import failed: ${err.message}`);
    }
  };

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      {/* ── Export ─────────────────────────────────────────────── */}
      <div className="flex flex-col gap-3 rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4">
        <div className="flex items-center gap-2">
          <BookOpenCheck className="h-4 w-4 text-emerald-400" />
          <span className="text-sm font-semibold text-emerald-300">Export Strategies</span>
        </div>
        <p className="text-xs text-white/50 leading-relaxed">
          Downloads a <code className="text-white/70">.json</code> file with all {playbookEntries.length} Playbook setup(s) — entry/exit rules, grade criteria, and expected R.
        </p>
        <Button
          onClick={handleExport}
          disabled={isExporting || playbookEntries.length === 0}
          className="mt-auto h-9 bg-emerald-600/80 hover:bg-emerald-600 text-white font-semibold text-sm"
        >
          {isExporting ? (
            <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Exporting…</>
          ) : (
            <><Download className="mr-2 h-4 w-4" />Download Strategies</>
          )}
        </Button>
      </div>

      {/* ── Import ─────────────────────────────────────────────── */}
      <div className="flex flex-col gap-3 rounded-xl border border-cyan-500/20 bg-cyan-500/5 p-4">
        <div className="flex items-center gap-2">
          <Upload className="h-4 w-4 text-cyan-400" />
          <span className="text-sm font-semibold text-cyan-300">Import Strategies</span>
        </div>

        {parsedFile ? (
          <div className="flex flex-col gap-3">
            <div className="rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-xs text-white/60 space-y-0.5">
              <p className="font-semibold text-white/80 truncate">{parsedFile.filename}</p>
              <p>{parsedFile.strategies.length} setup(s) found</p>
            </div>
            <p className="text-[11px] text-white/35">
              Setups matching an existing name are updated in place; everything else is added as new.
            </p>
            <div className="flex gap-2 mt-auto">
              <Button size="sm" variant="ghost" className="flex-1 text-xs text-white/40" onClick={() => setParsedFile(null)}>
                Cancel
              </Button>
              <Button
                size="sm"
                disabled={isSaving}
                onClick={handleImport}
                className="flex-1 bg-cyan-600/80 hover:bg-cyan-600 text-white text-xs font-semibold"
              >
                {isSaving ? <><Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />Importing…</> : 'Import Strategies'}
              </Button>
            </div>
          </div>
        ) : (
          <>
            <p className="text-xs text-white/50 leading-relaxed">
              Upload a previously exported strategies file to add or update Playbook setups.
            </p>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="mt-auto flex h-20 flex-col items-center justify-center gap-1.5 rounded-lg border-2 border-dashed border-white/15 text-white/40 transition-colors hover:border-cyan-400/40 hover:text-cyan-300"
            >
              <Upload className="h-5 w-5" />
              <span className="text-xs">Choose strategies file</span>
            </button>
            <input ref={fileInputRef} type="file" accept=".json" className="hidden" onChange={handleFileSelect} />
          </>
        )}
      </div>
    </div>
  );
}
