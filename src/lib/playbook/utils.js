import { normalizeIndicators } from './indicators.js';
import { normalizeTemplate, ratingToGrade } from '../setupJournal/utils.js';
import { sanitizeSetupTypes } from '../../components/journal/AddTradeModal/constants/tradeConstants.js';

export const PLAYBOOK_FIELD = 'strategy_playbook';

const VALID_TIMEFRAMES = ['2min', '5min', '15min', '30min'];

function normalizeTimeframes(input) {
  if (Array.isArray(input)) {
    return input.map((t) => String(t).trim()).filter((t) => VALID_TIMEFRAMES.includes(t));
  }
  if (typeof input === 'string' && input.trim()) {
    return VALID_TIMEFRAMES.filter((tf) => input.includes(tf));
  }
  return [];
}

function toTrimmedString(value) {
  return String(value ?? '').trim();
}

function toOptionalNumber(value) {
  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? numericValue : null;
}

function normalizeLineItems(input) {
  if (Array.isArray(input)) {
    const normalized = input
      .map((item) => toTrimmedString(item))
      .filter(Boolean);
    return [...new Set(normalized)];
  }

  if (typeof input === 'string') {
    const normalized = input
      .split('\n')
      .map((item) => item.trim())
      .filter(Boolean);
    return [...new Set(normalized)];
  }

  return [];
}

export const CRITERIA_GRADE_OPTIONS = ['A+', 'A', 'B', 'C', 'D', 'E', 'F'];

// Entry/Exit/Stop Loss criteria items, each optionally tagged with the grade
// it corresponds to (e.g. "Price breaks and holds above key level" -> A+).
// When a trader picks a tagged item in Add Trade, its grade is auto-filled
// instead of left for manual selection. Accepts plain strings (untagged,
// grade: '') for backward compatibility with previously-saved data.
function normalizeGradedItems(input) {
  const toItem = (raw) => {
    if (raw && typeof raw === 'object' && !Array.isArray(raw)) {
      const text = toTrimmedString(raw.text ?? raw.label ?? raw.value);
      const grade = CRITERIA_GRADE_OPTIONS.includes(raw.grade) ? raw.grade : '';
      return text ? { text, grade } : null;
    }
    const text = toTrimmedString(raw);
    return text ? { text, grade: '' } : null;
  };

  let rawItems = [];
  if (Array.isArray(input)) {
    rawItems = input;
  } else if (typeof input === 'string') {
    rawItems = input.split('\n');
  }

  const seen = new Set();
  const items = [];
  for (const raw of rawItems) {
    const item = toItem(raw);
    if (!item || seen.has(item.text)) continue;
    seen.add(item.text);
    items.push(item);
  }

  return items;
}

function normalizeTags(input) {
  if (Array.isArray(input)) {
    const tags = input
      .map((item) => toTrimmedString(item).toLowerCase())
      .filter(Boolean);
    return [...new Set(tags)];
  }

  if (typeof input === 'string') {
    const tags = input
      .split(',')
      .map((item) => item.trim().toLowerCase())
      .filter(Boolean);
    return [...new Set(tags)];
  }

  return [];
}

function normalizeExample(example) {
  if (!example || typeof example !== 'object' || Array.isArray(example)) {
    return null;
  }

  const title = toTrimmedString(example.title || example.name);
  const url = toTrimmedString(example.url || example.link);
  const note = toTrimmedString(example.note || example.description);

  if (!title && !url && !note) return null;

  return {
    title,
    url,
    note,
  };
}

function normalizeExamples(input) {
  if (!Array.isArray(input)) return [];
  return input.map((example) => normalizeExample(example)).filter(Boolean);
}

function normalizeSetupConditions(input) {
  const source = input && typeof input === 'object' && !Array.isArray(input)
    ? input
    : {};

  return {
    structure: toTrimmedString(source.structure),
    ema_context: toTrimmedString(source.ema_context),
    volume: toTrimmedString(source.volume),
    market_context: toTrimmedString(source.market_context),
    time: toTrimmedString(source.time),
    entry_type: toTrimmedString(source.entry_type),
  };
}

function normalizeGradeCriteria(input) {
  const source = input && typeof input === 'object' && !Array.isArray(input)
    ? input
    : {};

  return {
    a_plus: toTrimmedString(source.a_plus),
    a: toTrimmedString(source.a),
    b: toTrimmedString(source.b),
    c: toTrimmedString(source.c),
  };
}

