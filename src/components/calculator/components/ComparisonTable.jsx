import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import { 
  FLOAT_CATEGORIES, 
  FLOAT_RULES, 
  getFloatCategory 
} from '../utils/floatCategories';
import { calculatePosition } from '../utils/floatCalculations';

export default function ComparisonTable({ calculation, floatData }) {
  if (!calculation || !floatData) return null;

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  return (
    <Card className="bg-[#1a1a24] border-white/10">
      <CardHeader>
        <CardTitle>Quick Comparison</CardTitle>
        <CardDescription>See how this position compares to other float categories</CardDescription>
      </CardHeader>
      
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-left py-2 px-4 text-sm font-medium text-white/60">Float Category</th>
                <th className="text-left py-2 px-4 text-sm font-medium text-white/60">Max Float %</th>
                <th className="text-left py-2 px-4 text-sm font-medium text-white/60">Risk Multiplier</th>
                <th className="text-left py-2 px-4 text-sm font-medium text-white/60">Stop Loss %</th>
                <th className="text-left py-2 px-4 text-sm font-medium text-white/60">If Same Position</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(FLOAT_CATEGORIES).map(([key, category]) => {
                const isCurrent = key === calculation.floatCategory;
                const maxFloatPercent = FLOAT_RULES.maxFloatPercent[key];
                const riskMultiplier = FLOAT_RULES.riskMultipliers[key];
                const stopPercent = FLOAT_RULES.stopLossPercent[key];
                
                // Calculate what position would be in this category
                const hypotheticalFloatData = {
                  ...floatData,
                  share_float: category.min + 10000000 // Example size within category
                };
                
                const hypotheticalCalc = calculatePosition(
                  hypotheticalFloatData,
                  calculation.entryPrice,
                  calculation.accountSize,
                  calculation.tradingStyle,
                  {
                    useAdvanced: true,
                    customRiskPercent: calculation.riskPercent,
                    customStopPercent: stopPercent
                  }
                );
                
                return (
                  <tr 
                    key={key} 
                    className={cn(
                      "border-b border-white/5 hover:bg-white/5",
                      isCurrent && "bg-white/5"
                    )}
                  >
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${category.color.replace('text-', 'bg-')}`} />
                        <span className={cn("font-medium", isCurrent && "font-bold")}>
                          {category.label}
                        </span>
                        {isCurrent && (
                          <Badge size="sm" className="ml-2">Current</Badge>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className={cn(
                        "font-medium",
                        maxFloatPercent > FLOAT_RULES.maxFloatPercent[calculation.floatCategory] 
                          ? "text-emerald-400" 
                          : "text-white/60"
                      )}>
                        {maxFloatPercent.toFixed(2)}%
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className={cn(
                        "font-medium",
                        riskMultiplier > FLOAT_RULES.riskMultipliers[calculation.floatCategory]
                          ? "text-emerald-400"
                          : riskMultiplier < FLOAT_RULES.riskMultipliers[calculation.floatCategory]
                          ? "text-red-400"
                          : "text-white"
                      )}>
                        {riskMultiplier.toFixed(1)}×
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className={cn(
                        "font-medium",
                        stopPercent > FLOAT_RULES.stopLossPercent[calculation.floatCategory]
                          ? "text-emerald-400"
                          : "text-white/60"
                      )}>
                        {stopPercent.toFixed(1)}%
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="text-right">
                        <p className="font-medium">
                          {hypotheticalCalc?.shares.toLocaleString() || 'N/A'} shares
                        </p>
                        <p className="text-xs text-white/50">
                          {hypotheticalCalc ? formatCurrency(hypotheticalCalc.positionValue) : 'N/A'}
                        </p>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        
        <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/20 rounded">
          <div className="flex items-start gap-2">
            <Info className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-white/70">
              If this stock had a <strong>Mega float</strong>, you could buy{" "}
              <strong>
                {(() => {
                  const megaFloatData = {
                    ...floatData,
                    share_float: FLOAT_CATEGORIES.mega.min + 1000000000
                  };
                  const megaCalc = calculatePosition(
                    megaFloatData,
                    calculation.entryPrice,
                    calculation.accountSize,
                    calculation.tradingStyle,
                    {
                      useAdvanced: true,
                      customRiskPercent: calculation.riskPercent,
                      customStopPercent: FLOAT_RULES.stopLossPercent.mega
                    }
                  );
                  return megaCalc?.shares.toLocaleString() || 'N/A';
                })()} shares
              </strong>{" "}
              (instead of {calculation.shares.toLocaleString()}) with a{" "}
              <strong>{FLOAT_RULES.stopLossPercent.mega.toFixed(1)}% stop loss</strong>.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
