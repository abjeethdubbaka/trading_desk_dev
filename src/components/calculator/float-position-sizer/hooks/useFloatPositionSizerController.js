import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';
import { useSettings } from '@/lib/context/SettingsContext';
import { useTradingContext } from '@/lib/context/TradingContext';
import { useTrades, useTradesMutation } from '@/lib/hooks/useTrades';
import { usePlaybook } from '@/lib/hooks/usePlaybook';
import { validateTrade } from '@/lib/validation/trades';
import { calcPosition } from '@/lib/calculations/trades';
import { useAnalysisTimer } from '@/lib/context/AnalysisTimerContext';
import { TradeCreator } from '../../float-calculator/TradeCreator';
import { FloatDataService } from '../../float-calculator/FloatDataService';
import { clearCalculatorState, loadCalculatorState, saveCalculatorState } from '../statePersistence';
import { buildFloatSmartPlan } from '../floatSmartPlan';

const floatDataService = new FloatDataService();
const CALCULATOR_DECISION_EVENT = 'calculator-decision-context';

export function useFloatPositionSizerController({ historyData, onCalculationSaved }) {
  const { selectedSymbol, selectedEntryPrice } = useTradingContext();
  const { createTrade } = useTradesMutation();
  const { settings, refetch: refetchSettings } = useSettings();
  const { playbookEntries } = usePlaybook();
  const { resetTimer } = useAnalysisTimer();
  const initialState = useMemo(() => loadCalculatorState() || {}, []);
  const settingsHydratedRef = useRef(false);
  const previousSettingsRef = useRef({ accountSize: null, riskAmount: null });
  const lastAppliedTradingSelectionRef = useRef({ symbol: null, entryPrice: null });

  const accountSize = settings?.account_size;
  const riskAmount = settings?.risk_amount;
  const positionSizingPct = settings?.position_sizing_percent;
  const defaultStopLossPct = settings?.default_stop_loss_percent;
  const targetProfitDollars = settings?.target_profit_dollars;
  const maxPositionValue = settings?.max_position_value;
  const floatCategories = settings?.float_categories;
  const exitStrategy = settings?.exit_strategy;
  const maxDailyTrades = settings?.max_daily_trades ?? null;

  const { data: allTrades = [] } = useTrades();

  const todayTradeCount = useMemo(() => {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date();
    end.setHours(23, 59, 59, 999);
    return allTrades.filter((t) => {
      const d = new Date(t.entry_time || t.created_date || 0);
      return d >= start && d <= end;
    }).length;
  }, [allTrades]);

  const [symbol, setSymbol] = useState(() => String(initialState.symbol || ''));
  const [entryPrice, setEntryPrice] = useState(() => String(initialState.entryPrice || ''));
  const [customStop, setCustomStop] = useState(() => String(initialState.customStop || ''));
  const [direction, setDirection] = useState(() => (initialState.direction === 'short' ? 'short' : 'long'));
  const [shareFloat, setShareFloat] = useState(() => {
    const value = Number(initialState.shareFloat);
    return Number.isFinite(value) && value > 0 ? value : null;
  });
  const [floatCategory, setFloatCategory] = useState(() => (
    initialState.floatCategory ? String(initialState.floatCategory) : null
  ));
  const [floatData, setFloatData] = useState(() => (
    initialState.floatData && typeof initialState.floatData === 'object' ? initialState.floatData : null
  ));
  const [loadingFloat, setLoadingFloat] = useState(false);
  const [calculation, setCalculation] = useState(() => (
    initialState.calculation && typeof initialState.calculation === 'object' ? initialState.calculation : null
  ));
  const [comment, setComment] = useState(() => String(initialState.comment || ''));
  const [selectedSetupId, setSelectedSetupId_raw] = useState(() => String(initialState.selectedSetupId || ''));

  const setSelectedSetupId = useCallback((value) => {
    setSelectedSetupId_raw(value);
    setCalculation((prev) => (prev == null ? prev : { ...prev, _stale: true }));
  }, []);

  const clearCalculation = useCallback(() => {
    setCalculation((prev) => (prev == null ? prev : null));
  }, []);

  const markCalculationStale = useCallback(() => {
    setCalculation((prev) => (prev == null ? prev : { ...prev, _stale: true }));
  }, []);

  const updateSymbol = useCallback((value) => {
    setSymbol((prev) => (prev === value ? prev : value));
    setShareFloat(null);
    setFloatCategory(null);
    setFloatData(null);
    clearCalculation();
  }, [clearCalculation]);

  const updateEntryPrice = useCallback((value) => {
    setEntryPrice((prev) => (prev === value ? prev : value));
    markCalculationStale();
  }, [markCalculationStale]);

  const updateCustomStop = useCallback((value) => {
    setCustomStop((prev) => (prev === value ? prev : value));
    markCalculationStale();
  }, [markCalculationStale]);

  const updateDirection = useCallback((value) => {
    setDirection((prev) => (prev === value ? prev : value));
    markCalculationStale();
  }, [markCalculationStale]);

  const updateComment = useCallback((value) => {
    setComment((prev) => (prev === value ? prev : value));
  }, []);

  const selectedSetup = useMemo(
    () => (selectedSetupId ? playbookEntries.find((e) => e.id === selectedSetupId) ?? null : null),
    [selectedSetupId, playbookEntries],
  );

  const riskMultiplier = selectedSetup?.risk_level === 'half' ? 0.5
    : selectedSetup?.risk_level === 'double' ? 2
    : 1;

  // Build exit tiers and target R from playbook expected_r_profile
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

    const tiers = [];
    if (min     != null) tiers.push(min);
    if (target  != null) tiers.push(target);
    if (stretch != null) tiers.push(stretch);

    if (tiers.length === 0) return null;

    // Percent allocation per tier count: trim small, exit main, let runner ride
    const SPLITS = {
      1: [100],
      2: [40, 60],
      3: [25, 50, 25],
    };
    const splits = SPLITS[tiers.length] ?? tiers.map(() => Math.floor(100 / tiers.length));

    const levels = tiers.map((r, i) => ({ r, percent: splits[i] ?? 0 }));
    return { levels };
  }, [playbookRProfile]);

  const resolveCategory = useCallback((floatSize) => {
    if (!floatSize || !floatCategories) return null;
    for (const [key, cat] of Object.entries(floatCategories)) {
      if (floatSize >= cat.min && floatSize < cat.max) return key;
    }
    return null;
  }, [floatCategories]);

  const buildCalculationParams = useCallback((overrides = {}) => ({
    entryPrice,
    direction,
    accountSize,
    positionPct: positionSizingPct,
    stopPct: defaultStopLossPct,
    stopLossPrice: customStop || undefined,
    riskAmount: riskMultiplier !== 1 && Number.isFinite(Number(riskAmount))
      ? Number(riskAmount) * riskMultiplier
      : riskAmount,
    shareFloat: shareFloat ?? undefined,
    floatCategory: floatCategory ?? undefined,
    floatCategories,
    maxPositionValue,
    targetProfitDollars,
    riskRewardRatio: playbookTargetR ?? 3,
    ...overrides,
  }), [
    entryPrice,
    direction,
    accountSize,
    positionSizingPct,
    defaultStopLossPct,
    customStop,
    riskAmount,
    riskMultiplier,
    playbookTargetR,
    shareFloat,
    floatCategory,
    floatCategories,
    maxPositionValue,
    targetProfitDollars,
  ]);

  const runCalculation = useCallback((overrides = {}, source = null) => {
    const useFloatDynamic = source === 'smart';
    const result = calcPosition(buildCalculationParams({
      ...overrides,
      allowFloatDynamic: useFloatDynamic,
    }));
    const normalizedResult = source
      ? { ...result, _viewSource: source }
      : result;
    setCalculation(normalizedResult);
    resetTimer(); // each new calculation result gets a fresh timer
    return normalizedResult;
  }, [buildCalculationParams, resetTimer]);

  useEffect(() => {
    if (riskAmount === undefined && accountSize === undefined) return;

    const normalizedAccountSize = Number(accountSize);
    const normalizedRiskAmount = Number(riskAmount);

    if (!settingsHydratedRef.current) {
      settingsHydratedRef.current = true;
      previousSettingsRef.current = {
        accountSize: normalizedAccountSize,
        riskAmount: normalizedRiskAmount,
      };
      return;
    }

    const previous = previousSettingsRef.current;
    const hasSettingsChanged = previous.accountSize !== normalizedAccountSize
      || previous.riskAmount !== normalizedRiskAmount;

    previousSettingsRef.current = {
      accountSize: normalizedAccountSize,
      riskAmount: normalizedRiskAmount,
    };

    if (hasSettingsChanged) {
      clearCalculation();
    }
  }, [riskAmount, accountSize, clearCalculation]);

  useEffect(() => {
    const nextSymbol = selectedSymbol ? String(selectedSymbol) : '';
    const nextEntryPrice = selectedEntryPrice != null ? String(selectedEntryPrice) : null;
    const lastApplied = lastAppliedTradingSelectionRef.current;

    const hasSelectionChanged = lastApplied.symbol !== nextSymbol
      || lastApplied.entryPrice !== nextEntryPrice;
    if (!hasSelectionChanged) return;

    lastAppliedTradingSelectionRef.current = {
      symbol: nextSymbol,
      entryPrice: nextEntryPrice,
    };

    if (nextSymbol) {
      updateSymbol(nextSymbol);
    }
    if (nextEntryPrice != null) {
      updateEntryPrice(nextEntryPrice);
    }
  }, [selectedSymbol, selectedEntryPrice, updateSymbol, updateEntryPrice]);

  useEffect(() => {
    if (!historyData) return;

    const entry  = historyData.entryPrice  != null ? Number(historyData.entryPrice).toFixed(2)  : '';
    const stop   = historyData.stopLossPrice != null ? Number(historyData.stopLossPrice).toFixed(2) : '';

    updateSymbol(historyData.symbol ?? '');
    updateEntryPrice(entry);
    updateCustomStop(stop); // clear stale stop if history item has none
    updateDirection(historyData.direction ?? 'long');

    // Reconstruct the full calculation result so the results panel renders immediately
    setCalculation({
      _viewSource: 'snapshot',
      entryPrice:         historyData.entryPrice,
      stopLossPrice:      historyData.stopLossPrice,
      targetPrice:        historyData.targetPrice,
      shares:             historyData.shares,
      positionValue:      historyData.positionValue,
      actualRisk:         historyData.actualRisk,
      requestedRisk:      historyData.requestedRisk,
      riskUtilizationPct: historyData.riskUtilizationPct,
      capReason:          historyData.capReason,
      riskRewardRatio:    historyData.riskRewardRatio ?? 3,
      targetProfit:       historyData.potentialProfit,
      riskLevel:          historyData.riskLevel,
      direction:          historyData.direction,
      mode:               historyData.mode,
    });

    toast.info(`Loaded ${historyData.symbol} from history`);
  }, [historyData, updateSymbol, updateEntryPrice, updateCustomStop, updateDirection]);

  useEffect(() => {
    saveCalculatorState({
      symbol,
      entryPrice,
      customStop,
      comment,
      direction,
      shareFloat,
      floatCategory,
      floatData,
      calculation,
      selectedSetupId,
      updatedAt: new Date().toISOString(),
    });
  }, [symbol, entryPrice, customStop, comment, direction, shareFloat, floatCategory, floatData, calculation, selectedSetupId]);

  const fetchShareFloat = useCallback(async () => {
    const symbolToFetch = symbol?.trim().toUpperCase();
    if (!symbolToFetch) {
      toast.error('Enter a symbol first');
      return;
    }

    const cached = floatDataService.loadSavedFloatData();
    if (floatDataService.isCacheValid(cached, symbolToFetch)) {
      const resolvedCategory = resolveCategory(cached.share_float);
      setFloatData(cached);
      setShareFloat(cached.share_float);
      setFloatCategory(resolvedCategory);
      toast.success(`Using cached ${cached.share_float.toLocaleString()} share float`);

      if (entryPrice) {
        try {
          runCalculation({
            shareFloat: cached.share_float ?? undefined,
            floatCategory: resolvedCategory ?? undefined,
          }, 'auto');
          toast.success(`Position calculated for ${symbolToFetch}`);
        } catch (error) {
          toast.error(`Position calculation failed: ${error.message}`);
        }
      }
      return;
    }

    setLoadingFloat(true);
    try {
      const data = await floatDataService.fetchFloatData(symbolToFetch);

      if (!data?.share_float) {
        toast.error(`No share float found for ${symbolToFetch}`);
        return;
      }

      const resolvedCategory = resolveCategory(data.share_float);
      setFloatData(data);
      setShareFloat(data.share_float);
      setFloatCategory(resolvedCategory);

      floatDataService.saveFloatData(data);

      if (entryPrice) {
        try {
          runCalculation({
            shareFloat: data.share_float ?? undefined,
            floatCategory: resolvedCategory ?? undefined,
          }, 'auto');
          toast.success(`Float data loaded for ${symbolToFetch} and position calculated`);
        } catch (error) {
          toast.error(`Position calculation failed: ${error.message}`);
        }
      } else {
        toast.success(`Float data loaded for ${symbolToFetch}`);
      }
    } catch {
      toast.error('Failed to fetch float data');
    } finally {
      setLoadingFloat(false);
    }
  }, [symbol, entryPrice, resolveCategory, runCalculation]);

  const floatCategoryLabel = useMemo(() => {
    if (!floatCategory) return 'Unknown Float';
    const category = floatCategories?.[floatCategory];
    return category?.label || String(floatCategory).toUpperCase();
  }, [floatCategories, floatCategory]);

  const smartFloatPlan = useMemo(
    () => buildFloatSmartPlan({
      entryPrice,
      direction,
      shareFloat,
      floatRangeKey: floatCategory || 'unknown',
      floatRangeLabel: floatCategoryLabel,
      settings,
      marketContext: floatData || {},
    }),
    [direction, entryPrice, floatCategory, floatCategoryLabel, floatData, settings, shareFloat]
  );

  const handleApplyFloatSmartPlan = useCallback(() => {
    if (!smartFloatPlan?.hasFloatData || !smartFloatPlan?.canApply) {
      toast.error('Fetch float data and enter entry price first.');
      return;
    }

    const recommendation = smartFloatPlan.recommendations || {};
    const nextStopPrice = Number(recommendation.stopPrice);
    const nextRiskAmount = Number(recommendation.riskAmount);
    const nextPreferredR = Number(recommendation.preferredR);

    const overrides = {
      shareFloat: shareFloat ?? undefined,
      floatCategory: floatCategory ?? undefined,
    };

    if (Number.isFinite(nextStopPrice) && nextStopPrice > 0) {
      const normalizedStop = nextStopPrice.toFixed(2);
      setCustomStop(normalizedStop);
      overrides.stopLossPrice = normalizedStop;
    }

    if (Number.isFinite(nextRiskAmount) && nextRiskAmount > 0) {
      overrides.riskAmount = nextRiskAmount;
    }

    if (Number.isFinite(nextPreferredR) && nextPreferredR > 0) {
      overrides.riskRewardRatio = Number(nextPreferredR.toFixed(2));
    }

    try {
      runCalculation(overrides, 'smart');
      toast.success('Applied float-smart dynamic risk and exit plan.');
    } catch (error) {
      toast.error(`Failed to apply smart plan: ${error.message}`);
    }
  }, [floatCategory, runCalculation, shareFloat, smartFloatPlan]);

  const handleCalculate = useCallback(() => {
    if (!entryPrice) {
      toast.error('Enter an entry price');
      return;
    }

    const entryPriceNum = parseFloat(entryPrice);
    const stopLossPriceNum = parseFloat(customStop);
    let effectiveDirection = direction;

    if (stopLossPriceNum && entryPriceNum) {
      if (stopLossPriceNum > entryPriceNum && direction === 'long') {
        effectiveDirection = 'short';
        setDirection('short');
        toast.info('Auto-detected short (stop > entry)');
      } else if (stopLossPriceNum < entryPriceNum && direction === 'short') {
        effectiveDirection = 'long';
        setDirection('long');
        toast.info('Auto-detected long (stop < entry)');
      }
    }

    try {
      const result = runCalculation({ direction: effectiveDirection }, 'snapshot');
      const normalizedSymbol = String(symbol || '').trim().toUpperCase();

      const historyItem = {
        timestamp: new Date().toISOString(),
        symbol: normalizedSymbol || 'N/A',
        entryPrice: result.entryPrice,
        shares: result.shares,
        stopLossPrice: result.stopLossPrice,
        targetPrice: result.targetPrice,
        positionValue: result.positionValue,
        actualRisk: result.actualRisk,
        potentialProfit: result.targetProfit,
        riskLevel: result.riskLevel,
        requestedRisk: result.requestedRisk,
        riskUtilizationPct: result.riskUtilizationPct,
        capReason: result.capReason,
        riskRewardRatio: 3,
        direction: result.direction,
        mode: result.mode,
      };

      onCalculationSaved?.(historyItem);

      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent(CALCULATOR_DECISION_EVENT, {
            detail: {
              source: 'calculator',
              timestamp: new Date().toISOString(),
              symbol: normalizedSymbol,
              direction: result.direction,
              entry: result.entryPrice,
              stop: result.stopLossPrice,
              target: result.targetPrice,
              max_risk_dollars: result.actualRisk,
              position_size_shares: result.shares,
              risk_reward_ratio: result.riskRewardRatio,
              notes: String(comment || '').trim(),
            },
          })
        );
      }

      toast.success('Position calculated using static risk settings.');
      if (result.capReason) {
        toast.info(`Risk capped by ${result.capReason}`);
      }
    } catch (error) {
      toast.error(error.message);
    }
  }, [entryPrice, customStop, direction, runCalculation, symbol, comment, onCalculationSaved]);

  const handleRefreshSettings = useCallback(async () => {
    try {
      await refetchSettings();
      toast.success('Settings refreshed!');
    } catch {
      toast.error('Failed to refresh settings');
    }
  }, [refetchSettings]);

  const handleAddToJournal = useCallback(async () => {
    if (!entryPrice) {
      toast.error('Enter an entry price first');
      return;
    }

    const normalizedSymbol = String(symbol || '').trim().toUpperCase();
    if (!normalizedSymbol) {
      toast.error('Enter a symbol first');
      return;
    }
    if (!/^[A-Z]{1,5}$/.test(normalizedSymbol)) {
      toast.error('Symbol must be 1-5 uppercase letters (e.g., AAPL)');
      return;
    }

    try {
      const tradeData = await TradeCreator.createTrade({
        symbol: normalizedSymbol,
        entryPrice,
        direction,
        comment,
        calculation,
        floatData,
        floatCategory,
        floatCategories,
        stopLoss: customStop || calculation?.stopLossPrice,
      });

      const validation = validateTrade(tradeData);
      if (!validation.isValid) {
        toast.error(`Trade validation failed: ${validation.errors.join(', ')}`);
        return;
      }

      await createTrade(tradeData);
      toast.success('Trade added to journal');
    } catch (error) {
      toast.error(`Failed: ${error.message}`);
    }
  }, [symbol, entryPrice, customStop, direction, comment, calculation, floatData, floatCategory, floatCategories, createTrade]);

  const handleReset = useCallback(() => {
    setSymbol('');
    setEntryPrice('');
    setCustomStop('');
    setComment('');
    setShareFloat(null);
    setFloatCategory(null);
    setFloatData(null);
    setCalculation(null);
    clearCalculatorState();
  }, []);

  const hasSymbol = Boolean(symbol?.trim());
  const hasEntryPrice = Boolean(entryPrice);
  const hasFloatData = Boolean(shareFloat && floatData);
  const hasCalculation = Boolean(calculation);
  const canAddToJournal = Boolean(entryPrice && customStop);

  const statusPills = [
    { label: 'Symbol', ready: hasSymbol },
    { label: 'Entry', ready: hasEntryPrice },
    { label: 'Float Data', ready: hasFloatData },
    { label: 'Calculated', ready: hasCalculation },
  ];

  return {
    accountSize,
    riskAmount,
    positionSizingPct,
    targetProfitDollars,
    floatCategories,
    exitStrategy,
    symbol,
    entryPrice,
    customStop,
    comment,
    direction,
    shareFloat,
    floatCategory,
    floatData,
    loadingFloat,
    smartFloatPlan,
    calculation,
    statusPills,
    canAddToJournal,
    updateSymbol,
    updateEntryPrice,
    updateCustomStop,
    updateComment,
    updateDirection,
    fetchShareFloat,
    handleApplyFloatSmartPlan,
    handleCalculate,
    handleRefreshSettings,
    handleAddToJournal,
    handleReset,
    playbookEntries,
    selectedSetupId,
    setSelectedSetupId,
    selectedSetup,
    riskMultiplier,
    playbookExitStrategy,
    todayTradeCount,
    maxDailyTrades,
  };
}
