import React from 'react';
import { CheckCircle2, Sparkles, Target } from 'lucide-react';

const QualityIndicators = ({ overallPerformance, additionalMetrics }) => {
  const clamp = (value, min = 0, max = 100) => Math.min(max, Math.max(min, value));

  const getReliability = () => {
    const trades = Number(overallPerformance.totalTrades || 0);
    const wins = Number(overallPerformance.wins || 0);
    const losses = Number(overallPerformance.losses || 0);

    const tradeCountFactor = clamp((trades / 40) * 100, 0, 100) / 100;
    const balanceFactor = trades > 0
      ? (Math.min(wins, losses) + 1) / (Math.max(wins, losses) + 1)
      : 0;

    return clamp(
      0.2 + (0.8 * ((tradeCountFactor * 0.7) + (balanceFactor * 0.3))),
      0.2,
      1
    );
  };

  const getQualityScore = () => {
    const winRate = Number(overallPerformance.winRate || 0);
    const profitFactorRaw = Number(additionalMetrics.profitFactor || 0);
    const expectancy = Number(additionalMetrics.expectancy || 0);
    const avgLoser = Number(additionalMetrics.avgLoser || 0);

    const winRateScore = clamp(((winRate - 35) / 30) * 100, 0, 100);
    const profitFactorScore = Number.isFinite(profitFactorRaw)
      ? clamp(((profitFactorRaw - 0.7) / 1.8) * 100, 0, 100)
      : 100;
    const expectancyRatio = avgLoser > 0
      ? (expectancy / avgLoser)
      : (expectancy > 0 ? 0.5 : -0.5);
    const expectancyScore = clamp(((expectancyRatio + 0.5) / 1) * 100, 0, 100);

    const rawScore = (
      (winRateScore * 0.45) +
      (profitFactorScore * 0.35) +
      (expectancyScore * 0.20)
    );

    const reliability = getReliability();
    const reliabilityAdjustedScore = Math.round(50 + ((rawScore - 50) * reliability));

    const factors = [];
    if (winRate >= 55) factors.push('Strong win rate');
    if (profitFactorRaw >= 1.5) factors.push('Healthy profit factor');
    if (expectancy > 0) factors.push('Positive expectancy');
    if (overallPerformance.totalTrades >= 40) factors.push('Good sample size');

    return { score: reliabilityAdjustedScore, factors, reliability };
  };

  const { score, factors, reliability } = getQualityScore();
  const getScoreColor = (score) => {
    if (score >= 80) return 'text-emerald-400';
    if (score >= 60) return 'text-yellow-400';
    if (score >= 40) return 'text-orange-400';
    return 'text-red-400';
  };

  const getScoreLabel = (score) => {
    if (score >= 80) return 'Excellent';
    if (score >= 60) return 'Good';
    if (score >= 40) return 'Fair';
    return 'Poor';
  };

  const getReliabilityLabel = (value) => {
    if (value >= 0.8) return 'High';
    if (value >= 0.55) return 'Medium';
    return 'Low';
  };

  const getReliabilityColor = (value) => {
    if (value >= 0.8) return 'text-emerald-400';
    if (value >= 0.55) return 'text-yellow-400';
    return 'text-orange-400';
  };

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-semibold text-white uppercase tracking-wider flex items-center gap-2">
        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
        Quality Indicators
      </h3>
      
      <div className="bg-white/5 rounded p-3">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-white/70">Overall Score</span>
          <span className={`text-sm font-bold ${getScoreColor(score)}`}>
            {score}/100 - {getScoreLabel(score)}
          </span>
        </div>
        
        <div className="w-full bg-white/10 rounded-full h-2 mb-3">
          <div 
            className={`h-full rounded-full transition-all duration-500 ${
              score >= 80 ? 'bg-emerald-500' :
              score >= 60 ? 'bg-yellow-500' :
              score >= 40 ? 'bg-orange-500' : 'bg-red-500'
            }`}
            style={{ width: `${score}%` }}
          />
        </div>

        <div className="mb-3 flex items-center justify-between text-xs">
          <span className="text-white/50">Reliability</span>
          <span className={`font-semibold ${getReliabilityColor(reliability)}`}>
            {getReliabilityLabel(reliability)} ({Math.round(reliability * 100)}%)
          </span>
        </div>

        {factors.length > 0 && (
          <div className="space-y-1">
            <div className="text-xs text-white/50 mb-1">Signals:</div>
            {factors.map((factor, index) => (
              <div key={index} className="flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-emerald-400" />
                <span className="text-xs text-white/70">{factor}</span>
              </div>
            ))}
          </div>
        )}

        {overallPerformance.totalTrades < 10 && (
          <div className="mt-2 pt-2 border-t border-white/10">
            <div className="flex items-center gap-1">
              <Target className="w-3 h-3 text-yellow-400" />
              <span className="text-xs text-white/70">
                Score confidence improves with more balanced sample size ({overallPerformance.totalTrades} trades)
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default QualityIndicators;


