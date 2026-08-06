/**
 * Client-side image compression for faster uploads.
 *
 * iPhone photos are huge (12–48 MP, sometimes HEIC). Sending them raw makes
 * bulk uploads slow and often trips the server's 10 MB per-file limit. This
 * downscales to a sensible max dimension and re-encodes as JPEG before upload,
 * which also converts HEIC to JPEG in browsers that can decode it (Safari).
 *
 * Returns a new File (JPEG) when compression succeeds, otherwise the original
 * file unchanged so the caller can fall back gracefully.
 */
const DEFAULT_MAX_DIMENSION = 1600;
const DEFAULT_QUALITY = 0.82;
const SMALL_FILE_SKIP_BYTES = 350 * 1024;

export async function compressImage(
  file,
  { maxDimension = DEFAULT_MAX_DIMENSION, quality = DEFAULT_QUALITY } = {}
) {
  if (!file || typeof file !== 'object' || !file.type) return file;

  const type = file.type.toLowerCase();
  const isRaster =
    type === 'image/jpeg' ||
    type === 'image/png' ||
    type === 'image/webp' ||
    type === 'image/heic' ||
    type === 'image/heif';

  // Skip GIFs/SVGs (would lose animation / vectors) and small files.
  if (!isRaster) return file;
  if (file.size > 0 && file.size < SMALL_FILE_SKIP_BYTES) return file;

  const objectUrl = URL.createObjectURL(file);
  try {
    const image = await new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error('decode_failed'));
      img.src = objectUrl;
    });

    const { naturalWidth: w, naturalHeight: h } = image;
    if (!w || !h) return file;

    const scale = Math.min(1, maxDimension / Math.max(w, h));
    const tw = Math.max(1, Math.round(w * scale));
    const th = Math.max(1, Math.round(h * scale));

    const canvas = document.createElement('canvas');
    canvas.width = tw;
    canvas.height = th;
    const ctx = canvas.getContext('2d');
    if (!ctx) return file;
    ctx.drawImage(image, 0, 0, tw, th);

    const blob = await new Promise((resolve) =>
      canvas.toBlob(resolve, 'image/jpeg', quality)
    );
    if (!blob) return file;

    const baseName = (file.name || 'photo').replace(/\.[^.]+$/, '') || 'photo';
    return new File([blob], `${baseName}.jpg`, {
      type: 'image/jpeg',
      lastModified: Date.now(),
    });
  } catch {
    return file;
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}
