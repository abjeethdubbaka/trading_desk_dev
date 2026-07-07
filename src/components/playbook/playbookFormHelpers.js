import {
  createBlankPlaybookEntry,
  normalizePlaybookEntry,
  toCriteriaTextareaValue,
  toTagsInputValue,
} from '@/lib/playbook/utils';

export function formatDate(value) {
  const timestamp = Date.parse(String(value || ''));
  if (!Number.isFinite(timestamp)) return 'n/a';
  return new Date(timestamp).toLocaleString();
}

export function toExpectedRLabel(profile = {}) {
  const levels = [
    { r: profile?.min,     pct: profile?.min_percent     },
    { r: profile?.target,  pct: profile?.target_percent  },
    { r: profile?.stretch, pct: profile?.stretch_percent },
  ].filter(({ r }) => Number.isFinite(Number(r)) && Number(r) > 0);

  if (levels.length === 0) return 'n/a';

  return levels
    .map(({ r, pct }) => `${Number(r).toFixed(1)}R${Number.isFinite(Number(pct)) && Number(pct) > 0 ? ` (${Number(pct)}%)` : ''}`)
    .join(' → ');
}

export function toFormState(entry) {
  const normalized = normalizePlaybookEntry(entry);

  return {
    id: normalized.id,
    name: normalized.name,
    description: normalized.description,
    timeframe: normalized.timeframe,
    market_context: normalized.market_context,
    stock_filter_criteria_text: toCriteriaTextareaValue(normalized.stock_filter_criteria),
    entry_criteria_text: toCriteriaTextareaValue(normalized.entry_criteria),
    exit_criteria_text: toCriteriaTextareaValue(normalized.exit_criteria),
    stop_loss_management_text: toCriteriaTextareaValue(normalized.stop_loss_management),
    invalidations_text: toCriteriaTextareaValue(normalized.invalidations),
    tags_text: toTagsInputValue(normalized.tags),
    expected_r_min: normalized.expected_r_profile?.min ?? '',
    expected_r_min_percent: normalized.expected_r_profile?.min_percent ?? '',
    expected_r_target: normalized.expected_r_profile?.target ?? '',
    expected_r_target_percent: normalized.expected_r_profile?.target_percent ?? '',
    expected_r_stretch: normalized.expected_r_profile?.stretch ?? '',
    expected_r_stretch_percent: normalized.expected_r_profile?.stretch_percent ?? '',
    examples: Array.isArray(normalized.examples) && normalized.examples.length > 0
      ? normalized.examples.map((example) => ({
          title: String(example.title || ''),
          url: String(example.url || ''),
          note: String(example.note || ''),
        }))
      : [{ title: '', url: '', note: '' }],
    images: Array.isArray(normalized.images) ? normalized.images : [],
    risk_level: normalized.risk_level || 'normal',
    is_active: normalized.is_active !== false,
  };
}

function toNumberOrNull(value) {
  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? numericValue : null;
}

function normalizeTextareaLines(text) {
  return String(text || '')
    .split('\n')
    .map((item) => item.trim())
    .filter(Boolean);
}

function normalizeTagsText(text) {
  return String(text || '')
    .split(',')
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);
}

export function toEntryPayload(formState, sourceEntry = null) {
  const now = new Date().toISOString();
  const baseEntry = sourceEntry ? normalizePlaybookEntry(sourceEntry) : createBlankPlaybookEntry();

  return normalizePlaybookEntry({
    ...baseEntry,
    id: baseEntry.id,
    name: String(formState.name || '').trim(),
    description: String(formState.description || '').trim(),
    timeframe: String(formState.timeframe || '').trim(),
    market_context: String(formState.market_context || '').trim(),
    stock_filter_criteria: normalizeTextareaLines(formState.stock_filter_criteria_text),
    entry_criteria: normalizeTextareaLines(formState.entry_criteria_text),
    exit_criteria: normalizeTextareaLines(formState.exit_criteria_text),
    stop_loss_management: normalizeTextareaLines(formState.stop_loss_management_text),
    invalidations: normalizeTextareaLines(formState.invalidations_text),
    tags: normalizeTagsText(formState.tags_text),
    expected_r_profile: {
      min: toNumberOrNull(formState.expected_r_min),
      min_percent: toNumberOrNull(formState.expected_r_min_percent),
      target: toNumberOrNull(formState.expected_r_target),
      target_percent: toNumberOrNull(formState.expected_r_target_percent),
      stretch: toNumberOrNull(formState.expected_r_stretch),
      stretch_percent: toNumberOrNull(formState.expected_r_stretch_percent),
    },
    examples: (Array.isArray(formState.examples) ? formState.examples : [])
      .map((example) => ({
        title: String(example?.title || '').trim(),
        url: String(example?.url || '').trim(),
        note: String(example?.note || '').trim(),
      })),
    images: Array.isArray(formState.images) ? formState.images : [],
    risk_level: formState.risk_level || 'normal',
    is_active: formState.is_active !== false,
    updated_at: now,
    created_at: baseEntry.created_at || now,
  });
}

export function validateFormState(formState) {
  if (!String(formState.name || '').trim()) {
    return 'Setup name is required';
  }

  if (normalizeTextareaLines(formState.entry_criteria_text).length === 0) {
    return 'At least one entry criterion is required';
  }

  if (normalizeTextareaLines(formState.exit_criteria_text).length === 0) {
    return 'At least one exit criterion is required';
  }

  if (normalizeTextareaLines(formState.invalidations_text).length === 0) {
    return 'At least one invalidation is required';
  }

  const targetValue = toNumberOrNull(formState.expected_r_target);
  if (targetValue === null || targetValue <= 0) {
    return 'Expected R target must be a positive number';
  }

  return null;
}
