import { format } from 'date-fns';
import { DAYS_OF_WEEK, MONTHS_OF_YEAR, HOURS_OF_DAY } from './constants';

export const calculatePerformanceByDayOfWeek = (trades) => {
  const performance = {};
  
  // Initialize all days with zero values
  DAYS_OF_WEEK.forEach(day => {
    performance[day.value] = {
      day: day.label,
      short: day.short,
      trades: 0,
      wins: 0,
      losses: 0,
      totalPnL: 0,
      winRate: 0,
      avgWin: 0,
      avgLoss: 0,
      profitFactor: 0
    };
  });

  trades.forEach(trade => {
    if (!trade.entry_time) return;
    
    const date = new Date(trade.entry_time);
    const dayOfWeek = date.getDay();
    
    const dayData = performance[dayOfWeek];
    dayData.trades++;
    
    if (trade.pnl > 0) {
      dayData.wins++;
      dayData.totalPnL += trade.pnl;
    } else if (trade.pnl < 0) {
      dayData.losses++;
      dayData.totalPnL += trade.pnl;
    }
  });

  // Calculate derived metrics
  Object.values(performance).forEach(dayData => {
    if (dayData.trades > 0) {
      dayData.winRate = (dayData.wins / dayData.trades) * 100;
      
      // Calculate average wins and losses
      const wins = trades.filter(t => {
        if (!t.entry_time) return false;
        return new Date(t.entry_time).getDay() === DAYS_OF_WEEK.find(d => d.label === dayData.day)?.value && t.pnl > 0;
      });
      
      const losses = trades.filter(t => {
        if (!t.entry_time) return false;
        return new Date(t.entry_time).getDay() === DAYS_OF_WEEK.find(d => d.label === dayData.day)?.value && t.pnl < 0;
      });
      
      dayData.avgWin = wins.length > 0 ? wins.reduce((sum, t) => sum + t.pnl, 0) / wins.length : 0;
      dayData.avgLoss = losses.length > 0 ? losses.reduce((sum, t) => sum + t.pnl, 0) / losses.length : 0;
      
      const totalWins = wins.reduce((sum, t) => sum + t.pnl, 0);
      const totalLosses = Math.abs(losses.reduce((sum, t) => sum + t.pnl, 0));
      dayData.profitFactor = totalLosses > 0 ? totalWins / totalLosses : totalWins > 0 ? Infinity : 0;
    }
  });

  return Object.values(performance);
};

export const calculatePerformanceByPrice = (trades) => {
  const priceRanges = [
    { min: 0, max: 2.00, label: '$0 - $2' },
    { min: 2.00, max: 4.99, label: '$2 - $4.99' },
    { min: 5.00, max: 9.99, label: '$5 - $9.99' },
    { min: 10.00, max: 19.99, label: '$10 - $19.99' },
    { min: 20.00, max: 49.99, label: '$20 - $49.99' },
    { min: 50.00, max: 99.99, label: '$50 - $99' },
    { min: 100.00, max: 199.99, label: '$100 - $199' },
    { min: 200.00, max: 499.99, label: '$200 - $499' }
  ];

  const performance = priceRanges.map(range => ({
    range: range.label,
    min: range.min,
    max: range.max,
    trades: 0,
    wins: 0,
    losses: 0,
    totalPnL: 0,
    winRate: 0,
    avgPnL: 0,
    profitFactor: 0
  }));

  trades.forEach(trade => {
    const entryPrice = trade.entry_price;
    if (!entryPrice) return;

    const rangeIndex = priceRanges.findIndex(range => 
      entryPrice >= range.min && entryPrice < range.max
    );

    if (rangeIndex !== -1) {
      const rangeData = performance[rangeIndex];
      rangeData.trades++;
      
      if (trade.pnl > 0) {
        rangeData.wins++;
        rangeData.totalPnL += trade.pnl;
      } else if (trade.pnl < 0) {
        rangeData.losses++;
        rangeData.totalPnL += trade.pnl;
      }
    }
  });

  // Calculate derived metrics
  performance.forEach(rangeData => {
    if (rangeData.trades > 0) {
      rangeData.winRate = (rangeData.wins / rangeData.trades) * 100;
      rangeData.avgPnL = rangeData.totalPnL / rangeData.trades;
      
      const wins = trades.filter(t => {
        const price = t.entry_price;
        return price >= rangeData.min && price < rangeData.max && t.pnl > 0;
      });
      
      const losses = trades.filter(t => {
        const price = t.entry_price;
        return price >= rangeData.min && price < rangeData.max && t.pnl < 0;
      });
      
      const totalWins = wins.reduce((sum, t) => sum + t.pnl, 0);
      const totalLosses = Math.abs(losses.reduce((sum, t) => sum + t.pnl, 0));
      rangeData.profitFactor = totalLosses > 0 ? totalWins / totalLosses : totalWins > 0 ? Infinity : 0;
    }
  });

  return performance;
};

