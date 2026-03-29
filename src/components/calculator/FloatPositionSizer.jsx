/**
 * @file src/components/calculator/FloatPositionSizer.jsx
 *
 * Phase 2 — main calculator component.
 * Wired to useSettings() (Firebase) and accepts onCalculationSaved callback.
 * Cleaned of all console.log debug noise.
 */

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Card, CardContent }  from '@/components/ui/card';
import { Button }             from '@/components/ui/button';
import { Input }              from '@/components/ui/input';
import { Label }              from '@/components/ui/label';
import { Plus, RotateCcw }    from 'lucide-react';
import { toast }              from 'sonner';
import { useSettings }        from '@/lib/context/SettingsContext';
import { useTradingContext }   from '@/lib/context/TradingContext';
import { useTradesMutation }  from '@/lib/hooks/useTrades';
import { validateTrade }      from '@/lib/validation/trades';
import {
  calcPosition,
  calcExitTargets,
} from '@/lib/calculations/trades';

import FloatInputForm  from './input/FloatInputForm';
import FloatInfoBox    from './input/FloatInfoBox';
import ResultsDisplay from "./position-sizing/ResultsDisplay";
import { TradeCreator } from './float-calculator/TradeCreator';
import { FloatDataService } from './float-calculator/FloatDataService';

const floatDataService = new FloatDataService();

