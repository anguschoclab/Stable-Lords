// @vitest-environment node
/**
 * Stage E-R — mid-bout adaptivity, directional integration assertions.
 * The opponent-state triggers must actually move fight outcomes, not just
 * fire telemetry: a kill-window press raises finish rate vs a paired-seed
 * control, and condition firings surface in the bout's exchange telemetry.
 */
import { describe, it, expect } from 'vitest';
import { simulateFight } from '@/engine/simulate';
import { FightingStyle, type FightPlan } from '@/types/game';
import { makeWarrior, makePlan } from './_helpers';

const SEEDS = Array.from({ length: 80 }, (_, i) => 1000 + i * 7);

/** Roughly even striker-vs-parrier matchup so finish rate is middling. */
function fighters() {
  return {
    a: makeWarrior('Presser', FightingStyle.StrikingAttack, { ST: 15, WT: 12, WL: 12 }),
    d: makeWarrior('Shell', FightingStyle.ParryRiposte, { ST: 13, WT: 12, WL: 12 }),
  };
}

function finishCount(planA: FightPlan, planD: FightPlan): { finishes: number; firings: number } {
  let finishes = 0;
  let firings = 0;
  for (const seed of SEEDS) {
    const { a, d } = fighters();
    const result = simulateFight(planA, planD, a, d, seed);
    if (result.winner === 'A' && (result.by === 'KO' || result.by === 'Kill')) finishes++;
    // Only plan A carries the condition — any firing belongs to A.
    firings += (result.exchangeLog ?? []).filter((e) =>
      (e.reasonCodes ?? []).some((c) => c === 'CONDITION_OPPONENT_HP_BELOW')
    ).length;
  }
  return { finishes, firings };
}

describe('mid-bout adaptivity', () => {
  it('a kill-window press raises the finish rate over paired seeds', () => {
    const press: FightPlan = makePlan(FightingStyle.StrikingAttack, {
      OE: 6,
      AL: 5,
      killDesire: 4,
      conditions: [
        {
          trigger: { type: 'OPPONENT_HP_BELOW', value: 45 },
          override: { OE: 9, killDesire: 10 },
          label: 'Kill-window press',
        },
      ],
    });
    const control: FightPlan = makePlan(FightingStyle.StrikingAttack, {
      OE: 6,
      AL: 5,
      killDesire: 4,
    });
    const planD = makePlan(FightingStyle.ParryRiposte, { OE: 5, AL: 6, killDesire: 3 });

    const withPress = finishCount(press, planD);
    const without = finishCount(control, planD);

    // The condition must actually fire — no phantom adaptivity.
    expect(withPress.firings).toBeGreaterThan(0);
    // Directional: pressing a wounded opponent finishes more fights.
    expect(withPress.finishes).toBeGreaterThan(without.finishes);
  });

  it('condition firings surface as CONDITION_* reason codes in the exchange log', () => {
    const shell: FightPlan = makePlan(FightingStyle.ParryRiposte, {
      OE: 4,
      AL: 7,
      killDesire: 2,
      conditions: [
        {
          trigger: { type: 'OPPONENT_MOMENTUM_LEAD', value: 1 },
          override: { AL: 10, OE: 2 },
          label: 'Weather the storm',
        },
      ],
    });
    const brawler = makePlan(FightingStyle.BashingAttack, { OE: 9, AL: 4, killDesire: 5 });

    let observed = 0;
    for (const seed of SEEDS.slice(0, 20)) {
      const { a, d } = fighters();
      const result = simulateFight(shell, brawler, a, d, seed);
      observed += (result.exchangeLog ?? []).filter((e) =>
        (e.reasonCodes ?? []).some((c) => c.startsWith('CONDITION_OPPONENT_MOMENTUM_LEAD'))
      ).length;
    }
    expect(observed).toBeGreaterThan(0);
  });
});
