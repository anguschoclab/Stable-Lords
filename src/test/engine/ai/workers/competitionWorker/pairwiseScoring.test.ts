/**
 * D.0 — Pairwise matchup scoring (G18).
 * `scorePairwiseMatchup` must equal legacy `scoreMatchup` for player context
 * (no challenges/avoids) and must be immune to player challenge/avoid marks
 * leaking into AI-vs-AI scoring.
 */
import { describe, it, expect } from 'vitest';
import {
  scoreMatchup,
  scorePairwiseMatchup,
} from '@/engine/schedulingAssistant';
import {
  makeGameState,
  makeRival,
  makeWarrior,
  makeFightSummary,
} from '@/test/_fixtures/factories';
import type { GameState } from '@/types/state.types';
import type { Warrior } from '@/types/warrior.types';

function ctxFromState(state: GameState, a: Warrior, b: Warrior) {
  return {
    rankings: state.realmRankings,
    arenaHistory: state.arenaHistory,
    rivalries: state.rivalries,
    rivalryMap: state.rivalryMap,
    aStableId: (a.stableId ?? state.player.id) as string,
    bStableId: b.stableId as string,
    week: state.week,
  };
}

describe('scorePairwiseMatchup', () => {
  it('equals legacy scoreMatchup for player-context scoring', () => {
    const a = makeWarrior({ fame: 120 });
    const b = makeWarrior({ fame: 90 });
    const rival = makeRival({ roster: [b] });
    const state = makeGameState({
      rivals: [rival],
      arenaHistory: [makeFightSummary({ warriorIdA: a.id, warriorIdD: b.id, winner: 'A' })],
    });
    const pairwise = scorePairwiseMatchup(a, b, ctxFromState(state, a, b));
    expect(pairwise).toBe(scoreMatchup(a, b, state));
  });

  it('equals legacy scoreMatchup when rankings and rivalries are populated', () => {
    const a = makeWarrior({ fame: 100, career: { wins: 6, losses: 2, kills: 0 } });
    const b = makeWarrior({ fame: 100, career: { wins: 3, losses: 5, kills: 0 } });
    const rival = makeRival({ roster: [b] });
    const state = makeGameState({ rivals: [rival] });
    state.realmRankings = {
      [a.id]: { overallRank: 4, classRank: 1, compositeScore: 60 } as never,
      [b.id]: { overallRank: 7, classRank: 2, compositeScore: 50 } as never,
    };
    const pairwise = scorePairwiseMatchup(a, b, ctxFromState(state, a, b));
    expect(pairwise).toBe(scoreMatchup(a, b, state));
  });

  it('is unaffected by playerChallenges/playerAvoids (AI-AI leak fix)', () => {
    const a = makeWarrior({ fame: 100 });
    const b = makeWarrior({ fame: 100 });
    const rival = makeRival({ roster: [a, b] });
    const base = makeGameState({ rivals: [rival] });
    const challenged = makeGameState({
      rivals: [rival],
      playerChallenges: [b.id],
    });
    const avoided = makeGameState({
      rivals: [rival],
      playerAvoids: [b.id],
    });

    // Legacy scorer is player-sensitive (that's its job)
    expect(scoreMatchup(a, b, challenged)).not.toBe(scoreMatchup(a, b, base));

    // Pairwise scorer sees none of it — AI-vs-AI scoring is player-agnostic
    const sBase = scorePairwiseMatchup(a, b, ctxFromState(base, a, b));
    expect(scorePairwiseMatchup(a, b, ctxFromState(challenged, a, b))).toBe(sBase);
    expect(scorePairwiseMatchup(a, b, ctxFromState(avoided, a, b))).toBe(sBase);
  });
});
