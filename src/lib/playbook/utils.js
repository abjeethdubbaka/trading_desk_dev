import { sanitizeSetupTypes } from '../../components/journal/AddTradeModal/constants/tradeConstants.js';

export const PLAYBOOK_FIELD = 'strategy_playbook';

const DEFAULT_EXPECTED_R_PROFILE = Object.freeze({
  min: null,
  target: null,
  stretch: null,
});

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

function normalizeExpectedRProfile(input) {
  const source = input && typeof input === 'object' && !Array.isArray(input)
    ? input
    : {};

  return {
    min: toOptionalNumber(source.min),
    target: toOptionalNumber(source.target),
    stretch: toOptionalNumber(source.stretch),
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
    timeframe: '',
    market_context: '',
    stock_filter_criteria: [],
    entry_criteria: [],
    exit_criteria: [],
    invalidations: [],
    examples: [],
    expected_r_profile: { ...DEFAULT_EXPECTED_R_PROFILE },
    tags: [],
    is_active: true,
    created_at: now,
    updated_at: now,
    last_reviewed_at: '',
  };
}

export function normalizePlaybookEntry(entry) {
  const base = createBlankPlaybookEntry();
  const source = entry && typeof entry === 'object' && !Array.isArray(entry)
    ? entry
    : {};

  const normalizedName = toTrimmedString(source.name);

  return {
    ...base,
    ...source,
    id: toTrimmedString(source.id) || base.id,
    name: normalizedName,
    description: toTrimmedString(source.description),
    timeframe: toTrimmedString(source.timeframe),
    market_context: toTrimmedString(source.market_context || source.marketCondition),
    stock_filter_criteria: normalizeLineItems(
      source.stock_filter_criteria ||
      source.stockFilterCriteria ||
      source.filter_criteria ||
      source.filterCriteria
    ),
    entry_criteria: normalizeLineItems(source.entry_criteria || source.entryCriteria),
    exit_criteria: normalizeLineItems(source.exit_criteria || source.exitCriteria),
    invalidations: normalizeLineItems(source.invalidations),
    examples: normalizeExamples(source.examples),
    expected_r_profile: normalizeExpectedRProfile(source.expected_r_profile || source.expectedRProfile),
    tags: normalizeTags(source.tags),
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

export function createPlaybookEntryFromSetupName(setupName) {
  const nextEntry = createBlankPlaybookEntry();
  const normalizedSetupName = toTrimmedString(setupName);
  const now = new Date().toISOString();

  return normalizePlaybookEntry({
    ...nextEntry,
    name: normalizedSetupName,
    description: `Execution playbook for ${normalizedSetupName}`,
    stock_filter_criteria: [
      'Relative volume >= 2x',
      'Dollar volume >= $10M',
      'Clean premarket catalyst or fresh news',
    ],
    entry_criteria: [`Define ${normalizedSetupName} entry trigger`],
    exit_criteria: ['Define primary exit signal'],
    invalidations: ['Define invalidation level before entry'],
    expected_r_profile: {
      min: 1,
      target: 2,
      stretch: 3,
    },
    tags: ['playbook'],
    created_at: now,
    updated_at: now,
  });
}

export function toCriteriaTextareaValue(items) {
  return normalizeLineItems(items).join('\n');
}

export function toTagsInputValue(tags) {
  return normalizeTags(tags).join(', ');
}
