import { useState, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useCurrentBalance } from '@/lib/balanceUtils';
import { useSettings } from '@/lib/SettingsContext'; // Use SettingsContext's hook

export function usePositionSizeCalculator() {
  const { currentBalance } = useCurrentBalance();
  
  // Use settings from SettingsProvider
  const { settings } = useSettings();
  
  console.log('🔍 Position Size Calculator - Settings received:', {
    settings,
    maxDollars: settings?.max_dollars,
    hasSettings: !!settings,
    settingsKeys: settings ? Object.keys(settings) : []
  });
  
  const { data: watchlist = [] } = useQuery({
    queryKey: ['watchlist'],
    queryFn: () => base44.entities.WatchlistItem.list()
  });

  const [direction, setDirection] = useState('long');
  const [values, setValues] = useState({
    symbol: '',
    entryPrice: '',
    stopLoss: '',
    accountBalance: currentBalance?.toString() || settings?.account_size?.toString() || '',
    riskPercent: settings?.default_risk_percent || '1',
    riskRewardRatio: '2',
    stopLossPercent: '2',
    notes: ''
  });

  useEffect(() => {
    setValues(v => ({
      ...v,
      accountBalance: currentBalance?.toString() || v.accountBalance || settings?.account_size?.toString() || '',
      riskPercent: v.riskPercent || settings?.default_risk_percent || '1'
    }));
  }, [currentBalance, settings]);

  // Calculated values
  const accountBalance = parseFloat(values.accountBalance) || currentBalance || 0;
  const riskPercent = parseFloat(values.riskPercent) || 0;
  const entryPrice = parseFloat(values.entryPrice) || 0;
  const stopLoss = parseFloat(values.stopLoss) || 0;
  const rrRatio = parseFloat(values.riskRewardRatio) || 0;
  const stopLossPercent = parseFloat(values.stopLossPercent) || 0;

  // Auto-calculate stop loss from percentage
  const autoStopPrice = direction === 'long' 
    ? entryPrice * (1 - stopLossPercent / 100)
    : entryPrice * (1 + stopLossPercent / 100);

  const effectiveStopLoss = stopLoss || autoStopPrice;

  // Calculate risk & position
  const riskAmount = settings?.risk_amount || 1500; // Use fixed risk amount from settings
  const riskPerShare = Math.abs(entryPrice - effectiveStopLoss);
  const shares = riskPerShare > 0 ? Math.floor(riskAmount / riskPerShare) : 0;
  const positionCost = shares * entryPrice; // Fixed: Should be shares * entryPrice
  const rewardPerShare = riskPerShare * rrRatio;

  // Debug logging for position calculation
  console.log('🔍 Position Calculation Debug:', {
    accountBalance,
    riskPercent,
    riskAmount,
    riskPerShare,
    shares,
    entryPrice,
    positionCost,
    positionCostVsAccountBalance: (positionCost / accountBalance) * 100
  });

  // Calculate profit targets
  const target1R = direction === 'long' 
    ? entryPrice + riskPerShare 
    : entryPrice - riskPerShare;
  const target2R = direction === 'long' 
    ? entryPrice + (riskPerShare * 2) 
    : entryPrice - (riskPerShare * 2);
  const target3R = direction === 'long' 
    ? entryPrice + (riskPerShare * 3) 
    : entryPrice - (riskPerShare * 3);

  const targets = [
    { r: 1, price: target1R, shares: Math.floor(shares * 0.33), profit: riskAmount * 1 },
    { r: 2, price: target2R, shares: Math.floor(shares * 0.33), profit: riskAmount * 2 },
    { r: 3, price: target3R, shares: shares - (Math.floor(shares * 0.33) * 2), profit: riskAmount * 3, isTrailingStop: true }
  ];

  // Calculate overall profit
  const overallProfit = targets.reduce((total, target) => total + target.profit, 0);
  
  // Calculate maximum profit and exit price based on Max $ setting
  const maxDollars = parseFloat(settings?.max_dollars) || 5000;
  const maxProfit = maxDollars;
  const maxProfitExitPrice = shares > 0 
    ? direction === 'long' 
      ? entryPrice + (maxProfit / shares)
      : entryPrice - (maxProfit / shares)
    : entryPrice;

  // Debug logging
  console.log('🔍 Max $ Calculation Debug:', {
    settings,
    maxDollarsFromSettings: settings?.max_dollars,
    maxDollarsParsed: maxDollars,
    shares,
    entryPrice,
    direction,
    maxProfitExitPrice
  });

  const handleInputChange = (field, value) => {
    setValues(prev => ({ ...prev, [field]: value }));
  };

  const handleSymbolSelect = (symbol) => {
    const item = watchlist.find(w => w.symbol === symbol);
    setValues(prev => ({
      ...prev,
      symbol,
      notes: item?.notes || item?.catalyst || ''
    }));
  };

  const handleStopLossPercentChange = (value) => {
    setValues(prev => ({ ...prev, stopLossPercent: value, stopLoss: '' }));
  };

  return {
    // State
    direction,
    setDirection,
    values,
    watchlist,
    settings,
    
    // Calculated values
    accountBalance,
    riskPercent,
    entryPrice,
    stopLoss,
    rrRatio,
    stopLossPercent,
    effectiveStopLoss,
    riskAmount,
    riskPerShare,
    shares,
    positionCost,
    rewardPerShare,
    targets,
    overallProfit,
    maxProfit,
    maxProfitExitPrice,
    
    // Handlers
    handleInputChange,
    handleSymbolSelect,
    handleStopLossPercentChange
  };
}
