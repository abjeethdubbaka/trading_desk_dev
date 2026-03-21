/**
 * @file src/components/calculator/FloatPositionSizer.jsx
 *
 * Phase 2 — main calculator component.
 * Wired to useSettings() (Firebase) and accepts onCalculationSaved callback.
 * Cleaned of all console.log debug noise.
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Card, CardContent }  from '@/components/ui/card';
import { Button }             from '@/components/ui/button';
import { Plus, RotateCcw }    from 'lucide-react';
import { toast }              from 'sonner';
import { useSettings }        from '@/lib/SettingsContext';
import { useTradingContext }   from '@/lib/TradingContext';
import {
  calcPosition,
  calcExitTargets,
} from '@/lib/calculations/trades';

import FloatInputForm  from './input/FloatInputForm';
import FloatInfoBox    from './input/FloatInfoBox';
import ResultsDisplay from "./position-size/ResultsDisplay";
import { TradeCreator } from './float-position-sizer/TradeCreator';
import { FloatDataService } from './float-position-sizer/FloatDataService';

const floatDataService = new FloatDataService();

export default function FloatPositionSizer({ historyData, onCalculationSaved }) {
  const { selectedSymbol, selectedEntryPrice } = useTradingContext();
  const settingsData = useSettings();
  
  console.log('🧮 Full useSettings return:', settingsData);
  
  // Extract values from settings object
  const { settings, isLoading, refetch: refetchSettings } = settingsData;
  
  const accountSize = settings?.account_size;
  const riskAmount = settings?.risk_amount;
  const positionSizingPct = settings?.position_sizing_percent;
  const defaultStopLossPct = settings?.default_stop_loss_percent;
  const targetProfitDollars = settings?.target_profit_dollars;
  const maxDollars = settings?.max_dollars;
  const floatCategories = settings?.float_categories;

  console.log('🧮 FloatPositionSizer Settings:', {
    settings,
    accountSize,
    riskAmount,
    positionSizingPct,
    defaultStopLossPct,
    targetProfitDollars,
    maxDollars
  });

  // Log when settings change
  useEffect(() => {
    console.log('🧮 Settings Updated in Calculator:', { riskAmount, accountSize });
  }, [riskAmount, accountSize]);

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
    if (!symbol) { toast.error('Enter a symbol first'); return; }

    const cached = floatDataService.loadSavedFloatData();
    if (floatDataService.isCacheValid(cached, symbol)) {
      setFloatData(cached);
      setShareFloat(cached.share_float);
      setFloatCategory(resolveCategory(cached.share_float));
      toast.success(`Loaded float data for ${symbol} (cached)`);
      return;
    }

    setLoadingFloat(true);
    try {
      const data = await floatDataService.fetchFloatData(symbol);
      floatDataService.saveFloatData(data);
      setFloatData(data);
      setShareFloat(data.share_float);
      setFloatCategory(resolveCategory(data.share_float));
      toast.success(`Float data loaded for ${symbol}`);
    } catch (e) {
      toast.error('Failed to fetch float data');
    } finally {
      setLoadingFloat(false);
    }
  }, [symbol, floatCategories]);

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

    try {
      console.log('🔍 FloatPositionSizer Debug:', {
        riskAmount,
        accountSize,
        positionSizingPct,
        customStop,
        currentSettings: {
          risk_amount: riskAmount,
          account_size: accountSize,
          position_sizing_percent: positionSizingPct
        }
      });
      
      const result = calcPosition({
        entryPrice,
        direction,
        accountSize,
        positionPct:        positionSizingPct,
        stopPct:            defaultStopLossPct,
        stopLossPrice:      customStop || undefined,
        riskAmount:         riskAmount, // Always pass risk amount
        shareFloat:         shareFloat ?? undefined,
        floatCategory:      floatCategory ?? undefined,
        floatCategories,
        maxDollars,
        targetProfitDollars,
        riskRewardRatio:    3,
      });

      console.log('🔍 CalcPosition Result:', {
        actualRisk: result.actualRisk,
        riskAmount: result.riskAmount
      });

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
      console.error('🔍 FloatPositionSizer Error:', err);
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
    console.log('🧮 Refreshing settings...');
    try {
      await refetchSettings();
      toast.success('Settings refreshed!');
    } catch (error) {
      console.error('🧮 Failed to refresh settings:', error);
      toast.error('Failed to refresh settings');
    }
  };

  // ── Add to Journal ────────────────────────────────────────────────────────
  const handleAddToJournal = useCallback(async () => {
    if (!entryPrice) { toast.error('Enter an entry price first'); return; }
    try {
      const tradeData = await TradeCreator.createTrade({
        symbol:       symbol || 'N/A',
        entryPrice,
        direction,
        calculation,
        floatData,
        floatCategory,
      });
      await TradeCreator.saveTrade(tradeData);
      toast.success(`Trade added to journal`);
      window.dispatchEvent(new CustomEvent('trades-updated', { detail: { action: 'create' } }));
    } catch (e) {
      toast.error(`Failed: ${e.message}`);
    }
  }, [symbol, entryPrice, direction, calculation, floatData, floatCategory]);

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
          />
        </CardContent>
      </Card>

      {shareFloat && floatData && (
        <FloatInfoBox
          symbol={symbol}
          shareFloat={shareFloat}
          floatCategory={floatCategory}
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
          disabled={!entryPrice}
          className="bg-emerald-600 hover:bg-emerald-700 gap-2"
        >
          <Plus className="w-4 h-4" />Add to Journal
        </Button>
      </div>
    </div>
  );
}