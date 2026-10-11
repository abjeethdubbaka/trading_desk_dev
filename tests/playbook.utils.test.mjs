import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calcExecutionScoreBySetup,
  getPlaybookEntryBySetupName,
  mergeSetupTypesWithPlaybook,
  normalizePlaybookEntries,
  normalizePlaybookEntry,
  normalizeRiskPercent,
  resolvePlaybookImages,
  planGalleryImageSync,
  getRiskMultiplier,
  withPreservedJournalTemplate,
} from '../src/lib/playbook/utils.js';

test('normalizePlaybookEntries de-duplicates names and sorts active first', () => {
  const normalized = normalizePlaybookEntries([
    {
      id: 'vwap-1',
      name: 'VWAP Pullback',
      is_active: true,
      updated_at: '2026-04-01T10:00:00.000Z',
    },
    {
      id: 'vwap-2',
      name: ' vwap pullback ',
      is_active: true,
      updated_at: '2026-04-05T10:00:00.000Z',
    },
    {
      id: 'momentum-1',
      name: 'Momentum',
      is_active: true,
      updated_at: '2026-04-08T12:00:00.000Z',
    },
    {
      id: 'breakout-1',
      name: 'Breakout',
      is_active: false,
      updated_at: '2026-04-12T09:00:00.000Z',
    },
    {
      id: 'blank',
      name: '   ',
      is_active: true,
    },
  ]);

  assert.equal(normalized.length, 3);
  assert.deepEqual(
    normalized.map((entry) => entry.name),
    ['Momentum', 'VWAP Pullback', 'Breakout']
  );
});

test('mergeSetupTypesWithPlaybook keeps active playbook names and preserves non-playbook setup types', () => {
  const merged = mergeSetupTypesWithPlaybook(
    ['Breakout', 'Reversal', 'Manual', 'VWAP Pullback', ''],
    [
      { id: 'pb-1', name: 'Breakout', is_active: false },
      { id: 'pb-2', name: 'ORB', is_active: true },
      { id: 'pb-3', name: 'VWAP Pullback', is_active: true },
    ]
  );

  assert.deepEqual(merged, ['ORB', 'VWAP Pullback', 'Reversal']);
});

test('getPlaybookEntryBySetupName matches setup names case-insensitively', () => {
  const entries = normalizePlaybookEntries([
    { id: 'pb-1', name: 'ORB', is_active: true },
    { id: 'pb-2', name: 'Pullback', is_active: true },
  ]);

  const matched = getPlaybookEntryBySetupName(entries, ' orb ');

  assert.ok(matched);
  assert.equal(matched.name, 'ORB');
});

test('normalizePlaybookEntry tags entry/exit/stop-loss criteria with a grade', () => {
  const normalized = normalizePlaybookEntry({
    name: 'ORB',
    entry_criteria: [
      { text: 'Price breaks and holds above key level', grade: 'A+' },
      { text: 'Weak volume breakout', grade: 'C' },
    ],
    exit_criteria: [{ text: 'Full exit at target R', grade: 'INVALID_GRADE' }],
    stop_loss_management: ['Initial stop: below entry candle low'],
  });

  assert.deepEqual(normalized.entry_criteria, [
    { text: 'Price breaks and holds above key level', grade: 'A+' },
    { text: 'Weak volume breakout', grade: 'C' },
  ]);
  // An invalid/unrecognized grade value is dropped rather than trusted verbatim.
  assert.deepEqual(normalized.exit_criteria, [{ text: 'Full exit at target R', grade: '' }]);
  // Legacy plain-string entries (pre-dating graded criteria) still normalize,
  // just with no grade attached.
  assert.deepEqual(normalized.stop_loss_management, [
    { text: 'Initial stop: below entry candle low', grade: '' },
  ]);
});

