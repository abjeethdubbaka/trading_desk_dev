/**
 * @file src/pages/CalcHistory.jsx
 *
 * Phase 2 — calculator history from Firebase via useCalcHistory().
 */

import React, { useMemo }     from 'react';
import { useNavigate }         from 'react-router-dom';
import { createPageUrl }       from '@/utils';
import { useCalcHistory } from '@/lib/hooks/useCalcHistory';
import { Card, CardContent }   from '@/components/ui/card';
import { Button }              from '@/components/ui/button';
import { Badge }               from '@/components/ui/badge';
import { History, Trash2, TrendingUp, TrendingDown, Calculator, ArrowLeft, RefreshCw } from 'lucide-react';
import { cn }                  from '@/lib/utils';

const fmt = (n) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(n ?? 0);

function RiskBadge({ level }) {
  return (
    <Badge className={cn(
      'text-xs',
      level === 'High'   && 'bg-red-500/20    text-red-400',
      level === 'Medium' && 'bg-yellow-500/20 text-yellow-400',
      (!level || level === 'Low') && 'bg-emerald-500/20 text-emerald-400',
    )}>
      {level ?? 'Low'}
    </Badge>
  );
}

function FloatBadge({ category }) {
  if (!category) return null;
  const colors = {
    micro:  'bg-red-500/20    text-red-400',
    small:  'bg-orange-500/20 text-orange-400',
    medium: 'bg-yellow-500/20 text-yellow-400',
    large:  'bg-blue-500/20   text-blue-400',
    mega:   'bg-emerald-500/20 text-emerald-400',
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

  const summary = useMemo(() => ({
    totalRisk:         history.reduce((s, i) => s + (i.actualRisk       ?? 0), 0),
    totalPotential:    history.reduce((s, i) => s + (i.potentialProfit  ?? 0), 0),
    floatAnalysisCount:history.filter(i => i.useIntelligentFlow).length,
  }), [history]);

  const loadItem = (item) =>
    navigate(createPageUrl('Calculator'), {
      state: { historyItem: { symbol: item.symbol, entryPrice: item.entryPrice, direction: item.direction } },
    });

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white p-4 lg:p-8">
      <div className="max-w-6xl mx-auto space-y-6">

        {history.length > 0 && (
          <Button
            variant="ghost"
            onClick={() => window.confirm('Clear all history?') && clearHistory()}
            className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
          >
            <Trash2 className="w-4 h-4 mr-2" />Clear All
          </Button>
        )}

        {/* Summary */}
        {history.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              ['Calculations',    history.length,              'text-white'],
              ['Total Risk',      fmt(summary.totalRisk),      'text-red-400'],
              ['Profit Potential',fmt(summary.totalPotential), 'text-emerald-400'],
              ['Float Analyses',  summary.floatAnalysisCount,  'text-blue-400'],
            ].map(([label, value, color]) => (
              <Card key={label} className="bg-[#1a1a24] border-white/10">
                <CardContent className="p-4">
                  <p className="text-white/50 text-xs">{label}</p>
                  <p className={cn('text-2xl font-bold mt-1', color)}>{value}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* List */}
        {isLoading ? (
          <div className="space-y-2">
            {[1,2,3].map(i => <div key={i} className="h-24 bg-white/5 rounded-xl animate-pulse" />)}
          </div>
        ) : history.length === 0 ? (
          <Card className="bg-[#1a1a24] border-white/10">
            <CardContent className="flex flex-col items-center py-16 gap-4">
              <Calculator className="w-16 h-16 text-white/20" />
              <p className="text-white/40 text-lg font-medium">No history yet</p>
              <p className="text-white/25 text-sm">Complete a calculation to see it here</p>
              <Button onClick={() => navigate(createPageUrl('Calculator'))} className="bg-blue-600 hover:bg-blue-700 mt-2">
                Go to Calculator
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {history.map(item => (
              <Card
                key={item.id}
                className="bg-[#1a1a24] border-white/10 hover:bg-[#1f1f2e] transition-colors cursor-pointer group"
                onClick={() => loadItem(item)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">

                      {/* Top row: symbol + badges */}
                      <div className="flex items-center gap-2 mb-3 flex-wrap">
                        <span className="font-bold text-white text-lg">{item.symbol || '—'}</span>
                        {item.direction === 'short'
                          ? <TrendingDown className="w-4 h-4 text-red-400" />
                          : <TrendingUp   className="w-4 h-4 text-emerald-400" />}
                        <RiskBadge  level={item.riskLevel} />
                        <FloatBadge category={item.floatCategory} />
                      </div>

                      {/* Stats grid */}
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-sm">
                        {[
                          ['Entry',    fmt(item.entryPrice)],
                          ['Shares',   (item.shares ?? 0).toLocaleString()],
                          ['Position', fmt(item.positionValue)],
                          ['Risk',     <span className="text-red-400">{fmt(item.actualRisk)}</span>],
                          ['Potential',<span className="text-emerald-400">{fmt(item.potentialProfit)}</span>],
                        ].map(([label, val]) => (
                          <div key={label}>
                            <p className="text-white/40 text-xs">{label}</p>
                            <p className="text-white font-medium mt-0.5">{val}</p>
                          </div>
                        ))}
                      </div>

                      {/* Footer */}
                      <div className="flex items-center gap-4 mt-3 text-xs text-white/30">
                        <span>{new Date(item.timestamp).toLocaleString()}</span>
                        {item.stopLossPrice && <span>SL {fmt(item.stopLossPrice)}</span>}
                        {item.targetPrice   && <span>TP {fmt(item.targetPrice)}</span>}
                      </div>
                    </div>

                    {/* Delete */}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="opacity-0 group-hover:opacity-100 transition-opacity text-red-400/60 hover:text-red-400 hover:bg-red-500/10 flex-shrink-0"
                      onClick={(e) => { e.stopPropagation(); deleteItem(item.id); }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
