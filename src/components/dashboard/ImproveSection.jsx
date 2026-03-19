import React from 'react';
import { Target, TrendingUp, AlertTriangle, BookOpen, Lightbulb, Shield } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function ImproveSection({ trades }) {
  const navigate = useNavigate();

  // Calculate recent performance metrics
  const recentTrades = trades.slice(0, 10); // Last 10 trades
  const winRate = recentTrades.length > 0 
    ? (recentTrades.filter(t => (t.pnl || 0) > 0).length / recentTrades.length) * 100 
    : 0;
  
  const avgWin = recentTrades.filter(t => (t.pnl || 0) > 0)
    .reduce((sum, t) => sum + (t.pnl || 0), 0) / recentTrades.filter(t => (t.pnl || 0) > 0).length || 0;
  
  const avgLoss = recentTrades.filter(t => (t.pnl || 0) < 0)
    .reduce((sum, t) => sum + (t.pnl || 0), 0) / recentTrades.filter(t => (t.pnl || 0) < 0).length || 0;

  const riskRewardRatio = avgLoss !== 0 ? Math.abs(avgWin / avgLoss) : 0;

  const setupStats = trades.reduce((acc, trade) => {
    const key = trade.setup_type || 'Unknown';
    if (!acc[key]) {
      acc[key] = { count: 0, pnl: 0, wins: 0 };
    }
    acc[key].count += 1;
    acc[key].pnl += trade.pnl || 0;
    if ((trade.pnl || 0) > 0) acc[key].wins += 1;
    return acc;
  }, {});

  const setupEntries = Object.entries(setupStats).map(([setup, value]) => ({
    setup,
    ...value,
    avgPnL: value.count > 0 ? value.pnl / value.count : 0,
    winRate: value.count > 0 ? (value.wins / value.count) * 100 : 0
  }));

  const bestSetup = setupEntries
    .filter(item => item.count >= 2)
    .sort((a, b) => b.avgPnL - a.avgPnL)[0];

  const weakestSetup = setupEntries
    .filter(item => item.count >= 2)
    .sort((a, b) => a.avgPnL - b.avgPnL)[0];

  // Generate improvement suggestions based on metrics
  const getSuggestions = () => {
    const suggestions = [];

    if (winRate < 40) {
      suggestions.push({
        icon: AlertTriangle,
        title: "Low Win Rate",
        description: "Focus on higher quality setups. Consider being more selective with entries.",
        color: "text-red-400",
        bgColor: "bg-red-500/10"
      });
    }

    if (riskRewardRatio < 1.5) {
      suggestions.push({
        icon: Target,
        title: "Improve Risk:Reward",
        description: "Aim for at least 1:1.5 risk/reward ratio. Set better profit targets.",
        color: "text-amber-400",
        bgColor: "bg-amber-500/10"
      });
    }

    if (avgLoss < -500) {
      suggestions.push({
        icon: Shield,
        title: "Large Losses Detected",
        description: "Review stop-loss placement. Consider smaller position sizes.",
        color: "text-red-400",
        bgColor: "bg-red-500/10"
      });
    }

    if (winRate > 60 && riskRewardRatio > 2) {
      suggestions.push({
        icon: TrendingUp,
        title: "Great Performance!",
        description: "You're doing well! Consider scaling up gradually.",
        color: "text-emerald-400",
        bgColor: "bg-emerald-500/10"
      });
    }

    // Add general tips if no specific issues
    if (suggestions.length === 0) {
      suggestions.push({
        icon: Lightbulb,
        title: "Trading Tip",
        description: "Review your trading journal regularly to identify patterns and improve.",
        color: "text-blue-400",
        bgColor: "bg-blue-500/10"
      });
    }

    return suggestions;
  };

  const suggestions = getSuggestions();

  const journalReviewPoints = [
    bestSetup
      ? `Best setup: ${bestSetup.setup} (${bestSetup.winRate.toFixed(0)}% win rate, avg $${bestSetup.avgPnL.toFixed(0)}).`
      : null,
    weakestSetup
      ? `Weak setup to review: ${weakestSetup.setup} (${weakestSetup.winRate.toFixed(0)}% win rate, avg $${weakestSetup.avgPnL.toFixed(0)}).`
      : null,
    recentTrades.length > 0
      ? `Recent ${recentTrades.length} trades: ${winRate.toFixed(0)}% win rate, ${riskRewardRatio.toFixed(1)}:1 R:R.`
      : 'No trades yet. Start journaling to unlock insights.'
  ].filter(Boolean);

  const goalRecommendations = [
    ...(winRate < 55 ? [{ label: 'Win Rate Goal', value: 'Reach 55%+ over next 20 trades' }] : []),
    ...(riskRewardRatio < 1.5 ? [{ label: 'Risk:Reward Goal', value: 'Raise average R:R to at least 1.5:1' }] : []),
    ...(avgLoss < -500 ? [{ label: 'Risk Control Goal', value: 'Reduce average loss size below $500' }] : []),
    ...(recentTrades.length >= 10
      ? [{ label: 'Consistency Goal', value: 'Keep plan adherence high for next 10 trades' }]
      : [{ label: 'Data Goal', value: 'Log 10 complete trades (with setups and reflections)' }])
  ].slice(0, 3);

  return (
    <div className="glass-card rounded-2xl p-6 gradient-border">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold">Improve</h3>
        <Lightbulb className="w-5 h-5 text-amber-400" />
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-white/5 rounded-lg p-3">
          <p className="text-xs text-white/60 mb-1">Win Rate</p>
          <p className={`text-lg font-bold ${winRate >= 50 ? 'text-emerald-400' : 'text-red-400'}`}>
            {winRate.toFixed(0)}%
          </p>
        </div>
        <div className="bg-white/5 rounded-lg p-3">
          <p className="text-xs text-white/60 mb-1">R:R Ratio</p>
          <p className={`text-lg font-bold ${riskRewardRatio >= 1.5 ? 'text-emerald-400' : 'text-amber-400'}`}>
            {riskRewardRatio.toFixed(1)}:1
          </p>
        </div>
      </div>

      {/* Suggestions */}
      <div className="space-y-3">
        {suggestions.map((suggestion, index) => {
          const Icon = suggestion.icon;
          return (
            <div 
              key={index}
              className={`${suggestion.bgColor} rounded-lg p-4 border border-white/10`}
            >
              <div className="flex items-start gap-3">
                <Icon className={`w-5 h-5 ${suggestion.color} flex-shrink-0 mt-0.5`} />
                <div>
                  <h4 className={`font-semibold ${suggestion.color} mb-1`}>
                    {suggestion.title}
                  </h4>
                  <p className="text-sm text-white/70">
                    {suggestion.description}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-6 pt-4 border-t border-white/10 space-y-4">
        <div className="rounded-lg border border-blue-500/20 bg-blue-500/5 p-3">
          <h4 className="text-sm font-semibold text-blue-300 mb-2">Review Trading Journal</h4>
          <ul className="space-y-1 text-sm text-white/75">
            {journalReviewPoints.map((point, index) => (
              <li key={index}>• {point}</li>
            ))}
          </ul>
        </div>

        <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-3">
          <h4 className="text-sm font-semibold text-emerald-300 mb-2">Set New Goals</h4>
          <div className="space-y-2 text-sm text-white/75">
            {goalRecommendations.map((goal, index) => (
              <div key={index} className="flex items-start justify-between gap-3">
                <span className="text-white/60">{goal.label}</span>
                <span className="text-right">{goal.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Action Items */}
      <div className="mt-6 pt-4 border-t border-white/10">
        <h4 className="font-semibold text-white mb-3">Quick Actions</h4>
        <div className="space-y-2">
          <button
            onClick={() => navigate(createPageUrl('Journal'))}
            className="w-full text-left px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors flex items-center gap-2"
          >
            <BookOpen className="w-4 h-4 text-blue-400" />
            <span className="text-sm">Review Trading Journal</span>
          </button>
          <button
            onClick={() => navigate(createPageUrl('Performance'))}
            className="w-full text-left px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors flex items-center gap-2"
          >
            <Target className="w-4 h-4 text-emerald-400" />
            <span className="text-sm">Set New Goals</span>
          </button>
        </div>
      </div>
    </div>
  );
}
