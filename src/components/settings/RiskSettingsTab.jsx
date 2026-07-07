import React from 'react';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import Field from '@/components/settings/Field';
import SimpleListManager from '@/components/settings/SimpleListManager';
import { DEFAULT_EXIT_REASONS } from '@/lib/constants/exitReasons';
import { DEFAULT_MARKET_ENVIRONMENTS } from '@/lib/constants/marketEnvironments';
import { DEFAULT_STOP_LOSS_REASONS } from '@/lib/constants/stopLossReasons';
import { DEFAULT_MISTAKES } from '@/lib/constants/mistakes';
import { DEFAULT_LEARNINGS } from '@/lib/constants/learnings';
import { DEFAULT_INFORMATIVE_IMAGE_CATEGORIES } from '@/lib/constants/informativeImageCategories';

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
        <Field label="Exit reasons" hint="Options shown in the Reason for Exit dropdown when logging a trade.">
          <SimpleListManager
            items={Array.isArray(settings?.exit_reasons) ? settings.exit_reasons : DEFAULT_EXIT_REASONS}
            placeholder="Add an exit reason…"
            onChange={(reasons) => saveListField('exit_reasons', reasons)}
          />
        </Field>

        <Field label="Market environments" hint="Options shown in the Market Environment dropdown when logging a trade.">
          <SimpleListManager
            items={Array.isArray(settings?.market_environments) ? settings.market_environments : DEFAULT_MARKET_ENVIRONMENTS}
            placeholder="Add a market environment…"
            onChange={(environments) => saveListField('market_environments', environments)}
          />
        </Field>

        <Field label="Stop loss reasons" hint="Options shown in the Stop Loss Reason dropdown when logging a trade.">
          <SimpleListManager
            items={Array.isArray(settings?.stop_loss_reasons) ? settings.stop_loss_reasons : DEFAULT_STOP_LOSS_REASONS}
            placeholder="Add a stop loss reason…"
            onChange={(reasons) => saveListField('stop_loss_reasons', reasons)}
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
      </div>
    </div>
  );
}
