import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { db } from '@/lib/db';
import { useTrades } from '@/lib/hooks/useTrades';
import { useSettings } from '@/lib/context/SettingsContext';
import { buildDisciplineSnapshot } from '@/lib/calculations/discipline';
import { imageFileToDataUrl } from '@/components/journal/shared/media/imageUtils';
import { computeTradeSetupQuality } from '@/lib/calculations/trades';
import {
  getPlaybookEntryBySetupName,
  normalizePlaybookEntries,
} from '@/lib/playbook/utils';
import { useTradeForm } from './useTradeForm';
import { localToUTCISO, isValidExitTime } from '../utils/dateUtils';
import { calculatePnL } from '../utils/calculationUtils';

import { PLACEHOLDER_USER_ID as USER_ID } from '@/lib/constants';
import { DEFAULT_MISTAKES } from '@/lib/constants/mistakes';
import { DEFAULT_LEARNINGS } from '@/lib/constants/learnings';
import { DEFAULT_WHAT_WORKED } from '@/lib/constants/whatWorked';
import { getPrediction } from '@/lib/ml/winPredictor';
import { getTradePnL } from '@/lib/utils/tradeFields';
const SYMBOL_PATTERN = /^[A-Z]{1,5}$/;
const normalizeStrategyStepGrade = (value) => String(value ?? '').trim().toUpperCase();
const deriveFollowedFromGrade = (grade) => {
  const normalized = normalizeStrategyStepGrade(grade);
  if (!normalized) return null;
  if (['A++', 'A+', 'A', 'B'].includes(normalized)) return true;
  if (['C', 'D', 'F'].includes(normalized)) return false;
  return null;
};
const normalizeRelativeGradeMappings = (mappings) => (
  Array.isArray(mappings)
    ? mappings.map((mapping) => {
      if (mapping && typeof mapping === 'object' && !Array.isArray(mapping)) {
        const label = String(mapping.label ?? mapping.step ?? '').trim();
        const grade = normalizeStrategyStepGrade(mapping.grade);
        if (!label && !grade) return null;
        return {
          label,
          grade,
        };
      }

      const label = String(mapping ?? '').trim();
      if (!label) return null;
      return {
        label,
        grade: '',
      };
    }).filter(Boolean)
    : []
);

const normalizeStrategySteps = (steps) => (
  Array.isArray(steps)
    ? steps.map((step) => {
      if (step && typeof step === 'object' && !Array.isArray(step)) {
        const label = String(step.label ?? step.step ?? '').trim();
        if (!label) return null;
        return {
          label,
          grade: normalizeStrategyStepGrade(step.grade),
          relativeGrades: normalizeRelativeGradeMappings(
            step.relativeGrades
            ?? step.relative_grades
            ?? step.relatedGrades
            ?? step.related_grades
            ?? []
          ),
        };
      }

      const label = String(step ?? '').trim();
      if (!label) return null;
      return {
        label,
        grade: '',
        relativeGrades: [],
      };
    }).filter(Boolean)
    : []
);


const toStepLabelKey = (value) => String(value ?? '').trim().toLowerCase();

const normalizeStrategyStepResults = (results, stepDefinitions) => {
  const source = Array.isArray(results) ? results : [];
  const sourceByLabel = new Map();

  source.forEach((value) => {
    if (!value || typeof value !== 'object' || Array.isArray(value)) return;

    const stepKey = toStepLabelKey(value.step);
    if (!stepKey) return;
    if (!sourceByLabel.has(stepKey)) {
      sourceByLabel.set(stepKey, value);
    }
  });

  return stepDefinitions.map((stepDefinition, index) => {
    const stepLabel = String(stepDefinition?.label ?? stepDefinition ?? '').trim();
    const stepKey = toStepLabelKey(stepLabel);
    const value = (stepKey ? sourceByLabel.get(stepKey) : undefined) ?? source[index];
    const followed = value?.followed === true || value === true
      ? true
      : value?.followed === false || value === false
        ? false
        : null;
    const persistedGrade = normalizeStrategyStepGrade(value?.grade);
    const followedFromGrade = deriveFollowedFromGrade(persistedGrade);

    return {
      step: stepLabel,
      grade: persistedGrade || '',
      followed: followed ?? followedFromGrade ?? null,
    };
  });
};

