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
      equipment: { weapon: 'broadsword', armor: 'leather', helm: 'none_helm', shield: 'none_shield' },
      derivedStats: { hp: 100, endurance: 100, damage: 5, encumbrance: 0 },
      ...overrides,
    }) as Warrior;

  const createMockPlan = (overrides: Partial<FightPlan> = {}): FightPlan => ({
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
          {
            name: 'Sprained Wrist',
            description: 'test',
            severity: 'Minor',
            penalties: { ATT: -2, DF: -1 },
            weeksRemaining: 2,
            id: 'inj-1' as InjuryId,
          },
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
          {
            name: 'Injury1',
            description: 'test',
            severity: 'Minor',
            penalties: { ATT: -2 },
            weeksRemaining: 2,
            id: 'inj-1' as InjuryId,
          },
          {
            name: 'Injury2',
            description: 'test',
            severity: 'Moderate',
            penalties: { ATT: -3, DEF: -2 },
            weeksRemaining: 3,
            id: 'inj-2' as InjuryId,
          },
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
        equipment: { weapon: 'short_spear', armor: 'chain_mail', helm: 'none_helm', shield: 'none_shield' },
      });
      const plan = createMockPlan();

      const result = createFighterState('A', plan, warrior);

      expect(result.weaponId).toBe('short_spear');
      expect(result.armorId).toBe('chain_mail');
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
        equipment: { weapon: 'halberd', armor: 'leather', helm: 'none_helm', shield: 'none_shield' },
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
          armor: 'plate_mail',
          helm: 'none_helm',
          shield: 'large_shield',
        },
      });
      const plan = createMockPlan();

      const result = createFighterState('A', plan, warrior);

      expect(result.weaponId).toBe('halberd');
      expect(result.armorId).toBe('plate_mail');
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

  // ─── T5: Equipment defense / encumbrance tier / shield wiring ───────────────

  describe('equipment defenseMod integration', () => {
    it('armor defenseMod raises effSkills.DEF', () => {
      const base = createMockWarrior({
        equipment: { weapon: 'broadsword', armor: 'none_armor', shield: 'none_shield', helm: 'none_helm' },
      });
      const armored = createMockWarrior({
        equipment: { weapon: 'broadsword', armor: 'leather', shield: 'none_shield', helm: 'none_helm' },
      });
      const plan = createMockPlan();
      const rBase = createFighterState('A', plan, base);
      const rArmored = createFighterState('A', plan, armored);
      // leather defenseMod = 1
      expect(rArmored.skills.DEF).toBeGreaterThan(rBase.skills.DEF);
    });

    it('helm defenseMod raises effSkills.DEF further', () => {
      const noHelm = createMockWarrior({
        equipment: { weapon: 'broadsword', armor: 'leather', shield: 'none_shield', helm: 'none_helm' },
      });
      const withHelm = createMockWarrior({
        equipment: { weapon: 'broadsword', armor: 'leather', shield: 'none_shield', helm: 'helm' },
      });
      const plan = createMockPlan();
      const rNoHelm = createFighterState('A', plan, noHelm);
      const rWithHelm = createFighterState('A', plan, withHelm);
      // helm defenseMod = 1, so DEF should increase by 1
      expect(rWithHelm.skills.DEF).toBeGreaterThan(rNoHelm.skills.DEF);
    });
  });

  describe('encumbrance tier penalties', () => {
    it('HEAVY encumbrance reduces INI, DEF, and PAR', () => {
      // Build a loadout that hits HEAVY tier (ratio 1.0-1.2)
      // halberd weight=8, plate_mail weight=12, large_shield weight=6, full_helm weight=4 = 30 total
      // carryCap (encumbrance) = 30 → ratio = 1.0 → HEAVY
      const heavy = createMockWarrior({
        equipment: { weapon: 'halberd', armor: 'plate_mail', shield: 'large_shield', helm: 'full_helm' },
        derivedStats: { hp: 100, endurance: 100, damage: 5, encumbrance: 30 },
      });
      // Same loadout but with carry cap well above weight → NONE tier
      const unencumbered = createMockWarrior({
        equipment: { weapon: 'halberd', armor: 'plate_mail', shield: 'large_shield', helm: 'full_helm' },
        derivedStats: { hp: 100, endurance: 100, damage: 5, encumbrance: 100 },
      });
      const plan = createMockPlan();
      const rHeavy = createFighterState('A', plan, heavy);
      const rUnenc = createFighterState('A', plan, unencumbered);

      // HEAVY tier: iniPenalty=-3, defPenalty=-1, parPenalty=-1
      expect(rHeavy.skills.INI).toBeLessThan(rUnenc.skills.INI);
      expect(rHeavy.skills.DEF).toBeLessThan(rUnenc.skills.DEF);
      expect(rHeavy.skills.PAR).toBeLessThan(rUnenc.skills.PAR);
    });

    it('OVER encumbrance has larger penalties than HEAVY', () => {
      // Same heavy loadout (weight 30), carryCap = 20 → ratio = 1.5 → OVER
      const over = createMockWarrior({
        equipment: { weapon: 'halberd', armor: 'plate_mail', shield: 'large_shield', helm: 'full_helm' },
        derivedStats: { hp: 100, endurance: 100, damage: 5, encumbrance: 20 },
      });
      const heavy = createMockWarrior({
        equipment: { weapon: 'halberd', armor: 'plate_mail', shield: 'large_shield', helm: 'full_helm' },
        derivedStats: { hp: 100, endurance: 100, damage: 5, encumbrance: 30 },
      });
      const plan = createMockPlan();
      const rOver = createFighterState('A', plan, over);
      const rHeavy = createFighterState('A', plan, heavy);

      expect(rOver.skills.INI).toBeLessThan(rHeavy.skills.INI);
    });

    it('LIGHT encumbrance only penalizes INI, not DEF or PAR', () => {
      // broadsword weight=4, leather weight=4, none_shield=0, none_helm=0 = 8 total
      // carryCap = 12 → ratio = 0.667 → LIGHT
      const light = createMockWarrior({
        equipment: { weapon: 'broadsword', armor: 'leather', shield: 'none_shield', helm: 'none_helm' },
        derivedStats: { hp: 100, endurance: 100, damage: 5, encumbrance: 12 },
      });
      const none = createMockWarrior({
        equipment: { weapon: 'broadsword', armor: 'leather', shield: 'none_shield', helm: 'none_helm' },
        derivedStats: { hp: 100, endurance: 100, damage: 5, encumbrance: 100 },
      });
      const plan = createMockPlan();
      const rLight = createFighterState('A', plan, light);
      const rNone = createFighterState('A', plan, none);

      expect(rLight.skills.INI).toBeLessThan(rNone.skills.INI);
      expect(rLight.skills.DEF).toBe(rNone.skills.DEF);
      expect(rLight.skills.PAR).toBe(rNone.skills.PAR);
    });
  });

  describe('shield slot wiring', () => {
    it('shield in shield slot raises PAR and DEF', () => {
      const noShield = createMockWarrior({
        equipment: { weapon: 'broadsword', armor: 'leather', shield: 'none_shield', helm: 'none_helm' },
      });
      const withShield = createMockWarrior({
        equipment: { weapon: 'broadsword', armor: 'leather', shield: 'small_shield', helm: 'none_helm' },
      });
      const plan = createMockPlan();
      const rNo = createFighterState('A', plan, noShield);
      const rWith = createFighterState('A', plan, withShield);

      // small_shield: shieldParryBonus=1 → +1 PAR, +1 DEF
      expect(rWith.skills.PAR).toBeGreaterThan(rNo.skills.PAR);
      expect(rWith.skills.DEF).toBeGreaterThan(rNo.skills.DEF);
    });

    it('shield in weapon slot raises PAR and DEF and applies ATT penalty', () => {
      const noShield = createMockWarrior({
        equipment: { weapon: 'broadsword', armor: 'leather', shield: 'none_shield', helm: 'none_helm' },
      });
      // large_shield in weapon slot: shieldParryBonus=3, shieldAttPenalty=-1
      const withWeaponShield = createMockWarrior({
        equipment: { weapon: 'large_shield', armor: 'leather', shield: 'none_shield', helm: 'none_helm' },
      });
      const plan = createMockPlan();
      const rNo = createFighterState('A', plan, noShield);
      const rWith = createFighterState('A', plan, withWeaponShield);

      expect(rWith.skills.PAR).toBeGreaterThan(rNo.skills.PAR);
      expect(rWith.skills.DEF).toBeGreaterThan(rNo.skills.DEF);
      // large_shield has shieldAttPenalty=-1, broadsword has no penalty
      // But broadsword is the classic weapon for StrikingAttack (+1 ATT bonus)
      // while large_shield is not → so ATT should be lower
      expect(rWith.skills.ATT).toBeLessThan(rNo.skills.ATT);
    });

    it('dual-slot shields stack PAR and DEF bonuses', () => {
      const singleSlot = createMockWarrior({
        equipment: { weapon: 'broadsword', armor: 'leather', shield: 'small_shield', helm: 'none_helm' },
      });
      const dualSlot = createMockWarrior({
        equipment: { weapon: 'small_shield', armor: 'leather', shield: 'medium_shield', helm: 'none_helm' },
      });
      const plan = createMockPlan();
      const rSingle = createFighterState('A', plan, singleSlot);
      const rDual = createFighterState('A', plan, dualSlot);

      // small_shield(weapon) + medium_shield(shield) = 1+2 = 3 parry/def
      // vs small_shield(shield) only = 1 parry/def
      expect(rDual.skills.PAR).toBeGreaterThan(rSingle.skills.PAR);
      expect(rDual.skills.DEF).toBeGreaterThan(rSingle.skills.DEF);
    });
  });
});
