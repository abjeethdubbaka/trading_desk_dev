import test from 'node:test';
import assert from 'node:assert/strict';
import {
  IMAGE_BUCKETS,
  LOCAL_REF_PREFIX,
  buildImageFileName,
  collectLocalRefs,
  findOrphanedFiles,
  isDataUrl,
  isLocalImageRef,
  parseDataUrl,
  parseLocalImageRef,
  toDataUrl,
  toLocalImageRef,
} from '../src/lib/images/localStore.js';

test('a stored reference can never be mistaken for an inline image', () => {
  const ref = toLocalImageRef(IMAGE_BUCKETS.informative, 'ab12.webp');
  assert.ok(ref.startsWith(LOCAL_REF_PREFIX));
  assert.equal(isLocalImageRef(ref), true);
  assert.equal(isDataUrl(ref), false);
  assert.equal(isLocalImageRef('data:image/webp;base64,AAA'), false);
  assert.equal(isDataUrl('data:image/webp;base64,AAA'), true);
});

test('a reference names the bucket and file it points at', () => {
  assert.deepEqual(parseLocalImageRef('local:informative/ab12.webp'), {
    bucket: 'informative', fileName: 'ab12.webp', path: 'informative/ab12.webp',
  });
});

test('a reference can never walk out of the images folder', () => {
  assert.equal(parseLocalImageRef('local:informative/../../etc/passwd'), null);
  assert.equal(parseLocalImageRef('local:informative/nested/file.webp'), null);
  assert.equal(parseLocalImageRef('local:../secrets/x.webp'), null);
  assert.equal(parseLocalImageRef('local:/x.webp'), null);
  assert.equal(parseLocalImageRef('local:informative/'), null);
  assert.equal(parseLocalImageRef('not-a-ref'), null);
});

test('a data URL splits into the parts needed to write a file', () => {
  const parsed = parseDataUrl('data:image/png;base64,QUJD');
  assert.equal(parsed.mime, 'image/png');
  assert.equal(parsed.base64, 'QUJD');
  assert.equal(parsed.extension, 'png');
  assert.equal(parseDataUrl('data:image/webp;base64,QQ').extension, 'webp');
  // An unknown type is still stored, just not guessed at.
  assert.equal(parseDataUrl('data:image/heic;base64,QQ').extension, 'bin');
  assert.equal(parseDataUrl('nonsense'), null);
  assert.equal(parseDataUrl('data:image/png;base64,'), null);
});

test('a file is rebuilt into something an img tag can show', () => {
  assert.equal(toDataUrl('image/png', 'QUJD'), 'data:image/png;base64,QUJD');
  assert.equal(toDataUrl(null, 'QUJD'), 'data:image/webp;base64,QUJD');
});

test('two saves of the same image get different files', () => {
  const first = buildImageFileName('webp', () => 0.1);
  const second = buildImageFileName('webp', () => 0.9);
  assert.notEqual(first, second);
  assert.ok(first.endsWith('.webp'));
  // Safe as a file name: no separators, no spaces.
  assert.match(first, /^[a-z0-9-]+\.webp$/);
});

test('every reference a set of records holds can be collected', () => {
  const records = [
    { images: ['local:informative/a.webp', 'data:image/png;base64,QQ'] },
    { images: ['local:informative/b.webp'] },
    { images: null },
    {},
  ];

  const refs = collectLocalRefs(records);
  assert.equal(refs.size, 2);
  assert.ok(refs.has('local:informative/a.webp'));
});

test('files nothing points at are found, so the folder cannot grow forever', () => {
  const stored = ['informative/a.webp', 'informative/b.webp', 'data-points/c.webp'];
  const referenced = new Set(['local:informative/a.webp']);

  assert.deepEqual(findOrphanedFiles(stored, referenced), ['informative/b.webp', 'data-points/c.webp']);
  // Nothing referenced means everything is an orphan; nothing stored means none.
  assert.equal(findOrphanedFiles(stored, new Set()).length, 3);
  assert.deepEqual(findOrphanedFiles([], referenced), []);
});
