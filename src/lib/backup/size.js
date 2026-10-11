/**
 * @file src/lib/backup/size.js
 *
 * Every Playbook setup lives inside the single `settings/main` document, and
 * Firestore refuses to write a document larger than 1 MiB. Chart images are
 * stored inline as base64, so a strategies backup can easily carry more bytes
 * than the destination document can hold. These helpers measure a payload
 * before it is written so an oversized import can be shrunk — or refused with
 * a number the user can act on — instead of failing at the database.
 */

/** Firestore's hard per-document ceiling. */
export const FIRESTORE_DOC_LIMIT_BYTES = 1024 * 1024;

/**
 * Firestore counts field names, indexes and overhead on top of the raw JSON,
 * so aim well under the ceiling rather than at it.
 */
export const SAFE_DOC_BYTES = Math.floor(FIRESTORE_DOC_LIMIT_BYTES * 0.85);

export function estimateJsonBytes(value) {
  if (value === undefined) return 0;
  try {
    const json = JSON.stringify(value);
    if (typeof json !== 'string') return 0;
    // Playbook payloads are base64 and ASCII JSON punctuation, but measure
    // real UTF-8 length so notes in any language are counted honestly.
    return typeof TextEncoder === 'function'
      ? new TextEncoder().encode(json).length
      : Buffer.byteLength(json, 'utf8');
  } catch {
    return 0;
  }
}

export function formatBytes(bytes) {
  const value = Number(bytes) || 0;
  if (value < 1024) return `${value} B`;
  if (value < 1024 * 1024) return `${Math.round(value / 1024)} KB`;
  return `${(value / (1024 * 1024)).toFixed(2)} MB`;
}
