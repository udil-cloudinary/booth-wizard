import { copy, PRODUCT_TYPES } from '../content';
import { h, header, primary, productArt } from '../ui';
import type { Go } from './types';

export function welcome(go: Go): HTMLElement {
  return h(
    'main',
    { class: 'screen welcome' },
    header({ tricolore: true }),
    h(
      'div',
      { class: 'hero', 'aria-hidden': 'true' },
      ...PRODUCT_TYPES.map((t) => {
        const a = productArt(t);
        return h('img', { src: a.src, alt: '', width: a.w, height: a.h, fetchpriority: 'high' });
      }),
    ),
    h('h1', { tabindex: -1 }, copy.welcome.title),
    h('p', { class: 'lead' }, copy.welcome.body),
    h('ul', { class: 'pills' }, ...copy.welcome.pills.map((p) => h('li', {}, p))),
    h('div', { class: 'actions' }, primary(copy.welcome.cta, () => go('who'))),
  );
}