test('normalizePlaybookEntry de-duplicates criteria items by text', () => {
  const normalized = normalizePlaybookEntry({
    name: 'ORB',
    entry_criteria: [
      { text: 'Price breaks and holds above key level', grade: 'A+' },
      { text: 'Price breaks and holds above key level', grade: 'B' },
    ],
  });

  assert.equal(normalized.entry_criteria.length, 1);
  assert.equal(normalized.entry_criteria[0].grade, 'A+');
});

test('normalizePlaybookEntry defaults direction to both and rejects invalid values', () => {
  assert.equal(normalizePlaybookEntry({ name: 'ORB', direction: 'long' }).direction, 'long');
  assert.equal(normalizePlaybookEntry({ name: 'ORB', direction: 'short' }).direction, 'short');
  assert.equal(normalizePlaybookEntry({ name: 'ORB', direction: 'both' }).direction, 'both');
  // No direction set (legacy entries) and garbage values both fall back to
  // 'both', so they keep showing up in Add Trade regardless of trade side.
  assert.equal(normalizePlaybookEntry({ name: 'ORB' }).direction, 'both');
  assert.equal(normalizePlaybookEntry({ name: 'ORB', direction: 'sideways' }).direction, 'both');
});

test('an imported setup carries its own journal template', () => {
  const entry = normalizePlaybookEntry({
    name: 'Double Top Short',
    journal_template: {
      fields: [{ label: 'Second high', options: ['Lower', 'Higher'] }],
      questions: [{ prompt: 'What did the market prove before I entered?' }],
    },
  });

  assert.deepEqual(entry.journal_template.fields.map((f) => f.id), ['second_high']);
  assert.equal(entry.journal_template.questions.length, 1);
});

test('importing an older backup leaves a setup\'s existing prompts alone', () => {
  const existing = normalizePlaybookEntry({
    name: 'Double Top Short',
    journal_template: { fields: [{ label: 'Second high', options: ['Lower', 'Higher'] }] },
  });

  // A file exported before templates existed carries none at all.
  const merged = withPreservedJournalTemplate({ name: 'Double Top Short' }, existing);
  assert.deepEqual(merged.journal_template.fields.map((f) => f.id), ['second_high']);
});

test('a backup that does carry prompts replaces the ones a setup has', () => {
  const existing = normalizePlaybookEntry({
    name: 'Double Top Short',
    journal_template: { fields: [{ label: 'Second high', options: ['Lower', 'Higher'] }] },
  });

  const incoming = { name: 'Double Top Short', journal_template: { fields: [{ label: 'Gap', options: ['Yes', 'No'] }] } };
  const merged = withPreservedJournalTemplate(incoming, existing);
  assert.deepEqual(normalizePlaybookEntry(merged).journal_template.fields.map((f) => f.id), ['gap']);
});

test('risk is a percentage of base risk, defaulting to full size', () => {
  assert.equal(normalizePlaybookEntry({ name: 'ORB' }).risk_percent, 100);
  assert.equal(normalizePlaybookEntry({ name: 'ORB', risk_percent: 75 }).risk_percent, 75);
  assert.equal(normalizePlaybookEntry({ name: 'ORB', risk_percent: '250' }).risk_percent, 250);
  // Zero or negative risk would mean a setup that can never be sized.
  assert.equal(normalizePlaybookEntry({ name: 'ORB', risk_percent: 0 }).risk_percent, 100);
});

test('setups saved with the old half/double presets keep the size they had', () => {
  assert.equal(normalizeRiskPercent(null, 'half'), 50);
  assert.equal(normalizeRiskPercent(null, 'normal'), 100);
  assert.equal(normalizeRiskPercent(null, 'oneandahalf'), 150);
  assert.equal(normalizeRiskPercent(null, 'double'), 200);
  // An explicit percent wins over the legacy preset.
  assert.equal(normalizeRiskPercent(80, 'double'), 80);
});

