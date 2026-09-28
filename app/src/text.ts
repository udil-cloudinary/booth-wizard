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

/** public_id = {first}-{last}-{4 random a-z0-9}, from the full name as listed. */
export function publicIdFor(fullName: string): string {
  return `${slug(fullName) || 'visitor'}-${randomSuffix()}`;
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

export function isValidEmail(s: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(s.trim());
}
