import { useState, useEffect, useMemo, useCallback } from 'react';
import { calculatePnL } from '../utils/calculationUtils';
import { getCurrentLocalDateTime, utcToLocalDateTime } from '../utils/dateUtils';
import { formatCurrency } from '../../utils/formatters';
import { buildTradeNotes, stripCalculatorAutoNote } from '../../utils/notes';

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
        followed: normalizeStrategyStepFollowed(value),
      }))
    : []
);

export const useTradeForm = (initialData, userId = 'user-123') => {
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
    emotions: 'neutral',
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
    dos_donts_rule_ids: []
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
      exit_price: initialData.exit_price?.toString() || '',
      stop_loss: initialData.stop_loss?.toString() || '',
      position_size: (initialData.position_size ?? initialData.quantity)?.toString() || '',
      entry_time: entryTimeLocal || getCurrentLocalDateTime(),
      exit_time: exitTimeLocal || '',
      fee: (initialData.fee ?? initialData.commission)?.toString() || '',
      setup_type: initialData.setup_type || '',
      custom_setup_type: initialData.custom_setup_type || '',
      notes: stripCalculatorAutoNote(initialData.notes),
      emotions: initialData.emotions || 'neutral',
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
        : []
    };
  }, [initialData?.id]); // Only depend on the ID, not the whole object

  // Apply initial form data when it changes
  useEffect(() => {
    if (initialFormData) {
      setFormData(initialFormData);
    }
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
      emotions: 'neutral',
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
      dos_donts_rule_ids: []
    });
  }, []);

  const prepareForSubmission = useCallback(() => {
    // Auto-detect direction if stop loss is greater than entry price
    const entryPrice = parseFloat(formData.entry_price) || 0;
    const stopLoss = parseFloat(formData.stop_loss) || 0;
    let detectedDirection = formData.direction;
    
    if (stopLoss && entryPrice) {
      if (stopLoss > entryPrice && formData.direction === 'long') {
        detectedDirection = 'short';
      } else if (stopLoss < entryPrice && formData.direction === 'short') {
        detectedDirection = 'long';
      }
    }
    
    // Calculate final values for submission
    const { pnl, pnlPercent, rMultiple } = calculatePnL({
      entryPrice: formData.entry_price,
      exitPrice: formData.exit_price,
      stopLoss: formData.stop_loss,
      positionSize: formData.position_size,
      direction: detectedDirection, // Use detected direction
      fee: formData.fee
    });

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
      direction: detectedDirection, // Use detected direction
      symbol: formData.symbol.toUpperCase().trim(),
      entry_price: parseFloat(formData.entry_price) || 0,
      exit_price: formData.exit_price ? parseFloat(formData.exit_price) : null,
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
      emotions: formData.emotions ? [formData.emotions] : [], // Convert string to array
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


