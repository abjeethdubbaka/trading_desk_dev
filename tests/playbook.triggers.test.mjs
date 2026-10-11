import test from 'node:test';
import assert from 'node:assert/strict';
import {
  getAlertKeywords,
  matchTriggerToPlaybook,
  parseAlertKeywords,
  scoreSetupMatch,
  summarizeTriggers,
} from '../src/lib/playbook/triggers.js';

const PLAYBOOK = [
  { id: 'vwap', name: 'VWAP Rejection', direction: 'short', alert_keywords: ['VWAP REJ'] },
  { id: 'bl', name: 'Base Long', direction: 'long', alert_keywords: ['BL'] },
  { id: 'old', name: 'Retired', direction: 'both', is_active: false, alert_keywords: ['REJ'] },
];

const trig = (setupText, direction) => ({ setupText, direction });

test('mangled reads of the same setup still match it', () => {
  for (const read of ['VWAP REJ', 'WVAP REJ', 'WAP REJ', 'W AP REJ', 'WP REJ', 'REJ']) {
    assert.ok(scoreSetupMatch(read, 'VWAP REJ') >= 0.75, read);
  }
  assert.equal(scoreSetupMatch('BL', 'VWAP REJ'), 0);
  assert.equal(scoreSetupMatch('R', 'VWAP REJ'), 0);
});

test('triggers file under the right strategy, direction included', () => {
  assert.equal(matchTriggerToPlaybook(trig('W{AP REJ', 'short'), PLAYBOOK).entry.id, 'vwap');
  assert.equal(matchTriggerToPlaybook(trig('REJ', 'short'), PLAYBOOK).entry.id, 'vwap');
  assert.equal(matchTriggerToPlaybook(trig('BL', 'long'), PLAYBOOK).entry.id, 'bl');
  // A long can never file under a short-only strategy.
  assert.equal(matchTriggerToPlaybook(trig('VWAP REJ', 'long'), PLAYBOOK), null);
  // Nothing close: unassigned.
  assert.equal(matchTriggerToPlaybook(trig('ORB', 'long'), PLAYBOOK), null);
});

test('a strategy without keywords is matched by its name', () => {
  assert.deepEqual(getAlertKeywords({ name: 'VWAP REJ' }), ['VWAP REJ']);
  assert.equal(matchTriggerToPlaybook(trig('WVAP REJ', 'short'), [{ id: 'n', name: 'VWAP REJ', direction: 'both' }]).entry.id, 'n');
});

test('keywords are typed as a comma list', () => {
  assert.deepEqual(parseAlertKeywords(' vwap  rej, VWAP REJ ,bl,, '), ['VWAP REJ', 'BL']);
});

test('triggers are counted per strategy, all-time and today', () => {
  const summary = summarizeTriggers([
    { playbook_id: 'vwap', date: '2026-10-08', timeEt: '09:55', direction: 'short' },
    { playbook_id: 'vwap', date: '2026-10-07', timeEt: '10:00', direction: 'short' },
    { playbook_id: null, date: '2026-10-08', timeEt: '09:45', direction: 'long' },
  ], '2026-10-08');
  assert.equal(summary.get('vwap').total, 2);
  assert.equal(summary.get('vwap').today, 1);
  assert.equal(summary.get('vwap').recent[0].timeEt, '09:55');
  assert.equal(summary.get(null).total, 1);
});
