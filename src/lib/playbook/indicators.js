/**
 * @file src/lib/playbook/indicators.js
 *
 * Indicator source files attached to a Playbook setup — NinjaScript `.cs`
 * files, the code behind the indicators the setup is traded with.
 *
 * The file itself lives on disk beside the backups (the images folder, in an
 * `indicators` bucket), under its own name so it can be found and copied into
 * NinjaTrader by hand. The setup keeps only a small record of it, since every
 * setup shares one 1 MiB Settings document.
 *
 * In a browser there is no disk to write to, so the code is kept inline on
 * the record instead, up to a size the Settings document can carry.
 *
 * Pure module: no React, no Electron.
 */

export const INDICATOR_BUCKET = 'indicators';
export const INDICATOR_EXTENSIONS = ['.cs'];
export const INDICATOR_ACCEPT = INDICATOR_EXTENSIONS.join(',');

/** A source file larger than this is not an indicator anyone means to attach. */
export const MAX_INDICATOR_BYTES = 2 * 1024 * 1024;

/** The most code kept inline on a record when there is no disk to write to. */
export const MAX_INLINE_INDICATOR_BYTES = 150 * 1024;

export function isIndicatorFileName(name) {
  const lower = String(name || '').trim().toLowerCase();
  return INDICATOR_EXTENSIONS.some((extension) => lower.endsWith(extension) && lower.length > extension.length);
}

/** The indicator's name as a trader reads it: the file name without `.cs`. */
export function toIndicatorName(fileName) {
  const name = String(fileName || '').trim();
  return name.replace(/\.cs$/i, '') || 'Indicator';
}

/**
 * The name the file is stored under. It keeps the original name so the
 * folder stays readable, made safe for the disk, with a short stamp in front
 * so two files called `MyIndicator.cs` never overwrite each other.
 */
export function buildIndicatorFileName(originalName, random = Math.random, now = Date.now()) {
  const base = toIndicatorName(originalName)
    .replace(/[^A-Za-z0-9_-]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 80) || 'indicator';
  const stamp = now.toString(36);
  const noise = Math.floor(random() * 0xffff).toString(36).padStart(3, '0');
  return `${stamp}${noise}-${base}.cs`;
}

/** The original file name back from a stored one, for saving a copy. */
export function toOriginalFileName(indicator) {
  const original = String(indicator?.original_name || '').trim();
  if (original) return original;
  const stored = String(indicator?.file_name || '').trim();
  return stored.replace(/^[a-z0-9]+-/, '') || 'indicator.cs';
}

function toTrimmed(value) {
  return String(value ?? '').trim();
}

export function normalizeIndicator(indicator) {
  if (!indicator || typeof indicator !== 'object') return null;
  const ref = toTrimmed(indicator.ref);
  const content = typeof indicator.content === 'string' ? indicator.content : '';
  // A record with neither a file nor inline code points at nothing.
  if (!ref && !content) return null;

  const originalName = toTrimmed(indicator.original_name);
  const size = Number(indicator.size);

  return {
    id: toTrimmed(indicator.id) || `ind_${Math.random().toString(36).slice(2, 10)}`,
    name: toTrimmed(indicator.name) || toIndicatorName(originalName || indicator.file_name),
    original_name: originalName,
    file_name: toTrimmed(indicator.file_name),
    ref,
    ...(content && !ref ? { content } : {}),
    size: Number.isFinite(size) && size >= 0 ? size : 0,
    note: toTrimmed(indicator.note),
    added_at: toTrimmed(indicator.added_at),
  };
}

export function normalizeIndicators(list) {
  if (!Array.isArray(list)) return [];
  const seen = new Set();
  return list
    .map(normalizeIndicator)
    .filter((indicator) => indicator && !seen.has(indicator.id) && seen.add(indicator.id));
}

/** Every indicator file a set of setups still points at. */
export function collectIndicatorRefs(entries = []) {
  const refs = new Set();
  for (const entry of Array.isArray(entries) ? entries : []) {
    for (const indicator of normalizeIndicators(entry?.indicators)) {
      if (indicator.ref) refs.add(indicator.ref);
    }
  }
  return refs;
}

/**
 * Files that were attached before a change and are attached nowhere after
 * it. A duplicated setup shares its files with the original, so a file is
 * only safe to delete once no setup at all refers to it.
 */
export function findReleasedIndicatorRefs(previousIndicators = [], remainingEntries = []) {
  const stillUsed = collectIndicatorRefs(remainingEntries);
  return normalizeIndicators(previousIndicators)
    .map((indicator) => indicator.ref)
    .filter((ref) => ref && !stillUsed.has(ref));
}

export function formatIndicatorSize(bytes) {
  const value = Number(bytes);
  if (!Number.isFinite(value) || value <= 0) return '';
  if (value < 1024) return `${value} B`;
  if (value < 1024 * 1024) return `${(value / 1024).toFixed(value < 10 * 1024 ? 1 : 0)} KB`;
  return `${(value / (1024 * 1024)).toFixed(1)} MB`;
}
