/**
 * Convert a File to a compressed JPEG data URL using canvas.
 * Falls back to the original data URL if canvas is unavailable.
 * Keeps the data URL small enough (~100-200 KB) for Firestore storage.
 */
export async function imageFileToDataUrl(file, { maxWidth = 1200, quality = 0.82 } = {}) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(reader.error);
    reader.onload = (e) => {
      const originalDataUrl = e.target.result;

      // Non-image files: return as-is
      if (!file.type.startsWith('image/')) {
        resolve(originalDataUrl);
        return;
      }

      const img = new Image();
      img.onerror = () => resolve(originalDataUrl); // fallback
      img.onload = () => {
        try {
          const scale = img.width > maxWidth ? maxWidth / img.width : 1;
          const w = Math.round(img.width  * scale);
          const h = Math.round(img.height * scale);

          const canvas = document.createElement('canvas');
          canvas.width  = w;
          canvas.height = h;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, w, h);

          const outputType = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
          const dataUrl = canvas.toDataURL(outputType, quality);
          resolve(dataUrl);
        } catch {
          resolve(originalDataUrl);
        }
      };
      img.src = originalDataUrl;
    };
    reader.readAsDataURL(file);
  });
}
