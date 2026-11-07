/**
 * favoredName — resolves the favored side letter to the matching display name.
 */
import { describe, it, expect } from 'vitest';
import { favoredName } from '@/components/bout-viewer/favoredName';

describe('favoredName', () => {
  it('returns nameA when side A is favored', () => {
    expect(favoredName('A', 'Alpha', 'Bravo')).toBe('Alpha');
  });

  it('returns nameD when side D is favored', () => {
    expect(favoredName('D', 'Alpha', 'Bravo')).toBe('Bravo');
  });

  it('returns null when no side is favored', () => {
    expect(favoredName(null, 'Alpha', 'Bravo')).toBeNull();
  });

  it('passes names through verbatim, including empty strings', () => {
    expect(favoredName('A', '', 'Bravo')).toBe('');
    expect(favoredName('D', 'Alpha', '')).toBe('');
  });
});
