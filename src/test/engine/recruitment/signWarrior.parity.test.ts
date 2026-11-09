/**
 * V26 parity — the signing funnel must materialize every field a warrior
 * needs for the full game, for BOTH ordinary recruits and veterans:
 *
 *  - `handedness` — the PoolWarrior field exists but `poolWarriorToWarrior`
 *    drops it at conversion, so every signed recruit loses ambi dual-wield
 *    ease, ambi-reversed primary side, and disarm-hand semantics.
 *  - `trainability` — trait aptitude, rolled for prospects that lack it.
 *  - veteran progression — `xp`, `learnedSkills`, `skillDrills`,
 *    `strategyMemory`, `burnedSkills`, and `equipment` round-trip through
 *    the pool untouched instead of being reset to prospect zero-state.
 *
 * Live since Phase 2 — the funnel carries the full field set.
 */
import { describe, it, expect } from 'vitest';
import { poolWarriorToWarrior } from '@/engine/recruitment/signWarrior';
import { warriorToPoolWarrior } from '@/engine/recruitment/recruitment/freeAgents';
import { makeWarrior, makePoolWarrior } from '@/test/_fixtures/factories';
import { SeededRNG } from '@/utils/random';

describe('poolWarriorToWarrior — recruit field carry', () => {
  it('carries the recruit handedness onto the signed warrior', () => {
    const recruit = makePoolWarrior({ handedness: 'ambi-reversed' });
    const w = poolWarriorToWarrior(recruit, { rng: new SeededRNG(1) });
    expect(w.handedness).toBe('ambi-reversed');
  });

  it('rolls a trainability when the recruit lacks one', () => {
    const recruit = makePoolWarrior();
    const w = poolWarriorToWarrior(recruit, { rng: new SeededRNG(1) });
    expect(w.trainability).toBeGreaterThanOrEqual(0.4);
    expect(w.trainability).toBeLessThanOrEqual(0.9);
  });

  it('honours a recruit-carried trainability verbatim', () => {
    const recruit = makePoolWarrior({ trainability: 0.71 } as never);
    const w = poolWarriorToWarrior(recruit, { rng: new SeededRNG(1) });
    expect(w.trainability).toBe(0.71);
  });
});

describe('veteran free-agent round-trip — progression survives', () => {
  it('keeps identity, handedness, trainability, and all bout progression', () => {
    const veteran = makeWarrior({
      handedness: 'ambidextrous',
      trainability: 0.82,
      xp: 17,
      learnedSkills: { ATT: 3, RIP: 1 },
      skillDrills: { ATT: 2 },
      strategyMemory: { cells: { 'M/M': { w: 2, l: 1 } }, recentLossFactors: ['outclassed'] },
      burnedSkills: { DEF: 1 },
      equipment: { weapon: 'scimitar', armor: 'leather', helm: 'none_helm', shield: 'none_shield' },
      fame: 60,
      popularity: 20,
      career: { wins: 5, losses: 2, kills: 1 },
      titles: ['Duelmaster'],
    });

    const pooled = warriorToPoolWarrior(veteran, 10, new SeededRNG(7));
    const reSigned = poolWarriorToWarrior(pooled, { rng: new SeededRNG(9) });

    expect(reSigned.id).toBe(veteran.id);
    expect(reSigned.career).toEqual({ wins: 5, losses: 2, kills: 1 });
    expect(reSigned.fame).toBe(60);
    expect(reSigned.handedness).toBe('ambidextrous');
    expect(reSigned.trainability).toBe(0.82);
    expect(reSigned.xp).toBe(17);
    expect(reSigned.learnedSkills).toEqual({ ATT: 3, RIP: 1 });
    expect(reSigned.skillDrills).toEqual({ ATT: 2 });
    expect(reSigned.strategyMemory).toEqual({
      cells: { 'M/M': { w: 2, l: 1 } },
      recentLossFactors: ['outclassed'],
    });
    expect(reSigned.burnedSkills).toEqual({ DEF: 1 });
    expect(reSigned.equipment?.weapon).toBe('scimitar');
  });
});
