import React, { useRef, useState } from 'react';
import { Download, Upload, Loader2, BookOpenCheck } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { usePlaybook } from '@/lib/hooks/usePlaybook';
import { useDataPoints } from '@/lib/hooks/useDataPoints';
import { selectDataPointsForStrategies } from '@/lib/dataPoints/utils';
import { useSetupJournal } from '@/lib/hooks/useSetupJournal';
import { selectJournalEntriesForStrategies } from '@/lib/setupJournal/utils';
import { useSettings } from '@/lib/context/SettingsContext';
import { formatBytes } from '@/lib/backup/size';
import { useIndicatorFiles } from '@/lib/hooks/useIndicatorFiles';
import { useAlertTriggers } from '@/lib/hooks/useAlertTriggers';
import { normalizeIndicators } from '@/lib/playbook/indicators';

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
        const dataPoints = Array.isArray(data?.data_points) ? data.data_points : [];
        const journal = Array.isArray(data?.setup_journal) ? data.setup_journal : [];
        const triggers = Array.isArray(data?.alert_triggers) ? data.alert_triggers : [];
        resolve({ strategies, dataPoints, journal, triggers });
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
  const { dataPoints, importDataPoints } = useDataPoints();
  const { journalEntries, importJournalEntries } = useSetupJournal();
  const { settings } = useSettings();
  const { readCode, restore: restoreIndicator } = useIndicatorFiles();
  const { triggers: allTriggers, upsert: upsertTrigger } = useAlertTriggers();
  const accountType = settings?.account_type || 'demo';
  const [isImporting, setIsImporting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [parsedFile, setParsedFile] = useState(null);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      // Indicators travel as their code: a file on this machine means
      // nothing anywhere else. One that cannot be read goes without it.
      let unreadable = 0;
      const indicatorsById = new Map();
      for (const entry of playbookEntries) {
        const withCode = [];
        for (const indicator of normalizeIndicators(entry.indicators)) {
          let content = '';
          try {
            content = await readCode(indicator);
          } catch {
            unreadable += 1;
          }
          withCode.push({
            id: indicator.id,
            name: indicator.name,
            original_name: indicator.original_name,
            note: indicator.note,
            size: indicator.size,
            added_at: indicator.added_at,
            content,
          });
        }
        indicatorsById.set(entry.id, withCode);
      }

      // Loss (R) / Win Rate are computed live from this account's trade history,
      // not portable strategy config — strip them so an export/import round trip
      // never carries stale performance numbers into another account.
      const exportableStrategies = playbookEntries.map((entry) => ({
        ...entry,
        // Charts are not exported: they live in Informative Images, and a
        // strategies file is the setup's rules, not its screenshots.
        images: [],
        images_gallery_ids: [],
        images_gallery_id: '',
        indicators: indicatorsById.get(entry.id) || [],
        trigger_spec: entry.trigger_spec
          ? { ...entry.trigger_spec, loss_r: null, win_rate: null }
          : entry.trigger_spec,
      }));

      // Alert triggers are a strategy's evidence, like its Data Points: the
      // ones filed under these setups go with them, by setup name.
      const namesById = new Map(playbookEntries.map((entry) => [entry.id, entry.name]));
      const exportableTriggers = allTriggers
        .filter((trigger) => namesById.has(trigger.playbook_id))
        .map(({ playbook_id: playbookId, ...trigger }) => ({ ...trigger, playbook_name: namesById.get(playbookId) }));

      // Data Points are a strategy's own evidence, so they travel with it —
      // only the observations belonging to the setups being exported.
      const exportableDataPoints = selectDataPointsForStrategies(
        dataPoints,
        playbookEntries.map((entry) => entry.name)
      );

      // Setup Journal debriefs belong to the setup they were written for, and
      // the prompts they answer travel inside the strategy itself. The hook
      // already narrows them to the selected account tier, matching the
      // strategies themselves, which are stored per tier.
      const exportableJournal = selectJournalEntriesForStrategies(
        journalEntries,
        playbookEntries.map((entry) => entry.name)
      );

      const backup = {
        version: 4,
        app: 'TradeDesk Pro',
        exported_at: new Date().toISOString(),
        account_type: accountType,
        strategies: exportableStrategies,
        data_points: exportableDataPoints,
        setup_journal: exportableJournal,
        alert_triggers: exportableTriggers,
      };
      const date = new Date().toISOString().slice(0, 10);
      triggerDownload(JSON.stringify(backup, null, 2), `tradedesk-strategies-${accountType}-${date}.json`);
      toast.success(
        `Exported ${playbookEntries.length} strategy setup(s), ${exportableDataPoints.length} data point(s)`
        + `, ${exportableJournal.length} journal entr${exportableJournal.length === 1 ? 'y' : 'ies'}`
        + ` and ${exportableTriggers.length} alert trigger(s)`
      );
      if (unreadable > 0) {
        toast.warning(`${unreadable} indicator file(s) could not be read and were exported without their code.`);
      }
    } finally {
      setIsExporting(false);
    }
  };

  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';
    try {
      const { strategies, dataPoints: filePoints, journal: fileJournal, triggers: fileTriggers } = await parseStrategiesFile(file);
      setParsedFile({
        strategies,
        dataPoints: filePoints,
        journal: fileJournal,
        triggers: fileTriggers,
        filename: file.name,
        bytes: file.size,
      });
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleImport = async () => {
    if (!parsedFile) return;
    setIsImporting(true);
    try {
      // Indicators come back as files. One this setup already has — same
      // name and size — is kept as it is rather than written twice.
      let indicatorsRestored = 0;
      const strategies = [];
      for (const strategy of parsedFile.strategies) {
        const existing = playbookEntries.find((entry) => entry.name.toLowerCase() === String(strategy?.name || '').trim().toLowerCase());
        const current = normalizeIndicators(existing?.indicators);
        const indicators = [];
        for (const indicator of Array.isArray(strategy?.indicators) ? strategy.indicators : []) {
          const same = current.find((c) => c.original_name === indicator.original_name && c.size === indicator.size);
          if (same) {
            indicators.push(same);
          } else if (typeof indicator.content === 'string' && indicator.content) {
            try {
              indicators.push(await restoreIndicator(indicator));
              indicatorsRestored += 1;
            } catch (error) {
              toast.error(`Indicator ${indicator.original_name || indicator.name}: ${error?.message || 'could not be restored'}`);
            }
          } else if (indicator.ref) {
            // An older file: a reference only, good on the machine it came from.
            indicators.push(indicator);
          }
        }
        strategies.push({ ...strategy, indicators });
      }

      // Charts are never imported — a setup keeps the ones it already has.
      const result = await importEntries(strategies);
      const pointsResult = parsedFile.dataPoints.length > 0
        ? await importDataPoints(parsedFile.dataPoints)
        : { created: 0 };
      // The journal is replaced outright, so an empty section in the file
      // still means "this tier's journal is now empty".
      const journalResult = await importJournalEntries(parsedFile.journal);

      // Alert triggers, back under their setups by name. One already here is left alone.
      const idsByName = new Map((result.entries || []).map((entry) => [entry.name.toLowerCase(), entry]));
      const have = new Set(allTriggers.map((t) => t.id));
      let triggersRestored = 0;
      for (const trigger of parsedFile.triggers || []) {
        if (!trigger?.id || have.has(trigger.id)) continue;
        const entry = idsByName.get(String(trigger.playbook_name || '').toLowerCase());
        const { id, ...record } = trigger;
        await upsertTrigger(id, {
          ...record,
          playbook_id: entry?.id || null,
          playbook_name: entry?.name || null,
          assigned: entry ? (record.assigned || 'auto') : null,
        });
        triggersRestored += 1;
      }

      toast.success(
        `Strategies imported — ${result.created} added, ${result.updated} updated`
        + (pointsResult.created > 0 ? `, ${pointsResult.created} data point(s) restored` : '')
        + `, journal replaced with ${journalResult.created} entr${journalResult.created === 1 ? 'y' : 'ies'}`
        + (indicatorsRestored > 0 ? `, ${indicatorsRestored} indicator file(s) restored` : '')
        + (triggersRestored > 0 ? `, ${triggersRestored} alert trigger(s) restored` : '')
      );
      setParsedFile(null);
    } catch (err) {
      toast.error(`Import failed: ${err.message}`);
    } finally {
      setIsImporting(false);
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
          Downloads a <code className="text-white/70">.json</code> file with all {playbookEntries.length} Playbook setup(s) — entry/exit rules, grade criteria, expected R, alert keywords, indicator code, their Journal Template prompts, their Data Points observations, their alert triggers, and their Setup Journal entries for the {accountType} tier. Chart images are not included.
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
              <p>
                {parsedFile.strategies.length} setup(s)
                {parsedFile.dataPoints.length > 0 ? ` · ${parsedFile.dataPoints.length} data point(s)` : ''}
                {parsedFile.journal.length > 0 ? ` · ${parsedFile.journal.length} journal entr${parsedFile.journal.length === 1 ? 'y' : 'ies'}` : ''}
                {parsedFile.triggers?.length > 0 ? ` · ${parsedFile.triggers.length} alert trigger(s)` : ''} found
                {parsedFile.bytes ? ` · ${formatBytes(parsedFile.bytes)}` : ''}
              </p>
            </div>
            <p className="text-[11px] text-white/35">
              Setups matching an existing name are updated in place; everything else is added as new. Data Points and journal entries you already have are skipped, and a file with no Journal Template leaves the one a setup already has alone.
            </p>
            <div className="flex gap-2 mt-auto">
              <Button size="sm" variant="ghost" className="flex-1 text-xs text-white/40" onClick={() => setParsedFile(null)}>
                Cancel
              </Button>
              <Button
                size="sm"
                disabled={isSaving || isImporting}
                onClick={handleImport}
                className="flex-1 bg-cyan-600/80 hover:bg-cyan-600 text-white text-xs font-semibold"
              >
                {isSaving || isImporting ? <><Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />Importing…</> : 'Import Strategies'}
              </Button>
            </div>
          </div>
        ) : (
          <>
            <p className="text-xs text-white/50 leading-relaxed">
              Upload a previously exported strategies file to add or update Playbook setups, their Data Points, and their Setup Journal.
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
