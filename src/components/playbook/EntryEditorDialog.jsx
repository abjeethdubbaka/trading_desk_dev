import React from 'react';
import { toast } from 'sonner';
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
import { cn } from '@/lib/utils/general';
import { imageFileToDataUrl } from '@/components/journal/shared/media/imageUtils';
import EntryImagesField, { MAX_ENTRY_IMAGES } from './EntryImagesField';
import EntryExamplesField from './EntryExamplesField';

export default function EntryEditorDialog({
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

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    e.target.value = '';
    const currentCount = Array.isArray(formState.images) ? formState.images.length : 0;
    const slots = MAX_ENTRY_IMAGES - currentCount;
    if (slots <= 0) { toast.error(`Max ${MAX_ENTRY_IMAGES} images per setup`); return; }
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

          <EntryImagesField
            images={formState.images || []}
            onUpload={handleImageUpload}
            onRemove={removeImage}
          />

          <EntryExamplesField
            examples={Array.isArray(formState.examples) ? formState.examples : []}
            onAdd={addExample}
            onUpdate={updateExample}
            onRemove={removeExample}
          />

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
