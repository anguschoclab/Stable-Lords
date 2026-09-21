import { describe, it, expect } from 'vitest';
import { getTrainerMods } from '@/engine/combat/mechanics/simulateHelpers';
import { FightingStyle } from '@/types/shared.types';
import type { FighterState, ResolutionContext } from '@/engine/combat/resolution/types';
import type { Trainer } from '@/types/state.types';

describe('simulateHelpers mechanics', () => {
  describe('getTrainerMods', () => {
    it('returns zeroed base mods when trainers is undefined', () => {
      const mods = getTrainerMods(undefined, FightingStyle.StrikingAttack);
      expect(mods.attMod).toBe(0);
      expect(mods.defMod).toBe(0);
      expect(mods.damageReceivedMult).toBe(1.0);
    });

    it('returns base mods calculated from real trainers if no context is provided', () => {
      const t1 = { focus: 'Aggression', tier: 'Master', contractWeeksLeft: 10 } as Trainer;
      // Master tier -> TIER_BONUS = 3
      const mods = getTrainerMods([t1], FightingStyle.StrikingAttack);
      expect(mods.attMod).toBe(3);
      expect(mods.parMod).toBe(0);
      expect(mods.killWindowBonus).toBe(0);
      expect(mods.damageReceivedMult).toBe(1.0);
    });

    it('returns mods combined with specialtyMods if full context is provided', () => {
      // We'll give them a specialty that modifies mods
      // CounterFighter amplifies riposte damage
      const t1 = {
        focus: 'Aggression',
        tier: 'Seasoned',
        contractWeeksLeft: 10,
        specialty: 'CounterFighter',
      } as Trainer;
      // Seasoned tier = 2
      // attMod = 2
      // CounterFighter riposteDamageMult += 0.15 * tier -> +0.3
      const f = {} as FighterState;
      const o = {} as FighterState;
      const c = {} as ResolutionContext;
      const mods = getTrainerMods([t1], FightingStyle.StrikingAttack, f, o, c);
      expect(mods.attMod).toBe(2);
      expect(mods.riposteDamageMult).toBe(1.3);
    });
  });

});
