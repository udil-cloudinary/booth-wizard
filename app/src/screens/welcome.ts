import { copy, PRODUCT_TYPES, PRODUCTS } from '../content';
import { art, h, header, primary } from '../ui';
import type { Go } from './types';

export function welcome(go: Go): HTMLElement {
  return h(
    'main',
    { class: 'screen welcome' },
    header({ tricolore: true }),
    h(
      'div',
      { class: 'hero', 'aria-hidden': 'true' },
      ...PRODUCT_TYPES.map((t) => h('img', { src: art(t, PRODUCTS[t].heroArt), alt: '', width: 110, height: 183, fetchpriority: 'high' })),
    ),
    h('h1', { tabindex: -1 }, copy.welcome.title),
    h('p', { class: 'lead' }, copy.welcome.body),
    h('ul', { class: 'pills' }, ...copy.welcome.pills.map((p) => h('li', {}, p))),
    h('div', { class: 'actions' }, primary(copy.welcome.cta, () => go('who'))),
  );
}
