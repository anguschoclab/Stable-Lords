/**
 * Style Passives Tests — combat mechanics, tempo, mastery, kill mechanics
 */
import { describe, it, expect } from 'vitest';
import {
  getTempoBonus,
  getEnduranceMult,
  getMastery,
  getStylePassive,
  getKillMechanic,
  getStyleIdentity,
  getStyleAntiSynergy,
  type Phase,
} from '@/engine/stylePassives';
import { FightingStyle } from '@/types/game';

describe('Style Passives', () => {
  describe('getStyleIdentity', () => {
    it('should return correct identity for Aimed Blow', () => {
      const identity = getStyleIdentity(FightingStyle.AimedBlow);
      expect(identity.voice).toBe('Surgical');
      expect(identity.attackFreq).toBe('Sparing');
      expect(identity.killBias).toBe('Methodical');
      expect(identity.fatigueBurn).toBe('Low');
      expect(identity.tagline).toBe('patient surgeon of the arena');
    });
  });

  describe('fallback behaviors', () => {
    it('should handle invalid fighting styles safely', () => {
      const invalidStyle = 'InvalidStyle' as FightingStyle;

      const tempo = getTempoBonus(invalidStyle, 'OPENING');
      expect(tempo).toBe(0);

      const endMult = getEnduranceMult(invalidStyle);
      expect(endMult).toBe(1.0);

      const passive = getStylePassive(invalidStyle, {
        phase: 'MID',
        exchange: 0,
        hitsLanded: 0,
        hitsTaken: 0,
        ripostes: 0,
        consecutiveHits: 0,
        hpRatio: 1,
        endRatio: 1,
        opponentStyle: FightingStyle.StrikingAttack,
        totalFights: 0,
      });
      expect(passive.attBonus).toBe(0);
      expect(passive.mastery).toBe('Novice');

      const killMech = getKillMechanic(invalidStyle, {
        phase: 'MID',
        hitsLanded: 0,
        consecutiveHits: 0,
        hitLocation: 'torso',
      });
      expect(killMech.killBonus).toBe(0);
      expect(killMech.killNarrative).toBe('strikes home!');

      const antiSyn = getStyleAntiSynergy(invalidStyle);
      expect(antiSyn.offMult).toBe(1.0);
      expect(antiSyn.defMult).toBe(1.0);
    });
  });

  describe('getTempoBonus', () => {
    it('should return phase-specific bonuses for each style', () => {
      const opening = getTempoBonus(FightingStyle.LungingAttack, 'OPENING');
      const mid = getTempoBonus(FightingStyle.LungingAttack, 'MID');
      const late = getTempoBonus(FightingStyle.LungingAttack, 'LATE');

      expect(opening).toBeGreaterThan(mid);
      expect(opening).toBeGreaterThan(late);
    });

    it('should give Total Parry negative opening tempo', () => {
      const tempo = getTempoBonus(FightingStyle.TotalParry, 'OPENING');
      expect(tempo).toBeLessThan(0);
    });

    it('should give Wall of Steel positive late tempo', () => {
      const tempo = getTempoBonus(FightingStyle.WallOfSteel, 'LATE');
      expect(tempo).toBeGreaterThan(0);
    });

    it('should give Aimed Blow positive late tempo', () => {
      const tempo = getTempoBonus(FightingStyle.AimedBlow, 'LATE');
      expect(tempo).toBeGreaterThan(0);
    });
  });

  describe('getEnduranceMult', () => {
    it('should return multipliers less than or equal to 1.0 for efficient styles', () => {
      const tp = getEnduranceMult(FightingStyle.TotalParry);
      const ws = getEnduranceMult(FightingStyle.WallOfSteel);
      const ab = getEnduranceMult(FightingStyle.AimedBlow);

      expect(tp).toBeLessThanOrEqual(1.0);
      expect(ws).toBeLessThanOrEqual(1.0);
      expect(ab).toBeLessThanOrEqual(1.0);
    });

    it('should return multipliers greater than 1.0 for wasteful styles', () => {
      const lu = getEnduranceMult(FightingStyle.LungingAttack);
      expect(lu).toBeGreaterThan(1.0);
    });
  });

  describe('getMastery', () => {
    it('should return Novice for 0-9 fights, and negative fights', () => {
      expect(getMastery(-1).tier).toBe('Novice');
      expect(getMastery(0).tier).toBe('Novice');
      expect(getMastery(5).tier).toBe('Novice');
      expect(getMastery(9).tier).toBe('Novice');
    });

    it('should return Practiced for 10-19 fights', () => {
      expect(getMastery(10).tier).toBe('Practiced');
      expect(getMastery(15).tier).toBe('Practiced');
      expect(getMastery(19).tier).toBe('Practiced');
    });

    it('should return Veteran for 20-29 fights', () => {
      expect(getMastery(20).tier).toBe('Veteran');
      expect(getMastery(25).tier).toBe('Veteran');
      expect(getMastery(29).tier).toBe('Veteran');
    });

    it('should return Master for 30-49 fights', () => {
      expect(getMastery(30).tier).toBe('Master');
      expect(getMastery(40).tier).toBe('Master');
      expect(getMastery(49).tier).toBe('Master');
    });

    it('should return Grandmaster for 50+ fights', () => {
      expect(getMastery(50).tier).toBe('Grandmaster');
      expect(getMastery(100).tier).toBe('Grandmaster');
    });

    it('should increase multipliers with mastery tier', () => {
      const novice = getMastery(0);
      const veteran = getMastery(20);
      const grandmaster = getMastery(50);

      expect(veteran.mult).toBeGreaterThan(novice.mult);
      expect(grandmaster.mult).toBeGreaterThan(veteran.mult);
    });
  });

  describe('getStylePassive', () => {
    const baseContext = {
      phase: 'MID' as Phase,
      exchange: 5,
      hitsLanded: 2,
      hitsTaken: 1,
      ripostes: 0,
      consecutiveHits: 0,
      hpRatio: 0.8,
      endRatio: 0.7,
      opponentStyle: FightingStyle.StrikingAttack,
      totalFights: 0,
    };

    it('should return passive bonuses for Aimed Blow when targeting', () => {
      const passive = getStylePassive(FightingStyle.AimedBlow, {
        ...baseContext,
        targetedLocation: 'Head',
      });

      expect(passive.attBonus).toBeGreaterThan(0);
      expect(passive.critChance).toBeGreaterThan(0);
    });

    it('should give Aimed Blow a smaller bonus without targeting (and a larger one with targeting)', () => {
      // Tuned 2026-04: AB used to have zero passive without targeting, which made
      // default-plan AB warriors (target='Any') a 17% W% style. Now AB always
      // gets a baseline attBonus + crit, with a stronger bonus when targeting.
      const untargeted = getStylePassive(FightingStyle.AimedBlow, {
        ...baseContext,
        targetedLocation: 'Any',
      });
      const targeted = getStylePassive(FightingStyle.AimedBlow, {
        ...baseContext,
        targetedLocation: 'Head',
      });

      expect(untargeted.attBonus).toBeGreaterThan(0);
      expect(untargeted.critChance).toBeGreaterThan(0);
      expect(targeted.attBonus).toBeGreaterThan(untargeted.attBonus);
      expect(targeted.critChance).toBeGreaterThan(untargeted.critChance);
    });

    it('should increase Bashing Attack damage with consecutive hits', () => {
      const passive0 = getStylePassive(FightingStyle.BashingAttack, {
        ...baseContext,
        consecutiveHits: 0,
      });
      const passive3 = getStylePassive(FightingStyle.BashingAttack, {
        ...baseContext,
        consecutiveHits: 3,
      });

      expect(passive3.dmgBonus).toBeGreaterThan(passive0.dmgBonus);
    });

    it('should give Lunging Attack strong opening bonuses', () => {
      const opening = getStylePassive(FightingStyle.LungingAttack, {
        ...baseContext,
        exchange: 0,
        phase: 'OPENING',
        totalFights: 30,
      });
      const late = getStylePassive(FightingStyle.LungingAttack, {
        ...baseContext,
        exchange: 10,
        phase: 'LATE',
        totalFights: 30,
      });

      expect(opening.iniBonus).toBeGreaterThan(late.iniBonus);
    });

    it('should give Parry-Riposte bonuses for ripostes', () => {
      const passive = getStylePassive(FightingStyle.ParryRiposte, {
        ...baseContext,
        ripostes: 3,
      });

      expect(passive.ripBonus).toBeGreaterThan(0);
    });

    it('should penalize Parry-Riposte ATT in OPENING phase', () => {
      // Tuned 2026-04: PR's flat -1 attBonus made it a permanent offensive
      // minus across all phases (31% W%). Now the penalty is gated to OPENING
      // only — PR can ramp up offense as the fight progresses.
      const opening = getStylePassive(FightingStyle.ParryRiposte, {
        ...baseContext,
        phase: 'OPENING',
      });
      const mid = getStylePassive(FightingStyle.ParryRiposte, {
        ...baseContext,
        phase: 'MID',
      });
      expect(opening.attBonus).toBeLessThan(0);
      expect(mid.attBonus).toBeGreaterThanOrEqual(0);
    });

    it('should give Total Parry parry bonuses', () => {
      const passive = getStylePassive(FightingStyle.TotalParry, baseContext);
      expect(passive.parBonus).toBeGreaterThan(0);
    });

    it('should penalize Total Parry ATT', () => {
      const passive = getStylePassive(FightingStyle.TotalParry, baseContext);
      expect(passive.attBonus).toBeLessThan(0);
    });

    it('should increase Slashing Attack damage with hits landed', () => {
      const passive0 = getStylePassive(FightingStyle.SlashingAttack, {
        ...baseContext,
        hitsLanded: 0,
      });
      const passive5 = getStylePassive(FightingStyle.SlashingAttack, {
        ...baseContext,
        hitsLanded: 5,
      });

      expect(passive5.dmgBonus).toBeGreaterThan(passive0.dmgBonus);
    });

    it('should give Striking Attack consistent bonuses', () => {
      const passive = getStylePassive(FightingStyle.StrikingAttack, baseContext);
      expect(passive.attBonus).toBeGreaterThan(0);
      expect(passive.dmgBonus).toBeGreaterThan(0);
    });

    it('should increase Wall of Steel defense over time', () => {
      const early = getStylePassive(FightingStyle.WallOfSteel, {
        ...baseContext,
        exchange: 0,
      });
      const late = getStylePassive(FightingStyle.WallOfSteel, {
        ...baseContext,
        exchange: 15,
      });

      expect(late.defBonus).toBeGreaterThanOrEqual(early.defBonus);
    });

    it('should scale bonuses with mastery', () => {
      const novice = getStylePassive(FightingStyle.BashingAttack, {
        ...baseContext,
        totalFights: 0,
        consecutiveHits: 2,
      });
      const master = getStylePassive(FightingStyle.BashingAttack, {
        ...baseContext,
        totalFights: 30,
        consecutiveHits: 2,
      });

      expect(master.dmgBonus).toBeGreaterThanOrEqual(novice.dmgBonus);
    });
  });

  describe('getStyleAntiSynergy', () => {
    it('should penalize Bashing Attack for Lunging and Dodging/Riposte', () => {
      const antiLungeDodge = getStyleAntiSynergy(FightingStyle.BashingAttack, 'Lunge', 'Dodge');
      expect(antiLungeDodge.offMult).toBe(0.7);
      expect(antiLungeDodge.defMult).toBe(0.7);
      expect(antiLungeDodge.warning).toContain('heavy for effective lunging');
      expect(antiLungeDodge.warning).toContain('cannot dodge');

      const antiRiposte = getStyleAntiSynergy(FightingStyle.BashingAttack, undefined, 'Riposte');
      expect(antiRiposte.defMult).toBe(0.7);
    });

    it('should penalize Lunging Attack for Bashing and Parrying', () => {
      const antiBashParry = getStyleAntiSynergy(FightingStyle.LungingAttack, 'Bash', 'Parry');
      expect(antiBashParry.offMult).toBe(0.5);
      expect(antiBashParry.defMult).toBe(0.6);
      expect(antiBashParry.warning).toContain('lack the weight');
      expect(antiBashParry.warning).toContain('overextended');
    });

    it('should penalize Parry-Riposte for Bashing and Decisiveness', () => {
      const antiBash = getStyleAntiSynergy(FightingStyle.ParryRiposte, 'Bash');
      expect(antiBash.offMult).toBe(0.5);
      expect(antiBash.warning).toContain('lack bashing power');

      const antiDec = getStyleAntiSynergy(FightingStyle.ParryRiposte, 'Decisiveness');
      expect(antiDec.offMult).toBe(0.7);
    });

    it('should penalize Parry-Strike for Bashing', () => {
      const antiBash = getStyleAntiSynergy(FightingStyle.ParryStrike, 'Bash');
      expect(antiBash.offMult).toBe(0.6);

      const normal = getStyleAntiSynergy(FightingStyle.ParryStrike, 'Slash');
      expect(normal.offMult).toBe(1.0);
    });

    it('should penalize Slashing Attack for Bashing and Parrying', () => {
      const antiBashParry = getStyleAntiSynergy(FightingStyle.SlashingAttack, 'Bash', 'Parry');
      expect(antiBashParry.offMult).toBe(0.5);
      expect(antiBashParry.defMult).toBe(0.6);
      expect(antiBashParry.warning).toContain('rely on blade edge');
      expect(antiBashParry.warning).toContain('struggle with disciplined parries');
    });

    it('should penalize Striking Attack for Riposte', () => {
      const antiRiposte = getStyleAntiSynergy(FightingStyle.StrikingAttack, undefined, 'Riposte');
      expect(antiRiposte.defMult).toBe(0.6);

      const normal = getStyleAntiSynergy(FightingStyle.StrikingAttack, 'Lunge', 'Dodge');
      expect(normal.offMult).toBe(1.0);
      expect(normal.defMult).toBe(1.0);
    });

    it('should penalize Total Parry for any offense', () => {
      const antiLunge = getStyleAntiSynergy(FightingStyle.TotalParry, 'Lunge');
      expect(antiLunge.offMult).toBe(0.4);
      expect(antiLunge.warning).toContain('not built for lunge');

      const antiSlash = getStyleAntiSynergy(FightingStyle.TotalParry, 'Slash');
      expect(antiSlash.offMult).toBe(0.5);

      const normal = getStyleAntiSynergy(FightingStyle.TotalParry, 'Decisiveness');
      expect(normal.offMult).toBe(1.0);
    });

    it('should have no anti-synergies for certain styles', () => {
      const wos = getStyleAntiSynergy(FightingStyle.WallOfSteel, 'Bash', 'Dodge');
      expect(wos.offMult).toBe(1.0);
      expect(wos.defMult).toBe(1.0);

      const ab = getStyleAntiSynergy(FightingStyle.AimedBlow, 'Lunge', 'Parry');
      expect(ab.offMult).toBe(1.0);
      expect(ab.defMult).toBe(1.0);

      const pl = getStyleAntiSynergy(FightingStyle.ParryLunge, 'Slash', 'Riposte');
      expect(pl.offMult).toBe(1.0);
      expect(pl.defMult).toBe(1.0);
    });
  });

  describe('getKillMechanic', () => {
    const baseContext = {
      phase: 'MID' as Phase,
      hitsLanded: 3,
      consecutiveHits: 1,
      hitLocation: 'torso',
    };

    it('should give Aimed Blow bonus for headshots', () => {
      const headshot = getKillMechanic(FightingStyle.AimedBlow, {
        ...baseContext,
        hitLocation: 'head',
        targetedLocation: 'Head',
      });
      const bodyshot = getKillMechanic(FightingStyle.AimedBlow, {
        ...baseContext,
        hitLocation: 'torso',
        targetedLocation: 'Torso',
      });

      expect(headshot.killBonus).toBeGreaterThan(bodyshot.killBonus);
    });

    it('should increase Bashing Attack kill chance with momentum', () => {
      const low = getKillMechanic(FightingStyle.BashingAttack, {
        ...baseContext,
        consecutiveHits: 0,
      });
      const high = getKillMechanic(FightingStyle.BashingAttack, {
        ...baseContext,
        consecutiveHits: 3,
      });

      expect(high.killBonus).toBeGreaterThan(low.killBonus);
    });

    it('should give Lunging Attack bonus in opening phase', () => {
      const opening = getKillMechanic(FightingStyle.LungingAttack, {
        ...baseContext,
        phase: 'OPENING',
      });
      const late = getKillMechanic(FightingStyle.LungingAttack, {
        ...baseContext,
        phase: 'LATE',
      });

      expect(opening.killBonus).toBeGreaterThan(late.killBonus);
    });

    it('should give Slashing Attack bonus after multiple hits', () => {
      const few = getKillMechanic(FightingStyle.SlashingAttack, {
        ...baseContext,
        hitsLanded: 2,
      });
      const many = getKillMechanic(FightingStyle.SlashingAttack, {
        ...baseContext,
        hitsLanded: 6,
      });

      expect(many.killBonus).toBeGreaterThan(few.killBonus);
    });

    it('should penalize Total Parry kill chances', () => {
      const tp = getKillMechanic(FightingStyle.TotalParry, baseContext);
      const st = getKillMechanic(FightingStyle.StrikingAttack, baseContext);

      expect(tp.killBonus).toBeLessThan(st.killBonus);
    });

    it('should include narrative text for all styles', () => {
      const mechanic = getKillMechanic(FightingStyle.BashingAttack, baseContext);
      expect(mechanic.killNarrative).toBeDefined();
      expect(mechanic.killNarrative.length).toBeGreaterThan(0);
    });

    it('should have lower kill window for defensive styles', () => {
      const tp = getKillMechanic(FightingStyle.TotalParry, baseContext);
      const ba = getKillMechanic(FightingStyle.BashingAttack, baseContext);

      expect(tp.killWindowHpMult).toBeLessThan(ba.killWindowHpMult);
    });
  });
});
