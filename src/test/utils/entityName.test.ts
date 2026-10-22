import { describe, it, expect } from 'vitest';
import { sanitizeEntityName } from '@/utils/entityName';

/**
 * Entity-name sanitizer — the shared allowlist applied at every name-input
 * boundary (creation, rename, builder, save import) so markdown/HTML
 * metacharacters can never reach the gazette linkify/render pipeline.
 */
describe('sanitizeEntityName', () => {
  it('preserves ordinary names', () => {
    expect(sanitizeEntityName('Brutus')).toBe('Brutus');
    expect(sanitizeEntityName('The Gilded Lions')).toBe('The Gilded Lions');
  });

  it('preserves digits, apostrophes, hyphens, periods, commas', () => {
    expect(sanitizeEntityName('NewName1')).toBe('NewName1');
    expect(sanitizeEntityName("Dragon's Hearth")).toBe("Dragon's Hearth");
    expect(sanitizeEntityName('Iron-Wolves')).toBe('Iron-Wolves');
    expect(sanitizeEntityName('Maximus Jr.')).toBe('Maximus Jr.');
    expect(sanitizeEntityName('Tully, the Elder')).toBe('Tully, the Elder');
  });

  it('preserves unicode letters', () => {
    expect(sanitizeEntityName('Gräfin Helga')).toBe('Gräfin Helga');
  });

  it('strips HTML injection', () => {
    expect(sanitizeEntityName('<script>alert(1)</script>')).toBe('scriptalert1script');
    expect(sanitizeEntityName('<img src=x onerror=alert(1)>')).toBe('img srcx onerroralert1');
  });

  it('strips markdown link metacharacters', () => {
    const cleaned = sanitizeEntityName('Evil](javascript:alert(1))[x');
    expect(cleaned).not.toMatch(/[[\]()]/);
    expect(cleaned).toBe('Eviljavascriptalert1x');
  });

  it('strips other markdown/formatting metacharacters', () => {
    const cleaned = sanitizeEntityName('a*b_c`d~e|f#g\\h$i');
    expect(cleaned).not.toMatch(/[*_`~|#\\$]/);
  });

  it('collapses whitespace and trims', () => {
    expect(sanitizeEntityName('  Many   Spaces  ')).toBe('Many Spaces');
  });

  it('truncates to the 40-char entity-name cap', () => {
    const long = 'A'.repeat(50);
    expect(sanitizeEntityName(long)).toHaveLength(40);
  });

  it('returns empty string for all-symbol input', () => {
    expect(sanitizeEntityName('<>:[](){}')).toBe('');
    expect(sanitizeEntityName('   ')).toBe('');
  });
});
