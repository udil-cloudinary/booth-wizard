import { OWN_ANSWER, PRODUCTS, type ProductType } from './content';

/** Lower case, accents stripped. "Tiramisù" -> "tiramisu". */
export function fold(s: string): string {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
}

/** URL/ID-safe slug: accents stripped, lower case, spaces to hyphens. */
export function slug(s: string): string {
  return fold(s)
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

export function randomSuffix(len = 4): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  const bytes = crypto.getRandomValues(new Uint8Array(len));
  return Array.from(bytes, (b) => chars[b % chars.length]).join('');
}

/**
 * public_id = {first}-{last}-{4 random a-z0-9}, from the typed full name.
 * A name with no Latin letters (e.g. Hebrew) falls back to the email prefix.
 */
export function publicIdFor(fullName: string, emailPrefix = ''): string {
  return `${slug(fullName) || slug(emailPrefix.replace(/[._+]/g, ' ')) || 'visitor'}-${randomSuffix()}`;
}

/** Trim and collapse inner whitespace. */
export function cleanName(s: string): string {
  return s.trim().replace(/\s+/g, ' ');
}

/** First word of the name: what the label prints. */
export function firstNameOf(fullName: string): string {
  return cleanName(fullName).split(' ')[0] || '';
}

/**
 * The part before @ of a company address. Pasting a full address keeps only
 * the prefix; spaces are dropped; lower case.
 */
export function normalizeEmailPrefix(s: string): string {
  return s.split('@')[0].replace(/\s+/g, '').toLowerCase();
}

/** Letters, digits and . _ + -, not starting or ending with a dot, no "..". */
export function isValidEmailPrefix(p: string): boolean {
  return /^[a-z0-9_+-](?:[a-z0-9._+-]*[a-z0-9_+-])?$/.test(p) && !p.includes('..') && p.length <= 64;
}

/**
 * The art key. A chip is its slug; a typed answer is own-answer unless it
 * matches one of that type's chips ignoring case and accents.
 */
export function variantFor(type: ProductType, favorite: string, typed: boolean): string {
  const f = fold(favorite.trim());
  const chip = PRODUCTS[type].chips.find((c) => fold(c) === f);
  if (chip) return slug(chip);
  return typed ? OWN_ANSWER : slug(favorite);
}

/** Escape a value for Cloudinary's pipe-separated key=value context/metadata strings. */
export function escapeMetaValue(v: string): string {
  return v.replace(/([=|])/g, '\\$1');
}

export function toMetaString(fields: Record<string, string>): string {
  return Object.entries(fields)
    .map(([k, v]) => `${k}=${escapeMetaValue(v)}`)
    .join('|');
}
