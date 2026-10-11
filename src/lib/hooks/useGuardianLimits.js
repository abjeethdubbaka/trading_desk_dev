/**
 * @file src/lib/hooks/useGuardianLimits.js
 *
 * Today's Guardian limits as everything on screen shows them — the top bar,
 * the launch prompt, Settings — so they all agree, including when the
 * Morning Brief has tightened the day.
 */

import { useMemo } from 'react';
import { useSettings } from '@/lib/context/SettingsContext';
import { useMorningBrief } from '@/lib/hooks/useMorningBrief';
import { buildGuardianRules, getGuardianLimits } from '@/lib/guardian/rules';

export function useGuardianLimits() {
  const { settings } = useSettings();
  const { todayBrief } = useMorningBrief();
  const mentalScore = todayBrief?.mental_score ?? null;

  return useMemo(() => ({
    settings,
    mentalScore,
    limits: getGuardianLimits(settings, { mentalScore }),
    rules: settings ? buildGuardianRules(settings, { mentalScore }) : null,
  }), [settings, mentalScore]);
}

export default useGuardianLimits;
