import React from 'react';
import { Input } from '@/components/ui/input';
import AccountTierSelector from '@/components/settings/AccountTierSelector';
import Field from '@/components/settings/Field';
import RiskMeter from '@/components/settings/RiskMeter';
import { useSettings } from '@/lib/context/SettingsContext';
import { BarChart2, TrendingUp } from 'lucide-react';

const TRADING_TYPES = [
  { value: 'stocks', label: 'Stocks', icon: BarChart2, desc: 'Equities, day trading' },
  { value: 'futures', label: 'Futures', icon: TrendingUp, desc: 'ES, NQ, CL and more' },
];

export default function AccountSettingsTab({
  getDisplayValue,
  handleFieldChange,
  commitDraftField,
  clearAllDrafts,
  isLoading,
  riskMeterSettings,
}) {
  const compactInputClass = 'h-9 rounded-lg px-2.5 bg-white/5 border-white/10';
  const { settings, updateFields, saveImmediately } = useSettings();
  const currentTradingType = settings?.trading_type || 'stocks';
  const currentTier = settings?.account_tier;

  // When risk_amount is committed, also save it to tier_risk_amounts[currentTier]
  const commitRiskAmount = () => {
    commitDraftField('risk_amount');
    const rawValue = getDisplayValue('risk_amount');
    const numeric = Number(rawValue);
    if (currentTier && currentTier !== 'custom' && Number.isFinite(numeric) && numeric > 0) {
      const existing = settings?.tier_risk_amounts || {};
      saveImmediately({ tier_risk_amounts: { ...existing, [currentTier]: numeric } });
    }
  };

  const handleTradingTypeSelect = async (value) => {
    const patch = { trading_type: value };
    updateFields(patch);
    await saveImmediately(patch);
  };

  return (
    <div className="space-y-4">
      {/* Trading type selector */}
      <div className="space-y-2">
        <label className="flex items-center gap-2 text-sm font-medium text-white/80">
          <TrendingUp className="w-4 h-4" />
          Trading
        </label>
        <div className="grid grid-cols-2 gap-1.5 rounded-xl border border-white/10 bg-white/[0.03] p-1.5">
          {TRADING_TYPES.map(({ value, label, icon: Icon, desc }) => {
            const active = currentTradingType === value;
            const disabled = false;
            return (
              <button
                key={value}
                type="button"
                disabled={disabled || isLoading}
                onClick={() => handleTradingTypeSelect(value)}
                className={`flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-left transition-colors ${
                  active
                    ? 'border border-emerald-400/35 bg-emerald-500/15 text-emerald-100'
                    : disabled
                      ? 'cursor-not-allowed text-white/20'
                      : 'text-white/50 hover:text-white/80 hover:bg-white/5'
                }`}
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                <div>
                  <p className="text-sm font-semibold leading-none">{label}</p>
                  <p className="mt-0.5 text-[10px] leading-tight opacity-60">{desc}</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <AccountTierSelector onSettingsReplaced={clearAllDrafts} />
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
            onBlur={commitRiskAmount}
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
