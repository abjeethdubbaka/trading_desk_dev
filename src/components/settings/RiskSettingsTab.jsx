import React from 'react';
import { Input } from '@/components/ui/input';
import Field from '@/components/settings/Field';

export default function RiskSettingsTab({
  settings,
  updateFields,
  getDisplayValue,
  handleFieldChange,
  commitDraftField,
  isLoading,
}) {
  const compactInputClass = 'h-9 rounded-lg px-2.5 bg-white/5 border-white/10';
  const timerSoundEnabled = settings?.notifications?.analysis_timer_sound !== false;

  return (
    <div className="space-y-4 max-w-[480px]">
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
  );
}