function normalizeTriggerSpec(input) {
  const source = input && typeof input === 'object' && !Array.isArray(input)
    ? input
    : {};

  return {
    entry_trigger: toTrimmedString(source.entry_trigger),
    trigger_level: toTrimmedString(source.trigger_level),
    trigger_event: toTrimmedString(source.trigger_event),
    order: toTrimmedString(source.order),
    expiry_bars: toOptionalNumber(source.expiry_bars),
    abort_if: toTrimmedString(source.abort_if),
    loss_r: toOptionalNumber(source.loss_r),
    win_rate: toOptionalNumber(source.win_rate),
  };
}

function normalizeExpectedRProfile(input) {
  const source = input && typeof input === 'object' && !Array.isArray(input)
    ? input
    : {};

  return {
    min: toOptionalNumber(source.min),
    min_percent: toOptionalNumber(source.min_percent),
    target: toOptionalNumber(source.target),
    target_percent: toOptionalNumber(source.target_percent),
    stretch: toOptionalNumber(source.stretch),
    stretch_percent: toOptionalNumber(source.stretch_percent),
  };
}

function buildPlaybookId() {
  return `playbook-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function createBlankPlaybookEntry() {
  const now = new Date().toISOString();

  return {
    id: buildPlaybookId(),
    name: '',
    description: '',
    timeframe: [],
    // Which trade direction this setup applies to. 'both' (the default)
    // means it shows up in Add Trade regardless of the trade's direction.
    direction: 'both',
    has_sl_exit_plan: true,
    entry_criteria: [],
    exit_criteria: [],
    stop_loss_management: [],
    stop_loss_move: [],
    invalidations: [],
    steps: [],
    examples: [],
    images: [],
    indicators: [],
    alert_keywords: [],
    setup_conditions: { structure: '', ema_context: '', volume: '', market_context: '', time: '', entry_type: '' },
    grade_criteria: { a_plus: '', a: '', b: '', c: '' },
    trigger_spec: { entry_trigger: '', trigger_level: '', trigger_event: '', order: '', expiry_bars: null, abort_if: '', loss_r: null, win_rate: null },
    expected_r_profile: { min: null, min_percent: null, target: null, target_percent: null, stretch: null, stretch_percent: null },
    risk_percent: DEFAULT_RISK_PERCENT,
    is_active: true,
    created_at: now,
    updated_at: now,
    last_reviewed_at: '',
  };
}

/**
 * How much of the account's base risk a setup is worth, as a percentage.
 * 100 is full risk; a setup you trust more can be 150, one you are still
 * proving can be 50. Any number is allowed — it is a dial, not four presets.
 */
export const DEFAULT_RISK_PERCENT = 100;

/** The four presets this replaced, so old setups keep the size they had. */
const LEGACY_RISK_LEVEL_PERCENT = { half: 50, normal: 100, oneandahalf: 150, double: 200 };

export function normalizeRiskPercent(rawPercent, legacyRiskLevel) {
  const percent = Number(rawPercent);
  // Zero risk would mean a setup that can never be sized, so it is not a
  // meaningful setting; anything above it is.
  if (Number.isFinite(percent) && percent > 0) return Math.round(percent * 100) / 100;

  const legacy = LEGACY_RISK_LEVEL_PERCENT[legacyRiskLevel];
  return legacy != null ? legacy : DEFAULT_RISK_PERCENT;
}

/** The multiplier to apply to base risk for this setup. */
export function getRiskMultiplier(playbookEntry) {
  return normalizeRiskPercent(playbookEntry?.risk_percent, playbookEntry?.risk_level) / 100;
}

export function normalizePlaybookEntry(entry) {
  const base = createBlankPlaybookEntry();
  const source = entry && typeof entry === 'object' && !Array.isArray(entry)
    ? entry
    : {};

  const normalizedName = toTrimmedString(source.name);

  return {
    id: toTrimmedString(source.id) || base.id,
    name: normalizedName,
    description: toTrimmedString(source.description),
    timeframe: normalizeTimeframes(source.timeframe),
    direction: ['long', 'short', 'both'].includes(source.direction) ? source.direction : 'both',
    has_sl_exit_plan: source.has_sl_exit_plan !== false,
    entry_criteria: normalizeGradedItems(source.entry_criteria || source.entryCriteria),
    exit_criteria: normalizeGradedItems(source.exit_criteria || source.exitCriteria),
    stop_loss_management: normalizeGradedItems(source.stop_loss_management || source.stopLossManagement),
    stop_loss_move: normalizeLineItems(source.stop_loss_move),
    invalidations: normalizeLineItems(source.invalidations),
    steps: Array.isArray(source.steps)
      ? source.steps
          .map((s) => ({
            label: String(s?.label ?? s ?? '').trim(),
            grade: typeof s?.grade === 'string' ? s.grade : '',
          }))
          .filter((s) => s.label)
      : [],
    examples: normalizeExamples(source.examples),
    images: Array.isArray(source.images) ? source.images.filter((s) => typeof s === 'string' && s.length > 0) : [],
    // Charts are kept in Informative Images rather than inside Settings, where
    // every setup shares one 1 MiB document. Each chart has its own gallery
    // entry, so each gets a whole document's worth of quality.
    images_gallery_ids: normalizeGalleryIds(source.images_gallery_ids),
    // The earlier layout: every chart of a setup in one shared gallery entry.
    images_gallery_id: toTrimmedString(source.images_gallery_id),
    // Indicator source files (.cs) the setup is traded with. The files are on
    // disk; the setup keeps a small record of each.
    indicators: normalizeIndicators(source.indicators),
    // How Trade Terminal's alerts name this setup ("VWAP REJ"), so Guardian
    // can file its triggers here.
    alert_keywords: Array.isArray(source.alert_keywords)
      ? [...new Set(source.alert_keywords.map((k) => String(k || '').trim().toUpperCase().replace(/\s+/g, ' ')).filter(Boolean))]
      : [],
    setup_conditions: normalizeSetupConditions(source.setup_conditions),
    grade_criteria: normalizeGradeCriteria(source.grade_criteria),
    trigger_spec: normalizeTriggerSpec(source.trigger_spec),
    // Setup Journal template. Empty means the setup has not customised it and
    // falls back to the starter prompts.
    journal_template: normalizeTemplate(source.journal_template),
    expected_r_profile: normalizeExpectedRProfile(source.expected_r_profile || source.expectedRProfile),
    risk_percent: normalizeRiskPercent(source.risk_percent, source.risk_level),
    is_active: source.is_active !== false,
    created_at: toTrimmedString(source.created_at) || base.created_at,
    updated_at: toTrimmedString(source.updated_at) || base.updated_at,
    last_reviewed_at: toTrimmedString(source.last_reviewed_at),
  };
}

export function normalizePlaybookEntries(entries) {
  if (!Array.isArray(entries)) return [];

  const seenIds = new Set();
  const seenNames = new Set();
  const normalized = [];

  for (const entry of entries) {
    const normalizedEntry = normalizePlaybookEntry(entry);

    if (!normalizedEntry.name) continue;

    const nameKey = normalizedEntry.name.toLowerCase();
    if (seenNames.has(nameKey)) continue;

    let id = normalizedEntry.id;
    while (seenIds.has(id)) {
      id = buildPlaybookId();
    }

    seenIds.add(id);
    seenNames.add(nameKey);
    normalized.push({
      ...normalizedEntry,
      id,
    });
  }

  return normalized.sort((left, right) => {
    if (left.is_active !== right.is_active) {
      return left.is_active ? -1 : 1;
    }

    return Date.parse(right.updated_at || 0) - Date.parse(left.updated_at || 0);
  });
}

export function getPlaybookEntryBySetupName(entries, setupName) {
  const normalizedSetupName = toTrimmedString(setupName).toLowerCase();
  if (!normalizedSetupName) return null;

  return normalizePlaybookEntries(entries).find(
    (entry) => entry.name.toLowerCase() === normalizedSetupName
  ) || null;
}

export function mergeSetupTypesWithPlaybook(currentSetupTypes, playbookEntries) {
  const normalizedEntries = normalizePlaybookEntries(playbookEntries);
  const activePlaybookNames = normalizedEntries
    .filter((entry) => entry.is_active)
    .map((entry) => entry.name);

  const existingSetupTypes = sanitizeSetupTypes(currentSetupTypes);
  const playbookNameKeys = new Set(normalizedEntries.map((entry) => entry.name.toLowerCase()));

  const preservedNonPlaybookSetupTypes = existingSetupTypes.filter(
    (setup) => !playbookNameKeys.has(String(setup || '').trim().toLowerCase())
  );

  return sanitizeSetupTypes([
    ...activePlaybookNames,
    ...preservedNonPlaybookSetupTypes,
  ]);
}

export function toCriteriaTextareaValue(items) {
  return normalizeLineItems(items).join('\n');
}

export function toTagsInputValue(tags) {
  return normalizeTags(tags).join(', ');
}

/**
 * Journal templates were added after the first strategy backups were written,
 * so a file exported before then carries none. Importing it must not wipe the
 * prompts a setup already has — an absent template means "unchanged", not
 * "cleared". A template that is present in the file wins outright.
 */
export function withPreservedJournalTemplate(rawEntry, existingEntry) {
  const incoming = normalizeTemplate(rawEntry?.journal_template);
  if (incoming.fields.length > 0 || incoming.questions.length > 0) return rawEntry;

  const existing = normalizeTemplate(existingEntry?.journal_template);
  if (existing.fields.length === 0 && existing.questions.length === 0) return rawEntry;

  return { ...rawEntry, journal_template: existing };
}

/**
 * How well a setup is being executed, as opposed to how well it pays. Add
 * Trade already scores every trade out of 10 from its entry, exit, stop-loss,
 * size and emotion grades — averaging that per setup answers a different
 * question from expectancy: whether a disappointing setup is actually a
 * badly-traded one.
 */
export function calcExecutionScoreBySetup(trades = []) {
  const groups = new Map();

  for (const trade of Array.isArray(trades) ? trades : []) {
    const setup = toTrimmedString(trade?.setup_type);
    const rating = Number(trade?.overall_rating);
    if (!setup || !Number.isFinite(rating)) continue;

    const key = setup.toLowerCase();
    const group = groups.get(key) || { total: 0, count: 0, ungraded: 0 };
    group.total += rating;
    group.count += 1;
    groups.set(key, group);
  }

  return new Map([...groups.entries()].map(([key, group]) => {
    const score = Math.round((group.total / group.count) * 10) / 10;
    return [key, { score, grade: ratingToGrade(score), count: group.count }];
  }));
}

function normalizeGalleryIds(ids) {
  if (!Array.isArray(ids)) return [];
  const seen = new Set();
  return ids
    .map((id) => toTrimmedString(id))
    .filter((id) => id && !seen.has(id) && seen.add(id));
}

/**
 * A setup's chart images, wherever they are kept: one gallery entry per
 * chart, the single shared entry setups used before that, or — for setups
 * saved before charts left Settings — the images still held inline.
 */
export function resolvePlaybookImages(entry, imagesByGalleryId = new Map()) {
  const ids = normalizeGalleryIds(entry?.images_gallery_ids);
  if (ids.length > 0) {
    const images = ids.flatMap((id) => {
      const stored = imagesByGalleryId.get(id);
      return Array.isArray(stored) ? stored : [];
    });
    if (images.length > 0) return images;
  }

  const legacyId = toTrimmedString(entry?.images_gallery_id);
  if (legacyId && imagesByGalleryId.has(legacyId)) {
    const images = imagesByGalleryId.get(legacyId);
    if (Array.isArray(images) && images.length > 0) return images;
  }

  return Array.isArray(entry?.images) ? entry.images.filter((i) => typeof i === 'string' && i) : [];
}

/**
 * How to bring a setup's gallery entries in line with the charts it should
 * now show. A chart already stored is matched by content and kept, so an
 * unchanged chart is never rewritten; new charts are created; entries whose
 * chart was removed are deleted. `order` gives the final ids in chart order,
 * with `null` for each chart still to be created.
 */
export function planGalleryImageSync(images = [], storedCharts = []) {
  const wanted = (Array.isArray(images) ? images : []).filter((i) => typeof i === 'string' && i);
  const available = (Array.isArray(storedCharts) ? storedCharts : [])
    .filter((chart) => chart?.id && typeof chart.image === 'string');

  const used = new Set();
  const order = [];
  const create = [];

  for (const image of wanted) {
    const match = available.find((chart) => chart.image === image && !used.has(chart.id));
    if (match) {
      used.add(match.id);
      order.push(match.id);
    } else {
      order.push(null);
      create.push(image);
    }
  }

  const remove = available.filter((chart) => !used.has(chart.id)).map((chart) => chart.id);
  return { order, create, remove };
}
