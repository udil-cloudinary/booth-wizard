import { confetti } from '../confetti';
import { copy, fill, PRODUCTS } from '../content';
import { reset, state } from '../state';
import { h, header } from '../ui';
import type { Go } from './types';

// Intro pace: "Grazie" first, then one word every 300 ms (about 200 words a minute,
// an easy reading speed), then the full sentence holds before the stations.
const WORDS_AFTER_MS = 600; // the sentence starts once "Grazie, {first}!" is in
const WORD_STAGGER_MS = 300;
const WORD_IN_MS = 500; // .word animation in styles.css
const HOLD_MS = 3000;
const HINT_AFTER_MS = 900; // carousel hint: show card 2, then back to card 1
const HINT_BACK_MS = 1600;

// Station art, coloured by the theme through the classes in styles.css (.st-*).
const ART: Record<string, string> = {
  // A page in a CMS, the visitor's product found and dropping in from the Cloudinary cloud.
  everywhere: `<svg viewBox="0 0 280 160" xmlns="http://www.w3.org/2000/svg">
  <rect class="st-panel" x="22" y="20" width="176" height="122" rx="12"/>
  <circle class="st-dot" cx="38" cy="33" r="3.2"/><circle class="st-dot" cx="49" cy="33" r="3.2"/><circle class="st-dot" cx="60" cy="33" r="3.2"/>
  <rect class="st-ink" x="38" y="50" width="70" height="9" rx="4.5"/>
  <rect class="st-soft" x="38" y="68" width="58" height="5" rx="2.5"/>
  <rect class="st-soft" x="38" y="79" width="50" height="5" rx="2.5"/>
  <rect class="st-soft" x="38" y="90" width="56" height="5" rx="2.5"/>
  <rect class="st-soft" x="38" y="101" width="44" height="5" rx="2.5"/>
  <rect class="st-accent" x="38" y="116" width="40" height="12" rx="6"/>
  <rect class="st-slot" x="112" y="50" width="70" height="78" rx="9"/>
  <rect class="st-kraft" x="119" y="57" width="56" height="64" rx="6"/>
  <circle class="st-face" cx="147" cy="83" r="13"/>
  <rect class="st-label" x="129" y="103" width="36" height="5" rx="2.5"/>
  <path class="st-cloud" d="M222 62h34a14 14 0 0 0 1-28 20 20 0 0 0-38-4 13 13 0 0 0 3 32z"/>
  <path class="st-path" d="M232 68c-6 26-22 40-44 44"/>
  <path class="st-head" d="M193 106l-7 6 9 3"/>
  <path class="st-spark" d="M206 128l2 5 5 2-5 2-2 5-2-5-5-2 5-2z"/>
  <path class="st-spark" d="M100 34l1.5 3.5 3.5 1.5-3.5 1.5-1.5 3.5-1.5-3.5-3.5-1.5 3.5-1.5z"/>
</svg>`,
  // A chat with an agent, and the magnet it builds.
  agent: `<svg viewBox="0 0 280 160" xmlns="http://www.w3.org/2000/svg">
  <rect class="st-panel" x="22" y="18" width="156" height="124" rx="14"/>
  <rect class="st-accent" x="84" y="32" width="80" height="24" rx="12"/>
  <rect class="st-on-accent" x="96" y="41" width="40" height="6" rx="3"/>
  <circle class="st-avatar" cx="42" cy="84" r="10"/>
  <path class="st-on-accent" d="M42 78l1.6 4.4 4.4 1.6-4.4 1.6-1.6 4.4-1.6-4.4-4.4-1.6 4.4-1.6z"/>
  <rect class="st-bubble" x="58" y="68" width="104" height="46" rx="13"/>
  <rect class="st-soft" x="70" y="80" width="72" height="5" rx="2.5"/>
  <rect class="st-soft" x="70" y="91" width="56" height="5" rx="2.5"/>
  <circle class="st-type" cx="72" cy="104" r="2.6"/><circle class="st-type" cx="81" cy="104" r="2.6"/><circle class="st-type" cx="90" cy="104" r="2.6"/>
  <circle class="st-ring" cx="226" cy="84" r="40"/>
  <circle class="st-kraft" cx="226" cy="84" r="34"/>
  <circle class="st-face" cx="226" cy="74" r="14"/>
  <rect class="st-label" x="208" y="96" width="36" height="6" rx="3"/>
  <rect class="st-label" x="214" y="106" width="24" height="4" rx="2"/>
  <path class="st-spark" d="M262 36l2 5 5 2-5 2-2 5-2-5-5-2 5-2z"/>
  <path class="st-spark" d="M188 128l1.5 3.5 3.5 1.5-3.5 1.5-1.5 3.5-1.5-3.5-3.5-1.5 3.5-1.5z"/>
</svg>`,
};

const reducedMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

export function done(go: Go): HTMLElement {
  const type = state.type ? PRODUCTS[state.type].lower : '';
  const answer = state.ownActive ? state.ownText.trim() : state.favorite;
  const still = reducedMotion();

  // 1. Intro: the sentence fills the screen word by word (answer and type highlighted), then holds.
  const tokens = copy.done.saved.split(' ').flatMap((t) =>
    t === '{answer}' ? answer.split(/\s+/).map((w) => ({ w, em: true })) : t === '{type}' ? [{ w: type, em: true }] : [{ w: t, em: false }],
  );
  const words: (Node | string)[] = [];
  tokens.forEach((t, i) => {
    if (i) words.push(' ');
    words.push(h('span', { class: t.em ? 'word em' : 'word', style: `animation-delay:${WORDS_AFTER_MS + i * WORD_STAGGER_MS}ms` }, t.w));
  });
  const intro = h(
    'div',
    { class: 'done-intro', 'aria-hidden': 'true' },
    h('p', { class: 'intro-hi word' }, fill(copy.done.title, { first: state.first })),
    h('p', { class: 'intro-text' }, ...words),
  );

  // 2. Stations carousel: Everywhere first, the second card peeks in from the side.
  const cards = copy.done.stations.map((s) =>
    h('li', { class: 'station-card' }, h('div', { class: 'station-art', 'aria-hidden': 'true', html: ART[s.id] }), h('h2', {}, s.name), h('p', {}, s.body)),
  );
  const track = h('ul', { class: 'carousel', 'aria-label': copy.done.stationsLabel }, ...cards);
  const dots = cards.map(() => h('span', { class: 'dot' }));
  const step = () => cards[1].offsetLeft - cards[0].offsetLeft;
  const setDot = (i: number) => dots.forEach((d, j) => d.classList.toggle('on', j === i));
  const markActive = () => setDot(Math.round(track.scrollLeft / (step() || 1)));
  track.addEventListener('scroll', markActive, { passive: true });
  // The dot follows the target at once: the last scroll event of a smooth scroll can be missed.
  const show = (i: number) => {
    setDot(i);
    track.scrollTo({ left: i * step(), behavior: 'smooth' });
  };

  // The hint plays once, and stops as soon as the visitor touches the carousel.
  let hinting = !still;
  const stopHint = () => (hinting = false);
  track.addEventListener('pointerdown', stopHint);
  track.addEventListener('wheel', stopHint, { passive: true });
  const playHint = () => {
    setTimeout(() => {
      if (!hinting || !track.isConnected) return;
      show(1);
      setTimeout(() => hinting && track.isConnected && show(0), HINT_BACK_MS);
    }, HINT_AFTER_MS);
  };

  const main = h(
    'div',
    { class: 'done-main' },
    header(),
    h('h1', { tabindex: -1 }, fill(copy.done.title, { first: state.first })),
    // The intro is hidden from screen readers, so its sentence is read here.
    h('p', { class: 'lead' }, h('span', { class: 'visually-hidden' }, fill(copy.done.saved, { answer, type }) + ' '), copy.done.body),
    track,
    h('div', { class: 'dots', 'aria-hidden': 'true' }, ...dots),
    h(
      'div',
      { class: 'done-foot' },
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
    ),
  );

  const root = h('main', { class: 'screen done is-intro' }, intro, main);

  const endIntro = () => {
    if (!root.classList.contains('is-intro')) return;
    root.classList.remove('is-intro');
    setTimeout(() => intro.remove(), 400);
    markActive();
    playHint();
  };
  intro.addEventListener('click', endIntro); // a tap skips the intro
  const introMs = (still ? 0 : WORDS_AFTER_MS + (tokens.length - 1) * WORD_STAGGER_MS + WORD_IN_MS) + HOLD_MS;
  setTimeout(() => root.isConnected && endIntro(), introMs);
  requestAnimationFrame(() => root.isConnected && confetti(root));

  return root;
}
