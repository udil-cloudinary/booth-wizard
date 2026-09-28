const env = import.meta.env;

export const config = {
  cloudName: (env.VITE_CLOUD_NAME as string) || 'your-booth-cloud',
  uploadPreset: (env.VITE_UPLOAD_PRESET as string) || 'booth_wizard',
  assetFolder: (env.VITE_ASSET_FOLDER as string) || 'booth/visitors',
  metaMode: ((env.VITE_META_MODE as string) === 'context' ? 'context' : 'metadata') as 'metadata' | 'context',
  mockUpload: env.VITE_MOCK_UPLOAD === 'true' || env.VITE_MOCK_UPLOAD === '1',
  faceModelUrl:
    (env.VITE_FACE_MODEL_URL as string) ||
    'https://storage.googleapis.com/mediapipe-models/face_detector/blaze_face_short_range/float16/1/blaze_face_short_range.tflite',
  // Fixed email domain: visitors only type the part before the @.
  emailDomain: 'cloudinary.com',
  faceModelTimeoutMs: 8000,
  uploadTimeoutMs: 30000,
};
