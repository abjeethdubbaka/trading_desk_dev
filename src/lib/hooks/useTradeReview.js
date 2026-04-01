import { useState, useCallback } from 'react';

const CACHE_KEY = 'tradeReviewCache';
const TTL = 24 * 60 * 60 * 1000;

function readCache(id) {
  try {
    const c = JSON.parse(localStorage.getItem(CACHE_KEY) || '{}');
    const h = c[id];
    return h && Date.now() - h.ts < TTL ? h.data : null;
  } catch {
    return null;
  }
}

function writeCache(id, data) {
  try {
    const c = JSON.parse(localStorage.getItem(CACHE_KEY) || '{}');
    c[id] = { data, ts: Date.now() };
    localStorage.setItem(CACHE_KEY, JSON.stringify(c));
  } catch {}
}

export function useTradeReview() {
  const [reviews, setReviews] = useState({});
  const [loading, setLoading] = useState({});

  const reviewTrade = useCallback(async (trade) => {
    const id = trade.id;
    const cached = readCache(id);
    if (cached) {
      setReviews((p) => ({ ...p, [id]: cached }));
      return;
    }

    setLoading((p) => ({ ...p, [id]: true }));
    try {
      // Placeholder data instead of API call to avoid CORS issues
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API delay

      // Generate placeholder review based on trade data
      const pnl = trade.pnl || 0;
      const isProfit = pnl >= 0;
      const rMultiple = parseFloat(trade.r_multiple) || 0;

      let grade = 'C';
      let verdict = 'breakeven';
      let whatWentWell = 'Entry timing was reasonable';
      let whatToImprove = 'Risk management needs work';
      let keyLesson = 'Always set proper stop losses';
      let nextTime = 'Focus on discipline';

      // Generate dynamic placeholder based on trade performance
      if (isProfit && rMultiple >= 2) {
        grade = 'A';
        verdict = 'win';
        whatWentWell = 'Excellent risk/reward ratio';
        whatToImprove = 'Consider position sizing';
        keyLesson = 'Patience pays off';
        nextTime = 'Maintain strategy';
      } else if (isProfit && rMultiple >= 1) {
        grade = 'B';
        verdict = 'win';
        whatWentWell = 'Good trade execution';
        whatToImprove = 'Better entry timing';
        keyLesson = 'Stick to plan';
        nextTime = 'Be more patient';
      } else if (!isProfit && rMultiple < 1) {
        grade = 'D';
        verdict = 'loss';
        whatWentWell = 'Quick exit saved capital';
        whatToImprove = 'Better stop loss placement';
        keyLesson = 'Risk management is key';
        nextTime = 'Set tighter stops';
      } else if (!isProfit) {
        grade = 'F';
        verdict = 'loss';
        whatWentWell = 'Accepted the loss';
        whatToImprove = 'Better trade selection';
        keyLesson = 'Cut losses quickly';
        nextTime = 'Be more selective';
      }

      const parsed = {
        grade,
        verdict,
        what_went_well: whatWentWell,
        what_to_improve: whatToImprove,
        key_lesson: keyLesson,
        next_time: nextTime
      };

      setReviews((p) => ({ ...p, [id]: parsed }));
      writeCache(id, parsed);
    } catch (e) {
      setReviews((p) => ({ ...p, [id]: { error: 'Review failed. Check API connection.' } }));
    } finally {
      setLoading((p) => ({ ...p, [id]: false }));
    }
  }, []);

  const clearReview = useCallback((id) => {
    setReviews((p) => {
      const n = { ...p };
      delete n[id];
      return n;
    });
    try {
      const c = JSON.parse(localStorage.getItem(CACHE_KEY) || '{}');
      delete c[id];
      localStorage.setItem(CACHE_KEY, JSON.stringify(c));
    } catch {}
  }, []);

  return { reviews, loading, reviewTrade, clearReview };
}


