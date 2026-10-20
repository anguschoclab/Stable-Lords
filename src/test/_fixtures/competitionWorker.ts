import { evaluateBoutOffer } from '@/engine/ai/workers/competitionWorker';
import type { EvaluateBoutOfferArgs } from '@/engine/ai/workers/competitionWorker/boutAcceptance';
import { makeGameState } from '@/test/_fixtures/factories';
import type { GameState, RankingEntry, Warrior } from '@/types/state.types';
import type { WarriorId } from '@/types/shared.types';

/**
 * Shared eval harness for competitionWorker offer-acceptance specs — sane
 * defaults (Clear weather, week 5) so tests only state what they vary.
 */
export function evalBoutOffer(args: Partial<EvaluateBoutOfferArgs> & Pick<EvaluateBoutOfferArgs, 'offer' | 'rival' | 'warrior'>) {
  return evaluateBoutOffer({ currentWeek: 5, weather: 'Clear', ...args });
}

/** Rankings where `topWarriorId` sits #1 of ten — the 'Dominant' threat profile. */
export function dominantRankings(topWarriorId: string): Record<WarriorId, RankingEntry> {
  const entries: Record<WarriorId, RankingEntry> = {
    [topWarriorId as WarriorId]: { overallRank: 1, classRank: 1, compositeScore: 100 },
  };
  for (let i = 2; i <= 10; i++) {
    entries[`dummy-${i}` as WarriorId] = {
      overallRank: i,
      classRank: i,
      compositeScore: 100 - i,
    };
  }
  return entries;
}

/** Player-owned opponent + dominant rankings (or empty for the control). */
export function playerPressureState(opponent: Warrior, dominant: boolean): GameState {
  return makeGameState({
    week: 5,
    absoluteWeek: 5,
    roster: [opponent],
    realmRankings: dominant ? dominantRankings(opponent.id) : {},
  });
}
