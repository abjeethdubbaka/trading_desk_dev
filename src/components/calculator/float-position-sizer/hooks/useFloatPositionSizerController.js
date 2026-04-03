import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';
import { useSettings } from '@/lib/context/SettingsContext';
import { useTradingContext } from '@/lib/context/TradingContext';
import { useTradesMutation } from '@/lib/hooks/useTrades';
import { validateTrade } from '@/lib/validation/trades';
import { calcPosition } from '@/lib/calculations/trades';
import { TradeCreator } from '../../float-calculator/TradeCreator';
import { FloatDataService } from '../../float-calculator/FloatDataService';
import { clearCalculatorState, loadCalculatorState, saveCalculatorState } from '../statePersistence';

const floatDataService = new FloatDataService();

export function useFloatPositionSizerController({ historyData, onCalculationSaved }) {
  const { selectedSymbol, selectedEntryPrice } = useTradingContext();
  const { createTrade } = useTradesMutation();
  const { settings, refetch: refetchSettings } = useSettings();
  const initialState = useMemo(() => loadCalculatorState() || {}, []);
  const settingsHydratedRef = useRef(false);
  const previousSettingsRef = useRef({ accountSize: null, riskAmount: null });

  const accountSize = settings?.account_size;
  const riskAmount = settings?.risk_amount;
  const positionSizingPct = settings?.position_sizing_percent;
  const defaultStopLossPct = settings?.default_stop_loss_percent;
  const targetProfitDollars = settings?.target_profit_dollars;
  const maxDollars = settings?.max_dollars;
  const floatCategories = settings?.float_categories;
  const exitStrategy = settings?.exit_strategy;

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

  const clearCalculation = useCallback(() => {
    setCalculation((prev) => (prev == null ? prev : null));
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
    clearCalculation();
  }, [clearCalculation]);

  const updateCustomStop = useCallback((value) => {
    setCustomStop((prev) => (prev === value ? prev : value));
    clearCalculation();
  }, [clearCalculation]);

  const updateDirection = useCallback((value) => {
    setDirection((prev) => (prev === value ? prev : value));
    clearCalculation();
  }, [clearCalculation]);

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
    riskAmount,
    shareFloat: shareFloat ?? undefined,
    floatCategory: floatCategory ?? undefined,
    floatCategories,
    maxDollars,
    targetProfitDollars,
    riskRewardRatio: 3,
    ...overrides,
  }), [
    entryPrice,
    direction,
    accountSize,
    positionSizingPct,
    defaultStopLossPct,
    customStop,
    riskAmount,
    shareFloat,
    floatCategory,
    floatCategories,
    maxDollars,
    targetProfitDollars,
  ]);

  const runCalculation = useCallback((overrides = {}) => {
    const result = calcPosition(buildCalculationParams(overrides));
    setCalculation(result);
    return result;
  }, [buildCalculationParams]);

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
    if (selectedSymbol && selectedSymbol !== symbol) {
      updateSymbol(selectedSymbol);
    }
    if (selectedEntryPrice != null) {
      const nextEntryPrice = String(selectedEntryPrice);
      if (nextEntryPrice !== entryPrice) {
        updateEntryPrice(nextEntryPrice);
      }
    }
  }, [selectedSymbol, selectedEntryPrice, symbol, entryPrice, updateSymbol, updateEntryPrice]);

  useEffect(() => {
    if (!historyData) return;
    updateSymbol(historyData.symbol ?? '');
    updateEntryPrice(String(historyData.entryPrice ?? ''));
    updateDirection(historyData.direction ?? 'long');
    toast.info(`Loaded ${historyData.symbol} from history`);
  }, [historyData, updateSymbol, updateEntryPrice, updateDirection]);

  useEffect(() => {
    saveCalculatorState({
      symbol,
      entryPrice,
      customStop,
      direction,
      shareFloat,
      floatCategory,
      floatData,
      calculation,
      updatedAt: new Date().toISOString(),
    });
  }, [symbol, entryPrice, customStop, direction, shareFloat, floatCategory, floatData, calculation]);

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
          });
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
          });
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
      const result = runCalculation({ direction: effectiveDirection });

      const historyItem = {
        timestamp: new Date().toISOString(),
        symbol: symbol || 'N/A',
        entryPrice: result.entryPrice,
        shares: result.shares,
        stopLossPrice: result.stopLossPrice,
        targetPrice: result.targetPrice,
        positionValue: result.positionValue,
        actualRisk: result.actualRisk,
        potentialProfit: result.targetProfit,
        riskLevel: result.riskLevel,
        riskRewardRatio: 3,
        direction: result.direction,
        mode: result.mode,
      };

      onCalculationSaved?.(historyItem);
      toast.success('Position calculated!');
    } catch (error) {
      toast.error(error.message);
    }
  }, [entryPrice, customStop, direction, runCalculation, symbol, onCalculationSaved]);

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
        calculation,
        floatData,
        floatCategory,
        floatCategories,
        stopLoss: calculation?.stopLossPrice,
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
  }, [symbol, entryPrice, direction, calculation, floatData, floatCategory, floatCategories, createTrade]);

  const handleReset = useCallback(() => {
    setSymbol('');
    setEntryPrice('');
    setCustomStop('');
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
  const canAddToJournal = Boolean(entryPrice && calculation && symbol?.trim());

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
    direction,
    shareFloat,
    floatCategory,
    floatData,
    loadingFloat,
    calculation,
    statusPills,
    canAddToJournal,
    updateSymbol,
    updateEntryPrice,
    updateCustomStop,
    updateDirection,
    fetchShareFloat,
    handleCalculate,
    handleRefreshSettings,
    handleAddToJournal,
    handleReset,
  };
}
