import React, { useState } from 'react';
import { toast } from 'sonner';
import { Plus, X } from 'lucide-react';
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
import { useSettings } from '@/lib/hooks/useSettings';
import { imageFileToDataUrl } from '@/components/journal/shared/media/imageUtils';
import EntryImagesField, { MAX_ENTRY_IMAGES } from './EntryImagesField';
import EntryExamplesField from './EntryExamplesField';

const TIMEFRAMES = ['2min', '5min', '15min', '30min'];

const DEFAULT_ENTRY_PRESETS = [
  'Price breaks and holds above key level',
  'VWAP reclaim confirmed on candle close',
  'First pullback to key level after momentum',
  'Setup candle formed on target timeframe',
  'Volume confirmation above average',
];

const DEFAULT_STOP_LOSS_PRESETS = [
  'Initial stop: below entry candle low',
  'Move to breakeven after +1R',
  'Trail stop with prior candle highs after +2R',
  'Time stop: exit if no momentum in 15 min',
  'Max daily loss reached: full exit',
];

const DEFAULT_EXIT_PRESETS = [
  'Scale 50% at +1R, trail rest',
  'Full exit at target R',
  'Scale: 33% at +1R, 33% at +2R, trail rest',
  'Exit at VWAP / key level',
  'Exit on close below key level',
];

const DEFAULT_STOP_LOSS_MOVE_PRESETS = [
  'Move to breakeven at +1R',
  'Move stop to +0.5R after first scale',
  'Trail with 5-min candle highs after +2R',
  'Trail with VWAP after full position profitable',
  'Lock in +1R when trade reaches +2R',
];

