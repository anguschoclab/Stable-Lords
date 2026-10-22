import type { StableId, WarriorId } from '@/types/shared.types';
import type { FightSummary } from '@/types/combat.types';
import type { GameState } from '@/types/game';
import {
  makeRival,
  makeWarrior,
  makeFightSummary,
  makeGameState,
} from '@/test/_fixtures/factories';

/**
 * Shared self-vs-opp scenario for intelDossier specs: self-1 (rw1) vs opp-1
 * (ow1) plus one arena-history fight between them at absoluteWeek 5.
 */
export function selfVsOppState(over?: {
  selfWarrior?: ReturnType<typeof makeWarrior>;
  fight?: Partial<FightSummary>;
  opp?: ReturnType<typeof makeRival>;
  absoluteWeek?: number;
  arenaHistory?: FightSummary[];
}): { self: ReturnType<typeof makeRival>; opp: ReturnType<typeof makeRival>; state: GameState } {
  const self = makeRival({
    id: 'self-1' as StableId,
    roster: [over?.selfWarrior ?? makeWarrior({ id: 'rw1' as WarriorId })],
  });
  const opp =
    over?.opp ??
    makeRival({
      id: 'opp-1' as StableId,
      roster: [makeWarrior({ id: 'ow1' as WarriorId })],
    });
  const state = makeGameState({
    rivals: [self, opp],
    absoluteWeek: over?.absoluteWeek ?? 5,
    arenaHistory: over?.arenaHistory ?? [
      makeFightSummary({
        warriorIdA: 'rw1' as WarriorId,
        warriorIdD: 'ow1' as WarriorId,
        stableIdA: 'self-1' as StableId,
        stableIdD: 'opp-1' as StableId,
        absoluteWeek: 5,
        ...over?.fight,
      }),
    ],
  });
  return { self, opp, state };
}
