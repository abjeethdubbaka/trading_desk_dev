import React, { useEffect, useState } from 'react';
import { Input } from '@/components/ui/input';
import AccountTierSelector from '@/components/settings/AccountTierSelector';
import Field from '@/components/settings/Field';
import RiskMeter from '@/components/settings/RiskMeter';
import { useSettings } from '@/lib/context/SettingsContext';
import { ACCOUNT_TIERS } from '@/lib/config/accountTypes';
import { getDailyTargetsWeek1, getDailyTargetPurposesWeek1, resolveTierKey } from '@/lib/config/dailyTargets';
import { getDailyLossLimitsWeek1 } from '@/lib/config/dailyLossLimits';
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
  onDailyTargetsDraft,
}) {
  const compactInputClass = 'h-9 rounded-lg px-2.5 bg-white/5 border-white/10';
  const { settings, updateFields, saveImmediately } = useSettings();
  const currentTradingType = settings?.trading_type || 'stocks';
  const currentTier = settings?.account_tier;
  const currentTierKey = resolveTierKey(settings);

  // Local draft state for the current tier's daily targets/loss limits — only
  // flushed to Firebase on Settings Save. Re-seeded whenever the account tier
  // changes so each tier keeps its own Mon–Fri schedule (e.g. $25K vs $100K).
  const [localTargets, setLocalTargets] = useState(() => getDailyTargetsWeek1(settings, currentTierKey));
  const [localPurposes, setLocalPurposes] = useState(() => getDailyTargetPurposesWeek1(settings, currentTierKey));
  const [localLossLimits, setLocalLossLimits] = useState(() => getDailyLossLimitsWeek1(settings, currentTierKey));
  useEffect(() => {
    setLocalTargets(getDailyTargetsWeek1(settings, currentTierKey));
    setLocalPurposes(getDailyTargetPurposesWeek1(settings, currentTierKey));
    setLocalLossLimits(getDailyLossLimitsWeek1(settings, currentTierKey));
  }, [currentTierKey]);

  const weeklyTarget = localTargets.reduce((s, v) => s + (Number(v) || 0), 0);

  const todayDow = new Date().getDay(); // 0=Sun, 6=Sat
  const todayIndex = todayDow === 0 || todayDow === 6 ? null : todayDow - 1;
  const todayMaxDailyLoss = Number(localLossLimits[todayIndex ?? 0]) || 0;
  const weeklyLossCap = localLossLimits.reduce((s, v) => s + (Number(v) || 0), 0);
  const derivedRiskAmount = todayMaxDailyLoss / 2;

  const changeDayAmount = (dayIdx, rawValue) => {
    const weekArr = [...localTargets];
    weekArr[dayIdx] = Number(rawValue) || 0;
    setLocalTargets(weekArr);
    onDailyTargetsDraft?.({
      daily_targets: {
        ...(settings?.daily_targets || {}),
        [currentTierKey]: { week1: weekArr },
      },
      target_profit_dollars: weekArr.reduce((s, v) => s + (Number(v) || 0), 0),
    });
  };

  const changeDayPurpose = (dayIdx, value) => {
    const weekArr = [...localPurposes];
    weekArr[dayIdx] = value;
    setLocalPurposes(weekArr);
    onDailyTargetsDraft?.({
      daily_target_purposes: {
        ...(settings?.daily_target_purposes || {}),
        [currentTierKey]: { week1: weekArr },
      },
    });
  };

  const changeLossLimit = (dayIdx, rawValue) => {
    const weekArr = [...localLossLimits];
    weekArr[dayIdx] = Number(rawValue) || 0;
    setLocalLossLimits(weekArr);
    const todayLimit = Number(weekArr[todayIndex ?? 0]) || 0;
    const patch = {
      daily_loss_limits: {
        ...(settings?.daily_loss_limits || {}),
        [currentTierKey]: { week1: weekArr },
      },
      max_dollars: todayLimit,
      risk_amount: todayLimit / 2,
    };
    onDailyTargetsDraft?.(patch);
    if (currentTier && currentTier !== 'custom') {
      const existing = settings?.tier_risk_amounts || {};
      saveImmediately({ tier_risk_amounts: { ...existing, [currentTier]: todayLimit / 2 } });
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

        <Field label="Weekly profit target ($)" hint="Sum of this tier's Daily Targets below">
          <div className={`${compactInputClass} flex items-center text-white/70`}>
            ${weeklyTarget.toLocaleString()}
          </div>
        </Field>

        <Field label="Max daily loss ($)" hint="Today's cap from this tier's Daily Loss Limits below">
          <div className={`${compactInputClass} flex items-center text-white/70`}>
            ${todayMaxDailyLoss.toLocaleString()}
          </div>
        </Field>

        <Field label="Risk amount ($)" hint="Half of today's Max daily loss">
          <div className={`${compactInputClass} flex items-center text-white/70`}>
            ${derivedRiskAmount.toLocaleString(undefined, { maximumFractionDigits: 2 })}
          </div>
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

      {/* ── Daily Targets ──────────────────────────────────────────── */}
      <div className="space-y-3 pt-2">
        <div>
          <p className="text-sm font-semibold text-white/75">
            Daily Targets <span className="text-white/35 font-normal">— {ACCOUNT_TIERS[currentTierKey]?.display ?? 'Custom'}</span>
          </p>
          <p className="mt-0.5 text-xs text-white/35">
            Target P&L for each trading day (Mon–Fri), shown in the Dashboard launch banner. Targets are saved per account tier, so switching tiers switches targets too.
          </p>
        </div>

        <div className="overflow-x-auto">
          <div className="flex gap-3">
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri'].map((day, dayIdx) => (
              <div key={day} className="flex flex-col gap-1.5 items-center">
                <span className="text-[10px] font-semibold uppercase tracking-widest text-white/30">{day}</span>
                <div className="relative">
                  <span className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-[10px] text-white/30">$</span>
                  <Input
                    type="number"
                    min="0"
                    step="10"
                    value={localTargets[dayIdx] ?? ''}
                    onChange={(e) => changeDayAmount(dayIdx, e.target.value)}
                    className="h-8 w-20 rounded-lg border-white/10 bg-white/5 pl-5 pr-1.5 text-center text-xs"
                    disabled={isLoading}
                  />
                </div>
                <Input
                  type="text"
                  value={localPurposes[dayIdx] ?? ''}
                  onChange={(e) => changeDayPurpose(dayIdx, e.target.value)}
                  placeholder="Purpose"
                  className="h-6 w-20 rounded border-white/[0.07] bg-transparent px-1.5 text-[10px] text-white/40 placeholder-white/15"
                  disabled={isLoading}
                />
              </div>
            ))}
            <div className="flex flex-col justify-center pl-3 border-l border-white/[0.07]">
              <span className="text-[10px] text-white/25">Weekly Target</span>
              <span className="text-sm font-semibold text-white/55">
                ${weeklyTarget.toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Daily Loss Limits ──────────────────────────────────────── */}
      <div className="space-y-3 pt-2">
        <div>
          <p className="text-sm font-semibold text-white/75">
            Daily Loss Limits <span className="text-white/35 font-normal">— {ACCOUNT_TIERS[currentTierKey]?.display ?? 'Custom'}</span>
          </p>
          <p className="mt-0.5 text-xs text-white/35">
            Max loss cap for each trading day (Mon–Fri), used by the risk meter, discipline coach, and calculator's loss-limit warning. Saved per account tier, same as Daily Targets.
          </p>
        </div>

        <div className="overflow-x-auto">
          <div className="flex gap-3">
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri'].map((day, dayIdx) => (
              <div key={day} className="flex flex-col gap-1.5 items-center">
                <span className="text-[10px] font-semibold uppercase tracking-widest text-white/30">{day}</span>
                <div className="relative">
                  <span className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-[10px] text-white/30">$</span>
                  <Input
                    type="number"
                    min="0"
                    step="10"
                    value={localLossLimits[dayIdx] ?? ''}
                    onChange={(e) => changeLossLimit(dayIdx, e.target.value)}
                    className="h-8 w-20 rounded-lg border-white/10 bg-white/5 pl-5 pr-1.5 text-center text-xs"
                    disabled={isLoading}
                  />
                </div>
              </div>
            ))}
            <div className="flex flex-col justify-center pl-3 border-l border-white/[0.07]">
              <span className="text-[10px] text-white/25">Weekly Cap</span>
              <span className="text-sm font-semibold text-white/55">
                ${weeklyLossCap.toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
