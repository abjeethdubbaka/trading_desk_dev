import React, { useRef, useState } from 'react';
import { Download, Upload, CheckCircle2, AlertTriangle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useBackup, getLastBackupInfo } from '@/lib/hooks/useBackup';

function formatRelativeTime(isoString) {
  if (!isoString) return null;
  const diff = Date.now() - new Date(isoString).getTime();
  const m = Math.floor(diff / 60000);
  const h = Math.floor(diff / 3600000);
  const d = Math.floor(diff / 86400000);
  if (m < 2) return 'just now';
  if (h < 1) return `${m}m ago`;
  if (d < 1) return `${h}h ago`;
  return `${d}d ago`;
}

function parseBackupFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result);
        if (!data.version || !data.app) {
          reject(new Error('Not a valid TradeDesk backup file'));
          return;
        }
        resolve(data);
      } catch {
        reject(new Error('File is not valid JSON'));
      }
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsText(file);
  });
}

export default function BackupRestoreCard() {
  const fileInputRef = useRef(null);
  const { isExporting, isImporting, exportBackup, importBackup } = useBackup();
  const [lastBackupInfo] = useState(() => getLastBackupInfo());
  const [parsedBackup, setParsedBackup] = useState(null);
  const [importOptions, setImportOptions] = useState({ trades: true, settings: false, dosAndDonts: false });
  const [importResult, setImportResult] = useState(null);

  const handleExport = async () => {
    try {
      const info = await exportBackup();
      toast.success(`Backup downloaded — ${info.tradesCount} trades saved`);
    } catch (err) {
      toast.error(`Backup failed: ${err.message}`);
    }
  };

  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';
    try {
      const data = await parseBackupFile(file);
      setParsedBackup({ data, filename: file.name });
      setImportResult(null);
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleImport = async () => {
    if (!parsedBackup) return;
    if (!importOptions.trades && !importOptions.settings && !importOptions.dosAndDonts) {
      toast.error('Select at least one item to restore');
      return;
    }
    try {
      const result = await importBackup(parsedBackup.data, importOptions);
      setImportResult(result);
      setParsedBackup(null);
      const parts = [];
      if (result.trades > 0) parts.push(`${result.trades} trades`);
      if (result.settings) parts.push('settings');
      if (result.dosAndDonts) parts.push('rules');
      toast.success(`Restored: ${parts.join(', ')}`);
    } catch (err) {
      toast.error(`Restore failed: ${err.message}`);
    }
  };

  const toggleOption = (key) => setImportOptions((prev) => ({ ...prev, [key]: !prev[key] }));

  const tradesCount = parsedBackup?.data?.trades?.length ?? 0;
  const hasSettings = parsedBackup?.data?.settings && Object.keys(parsedBackup.data.settings).length > 0;
  const hasRules = parsedBackup?.data?.dosAndDonts && Object.keys(parsedBackup.data.dosAndDonts).length > 0;
  const exportedAt = parsedBackup?.data?.exported_at;

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      {/* ── Export ─────────────────────────────────────────────── */}
      <div className="flex flex-col gap-3 rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4">
        <div className="flex items-center gap-2">
          <Download className="h-4 w-4 text-emerald-400" />
          <span className="text-sm font-semibold text-emerald-300">Backup Data</span>
        </div>
        <p className="text-xs text-white/50 leading-relaxed">
          Downloads a <code className="text-white/70">.json</code> file with all trades, settings, and rules. Keep it somewhere safe.
        </p>
        {lastBackupInfo && (
          <p className="text-[11px] text-white/35">
            Last backup: {formatRelativeTime(lastBackupInfo.at)} · {lastBackupInfo.tradesCount} trades
          </p>
        )}
        <Button
          onClick={handleExport}
          disabled={isExporting}
          className="mt-auto h-9 bg-emerald-600/80 hover:bg-emerald-600 text-white font-semibold text-sm"
        >
          {isExporting ? (
            <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Exporting…</>
          ) : (
            <><Download className="mr-2 h-4 w-4" />Download Backup</>
          )}
        </Button>
      </div>

      {/* ── Import ─────────────────────────────────────────────── */}
      <div className="flex flex-col gap-3 rounded-xl border border-cyan-500/20 bg-cyan-500/5 p-4">
        <div className="flex items-center gap-2">
          <Upload className="h-4 w-4 text-cyan-400" />
          <span className="text-sm font-semibold text-cyan-300">Restore from Backup</span>
        </div>

        {importResult ? (
          <div className="flex flex-col items-center gap-2 py-4 text-center">
            <CheckCircle2 className="h-8 w-8 text-emerald-400" />
            <p className="text-sm font-semibold text-white/80">Restore complete</p>
            <Button size="sm" variant="ghost" className="text-xs text-white/40" onClick={() => setImportResult(null)}>
              Restore another file
            </Button>
          </div>
        ) : parsedBackup ? (
          <div className="flex flex-col gap-3">
            <div className="rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-xs text-white/60 space-y-0.5">
              <p className="font-semibold text-white/80 truncate">{parsedBackup.filename}</p>
              {exportedAt && <p>Exported: {new Date(exportedAt).toLocaleDateString()}</p>}
              <p>{tradesCount} trades · {hasSettings ? 'settings ·' : ''} {hasRules ? 'rules' : ''}</p>
            </div>

            <div className="flex items-center gap-2 rounded-lg border border-amber-500/20 bg-amber-500/8 px-2.5 py-1.5">
              <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0 text-amber-400" />
              <p className="text-[11px] text-amber-200/80">Trades are added alongside existing data.</p>
            </div>

            <div className="space-y-1.5">
              {[
                { key: 'trades', label: `Trades (${tradesCount})`, available: tradesCount > 0 },
                { key: 'settings', label: 'Settings', available: hasSettings },
                { key: 'dosAndDonts', label: "Do's & Don'ts rules", available: hasRules },
              ].map(({ key, label, available }) => (
                <label
                  key={key}
                  className={`flex items-center gap-2 text-sm ${available ? 'cursor-pointer text-white/80' : 'cursor-not-allowed text-white/25'}`}
                >
                  <input
                    type="checkbox"
                    checked={importOptions[key] && available}
                    disabled={!available}
                    onChange={() => toggleOption(key)}
                    className="h-3.5 w-3.5 rounded border-white/20 accent-cyan-400"
                  />
                  {label}
                </label>
              ))}
            </div>

            <div className="flex gap-2 mt-auto">
              <Button size="sm" variant="ghost" className="flex-1 text-xs text-white/40" onClick={() => setParsedBackup(null)}>
                Cancel
              </Button>
              <Button
                size="sm"
                disabled={isImporting}
                onClick={handleImport}
                className="flex-1 bg-cyan-600/80 hover:bg-cyan-600 text-white text-xs font-semibold"
              >
                {isImporting ? <><Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />Restoring…</> : 'Restore Selected'}
              </Button>
            </div>
          </div>
        ) : (
          <>
            <p className="text-xs text-white/50 leading-relaxed">
              Upload a previously downloaded backup file to restore your data.
            </p>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="mt-auto flex h-20 flex-col items-center justify-center gap-1.5 rounded-lg border-2 border-dashed border-white/15 text-white/40 transition-colors hover:border-cyan-400/40 hover:text-cyan-300"
            >
              <Upload className="h-5 w-5" />
              <span className="text-xs">Choose backup file</span>
            </button>
            <input ref={fileInputRef} type="file" accept=".json" className="hidden" onChange={handleFileSelect} />
          </>
        )}
      </div>
    </div>
  );
}
