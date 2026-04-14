import React, { useMemo, useState } from 'react';
import { toast } from 'sonner';
import {
  BookPlus,
  CheckCircle2,
  Copy,
  ExternalLink,
  Eye,
  Pencil,
  RefreshCw,
  Search,
  ShieldAlert,
  Trash2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { usePlaybook } from '@/lib/hooks/usePlaybook';
import {
  createBlankPlaybookEntry,
  normalizePlaybookEntry,
  toCriteriaTextareaValue,
  toTagsInputValue,
} from '@/lib/playbook/utils';
import { cn } from '@/lib/utils/general';

const STATUS_FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'active', label: 'Active' },
  { key: 'archived', label: 'Archived' },
];

function formatDate(value) {
  const timestamp = Date.parse(String(value || ''));
  if (!Number.isFinite(timestamp)) return 'n/a';
  return new Date(timestamp).toLocaleString();
}

function toExpectedRLabel(profile = {}) {
  const min = Number(profile?.min);
  const target = Number(profile?.target);
  const stretch = Number(profile?.stretch);

  const hasMin = Number.isFinite(min);
  const hasTarget = Number.isFinite(target);
  const hasStretch = Number.isFinite(stretch);

  if (!hasMin && !hasTarget && !hasStretch) return 'n/a';

  return `${hasMin ? min.toFixed(1) : '-'}R -> ${hasTarget ? target.toFixed(1) : '-'}R -> ${hasStretch ? stretch.toFixed(1) : '-'}R`;
}

function toFormState(entry) {
  const normalized = normalizePlaybookEntry(entry);

  return {
    id: normalized.id,
    name: normalized.name,
    description: normalized.description,
    timeframe: normalized.timeframe,
    market_context: normalized.market_context,
    entry_criteria_text: toCriteriaTextareaValue(normalized.entry_criteria),
    exit_criteria_text: toCriteriaTextareaValue(normalized.exit_criteria),
    invalidations_text: toCriteriaTextareaValue(normalized.invalidations),
    tags_text: toTagsInputValue(normalized.tags),
    expected_r_min: normalized.expected_r_profile?.min ?? '',
    expected_r_target: normalized.expected_r_profile?.target ?? '',
    expected_r_stretch: normalized.expected_r_profile?.stretch ?? '',
    examples: Array.isArray(normalized.examples) && normalized.examples.length > 0
      ? normalized.examples.map((example) => ({
          title: String(example.title || ''),
          url: String(example.url || ''),
          note: String(example.note || ''),
        }))
      : [{ title: '', url: '', note: '' }],
    is_active: normalized.is_active !== false,
  };
}

function toNumberOrNull(value) {
  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? numericValue : null;
}

function normalizeTextareaLines(text) {
  return String(text || '')
    .split('\n')
    .map((item) => item.trim())
    .filter(Boolean);
}

function normalizeTagsText(text) {
  return String(text || '')
    .split(',')
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);
}

function toEntryPayload(formState, sourceEntry = null) {
  const now = new Date().toISOString();
  const baseEntry = sourceEntry ? normalizePlaybookEntry(sourceEntry) : createBlankPlaybookEntry();

  return normalizePlaybookEntry({
    ...baseEntry,
    id: baseEntry.id,
    name: String(formState.name || '').trim(),
    description: String(formState.description || '').trim(),
    timeframe: String(formState.timeframe || '').trim(),
    market_context: String(formState.market_context || '').trim(),
    entry_criteria: normalizeTextareaLines(formState.entry_criteria_text),
    exit_criteria: normalizeTextareaLines(formState.exit_criteria_text),
    invalidations: normalizeTextareaLines(formState.invalidations_text),
    tags: normalizeTagsText(formState.tags_text),
    expected_r_profile: {
      min: toNumberOrNull(formState.expected_r_min),
      target: toNumberOrNull(formState.expected_r_target),
      stretch: toNumberOrNull(formState.expected_r_stretch),
    },
    examples: (Array.isArray(formState.examples) ? formState.examples : [])
      .map((example) => ({
        title: String(example?.title || '').trim(),
        url: String(example?.url || '').trim(),
        note: String(example?.note || '').trim(),
      })),
    is_active: formState.is_active !== false,
    updated_at: now,
    created_at: baseEntry.created_at || now,
  });
}

