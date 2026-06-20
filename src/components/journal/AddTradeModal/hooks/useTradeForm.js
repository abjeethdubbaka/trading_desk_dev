import { useState, useEffect, useMemo, useCallback } from 'react';
import { PLACEHOLDER_USER_ID } from '@/lib/constants';
import { calculatePnL } from '../utils/calculationUtils';
import { getCurrentLocalDateTime, utcToLocalDateTime } from '../utils/dateUtils';
import { buildTradeNotes, stripCalculatorAutoNote } from '../../utils/notes';

const DEFAULT_EMOTION = 'neutral';
const parseOptionalPositiveNumber = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
};

const normalizeEmotionValue = (value) => {
  if (Array.isArray(value)) {
    const firstValue = value.find((item) => typeof item === 'string' && item.trim());
    return firstValue ? firstValue.trim() : DEFAULT_EMOTION;
  }

  if (typeof value === 'string' && value.trim()) {
    return value.trim();
  }

  return DEFAULT_EMOTION;
};

const normalizeStrategyStepFollowed = (value) => {
  if (value?.followed === true || value === true) return true;
  if (value?.followed === false || value === false) return false;
  return null;
};

const normalizeStrategyStepResults = (results) => (
  Array.isArray(results)
    ? results.map((value) => ({
        step:
          value && typeof value === 'object' && !Array.isArray(value)
            ? String(value.step || '').trim()
            : '',
        grade:
          value && typeof value === 'object' && !Array.isArray(value)
            ? String(value.grade ?? '').trim().toUpperCase()
            : '',
        followed: normalizeStrategyStepFollowed(value),
      }))
    : []
);

