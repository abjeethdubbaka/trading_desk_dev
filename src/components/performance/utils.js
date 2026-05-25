import { DAYS_OF_WEEK, MONTHS_OF_YEAR, HOURS_OF_DAY } from './constants';
import { getTradePnL } from '@/lib/utils/tradeFields';

function calcDerived(data) {
  if (data.trades === 0) return;
  data.winRate = (data.wins / data.trades) * 100;
  data.avgPnL  = data.totalPnL / data.trades;
  data.avgWin  = data.wins   > 0 ? data._winSum               / data.wins   : 0;
  data.avgLoss = data.losses > 0 ? Math.abs(data._lossSum)    / data.losses : 0;
  const lossAbs = Math.abs(data._lossSum);
  data.profitFactor = lossAbs > 0 ? data._winSum / lossAbs : data._winSum > 0 ? Infinity : 0;
  delete data._winSum;
  delete data._lossSum;
}

function accumulate(bucket, trade) {
  const p = getTradePnL(trade);
  bucket.trades++;
  bucket.totalPnL += p;
  if (p > 0) {
    bucket.wins++;
    bucket._winSum += p;
  } else if (p < 0) {
    bucket.losses++;
    bucket._lossSum += p;
  }
}

function emptyBucket(extra = {}) {
  return {
    trades: 0, wins: 0, losses: 0,
    totalPnL: 0, winRate: 0, avgPnL: 0, avgWin: 0, avgLoss: 0, profitFactor: 0,
    _winSum: 0, _lossSum: 0,
    ...extra,
  };
}

export const calculatePerformanceByDayOfWeek = (trades) => {
  const performance = {};
  DAYS_OF_WEEK.forEach(day => {
    performance[day.value] = emptyBucket({ day: day.label, short: day.short });
  });

  trades.forEach(trade => {
    if (!trade.entry_time) return;
    const dayOfWeek = new Date(trade.entry_time).getDay();
    accumulate(performance[dayOfWeek], trade);
  });

  Object.values(performance).forEach(calcDerived);
  return Object.values(performance);
};

export const calculatePerformanceByPrice = (trades) => {
  const priceRanges = [
    { min: 0,      max: 2.00,   label: '$0 - $2' },
    { min: 2.00,   max: 4.99,   label: '$2 - $4.99' },
    { min: 5.00,   max: 9.99,   label: '$5 - $9.99' },
    { min: 10.00,  max: 19.99,  label: '$10 - $19.99' },
    { min: 20.00,  max: 49.99,  label: '$20 - $49.99' },
    { min: 50.00,  max: 99.99,  label: '$50 - $99' },
    { min: 100.00, max: 199.99, label: '$100 - $199' },
    { min: 200.00, max: 499.99, label: '$200 - $499' },
  ];

  const performance = priceRanges.map(range =>
    emptyBucket({ range: range.label, min: range.min, max: range.max })
  );

  trades.forEach(trade => {
    const entryPrice = trade.entry_price;
    if (!entryPrice) return;
    const idx = priceRanges.findIndex(r => entryPrice >= r.min && entryPrice < r.max);
    if (idx !== -1) accumulate(performance[idx], trade);
  });

  performance.forEach(calcDerived);
  return performance;
};

export const calculatePerformanceByHourOfDay = (trades) => {
  const performance = {};
  HOURS_OF_DAY.forEach(hour => {
    performance[hour.value] = emptyBucket({ hour: hour.label, hour24: hour.hour24 });
  });

  trades.forEach(trade => {
    if (!trade.entry_time) return;
    const hour = new Date(trade.entry_time).getHours();
    accumulate(performance[hour], trade);
  });

  Object.values(performance).forEach(calcDerived);
  return Object.values(performance);
};

export const calculatePerformanceByMonthOfYear = (trades) => {
  const performance = {};
  MONTHS_OF_YEAR.forEach(month => {
    performance[month.value] = emptyBucket({ month: month.label, short: month.short });
  });

  trades.forEach(trade => {
    if (!trade.entry_time) return;
    const month = new Date(trade.entry_time).getMonth();
    accumulate(performance[month], trade);
  });

  Object.values(performance).forEach(calcDerived);
  return Object.values(performance);
};

export const calculatePerformanceBySetupType = (trades) => {
  const setupPerformance = {};

  trades.forEach(trade => {
    const setupType = trade.setup_type || trade.custom_setup_type || 'Unknown';
    if (!setupPerformance[setupType]) {
      setupPerformance[setupType] = emptyBucket({ setup: setupType, maxWin: 0, maxLoss: 0 });
    }
    const data = setupPerformance[setupType];
    const p = getTradePnL(trade);
    data.trades++;
    data.totalPnL += p;
    if (p > 0) {
      data.wins++;
      data._winSum += p;
      if (p > data.maxWin) data.maxWin = p;
    } else if (p < 0) {
      data.losses++;
      data._lossSum += p;
      if (p < data.maxLoss) data.maxLoss = p;
    }
  });

  Object.values(setupPerformance).forEach(calcDerived);
  return Object.values(setupPerformance).sort((a, b) => b.trades - a.trades);
};

export const formatCurrency = (value) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency', currency: 'USD',
    minimumFractionDigits: 2, maximumFractionDigits: 2,
  }).format(value);

export const formatPercentage = (value) => `${value.toFixed(1)}%`;
