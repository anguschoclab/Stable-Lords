/**
 * `epithet` must survive the persistence schema. Epithets are written by
 * coronations/milestones onto warriors; a stripped field would silently drop
 * the earned title on save/load.
 */
import { describe, it, expect } from 'vitest';
import { WarriorSchema } from '@/schemas/gameStateSchema';
import { makeWarrior } from '@/test/_fixtures/factories';

describe('WarriorSchema — epithet roundtrip', () => {
  it('preserves epithet through parse/serialize', () => {
    const w = makeWarrior({ epithet: 'the Red' });
    const parsed = WarriorSchema.parse(JSON.parse(JSON.stringify(w)));
    expect(parsed.epithet).toBe('the Red');
  });

  it('leaves epithet absent for warriors without one', () => {
    const parsed = WarriorSchema.parse(JSON.parse(JSON.stringify(makeWarrior())));
    expect(parsed.epithet).toBeUndefined();
  });
});