export default function FloatPositionSizer({ historyData, onCalculationSaved = () => {} }) {
  const rafRef = useRef(null); // Add missing ref declaration
  const { selectedSymbol, selectedEntryPrice } = useTradingContext();
  const settingsData = useSettings();
  const { createTrade } = useTradesMutation();
  
  // Extract values from settings object
  const { settings, isLoading, refetch: refetchSettings } = settingsData;
  
  const accountSize = settings?.account_size;
  const riskAmount = settings?.risk_amount;
  const positionSizingPct = settings?.position_sizing_percent;
  const defaultStopLossPct = settings?.default_stop_loss_percent;
  const targetProfitDollars = settings?.target_profit_dollars;
  const maxDollars = settings?.max_dollars;
  const floatCategories = settings?.float_categories;

  // Clear calculation when settings change
  useEffect(() => {
    if (riskAmount !== undefined || accountSize !== undefined) {
      // Clear calculation when settings change
      setCalculation(null);
    }
  }, [riskAmount, accountSize]);

  // Add cleanup for animation frames
  useEffect(() => {
    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, []);

  // ── Form state ────────────────────────────────────────────────────────────
  const [symbol,          setSymbol]          = useState('');
  const [entryPrice,      setEntryPrice]       = useState('');
  const [customStop,      setCustomStop]       = useState('');
  const [direction,       setDirection]        = useState('long');
  const [shareFloat,      setShareFloat]       = useState(null);
  const [floatCategory,   setFloatCategory]    = useState(null);
  const [floatData,       setFloatData]        = useState(null);
  const [loadingFloat,    setLoadingFloat]     = useState(false);
  const [calculation,     setCalculation]      = useState(null);

  // Memoized calculation parameters (moved after state declarations)
  const calculationParams = useMemo(() => ({
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
  }), [
    entryPrice, direction, accountSize, positionSizingPct, defaultStopLossPct,
    customStop, riskAmount, shareFloat, floatCategory, floatCategories,
    maxDollars, targetProfitDollars
  ]);

  // Memoized calculation result (moved after state declarations)
  const calculationResult = useMemo(() => {
    if (!entryPrice || !accountSize) return null;
    return calcPosition(calculationParams);
  }, [calculationParams]);

  // Memoized event handlers
  const handleSymbolChange = useCallback((value) => {
    setSymbol(value);
    setShareFloat(null);
    setFloatData(null);
    setCalculation(null);
  }, []);

  const handleEntryPriceChange = useCallback((value) => {
    setEntryPrice(value);
    setCalculation(null);
  }, []);

  const handleCustomStopChange = useCallback((value) => {
    setCustomStop(value);
    setCalculation(null);
  }, []);

  const handleDirectionChange = useCallback((value) => {
    setDirection(value);
    setCalculation(null);
  }, []);

  // Add cleanup for performance
  useEffect(() => {
    return () => {
      // Clear float data service cache when component unmounts
      floatDataService.clearCache();
    };
  }, []);

  // Clear stale result when any input changes
  useEffect(() => { setCalculation(null); }, [entryPrice, customStop, direction, symbol]);

  // Sync from trading context (when user clicks "Use in Calculator" from Journal)
  useEffect(() => {
    if (selectedSymbol && selectedSymbol !== symbol) setSymbol(selectedSymbol);
    if (selectedEntryPrice != null) setEntryPrice(String(selectedEntryPrice));
  }, [selectedSymbol, selectedEntryPrice]);

  // Load from CalcHistory navigation state
  useEffect(() => {
    if (!historyData) return;
    setSymbol(historyData.symbol ?? '');
    setEntryPrice(String(historyData.entryPrice ?? ''));
    setDirection(historyData.direction ?? 'long');
    toast.info(`Loaded ${historyData.symbol} from history`);
  }, [historyData]);

  // ── Float fetch ───────────────────────────────────────────────────────────
  const fetchShareFloat = useCallback(async () => {
    const symbolToFetch = symbol?.trim().toUpperCase();
    if (!symbolToFetch) { toast.error('Enter a symbol first'); return; }

    setLoadingFloat(true);
    try {
      const data = await floatDataService.fetchFloatData(symbolToFetch);

      const cached = floatDataService.loadSavedFloatData();
      const isErrorFallback = Array.isArray(data?.data_sources) && data.data_sources.includes('Error Fallback');
      const dataToUse = (isErrorFallback && floatDataService.isCacheValid(cached, symbolToFetch)) ? cached : data;

      const resolvedCategory = resolveCategory(dataToUse.share_float);

      if (!dataToUse?.share_float) {
        toast.error(`No share float found for ${symbolToFetch}`);
        return;
      }

      setFloatData(dataToUse);
      setShareFloat(dataToUse.share_float);
      setFloatCategory(resolvedCategory);

      floatDataService.saveFloatData(dataToUse);

      if (entryPrice) {
        const autoResult = calcPosition({
          entryPrice,
          direction,
          accountSize,
          positionPct: positionSizingPct,
          stopPct: defaultStopLossPct,
          stopLossPrice: customStop || undefined,
          riskAmount,
          shareFloat: dataToUse.share_float ?? undefined,
          floatCategory: resolvedCategory ?? undefined,
          floatCategories,
          maxDollars,
          targetProfitDollars,
          riskRewardRatio: 3,
        });

        setCalculation(autoResult);
        toast.success(`Float data loaded for ${symbolToFetch} and position calculated`);
      } else {
        toast.success(`Float data loaded for ${symbolToFetch}`);
      }

      if (isErrorFallback && floatDataService.isCacheValid(cached, symbolToFetch)) {
        toast.info(`Polygon unavailable - used cached data for ${symbolToFetch}`);
      }
    } catch (e) {
      toast.error('Failed to fetch float data');
    } finally {
      setLoadingFloat(false);
    }
  }, [
    symbol,
    entryPrice,
    direction,
    accountSize,
    positionSizingPct,
    defaultStopLossPct,
    customStop,
    riskAmount,
    floatCategories,
    maxDollars,
    targetProfitDollars,
  ]);

  function resolveCategory(floatSize) {
    if (!floatSize || !floatCategories) return null;
    for (const [key, cat] of Object.entries(floatCategories)) {
      if (floatSize >= cat.min && floatSize < cat.max) return key;
    }
    return null;
  }

  // ── Calculate ─────────────────────────────────────────────────────────────
  const handleCalculate = useCallback(() => {
    if (!entryPrice) { toast.error('Enter an entry price'); return; }

    // Auto-detect short position if stop loss is greater than entry price
    const entryPriceNum = parseFloat(entryPrice);
    const stopLossPriceNum = parseFloat(customStop);
    
    if (stopLossPriceNum && entryPriceNum) {
      if (stopLossPriceNum > entryPriceNum && direction === 'long') {
        setDirection('short');
        toast.info('Auto-detected short (stop > entry)');
      } else if (stopLossPriceNum < entryPriceNum && direction === 'short') {
        setDirection('long');
        toast.info('Auto-detected long (stop < entry)');
      }
    }

    try {
      // Use memoized calculation result
      const result = calculationResult;
      
      if (!result) {
        toast.error('Unable to calculate position');
        return;
      }

      setCalculation(result);

      // Persist to history (Firebase via callback from Calculator page)
      const historyItem = {
        timestamp:          new Date().toISOString(),
        symbol:             symbol || 'N/A',
        entryPrice:         result.entryPrice,
        shares:             result.shares,
        stopLossPrice:      result.stopLossPrice,
        targetPrice:        result.targetPrice,
        positionValue:      result.positionValue,
        actualRisk:         result.actualRisk,
        potentialProfit:    result.targetProfit,
        riskLevel:          result.riskLevel,
        riskRewardRatio:    3,
        direction,
        mode:               result.mode,
      };

      onCalculationSaved?.(historyItem);
      toast.success('Position calculated!');
    } catch (err) {
      toast.error(err.message);
    }
  }, [
    entryPrice, direction, accountSize, positionSizingPct,
    defaultStopLossPct, customStop, riskAmount,
    shareFloat, floatCategory, floatCategories,
    maxDollars, targetProfitDollars, symbol, onCalculationSaved,
  ]);

  // Refresh settings
  const handleRefreshSettings = async () => {
    
    try {
      await refetchSettings();
      toast.success('Settings refreshed!');
    } catch (error) {
      toast.error('Failed to refresh settings');
    }
  };

  // ── Add to Journal ────────────────────────────────────────────────────────
  const handleAddToJournal = useCallback(async () => {
    if (!entryPrice) { toast.error('Enter an entry price first'); return; }
    const normalizedSymbol = String(symbol || '').trim().toUpperCase();
    if (!normalizedSymbol) { toast.error('Enter a symbol first'); return; }
    if (!/^[A-Z]{1,5}$/.test(normalizedSymbol)) {
      toast.error('Symbol must be 1-5 uppercase letters (e.g., AAPL)');
      return;
    }
    
    try {
      const tradeData = await TradeCreator.createTrade({
        symbol:       normalizedSymbol,
        entryPrice,
        direction,
        calculation,
        floatData,
        floatCategory,
        stopLoss: calculation?.stopLossPrice, // Use calculated stop loss
      });

      const validation = validateTrade(tradeData);
      if (!validation.isValid) {
        console.error('[Calculator] Trade payload validation failed', {
          errors: validation.errors,
          tradeData,
        });
        toast.error(`Trade validation failed: ${validation.errors.join(', ')}`);
        return;
      }

      console.info('[Calculator] Add to Journal requested', {
        symbol: tradeData.symbol,
        entry_price: tradeData.entry_price,
        quantity: tradeData.quantity,
        direction: tradeData.direction,
      });

      // Use the standard trades mutation path so account tier + cache invalidation
      // behavior matches manual Journal entries.
      const savedTrade = await createTrade(tradeData);
      console.info('[Calculator] Add to Journal success', {
        id: savedTrade?.id,
        symbol: savedTrade?.symbol || tradeData.symbol,
      });
      
      toast.success(`Trade added to journal`);
    } catch (e) {
      console.error('[Calculator] Add to Journal failed', {
        code: e?.code,
        message: e?.message,
        name: e?.name,
      });
      toast.error(`Failed: ${e.message}`);
    }
  }, [symbol, entryPrice, direction, calculation, floatData, floatCategory, createTrade]);

  const handleReset = () => {
    setSymbol(''); setEntryPrice(''); setCustomStop('');
    setShareFloat(null); setFloatCategory(null); setFloatData(null);
    setCalculation(null);
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-4 w-full">
      <Card className="bg-[#1a1a24] border-white/10">
        <CardContent className="p-6 space-y-6">
          <FloatInputForm
            symbol={symbol}
            setSymbol={setSymbol}
            entryPrice={entryPrice}
            setEntryPrice={setEntryPrice}
            customStopLossPrice={customStop}
            setCustomStopLossPrice={setCustomStop}
            direction={direction}
            setDirection={setDirection}
            loading={loadingFloat}
            fetchShareFloat={fetchShareFloat}
            onCalculate={handleCalculate}
            disabled={false}
          />
        </CardContent>
      </Card>

      {shareFloat && floatData && (
        <FloatInfoBox
          symbol={symbol}
          shareFloat={shareFloat}
          floatCategory={floatCategory}
          floatCategories={floatCategories}
          calculation={calculation}
        />
      )}

      {calculation && <ResultsDisplay {...calculation} />}

      <div className="flex justify-between items-center pt-2 border-t border-white/5">
        <div className="flex gap-2">
          <Button
            variant="ghost"
            onClick={handleRefreshSettings}
            className="text-white/30 hover:text-white/60 gap-2 text-xs"
          >
            🔄 Refresh Settings
          </Button>
          
          <Button
            variant="ghost"
            onClick={handleReset}
            className="text-white/30 hover:text-white/60 gap-2"
          >
            <RotateCcw className="w-4 h-4" />Reset
          </Button>
        </div>

        <Button
          onClick={handleAddToJournal}
          disabled={!entryPrice || !calculation || !symbol?.trim()}
          className="bg-emerald-600 hover:bg-emerald-700 gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Plus className="w-4 h-4" />Add to Journal
        </Button>
      </div>
    </div>
  );
}


