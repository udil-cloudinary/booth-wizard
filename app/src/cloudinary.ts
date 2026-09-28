// Every Cloudinary call the wizard makes lives here.
// ONE unsigned upload per attempt, at "Make my product", with all fields:
// an unsigned upload cannot change metadata afterwards.
import { config } from './config';
import type { ProductType } from './content';
import { toMetaString } from './text';

export interface VisitorUpload {
  photo: Blob;
  publicId: string;
  visitorName: string;
  firstName: string;
  email: string;
  productType: ProductType;
  variant: string;
  favorite: string;
}

export interface UploadResult {
  public_id: string;
  secure_url: string;
  faces: number[][];
}

export class UploadError extends Error {
  constructor(
    message: string,
    readonly kind: 'network' | 'timeout' | 'http',
    readonly status = 0,
  ) {
    super(message);
  }
}

export function uploadUrl(): string {
  return `https://api.cloudinary.com/v1_1/${encodeURIComponent(config.cloudName)}/image/upload`;
}

export function buildForm(v: VisitorUpload): FormData {
  const fields = {
    visitor_name: v.visitorName,
    first_name: v.firstName,
    email: v.email,
    product_type: v.productType,
    variant: v.variant,
    favorite: v.favorite,
    face_detected: 'true',
    tv_status: 'auto',
    print_status: 'none',
  };
  const form = new FormData();
  form.append('file', v.photo, `${v.publicId}.jpg`);
  form.append('upload_preset', config.uploadPreset);
  form.append('public_id', v.publicId);
  form.append('asset_folder', config.assetFolder);
  form.append('tags', `type-${v.productType}`); // the preset adds booth-visitor
  // VITE_META_MODE switch: structured metadata, or the same fields as context.
  form.append(config.metaMode, toMetaString(fields));
  return form;
}

export function uploadVisitor(v: VisitorUpload, onProgress: (fraction: number) => void): Promise<UploadResult> {
  if (config.mockUpload) return mockUpload(v, onProgress);
  const form = buildForm(v);
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', uploadUrl());
    xhr.timeout = config.uploadTimeoutMs;
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onProgress(e.loaded / e.total);
    };
    xhr.onload = () => {
      let body: unknown = null;
      try {
        body = JSON.parse(xhr.responseText);
      } catch {
        /* not JSON */
      }
      if (xhr.status >= 200 && xhr.status < 300 && body) {
        const r = body as Partial<UploadResult>;
        resolve({ public_id: r.public_id || v.publicId, secure_url: r.secure_url || '', faces: r.faces || [] });
      } else {
        const msg = (body as { error?: { message?: string } } | null)?.error?.message || `HTTP ${xhr.status}`;
        console.warn('Upload failed:', msg);
        reject(new UploadError(msg, 'http', xhr.status));
      }
    };
    xhr.onerror = () => reject(new UploadError('network', 'network'));
    xhr.ontimeout = () => reject(new UploadError('timeout', 'timeout'));
    xhr.send(form);
  });
}

/** VITE_MOCK_UPLOAD=true: no network, fake progress, one face. */
function mockUpload(v: VisitorUpload, onProgress: (f: number) => void): Promise<UploadResult> {
  console.info('[mock upload]', Object.fromEntries(buildForm(v).entries()));
  return new Promise((resolve) => {
    let p = 0;
    const t = setInterval(() => {
      p = Math.min(1, p + 0.12);
      onProgress(p);
      if (p >= 1) {
        clearInterval(t);
        resolve({ public_id: `${config.assetFolder}/${v.publicId}`, secure_url: '', faces: [[100, 100, 200, 200]] });
      }
    }, 120);
  });
}
