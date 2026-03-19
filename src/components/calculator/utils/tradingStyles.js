import { Shield, Scale, Zap } from 'lucide-react';

export const TRADING_STYLES = {
  conservative: {
    label: 'Conservative',
    riskPercent: 0.5,
    icon: Shield,
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/20',
    description: 'Preserve capital, smaller positions, lower risk'
  },
  moderate: {
    label: 'Moderate',
    riskPercent: 1.0,
    icon: Scale,
    color: 'text-emerald-400',
    bgColor: 'bg-emerald-500/20',
    description: 'Balance risk and reward, standard position sizing'
  },
  aggressive: {
    label: 'Aggressive',
    riskPercent: 2.0,
    icon: Zap,
    color: 'text-orange-400',
    bgColor: 'bg-orange-500/20',
    description: 'Maximize returns, larger positions, higher risk tolerance'
  }
};

export function getTradingStyle(style) {
  return TRADING_STYLES[style] || TRADING_STYLES.moderate;
}

export function getRiskPercent(style, useAdvanced = false, customRiskPercent = 1.0) {
  if (useAdvanced) return customRiskPercent;
  return TRADING_STYLES[style]?.riskPercent || 1.0;
}
