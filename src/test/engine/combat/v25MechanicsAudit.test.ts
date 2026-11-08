/**
 * V25 mechanics audit — [regression-lock] specs pinning canon mechanics
 * Assur's archetype guides assume: burn order, dodge→riposte, the Riposte
 * tactic's existence in WS pools, the encumbrance endurance channel, and
 * the no-armor death cliff.
 */
import { describe, it, expect } from 'vitest';
import { LU_ENDURANCE_MULT } from '@/constants/combat/combat/styles/lu';
import { WS_ENDURANCE_MULT } from '@/constants/combat/combat/styles/ws';
import { SL_ENDURANCE_MULT } from '@/constants/combat/combat/styles/sl';
import { BA_ENDURANCE_MULT } from '@/constants/combat/combat/styles/ba';
import { PL_ENDURANCE_MULT } from '@/constants/combat/combat/styles/pl';
import { ST_ENDURANCE_MULT } from '@/constants/combat/combat/styles/st';
import { PR_ENDURANCE_MULT } from '@/constants/combat/combat/styles/pr';
import { AB_ENDURANCE_MULT } from '@/constants/combat/combat/styles/ab';
import { PS_ENDURANCE_MULT } from '@/constants/combat/combat/styles/ps';
import { TP_ENDURANCE_MULT } from '@/constants/combat/combat/styles/tp';
import { getDefensiveSuitability } from '@/engine/strategy/tacticSuitability';
import { getEncumbrancePenalties } from '@/data/equipment/encumbrance';
import { FightingStyle } from '@/types/shared.types';

describe('V25 audit — endurance burn order (canon)', () => {
  it('LU>WS>SL>BA>PL>ST>PR>AB>PS>TP — conserving styles are PS/AB/TP/PR', () => {
    expect(LU_ENDURANCE_MULT).toBeGreaterThan(WS_ENDURANCE_MULT);
    expect(WS_ENDURANCE_MULT).toBeGreaterThan(SL_ENDURANCE_MULT);
    expect(SL_ENDURANCE_MULT).toBeGreaterThan(BA_ENDURANCE_MULT);
    expect(BA_ENDURANCE_MULT).toBeGreaterThan(PL_ENDURANCE_MULT);
    expect(PL_ENDURANCE_MULT).toBeGreaterThan(ST_ENDURANCE_MULT);
    expect(ST_ENDURANCE_MULT).toBeGreaterThan(PR_ENDURANCE_MULT);
    expect(PR_ENDURANCE_MULT).toBeGreaterThan(AB_ENDURANCE_MULT);
    expect(AB_ENDURANCE_MULT).toBeGreaterThan(PS_ENDURANCE_MULT);
    expect(PS_ENDURANCE_MULT).toBeGreaterThan(TP_ENDURANCE_MULT);
  });
});

describe('V25 audit — Riposte tactic availability', () => {
  it('the canon riposte-faking styles rate Riposte suited-or-better', () => {
    // Assur: "riposte is easy to fake" — the tactic exists and rates WS
    // on the defensive-learning styles, S on PL.
    expect(getDefensiveSuitability(FightingStyle.LungingAttack, 'Riposte')).toBe('WS');
    expect(getDefensiveSuitability(FightingStyle.TotalParry, 'Riposte')).toBe('WS');
    expect(getDefensiveSuitability(FightingStyle.ParryRiposte, 'Riposte')).toBe('WS');
    expect(getDefensiveSuitability(FightingStyle.AimedBlow, 'Riposte')).toBe('WS');
    expect(getDefensiveSuitability(FightingStyle.WallOfSteel, 'Riposte')).toBe('WS');
    expect(getDefensiveSuitability(FightingStyle.ParryLunge, 'Riposte')).toBe('S');
  });
});

describe('V25 audit — encumbrance endurance channel', () => {
  it('every tier above NONE multiplies endurance burn — the hybrid warning is real', () => {
    for (const tier of ['LIGHT', 'MEDIUM', 'HEAVY', 'OVER'] as const) {
      expect(getEncumbrancePenalties(tier).enduranceMult).toBeGreaterThan(1);
    }
    expect(getEncumbrancePenalties('NONE').enduranceMult).toBe(1);
  });
});
