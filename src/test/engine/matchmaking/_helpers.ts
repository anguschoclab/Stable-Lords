/**
 * Shared fixtures for matchmaking/bloodfeud specs — one warrior shorthand,
 * one promoter stub, one legal OpponentSearchContext builder.
 */
import { findBestOpponent, type OpponentSearchContext } from '@/engine/promoters/offerMatchmaking';
import { makeWarrior } from '@/test/_fixtures/factories';
import type { Warrior } from '@/types/warrior.types';
import type { WarriorId, StableId } from '@/types/shared.types';

export const w = (id: string, stableId?: string) =>
  makeWarrior({ id: id as WarriorId, stableId: stableId as StableId });

export const showmanPromoter = { personality: 'Showman' } as never;

export const opponentCtx = (over: Partial<OpponentSearchContext> = {}): OpponentSearchContext =>
  ({
    promoter: showmanPromoter,
    matchedIds: new Set(),
    recentFightPairs: new Set(),
    playerWarriorIds: new Set(),
    avoidSet: new Set(),
    challengeSet: new Set(),
    gapThreshold: 0.5,
    ...over,
  }) as OpponentSearchContext;

export const searchBest = (
  a: Warrior,
  scoreA: number,
  cands: Warrior[],
  scores: number[],
  c: OpponentSearchContext
) => findBestOpponent(a, scoreA, cands, scores, c);
