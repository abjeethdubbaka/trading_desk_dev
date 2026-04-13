const LEARNING_LOOP_KEY = 'aiLearningLoop.tradeReview.v1';
const LEARNING_LOOP_UPDATED_EVENT = 'ai-learning-loop-updated';
const MAX_ENTRIES = 2000;

function isBrowser() {
  return typeof window !== 'undefined' && typeof localStorage !== 'undefined';
}

function safeJsonParse(raw, fallback) {
  try {
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : fallback;
  } catch {
    return fallback;
  }
}

function readStore() {
  if (!isBrowser()) {
    return { reviews: {} };
  }

  const parsed = safeJsonParse(localStorage.getItem(LEARNING_LOOP_KEY) || '{}', {});
  const reviews = parsed?.reviews && typeof parsed.reviews === 'object'
    ? parsed.reviews
    : {};
  return { reviews };
}

function writeStore(store) {
  if (!isBrowser()) return;

  const payload = {
    reviews: store?.reviews && typeof store.reviews === 'object'
      ? store.reviews
      : {},
  };

  localStorage.setItem(LEARNING_LOOP_KEY, JSON.stringify(payload));
  window.dispatchEvent(
    new CustomEvent(LEARNING_LOOP_UPDATED_EVENT, {
      detail: { at: Date.now() },
    })
  );
}

function trimStore(store) {
  const entries = Object.entries(store?.reviews || {});
  if (entries.length <= MAX_ENTRIES) return store;

  entries.sort((a, b) => {
    const aTs = Date.parse(a[1]?.updated_at || a[1]?.created_at || 0) || 0;
    const bTs = Date.parse(b[1]?.updated_at || b[1]?.created_at || 0) || 0;
    return bTs - aTs;
  });

  return {
    reviews: Object.fromEntries(entries.slice(0, MAX_ENTRIES)),
  };
}

function normalizeOutcomeFromTrade(trade = {}) {
  const pnl = Number(trade?.pnl);
  if (!Number.isFinite(pnl)) return 'unknown';
  if (pnl > 0) return 'win';
  if (pnl < 0) return 'loss';
  return 'breakeven';
}

function normalizePredictedVerdict(verdict) {
  const normalized = String(verdict || '').trim().toLowerCase();
  if (['win', 'loss', 'breakeven', 'mixed'].includes(normalized)) {
    return normalized;
  }
  return 'unknown';
}

function toModelName(model) {
  const name = String(model || '').trim();
  return name || 'unknown-model';
}

function toTradeId(tradeId) {
  const value = String(tradeId || '').trim();
  return value || '';
}

function mapEntries(store = readStore()) {
  return Object.values(store?.reviews || {})
    .filter(Boolean)
    .map((entry) => ({
      trade_id: String(entry?.trade_id || '').trim(),
      symbol: String(entry?.symbol || '').trim(),
      model: toModelName(entry?.model),
      predicted_verdict: normalizePredictedVerdict(entry?.predicted_verdict),
      actual_outcome: String(entry?.actual_outcome || 'unknown').trim().toLowerCase(),
      grade: String(entry?.grade || '').trim().toUpperCase(),
      usefulness:
        typeof entry?.usefulness === 'boolean'
          ? entry.usefulness
          : null,
      created_at: entry?.created_at || null,
      updated_at: entry?.updated_at || null,
    }));
}

function toPercent(numerator, denominator) {
  if (!denominator) return null;
  return (numerator / denominator) * 100;
}

