import { copy } from './content';

type Attrs = Record<string, string | number | boolean | EventListener | undefined>;
type Child = Node | string | null | undefined | false;

/** Tiny DOM builder. Keys starting with "on" become listeners. */
export function h<K extends keyof HTMLElementTagNameMap>(tag: K, attrs: Attrs = {}, ...children: Child[]): HTMLElementTagNameMap[K] {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v === undefined || v === false) continue;
    if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2), v);
    else if (k === 'class') el.className = String(v);
    else if (k === 'html') el.innerHTML = String(v);
    else if (v === true) el.setAttribute(k, '');
    else el.setAttribute(k, String(v));
  }
  for (const c of children) if (c !== null && c !== undefined && c !== false) el.append(c);
  return el;
}

// Bundled by Vite with a content hash in the file name, so an updated image
// always gets a new URL and phones never show a stale cached copy.
const ART = import.meta.glob<string>('./art/*.webp', { eager: true, query: '?url', import: 'default' });
export const badgeUrl = ART['./art/badge.webp'];
export const art = (type: string, variant: string) => ART[`./art/product-base-${type}-${variant}.webp`];

export function header(opts: { tricolore?: boolean } = {}): HTMLElement {
  return h(
    'header',
    { class: 'top' },
    h(
      'div',
      { class: 'brand' },
      h('img', { src: badgeUrl, alt: '', width: 36, height: 36 }),
      h('span', {}, copy.brand + ' ', h('em', {}, copy.brandAccent)),
    ),
    opts.tricolore ? h('div', { class: 'tricolore', 'aria-hidden': 'true' }, h('i'), h('i'), h('i')) : null,
  );
}

/** 4 segments for screens 02 to 05; `current` is 1..4. */
export function progress(current: number): HTMLElement {
  const bar = h('div', {
    class: 'progress',
    role: 'progressbar',
    'aria-valuemin': 1,
    'aria-valuemax': 4,
    'aria-valuenow': current,
    'aria-label': `Step ${current} of 4`,
  });
  for (let i = 1; i <= 4; i++) bar.append(h('span', { class: i <= current ? 'on' : '' }));
  return bar;
}

export function backButton(onClick: () => void): HTMLButtonElement {
  return h(
    'button',
    { class: 'back', type: 'button', onclick: onClick as EventListener },
    h('span', { 'aria-hidden': 'true', html: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M15 18l-6-6 6-6"/></svg>' }),
    copy.back,
  );
}

/** Top bar for steps 02 to 05: header, Back, progress. */
export function stepChrome(step: number, onBack: () => void): HTMLElement {
  return h('div', { class: 'chrome' }, header(), h('div', { class: 'nav' }, backButton(onBack), progress(step)));
}

export function primary(label: string, onClick: () => void, disabled = false): HTMLButtonElement {
  const b = h('button', { class: 'primary', type: 'button', onclick: onClick as EventListener }, h('span', { class: 'label' }, label));
  b.disabled = disabled;
  return b;
}

export const CHECK_SVG =
  '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';

/** Shrink an element's font size until its single line fits its box. */
export function fitText(el: HTMLElement, maxPx: number, minPx = 8): void {
  let size = maxPx;
  el.style.fontSize = `${size}px`;
  while (size > minPx && el.scrollWidth > el.clientWidth + 0.5) {
    size -= 0.5;
    el.style.fontSize = `${size}px`;
  }
}
