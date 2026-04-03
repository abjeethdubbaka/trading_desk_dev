import { useCallback, useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { db } from '@/lib/db';
import { useTrades } from '@/lib/hooks/useTrades';
import { useSettings } from '@/lib/context/SettingsContext';
import { buildDisciplineSnapshot } from '@/lib/calculations/discipline';
import { useMediaMutation } from '@/lib/hooks/useCalcHistory';
import { syncRuleUsageCounts } from '@/components/dosanddonts/storage';
import { buildTradeNotes } from '@/components/journal/utils/notes';
import {
  buildStrategyEngineSnapshot,
  computeTradeSetupQuality,
} from '@/lib/calculations/trades';
import { useTradeForm } from './useTradeForm';
import { localToUTCISO, isValidExitTime } from '../utils/dateUtils';
import { calculatePnL } from '../utils/calculationUtils';
import { buildSetupTypeOptions } from '../constants/tradeConstants';

const USER_ID = 'user-123';
const SYMBOL_PATTERN = /^[A-Z]{1,5}$/;
const ALERT_PRIORITIES = ['warning', 'focus'];
const normalizeStrategySteps = (steps) => (
  Array.isArray(steps)
    ? steps.map((step) => String(step ?? '').trim()).filter(Boolean)
    : []
);

const resolveStrategyStepsForSetup = (stepsBySetup, setupType, fallbackSteps = []) => {
  const normalizedSetup = String(setupType || '').trim().toLowerCase();
  if (!normalizedSetup) return normalizeStrategySteps(fallbackSteps);

  const map = stepsBySetup && typeof stepsBySetup === 'object' && !Array.isArray(stepsBySetup)
    ? stepsBySetup
    : {};

  const matchedKey = Object.keys(map).find(
    (key) => String(key || '').trim().toLowerCase() === normalizedSetup
  );

  if (!matchedKey) return normalizeStrategySteps(fallbackSteps);
  return normalizeStrategySteps(map[matchedKey]);
};

const normalizeStrategyStepResults = (results, stepLabels) => {
  const source = Array.isArray(results) ? results : [];

  return stepLabels.map((stepLabel, index) => {
    const value = source[index];
    const followed = value?.followed === true || value === true
      ? true
      : value?.followed === false || value === false
        ? false
        : null;

    return {
      step: String(stepLabel ?? '').trim(),
      followed,
    };
  });
};

export function useAddTradeModalController({ open, onSave, initialData }) {
  const [loading, setLoading] = useState(false);

  const { settings } = useSettings();
  const currentTier = settings?.account_tier || 'custom';

  const { data: tierTrades = [] } = useTrades({
    filters: { account_tier: currentTier },
    enabled: open,
  });

  const disciplineSnapshot = useMemo(
    () => buildDisciplineSnapshot(tierTrades, settings),
    [tierTrades, settings]
  );

  const preTradeAlert = useMemo(
    () => disciplineSnapshot?.alerts?.find((alert) => ALERT_PRIORITIES.includes(alert.type)) || null,
    [disciplineSnapshot]
  );

  const { data: presets = [] } = useQuery({
    queryKey: ['strategy-presets', USER_ID],
    queryFn: () => db.strategyPresets.list({ userId: USER_ID }),
    enabled: open,
  });

  const { formData, updateField, prepareForSubmission } = useTradeForm(initialData, USER_ID);
  const { uploadFile, deleteMedia, isUploading: uploading } = useMediaMutation();
  const screenshotIds = formData.screenshots || [];

  const handleUploadFiles = useCallback(async (files) => {
    const uploadPromises = files.map((file) => uploadFile({ file, metadata: { media_type: 'screenshot' } }));
    const results = await Promise.all(uploadPromises);
    const newIds = results.map((result) => result.id);

    const currentScreenshots = formData.screenshots || [];
    const merged = [...new Set([...currentScreenshots, ...newIds])];
    updateField('screenshots', merged);

    return newIds;
  }, [formData.screenshots, updateField, uploadFile]);

  const handleRemoveById = useCallback(async (id) => {
    await deleteMedia(id);

    const currentScreenshots = formData.screenshots || [];
    const updatedScreenshots = currentScreenshots.filter((screenshotId) => screenshotId !== id);
    updateField('screenshots', updatedScreenshots);
  }, [deleteMedia, formData.screenshots, updateField]);

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

  const selectedRuleIds = Array.isArray(formData.dos_donts_rule_ids)
    ? formData.dos_donts_rule_ids
    : [];

  const setupTypeOptions = useMemo(() => {
    const configuredSetupTypes = settings?.journal_preferences?.default_setup_types;
    const options = buildSetupTypeOptions(configuredSetupTypes);
    const selectedSetup = String(formData.setup_type || '').trim();

    if (!selectedSetup || selectedSetup.toLowerCase() === 'manual') return options;
    if (options.some((option) => option.toLowerCase() === selectedSetup.toLowerCase())) return options;

    return [...options, selectedSetup];
  }, [formData.setup_type, settings?.journal_preferences?.default_setup_types]);

  const strategyStepsForSetup = useMemo(() => {
    return resolveStrategyStepsForSetup(
      settings?.strategy_steps_by_setup,
      formData.setup_type,
      settings?.strategy_steps
    );
  }, [
    formData.setup_type,
    settings?.strategy_steps,
    settings?.strategy_steps_by_setup,
  ]);

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

        return currentStep === nextValue?.step && currentFollowed === nextValue?.followed;
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

  const suggestionTrade = useMemo(() => {
    const noteText = buildTradeNotes({
      reflectionAnswers: formData.reflection_answers,
      notes: formData.notes,
    });

    return {
      ...formData,
      setup_type: formData.setup_type,
      notes: noteText,
      pnl: pnlValue,
      emotions: formData.emotions ? [formData.emotions] : [],
    };
  }, [formData, pnlValue]);

  const strategySnapshot = useMemo(
    () => buildStrategyEngineSnapshot(tierTrades, settings, {
      candidateSetup: formData.setup_type,
      candidateEntryTime: formData.entry_time,
    }),
    [formData.entry_time, formData.setup_type, settings, tierTrades]
  );
  const strategyRecommendation = strategySnapshot?.candidate || null;
  const strategyRecommendedNow = Array.isArray(strategySnapshot?.recommendedNow)
    ? strategySnapshot.recommendedNow
    : [];

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
    next[index] = {
      ...next[index],
      followed: value === true,
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

      const previousRuleIds = Array.isArray(initialData?.dos_donts_rule_ids)
        ? initialData.dos_donts_rule_ids
        : [];
      const nextRuleIds = Array.isArray(submissionData.dos_donts_rule_ids)
        ? submissionData.dos_donts_rule_ids
        : [];

      await onSave(submissionData);

      const usageSync = syncRuleUsageCounts({
        previousRuleIds,
        nextRuleIds,
      });

      if (!usageSync?.ok) {
        toast.warning('Trade was saved, but rule usage count could not be updated.');
      }
    } catch {
      // Parent handler (Journal) already surfaces save errors via toast.
    } finally {
      setLoading(false);
    }
  }, [formData, initialData?.dos_donts_rule_ids, onSave, prepareForSubmission, screenshotIds]);

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
    presets,
    preTradeAlert,
    formData,
    screenshotIds,
    pnlValue,
    selectedRuleIds,
    suggestionTrade,
    strategyRecommendation,
    strategyRecommendedNow,
    setupTypeOptions,
    strategyStepsForSetup,
    strategyStepResults,
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
