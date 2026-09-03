import {
  createBlankPlaybookEntry,
  normalizePlaybookEntry,
  toCriteriaTextareaValue,
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
    timeframe: Array.isArray(normalized.timeframe) ? [...normalized.timeframe] : [],
    has_sl_exit_plan: normalized.has_sl_exit_plan !== false,
    entry_criteria_items: Array.isArray(normalized.entry_criteria) ? [...normalized.entry_criteria] : [],
    exit_criteria_items: Array.isArray(normalized.exit_criteria) ? [...normalized.exit_criteria] : [],
    stop_loss_management_items: Array.isArray(normalized.stop_loss_management) ? [...normalized.stop_loss_management] : [],
    stop_loss_move_items: Array.isArray(normalized.stop_loss_move) ? [...normalized.stop_loss_move] : [],
    invalidations_text: toCriteriaTextareaValue(normalized.invalidations),
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
    condition_structure: normalized.setup_conditions?.structure ?? '',
    condition_ema_context: normalized.setup_conditions?.ema_context ?? '',
    condition_volume: normalized.setup_conditions?.volume ?? '',
    condition_market_context: normalized.setup_conditions?.market_context ?? '',
    condition_time: normalized.setup_conditions?.time ?? '',
    condition_entry_type: normalized.setup_conditions?.entry_type ?? '',
    grade_a_plus: normalized.grade_criteria?.a_plus ?? '',
    grade_a: normalized.grade_criteria?.a ?? '',
    grade_b: normalized.grade_criteria?.b ?? '',
    grade_c: normalized.grade_criteria?.c ?? '',
    entry_trigger: normalized.trigger_spec?.entry_trigger ?? '',
    trigger_level: normalized.trigger_spec?.trigger_level ?? '',
    trigger_event: normalized.trigger_spec?.trigger_event ?? '',
    order: normalized.trigger_spec?.order ?? '',
    expiry_bars: normalized.trigger_spec?.expiry_bars ?? '',
    abort_if: normalized.trigger_spec?.abort_if ?? '',
    loss_r: normalized.trigger_spec?.loss_r ?? '',
    win_rate: normalized.trigger_spec?.win_rate ?? '',
    risk_level: normalized.risk_level || 'normal',
    priority: normalized.priority || 2,
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
    timeframe: Array.isArray(formState.timeframe) ? formState.timeframe : [],
    has_sl_exit_plan: formState.has_sl_exit_plan !== false,
    entry_criteria: Array.isArray(formState.entry_criteria_items) ? formState.entry_criteria_items : [],
    exit_criteria: Array.isArray(formState.exit_criteria_items) ? formState.exit_criteria_items : [],
    stop_loss_management: Array.isArray(formState.stop_loss_management_items) ? formState.stop_loss_management_items : [],
    stop_loss_move: Array.isArray(formState.stop_loss_move_items) ? formState.stop_loss_move_items : [],
    invalidations: normalizeTextareaLines(formState.invalidations_text),
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
    setup_conditions: {
      structure: String(formState.condition_structure || '').trim(),
      ema_context: String(formState.condition_ema_context || '').trim(),
      volume: String(formState.condition_volume || '').trim(),
      market_context: String(formState.condition_market_context || '').trim(),
      time: String(formState.condition_time || '').trim(),
      entry_type: String(formState.condition_entry_type || '').trim(),
    },
    grade_criteria: {
      a_plus: String(formState.grade_a_plus || '').trim(),
      a: String(formState.grade_a || '').trim(),
      b: String(formState.grade_b || '').trim(),
      c: String(formState.grade_c || '').trim(),
    },
    trigger_spec: {
      entry_trigger: String(formState.entry_trigger || '').trim(),
      trigger_level: String(formState.trigger_level || '').trim(),
      trigger_event: String(formState.trigger_event || '').trim(),
      order: String(formState.order || '').trim(),
      expiry_bars: toNumberOrNull(formState.expiry_bars),
      abort_if: String(formState.abort_if || '').trim(),
      loss_r: toNumberOrNull(formState.loss_r),
      win_rate: toNumberOrNull(formState.win_rate),
    },
    risk_level: formState.risk_level || 'normal',
    priority: formState.priority || 2,
    is_active: formState.is_active !== false,
    updated_at: now,
    created_at: baseEntry.created_at || now,
  });
}

export function validateFormState(formState) {
  if (!String(formState.name || '').trim()) {
    return 'Setup name is required';
  }

  if (formState.has_sl_exit_plan !== false) {
    if (!Array.isArray(formState.entry_criteria_items) || formState.entry_criteria_items.length === 0) {
      return 'At least one entry criterion is required';
    }
    if (!Array.isArray(formState.exit_criteria_items) || formState.exit_criteria_items.length === 0) {
      return 'At least one exit criterion is required';
    }
    if (normalizeTextareaLines(formState.invalidations_text).length === 0) {
      return 'At least one invalidation is required';
    }
    const targetValue = toNumberOrNull(formState.expected_r_target);
    if (targetValue === null || targetValue <= 0) {
      return 'Expected R target must be a positive number';
    }
  }

  return null;
}
