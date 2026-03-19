import React from 'react';
import { formatCurrency } from '../../utils/formatters';
import { AlertCircle, ChevronRight } from 'lucide-react';

const RiskMetrics = ({ additionalMetrics, isExpanded, onToggle }) => {
  return (
    <div className="space-y-3">
      <button
        onClick={onToggle}
        className="text-sm font-semibold text-white uppercase tracking-wider flex items-center gap-2 hover:text-white/80 transition-colors"
      >
        <AlertCircle className="w-4 h-4 text-amber-400" />
        Risk Metrics
        <ChevronRight 
          className={`w-3 h-3 transition-transform ${
            isExpanded ? 'rotate-90' : ''
          }`} 
        />
      </button>
      
      {isExpanded && (
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-white/5 rounded p-2">
            <div className="text-xs text-white/50">Avg Winner</div>
            <div className="text-sm font-bold text-emerald-400">
              {formatCurrency(additionalMetrics.avgWinner)}
            </div>
          </div>
          <div className="bg-white/5 rounded p-2">
            <div className="text-xs text-white/50">Avg Loser</div>
            <div className="text-sm font-bold text-red-400">
              {formatCurrency(additionalMetrics.avgLoser)}
            </div>
          </div>
          <div className="bg-white/5 rounded p-2">
            <div className="text-xs text-white/50">Win/Loss Ratio</div>
            <div className="text-sm font-bold text-white">
              {additionalMetrics.avgLoser > 0 
                ? (additionalMetrics.avgWinner / additionalMetrics.avgLoser).toFixed(2) 
                : '∞'}
            </div>
          </div>
          <div className="bg-white/5 rounded p-2">
            <div className="text-xs text-white/50">Largest Win</div>
            <div className="text-sm font-bold text-emerald-400">
              {formatCurrency(additionalMetrics.largestWinner)}
            </div>
          </div>
          <div className="bg-white/5 rounded p-2 col-span-2">
            <div className="text-xs text-white/50">Largest Loss</div>
            <div className="text-sm font-bold text-red-400">
              {formatCurrency(additionalMetrics.largestLoser)}
            </div>
          </div>

          {/* Risk Warning if applicable */}
          {additionalMetrics.largestLoser < -1000 && (
            <div className="p-2 bg-red-500/10 border border-red-500/20 rounded flex items-start gap-2 col-span-2">
              <AlertCircle className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-white/70">
                Large losing trade detected: {formatCurrency(additionalMetrics.largestLoser)}. 
                Consider reviewing risk management.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default RiskMetrics;
