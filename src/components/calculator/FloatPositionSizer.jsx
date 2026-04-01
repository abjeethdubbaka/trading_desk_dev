/**
 * @file src/components/calculator/FloatPositionSizer.jsx
 *
 * Main calculator component.
 * Wired to useSettings() and accepts onCalculationSaved callback.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Plus,
  RotateCcw,
  RefreshCw,
  Wallet,
  Shield,
  Percent,
  Target,
  CheckCircle2,
} from 'lucide-react';
import { toast } from 'sonner';
import { useSettings } from '@/lib/context/SettingsContext';
import { useTradingContext } from '@/lib/context/TradingContext';
import { useTradesMutation } from '@/lib/hooks/useTrades';
import { validateTrade } from '@/lib/validation/trades';
import { calcPosition } from '@/lib/calculations/trades';

import {
  MemoizedFloatInputForm,
  MemoizedFloatInfoBox,
  MemoizedResultsDisplay,
} from './memoized';
import { TradeCreator } from './float-calculator/TradeCreator';
import { FloatDataService } from './float-calculator/FloatDataService';

const floatDataService = new FloatDataService();

export default function FloatPositionSizer({ historyData, onCalculationSaved = () => {} }) {
  const { selectedSymbol, selectedEntryPrice } = useTradingContext();
  const { createTrade } = useTradesMutation();
  const { settings, refetch: refetchSettings } = useSettings();

  const accountSize = settings?.account_size;
  const riskAmount = settings?.risk_amount;
  const positionSizingPct = settings?.position_sizing_percent;
  const defaultStopLossPct = settings?.default_stop_loss_percent;
  const targetProfitDollars = settings?.target_profit_dollars;
  const maxDollars = settings?.max_dollars;
  const floatCategories = settings?.float_categories;
  const exitStrategy = settings?.exit_strategy;

  const [symbol, setSymbol] = useState('');
  const [entryPrice, setEntryPrice] = useState('');
  const [customStop, setCustomStop] = useState('');
  const [direction, setDirection] = useState('long');
  const [shareFloat, setShareFloat] = useState(null);
  const [floatCategory, setFloatCategory] = useState(null);
  const [floatData, setFloatData] = useState(null);
  const [loadingFloat, setLoadingFloat] = useState(false);
  const [calculation, setCalculation] = useState(null);

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
    if (riskAmount !== undefined || accountSize !== undefined) {
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
        } catch (err) {
          toast.error(`Position calculation failed: ${err.message}`);
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
        } catch (err) {
          toast.error(`Position calculation failed: ${err.message}`);
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
    } catch (err) {
      toast.error(err.message);
    }
  }, [entryPrice, customStop, direction, runCalculation, symbol, onCalculationSaved]);

  const handleRefreshSettings = async () => {
    try {
      await refetchSettings();
      toast.success('Settings refreshed!');
    } catch {
      toast.error('Failed to refresh settings');
    }
  };

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
        stopLoss: calculation?.stopLossPrice,
      });

      const validation = validateTrade(tradeData);
      if (!validation.isValid) {
        toast.error(`Trade validation failed: ${validation.errors.join(', ')}`);
        return;
      }

      await createTrade(tradeData);
      toast.success('Trade added to journal');
    } catch (e) {
      toast.error(`Failed: ${e.message}`);
    }
  }, [symbol, entryPrice, direction, calculation, floatData, floatCategory, createTrade]);

  const handleReset = () => {
    setSymbol('');
    setEntryPrice('');
    setCustomStop('');
    setShareFloat(null);
    setFloatCategory(null);
    setFloatData(null);
    setCalculation(null);
  };

  const formatCurrency = (value, fallback = '--') => {
    const numeric = Number(value);
    if (!Number.isFinite(numeric)) return fallback;
    return `$${numeric.toLocaleString(undefined, {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    })}`;
  };

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

  return (
    <div className="space-y-4 w-full">
      <div className="rounded-xl border border-white/10 bg-[#13131e] p-4">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-white">Float Position Sizer</h2>
            <p className="text-xs text-white/55 mt-1">
              Pull share-float context, size by risk, then log the trade.
            </p>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 w-full lg:w-auto">
            <div className="rounded-lg bg-white/5 border border-white/10 px-3 py-2 min-w-[120px]">
              <p className="text-[10px] uppercase tracking-wide text-white/40 flex items-center gap-1">
                <Wallet className="w-3 h-3" /> Account
              </p>
              <p className="text-sm font-semibold text-white mt-1">{formatCurrency(accountSize)}</p>
            </div>

            <div className="rounded-lg bg-white/5 border border-white/10 px-3 py-2 min-w-[120px]">
              <p className="text-[10px] uppercase tracking-wide text-white/40 flex items-center gap-1">
                <Shield className="w-3 h-3" /> Risk
              </p>
              <p className="text-sm font-semibold text-red-300 mt-1">{formatCurrency(riskAmount)}</p>
            </div>

            <div className="rounded-lg bg-white/5 border border-white/10 px-3 py-2 min-w-[120px]">
              <p className="text-[10px] uppercase tracking-wide text-white/40 flex items-center gap-1">
                <Percent className="w-3 h-3" /> Position
              </p>
              <p className="text-sm font-semibold text-white mt-1">
                {Number.isFinite(Number(positionSizingPct)) ? `${Number(positionSizingPct)}%` : '--'}
              </p>
            </div>

            <div className="rounded-lg bg-white/5 border border-white/10 px-3 py-2 min-w-[120px]">
              <p className="text-[10px] uppercase tracking-wide text-white/40 flex items-center gap-1">
                <Target className="w-3 h-3" /> Target
              </p>
              <p className="text-sm font-semibold text-emerald-300 mt-1">{formatCurrency(targetProfitDollars)}</p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mt-3">
          {statusPills.map((pill) => (
            <div
              key={pill.label}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] border ${
                pill.ready
                  ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
                  : 'bg-white/5 border-white/15 text-white/55'
              }`}
            >
              {pill.ready ? (
                <CheckCircle2 className="w-3 h-3" />
              ) : (
                <span className="w-1.5 h-1.5 rounded-full bg-white/35" />
              )}
              {pill.label}
            </div>
          ))}
        </div>
      </div>

      <Card className="bg-[#1a1a24] border-white/10">
        <CardContent className="p-6 space-y-6">
          <MemoizedFloatInputForm
            symbol={symbol}
            setSymbol={updateSymbol}
            entryPrice={entryPrice}
            setEntryPrice={updateEntryPrice}
            customStopLossPrice={customStop}
            setCustomStopLossPrice={updateCustomStop}
            direction={direction}
            setDirection={updateDirection}
            loading={loadingFloat}
            fetchShareFloat={fetchShareFloat}
            onCalculate={handleCalculate}
            disabled={false}
          />
        </CardContent>
      </Card>

      {shareFloat && floatData && (
        <MemoizedFloatInfoBox
          symbol={symbol}
          shareFloat={shareFloat}
          floatCategory={floatCategory}
          floatCategories={floatCategories}
          calculation={calculation}
        />
      )}

      {calculation && <MemoizedResultsDisplay {...calculation} exitStrategy={exitStrategy} />}

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-2 border-t border-white/5">
        <div className="flex flex-wrap gap-2">
          <Button
            variant="ghost"
            onClick={handleRefreshSettings}
            className="text-white/35 hover:text-white/70 gap-2 text-xs"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Refresh Settings
          </Button>

          <Button
            variant="ghost"
            onClick={handleReset}
            className="text-white/35 hover:text-white/70 gap-2"
          >
            <RotateCcw className="w-4 h-4" />
            Reset
          </Button>
        </div>

        <div className="flex flex-col sm:items-end gap-1.5">
          <Button
            onClick={handleAddToJournal}
            disabled={!canAddToJournal}
            className="bg-emerald-600 hover:bg-emerald-700 gap-2 disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto"
          >
            <Plus className="w-4 h-4" />
            Add to Journal
          </Button>
          {!canAddToJournal && (
            <p className="text-[11px] text-white/35">
              Enter symbol + entry and run calculation to enable journal save.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
