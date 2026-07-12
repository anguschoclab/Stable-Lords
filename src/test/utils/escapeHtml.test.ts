import { describe, it, expect } from 'vitest';
import { escapeHtml } from '@/utils/escapeHtml';

describe('escapeHtml', () => {
  it('escapes ampersand', () => {
    expect(escapeHtml('A & B')).toBe('A &amp; B');
  });

  it('escapes less-than', () => {
    expect(escapeHtml('a < b')).toBe('a &lt; b');
  });

  it('escapes greater-than', () => {
    expect(escapeHtml('a > b')).toBe('a &gt; b');
  });

  it('escapes double quote', () => {
    expect(escapeHtml('say "hi"')).toBe('say &quot;hi&quot;');
  });

  it('escapes single quote', () => {
    expect(escapeHtml("it's")).toBe('it&#39;s');
  });

  it('handles empty string', () => {
    expect(escapeHtml('')).toBe('');
  });

  it('passes through strings with no special characters', () => {
    expect(escapeHtml('Hello World 123')).toBe('Hello World 123');
  });

  it('escapes multiple special characters in one string', () => {
    expect(escapeHtml('<script>alert("x")</script>')).toBe(
      '&lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt;'
    );
  });

  it('double-escapes already-escaped ampersands', () => {
    expect(escapeHtml('&amp;')).toBe('&amp;amp;');
  });

  it('handles numeric strings', () => {
    expect(escapeHtml(String(42))).toBe('42');
  });

  it('does not escape markdown special characters', () => {
    expect(escapeHtml('[click](http://evil.com)')).toBe('[click](http://evil.com)');
  });

  it('escapes a full XSS payload', () => {
    expect(escapeHtml('<img src=x onerror=alert(1)>')).toBe(
      '&lt;img src=x onerror=alert(1)&gt;'
    );
  });
});
