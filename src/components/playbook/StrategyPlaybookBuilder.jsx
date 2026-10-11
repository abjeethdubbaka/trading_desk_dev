import React, { useMemo, useState } from 'react';
import { useConfirm } from '@/components/ui/ConfirmDialog';
import { toast } from 'sonner';
import { BookPlus, Search, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { usePlaybook } from '@/lib/hooks/usePlaybook';
import { useTrades } from '@/lib/hooks/useTrades';
import { calcExecutionScoreBySetup, createBlankPlaybookEntry } from '@/lib/playbook/utils';
import { useDataPoints } from '@/lib/hooks/useDataPoints';
import { usePlaybookImages } from '@/lib/hooks/usePlaybookImages';
import { usePlaybookVersions } from '@/lib/hooks/usePlaybookVersions';
import { useIndicatorFiles } from '@/lib/hooks/useIndicatorFiles';
import { findReleasedIndicatorRefs } from '@/lib/playbook/indicators';
import { groupDataPointsByStrategy, summarizeDataPoints, tradeToDataPoint } from '@/lib/dataPoints/utils';
import PlaybookCard from './PlaybookCard';
import { UnassignedTriggers } from './TriggerPanels';
import { useAlertTriggers } from '@/lib/hooks/useAlertTriggers';
import { summarizeTriggers } from '@/lib/playbook/triggers';
import { getLocalDateKey } from '@/lib/reviews/utils';
import EntryEditorDialog from './EntryEditorDialog';
import VersionHistoryDialog from './VersionHistoryDialog';
import { toEntryPayload, toFormState, validateFormState } from './playbookFormHelpers';

export default function StrategyPlaybookBuilder() {
  const {
    playbookEntries,
    isSaving,
    createEntry,
    updateEntry,
    deleteEntry,
    duplicateEntry,
    toggleEntryActive,
    markEntryReviewed,
  } = usePlaybook();

  const [confirm, confirmDialog] = useConfirm();
  const { release: releaseIndicatorFiles } = useIndicatorFiles();
  const [dialogMode, setDialogMode] = useState('create');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingEntryId, setEditingEntryId] = useState('');
  const [formState, setFormState] = useState(toFormState(createBlankPlaybookEntry()));
  const [searchQuery, setSearchQuery] = useState('');
  const [historyEntry, setHistoryEntry] = useState(null);

  const { data: allTrades = [] } = useTrades();
  const { triggers, unassigned, assign: assignTrigger, remove: removeTrigger } = useAlertTriggers();
  const triggerSummary = useMemo(() => summarizeTriggers(triggers, getLocalDateKey()), [triggers]);
  const { resolveImages } = usePlaybookImages();
  const { currentVersions } = usePlaybookVersions();

  // How well this setup is being traded, from the out-of-10 rating Add Trade
  // gives each trade. Separate from expectancy on purpose: a setup can be
  // sound and still be executed badly.
  const executionScoreMap = useMemo(() => calcExecutionScoreBySetup(allTrades), [allTrades]);

  // Data Points judge how a setup is actually resolving — study samples plus
  // the trades already logged for it, scored against that setup's own exit
  // ladder. Read-only here; nothing flows back into trades or Performance.
  const { dataPoints } = useDataPoints();
  const dataPointSummaryMap = useMemo(() => {
    const manualByStrategy = groupDataPointsByStrategy(dataPoints);
    const tradesByStrategy = groupDataPointsByStrategy(allTrades.map((t) => tradeToDataPoint(t)));

    return new Map(
      playbookEntries.map((entry) => {
        const key = String(entry.name || '').trim().toLowerCase();
        const points = [
          ...(manualByStrategy.get(key) || []),
          ...(tradesByStrategy.get(key) || []),
        ];
        return [key, summarizeDataPoints(points, entry.expected_r_profile)];
      })
    );
  }, [dataPoints, allTrades, playbookEntries]);

  // Searches name, description, timeframe, entry/exit/SL criteria text (both
  // the newer { text, grade } shape and legacy plain strings), and setup
  // conditions — so a trader can find a setup by any rule they remember,
  // not just its name.
  const filteredEntries = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return playbookEntries;

    const itemsText = (items) => (Array.isArray(items) ? items : [])
      .map((item) => (typeof item === 'string' ? item : item?.text || ''))
      .join(' ');

    return playbookEntries.filter((entry) => {
      const haystack = [
        entry.name,
        entry.description,
        entry.direction,
        ...(Array.isArray(entry.timeframe) ? entry.timeframe : []),
        itemsText(entry.entry_criteria),
        itemsText(entry.exit_criteria),
        itemsText(entry.stop_loss_management),
        itemsText(entry.stop_loss_move),
        itemsText(entry.invalidations),
        Object.values(entry.setup_conditions || {}).join(' '),
      ].join(' ').toLowerCase();

      return haystack.includes(query);
    });
  }, [playbookEntries, searchQuery]);

  /**
   * Restoring saves the old rules as a new version rather than rewinding the
   * history — the same shape as a revert commit, so what happened stays
   * readable.
   */
  const handleRestoreVersion = async (snapshot) => {
    if (!historyEntry) return;
    await updateEntry(historyEntry.id, snapshot);
  };

  const openCreateDialog = () => {
    setDialogMode('create');
    setEditingEntryId('');
    setFormState(toFormState(createBlankPlaybookEntry()));
    setDialogOpen(true);
  };

  const openEditDialog = (entry) => {
    setDialogMode('edit');
    setEditingEntryId(entry.id);
    // The editor works on the charts themselves, wherever they are stored.
    setFormState(toFormState({ ...entry, images: resolveImages(entry) }));
    setDialogOpen(true);
  };

  const handleSubmitDialog = async () => {
    const validationError = validateFormState(formState);
    if (validationError) {
      toast.error(validationError);
      return;
    }

    setIsSubmitting(true);
    try {
      if (dialogMode === 'edit') {
        const sourceEntry = playbookEntries.find((entry) => entry.id === editingEntryId);
        const payload = toEntryPayload(formState, sourceEntry);
        await updateEntry(editingEntryId, payload);
        // Indicator files this setup dropped, unless another setup still uses them.
        releaseIndicatorFiles(findReleasedIndicatorRefs(
          sourceEntry?.indicators,
          [...playbookEntries.filter((entry) => entry.id !== editingEntryId), payload],
        ));
        toast.success('Playbook setup updated');
      } else {
        const payload = toEntryPayload(formState, null);
        await createEntry(payload);
        toast.success('Playbook setup created');
      }

      setDialogOpen(false);
    } catch (error) {
      toast.error(`Unable to save setup: ${error?.message || 'Unknown error'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDuplicate = async (entryId) => {
    try {
      await duplicateEntry(entryId);
      toast.success('Playbook setup duplicated');
    } catch (error) {
      toast.error(`Unable to duplicate setup: ${error?.message || 'Unknown error'}`);
    }
  };

  const handleToggleActive = async (entryId) => {
    try {
      const updated = await toggleEntryActive(entryId);
      toast.success(updated?.is_active ? 'Setup activated' : 'Setup archived');
    } catch (error) {
      toast.error(`Unable to update status: ${error?.message || 'Unknown error'}`);
    }
  };

  const handleMarkReviewed = async (entryId) => {
    try {
      await markEntryReviewed(entryId);
      toast.success('Setup marked as reviewed');
    } catch (error) {
      toast.error(`Unable to mark reviewed: ${error?.message || 'Unknown error'}`);
    }
  };

  const handleDelete = async (entryId) => {
    const shouldDelete = await confirm({
      title: 'Delete this playbook setup?',
      description: 'This cannot be undone.',
      confirmLabel: 'Delete',
      destructive: true,
    });
    if (!shouldDelete) return;

    try {
      const deleted = playbookEntries.find((entry) => entry.id === entryId);
      await deleteEntry(entryId);
      releaseIndicatorFiles(findReleasedIndicatorRefs(
        deleted?.indicators,
        playbookEntries.filter((entry) => entry.id !== entryId),
      ));
      toast.success('Setup deleted');
    } catch (error) {
      toast.error(`Unable to delete setup: ${error?.message || 'Unknown error'}`);
    }
  };

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-white/10 bg-gradient-to-r from-[#161a29]/95 via-[#13131e]/95 to-[#101624]/95 p-4 shadow-[0_20px_60px_-40px_rgba(6,182,212,0.45)]">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="relative w-full max-w-xs">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-white/35" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search setups by name, criteria, conditions…"
              className="h-9 border-white/12 bg-white/[0.03] pl-8 pr-8 text-xs"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/70"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button
              className="h-9 border border-emerald-200/40 bg-emerald-400/90 px-3 text-xs font-semibold text-black hover:bg-emerald-300"
              onClick={openCreateDialog}
              disabled={isSaving}
            >
              <BookPlus className="mr-1.5 h-4 w-4" />
              New Setup
            </Button>
          </div>
        </div>
      </div>

      <UnassignedTriggers
        triggers={unassigned}
        entries={playbookEntries}
        onAssign={assignTrigger}
        onRemove={removeTrigger}
      />

      {filteredEntries.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-white/20 bg-gradient-to-b from-white/[0.04] to-white/[0.01] p-12 text-center">
          <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-xl border border-white/15 bg-white/[0.04]">
            {searchQuery ? <Search className="h-5 w-5 text-white/70" /> : <BookPlus className="h-5 w-5 text-white/70" />}
          </div>
          {searchQuery ? (
            <>
              <p className="text-lg font-semibold text-white">No setups match "{searchQuery}"</p>
              <p className="mt-1 text-sm text-white/65">Try a different name, criteria, or condition.</p>
              <div className="mt-4">
                <Button variant="ghost" onClick={() => setSearchQuery('')}>Clear search</Button>
              </div>
            </>
          ) : (
            <>
              <p className="text-lg font-semibold text-white">No playbook setups found</p>
              <p className="mt-1 text-sm text-white/65">
                Create your first setup or seed from existing setup types.
              </p>
              <div className="mt-4">
                <Button onClick={openCreateDialog}>Create Setup</Button>
              </div>
            </>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 2xl:grid-cols-2">
          {filteredEntries.map((entry) => (
            <PlaybookCard
              key={entry.id}
              entry={entry}
              images={resolveImages(entry)}
              triggerSummary={triggerSummary.get(entry.id) || null}
              dataPointSummary={dataPointSummaryMap.get(String(entry.name || '').trim().toLowerCase()) ?? null}
              executionScore={executionScoreMap.get(String(entry.name || '').trim().toLowerCase()) ?? null}
              currentVersion={currentVersions.get(entry.id) || null}
              onEdit={openEditDialog}
              onHistory={setHistoryEntry}
              onDuplicate={handleDuplicate}
              onToggleActive={handleToggleActive}
              onMarkReviewed={handleMarkReviewed}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      <EntryEditorDialog
        open={dialogOpen}
        onOpenChange={(value) => {
          if (isSubmitting) return;
          setDialogOpen(value);
        }}
        formState={formState}
        setFormState={setFormState}
        onSubmit={handleSubmitDialog}
        isSubmitting={isSubmitting}
        dialogMode={dialogMode}
      />
      <VersionHistoryDialog
        open={Boolean(historyEntry)}
        onOpenChange={(next) => { if (!next) setHistoryEntry(null); }}
        entry={historyEntry}
        onRestore={handleRestoreVersion}
        isSaving={isSaving}
      />
      {confirmDialog}
    </div>
  );
}
