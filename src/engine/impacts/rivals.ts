/**
 * Rivals Domain Impacts
 * Handles rival stable updates.
 */
import type { GameState, RivalStableData } from '@/types/state.types';
import type { StableId, WarriorId } from '@/types/shared.types';
import type { Warrior } from '@/types/warrior.types';

/**
 * Apply rivals updates to state.
 */
export const rivalsUpdates = (state: GameState, value: Map<StableId, Partial<RivalStableData>>) => {
  if (value.size === 0) return;
  if (process.env.EPITHET_DEBUG) {
    for (const r of state.rivals) {
      const update = value.get(r.id);
      if (!update?.roster) continue;
      for (const w of r.roster) {
        if (w.epithet) {
          const next = update.roster.find((x) => x.id === w.id);
          if (next && !next.epithet) console.error(`[roster-wipe] wk${state.absoluteWeek} ${r.owner?.stableName}: ${w.name} loses '${w.epithet}'`);
          else if (!next) console.error(`[roster-drop] wk${state.absoluteWeek} ${r.owner?.stableName}: ${w.name} removed (had '${w.epithet}')`);
        }
      }
    }
  }
  state.rivals = state.rivals.map((r) => {
    const update = value.get(r.id);
    return update ? { ...r, ...update } : r;
  });
  // Rebuild rivalMap cache from the updated rivals array to guarantee sync
  if (state.rivalMap) {
    state.rivalMap = new Map(state.rivals.map((r) => [r.id, r] as const));
  }
};

function rebuildRivalMap(state: GameState): void {
  if (state.rivalMap) {
    state.rivalMap = new Map(state.rivals.map((r) => [r.id, r] as const));
  }
}

/**
 * Apply per-warrior patches to rival-owned warriors, wherever they are rostered.
 */
export const rivalWarriorPatches = (state: GameState, value: Map<WarriorId, Partial<Warrior>>) => {
  if (value.size === 0) return;
  state.rivals = state.rivals.map((r) => {
    if (!r.roster.some((w) => value.has(w.id))) return r;
    return {
      ...r,
      roster: r.roster.map((w) => {
        const patch = value.get(w.id);
        return patch ? ({ ...w, ...patch } as Warrior) : w;
      }),
    };
  });
  rebuildRivalMap(state);
};

/**
 * Remove rival-owned warriors (e.g. killed in a bout) from their rosters.
 */
export const rivalRosterRemovals = (state: GameState, value: WarriorId[]) => {
  if (value.length === 0) return;
  const ids = new Set<string>(value);
  state.rivals = state.rivals.map((r) =>
    r.roster.some((w) => ids.has(w.id))
      ? { ...r, roster: r.roster.filter((w) => !ids.has(w.id)) }
      : r
  );
  rebuildRivalMap(state);
};

/**
 * Swap bankrupt stables for their successors, keeping world order. A
 * successor whose id is already live is dropped (the bankrupt stable stays
 * and is retried next tick) rather than duplicating a stable id.
 */
export const rivalReplacements = (state: GameState, value: Map<StableId, RivalStableData>) => {
  if (value.size === 0) return;
  const liveIds = new Set<string>(state.rivals.map((r) => r.id));
  state.rivals = state.rivals.map((r) => {
    const successor = value.get(r.id);
    if (!successor || liveIds.has(successor.id)) return r;
    liveIds.add(successor.id);
    return successor;
  });
  rebuildRivalMap(state);
};

/**
 * Add stables outright (seasonal expansion). Ids already live are skipped —
 * joining the world must never overwrite an existing stable.
 */
export const rivalsAdditions = (state: GameState, value: RivalStableData[]) => {
  if (value.length === 0) return;
  const liveIds = new Set<string>(state.rivals.map((r) => r.id));
  for (const addition of value) {
    if (liveIds.has(addition.id)) continue;
    liveIds.add(addition.id);
    state.rivals.push(addition);
  }
  rebuildRivalMap(state);
};

/**
 * Remove stables outright (seasonal bankruptcy without a successor).
 * Updates keyed to a removed id become no-ops once it is gone.
 */
export const rivalsRemovals = (state: GameState, value: StableId[]) => {
  if (value.length === 0) return;
  const ids = new Set<string>(value);
  state.rivals = state.rivals.filter((r) => !ids.has(r.id));
  rebuildRivalMap(state);
};

/**
 * Rivals impact handlers map.
 */
export const rivalsHandlers = {
  rivalsUpdates,
  rivalWarriorPatches,
  rivalRosterRemovals,
  rivalReplacements,
  rivalsAdditions,
  rivalsRemovals,
};
