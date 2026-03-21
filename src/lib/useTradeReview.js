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
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 400,
          messages: [{
            role: 'user',
            content: `You are a trading coach. Analyze this trade briefly.
Symbol: ${trade.symbol} | Direction: ${trade.direction}
Entry: $${trade.entry_price} | Exit: $${trade.exit_price || 'open'}
Size: ${trade.position_size} shares | P&L: $${trade.pnl || 0} | R: ${trade.r_multiple || 'N/A'}
Setup: ${trade.setup_type || '—'} | Emotions: ${trade.emotions || '—'} | Followed plan: ${trade.followed_plan}
Notes: ${trade.notes || 'none'} | Mistakes: ${Array.isArray(trade.mistakes) ? trade.mistakes.join(', ') : 'none'}
Return ONLY this JSON (no markdown):
{"grade":"A"|"B"|"C"|"D"|"F","verdict":"win"|"loss"|"breakeven","what_went_well":"<15 words>","what_to_improve":"<15 words>","key_lesson":"<20 words>","next_time":"<15 words>"}`
          }]
        })
      });

      const data = await res.json();
      const raw = data.content?.find((b) => b.type === 'text')?.text || '{}';
      const parsed = JSON.parse(raw.replace(/```json\n?|```\n?/g, '').trim());
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
