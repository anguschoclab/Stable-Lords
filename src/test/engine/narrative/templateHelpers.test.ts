import { describe, it, expect } from 'vitest';
import { interpolateData } from '@/engine/narrative/templateHelpers';

describe('templateHelpers — interpolateData()', () => {
  it('substitutes simple string values', () => {
    expect(interpolateData('{{name}} wins', { name: 'Thor' })).toBe('Thor wins');
  });

  it('substitutes numeric values', () => {
    expect(interpolateData('{{count}} bouts', { count: 5 })).toBe('5 bouts');
  });

  it('leaves unknown tokens as-is', () => {
    expect(interpolateData('{{unknown}} stays', { name: 'Thor' })).toBe('{{unknown}} stays');
  });

  it('substitutes multiple placeholders', () => {
    expect(interpolateData('{{a}} vs {{b}}', { a: 'Thor', b: 'Loki' })).toBe('Thor vs Loki');
  });

  it('handles templates with no placeholders', () => {
    expect(interpolateData('No placeholders', { name: 'Thor' })).toBe('No placeholders');
  });

  // ── XSS / HTML escaping tests ──────────────────────────────────────────

  it('escapes HTML script tags in substituted values', () => {
    expect(interpolateData('{{name}} wins', { name: '<script>alert(1)</script>' })).toBe(
      '&lt;script&gt;alert(1)&lt;/script&gt; wins'
    );
  });

  it('escapes ampersand in substituted values', () => {
    expect(interpolateData('{{name}} wins', { name: 'A & B' })).toBe('A &amp; B wins');
  });

  it('escapes a full XSS img onerror payload', () => {
    expect(interpolateData('{{name}} wins', { name: '<img src=x onerror=alert(1)>' })).toBe(
      '&lt;img src=x onerror=alert(1)&gt; wins'
    );
  });

  it('does not escape the template itself', () => {
    expect(interpolateData('{{name}} <b>wins</b>', { name: 'Thor' })).toBe('Thor <b>wins</b>');
  });
});
