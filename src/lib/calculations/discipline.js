/**
 * Local rule-based discipline/consistency coach helpers.
 * Phase 1: deterministic scoring + soft alerts (no hard blocks).
 */
import { getTodayMaxDailyLoss } from '@/lib/config/dailyLossLimits';

function toDate(trade) {
  return new Date(trade?.entry_time ?? trade?.created_date ?? trade?.created_at ?? 0);
}

function toPnl(trade) {
  const value = Number(trade?.pnl ?? 0);
  return Number.isFinite(value) ? value : 0;
}

function isPlanFollowed(trade) {
  return trade?.followed_plan === true || trade?.followed_plan === 'true';
}

function getRecentTrades(trades = [], limit = 20) {
  return [...trades]
    .filter((t) => toDate(t).getTime() > 0)
    .sort((a, b) => toDate(b) - toDate(a))
    .slice(0, limit);
}

function getTodayTrades(trades = []) {
  const now = new Date();
  const start = new Date(now);
  const end = new Date(now);
  start.setHours(0, 0, 0, 0);
  end.setHours(23, 59, 59, 999);

  return trades.filter((t) => {
    const d = toDate(t);
    return d >= start && d <= end;
  });
}

function getCurrentLossStreak(recentTrades = []) {
  let streak = 0;
  for (const trade of recentTrades) {
    if (toPnl(trade) < 0) streak += 1;
    else break;
  }
  return streak;
}

function normalizeEmotions(emotions) {
  if (Array.isArray(emotions)) {
    return emotions.map((e) => String(e).toLowerCase());
  }
  if (typeof emotions === 'string' && emotions.trim()) {
    return [emotions.toLowerCase()];
  }
  return [];
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

export function buildDisciplineSnapshot(trades = [], settings = {}) {
  const recent = getRecentTrades(trades, 20);
  const today = getTodayTrades(trades);

  const maxDailyLoss = getTodayMaxDailyLoss(settings);
  const maxDailyTrades = Number(settings?.max_daily_trades || 0);
  const requireNotes = Boolean(settings?.journal_preferences?.require_notes);

  const todayPnL = today.reduce((sum, trade) => sum + toPnl(trade), 0);
  const todayTrades = today.length;

  const followedCount = recent.filter(isPlanFollowed).length;
  const planAdherencePct = recent.length > 0 ? (followedCount / recent.length) * 100 : 100;

  const currentLossStreak = getCurrentLossStreak(recent);

  const lossUsedPct = maxDailyLoss > 0 && todayPnL < 0
    ? clamp((Math.abs(todayPnL) / maxDailyLoss) * 100, 0, 200)
    : 0;

  const emotionHotTrades = today.filter((trade) => {
    const emotions = normalizeEmotions(trade?.emotions);
    return emotions.some((e) => ['fomo', 'revenge', 'nervous'].includes(e));
  }).length;

  const notesMissing = today.filter((trade) => {
    const notes = String(trade?.notes || '').trim();
    return notes.length === 0;
  }).length;

  let score = 100;

  if (planAdherencePct < 70) score -= 20;
  else if (planAdherencePct < 85) score -= 10;

  if (lossUsedPct >= 100) score -= 35;
  else if (lossUsedPct >= 70) score -= 20;
  else if (lossUsedPct >= 40) score -= 10;

  if (maxDailyTrades > 0) {
    const tradeUsagePct = (todayTrades / maxDailyTrades) * 100;
    if (tradeUsagePct >= 100) score -= 25;
    else if (tradeUsagePct >= 80) score -= 10;
  }

  if (currentLossStreak >= 3) score -= 25;
  else if (currentLossStreak === 2) score -= 15;

  if (emotionHotTrades >= 2) score -= 10;
  if (requireNotes && notesMissing > 0) score -= Math.min(10, notesMissing * 3);

  score = clamp(Math.round(score), 0, 100);

  const status = score >= 80 ? 'on-track' : score >= 60 ? 'watch' : 'at-risk';

  const alerts = [];
  if (planAdherencePct < 85) {
    alerts.push({
      type: 'focus',
      title: 'Plan adherence slipped',
      message: `Only ${planAdherencePct.toFixed(0)}% of your last ${recent.length || 0} trades followed plan.`
    });
  }
  if (lossUsedPct >= 70) {
    alerts.push({
      type: 'warning',
      title: 'Approaching max daily loss',
      message: `${lossUsedPct.toFixed(0)}% of daily loss limit used today.`
    });
  }
  if (maxDailyTrades > 0 && todayTrades >= maxDailyTrades) {
    alerts.push({
      type: 'warning',
      title: 'Max daily trades reached',
      message: `You logged ${todayTrades}/${maxDailyTrades} trades today.`
    });
  }
  if (currentLossStreak >= 2) {
    alerts.push({
      type: 'warning',
      title: 'Losing streak active',
      message: `${currentLossStreak} losses in a row. Size down and wait for A+ setups.`
    });
  }
  if (emotionHotTrades >= 2) {
    alerts.push({
      type: 'focus',
      title: 'Emotional pressure detected',
      message: `${emotionHotTrades} trades logged with FOMO/revenge/nervous emotions today.`
    });
  }
  if (requireNotes && notesMissing > 0) {
    alerts.push({
      type: 'focus',
      title: 'Journal discipline gap',
      message: `${notesMissing} trade${notesMissing > 1 ? 's' : ''} missing notes today.`
    });
  }

  if (alerts.length === 0) {
    alerts.push({
      type: 'positive',
      title: 'Discipline in control',
      message: 'No major behavior risk flags detected today. Keep executing your process.'
    });
  }

  const actions = [];
  if (lossUsedPct >= 70) actions.push('Take a 20-minute break before the next trade.');
  if (currentLossStreak >= 2) actions.push('Cut size by 50% until you break the losing streak.');
  if (planAdherencePct < 85) actions.push('Review plan checklist before every entry today.');
  if (requireNotes && notesMissing > 0) actions.push('Backfill notes for missing trades before next session.');
  if (!actions.length) actions.push('Keep current process and review one winning trade tonight.');

  return {
    score,
    status,
    alerts,
    actions,
    metrics: {
      planAdherencePct: round1(planAdherencePct),
      todayTrades,
      maxDailyTrades,
      todayPnL: round2(todayPnL),
      maxDailyLoss,
      lossUsedPct: round1(lossUsedPct),
      currentLossStreak,
    },
  };
}

function round1(n) {
  return Math.round((Number(n) + Number.EPSILON) * 10) / 10;
}

function round2(n) {
  return Math.round((Number(n) + Number.EPSILON) * 100) / 100;
}
