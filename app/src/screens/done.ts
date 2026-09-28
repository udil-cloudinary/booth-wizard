import { copy, fill, PRODUCTS } from '../content';
import { reset, state } from '../state';
import { h, header } from '../ui';
import type { Go } from './types';

export function done(go: Go): HTMLElement {
  const type = state.type ? PRODUCTS[state.type].lower : '';
  const answer = state.ownActive ? state.ownText.trim() : state.favorite;
  return h(
    'main',
    { class: 'screen done' },
    header(),
    h('h1', { tabindex: -1 }, fill(copy.done.title, { first: state.first })),
    h('p', { class: 'lead' }, fill(copy.done.body, { answer, type })),
    h(
      'ul',
      { class: 'stations' },
      ...copy.done.stations.map((s) => h('li', { class: 'station' }, h('h2', {}, s.name), h('p', {}, s.body))),
    ),
    h('p', { class: 'collect' }, copy.done.collect),
    h('p', { class: 'ps' }, copy.done.ps),
    h(
      'div',
      { class: 'actions' },
      h(
        'button',
        {
          type: 'button',
          class: 'link',
          onclick: (() => {
            reset();
            go('welcome');
          }) as EventListener,
        },
        copy.done.startOver,
      ),
    ),
  );
}
