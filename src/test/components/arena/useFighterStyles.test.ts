/**
 * getStanceAnimationClass — pure mapping from fighter stance to CSS classes.
 *
 * Asserts every stance maps to its animation class and that every animated
 * stance carries the `motion-reduce:animate-none` fallback so users with
 * prefers-reduced-motion get no animation (PR #960 extraction target).
 */
import { describe, it, expect } from 'vitest';
import { getStanceAnimationClass } from '@/components/arena/ArenaFighter/hooks/useFighterStyles';
import type { FighterPose } from '@/types/arena.types';

const ANIMATED_STANCES: Array<{ stance: FighterPose['stance']; cls: string }> = [
  { stance: 'advancing', cls: 'animate-advancing' },
  { stance: 'retreating', cls: 'animate-retreating' },
  { stance: 'lunging', cls: 'animate-lunging' },
  { stance: 'defending', cls: 'animate-defending' },
  { stance: 'stunned', cls: 'animate-stunned' },
  { stance: 'victorious', cls: 'animate-victorious' },
  { stance: 'defeated', cls: 'animate-defeated' },
];

describe('getStanceAnimationClass', () => {
  it('returns an empty string for the neutral stance', () => {
    expect(getStanceAnimationClass('neutral')).toBe('');
  });

  it.each(ANIMATED_STANCES)('maps %s to its animation class', ({ stance, cls }) => {
    expect(getStanceAnimationClass(stance)).toContain(cls);
  });

  it.each(ANIMATED_STANCES)(
    'carries a prefers-reduced-motion fallback for %s',
    ({ stance }) => {
      expect(getStanceAnimationClass(stance)).toContain('motion-reduce:animate-none');
    }
  );

  it('returns an empty string for an unknown runtime stance', () => {
    // Runtime data can carry values outside the declared union.
    expect(getStanceAnimationClass('bogus' as FighterPose['stance'])).toBe('');
  });
});