export function useAddTradeModalController({ open, onSave, initialData }) {
  const [loading, setLoading] = useState(false);

  const { settings } = useSettings();
  const currentTier = settings?.account_tier || 'custom';
  const mistakeOptions = Array.isArray(settings?.mistakes) && settings.mistakes.length > 0
    ? settings.mistakes
    : DEFAULT_MISTAKES;
  const learningOptions = Array.isArray(settings?.learnings) && settings.learnings.length > 0
    ? settings.learnings
    : DEFAULT_LEARNINGS;
  const whatWorkedOptions = Array.isArray(settings?.what_worked_keywords) && settings.what_worked_keywords.length > 0
    ? settings.what_worked_keywords
    : DEFAULT_WHAT_WORKED;

  const { data: tierTrades = [] } = useTrades({
    filters: { account_tier: currentTier },
    enabled: open,
  });

  const disciplineSnapshot = useMemo(
    () => buildDisciplineSnapshot(tierTrades, settings),
    [tierTrades, settings]
  );

  const { data: presets = [] } = useQuery({
    queryKey: ['strategy-presets', USER_ID],
    queryFn: () => db.strategyPresets.list({ userId: USER_ID }),
    enabled: open,
  });

  const { formData, updateField, prepareForSubmission } = useTradeForm(initialData, USER_ID, open);

  // Pattern nudges — must come after useTradeForm so formData is in scope.
  const tradeNudges = useMemo(() => {
    if (!open || tierTrades.length < 5) return [];

    const nudges = [];
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);

    const sorted = [...tierTrades]
      .filter((t) => t.entry_time)
      .sort((a, b) => new Date(a.entry_time) - new Date(b.entry_time));

    const historical = sorted.filter((t) => new Date(t.entry_time) < todayStart);
    const todayLogged = sorted.filter((t) => new Date(t.entry_time) >= todayStart);
    const tradeNumToday = todayLogged.length + 1;

    // ── 1. Session-position degradation ─────────────────────────────────────
    if (tradeNumToday >= 3 && historical.length >= 15) {
      const byDay = {};
      historical.forEach((t) => {
        const day = new Date(t.entry_time).toDateString();
        if (!byDay[day]) byDay[day] = [];
        byDay[day].push(t);
      });

      const slots = { early: { w: 0, t: 0 }, late: { w: 0, t: 0 } };
      Object.values(byDay).forEach((dayTrades) => {
        dayTrades.forEach((t, idx) => {
          const bucket = idx < 2 ? 'early' : 'late';
          slots[bucket].t++;
          if (getTradePnL(t) > 0) slots[bucket].w++;
        });
      });

      if (slots.late.t >= 8 && slots.early.t >= 8) {
        const lateWR = Math.round((slots.late.w / slots.late.t) * 100);
        const earlyWR = Math.round((slots.early.w / slots.early.t) * 100);
        if (lateWR < earlyWR - 15) {
          nudges.push({
            id: 'session-position',
            level: 'warning',
            title: `Trade #${tradeNumToday} today`,
            message: `Your 3rd+ trades win ${lateWR}% vs ${earlyWR}% on your first two of the day. Is this setup genuinely A+ quality?`,
          });
        }
      }
    }

    // ── 2. Same-setup losing streak ──────────────────────────────────────────
    const currentSetup = formData.setup_type;
    if (currentSetup && currentSetup.toLowerCase() !== 'manual') {
      const setupTrades = sorted.filter((t) => t.setup_type === currentSetup);
      const recentSetup = setupTrades.slice(-3);
      if (recentSetup.length >= 2 && recentSetup.every((t) => getTradePnL(t) <= 0)) {
        nudges.push({
          id: 'setup-cold-streak',
          level: 'caution',
          title: `${currentSetup} on a cold streak`,
          message: `Your last ${recentSetup.length} "${currentSetup}" trades were losses. This setup may be misaligned with current conditions — confirm your full entry criteria.`,
        });
      }
    }

    // ── 3. Post-loss win-rate warning ────────────────────────────────────────
    const lastTrade = sorted[sorted.length - 1];
    if (lastTrade && getTradePnL(lastTrade) < 0) {
      let afterLossW = 0;
      let afterLossT = 0;
      for (let i = 1; i < historical.length; i++) {
        if (getTradePnL(historical[i - 1]) < 0) {
          afterLossT++;
          if (getTradePnL(historical[i]) > 0) afterLossW++;
        }
      }
      if (afterLossT >= 5) {
        const wr = Math.round((afterLossW / afterLossT) * 100);
        if (wr < 50) {
          nudges.push({
            id: 'post-loss',
            level: wr < 35 ? 'warning' : 'caution',
            title: 'Last trade was a loss',
            message: `Historically you win only ${wr}% on trades taken right after a loss. Pause and confirm this setup clears all your criteria before entering.`,
          });
        }
      }
    }

    return nudges;
  }, [open, tierTrades, formData.setup_type]);

  // Auto-rating — recomputes whenever the key criteria fields change.
  // Fires as a side-effect so it doesn't block render.
  useEffect(() => {
    if (!open) return;
    const hasSetup  = Boolean(formData.setup_type?.trim());
    const hasEntry  = Boolean(formData.entry_criteria_used?.trim());
    const hasSL     = Boolean(formData.stop_loss_used?.trim());
    const hasExit   = Boolean(formData.exit_used?.trim());
    const hasSLPrice = formData.stop_loss != null && String(formData.stop_loss).trim() !== '';
    const hasImprovements = Boolean(formData.reflection_answers?.improvements);

    let rating;
    if (hasEntry || hasSL || hasExit) {
      // Playbook path — all three playbook criteria available
      const allMet = hasEntry && hasSL && hasExit;
      if (allMet)                      rating = hasImprovements ? 4 : 5;
      else if ([hasEntry, hasSL, hasExit].filter(Boolean).length >= 2) rating = 3;
      else                             rating = 2;
    } else {
      // Non-playbook path — use setup + stop loss price
      if (!hasSetup)                   rating = 1;
      else if (!hasSLPrice)            rating = 2;
      else                             rating = hasImprovements ? 4 : 5;
    }

    updateField('overall_rating', rating);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    open,
    formData.setup_type,
    formData.entry_criteria_used,
    formData.stop_loss_used,
    formData.exit_used,
    formData.stop_loss,
    formData.reflection_answers?.improvements,
  ]);

  // ML win prediction — uses the same tierTrades, runs after tradeNudges so
  // the session-position context (todayLogged length) can be shared.
  const winPrediction = useMemo(() => {
    if (!open || tierTrades.length < 15) return null;
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    const sorted = [...tierTrades]
      .filter((t) => t.entry_time)
      .sort((a, b) => new Date(a.entry_time) - new Date(b.entry_time));
    const todayLogged = sorted.filter((t) => new Date(t.entry_time) >= todayStart);
    const lastTrade = sorted[sorted.length - 1];
    const priorWasLoss = lastTrade ? (lastTrade?.pnl ?? 0) < 0 : false;
    return getPrediction(tierTrades, {
      setup_type: formData.setup_type,
      entry_time: now.toISOString(),
      session_trade_number: todayLogged.length + 1,
      prior_was_loss: priorWasLoss,
      emotions: formData.emotions,
      float_category: formData.float_category,
      share_float_range: formData.share_float_range,
    });
  }, [open, tierTrades, formData.setup_type, formData.emotions, formData.float_category, formData.share_float_range]);

  const screenshotIds = formData.screenshots || [];
  const [uploading, setUploading] = useState(false);
  const [autoScreenshotSymbol, setAutoScreenshotSymbol] = useState(null);
  const autoFilledIdsRef = useRef(new Set());

  // Auto-reuse screenshots from an earlier same-symbol same-day trade.
  useEffect(() => {
    if (!open) {
      setAutoScreenshotSymbol(null);
      autoFilledIdsRef.current = new Set();
      return;
    }
    const sym = String(formData.symbol || '').trim().toUpperCase();
    if (!sym) {
      // Symbol cleared — remove previously auto-filled screenshots
      if (autoFilledIdsRef.current.size > 0) {
        const currentScreenshots = formData.screenshots || [];
        const hasOnlyAutoFilled = currentScreenshots.every((id) => autoFilledIdsRef.current.has(id));
        if (hasOnlyAutoFilled) updateField('screenshots', []);
        autoFilledIdsRef.current = new Set();
      }
      setAutoScreenshotSymbol(null);
      return;
    }
    if (sym === autoScreenshotSymbol) return;

    const currentScreenshots = formData.screenshots || [];
    const hasManualScreenshots = currentScreenshots.some((id) => !autoFilledIdsRef.current.has(id));
    if (hasManualScreenshots) return;

    const targetDay = formData.entry_time
      ? new Date(formData.entry_time).toDateString()
      : new Date().toDateString();

    const matches = tierTrades
      .filter((t) =>
        t.id !== initialData?.id &&
        String(t.symbol || '').toUpperCase() === sym &&
        t.entry_time &&
        new Date(t.entry_time).toDateString() === targetDay &&
        Array.isArray(t.screenshots) && t.screenshots.length > 0
      )
      .sort((a, b) => new Date(b.entry_time) - new Date(a.entry_time));

    if (matches.length > 0) {
      const ids = matches[0].screenshots
        .map((s) => (typeof s === 'object' ? s.id : s))
        .filter(Boolean);
      if (ids.length > 0) {
        updateField('screenshots', ids);
        autoFilledIdsRef.current = new Set(ids);
        setAutoScreenshotSymbol(sym);
        return;
      }
    }

    // No match — clear any previously auto-filled screenshots for the old symbol
    if (currentScreenshots.length > 0 && autoFilledIdsRef.current.size > 0) {
      const hasOnlyAutoFilled = currentScreenshots.every((id) => autoFilledIdsRef.current.has(id));
      if (hasOnlyAutoFilled) updateField('screenshots', []);
      autoFilledIdsRef.current = new Set();
    }
    setAutoScreenshotSymbol(null);
  // formData.screenshots and tierTrades intentionally omitted — read as snapshot to prevent loops
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, formData.symbol, formData.entry_time, autoScreenshotSymbol]);

  const handleUploadFiles = useCallback(async (files) => {
    setUploading(true);
    try {
      const dataUrls = await Promise.all(files.map((f) => imageFileToDataUrl(f)));
      const currentScreenshots = formData.screenshots || [];
      const merged = [...currentScreenshots, ...dataUrls];
      updateField('screenshots', merged);
      return dataUrls;
    } finally {
      setUploading(false);
    }
  }, [formData.screenshots, updateField]);

  const handleRemoveById = useCallback((id) => {
    const currentScreenshots = formData.screenshots || [];
    updateField('screenshots', currentScreenshots.filter((s) => s !== id));
  }, [formData.screenshots, updateField]);

  const handleBreakoutChecklistChange = useCallback((stepKey, itemKey, value) => {
    const current = formData.breakout_checklist || {};
    const currentStep = current[stepKey] || {};
    updateField('breakout_checklist', {
      ...current,
      [stepKey]: {
        ...currentStep,
        [itemKey]: value,
      },
    });
  }, [formData.breakout_checklist, updateField]);

  const handleBreakoutMetaChange = useCallback((key, value) => {
    const current = formData.breakout_checklist || {};
    updateField('breakout_checklist', {
      ...current,
      [key]: value,
    });
  }, [formData.breakout_checklist, updateField]);

  const { pnl: calculatedPnl } = useMemo(() => calculatePnL({
    entryPrice: formData.entry_price,
    exitPrice: formData.exit_price,
    positionSize: formData.position_size,
    direction: formData.direction,
    fee: formData.fee,
  }), [formData.direction, formData.entry_price, formData.exit_price, formData.fee, formData.position_size]);

  const pnlValue = Number(calculatedPnl) || 0;

  const playbookEntries = useMemo(
    () => normalizePlaybookEntries(settings?.strategy_playbook),
    [settings?.strategy_playbook]
  );

  const setupTypeOptions = useMemo(() => {
    const seen = new Set();
    const options = playbookEntries
      .filter((entry) => entry.is_active && String(entry.name || '').trim())
      .map((entry) => entry.name)
      .filter((name) => {
        const key = name.toLowerCase();
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });

    const selectedSetup = String(formData.setup_type || '').trim();
    if (!selectedSetup || selectedSetup.toLowerCase() === 'manual') return options;
    if (options.some((o) => o.toLowerCase() === selectedSetup.toLowerCase())) return options;
    return [...options, selectedSetup];
  }, [formData.setup_type, playbookEntries]);

  const selectedPlaybookEntry = useMemo(
    () => getPlaybookEntryBySetupName(playbookEntries, formData.setup_type),
    [formData.setup_type, playbookEntries]
  );

  const strategyStepsForSetup = useMemo(
    () => normalizeStrategySteps(selectedPlaybookEntry?.steps ?? []),
    [selectedPlaybookEntry]
  );

  const strategyStepResults = useMemo(
    () => normalizeStrategyStepResults(formData.strategy_step_results, strategyStepsForSetup),
    [formData.strategy_step_results, strategyStepsForSetup]
  );

  useEffect(() => {
    const current = Array.isArray(formData.strategy_step_results)
      ? formData.strategy_step_results
      : [];
    const isSame = current.length === strategyStepResults.length &&
      current.every((value, index) => {
        const nextValue = strategyStepResults[index];
        const currentStep = String(value?.step ?? '').trim();
        const currentFollowed = value?.followed === true
          ? true
          : value?.followed === false
            ? false
            : value === true
              ? true
              : value === false
                ? false
                : null;

        const currentGrade = normalizeStrategyStepGrade(value?.grade);
        const nextGrade = normalizeStrategyStepGrade(nextValue?.grade);
        return (
          currentStep === nextValue?.step
          && currentFollowed === nextValue?.followed
          && currentGrade === nextGrade
        );
      });

    if (isSame) return;
    updateField('strategy_step_results', strategyStepResults);
  }, [formData.strategy_step_results, strategyStepResults, updateField]);

  useEffect(() => {
    const entryPrice = Number(formData.entry_price);
    const stopLoss = Number(formData.stop_loss);
    const positionSize = Number(formData.position_size);
    const estimatedRisk = (
      Number.isFinite(entryPrice)
      && Number.isFinite(stopLoss)
      && Number.isFinite(positionSize)
      && positionSize > 0
    )
      ? Math.abs(entryPrice - stopLoss) * positionSize
      : Number(formData.risk_amount);

    const quality = computeTradeSetupQuality(
      {
        followed_plan: formData.followed_plan,
        breakout_checklist: formData.breakout_checklist,
        entry_price: entryPrice,
        stop_loss: stopLoss,
        quantity: Number.isFinite(positionSize) && positionSize > 0 ? positionSize : formData.quantity,
        risk_amount: Number.isFinite(estimatedRisk) ? estimatedRisk : formData.risk_amount,
        strategy_step_results: strategyStepResults,
      },
      { riskLimit: settings?.risk_amount }
    );

    const nextGrade = quality?.grade || '';
    const nextScore = Number.isFinite(quality?.score) ? Math.round(quality.score) : null;
    const currentScore = Number.isFinite(Number(formData.setup_quality_score))
      ? Math.round(Number(formData.setup_quality_score))
      : null;

    if (formData.setup_grade !== nextGrade) {
      updateField('setup_grade', nextGrade);
    }

    if (currentScore !== nextScore) {
      updateField('setup_quality_score', nextScore);
    }
  }, [
    formData.breakout_checklist,
    formData.entry_price,
    formData.followed_plan,
    formData.position_size,
    formData.quantity,
    formData.risk_amount,
    formData.setup_grade,
    formData.setup_quality_score,
    formData.stop_loss,
    settings?.risk_amount,
    strategyStepResults,
    updateField,
  ]);

  const handleReflectionChange = useCallback((key, value) => {
    updateField('reflection_answers', {
      ...(formData.reflection_answers || {}),
      [key]: value,
    });
  }, [formData.reflection_answers, updateField]);

  const handleStrategyStepResultChange = useCallback((index, value) => {
    const next = normalizeStrategyStepResults(
      formData.strategy_step_results,
      strategyStepsForSetup
    );

    const gradeValue = normalizeStrategyStepGrade(value?.grade);
    const hasGradeUpdate = value && typeof value === 'object' && !Array.isArray(value)
      && Object.prototype.hasOwnProperty.call(value, 'grade');
    const followedFromInput = value === true
      ? true
      : value === false
        ? false
        : value?.followed === true
          ? true
          : value?.followed === false
            ? false
            : null;
    const derivedFromGrade = deriveFollowedFromGrade(gradeValue);
    next[index] = {
      ...next[index],
      ...(value && typeof value === 'object' && !Array.isArray(value)
        ? {
            ...(hasGradeUpdate ? { grade: gradeValue } : {}),
          }
        : {}),
      followed: followedFromInput ?? (hasGradeUpdate ? derivedFromGrade : (next[index]?.followed ?? null)) ?? null,
    };
    updateField('strategy_step_results', next);
  }, [formData.strategy_step_results, strategyStepsForSetup, updateField]);

  const handleSubmit = useCallback(async (event) => {
    event.preventDefault();

    const symbol = String(formData.symbol || '').trim();
    if (symbol && !SYMBOL_PATTERN.test(symbol)) {
      toast.error('Trade validation failed: symbol: Must be a valid stock symbol (1-5 uppercase letters)');
      return;
    }

    if (formData.exit_time && !isValidExitTime(formData.entry_time, formData.exit_time)) {
      alert('Exit time must be after entry time');
      return;
    }

    setLoading(true);

    try {
      const submissionData = {
        ...prepareForSubmission(),
        screenshots: screenshotIds,
      };

      submissionData.entry_time = localToUTCISO(formData.entry_time);
      submissionData.exit_time = formData.exit_time ? localToUTCISO(formData.exit_time) : null;

      await onSave(submissionData);

      const newTradePnl = Number(submissionData.pnl) || 0;
      const isLoggedToday = new Date(submissionData.entry_time).toDateString() === new Date().toDateString();

      if (newTradePnl < 0 && isLoggedToday) {
        const maxDailyLoss = Math.abs(Number(disciplineSnapshot?.metrics?.maxDailyLoss) || 0);
        const todayPnL = Number(disciplineSnapshot?.metrics?.todayPnL) || 0;
        const projectedTodayPnL = todayPnL + newTradePnl;

        if (maxDailyLoss > 0 && Math.abs(projectedTodayPnL) >= maxDailyLoss) {
          toast.error(
            `Daily loss limit reached: $${Math.abs(projectedTodayPnL).toFixed(0)} of $${maxDailyLoss.toFixed(0)} max daily loss. Consider stepping away.`,
            { duration: 8000 }
          );
        }
      }
    } catch {
      // Parent handler (Journal) surfaces save errors via toast.
    } finally {
      setLoading(false);
    }
  }, [formData, onSave, prepareForSubmission, screenshotIds, disciplineSnapshot]);

  const symbolError = useMemo(() => {
    const symbol = String(formData.symbol || '').trim();
    if (!symbol) return null;
    return SYMBOL_PATTERN.test(symbol)
      ? null
      : 'Trade validation failed: symbol: Must be a valid stock symbol (1-5 uppercase letters)';
  }, [formData.symbol]);

  return {
    loading,
    uploading,
    autoScreenshotSymbol,
    presets,
    formData,
    screenshotIds,
    pnlValue,
    setupTypeOptions,
    mistakeOptions,
    learningOptions,
    whatWorkedOptions,
    winPrediction,
    selectedPlaybookEntry,
    strategyStepsForSetup,
    strategyStepResults,
    tradeNudges,
    symbolError,
    updateField,
    handleUploadFiles,
    handleRemoveById,
    handleBreakoutChecklistChange,
    handleBreakoutMetaChange,
    handleReflectionChange,
    handleStrategyStepResultChange,
    handleSubmit,
  };
}
