/**
 * Progression Handler — per-fight skill learns (Arena-93 learn doctrine).
 * Learns roll post-bout for both fighters, route to player/rival rosters,
 * land on outcome.post.learns*, append to the transcript log, skip the dead,
 * and only newsletter for the player's stable.
 */
import { describe, it, expect } from 'vitest';
import { handleProgressions } from '@/engine/bout/progressionHandler';
import type { RivalStableData } from '@/types/state.types';
import {
  FightingStyle,
  type WarriorId,
  type StableId,
} from '@/types/shared.types';
import { SeededRNG } from '@/utils/random';
import {
  mkLearnWarrior as mkWarrior,
  mkBoutState as mkState,
  mkBoutOutcome as mkOutcome,
  totalGained,
} from './_helpers';

describe('handleProgressions — skill learns', () => {
  it('rolls learns for both fighters and records them on outcome.post', () => {
    const wA = mkWarrior({ id: 'warrior-a' as WarriorId });
    const wD = mkWarrior({
      id: 'warrior-d' as WarriorId,
      name: 'Warrior D',
      style: FightingStyle.TotalParry,
    });
    const s = mkState({ roster: [wA, wD] });
    const outcome = mkOutcome();

    handleProgressions({
      s,
      wA,
      wD,
      outcome,
      tags: [],
      week: 1,
      rng: new SeededRNG(12345),
    });

    expect(outcome.post?.learnsA).toBeDefined();
    expect(outcome.post?.learnsD).toBeDefined();
  });

  it('routes learnedSkills into rosterUpdates for a player warrior', () => {
    const wA = mkWarrior({ id: 'warrior-a' as WarriorId });
    const wD = mkWarrior({ id: 'warrior-d' as WarriorId, name: 'Warrior D' });
    const s = mkState({ roster: [wA] });
    const outcome = mkOutcome();

    const result = handleProgressions({
      s,
      wA,
      wD,
      outcome,
      tags: [],
      week: 1,
      rng: new SeededRNG(7),
    });

    const patch = result.rosterUpdates?.get('warrior-a' as WarriorId);
    expect(patch).toBeDefined();
    if (totalGained(outcome.post?.learnsA) > 0) {
      expect(patch?.learnedSkills).toBeDefined();
      expect(totalGained(patch?.learnedSkills)).toBe(totalGained(outcome.post?.learnsA));
    }
  });

  it('routes learnedSkills into rivalWarriorPatches for a rival warrior', () => {
    const rivalId = 'rival-1' as StableId;
    const warriorId = 'rival-warrior' as WarriorId;
    const wA = mkWarrior();
    const wD = mkWarrior({ id: warriorId, name: 'Rival Warrior', stableId: rivalId });
    const s = mkState({
      roster: [],
      warriorToStableMap: new Map([[warriorId, { stableId: rivalId, isPlayer: false }]]),
      rivalMap: new Map([[rivalId, { id: rivalId, roster: [wD] } as unknown as RivalStableData]]),
    });
    const outcome = mkOutcome();

    const result = handleProgressions({
      s,
      wA,
      wD,
      outcome,
      tags: [],
      week: 1,
      rng: new SeededRNG(99),
    });

    if (totalGained(outcome.post?.learnsD) > 0) {
      const patch = result.rivalWarriorPatches?.get(warriorId);
      expect(patch?.learnedSkills).toBeDefined();
      expect(totalGained(patch?.learnedSkills)).toBe(totalGained(outcome.post?.learnsD));
    }
  });

  it('appends a learn line to outcome.log when a fighter learns', () => {
    const wA = mkWarrior({ id: 'warrior-a' as WarriorId });
    const wD = mkWarrior({ id: 'warrior-d' as WarriorId, name: 'Warrior D' });
    const s = mkState({ roster: [wA, wD] });
    const outcome = mkOutcome();

    handleProgressions({
      s,
      wA,
      wD,
      outcome,
      tags: [],
      week: 1,
      rng: new SeededRNG(12345),
    });

    if (totalGained(outcome.post?.learnsA) > 0) {
      expect(outcome.log.some((e) => e.text.includes('Warrior A') && /learn/i.test(e.text))).toBe(
        true
      );
    }
  });

  it('skips the learn roll for the fighter who died this bout', () => {
    const wA = mkWarrior();
    const wD = mkWarrior({ id: 'warrior-d' as WarriorId, name: 'Warrior D' });
    const s = mkState({ roster: [wA, wD] });
    const outcome = mkOutcome({ winner: 'A', by: 'Kill' });

    handleProgressions({
      s,
      wA,
      wD,
      outcome,
      tags: [],
      week: 1,
      rng: new SeededRNG(5),
    });

    // The dead fighter (D, who lost by Kill) learns nothing.
    expect(totalGained(outcome.post?.learnsD)).toBe(0);
  });

  it('skips learns for a doomed post-bout death too', () => {
    const wA = mkWarrior();
    const wD = mkWarrior({ id: 'warrior-d' as WarriorId, name: 'Warrior D' });
    const s = mkState({ roster: [wA, wD] });
    const outcome = mkOutcome({ winner: 'D', by: 'KO', post: { xpA: 50, xpD: 100, diedPostBout: 'A' } });

    handleProgressions({
      s,
      wA,
      wD,
      outcome,
      tags: [],
      week: 1,
      rng: new SeededRNG(5),
    });

    expect(totalGained(outcome.post?.learnsA)).toBe(0);
  });

  it('emits a Training Insight newsletter item only for player-owned warriors', () => {
    // Rival-vs-rival bout: learns happen but nothing reaches the gazette.
    const rivalId = 'rival-1' as StableId;
    const wA = mkWarrior({ id: 'ra' as WarriorId, stableId: rivalId });
    const wD = mkWarrior({
      id: 'rd' as WarriorId,
      name: 'Rival D',
      style: FightingStyle.TotalParry,
      stableId: rivalId,
    });
    const s = mkState({
      roster: [],
      warriorToStableMap: new Map([
        ['ra' as WarriorId, { stableId: rivalId, isPlayer: false }],
        ['rd' as WarriorId, { stableId: rivalId, isPlayer: false }],
      ]),
      rivalMap: new Map([[rivalId, { id: rivalId, roster: [wA, wD] } as unknown as RivalStableData]]),
    });
    const outcome = mkOutcome();

    const result = handleProgressions({
      s,
      wA,
      wD,
      outcome,
      tags: [],
      week: 1,
      rng: new SeededRNG(12345),
    });

    const learnItems = (result.newsletterItems ?? []).filter((n) =>
      n.items.some((i) => /learn/i.test(i))
    );
    expect(learnItems).toHaveLength(0);
  });

  it('emits a Training Insight item when a player warrior learns', () => {
    const s = mkState({ roster: [mkWarrior({ id: 'warrior-a' as WarriorId })] });

    // Try seeds until a bout produces learns (WT21 → most bouts learn).
    let saw = false;
    for (let seed = 1; seed <= 10 && !saw; seed++) {
      const freshOutcome = mkOutcome();
      const result = handleProgressions({
        s,
        wA: mkWarrior({ id: 'warrior-a' as WarriorId }),
        wD: mkWarrior({ id: 'warrior-d' as WarriorId, name: 'Warrior D' }),
        outcome: freshOutcome,
        tags: [],
        week: 1,
        rng: new SeededRNG(seed),
      });
      if (totalGained(freshOutcome.post?.learnsA) > 0) {
        const learnItems = (result.newsletterItems ?? []).filter((n) =>
          n.items.some((i) => /learn|lesson/i.test(i))
        );
        expect(learnItems.length).toBeGreaterThanOrEqual(1);
        saw = true;
      }
    }
    expect(saw).toBe(true);
  });

  it('accumulates onto an existing learnedSkills ledger', () => {
    const wA = mkWarrior({ id: 'warrior-a' as WarriorId, learnedSkills: { ATT: 2, DEF: 1 } });
    const wD = mkWarrior({ id: 'warrior-d' as WarriorId, name: 'Warrior D' });
    const s = mkState({ roster: [wA] });
    const outcome = mkOutcome();

    handleProgressions({
      s,
      wA,
      wD,
      outcome,
      tags: [],
      week: 1,
      rng: new SeededRNG(11),
    });

    if ((outcome.post?.learnsA?.ATT ?? 0) === 0) {
      expect(wA.learnedSkills?.ATT).toBe(2);
    } else {
      expect(wA.learnedSkills?.ATT).toBe(2 + (outcome.post?.learnsA?.ATT ?? 0));
    }
    expect(wA.learnedSkills?.DEF).toBe(1 + (outcome.post?.learnsA?.DEF ?? 0));
  });
});
