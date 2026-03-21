import { useState, useEffect, useRef, useCallback } from 'react';
import { useTradingContext } from '@/lib/TradingContext';
import { useCurrentBalance } from '@/lib/balanceUtils';
import { getFloatCategory, getCategoryInfo } from '@/components/calculator/utils/floatCategories';
import { useFloatData } from './hooks/useFloatData';
import { useSettings } from '@/lib/SettingsContext';
import { toast } from 'sonner';

export default function useFloatPositionSizer({ selectedSymbol, selectedEntryPrice }) {
  const toNumber = (value, fallback = 0) => {
    const n = Number(value);
    return Number.isFinite(n) ? n : fallback;
  };

  // Basic state
  const [symbol, setSymbol] = useState('');
  const [entryPrice, setEntryPrice] = useState('');
  const [direction, setDirection] = useState('long');
  const [customStopLossPrice, setCustomStopLossPrice] = useState('');
  const [shareFloat, setShareFloat] = useState(null);
  const [floatCategory, setFloatCategory] = useState(null);
  const [calculation, setCalculation] = useState(null);
  const [floatData, setFloatData] = useState(null);

  // Ref to track last calculation to prevent infinite loops
  const lastCalculationRef = useRef(null);

  // Settings and data
  const { settings } = useSettings();
  const currentBalance = useCurrentBalance();
  const { loading, fetchShareFloat, setFloatDataState } = useFloatData(symbol);

  // Calculate basic values
  const accountSize = toNumber(currentBalance?.currentBalance ?? currentBalance ?? settings?.account_size, 50000);
  const positionSizingPercentValue = toNumber(settings?.position_sizing_percent || settings?.default_risk_percent, 1);
  const positionSizingPercent = positionSizingPercentValue / 100;
  const defaultStopLossPercent = toNumber(settings?.default_stop_loss_percent, 4) / 100;
  const targetProfitDollars = toNumber(settings?.target_profit_dollars, 500);
  const maxDollars = toNumber(settings?.max_dollars, 0);
  const riskAmount = toNumber(settings?.risk_amount, 1500);

  // Float category logic
  const floatCategories = settings?.floatCategories || {};
  const hasFloatCategories = Object.keys(floatCategories).length > 0;

  // Update float category when shareFloat changes
  useEffect(() => {
    if (shareFloat && hasFloatCategories) {
      const category = getFloatCategory(shareFloat, settings);
      const categoryInfo = getCategoryInfo(shareFloat, settings);
      setFloatCategory(category);
      setFloatDataState({
        symbol,
        shareFloat,
        floatCategory: category,
        floatData: categoryInfo
      });
    }
  }, [symbol, floatCategories, setFloatDataState, setShareFloat, setFloatCategory]);

  // Sync with TradingContext
  useEffect(() => {
    if (selectedSymbol && selectedSymbol !== symbol) {
      setSymbol(selectedSymbol);
    }
    if (selectedEntryPrice != null && selectedEntryPrice !== entryPrice) {
      setEntryPrice(selectedEntryPrice.toString());
    }
  }, [selectedSymbol, selectedEntryPrice, symbol, entryPrice]);

  // Single calculation runner used by auto and manual calculate flows
  const runCalculation = useCallback(() => {
    if (!entryPrice) return;

    const entry = parseFloat(entryPrice);
    if (isNaN(entry)) return;

    let result = null;
    let calcKey = '';

    // Feature 3: Share float calculator (when symbol and share float are provided)
    if (symbol && shareFloat) {
      calcKey = `float-${symbol}-${entry}-${shareFloat}`;
      
      if (lastCalculationRef.current === calcKey) return;

      // Use existing float calculation logic
      const riskPerShare = entry * (defaultStopLossPercent);
      const shares = Math.floor(riskAmount / riskPerShare);
      const positionValue = shares * entry;
      const actualRisk = shares * riskPerShare;
      const stopLossPercentValue = defaultStopLossPercent * 100;
      const targetPrice = direction === 'long' ? entry + (riskPerShare * 3) : entry - (riskPerShare * 3);

      result = {
        symbol,
        entryPrice: entry,
        stopLossPrice: direction === 'long' ? entry * (1 - defaultStopLossPercent) : entry * (1 + defaultStopLossPercent),
        accountBalance: accountSize,
        riskAmount,
        shares,
        positionValue,
        actualRisk,
        riskPercent: positionValue > 0 ? (actualRisk / positionValue) * 100 : 0,
        actualRiskPercent: accountSize > 0 ? (actualRisk / accountSize) * 100 : 0,
        stopLossPercent: stopLossPercentValue,
        targetPrice,
        defaultTargetPrice: targetPrice,
        defaultTargetProfit: targetProfitDollars,
        targetProfit: targetProfitDollars,
        maxDollars,
        maxShares: maxDollars > 0 ? Math.floor(maxDollars / entry) : shares,
        usingDynamicTarget: false,
        direction,
        riskRewardRatio: 3,
        shareFloat,
        floatCategory,
        calculatedAt: new Date().toLocaleString(),
        calculationType: 'float'
      };
    }

    // Feature 2: Entry price + stop loss - use account balance and risk amount
    else if (customStopLossPrice) {
      const stopLoss = parseFloat(customStopLossPrice);
      if (isNaN(stopLoss) || entry === stopLoss) return;

      const dollarRisk = riskAmount;
      calcKey = `entry-stop-${entry}-${stopLoss}-${dollarRisk}-${accountSize}-${positionSizingPercent}`;
      
      if (lastCalculationRef.current === calcKey) return;

      const riskPerShare = Math.abs(entry - stopLoss);
      const sharesByRisk = Math.floor(dollarRisk / riskPerShare);
      const sharesByBalance = Math.floor(accountSize / entry);
      const shares = Math.max(0, Math.min(sharesByRisk, sharesByBalance));
      const positionValue = shares * entry;
      const realizedRisk = shares * riskPerShare;
      const stopLossPercentValue = entry > 0 ? (riskPerShare / entry) * 100 : 0;
      const targetPrice = direction === 'long' ? entry + (riskPerShare * 3) : entry - (riskPerShare * 3);

      result = {
        entryPrice: entry,
        stopLossPrice: stopLoss,
        accountBalance: accountSize,
        riskAmount: dollarRisk,
        shares,
        positionValue,
        actualRisk: realizedRisk,
        realizedRisk,
        riskPercent: positionValue > 0 ? (realizedRisk / positionValue) * 100 : 0,
        actualRiskPercent: accountSize > 0 ? (realizedRisk / accountSize) * 100 : 0,
        stopLossPercent: stopLossPercentValue,
        targetPrice,
        defaultTargetPrice: targetPrice,
        defaultTargetProfit: targetProfitDollars,
        targetProfit: targetProfitDollars,
        maxDollars,
        maxShares: sharesByBalance,
        usingDynamicTarget: false,
        direction,
        riskRewardRatio: 3,
        calculatedAt: new Date().toLocaleString(),
        calculationType: 'entry-stop'
      };

    }

    // Feature 1: Entry price only - use default stop loss percentagefault settings
    else if (!customStopLossPrice) {
      calcKey = `entry-only-${entry}-${positionSizingPercent}-${defaultStopLossPercent}-${targetProfitDollars}-${maxDollars}-${accountSize}`;
      
      if (lastCalculationRef.current === calcKey) return;

      // Use default stop loss percentage
      const stopLossPrice = direction === 'long' ? entry * (1 - defaultStopLossPercent) : entry * (1 + defaultStopLossPercent);
      const riskPerShare = Math.abs(entry - stopLossPrice);
      
      // Use position sizing % of account
      const positionSize = accountSize * positionSizingPercent;
      
      // Apply max dollars limit
      const finalPositionSize = maxDollars > 0 ? Math.min(positionSize, maxDollars) : positionSize;
      const shares = Math.floor(finalPositionSize / entry);
      const positionValue = shares * entry;
      const actualRisk = shares * riskPerShare;

      const stopLossPercentValue = defaultStopLossPercent * 100;
      const targetPrice = direction === 'long' ? entry + (riskPerShare * 3) : entry - (riskPerShare * 3);
      const maxShares = maxDollars > 0 ? Math.floor(maxDollars / entry) : shares;

      result = {
        symbol: symbol || undefined,
        entryPrice: entry,
        stopLossPrice: stopLossPrice,
        accountBalance: accountSize,
        shares,
        positionValue: finalPositionSize,
        actualRisk,
        riskPercent: finalPositionSize > 0 ? (actualRisk / finalPositionSize) * 100 : 0,
        actualRiskPercent: accountSize > 0 ? (actualRisk / accountSize) * 100 : 0,
        stopLossPercent: stopLossPercentValue,
        targetPrice,
        defaultTargetPrice: targetPrice,
        defaultTargetProfit: targetProfitDollars,
        targetProfit: targetProfitDollars,
        maxDollars,
        maxShares,
        usingDynamicTarget: false,
        direction,
        riskRewardRatio: 3,
        calculatedAt: new Date().toLocaleString(),
        calculationType: 'entry-only'
      };
    }

    if (result) {
      lastCalculationRef.current = calcKey;
      setCalculation(result);
      return result;
    }
    return null;
  }, [entryPrice, customStopLossPrice, symbol, shareFloat, accountSize, positionSizingPercent, defaultStopLossPercent, targetProfitDollars, maxDollars, riskAmount, direction, settings, hasFloatCategories, setFloatDataState, floatCategory]);

  const saveCalculationToHistory = useCallback((result) => {
    try {
      const riskPercentOfAccount = accountSize > 0
        ? ((Number(result.actualRisk) || 0) / accountSize) * 100
        : 0;
      const riskLevel = riskPercentOfAccount >= 2 ? 'High' : riskPercentOfAccount >= 1 ? 'Medium' : 'Low';

      const historyItem = {
        id: Date.now(),
        timestamp: new Date().toISOString(),
        symbol: result.symbol || symbol || 'Unknown',
        entryPrice: Number(result.entryPrice) || 0,
        shares: Number(result.shares) || 0,
        stopLossPrice: Number(result.stopLossPrice) || 0,
        targetPrice: Number(result.targetPrice) || 0,
        positionValue: Number(result.positionValue) || 0,
        actualRisk: Number(result.actualRisk) || 0,
        riskAmount: Number(result.riskAmount ?? result.actualRisk) || 0,
        potentialProfit: Number(result.targetProfit ?? ((Number(result.actualRisk) || 0) * 3)) || 0,
        targetProfit: Number(result.targetProfit) || 0,
        direction: result.direction || direction || 'long',
        riskLevel,
        useIntelligentFlow: result.calculationType === 'float',
        floatCategory: result.floatCategory || null,
        calculatedAt: result.calculatedAt
      };

      const existingHistory = localStorage.getItem('calcHistory');
      const history = existingHistory ? JSON.parse(existingHistory) : [];
      const nextHistory = [historyItem, ...history].slice(0, 100);
      localStorage.setItem('calcHistory', JSON.stringify(nextHistory));
    } catch (error) {
      console.error('Failed to save to calculation history:', error);
    }
  }, [accountSize, direction, symbol]);

  const calculatePosition = useCallback(() => {
    // Manual calculate should recompute even with same values
    lastCalculationRef.current = null;
    const result = runCalculation();
    if (result) {
      saveCalculationToHistory(result);
      toast.success(`Calculated ${result.shares.toLocaleString()} shares (${result.calculationType})`);
    }
  }, [runCalculation, saveCalculationToHistory]);

  // Click-only mode: clear stale calculation while editing inputs
  useEffect(() => {
    setCalculation(null);
    lastCalculationRef.current = null;
  }, [entryPrice, customStopLossPrice, direction, symbol]);

  // Clear calculation when inputs change
  const clearCalculation = () => {
    setCalculation(null);
    setShareFloat(null);
    setFloatCategory(null);
    setFloatDataState(null);
    lastCalculationRef.current = null;
  };

  return {
    // State
    symbol,
    setSymbol,
    entryPrice,
    setEntryPrice,
    direction,
    setDirection,
    customStopLossPrice,
    setCustomStopLossPrice,
    loading,
    shareFloat,
    floatCategory,
    calculation,
    floatData,
    
    // Actions
    fetchShareFloat,
    calculatePosition,
    clearCalculation,
    
    // Settings
    accountSize,
    riskAmount,
    positionSizingPercent,
    defaultStopLossPercent,
    targetProfitDollars,
    maxDollars,
    settings,
    hasFloatCategories
  };
}
