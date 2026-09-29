import type { GameState } from '@/types/state.types';
import { findWarriorById } from '@/engine/core/warriorLookup';
import { warriorDisplayName } from '@/utils/warriorDisplay';
import type { ChampionshipDelta } from '../core';
import { titleOf, ensureTitle, endReign, news } from '../core';

// ─── Relinquish (player/AI action) ──────────────────────────────────────────

/** Voluntarily end a reign — same cooldown consequences as being stripped. */
export function relinquishCrown(
  state: GameState,
  delta: ChampionshipDelta,
  arenaId: string
): void {
  const title = titleOf(state, delta, arenaId);
  if (!title?.champion) return;
  const t = ensureTitle(state, delta, arenaId);
  const champId = t.champion?.warriorId;
  if (!champId) return;
  const name = findWarriorById(state, champId);
  const nameLabel = name ? warriorDisplayName(name) : champId;
  endReign(state, t, 'relinquished', state.absoluteWeek);
  news(delta, state.week, `Crown Relinquished`, [`${nameLabel} gives up the crown.`], `relinq-${arenaId}-${state.absoluteWeek}`);
}

/**
 * Consume rival relinquish declarations (`agentMemory.pendingRelinquish`).
 * The crown worker only flags intent; the actual vacancy goes through the
 * same `relinquishCrown` path a player abdication uses, inside the pass's
 * championship delta. Markers clear themselves next tick — the crown worker
 * drops them once the stable no longer holds that throne.
 */
export function processPendingRelinquishments(state: GameState, delta: ChampionshipDelta): void {
  for (const rival of state.rivals ?? []) {
    const pending = rival.agentMemory?.pendingRelinquish;
    if (!pending) continue;
    const champId = titleOf(state, delta, pending)?.champion?.warriorId;
    if (!champId || !rival.roster.some((w) => w.id === champId)) continue;
    relinquishCrown(state, delta, pending);
  }
}

// Grand Championship field selection, bracket emission, and winner recording
// live in ./championsTournament.ts — the single award home for the
// champions-only week-52 bracket.
