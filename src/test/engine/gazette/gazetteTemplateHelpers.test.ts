import { describe, it, expect } from 'vitest';
import { t, styleName } from '@/engine/gazette/gazetteTemplateHelpers';
import { FightingStyle, STYLE_DISPLAY_NAMES } from '@/types/shared.types';

describe('gazetteTemplateHelpers — t()', () => {
  it('substitutes simple string values', () => {
    expect(t('{{name}} wins!', { name: 'Thor' })).toBe('Thor wins!');
  });

  it('substitutes numeric values', () => {
    expect(t('{{count}} bouts fought', { count: 5 })).toBe('5 bouts fought');
  });

  it('substitutes boolean values', () => {
    expect(t('Result: {{victory}}', { victory: true })).toBe('Result: true');
  });

  it('leaves unknown placeholders as-is', () => {
    expect(t('{{unknown}} stays', { name: 'Thor' })).toBe('{{unknown}} stays');
  });

  it('returns templates with no placeholders as-is', () => {
    expect(t('No placeholders here', {})).toBe('No placeholders here');
  });

  it('handles empty template string', () => {
    expect(t('', {})).toBe('');
  });

  it('handles array template (picks one)', () => {
    const result = t(['{{name}} wins', '{{name}} triumphs'], { name: 'Thor' });
    expect(['Thor wins', 'Thor triumphs']).toContain(result);
  });

  it('substitutes multiple placeholders in one template', () => {
    expect(t('{{a}} defeats {{b}}', { a: 'Thor', b: 'Loki' })).toBe('Thor defeats Loki');
  });

  it('handles undefined values — leaves placeholder as-is', () => {
    expect(t('{{name}} fights', { name: undefined })).toBe('{{name}} fights');
  });

  it('handles whitespace in placeholder syntax', () => {
    expect(t('{{  name  }} wins', { name: 'Thor' })).toBe('Thor wins');
  });

  // ── XSS / HTML escaping tests ──────────────────────────────────────────

  it('escapes HTML script tags in substituted values', () => {
    expect(t('{{name}} wins!', { name: '<script>alert(1)</script>' })).toBe(
      '&lt;script&gt;alert(1)&lt;/script&gt; wins!'
    );
  });

  it('escapes ampersand in substituted values', () => {
    expect(t('{{name}} wins!', { name: 'A & B' })).toBe('A &amp; B wins!');
  });

  it('escapes double quotes in substituted values', () => {
    expect(t('{{name}} wins!', { name: 'say "hi"' })).toBe('say &quot;hi&quot; wins!');
  });

  it('escapes single quotes in substituted values', () => {
    expect(t('{{name}} wins!', { name: "it's" })).toBe('it&#39;s wins!');
  });

  it('does not escape the template itself', () => {
    expect(t('{{name}} <b>wins</b>!', { name: 'Thor' })).toBe('Thor <b>wins</b>!');
  });

  it('escapes a full XSS img onerror payload', () => {
    expect(t('{{name}} wins!', { name: '<img src=x onerror=alert(1)>' })).toBe(
      '&lt;img src=x onerror=alert(1)&gt; wins!'
    );
  });

  it('escapes values in array templates too', () => {
    const result = t(['{{name}} wins'], { name: '<script>x</script>' });
    expect(result).toBe('&lt;script&gt;x&lt;/script&gt; wins');
  });
});

describe('styleName', () => {
  it('maps all 10 fighting styles to their display names', () => {
    const styles = Object.values(FightingStyle);
    for (const style of styles) {
      expect(styleName(style)).toBe(STYLE_DISPLAY_NAMES[style]);
    }
    expect(styles).toHaveLength(10);
  });

  it('accepts raw enum string values (not just enum references)', () => {
    expect(styleName('AIMED BLOW')).toBe('Aimed-Blow');
    expect(styleName('BASHING ATTACK')).toBe('Basher');
    expect(styleName('WALL OF STEEL')).toBe('Wall of Steel');
  });

  it('returns unknown style unchanged', () => {
    expect(styleName('Unknown Style')).toBe('Unknown Style');
  });

  it('returns empty string for empty input', () => {
    expect(styleName('')).toBe('');
  });

  it('is case-sensitive — lowercase does not match', () => {
    expect(styleName('aimed blow')).toBe('aimed blow');
    expect(styleName('aimed blow')).not.toBe('Aimed-Blow');
  });

  it('passes through numeric-looking strings unchanged', () => {
    expect(styleName('123')).toBe('123');
  });
});