function validateFormState(formState) {
  if (!String(formState.name || '').trim()) {
    return 'Setup name is required';
  }

  if (normalizeTextareaLines(formState.entry_criteria_text).length === 0) {
    return 'At least one entry criterion is required';
  }

  if (normalizeTextareaLines(formState.exit_criteria_text).length === 0) {
    return 'At least one exit criterion is required';
  }

  if (normalizeTextareaLines(formState.invalidations_text).length === 0) {
    return 'At least one invalidation is required';
  }

  const targetValue = toNumberOrNull(formState.expected_r_target);
  if (targetValue === null || targetValue <= 0) {
    return 'Expected R target must be a positive number';
  }

  return null;
}

function MetricsPill({ label, value }) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2">
      <p className="text-[10px] uppercase tracking-[0.14em] text-white/45">{label}</p>
      <p className="mt-1 text-sm font-semibold text-white">{value}</p>
    </div>
  );
}

function PlaybookCardActions({
  entry,
  onEdit,
  onDuplicate,
  onToggleActive,
  onMarkReviewed,
  onDelete,
}) {
  return (
    <div className="mt-3 flex flex-wrap items-center gap-1.5 border-t border-white/10 pt-3">
      <Button size="sm" variant="ghost" className="h-8 px-2.5 text-xs" onClick={() => onEdit(entry)}>
        <Pencil className="mr-1.5 h-3.5 w-3.5" />
        Edit
      </Button>
      <Button size="sm" variant="ghost" className="h-8 px-2.5 text-xs" onClick={() => onDuplicate(entry.id)}>
        <Copy className="mr-1.5 h-3.5 w-3.5" />
        Duplicate
      </Button>
      <Button size="sm" variant="ghost" className="h-8 px-2.5 text-xs" onClick={() => onMarkReviewed(entry.id)}>
        <Eye className="mr-1.5 h-3.5 w-3.5" />
        Reviewed
      </Button>
      <Button
        size="sm"
        variant="ghost"
        className="h-8 px-2.5 text-xs"
        onClick={() => onToggleActive(entry.id)}
      >
        {entry.is_active ? 'Archive' : 'Activate'}
      </Button>
      <Button
        size="sm"
        variant="ghost"
        className="h-8 px-2.5 text-xs text-rose-200 hover:bg-rose-500/10 hover:text-rose-100"
        onClick={() => onDelete(entry.id)}
      >
        <Trash2 className="mr-1.5 h-3.5 w-3.5" />
        Delete
      </Button>
    </div>
  );
}

function CriteriaSection({ label, items = [], icon: Icon, toneClassName }) {
  if (!Array.isArray(items) || items.length === 0) return null;

  return (
    <div className="space-y-1">
      <p className={cn('flex items-center gap-1.5 text-[10px] uppercase tracking-[0.13em]', toneClassName)}>
        <Icon className="h-3.5 w-3.5" />
        {label}
      </p>
      <div className="space-y-1">
        {items.map((item) => (
          <p key={`${label}-${item}`} className="text-xs text-white/85">
            - {item}
          </p>
        ))}
      </div>
    </div>
  );
}

