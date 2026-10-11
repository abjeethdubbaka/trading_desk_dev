/**
 * Affirmations that roll across the top of the Calculator — who you are when
 * you size a position, in your own words. Edited in Settings; these are only
 * the starting list.
 */
export const DEFAULT_CALCULATOR_AFFIRMATIONS = [
  'I am an executor',
  'I am a professional',
  'I am a mechanic, not a gambler',
  'I trade my plan, not my opinion',
  'I take only A+ setups',
  'I size for the stop',
  'I am patient — the setup comes to me',
  'I protect capital first',
  'I am more than any one trade',
  'I am consistent',
];

/** The older key this list was stored under. */
export const LEGACY_CALCULATOR_NOTES_KEY = 'calculator_notes';
export const CALCULATOR_AFFIRMATIONS_KEY = 'calculator_affirmations';

/** The affirmations a trader has set, falling back to the starting list. */
export function getCalculatorAffirmations(settings) {
  const stored = settings?.[CALCULATOR_AFFIRMATIONS_KEY] ?? settings?.[LEGACY_CALCULATOR_NOTES_KEY];
  if (!Array.isArray(stored)) return DEFAULT_CALCULATOR_AFFIRMATIONS;
  return stored.map((line) => String(line || '').trim()).filter(Boolean);
}
