import { calcCoreStats } from './coreStats.js';
import { round } from '../shared/helpers.js';

export function computeEmotionStats(trades = []) {
  const order = ['confident', 'disciplined', 'neutral', 'nervous', 'fomo', 'revenge'];
  const groups = {};

  trades.forEach((trade) => {
    let emotion = 'neutral';
    if (trade?.emotions) {
      if (Array.isArray(trade.emotions)) {
        emotion = trade.emotions[0] || 'neutral';
      } else {
        emotion = trade.emotions;
      }
    }

    const normalizedEmotion = String(emotion).toLowerCase();
    if (!groups[normalizedEmotion]) {
      groups[normalizedEmotion] = { trades: [], pnl: 0, wins: 0 };
    }

    groups[normalizedEmotion].trades.push(trade);
    groups[normalizedEmotion].pnl += trade?.pnl || 0;
    if ((trade?.pnl || 0) > 0) groups[normalizedEmotion].wins += 1;
  });

  return order
    .filter((emotion) => groups[emotion])
    .map((emotion) => {
      const group = groups[emotion];
      const count = group.trades.length;
      const tradesWithR = group.trades.filter((trade) => trade?.r_multiple != null);
      const avgR = tradesWithR.length
        ? tradesWithR.reduce((sum, trade) => sum + (parseFloat(trade.r_multiple) || 0), 0) / tradesWithR.length
        : 0;

      return {
        emotion,
        count,
        winRate: count ? (group.wins / count) * 100 : 0,
        avgPnL: count ? group.pnl / count : 0,
        totalPnL: group.pnl,
        avgR: round(avgR, 2),
      };
    });
}

export function computePlanAdherence(trades = []) {
  const followed = trades.filter(
    (trade) => trade?.followed_plan === true || trade?.followed_plan === 'true'
  );
  const deviated = trades.filter(
    (trade) => trade?.followed_plan === false || trade?.followed_plan === 'false'
  );

  return {
    followed: {
      trades: followed,
      ...calcCoreStats(followed),
    },
    deviated: {
      trades: deviated,
      ...calcCoreStats(deviated),
    },
  };
}
