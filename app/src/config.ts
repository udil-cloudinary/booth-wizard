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
  // Variation: preview (default, live product preview on step 05) or surprise
  // (no product preview; hero/cards without the label area). ?mode=preview|surprise overrides.
  mode: ((env.VITE_MODE as string) === 'surprise' ? 'surprise' : 'preview') as 'preview' | 'surprise',
  // Fixed email domain: visitors only type the part before the @.
  emailDomain: 'cloudinary.com',
  faceModelTimeoutMs: 8000,
  uploadTimeoutMs: 30000,
};
