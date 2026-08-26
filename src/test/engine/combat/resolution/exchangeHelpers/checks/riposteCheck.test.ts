import { describe, it, expect } from 'vitest';
import { performRiposteCheck } from '@/engine/combat/resolution/exchangeHelpers/checks/riposteCheck';
import type { FighterState } from '@/engine/combat/resolution/types';

describe('riposteCheck', () => {
  const defaultPassives = {
    ripBonus: 0,
  };
  const defaultAntiSynergy = {
    defMult: 1,
  };

  it('performs a riposte check successfully', () => {
    const rng = () => 0.05; // roll a 5
    const def = { skills: { RIP: 90 } } as FighterState;

    const result = performRiposteCheck(
      rng,
      def,
      0, // matchup
      0, // fat
      0, // penaltyOrBonus
      defaultPassives as any, // curPass
      defaultAntiSynergy as any // curAntiSynDef
    );

    expect(result).toBe(true);
  });

  it('performs a riposte check unsuccessfully', () => {
    const rng = () => 0.95; // roll a 95
    const def = { skills: { RIP: 10 } } as FighterState;

    const result = performRiposteCheck(
      rng,
      def,
      0, // matchup
      0, // fat
      0, // penaltyOrBonus
      defaultPassives as any, // curPass
      defaultAntiSynergy as any // curAntiSynDef
    );

    expect(result).toBe(false);
  });

  it('applies anti-synergy properly', () => {
    const rng = () => 0.05; // roll a 5
    const def = { skills: { RIP: 10 } } as FighterState;
    const antiSynergy = { defMult: 10 };

    const result = performRiposteCheck(
      rng,
      def,
      0, // matchup
      0, // fat
      0, // penaltyOrBonus
      defaultPassives as any, // curPass
      antiSynergy as any // curAntiSynDef
    );

    expect(result).toBe(true);
  });

  it('handles optional anti-synergy correctly', () => {
    const rng = () => 0.05;
    const def = { skills: { RIP: 90 } } as FighterState;

    const result = performRiposteCheck(
      rng,
      def,
      0, // matchup
      0, // fat
      0, // penaltyOrBonus
      defaultPassives as any // curPass
    );

    expect(result).toBe(true);
  });
});
