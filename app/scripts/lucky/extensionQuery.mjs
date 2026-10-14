// How the Cloudinary Chrome extension turns typed text into a Search API expression.
// A copy of the deterministic path in the extension's worker (worker/src/retrieval/
// subjectTokens.ts and querySynthesis.ts, 2026-10-13). Keep in step with it: if the
// extension changes its stop words or fields, the match counts here stop being true.

const STOPWORDS = new Set([
  'a', 'an', 'the', 'and', 'or', 'of', 'for', 'to', 'in', 'on', 'at', 'by', 'with', 'from', 'into', 'our', 'your', 'this', 'that', 'these', 'those',
  'is', 'are', 'was', 'were', 'be', 'new', 'now', 'how', 'why', 'what', 'when', 'all', 'its', "it's", 'vs', 'via', 'per', 'about', 'more', 'most', 'very',
  'launch', 'collection', 'post', 'article', 'blog', 'product', 'page', 'story', 'guide', 'update', 'edition', 'introducing', 'meet',
  'you', 'i', 'me', 'my', 'we', 'us', 'they', 'them', 'their', 'his', 'her', 'can', 'could', 'will', 'would', 'should', 'does', 'did', 'has', 'have', 'had',
  'not', 'but', 'than', 'then', 'there', 'here', 'where', 'who', 'which', 'until', 'while', 'through', 'over', 'off', 'out', 'up', 'down', 'just', 'really',
  'actually', 'keep', 'get', 'getting', 'got', 'make', 'making', 'made', 'take', 'taking', 'set', 'setting', 'choose', 'choosing', 'worth', 'like', 'feel',
  'way', 'ways', 'thing', 'things', 'tips', 'first', 'best', 'ever', 'every', 'some', 'any', 'one', 'two', 'ten', 'full', 'whole', 'day', 'days', 'week', 'weeks',
  'based', 'ranked', 'rules', 'basics',
]);

/** The extension sends at most this many terms. */
export const MAX_TERMS = 6;
const WORD_PATTERN = /[\p{L}\p{N}][\p{L}\p{N}'’]*/gu;

function singular(word) {
  if (word.length <= 3 || /(ss|us|is|as|ous|news|series|species)$/.test(word)) return word;
  if (word.endsWith('ies')) return `${word.slice(0, -3)}y`;
  if (/(ches|shes|xes|sses)$/.test(word)) return word.slice(0, -2);
  if (word.endsWith('s')) return word.slice(0, -1);
  return word;
}

function plural(word) {
  if (word.endsWith('s')) return word;
  if (/[^aeiou]y$/.test(word)) return `${word.slice(0, -1)}ies`;
  if (/(ch|sh|x|z)$/.test(word)) return `${word}es`;
  return `${word}s`;
}

const wordForms = (word) => [...new Set([word, singular(word), plural(singular(word))])];
const quote = (v) => `"${v.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;

/** Every meaningful word, lower-cased, in order (the extension then keeps the first MAX_TERMS). */
export function terms(text) {
  const words = Array.from(text.split(/[\s,;:()[\]"“”]+/).filter(Boolean).join(' ').matchAll(WORD_PATTERN), (m) => m[0]);
  return [
    ...new Set(
      words.map((w) => w.toLowerCase().replace(/[’']s$/, '')).filter((w) => w.length >= 3 && !STOPWORDS.has(w) && !/^\d+$/.test(w)),
    ),
  ];
}

/** One term in all its forms, on every field the extension searches. Folders are not searched. */
export function termClause(term) {
  return `(${wordForms(term)
    .flatMap((f) => ['tags', 'context', 'filename', 'display_name', 'public_id'].map((field) => `${field}:${quote(f)}`))
    .join(' OR ')})`;
}

export const BASE = '(resource_type:image OR resource_type:video)';

/** The extension's first title query: every term must match (AND). */
export const andExpression = (ts) => [BASE, ...ts.map(termClause)].join(' AND ');
