import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Info, Calculator, TrendingUp, AlertCircle } from 'lucide-react';

export default function DetailedAnalysis({ calculation, floatCategories, floatCategory, shareFloat, settings }) {
  console.log('🔍 Debug: DetailedAnalysis component called with:', { 
    calculation: !!calculation, 
    floatCategories: !!floatCategories, 
    floatCategory, 
    shareFloat: !!shareFloat, 
    settings: !!settings 
  });
  
  if (!calculation || !floatCategories) {
    console.log('🔍 Debug: DetailedAnalysis returning null - missing calculation or floatCategories');
    return null;
  }

  const categoryInfo = floatCategories[floatCategory];
  console.log('🔍 Debug: Category info:', categoryInfo);
  
  return (
    <Card className="bg-[#1a1a24] border-white/10 mt-4">
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-4">
          <Calculator className="w-4 h-4 text-blue-400" />
          <h3 className="text-sm font-semibold text-blue-400">Detailed Float Analysis</h3>
        </div>

        <div className="space-y-4 text-xs">
          {/* Input Parameters */}
          <div className="bg-white/5 rounded-lg p-3">
            <h4 className="font-medium text-white/90 mb-2 flex items-center gap-2">
              <Info className="w-3 h-3" />
              Input Parameters
            </h4>
            <div className="grid grid-cols-2 gap-2 text-white/70">
              <div>Account Size: ${settings?.account_size?.toLocaleString() || 'N/A'}</div>
              <div>Position Sizing: {settings?.position_sizing_percent || settings?.default_risk_percent}%</div>
              <div>Entry Price: ${calculation.entryPrice?.toFixed(2)}</div>
              <div>Direction: {calculation.direction}</div>
              <div>Share Float: {shareFloat?.toLocaleString()}</div>
              <div>Category: {floatCategory}</div>
            </div>
          </div>

          {/* Category Analysis */}
          {categoryInfo && (
            <div className="bg-white/5 rounded-lg p-3">
              <h4 className="font-medium text-white/90 mb-2 flex items-center gap-2">
                <TrendingUp className="w-3 h-3" />
                Category Analysis: {categoryInfo.label}
              </h4>
              <div className="grid grid-cols-2 gap-2 text-white/70">
                <div>Range: {categoryInfo.min?.toLocaleString()} - {categoryInfo.max === Infinity ? '∞' : categoryInfo.max?.toLocaleString()}</div>
                <div>Color: <span className={categoryInfo.color}>{categoryInfo.color}</span></div>
                <div>Position Multiplier: {categoryInfo.positionMultiplier}x</div>
                <div>Stop Loss: {categoryInfo.stopLossPercent}%</div>
                <div>Max Float Usage: {categoryInfo.maxFloatPercent}%</div>
                <div>In Range: {shareFloat >= categoryInfo.min && shareFloat < categoryInfo.max ? '✅' : '❌'}</div>
              </div>
            </div>
          )}

          {/* Calculation Steps */}
          <div className="bg-white/5 rounded-lg p-3">
            <h4 className="font-medium text-white/90 mb-2 flex items-center gap-2">
              <Calculator className="w-3 h-3" />
              Calculation Steps
            </h4>
            <div className="space-y-2 text-white/70">
              <div className="flex justify-between">
                <span>Base Position Value:</span>
                <span>${(settings?.account_size * (settings?.position_sizing_percent / 100))?.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Base Shares:</span>
                <span>{Math.floor((settings?.account_size * (settings?.position_sizing_percent / 100)) / calculation.entryPrice)}</span>
              </div>
              <div className="flex justify-between">
                <span>Adjusted Shares (×{categoryInfo?.positionMultiplier}):</span>
                <span>{calculation.shares?.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span>Max Shares by Float:</span>
                <span>{Math.floor(shareFloat * (categoryInfo?.maxFloatPercent / 100))?.toLocaleString()}</span>
              </div>
              <div className="flex justify-between font-medium text-white/90">
                <span>Final Shares:</span>
                <span>{calculation.shares?.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Risk Analysis */}
          <div className="bg-white/5 rounded-lg p-3">
            <h4 className="font-medium text-white/90 mb-2 flex items-center gap-2">
              <AlertCircle className="w-3 h-3" />
              Risk Analysis
            </h4>
            <div className="space-y-2 text-white/70">
              <div className="flex justify-between">
                <span>Stop Loss Price:</span>
                <span>${calculation.stopLossPrice?.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Risk per Share:</span>
                <span>${(calculation.entryPrice - calculation.stopLossPrice)?.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Total Risk:</span>
                <span className={calculation.riskLevel === 'High' ? 'text-red-400' : calculation.riskLevel === 'Medium' ? 'text-yellow-400' : 'text-emerald-400'}>
                  ${calculation.actualRisk?.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Risk % of Account:</span>
                <span>{calculation.actualRiskPercent?.toFixed(2)}%</span>
              </div>
              <div className="flex justify-between">
                <span>Risk Level:</span>
                <Badge className={
                  calculation.riskLevel === 'High' ? "bg-red-500/20 text-red-400" :
                  calculation.riskLevel === 'Medium' ? "bg-yellow-500/20 text-yellow-400" :
                  "bg-emerald-500/20 text-emerald-400"
                }>
                  {calculation.riskLevel}
                </Badge>
              </div>
            </div>
          </div>

          {/* Target Analysis */}
          <div className="bg-white/5 rounded-lg p-3">
            <h4 className="font-medium text-white/90 mb-2">Target Analysis</h4>
            <div className="space-y-2 text-white/70">
              <div className="flex justify-between">
                <span>Target Price:</span>
                <span>${calculation.targetPrice?.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Target Profit:</span>
                <span className="text-emerald-400">${calculation.targetProfit?.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>R:R Ratio:</span>
                <span>{calculation.riskRewardRatio?.toFixed(2)}:1</span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
