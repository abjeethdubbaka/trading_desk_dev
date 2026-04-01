import React from 'react';
import { Input } from '@/components/ui/input';
import Field from '@/components/settings/Field';
import RiskMeter from '@/components/settings/RiskMeter';
import ExitStrategySettings from '@/components/settings/ExitStrategySettings';

export default function RiskSettingsTab({
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
            className="bg-white/5 border-white/10"
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
            className="bg-white/5 border-white/10"
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
            className="bg-white/5 border-white/10"
            disabled={isLoading}
          />
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

