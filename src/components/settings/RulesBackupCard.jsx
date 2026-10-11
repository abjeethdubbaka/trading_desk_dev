import React, { useRef, useState } from 'react';
import { Download, Upload, Loader2, ListChecks } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { useRules } from '@/lib/hooks/useRules';

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

function parseRulesFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result);
        const categories = Array.isArray(data?.rule_categories)
          ? data.rule_categories
          : Array.isArray(data) ? data : null;
        if (!categories) {
          reject(new Error('Not a valid rules file'));
          return;
        }
        resolve(categories);
      } catch {
        reject(new Error('File is not valid JSON'));
      }
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsText(file);
  });
}

export default function RulesBackupCard() {
  const fileInputRef = useRef(null);
  const { ruleCategories, importCategories, isSaving } = useRules();
  const [isExporting, setIsExporting] = useState(false);
  const [parsedFile, setParsedFile] = useState(null);

  const totalRules = ruleCategories.reduce((sum, category) => sum + category.pointers.length, 0);

  const handleExport = () => {
    setIsExporting(true);
    try {
      const backup = {
        version: 1,
        app: 'TradeDesk Pro',
        exported_at: new Date().toISOString(),
        rule_categories: ruleCategories,
      };
      const date = new Date().toISOString().slice(0, 10);
      triggerDownload(JSON.stringify(backup, null, 2), `tradedesk-rules-${date}.json`);
      toast.success(`Exported ${ruleCategories.length} categor${ruleCategories.length === 1 ? 'y' : 'ies'}`);
    } finally {
      setIsExporting(false);
    }
  };

  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';
    try {
      const categories = await parseRulesFile(file);
      setParsedFile({ categories, filename: file.name });
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleImport = async () => {
    if (!parsedFile) return;
    try {
      const result = await importCategories(parsedFile.categories);
      toast.success(`Rules imported — ${result.created} added, ${result.updated} updated`);
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
          <ListChecks className="h-4 w-4 text-emerald-400" />
          <span className="text-sm font-semibold text-emerald-300">Export Rules</span>
        </div>
        <p className="text-xs text-white/50 leading-relaxed">
          Downloads a <code className="text-white/70">.json</code> file with all {ruleCategories.length} categor{ruleCategories.length === 1 ? 'y' : 'ies'} and {totalRules} rule{totalRules === 1 ? '' : 's'} — including descriptions and Daily Read settings.
        </p>
        <Button
          onClick={handleExport}
          disabled={isExporting || ruleCategories.length === 0}
          className="mt-auto h-9 bg-emerald-600/80 hover:bg-emerald-600 text-white font-semibold text-sm"
        >
          {isExporting ? (
            <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Exporting…</>
          ) : (
            <><Download className="mr-2 h-4 w-4" />Download Rules</>
          )}
        </Button>
      </div>

      {/* ── Import ─────────────────────────────────────────────── */}
      <div className="flex flex-col gap-3 rounded-xl border border-cyan-500/20 bg-cyan-500/5 p-4">
        <div className="flex items-center gap-2">
          <Upload className="h-4 w-4 text-cyan-400" />
          <span className="text-sm font-semibold text-cyan-300">Import Rules</span>
        </div>

        {parsedFile ? (
          <div className="flex flex-col gap-3">
            <div className="rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-xs text-white/60 space-y-0.5">
              <p className="font-semibold text-white/80 truncate">{parsedFile.filename}</p>
              <p>{parsedFile.categories.length} categor{parsedFile.categories.length === 1 ? 'y' : 'ies'} found</p>
            </div>
            <p className="text-[11px] text-white/35">
              Categories matching an existing name are replaced; everything else is added as new.
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
                {isSaving ? <><Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />Importing…</> : 'Import Rules'}
              </Button>
            </div>
          </div>
        ) : (
          <>
            <p className="text-xs text-white/50 leading-relaxed">
              Upload a previously exported rules file to add or update categories.
            </p>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="mt-auto flex h-20 flex-col items-center justify-center gap-1.5 rounded-lg border-2 border-dashed border-white/15 text-white/40 transition-colors hover:border-cyan-400/40 hover:text-cyan-300"
            >
              <Upload className="h-5 w-5" />
              <span className="text-xs">Choose rules file</span>
            </button>
            <input ref={fileInputRef} type="file" accept=".json" className="hidden" onChange={handleFileSelect} />
          </>
        )}
      </div>
    </div>
  );
}
