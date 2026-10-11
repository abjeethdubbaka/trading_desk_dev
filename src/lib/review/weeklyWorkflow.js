/**
 * @file src/lib/review/weeklyWorkflow.js
 *
 * The weekly review workflow: wins, improvements, and the process goals set
 * for the week ahead. Kept per ISO week in local storage, since it is a
 * personal working note rather than account data.
 *
 * Shared so the goals can be read outside the review card — the point of
 * writing "1-3 non-negotiable process goals" is to see them while trading,
 * not only while reviewing.
 */

export const WEEKLY_REVIEW_STORAGE_KEY = 'weeklyReview.workflow.v1';

export const EMPTY_WORKFLOW = Object.freeze({
  wins: '',
  improvements: '',
  nextFocus: '',
  updatedAt: '',
});

/** ISO week key, e.g. 2026-W39. */
export function getIsoWeekKey(date = new Date()) {
  const utcDate = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = utcDate.getUTCDay() || 7;
  utcDate.setUTCDate(utcDate.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(utcDate.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil((((utcDate - yearStart) / 86400000) + 1) / 7);
  return `${utcDate.getUTCFullYear()}-W${String(weekNo).padStart(2, '0')}`;
}

export function toWorkflowEntry(value = {}) {
  return {
    wins: String(value?.wins || ''),
    improvements: String(value?.improvements || ''),
    nextFocus: String(value?.nextFocus || ''),
    updatedAt: String(value?.updatedAt || ''),
  };
}

export function readWorkflowStore() {
  if (typeof window === 'undefined') return {};

  try {
    const parsed = JSON.parse(localStorage.getItem(WEEKLY_REVIEW_STORAGE_KEY) || '{}');
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

export function saveWorkflowStore(store) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(WEEKLY_REVIEW_STORAGE_KEY, JSON.stringify(store));
}

function toLines(text) {
  return String(text || '')
    .split('\n')
    .flatMap((line) => line.split(/\s*[;•]\s*/))
    .map((line) => line.replace(/^[-*\d.)\s]+/, '').trim())
    .filter(Boolean);
}

/**
 * The process goals that apply right now. A goal written under "Next Week
 * Focus" during last week's review is this week's focus, so the most recent
 * earlier week is used until the current week has its own.
 */
export function getActiveFocusLines(store = {}, currentWeekKey = getIsoWeekKey()) {
  const current = toLines(store?.[currentWeekKey]?.nextFocus);
  if (current.length > 0) return current;

  const previousKey = Object.keys(store || {})
    .filter((weekKey) => weekKey < currentWeekKey)
    .sort()
    .pop();

  return previousKey ? toLines(store[previousKey]?.nextFocus) : [];
}
