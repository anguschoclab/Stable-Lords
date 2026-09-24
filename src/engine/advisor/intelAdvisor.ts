/**
 * Scout & Rematch Intel Advisor
 * Derives head-to-head records from arenaHistory and surfaces persisted
 * scouting intel (insightTokens) so bout scoring and tactics can reflect
 * what the stable actually knows about a specific opponent.
 */
import type { GameState, InsightToken } from '@/types/state.types';
import type { WarriorId } from '@/types/shared.types';

/** Aggregated win/loss record between two warriors across their recent meetings. */
export interface HeadToHead {
  wins: number;
  losses: number;
  meetings: number;
}

/**
 * Derive a warrior's head-to-head record against a specific opponent by
 * scanning arenaHistory. `winner: null` (unresolved) entries are excluded.
 * Bounded by periodic arenaHistory truncation — this is a recent-history,
 * best-effort signal, not an all-time record.
 */
export function deriveHeadToHead(
  state: GameState,
  warriorId: WarriorId,
  opponentId: WarriorId
): HeadToHead {
  let wins = 0;
  let losses = 0;
  for (const fight of state.arenaHistory ?? []) {
    const aSide = fight.warriorIdA === warriorId && fight.warriorIdD === opponentId;
    const dSide = fight.warriorIdD === warriorId && fight.warriorIdA === opponentId;
    if ((!aSide && !dSide) || fight.winner === null) continue;
    if ((aSide && fight.winner === 'A') || (dSide && fight.winner === 'D')) {
      wins++;
    } else {
      losses++;
    }
  }
  return { wins, losses, meetings: wins + losses };
}

/**
 * Return the freshest scouting token per insight type for a given opponent.
 * Intel goes stale — when several tokens of the same type exist, only the
 * most recently discovered one is reported.
 */
export function getOpponentIntel(state: GameState, opponentId: WarriorId): InsightToken[] {
  const byType = new Map<InsightToken['type'], InsightToken>();
  for (const token of state.insightTokens ?? []) {
    if (token.warriorId !== opponentId) continue;
    const prev = byType.get(token.type);
    if (!prev || token.discoveredWeek > prev.discoveredWeek) {
      byType.set(token.type, token);
    }
  }
  return [...byType.values()];
}

/**
 * Render intel tokens as one readable line each, for advisor reasoning lists.
 */
export function summarizeIntel(tokens: InsightToken[]): string[] {
  return tokens.map((t) => `${t.type}: ${t.detail}`);
}
