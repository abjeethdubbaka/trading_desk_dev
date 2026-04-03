import React from 'react';
import { Input } from '@/components/ui/input';
import Field from '@/components/settings/Field';
import RiskMeter from '@/components/settings/RiskMeter';
import ExitStrategySettings from '@/components/settings/ExitStrategySettings';

export default function RiskSettingsTab({
  settings,
  updateFields,
  getDisplayValue,
  handleFieldChange,
  commitDraftField,
  isLoading,
  riskMeterSettings,
  exitDraft,
  handleAddExitLevel,
  handleRemoveExitLevel,
  handleExitFieldChange,
  handleExitFieldBlur,
  handleExitTrailingToggle,
  exitPercentTotal,
}) {
  const compactInputClass = 'h-9 rounded-lg px-2.5 bg-white/5 border-white/10';
  const timerSoundEnabled = settings?.notifications?.analysis_timer_sound !== false;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="space-y-4">
        <h2 className="text-sm font-semibold text-white/70">Risk parameters</h2>

        <Field label="Position sizing (% of account)">
          <Input
            type="number"
            step="0.1"
            value={getDisplayValue('position_sizing_percent', '1')}
            onChange={handleFieldChange('position_sizing_percent')}
            onBlur={() => commitDraftField('position_sizing_percent')}
            placeholder="1"
            className={compactInputClass}
            disabled={isLoading}
          />
        </Field>

        <Field label="Default stop loss (%)">
          <Input
            type="number"
            step="0.1"
            value={getDisplayValue('default_stop_loss_percent', '4')}
            onChange={handleFieldChange('default_stop_loss_percent')}
            onBlur={() => commitDraftField('default_stop_loss_percent')}
            placeholder="4"
            className={compactInputClass}
            disabled={isLoading}
          />
        </Field>

        <Field label="Risk amount ($)" hint="Dollar risk per trade used in calculator">
          <Input
            type="number"
            step="50"
            value={getDisplayValue('risk_amount')}
            onChange={handleFieldChange('risk_amount')}
            onBlur={() => commitDraftField('risk_amount')}
            placeholder="1000"
            className={compactInputClass}
            disabled={isLoading}
          />
        </Field>

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

        <ExitStrategySettings
          exitDraft={exitDraft}
          onAddLevel={handleAddExitLevel}
          onRemoveLevel={handleRemoveExitLevel}
          onFieldChange={handleExitFieldChange}
          onFieldBlur={handleExitFieldBlur}
          onTrailingToggle={handleExitTrailingToggle}
          isLoading={isLoading}
          exitPercentTotal={exitPercentTotal}
        />
      </div>

      <div className="space-y-4">
        <RiskMeter settings={riskMeterSettings} />
      </div>
    </div>
  );
}
