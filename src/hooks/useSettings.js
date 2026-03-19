/**
 * @file src/hooks/useSettings.js
 *
 * Firebase-backed settings with optimistic local updates.
 * Auto-saves debounced on every change.
 * Replaces SettingsProvider + the old base44 settings calls.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useCallback, useRef }                    from 'react';
import { db }                                      from '@/lib/db';
import { SETTINGS_DEFAULTS, withDefaults }         from '@/lib/db/schema';

const SETTINGS_KEY = ['settings'];
const DEBOUNCE_MS  = 800;

// ─── Query ────────────────────────────────────────────────────────────────────

export function useSettings() {
  const qc = useQueryClient();
  const timerRef = useRef(null);

  // ── Load ──────────────────────────────────────────────────────────────────
  const { data: rawSettings, isLoading } = useQuery({
    queryKey: SETTINGS_KEY,
    queryFn:  async () => {
      const saved = await db.settings.get();
      return withDefaults(SETTINGS_DEFAULTS, saved ?? {});
    },
    staleTime: 5 * 60_000,
  });

  const settings = rawSettings ?? SETTINGS_DEFAULTS;

  // ── Save mutation ─────────────────────────────────────────────────────────
  const saveMutation = useMutation({
    mutationFn: (data) => db.settings.save(data),
    onMutate:   async (data) => {
      await qc.cancelQueries({ queryKey: SETTINGS_KEY });
      const prev = qc.getQueryData(SETTINGS_KEY);
      qc.setQueryData(SETTINGS_KEY, old => ({ ...old, ...data }));
      return { prev };
    },
    onError:    (_, __, ctx) => qc.setQueryData(SETTINGS_KEY, ctx?.prev),
    onSettled:  () => qc.invalidateQueries({ queryKey: SETTINGS_KEY }),
  });

  // ── Debounced update ──────────────────────────────────────────────────────
  const updateSettings = useCallback((patch) => {
    // Instant optimistic update in cache
    qc.setQueryData(SETTINGS_KEY, old => ({ ...(old ?? SETTINGS_DEFAULTS), ...patch }));

    // Debounced persist
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      const current = qc.getQueryData(SETTINGS_KEY);
      saveMutation.mutate(current);
    }, DEBOUNCE_MS);
  }, [qc, saveMutation]);

  const saveNow = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    const current = qc.getQueryData(SETTINGS_KEY);
    return saveMutation.mutateAsync(current ?? SETTINGS_DEFAULTS);
  }, [qc, saveMutation]);

  // ── Float category helper ─────────────────────────────────────────────────
  const updateFloatCategory = useCallback((key, patch) => {
    updateSettings({
      float_categories: {
        ...(settings.float_categories ?? SETTINGS_DEFAULTS.float_categories),
        [key]: {
          ...(settings.float_categories?.[key] ?? {}),
          ...patch,
        },
      },
    });
  }, [settings, updateSettings]);

  return {
    settings,
    isLoading,
    isSaving:  saveMutation.isPending,
    updateSettings,
    updateFloatCategory,
    saveNow,

    // Convenience getters used in the calculator
    accountSize:          Number(settings.account_size)               || SETTINGS_DEFAULTS.account_size,
    riskAmount:           Number(settings.risk_amount)                || SETTINGS_DEFAULTS.risk_amount,
    positionSizingPct:    Number(settings.position_sizing_percent)    || SETTINGS_DEFAULTS.position_sizing_percent,
    defaultStopLossPct:   Number(settings.default_stop_loss_percent)  || SETTINGS_DEFAULTS.default_stop_loss_percent,
    targetProfitDollars:  Number(settings.target_profit_dollars)      || SETTINGS_DEFAULTS.target_profit_dollars,
    maxDollars:           Number(settings.max_dollars)                || 0,
    floatCategories:      settings.float_categories                   || SETTINGS_DEFAULTS.float_categories,
  };
}
