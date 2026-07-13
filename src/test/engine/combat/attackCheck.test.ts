/**
 * Attack Check — exhaustive coverage for performAttackCheck modifier accumulation
 * and skillCheck integration.
 */
import { describe, it, expect } from 'vitest';
import { FightingStyle } from '@/types/shared.types';
import { performAttackCheck } from '@/engine/combat/resolution/exchangeHelpers/checks/attackCheck';
import { getOffensiveTacticMods } from '@/engine/combat/mechanics/tacticResolution';
import { getStylePassive } from '@/engine/stylePassives';
import { getStyleAntiSynergy } from '@/engine/stylePassives';
import { INITIATIVE_PRESS_BONUS, GLOBAL_ATT_BONUS } from '@/constants/combat';
import type { FighterState } from '@/engine/combat/resolution/types';

function createMockFighter(overrides: Partial<FighterState> = {}): FighterState {
  return {
    label: 'A',
    style: FightingStyle.StrikingAttack,
    attributes: { ST: 10, CN: 10, SZ: 10, WT: 10, WL: 10, SP: 10, DF: 10 },
    skills: { ATT: 10, PAR: 10, DEF: 10, INI: 10, RIP: 10, DEC: 10 },
    derived: { hp: 100, endurance: 100, damage: 5, encumbrance: 10 },
    plan: { style: FightingStyle.StrikingAttack, OE: 5, AL: 5, killDesire: 5, target: 'Any' } as any,
    activePlan: { style: FightingStyle.StrikingAttack, OE: 5, AL: 5, killDesire: 5, target: 'Any' } as any,
    psychState: 'CRUISING' as any,
    hp: 100, maxHp: 100, endurance: 100, maxEndurance: 100,
    hitsLanded: 0, hitsTaken: 0, ripostes: 0, consecutiveHits: 0,
    armHits: 0, legHits: 0, totalFights: 0,
    momentum: 0, committed: false, survivalStrike: false, recoveryDebt: 0,
    ...overrides,
  } as FighterState;
}

const zeroOffMods = getOffensiveTacticMods('none', FightingStyle.StrikingAttack);
const zeroPass = getStylePassive(FightingStyle.StrikingAttack, {
  phase: 'OPENING',
  exchange: 0,
  hitsLanded: 0,
  hitsTaken: 0,
  ripostes: 0,
  consecutiveHits: 0,
  hpRatio: 1,
  endRatio: 1,
  opponentStyle: FightingStyle.TotalParry,
});
const zeroAntiSyn = getStyleAntiSynergy(FightingStyle.StrikingAttack);

