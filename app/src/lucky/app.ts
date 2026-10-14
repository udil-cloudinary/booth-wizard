import { backButton, badgeUrl, h, primary } from '../ui';
import { ART } from './art';
import { Deck, shuffle } from './deck';
import { shakeDetector } from './shake';
import type { PathId, Topic, TopicsFile } from './types';

export const PATHS: Record<PathId, { label: string; app: string; titleLabel: string; where: string }> = {
  ecommerce: { label: 'E-commerce', app: 'Shopify', titleLabel: 'Product title', where: 'Open a new product in Shopify' },
  blog: { label: 'Blog post', app: 'WordPress or Contentful', titleLabel: 'Post title', where: 'Open a new post in WordPress' },
  doc: { label: 'Document', app: 'Google Docs', titleLabel: 'Document title', where: 'Create a new Google Doc' },
};
const ORDER: PathId[] = ['ecommerce', 'blog', 'doc'];

/** Reel spin, then each card deals in this long after the one before it. */
const SPIN_MS = 1300;
const DEAL_MS = 340;
const DEAL_GAP_MS = 130;
/** Titles that spin past before the pick. */
const REEL_ITEMS = 14;
/** Smallest text scale when a long result has to fit a short screen. */
const MIN_SCALE = 0.6;

const reducedMotion = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
const fromHash = (): PathId | null => {
  const p = location.hash.slice(1);
  return (ORDER as string[]).includes(p) ? (p as PathId) : null;
};

const SPIN_SVG =
  '<svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M20 11a8 8 0 0 0-14.3-4.9L4 8"/><path d="M4 3v5h5"/><path d="M4 13a8 8 0 0 0 14.3 4.9L20 16"/><path d="M20 21v-5h-5"/></svg>';

/**
 * /feeling-lucky: the categories, then (#ecommerce, #blog, #doc) a random test
 * idea for the Chrome extension whose words match images in chrome-demo.
 */
export function mount(root: HTMLElement, data: TopicsFile, rand: () => number = Math.random): void {
  const decks = Object.fromEntries(
    ORDER.map((p) => [p, new Deck(data.paths[p].map((t) => t.id), `feeling-lucky-deck-${p}`, rand)]),
  ) as Record<PathId, Deck>;
  let path: PathId | null = null;
  let busy = false;
  /** Bumped when a spin is abandoned (Back mid-spin), so its late callbacks do nothing. */
  let gen = 0;
  /** True once this page pushed a history entry, so Back can pop it. */
  let pushed = false;
  let current: HTMLElement | null = null;

  const shake = shakeDetector(
    () => spin(),
    () => main.classList.add('can-shake'),
  );

  // ---------- Categories ----------
  const homeTitle = h('h1', { tabindex: -1 }, 'Need a ', h('em', {}, 'topic?'));
  const home = h(
    'section',
    { class: 'home' },
    h('header', { class: 'lucky-top' }, h('img', { src: badgeUrl, alt: '', width: 32, height: 32 }), homeTitle),
    h(
      'nav',
      { class: 'paths', 'aria-label': 'Where you test' },
      ...ORDER.map((p) =>
        h(
          'a',
          { class: `path path-${p}`, href: `#${p}`, onclick: ((e: Event) => (e.preventDefault(), pick(p))) as EventListener },
          h('span', { class: 'path-text' }, h('span', { class: 'path-label' }, PATHS[p].label), h('span', { class: 'path-app' }, `for ${PATHS[p].app}`)),
          h('span', { class: 'path-art', 'aria-hidden': 'true', html: ART[p] }),
        ),
      ),
    ),
  );

  // ---------- Topic ----------
  const catTitle = h('h1', { class: 'cat-title', tabindex: -1 });
  const stage = h('section', { class: 'stage', 'aria-live': 'polite' });
  const where = h('p', { class: 'where' });
  const again = primary('Spin again', () => {
    shake.ask();
    spin();
  });
  again.classList.add('spin');
  again.querySelector('.label')!.insertAdjacentHTML('afterbegin', `<span aria-hidden="true">${SPIN_SVG}</span>`);
  const topicView = h(
    'section',
    { class: 'topic', hidden: true },
    h('div', { class: 'topic-top' }, backButton(back), catTitle),
    stage,
    h('footer', { class: 'lucky-foot' }, where, again, h('p', { class: 'shake-hint' }, 'or shake your phone')),
  );

  const main = h('main', { class: 'lucky' }, home, topicView);
  root.replaceChildren(main);

  window.addEventListener('resize', () => current && !busy && fit(stage, current));
  window.addEventListener('popstate', route);
  route();

  function route() {
    const p = fromHash();
    if (p) show(p);
    else showHome();
  }

  function pick(p: PathId) {
    shake.ask();
    history.pushState(null, '', `#${p}`);
    pushed = true;
    show(p);
  }

  function back() {
    if (pushed) history.back(); // popstate brings the categories back
    else {
      // Opened straight on #doc (a shared link): nothing of ours to pop.
      history.replaceState(null, '', location.pathname + location.search);
      showHome();
    }
  }

  function show(p: PathId) {
    stopSpin();
    path = p;
    catTitle.replaceChildren(PATHS[p].label, ' ', h('span', {}, `for ${PATHS[p].app}`));
    where.textContent = PATHS[p].where;
    home.hidden = true;
    topicView.hidden = false;
    catTitle.focus({ preventScroll: true });
    spin();
  }

  function showHome() {
    stopSpin();
    path = null;
    current = null;
    stage.replaceChildren();
    topicView.hidden = true;
    home.hidden = false;
    homeTitle.focus({ preventScroll: true });
  }

  function stopSpin() {
    gen++;
    busy = false;
    main.classList.remove('spinning');
    for (const a of stage.getAnimations?.({ subtree: true }) ?? []) a.cancel();
  }

  function spin() {
    if (!path || busy) return;
    const topics = data.paths[path];
    if (!topics.length) {
      stage.replaceChildren(h('p', { class: 'lead' }, 'No ideas for this path yet.'));
      return;
    }
    const id = decks[path].next();
    const topic = topics.find((t) => t.id === id)!;
    const view = render(path, topic);
    current = view.el;
    stage.replaceChildren(view.el);
    fit(stage, view.el);

    if (reducedMotion() || typeof view.el.animate !== 'function') {
      view.el.animate?.([{ opacity: 0 }, { opacity: 1 }], { duration: 300, easing: 'ease-out' });
      return;
    }
    const g = ++gen;
    busy = true;
    main.classList.add('spinning');
    stage.setAttribute('aria-busy', 'true');
    for (const c of view.cards) c.style.opacity = '0';
    runReel(view.slot, view.titleBox, reelTitles(topics, topic, rand), topic.title)
      .then(() => {
        if (g !== gen) return;
        buzz();
        return deal(view.cards);
      })
      .finally(() => {
        if (g !== gen) return;
        busy = false;
        main.classList.remove('spinning');
        stage.setAttribute('aria-busy', 'false');
      });
  }
}

