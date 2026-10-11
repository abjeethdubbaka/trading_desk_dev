import test from 'node:test';
import assert from 'node:assert/strict';
import {
  flattenInformativeImages,
  getSetupOwnedGalleryIds,
  selectInformativeImagesForSetup,
} from '../src/lib/informativeImages/utils.js';

const ITEMS = [
  { id: 'own', category: 'ORB', images: ['playbook-1'] },
  { id: 'a', category: 'ORB', images: ['studied-1', 'studied-2'] },
  { id: 'b', category: ' orb ', images: ['studied-3'] },
  { id: 'c', category: 'Double Top Short', images: ['other-1'] },
];

test('a setup finds the charts studied under its name, whatever the casing', () => {
  const picked = selectInformativeImagesForSetup(ITEMS, 'orb');
  assert.deepEqual(picked.map((item) => item.id), ['own', 'a', 'b']);
});

test("a setup's own playbook charts are left out, so nothing is shown twice", () => {
  const picked = selectInformativeImagesForSetup(ITEMS, 'ORB', ['own']);
  assert.deepEqual(picked.map((item) => item.id), ['a', 'b']);
});

test('no setup selected means nothing to show', () => {
  assert.deepEqual(selectInformativeImagesForSetup(ITEMS, ''), []);
  assert.deepEqual(selectInformativeImagesForSetup(null, 'ORB'), []);
});

test('flattening keeps every image, in the order the entries are filed', () => {
  const picked = selectInformativeImagesForSetup(ITEMS, 'ORB', ['own']);
  assert.deepEqual(flattenInformativeImages(picked), ['studied-1', 'studied-2', 'studied-3']);
  assert.deepEqual(flattenInformativeImages([{ images: [null, '', 'ok'] }]), ['ok']);
});

test('a setup knows which gallery entries are its own, old layout included', () => {
  assert.deepEqual(getSetupOwnedGalleryIds({ images_gallery_ids: ['c1', 'c2'] }), ['c1', 'c2']);
  assert.deepEqual(getSetupOwnedGalleryIds({ images_gallery_id: 'shared' }), ['shared']);
  assert.deepEqual(getSetupOwnedGalleryIds({}), []);
});
