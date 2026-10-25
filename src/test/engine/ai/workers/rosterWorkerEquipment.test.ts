/**
 * AI armory pass — rival stables act on the same charting evidence players
 * see: a discovered favorite keeps its slot against any refit, and a
 * statistically suspect weapon gets equipped before formal discovery.
 */
import { describe, it, expect } from 'vitest';
import { refitRosterWeapons } from '@/engine/ai/workers/rosterWorkerEquipment';
import { makeComputedWarrior as fixtureComputedWarrior } from '@/test/_fixtures/factories';
import { FightingStyle } from '@/types/shared.types';
import type { Warrior, WarriorFavorites } from '@/types/warrior.types';
import type { WarriorId } from '@/types/shared.types';

const fav = (weaponId: string, discovered: boolean, chart?: WarriorFavorites['chart']) => ({
  weaponId,
  rhythm: { oe: 7, al: 6 },
  discovered: { weapon: discovered, rhythm: false, weaponHints: 0, rhythmHints: 0 },
  ...(chart ? { chart } : {}),
});

const makeWarrior = (id: string, overrides: Partial<Warrior> = {}): Warrior =>
  fixtureComputedWarrior(
    { ST: 14, CN: 12, SZ: 12, WT: 14, WL: 14, SP: 12, DF: 14 },
    FightingStyle.StrikingAttack,
    {
      id: id as WarriorId,
      name: `Warrior ${id}`,
      fame: 0,
      age: 24,
      status: 'Active',
      ...overrides,
    }
  );

describe('refitRosterWeapons — AI favorite-weapon usage', () => {
  it('keeps a discovered favorite even when a refit would strip it', () => {
    // Fist is always a losing fit-score — a pure refit would swap it out.
    const w = makeWarrior('w1', {
      favorites: fav('fist', true),
      equipment: { weapon: 'fist', armor: 'leather', shield: 'none_shield', helm: 'leather_cap' },
    });
    const out = refitRosterWeapons([w])[0]!;
    expect(out.equipment?.weapon).toBe('fist');
  });

  it('equips a discovered favorite the warrior was not carrying', () => {
    const w = makeWarrior('w2', {
      favorites: fav('dagger', true),
      equipment: { weapon: 'broadsword', armor: 'leather', shield: 'none_shield', helm: 'leather_cap' },
    });
    const out = refitRosterWeapons([w])[0]!;
    expect(out.equipment?.weapon).toBe('dagger');
  });

  it('equips a chart-suspected weapon before discovery — the AI charts too', () => {
    const w = makeWarrior('w3', {
      favorites: fav('short_spear', false, {
        broadsword: { swings: 20, crits: 1, knockdowns: 0 },
        short_spear: { swings: 15, crits: 7, knockdowns: 2 },
      }),
      equipment: { weapon: 'broadsword', armor: 'leather', shield: 'none_shield', helm: 'leather_cap' },
    });
    const out = refitRosterWeapons([w])[0]!;
    expect(out.equipment?.weapon).toBe('short_spear');
  });

  it('falls back to a normal refit when there is no charting evidence', () => {
    const w = makeWarrior('w4', {
      favorites: fav('war_hammer', false, {
        broadsword: { swings: 20, crits: 1, knockdowns: 0 }, // 5% — doubtful
      }),
      equipment: { weapon: 'dagger', armor: 'leather', shield: 'none_shield', helm: 'leather_cap' },
    });
    const out = refitRosterWeapons([w])[0]!;
    // No signal → ordinary fit path picks a proper weapon for the stats.
    expect(out.equipment?.weapon).not.toBe('war_hammer');
    expect(out.equipment?.weapon).not.toBe('dagger');
  });

  it('never equips a weapon the style may not legally use', () => {
    // A Total Parry disarmed to fists can chart a fist tally — but fist is
    // style-illegal for TP, so the AI must not equip it.
    const tp = fixtureComputedWarrior(
      { ST: 14, CN: 12, SZ: 12, WT: 14, WL: 14, SP: 12, DF: 14 },
      FightingStyle.TotalParry,
      {
        id: 'w5' as WarriorId,
        name: 'Warrior w5',
        fame: 0,
        age: 24,
        status: 'Active',
        favorites: fav('medium_shield', false, {
          fist: { swings: 20, crits: 6, knockdowns: 1 },
        }),
        equipment: { weapon: 'medium_shield', armor: 'leather', shield: 'none_shield', helm: 'leather_cap' },
      }
    );
    const out = refitRosterWeapons([tp])[0]!;
    expect(out.equipment?.weapon).not.toBe('fist');
  });

  it('leaves inactive warriors untouched', () => {
    const w = makeWarrior('w6', {
      status: 'Dead',
      favorites: fav('dagger', true),
      equipment: { weapon: 'broadsword', armor: 'leather', shield: 'none_shield', helm: 'leather_cap' },
    });
    const out = refitRosterWeapons([w])[0]!;
    expect(out.equipment?.weapon).toBe('broadsword');
  });
});
