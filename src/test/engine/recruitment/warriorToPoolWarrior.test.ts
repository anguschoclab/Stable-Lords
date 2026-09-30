import { describe, it, expect } from 'vitest';
import { FightingStyle, type WarriorId } from '@/types/shared.types';
import type { Warrior } from '@/types/warrior.types';
import { warriorToPoolWarrior } from '@/engine/recruitment/recruitment';
import { TIER_COST } from '@/engine/recruitment/recruitment';
import { makeWarrior, makePoolWarrior } from '@/test/_fixtures/factories';
import { SeededRNGService } from '@/utils/random';

const rng = () => new SeededRNGService(42);

const veteran = (over: Partial<Warrior> = {}): Warrior =>
  makeWarrior({
    id: 'w-vet' as WarriorId,
    name: 'Old Veteran',
    style: FightingStyle.LungingAttack,
    fame: 120,
    age: 29,
    baseSkills: { ATT: 14, DEF: 9, INI: 12, PAR: 8, RIP: 11, DEC: 10 },
    potential: { ST: 18, CN: 16, SZ: 10, WT: 15, WL: 17, SP: 14, DF: 12 },
    luckfactor: { ATT: 2, DEF: -1, INI: 1, PAR: 0, RIP: 3, DEC: -2 },
    traits: ['iron_will'],
    favorites: {
      weaponId: 'longsword',
      rhythm: { oe: 7, al: 4 },
      discovered: { weapon: true, rhythm: false, weaponHints: 2, rhythmHints: 0 },
    },
    lineage: { generation: 2, pedigree: 'Legacy' },
    ...over,
  });

describe('warriorToPoolWarrior — dissolved-stable veterans enter the recruit pool', () => {
  it('preserves identity markers and the warrior build', () => {
    const w = veteran();
    const pool = warriorToPoolWarrior(w, 14, rng());

    expect(pool.id).toBe('w-vet');
    expect(pool.name).toBe('Old Veteran');
    expect(pool.style).toBe(FightingStyle.LungingAttack);
    expect(pool.attributes).toEqual(w.attributes);
    expect(pool.potential).toEqual(w.potential);
    expect(pool.baseSkills).toEqual(w.baseSkills);
    expect(pool.derivedStats).toEqual(w.derivedStats);
    expect(pool.favorites).toEqual(w.favorites);
    expect(pool.traits).toEqual(['iron_will']);
    expect(pool.lineage).toEqual(w.lineage);
    expect(pool.luckfactor).toEqual(w.luckfactor);
    expect(pool.age).toBe(29);
    expect(pool.addedWeek).toBe(14);
  });

  it('assigns a fame-scaled tier and a matching listable cost', () => {
    const legendary = warriorToPoolWarrior(veteran({ fame: 500 }), 14, rng());
    const nobody = warriorToPoolWarrior(veteran({ fame: 0 }), 14, rng());

    expect(legendary.tier).not.toBe('Common');
    expect(nobody.tier).toBe('Common');
    expect(legendary.cost).toBe(TIER_COST[legendary.tier]);
    expect(legendary.cost).toBeGreaterThanOrEqual(nobody.cost);
  });

  it('produces a pool entry the existing draft/signing path can consume', () => {
    const pool = warriorToPoolWarrior(veteran(), 14, rng());
    // Shape parity with a generated recruit: every required PoolWarrior field present.
    const reference = makePoolWarrior();
    for (const key of Object.keys(reference) as (keyof typeof reference)[]) {
      expect(pool[key], `missing field ${String(key)}`).not.toBeUndefined();
    }
  });

  it('does not mutate the source warrior', () => {
    const w = veteran();
    const snapshot = structuredClone(w);
    warriorToPoolWarrior(w, 14, rng());
    expect(w).toEqual(snapshot);
  });
});