export const useTradeForm = (initialData, userId = PLACEHOLDER_USER_ID) => {
  const getDefaultReflectionAnswers = () => ({
    what_went_wrong: '',
    what_learned: ''
  });

  const defaultBreakoutChecklist = {
    step1Time: '',
    step1: {
      smoothVWAPPullback: false,
      controlledRedCandles: false,
      holdsAboveVWAP: false,
      lowerWicksDipBuyers: false,
      notes: ''
    },
    step2DurationMins: '',
    step2: {
      tightRange3to6Candles: false,
      volumeDriesUp: false,
      higherLowsForming: false,
      vwapSlopesUpward: false,
      notes: ''
    },
    step3Time: '',
    step3: {
      breakAboveBaseHigh: false,
      volumeIncreases: false,
      vwapRising: false,
      notes: ''
    }
  };

  const [formData, setFormData] = useState({
    symbol: '',
    direction: 'long',
    entry_price: '',
    exit_price: '',
    stop_loss: '',
    position_size: '',
    entry_time: getCurrentLocalDateTime(),
    exit_time: '',
    fee: '',
    setup_type: '',
    custom_setup_type: '',
    notes: '',
    emotions: DEFAULT_EMOTION,
    followed_plan: true,
    mistakes: [],
    lessons: '',
    reflection_answers: getDefaultReflectionAnswers(),
    setup_grade: '',
    setup_quality_score: null,
    breakout_checklist: defaultBreakoutChecklist,
    strategy_step_results: [],
    screenshots: [],
    trade_plan_id: null,
    strategy_preset_id: null,
    dos_donts_rule_ids: [],
    risk_amount: null,
    target_price: null,
    risk_reward_ratio: null,
    share_float: null,
    float_category: null,
    share_float_range: null,
    tags: [],
  });

  // Initialize form with initial data - only run when initialData actually changes
  const initialFormData = useMemo(() => {
    if (!initialData) return null;
    
    const entryTimeLocal = utcToLocalDateTime(initialData.entry_time);
    const exitTimeLocal = utcToLocalDateTime(initialData.exit_time);
    
    // Handle screenshots - extract IDs if they're objects
    const screenshotIds = initialData.screenshots 
      ? Array.isArray(initialData.screenshots) 
        ? initialData.screenshots.map(s => typeof s === 'object' ? s.id : s).filter(Boolean)
        : []
      : [];
    
    return {
      symbol: initialData.symbol || '',
      direction: initialData.direction || 'long',
      entry_price: initialData.entry_price?.toString() || '',
      exit_price: (() => {
        const parsed = parseOptionalPositiveNumber(initialData.exit_price);
        return parsed == null ? '' : parsed.toString();
      })(),
      stop_loss: initialData.stop_loss?.toString() || '',
      position_size: (initialData.position_size ?? initialData.quantity)?.toString() || '',
      entry_time: entryTimeLocal || getCurrentLocalDateTime(),
      exit_time: exitTimeLocal || '',
      fee: (initialData.fee ?? initialData.commission)?.toString() || '',
      setup_type: initialData.setup_type || '',
      custom_setup_type: initialData.custom_setup_type || '',
      notes: stripCalculatorAutoNote(initialData.notes),
      emotions: normalizeEmotionValue(initialData.emotions),
      followed_plan: initialData.followed_plan ?? true,
      mistakes: initialData.mistakes || [],
      lessons: initialData.lessons || '',
      reflection_answers: {
        ...getDefaultReflectionAnswers(),
        ...(initialData.reflection_answers || {})
      },
      setup_grade: initialData.setup_grade || '',
      setup_quality_score: Number.isFinite(Number(initialData.setup_quality_score))
        ? Number(initialData.setup_quality_score)
        : null,
      breakout_checklist: {
        ...defaultBreakoutChecklist,
        ...(initialData.breakout_checklist || {}),
        step1: {
          ...defaultBreakoutChecklist.step1,
          ...(initialData.breakout_checklist?.step1 || {})
        },
        step2: {
          ...defaultBreakoutChecklist.step2,
          ...(initialData.breakout_checklist?.step2 || {})
        },
        step3: {
          ...defaultBreakoutChecklist.step3,
          ...(initialData.breakout_checklist?.step3 || {})
        }
      },
      strategy_step_results: Array.isArray(initialData.strategy_step_results)
        ? normalizeStrategyStepResults(initialData.strategy_step_results)
        : [],
      screenshots: screenshotIds,
      trade_plan_id: initialData.trade_plan_id || null,
      strategy_preset_id: initialData.strategy_preset_id || null,
      dos_donts_rule_ids: Array.isArray(initialData.dos_donts_rule_ids)
        ? [...new Set(initialData.dos_donts_rule_ids.map((id) => String(id || '').trim()).filter(Boolean))]
        : [],
      risk_amount: Number.isFinite(Number(initialData.risk_amount))
        ? Number(initialData.risk_amount)
        : null,
      target_price: parseOptionalPositiveNumber(initialData.target_price),
      risk_reward_ratio: Number.isFinite(Number(initialData.risk_reward_ratio))
        ? Number(initialData.risk_reward_ratio)
        : null,
      share_float: Number.isFinite(Number(initialData.share_float))
        ? Math.round(Number(initialData.share_float))
        : null,
      float_category: initialData.float_category || null,
      share_float_range: initialData.share_float_range || null,
      tags: Array.isArray(initialData.tags) ? [...initialData.tags] : [],
    };
  }, [initialData?.id]); // Only depend on the ID, not the whole object

  // Apply initial form data when it changes
  useEffect(() => {
    if (initialFormData) {
      setFormData(initialFormData);
      return;
    }

    setFormData({
      symbol: '',
      direction: 'long',
      entry_price: '',
      exit_price: '',
      stop_loss: '',
      position_size: '',
      entry_time: getCurrentLocalDateTime(),
      exit_time: '',
      fee: '',
      setup_type: '',
      custom_setup_type: '',
      notes: '',
      emotions: DEFAULT_EMOTION,
      followed_plan: true,
      mistakes: [],
      lessons: '',
      reflection_answers: getDefaultReflectionAnswers(),
      setup_grade: '',
      setup_quality_score: null,
      breakout_checklist: defaultBreakoutChecklist,
      strategy_step_results: [],
      screenshots: [],
      trade_plan_id: null,
      strategy_preset_id: null,
      dos_donts_rule_ids: [],
      risk_amount: null,
      target_price: null,
      risk_reward_ratio: null,
      share_float: null,
      float_category: null,
      share_float_range: null,
      tags: [],
    });
  }, [initialFormData]);

  const updateField = useCallback((field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  }, []);

  const resetForm = useCallback(() => {
    setFormData({
      symbol: '',
      direction: 'long',
      entry_price: '',
      exit_price: '',
      stop_loss: '',
      position_size: '',
      entry_time: getCurrentLocalDateTime(),
      exit_time: '',
      fee: '',
      setup_type: '',
      custom_setup_type: '',
      notes: '',
      emotions: DEFAULT_EMOTION,
      followed_plan: true,
      mistakes: [],
      lessons: '',
      reflection_answers: getDefaultReflectionAnswers(),
      setup_grade: '',
      setup_quality_score: null,
      breakout_checklist: defaultBreakoutChecklist,
      strategy_step_results: [],
      screenshots: [],
      trade_plan_id: null,
      strategy_preset_id: null,
      dos_donts_rule_ids: [],
      risk_amount: null,
      target_price: null,
      risk_reward_ratio: null,
      share_float: null,
      float_category: null,
      share_float_range: null,
      tags: [],
    });
  }, []);

  const prepareForSubmission = useCallback(() => {
    // Calculate final values for submission
    const { pnl, pnlPercent, rMultiple } = calculatePnL({
      entryPrice: formData.entry_price,
      exitPrice: formData.exit_price,
      stopLoss: formData.stop_loss,
      positionSize: formData.position_size,
      direction: formData.direction,
      fee: formData.fee
    });

    const normalizedEmotion = normalizeEmotionValue(formData.emotions);
    const normalizedExitPrice = parseOptionalPositiveNumber(formData.exit_price);
    const normalizedTargetPrice = parseOptionalPositiveNumber(formData.target_price);

    const reflectionAnswers = formData.reflection_answers || {};
    const normalizedReflectionAnswers = {
      what_went_wrong: String(reflectionAnswers.what_went_wrong || '').trim(),
      what_learned: String(reflectionAnswers.what_learned || '').trim(),
      outcome:
        pnl < 0 ? 'loss' :
        pnl > 0 ? 'profit' :
        'neutral'
    };
    const preservedNotes = stripCalculatorAutoNote(formData.notes);
    const notesFromReflection = buildTradeNotes({
      reflectionAnswers: normalizedReflectionAnswers,
      notes: preservedNotes,
    });
    const strategyStepResults = Array.isArray(formData.strategy_step_results)
      ? normalizeStrategyStepResults(formData.strategy_step_results)
      : [];

    const submissionData = {
      ...formData,
      direction: formData.direction,
      symbol: formData.symbol.toUpperCase().trim(),
      entry_price: parseFloat(formData.entry_price) || 0,
      exit_price: normalizedExitPrice,
      stop_loss: formData.stop_loss ? parseFloat(formData.stop_loss) : null,
      position_size: parseInt(formData.position_size, 10) || 0,
      quantity: parseInt(formData.position_size, 10) || 0, // Map position_size to quantity
      pnl,
      pnl_percent: pnlPercent,
      r_multiple: rMultiple,
      fee: formData.fee ? parseFloat(formData.fee) : null,
      commission: formData.fee ? parseFloat(formData.fee) : null,
      user_id: userId,
      mistakes: formData.mistakes.length > 0 ? formData.mistakes : null,
      lessons: formData.lessons || null,
      screenshots: formData.screenshots.length > 0 ? formData.screenshots : null,
      notes: notesFromReflection,
      emotions: normalizedEmotion ? [normalizedEmotion] : [],
      reflection_answers: normalizedReflectionAnswers,
      setup_quality_score: Number.isFinite(Number(formData.setup_quality_score))
        ? Math.round(Number(formData.setup_quality_score))
        : null,
      strategy_step_results: strategyStepResults,
      trade_plan_id: formData.trade_plan_id || null,
      strategy_preset_id: formData.strategy_preset_id || null,
      dos_donts_rule_ids: Array.isArray(formData.dos_donts_rule_ids)
        ? [...new Set(formData.dos_donts_rule_ids.map((id) => String(id || '').trim()).filter(Boolean))]
        : [],
      risk_amount: Number.isFinite(Number(formData.risk_amount))
        ? Number(formData.risk_amount)
        : null,
      target_price: normalizedTargetPrice,
      risk_reward_ratio: Number.isFinite(Number(formData.risk_reward_ratio))
        ? Number(formData.risk_reward_ratio)
        : null,
      share_float: Number.isFinite(Number(formData.share_float))
        ? Math.round(Number(formData.share_float))
        : null,
      float_category: formData.float_category ? String(formData.float_category).trim() : null,
      share_float_range: formData.share_float_range ? String(formData.share_float_range).trim() : null,
      // Setup type is selected from configured strategy setups.
      setup_type: formData.setup_type
      // Note: entry_time and exit_time are handled in the main component
    };

    return submissionData;
  }, [formData, userId]);

  return {
    formData,
    updateField,
    resetForm,
    prepareForSubmission
  };
};


