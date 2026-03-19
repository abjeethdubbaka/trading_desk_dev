import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export default function ResultsDisplay({ calculation }) {
  if (!calculation) return null;

  const entryPrice = Number(calculation.entryPrice || 0);
  const stopLossPrice = Number(calculation.stopLossPrice || 0);
  const shares = Number(calculation.shares || 0);
  const direction = calculation.direction || 'long';
  const riskPerShare = Math.abs(entryPrice - stopLossPrice);

  const stopLossPercent = calculation.stopLossPercent ?? (entryPrice > 0 ? (riskPerShare / entryPrice) * 100 : 0);
  const targetPrice = calculation.targetPrice ?? (direction === 'long'
    ? entryPrice + (riskPerShare * 3)
    : entryPrice - (riskPerShare * 3));
  const actualRisk = calculation.actualRisk ?? calculation.riskAmount ?? (shares * riskPerShare);
  const riskRewardRatio = calculation.riskRewardRatio ?? (riskPerShare > 0 ? Math.abs(targetPrice - entryPrice) / riskPerShare : 0);
  const targetProfit = calculation.targetProfit ?? (actualRisk * riskRewardRatio);
  const riskBudget = Number(calculation.riskAmount ?? actualRisk ?? 0);
  const riskAmountPerShare = shares > 0 ? (riskBudget / shares) : 0;
  const riskAmountTouchPrice = direction === 'long'
    ? entryPrice - riskAmountPerShare
    : entryPrice + riskAmountPerShare;
  const maxDollarTarget = Number(calculation.maxDollars ?? calculation.targetProfit ?? 0);
  const maxDollarPerShare = shares > 0 ? (maxDollarTarget / shares) : 0;
  const maxDollarTouchPrice = direction === 'long'
    ? entryPrice + maxDollarPerShare
    : entryPrice - maxDollarPerShare;
  const sharesAt1R = Math.floor(shares * 0.33);
  const sharesAt2R = Math.floor(shares * 0.33);
  const sharesAt3R = Math.max(0, shares - (sharesAt1R + sharesAt2R));
  const profitAt1R = sharesAt1R * riskPerShare * 1;
  const profitAt2R = sharesAt2R * riskPerShare * 2;
  const profitAt3R = sharesAt3R * riskPerShare * 3;
  const totalExitProfit = profitAt1R + profitAt2R + profitAt3R;
  const realizedRisk = Number(calculation.realizedRisk ?? (shares * riskPerShare));
  const totalExitR = realizedRisk > 0 ? totalExitProfit / realizedRisk : 0;

  const accountBalance = Number(calculation.accountBalance || 0);
  const positionValue = Number(calculation.positionValue || (shares * entryPrice));
  const percentOfAccount = calculation.percentOfAccount ?? (accountBalance > 0 ? (positionValue / accountBalance) * 100 : 0);
  const actualRiskPercent = calculation.actualRiskPercent ?? (accountBalance > 0 ? (actualRisk / accountBalance) * 100 : 0);

  const riskLevel = calculation.riskLevel || (actualRiskPercent >= 2 ? 'High' : actualRiskPercent >= 1 ? 'Medium' : 'Low');
  const riskColor = calculation.riskColor || (riskLevel === 'High' ? '#ef4444' : riskLevel === 'Medium' ? '#f59e0b' : '#10b981');

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  const formatNumber = (number, decimals = 0) => {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    }).format(number);
  };

  return (
    <Card className="bg-[#1a1a24] border-white/10">
      <CardContent className="space-y-6 p-6">
        {/* Main Results Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Left Side - Combined Trading Card */}
          <div className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 rounded-xl p-6 border border-blue-500/20">
            <div className="grid grid-cols-1 gap-6">
              {/* Shares */}
              <div>
                <p className="text-sm text-white/50 mb-2">Shares to Buy</p>
                <p className="text-3xl font-bold text-blue-400">
                  {shares.toLocaleString() || '0'}
                </p>
                <p className="text-sm text-white-60 mt-2">
                  @ ${entryPrice.toFixed(2) || '0.00'}
                </p>
              </div>
              
              {/* Stop Loss */}
              <div>
                <p className="text-sm text-white/50 mb-2">Stop Loss</p>
                <div className="flex items-baseline gap-2">
                  <p className="text-2xl font-bold text-amber-400">
                    ${stopLossPrice.toFixed(2) || '0.00'}
                  </p>
                  <Badge className="bg-amber-500/20 text-amber-400">
                    {stopLossPercent.toFixed(1) || '0.0'}%
                  </Badge>
                </div>
                <p className="text-sm text-white-60 mt-2">
                  ${riskPerShare.toFixed(2)} risk per share
                </p>
                <p className="text-xs text-white-50 mt-1">
                  Risk amount touch price: ${riskAmountTouchPrice.toFixed(2)}
                </p>
              </div>
              
              {/* Target Price */}
              <div>
                <p className="text-sm text-white/50 mb-2">Target Price</p>
                <p className="text-3xl font-bold text-green-400">
                  ${targetPrice.toFixed(2) || '0.00'}
                </p>
                <p className="text-sm text-white-60 mt-2">
                  {direction === 'long' ? '+' : '-'}${Math.abs(targetPrice - entryPrice).toFixed(2)} per share
                </p>
                <p className="text-xs text-white-50 mt-1">
                  Max $ touch price: ${maxDollarTouchPrice.toFixed(2)}
                </p>
                
                {/* Exit Strategy */}
                <div className="mt-3 pt-3 border-t border-blue-500/20">
                  <p className="text-xs text-blue-300 font-semibold mb-2">Exit Strategy:</p>
                  <div className="space-y-1">
                    <p className="text-xs text-white-60">
                      • {sharesAt1R} shares at 1R (${(entryPrice + (direction === 'long' ? 1 : -1) * riskPerShare).toFixed(2)})
                    </p>
                    <p className="text-xs text-white-60">
                      • {sharesAt2R} shares at 2R (${(entryPrice + (direction === 'long' ? 2 : -2) * riskPerShare).toFixed(2)})
                    </p>
                    <p className="text-xs text-white-60">
                      • {sharesAt3R} shares at 3R (Trailing Stop) (${(entryPrice + (direction === 'long' ? 3 : -3) * riskPerShare).toFixed(2)})
                    </p>
                    <p className="text-xs text-blue-300 font-semibold mt-2 pt-2 border-t border-blue-500/20">
                      Total Profit: ${totalExitProfit.toFixed(2)} ({totalExitR.toFixed(2)}R total)
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Right Side - Combined Money Card */}
          <div className="bg-gradient-to-br from-purple-500/10 to-indigo-500/10 rounded-xl p-6 border border-purple-500/20">
            <p className="text-lg font-semibold text-purple-300 mb-4">Position Summary</p>
            
            <div className="space-y-4">
              {/* Position Value */}
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm text-white/50">Position Value</p>
                  <p className="text-2xl font-bold text-purple-400">
                    {formatCurrency(positionValue || 0)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-white-60">
                    {percentOfAccount.toFixed(1) || '0.0'}% of account
                  </p>
                </div>
              </div>
              
              {/* Risk Amount */}
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm text-white/50">Risk Amount</p>
                  <div className="flex items-baseline gap-2">
                    <p className="text-2xl font-bold" style={{ color: riskColor || '#fff' }}>
                      {formatCurrency(actualRisk || 0)}
                    </p>
                    <Badge className={cn(
                      "text-xs",
                      riskLevel === 'High' ? "bg-red-500/20 text-red-400" :
                      riskLevel === 'Medium' ? "bg-yellow-500/20 text-yellow-400" :
                      "bg-emerald-500/20 text-emerald-400"
                    )}>
                      {riskLevel || 'Low'}
                    </Badge>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs text-white-60">
                    {actualRiskPercent.toFixed(1) || '0.0'}% of account
                  </p>
                </div>
              </div>
              
              {/* Risk/Reward */}
              <div className="flex justify-between items-center pt-3 border-t border-purple-500/20">
                <div>
                  <p className="text-sm text-white/50">Risk/Reward</p>
                  <p className="text-2xl font-bold text-indigo-400">
                    1:{riskRewardRatio.toFixed(1) || '0.0'}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-white-50">Target Profit</p>
                  <p className="text-lg font-bold text-indigo-400">
                    ${targetProfit?.toLocaleString() || '0'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Additional Analysis Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
          {/* Debug logging */}
          {console.log('🔍 ResultsDisplay - Float Analysis Check:', {
            hasShareFloat: !!calculation.shareFloat,
            hasFloatCategory: !!calculation.floatCategory,
            shareFloat: calculation.shareFloat,
            floatCategory: calculation.floatCategory,
            floatUtilization: calculation.floatUtilization
          })}
          
          {/* Float Analysis */}
          {(calculation.shareFloat || calculation.floatCategory) && (
            <div className="bg-gradient-to-br from-cyan-500/10 to-blue-500/10 rounded-xl p-4 border border-cyan-500/20">
              <p className="text-sm font-semibold text-cyan-300 mb-3">Float Analysis</p>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <p className="text-xs text-white/60">Share Float</p>
                  <p className="text-sm font-bold text-cyan-400">
                    {calculation.shareFloat ? (calculation.shareFloat / 1000000).toFixed(0) + 'M' : 'N/A'}
                  </p>
                </div>
                <div className="flex justify-between items-center">
                  <p className="text-xs text-white/60">Float Category</p>
                  <p className="text-sm font-bold text-cyan-400">
                    {calculation.floatCategory || 'N/A'}
                  </p>
                </div>
                <div className="flex justify-between items-center">
                  <p className="text-xs text-white/60">Float Utilization</p>
                  <p className="text-sm font-bold text-cyan-400">
                    {calculation.floatUtilization?.toFixed(2) || '0.0'}%
                  </p>
                </div>
              </div>
            </div>
          )}
          
          {/* Target Price Comparison */}
          <div className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 rounded-xl p-4 border border-green-500/20">
            <p className="text-sm font-semibold text-green-300 mb-3">Target Price Analysis</p>
            {/* Debug logging for Target Price */}
            {console.log('🔍 ResultsDisplay - Target Price Check:', {
              defaultTargetPrice: calculation.defaultTargetPrice,
              targetPrice: calculation.targetPrice,
              usingDynamicTarget: calculation.usingDynamicTarget,
              entryPrice: calculation.entryPrice,
              stopLossPercent: calculation.stopLossPercent,
              maxDollars: calculation.maxDollars,
              maxShares: calculation.maxShares,
              actualRisk: calculation.actualRisk,
              defaultTargetProfit: calculation.defaultTargetProfit
            })}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-xs text-white/60">Target Profit</p>
                  <p className="text-xs text-white-40">(${calculation.defaultTargetProfit?.toLocaleString() || '0'})</p>
                </div>
                <p className="text-sm font-bold text-green-400">
                  ${calculation.defaultTargetPrice?.toFixed(2) || '0.00'}
                </p>
              </div>
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-xs text-white/60">Stop Loss</p>
                  <p className="text-xs text-white-40">(${calculation.actualRisk?.toLocaleString() || '0'})</p>
                </div>
                <p className="text-sm font-bold text-green-400">
                  ${calculation.direction === 'long' 
                    ? ((calculation.entryPrice || 0) * (1 - (calculation.defaultStopLossPercent || 3) / 100)).toFixed(2)
                    : ((calculation.entryPrice || 0) * (1 + (calculation.defaultStopLossPercent || 3) / 100)).toFixed(2)
                  }
                </p>
              </div>
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-xs text-white/60">Max Shares for Profit</p>
                  <p className="text-xs text-white-40">(${calculation.maxDollars?.toLocaleString() || '0'})</p>
                </div>
                <p className="text-sm font-bold text-green-400">
                  {calculation.maxShares?.toLocaleString() || '0'} shares
                </p>
              </div>
              <div className="flex justify-between items-center">
                <p className="text-xs text-white/60">Using Dynamic</p>
                <p className="text-sm font-bold text-green-400">
                  {calculation.usingDynamicTarget ? 'Yes' : 'No'}
                </p>
              </div>
            </div>
          </div>
          
          {/* Dynamic Adjustments */}
          {calculation.dynamicAdjustments && calculation.dynamicAdjustments.length > 0 && (
            <div className="bg-gradient-to-br from-amber-500/10 to-orange-500/10 rounded-xl p-4 border border-amber-500/20">
              <p className="text-sm font-semibold text-amber-300 mb-3">Dynamic Adjustments</p>
              <div className="space-y-2">
                {calculation.dynamicAdjustments.map((adjustment, index) => (
                  <div key={index} className="flex justify-between items-center">
                    <p className="text-xs text-white/60">{adjustment.type}</p>
                    <p className="text-sm font-bold text-amber-400">
                      {adjustment.factor}x
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
