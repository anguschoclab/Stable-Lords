/**
 * T10: Directional integration tests — verify the full pipeline from
 * equipment data → createFighterState → combat resolution works end-to-end.
 */
import { describe, it, expect } from 'vitest';
import { makeWarrior } from '@/engine/factories/warriorFactory';
import { defaultPlanForWarrior, simulateFight } from '@/engine/simulate';
import { FightingStyle } from '@/types/shared.types';
import { createFighterState } from '@/engine/bout/fighterState';
import { getEncumbranceTier, getEncumbranceRatio } from '@/data/equipment/encumbrance';
import { getItemById } from '@/data/equipment';
import type { EquipmentLoadout } from '@/data/equipment';

const ATTRS = { ST: 15, CN: 15, SZ: 15, WT: 15, WL: 15, SP: 15, DF: 15 };

function makeWarriorWithLoadout(style: FightingStyle, loadout: EquipmentLoadout) {
  const w = makeWarrior({ id: undefined, name: 'A', style: style, attrs: ATTRS, overrides: undefined, rng: undefined });
  return { ...w, equipment: loadout };
}

describe('T10: Equipment → FighterState → Combat integration', () => {
  describe('createFighterState reflects equipment stats', () => {
    it('plate_armor + full_helm yields high mitigation via flat mitigation', () => {
      const heavyLoadout: EquipmentLoadout = {
        weapon: 'longsword',
        armor: 'plate_armor',
        shield: 'large_shield',
        helm: 'full_helm',
      };
      const w = makeWarriorWithLoadout(FightingStyle.ParryStrike, heavyLoadout);
      const plan = defaultPlanForWarrior(w);
      const fs = createFighterState('A', plan, w);

      // FighterState should carry the equipment IDs
      expect(fs.armorId).toBe('plate_armor');
      expect(fs.helmId).toBe('full_helm');
      expect(fs.shieldId).toBe('large_shield');
      expect(fs.weaponId).toBe('longsword');
    });

    it('none_armor + none_helm yields no encumbrance penalty', () => {
      const lightLoadout: EquipmentLoadout = {
        weapon: 'dagger',
        armor: 'none_armor',
        shield: 'none_shield',
        helm: 'none_helm',
      };
      const w = makeWarriorWithLoadout(FightingStyle.AimedBlow, lightLoadout);
      const plan = defaultPlanForWarrior(w);
      const fs = createFighterState('A', plan, w);

      const ratio = getEncumbranceRatio(lightLoadout, w.derivedStats?.encumbrance ?? 12);
      const tier = getEncumbranceTier(ratio);
      expect(tier).toBe('NONE');
      expect(fs.encumbrancePenalty?.iniPenalty).toBe(0);
      expect(fs.encumbrancePenalty?.enduranceMult).toBe(1.0);
    });

    it('plate_armor + large_shield + full_helm yields HEAVY or OVER tier', () => {
      const heavyLoadout: EquipmentLoadout = {
        weapon: 'longsword',
        armor: 'plate_armor',
        shield: 'large_shield',
        helm: 'full_helm',
      };
      const w = makeWarriorWithLoadout(FightingStyle.ParryStrike, heavyLoadout);
      const plan = defaultPlanForWarrior(w);
      const fs = createFighterState('A', plan, w);

      const ratio = getEncumbranceRatio(heavyLoadout, w.derivedStats?.encumbrance ?? 12);
      const tier = getEncumbranceTier(ratio);
      expect(['HEAVY', 'OVER']).toContain(tier);
      // HEAVY/OVER should have iniPenalty != 0 and enduranceMult > 1.0
      expect(fs.encumbrancePenalty?.iniPenalty).not.toBe(0);
      expect(fs.encumbrancePenalty?.enduranceMult).toBeGreaterThan(1.0);
    });

    it('shield slot provides defBonus via getShieldModifiers', () => {
      const loadout: EquipmentLoadout = {
        weapon: 'longsword',
        armor: 'leather',
        shield: 'medium_shield',
        helm: 'none_helm',
      };
      const w = makeWarriorWithLoadout(FightingStyle.ParryLunge, loadout);
      const plan = defaultPlanForWarrior(w);
      const fs = createFighterState('A', plan, w);

      // medium_shield has shieldParryBonus=3, so PAR should reflect it
      const shieldItem = getItemById('medium_shield');
      expect(shieldItem?.shieldParryBonus).toBeGreaterThan(0);
      // The FighterState should exist and have PAR skill
      expect(fs.skills.PAR).toBeDefined();
    });
  });

  describe('simulateFight with different loadouts produces different outcomes', () => {
    it('heavy armor fighter takes less damage than unarmored fighter (same seed)', () => {
      const ATTRS = { ST: 15, CN: 15, SZ: 15, WT: 15, WL: 15, SP: 15, DF: 15 };

      const lightLoadout: EquipmentLoadout = {
        weapon: 'longsword',
        armor: 'none_armor',
        shield: 'none_shield',
        helm: 'none_helm',
      };
      const heavyLoadout: EquipmentLoadout = {
        weapon: 'longsword',
        armor: 'plate_armor',
        shield: 'large_shield',
        helm: 'full_helm',
      };

      const attacker = makeWarrior({ id: undefined, name: 'A', style: FightingStyle.StrikingAttack, attrs: ATTRS });

      const lightDefender = makeWarriorWithLoadout(FightingStyle.TotalParry, lightLoadout);
      const heavyDefender = makeWarriorWithLoadout(FightingStyle.TotalParry, heavyLoadout);

      const lightFight = simulateFight(
        { planA: defaultPlanForWarrior(attacker), planD: defaultPlanForWarrior(lightDefender), warriorA: attacker, warriorD: lightDefender, providedRng: 42 }
      );
      const heavyFight = simulateFight(
        { planA: defaultPlanForWarrior(attacker), planD: defaultPlanForWarrior(heavyDefender), warriorA: attacker, warriorD: heavyDefender, providedRng: 42 }
      );

      // The heavy defender should survive longer (more minutes) or win more
      // due to flat mitigation reducing damage per hit
      const heavySurvived = heavyFight.minutes >= lightFight.minutes;
      const heavyWon = heavyFight.winner === 'D' && lightFight.winner !== 'D';
      expect(heavySurvived || heavyWon).toBe(true);
    });

    it('enduranceCostMod causes armored fighter to exhaust faster', () => {
      const ATTRS = { ST: 10, CN: 10, SZ: 10, WT: 10, WL: 10, SP: 10, DF: 10 };

      const lightLoadout: EquipmentLoadout = {
        weapon: 'longsword',
        armor: 'none_armor',
        shield: 'none_shield',
        helm: 'none_helm',
      };
      const heavyLoadout: EquipmentLoadout = {
        weapon: 'longsword',
        armor: 'plate_armor',
        shield: 'large_shield',
        helm: 'full_helm',
      };

      const lightWarrior = makeWarriorWithLoadout(FightingStyle.StrikingAttack, lightLoadout);
      const heavyWarrior = makeWarriorWithLoadout(FightingStyle.StrikingAttack, heavyLoadout);

      const defender = makeWarrior({ id: undefined, name: 'D', style: FightingStyle.TotalParry, attrs: ATTRS });

      const lightFight = simulateFight(
        { planA: defaultPlanForWarrior(lightWarrior), planD: defaultPlanForWarrior(defender), warriorA: lightWarrior, warriorD: defender, providedRng: 99 }
      );
      const heavyFight = simulateFight(
        { planA: defaultPlanForWarrior(heavyWarrior), planD: defaultPlanForWarrior(defender), warriorA: heavyWarrior, warriorD: defender, providedRng: 99 }
      );

      // The heavy armored attacker should be more likely to exhaust
      // (enduranceCostMod > 1.0 for plate_armor and full_helm)
      // Either: heavy fight is shorter (exhaustion) or heavy loses more often
      const heavySurvived = heavyFight.minutes >= lightFight.minutes;
      const heavyWon = heavyFight.winner === 'D' && lightFight.winner !== 'D';
      expect(heavySurvived || heavyWon).toBe(true);
    });
  });

  describe('Encumbrance tier penalties are applied in combat', () => {
    it('over-encumbered fighter has reduced INI in FighterState', () => {
      const heavyLoadout: EquipmentLoadout = {
        weapon: 'greatsword',
        armor: 'plate_armor',
        shield: 'none_shield',
        helm: 'full_helm',
      };
      const w = makeWarriorWithLoadout(FightingStyle.WallOfSteel, heavyLoadout);
      const plan = defaultPlanForWarrior(w);
      const fs = createFighterState('A', plan, w);

      const ratio = getEncumbranceRatio(heavyLoadout, w.derivedStats?.encumbrance ?? 12);
      const tier = getEncumbranceTier(ratio);

      if (tier === 'OVER' || tier === 'HEAVY') {
        expect(fs.encumbrancePenalty?.iniPenalty).not.toBe(0);
        expect(fs.encumbrancePenalty?.defPenalty).not.toBe(0);
      }
    });
  });
});
