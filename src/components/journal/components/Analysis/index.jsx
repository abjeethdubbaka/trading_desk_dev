import React, { useState, useMemo } from 'react';
import { useJournalAnalytics } from '../../hooks/useJournalAnalytics';
import { formatCurrency } from '../../utils/formatters';
import PerformanceSummary from './PerformanceSummary';
import RiskMetrics from './RiskMetrics';
import QualityIndicators from './QualityIndicators';
import { Filter, BarChart3 } from 'lucide-react';

// Calculate consecutive wins/losses
const calculateConsecutive = (trades, type) => {
  if (!trades || trades.length === 0) return 0;
  
  let max = 0;
  let current = 0;
  
  for (const trade of trades) {
    const isWin = (trade.pnl || 0) > 0;
    if ((type === 'win' && isWin) || (type === 'loss' && !isWin)) {
      current++;
      max = Math.max(max, current);
    } else {
      current = 0;
    }
  }
  
  return max;
};

export default function AnalysisPanel({ trades, isCollapsed }) {
  const [viewMode, setViewMode] = useState('all'); // 'all', 'winners', 'losers'
  const [expandedSections, setExpandedSections] = useState(new Set()); // Controls which sections are expanded
  
  const { overallPerformance } = useJournalAnalytics(trades);
  
  // Filter trades based on view mode
  const filteredTrades = useMemo(() => {
    if (viewMode === 'all') return trades;
    return trades.filter(t => 
      viewMode === 'winners' ? (t.pnl || 0) > 0 : (t.pnl || 0) < 0
    );
  }, [trades, viewMode]);

  // Calculate additional metrics
  const additionalMetrics = useMemo(() => {
    const winningTrades = trades.filter(t => (t.pnl || 0) > 0);
    const losingTrades = trades.filter(t => (t.pnl || 0) < 0);
    
    const totalWon = winningTrades.reduce((sum, t) => sum + (t.pnl || 0), 0);
    const totalLost = Math.abs(losingTrades.reduce((sum, t) => sum + (t.pnl || 0), 0));
    
    return {
      profitFactor: totalLost > 0 ? totalWon / totalLost : totalWon > 0 ? Infinity : 0,
      avgWinner: winningTrades.length > 0 ? totalWon / winningTrades.length : 0,
      avgLoser: losingTrades.length > 0 ? totalLost / losingTrades.length : 0,
      largestWinner: Math.max(...trades.map(t => t.pnl || 0), 0),
      largestLoser: Math.min(...trades.map(t => t.pnl || 0), 0),
      consecutiveWins: calculateConsecutive(trades, 'win'),
      consecutiveLosses: calculateConsecutive(trades, 'loss'),
      expectancy: overallPerformance.avgPerTrade || 0
    };
  }, [trades, overallPerformance]);

  // Toggle section expansion
  const toggleSection = (section) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(section)) {
      newExpanded.delete(section);
    } else {
      newExpanded.add(section);
    }
    setExpandedSections(newExpanded);
  };

  if (!trades || trades.length === 0) {
    return (
      <div className="bg-[#1a1a24] border border-white/10 rounded overflow-hidden h-full">
        {isCollapsed ? (
          <div className="p-3 flex flex-col items-center justify-center h-full">
            <Filter className="w-5 h-5 text-white/40 mb-1" />
            <div className="text-xs text-white/40 text-center">No Data</div>
          </div>
        ) : (
          <>
            <div className="p-4 border-b border-white/10">
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                <Filter className="w-5 h-5" />
                Analysis
              </h2>
            </div>
            
            <div className="p-8 text-center">
              <div className="text-white/50 text-sm">No trades to analyze</div>
              <div className="text-white/30 text-xs mt-1">Add some trades to see detailed analysis</div>
            </div>
          </>
        )}
      </div>
    );
  }

  // Collapsed state - show minimal indicator
  if (isCollapsed) {
    const totalPnL = trades.reduce((sum, t) => sum + (t.pnl || 0), 0);
    const winRate = trades.filter(t => (t.pnl || 0) > 0).length / trades.length * 100;
    
    return (
      <div className="bg-[#1a1a24] border border-white/10 rounded overflow-hidden h-full">
        <div className="p-3 flex flex-col items-center justify-center h-full space-y-2">
          <BarChart3 className="w-5 h-5 text-blue-400" />
          <div className="text-xs text-white/60 text-center">
            <div className={totalPnL >= 0 ? "text-emerald-400" : "text-red-400"}>
              {formatCurrency(totalPnL)}
            </div>
            <div className="text-white/40">
              {winRate.toFixed(0)}% WR
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-80 bg-[#1a1a24] border border-white/10 rounded overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-white/10">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Analysis
          </h2>
          
          {/* View Mode Toggle */}
          <div className="flex bg-white/5 rounded-lg p-1">
            <button
              onClick={() => setViewMode('all')}
              className={`px-2 py-1 text-xs rounded transition-colors ${
                viewMode === 'all' 
                  ? 'bg-white/20 text-white' 
                  : 'text-white/50 hover:text-white/70'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setViewMode('winners')}
              className={`px-2 py-1 text-xs rounded transition-colors ${
                viewMode === 'winners' 
                  ? 'bg-white/20 text-white' 
                  : 'text-white/50 hover:text-white/70'
              }`}
            >
              Winners
            </button>
            <button
              onClick={() => setViewMode('losers')}
              className={`px-2 py-1 text-xs rounded transition-colors ${
                viewMode === 'losers' 
                  ? 'bg-white/20 text-white' 
                  : 'text-white/50 hover:text-white/70'
              }`}
            >
              Losers
            </button>
          </div>
        </div>

        {/* View Mode Summary */}
        <div className="mt-3 p-2 bg-white/5 rounded">
          <div className="flex justify-between text-xs">
            <span className="text-white/70">
              {viewMode === 'all' ? 'All Trades' : 
               viewMode === 'winners' ? 'Winning Trades' : 'Losing Trades'}
            </span>
            <span className="text-white/90 font-medium">
              {formatCurrency(filteredTrades.reduce((sum, t) => sum + (t.pnl || 0), 0))}
            </span>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-6 max-h-[600px] overflow-y-auto">
        {/* Performance Summary */}
        <PerformanceSummary
          overallPerformance={overallPerformance}
          additionalMetrics={additionalMetrics}
          isExpanded={expandedSections.has('performance')}
          onToggle={() => toggleSection('performance')}
        />

        {/* Risk Metrics */}
        <RiskMetrics
          additionalMetrics={additionalMetrics}
          isExpanded={expandedSections.has('risk')}
          onToggle={() => toggleSection('risk')}
        />

        {/* Quality Indicators */}
        <QualityIndicators
          overallPerformance={overallPerformance}
          additionalMetrics={additionalMetrics}
        />
      </div>

      {/* Footer Stats */}
      <div className="p-3 border-t border-white/10 bg-white/5">
        <div className="flex justify-between text-xs text-white/40">
          <span>Last Updated: {new Date().toLocaleTimeString()}</span>
          <span>{trades.length} Total Trades</span>
        </div>
      </div>
    </div>
  );
}
