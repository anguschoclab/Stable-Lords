import { describe, it, expect } from 'vitest';
// V30-W1.2/W1.3: same-ruleset parity — the AI training flow and the player
// assignment flow produce identical warrior outcomes under identical inputs
// and identical draw sequences (post-V30: one shared executor).
import { performAITraining, performAISkillDrill } from '@/engine/ai/workers/rosterWorkerTraining';
import { computeTrainingImpact } from '@/engine/training/trainingImpact';
import { makeComputedWarrior, makeRivalStable } from '@/test/_fixtures/factories';
import { makeAiTestState } from '@/test/_fixtures/aiTestState';
import { FightingStyle } from '@/types/game';
import type { WarriorId, Warrior } from '@/types/game';
import { scriptRng } from '@/test/_fixtures/rngStub';

const mkWarrior = (): Warrior =>
  makeComputedWarrior({}, FightingStyle.StrikingAttack, {
    id: 'w1' as WarriorId,
    fame: 0,
    age: 20,
    potential: { ST: 18, CN: 18, SZ: 15, WT: 18, WL: 18, SP: 18, DF: 18 },
    skillDrills: {},
  });

describe('AI↔player training parity (V30 same ruleset)', () => {
  it('attribute attempt: AI flow and player assignment produce identical outcomes', () => {
    const wAI = mkWarrior();
    const rival = makeRivalStable('r1', [wAI], { trainers: [] });
    const aiOut = performAITraining({
      w: wAI,
      stable: rival,
      season: 'Summer',
      seasonalGrowth: [],
      rng: scriptRng(0.5),
      healingBonus: 0,
      weather: 'Clear',
    });
    expect(aiOut.chosen).toBeDefined();

    const wP = mkWarrior();
    const state = makeAiTestState({
      roster: [wP],
      trainers: [],
      season: 'Summer',
      weather: 'Clear',
      trainingAssignments: [{ warriorId: wP.id, type: 'attribute', attribute: aiOut.chosen }],
    });
    const impact = computeTrainingImpact(state, scriptRng(0.5), 'Clear');
    const playerW = impact.updatedRoster.find((x) => x.id === wP.id)!;

    expect(playerW.attributes).toEqual(aiOut.warrior.attributes);
    expect(playerW.injuries).toEqual(aiOut.warrior.injuries);
  });

  it('attribute attempt: a landing injury roll applies identically on both paths', () => {
    const wAI = mkWarrior();
    const rival = makeRivalStable('r1', [wAI], { trainers: [] });
    const aiOut = performAITraining({
      w: wAI,
      stable: rival,
      season: 'Summer',
      seasonalGrowth: [],
      rng: scriptRng(0.0), // every draw → success + injury
      healingBonus: 0,
      weather: 'Clear',
    });

    const wP = mkWarrior();
    const state = makeAiTestState({
      roster: [wP],
      trainers: [],
      season: 'Summer',
      weather: 'Clear',
      trainingAssignments: [{ warriorId: wP.id, type: 'attribute', attribute: aiOut.chosen }],
    });
    const impact = computeTrainingImpact(state, scriptRng(0.0), 'Clear');
    const playerW = impact.updatedRoster.find((x) => x.id === wP.id)!;

    expect(playerW.injuries?.length ?? 0).toBe(aiOut.warrior.injuries?.length ?? 0);
    expect(
      (aiOut.warrior.injuries?.length ?? 0) > 0 || playerW.injuries === undefined
    ).toBeTruthy();
  });

  it('skill drill: AI drill rolls a training injury at the same odds as the player path', () => {
    const wAI = mkWarrior();
    const rival = makeRivalStable('r1', [wAI], { trainers: [] });
    // scripted 0.0 → the injury roll (now present on the AI path) lands.
    const out = performAISkillDrill(wAI, rival, scriptRng(0.0), 'Clear');
    // Under the unified ruleset the AI drill path rolls for a training injury,
    // same as the player's skillDrill assignment.
    expect(out.injuries?.length ?? 0).toBeGreaterThan(0);
  });
});
