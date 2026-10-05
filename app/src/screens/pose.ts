import { copy, fill } from '../content';
import { detectFace, preloadFaceDetector } from '../face';
import { loadImage, prepareImage } from '../image';
import { state, update } from '../state';
import { h, primary, stepChrome } from '../ui';
import type { Go } from './types';

const CAMERA_SVG =
  '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 8h3l2-3h6l2 3h3v11H4z"/><circle cx="12" cy="13" r="3.5"/></svg>';

/** How long "Face found" shows before moving on to step 04. */
const ADVANCE_MS = 1200;

export function pose(go: Go): HTMLElement {
  preloadFaceDetector();

  let run = 0; // ignore results from an older photo
  // A photo taken on this visit moves on by itself once it passes. Next only shows
  // when the visitor comes back to a photo that already passed, to keep it.
  let fresh = false;
  const photoBox = h('div', { class: 'photo' });
  const status = h('div', { class: 'face-status', 'aria-live': 'polite' });
  const next = primary(copy.pose.cta, () => go('classic'));

  // Two inputs: the front camera, and the library (no capture attribute).
  const cameraInput = h('input', { id: 'cam', type: 'file', accept: 'image/*', capture: 'user', class: 'visually-hidden' });
  const libraryInput = h('input', { id: 'lib', type: 'file', accept: 'image/*', class: 'visually-hidden' });
  const cameraLabel = h('label', { for: 'cam', class: 'secondary' });
  const libraryLabel = h('label', { for: 'lib', class: 'link' }, copy.pose.library);

  // "unavailable" = the model could not load: let them through, Cloudinary's faces check is the backstop.
  const accepted = () => state.faceStatus === 'found' || state.faceStatus === 'unavailable';

  const render = () => {
    const hasPhoto = !!state.photo;
    photoBox.replaceChildren(
      hasPhoto
        ? h('img', { src: state.photo, alt: '', width: state.photoW, height: state.photoH })
        : h('span', { class: 'photo-empty', 'aria-hidden': 'true', html: CAMERA_SVG.replace(/22/g, '48') }),
    );
    photoBox.classList.toggle('found', state.faceStatus === 'found');
    photoBox.classList.toggle('none', state.faceStatus === 'none');

    if (state.faceStatus === 'checking') status.replaceChildren(h('span', { class: 'spinner', role: 'status', 'aria-label': 'Checking' }));
    else if (state.faceStatus === 'found')
      status.replaceChildren(h('p', { class: 'ok' }, fill(copy.pose.success, { first: state.first })));
    else if (state.faceStatus === 'none')
      status.replaceChildren(h('p', { class: 'fail-title' }, copy.pose.failTitle), h('p', { class: 'fail-body' }, copy.pose.failBody));
    else status.replaceChildren();

    cameraLabel.innerHTML = '';
    cameraLabel.append(h('span', { 'aria-hidden': 'true', html: CAMERA_SVG }), hasPhoto || state.faceStatus === 'none' ? copy.pose.retake : copy.pose.takeSelfie);
    next.disabled = !hasPhoto || !accepted();
    next.hidden = fresh || next.disabled;
  };

  const check = async () => {
    const mine = ++run;
    update({ faceStatus: 'checking', face: null });
    render();
    const img = await loadImage(state.photo).catch(() => null);
    const r = img ? await detectFace(img) : ({ status: 'none' } as const);
    if (mine !== run) return;
    if (r.status === 'found') update({ faceStatus: 'found', face: r.box });
    else update({ faceStatus: r.status, face: null });
    render();
    if (fresh && accepted()) {
      setTimeout(() => {
        // A retake or Back in the meantime cancels it.
        if (mine === run && photoBox.isConnected) go('classic');
      }, ADVANCE_MS);
    }
  };

  const onFile = async (input: HTMLInputElement) => {
    const file = input.files?.[0];
    input.value = ''; // allow picking the same file again
    if (!file) return;
    fresh = true;
    const mine = ++run;
    update({ faceStatus: 'checking' });
    render();
    try {
      const p = await prepareImage(file);
      if (mine !== run) return;
      update({ photo: p.dataUrl, photoW: p.width, photoH: p.height, face: null });
      await check();
    } catch {
      update({ photo: '', faceStatus: 'none', face: null });
      render();
    }
  };
  cameraInput.addEventListener('change', () => onFile(cameraInput));
  libraryInput.addEventListener('change', () => onFile(libraryInput));

  render();
  if (state.photo && state.faceStatus === 'idle') check();

  return h(
    'main',
    { class: 'screen pose' },
    stepChrome(2, () => go('who')),
    h('h1', { tabindex: -1 }, copy.pose.title),
    h('p', { class: 'lead' }, copy.pose.body),
    photoBox,
    status,
    cameraInput,
    libraryInput,
    h('div', { class: 'actions' }, h('div', { class: 'capture' }, cameraLabel, libraryLabel), next),
  );
}
