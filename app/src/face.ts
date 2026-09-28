import { config } from './config';
import type { FaceBox } from './state';

export type FaceResult = { status: 'found'; box: FaceBox } | { status: 'none' } | { status: 'unavailable' };

type Detector = { detect(img: HTMLImageElement): { detections: { boundingBox?: { originX: number; originY: number; width: number; height: number } }[] } };

let detectorPromise: Promise<Detector | null> | null = null;

function withTimeout<T>(p: Promise<T>, ms: number): Promise<T | null> {
  return Promise.race([p, new Promise<null>((r) => setTimeout(() => r(null), ms))]);
}

/** Lazy: loads the MediaPipe runtime and model the first time screen 03 opens. */
export function preloadFaceDetector(): Promise<Detector | null> {
  if (!detectorPromise) {
    const load = (async () => {
      const { FaceDetector, FilesetResolver } = await import('@mediapipe/tasks-vision');
      const wasmBase = new URL('mediapipe/wasm', document.baseURI).href;
      const fileset = await FilesetResolver.forVisionTasks(wasmBase);
      const modelUrl = new URL(config.faceModelUrl, document.baseURI).href;
      const make = (delegate: 'GPU' | 'CPU') =>
        FaceDetector.createFromOptions(fileset, {
          baseOptions: { modelAssetPath: modelUrl, delegate },
          runningMode: 'IMAGE',
          minDetectionConfidence: 0.5,
        });
      return (await make('CPU').catch(() => make('GPU'))) as unknown as Detector;
    })().catch((e) => {
      console.warn('Face detector unavailable', e);
      return null;
    });
    detectorPromise = withTimeout(load, config.faceModelTimeoutMs).then((d) => {
      // Let a later attempt retry if loading failed or was too slow.
      if (!d) detectorPromise = null;
      return d;
    });
  }
  return detectorPromise;
}

export async function detectFace(img: HTMLImageElement): Promise<FaceResult> {
  const detector = await preloadFaceDetector();
  if (!detector) return { status: 'unavailable' };
  try {
    const { detections } = detector.detect(img);
    const w = img.naturalWidth;
    const h = img.naturalHeight;
    const boxes = detections.map((d) => d.boundingBox).filter((b): b is NonNullable<typeof b> => !!b);
    if (!boxes.length) return { status: 'none' };
    const b = boxes.reduce((a, c) => (c.width * c.height > a.width * a.height ? c : a));
    return { status: 'found', box: { x: b.originX / w, y: b.originY / h, w: b.width / w, h: b.height / h } };
  } catch (e) {
    console.warn('Face detection failed', e);
    return { status: 'unavailable' };
  }
}
