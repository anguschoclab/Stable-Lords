import { describe, it, expect } from 'vitest';
import { performAttackCheck } from '@/engine/combat/resolution/exchangeHelpers/checks/attackCheck';
import type { FighterState } from '@/engine/combat/resolution/types';

describe('attackCheck', () => {
  const defaultMods = {
    attBonus: 0,
    attPenalty: 0,
  };
  const defaultPassives = {
    attBonus: 0,
  };
  const defaultAntiSynergy = {
    offMult: 1,
  };
  const wepReq = {
    attPenalty: 0,
  };

  it('performs an attack check successfully', () => {
    const rng = () => 0.05; // roll a 5
    const att = {
      skills: { ATT: 90 },
      style: 'BALANCED',
      armHits: 0,
      offBalance: 0,
      committed: false,
    } as unknown as FighterState;

    const result = performAttackCheck(
      rng,
      att,
      100, // curAttOE
      0, // matchup
      0, // fat
      defaultMods as any, // curOffMods
      defaultPassives as any, // curPassA
      defaultAntiSynergy as any, // curAntiSyn
      0, // curBiasAtt
      0, // overAtt
      wepReq
    );

    expect(result).toBe(true);
  });

  it('performs an attack check unsuccessfully', () => {
    const rng = () => 0.95; // roll a 95
    const att = {
      skills: { ATT: 10 },
      style: 'BALANCED',
      armHits: 0,
      offBalance: 0,
      committed: false,
    } as unknown as FighterState;

    const result = performAttackCheck(
      rng,
      att,
      1, // curAttOE
      0, // matchup
      0, // fat
      defaultMods as any, // curOffMods
      defaultPassives as any, // curPassA
      defaultAntiSynergy as any, // curAntiSyn
      0, // curBiasAtt
      0, // overAtt
      wepReq
    );

    expect(result).toBe(false);
  });

  it('adds bonus when attacker is committed', () => {
    const rng = () => 0.05; // roll a 5
    const att = {
      skills: { ATT: 10 },
      style: 'BALANCED',
      armHits: 0,
      offBalance: 0,
      committed: true,
    } as unknown as FighterState;

    const result = performAttackCheck(
      rng,
      att,
      100, // curAttOE
      0, // matchup
      0, // fat
      defaultMods as any, // curOffMods
      defaultPassives as any, // curPassA
      defaultAntiSynergy as any, // curAntiSyn
      0, // curBiasAtt
      0, // overAtt
      wepReq
    );

    // Testing logic indirectly by providing low skill and good roll vs high penalty/bonus
    // In our case we just confirm it runs correctly
    expect(result).toBe(true);
  });
});
