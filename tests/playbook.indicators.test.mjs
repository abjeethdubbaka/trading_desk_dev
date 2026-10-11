import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildIndicatorFileName,
  findReleasedIndicatorRefs,
  formatIndicatorSize,
  isIndicatorFileName,
  normalizeIndicators,
  toIndicatorName,
  toOriginalFileName,
} from '../src/lib/playbook/indicators.js';

test('only .cs files are accepted as indicators', () => {
  assert.equal(isIndicatorFileName('VWAPBands.cs'), true);
  assert.equal(isIndicatorFileName('vwap.CS'), true);
  assert.equal(isIndicatorFileName('.cs'), false);
  assert.equal(isIndicatorFileName('notes.txt'), false);
  assert.equal(isIndicatorFileName('archive.cs.zip'), false);
});

test('the stored name keeps the original, made safe, and never collides', () => {
  const name = buildIndicatorFileName('My Indicator (v2).cs', () => 0.5, 1_700_000_000_000);
  assert.match(name, /^[a-z0-9]+-My_Indicator_v2\.cs$/);
  assert.match(name, /^[A-Za-z0-9._-]+$/); // what the disk store accepts
  const other = buildIndicatorFileName('My Indicator (v2).cs', () => 0.1, 1_700_000_000_000);
  assert.notEqual(name, other);
});

test('names read without the extension, and a copy saves under the original', () => {
  assert.equal(toIndicatorName('OrderFlowDelta.cs'), 'OrderFlowDelta');
  assert.equal(toOriginalFileName({ original_name: 'Delta.cs', file_name: 'abc-Delta.cs' }), 'Delta.cs');
  assert.equal(toOriginalFileName({ file_name: 'lq2x9k1a-Delta.cs' }), 'Delta.cs');
});

test('records pointing at nothing are dropped, inline code is kept only without a file', () => {
  const list = normalizeIndicators([
    { id: 'a', ref: 'local:indicators/x-A.cs', original_name: 'A.cs', size: 120 },
    { id: 'b', content: 'public class B {}', original_name: 'B.cs' },
    { id: 'c' },
    { id: 'a', ref: 'local:indicators/dupe.cs' },
  ]);
  assert.deepEqual(list.map((i) => i.id), ['a', 'b']);
  assert.equal(list[0].name, 'A');
  assert.equal(list[0].content, undefined);
  assert.equal(list[1].content, 'public class B {}');
});

test('a file is released only once no setup refers to it', () => {
  const shared = { id: 's', ref: 'local:indicators/shared.cs' };
  const own = { id: 'o', ref: 'local:indicators/own.cs' };
  // The edited setup dropped both; a duplicate still holds the shared file.
  const released = findReleasedIndicatorRefs([shared, own], [{ indicators: [shared] }, { indicators: [] }]);
  assert.deepEqual(released, ['local:indicators/own.cs']);
});

test('sizes read naturally', () => {
  assert.equal(formatIndicatorSize(0), '');
  assert.equal(formatIndicatorSize(512), '512 B');
  assert.equal(formatIndicatorSize(4608), '4.5 KB');
  assert.equal(formatIndicatorSize(3 * 1024 * 1024), '3.0 MB');
});
