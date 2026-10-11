/**
 * @file src/components/journal/media/imageUtils.js
 *
 * Chart images are stored inline as base64 inside Firestore documents, and a
 * document cannot exceed 1 MiB — with up to five images per entry, each one
 * has to fit a tight byte budget.
 *
 * Quality therefore comes from encoding smarter rather than from spending
 * more bytes: WebP where the browser supports it (markedly sharper than JPEG
 * at the same size, which matters for the thin lines and small text on a
 * chart), high-quality downscaling, and a ladder that starts at full
 * resolution and steps down only as far as the budget demands.
 */

/**
 * Firestore counts a stored string by its length, and base64 spends four
 * characters for every three bytes of image — so budgets below are decoded
 * bytes, sized so the base64 that actually gets stored still fits.
 */
export function storedBytes(decodedBytes) {
  return Math.ceil(Math.max(0, Number(decodedBytes) || 0) / 3) * 4;
}

/** Per-image ceiling. Five of these, as base64, still fit under Firestore's 1 MiB. */
export const DEFAULT_MAX_IMAGE_BYTES = 140 * 1024;

/**
 * Tried in order, best first. Each rung drops resolution and quality
 * together, so a screenshot that fits at the top keeps its detail and only a
 * genuinely large photo walks far down the ladder.
 */
export const ENCODE_LADDER = [
  { maxWidth: 1800, quality: 0.92 },
  { maxWidth: 1600, quality: 0.88 },
  { maxWidth: 1400, quality: 0.84 },
  { maxWidth: 1200, quality: 0.8 },
  { maxWidth: 1000, quality: 0.74 },
  { maxWidth: 800, quality: 0.68 },
];

/**
 * For charts that get a Firestore document to themselves, such as Playbook
 * setup charts. With the whole document available there is no reason to
 * throw detail away: this starts near-lossless at up to 2560px and only
 * steps down for images too large to fit even so.
 */
export const HIGH_QUALITY_MAX_IMAGE_BYTES = 690 * 1024;

export const HIGH_QUALITY_LADDER = [
  { maxWidth: 2560, quality: 0.96 },
  { maxWidth: 2200, quality: 0.94 },
  { maxWidth: 1920, quality: 0.92 },
  ...ENCODE_LADDER.slice(1),
];

/** Decoded size of a data URL, without decoding it. */
export function dataUrlBytes(dataUrl) {
  if (typeof dataUrl !== 'string') return 0;
  const base64 = dataUrl.slice(dataUrl.indexOf(',') + 1);
  if (!base64) return 0;
  const padding = base64.endsWith('==') ? 2 : base64.endsWith('=') ? 1 : 0;
  return Math.max(0, Math.floor((base64.length * 3) / 4) - padding);
}

/**
 * The best candidate that fits the budget, or the smallest one when nothing
 * does — never nothing, since a slightly oversized image beats no image.
 */
export function pickBestEncoding(candidates = [], maxBytes = DEFAULT_MAX_IMAGE_BYTES) {
  const sized = candidates
    .filter((dataUrl) => typeof dataUrl === 'string' && dataUrl)
    .map((dataUrl) => ({ dataUrl, bytes: dataUrlBytes(dataUrl) }));

  if (sized.length === 0) return null;

  const fits = sized.find((candidate) => candidate.bytes <= maxBytes);
  if (fits) return fits;

  return sized.reduce((smallest, candidate) => (
    candidate.bytes < smallest.bytes ? candidate : smallest
  ));
}

let webpSupport = null;

/** WebP is roughly a third smaller than JPEG at matching quality. */
export function supportsWebP() {
  if (webpSupport != null) return webpSupport;
  if (typeof document === 'undefined') return false;

  try {
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;
    webpSupport = canvas.toDataURL('image/webp').startsWith('data:image/webp');
  } catch {
    webpSupport = false;
  }
  return webpSupport;
}

function drawToCanvas(img, maxWidth) {
  // Never upscale: enlarging a screenshot adds bytes and no detail.
  const scale = img.width > maxWidth ? maxWidth / img.width : 1;
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(img.width * scale));
  canvas.height = Math.max(1, Math.round(img.height * scale));

  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  // Charts are usually drawn on a dark ground; a white base keeps a
  // transparent PNG from turning black once it is flattened into WebP/JPEG.
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  return canvas;
}

function loadImage(dataUrl) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Could not decode image'));
    img.src = dataUrl;
  });
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(reader.error);
    reader.onload = (event) => resolve(event.target.result);
    reader.readAsDataURL(file);
  });
}

/**
 * Convert a File to a data URL small enough to store, at the highest quality
 * that fits. `maxBytes` raises or lowers that ceiling; `maxWidth` caps
 * resolution for callers that want smaller images regardless of budget.
 */
export async function imageFileToDataUrl(file, options = {}) {
  const {
    maxBytes = DEFAULT_MAX_IMAGE_BYTES,
    maxWidth = null,
    quality = null,
    ladder: baseLadder = ENCODE_LADDER,
  } = options;

  const originalDataUrl = await readFileAsDataUrl(file);

  // Non-image files (and anything we cannot draw) pass straight through.
  if (!file.type?.startsWith('image/') || typeof document === 'undefined') return originalDataUrl;
  // An SVG is already small and would be rasterised by canvas, losing the
  // one thing that makes it worth keeping.
  if (file.type === 'image/svg+xml') return originalDataUrl;

  let img;
  try {
    img = await loadImage(originalDataUrl);
  } catch {
    return originalDataUrl;
  }

  const mimeType = supportsWebP() ? 'image/webp' : 'image/jpeg';
  const ladder = baseLadder
    .map((step) => ({
      maxWidth: maxWidth ? Math.min(maxWidth, step.maxWidth) : step.maxWidth,
      quality: quality ?? step.quality,
    }))
    // A caller-supplied cap can collapse several rungs onto the same size.
    .filter((step, index, steps) => index === 0 || step.maxWidth !== steps[index - 1].maxWidth
      || step.quality !== steps[index - 1].quality);

  const candidates = [];
  try {
    for (const step of ladder) {
      const canvas = drawToCanvas(img, step.maxWidth);
      const encoded = canvas.toDataURL(mimeType, step.quality);
      candidates.push(encoded);
      // Stop as soon as one fits: the ladder is ordered best first.
      if (dataUrlBytes(encoded) <= maxBytes) break;
    }
  } catch {
    return originalDataUrl;
  }

  const best = pickBestEncoding(candidates, maxBytes);
  if (!best) return originalDataUrl;

  // A small original that survives re-encoding unimproved is left alone.
  return best.bytes < dataUrlBytes(originalDataUrl) ? best.dataUrl : originalDataUrl;
}
