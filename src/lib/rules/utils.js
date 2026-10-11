/**
 * Rules — categories of trading rules, each holding a list of short
 * "pointers" (bullet-point reminders) and tagged with a color for quick
 * visual grouping. Persisted in Settings, same pattern as the Playbook.
 */

export const RULES_FIELD = 'rule_categories';

// A fixed swatch palette (rather than a free-form color input) keeps every
// category's color legible against the app's dark theme and avoids storing
// arbitrary hex values that might not have readable contrast.
export const RULE_COLOR_SWATCHES = [
  { key: 'emerald', label: 'Emerald', className: 'border-emerald-400/40 bg-emerald-500/15 text-emerald-200', dot: 'bg-emerald-400' },
  { key: 'cyan', label: 'Cyan', className: 'border-cyan-400/40 bg-cyan-500/15 text-cyan-200', dot: 'bg-cyan-400' },
  { key: 'teal', label: 'Teal', className: 'border-teal-400/40 bg-teal-500/15 text-teal-200', dot: 'bg-teal-400' },
  { key: 'indigo', label: 'Indigo', className: 'border-indigo-400/40 bg-indigo-500/15 text-indigo-200', dot: 'bg-indigo-400' },
  { key: 'violet', label: 'Violet', className: 'border-violet-400/40 bg-violet-500/15 text-violet-200', dot: 'bg-violet-400' },
  { key: 'amber', label: 'Amber', className: 'border-amber-400/40 bg-amber-500/15 text-amber-200', dot: 'bg-amber-400' },
  { key: 'rose', label: 'Rose', className: 'border-rose-400/40 bg-rose-500/15 text-rose-200', dot: 'bg-rose-400' },
  { key: 'blue', label: 'Blue', className: 'border-blue-400/40 bg-blue-500/15 text-blue-200', dot: 'bg-blue-400' },
  { key: 'slate', label: 'Slate', className: 'border-slate-400/40 bg-slate-500/15 text-slate-200', dot: 'bg-slate-400' },
];

const DEFAULT_COLOR_KEY = RULE_COLOR_SWATCHES[0].key;
const VALID_COLOR_KEYS = new Set(RULE_COLOR_SWATCHES.map((swatch) => swatch.key));

export function getColorSwatch(colorKey) {
  return RULE_COLOR_SWATCHES.find((swatch) => swatch.key === colorKey) || RULE_COLOR_SWATCHES[0];
}

// Auto-picks a color for a new category so the trader doesn't have to choose
// one every time. Prefers a swatch no existing category is using yet; once
// every swatch is taken it cycles back round-robin by creation order.
export function pickNextRuleColor(existingCategories = []) {
  const usedKeys = new Set(existingCategories.map((c) => c?.color).filter(Boolean));
  const unused = RULE_COLOR_SWATCHES.find((swatch) => !usedKeys.has(swatch.key));
  if (unused) return unused.key;
  return RULE_COLOR_SWATCHES[existingCategories.length % RULE_COLOR_SWATCHES.length].key;
}

function toTrimmedString(value) {
  return String(value ?? '').trim();
}

function buildId(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function normalizePointer(pointer) {
  if (pointer && typeof pointer === 'object' && !Array.isArray(pointer)) {
    const text = toTrimmedString(pointer.text);
    if (!text) return null;
    return { id: toTrimmedString(pointer.id) || buildId('pointer'), text };
  }
  const text = toTrimmedString(pointer);
  return text ? { id: buildId('pointer'), text } : null;
}

function normalizePointers(pointers) {
  if (!Array.isArray(pointers)) return [];
  const seen = new Set();
  const result = [];
  for (const raw of pointers) {
    const normalized = normalizePointer(raw);
    if (!normalized || seen.has(normalized.id)) continue;
    seen.add(normalized.id);
    result.push(normalized);
  }
  return result;
}

export function createBlankRuleCategory() {
  const now = new Date().toISOString();
  return {
    id: buildId('rulecat'),
    name: '',
    description: '',
    color: DEFAULT_COLOR_KEY,
    // Whether this category's rules are included in the on-launch read-
    // through. Defaults on so a new category shows up there until opted out.
    daily_read: true,
    pointers: [],
    created_at: now,
    updated_at: now,
  };
}

export function normalizeRuleCategory(category) {
  const base = createBlankRuleCategory();
  const source = category && typeof category === 'object' && !Array.isArray(category) ? category : {};

  return {
    id: toTrimmedString(source.id) || base.id,
    name: toTrimmedString(source.name),
    description: toTrimmedString(source.description),
    color: VALID_COLOR_KEYS.has(source.color) ? source.color : DEFAULT_COLOR_KEY,
    daily_read: source.daily_read !== false,
    pointers: normalizePointers(source.pointers),
    created_at: toTrimmedString(source.created_at) || base.created_at,
    updated_at: toTrimmedString(source.updated_at) || base.updated_at,
  };
}

// Categories included in the on-launch read-through — those with daily_read
// enabled that actually have rules to show. The launch modal steps through
// these one category at a time, showing all of that category's rules together.
export function getDailyReadCategories(categories = []) {
  return categories.filter(
    (category) => category.daily_read !== false && (category.pointers || []).length > 0
  );
}

export function normalizeRuleCategories(categories) {
  if (!Array.isArray(categories)) return [];

  const seenIds = new Set();
  const result = [];
  for (const category of categories) {
    const normalized = normalizeRuleCategory(category);
    if (!normalized.name) continue;
    let id = normalized.id;
    while (seenIds.has(id)) id = buildId('rulecat');
    seenIds.add(id);
    result.push({ ...normalized, id });
  }

  return result.sort((a, b) => Date.parse(a.created_at || 0) - Date.parse(b.created_at || 0));
}
