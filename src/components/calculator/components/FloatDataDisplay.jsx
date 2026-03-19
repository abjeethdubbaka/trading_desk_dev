import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { BarChart3, TrendingUp, TrendingDown, Info } from 'lucide-react';
import { getCategoryInfo } from '../utils/floatCategories';

export default function FloatDataDisplay({ floatData, calculation }) {
  if (!floatData || !calculation) return null;

  const categoryInfo = calculation.categoryInfo || getCategoryInfo(floatData.share_float);

  return (
    <Card className="bg-[#1a1a24] border-white/10">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>{calculation.symbol} Float Analysis</CardTitle>
            <CardDescription>{floatData.company_name || 'Company data not available'}</CardDescription>
          </div>
          <Badge className={`${categoryInfo.bgColor} ${categoryInfo.color} px-3 py-1`}>
            {categoryInfo.label.toUpperCase()} FLOAT
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* Share Float */}
          <div className="space-y-1">
            <p className="text-sm text-white/50 flex items-center gap-1">
              <BarChart3 className="w-3 h-3" />
              Share Float
            </p>
            <p className="text-xl font-bold">
              {calculation.floatSize?.toLocaleString()}
            </p>
            <p className="text-xs text-white/40">
              Total shares available
            </p>
          </div>
          
          {/* Volume to Float Ratio */}
          <div className="space-y-1">
            <p className="text-sm text-white/50 flex items-center gap-1">
              <TrendingUp className="w-3 h-3" />
              Volume/Float Ratio
            </p>
            <p className="text-xl font-bold">
              {calculation.volumeToFloat?.toFixed(2)}%
            </p>
            <p className="text-xs text-white/40">
              Daily volume vs float
            </p>
          </div>
          
          {/* Liquidity Score */}
          <div className="space-y-1">
            <p className="text-sm text-white/50">Liquidity Score</p>
            <div className="flex items-center gap-2">
              <div className="w-full bg-white/10 rounded-full h-2">
                <div 
                  className={cn(
                    "h-2 rounded-full",
                    calculation.liquidityScore > 70 ? "bg-emerald-500" :
                    calculation.liquidityScore > 40 ? "bg-yellow-500" : "bg-red-500"
                  )}
                  style={{ width: `${calculation.liquidityScore}%` }}
                />
              </div>
              <span className="font-bold">{calculation.liquidityScore?.toFixed(0)}</span>
            </div>
            <p className="text-xs text-white/40">
              0-100 scale
            </p>
          </div>
          
          {/* Max Float % */}
          <div className="space-y-1">
            <p className="text-sm text-white/50 flex items-center gap-1">
              <Info className="w-3 h-3" />
              Max Float %
            </p>
            <p className="text-xl font-bold">
              {calculation.maxFloatPercent?.toFixed(2)}%
            </p>
            <p className="text-xs text-white/40">
              Maximum recommended
            </p>
          </div>
        </div>
        
        {/* Float Category Description */}
        <div className="mt-4 p-3 bg-white/5 rounded-lg border border-white/10">
          <div className="flex items-start gap-2">
            <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${categoryInfo.color.replace('text-', 'bg-')}`} />
            <div>
              <p className="font-medium text-sm">{categoryInfo.label} Float</p>
              <p className="text-sm text-white/60">{categoryInfo.description}</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
