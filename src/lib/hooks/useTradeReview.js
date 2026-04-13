import { useState, useCallback } from 'react';
import {
  requestTradeReview,
  getDefaultTradeReviewModel,
} from '@/lib/ai/services/assistantChatService';
import {
  getTradeReviewUsefulness,
  setTradeReviewUsefulness,
  upsertTradeReviewLearning,
} from '@/lib/ai/services/learningLoopService';

const CACHE_KEY = 'tradeReviewCache';
const TTL = 24 * 60 * 60 * 1000;
const TRADE_REVIEW_MODEL =
  import.meta.env.VITE_OLLAMA_TRADE_REVIEW_MODEL ||
  getDefaultTradeReviewModel();

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
  const [usefulnessById, setUsefulnessById] = useState({});

  const syncLearningRecord = useCallback((trade, review) => {
    const learningRecord = upsertTradeReviewLearning({
      trade,
      review,
      model: TRADE_REVIEW_MODEL,
    });

    const tradeId = String(trade?.id || '');
    if (!tradeId) return;

    const usefulness =
      learningRecord && typeof learningRecord.usefulness === 'boolean'
        ? learningRecord.usefulness
        : getTradeReviewUsefulness(tradeId);

    if (usefulness == null) return;
    setUsefulnessById((prev) => ({ ...prev, [tradeId]: usefulness }));
  }, []);

  const reviewTrade = useCallback(async (trade) => {
    const id = String(trade?.id || '');
    if (!id) return;

    const cached = readCache(id);
    if (cached) {
      syncLearningRecord(trade, cached);
      setReviews((p) => ({ ...p, [id]: cached }));
      return;
    }

    setLoading((p) => ({ ...p, [id]: true }));
    try {
      const parsed = await requestTradeReview({
        trade,
        model: TRADE_REVIEW_MODEL,
      });

      syncLearningRecord(trade, parsed);
      setReviews((p) => ({ ...p, [id]: parsed }));
      writeCache(id, parsed);
    } catch (error) {
      const message = String(error?.message || 'Review failed. Check Ollama connection and model.');
      setReviews((p) => ({ ...p, [id]: { error: message } }));
    } finally {
      setLoading((p) => ({ ...p, [id]: false }));
    }
  }, [syncLearningRecord]);

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

  const rateReviewUsefulness = useCallback((tradeId, usefulness) => {
    const id = String(tradeId || '');
    if (!id) return;

    const nextValue = usefulness == null ? null : Boolean(usefulness);
    setTradeReviewUsefulness(id, nextValue);
    setUsefulnessById((prev) => ({
      ...prev,
      [id]: nextValue,
    }));
  }, []);

  return {
    reviews,
    loading,
    reviewTrade,
    clearReview,
    usefulnessById,
    rateReviewUsefulness,
  };
}


