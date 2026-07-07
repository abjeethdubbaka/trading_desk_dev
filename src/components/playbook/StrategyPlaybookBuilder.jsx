import React, { useMemo, useState } from 'react';
import { useConfirm } from '@/components/ui/ConfirmDialog';
import { toast } from 'sonner';
import { BookPlus, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePlaybook } from '@/lib/hooks/usePlaybook';
import { createBlankPlaybookEntry } from '@/lib/playbook/utils';
import PlaybookCard from './PlaybookCard';
import EntryEditorDialog from './EntryEditorDialog';
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
    seedFromSetupTypes,
  } = usePlaybook();

  const [confirm, confirmDialog] = useConfirm();
  const [dialogMode, setDialogMode] = useState('create');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingEntryId, setEditingEntryId] = useState('');
  const [formState, setFormState] = useState(toFormState(createBlankPlaybookEntry()));

  const filteredEntries = useMemo(() => playbookEntries, [playbookEntries]);

  const openCreateDialog = () => {
    setDialogMode('create');
    setEditingEntryId('');
    setFormState(toFormState(createBlankPlaybookEntry()));
    setDialogOpen(true);
  };

  const openEditDialog = (entry) => {
    setDialogMode('edit');
    setEditingEntryId(entry.id);
    setFormState(toFormState(entry));
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
      await deleteEntry(entryId);
      toast.success('Setup deleted');
    } catch (error) {
      toast.error(`Unable to delete setup: ${error?.message || 'Unknown error'}`);
    }
  };

  const handleSeed = async () => {
    try {
      const seededCount = await seedFromSetupTypes();
      if (seededCount > 0) {
        toast.success(`Seeded ${seededCount} setup(s) into playbook`);
      } else {
        toast.info('All current setup types are already in the playbook');
      }
    } catch (error) {
      toast.error(`Unable to seed setups: ${error?.message || 'Unknown error'}`);
    }
  };

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-white/10 bg-gradient-to-r from-[#161a29]/95 via-[#13131e]/95 to-[#101624]/95 p-4 shadow-[0_20px_60px_-40px_rgba(6,182,212,0.45)]">
        <div className="flex flex-wrap items-center justify-end gap-2">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              className="h-9 border border-white/15 bg-white/[0.03] px-3 text-xs hover:bg-white/[0.08]"
              onClick={handleSeed}
              disabled={isSaving}
            >
              <RefreshCw className="mr-1.5 h-4 w-4" />
              Seed From Existing Setups
            </Button>
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

      {filteredEntries.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-white/20 bg-gradient-to-b from-white/[0.04] to-white/[0.01] p-12 text-center">
          <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-xl border border-white/15 bg-white/[0.04]">
            <BookPlus className="h-5 w-5 text-white/70" />
          </div>
          <p className="text-lg font-semibold text-white">No playbook setups found</p>
          <p className="mt-1 text-sm text-white/65">
            Create your first setup or seed from existing setup types.
          </p>
          <div className="mt-4">
            <Button onClick={openCreateDialog}>Create Setup</Button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 2xl:grid-cols-2">
          {filteredEntries.map((entry) => (
            <PlaybookCard
              key={entry.id}
              entry={entry}
              onEdit={openEditDialog}
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
      {confirmDialog}
    </div>
  );
}
