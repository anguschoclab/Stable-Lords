import { describe, it, expect } from 'vitest';
import { generateRecommendations, getStyleEquipmentTips } from '@/engine/equipmentOptimizer';
import { getLoadoutWeight } from '@/data/equipment';
import { FightingStyle } from '@/types/shared.types';

describe('Equipment Optimizer', () => {
  describe('generateRecommendations', () => {
    it('should generate recommendations for Aimed Blow style', () => {
      const recommendations = generateRecommendations(FightingStyle.AimedBlow, 10);
      expect(recommendations).toBeDefined();
      expect(recommendations.length).toBeGreaterThan(0);
      expect(recommendations[0]).toHaveProperty('loadout');
      expect(recommendations[0]).toHaveProperty('label');
      expect(recommendations[0]).toHaveProperty('synergy');
    });

    it('should generate recommendations for Bashing Attack style', () => {
      const recommendations = generateRecommendations(FightingStyle.BashingAttack, 12);
      expect(recommendations).toBeDefined();
      expect(recommendations.length).toBeGreaterThan(0);
    });

    it('should generate recommendations for Total Parry style', () => {
      const recommendations = generateRecommendations(FightingStyle.TotalParry, 15);
      expect(recommendations).toBeDefined();
      expect(recommendations.length).toBeGreaterThan(0);
    });

    it('should include preferred weapon in loadout', () => {
      const recommendations = generateRecommendations(FightingStyle.AimedBlow, 10);
      const rec = recommendations[0];
      if (rec) {
        expect(rec.breakdown.weapon.preferred).toBe(true);
      }
    });

    it('should calculate synergy score correctly', () => {
      const recommendations = generateRecommendations(FightingStyle.AimedBlow, 10);
      const rec = recommendations[0];
      if (rec) {
        expect(rec.synergy).toBeGreaterThanOrEqual(0);
        expect(rec.synergy).toBeLessThanOrEqual(100);
      }
    });

    it('can recommend Fist for Aimed Blow (canonically Well-suited)', () => {
      const recommendations = generateRecommendations(FightingStyle.AimedBlow, 10);
      expect(recommendations.some((r) => r.loadout.weapon === 'fist')).toBe(true);
    });

    it('should calculate total weight correctly', () => {
      const recommendations = generateRecommendations(FightingStyle.AimedBlow, 10);
      for (const rec of recommendations) {
        // totalWeight must equal the actual summed loadout weight (≥ 0 — a light
        // unarmed Aimed-Blow build using Fist can legitimately weigh very little).
        expect(rec.totalWeight).toBe(getLoadoutWeight(rec.loadout));
        expect(rec.totalWeight).toBeGreaterThanOrEqual(0);
      }
    });
  });

  describe('getStyleEquipmentTips', () => {
    it('should return tips for Aimed Blow style', () => {
      const tips = getStyleEquipmentTips(FightingStyle.AimedBlow);
      expect(tips).toBeDefined();
      expect(Array.isArray(tips)).toBe(true);
      expect(tips.length).toBeGreaterThan(0);
    });

    it('should return tips for Bashing Attack style', () => {
      const tips = getStyleEquipmentTips(FightingStyle.BashingAttack);
      expect(tips).toBeDefined();
      expect(Array.isArray(tips)).toBe(true);
      expect(tips.length).toBeGreaterThan(0);
    });

    it('should return tips for Total Parry style', () => {
      const tips = getStyleEquipmentTips(FightingStyle.TotalParry);
      expect(tips).toBeDefined();
      expect(Array.isArray(tips)).toBe(true);
      expect(tips.length).toBeGreaterThan(0);
    });

    it('should return relevant tips about weapon preferences', () => {
      const tips = getStyleEquipmentTips(FightingStyle.AimedBlow);
      const hasWeaponTip = tips.some(
        (tip) =>
          tip.toLowerCase().includes('weapon') ||
          tip.toLowerCase().includes('dagger') ||
          tip.toLowerCase().includes('epée')
      );
      expect(hasWeaponTip).toBe(true);
    });

    it('should return relevant tips about armor', () => {
      const tips = getStyleEquipmentTips(FightingStyle.AimedBlow);
      const hasArmorTip = tips.some((tip) => tip.toLowerCase().includes('armor'));
      expect(hasArmorTip).toBe(true);
    });
  });

  describe('tank profile selects heaviest valid armor and helm (Bug 5)', () => {
    it('TotalParry tank recommendation uses plate_armor', () => {
      const recs = generateRecommendations(FightingStyle.TotalParry, 30);
      const tankRec = recs[0]; // tank is first profile for TotalParry
      expect(tankRec?.loadout.armor).toBe('plate_armor');
    });

    it('TotalParry tank recommendation uses full_helm', () => {
      const recs = generateRecommendations(FightingStyle.TotalParry, 30);
      const tankRec = recs[0];
      expect(tankRec?.loadout.helm).toBe('full_helm');
    });

    it('WallOfSteel tank recommendation uses plate_armor', () => {
      const recs = generateRecommendations(FightingStyle.WallOfSteel, 30);
      const tankRec = recs[0]; // tank is first profile for WallOfSteel
      expect(tankRec?.loadout.armor).toBe('plate_armor');
    });

    it('BashingAttack tank recommendation uses plate_armor', () => {
      // BashingAttack profiles: ['damage', 'tank'], so tank is index 1
      const recs = generateRecommendations(FightingStyle.BashingAttack, 30);
      const tankRec = recs[1];
      expect(tankRec?.loadout.armor).toBe('plate_armor');
    });
  });

  describe('balanced profile armor selection (Amendment 8)', () => {
    it('balanced recommendation prefers leather over padded for body protection', () => {
      const recs = generateRecommendations(FightingStyle.ParryRiposte, 15);
      // ParryRiposte profiles: ['balanced', 'speed'], balanced is first
      const balancedRec = recs[0];
      // leather (weight 4) should score higher than padded (weight 2) for balanced
      expect(balancedRec?.loadout.armor).toBe('leather');
    });
  });

  describe('shield pool and dual-wield recommendations', () => {
    const ALL_STYLES = Object.values(FightingStyle);

    it('two-handed weapon forces none_shield with blocked: true', () => {
      const recs = generateRecommendations(FightingStyle.AimedBlow, 10);
      // AimedBlow profiles: ['speed', 'balanced'] — balanced is index 1
      // Balanced selects quarterstaff (two-handed, CW)
      expect(recs[1]?.loadout.shield).toBe('none_shield');
      expect(recs[1]?.breakdown.shield.blocked).toBe(true);
    });

    it('one-handed weapon does not set blocked', () => {
      const recs = generateRecommendations(FightingStyle.AimedBlow, 10);
      // Speed profile (index 0) selects a one-handed weapon
      expect(recs[0]?.breakdown.shield.blocked).toBe(false);
    });

    it('all 10 styles produce valid recommendations with defined shields', () => {
      for (const style of ALL_STYLES) {
        const recs = generateRecommendations(style, 12);
        for (const rec of recs) {
          expect(rec.loadout.shield).toBeTruthy();
          expect(rec.breakdown.shield.item).toBeTruthy();
        }
      }
    });

    it('TotalParry tank recommends a real shield in offhand', () => {
      const recs = generateRecommendations(FightingStyle.TotalParry, 30);
      // TotalParry profiles: ['tank', 'balanced'] — tank is index 0
      const tankRec = recs[0];
      expect(['small_shield', 'medium_shield', 'large_shield']).toContain(tankRec?.loadout.shield);
      expect(tankRec?.breakdown.shield.blocked).toBe(false);
    });

    it('ParryRiposte balanced recommends small_shield in offhand', () => {
      const recs = generateRecommendations(FightingStyle.ParryRiposte, 15);
      // ParryRiposte profiles: ['balanced', 'speed'] — balanced is index 0
      // small_shield: balanced score 15 > none_shield score 5; not restricted
      expect(recs[0]?.loadout.shield).toBe('small_shield');
    });

    it('AimedBlow cannot get medium_shield or large_shield', () => {
      const recs = generateRecommendations(FightingStyle.AimedBlow, 20);
      for (const rec of recs) {
        expect(rec.loadout.shield).not.toBe('medium_shield');
        expect(rec.loadout.shield).not.toBe('large_shield');
      }
    });

    it('speed profile always prefers none_shield', () => {
      // Styles that have a speed profile
      const speedStyles = [
        FightingStyle.AimedBlow,      // ['speed', 'balanced']
        FightingStyle.LungingAttack,  // ['speed', 'balanced']
        FightingStyle.ParryLunge,     // ['balanced', 'speed']
        FightingStyle.ParryRiposte,   // ['balanced', 'speed']
      ];
      for (const style of speedStyles) {
        const recs = generateRecommendations(style, 12);
        const profiles = style === FightingStyle.AimedBlow || style === FightingStyle.LungingAttack
          ? [0]  // speed is index 0
          : [1]; // speed is index 1
        for (const idx of profiles) {
          expect(recs[idx]?.loadout.shield, `speed rec for ${style}`).toBe('none_shield');
        }
      }
    });

    it('totalWeight includes shield weight when real shield is recommended', () => {
      const recs = generateRecommendations(FightingStyle.TotalParry, 30);
      const tankRec = recs[0];
      expect(tankRec?.totalWeight).toBe(getLoadoutWeight(tankRec!.loadout));
    });

    it('synergy score remains in [0, 100] across all styles', () => {
      for (const style of ALL_STYLES) {
        const recs = generateRecommendations(style, 12);
        for (const rec of recs) {
          expect(rec.synergy).toBeGreaterThanOrEqual(0);
          expect(rec.synergy).toBeLessThanOrEqual(100);
        }
      }
    });

    it('TotalParry tank may select shield as weapon (dual shields)', () => {
      const recs = generateRecommendations(FightingStyle.TotalParry, 30);
      const tankRec = recs[0];
      // TotalParry CW weapons are shields: medium_shield, large_shield
      expect(['medium_shield', 'large_shield']).toContain(tankRec?.loadout.weapon);
      // Shields are not two-handed, so shield slot is not blocked
      expect(tankRec?.breakdown.shield.blocked).toBe(false);
    });

    it('all blocked: true recs have loadout.shield === none_shield', () => {
      for (const style of ALL_STYLES) {
        const recs = generateRecommendations(style, 12);
        for (const rec of recs) {
          if (rec.breakdown.shield.blocked) {
            expect(rec.loadout.shield, `blocked rec for ${style}`).toBe('none_shield');
          }
        }
      }
    });
  });
});
