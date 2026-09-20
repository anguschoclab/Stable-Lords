// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from 'vitest';
import {
  loadA11yPrefs,
  saveA11yPrefs,
  applyA11yPrefs,
  A11Y_KEY,
  type A11yPrefs,
} from '@/lib/a11yPrefs';

describe('a11yPrefs (G3 theme/accessibility pack)', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute('data-contrast');
    document.documentElement.style.removeProperty('zoom');
    document.documentElement.style.fontSize = '';
  });

  it('defaults to normal contrast and 100% text scale', () => {
    expect(loadA11yPrefs()).toEqual({ contrast: 'standard', textScale: 100 });
  });

  it('round-trips prefs through localStorage', () => {
    saveA11yPrefs({ contrast: 'high', textScale: 125 });
    expect(loadA11yPrefs()).toEqual({ contrast: 'high', textScale: 125 });
    expect(JSON.parse(localStorage.getItem(A11Y_KEY)!)).toEqual({
      contrast: 'high',
      textScale: 125,
    });
  });

  it('applies high contrast + text scale to the document root', () => {
    const prefs: A11yPrefs = { contrast: 'high', textScale: 125 };
    applyA11yPrefs(prefs);
    expect(document.documentElement.dataset.contrast).toBe('high');
    expect(document.documentElement.style.zoom).toBe('1.25');
  });

  it('standard contrast clears the data attribute; 100% clears zoom', () => {
    applyA11yPrefs({ contrast: 'high', textScale: 125 });
    applyA11yPrefs({ contrast: 'standard', textScale: 100 });
    expect(document.documentElement.dataset.contrast).toBeUndefined();
    expect(document.documentElement.style.zoom).toBe('');
  });

  it('tolerates malformed stored prefs', () => {
    localStorage.setItem(A11Y_KEY, '{"contrast":"bogus","textScale":"big"}');
    expect(loadA11yPrefs()).toEqual({ contrast: 'standard', textScale: 100 });
  });
});
