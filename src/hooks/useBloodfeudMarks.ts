/**
 * Live bloodfeud entitlements touching the player's stable (V24/V26 canon —
 * Rose of Shanon): every arena kill writes a four-week mark owed to the
 * victim's stable. 'owed' marks let any of the player's warriors take the
 * priority booking on the killer; 'hunted' marks mean a rival stable holds
 * the feud against a player killer. Read-only derivation over existing
 * state (bloodfeudMarks + killEvents + the entity index).
 */
import { useMemo } from 'react';
import { useWorldState } from '@/state/useGameStore';
// eslint-disable-next-line no-restricted-imports -- grandfathered pre-boundary-fix import
import { findWarrior, resolveStableName } from '@/engine/core/historyResolver';
import type { BloodfeudMark } from '@/types/state.types';

/** One live feud mark relevant to the player, names resolved for display. */
export interface PlayerBloodfeud {
  mark: BloodfeudMark;
  direction: 'owed' | 'hunted';
  killerWarriorId: BloodfeudMark['killerWarriorId'];
  killerName: string;
  /** 'owed': the killer's stable · 'hunted': the stable holding the feud. */
  opposingStableName: string;
  /** 'owed' only — the slain player warrior, when still resolvable. */
  victimName?: string;
  /** Whole weeks before the mark lapses — ≥1 while live. */
  weeksLeft: number;
}

/**
 * Live feud marks owed to or held against the player's stable.
 * Returns [] on fresh games and once every mark has lapsed.
 */
export function useBloodfeudMarks(): PlayerBloodfeud[] {
  const state = useWorldState();

  return useMemo(() => {
    const now = state.absoluteWeek ?? state.week;
    const playerId = state.player?.id;
    if (!playerId) return [];

    const graveIds = new Set((state.graveyard ?? []).map((w) => w.id));
    // Latest player victim per killer — built once, looked up per mark.
    const victimByKiller = new Map<string, string>();
    for (const e of state.killEvents ?? []) {
      if (graveIds.has(e.victimId)) victimByKiller.set(e.killerId, e.victimId);
    }
    const feuds: PlayerBloodfeud[] = [];

    for (const mark of state.bloodfeudMarks ?? []) {
      if (mark.expiresWeek <= now) continue;
      const killerName = findWarrior(state, mark.killerWarriorId)?.name ?? 'Unknown Warrior';

      if (mark.owedStableId === playerId) {
        // The triggering kill: this killer's latest victim in the player's
        // graveyard (killEvents append chronologically — last write wins).
        const victimId = victimByKiller.get(mark.killerWarriorId);
        feuds.push({
          mark,
          direction: 'owed',
          killerWarriorId: mark.killerWarriorId,
          killerName,
          opposingStableName: resolveStableName(state, mark.killerStableId, 'Rival Stable'),
          victimName: victimId ? findWarrior(state, victimId)?.name : undefined,
          weeksLeft: mark.expiresWeek - now,
        });
      } else if (mark.killerStableId === playerId) {
        feuds.push({
          mark,
          direction: 'hunted',
          killerWarriorId: mark.killerWarriorId,
          killerName,
          opposingStableName: resolveStableName(state, mark.owedStableId, 'Rival Stable'),
          weeksLeft: mark.expiresWeek - now,
        });
      }
    }
    return feuds;
  }, [state]);
}
