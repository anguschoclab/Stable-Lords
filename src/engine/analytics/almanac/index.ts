/**
 * The Almanac — barrel for the record-board modules + the one-call aggregate.
 * Import path stays `@/engine/analytics/almanac` for all consumers.
 */
export type {
  AlmanacBoard,
  AlmanacBoardKind,
  AlmanacData,
  AlmanacInput,
  AlmanacRow,
  AlmanacStableInput,
  AlmanacStat,
} from './shared';
export { computeAccoladeBoards } from './accolades';
export { computeCareerBoards } from './career';
export { computeChampionshipBoards } from './championships';
export { computeFightBoards } from './fights';
export { computeStableBoards } from './stables';
export { computeStreakBoards } from './streaks';
export { computeStyleArenaBoards } from './styleArena';
export { computeWorldStats } from './world';

import { computeAccoladeBoards } from './accolades';
import { computeCareerBoards } from './career';
import { computeChampionshipBoards } from './championships';
import { computeFightBoards } from './fights';
import { computeStableBoards } from './stables';
import { computeStreakBoards } from './streaks';
import { computeStyleArenaBoards } from './styleArena';
import { computeWorldStats } from './world';
import type { AlmanacData, AlmanacInput } from './shared';

/** Full almanac — every section computed in one pass-friendly call. */
export function computeAlmanac(input: AlmanacInput): AlmanacData {
  return {
    career: computeCareerBoards(input),
    accolades: computeAccoladeBoards(input),
    championships: computeChampionshipBoards(input),
    streaks: computeStreakBoards(input),
    styleArena: computeStyleArenaBoards(input),
    fights: computeFightBoards(input),
    stables: computeStableBoards(input),
    world: computeWorldStats(input),
  };
}
