const OLLAMA_BASE_URL = import.meta.env.VITE_OLLAMA_BASE_URL || 'http://localhost:11434/api/chat';
const DEFAULT_CHAT_MODEL =
  import.meta.env.VITE_OLLAMA_CHAT_MODEL ||
  import.meta.env.VITE_OLLAMA_MODEL;
const DEFAULT_TRADE_REVIEW_MODEL =
  import.meta.env.VITE_OLLAMA_TRADE_REVIEW_MODEL ||
  DEFAULT_CHAT_MODEL;
const DEFAULT_MORNING_BRIEF_MODEL =
  import.meta.env.VITE_OLLAMA_MORNING_BRIEF_MODEL ||
  DEFAULT_CHAT_MODEL;
const OLLAMA_API_KEY = import.meta.env.VITE_OLLAMA_API_KEY;
const OLLAMA_TIMEOUT_MS = Number(import.meta.env.VITE_OLLAMA_TIMEOUT_MS || 90000);
const TRADE_REVIEW_ENDPOINT = import.meta.env.VITE_TRADE_REVIEW_ENDPOINT;
const TRADE_REVIEW_API_KEY = import.meta.env.VITE_TRADE_REVIEW_API_KEY;
const TRADE_REVIEW_TIMEOUT_MS = Number(import.meta.env.VITE_TRADE_REVIEW_TIMEOUT_MS || 20000);
const MORNING_BRIEF_ENDPOINT = import.meta.env.VITE_MORNING_BRIEF_ENDPOINT;
const MORNING_BRIEF_API_KEY = import.meta.env.VITE_MORNING_BRIEF_API_KEY;
const MORNING_BRIEF_TIMEOUT_MS = Number(import.meta.env.VITE_MORNING_BRIEF_TIMEOUT_MS || 20000);

const TRADE_DECISION_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: [
    'decision',
    'confidence',
    'position_size_shares',
    'risk_dollars',
    'reasons',
    'invalidations',
    'next_best_action',
  ],
  properties: {
    decision: {
      type: 'string',
      enum: ['GO', 'WAIT', 'SKIP'],
    },
    confidence: { type: 'number' },
    position_size_shares: { type: 'number' },
    risk_dollars: { type: 'number' },
    reasons: {
      type: 'array',
      items: { type: 'string' },
    },
    invalidations: {
      type: 'array',
      items: { type: 'string' },
    },
    next_best_action: { type: 'string' },
    cautions: {
      type: 'array',
      items: { type: 'string' },
    },
  },
};

const TRADE_REVIEW_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['grade', 'verdict', 'what_went_well', 'what_to_improve', 'key_lesson', 'next_time'],
  properties: {
    grade: {
      type: 'string',
      enum: ['A', 'B', 'C', 'D', 'F'],
    },
    verdict: {
      type: 'string',
      enum: ['win', 'loss', 'breakeven', 'mixed'],
    },
    what_went_well: { type: 'string' },
    what_to_improve: { type: 'string' },
    key_lesson: { type: 'string' },
    next_time: { type: 'string' },
  },
};

const MORNING_BRIEF_SCHEMA = {
  type: 'array',
  minItems: 3,
  maxItems: 3,
  items: {
    type: 'object',
    additionalProperties: false,
    required: ['type', 'text'],
    properties: {
      type: {
        type: 'string',
        enum: ['positive', 'warning', 'focus'],
      },
      text: { type: 'string' },
    },
  },
};

function normalizeMessages(messages = []) {
  return messages
    .filter((message) => message && (message.role === 'user' || message.role === 'assistant'))
    .map((message) => ({
      role: message.role,
      content: String(message.content || '').trim(),
    }))
    .filter((message) => message.content.length > 0);
}

function extractRawContent(data = {}) {
  const raw = data?.message?.content ?? data?.response ?? '';
  if (raw == null) return '';
  return raw;
}

function parseJsonContent(rawContent) {
  if (rawContent && typeof rawContent === 'object') {
    return rawContent;
  }

  const rawText = String(rawContent || '').trim();
  if (!rawText) {
    throw new Error('Model returned empty JSON content');
  }

  const cleaned = rawText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
  return JSON.parse(cleaned);
}

function resolveModelName(model) {
  const normalizedModel = String(model ?? '').trim();
  if (!normalizedModel) {
    throw new Error(
      'Ollama model is not configured. Set VITE_OLLAMA_MODEL or a feature-specific model env variable.'
    );
  }
  return normalizedModel;
}

