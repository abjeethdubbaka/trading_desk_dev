import { requestSecureAI, hasSecureAIBridge, SECURE_AI_KINDS } from './secureAIBridge';

/**
 * Optional LLM overlay service for discipline coaching.
 * Uses a backend endpoint when configured.
 */

const COACH_ENDPOINT = import.meta.env.VITE_DISCIPLINE_COACH_ENDPOINT;
const COACH_API_KEY = import.meta.env.VITE_DISCIPLINE_COACH_API_KEY;
const COACH_TIMEOUT_MS = Number(import.meta.env.VITE_DISCIPLINE_COACH_TIMEOUT_MS || 12000);

export function isDisciplineCoachEnabled() {
  return Boolean(COACH_ENDPOINT) || hasSecureAIBridge();
}

export async function requestDisciplineCoach(snapshot) {
  const secureResponse = await requestSecureAI(
    SECURE_AI_KINDS.DISCIPLINE_COACH,
    {
      task: 'discipline_coach_overlay',
      snapshot: sanitizeSnapshot(snapshot),
    },
    { timeoutMs: COACH_TIMEOUT_MS, allowFallback: true }
  );

  if (secureResponse) {
    return normalizeCoachResponse(secureResponse);
  }

  if (!COACH_ENDPOINT) {
    throw new Error('Discipline coach endpoint not configured');
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), COACH_TIMEOUT_MS);

  try {
    const headers = {
      'Content-Type': 'application/json',
    };

    if (COACH_API_KEY) {
      headers.Authorization = `Bearer ${COACH_API_KEY}`;
    }

    const response = await fetch(COACH_ENDPOINT, {
      method: 'POST',
      headers,
      signal: controller.signal,
      body: JSON.stringify({
        task: 'discipline_coach_overlay',
        snapshot: sanitizeSnapshot(snapshot),
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Discipline coach API error ${response.status}: ${text}`);
    }

    const data = await response.json();
    return normalizeCoachResponse(data);
  } finally {
    clearTimeout(timeout);
  }
}

function sanitizeSnapshot(snapshot = {}) {
  return {
    score: Number(snapshot.score || 0),
    status: snapshot.status || 'watch',
    metrics: {
      planAdherencePct: Number(snapshot.metrics?.planAdherencePct || 0),
      todayTrades: Number(snapshot.metrics?.todayTrades || 0),
      maxDailyTrades: Number(snapshot.metrics?.maxDailyTrades || 0),
      todayPnL: Number(snapshot.metrics?.todayPnL || 0),
      maxDailyLoss: Number(snapshot.metrics?.maxDailyLoss || 0),
      lossUsedPct: Number(snapshot.metrics?.lossUsedPct || 0),
      currentLossStreak: Number(snapshot.metrics?.currentLossStreak || 0),
    },
    alerts: (snapshot.alerts || []).slice(0, 4).map((a) => ({
      type: a?.type || 'focus',
      title: a?.title || '',
      message: a?.message || '',
    })),
    actions: (snapshot.actions || []).slice(0, 4),
  };
}

function normalizeCoachResponse(payload = {}) {
  const rawInsights = payload.insights || payload.alerts || [];
  const rawActions = payload.actions || payload.next_actions || [];

  const insights = Array.isArray(rawInsights)
    ? rawInsights
        .map((item) => ({
          type: ['positive', 'focus', 'warning'].includes(item?.type) ? item.type : 'focus',
          title: String(item?.title || item?.label || 'AI Coaching Insight').trim(),
          message: String(item?.message || item?.text || '').trim(),
        }))
        .filter((item) => item.title && item.message)
        .slice(0, 3)
    : [];

  const actions = Array.isArray(rawActions)
    ? rawActions
        .map((item) => (typeof item === 'string' ? item : item?.description || item?.text || ''))
        .map((item) => String(item).trim())
        .filter(Boolean)
        .slice(0, 3)
    : [];

  const summary = String(payload.summary || payload.coach_summary || '').trim();

  return { insights, actions, summary };
}
