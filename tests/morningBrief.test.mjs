import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildMorningBrief,
  computeMentalScore,
  getReadiness,
  isBriefComplete,
} from '../src/lib/morningBrief/utils.js';

const ALL_EIGHT = { sleep: 8, emotions: 8, focus: 8, confidence: 8 };

test('the score waits for every answer', () => {
  assert.equal(isBriefComplete({ sleep: 8, focus: 7 }), false);
  assert.equal(computeMentalScore({ sleep: 8, focus: 7 }), null);
  assert.equal(computeMentalScore({ sleep: 9, emotions: 6, focus: 7, confidence: 8 }), 7.5);
});

test('a strong morning is ready to trade', () => {
  assert.equal(getReadiness(8, ALL_EIGHT).label, 'Ready to trade');
});

test('one very low answer is called out even when the average is good', () => {
  const answers = { sleep: 2, emotions: 10, focus: 10, confidence: 10 };
  const score = computeMentalScore(answers);
  assert.equal(score, 8);
  const readiness = getReadiness(score, answers);
  assert.equal(readiness.label, 'Trade with care');
  assert.match(readiness.advice, /Sleep quality is low/);
});

test('a poor morning suggests sitting out', () => {
  const answers = { sleep: 3, emotions: 4, focus: 4, confidence: 5 };
  assert.equal(getReadiness(computeMentalScore(answers), answers).tone, 'danger');
});

test('the stored record keeps the answers, the goal and the score', () => {
  const record = buildMorningBrief({ ...ALL_EIGHT, focus: 11 }, '  Max 2 trades  ', '2026-10-07', new Date('2026-10-07T12:00:00Z'));
  assert.equal(record.date, '2026-10-07');
  assert.equal(record.goal, 'Max 2 trades');
  assert.equal(record.focus, 10); // clamped to the scale
  assert.equal(record.mental_score, 8.5);
});
