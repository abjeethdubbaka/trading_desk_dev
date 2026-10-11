/**
 * @file src/lib/constants/emotions.js
 *
 * The emotions a trade can be tagged with. Edited in Settings like the other
 * keyword lists; these are the starting set.
 *
 * A trade stores the emotion's key — its label in lower case — so the six
 * defaults keep the exact values older trades already hold ('fomo',
 * 'disciplined'), and a custom emotion such as "Impatient" is stored as
 * 'impatient'.
 *
 * Pure module: no React.
 */

export const DEFAULT_EMOTIONS = ['Disciplined', 'Confident', 'Neutral', 'Nervous', 'FOMO', 'Revenge'];

/**
 * How much each emotion contributes to a trade's out-of-10 rating, as a share
 * of its 1.5-point weight. An emotion the trader added has no known meaning,
 * so it scores as neutral rather than guessing it was good or bad.
 */
const EMOTION_POINTS = {
  disciplined: 1,
  confident: 0.85,
  neutral: 0.6,
  nervous: 0.35,
  fomo: 0.1,
  revenge: 0,
};

export const NEUTRAL_EMOTION_POINTS = EMOTION_POINTS.neutral;

/** Dot colour per known emotion; anything added later reads as neutral grey. */
const EMOTION_DOTS = {
  disciplined: 'bg-blue-400',
  confident: 'bg-emerald-400',
  neutral: 'bg-gray-400',
  nervous: 'bg-amber-400',
  fomo: 'bg-orange-400',
  revenge: 'bg-red-400',
};

export function toEmotionKey(label) {
  return String(label || '').trim().toLowerCase();
}

/** The trader's emotions as { value, label } options, falling back to the defaults. */
export function getEmotionOptions(settings) {
  const stored = Array.isArray(settings?.emotions) && settings.emotions.length > 0
    ? settings.emotions
    : DEFAULT_EMOTIONS;

  const seen = new Set();
  return stored
    .map((label) => String(label || '').trim())
    .filter(Boolean)
    .map((label) => ({ value: toEmotionKey(label), label }))
    .filter((option) => !seen.has(option.value) && seen.add(option.value));
}

export function getEmotionPoints(value) {
  const key = toEmotionKey(value);
  if (!key) return null;
  return key in EMOTION_POINTS ? EMOTION_POINTS[key] : NEUTRAL_EMOTION_POINTS;
}

export function getEmotionDotClass(value) {
  return EMOTION_DOTS[toEmotionKey(value)] || 'bg-slate-400';
}
