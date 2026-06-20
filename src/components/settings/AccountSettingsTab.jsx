import React from 'react';
import { Input } from '@/components/ui/input';
import AccountTierSelector from '@/components/settings/AccountTierSelector';
import Field from '@/components/settings/Field';
import RiskMeter from '@/components/settings/RiskMeter';

export default function AccountSettingsTab({
  getDisplayValue,
  handleFieldChange,
  commitDraftField,
  isLoading,
  riskMeterSettings,
}) {
  const compactInputClass = 'h-9 rounded-lg px-2.5 bg-white/5 border-white/10';

  return (
    <div className="space-y-4">
      <AccountTierSelector />
      <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-4 items-start">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field label="Account size ($)">
          <Input
            type="number"
            value={getDisplayValue('account_size')}
            onChange={handleFieldChange('account_size')}
            onBlur={() => commitDraftField('account_size')}
            placeholder="50000"
            className={compactInputClass}
            disabled={isLoading}
          />
        </Field>

        <Field label="Daily profit target ($)">
          <Input
            type="number"
            step="50"
            value={getDisplayValue('target_profit_dollars')}
            onChange={handleFieldChange('target_profit_dollars')}
            onBlur={() => commitDraftField('target_profit_dollars')}
            placeholder="500"
            className={compactInputClass}
            disabled={isLoading}
          />
        </Field>

        <Field label="Max daily loss ($)">
          <Input
            type="number"
            step="50"
            value={getDisplayValue('max_dollars')}
            onChange={handleFieldChange('max_dollars')}
            onBlur={() => commitDraftField('max_dollars')}
            placeholder="250"
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
      </div>
      <RiskMeter settings={riskMeterSettings} />
      </div>
    </div>
  );
}
