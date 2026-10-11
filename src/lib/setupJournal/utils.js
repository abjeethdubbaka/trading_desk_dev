/**
 * @file src/lib/setupJournal/utils.js
 *
 * Setup Journal — a structured debrief filled in per trade taken on a
 * strategy. Each setup carries its own template of multiple-choice prompts
 * ("was the second high lower, equal or higher?") plus the free-text question
 * the trader wants to be forced to answer every time.
 *
 * The point is not the writing. It is that every entry is answered from the
 * same fixed vocabulary, so the journal can be grouped by answer and show
 * which variant of a setup actually pays — something free-text notes can
 * never do.
 *
 * Pure module: no React, no database, no browser APIs.
 */

const toTrimmedString = (value) => (typeof value === 'string' ? value.trim() : '');

function toNumber(value) {
  if (value === '' || value == null) return null;
  const num = Number(value);
  return Number.isFinite(num) ? num : null;
}

function round(value, digits = 2) {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

/** A label becomes its own stable id, so templates read the same as they store. */
export function toFieldId(label) {
  return toTrimmedString(label)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

/**
 * The starting template. Modelled on a double-top short debrief — the prompts
 * that decide whether that setup is the good version of itself — and edited
 * per strategy from there.
 */
export const DEFAULT_TEMPLATE_FIELDS = [
  { label: 'Location', options: ['PMH', 'PDH', 'Other'] },
  { label: 'First high', options: ['Clean', 'Messy'] },
  { label: 'Second high', options: ['Lower', 'Equal', 'Higher'] },
  { label: 'Volume', options: ['Lower', 'Equal', 'Higher'] },
  { label: 'Rejection', options: ['Strong', 'Moderate', 'Weak'] },
  { label: 'Trigger', options: ['Confirmed', 'Anticipated', 'Late'] },
  { label: 'Market', options: ['Bullish', 'Neutral', 'Bearish'] },
  { label: 'Room', options: ['Good', 'Marginal', 'Poor'] },
  { label: 'Setup grade', options: ['A+', 'A', 'B', 'C'] },
  { label: 'Execution grade', options: ['A+', 'A', 'B', 'C', 'D', 'F'] },
];

export const DEFAULT_TEMPLATE_QUESTIONS = [
  'What did the market prove before I entered?',
];

export function createDefaultTemplate() {
  return normalizeTemplate({
    fields: DEFAULT_TEMPLATE_FIELDS,
    questions: DEFAULT_TEMPLATE_QUESTIONS.map((prompt) => ({ prompt })),
  });
}

export function normalizeTemplateField(raw) {
  const source = raw && typeof raw === 'object' ? raw : {};
  const label = toTrimmedString(source.label);
  const options = (Array.isArray(source.options) ? source.options : [])
    .map((option) => toTrimmedString(option))
    .filter(Boolean);

  return {
    id: toTrimmedString(source.id) || toFieldId(label),
    label,
    options,
  };
}

export function normalizeTemplate(raw) {
  const source = raw && typeof raw === 'object' ? raw : {};

  const fields = (Array.isArray(source.fields) ? source.fields : [])
    .map(normalizeTemplateField)
    // A prompt with no id, no label or no answers to choose from cannot be
    // filled in, so it is dropped rather than rendered as a dead row.
    .filter((field) => field.id && field.label && field.options.length > 0);

  const questions = (Array.isArray(source.questions) ? source.questions : [])
    .map((question) => {
      const prompt = toTrimmedString(typeof question === 'string' ? question : question?.prompt);
      return {
        id: toTrimmedString(question?.id) || toFieldId(prompt),
        prompt,
      };
    })
    .filter((question) => question.id && question.prompt);

  return { fields, questions };
}

/** The template a setup uses — its own, or the starting one until it has edited it. */
export function getTemplateForEntry(playbookEntry) {
  const stored = normalizeTemplate(playbookEntry?.journal_template);
  if (stored.fields.length > 0 || stored.questions.length > 0) return stored;
  return createDefaultTemplate();
}

export function normalizeJournalEntry(raw) {
  const source = raw && typeof raw === 'object' && !Array.isArray(raw) ? raw : {};

  const collectText = (value) => {
    const out = {};
    const rawMap = value && typeof value === 'object' && !Array.isArray(value) ? value : {};
    for (const [key, item] of Object.entries(rawMap)) {
      const text = toTrimmedString(item);
      if (text) out[key] = text;
    }
    return out;
  };

  return {
    id: toTrimmedString(source.id),
    strategy: toTrimmedString(source.strategy),
    // The logged trade this debrief is about, when it was written against one.
    trade_id: toTrimmedString(source.trade_id),
    // The account tier this was traded on, so a tier exports only its own.
    account_type: toTrimmedString(source.account_type),
    symbol: toTrimmedString(source.symbol),
    traded_on: toTrimmedString(source.traded_on),
    answers: collectText(source.answers),
    responses: collectText(source.responses),
    r_multiple: toNumber(source.r_multiple),
    mfe_r: toNumber(source.mfe_r),
    mae_r: toNumber(source.mae_r),
    note: toTrimmedString(source.note),
    created_date: toTrimmedString(source.created_date),
  };
}

export function groupJournalEntriesByStrategy(entries = []) {
  const grouped = new Map();
  for (const entry of Array.isArray(entries) ? entries : []) {
    const key = toTrimmedString(entry?.strategy).toLowerCase();
    if (!key) continue;
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key).push(entry);
  }
  return grouped;
}

function statsFor(entries) {
  const scored = entries.filter((entry) => toNumber(entry?.r_multiple) != null);
  const rValues = scored.map((entry) => Number(entry.r_multiple));
  const wins = rValues.filter((r) => r > 0).length;

  const mfeValues = entries.map((e) => toNumber(e?.mfe_r)).filter((v) => v != null);
  const maeValues = entries.map((e) => toNumber(e?.mae_r)).filter((v) => v != null);
  const mean = (values) => (values.length > 0
    ? round(values.reduce((sum, v) => sum + v, 0) / values.length)
    : null);

  return {
    count: entries.length,
    scored: scored.length,
    wins,
    winRate: scored.length > 0 ? round((wins / scored.length) * 100, 1) : null,
    avgR: mean(rValues),
    totalR: rValues.length > 0 ? round(rValues.reduce((sum, v) => sum + v, 0)) : null,
    avgMfeR: mean(mfeValues),
    avgMaeR: mean(maeValues),
  };
}

export function summarizeJournalEntries(entries = []) {
  return statsFor(Array.isArray(entries) ? entries : []);
}

/** How often an answer must have been used before its numbers are compared. */
export const MIN_SAMPLES_PER_OPTION = 3;

/**
 * The payoff: every answer of every prompt, scored on its own. Reading down a
 * field tells you which version of the setup carries the edge — "second high
 * lower" against "second high higher", not an average that hides both.
 */
export function summarizeByField(entries = [], template, minSamples = MIN_SAMPLES_PER_OPTION) {
  const rows = Array.isArray(entries) ? entries : [];
  const { fields } = normalizeTemplate(template);

  return fields.map((field) => {
    const options = field.options.map((option) => {
      const matching = rows.filter((entry) => entry?.answers?.[field.id] === option);
      return { option, ...statsFor(matching) };
    });

    // Only rank answers seen often enough to mean anything.
    const comparable = options.filter((o) => o.scored >= minSamples && o.avgR != null);
    const ranked = [...comparable].sort((a, b) => b.avgR - a.avgR);

    return {
      id: field.id,
      label: field.label,
      options,
      best: ranked[0] || null,
      worst: ranked.length > 1 ? ranked[ranked.length - 1] : null,
    };
  });
}

/**
 * An entry is only worth comparing when its prompts were actually answered —
 * a half-filled debrief would otherwise drag every option's numbers around.
 */
export function getEntryCompletion(entry, template) {
  const { fields, questions } = normalizeTemplate(template);
  const required = fields.length + questions.length;
  if (required === 0) return { answered: 0, required: 0, isComplete: true };

  const answered = fields.filter((field) => toTrimmedString(entry?.answers?.[field.id])).length
    + questions.filter((question) => toTrimmedString(entry?.responses?.[question.id])).length;

  return { answered, required, isComplete: answered === required };
}

/**
 * What a logged trade already knows about itself. A debrief is written
 * against a trade, so its result never has to be typed twice — MAE is the
 * exception, since trades do not record how far they went against you.
 */
export function tradeToJournalDefaults(trade) {
  const source = trade && typeof trade === 'object' ? trade : {};
  const entryTime = toTrimmedString(source.entry_time) || toTrimmedString(source.created_date);

  return {
    trade_id: toTrimmedString(source.id),
    symbol: toTrimmedString(source.symbol),
    traded_on: entryTime ? entryTime.slice(0, 10) : '',
    r_multiple: toNumber(source.r_multiple),
    mfe_r: toNumber(source.mfe_r_multiple),
  };
}

/**
 * A linked entry reads its result from the trade itself, so editing the trade
 * corrects every number the journal shows. Values the trade does not carry —
 * MAE above all — stay as they were written in the debrief.
 */
export function mergeEntryWithTrade(entry, trade, template = null) {
  const normalized = normalizeJournalEntry(entry);
  if (!normalized.trade_id || !trade) return normalized;

  const live = tradeToJournalDefaults(trade);
  const executionField = normalizeTemplate(template).fields
    .find((field) => field.id === EXECUTION_GRADE_FIELD_ID);
  const executionGrade = getExecutionGradeFromTrade(trade, executionField?.options || null);

  return {
    ...normalized,
    symbol: live.symbol || normalized.symbol,
    traded_on: live.traded_on || normalized.traded_on,
    r_multiple: live.r_multiple != null ? live.r_multiple : normalized.r_multiple,
    mfe_r: live.mfe_r != null ? live.mfe_r : normalized.mfe_r,
    answers: executionGrade
      ? { ...normalized.answers, [EXECUTION_GRADE_FIELD_ID]: executionGrade }
      : normalized.answers,
  };
}

/** The trades already debriefed, so the picker does not offer them twice. */
export function getJournaledTradeIds(entries = []) {
  return new Set(
    (Array.isArray(entries) ? entries : [])
      .map((entry) => toTrimmedString(entry?.trade_id))
      .filter(Boolean)
  );
}

/**
 * The trades a debrief can be written against: taken on this strategy, and
 * not already journaled.
 */
export function getJournalableTrades(trades = [], entries = [], strategyName = '') {
  const wanted = toTrimmedString(strategyName).toLowerCase();
  const already = getJournaledTradeIds(entries);

  return (Array.isArray(trades) ? trades : []).filter((trade) => {
    const setup = toTrimmedString(trade?.setup_type);
    // A trade with no setup has no template to be debriefed against.
    if (!setup) return false;
    if (already.has(toTrimmedString(trade?.id))) return false;
    // No strategy asked for means every setup — the debrief takes its setup
    // from the trade rather than the other way round.
    return wanted ? setup.toLowerCase() === wanted : true;
  });
}

/** The calendar day a trade was taken, as YYYY-MM-DD. */
export function getTradeDate(trade) {
  return tradeToJournalDefaults(trade).traded_on;
}

/**
 * Trades taken on one day. A debrief is written while the chart is still
 * fresh, so today's trades are what the picker offers first.
 */
export function filterTradesOnDate(trades = [], isoDate) {
  const wanted = toTrimmedString(isoDate);
  if (!wanted) return Array.isArray(trades) ? trades : [];
  return (Array.isArray(trades) ? trades : []).filter((trade) => getTradeDate(trade) === wanted);
}

/**
 * The prompt whose answer the trade itself already decides. Add Trade scores
 * every trade out of 10 from its entry, exit, stop-loss, size and emotion
 * grades, so asking the trader to grade their own execution a second time
 * would only invite a different answer.
 */
export const EXECUTION_GRADE_FIELD_ID = 'execution_grade';

const EXECUTION_GRADE_BANDS = [
  { min: 9, grade: 'A+' },
  { min: 8, grade: 'A' },
  { min: 6.5, grade: 'B' },
  { min: 5, grade: 'C' },
  { min: 3.5, grade: 'D' },
  { min: -Infinity, grade: 'F' },
];

/** The trade's out-of-10 rating as a letter. */
export function ratingToGrade(rating) {
  const value = toNumber(rating);
  if (value == null) return '';
  return EXECUTION_GRADE_BANDS.find((band) => value >= band.min).grade;
}

/**
 * The execution grade a trade has earned, expressed with whatever letters the
 * setup's own template offers — a template that stops at A still gets an
 * answer rather than none.
 */
export function getExecutionGradeFromTrade(trade, options = null) {
  const grade = ratingToGrade(trade?.overall_rating);
  if (!grade) return '';
  if (!Array.isArray(options) || options.length === 0) return grade;
  if (options.includes(grade)) return grade;

  const fallbackOrder = ['A+', 'A', 'B', 'C', 'D', 'E', 'F'];
  const position = fallbackOrder.indexOf(grade);
  if (position === -1) return '';
  // Step down the scale to the nearest letter this template actually uses,
  // and failing that clamp to its lowest — a template that stops at C calls a
  // poorly executed trade a C rather than refusing to answer.
  for (let i = position; i < fallbackOrder.length; i += 1) {
    if (options.includes(fallbackOrder[i])) return fallbackOrder[i];
  }
  const lowest = [...fallbackOrder].reverse().find((letter) => options.includes(letter));
  return lowest || '';
}

/**
 * Content fingerprint of a debrief, used to recognise one that has already
 * been imported. Ignores id and created_date: two exports of the same entry
 * carry different ids, and re-importing a file should not duplicate it.
 */
export function journalEntrySignature(entry) {
  const e = normalizeJournalEntry(entry);
  const flatten = (map) => Object.keys(map).sort().map((key) => `${key}=${map[key]}`).join(';');

  return [
    e.strategy.toLowerCase(),
    e.trade_id,
    e.traded_on,
    e.symbol.toLowerCase(),
    flatten(e.answers),
    flatten(e.responses),
    e.note,
  ].join('|');
}

/** The debriefs belonging to a given set of strategy names. */
export function selectJournalEntriesForStrategies(entries = [], strategyNames = []) {
  const wanted = new Set(
    strategyNames.map((name) => toTrimmedString(name).toLowerCase()).filter(Boolean)
  );
  if (wanted.size === 0) return [];
  return (Array.isArray(entries) ? entries : []).filter((entry) => (
    wanted.has(toTrimmedString(entry?.strategy).toLowerCase())
  ));
}

/**
 * Debriefs belong to the account tier they were traded on, the same way
 * trades do. Entries written before tiers were stamped carry none, so they
 * stay visible rather than disappearing from every tier.
 */
export function filterJournalEntriesByAccount(entries = [], accountType) {
  const wanted = toTrimmedString(accountType);
  if (!wanted) return Array.isArray(entries) ? entries : [];

  return (Array.isArray(entries) ? entries : []).filter((entry) => {
    const stamped = toTrimmedString(entry?.account_type);
    return !stamped || stamped === wanted;
  });
}
