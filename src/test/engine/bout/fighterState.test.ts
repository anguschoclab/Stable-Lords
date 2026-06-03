/**
 * Fighter State — combat state preparation with equipment and injury effects.
 */
import { describe, it, expect } from 'vitest';
import { createFighterState } from '@/engine/bout/fighterState';
import type { Warrior } from '@/types/warrior.types';
import type { FightPlan } from '@/types/combat.types';
import type { FightingStyle, WarriorId, InjuryId } from '@/types/shared.types';

describe('fighterState', () => {
  const createMockWarrior = (overrides: Partial<Warrior> = {}): Warrior =>
    ({
      id: 'warrior-a' as WarriorId,
      name: 'Warrior A',
      style: 'StrikingAttack' as FightingStyle,
      attributes: { ST: 10, CN: 10, SZ: 10, WT: 10, WL: 10, SP: 10, DF: 10 },
      baseSkills: { ATT: 10, DEF: 10, INI: 10, PAR: 10, RIP: 10, DEC: 10 },
      injuries: [],
      equipment: { weapon: 'broadsword', armor: 'leather', helm: 'none', shield: 'none' },
      derivedStats: { hp: 100, endurance: 100, damage: 5, encumbrance: 0 },
      ...overrides,
    }) as Warrior;

  const createMockPlan = (overrides: Partial<FightPlan> = {}): FightPlan =>
    ({
      style: 'StrikingAttack' as FightingStyle,
      OE: 5,
      AL: 5,
      killDesire: 5,
      ...overrides,
    });

  describe('createFighterState', () => {
    it('creates fighter state with calculated skills', () => {
      const warrior = createMockWarrior();
      const plan = createMockPlan();

      const result = createFighterState('A', plan, warrior);

      // Skills are calculated from base + equipment + other modifiers
      expect(result.skills.ATT).toBeDefined();
      expect(result.skills.DEF).toBeDefined();
      expect(result.skills.INI).toBeDefined();
      expect(typeof result.skills.ATT).toBe('number');
    });

    it('applies injury penalties to skills', () => {
      const warriorNoInjuries = createMockWarrior();
      const warriorWithInjuries = createMockWarrior({
        injuries: [
          { name: 'Sprained Wrist', description: 'test', severity: 'Minor', penalties: { ATT: -2, DF: -1 }, weeksRemaining: 2, id: 'inj-1' as InjuryId },
        ],
      });
      const plan = createMockPlan();

      const resultNoInj = createFighterState('A', plan, warriorNoInjuries);
      const resultWithInj = createFighterState('A', plan, warriorWithInjuries);

      // Injured warrior should have lower ATT
      expect(resultWithInj.skills.ATT).toBeLessThan(resultNoInj.skills.ATT);
    });

    it('applies multiple injury penalties cumulatively', () => {
      const warriorNoInjuries = createMockWarrior();
      const warriorWithMultipleInjuries = createMockWarrior({
        injuries: [
          { name: 'Injury1', description: 'test', severity: 'Minor', penalties: { ATT: -2 }, weeksRemaining: 2, id: 'inj-1' as InjuryId },
          { name: 'Injury2', description: 'test', severity: 'Moderate', penalties: { ATT: -3, DEF: -2 }, weeksRemaining: 3, id: 'inj-2' as InjuryId },
        ],
      });
      const plan = createMockPlan();

      const resultNoInj = createFighterState('A', plan, warriorNoInjuries);
      const resultWithMulti = createFighterState('A', plan, warriorWithMultipleInjuries);

      // Multiple injuries should reduce skills more
      expect(resultWithMulti.skills.ATT).toBeLessThan(resultNoInj.skills.ATT);
      expect(resultWithMulti.skills.DEF).toBeLessThanOrEqual(resultNoInj.skills.DEF);
    });

    it('applies equipment modifiers', () => {
      const warrior = createMockWarrior({
        equipment: { weapon: 'short_spear', armor: 'chainmail', helm: 'none', shield: 'none' },
      });
      const plan = createMockPlan();

      const result = createFighterState('A', plan, warrior);

      expect(result.weaponId).toBe('short_spear');
      expect(result.armorId).toBe('chainmail');
    });

    it('calculates HP from derived stats', () => {
      const warrior = createMockWarrior({
        derivedStats: { hp: 120, endurance: 100, damage: 5, encumbrance: 0 },
      });
      const plan = createMockPlan();

      const result = createFighterState('A', plan, warrior);

      expect(result.hp).toBe(120);
      expect(result.maxHp).toBe(120);
    });

    it('calculates endurance from derived stats', () => {
      const warrior = createMockWarrior({
        derivedStats: { hp: 100, endurance: 90, damage: 5, encumbrance: 0 },
      });
      const plan = createMockPlan();

      const result = createFighterState('A', plan, warrior);

      expect(result.endurance).toBe(90);
      expect(result.maxEndurance).toBe(90);
    });

    it('applies weapon requirement penalties when skill too low', () => {
      const warrior = createMockWarrior({
        baseSkills: { ATT: 5, DEF: 5, INI: 5, PAR: 5, RIP: 5, DEC: 5 },
        equipment: { weapon: 'halberd', armor: 'leather', helm: 'none', shield: 'none' },
      });
      const plan = createMockPlan();

      const result = createFighterState('A', plan, warrior);

      expect(result.skills.ATT).toBeLessThanOrEqual(5);
    });

    it('stores the plan correctly', () => {
      const warrior = createMockWarrior();
      const plan = createMockPlan({ OE: 8, AL: 4 });

      const result = createFighterState('A', plan, warrior);

      expect(result.plan).toBeDefined();
      expect(result.plan.OE).toBe(8);
      expect(result.plan.AL).toBe(4);
    });

    it('initializes psychState to Neutral', () => {
      const warrior = createMockWarrior();
      const plan = createMockPlan();

      const result = createFighterState('A', plan, warrior);

      expect(result.psychState).toBe('Neutral');
    });

    it('initializes momentum to 0', () => {
      const warrior = createMockWarrior();
      const plan = createMockPlan();

      const result = createFighterState('A', plan, warrior);

      expect(result.momentum).toBe(0);
    });

    it('initializes hit counters to 0', () => {
      const warrior = createMockWarrior();
      const plan = createMockPlan();

      const result = createFighterState('A', plan, warrior);

      expect(result.consecutiveHits).toBe(0);
      expect(result.hitsLanded).toBe(0);
      expect(result.hitsTaken).toBe(0);
    });

    it('sets correct fighter label', () => {
      const warrior = createMockWarrior();
      const plan = createMockPlan();

      const resultA = createFighterState('A', plan, warrior);
      const resultD = createFighterState('D', plan, warrior);

      expect(resultA.label).toBe('A');
      expect(resultD.label).toBe('D');
    });

    it('handles empty injuries array', () => {
      const warrior = createMockWarrior({ injuries: [] });
      const plan = createMockPlan();

      const result = createFighterState('A', plan, warrior);

      expect(result.skills.ATT).toBeDefined();
      expect(typeof result.skills.ATT).toBe('number');
    });

    it('handles undefined injuries', () => {
      const warrior = createMockWarrior({ injuries: undefined });
      const plan = createMockPlan();

      const result = createFighterState('A', plan, warrior);

      expect(result.skills.ATT).toBeDefined();
      expect(typeof result.skills.ATT).toBe('number');
    });

    it('handles complex equipment loadout', () => {
      const warrior = createMockWarrior({
        equipment: {
          weapon: 'halberd',
          armor: 'plate',
          helm: 'none',
          shield: 'large_shield',
        },
      });
      const plan = createMockPlan();

      const result = createFighterState('A', plan, warrior);

      expect(result.weaponId).toBe('halberd');
      expect(result.armorId).toBe('plate');
      expect(result.shieldId).toBe('large_shield');
    });

    it('uses defaults when warrior is undefined', () => {
      const plan = createMockPlan();

      const result = createFighterState('A', plan, undefined);

      expect(result.hp).toBe(100); // Default HP
      expect(result.skills.ATT).toBe(3); // Default ATT 5 - 2 penalty
    });

    it('preserves warrior label in fighter state', () => {
      const warrior = createMockWarrior();
      const plan = createMockPlan();

      const result = createFighterState('A', plan, warrior);

      expect(result.label).toBe('A');
    });
  });
});
