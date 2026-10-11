/**
 * @file src/lib/morningBrief/utils.js
 *
 * The morning check-in asked when the app opens: four questions about the
 * trader's state, each on a 1–10 scale where 10 is always the good end, an
 * optional goal for the day, and a mental score from the four.
 *
 * Pure module: no React, no database.
 */

export const MORNING_BRIEF_QUESTIONS = [
  {
    key: 'sleep',
    title: 'Sleep quality',
    prompt: 'How did you sleep last night?',
    low: 'Barely slept',
    high: 'Well rested',
  },
  {
    key: 'emotions',
    title: "Yesterday's emotions",
    prompt: "How are yesterday's emotions affecting you today?",
    low: 'Still carrying them',
    high: 'Not at all',
  },
  {
    key: 'focus',
    title: 'Focus',
    prompt: 'How focused do you feel for today?',
    low: 'Scattered',
    high: 'Locked in',
  },
  {
    key: 'confidence',
    title: 'Confidence',
    prompt: 'How confident do you feel in your trading plan today?',
    low: 'Unsure',
    high: 'Fully confident',
  },
];

export const SCALE_MIN = 1;
export const SCALE_MAX = 10;

function toAnswer(value) {
  const num = Number(value);
  if (!Number.isFinite(num)) return null;
  return Math.min(SCALE_MAX, Math.max(SCALE_MIN, Math.round(num)));
}

/** True once every question has an answer. */
export function isBriefComplete(answers = {}) {
  return MORNING_BRIEF_QUESTIONS.every((q) => toAnswer(answers?.[q.key]) != null);
}

/** The mental score out of 10: the average of the four answers, or null until all are given. */
export function computeMentalScore(answers = {}) {
  if (!isBriefComplete(answers)) return null;
  const total = MORNING_BRIEF_QUESTIONS.reduce((sum, q) => sum + toAnswer(answers[q.key]), 0);
  return Math.round((total / MORNING_BRIEF_QUESTIONS.length) * 10) / 10;
}

/**
 * What the score means for the session. Any single answer at 3 or below is
 * called out even when the average looks fine — one bad night's sleep is
 * reason enough to size down.
 */
export function getReadiness(score, answers = {}) {
  const weakest = MORNING_BRIEF_QUESTIONS
    .map((q) => ({ ...q, value: toAnswer(answers?.[q.key]) }))
    .filter((q) => q.value != null && q.value <= 3)
    .sort((a, b) => a.value - b.value)[0] || null;

  if (score == null) return { tone: 'neutral', label: 'Not scored', advice: '', weakest };
  if (score >= 7 && !weakest) {
    return { tone: 'positive', label: 'Ready to trade', advice: 'Trade your plan at full size.', weakest };
  }
  if (score >= 5) {
    return {
      tone: 'warning',
      label: 'Trade with care',
      advice: weakest
        ? `${weakest.title} is low. Size down and take only A setups.`
        : 'Size down and take only A setups.',
      weakest,
    };
  }
  return {
    tone: 'danger',
    label: 'Consider sitting out',
    advice: 'Paper trade or half size today. Protecting the account is the job.',
    weakest,
  };
}

/** The record stored for the day. */
export function buildMorningBrief(answers = {}, goal = '', dateKey, now = new Date()) {
  const record = { date: dateKey, goal: String(goal || '').trim(), saved_at: now.toISOString() };
  for (const q of MORNING_BRIEF_QUESTIONS) record[q.key] = toAnswer(answers?.[q.key]);
  record.mental_score = computeMentalScore(answers);
  return record;
}