export const calculatePerformanceByHourOfDay = (trades) => {
  const performance = {};
  
  // Initialize all hours with zero values
  HOURS_OF_DAY.forEach(hour => {
    performance[hour.value] = {
      hour: hour.label,
      hour24: hour.hour24,
      trades: 0,
      wins: 0,
      losses: 0,
      totalPnL: 0,
      winRate: 0,
      avgPnL: 0,
      profitFactor: 0
    };
  });

  trades.forEach(trade => {
    if (!trade.entry_time) return;
    
    const date = new Date(trade.entry_time);
    const hour = date.getHours();
    
    const hourData = performance[hour];
    hourData.trades++;
    
    if (trade.pnl > 0) {
      hourData.wins++;
      hourData.totalPnL += trade.pnl;
    } else if (trade.pnl < 0) {
      hourData.losses++;
      hourData.totalPnL += trade.pnl;
    }
  });

  // Calculate derived metrics
  Object.values(performance).forEach(hourData => {
    if (hourData.trades > 0) {
      hourData.winRate = (hourData.wins / hourData.trades) * 100;
      hourData.avgPnL = hourData.totalPnL / hourData.trades;
      
      const wins = trades.filter(t => {
        if (!t.entry_time) return false;
        return new Date(t.entry_time).getHours() === hourData.hour24 && t.pnl > 0;
      });
      
      const losses = trades.filter(t => {
        if (!t.entry_time) return false;
        return new Date(t.entry_time).getHours() === hourData.hour24 && t.pnl < 0;
      });
      
      const totalWins = wins.reduce((sum, t) => sum + t.pnl, 0);
      const totalLosses = Math.abs(losses.reduce((sum, t) => sum + t.pnl, 0));
      hourData.profitFactor = totalLosses > 0 ? totalWins / totalLosses : totalWins > 0 ? Infinity : 0;
    }
  });

  return Object.values(performance);
};

export const calculatePerformanceByMonthOfYear = (trades) => {
  const performance = {};
  
  // Initialize all months with zero values
  MONTHS_OF_YEAR.forEach(month => {
    performance[month.value] = {
      month: month.label,
      short: month.short,
      trades: 0,
      wins: 0,
      losses: 0,
      totalPnL: 0,
      winRate: 0,
      avgPnL: 0,
      profitFactor: 0
    };
  });

  trades.forEach(trade => {
    if (!trade.entry_time) return;
    
    const date = new Date(trade.entry_time);
    const month = date.getMonth();
    
    const monthData = performance[month];
    monthData.trades++;
    
    if (trade.pnl > 0) {
      monthData.wins++;
      monthData.totalPnL += trade.pnl;
    } else if (trade.pnl < 0) {
      monthData.losses++;
      monthData.totalPnL += trade.pnl;
    }
  });

  // Calculate derived metrics
  Object.values(performance).forEach(monthData => {
    if (monthData.trades > 0) {
      monthData.winRate = (monthData.wins / monthData.trades) * 100;
      monthData.avgPnL = monthData.totalPnL / monthData.trades;
      
      const wins = trades.filter(t => {
        if (!t.entry_time) return false;
        return new Date(t.entry_time).getMonth() === MONTHS_OF_YEAR.find(m => m.label === monthData.month)?.value && t.pnl > 0;
      });
      
      const losses = trades.filter(t => {
        if (!t.entry_time) return false;
        return new Date(t.entry_time).getMonth() === MONTHS_OF_YEAR.find(m => m.label === monthData.month)?.value && t.pnl < 0;
      });
      
      const totalWins = wins.reduce((sum, t) => sum + t.pnl, 0);
      const totalLosses = Math.abs(losses.reduce((sum, t) => sum + t.pnl, 0));
      monthData.profitFactor = totalLosses > 0 ? totalWins / totalLosses : totalWins > 0 ? Infinity : 0;
    }
  });

  return Object.values(performance);
};

export const calculatePerformanceBySetupType = (trades) => {
  const setupPerformance = {};
  
  trades.forEach(trade => {
    const setupType = trade.setup_type || trade.custom_setup_type || 'Unknown';
    
    if (!setupPerformance[setupType]) {
      setupPerformance[setupType] = {
        setup: setupType,
        trades: 0,
        wins: 0,
        losses: 0,
        totalPnL: 0,
        winRate: 0,
        avgPnL: 0,
        profitFactor: 0,
        maxWin: 0,
        maxLoss: 0
      };
    }
    
    const data = setupPerformance[setupType];
    data.trades++;
    
    if (trade.pnl > 0) {
      data.wins++;
      data.totalPnL += trade.pnl;
      data.maxWin = Math.max(data.maxWin, trade.pnl);
    } else if (trade.pnl < 0) {
      data.losses++;
      data.totalPnL += trade.pnl;
      data.maxLoss = Math.min(data.maxLoss, trade.pnl);
    }
  });

  // Calculate derived metrics
  Object.values(setupPerformance).forEach(setupData => {
    if (setupData.trades > 0) {
      setupData.winRate = (setupData.wins / setupData.trades) * 100;
      setupData.avgPnL = setupData.totalPnL / setupData.trades;
      
      const wins = trades.filter(t => 
        (t.setup_type === setupData.setup || t.custom_setup_type === setupData.setup) && t.pnl > 0
      );
      
      const losses = trades.filter(t => 
        (t.setup_type === setupData.setup || t.custom_setup_type === setupData.setup) && t.pnl < 0
      );
      
      const totalWins = wins.reduce((sum, t) => sum + t.pnl, 0);
      const totalLosses = Math.abs(losses.reduce((sum, t) => sum + t.pnl, 0));
      setupData.profitFactor = totalLosses > 0 ? totalWins / totalLosses : totalWins > 0 ? Infinity : 0;
    }
  });

  return Object.values(setupPerformance).sort((a, b) => b.trades - a.trades);
};

export const formatCurrency = (value) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value);
};

export const formatPercentage = (value) => {
  return `${value.toFixed(1)}%`;
};


