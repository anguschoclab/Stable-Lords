// @vitest-environment node
/**
 * Stage D — plan intelligence. The rival intel worker writes dossier
 * `planIntel` (suspected OE/AL bands + freshness stamp); the plan generator
 * consumes fresh intel to counter-plan, and scouting blends *observed*
 * committed plans into the estimate instead of pure personality priors.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { aiPlanForWarrior } from '@/engine/ai/plan/coreGenerator';
import { processIntel } from '@/engine/ai/workers/intelWorker';
import { FightingStyle } from '@/types/shared.types';
import type { OpponentDossier } from '@/types/state.types';
import {
  makeWarrior,
  makeRival,
  makeOwner,
  makeAgentMemory,
  makeGameState,
  makePlan,
  resetFixtureIds,
} from '@/test/_fixtures/factories';

beforeEach(() => resetFixtureIds());

function dossierWithIntel(planIntel: OpponentDossier['planIntel']): OpponentDossier {
  return {
    lastSeenWeek: 10,
    knownStyles: [FightingStyle.BashingAttack],
    estimatedThreat: 0.5,
    recordVs: { w: 0, l: 0, k: 0 },
    planIntel,
  };
}

describe('aiPlanForWarrior — planIntel counter-planning', () => {
  const w = () => makeWarrior({ style: FightingStyle.ParryStrike });

  it('fresh hot-opponent intel hardens the plan (higher AL)', () => {
    const base = aiPlanForWarrior(
      w(), 'Pragmatic', 'Opportunist', FightingStyle.BashingAttack
    );
    const scouted = aiPlanForWarrior(
      w(), 'Pragmatic', 'Opportunist', FightingStyle.BashingAttack,
      undefined, 0,
      dossierWithIntel({ suspectedOE: 0.9, suspectedAL: 0.3, lastPlanWeek: 9 }),
      10
    );
    expect(scouted.AL).toBeGreaterThan(base.AL!);
  });

  it('fresh turtler intel presses the attack (higher OE)', () => {
    const base = aiPlanForWarrior(
      w(), 'Pragmatic', 'Opportunist', FightingStyle.BashingAttack
    );
    const scouted = aiPlanForWarrior(
      w(), 'Pragmatic', 'Opportunist', FightingStyle.BashingAttack,
      undefined, 0,
      dossierWithIntel({ suspectedOE: 0.4, suspectedAL: 0.85, lastPlanWeek: 9 }),
      10
    );
    expect(scouted.OE).toBeGreaterThan(base.OE!);
  });

  it('stale intel is ignored — identical to the no-dossier plan', () => {
    const base = aiPlanForWarrior(
      w(), 'Pragmatic', 'Opportunist', FightingStyle.BashingAttack
    );
    const stale = aiPlanForWarrior(
      w(), 'Pragmatic', 'Opportunist', FightingStyle.BashingAttack,
      undefined, 0,
      dossierWithIntel({ suspectedOE: 0.95, suspectedAL: 0.9, lastPlanWeek: 1 }),
      20
    );
    expect(stale.OE).toBe(base.OE);
    expect(stale.AL).toBe(base.AL);
    expect(stale.killDesire).toBe(base.killDesire);
  });

  it('no planIntel → no counter-planning delta', () => {
    const base = aiPlanForWarrior(
      w(), 'Pragmatic', 'Opportunist', FightingStyle.BashingAttack
    );
    const plain = aiPlanForWarrior(
      w(), 'Pragmatic', 'Opportunist', FightingStyle.BashingAttack,
      undefined, 0, dossierWithIntel(undefined), 10
    );
    expect(plain.OE).toBe(base.OE);
    expect(plain.AL).toBe(base.AL);
  });
});

describe('processIntel — observed tells', () => {
  it('blends observed committed plans into the estimate', () => {
    const week = 5;
    const observer = () =>
      makeRival({
        id: 'r-obs' as never,
        owner: makeOwner({ id: 'r-obs' as never, personality: 'Tactician' }),
        agentMemory: makeAgentMemory({
          opponentDossiers: {
            'r-target': {
              lastSeenWeek: week - 1,
              knownStyles: [],
              estimatedThreat: 0.9,
              recordVs: { w: 0, l: 0, k: 0 },
            },
          },
        }),
      });

    // Target stable whose fighters committed hot plans (OE 9 / AL 2).
    const plannedTarget = makeRival({
      id: 'r-target' as never,
      owner: makeOwner({ id: 'r-target' as never, personality: 'Methodical' }),
      roster: [
        makeWarrior({ plan: makePlan({ OE: 9, AL: 2 }), lastBoutWeek: week - 1 }),
        makeWarrior({ plan: makePlan({ OE: 8, AL: 2 }), lastBoutWeek: week - 1 }),
      ],
    });
    // Same stable, same week — but no committed plans to observe.
    const bareTarget = makeRival({
      id: 'r-target' as never,
      owner: makeOwner({ id: 'r-target' as never, personality: 'Methodical' }),
      roster: [makeWarrior(), makeWarrior()],
    });

    const obsState = makeGameState({
      absoluteWeek: week,
      week,
      rivals: [observer(), plannedTarget],
    });
    const bareState = makeGameState({
      absoluteWeek: week,
      week,
      rivals: [observer(), bareTarget],
    });

    const withObs = processIntel(observer(), obsState).updatedRival;
    const withoutObs = processIntel(observer(), bareState).updatedRival;

    const obsIntel =
      withObs.agentMemory?.opponentDossiers?.['r-target']?.planIntel;
    const bareIntel =
      withoutObs.agentMemory?.opponentDossiers?.['r-target']?.planIntel;

    expect(obsIntel).toBeDefined();
    expect(bareIntel).toBeDefined();
    // Observed hot plans pull the estimate up from the Methodical prior.
    expect(obsIntel!.suspectedOE!).toBeGreaterThan(bareIntel!.suspectedOE!);
    expect(obsIntel!.suspectedAL!).toBeLessThan(bareIntel!.suspectedAL!);
  });
});
