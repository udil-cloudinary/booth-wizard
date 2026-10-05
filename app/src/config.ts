const env = import.meta.env;

/** True in the "surprise" variation (set on <html data-mode> at startup). */
export const isSurprise = () => document.documentElement.dataset.mode === 'surprise';

export const config = {
  cloudName: (env.VITE_CLOUD_NAME as string) || 'your-booth-cloud',
  uploadPreset: (env.VITE_UPLOAD_PRESET as string) || 'booth_wizard',
  assetFolder: (env.VITE_ASSET_FOLDER as string) || 'booth/visitors',
  metaMode: ((env.VITE_META_MODE as string) === 'context' ? 'context' : 'metadata') as 'metadata' | 'context',
  mockUpload: env.VITE_MOCK_UPLOAD === 'true' || env.VITE_MOCK_UPLOAD === '1',
  faceModelUrl:
    (env.VITE_FACE_MODEL_URL as string) ||
    'https://storage.googleapis.com/mediapipe-models/face_detector/blaze_face_short_range/float16/1/blaze_face_short_range.tflite',
  // Accent theme: yellow (default) or blue (booth backdrop blue). Overridable with ?theme=blue|yellow.
  theme: ((env.VITE_THEME as string) === 'blue' ? 'blue' : 'yellow') as 'yellow' | 'blue',
  // Variation: surprise (default since 2026-10-05: no product preview; hero/cards without the
  // label area) or preview (live product preview on step 05). ?mode=preview|surprise overrides.
  mode: ((env.VITE_MODE as string) === 'preview' ? 'preview' : 'surprise') as 'preview' | 'surprise',
  // Fixed email domain: visitors only type the part before the @.
  emailDomain: 'cloudinary.com',
  faceModelTimeoutMs: 8000,
  uploadTimeoutMs: 30000,
  // Step 05: the progress runs at least this long, however fast the upload is,
  // then "Your product is ready" holds before the Done screen.
  minUploadMs: 5000,
  uploadReadyMs: 2000,
};
