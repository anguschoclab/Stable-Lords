/**
 * warriorDisplayName — renders immutable name + earned epithet.
 */
import { describe, it, expect } from 'vitest';
import { warriorDisplayName } from '@/utils/warriorDisplay';

describe('warriorDisplayName', () => {
  it('returns the bare name when no epithet exists', () => {
    expect(warriorDisplayName({ name: 'KRAGOS' })).toBe('KRAGOS');
    expect(warriorDisplayName({ name: 'KRAGOS', epithet: undefined })).toBe('KRAGOS');
    expect(warriorDisplayName({ name: 'KRAGOS', epithet: '' })).toBe('KRAGOS');
  });

  it('appends the epithet', () => {
    expect(warriorDisplayName({ name: 'KRAGOS', epithet: 'the Red' })).toBe('KRAGOS the Red');
  });
});
