import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createBlankRuleCategory,
  normalizeRuleCategory,
  normalizeRuleCategories,
  getColorSwatch,
  pickNextRuleColor,
  getDailyReadCategories,
  RULE_COLOR_SWATCHES,
} from '../src/lib/rules/utils.js';

test('createBlankRuleCategory has a valid default color, empty pointers, empty description, and daily_read on', () => {
  const blank = createBlankRuleCategory();
  assert.equal(blank.name, '');
  assert.equal(blank.description, '');
  assert.equal(blank.daily_read, true);
  assert.deepEqual(blank.pointers, []);
  assert.ok(RULE_COLOR_SWATCHES.some((s) => s.key === blank.color));
});

test('normalizeRuleCategory defaults daily_read to true and only turns off on an explicit false', () => {
  assert.equal(normalizeRuleCategory({ name: 'Risk' }).daily_read, true);
  assert.equal(normalizeRuleCategory({ name: 'Risk', daily_read: false }).daily_read, false);
  assert.equal(normalizeRuleCategory({ name: 'Risk', daily_read: 'nonsense' }).daily_read, true);
});

test('normalizeRuleCategory falls back to the default color for an invalid value', () => {
  const category = normalizeRuleCategory({ name: 'Risk', color: 'not-a-real-color' });
  assert.equal(category.color, RULE_COLOR_SWATCHES[0].key);
});

test('normalizeRuleCategory trims the description and defaults it to an empty string', () => {
  assert.equal(normalizeRuleCategory({ name: 'Risk', description: '  Stay disciplined.  ' }).description, 'Stay disciplined.');
  assert.equal(normalizeRuleCategory({ name: 'Risk' }).description, '');
});

test('normalizeRuleCategory keeps a valid color and normalizes pointers (string and object forms)', () => {
  const category = normalizeRuleCategory({
    name: 'Risk Management',
    color: 'rose',
    pointers: ['Never risk more than 1%', { id: 'p1', text: 'Always use a stop' }, '   '],
  });

  assert.equal(category.color, 'rose');
  assert.equal(category.pointers.length, 2);
  assert.equal(category.pointers[0].text, 'Never risk more than 1%');
  assert.equal(category.pointers[1].text, 'Always use a stop');
  assert.equal(category.pointers[1].id, 'p1');
});

test('normalizeRuleCategory de-duplicates pointers by id', () => {
  const category = normalizeRuleCategory({
    name: 'Risk',
    pointers: [{ id: 'p1', text: 'First' }, { id: 'p1', text: 'Duplicate id' }],
  });

  assert.equal(category.pointers.length, 1);
  assert.equal(category.pointers[0].text, 'First');
});

test('normalizeRuleCategories drops unnamed categories and sorts by creation time', () => {
  const categories = normalizeRuleCategories([
    { name: '', pointers: [] },
    { name: 'Second', created_at: '2026-01-02T00:00:00.000Z' },
    { name: 'First', created_at: '2026-01-01T00:00:00.000Z' },
  ]);

  assert.equal(categories.length, 2);
  assert.deepEqual(categories.map((c) => c.name), ['First', 'Second']);
});

test('normalizeRuleCategories re-keys colliding ids instead of dropping a category', () => {
  const categories = normalizeRuleCategories([
    { id: 'dup', name: 'A' },
    { id: 'dup', name: 'B' },
  ]);

  assert.equal(categories.length, 2);
  assert.notEqual(categories[0].id, categories[1].id);
});

test('getColorSwatch falls back to the first swatch for an unknown key', () => {
  assert.equal(getColorSwatch('nonexistent').key, RULE_COLOR_SWATCHES[0].key);
  assert.equal(getColorSwatch('amber').key, 'amber');
});

test('pickNextRuleColor prefers a swatch no existing category is using', () => {
  const existing = [{ color: RULE_COLOR_SWATCHES[0].key }, { color: RULE_COLOR_SWATCHES[1].key }];
  const next = pickNextRuleColor(existing);
  assert.equal(next, RULE_COLOR_SWATCHES[2].key);
});

test('pickNextRuleColor cycles round-robin once every swatch is used', () => {
  const existing = RULE_COLOR_SWATCHES.map((swatch) => ({ color: swatch.key }));
  const next = pickNextRuleColor(existing);
  assert.equal(next, RULE_COLOR_SWATCHES[existing.length % RULE_COLOR_SWATCHES.length].key);
});

test('pickNextRuleColor returns the first swatch when there are no categories yet', () => {
  assert.equal(pickNextRuleColor([]), RULE_COLOR_SWATCHES[0].key);
});

test('getDailyReadCategories keeps categories in order with their rules intact', () => {
  const categories = normalizeRuleCategories([
    { name: 'Risk', color: 'rose', pointers: ['Rule A', 'Rule B'], created_at: '2026-01-01T00:00:00.000Z' },
    { name: 'Entries', color: 'cyan', pointers: ['Rule C'], created_at: '2026-01-02T00:00:00.000Z' },
  ]);

  const forRead = getDailyReadCategories(categories);
  assert.deepEqual(forRead.map((c) => c.name), ['Risk', 'Entries']);
  assert.deepEqual(forRead[0].pointers.map((p) => p.text), ['Rule A', 'Rule B']);
  assert.equal(forRead[0].color, 'rose');
});

test('getDailyReadCategories excludes categories with no rules to read', () => {
  const categories = normalizeRuleCategories([
    { name: 'Empty', color: 'blue' },
    { name: 'Has rules', pointers: ['Rule A'] },
  ]);

  const forRead = getDailyReadCategories(categories);
  assert.equal(forRead.length, 1);
  assert.equal(forRead[0].name, 'Has rules');
});

test('getDailyReadCategories skips categories with daily_read turned off', () => {
  const categories = normalizeRuleCategories([
    { name: 'Included', pointers: ['Rule A'], daily_read: true, created_at: '2026-01-01T00:00:00.000Z' },
    { name: 'Excluded', pointers: ['Rule B'], daily_read: false, created_at: '2026-01-02T00:00:00.000Z' },
  ]);

  const forRead = getDailyReadCategories(categories);
  assert.equal(forRead.length, 1);
  assert.equal(forRead[0].name, 'Included');
});
