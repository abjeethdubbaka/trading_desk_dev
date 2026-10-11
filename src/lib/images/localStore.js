/**
 * @file src/lib/images/localStore.js
 *
 * Images kept as files on disk rather than base64 inside Firestore
 * documents. Storing bytes in documents meant every list query downloaded
 * every chart ever saved, and capped quality at whatever fitted the 1 MiB
 * document limit. On disk there is no such ceiling, and a document carries
 * only a reference.
 *
 * A reference looks like `local:informative/ab12f9.webp` — a prefix so it can
 * never be confused with a data URL, then the bucket and file name. Pure
 * module: no Electron, no filesystem, no React.
 */

/** Marks a stored reference, so old inline images stay recognisable. */
export const LOCAL_REF_PREFIX = 'local:';

/** Where each kind of image lives inside the images folder. */
export const IMAGE_BUCKETS = {
  informative: 'informative',
  dataPoints: 'data-points',
  playbook: 'playbook',
  trades: 'trades',
};

const EXTENSION_BY_MIME = {
  'image/webp': 'webp',
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/png': 'png',
  'image/gif': 'gif',
  'image/avif': 'avif',
};

export function isLocalImageRef(value) {
  return typeof value === 'string' && value.startsWith(LOCAL_REF_PREFIX);
}

export function isDataUrl(value) {
  return typeof value === 'string' && value.startsWith('data:image/');
}

/** The bucket and file name a reference points at, or null if it is not one. */
export function parseLocalImageRef(value) {
  if (!isLocalImageRef(value)) return null;

  const path = value.slice(LOCAL_REF_PREFIX.length);
  const slash = path.indexOf('/');
  if (slash <= 0 || slash === path.length - 1) return null;

  const bucket = path.slice(0, slash);
  const fileName = path.slice(slash + 1);
  // A reference must never be able to walk out of the images folder.
  if (fileName.includes('/') || fileName.includes('\\') || fileName.includes('..')) return null;
  if (!/^[a-z0-9-]+$/.test(bucket)) return null;

  return { bucket, fileName, path };
}

export function toLocalImageRef(bucket, fileName) {
  return `${LOCAL_REF_PREFIX}${bucket}/${fileName}`;
}

/** Splits a data URL into the parts needed to write it as a file. */
export function parseDataUrl(dataUrl) {
  if (!isDataUrl(dataUrl)) return null;

  const comma = dataUrl.indexOf(',');
  if (comma === -1) return null;

  const header = dataUrl.slice(5, comma); // after "data:"
  const mime = header.split(';')[0];
  const base64 = dataUrl.slice(comma + 1);
  if (!base64) return null;

  return { mime, base64, extension: EXTENSION_BY_MIME[mime] || 'bin' };
}

/**
 * A file name for a new image. Random rather than derived from content, so
 * saving the same screenshot twice does not have the second overwrite the
 * first — one entry deleting its file would otherwise blank the other.
 */
export function buildImageFileName(extension = 'webp', random = Math.random) {
  const stamp = Date.now().toString(36);
  const noise = Math.floor(random() * 0xffffff).toString(36).padStart(4, '0');
  return `${stamp}-${noise}.${extension}`;
}

/** Rebuilds a data URL from a file's bytes, for display. */
export function toDataUrl(mime, base64) {
  return `data:${mime || 'image/webp'};base64,${base64}`;
}

/**
 * Every reference held by a set of records, so orphaned files can be found.
 * `getImages` says where a record keeps its images.
 */
export function collectLocalRefs(records = [], getImages = (record) => record?.images) {
  const refs = new Set();
  for (const record of Array.isArray(records) ? records : []) {
    const images = getImages(record);
    for (const image of Array.isArray(images) ? images : []) {
      if (isLocalImageRef(image)) refs.add(image);
    }
  }
  return refs;
}

/**
 * Files on disk that nothing points at any more. Deleting an entry has to
 * delete its file, or the folder grows forever.
 */
export function findOrphanedFiles(storedPaths = [], referencedRefs = new Set()) {
  const referenced = new Set(
    [...referencedRefs].map((ref) => parseLocalImageRef(ref)?.path).filter(Boolean)
  );
  return (Array.isArray(storedPaths) ? storedPaths : []).filter((path) => !referenced.has(path));
}
