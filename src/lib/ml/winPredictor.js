/**
 * Logistic regression win predictor trained on the user's own trade history.
 *
 * All computation is synchronous, client-side, and reruns whenever the trades
 * array changes — no server, no API key, no dependencies.
 *
 * Features used (all binary or bucketed to avoid scale sensitivity):
 *   setup_type, hour_bucket, day_of_week, session_position,
 *   prior_trade_was_loss, emotion_present, float_category
 *
 * Minimum trades to surface a prediction: MIN_TRADES.
 * Below that threshold `predict()` returns null so the UI stays silent.
 */

const MIN_TRADES = 15;
const LEARNING_RATE = 0.08;
const EPOCHS = 300;

// ─── feature extraction ────────────────────────────────────────────────────────

function hourBucket(entryTime) {
  if (!entryTime) return 'unknown';
  const h = new Date(entryTime).getHours();
  if (h < 10) return 'pre10';
  if (h < 11) return 'h10';
  if (h < 12) return 'h11';
  if (h < 14) return 'h12-13';
  return 'h14plus';
}

function dayOfWeek(entryTime) {
  if (!entryTime) return 'unknown';
  return ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'][new Date(entryTime).getDay()];
}

function sessionBucket(position) {
  if (!position || position <= 1) return 'first';
  if (position === 2) return 'second';
  return 'third_plus';
}

function extractFeatures(trade, priorWasLoss) {
  return {
    setup: trade.setup_type || 'unknown',
    hour: hourBucket(trade.entry_time),
    dow: dayOfWeek(trade.entry_time),
    session: sessionBucket(trade.session_trade_number),
    prior_loss: priorWasLoss ? '1' : '0',
    has_emotion: Array.isArray(trade.emotions) && trade.emotions.filter(Boolean).length > 0 ? '1' : '0',
    float: trade.float_category || trade.share_float_range || 'unknown',
  };
}

// Encode features into a flat binary feature vector using a shared vocabulary.
function buildVocabulary(samples) {
  const vocab = new Map(); // feature_key:value → index
  for (const { features } of samples) {
    for (const [k, v] of Object.entries(features)) {
      const key = `${k}:${v}`;
      if (!vocab.has(key)) vocab.set(key, vocab.size);
    }
  }
  return vocab;
}

function toVector(features, vocab) {
  const vec = new Float32Array(vocab.size);
  for (const [k, v] of Object.entries(features)) {
    const idx = vocab.get(`${k}:${v}`);
    if (idx !== undefined) vec[idx] = 1;
  }
  return vec;
}

// ─── logistic regression ───────────────────────────────────────────────────────

function sigmoid(z) {
  return 1 / (1 + Math.exp(-z));
}

function dot(weights, vec) {
  let s = 0;
  for (let i = 0; i < weights.length; i++) s += weights[i] * vec[i];
  return s;
}

function train(samples, vocab) {
  const n = vocab.size;
  const weights = new Float32Array(n);
  let bias = 0;

  for (let epoch = 0; epoch < EPOCHS; epoch++) {
    for (const { vec, label } of samples) {
      const pred = sigmoid(dot(weights, vec) + bias);
      const err = pred - label;
      bias -= LEARNING_RATE * err;
      for (let i = 0; i < n; i++) weights[i] -= LEARNING_RATE * err * vec[i];
    }
  }

  return { weights, bias };
}

// ─── public API ───────────────────────────────────────────────────────────────

/**
 * Build a trained model from a list of historical trades.
 * Returns null when there are too few trades to be meaningful.
 */
export function buildModel(trades) {
  if (!Array.isArray(trades) || trades.length < MIN_TRADES) return null;

  const sorted = [...trades]
    .filter((t) => t?.entry_time)
    .sort((a, b) => new Date(a.entry_time) - new Date(b.entry_time));

  if (sorted.length < MIN_TRADES) return null;

  // Build (features, label) pairs. Assign session position inline.
  const byDay = {};
  const samples = [];

  for (let i = 0; i < sorted.length; i++) {
    const t = sorted[i];
    const day = new Date(t.entry_time).toDateString();
    if (!byDay[day]) byDay[day] = 0;
    byDay[day] += 1;
    const sessionPos = byDay[day];

    const priorPnl = i > 0 ? (sorted[i - 1]?.pnl ?? 0) : 0;
    const features = extractFeatures({ ...t, session_trade_number: sessionPos }, priorPnl < 0);
    const label = (t?.pnl ?? 0) > 0 ? 1 : 0;
    samples.push({ features, label });
  }

  const vocab = buildVocabulary(samples);
  const withVecs = samples.map((s) => ({ ...s, vec: toVector(s.features, vocab) }));
  const { weights, bias } = train(withVecs, vocab);

  return { weights, bias, vocab };
}

/**
 * Predict win probability for a potential trade given the current context.
 *
 * @param {object} model - result of buildModel()
 * @param {object} tradeContext - { setup_type, entry_time, session_trade_number, prior_was_loss, emotions, float_category }
 * @returns {{ probability: number, confidence: 'low'|'medium'|'high', features: object } | null}
 */
