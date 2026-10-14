/** Fisher-Yates shuffle into a new array. */
export function shuffle<T>(xs: readonly T[], rand: () => number = Math.random): T[] {
  const a = [...xs];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

interface Saved {
  order: string[];
  pos: number;
  last: string;
}

/**
 * A shuffle bag: deals every id once, in random order, before any repeats.
 * A new round never starts with the id the last round ended on, so the same
 * topic never shows twice in a row. Kept in sessionStorage across reloads.
 */
export class Deck {
  private order: string[] = [];
  private pos = 0;
  private last = '';

  constructor(
    private readonly ids: readonly string[],
    private readonly key: string,
    private readonly rand: () => number = Math.random,
  ) {
    this.load();
  }

  next(): string {
    if (this.pos >= this.order.length) {
      this.order = shuffle(this.ids, this.rand);
      if (this.order.length > 1 && this.order[0] === this.last) {
        const j = 1 + Math.floor(this.rand() * (this.order.length - 1));
        [this.order[0], this.order[j]] = [this.order[j], this.order[0]];
      }
      this.pos = 0;
    }
    this.last = this.order[this.pos++];
    this.save();
    return this.last;
  }

  private load() {
    try {
      const s = JSON.parse(sessionStorage.getItem(this.key) || 'null') as Saved | null;
      // A new topics file (ids added or removed) starts a fresh round.
      const same = s && s.order.length === this.ids.length && s.order.every((id) => this.ids.includes(id));
      if (s && same) Object.assign(this, { order: s.order, pos: s.pos, last: s.last });
    } catch {
      // Private mode or bad JSON: start a fresh round.
    }
  }

  private save() {
    try {
      sessionStorage.setItem(this.key, JSON.stringify({ order: this.order, pos: this.pos, last: this.last } satisfies Saved));
    } catch {
      // Storage full or blocked: the deck still works for this page view.
    }
  }
}