function PlaybookCard({
  entry,
  onEdit,
  onDuplicate,
  onToggleActive,
  onMarkReviewed,
  onDelete,
}) {
  return (
    <div
      className={cn(
        'rounded-2xl border p-4',
        entry.is_active
          ? 'border-emerald-300/25 bg-emerald-500/[0.06]'
          : 'border-white/12 bg-white/[0.03]'
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold text-white">{entry.name}</h3>
          <p className="mt-1 text-xs text-white/60">
            {entry.timeframe || 'Timeframe n/a'} | {entry.market_context || 'Context n/a'}
          </p>
        </div>
        <span
          className={cn(
            'rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em]',
            entry.is_active
              ? 'border-emerald-300/35 bg-emerald-500/15 text-emerald-100'
              : 'border-white/20 bg-white/10 text-white/70'
          )}
        >
          {entry.is_active ? 'Active' : 'Archived'}
        </span>
      </div>

      {entry.description ? (
        <p className="mt-2 text-sm text-white/80">{entry.description}</p>
      ) : null}

      <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-3">
        <MetricsPill label="Expected R" value={toExpectedRLabel(entry.expected_r_profile)} />
        <MetricsPill label="Examples" value={String(entry.examples?.length || 0)} />
        <MetricsPill
          label="Last Reviewed"
          value={entry.last_reviewed_at ? formatDate(entry.last_reviewed_at) : 'Not reviewed'}
        />
      </div>

      <div className="mt-3 space-y-2">
        <CriteriaSection
          label="Entry Criteria"
          items={entry.entry_criteria}
          icon={BookPlus}
          toneClassName="text-emerald-200/90"
        />
        <CriteriaSection
          label="Exit Criteria"
          items={entry.exit_criteria}
          icon={CheckCircle2}
          toneClassName="text-cyan-200/90"
        />
        <CriteriaSection
          label="Invalidations"
          items={entry.invalidations}
          icon={ShieldAlert}
          toneClassName="text-rose-200/90"
        />
      </div>

      {Array.isArray(entry.examples) && entry.examples.length > 0 ? (
        <div className="mt-3 rounded-lg border border-white/10 bg-black/25 p-2.5">
          <p className="text-[10px] uppercase tracking-[0.14em] text-white/45">Examples</p>
          <div className="mt-1.5 space-y-1.5">
            {entry.examples.map((example, index) => (
              <div key={`${entry.id}-example-${index}`} className="text-xs text-white/80">
                <p className="font-semibold text-white/90">{example.title || `Example ${index + 1}`}</p>
                {example.note ? <p className="text-white/70">{example.note}</p> : null}
                {example.url ? (
                  <a
                    href={example.url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-cyan-300 hover:text-cyan-200"
                  >
                    Open link
                    <ExternalLink className="h-3 w-3" />
                  </a>
                ) : null}
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {Array.isArray(entry.tags) && entry.tags.length > 0 ? (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {entry.tags.map((tag) => (
            <span
              key={`${entry.id}-tag-${tag}`}
              className="rounded-full border border-white/15 bg-white/[0.04] px-2 py-0.5 text-[10px] uppercase tracking-[0.1em] text-white/65"
            >
              {tag}
            </span>
          ))}
        </div>
      ) : null}

      <PlaybookCardActions
        entry={entry}
        onEdit={onEdit}
        onDuplicate={onDuplicate}
        onToggleActive={onToggleActive}
        onMarkReviewed={onMarkReviewed}
        onDelete={onDelete}
      />
    </div>
  );
}

function EntryEditorDialog({
  open,
  onOpenChange,
  formState,
  setFormState,
  onSubmit,
  isSubmitting,
  dialogMode,
}) {
  if (!formState) return null;

  const updateExample = (index, field, value) => {
    setFormState((prev) => {
      const nextExamples = Array.isArray(prev.examples) ? [...prev.examples] : [];
      nextExamples[index] = {
        ...(nextExamples[index] || { title: '', url: '', note: '' }),
        [field]: value,
      };
      return { ...prev, examples: nextExamples };
    });
  };

  const removeExample = (index) => {
    setFormState((prev) => {
      const nextExamples = (Array.isArray(prev.examples) ? prev.examples : [])
        .filter((_, currentIndex) => currentIndex !== index);
      return {
        ...prev,
        examples: nextExamples.length > 0 ? nextExamples : [{ title: '', url: '', note: '' }],
      };
    });
  };

  const addExample = () => {
    setFormState((prev) => ({
      ...prev,
      examples: [...(Array.isArray(prev.examples) ? prev.examples : []), { title: '', url: '', note: '' }],
    }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{dialogMode === 'edit' ? 'Edit Playbook Setup' : 'New Playbook Setup'}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Setup Name *</Label>
              <Input
                value={formState.name}
                onChange={(event) => setFormState((prev) => ({ ...prev, name: event.target.value }))}
                placeholder="VWAP Pullback"
                className="bg-white/[0.03] border-white/12"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Timeframe</Label>
              <Input
                value={formState.timeframe}
                onChange={(event) => setFormState((prev) => ({ ...prev, timeframe: event.target.value }))}
                placeholder="1m / 5m / 15m"
                className="bg-white/[0.03] border-white/12"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Market Context</Label>
            <Input
              value={formState.market_context}
              onChange={(event) => setFormState((prev) => ({ ...prev, market_context: event.target.value }))}
              placeholder="Trend day, mean reversion session, high relative volume..."
              className="bg-white/[0.03] border-white/12"
            />
          </div>

          <div className="space-y-1.5">
            <Label>Description</Label>
            <textarea
              value={formState.description}
              onChange={(event) => setFormState((prev) => ({ ...prev, description: event.target.value }))}
              placeholder="What this setup is, where it performs best, and when to skip it."
              className="min-h-[80px] w-full rounded-xl border border-white/12 bg-white/[0.03] px-3 py-2 text-sm text-white outline-none placeholder:text-white/35 focus:border-emerald-300/40"
            />
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <div className="space-y-1.5">
              <Label>Expected R Min</Label>
              <Input
                type="number"
                step="0.1"
                value={formState.expected_r_min}
                onChange={(event) => setFormState((prev) => ({ ...prev, expected_r_min: event.target.value }))}
                className="bg-white/[0.03] border-white/12"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Expected R Target *</Label>
              <Input
                type="number"
                step="0.1"
                value={formState.expected_r_target}
                onChange={(event) => setFormState((prev) => ({ ...prev, expected_r_target: event.target.value }))}
                className="bg-white/[0.03] border-white/12"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Expected R Stretch</Label>
              <Input
                type="number"
                step="0.1"
                value={formState.expected_r_stretch}
                onChange={(event) => setFormState((prev) => ({ ...prev, expected_r_stretch: event.target.value }))}
                className="bg-white/[0.03] border-white/12"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <div className="space-y-1.5">
              <Label>Entry Criteria *</Label>
              <textarea
                value={formState.entry_criteria_text}
                onChange={(event) => setFormState((prev) => ({ ...prev, entry_criteria_text: event.target.value }))}
                placeholder="One line per criterion"
                className="min-h-[120px] w-full rounded-xl border border-white/12 bg-white/[0.03] px-3 py-2 text-sm text-white outline-none placeholder:text-white/35 focus:border-emerald-300/40"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Exit Criteria *</Label>
              <textarea
                value={formState.exit_criteria_text}
                onChange={(event) => setFormState((prev) => ({ ...prev, exit_criteria_text: event.target.value }))}
                placeholder="One line per criterion"
                className="min-h-[120px] w-full rounded-xl border border-white/12 bg-white/[0.03] px-3 py-2 text-sm text-white outline-none placeholder:text-white/35 focus:border-emerald-300/40"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Invalidations *</Label>
              <textarea
                value={formState.invalidations_text}
                onChange={(event) => setFormState((prev) => ({ ...prev, invalidations_text: event.target.value }))}
                placeholder="One line per invalidation"
                className="min-h-[120px] w-full rounded-xl border border-white/12 bg-white/[0.03] px-3 py-2 text-sm text-white outline-none placeholder:text-white/35 focus:border-emerald-300/40"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Tags</Label>
            <Input
              value={formState.tags_text}
              onChange={(event) => setFormState((prev) => ({ ...prev, tags_text: event.target.value }))}
              placeholder="breakout, momentum, a-plus"
              className="bg-white/[0.03] border-white/12"
            />
          </div>

          <div className="space-y-2.5 rounded-xl border border-white/10 bg-black/20 p-3">
            <div className="flex items-center justify-between gap-2">
              <Label>Examples</Label>
              <Button type="button" size="sm" variant="ghost" className="h-7 text-xs" onClick={addExample}>
                Add Example
              </Button>
            </div>
            {(Array.isArray(formState.examples) ? formState.examples : []).map((example, index) => (
              <div key={`editor-example-${index}`} className="grid grid-cols-1 gap-2 rounded-lg border border-white/10 bg-white/[0.03] p-2 md:grid-cols-[1fr_1fr_1.2fr_auto]">
                <Input
                  value={example.title}
                  onChange={(event) => updateExample(index, 'title', event.target.value)}
                  placeholder="Title"
                  className="bg-white/[0.03] border-white/12"
                />
                <Input
                  value={example.url}
                  onChange={(event) => updateExample(index, 'url', event.target.value)}
                  placeholder="https://..."
                  className="bg-white/[0.03] border-white/12"
                />
                <Input
                  value={example.note}
                  onChange={(event) => updateExample(index, 'note', event.target.value)}
                  placeholder="What this example teaches"
                  className="bg-white/[0.03] border-white/12"
                />
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  className="h-9 text-rose-200 hover:bg-rose-500/10 hover:text-rose-100"
                  onClick={() => removeExample(index)}
                >
                  Remove
                </Button>
              </div>
            ))}
          </div>

          <label className="flex items-center gap-2 rounded-lg border border-white/12 bg-white/[0.03] px-3 py-2 text-sm">
            <input
              type="checkbox"
              checked={formState.is_active}
              onChange={(event) => setFormState((prev) => ({ ...prev, is_active: event.target.checked }))}
              className="h-4 w-4 rounded border-white/20"
            />
            Active setup (available in Journal setup dropdown)
          </label>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="ghost"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button type="button" onClick={onSubmit} disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : dialogMode === 'edit' ? 'Save Changes' : 'Create Setup'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

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

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dialogMode, setDialogMode] = useState('create');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingEntryId, setEditingEntryId] = useState('');
  const [formState, setFormState] = useState(toFormState(createBlankPlaybookEntry()));

  const filteredEntries = useMemo(() => {
    const normalizedSearch = String(searchTerm || '').trim().toLowerCase();

    return playbookEntries.filter((entry) => {
      if (statusFilter === 'active' && !entry.is_active) return false;
      if (statusFilter === 'archived' && entry.is_active) return false;

      if (!normalizedSearch) return true;

      const haystack = [
        entry.name,
        entry.description,
        entry.timeframe,
        entry.market_context,
        ...(Array.isArray(entry.tags) ? entry.tags : []),
      ].join(' ').toLowerCase();

      return haystack.includes(normalizedSearch);
    });
  }, [playbookEntries, searchTerm, statusFilter]);

  const summary = useMemo(() => {
    const total = playbookEntries.length;
    const active = playbookEntries.filter((entry) => entry.is_active).length;
    const withExamples = playbookEntries.filter((entry) => (entry.examples?.length || 0) > 0).length;

    const targets = playbookEntries
      .map((entry) => Number(entry.expected_r_profile?.target))
      .filter((value) => Number.isFinite(value) && value > 0);
    const averageTarget = targets.length > 0
      ? (targets.reduce((sum, value) => sum + value, 0) / targets.length).toFixed(2)
      : 'n/a';

    return {
      total,
      active,
      withExamples,
      averageTarget,
    };
  }, [playbookEntries]);

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
    const shouldDelete = window.confirm('Delete this playbook setup? This action cannot be undone.');
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
      <div className="rounded-2xl border border-white/10 bg-[#13131e]/90 p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.15em] text-white/45">Strategy Playbook Builder</p>
            <h1 className="mt-1 text-2xl font-semibold text-white">Build and maintain your setup playbooks</h1>
            <p className="mt-2 max-w-3xl text-sm text-white/70">
              Save setup-level entry/exit criteria, invalidations, examples, and expected R profile.
              Active playbook setups are automatically available in Journal trade entry.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" onClick={handleSeed} disabled={isSaving}>
              <RefreshCw className="mr-1.5 h-4 w-4" />
              Seed From Existing Setups
            </Button>
            <Button onClick={openCreateDialog} disabled={isSaving}>
              <BookPlus className="mr-1.5 h-4 w-4" />
              New Setup
            </Button>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-4">
          <MetricsPill label="Total Setups" value={String(summary.total)} />
          <MetricsPill label="Active Setups" value={String(summary.active)} />
          <MetricsPill label="With Examples" value={String(summary.withExamples)} />
          <MetricsPill label="Avg Target R" value={`${summary.averageTarget}${summary.averageTarget === 'n/a' ? '' : 'R'}`} />
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-[#111827]/60 p-4">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative min-w-[280px] flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
            <Input
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search setups by name, context, or tags..."
              className="border-white/12 bg-white/[0.03] pl-9"
            />
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            {STATUS_FILTERS.map((filter) => (
              <button
                key={filter.key}
                type="button"
                onClick={() => setStatusFilter(filter.key)}
                className={cn(
                  'rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] transition-colors',
                  statusFilter === filter.key
                    ? 'border-emerald-300/40 bg-emerald-500/15 text-emerald-100'
                    : 'border-white/15 bg-white/[0.03] text-white/65 hover:text-white/90'
                )}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {filteredEntries.length === 0 ? (
        <div className="rounded-2xl border border-white/10 bg-black/20 p-10 text-center">
          <p className="text-lg font-semibold text-white">No playbook setups found</p>
          <p className="mt-1 text-sm text-white/65">
            Create your first setup or seed from existing setup types.
          </p>
          <div className="mt-4">
            <Button onClick={openCreateDialog}>Create Setup</Button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
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
    </div>
  );
}
