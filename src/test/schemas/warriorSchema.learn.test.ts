import { describe, it, expect } from 'vitest';
import { WarriorSchema } from '@/schemas/warriorSchemas';
import { makeWarrior } from '@/engine/factories/warriorFactory';
import { FightingStyle, type WarriorId } from '@/types/shared.types';

const base = () =>
  makeWarrior({
    id: 'w-schema' as WarriorId,
    name: 'Schema Warrior',
    style: FightingStyle.StrikingAttack,
    attrs: { ST: 11, CN: 11, SZ: 11, WT: 11, WL: 11, SP: 11, DF: 11 },
  });

describe('WarriorSchema — learn fields', () => {
  it('accepts learnedSkills', () => {
    const w = { ...base(), learnedSkills: { ATT: 3, INI: 1 } };
    expect(() => WarriorSchema.parse(w)).not.toThrow();
  });

  it('accepts favorites.discovered learn + learnHints', () => {
    const w = base();
    w.favorites = {
      ...w.favorites!,
      discovered: {
        ...w.favorites!.discovered,
        learn: true,
        learnHints: 1,
      },
    };
    expect(() => WarriorSchema.parse(w)).not.toThrow();
  });

  it('accepts chart rows carrying critDamages', () => {
    const w = base();
    w.favorites = {
      ...w.favorites!,
      chart: {
        scimitar: { swings: 40, crits: 8, knockdowns: 2, critDamages: 5 },
      },
    };
    expect(() => WarriorSchema.parse(w)).not.toThrow();
  });

  it('accepts strategyMemory.recentLossFactors', () => {
    const w = {
      ...base(),
      strategyMemory: {
        cells: { 'M/M': { w: 2, l: 1 } },
        recentLossFactors: ['Initiative', 'Endurance'],
      },
    };
    expect(() => WarriorSchema.parse(w)).not.toThrow();
  });

  it('parses warriors without any of the new fields (legacy payloads)', () => {
    const w = base();
    delete (w as Partial<typeof w>).learnedSkills;
    expect(() => WarriorSchema.parse(w)).not.toThrow();
  });

  it('parses legacy discovered objects lacking learn fields', () => {
    const w = base();
    w.favorites = {
      weaponId: 'scimitar',
      rhythm: { oe: 5, al: 5 },
      discovered: { weapon: false, rhythm: false, weaponHints: 0, rhythmHints: 0 },
    };
    expect(() => WarriorSchema.parse(w)).not.toThrow();
  });
});
