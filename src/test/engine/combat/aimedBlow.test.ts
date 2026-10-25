// @vitest-environment jsdom
import { describe, it, expect, beforeAll } from 'vitest';
import { aimedBlowShellGapBonus } from '@/engine/combat/resolution/aimedBlow';
import { AB_SHELL_GAP_ATT_MAX, AB_SHELL_GAP_DF_DIVISOR } from '@/constants/combat/combat';
import type { FighterState } from '@/engine/combat/resolution/types';
import { FightingStyle } from '@/types/shared.types';
import { makeComputedWarrior } from '@/test/_fixtures/factories';
import { simulateFight, defaultPlanForWarrior } from '@/engine/simulate';
import { loadCombatNarrative } from '@/data/narrative';
import type { WarriorId } from '@/types/shared.types';

const AB = FightingStyle.AimedBlow;
const TP = FightingStyle.TotalParry;
const ST = FightingStyle.StrikingAttack;

const fighter = (over: Partial<FighterState>): FighterState =>
  ({
    style: ST,
    skills: { ATT: 5, PAR: 5, DEF: 5, INI: 5, RIP: 5, DEC: 5 },
    attributes: { ST: 10, CN: 10, SZ: 10, WT: 10, WL: 10, SP: 10, DF: 10 },
    ...over,
  }) as FighterState;

describe('aimedBlowShellGapBonus', () => {
  it('returns 0 for non-AB attackers', () => {
    const att = fighter({ style: ST });
    const def = fighter({ skills: { ...fighter({}).skills, PAR: 10 } });
    expect(aimedBlowShellGapBonus(att, def)).toBe(0);
  });

  it('returns 0 when the defender shell does not out-class the attacker craft', () => {
    const att = fighter({ style: AB, skills: { ...fighter({}).skills, ATT: 8 } });
    const def = fighter({ skills: { ...fighter({}).skills, PAR: 5 } });
    expect(aimedBlowShellGapBonus(att, def)).toBe(0);
  });

  it('fires when defender PAR exceeds attacker ATT, scaled by gap depth and DF', () => {
    const att = fighter({
      style: AB,
      attributes: { ...fighter({}).attributes, DF: AB_SHELL_GAP_DF_DIVISOR },
      skills: { ...fighter({}).skills, ATT: 3 },
    });
    const def = fighter({ skills: { ...fighter({}).skills, PAR: 5 } });
    expect(aimedBlowShellGapBonus(att, def)).toBe(2);
  });

  it('pays more for deeper shells at equal DF', () => {
    const att = fighter({
      style: AB,
      attributes: { ...fighter({}).attributes, DF: AB_SHELL_GAP_DF_DIVISOR },
      skills: { ...fighter({}).skills, ATT: 3 },
    });
    const shallow = fighter({ skills: { ...fighter({}).skills, PAR: 4 } });
    const deep = fighter({ skills: { ...fighter({}).skills, PAR: 8 } });
    expect(aimedBlowShellGapBonus(att, deep)).toBeGreaterThan(
      aimedBlowShellGapBonus(att, shallow)
    );
  });

  it('caps at AB_SHELL_GAP_ATT_MAX', () => {
    const att = fighter({
      style: AB,
      attributes: { ...fighter({}).attributes, DF: 21 },
      skills: { ...fighter({}).skills, ATT: 1 },
    });
    const def = fighter({ skills: { ...fighter({}).skills, PAR: 10 } });
    expect(aimedBlowShellGapBonus(att, def)).toBe(AB_SHELL_GAP_ATT_MAX);
  });
});

describe('AB gap-finder integration', () => {
  beforeAll(async () => {
    await loadCombatNarrative();
  });

  it('AB is favored over a developed TP shell (canon counter restored)', () => {
    // World bout-time profiles from world-diag: developed TP fields a PAR shell
    // that out-classes AB's craft — exactly the gap-finder condition.
    const wA = makeComputedWarrior(
      { ST: 11.7, CN: 10.4, SZ: 8.7, WT: 14.6, WL: 10.7, SP: 11.9, DF: 14.0 },
      AB,
      {
        id: 'A' as WarriorId,
        name: 'A',
        fame: 0,
        age: 20,
        baseSkills: { ATT: 5.6, PAR: 2.8, DEF: 3.3, INI: 7.2, RIP: 6.1, DEC: 9.5 } as never,
      }
    );
    const wD = makeComputedWarrior(
      { ST: 13.2, CN: 14.9, SZ: 9.8, WT: 10.8, WL: 15.1, SP: 10.6, DF: 11.9 },
      TP,
      {
        id: 'D' as WarriorId,
        name: 'D',
        fame: 0,
        age: 20,
        baseSkills: { ATT: 3.6, PAR: 9.2, DEF: 2.0, INI: 4.8, RIP: 5.4, DEC: 6.6 } as never,
      }
    );
    const planA = defaultPlanForWarrior(wA);
    const planD = defaultPlanForWarrior(wD);
    let wins = 0;
    const N = 8000;
    for (let i = 0; i < N; i++) {
      const r = simulateFight({ warriorA: wA, warriorD: wD, planA, planD, providedRng: i * 7919 + 42 });
      if (r.winner === 'A') wins++;
    }
    // Measured 45.5% pre-payoff; the gap bonus should restore a clear AB edge.
    expect(100 * wins / N).toBeGreaterThan(53);
  });
});
