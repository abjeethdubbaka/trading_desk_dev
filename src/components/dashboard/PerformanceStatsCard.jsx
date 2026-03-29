import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import StatsCard from './StatsCard';
import { 
  DollarSign, 
  TrendingUp, 
  BarChart3, 
  Target,
  Activity,
  Shield,
  Zap,
  AlertTriangle
} from 'lucide-react';

export default function PerformanceStatsCard({ 
  metric, 
  period = 'daily',
  userId = 'user-123',
  className = "" 
}) {
  const { data: performanceData, isLoading } = useQuery({
    queryKey: ['performance-metrics', userId, period],
    queryFn: () => {
      // Mock performance metrics calculation
      const mockData = {
        total_pnl: 1250.50,
        win_rate: 65.5,
        avg_r_multiple: 1.8,
        total_trades: 25,
        profitable_trades: 16,
        largest_win: 325.00,
        largest_loss: -125.00,
        avg_pnl: 50.02,
        sharpe_ratio: 1.2,
        max_drawdown: -200.00
      };
      return mockData;
    },
    enabled: !!userId
  });

  const metricConfig = {
    total_pnl: {
      title: 'Total P&L',
      icon: DollarSign,
      variant: (value) => value >= 0 ? 'success' : 'danger',
      format: (value) => `$${Math.abs(value).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      trend: (value) => value >= 0 ? 'up' : 'down'
    },
    win_rate: {
      title: 'Win Rate',
      icon: Target,
      variant: (value) => value >= 50 ? 'success' : value >= 40 ? 'warning' : 'danger',
      format: (value) => `${value.toFixed(1)}%`,
      trend: (value) => value >= 50 ? 'up' : 'down'
    },
    avg_r_multiple: {
      title: 'Avg R-Multiple',
      icon: BarChart3,
      variant: (value) => value >= 1.5 ? 'success' : value >= 1 ? 'warning' : 'danger',
      format: (value) => value.toFixed(2),
      trend: (value) => value >= 1 ? 'up' : 'down'
    },
    total_trades: {
      title: 'Total Trades',
      icon: Activity,
      variant: 'default',
      format: (value) => value.toString(),
      trend: 'up'
    },
    largest_win: {
      title: 'Largest Win',
      icon: TrendingUp,
      variant: 'success',
      format: (value) => `$${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      trend: 'up'
    },
    largest_loss: {
      title: 'Largest Loss',
      icon: AlertTriangle,
      variant: 'danger',
      format: (value) => `$${Math.abs(value).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      trend: 'down'
    },
    sharpe_ratio: {
      title: 'Sharpe Ratio',
      icon: Shield,
      variant: (value) => value >= 1.5 ? 'success' : value >= 1 ? 'warning' : 'danger',
      format: (value) => value.toFixed(2),
      trend: (value) => value >= 1 ? 'up' : 'down'
    },
    max_drawdown: {
      title: 'Max Drawdown',
      icon: Zap,
      variant: 'danger',
      format: (value) => `$${Math.abs(value).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      trend: 'down'
    }
  };

  const config = metricConfig[metric];
  if (!config) {
    
    return null;
  }

  if (isLoading) {
    return (
      <div className={`glass-card rounded-2xl p-6 gradient-border animate-pulse ${className}`}>
        <div className="h-20 bg-white/5 rounded-lg"></div>
      </div>
    );
  }

  const value = performanceData?.[metric] || 0;
  const variant = typeof config.variant === 'function' ? config.variant(value) : config.variant;
  const trend = typeof config.trend === 'function' ? config.trend(value) : config.trend;

  // Calculate trend value based on period comparison
  const getTrendValue = () => {
    if (metric === 'total_pnl') {
      return value >= 0 ? `+$${value.toFixed(2)}` : `-$${Math.abs(value).toFixed(2)}`;
    }
    if (metric === 'win_rate') {
      return `${value >= 50 ? '+' : ''}${value.toFixed(1)}%`;
    }
    if (metric === 'avg_r_multiple') {
      return `${value >= 0 ? '+' : ''}${value.toFixed(1)}R`;
    }
    return null;
  };

  return (
    <StatsCard
      title={config.title}
      value={config.format(value)}
      subtitle={getSubtitle(performanceData, metric)}
      trend={trend}
      trendValue={getTrendValue()}
      icon={config.icon}
      variant={variant}
      className={className}
    />
  );
}

function getSubtitle(data, metric) {
  switch (metric) {
    case 'total_pnl':
      return `${data.total_trades || 0} trades`;
    case 'win_rate':
      return `${data.profitable_trades || 0} wins / ${(data.total_trades || 0) - (data.profitable_trades || 0)} losses`;
    case 'avg_r_multiple':
      return 'Risk adjusted returns';
    case 'total_trades':
      return `${data.profitable_trades || 0} profitable`;
    case 'largest_win':
      return 'Best performing trade';
    case 'largest_loss':
      return 'Worst performing trade';
    case 'sharpe_ratio':
      return 'Risk-adjusted return';
    case 'max_drawdown':
      return 'Maximum portfolio decline';
    default:
      return '';
  }
}