function computeStats(entries = []) {
  let comparable = 0;
  let correct = 0;
  let tp = 0;
  let fp = 0;
  let tn = 0;
  let fn = 0;
  let usefulVotes = 0;
  let usefulYes = 0;
  let usefulNo = 0;

  entries.forEach((entry) => {
    const predicted = normalizePredictedVerdict(entry?.predicted_verdict);
    const actual = String(entry?.actual_outcome || '').trim().toLowerCase();
    const actualIsKnown = ['win', 'loss', 'breakeven'].includes(actual);
    const predictedIsComparable = ['win', 'loss', 'breakeven'].includes(predicted);

    if (actualIsKnown && predictedIsComparable) {
      comparable += 1;
      if (predicted === actual) {
        correct += 1;
      }

      const predictedPositive = predicted === 'win';
      const actualPositive = actual === 'win';

      if (predictedPositive && actualPositive) tp += 1;
      if (predictedPositive && !actualPositive) fp += 1;
      if (!predictedPositive && actualPositive) fn += 1;
      if (!predictedPositive && !actualPositive) tn += 1;
    }

    if (typeof entry?.usefulness === 'boolean') {
      usefulVotes += 1;
      if (entry.usefulness) usefulYes += 1;
      else usefulNo += 1;
    }
  });

  return {
    total_reviews: entries.length,
    comparable_reviews: comparable,
    correct_reviews: correct,
    accuracy_pct: toPercent(correct, comparable),
    usefulness_pct: toPercent(usefulYes, usefulVotes),
    useful_votes: usefulVotes,
    useful_yes: usefulYes,
    useful_no: usefulNo,
    false_positive_count: fp,
    false_negative_count: fn,
    false_positive_rate_pct: toPercent(fp, fp + tn),
    false_negative_rate_pct: toPercent(fn, fn + tp),
  };
}

export function upsertTradeReviewLearning({
  trade = {},
  review = {},
  model = '',
}) {
  const tradeId = toTradeId(trade?.id);
  if (!tradeId) return null;

  const store = readStore();
  const existing = store.reviews?.[tradeId] || {};
  const now = new Date().toISOString();

  store.reviews[tradeId] = {
    ...existing,
    trade_id: tradeId,
    symbol: String(trade?.symbol || '').trim().toUpperCase(),
    model: toModelName(model || existing?.model),
    predicted_verdict: normalizePredictedVerdict(review?.verdict),
    actual_outcome: normalizeOutcomeFromTrade(trade),
    grade: String(review?.grade || existing?.grade || '').trim().toUpperCase(),
    usefulness:
      typeof existing?.usefulness === 'boolean'
        ? existing.usefulness
        : null,
    created_at: existing?.created_at || now,
    updated_at: now,
  };

  writeStore(trimStore(store));
  return store.reviews[tradeId];
}

export function setTradeReviewUsefulness(tradeId, usefulness) {
  const id = toTradeId(tradeId);
  if (!id) return null;

  const store = readStore();
  const existing = store.reviews?.[id];
  if (!existing) return null;

  const normalizedUsefulness =
    usefulness == null ? null : Boolean(usefulness);

  store.reviews[id] = {
    ...existing,
    usefulness: normalizedUsefulness,
    updated_at: new Date().toISOString(),
  };

  writeStore(trimStore(store));
  return store.reviews[id];
}

export function getTradeReviewUsefulness(tradeId) {
  const id = toTradeId(tradeId);
  if (!id) return null;
  const store = readStore();
  const value = store.reviews?.[id]?.usefulness;
  return typeof value === 'boolean' ? value : null;
}

export function getLearningLoopScorecard() {
  const entries = mapEntries(readStore())
    .sort((a, b) => {
      const aTs = Date.parse(a?.updated_at || a?.created_at || 0) || 0;
      const bTs = Date.parse(b?.updated_at || b?.created_at || 0) || 0;
      return bTs - aTs;
    });

  const overall = computeStats(entries);
  const byModelMap = new Map();

  entries.forEach((entry) => {
    const key = toModelName(entry.model);
    const bucket = byModelMap.get(key) || [];
    bucket.push(entry);
    byModelMap.set(key, bucket);
  });

  const byModel = [...byModelMap.entries()]
    .map(([model, modelEntries]) => ({
      model,
      ...computeStats(modelEntries),
    }))
    .sort((a, b) => b.total_reviews - a.total_reviews);

  return {
    ...overall,
    by_model: byModel,
    last_updated_at: entries[0]?.updated_at || entries[0]?.created_at || null,
  };
}

export function clearLearningLoopData() {
  writeStore({ reviews: {} });
}

export function getLearningLoopUpdatedEventName() {
  return LEARNING_LOOP_UPDATED_EVENT;
}
