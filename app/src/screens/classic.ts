import { copy, PRODUCT_TYPES, PRODUCTS, type ProductType } from '../content';
import { state, update } from '../state';
import { slug } from '../text';
import { isSurprise } from '../config';
import { art, CHECK_SVG, h, primary, productArt, stepChrome } from '../ui';
import type { Go } from './types';

const preloaded = new Set<ProductType>();

/** Warm the cache with the 6 preview images of the chosen type. */
function preloadType(t: ProductType) {
  // The surprise variation shows no preview art on step 05.
  if (preloaded.has(t) || isSurprise()) return;
  preloaded.add(t);
  const variants = [...PRODUCTS[t].chips.map(slug), 'own-answer'];
  for (const v of variants) {
    const i = new Image();
    i.src = art(t, v);
  }
}

export function classic(go: Go): HTMLElement {
  const next = primary(copy.classic.cta, () => go('favourite'), !state.type);
  if (state.type) preloadType(state.type);

  const cards = PRODUCT_TYPES.map((t) => {
    const p = PRODUCTS[t];
    const input = h('input', { type: 'radio', name: 'type', value: t, id: `type-${t}`, class: 'visually-hidden' });
    input.checked = state.type === t;
    input.addEventListener('change', () => {
      // A new type means a new favourite.
      if (state.type !== t) update({ type: t, favorite: '', ownActive: false, ownText: '' });
      preloadType(t);
      next.disabled = false;
    });
    return h(
      'label',
      { class: 'card', for: `type-${t}` },
      input,
      (() => {
        const a = productArt(t);
        return h('img', { src: a.src, alt: '', width: a.w, height: a.h });
      })(),
      h('span', { class: 'card-text' }, h('span', { class: 'card-title' }, p.label), h('span', { class: 'card-sub' }, p.tagline)),
      h('span', { class: 'check', 'aria-hidden': 'true', html: CHECK_SVG }),
    );
  });

  return h(
    'main',
    { class: 'screen classic' },
    stepChrome(3, () => go('pose')),
    h('h1', { tabindex: -1 }, copy.classic.title),
    h('p', { class: 'lead' }, copy.classic.body),
    h('fieldset', { class: 'cards' }, h('legend', { class: 'visually-hidden' }, copy.classic.title), ...cards),
    h('div', { class: 'actions' }, next),
  );
}
