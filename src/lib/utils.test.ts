import { describe, it, expect } from 'vitest';
import { cn } from './utils';

describe('cn', () => {
  it('returns an empty string when given no inputs', () => {
    expect(cn()).toBe('');
  });

  it('returns a single class unchanged', () => {
    expect(cn('px-2')).toBe('px-2');
  });

  it('concatenates multiple classes', () => {
    expect(cn('px-2', 'py-1')).toBe('px-2 py-1');
  });

  it('handles conditional classes via objects', () => {
    expect(cn('base', { 'text-red-500': false, 'text-blue-500': true })).toBe(
      'base text-blue-500',
    );
  });

  it('handles arrays of classes', () => {
    expect(cn(['px-2', 'py-1'], 'mx-auto')).toBe('px-2 py-1 mx-auto');
  });

  it('filters out falsy values', () => {
    expect(cn('px-2', false, null, undefined, '', 'py-1')).toBe('px-2 py-1');
  });

  it('merges conflicting Tailwind classes (twMerge)', () => {
    expect(cn('px-2', 'px-4')).toBe('px-4');
    expect(cn('text-red-500', 'text-blue-500')).toBe('text-blue-500');
  });

  it('preserves non-conflicting classes during merge', () => {
    expect(cn('px-2 py-1', 'px-4')).toBe('py-1 px-4');
  });

  it('handles mixed inputs with conflicts', () => {
    expect(cn('px-2', ['py-1', 'px-4'], { 'text-center': true, 'text-left': false })).toBe(
      'py-1 px-4 text-center',
    );
  });
});
