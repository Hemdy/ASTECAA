export const MAX_UPLOAD_BINARY_BYTES = Math.floor(3.0 * 1024 * 1024);
const OPTIMIZE_THRESHOLD_BYTES = Math.floor(1.5 * 1024 * 1024);
const MAX_IMAGE_DIMENSION = 2048;

const IMAGE_EXTENSIONS = new Set(['jpg', 'jpeg', 'png', 'webp', 'gif', 'avif', 'svg']);
const VIDEO_EXTENSIONS = new Set(['mp4', 'webm', 'mov', 'm4v']);

export interface PreparedMediaPayload {
  dataUrl: string;
  name: string;
  mimeType: string;
  sizeFormatted: string;
}

export function formatFileSize(bytes: number): string {
  if (!bytes || bytes <= 0) return '0 B';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function titleFromFilename(filename: string): string {
  const base = filename.replace(/\.[^/.]+$/, '').replace(/[-_]+/g, ' ').trim();
  if (!base) return 'Untitled media';
  return base.charAt(0).toUpperCase() + base.slice(1);
}

export function inferMediaMimeType(file: File): string {
  if (file.type) return file.type;
  const ext = file.name.split('.').pop()?.toLowerCase() || '';
  switch (ext) {
    case 'jpg':
    case 'jpeg':
      return 'image/jpeg';
    case 'png':
      return 'image/png';
    case 'webp':
      return 'image/webp';
    case 'gif':
      return 'image/gif';
    case 'avif':
      return 'image/avif';
    case 'svg':
      return 'image/svg+xml';
    case 'mp4':
      return 'video/mp4';
    case 'webm':
      return 'video/webm';
    case 'mov':
      return 'video/quicktime';
    case 'm4v':
      return 'video/x-m4v';
    default:
      return '';
  }
}

export function isSupportedMediaFile(file: File, allowDocuments = false): boolean {
  const mime = inferMediaMimeType(file);
  if (mime.startsWith('image/') || mime.startsWith('video/')) {
    return true;
  }
  if (allowDocuments && mime === 'application/pdf') {
    return true;
  }
  const ext = file.name.split('.').pop()?.toLowerCase() || '';
  if (allowDocuments && ext === 'pdf') return true;
  return IMAGE_EXTENSIONS.has(ext) || VIDEO_EXTENSIONS.has(ext);
}

export function readFileAsDataUrl(file: File | Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('Failed to read selected file.'));
    reader.readAsDataURL(file);
  });
}

function loadImageFromFile(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error(`Could not decode image "${file.name}".`));
    };
    img.src = url;
  });
}

function canvasToBlob(canvas: HTMLCanvasElement, mimeType: string, quality: number): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob(resolve, mimeType, quality));
}

async function optimizeOversizedRasterImage(
  file: File,
  mimeType: string,
): Promise<{ blob: Blob; mimeType: string; ext: string }> {
  const img = await loadImageFromFile(file);
  const targetMime = mimeType === 'image/webp' ? 'image/webp' : 'image/jpeg';
  const targetExt = targetMime === 'image/webp' ? 'webp' : 'jpg';

  let maxDim = MAX_IMAGE_DIMENSION;
  for (let pass = 0; pass < 3; pass++) {
    const scale = Math.min(1, maxDim / Math.max(img.naturalWidth || 1, img.naturalHeight || 1));
    const width = Math.max(1, Math.round((img.naturalWidth || maxDim) * scale));
    const height = Math.max(1, Math.round((img.naturalHeight || maxDim) * scale));

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Browser canvas context unavailable for image optimization.');
    }
    ctx.drawImage(img, 0, 0, width, height);

    for (const quality of [0.88, 0.78, 0.68, 0.56]) {
      const blob = await canvasToBlob(canvas, targetMime, quality);
      if (blob && blob.size <= MAX_UPLOAD_BINARY_BYTES) {
        return { blob, mimeType: targetMime, ext: targetExt };
      }
    }
    maxDim = Math.round(maxDim * 0.75);
  }

  throw new Error(`"${file.name}" remains larger than 3.0 MB after optimization. Please choose a smaller file.`);
}

export async function prepareMediaUploadPayload(
  file: File,
  options: { allowDocuments?: boolean } = {},
): Promise<PreparedMediaPayload> {
  if (!isSupportedMediaFile(file, Boolean(options.allowDocuments))) {
    throw new Error(
      `Unsupported file type for "${file.name}". Please upload a supported image or video file.`,
    );
  }

  const detectedMime = inferMediaMimeType(file) || 'image/jpeg';
  const isCompressibleRaster =
    detectedMime === 'image/jpeg' || detectedMime === 'image/png' || detectedMime === 'image/webp';

  if (file.size > OPTIMIZE_THRESHOLD_BYTES && isCompressibleRaster) {
    const optimized = await optimizeOversizedRasterImage(file, detectedMime);
    const dataUrl = await readFileAsDataUrl(optimized.blob);
    const baseName = file.name.replace(/\.[^/.]+$/, '');
    return {
      dataUrl,
      name: `${baseName}.${optimized.ext}`,
      mimeType: optimized.mimeType,
      sizeFormatted: formatFileSize(optimized.blob.size),
    };
  }

  if (file.size > MAX_UPLOAD_BINARY_BYTES) {
    throw new Error(
      `"${file.name}" (${formatFileSize(file.size)}) exceeds the 3.0 MB upload limit. Please compress it before uploading.`,
    );
  }

  const dataUrl = await readFileAsDataUrl(file);
  return {
    dataUrl,
    name: file.name,
    mimeType: detectedMime,
    sizeFormatted: formatFileSize(file.size),
  };
}
