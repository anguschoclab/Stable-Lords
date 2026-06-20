import { describe, it, expect } from 'vitest';
import { traitBadgeMeta, traitTierColorClasses } from '@/components/warrior/traits/traitDisplay';

describe('traitBadgeMeta', () => {
  it('returns name, tier, description, and a class tag for a class trait', () => {
    const m = traitBadgeMeta('living_wall'); // WS Signature
    expect(m).not.toBeNull();
    expect(m!.name).toBe('Living Wall');
    expect(m!.tier).toBe('Signature');
    expect(m!.description.length).toBeGreaterThan(5);
    expect(m!.classTag).toBeTruthy(); // styles-restricted ⇒ has a class tag
    expect(m!.isFlaw).toBe(false);
  });

  it('flags flaws and has no class tag for generic traits', () => {
    const flaw = traitBadgeMeta('fragile');
    expect(flaw!.isFlaw).toBe(true);
    expect(flaw!.classTag).toBeUndefined();
  });

  it('returns null for an unknown id', () => {
    expect(traitBadgeMeta('does_not_exist')).toBeNull();
  });
});

describe('traitTierColorClasses', () => {
  it('gives each tier a distinct, non-empty class string', () => {
    const tiers = ['Common', 'Notable', 'Exceptional', 'Signature', 'Flaw'] as const;
    const classes = tiers.map(traitTierColorClasses);
    expect(classes.every((c) => c.length > 0)).toBe(true);
    expect(new Set(classes).size).toBe(tiers.length); // all distinct
  });
});
