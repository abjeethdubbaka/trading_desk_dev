import React from 'react';
import { Input } from '@/components/ui/input';
import AccountTierSelector from '@/components/settings/AccountTierSelector';
import Field from '@/components/settings/Field';

export default function AccountSettingsTab({
  getDisplayValue,
  handleFieldChange,
  commitDraftField,
  isLoading,
}) {
  return (
    <div className="space-y-4">
      <AccountTierSelector />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field label="Account size ($)" hint="Starting capital for all calculations">
          <Input
            type="number"
            value={getDisplayValue('account_size')}
            onChange={handleFieldChange('account_size')}
            onBlur={() => commitDraftField('account_size')}
            placeholder="50000"
            className="bg-white/5 border-white/10"
            disabled={isLoading}
          />
        </Field>

        <Field label="Daily profit target ($)" hint="Shown as progress bar on dashboard">
          <Input
            type="number"
            step="50"
            value={getDisplayValue('target_profit_dollars')}
            onChange={handleFieldChange('target_profit_dollars')}
            onBlur={() => commitDraftField('target_profit_dollars')}
            placeholder="500"
            className="bg-white/5 border-white/10"
            disabled={isLoading}
          />
        </Field>

        <Field label="Max daily loss ($)" hint="Dashboard warns when this is hit">
          <Input
            type="number"
            step="50"
            value={getDisplayValue('max_dollars')}
            onChange={handleFieldChange('max_dollars')}
            onBlur={() => commitDraftField('max_dollars')}
            placeholder="250"
            className="bg-white/5 border-white/10"
            disabled={isLoading}
          />
        </Field>
      </div>
    </div>
  );
}