export function predict(model, tradeContext) {
  if (!model) return null;

  const features = extractFeatures(
    {
      setup_type: tradeContext.setup_type,
      entry_time: tradeContext.entry_time ?? new Date().toISOString(),
      session_trade_number: tradeContext.session_trade_number ?? 1,
      emotions: tradeContext.emotions,
      float_category: tradeContext.float_category,
      share_float_range: tradeContext.share_float_range,
    },
    tradeContext.prior_was_loss ?? false,
  );

  const vec = toVector(features, model.vocab);

  // How many features matched the vocabulary (unseen features give 0 signal)
  let matched = 0;
  for (const [k, v] of Object.entries(features)) {
    if (model.vocab.has(`${k}:${v}`)) matched++;
  }
  const coverage = matched / Object.keys(features).length;

  const z = dot(model.weights, vec) + model.bias;
  const probability = Math.round(sigmoid(z) * 100);
  const confidence = coverage >= 0.7 ? 'high' : coverage >= 0.4 ? 'medium' : 'low';

  return { probability, confidence, features };
}

/**
 * Convenience hook-friendly wrapper: given raw trades and a tradeContext object,
 * returns the prediction or null. Suitable for use inside useMemo.
 */
export function getPrediction(trades, tradeContext) {
  const model = buildModel(trades);
  return predict(model, tradeContext);
}

// Human-readable labels for each feature key
const FEATURE_LABELS = {
  setup: 'Setup',
  hour:  'Time of day',
  dow:   'Day of week',
  session: 'Session position',
  prior_loss: 'After a loss',
  has_emotion: 'Emotions logged',
  float: 'Float category',
};

const DOW_LABELS = { sun: 'Sunday', mon: 'Monday', tue: 'Tuesday', wed: 'Wednesday', thu: 'Thursday', fri: 'Friday', sat: 'Saturday' };
const HOUR_LABELS = { pre10: 'Before 10am', h10: '10–11am', h11: '11am–12pm', 'h12-13': '12–2pm', h14plus: 'After 2pm' };
const SESSION_LABELS = { first: '1st trade', second: '2nd trade', third_plus: '3rd+ trade' };
const PRIOR_LABELS = { '1': 'Yes', '0': 'No' };
const EMOTION_LABELS = { '1': 'Yes', '0': 'No' };

function humanValue(key, val) {
  if (key === 'dow')      return DOW_LABELS[val] ?? val;
  if (key === 'hour')     return HOUR_LABELS[val] ?? val;
  if (key === 'session')  return SESSION_LABELS[val] ?? val;
  if (key === 'prior_loss') return PRIOR_LABELS[val] ?? val;
  if (key === 'has_emotion') return EMOTION_LABELS[val] ?? val;
  return val;
}

/**
 * Analyse which feature values most correlate with wins/losses vs the baseline.
 * Requires min MIN_TRADES; returns null below that.
 *
 * Returns:
 *   { edges, risks, baseline, totalTrades }
 *   edges/risks: [{ label, value, winRate, count, delta }] sorted by |delta|
 */
export function analyzeEdgeFactors(trades = [], limit = 5) {
  if (!Array.isArray(trades) || trades.length < MIN_TRADES) return null;

  const sorted = [...trades]
    .filter((t) => t?.entry_time)
    .sort((a, b) => new Date(a.entry_time) - new Date(b.entry_time));

  const byDay = {};
  const groups = {};
  let totalWins = 0;

  for (let i = 0; i < sorted.length; i++) {
    const t = sorted[i];
    const day = new Date(t.entry_time).toDateString();
    if (!byDay[day]) byDay[day] = 0;
    byDay[day] += 1;
    const features = extractFeatures({ ...t, session_trade_number: byDay[day] }, i > 0 ? (sorted[i - 1]?.pnl ?? 0) < 0 : false);
    const win = (t?.pnl ?? 0) > 0;
    if (win) totalWins++;

    for (const [key, val] of Object.entries(features)) {
      const gk = `${key}:${val}`;
      if (!groups[gk]) groups[gk] = { key, val, wins: 0, total: 0 };
      groups[gk].total++;
      if (win) groups[gk].wins++;
    }
  }

  const baseline = totalWins / sorted.length;

  const results = Object.values(groups)
    .filter((g) => g.total >= 5)
    .map((g) => ({
      label: FEATURE_LABELS[g.key] ?? g.key,
      value: humanValue(g.key, g.val),
      winRate: Math.round((g.wins / g.total) * 100),
      count: g.total,
      delta: Math.round(((g.wins / g.total) - baseline) * 100),
    }));

  const edges = results.filter((r) => r.delta > 5).sort((a, b) => b.delta - a.delta).slice(0, limit);
  const risks = results.filter((r) => r.delta < -5).sort((a, b) => a.delta - b.delta).slice(0, limit);

  return { edges, risks, baseline: Math.round(baseline * 100), totalTrades: sorted.length };
}
