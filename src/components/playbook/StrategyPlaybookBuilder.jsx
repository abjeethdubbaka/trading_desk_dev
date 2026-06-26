import React, { useMemo, useState } from 'react';
import { useConfirm } from '@/components/ui/ConfirmDialog';
import { toast } from 'sonner';
import {
  BookPlus,
  CheckCircle2,
  Copy,
  ExternalLink,
  Eye,
  Image,
  Pencil,
  RefreshCw,
  Search,
  Shield,
  ShieldAlert,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import { imageFileToDataUrl } from '@/components/journal/shared/media/imageUtils';
import MultiImageLightbox from '@/components/ui/MultiImageLightbox';

function formatDate(value) {
  const timestamp = Date.parse(String(value || ''));
  if (!Number.isFinite(timestamp)) return 'n/a';
  return new Date(timestamp).toLocaleString();
}

function toExpectedRLabel(profile = {}) {
  const levels = [
    { r: profile?.min,     pct: profile?.min_percent     },
    { r: profile?.target,  pct: profile?.target_percent  },
    { r: profile?.stretch, pct: profile?.stretch_percent },
  ].filter(({ r }) => Number.isFinite(Number(r)) && Number(r) > 0);

  if (levels.length === 0) return 'n/a';

  return levels
    .map(({ r, pct }) => `${Number(r).toFixed(1)}R${Number.isFinite(Number(pct)) && Number(pct) > 0 ? ` (${Number(pct)}%)` : ''}`)
    .join(' → ');
}

function toFormState(entry) {
  const normalized = normalizePlaybookEntry(entry);

  return {
    id: normalized.id,
    name: normalized.name,
    description: normalized.description,
    timeframe: normalized.timeframe,
    market_context: normalized.market_context,
    stock_filter_criteria_text: toCriteriaTextareaValue(normalized.stock_filter_criteria),
    entry_criteria_text: toCriteriaTextareaValue(normalized.entry_criteria),
    exit_criteria_text: toCriteriaTextareaValue(normalized.exit_criteria),
    stop_loss_management_text: toCriteriaTextareaValue(normalized.stop_loss_management),
    invalidations_text: toCriteriaTextareaValue(normalized.invalidations),
    tags_text: toTagsInputValue(normalized.tags),
    expected_r_min: normalized.expected_r_profile?.min ?? '',
    expected_r_min_percent: normalized.expected_r_profile?.min_percent ?? '',
    expected_r_target: normalized.expected_r_profile?.target ?? '',
    expected_r_target_percent: normalized.expected_r_profile?.target_percent ?? '',
    expected_r_stretch: normalized.expected_r_profile?.stretch ?? '',
    expected_r_stretch_percent: normalized.expected_r_profile?.stretch_percent ?? '',
    examples: Array.isArray(normalized.examples) && normalized.examples.length > 0
      ? normalized.examples.map((example) => ({
          title: String(example.title || ''),
          url: String(example.url || ''),
          note: String(example.note || ''),
        }))
      : [{ title: '', url: '', note: '' }],
    images: Array.isArray(normalized.images) ? normalized.images : [],
    risk_level: normalized.risk_level || 'normal',
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
    stock_filter_criteria: normalizeTextareaLines(formState.stock_filter_criteria_text),
    entry_criteria: normalizeTextareaLines(formState.entry_criteria_text),
    exit_criteria: normalizeTextareaLines(formState.exit_criteria_text),
    stop_loss_management: normalizeTextareaLines(formState.stop_loss_management_text),
    invalidations: normalizeTextareaLines(formState.invalidations_text),
    tags: normalizeTagsText(formState.tags_text),
    expected_r_profile: {
      min: toNumberOrNull(formState.expected_r_min),
      min_percent: toNumberOrNull(formState.expected_r_min_percent),
      target: toNumberOrNull(formState.expected_r_target),
      target_percent: toNumberOrNull(formState.expected_r_target_percent),
      stretch: toNumberOrNull(formState.expected_r_stretch),
      stretch_percent: toNumberOrNull(formState.expected_r_stretch_percent),
    },
    examples: (Array.isArray(formState.examples) ? formState.examples : [])
      .map((example) => ({
        title: String(example?.title || '').trim(),
        url: String(example?.url || '').trim(),
        note: String(example?.note || '').trim(),
      })),
    images: Array.isArray(formState.images) ? formState.images : [],
    risk_level: formState.risk_level || 'normal',
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
    <div className="rounded-xl border border-white/12 bg-white/[0.03] px-3 py-2.5">
      <p className="text-[10px] uppercase tracking-[0.14em] text-white/45">{label}</p>
      <p className="mt-1 text-sm font-semibold text-white/95">{value}</p>
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
    <div className="mt-4 flex flex-wrap items-center gap-1.5 border-t border-white/10 pt-3.5">
      <Button
        size="sm"
        variant="ghost"
        className="h-8 border border-white/12 bg-white/[0.03] px-2.5 text-xs hover:bg-white/[0.08]"
        onClick={() => onEdit(entry)}
      >
        <Pencil className="mr-1.5 h-3.5 w-3.5" />
        Edit
      </Button>
      <Button
        size="sm"
        variant="ghost"
        className="h-8 border border-white/12 bg-white/[0.03] px-2.5 text-xs hover:bg-white/[0.08]"
        onClick={() => onDuplicate(entry.id)}
      >
        <Copy className="mr-1.5 h-3.5 w-3.5" />
        Duplicate
      </Button>
      <Button
        size="sm"
        variant="ghost"
        className="h-8 border border-white/12 bg-white/[0.03] px-2.5 text-xs hover:bg-white/[0.08]"
        onClick={() => onMarkReviewed(entry.id)}
      >
        <Eye className="mr-1.5 h-3.5 w-3.5" />
        Reviewed
      </Button>
      <Button
        size="sm"
        variant="ghost"
        className={cn(
          'h-8 px-2.5 text-xs',
          entry.is_active
            ? 'border border-amber-300/25 bg-amber-500/10 text-amber-100 hover:bg-amber-500/20'
            : 'border border-emerald-300/25 bg-emerald-500/10 text-emerald-100 hover:bg-emerald-500/20'
        )}
        onClick={() => onToggleActive(entry.id)}
      >
        {entry.is_active ? 'Archive' : 'Activate'}
      </Button>
      <Button
        size="sm"
        variant="ghost"
        className="h-8 border border-rose-300/20 bg-rose-500/10 px-2.5 text-xs text-rose-200 hover:bg-rose-500/20 hover:text-rose-100"
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
    <div className="rounded-xl border border-white/10 bg-black/25 px-3 py-2.5">
      <p className={cn('flex items-center gap-1.5 text-[10px] uppercase tracking-[0.13em]', toneClassName)}>
        <Icon className="h-3.5 w-3.5" />
        {label}
      </p>
      <div className="mt-1.5 space-y-1">
        {items.map((item) => (
          <p key={`${label}-${item}`} className="flex items-start gap-2 text-xs text-white/85">
            <span className="mt-1.5 h-1 w-1 rounded-full bg-white/45" />
            <span>{item}</span>
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
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const images = Array.isArray(entry.images) ? entry.images : [];

  return (
    <div
      className={cn(
        'group relative overflow-hidden rounded-2xl border p-4 transition-all duration-200 hover:-translate-y-0.5',
        entry.is_active
          ? 'border-emerald-300/25 bg-emerald-500/[0.06] hover:border-emerald-300/35'
          : 'border-white/12 bg-white/[0.03] hover:border-white/25'
      )}
    >
      <div
        className={cn(
          'pointer-events-none absolute inset-x-0 top-0 h-20 opacity-70',
          entry.is_active
            ? 'bg-gradient-to-b from-emerald-400/12 to-transparent'
            : 'bg-gradient-to-b from-cyan-300/8 to-transparent'
        )}
      />
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold text-white/95">{entry.name}</h3>
          <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
            <span className="rounded-full border border-white/15 bg-white/[0.04] px-2 py-0.5 text-[10px] uppercase tracking-[0.1em] text-white/70">
              {entry.timeframe || 'Timeframe n/a'}
            </span>
            <span className="rounded-full border border-white/15 bg-white/[0.04] px-2 py-0.5 text-[10px] uppercase tracking-[0.1em] text-white/70">
              {entry.market_context || 'Context n/a'}
            </span>
          </div>
        </div>
        <span
          className={cn(
            'rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em]',
            entry.is_active
              ? 'border-emerald-300/35 bg-emerald-500/15 text-emerald-100'
              : 'border-white/20 bg-white/10 text-white/70'
          )}
        >
          {entry.is_active ? 'Active' : 'Archived'}
        </span>
      </div>

      {entry.description ? (
        <p className="mt-2.5 text-sm text-white/80">{entry.description}</p>
      ) : null}

      <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
        <MetricsPill label="Expected R" value={toExpectedRLabel(entry.expected_r_profile)} />
        <div className={cn(
          'rounded-xl border px-3 py-2.5',
          entry.risk_level === 'half'   ? 'border-amber-500/25 bg-amber-500/8' :
          entry.risk_level === 'double' ? 'border-rose-500/25 bg-rose-500/8' :
                                          'border-emerald-500/20 bg-emerald-500/6',
        )}>
          <p className="text-[9px] uppercase tracking-widest text-white/40">Risk Level</p>
          <p className={cn(
            'mt-1 text-sm font-semibold',
            entry.risk_level === 'half'   ? 'text-amber-300' :
            entry.risk_level === 'double' ? 'text-rose-300' :
                                            'text-emerald-300',
          )}>
            {entry.risk_level === 'half' ? '½ Size' : entry.risk_level === 'double' ? '2× Size' : 'Normal'}
          </p>
        </div>
        <MetricsPill
          label="Last Reviewed"
          value={entry.last_reviewed_at ? formatDate(entry.last_reviewed_at) : 'Not reviewed'}
        />
      </div>

      <div className="mt-3 grid grid-cols-1 gap-2 lg:grid-cols-2">
        <CriteriaSection
          label="Stock Filter Criteria"
          items={entry.stock_filter_criteria}
          icon={Search}
          toneClassName="text-amber-200/90"
        />
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
          label="Stop Loss Management"
          items={entry.stop_loss_management}
          icon={Shield}
          toneClassName="text-violet-200/90"
        />
        <CriteriaSection
          label="Invalidations"
          items={entry.invalidations}
          icon={ShieldAlert}
          toneClassName="text-rose-200/90"
        />
      </div>

      {Array.isArray(entry.examples) && entry.examples.length > 0 ? (
        <div className="mt-3 rounded-xl border border-white/10 bg-black/25 p-2.5">
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

      {images.length > 0 && (
        <div className="mt-3">
          <p className="text-[10px] uppercase tracking-[0.14em] text-white/45 mb-1.5">
            <Image className="inline w-3 h-3 mr-1 opacity-60" />
            Charts
          </p>
          <div className="flex flex-wrap gap-1.5">
            {images.map((url, i) => (
              <img
                key={i}
                src={url}
                alt={`Chart ${i + 1}`}
                onClick={() => { setLightboxIndex(i); setLightboxOpen(true); }}
                className="w-16 h-16 object-cover rounded-lg cursor-pointer border border-white/10 hover:opacity-85 hover:scale-105 transition-all"
              />
            ))}
          </div>
          <MultiImageLightbox
            isOpen={lightboxOpen}
            images={images}
            startIndex={lightboxIndex}
            onClose={() => setLightboxOpen(false)}
          />
        </div>
      )}

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

  const MAX_IMAGES = 5;

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    e.target.value = '';
    const currentCount = Array.isArray(formState.images) ? formState.images.length : 0;
    const slots = MAX_IMAGES - currentCount;
    if (slots <= 0) { toast.error(`Max ${MAX_IMAGES} images per setup`); return; }
    try {
      const urls = await Promise.all(
        files.slice(0, slots).map((f) => imageFileToDataUrl(f, { maxWidth: 900, quality: 0.80 }))
      );
      setFormState((prev) => ({ ...prev, images: [...(prev.images || []), ...urls] }));
    } catch {
      toast.error('Failed to process image');
    }
  };

  const removeImage = (index) => {
    setFormState((prev) => ({ ...prev, images: (prev.images || []).filter((_, i) => i !== index) }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{dialogMode === 'edit' ? 'Edit Playbook Setup' : 'New Playbook Setup'}</DialogTitle>
          <DialogDescription className="text-white/55">
            Define stock filters, entry and exit criteria, invalidations, and expected R so this setup stays
            consistent in execution.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
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
            <div className="space-y-1.5">
              <Label>Risk Level</Label>
              <div className="grid grid-cols-3 gap-1 rounded-lg border border-white/12 bg-white/[0.03] p-1">
                {[
                  { value: 'half',   label: '½ Size',  color: 'border-amber-400/40 bg-amber-500/15 text-amber-200' },
                  { value: 'normal', label: 'Normal',  color: 'border-emerald-400/40 bg-emerald-500/15 text-emerald-200' },
                  { value: 'double', label: '2× Size', color: 'border-rose-400/40 bg-rose-500/15 text-rose-200' },
                ].map(({ value, label, color }) => {
                  const isActive = (formState.risk_level || 'normal') === value;
                  return (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setFormState((prev) => ({ ...prev, risk_level: value }))}
                      className={cn(
                        'rounded px-2 py-1.5 text-[11px] font-semibold transition-colors',
                        isActive ? `border ${color}` : 'text-white/40 hover:text-white/70',
                      )}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
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

          <div className="space-y-1.5">
            <Label>Stock Filter Criteria</Label>
            <textarea
              value={formState.stock_filter_criteria_text}
              onChange={(event) => setFormState((prev) => ({ ...prev, stock_filter_criteria_text: event.target.value }))}
              placeholder="One line per stock filter (price, volume, float, catalyst, spread, etc.)"
              className="min-h-[90px] w-full rounded-xl border border-white/12 bg-white/[0.03] px-3 py-2 text-sm text-white outline-none placeholder:text-white/35 focus:border-amber-300/40"
            />
          </div>

          <div className="rounded-xl border border-white/10 bg-black/20 p-3 space-y-2.5">
            <p className="text-[10px] uppercase tracking-[0.14em] text-white/45">Expected R &amp; Exit Allocation</p>
            {[
              { rKey: 'expected_r_min',    pKey: 'expected_r_min_percent',    label: 'Min R',     required: false, color: 'text-white/60' },
              { rKey: 'expected_r_target', pKey: 'expected_r_target_percent', label: 'Target R',  required: true,  color: 'text-cyan-300/80' },
              { rKey: 'expected_r_stretch',pKey: 'expected_r_stretch_percent',label: 'Stretch R', required: false, color: 'text-emerald-300/80' },
            ].map(({ rKey, pKey, label, required, color }) => (
              <div key={rKey} className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
                <div className="space-y-1">
                  <p className={`text-[9px] uppercase tracking-widest ${color}`}>{label}{required ? ' *' : ''}</p>
                  <Input
                    type="number"
                    step="0.1"
                    value={formState[rKey]}
                    onChange={(event) => setFormState((prev) => ({ ...prev, [rKey]: event.target.value }))}
                    placeholder="2"
                    className="bg-white/[0.03] border-white/12 h-8 text-sm"
                  />
                </div>
                <span className="text-white/20 text-sm mt-4">→</span>
                <div className="space-y-1">
                  <p className="text-[9px] uppercase tracking-widest text-white/35">Exit %</p>
                  <Input
                    type="number"
                    step="5"
                    min="1"
                    max="100"
                    value={formState[pKey]}
                    onChange={(event) => setFormState((prev) => ({ ...prev, [pKey]: event.target.value }))}
                    placeholder="50"
                    className="bg-white/[0.03] border-white/12 h-8 text-sm"
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
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
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Stop Loss Management</Label>
              <textarea
                value={formState.stop_loss_management_text}
                onChange={(event) => setFormState((prev) => ({ ...prev, stop_loss_management_text: event.target.value }))}
                placeholder={`One line per rule, e.g.\nInitial stop: below key level / candle low\nMove to breakeven after +1R\nTrail stop with 5-min highs after +2R\nMax time in trade: 30 min`}
                className="min-h-[120px] w-full rounded-xl border border-white/12 bg-white/[0.03] px-3 py-2 text-sm text-white outline-none placeholder:text-white/35 focus:border-violet-300/40"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Invalidations *</Label>
              <textarea
                value={formState.invalidations_text}
                onChange={(event) => setFormState((prev) => ({ ...prev, invalidations_text: event.target.value }))}
                placeholder="One line per invalidation"
                className="min-h-[120px] w-full rounded-xl border border-white/12 bg-white/[0.03] px-3 py-2 text-sm text-white outline-none placeholder:text-white/35 focus:border-rose-300/40"
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

          <div className="space-y-2 rounded-xl border border-white/10 bg-black/20 p-3">
            <div className="flex items-center justify-between gap-2">
              <Label className="flex items-center gap-1.5"><Image className="w-3.5 h-3.5 opacity-60" />Chart Images</Label>
              <span className="text-[10px] text-white/35">{(formState.images || []).length}/{MAX_IMAGES}</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {(formState.images || []).map((url, i) => (
                <div key={i} className="relative group w-20 h-20 flex-shrink-0">
                  <img src={url} alt={`Chart ${i + 1}`} className="w-20 h-20 object-cover rounded-lg border border-white/10" />
                  <button
                    type="button"
                    onClick={() => removeImage(i)}
                    className="absolute top-0.5 right-0.5 p-0.5 rounded-full bg-black/75 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-rose-500/80"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
              {(formState.images || []).length < MAX_IMAGES && (
                <label className="w-20 h-20 border-2 border-dashed border-white/20 hover:border-white/40 rounded-lg flex flex-col items-center justify-center cursor-pointer transition-colors flex-shrink-0">
                  <Upload className="w-5 h-5 text-white/40 mb-0.5" />
                  <span className="text-[10px] text-white/40">Add</span>
                  <input type="file" accept="image/*" multiple className="hidden" onChange={handleImageUpload} />
                </label>
              )}
            </div>
            <p className="text-[10px] text-white/30">Upload chart examples (max {MAX_IMAGES}). Images are compressed and stored with the setup.</p>
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
