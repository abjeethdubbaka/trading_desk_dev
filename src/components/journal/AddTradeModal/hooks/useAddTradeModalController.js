import { useCallback, useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { db } from '@/lib/db';
import { useTrades } from '@/lib/hooks/useTrades';
import { useSettings } from '@/lib/context/SettingsContext';
import { buildDisciplineSnapshot } from '@/lib/calculations/discipline';
import { useMediaMutation } from '@/lib/hooks/useCalcHistory';
import { syncRuleUsageCounts } from '@/components/dosanddonts/storage';
import { useTradeForm } from './useTradeForm';
import { localToUTCISO, isValidExitTime } from '../utils/dateUtils';
import { calculatePnL } from '../utils/calculationUtils';
import { getAutoSetupGrade } from '../utils/setupGrade';

const USER_ID = 'user-123';
const SYMBOL_PATTERN = /^[A-Z]{1,5}$/;
const ALERT_PRIORITIES = ['warning', 'focus'];

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

  useEffect(() => {
    const isVWAPPullback = (formData.setup_type || '').toLowerCase().trim() === 'vwap pullback';
    if (!isVWAPPullback) return;

    const nextGrade = getAutoSetupGrade(formData.breakout_checklist);
    if (formData.setup_grade !== nextGrade) {
      updateField('setup_grade', nextGrade);
    }
  }, [formData.breakout_checklist, formData.setup_grade, formData.setup_type, updateField]);

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

  const suggestionTrade = useMemo(() => {
    const setupType = formData.setup_type === 'Manual'
      ? formData.custom_setup_type
      : formData.setup_type;
    const reflection = formData.reflection_answers || {};
    const noteText = [
      reflection.what_went_wrong,
      reflection.what_learned,
    ]
      .map((value) => String(value || '').trim())
      .filter(Boolean)
      .join('. ');

    return {
      ...formData,
      setup_type: setupType,
      notes: noteText,
      pnl: pnlValue,
      emotions: formData.emotions ? [formData.emotions] : [],
    };
  }, [formData, pnlValue]);

  const handleReflectionChange = useCallback((key, value) => {
    updateField('reflection_answers', {
      ...(formData.reflection_answers || {}),
      [key]: value,
    });
  }, [formData.reflection_answers, updateField]);

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
    } catch (error) {
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
    symbolError,
    updateField,
    handleUploadFiles,
    handleRemoveById,
    handleBreakoutChecklistChange,
    handleBreakoutMetaChange,
    handleReflectionChange,
    handleSubmit,
  };
}