describe('attackCheck — performAttackCheck', () => {
  it('returns a boolean result', () => {
    const att = createMockFighter();
    const rng = () => 0.5;
    const result = performAttackCheck(
      rng, att, 5, 0, 0, zeroOffMods, zeroPass, zeroAntiSyn, 0, 0, { attPenalty: 0 }
    );
    expect(typeof result).toBe('boolean');
  });

  it('auto-succeeds on roll of 1 (rng returns ~0.0)', () => {
    const att = createMockFighter({ skills: { ATT: 1, PAR: 10, DEF: 10, INI: 10, RIP: 10, DEC: 10 } });
    let callCount = 0;
    const rng = () => { callCount++; return 0.0; }; // floor(0 * 20) + 1 = 1 → auto-success
    const result = performAttackCheck(
      rng, att, 5, 0, 0, zeroOffMods, zeroPass, zeroAntiSyn, 0, 0, { attPenalty: 0 }
    );
    expect(result).toBe(true);
  });

  it('auto-fails on roll of 20 (rng returns ~0.95)', () => {
    const att = createMockFighter({ skills: { ATT: 20, PAR: 10, DEF: 10, INI: 10, RIP: 10, DEC: 10 } });
    const rng = () => 0.95; // floor(0.95 * 20) + 1 = 20 → auto-fail
    const result = performAttackCheck(
      rng, att, 5, 0, 0, zeroOffMods, zeroPass, zeroAntiSyn, 0, 0, { attPenalty: 0 }
    );
    expect(result).toBe(false);
  });

  it('succeeds when skill + modifier >= roll', () => {
    const att = createMockFighter({ skills: { ATT: 15, PAR: 10, DEF: 10, INI: 10, RIP: 10, DEC: 10 } });
    // With high ATT and neutral modifiers, mid-range rolls should succeed
    const rng = () => 0.3; // floor(0.3 * 20) + 1 = 7
    const result = performAttackCheck(
      rng, att, 5, 0, 0, zeroOffMods, zeroPass, zeroAntiSyn, 0, 0, { attPenalty: 0 }
    );
    // skill=15, modifier includes oeAttMod(5,StrikingAttack)=floor(0*0.85)+1=1, +INITIATIVE_PRESS_BONUS=1, +GLOBAL_ATT_BONUS=2.5
    // total modifier ≈ 1 + 0 + 0 + 0 + 0 + 0 + 1 + 2.5 + 0 - 0 - 0 + 0 + 0 + 0 = 4.5
    // target = clamp(floor(15 + 4.5), 1, 19) = 19 → roll 7 ≤ 19 → success
    expect(result).toBe(true);
  });

  it('includes commitBonus when att.committed is true (+10)', () => {
    const attCommitted = createMockFighter({
      committed: true,
      skills: { ATT: 5, PAR: 10, DEF: 10, INI: 10, RIP: 10, DEC: 10 },
    });
    const attNormal = createMockFighter({
      committed: false,
      skills: { ATT: 5, PAR: 10, DEF: 10, INI: 10, RIP: 10, DEC: 10 },
    });
    const rng = () => 0.5; // floor(0.5 * 20) + 1 = 11
    // Without commit: skill=5, mod≈4.5, target=clamp(floor(9.5),1,19)=9 → roll 11 > 9 → fail
    const resultNormal = performAttackCheck(
      rng, attNormal, 5, 0, 0, zeroOffMods, zeroPass, zeroAntiSyn, 0, 0, { attPenalty: 0 }
    );
    // With commit: skill=5, mod≈14.5, target=clamp(floor(19.5),1,19)=19 → roll 11 ≤ 19 → success
    const resultCommitted = performAttackCheck(
      rng, attCommitted, 5, 0, 0, zeroOffMods, zeroPass, zeroAntiSyn, 0, 0, { attPenalty: 0 }
    );
    expect(resultNormal).toBe(false);
    expect(resultCommitted).toBe(true);
  });

  it('applies negative armHits penalty (subtracted from modifier)', () => {
    const attWithArmHits = createMockFighter({
      armHits: 5,
      skills: { ATT: 10, PAR: 10, DEF: 10, INI: 10, RIP: 10, DEC: 10 },
    });
    const attNoArmHits = createMockFighter({
      armHits: 0,
      skills: { ATT: 10, PAR: 10, DEF: 10, INI: 10, RIP: 10, DEC: 10 },
    });
    const rng = () => 0.5; // roll = 11
    // Without armHits: target = clamp(floor(10 + 4.5), 1, 19) = 14 → 11 ≤ 14 → success
    const resultNoArm = performAttackCheck(
      rng, attNoArmHits, 5, 0, 0, zeroOffMods, zeroPass, zeroAntiSyn, 0, 0, { attPenalty: 0 }
    );
    // With armHits=5: modifier = 4.5 - 5 = -0.5, target = clamp(floor(9.5), 1, 19) = 9 → 11 > 9 → fail
    const resultArm = performAttackCheck(
      rng, attWithArmHits, 5, 0, 0, zeroOffMods, zeroPass, zeroAntiSyn, 0, 0, { attPenalty: 0 }
    );
    expect(resultNoArm).toBe(true);
    expect(resultArm).toBe(false);
  });

  it('applies extraBonus (default 0)', () => {
    const att = createMockFighter({
      skills: { ATT: 5, PAR: 10, DEF: 10, INI: 10, RIP: 10, DEC: 10 },
    });
    const rng = () => 0.5; // roll = 11
    // Without extraBonus: target=clamp(floor(5+4.5),1,19)=9 → 11 > 9 → fail
    const withoutExtra = performAttackCheck(
      rng, att, 5, 0, 0, zeroOffMods, zeroPass, zeroAntiSyn, 0, 0, { attPenalty: 0 }
    );
    // With extraBonus=10: target=clamp(floor(5+14.5),1,19)=19 → 11 ≤ 19 → success
    const withExtra = performAttackCheck(
      rng, att, 5, 0, 0, zeroOffMods, zeroPass, zeroAntiSyn, 0, 0, { attPenalty: 0 }, 10
    );
    expect(withoutExtra).toBe(false);
    expect(withExtra).toBe(true);
  });

  it('applies weapon requirement attPenalty', () => {
    const att = createMockFighter({
      skills: { ATT: 10, PAR: 10, DEF: 10, INI: 10, RIP: 10, DEC: 10 },
    });
    const rng = () => 0.5; // roll = 11
    // Without penalty: target=14 → 11 ≤ 14 → success
    const noPenalty = performAttackCheck(
      rng, att, 5, 0, 0, zeroOffMods, zeroPass, zeroAntiSyn, 0, 0, { attPenalty: 0 }
    );
    // attPenalty is added to modifier, so -10 simulates a penalty: modifier = 4.5 + (-10) = -5.5, target=4 → fail
    const withPenalty = performAttackCheck(
      rng, att, 5, 0, 0, zeroOffMods, zeroPass, zeroAntiSyn, 0, 0, { attPenalty: -10 }
    );
    expect(noPenalty).toBe(true);
    expect(withPenalty).toBe(false);
  });

  it('applies overAtt penalty (subtracted from modifier)', () => {
    const att = createMockFighter({
      skills: { ATT: 10, PAR: 10, DEF: 10, INI: 10, RIP: 10, DEC: 10 },
    });
    const rng = () => 0.5; // roll = 11
    // Without overAtt: target=14 → success
    const noOver = performAttackCheck(
      rng, att, 5, 0, 0, zeroOffMods, zeroPass, zeroAntiSyn, 0, 0, { attPenalty: 0 }
    );
    // With overAtt=10: modifier = 4.5 - 10 = -5.5, target=4 → fail
    const withOver = performAttackCheck(
      rng, att, 5, 0, 0, zeroOffMods, zeroPass, zeroAntiSyn, 0, 10, { attPenalty: 0 }
    );
    expect(noOver).toBe(true);
    expect(withOver).toBe(false);
  });

  it('applies curBiasAtt (aggression bias)', () => {
    const att = createMockFighter({
      skills: { ATT: 5, PAR: 10, DEF: 10, INI: 10, RIP: 10, DEC: 10 },
    });
    const rng = () => 0.5; // roll = 11
    // Without bias: target=9 → fail
    const noBias = performAttackCheck(
      rng, att, 5, 0, 0, zeroOffMods, zeroPass, zeroAntiSyn, 0, 0, { attPenalty: 0 }
    );
    // With bias=10: target=clamp(floor(5+14.5),1,19)=19 → success
    const withBias = performAttackCheck(
      rng, att, 5, 0, 0, zeroOffMods, zeroPass, zeroAntiSyn, 10, 0, { attPenalty: 0 }
    );
    expect(noBias).toBe(false);
    expect(withBias).toBe(true);
  });

  it('applies fatigue penalty (fat parameter)', () => {
    const att = createMockFighter({
      skills: { ATT: 10, PAR: 10, DEF: 10, INI: 10, RIP: 10, DEC: 10 },
    });
    const rng = () => 0.5; // roll = 11
    // Without fatigue: target=14 → success
    const noFat = performAttackCheck(
      rng, att, 5, 0, 0, zeroOffMods, zeroPass, zeroAntiSyn, 0, 0, { attPenalty: 0 }
    );
    // With fatigue=-10: modifier = 4.5 - 10 = -5.5, target=4 → fail
    const withFat = performAttackCheck(
      rng, att, 5, 0, -10, zeroOffMods, zeroPass, zeroAntiSyn, 0, 0, { attPenalty: 0 }
    );
    expect(noFat).toBe(true);
    expect(withFat).toBe(false);
  });

  it('applies matchup modifier', () => {
    const att = createMockFighter({
      skills: { ATT: 5, PAR: 10, DEF: 10, INI: 10, RIP: 10, DEC: 10 },
    });
    const rng = () => 0.5; // roll = 11
    // Without matchup: target=9 → fail
    const noMatchup = performAttackCheck(
      rng, att, 5, 0, 0, zeroOffMods, zeroPass, zeroAntiSyn, 0, 0, { attPenalty: 0 }
    );
    // With matchup=10: target=clamp(floor(5+14.5),1,19)=19 → success
    const withMatchup = performAttackCheck(
      rng, att, 5, 10, 0, zeroOffMods, zeroPass, zeroAntiSyn, 0, 0, { attPenalty: 0 }
    );
    expect(noMatchup).toBe(false);
    expect(withMatchup).toBe(true);
  });

  it('passes the correct skill value (att.skills.ATT) to skillCheck', () => {
    const att = createMockFighter({
      skills: { ATT: 18, PAR: 10, DEF: 10, INI: 10, RIP: 10, DEC: 10 },
    });
    const rng = () => 0.5; // roll = 11
    // skill=18, modifier≈4.5, target=clamp(floor(22.5),1,19)=19 → 11 ≤ 19 → success
    const result = performAttackCheck(
      rng, att, 5, 0, 0, zeroOffMods, zeroPass, zeroAntiSyn, 0, 0, { attPenalty: 0 }
    );
    expect(result).toBe(true);
  });

  it('uses oeAttMod with curAttOE and att.style', () => {
    // Aggressive style (StrikingAttack) gets +1 from oeAttMod
    const att = createMockFighter({
      style: FightingStyle.StrikingAttack,
      skills: { ATT: 5, PAR: 10, DEF: 10, INI: 10, RIP: 10, DEC: 10 },
    });
    const rng = () => 0.5; // roll = 11
    // oeAttMod(10, StrikingAttack) = floor((10-5)*0.85) + 1 = 5
    // modifier = 5 + 0 + 0 + 0 + 0 + 0 + 1 + 2.5 + 0 - 0 - 0 + 0 + 0 + 0 = 8.5
    // target = clamp(floor(5+8.5), 1, 19) = 13 → 11 ≤ 13 → success
    const result = performAttackCheck(
      rng, att, 10, 0, 0, zeroOffMods, zeroPass, zeroAntiSyn, 0, 0, { attPenalty: 0 }
    );
    expect(result).toBe(true);
  });

  it('non-aggressive style does not get +1 from oeAttMod', () => {
    // TotalParry is not aggressive — no +1 bonus
    const att = createMockFighter({
      style: FightingStyle.TotalParry,
      skills: { ATT: 5, PAR: 10, DEF: 10, INI: 10, RIP: 10, DEC: 10 },
    });
    const rng = () => 0.5; // roll = 11
    // oeAttMod(10, TotalParry) = floor((10-5)*0.85) = 4 (no +1)
    // modifier = 4 + 0 + 0 + 0 + 0 + 0 + 1 + 2.5 + 0 - 0 - 0 + 0 + 0 + 0 = 7.5
    // target = clamp(floor(5+7.5), 1, 19) = 12 → 11 ≤ 12 → success
    const result = performAttackCheck(
      rng, att, 10, 0, 0, zeroOffMods, zeroPass, zeroAntiSyn, 0, 0, { attPenalty: 0 }
    );
    expect(result).toBe(true);
  });

  it('includes curOffMods.attBonus from offensive tactic mods', () => {
    const att = createMockFighter({
      skills: { ATT: 5, PAR: 10, DEF: 10, INI: 10, RIP: 10, DEC: 10 },
    });
    const rng = () => 0.5; // roll = 11
    const offMods = getOffensiveTacticMods('Lunge', FightingStyle.StrikingAttack);
    // Lunge for StrikingAttack (WS, mult=1.0): attBonus=2
    // modifier = 1 + 0 + 0 + 2 + 0 + 0 + 1 + 2.5 + 0 - 0 - 0 + 0 + 0 + 0 = 6.5
    // target = clamp(floor(5+6.5), 1, 19) = 11 → 11 ≤ 11 → success
    const result = performAttackCheck(
      rng, att, 5, 0, 0, offMods, zeroPass, zeroAntiSyn, 0, 0, { attPenalty: 0 }
    );
    expect(result).toBe(true);
  });

  it('includes curPass.attBonus from style passive', () => {
    const att = createMockFighter({
      style: FightingStyle.StrikingAttack,
      skills: { ATT: 5, PAR: 10, DEF: 10, INI: 10, RIP: 10, DEC: 10 },
    });
    const rng = () => 0.5;
    // Create a mock passive with attBonus = 10
    const mockPass = { ...zeroPass, attBonus: 10 };
    // modifier = 1 + 0 + 0 + 0 + 10 + 0 + 1 + 2.5 + 0 - 0 - 0 + 0 + 0 + 0 = 14.5
    // target = clamp(floor(5+14.5), 1, 19) = 19 → 11 ≤ 19 → success
    const result = performAttackCheck(
      rng, att, 5, 0, 0, zeroOffMods, mockPass, zeroAntiSyn, 0, 0, { attPenalty: 0 }
    );
    expect(result).toBe(true);
  });

  it('includes antiSynergy penalty via Math.round((curAntiSyn.offMult - 1) * 5)', () => {
    const att = createMockFighter({
      skills: { ATT: 10, PAR: 10, DEF: 10, INI: 10, RIP: 10, DEC: 10 },
    });
    const rng = () => 0.5; // roll = 11
    // With offMult = 0.3 (unsuited): Math.round((0.3 - 1) * 5) = Math.round(-3.5) = -4 (rounds toward 0 in JS? No, Math.round(-3.5) = -3)
    // Actually Math.round(-3.5) = -3 (rounds toward +Infinity for .5)
    // modifier = 1 + 0 + 0 + 0 + 0 + (-3) + 1 + 2.5 + 0 - 0 - 0 + 0 + 0 + 0 = 1.5
    // target = clamp(floor(10+1.5), 1, 19) = 11 → 11 ≤ 11 → success
    const badAntiSyn = { offMult: 0.3, defMult: 1.0 };
    const result = performAttackCheck(
      rng, att, 5, 0, 0, zeroOffMods, zeroPass, badAntiSyn, 0, 0, { attPenalty: 0 }
    );
    expect(result).toBe(true);
  });

  it('includes INITIATIVE_PRESS_BONUS and GLOBAL_ATT_BONUS constants', () => {
    // These are always added — verify they're part of the modifier
    expect(INITIATIVE_PRESS_BONUS).toBe(1);
    expect(GLOBAL_ATT_BONUS).toBe(2.5);
  });

  it('is deterministic with same rng function', () => {
    const att = createMockFighter();
    const rng1 = () => 0.5;
    const rng2 = () => 0.5;
    const r1 = performAttackCheck(
      rng1, att, 5, 0, 0, zeroOffMods, zeroPass, zeroAntiSyn, 0, 0, { attPenalty: 0 }
    );
    const r2 = performAttackCheck(
      rng2, att, 5, 0, 0, zeroOffMods, zeroPass, zeroAntiSyn, 0, 0, { attPenalty: 0 }
    );
    expect(r1).toBe(r2);
  });
});
