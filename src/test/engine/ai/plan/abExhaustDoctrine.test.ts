/**
 * V31 canon — the defensive Aimed Blow exhaust template (Terrablood archive,
 * "Aimed Blows My Way"; adjudicated DN-S2: implement).
 *
 * Canon: a defensive AB parries or dodges early to let the opponent burn
 * endurance, then transitions to offense. Rival ABs whose build fits the
 * riposting-hybrid archetype carry an explicit exhaust-then-strike plan:
 * defensive `phases.opening`, real offense in `phases.mid`/`late`.
 */
import { describe, it, expect, vi } from 'vitest';
import { aiPlanForWarrior } from '@/engine/ai/plan/coreGenerator';
import { FightingStyle } from '@/types/shared.types';
import type { Warrior } from '@/types/warrior.types';
import type { OwnerPersonality } from '@/types/state.types';

vi.mock('@/engine/ai/plan/strategyValidator', () => ({
  validateAndAdjustPlan: vi.fn((plan) => plan),
}));

const abWarrior = (attrs: Record<string, number>): Warrior =>
  ({
    id: 'ab1',
    name: 'Exhaust Aimer',
    style: FightingStyle.AimedBlow,
    attributes: attrs,
    skills: { INI: 8, ATT: 10, DEF: 8, PAR: 10, DMG: 6, DEC: 8, END: 30, HEA: 30 },
    favorites: {},
  }) as unknown as Warrior;

// ripostingHybrid fit (designBars dfMin 13 / wtMin 11 / szMax 12 / minRipBase 18):
// DF 17 / SP 13 / WT 15 on a size-10 chassis.
const DEFENSIVE_AB = { ST: 9, CN: 11, SZ: 10, WT: 15, WL: 11, SP: 13, DF: 17 };
// pureOffensive fit — classic offensive aimer: high DF, big ST, no riposte base.
const OFFENSIVE_AB = { ST: 17, CN: 9, SZ: 9, WT: 13, WL: 9, SP: 7, DF: 17 };

describe('AB exhaust-then-strike doctrine', () => {
  it('a riposting-fit AB opens with a defensive tactic and turns offensive later', () => {
    const w = abWarrior(DEFENSIVE_AB);
    const plan = aiPlanForWarrior({ w, personality: 'Pragmatic' as OwnerPersonality });

    // Every plan gets a generic OE-taper opening (buildPhasePlan); the
    // exhaust template is marked by an actual defensive tactic in the
    // opening phase — parry/dodge to tire the opponent, then strike.
    const opening = plan.phases!.opening!;
    expect(['Parry', 'Dodge', 'Riposte']).toContain(opening.defensiveTactic);
    expect(opening.OE).toBeLessThan(plan.OE);
    // The transition is offensive: mid/late restores the real offensive plan.
    const later = plan.phases!.mid ?? plan.phases!.late;
    expect(later).toBeDefined();
    expect(later!.OE).toBeGreaterThanOrEqual(plan.OE);
    expect(later!.defensiveTactic).toBeUndefined();
  });

  it('an offensive-fit AB keeps a tactic-free opening', () => {
    const w = abWarrior(OFFENSIVE_AB);
    const plan = aiPlanForWarrior({ w, personality: 'Pragmatic' as OwnerPersonality });
    expect(plan.phases?.opening?.defensiveTactic).toBeUndefined();
  });
});
