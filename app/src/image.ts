import type { FaceBox } from './state';

const MAX_SIDE = 1600;
const QUALITY = 0.85;

export interface Prepared {
  dataUrl: string;
  width: number;
  height: number;
}

export function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.decoding = 'async';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('decode'));
    img.src = src;
  });
}

/**
 * Downscale to max 1600 px on the long side and re-encode as JPEG 0.85.
 * Drawing an <img> into a canvas applies EXIF orientation in iOS Safari 16+
 * and Chrome, and turns HEIC (which iOS decodes) into JPEG.
 */
export async function prepareImage(file: File): Promise<Prepared> {
  const url = URL.createObjectURL(file);
  try {
    const img = await loadImage(url);
    const w0 = img.naturalWidth;
    const h0 = img.naturalHeight;
    const scale = Math.min(1, MAX_SIDE / Math.max(w0, h0));
    const width = Math.round(w0 * scale);
    const height = Math.round(h0 * scale);
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('canvas');
    ctx.drawImage(img, 0, 0, width, height);
    return { dataUrl: canvas.toDataURL('image/jpeg', QUALITY), width, height };
  } finally {
    URL.revokeObjectURL(url);
  }
}

export function dataUrlToBlob(dataUrl: string): Blob {
  const [head, b64] = dataUrl.split(',');
  const mime = /data:([^;]+)/.exec(head)?.[1] || 'image/jpeg';
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return new Blob([bytes], { type: mime });
}

/**
 * CSS background for a round sticker of `size` px showing the photo,
 * centred on the face if we have a box, otherwise centred on the image.
 */
export function stickerStyle(
  el: HTMLElement,
  photo: string,
  w: number,
  h: number,
  face: FaceBox | null,
  size: number,
): void {
  el.style.backgroundImage = `url("${photo}")`;
  if (!face || !w || !h) {
    el.style.backgroundSize = 'cover';
    el.style.backgroundPosition = 'center 30%';
    return;
  }
  // Face box width fills ~60% of the sticker, but the photo always covers it.
  const faceSide = Math.max(face.w * w, face.h * h);
  let scale = (size * 0.6) / faceSide;
  scale = Math.max(scale, size / Math.min(w, h));
  const bw = w * scale;
  const bh = h * scale;
  const cx = (face.x + face.w / 2) * bw;
  const cy = (face.y + face.h / 2) * bh;
  const px = Math.min(0, Math.max(size - bw, size / 2 - cx));
  const py = Math.min(0, Math.max(size - bh, size / 2 - cy));
  el.style.backgroundSize = `${bw}px ${bh}px`;
  el.style.backgroundPosition = `${px}px ${py}px`;
}