test('getRiskMultiplier turns the percentage into a size multiplier', () => {
  assert.equal(getRiskMultiplier({ risk_percent: 150 }), 1.5);
  assert.equal(getRiskMultiplier({ risk_level: 'half' }), 0.5);
  assert.equal(getRiskMultiplier(null), 1);
});

test('execution score averages the rating Add Trade gave each trade on a setup', () => {
  const scores = calcExecutionScoreBySetup([
    { setup_type: 'ORB', overall_rating: 8 },
    { setup_type: 'orb', overall_rating: 9 },
    { setup_type: 'Double Top Short', overall_rating: 4 },
  ]);

  assert.equal(scores.get('orb').score, 8.5);
  assert.equal(scores.get('orb').grade, 'A');
  assert.equal(scores.get('orb').count, 2);
  assert.equal(scores.get('double top short').grade, 'D');
});

test('execution score ignores trades with no rating or no setup', () => {
  const scores = calcExecutionScoreBySetup([
    { setup_type: 'ORB', overall_rating: 6 },
    { setup_type: 'ORB' },
    { overall_rating: 10 },
  ]);

  assert.equal(scores.get('orb').count, 1);
  assert.equal(scores.size, 1);
  assert.equal(calcExecutionScoreBySetup([]).size, 0);
});

test('a setup reads its charts from the gallery entry it references', () => {
  const gallery = new Map([['g1', ['data:image/webp;base64,AAA', 'data:image/webp;base64,BBB']]]);
  assert.equal(resolvePlaybookImages({ images_gallery_id: 'g1', images: [] }, gallery).length, 2);
});

test('setups saved before charts moved to the gallery keep their inline images', () => {
  const inline = ['data:image/jpeg;base64,CCC'];
  assert.deepEqual(resolvePlaybookImages({ images: inline }, new Map()), inline);
  // A reference to a gallery entry that has gone falls back rather than blanking.
  assert.deepEqual(resolvePlaybookImages({ images_gallery_id: 'gone', images: inline }, new Map()), inline);
  assert.deepEqual(resolvePlaybookImages(null), []);
});

test('the gallery reference survives normalization', () => {
  assert.equal(normalizePlaybookEntry({ name: 'ORB', images_gallery_id: ' g1 ' }).images_gallery_id, 'g1');
  assert.equal(normalizePlaybookEntry({ name: 'ORB' }).images_gallery_id, '');
});

test('each chart can live in its own gallery entry, read back in order', () => {
  const gallery = new Map([['c1', ['data:A']], ['c2', ['data:B']]]);
  assert.deepEqual(resolvePlaybookImages({ images_gallery_ids: ['c2', 'c1'] }, gallery), ['data:B', 'data:A']);
});

test('setups on the older shared gallery entry still resolve', () => {
  const gallery = new Map([['shared', ['data:A', 'data:B']]]);
  assert.equal(resolvePlaybookImages({ images_gallery_id: 'shared' }, gallery).length, 2);
});

test('syncing keeps charts already stored and writes only what changed', () => {
  const plan = planGalleryImageSync(
    ['data:A', 'data:NEW', 'data:C'],
    [{ id: 'a', image: 'data:A' }, { id: 'b', image: 'data:B' }, { id: 'c', image: 'data:C' }],
  );

  assert.deepEqual(plan.order, ['a', null, 'c']);
  assert.deepEqual(plan.create, ['data:NEW']);
  assert.deepEqual(plan.remove, ['b']);
});

test('removing every chart deletes every stored entry', () => {
  const plan = planGalleryImageSync([], [{ id: 'a', image: 'data:A' }]);
  assert.deepEqual(plan, { order: [], create: [], remove: ['a'] });
});

test('two identical charts each get their own entry rather than sharing one', () => {
  const plan = planGalleryImageSync(['data:A', 'data:A'], [{ id: 'a', image: 'data:A' }]);
  assert.deepEqual(plan.order, ['a', null]);
  assert.deepEqual(plan.create, ['data:A']);
});
