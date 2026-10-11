import test from 'node:test';
import assert from 'node:assert/strict';
import {
  FIRESTORE_DOC_LIMIT_BYTES,
  SAFE_DOC_BYTES,
  estimateJsonBytes,
  formatBytes,
} from '../src/lib/backup/size.js';

test('the safe ceiling stays under what Firestore will actually accept', () => {
  assert.ok(SAFE_DOC_BYTES < FIRESTORE_DOC_LIMIT_BYTES);
});

test('estimateJsonBytes measures the serialized payload in UTF-8', () => {
  assert.equal(estimateJsonBytes({ a: 1 }), '{"a":1}'.length);
  assert.equal(estimateJsonBytes('é'), 4); // quotes plus a two-byte character
  assert.equal(estimateJsonBytes(undefined), 0);
});

test('estimateJsonBytes returns zero rather than throwing on a cycle', () => {
  const cyclic = {};
  cyclic.self = cyclic;
  assert.equal(estimateJsonBytes(cyclic), 0);
});

test('formatBytes reports sizes a person can act on', () => {
  assert.equal(formatBytes(512), '512 B');
  assert.equal(formatBytes(1483 * 1024), '1.45 MB');
});
