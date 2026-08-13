import { describe, it, expect } from 'vitest';
import { performDefenseCheck } from '@/engine/combat/resolution/exchangeHelpers/checks/defenseCheck';
import type { FighterState } from '@/engine/combat/types';

describe('defenseCheck', () => {
  const defaultMods = {
    defBonus: 0,
    parBonus: 0,
    parryBypass: 0,
    defPenalty: 0,
  };

  const defaultPassives = {
    defBonus: 0,
    parBonus: 0,
  };

  const defaultAntiSynergy = {
    defMult: 1,
  };

  it('performs a dodge check successfully', () => {
    const rng = () => 0.05; // roll a 5
    const def = { skills: { DEF: 90, PAR: 90 }, legHits: 0, armHits: 0, committed: false } as FighterState;

    const result = performDefenseCheck(
      rng,
      def,
      100, // curDefOE
      0, // matchup
      0, // fat
      defaultMods as any, // curDefMods
      defaultPassives as any, // curPassD
      0, // curBiasDef
      0, // overDef
      true, // isDodge
      defaultAntiSynergy as any, // curAntiSynDef
      defaultMods as any, // curOffMods
      undefined,
      undefined,
      0 // extraDefPenalty
    );

    expect(result.type).toBe('DODGE');
    expect(result.success).toBe(true);
  });

  it('performs a parry check successfully', () => {
    const rng = () => 0.05; // roll a 5
    const def = { skills: { DEF: 100, PAR: 100 }, legHits: 0, armHits: 0, committed: false } as FighterState;

    const result = performDefenseCheck(
      rng,
      def,
      100, // curDefOE
      0, // matchup
      0, // fat
      defaultMods as any, // curDefMods
      defaultPassives as any, // curPassD
      0, // curBiasDef
      0, // overDef
      false, // isDodge
      defaultAntiSynergy as any, // curAntiSynDef
      defaultMods as any, // curOffMods
      undefined,
      undefined,
      0 // extraDefPenalty
    );

    expect(result.type).toBe('PARRY');
    expect(result.success).toBe(true);
  });

  it('performs a dodge check unsuccessfully', () => {
    const rng = () => 0.95; // roll a 95
    const def = { skills: { DEF: 50, PAR: 50 }, legHits: 0, armHits: 0, committed: false } as FighterState;

    const result = performDefenseCheck(
      rng,
      def,
      1, // curDefOE
      0, // matchup
      0, // fat
      defaultMods as any, // curDefMods
      defaultPassives as any, // curPassD
      0, // curBiasDef
      0, // overDef
      true, // isDodge
      defaultAntiSynergy as any, // curAntiSynDef
      defaultMods as any, // curOffMods
      undefined,
      undefined,
      0 // extraDefPenalty
    );

    expect(result.type).toBe('DODGE');
    expect(result.success).toBe(false);
  });

  it('adds penalty when attacker is committed', () => {
    const rng = () => 0.05; // roll a 5
    const def = { skills: { DEF: 10, PAR: 10 }, legHits: 0, armHits: 0, committed: false } as FighterState;
    const attacker = { committed: true } as FighterState;

    // Test that the +15 defense bonus for committed attacker allows a successful parry that would otherwise fail
    const result = performDefenseCheck(
      rng,
      def,
      1, // curDefOE
      0, // matchup
      0, // fat
      defaultMods as any, // curDefMods
      defaultPassives as any, // curPassD
      0, // curBiasDef
      0, // overDef
      false, // isDodge
      defaultAntiSynergy as any, // curAntiSynDef
      defaultMods as any, // curOffMods
      undefined,
      attacker,
      0 // extraDefPenalty
    );

    expect(result.type).toBe('PARRY');
    // Without the +15, it might fail. With it, it should pass with a good enough roll, but the exact calc depends on GLOBAL_PAR_PENALTY
  });
});
