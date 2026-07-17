import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';
import { useSettings } from '@/lib/context/SettingsContext';
import { useTradingContext } from '@/lib/context/TradingContext';
import { useTrades, useTradesMutation } from '@/lib/hooks/useTrades';
import { usePlaybook } from '@/lib/hooks/usePlaybook';
import { useAnalysisTimer } from '@/lib/context/AnalysisTimerContext';
import { clearCalculatorState, loadCalculatorState, saveCalculatorState } from '../statePersistence';
import { usePlaybookExitProfile } from './usePlaybookExitProfile';
import { usePositionCalculation } from './usePositionCalculation';
import { useTradeSubmission } from './useTradeSubmission';

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
  const exitStrategy = settings?.exit_strategy;
  const maxDailyTrades = settings?.max_daily_trades ?? null;
  const isFutures = settings?.trading_type === 'futures';

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
  const [calculation, setCalculation] = useState(() => (
    initialState.calculation && typeof initialState.calculation === 'object' ? initialState.calculation : null
  ));
  const [comment, setComment] = useState(() => String(initialState.comment || ''));
  const [selectedSetupId, setSelectedSetupId_raw] = useState(() => String(initialState.selectedSetupId || ''));
  const [exitPrice, setExitPrice] = useState('');
  const [futuresPreset, setFuturesPreset] = useState('ES');
  const [tickSize, setTickSize] = useState('');
  const [tickValue, setTickValue] = useState('');

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
    setExitPrice('');
    clearCalculation();
  }, [clearCalculation]);

  const updateExitPrice = useCallback((value) => {
    setExitPrice((prev) => (prev === value ? prev : value));
  }, []);

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

  const { selectedSetup, riskMultiplier, playbookTargetR, playbookExitStrategy } = usePlaybookExitProfile(
    selectedSetupId,
    playbookEntries,
  );

  const { handleCalculate } = usePositionCalculation({
    entryPrice,
    direction,
    setDirection,
    customStop,
    accountSize,
    positionSizingPct,
    defaultStopLossPct,
    riskAmount,
    riskMultiplier,
    playbookTargetR,
    maxPositionValue,
    targetProfitDollars,
    symbol,
    comment,
    setCalculation,
    resetTimer,
    onCalculationSaved,
    isFutures,
    tickSize,
    tickValue,
  });

  const { isSavingTrade, handleAddToJournal, lossLimitInfo, dismissLossLimitInfo } = useTradeSubmission({
    symbol,
    entryPrice,
    exitPrice,
    setExitPrice,
    customStop,
    direction,
    comment,
    calculation,
    selectedSetup,
    createTrade,
    maxDollars: settings?.max_dollars,
    allTrades,
  });

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
      calculation,
      selectedSetupId,
      updatedAt: new Date().toISOString(),
    });
  }, [symbol, entryPrice, customStop, comment, direction, calculation, selectedSetupId]);

  const handleRefreshSettings = useCallback(async () => {
    try {
      await refetchSettings();
      toast.success('Settings refreshed!');
    } catch {
      toast.error('Failed to refresh settings');
    }
  }, [refetchSettings]);

  const handleReset = useCallback(() => {
    setSymbol('');
    setEntryPrice('');
    setCustomStop('');
    setComment('');
    setCalculation(null);
    setExitPrice('');
    dismissLossLimitInfo();
    clearCalculatorState();
  }, [dismissLossLimitInfo]);

  const canAddToJournal = Boolean(entryPrice && customStop && exitPrice);

  return {
    accountSize,
    riskAmount,
    positionSizingPct,
    targetProfitDollars,
    exitStrategy,
    symbol,
    entryPrice,
    customStop,
    exitPrice,
    comment,
    direction,
    calculation,
    canAddToJournal,
    updateSymbol,
    updateEntryPrice,
    updateCustomStop,
    updateExitPrice,
    updateComment,
    updateDirection,
    handleCalculate,
    handleRefreshSettings,
    handleAddToJournal,
    handleReset,
    isSavingTrade,
    lossLimitInfo,
    dismissLossLimitInfo,
    playbookEntries,
    selectedSetupId,
    setSelectedSetupId,
    selectedSetup,
    riskMultiplier,
    playbookExitStrategy,
    todayTradeCount,
    maxDailyTrades,
    isFutures,
    futuresPreset,
    setFuturesPreset,
    tickSize,
    setTickSize,
    tickValue,
    setTickValue,
  };
}
