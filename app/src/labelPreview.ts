import { copy } from './content';
import { stickerStyle } from './image';
import { state } from './state';
import { fitText, h } from './ui';

const STICKER = 64;

/** Screen 05 live product preview: the product art plus the kraft label drawn in HTML. */
export function createPreview() {
  const img = h('img', { class: 'preview-art', alt: '', width: 170, height: 283 });
  const sticker = h('div', { class: 'sticker', role: 'img', 'aria-label': 'Your selfie' });
  const name = h('div', { class: 'label-name' });
  const fav = h('div', { class: 'label-fav' });
  const card = h(
    'div',
    { class: 'label-card' },
    h('div', { class: 'label-caption' }, copy.favourite.previewCaption),
    sticker,
    name,
    fav,
    h('div', { class: 'label-note' }, copy.favourite.previewNote),
  );
  const root = h('div', { class: 'preview', 'aria-live': 'polite', hidden: true }, h('div', { class: 'preview-art-wrap' }, img), card);

  const fit = () => {
    fitText(name, 24);
    fitText(fav, 17);
  };

  function show(artSrc: string, favorite: string) {
    root.hidden = false;
    if (img.getAttribute('src') !== artSrc) {
      img.src = artSrc;
      img.classList.remove('swap');
      void img.offsetWidth; // restart the swap animation
      img.classList.add('swap');
    }
    name.textContent = state.first.toLocaleUpperCase();
    fav.textContent = favorite;
    img.alt = favorite;
    if (state.photo) stickerStyle(sticker, state.photo, state.photoW, state.photoH, state.face, STICKER);
    requestAnimationFrame(fit);
  }

  document.fonts?.ready.then(() => !root.hidden && fit());
  return { root, show };
}
