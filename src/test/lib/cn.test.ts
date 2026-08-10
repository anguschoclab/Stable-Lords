/**
 * Dependency — cn() utility compatibility test for tailwind-merge 3 upgrade.
 * Pre-merge test: validates cn() works correctly on current tailwind-merge 2.
 * After upgrading to tailwind-merge 3, this test should still pass.
 */
import { describe, it, expect } from 'vitest';
import { cn } from '@/lib/utils';

describe('cn() utility — tailwind-merge compatibility', () => {
  it('merges class names correctly', () => {
    expect(cn('px-2', 'py-1')).toBe('px-2 py-1');
  });

  it('deduplicates conflicting Tailwind classes', () => {
    expect(cn('px-2', 'px-4')).toBe('px-4');
  });

  it('handles conditional classes', () => {
    const isHidden = false;
    expect(cn('base', isHidden && 'hidden', 'visible')).toBe('base visible');
  });

  it('handles undefined and null inputs', () => {
    expect(cn('base', undefined, null, 'end')).toBe('base end');
  });

  it('merges arena tokens without conflict', () => {
    expect(cn('text-arena-gold', 'text-arena-blood')).toBe('text-arena-blood');
  });

  it('preserves non-conflicting arena tokens', () => {
    expect(cn('bg-arena-gold', 'text-arena-blood')).toBe('bg-arena-gold text-arena-blood');
  });
});
