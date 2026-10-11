import test from 'node:test';
import assert from 'node:assert/strict';
import {
  DEFAULT_EMOTIONS,
  NEUTRAL_EMOTION_POINTS,
  getEmotionDotClass,
  getEmotionOptions,
  getEmotionPoints,
  toEmotionKey,
} from '../src/lib/constants/emotions.js';

test('the defaults keep the exact keys older trades already hold', () => {
  const values = getEmotionOptions({}).map((o) => o.value);
  assert.deepEqual(values, ['disciplined', 'confident', 'neutral', 'nervous', 'fomo', 'revenge']);
  assert.equal(DEFAULT_EMOTIONS.length, 6);
});

test('a trader\'s own emotions replace the defaults, deduplicated and trimmed', () => {
  const options = getEmotionOptions({ emotions: ['  Impatient ', 'Bored', 'impatient', ''] });
  assert.deepEqual(options, [
    { value: 'impatient', label: 'Impatient' },
    { value: 'bored', label: 'Bored' },
  ]);
});

test('an emptied list falls back to the defaults rather than offering nothing', () => {
  assert.equal(getEmotionOptions({ emotions: [] }).length, 6);
});

test('the six defaults keep their weight in the rating', () => {
  assert.equal(getEmotionPoints('disciplined'), 1);
  assert.equal(getEmotionPoints('FOMO'), 0.1);
  assert.equal(getEmotionPoints('revenge'), 0);
});

test('an emotion added in Settings scores as neutral, not as good or bad', () => {
  assert.equal(getEmotionPoints('impatient'), NEUTRAL_EMOTION_POINTS);
  // No emotion recorded contributes nothing.
  assert.equal(getEmotionPoints(''), null);
  assert.equal(getEmotionPoints(null), null);
});

test('known emotions keep their colour, new ones read as neutral grey', () => {
  assert.equal(getEmotionDotClass('fomo'), 'bg-orange-400');
  assert.equal(getEmotionDotClass('impatient'), 'bg-slate-400');
  assert.equal(toEmotionKey(' Revenge '), 'revenge');
});