function PresetPicker({ label, required, presets, value, onChange, focusBorderClass, customPlaceholder }) {
  const [customInput, setCustomInput] = useState('');

  const addItem = (item) => {
    const trimmed = item.trim();
    if (!trimmed || value.includes(trimmed)) return;
    onChange([...value, trimmed]);
  };

  const removeItem = (index) => onChange(value.filter((_, i) => i !== index));
  const availablePresets = presets.filter((p) => !value.includes(p));

  return (
    <div className="space-y-2">
      <Label>{label}{required ? ' *' : ''}</Label>

      {availablePresets.length > 0 && (
        <select
          className="w-full rounded-xl border border-white/12 bg-[#0e0e18] px-3 py-2 text-sm text-white/55 outline-none focus:border-white/25 cursor-pointer"
          onChange={(e) => { if (e.target.value) { addItem(e.target.value); e.target.value = ''; } }}
          defaultValue=""
        >
          <option value="" disabled>Pick a preset to add…</option>
          {availablePresets.map((p) => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>
      )}

      {value.length > 0 && (
        <div className="rounded-xl border border-white/10 bg-white/[0.02] p-2 space-y-1">
          {value.map((item, i) => (
            <div key={i} className="flex items-start justify-between gap-2">
              <span className="flex-1 text-xs text-white/80 pt-0.5">- {item}</span>
              <button
                type="button"
                onClick={() => removeItem(i)}
                className="flex-shrink-0 p-0.5 rounded text-white/25 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="flex gap-2">
        <input
          value={customInput}
          onChange={(e) => setCustomInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              addItem(customInput);
              setCustomInput('');
            }
          }}
          placeholder={customPlaceholder}
          className={cn(
            'flex-1 rounded-xl border border-white/12 bg-white/[0.03] px-3 py-1.5 text-sm text-white outline-none placeholder:text-white/35',
            focusBorderClass,
          )}
        />
        <button
          type="button"
          onClick={() => { addItem(customInput); setCustomInput(''); }}
          className="px-3 rounded-xl border border-white/12 bg-white/5 text-white/50 hover:text-white hover:bg-white/8 transition-colors flex items-center gap-1 text-sm"
        >
          <Plus className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

export default function EntryEditorDialog({
  open,
  onOpenChange,
  formState,
  setFormState,
  onSubmit,
  isSubmitting,
  dialogMode,
}) {
  const { settings } = useSettings();
  const entryPresets = Array.isArray(settings?.entry_presets) ? settings.entry_presets : DEFAULT_ENTRY_PRESETS;
  const stopLossPresets = Array.isArray(settings?.stop_loss_presets) ? settings.stop_loss_presets : DEFAULT_STOP_LOSS_PRESETS;
  const stopLossMovePresets = Array.isArray(settings?.stop_loss_move_presets) ? settings.stop_loss_move_presets : DEFAULT_STOP_LOSS_MOVE_PRESETS;
  const exitPresets = Array.isArray(settings?.exit_presets) ? settings.exit_presets : DEFAULT_EXIT_PRESETS;

  if (!formState) return null;

  const hasSLExit = formState.has_sl_exit_plan !== false;

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
            Define entry and exit criteria, stop loss management, and expected R to keep execution consistent.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Name row — always visible */}
          <div className={cn('grid grid-cols-1 gap-3', hasSLExit ? 'md:grid-cols-4' : '')}>
            <div className="space-y-1.5">
              <Label>Setup Name *</Label>
              <Input
                value={formState.name}
                onChange={(event) => setFormState((prev) => ({ ...prev, name: event.target.value }))}
                placeholder="VWAP Pullback"
                className="bg-white/[0.03] border-white/12"
              />
            </div>
            {hasSLExit && (
              <>
                <div className="space-y-1.5">
                  <Label>Timeframe</Label>
                  <div className="flex gap-1.5 flex-wrap pt-0.5">
                    {TIMEFRAMES.map((tf) => {
                      const selected = Array.isArray(formState.timeframe) && formState.timeframe.includes(tf);
                      return (
                        <button
                          key={tf}
                          type="button"
                          onClick={() => setFormState((prev) => {
                            const current = Array.isArray(prev.timeframe) ? prev.timeframe : [];
                            return {
                              ...prev,
                              timeframe: selected ? current.filter((t) => t !== tf) : [...current, tf],
                            };
                          })}
                          className={cn(
                            'rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors',
                            selected
                              ? 'border-cyan-400/40 bg-cyan-500/15 text-cyan-100'
                              : 'border-white/10 text-white/30 hover:text-white/60 hover:border-white/20',
                          )}
                        >
                          {tf}
                        </button>
                      );
                    })}
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label>Risk Level</Label>
                  <div className="grid grid-cols-4 gap-1 rounded-lg border border-white/12 bg-white/[0.03] p-1">
                    {[
                      { value: 'half',         label: '½×',   color: 'border-amber-400/40 bg-amber-500/15 text-amber-200' },
                      { value: 'normal',       label: '1×',   color: 'border-emerald-400/40 bg-emerald-500/15 text-emerald-200' },
                      { value: 'oneandahalf', label: '1.5×', color: 'border-cyan-400/40 bg-cyan-500/15 text-cyan-200' },
                      { value: 'double',       label: '2×',   color: 'border-rose-400/40 bg-rose-500/15 text-rose-200' },
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
                <div className="space-y-1.5">
                  <Label>Priority</Label>
                  <div className="grid grid-cols-3 gap-1 rounded-lg border border-white/12 bg-white/[0.03] p-1">
                    {[
                      { value: 1, label: '1', color: 'border-rose-400/40 bg-rose-500/15 text-rose-200' },
                      { value: 2, label: '2', color: 'border-amber-400/40 bg-amber-500/15 text-amber-200' },
                      { value: 3, label: '3', color: 'border-white/25 bg-white/10 text-white/60' },
                    ].map(({ value, label, color }) => {
                      const isActive = (formState.priority || 2) === value;
                      return (
                        <button
                          key={value}
                          type="button"
                          onClick={() => setFormState((prev) => ({ ...prev, priority: value }))}
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
              </>
            )}
          </div>

          {/* SL/Exit Plan toggle */}
          <div className="space-y-2">
            <Label>SL / Exit Plan</Label>
            <div className="flex gap-2">
              {[
                { value: true,  label: 'Yes', activeColor: 'border-cyan-400/40 bg-cyan-500/15 text-cyan-100' },
                { value: false, label: 'No',  activeColor: 'border-white/25 bg-white/8 text-white/70' },
              ].map(({ value, label, activeColor }) => {
                const isActive = hasSLExit === value;
                return (
                  <button
                    key={String(value)}
                    type="button"
                    onClick={() => setFormState((prev) => ({ ...prev, has_sl_exit_plan: value }))}
                    className={cn(
                      'rounded-lg border px-6 py-2 text-sm font-semibold transition-colors',
                      isActive ? activeColor : 'border-white/10 text-white/30 hover:text-white/60',
                    )}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
            <p className="text-[11px] text-white/35">
              {hasSLExit
                ? 'Define expected R, entry / exit criteria, stop loss, and invalidations below.'
                : 'Entry and SL details are not defined yet — only name and description will be saved.'}
            </p>
          </div>

          {/* Conditional SL/Exit sections */}
          {hasSLExit && (
            <>
              {/* Description */}
              <div className="space-y-1.5">
                <Label>Description</Label>
                <textarea
                  value={formState.description}
                  onChange={(event) => setFormState((prev) => ({ ...prev, description: event.target.value }))}
                  placeholder="What this setup is, where it performs best, and when to skip it."
                  className="min-h-[80px] w-full rounded-xl border border-white/12 bg-white/[0.03] px-3 py-2 text-sm text-white outline-none placeholder:text-white/35 focus:border-emerald-300/40"
                />
              </div>

              {/* Setup Conditions */}
              <div className="rounded-xl border border-white/10 bg-black/20 p-3 space-y-2.5">
                <p className="text-[10px] uppercase tracking-[0.14em] text-white/45">Setup Conditions</p>
                <div className="grid grid-cols-1 gap-2.5 md:grid-cols-2">
                  {[
                    { key: 'condition_structure', label: 'Structure', placeholder: 'Price prints above premarket high, 15-min close back below' },
                    { key: 'condition_ema_context', label: 'EMA Context', placeholder: 'Price extended above 9 EMA, EMA flattening/curling down' },
                    { key: 'condition_volume', label: 'Volume', placeholder: 'High volume spike on breakout attempt, then collapse' },
                    { key: 'condition_market_context', label: 'Market Context', placeholder: 'Not fighting a strong upward trend' },
                    { key: 'condition_time', label: 'Time', placeholder: 'Best before 11:30 AM ET' },
                    { key: 'condition_entry_type', label: 'Entry Type', placeholder: 'Market order at open of next 15-min candle after trigger close' },
                  ].map(({ key, label, placeholder }) => (
                    <div key={key} className="space-y-1">
                      <p className="text-[9px] uppercase tracking-widest text-white/35">{label}</p>
                      <Input
                        value={formState[key]}
                        onChange={(event) => setFormState((prev) => ({ ...prev, [key]: event.target.value }))}
                        placeholder={placeholder}
                        className="bg-white/[0.03] border-white/12 h-8 text-sm"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Grade Criteria */}
              <div className="rounded-xl border border-white/10 bg-black/20 p-3 space-y-2.5">
                <p className="text-[10px] uppercase tracking-[0.14em] text-white/45">Grade Criteria</p>
                <div className="grid grid-cols-1 gap-2.5 md:grid-cols-2">
                  {[
                    { key: 'grade_a_plus', label: 'A+', color: 'text-emerald-300/80', placeholder: 'Strong bearish engulfing candle on 15-min, rejection obvious' },
                    { key: 'grade_a', label: 'A', color: 'text-cyan-300/80', placeholder: 'Clean close below high with volume confirmation' },
                    { key: 'grade_b', label: 'B', color: 'text-amber-300/80', placeholder: 'Weak close, small body — half size' },
                    { key: 'grade_c', label: 'C', color: 'text-rose-300/80', placeholder: 'Price still making new highs — do not take' },
                  ].map(({ key, label, color, placeholder }) => (
                    <div key={key} className="space-y-1">
                      <p className={cn('text-[9px] uppercase tracking-widest', color)}>{label}</p>
                      <Input
                        value={formState[key]}
                        onChange={(event) => setFormState((prev) => ({ ...prev, [key]: event.target.value }))}
                        placeholder={placeholder}
                        className="bg-white/[0.03] border-white/12 h-8 text-sm"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Trigger Spec */}
              <div className="rounded-xl border border-white/10 bg-black/20 p-3 space-y-2.5">
                <p className="text-[10px] uppercase tracking-[0.14em] text-white/45">Trigger Spec</p>
                <div className="grid grid-cols-1 gap-2.5 md:grid-cols-2">
                  {[
                    { key: 'entry_trigger', label: 'Entry Trigger', placeholder: '15-min close back below premarket high' },
                    { key: 'trigger_level', label: 'Trigger Level', placeholder: 'Premarket high' },
                    { key: 'trigger_event', label: 'Trigger Event', placeholder: 'Candle close' },
                    { key: 'order', label: 'Order', placeholder: 'Market order at open of next 15-min candle' },
                    { key: 'abort_if', label: 'Abort If', placeholder: 'Price reclaims trigger level before entry' },
                  ].map(({ key, label, placeholder }) => (
                    <div key={key} className="space-y-1">
                      <p className="text-[9px] uppercase tracking-widest text-white/35">{label}</p>
                      <Input
                        value={formState[key]}
                        onChange={(event) => setFormState((prev) => ({ ...prev, [key]: event.target.value }))}
                        placeholder={placeholder}
                        className="bg-white/[0.03] border-white/12 h-8 text-sm"
                      />
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-3 gap-2.5">
                  <div className="space-y-1">
                    <p className="text-[9px] uppercase tracking-widest text-white/35">Expiry (bars)</p>
                    <Input
                      type="number"
                      step="1"
                      value={formState.expiry_bars}
                      onChange={(event) => setFormState((prev) => ({ ...prev, expiry_bars: event.target.value }))}
                      placeholder="3"
                      className="bg-white/[0.03] border-white/12 h-8 text-sm"
                    />
                  </div>
                  <div className="space-y-1">
                    <p className="text-[9px] uppercase tracking-widest text-white/35">Loss (R)</p>
                    <div className="flex h-8 items-center rounded-lg border border-white/12 bg-white/[0.03] px-2.5 text-sm text-white/40">
                      From Performance
                    </div>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[9px] uppercase tracking-widest text-white/35">Win Rate (%)</p>
                    <div className="flex h-8 items-center rounded-lg border border-white/12 bg-white/[0.03] px-2.5 text-sm text-white/40">
                      From Performance
                    </div>
                  </div>
                </div>
                <p className="text-[10px] text-white/30">
                  Loss (R) and Win Rate are calculated automatically from this setup's trade history once you've logged trades — they aren't editable here.
                </p>
              </div>

              {/* Expected R & Exit Allocation */}
              <div className="rounded-xl border border-white/10 bg-black/20 p-3 space-y-2.5">
                <p className="text-[10px] uppercase tracking-[0.14em] text-white/45">Expected R &amp; Exit Allocation</p>
                {[
                  { rKey: 'expected_r_min',     pKey: 'expected_r_min_percent',    label: 'Min R',     required: false, color: 'text-white/60' },
                  { rKey: 'expected_r_target',  pKey: 'expected_r_target_percent', label: 'Target R',  required: true,  color: 'text-cyan-300/80' },
                  { rKey: 'expected_r_stretch', pKey: 'expected_r_stretch_percent',label: 'Stretch R', required: false, color: 'text-emerald-300/80' },
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

              {/* Entry / Exit / Stop Loss / Stop Loss Move — preset pickers */}
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <PresetPicker
                  label="Entry Criteria"
                  required
                  presets={entryPresets}
                  value={formState.entry_criteria_items}
                  onChange={(items) => setFormState((prev) => ({ ...prev, entry_criteria_items: items }))}
                  focusBorderClass="focus:border-emerald-300/40"
                  customPlaceholder="Add custom entry rule…"
                />
                <PresetPicker
                  label="Exit Criteria"
                  required
                  presets={exitPresets}
                  value={formState.exit_criteria_items}
                  onChange={(items) => setFormState((prev) => ({ ...prev, exit_criteria_items: items }))}
                  focusBorderClass="focus:border-cyan-300/40"
                  customPlaceholder="Add custom exit rule…"
                />
              </div>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <PresetPicker
                  label="Stop Loss"
                  presets={stopLossPresets}
                  value={formState.stop_loss_management_items}
                  onChange={(items) => setFormState((prev) => ({ ...prev, stop_loss_management_items: items }))}
                  focusBorderClass="focus:border-violet-300/40"
                  customPlaceholder="Add custom stop loss rule…"
                />
                <PresetPicker
                  label="Stop Loss Move"
                  presets={stopLossMovePresets}
                  value={formState.stop_loss_move_items}
                  onChange={(items) => setFormState((prev) => ({ ...prev, stop_loss_move_items: items }))}
                  focusBorderClass="focus:border-amber-300/40"
                  customPlaceholder="Add custom SL move rule…"
                />
              </div>

              {/* Invalidations */}
              <div className="space-y-1.5">
                <Label>Invalidations *</Label>
                <textarea
                  value={formState.invalidations_text}
                  onChange={(event) => setFormState((prev) => ({ ...prev, invalidations_text: event.target.value }))}
                  placeholder="One line per invalidation"
                  className="min-h-[80px] w-full rounded-xl border border-white/12 bg-white/[0.03] px-3 py-2 text-sm text-white outline-none placeholder:text-white/35 focus:border-rose-300/40"
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
            </>
          )}

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
