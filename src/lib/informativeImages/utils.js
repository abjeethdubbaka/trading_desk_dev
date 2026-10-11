/**
 * @file src/lib/informativeImages/utils.js
 *
 * Informative Images — studied charts, filed under a setup or a free-form
 * category. These helpers pick out the ones that belong to a given setup, so
 * the same reference material can be shown wherever that setup is in play.
 *
 * Pure module: no React, no database.
 */

const toKey = (value) => String(value || '').trim().toLowerCase();

/**
 * The studied charts filed under a setup. Entries the setup already shows as
 * its own Playbook charts are left out: they are the same images, and a
 * duplicate row is worse than no row.
 */
export function selectInformativeImagesForSetup(items = [], setupName, excludeIds = []) {
  const wanted = toKey(setupName);
  if (!wanted) return [];

  const excluded = new Set((Array.isArray(excludeIds) ? excludeIds : []).filter(Boolean));

  return (Array.isArray(items) ? items : []).filter((item) => (
    toKey(item?.category) === wanted && !excluded.has(item?.id)
  ));
}

/** Every image of those entries, flattened in the order they are filed. */
export function flattenInformativeImages(items = []) {
  return (Array.isArray(items) ? items : []).flatMap((item) => (
    Array.isArray(item?.images) ? item.images.filter((image) => typeof image === 'string' && image) : []
  ));
}

/** The gallery entries a Playbook setup already owns as its own charts. */
export function getSetupOwnedGalleryIds(playbookEntry) {
  const ids = Array.isArray(playbookEntry?.images_gallery_ids) ? playbookEntry.images_gallery_ids : [];
  const legacyId = String(playbookEntry?.images_gallery_id || '').trim();
  return [...ids, legacyId].filter(Boolean);
}
