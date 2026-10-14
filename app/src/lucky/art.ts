import type { PathId } from './types';

// Tile pictures for the categories. Colours come from classes in lucky.css
// (f = card fill, s = outline, a = accent fill, al = accent line), so they follow the theme.

const svg = (body: string) => `<svg viewBox="0 0 120 120" fill="none" stroke-linecap="round" stroke-linejoin="round">${body}</svg>`;

export const ART: Record<PathId, string> = {
  // A shopping bag with a price tag.
  ecommerce: svg(`
    <path class="s" d="M42 42v-8a18 18 0 0 1 36 0v8"/>
    <rect class="f" x="20" y="42" width="80" height="64" rx="12"/>
    <path class="s" d="M42 54v4M78 54v4"/>
    <g transform="rotate(-18 82 88)">
      <path class="a" d="M66 78h26a4 4 0 0 1 4 4v12a4 4 0 0 1-4 4H66l-10-10z"/>
      <circle class="hole" cx="66" cy="88" r="3"/>
      <path class="ink" d="M76 88h12"/>
    </g>`),
  // A browser window with a post: picture, title and lines.
  blog: svg(`
    <rect class="f" x="12" y="18" width="96" height="84" rx="12"/>
    <path class="s" d="M12 34h96"/>
    <circle class="a" cx="24" cy="26" r="3"/><circle class="s-dot" cx="34" cy="26" r="3"/><circle class="s-dot" cx="44" cy="26" r="3"/>
    <rect class="a" x="22" y="44" width="36" height="28" rx="5"/>
    <path class="ink-on-a" d="M26 68l9-10 7 7 5-5 8 8"/>
    <path class="al" d="M66 48h32"/>
    <path class="s" d="M66 58h28M66 66h22M22 82h76M22 92h56"/>`),
  // A doc page with headings and a text cursor.
  doc: svg(`
    <path class="f" d="M30 10h44l24 24v72a6 6 0 0 1-6 6H30a6 6 0 0 1-6-6V16a6 6 0 0 1 6-6z"/>
    <path class="s" d="M74 10v24h24"/>
    <path class="al" d="M36 46h30"/>
    <path class="s" d="M36 56h50M36 64h42"/>
    <path class="al" d="M36 80h22"/>
    <path class="s" d="M36 90h34"/>
    <path class="al cursor" d="M76 84v14"/>`),
};
