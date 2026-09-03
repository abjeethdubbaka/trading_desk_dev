import { useMemo } from 'react';

/**
 * Derives the selected playbook setup's risk multiplier and exit-ladder
 * profile (target R, tiered exit percentages) from its expected_r_profile.
 */
export function usePlaybookExitProfile(selectedSetupId, playbookEntries) {
  const selectedSetup = useMemo(
    () => (selectedSetupId ? playbookEntries.find((e) => e.id === selectedSetupId) ?? null : null),
    [selectedSetupId, playbookEntries],
  );

  const riskMultiplier = selectedSetup?.risk_level === 'half' ? 0.5
    : selectedSetup?.risk_level === 'oneandahalf' ? 1.5
    : selectedSetup?.risk_level === 'double' ? 2
    : 1;

  const playbookRProfile = selectedSetup?.expected_r_profile ?? null;

  const playbookTargetR = useMemo(() => {
    const t = Number(playbookRProfile?.target);
    return Number.isFinite(t) && t > 0 ? t : null;
  }, [playbookRProfile]);

  const playbookExitStrategy = useMemo(() => {
    if (!playbookRProfile) return null;
    const min     = Number.isFinite(Number(playbookRProfile.min))     && Number(playbookRProfile.min)     > 0 ? Number(playbookRProfile.min)     : null;
    const target  = Number.isFinite(Number(playbookRProfile.target))  && Number(playbookRProfile.target)  > 0 ? Number(playbookRProfile.target)  : null;
    const stretch = Number.isFinite(Number(playbookRProfile.stretch)) && Number(playbookRProfile.stretch) > 0 ? Number(playbookRProfile.stretch) : null;

    const { min_percent, target_percent, stretch_percent } = playbookRProfile;

    const tiers = [];
    if (min    != null) tiers.push({ r: min,     pct: Number(min_percent)     });
    if (target != null) tiers.push({ r: target,  pct: Number(target_percent)  });
    if (stretch!= null) tiers.push({ r: stretch, pct: Number(stretch_percent) });

    if (tiers.length === 0) return null;

    // Use authored percentages when provided; fall back to equal split
    const hasAuthored = tiers.some(({ pct }) => Number.isFinite(pct) && pct > 0);
    const FALLBACK = { 1: [100], 2: [40, 60], 3: [25, 50, 25] };
    const fallback = FALLBACK[tiers.length] ?? tiers.map(() => Math.floor(100 / tiers.length));

    const levels = tiers.map(({ r, pct }, i) => ({
      r,
      percent: hasAuthored ? (Number.isFinite(pct) && pct > 0 ? pct : 0) : fallback[i],
    }));
    return { levels };
  }, [playbookRProfile]);

  return { selectedSetup, riskMultiplier, playbookTargetR, playbookExitStrategy };
}
