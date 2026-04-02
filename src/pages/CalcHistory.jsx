/**
 * @file src/pages/CalcHistory.jsx
 *
 * Phase 2 - calculator history from Firebase via useCalcHistory().
 */

import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trash2, TrendingUp, TrendingDown, Calculator } from 'lucide-react';
import { createPageUrl } from '@/utils';
import { useCalcHistory } from '@/lib/hooks/useCalcHistory';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils/general';

const fmt = (n) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
  }).format(n ?? 0);

function RiskBadge({ level }) {
  return (
    <Badge
      className={cn(
        'text-xs',
        level === 'High' && 'bg-red-500/20 text-red-400',
        level === 'Medium' && 'bg-yellow-500/20 text-yellow-400',
        (!level || level === 'Low') && 'bg-emerald-500/20 text-emerald-400'
      )}
    >
      {level ?? 'Low'}
    </Badge>
  );
}

function FloatBadge({ category }) {
  if (!category) return null;
  const colors = {
    micro: 'bg-red-500/20 text-red-400',
    small: 'bg-orange-500/20 text-orange-400',
    medium: 'bg-yellow-500/20 text-yellow-400',
    large: 'bg-blue-500/20 text-blue-400',
    mega: 'bg-emerald-500/20 text-emerald-400',
  };

  return (
    <Badge className={cn('text-xs', colors[category] ?? 'bg-white/10 text-white/60')}>
      {category.charAt(0).toUpperCase() + category.slice(1)} Float
    </Badge>
  );
}

export default function CalcHistory() {
  const navigate = useNavigate();
  const { data: history = [], isLoading, deleteItem, clearHistory } = useCalcHistory();

  const summary = useMemo(
    () => ({
      totalRisk: history.reduce((sum, item) => sum + (item.actualRisk ?? 0), 0),
      totalPotential: history.reduce((sum, item) => sum + (item.potentialProfit ?? 0), 0),
      floatAnalysisCount: history.filter((item) => item.useIntelligentFlow).length,
    }),
    [history]
  );

  const loadItem = (item) =>
    navigate(createPageUrl('Calculator'), {
      state: {
        historyItem: {
          symbol: item.symbol,
          entryPrice: item.entryPrice,
          direction: item.direction,
        },
      },
    });

  return (
    <div className="space-y-6">
      {history.length > 0 && (
        <Button
          variant="ghost"
          onClick={() => window.confirm('Clear all history?') && clearHistory()}
          className="text-red-300 hover:bg-red-500/10 hover:text-red-200"
        >
          <Trash2 className="mr-2 h-4 w-4" />
          Clear All
        </Button>
      )}

      {history.length > 0 && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {[
            ['Calculations', history.length, 'text-white'],
            ['Total Risk', fmt(summary.totalRisk), 'text-red-300'],
            ['Profit Potential', fmt(summary.totalPotential), 'text-emerald-300'],
            ['Float Analyses', summary.floatAnalysisCount, 'text-sky-300'],
          ].map(([label, value, color]) => (
            <Card key={label}>
              <CardContent className="p-4">
                <p className="text-[11px] uppercase tracking-[0.16em] text-white/50">{label}</p>
                <p className={cn('mt-1 text-2xl font-bold', color)}>{value}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 animate-pulse rounded-xl bg-white/5" />
          ))}
        </div>
      ) : history.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-4 py-16">
            <Calculator className="h-16 w-16 text-white/20" />
            <p className="text-lg font-medium text-white/45">No history yet</p>
            <p className="text-sm text-white/30">Complete a calculation to see it here</p>
            <Button onClick={() => navigate(createPageUrl('Calculator'))} className="mt-2">
              Go to Calculator
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {history.map((item) => (
            <Card
              key={item.id}
              className="group cursor-pointer transition-colors hover:bg-[#1a2130]/85"
              onClick={() => loadItem(item)}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="mb-3 flex flex-wrap items-center gap-2">
                      <span className="text-lg font-bold text-white">{item.symbol || '--'}</span>
                      {item.direction === 'short' ? (
                        <TrendingDown className="h-4 w-4 text-red-400" />
                      ) : (
                        <TrendingUp className="h-4 w-4 text-emerald-400" />
                      )}
                      <RiskBadge level={item.riskLevel} />
                      <FloatBadge category={item.floatCategory} />
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-sm md:grid-cols-5">
                      {[
                        ['Entry', fmt(item.entryPrice)],
                        ['Shares', (item.shares ?? 0).toLocaleString()],
                        ['Position', fmt(item.positionValue)],
                        ['Risk', <span className="text-red-300">{fmt(item.actualRisk)}</span>],
                        ['Potential', <span className="text-emerald-300">{fmt(item.potentialProfit)}</span>],
                      ].map(([label, val]) => (
                        <div key={label}>
                          <p className="text-xs text-white/45">{label}</p>
                          <p className="mt-0.5 font-medium text-white">{val}</p>
                        </div>
                      ))}
                    </div>

                    <div className="mt-3 flex items-center gap-4 text-xs text-white/35">
                      <span>{new Date(item.timestamp).toLocaleString()}</span>
                      {item.stopLossPrice && <span>SL {fmt(item.stopLossPrice)}</span>}
                      {item.targetPrice && <span>TP {fmt(item.targetPrice)}</span>}
                    </div>
                  </div>

                  <Button
                    variant="ghost"
                    size="icon"
                    className="flex-shrink-0 text-red-300/60 opacity-0 transition-opacity hover:bg-red-500/10 hover:text-red-200 group-hover:opacity-100"
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteItem(item.id);
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
