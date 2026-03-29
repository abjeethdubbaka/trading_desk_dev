import React from 'react';
import { CheckCircle2, Sparkles, Target } from 'lucide-react';
import { formatPercent } from '../../utils/formatters';

const QualityIndicators = ({ overallPerformance, additionalMetrics }) => {
  const getQualityScore = () => {
    let score = 0;
    let factors = [];

    // Win rate scoring
    if (overallPerformance.winRate >= 60) {
      score += 30;
      factors.push('Excellent win rate');
    } else if (overallPerformance.winRate >= 50) {
      score += 20;
      factors.push('Good win rate');
    } else if (overallPerformance.winRate >= 40) {
      score += 10;
      factors.push('Decent win rate');
    }

    // Profit factor scoring
    if (additionalMetrics.profitFactor >= 2) {
      score += 30;
      factors.push('Strong profit factor');
    } else if (additionalMetrics.profitFactor >= 1.5) {
      score += 20;
      factors.push('Good profit factor');
    } else if (additionalMetrics.profitFactor >= 1) {
      score += 10;
      factors.push('Breakeven profit factor');
    }

    // Consecutive wins scoring
    if (additionalMetrics.consecutiveWins >= 5) {
      score += 20;
      factors.push('Consistent winning streaks');
    } else if (additionalMetrics.consecutiveWins >= 3) {
      score += 10;
      factors.push('Good consistency');
    }

    // Expectancy scoring
    if (additionalMetrics.expectancy > 0) {
      score += 20;
      factors.push('Positive expectancy');
    }

    return { score, factors };
  };

  const { score, factors } = getQualityScore();
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

        {factors.length > 0 && (
          <div className="space-y-1">
            <div className="text-xs text-white/50 mb-1">Strengths:</div>
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
                Need more trades for accurate assessment ({overallPerformance.totalTrades}/10)
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default QualityIndicators;


