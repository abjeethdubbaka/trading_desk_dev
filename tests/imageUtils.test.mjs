import test from 'node:test';
import assert from 'node:assert/strict';
import {
  DEFAULT_MAX_IMAGE_BYTES,
  ENCODE_LADDER,
  HIGH_QUALITY_LADDER,
  HIGH_QUALITY_MAX_IMAGE_BYTES,
  dataUrlBytes,
  storedBytes,
  pickBestEncoding,
} from '../src/components/journal/media/imageUtils.js';

/** A data URL whose payload decodes to exactly `bytes` bytes. */
const fakeDataUrl = (bytes) => {
  const base64 = Buffer.alloc(bytes, 7).toString('base64');
  return `data:image/webp;base64,${base64}`;
};

test('five images at the per-image ceiling, stored as base64, still fit a Firestore document', () => {
  assert.ok(storedBytes(DEFAULT_MAX_IMAGE_BYTES) * 5 < 1024 * 1024 * 0.95);
});

test('storedBytes accounts for base64 spending four characters per three bytes', () => {
  assert.equal(storedBytes(3), 4);
  assert.equal(storedBytes(4), 8);
  assert.equal(storedBytes(0), 0);
});

test('the encode ladder runs best first, never upscaling as it goes', () => {
  for (let i = 1; i < ENCODE_LADDER.length; i += 1) {
    assert.ok(ENCODE_LADDER[i].maxWidth < ENCODE_LADDER[i - 1].maxWidth);
    assert.ok(ENCODE_LADDER[i].quality < ENCODE_LADDER[i - 1].quality);
  }
});

test('dataUrlBytes measures the stored payload, not the string', () => {
  assert.equal(dataUrlBytes(fakeDataUrl(1000)), 1000);
  assert.equal(dataUrlBytes(fakeDataUrl(1)), 1);
  assert.equal(dataUrlBytes(fakeDataUrl(2)), 2);
  assert.equal(dataUrlBytes(''), 0);
  assert.equal(dataUrlBytes(null), 0);
});

test('the best candidate that fits the budget wins, not the smallest', () => {
  const best = pickBestEncoding([fakeDataUrl(300), fakeDataUrl(150), fakeDataUrl(50)], 200);
  assert.equal(best.bytes, 150);
});

test('when nothing fits, the smallest is used rather than nothing at all', () => {
  const best = pickBestEncoding([fakeDataUrl(900), fakeDataUrl(400), fakeDataUrl(600)], 200);
  assert.equal(best.bytes, 400);
});

test('pickBestEncoding ignores empty candidates and reports nothing for none', () => {
  assert.equal(pickBestEncoding([], 200), null);
  assert.equal(pickBestEncoding(['', null], 200), null);
  assert.equal(pickBestEncoding([fakeDataUrl(10), ''], 200).bytes, 10);
});

test('a chart with a document to itself still fits inside that document', () => {
  // Measured as stored base64, with room left for category, note and timestamps.
  assert.ok(storedBytes(HIGH_QUALITY_MAX_IMAGE_BYTES) < 1024 * 1024 * 0.9);
  assert.ok(HIGH_QUALITY_MAX_IMAGE_BYTES > DEFAULT_MAX_IMAGE_BYTES);
});

test('the high-quality ladder starts sharper and larger than the shared one', () => {
  assert.ok(HIGH_QUALITY_LADDER[0].maxWidth > ENCODE_LADDER[0].maxWidth);
  assert.ok(HIGH_QUALITY_LADDER[0].quality > ENCODE_LADDER[0].quality);
  for (let i = 1; i < HIGH_QUALITY_LADDER.length; i += 1) {
    assert.ok(HIGH_QUALITY_LADDER[i].maxWidth < HIGH_QUALITY_LADDER[i - 1].maxWidth);
  }
});
