// Builds src/lucky/topics.json (the /feeling-lucky ideas) from the chrome-demo cloud.
//
//   npm run lucky:inventory   list every asset, group the words into themes (scripts/lucky/inventory.*)
//   npm run lucky:topics      check scripts/lucky/candidates.json against the cloud, write the
//                             topics that pass to src/lucky/topics.json and a review report
//
// Needs CLOUDINARY_URL=cloudinary://<api_key>:<api_secret>@chrome-demo in the environment
// (read-only Search API calls). It is never written to a file and never reaches the browser bundle.
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { andExpression, BASE, MAX_TERMS, termClause, terms } from './lucky/extensionQuery.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const CANDIDATES = join(HERE, 'lucky/candidates.json');
const REPORT = join(HERE, 'lucky/report.md');
const INVENTORY_JSON = join(HERE, 'lucky/inventory.json');
const INVENTORY_MD = join(HERE, 'lucky/inventory.md');
const OUT = join(HERE, '../src/lucky/topics.json');

// Rules from the brief.
const MIN_TOPIC = 6; // assets a topic's title must match
const MIN_SECTION = 3; // assets each section must match on its own
const MAX_OVERLAP = 0.2; // doc sections: share at most this part of the grid (first 24 results)
const PAGE = 24; // the extension's grid size
const LIMITS = { productTitle: 6, heading: 3, sentence: 12 };

// ---------- Cloudinary ----------

function credentials() {
  const raw = process.env.CLOUDINARY_URL;
  if (!raw) {
    console.error('Set CLOUDINARY_URL=cloudinary://<api_key>:<api_secret>@chrome-demo (Admin API credentials, read-only use).');
    process.exit(1);
  }
  const u = new URL(raw);
  return {
    cloud: u.hostname,
    auth: `Basic ${Buffer.from(`${decodeURIComponent(u.username)}:${decodeURIComponent(u.password)}`).toString('base64')}`,
  };
}

