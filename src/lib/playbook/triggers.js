/**
 * @file src/lib/playbook/triggers.js
 *
 * Filing Trade Terminal's alert triggers under Playbook strategies.
 *
 * An alert names its setup ("VWAP REJ SHORT"), but it arrives through OCR,
 * so the words are often mangled: "W{AP REJ", "WVAP REJ", or just "REJ".
 * Matching is therefore forgiving: the letters of a strategy's alert keyword
 * are compared in order with what was read, and a strategy only qualifies
 * when its direction allows the trigger's.
 *
 * Pure module: no React, no database.
 */

export const MIN_MATCH_SCORE = 0.75;

/** Letters and digits only, upper case: how alert text is compared. */
export function toMatchKey(text) {
  return String(text || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
}

/** Length of the longest common subsequence: letters in the same order. */
function commonLetters(a, b) {
  if (!a || !b) return 0;
  const prev = new Array(b.length + 1).fill(0);
  for (let i = 1; i <= a.length; i += 1) {
    let diagonal = 0;
    for (let j = 1; j <= b.length; j += 1) {
      const above = prev[j];
      prev[j] = a[i - 1] === b[j - 1] ? diagonal + 1 : Math.max(prev[j], prev[j - 1]);
      diagonal = above;
    }
  }
  return prev[b.length];
}

/**
 * How well what was read matches a keyword, 0–1. A short read inside a
 * longer keyword ("REJ" in "VWAP REJ") counts, as long as it is a fair part
 * of the keyword and not a stray letter or two.
 */
export function scoreSetupMatch(setupText, keyword) {
  const read = toMatchKey(setupText);
  const key = toMatchKey(keyword);
  if (!read || !key) return 0;
  if (read === key) return 1;
  const common = commonLetters(read, key);
  if (common < 2 || common / key.length < 0.4) return 0;
  return common / Math.min(read.length, key.length);
}

/** A strategy's alert keywords; its name stands in when none are set. */
export function getAlertKeywords(entry) {
  const keywords = Array.isArray(entry?.alert_keywords)
    ? entry.alert_keywords.map((k) => String(k || '').trim()).filter(Boolean)
    : [];
  return keywords.length > 0 ? keywords : [String(entry?.name || '').trim()].filter(Boolean);
}

/**
 * The strategy a trigger belongs to, or null. Ties go to the closer match
 * on the keyword's own length, so "VWAP REJ" beats a looser "REJ" keyword
 * only when the read supports it.
 */
export function matchTriggerToPlaybook(trigger, entries = []) {
  let best = null;
  for (const entry of Array.isArray(entries) ? entries : []) {
    if (entry?.is_active === false) continue;
    const direction = entry?.direction || 'both';
    if (direction !== 'both' && trigger?.direction && direction !== trigger.direction) continue;
    for (const keyword of getAlertKeywords(entry)) {
      const score = scoreSetupMatch(trigger?.setupText, keyword);
      if (score < MIN_MATCH_SCORE) continue;
      const coverage = commonLetters(toMatchKey(trigger?.setupText), toMatchKey(keyword)) / toMatchKey(keyword).length;
      if (!best || score > best.score || (score === best.score && coverage > best.coverage)) {
        best = { entry, keyword, score, coverage };
      }
    }
  }
  return best ? { entry: best.entry, keyword: best.keyword, score: Math.round(best.score * 100) / 100 } : null;
}

/** Parses the editor's comma-separated keywords. */
export function parseAlertKeywords(text) {
  const seen = new Set();
  return String(text || '')
    .split(',')
    .map((k) => k.trim().toUpperCase().replace(/\s+/g, ' '))
    .filter((k) => k && !seen.has(k) && seen.add(k));
}

/** Counts per strategy: all-time and today. */
export function summarizeTriggers(triggers = [], todayKey) {
  const byPlaybook = new Map();
  for (const trigger of Array.isArray(triggers) ? triggers : []) {
    const key = trigger?.playbook_id || null;
    const bucket = byPlaybook.get(key) || { total: 0, today: 0, long: 0, short: 0, recent: [] };
    bucket.total += 1;
    if (trigger.date === todayKey) bucket.today += 1;
    if (trigger.direction === 'long') bucket.long += 1;
    if (trigger.direction === 'short') bucket.short += 1;
    bucket.recent.push(trigger);
    byPlaybook.set(key, bucket);
  }
  for (const bucket of byPlaybook.values()) {
    bucket.recent.sort((a, b) => `${b.date} ${b.timeEt}`.localeCompare(`${a.date} ${a.timeEt}`));
  }
  return byPlaybook;
}