function toFiniteNumber(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function toTrimmedString(value, fallback = '') {
  const text = String(value ?? '').trim();
  return text || fallback;
}

function truncateText(value, maxLength = 260) {
  const text = String(value ?? '').trim();
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength).trimEnd()}...`;
}

function toSignedCurrency(value) {
  const numericValue = toFiniteNumber(value, 0);
  return `${numericValue >= 0 ? '+' : '-'}$${Math.abs(numericValue).toFixed(0)}`;
}

function normalizeDecisionResult(payload = {}) {
  const rawDecision = String(payload.decision || '').toUpperCase();
  const decision = ['GO', 'WAIT', 'SKIP'].includes(rawDecision) ? rawDecision : 'WAIT';
  const confidence = Math.max(0, Math.min(100, toFiniteNumber(payload.confidence, 0)));

  const reasons = Array.isArray(payload.reasons)
    ? payload.reasons.map((item) => String(item || '').trim()).filter(Boolean).slice(0, 5)
    : [];

  const invalidations = Array.isArray(payload.invalidations)
    ? payload.invalidations.map((item) => String(item || '').trim()).filter(Boolean).slice(0, 5)
    : [];

  const cautions = Array.isArray(payload.cautions)
    ? payload.cautions.map((item) => String(item || '').trim()).filter(Boolean).slice(0, 4)
    : [];

  return {
    decision,
    confidence,
    position_size_shares: Math.max(0, Math.round(toFiniteNumber(payload.position_size_shares, 0))),
    risk_dollars: toFiniteNumber(payload.risk_dollars, 0),
    reasons,
    invalidations,
    next_best_action: String(payload.next_best_action || '').trim(),
    cautions,
  };
}

function buildTradeDecisionPrompt(tradeContext = {}) {
  const context = {
    symbol: String(tradeContext.symbol || '').trim(),
    setup: String(tradeContext.setup || '').trim(),
    direction: String(tradeContext.direction || '').trim(),
    entry: String(tradeContext.entry || '').trim(),
    stop: String(tradeContext.stop || '').trim(),
    target: String(tradeContext.target || '').trim(),
    account_balance: String(tradeContext.account_balance || '').trim(),
    max_risk_dollars: String(tradeContext.max_risk_dollars || '').trim(),
    today_pnl: String(tradeContext.today_pnl || '').trim(),
    max_daily_loss: String(tradeContext.max_daily_loss || '').trim(),
    trades_taken_today: String(tradeContext.trades_taken_today || '').trim(),
    max_daily_trades: String(tradeContext.max_daily_trades || '').trim(),
    notes: String(tradeContext.notes || '').trim(),
  };

  return [
    'Evaluate this trade with a risk-first approach using only the provided context.',
    'If data is missing or weak, prefer WAIT or SKIP over GO.',
    '',
    `symbol: ${context.symbol || 'n/a'}`,
    `setup: ${context.setup || 'n/a'}`,
    `direction: ${context.direction || 'n/a'}`,
    `entry: ${context.entry || 'n/a'}`,
    `stop: ${context.stop || 'n/a'}`,
    `target: ${context.target || 'n/a'}`,
    `account_balance: ${context.account_balance || 'n/a'}`,
    `max_risk_dollars: ${context.max_risk_dollars || 'n/a'}`,
    `today_pnl: ${context.today_pnl || 'n/a'}`,
    `max_daily_loss: ${context.max_daily_loss || 'n/a'}`,
    `trades_taken_today: ${context.trades_taken_today || 'n/a'}`,
    `max_daily_trades: ${context.max_daily_trades || 'n/a'}`,
    `notes: ${context.notes || 'n/a'}`,
  ].join('\n');
}

function sanitizeTradeForReviewPrompt(trade = {}) {
  const emotions = Array.isArray(trade.emotions)
    ? trade.emotions
    : trade.emotions ? [trade.emotions] : [];
  const mistakes = Array.isArray(trade.mistakes)
    ? trade.mistakes
    : trade.mistakes ? [trade.mistakes] : [];

  return {
    symbol: toTrimmedString(trade.symbol, 'n/a'),
    direction: toTrimmedString(trade.direction, 'n/a'),
    setup_type: toTrimmedString(trade.setup_type, 'n/a'),
    entry_time: toTrimmedString(trade.entry_time, 'n/a'),
    exit_time: toTrimmedString(trade.exit_time, 'n/a'),
    entry_price: toTrimmedString(trade.entry_price, 'n/a'),
    exit_price: toTrimmedString(trade.exit_price, 'n/a'),
    stop_loss: toTrimmedString(trade.stop_loss, 'n/a'),
    target_price: toTrimmedString(trade.target_price, 'n/a'),
    position_size: toTrimmedString(trade.position_size, 'n/a'),
    pnl: toTrimmedString(trade.pnl, 'n/a'),
    r_multiple: toTrimmedString(trade.r_multiple, 'n/a'),
    followed_plan: toTrimmedString(trade.followed_plan, 'n/a'),
    setup_quality_score: toTrimmedString(trade.setup_quality_score, 'n/a'),
    setup_grade: toTrimmedString(trade.setup_grade, 'n/a'),
    emotions: emotions.map((item) => toTrimmedString(item)).filter(Boolean).slice(0, 6),
    mistakes: mistakes.map((item) => toTrimmedString(item)).filter(Boolean).slice(0, 6),
    notes: truncateText(trade.notes ?? trade.trade_note ?? ''),
  };
}

function buildTradeReviewPrompt(trade = {}) {
  const payload = sanitizeTradeForReviewPrompt(trade);

  return [
    'Review this completed trade and produce a concise, practical coaching summary.',
    'If data is missing, still provide the best grounded coaching in plain language.',
    '',
    `symbol: ${payload.symbol}`,
    `direction: ${payload.direction}`,
    `setup_type: ${payload.setup_type}`,
    `entry_time: ${payload.entry_time}`,
    `exit_time: ${payload.exit_time}`,
    `entry_price: ${payload.entry_price}`,
    `exit_price: ${payload.exit_price}`,
    `stop_loss: ${payload.stop_loss}`,
    `target_price: ${payload.target_price}`,
    `position_size: ${payload.position_size}`,
    `pnl: ${payload.pnl}`,
    `r_multiple: ${payload.r_multiple}`,
    `followed_plan: ${payload.followed_plan}`,
    `setup_quality_score: ${payload.setup_quality_score}`,
    `setup_grade: ${payload.setup_grade}`,
    `emotions: ${payload.emotions.length ? payload.emotions.join(', ') : 'n/a'}`,
    `mistakes: ${payload.mistakes.length ? payload.mistakes.join(', ') : 'n/a'}`,
    `notes: ${payload.notes || 'n/a'}`,
  ].join('\n');
}

function normalizeTradeReviewResult(payload = {}) {
  const grade = toTrimmedString(payload.grade, 'C').toUpperCase();
  const verdict = toTrimmedString(payload.verdict, 'mixed').toLowerCase();

  return {
    grade: ['A', 'B', 'C', 'D', 'F'].includes(grade) ? grade : 'C',
    verdict: ['win', 'loss', 'breakeven', 'mixed'].includes(verdict) ? verdict : 'mixed',
    what_went_well: truncateText(
      payload.what_went_well || payload.positives || 'You captured the trade details and respected process in parts.'
    ),
    what_to_improve: truncateText(
      payload.what_to_improve || payload.improvements || 'Tighten pre-trade criteria and keep risk parameters explicit.'
    ),
    key_lesson: truncateText(
      payload.key_lesson || payload.lesson || 'Consistency beats intensity. Repeat only high-quality setups.'
    ),
    next_time: truncateText(
      payload.next_time || payload.action_step || 'Define your invalidation first, then size from risk.'
    ),
  };
}

function normalizeBriefType(value) {
  const type = toTrimmedString(value, 'focus').toLowerCase();
  return ['positive', 'warning', 'focus'].includes(type) ? type : 'focus';
}

function sanitizeMorningBriefContext(context = {}) {
  const topSetups = Array.isArray(context.top_setups)
    ? context.top_setups
    : [];
  const topEmotions = Array.isArray(context.top_emotions)
    ? context.top_emotions
    : [];

  return {
    trade_count: Math.max(0, Math.round(toFiniteNumber(context.trade_count, 0))),
    win_rate: Math.max(0, Math.min(100, toFiniteNumber(context.win_rate, 0))),
    avg_r: toFiniteNumber(context.avg_r, 0),
    total_pnl: toFiniteNumber(context.total_pnl, 0),
    avg_win: toFiniteNumber(context.avg_win, 0),
    avg_loss: toFiniteNumber(context.avg_loss, 0),
    plan_followed_pct: Math.max(0, Math.min(100, toFiniteNumber(context.plan_followed_pct, 0))),
    top_setups: topSetups.map((item) => toTrimmedString(item)).filter(Boolean).slice(0, 5),
    top_emotions: topEmotions.map((item) => toTrimmedString(item)).filter(Boolean).slice(0, 5),
  };
}

function buildMorningBriefPrompt(briefContext = {}) {
  const context = sanitizeMorningBriefContext(briefContext);

  return [
    'Create exactly 3 concise coaching observations from this trading snapshot.',
    'Each item must be actionable, specific, and under 20 words.',
    'Use warning when risk discipline is weak, positive when behavior is strong, focus for next best priority.',
    '',
    `trade_count: ${context.trade_count}`,
    `win_rate: ${context.win_rate.toFixed(0)}%`,
    `avg_r: ${context.avg_r.toFixed(2)}`,
    `total_pnl: ${context.total_pnl.toFixed(2)}`,
    `avg_win: ${context.avg_win.toFixed(2)}`,
    `avg_loss: ${context.avg_loss.toFixed(2)}`,
    `plan_followed_pct: ${context.plan_followed_pct.toFixed(0)}%`,
    `top_setups: ${context.top_setups.length ? context.top_setups.join(', ') : 'n/a'}`,
    `top_emotions: ${context.top_emotions.length ? context.top_emotions.join(', ') : 'n/a'}`,
  ].join('\n');
}

function buildMorningBriefFallback(briefContext = {}) {
  const context = sanitizeMorningBriefContext(briefContext);

  return [
    {
      type: 'focus',
      text: `Win rate ${context.win_rate.toFixed(0)}% across ${context.trade_count} trades. Focus only on A-quality setups.`,
    },
    {
      type: context.total_pnl >= 0 ? 'positive' : 'warning',
      text: `Recent P&L ${toSignedCurrency(context.total_pnl)}. Keep risk steady and avoid size drift.`,
    },
    {
      type: 'focus',
      text: `Plan adherence ${context.plan_followed_pct.toFixed(0)}%. Raise consistency before adding risk.`,
    },
  ];
}

function normalizeMorningBriefItems(payload, briefContext = {}) {
  const source = Array.isArray(payload)
    ? payload
    : payload?.items || payload?.brief || payload?.insights || [];

  const normalized = Array.isArray(source)
    ? source
        .map((item) => ({
          type: normalizeBriefType(item?.type),
          text: truncateText(item?.text || item?.message || item?.content || '', 140),
        }))
        .filter((item) => item.text)
        .slice(0, 3)
    : [];

  if (normalized.length === 3) {
    return normalized;
  }

  const fallback = buildMorningBriefFallback(briefContext);
  const combined = [...normalized];
  for (const item of fallback) {
    if (combined.length >= 3) break;
    if (!combined.some((existing) => existing.text === item.text)) {
      combined.push(item);
    }
  }

  return combined.slice(0, 3);
}

async function requestTradeReviewViaEndpoint({
  trade = {},
  model = DEFAULT_TRADE_REVIEW_MODEL,
}) {
  const resolvedModel = resolveModelName(model);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TRADE_REVIEW_TIMEOUT_MS);

  try {
    const headers = { 'Content-Type': 'application/json' };
    if (TRADE_REVIEW_API_KEY) {
      headers.Authorization = `Bearer ${TRADE_REVIEW_API_KEY}`;
    }

    const response = await fetch(TRADE_REVIEW_ENDPOINT, {
      method: 'POST',
      headers,
      signal: controller.signal,
      body: JSON.stringify({
        task: 'trade_review',
        model: resolvedModel,
        trade: sanitizeTradeForReviewPrompt(trade),
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Trade review API error ${response.status}: ${text}`);
    }

    const data = await response.json();
    return normalizeTradeReviewResult(data?.review ?? data?.result ?? data);
  } catch (error) {
    if (error?.name === 'AbortError') {
      throw new Error(`Trade review request timed out after ${TRADE_REVIEW_TIMEOUT_MS}ms`);
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

async function requestMorningBriefViaEndpoint({
  briefContext = {},
  model = DEFAULT_MORNING_BRIEF_MODEL,
}) {
  const resolvedModel = resolveModelName(model);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), MORNING_BRIEF_TIMEOUT_MS);

  try {
    const headers = { 'Content-Type': 'application/json' };
    if (MORNING_BRIEF_API_KEY) {
      headers.Authorization = `Bearer ${MORNING_BRIEF_API_KEY}`;
    }

    const response = await fetch(MORNING_BRIEF_ENDPOINT, {
      method: 'POST',
      headers,
      signal: controller.signal,
      body: JSON.stringify({
        task: 'morning_brief',
        model: resolvedModel,
        context: sanitizeMorningBriefContext(briefContext),
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Morning brief API error ${response.status}: ${text}`);
    }

    const data = await response.json();
    return normalizeMorningBriefItems(data?.items ?? data?.brief ?? data, briefContext);
  } catch (error) {
    if (error?.name === 'AbortError') {
      throw new Error(`Morning brief request timed out after ${MORNING_BRIEF_TIMEOUT_MS}ms`);
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

async function requestOllama({
  model,
  messages = [],
  temperature = 0.35,
  format,
}) {
  const resolvedModel = resolveModelName(model);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), OLLAMA_TIMEOUT_MS);

  try {
    const headers = { 'Content-Type': 'application/json' };
    if (OLLAMA_API_KEY) {
      headers.Authorization = `Bearer ${OLLAMA_API_KEY}`;
    }

    const body = {
      model: resolvedModel,
      stream: false,
      options: { temperature },
      messages,
    };

    if (format) {
      body.format = format;
    }

    const response = await fetch(OLLAMA_BASE_URL, {
      method: 'POST',
      headers,
      signal: controller.signal,
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Ollama chat error ${response.status}: ${errorText}`);
    }

    return await response.json();
  } catch (error) {
    if (error?.name === 'AbortError') {
      throw new Error(`Chat request timed out after ${OLLAMA_TIMEOUT_MS}ms`);
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

export async function requestAssistantReply({
  messages = [],
  model = DEFAULT_CHAT_MODEL,
  systemPrompt = 'You are TradeDesk AI. Give concise, practical guidance for active traders using clear, actionable language.',
  temperature = 0.35,
}) {
  const payload = await requestOllama({
    model,
    temperature,
    messages: [
      { role: 'system', content: systemPrompt },
      ...normalizeMessages(messages),
    ],
  });

  const rawContent = extractRawContent(payload);
  const text = typeof rawContent === 'string' ? rawContent.trim() : JSON.stringify(rawContent);

  if (!text) {
    throw new Error('Ollama returned an empty chat response');
  }

  return text;
}

export async function requestTradeDecision({
  tradeContext = {},
  model = DEFAULT_CHAT_MODEL,
  temperature = 0.1,
}) {
  const payload = await requestOllama({
    model,
    temperature,
    format: TRADE_DECISION_SCHEMA,
    messages: [
      {
        role: 'system',
        content:
          'You are a risk-first trading decision assistant. Return strict JSON matching the schema. Do not hallucinate missing facts. If uncertain, prefer WAIT or SKIP. This output is educational support, not financial advice.',
      },
      {
        role: 'user',
        content: buildTradeDecisionPrompt(tradeContext),
      },
    ],
  });

  const rawContent = extractRawContent(payload);
  const parsed = parseJsonContent(rawContent);
  return normalizeDecisionResult(parsed);
}

export async function requestTradeReview({
  trade = {},
  model = DEFAULT_TRADE_REVIEW_MODEL,
  temperature = 0.15,
}) {
  if (TRADE_REVIEW_ENDPOINT) {
    return requestTradeReviewViaEndpoint({ trade, model });
  }

  const payload = await requestOllama({
    model,
    temperature,
    format: TRADE_REVIEW_SCHEMA,
    messages: [
      {
        role: 'system',
        content:
          'You are a trading performance coach. Return strict JSON matching the schema. Keep guidance practical, specific, and brief. This is educational support, not financial advice.',
      },
      {
        role: 'user',
        content: buildTradeReviewPrompt(trade),
      },
    ],
  });

  const rawContent = extractRawContent(payload);
  const parsed = parseJsonContent(rawContent);
  return normalizeTradeReviewResult(parsed);
}

export async function requestMorningBrief({
  briefContext = {},
  model = DEFAULT_MORNING_BRIEF_MODEL,
  temperature = 0.2,
}) {
  if (MORNING_BRIEF_ENDPOINT) {
    return requestMorningBriefViaEndpoint({ briefContext, model });
  }

  const payload = await requestOllama({
    model,
    temperature,
    format: MORNING_BRIEF_SCHEMA,
    messages: [
      {
        role: 'system',
        content:
          'You are a trading coach. Return strict JSON array matching schema. Keep observations concise, actionable, and data-grounded.',
      },
      {
        role: 'user',
        content: buildMorningBriefPrompt(briefContext),
      },
    ],
  });

  const rawContent = extractRawContent(payload);
  const parsed = parseJsonContent(rawContent);
  return normalizeMorningBriefItems(parsed, briefContext);
}

export function getDefaultChatModel() {
  return DEFAULT_CHAT_MODEL;
}

export function getDefaultTradeReviewModel() {
  return DEFAULT_TRADE_REVIEW_MODEL;
}

export function getDefaultMorningBriefModel() {
  return DEFAULT_MORNING_BRIEF_MODEL;
}
