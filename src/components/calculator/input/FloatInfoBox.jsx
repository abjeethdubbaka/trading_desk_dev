import React, { useState } from 'react';
import { Info, ChevronDown, ChevronUp, CheckCircle2 } from 'lucide-react';

const FloatInfoBox = ({ symbol, shareFloat, floatCategory, calculation }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!symbol || !shareFloat || !floatCategory) return null;

  const getCategoryDescription = (category) => {
    const descriptions = {
      micro: 'Micro-cap floats require smaller positions to avoid market impact and slippage.',
      small: 'Small-cap floats allow moderate position sizing with controlled risk.',
      medium: 'Medium-cap floats provide good liquidity for standard position sizing.',
      large: 'Large-cap floats support larger positions with minimal market impact.',
      mega: 'Mega-cap floats offer excellent liquidity for maximum position sizing.'
    };
    return descriptions[category] || '';
  };

  return (
    <div 
      className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg cursor-pointer transition-all duration-300 hover:bg-blue-500/15"
      onMouseEnter={() => setIsExpanded(true)}
      onMouseLeave={() => setIsExpanded(false)}
    >
      <div className="flex items-start gap-3">
        <Info className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold text-blue-400">Position Size Based on Float Analysis</h4>
            <div className="text-blue-400 transition-transform duration-300">
              {isExpanded ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </div>
          </div>
          
          <div className={`overflow-hidden transition-all duration-300 ${isExpanded ? 'max-h-60 opacity-100 mt-2' : 'max-h-0 opacity-0'}`}>
            <div className="text-sm text-white/70 space-y-1">
              <p>
                <span className="font-medium text-white/90">Share Float:</span> {shareFloat.toLocaleString()} shares ({FLOAT_CATEGORIES[floatCategory].label} Float)
              </p>
              <p>
                <span className="font-medium text-white/90">Position Multiplier:</span> {FLOAT_CATEGORIES[floatCategory].positionMultiplier}x
              </p>
              <p>
                <span className="font-medium text-white/90">Max Float Usage:</span> {FLOAT_CATEGORIES[floatCategory].maxFloatPercent}% of total float
              </p>
              <p className="text-xs text-white/60 mt-2">
                {getCategoryDescription(floatCategory)}
              </p>
              
              {/* Risk Disclaimer */}
              {calculation && (
                <div className="mt-3 pt-3 border-t border-white/10">
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                    <p className="text-xs text-emerald-300">
                      This position risks {calculation.actualRiskPercent.toFixed(2)}% of your account.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
          
          {!isExpanded && (
            <p className="text-xs text-blue-300 mt-1">
              Hover to view detailed analysis
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default FloatInfoBox;


