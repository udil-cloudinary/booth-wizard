import { uploadVisitor } from '../cloudinary';
import { isSurprise } from '../config';
import { copy, OWN_ANSWER, OWN_MAX, PRODUCTS } from '../content';
import { dataUrlToBlob } from '../image';
import { createPreview } from '../labelPreview';
import { state, update } from '../state';
import { publicIdFor, slug, variantFor } from '../text';
import { art, h, primary, stepChrome } from '../ui';
import type { Go } from './types';

export function favourite(go: Go): HTMLElement {
  const type = state.type!;
  const p = PRODUCTS[type];
  // The surprise variation never shows the personalised product before the booth.
  const showPreview = !isSurprise();
  const preview = createPreview();
  let busy = false;
  let failed = false; // the last upload failed: the button stays as Retry

  const next = primary(copy.favourite.cta, () => submit());
  const nextLabel = next.querySelector('.label')!;
  const bar = h('span', { class: 'fill', 'aria-hidden': 'true' });
  next.prepend(bar);

  const ownInput = h('input', {
    id: 'own',
    type: 'text',
    class: 'field own-field',
    maxlength: OWN_MAX,
    autocomplete: 'off',
    autocapitalize: 'words',
    enterkeyhint: 'done',
    'aria-label': copy.favourite.writeOwn,
  });
  ownInput.value = state.ownText;
  const ownWrap = h('div', { class: 'own-wrap' }, ownInput, h('span', { class: 'count', 'aria-hidden': 'true' }));

  const chipButtons = p.chips.map((c) =>
    h('button', { type: 'button', class: 'chip', onclick: (() => chooseChip(c)) as EventListener }, c),
  );
  const ownChip = h('button', { type: 'button', class: 'chip own', onclick: (() => chooseOwn()) as EventListener }, copy.favourite.writeOwn);

  const current = () => {
    const favorite = state.ownActive ? state.ownText.trim() : state.favorite;
    const variant = state.ownActive ? variantFor(type, favorite, true) : favorite ? slug(favorite) : '';
    return { favorite, variant };
  };

  const render = () => {
    chipButtons.forEach((b, i) => b.setAttribute('aria-pressed', String(!state.ownActive && state.favorite === p.chips[i])));
    ownChip.setAttribute('aria-pressed', String(state.ownActive));
    ownWrap.hidden = !state.ownActive;
    (ownWrap.querySelector('.count') as HTMLElement).textContent = `${ownInput.value.length}/${OWN_MAX}`;
    const { favorite, variant } = current();
    if (showPreview && (state.ownActive || favorite)) {
      // While "Write your own" is active the art stays own-answer until the text matches a chip.
      preview.show(art(type, variant || OWN_ANSWER), favorite);
    }
    next.disabled = busy || !favorite;
    // A chip tap uploads straight away, so the button only shows for a typed
    // answer, during the upload (it carries the progress) and as Retry.
    next.hidden = !(state.ownActive || busy || failed);
  };

  const chooseChip = (c: string) => {
    if (busy) return;
    update({ favorite: c, ownActive: false });
    render();
    void submit();
  };
  const chooseOwn = () => {
    if (busy) return;
    update({ ownActive: true, favorite: '' });
    render();
    ownInput.focus();
  };
  ownInput.addEventListener('input', () => {
    update({ ownText: ownInput.value.slice(0, OWN_MAX) });
    render();
  });
  ownInput.addEventListener('keydown', (e) => {
    if (e.key !== 'Enter') return;
    ownInput.blur();
    void submit();
  });

  const setProgress = (f: number) => {
    bar.style.transform = `scaleX(${f})`;
  };

  async function submit() {
    const { favorite, variant } = current();
    if (!favorite || busy) return;
    busy = true;
    next.classList.add('uploading');
    next.setAttribute('aria-busy', 'true');
    nextLabel.textContent = copy.favourite.cta;
    setProgress(0);
    render();
    const publicId = publicIdFor(state.name, state.emailPrefix);
    try {
      const res = await uploadVisitor(
        {
          photo: dataUrlToBlob(state.photo),
          publicId,
          visitorName: state.name,
          firstName: state.first,
          email: state.email,
          productType: type,
          variant,
          favorite,
        },
        setProgress,
      );
      if (res.faces && !res.faces.length) {
        // Cloudinary is the backstop: no face, back to the selfie. The retake is a fresh upload.
        // A preset without face detection returns no `faces` at all: then the browser check stands.
        update({ faceStatus: 'none', face: null });
        go('pose');
        return;
      }
      update({ publicId: res.public_id, favorite });
      go('done');
    } catch {
      busy = false;
      failed = true;
      next.classList.remove('uploading');
      next.removeAttribute('aria-busy');
      setProgress(0);
      nextLabel.textContent = copy.favourite.retry;
      render();
    }
  }

  render();

  return h(
    'main',
    { class: 'screen favourite' },
    stepChrome(4, () => !busy && go('classic')),
    h('h1', { tabindex: -1 }, p.question),
    h('p', { class: 'lead' }, copy.favourite.helper),
    h('div', { class: 'chips', role: 'group', 'aria-label': p.question }, ...chipButtons, ownChip),
    ownWrap,
    showPreview ? preview.root : null,
    h('div', { class: 'actions' }, next),
  );
}
