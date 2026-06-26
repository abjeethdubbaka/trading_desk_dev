import { useCallback, useEffect, useMemo, useState } from 'react';
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
import { DEFAULT_EXIT_REASONS } from '@/lib/constants/exitReasons';
import { DEFAULT_MARKET_ENVIRONMENTS } from '@/lib/constants/marketEnvironments';
import { DEFAULT_STOP_LOSS_REASONS } from '@/lib/constants/stopLossReasons';
import { DEFAULT_MISTAKES } from '@/lib/constants/mistakes';
import { DEFAULT_LEARNINGS } from '@/lib/constants/learnings';
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
  const exitReasonOptions = Array.isArray(settings?.exit_reasons) && settings.exit_reasons.length > 0
    ? settings.exit_reasons
    : DEFAULT_EXIT_REASONS;
  const marketEnvironmentOptions = Array.isArray(settings?.market_environments) && settings.market_environments.length > 0
    ? settings.market_environments
    : DEFAULT_MARKET_ENVIRONMENTS;
  const stopLossReasonOptions = Array.isArray(settings?.stop_loss_reasons) && settings.stop_loss_reasons.length > 0
    ? settings.stop_loss_reasons
    : DEFAULT_STOP_LOSS_REASONS;
  const mistakeOptions = Array.isArray(settings?.mistakes) && settings.mistakes.length > 0
    ? settings.mistakes
    : DEFAULT_MISTAKES;
  const learningOptions = Array.isArray(settings?.learnings) && settings.learnings.length > 0
    ? settings.learnings
    : DEFAULT_LEARNINGS;

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

  const defaultTags = useMemo(
    () => (Array.isArray(settings?.default_tags) ? settings.default_tags : []),
     
    [JSON.stringify(settings?.default_tags)]
  );

  const { formData, updateField, prepareForSubmission } = useTradeForm(initialData, USER_ID, defaultTags, open);
  const screenshotIds = formData.screenshots || [];
  const [uploading, setUploading] = useState(false);

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
    presets,
    formData,
    screenshotIds,
    pnlValue,
    setupTypeOptions,
    exitReasonOptions,
    marketEnvironmentOptions,
    stopLossReasonOptions,
    mistakeOptions,
    learningOptions,
    selectedPlaybookEntry,
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
