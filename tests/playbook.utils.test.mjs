import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createPlaybookEntryFromSetupName,
  getPlaybookEntryBySetupName,
  mergeSetupTypesWithPlaybook,
  normalizePlaybookEntries,
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

test('createPlaybookEntryFromSetupName builds a seeded playbook template', () => {
  const seeded = createPlaybookEntryFromSetupName('Breakout');

  assert.equal(seeded.name, 'Breakout');
  assert.equal(seeded.is_active, true);
  assert.equal(seeded.expected_r_profile.target, 2);
  assert.ok(Array.isArray(seeded.entry_criteria));
  assert.ok(seeded.entry_criteria.length > 0);
  assert.ok(Array.isArray(seeded.exit_criteria));
  assert.ok(Array.isArray(seeded.invalidations));
});
