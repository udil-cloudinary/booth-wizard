import { describe, expect, it } from 'vitest';
import {
  cleanName,
  firstNameOf,
  isValidEmailPrefix,
  normalizeEmailPrefix,
  publicIdFor,
  toMetaString,
  variantFor,
} from './text';

describe('text', () => {
  it.each(['maya.sol', 'a', 'a+b', 'maya_sol-2'])(
    `GIVEN a well-formed email prefix (%s)
     WHEN it is validated
     THEN it is accepted`,
    (p) => {
      expect(isValidEmailPrefix(p)).toBe(true);
    },
  );

  it.each(['', '.maya', 'maya.', 'ma..ya', 'ma!ya', 'a'.repeat(65)])(
    `GIVEN a malformed email prefix (%j)
     WHEN it is validated
     THEN it is rejected`,
    (p) => {
      expect(isValidEmailPrefix(p)).toBe(false);
    },
  );

  it(`GIVEN a pasted full address with capitals and spaces
      WHEN it is normalised
      THEN only the lower-case part before the @ remains`, () => {
    expect(normalizeEmailPrefix(' Maya.Sol@gmail.com ')).toBe('maya.sol');
  });

  it(`GIVEN a name with extra spaces
      WHEN it is cleaned
      THEN it is trimmed with single inner spaces and the first word is the first name`, () => {
    expect(cleanName('  Maya   Sol ')).toBe('Maya Sol');
    expect(firstNameOf('  Maya   Sol ')).toBe('Maya');
  });

  it(`GIVEN a Latin name with accents
      WHEN the public ID is built
      THEN it is the slugged name plus a 4-character suffix`, () => {
    expect(publicIdFor('Zoë Ångström', 'zoe')).toMatch(/^zoe-angstrom-[a-z0-9]{4}$/);
  });

  it(`GIVEN a name with no Latin letters
      WHEN the public ID is built
      THEN it falls back to the email prefix`, () => {
    expect(publicIdFor('אודי לי-הוד', 'udi.li-hod')).toMatch(/^udi-li-hod-[a-z0-9]{4}$/);
  });

  it(`GIVEN neither the name nor the email prefix gives a slug
      WHEN the public ID is built
      THEN it falls back to "visitor"`, () => {
    expect(publicIdFor('אודי', '')).toMatch(/^visitor-[a-z0-9]{4}$/);
  });

  it(`GIVEN a tapped chip
      WHEN the variant is resolved
      THEN it is the chip's slug`, () => {
    expect(variantFor('gelato', 'Tiramisù', false)).toBe('tiramisu');
  });

  it(`GIVEN a typed answer that matches a chip ignoring case and accents
      WHEN the variant is resolved
      THEN it is that chip's slug`, () => {
    expect(variantFor('gelato', '  TIRAMISU ', true)).toBe('tiramisu');
  });

  it(`GIVEN a typed answer that matches no chip
      WHEN the variant is resolved
      THEN it is own-answer`, () => {
    expect(variantFor('pizza', 'Nduja', true)).toBe('own-answer');
  });

  it(`GIVEN values containing = and |
      WHEN the metadata string is built
      THEN those characters are escaped so the pairs stay intact`, () => {
    expect(toMetaString({ favorite: 'Fig=|x', variant: 'own-answer' })).toBe('favorite=Fig\\=\\|x|variant=own-answer');
  });
});
