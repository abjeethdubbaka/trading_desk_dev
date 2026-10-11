import test from 'node:test';
import assert from 'node:assert/strict';
import {
  DEFAULT_CALCULATOR_AFFIRMATIONS,
  getCalculatorAffirmations,
} from '../src/lib/constants/calculatorBanner.js';

test('the starting affirmations speak in the first person', () => {
  assert.ok(DEFAULT_CALCULATOR_AFFIRMATIONS.length > 0);
  for (const line of DEFAULT_CALCULATOR_AFFIRMATIONS) {
    assert.ok(line.startsWith('I '), `${line} should be written as "I …"`);
  }
});

test('a trader who has set their own affirmations sees only those', () => {
  const mine = ['I am a mechanic', 'I wait'];
  assert.deepEqual(getCalculatorAffirmations({ calculator_affirmations: mine }), mine);
});

test('blank lines are dropped, and an emptied list hides the banner', () => {
  assert.deepEqual(getCalculatorAffirmations({ calculator_affirmations: ['  I am calm  ', '', '   '] }), ['I am calm']);
  assert.deepEqual(getCalculatorAffirmations({ calculator_affirmations: [] }), []);
});

test('the list saved under the earlier key is still shown', () => {
  assert.deepEqual(getCalculatorAffirmations({ calculator_notes: ['I am patient'] }), ['I am patient']);
});

test('settings with nothing set fall back to the starting list', () => {
  assert.equal(getCalculatorAffirmations({}).length, DEFAULT_CALCULATOR_AFFIRMATIONS.length);
  assert.equal(getCalculatorAffirmations(null).length, DEFAULT_CALCULATOR_AFFIRMATIONS.length);
});
