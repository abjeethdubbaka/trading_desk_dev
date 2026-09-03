import React from 'react';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import Field from '@/components/settings/Field';
import SimpleListManager from '@/components/settings/SimpleListManager';
import { DEFAULT_MISTAKES } from '@/lib/constants/mistakes';
import { DEFAULT_LEARNINGS } from '@/lib/constants/learnings';
import { DEFAULT_WHAT_WORKED } from '@/lib/constants/whatWorked';
import { DEFAULT_INFORMATIVE_IMAGE_CATEGORIES } from '@/lib/constants/informativeImageCategories';

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

export default function RiskSettingsTab({
  settings,
  updateFields,
  saveImmediately,
  getDisplayValue,
  handleFieldChange,
  commitDraftField,
  isLoading,
}) {
  const compactInputClass = 'h-9 rounded-lg px-2.5 bg-white/5 border-white/10';
  const timerSoundEnabled = settings?.notifications?.analysis_timer_sound !== false;

  const saveListField = (field, value) => {
    const result = saveImmediately ? saveImmediately({ [field]: value }) : updateFields({ [field]: value });
    Promise.resolve(result).catch((error) => {
      toast.error(error?.message || 'Could not save change. Please try again.');
    });
  };

  return (
    <div className="space-y-6 w-full">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Field label="Position analysis timer (sec)" hint="Calculator timer length beside Position Analysis">
          <Input
            type="number"
            step="5"
            min="5"
            value={getDisplayValue('analysis_timer_seconds', '180')}
            onChange={handleFieldChange('analysis_timer_seconds')}
            onBlur={() => commitDraftField('analysis_timer_seconds')}
            placeholder="180"
            className={compactInputClass}
            disabled={isLoading}
          />
        </Field>

        <Field label="Max trades per day" hint="Calculator badge turns amber at limit−1 and red when reached">
          <Input
            type="number"
            step="1"
            min="1"
            value={getDisplayValue('max_daily_trades', '5')}
            onChange={handleFieldChange('max_daily_trades')}
            onBlur={() => commitDraftField('max_daily_trades')}
            placeholder="5"
            className={compactInputClass}
            disabled={isLoading}
          />
        </Field>

        <Field label="Timer sound alerts" hint="Play timer sounds for start/pause, 10-second countdown, and finish">
          <label className="h-9 px-2.5 rounded-lg border border-white/10 bg-white/5 flex items-center gap-2 text-xs text-white/75">
            <input
              type="checkbox"
              checked={Boolean(timerSoundEnabled)}
              onChange={(event) => {
                const checked = Boolean(event.target.checked);
                const currentNotifications = settings?.notifications && typeof settings.notifications === 'object'
                  ? settings.notifications
                  : {};
                updateFields({
                  notifications: {
                    ...currentNotifications,
                    analysis_timer_sound: checked,
                  },
                });
              }}
              className="accent-cyan-400"
              disabled={isLoading}
            />
            Enable timer sound cues
          </label>
        </Field>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        <Field label="What Worked" hint="Positive keywords shown in the Reflection section's What Worked toggle list. Tag what you executed well on each trade.">
          <SimpleListManager
            items={Array.isArray(settings?.what_worked_keywords) ? settings.what_worked_keywords : DEFAULT_WHAT_WORKED}
            placeholder="Add a keyword…"
            onChange={(items) => saveListField('what_worked_keywords', items)}
          />
        </Field>

        <Field label="Mistakes" hint="Standardized keywords shown in the Reflection section's Mistakes toggle list. Keeping these consistent makes them searchable across trades.">
          <SimpleListManager
            items={Array.isArray(settings?.mistakes) ? settings.mistakes : DEFAULT_MISTAKES}
            placeholder="Add a mistake keyword…"
            onChange={(items) => saveListField('mistakes', items)}
          />
        </Field>

        <Field label="Learnings" hint="Standardized keywords shown in the Reflection section's Learning toggle list.">
          <SimpleListManager
            items={Array.isArray(settings?.learnings) ? settings.learnings : DEFAULT_LEARNINGS}
            placeholder="Add a learning keyword…"
            onChange={(items) => saveListField('learnings', items)}
          />
        </Field>

        <Field label="Informative image categories" hint="Options shown for the 'Other' image type in Informative Images. Setup images are categorized from your Playbook setups instead.">
          <SimpleListManager
            items={Array.isArray(settings?.informative_image_categories) ? settings.informative_image_categories : DEFAULT_INFORMATIVE_IMAGE_CATEGORIES}
            placeholder="Add a category…"
            onChange={(items) => saveListField('informative_image_categories', items)}
          />
        </Field>

        <Field label="Entry presets" hint="Preset rules shown in the Playbook entry editor's Entry Criteria dropdown.">
          <SimpleListManager
            items={Array.isArray(settings?.entry_presets) ? settings.entry_presets : DEFAULT_ENTRY_PRESETS}
            placeholder="Add an entry rule…"
            onChange={(items) => saveListField('entry_presets', items)}
          />
        </Field>

        <Field label="Stop loss presets" hint="Preset rules shown in the Playbook entry editor's Stop Loss dropdown.">
          <SimpleListManager
            items={Array.isArray(settings?.stop_loss_presets) ? settings.stop_loss_presets : DEFAULT_STOP_LOSS_PRESETS}
            placeholder="Add a stop loss rule…"
            onChange={(items) => saveListField('stop_loss_presets', items)}
          />
        </Field>

        <Field label="Exit presets" hint="Preset rules shown in the Playbook entry editor's Exit Criteria dropdown.">
          <SimpleListManager
            items={Array.isArray(settings?.exit_presets) ? settings.exit_presets : DEFAULT_EXIT_PRESETS}
            placeholder="Add an exit rule…"
            onChange={(items) => saveListField('exit_presets', items)}
          />
        </Field>

        <Field label="Stop loss move presets" hint="Preset rules for how to trail or move the stop loss during a trade.">
          <SimpleListManager
            items={Array.isArray(settings?.stop_loss_move_presets) ? settings.stop_loss_move_presets : DEFAULT_STOP_LOSS_MOVE_PRESETS}
            placeholder="Add a SL move rule…"
            onChange={(items) => saveListField('stop_loss_move_presets', items)}
          />
        </Field>
      </div>
    </div>
  );
}