async function search(cred, body) {
  const r = await fetch(`https://api.cloudinary.com/v1_1/${cred.cloud}/resources/search`, {
    method: 'POST',
    headers: { Authorization: cred.auth, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const j = await r.json();
  if (!r.ok) throw new Error(`Search API ${r.status}: ${j.error?.message ?? JSON.stringify(j)}`);
  return j;
}

const cache = new Map();
/** Run the extension's AND query for a text. Returns the terms it sends, the count and the first grid page. */
async function match(cred, text) {
  const ts = terms(text).slice(0, MAX_TERMS);
  const key = ts.join(' ');
  if (!cache.has(key)) {
    cache.set(
      key,
      (async () => {
        if (!ts.length) return { terms: ts, count: 0, ids: [], perTerm: {} };
        const j = await search(cred, { expression: andExpression(ts), max_results: PAGE });
        const perTerm = {};
        // On a miss, show what each word finds alone, so the text is easy to fix.
        if (j.total_count < MIN_TOPIC)
          for (const t of ts) perTerm[t] = (await search(cred, { expression: `${BASE} AND ${termClause(t)}`, max_results: 1 })).total_count;
        return { terms: ts, count: j.total_count, ids: j.resources.map((a) => a.public_id), perTerm };
      })(),
    );
  }
  return cache.get(key);
}

// ---------- Inventory ----------

const count = (rows) => {
  const m = new Map();
  for (const v of rows) m.set(v, (m.get(v) ?? 0) + 1);
  return [...m].sort((a, b) => b[1] - a[1]);
};
const contextValues = (a) => Object.values(a.context?.custom ?? a.context ?? {}).filter((v) => typeof v === 'string');
const wordsOf = (s) => (s.toLowerCase().match(/\p{L}{3,}/gu) ?? []).filter((w) => !['unsplash', 'jpg', 'png', 'webp', 'the', 'and', 'with'].includes(w));

async function inventory(cred) {
  const all = [];
  let cursor;
  do {
    const j = await search(cred, {
      expression: BASE,
      max_results: 500,
      with_field: ['tags', 'context', 'metadata'],
      ...(cursor && { next_cursor: cursor }),
    });
    all.push(...j.resources);
    cursor = j.next_cursor;
    process.stderr.write(`\r${all.length}/${j.total_count} assets`);
  } while (cursor);
  process.stderr.write('\n');

  const slim = all.map((a) => ({
    id: a.public_id,
    type: a.resource_type,
    folder: a.asset_folder ?? a.folder ?? '',
    display: a.display_name,
    file: a.filename,
    tags: a.tags ?? [],
    context: a.context?.custom ?? a.context ?? {},
  }));
  writeFileSync(INVENTORY_JSON, `${JSON.stringify(slim, null, 1)}\n`);

  // Words the extension can match, per asset (tags, context values, file / display / public id).
  const assetWords = slim.map((a) => [
    ...new Set([...a.tags.flatMap(wordsOf), ...contextValues({ context: a.context }).flatMap(wordsOf), ...wordsOf(`${a.file ?? ''} ${a.display ?? ''} ${a.id}`)]),
  ]);
  const folders = count(slim.map((a) => a.folder));
  const tags = count(slim.flatMap((a) => a.tags));
  const ctxKeys = count(slim.flatMap((a) => Object.keys(a.context)));
  const words = count(assetWords.flat()).filter(([, n]) => n >= MIN_SECTION);

  // Themes: per folder, the words most of its assets share.
  const themes = folders.map(([folder, n]) => {
    const inFolder = slim.map((a, i) => (a.folder === folder ? assetWords[i] : null)).filter(Boolean);
    const shared = count(inFolder.flat()).filter(([, c]) => c >= MIN_SECTION).slice(0, 25);
    return { folder, n, shared };
  });

  const md = [
    `# chrome-demo inventory (${new Date().toISOString().slice(0, 10)})`,
    '',
    `${slim.length} assets. Words below are the ones the extension can match (tags, context, file name, display name, public ID). Folder names are NOT searched.`,
    '',
    '## Context keys',
    '',
    ctxKeys.map(([k, n]) => `- \`${k}\`: ${n}`).join('\n') || '- none',
    '',
    '## Themes by folder (word: assets)',
    '',
    ...themes.map((t) => `- **${t.folder || '(root)'}** (${t.n}): ${t.shared.map(([w, c]) => `${w} ${c}`).join(', ')}`),
    '',
    '## Top tags',
    '',
    tags.slice(0, 150).map(([t, n]) => `${t} ${n}`).join(', '),
    '',
    `## Words on ${MIN_SECTION}+ assets`,
    '',
    words.map(([w, n]) => `${w} ${n}`).join(', '),
    '',
  ].join('\n');
  writeFileSync(INVENTORY_MD, md);
  console.log(`Wrote ${INVENTORY_MD} and ${INVENTORY_JSON}`);
}

// ---------- Build ----------

const wordCount = (s) => s.trim().split(/\s+/).filter(Boolean).length;

/** Length and wording rules: short, sentence case, nothing hard to type. */
function lint(path, c) {
  const p = [];
  const check = (label, text, max) => {
    if (!text) p.push(`${label} is empty`);
    else if (wordCount(text) > max) p.push(`${label} has ${wordCount(text)} words (max ${max})`);
    if (text && /[-–]/.test(text)) p.push(`${label} has a hyphen (the extension splits it into two words)`);
  };
  check('title', c.title, path === 'ecommerce' ? LIMITS.productTitle : LIMITS.sentence);
  if (path === 'ecommerce') check('description', c.description, LIMITS.sentence);
  for (const [i, s] of (c.sections ?? []).entries()) {
    check(`section ${i + 1} heading`, s.heading, LIMITS.heading);
    check(`section ${i + 1} text`, s.text, LIMITS.sentence);
  }
  const n = c.sections?.length ?? 0;
  if (path === 'blog' && (n < 2 || n > 3)) p.push(`a blog post needs 2-3 sections, has ${n}`);
  if (path === 'doc' && n !== 3) p.push(`a document needs 3 sections, has ${n}`);
  return p;
}

const jaccard = (a, b) => {
  const A = new Set(a);
  const inter = b.filter((x) => A.has(x)).length;
  const union = new Set([...a, ...b]).size;
  return union ? inter / union : 0;
};

async function build(cred) {
  const candidates = JSON.parse(readFileSync(CANDIDATES, 'utf8'));
  const out = { cloud: cred.cloud, generatedAt: new Date().toISOString(), paths: { ecommerce: [], blog: [], doc: [] } };
  const report = [`# Feeling lucky topics: review (${out.generatedAt.slice(0, 10)}, cloud \`${cred.cloud}\`)`, ''];
  report.push(
    `A topic is kept when its title matches ${MIN_TOPIC}+ assets and each section matches ${MIN_SECTION}+ on its own, with the extension's own AND query (the words in [brackets]). Document sections may share at most ${MAX_OVERLAP * 100}% of their first ${PAGE} results.`,
    '',
  );

  for (const path of ['ecommerce', 'blog', 'doc']) {
    report.push(`## ${path}`, '');
    for (const c of candidates[path] ?? []) {
      const problems = lint(path, c);
      // E-commerce and blog search by the title. Docs search by "heading — first sentence" per section.
      const title = await match(cred, c.title);
      if (path !== 'doc' && title.count < MIN_TOPIC) problems.push(`title matches ${title.count} (needs ${MIN_TOPIC})`);
      // Docs only propose the title as a search; if the user accepts it, it must not come back empty.
      if (path === 'doc' && title.count < 1) problems.push('title matches nothing');
      const sections = [];
      for (const s of c.sections ?? []) {
        const m = await match(cred, `${s.heading} — ${s.text}`);
        if (m.count < MIN_SECTION) problems.push(`section "${s.heading}" matches ${m.count} (needs ${MIN_SECTION})`);
        sections.push({ ...s, m });
      }
      if (path === 'doc') {
        const union = new Set(sections.flatMap((s) => s.m.ids)).size;
        if (union < MIN_TOPIC) problems.push(`sections match ${union} assets together (needs ${MIN_TOPIC})`);
        for (let i = 0; i < sections.length; i++)
          for (let j = i + 1; j < sections.length; j++) {
            const o = jaccard(sections[i].m.ids, sections[j].m.ids);
            if (o > MAX_OVERLAP) problems.push(`sections "${sections[i].heading}" and "${sections[j].heading}" share ${Math.round(o * 100)}% of results`);
          }
      }

      const keep = problems.length === 0;
      const fmt = (m) =>
        `${m.count} [${m.terms.join(' ')}]${Object.keys(m.perTerm).length ? ` (alone: ${Object.entries(m.perTerm).map(([t, n]) => `${t} ${n}`).join(', ')})` : ''}${m.ids.length ? ` e.g. ${m.ids.slice(0, 3).map((id) => `\`${id}\``).join(', ')}` : ''}`;
      report.push(`- ${keep ? 'KEEP' : 'DROP'} **${c.title}**: ${fmt(title)}`);
      if (c.description) report.push(`  - description: ${c.description}`);
      for (const s of sections) report.push(`  - ${s.heading}: ${s.text} → ${fmt(s.m)}`);
      for (const p of problems) report.push(`  - ⚠ ${p}`);

      if (keep) {
        const topic = { id: c.id, title: c.title, matches: path === 'doc' ? new Set(sections.flatMap((s) => s.m.ids)).size : title.count };
        if (c.description) topic.description = c.description;
        if (sections.length) topic.sections = sections.map((s) => ({ heading: s.heading, text: s.text, matches: s.m.count }));
        out.paths[path].push(topic);
      }
    }
    report.push('');
  }

  writeFileSync(OUT, `${JSON.stringify(out, null, 2)}\n`);
  writeFileSync(REPORT, `${report.join('\n')}\n`);
  for (const [p, ts] of Object.entries(out.paths)) console.log(`${p}: kept ${ts.length} of ${(candidates[p] ?? []).length}`);
  console.log(`Wrote ${OUT}\nReview: ${REPORT}`);
}

const cred = credentials();
await (process.argv[2] === 'inventory' ? inventory(cred) : build(cred));
