import type { ProductType } from './content';

export type Step = 'welcome' | 'who' | 'pose' | 'classic' | 'favourite' | 'done';
export const STEPS: Step[] = ['welcome', 'who', 'pose', 'classic', 'favourite', 'done'];

/** Normalised (0..1) face box from the in-browser detector. */
export interface FaceBox {
  x: number;
  y: number;
  w: number;
  h: number;
}

export type FaceStatus = 'idle' | 'checking' | 'found' | 'none' | 'unavailable';

export interface State {
  step: Step;
  name: string; // full name as the visitor typed it (trimmed, single spaces)
  first: string;
  emailPrefix: string; // what the visitor typed before the fixed @domain
  email: string; // full address, empty until the prefix is valid
  photo: string; // data URL, already downscaled JPEG
  photoW: number;
  photoH: number;
  face: FaceBox | null;
  faceStatus: FaceStatus;
  type: ProductType | null;
  favorite: string; // what the label prints
  ownActive: boolean;
  ownText: string;
  publicId: string;
}

const KEY = 'booth-wizard-v2';

const initial = (): State => ({
  step: 'welcome',
  name: '',
  first: '',
  emailPrefix: '',
  email: '',
  photo: '',
  photoW: 0,
  photoH: 0,
  face: null,
  faceStatus: 'idle',
  type: null,
  favorite: '',
  ownActive: false,
  ownText: '',
  publicId: '',
});

function load(): State {
  try {
    const raw = sessionStorage.getItem(KEY);
    if (raw) {
      const s = { ...initial(), ...JSON.parse(raw) } as State;
      // A check that was in flight when the page reloaded is re-run on screen 03.
      if (s.faceStatus === 'checking') s.faceStatus = 'idle';
      return s;
    }
  } catch {
    /* private mode or quota: memory only */
  }
  return initial();
}

export const state: State = load();

export function save(): void {
  try {
    sessionStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    // Quota exceeded (large photo): keep everything except the photo.
    try {
      sessionStorage.setItem(KEY, JSON.stringify({ ...state, photo: '', faceStatus: 'idle' }));
    } catch {
      /* ignore */
    }
  }
}

export function update(patch: Partial<State>): void {
  Object.assign(state, patch);
  save();
}

export function reset(): void {
  try {
    sessionStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
  Object.assign(state, initial());
}
