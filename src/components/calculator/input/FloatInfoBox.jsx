import React, { useState } from 'react';
import { Info, ChevronDown, ChevronUp, CheckCircle2, Activity, Layers, Percent } from 'lucide-react';
import { FLOAT_CATEGORIES } from '../float-calculator/constants';

const FloatInfoBox = ({ symbol, shareFloat, floatCategory, floatCategories, calculation }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const activeFloatCategories = floatCategories || FLOAT_CATEGORIES;
  const categoryInfo = activeFloatCategories?.[floatCategory];
  const riskPercent = calculation?.actualRiskPercent ?? calculation?.actualRiskPct;

  if (!symbol || !shareFloat || !floatCategory || !categoryInfo) return null;

  const getCategoryDescription = (category) => {
    const descriptions = {
      micro: 'Micro-cap floats require smaller positions to reduce impact and slippage.',
      small: 'Small-cap floats support moderate sizing with controlled risk.',
      medium: 'Medium-cap floats provide balanced liquidity for standard sizing.',
      large: 'Large-cap floats can handle larger positions with less slippage.',
      mega: 'Mega-cap floats offer the best liquidity for full-size allocations.'
    };
    return descriptions[category] || '';
  };

  return (
    <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl transition-all duration-200 hover:bg-blue-500/15">
      <button
        type="button"
        onClick={() => setIsExpanded((prev) => !prev)}
        className="w-full text-left"
      >
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />

          <div className="flex-1">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-semibold text-blue-300">Float-Adjusted Risk Profile</h4>
              <div className="text-blue-400 transition-transform duration-200">
                {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </div>
            </div>

            <p className="text-xs text-blue-200/80 mt-1">
              {symbol.toUpperCase()} is in the <span className="font-semibold">{categoryInfo.label}</span> float bucket.
            </p>
          </div>
        </div>
      </button>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-3">
        <div className="rounded-lg bg-white/5 border border-white/10 p-2">
          <p className="text-[10px] uppercase tracking-wide text-white/45">Share Float</p>
          <p className="text-sm font-semibold text-white mt-1">{shareFloat.toLocaleString()}</p>
        </div>

        <div className="rounded-lg bg-white/5 border border-white/10 p-2">
          <p className="text-[10px] uppercase tracking-wide text-white/45 flex items-center gap-1">
            <Layers className="w-3 h-3" /> Category
          </p>
          <p className="text-sm font-semibold text-white mt-1">{categoryInfo.label}</p>
        </div>

        <div className="rounded-lg bg-white/5 border border-white/10 p-2">
          <p className="text-[10px] uppercase tracking-wide text-white/45 flex items-center gap-1">
            <Activity className="w-3 h-3" /> Multiplier
          </p>
          <p className="text-sm font-semibold text-white mt-1">{categoryInfo.positionMultiplier}x</p>
        </div>

        <div className="rounded-lg bg-white/5 border border-white/10 p-2">
          <p className="text-[10px] uppercase tracking-wide text-white/45 flex items-center gap-1">
            <Percent className="w-3 h-3" /> Max Float Use
          </p>
          <p className="text-sm font-semibold text-white mt-1">{categoryInfo.maxFloatPercent}%</p>
        </div>
      </div>

      <div className={`overflow-hidden transition-all duration-200 ${isExpanded ? 'max-h-64 opacity-100 mt-3' : 'max-h-0 opacity-0'}`}>
        <div className="text-sm text-white/70 space-y-2">
          <p className="text-white/65">{getCategoryDescription(floatCategory)}</p>

          {calculation && (
            <div className="pt-2 border-t border-white/10">
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-emerald-300">
                  This setup risks {Number(riskPercent || 0).toFixed(2)}% of your account.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FloatInfoBox;
