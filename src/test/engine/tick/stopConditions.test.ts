import { describe, it, expect } from 'vitest';
import { evaluateStopConditions } from '@/engine/pipeline/tick/timeAdvance';
import { createFreshState } from '@/engine/factories/gameStateFactory';
import { makeWarrior } from '@/test/_fixtures/factories';
import type { SoftStopCondition } from '@/engine/pipeline/tick/timeAdvance';
import type { Warrior } from '@/types/warrior.types';

/**
 * noPairings semantics: it evaluates eligibility on the POST-advance state —
 * under the upcoming week's tournament flag, not the flag of the week that
 * just ran. The bout pass's eligibleCount is computed under the just-ended
 * week's flag, so it cannot be reused here: `isFightReady` ignores fatigue
 * during tournament weeks, making the count flag-dependent.
 */
describe('evaluateStopConditions — noPairings', () => {
  const active = (id: string, fatigue = 0): Warrior =>
    makeWarrior({ id: id as Warrior['id'], status: 'Active', fatigue });

  it('does not fire when the post-week roster is fight-ready', () => {
    const state = createFreshState('stop-nopairings');
    state.roster = [active('w1'), active('w2')];
    state.isTournamentWeek = false;

    const conditions: SoftStopCondition[] = [{ type: 'noPairings' }];
    expect(evaluateStopConditions(state, conditions).shouldStop).toBe(false);
  });

  it('fires when fewer than two warriors across the world are fight-ready', () => {
    const state = createFreshState('stop-empty-world');
    state.roster = [active('w1')];
    state.rivals = [];
    state.isTournamentWeek = false;

    const conditions: SoftStopCondition[] = [{ type: 'noPairings' }];
    const result = evaluateStopConditions(state, conditions);
    expect(result.shouldStop).toBe(true);
    expect(result.reason).toBe('no_pairings');
  });

  it('evaluates under the current tournament flag — exhausted warriors count during tournament weeks', () => {
    const state = createFreshState('stop-tournament-flag');
    state.roster = [active('w1', 100), active('w2', 100)];
    state.rivals = [];
    state.isTournamentWeek = true;

    const conditions: SoftStopCondition[] = [{ type: 'noPairings' }];
    // Fatigue is ignored for tournament eligibility — both warriors count.
    expect(evaluateStopConditions(state, conditions).shouldStop).toBe(false);
  });

  it('same exhausted roster stops a normal week', () => {
    const state = createFreshState('stop-exhausted');
    state.roster = [active('w1', 100), active('w2', 100)];
    state.rivals = [];
    state.isTournamentWeek = false;

    const conditions: SoftStopCondition[] = [{ type: 'noPairings' }];
    expect(evaluateStopConditions(state, conditions).shouldStop).toBe(true);
  });
});