function render(path: PathId, topic: Topic) {
  const titleBox = h('span', { class: 'title-box' }, h('span', { class: 'title-text' }, topic.title));
  const slot = h('h2', { class: 'slot' }, titleBox);
  const cards =
    path === 'ecommerce'
      ? [h('div', { class: 'deal' }, h('p', { class: 'deal-label' }, 'Description'), h('p', { class: 'deal-text' }, topic.description ?? ''))]
      : (topic.sections ?? []).map((s) =>
          h('div', { class: 'deal' }, h('h3', { class: 'deal-head' }, s.heading), h('p', { class: 'deal-text' }, s.text)),
        );
  const el = h('div', { class: 'result' }, h('p', { class: 'slot-label' }, PATHS[path].titleLabel), slot, h('div', { class: 'cards' }, ...cards));
  return { el, slot, titleBox, cards };
}

/** Shrink the result's text (the --k scale) until it fits the stage with no scrolling. */
function fit(stage: HTMLElement, el: HTMLElement) {
  let k = 1;
  el.style.setProperty('--k', '1');
  while (k > MIN_SCALE && stage.scrollHeight > stage.clientHeight + 1) {
    k -= 0.04;
    el.style.setProperty('--k', k.toFixed(2));
  }
}

/** Other titles on the same path, in random order, to spin past before the pick. */
function reelTitles(topics: Topic[], pick: Topic, rand: () => number): string[] {
  const others = topics.filter((t) => t.id !== pick.id).map((t) => t.title);
  const pool = others.length ? others : [pick.title];
  const out: string[] = [];
  while (out.length < REEL_ITEMS) out.push(...shuffle(pool, rand));
  return out.slice(0, REEL_ITEMS);
}

/** Spin the titles past like a slot-machine reel, slow down, overshoot a little and settle on the pick. */
function runReel(slot: HTMLElement, box: HTMLElement, fillers: string[], final: string): Promise<void> {
  const itemH = box.clientHeight;
  const strip = h('span', { class: 'reel-strip' }, ...[...fillers, final].map((t) => h('span', { class: 'reel-item' }, h('span', {}, t))));
  strip.style.setProperty('--h', `${itemH}px`);
  const reel = h('span', { class: 'reel', 'aria-hidden': 'true' }, strip);
  slot.classList.add('rolling');
  box.append(reel);
  const end = -fillers.length * itemH;
  const anim = strip.animate(
    [
      { transform: 'translateY(0)', filter: 'blur(1.5px)', easing: 'cubic-bezier(0.2, 0.5, 0.3, 1)' },
      { offset: 0.86, transform: `translateY(${end - itemH * 0.14}px)`, filter: 'blur(0)', easing: 'ease-in-out' },
      { transform: `translateY(${end}px)`, filter: 'blur(0)' },
    ],
    { duration: SPIN_MS },
  );
  const done = () => {
    reel.remove();
    slot.classList.remove('rolling');
  };
  return anim.finished.then(done, done);
}

/** The cards fly in one by one, like a dealer's hand. */
function deal(cards: HTMLElement[]): Promise<void> {
  const anims = cards.map((c, i) => {
    c.style.opacity = '';
    return c.animate(
      [
        { opacity: 0, transform: 'translate(40px, 28px) rotate(7deg) scale(0.94)' },
        { opacity: 1, transform: 'none' },
      ],
      { duration: DEAL_MS, delay: i * DEAL_GAP_MS, easing: 'cubic-bezier(0.2, 0.9, 0.3, 1.15)', fill: 'backwards' },
    );
  });
  return Promise.all(anims.map((a) => a.finished)).then(
    () => {},
    () => {},
  );
}

/** A short buzz when the reel stops. Android only; other browsers have no vibrate. */
function buzz() {
  try {
    navigator.vibrate?.(30);
  } catch {
    // Blocked (no user gesture yet, or a policy): no buzz.
  }
}
