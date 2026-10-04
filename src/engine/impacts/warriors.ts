/**
 * Warriors Domain Impacts
 * Handles roster updates, removals, graveyard, and retirement-related state impacts.
 */
import type { GameState, KillEvent } from '@/types/state.types';
import type { Warrior } from '@/types/warrior.types';
import type { WarriorId } from '@/types/shared.types';
import type { WarriorEpithetAward } from './types';
import { epithetRankOf } from '@/data/names/epithets';
import { removeFromRoster, updateRoster } from '@/utils/roster';

/**
 * Apply roster updates to state.
 */
export const rosterUpdates = (state: GameState, value: Map<WarriorId, Partial<Warrior>>) => {
  if (value.size === 0) return;

  // Directly modify the roster without mapping if we only have a few updates
  // and the array is large, or just map if value has many updates
  if (value.size === 1) {
    const entries = Array.from(value.entries());
    if (!entries[0]) return;
    const entry = entries[0];
    const id = entry[0];
    const update = entry[1];
    const index = state.roster.findIndex((w) => w.id === id);
    if (index !== -1) {
      const nextRoster = [...state.roster];
      nextRoster[index] = { ...nextRoster[index], ...update } as Warrior;
      state.roster = nextRoster;
    }
  } else {
    state.roster = updateRoster(state.roster, value);
  }
};

/**
 * Apply roster removals to state.
 */
export const rosterRemovals = (state: GameState, value: WarriorId[]) => {
  if (value.length === 0) return;
  state.roster = removeFromRoster(state.roster, value);
};

/**
 *
 */
export const rosterAdditions = (state: GameState, value: Warrior[]) => {
  state.roster = [...state.roster, ...value];
};

/**
 * Apply graveyard additions to state. Ids are deduplicated — a second Kill
 * outcome against an already-dead warrior must never create a second
 * graveyard entry (the graveyard is a set of unique deaths, not a log).
 */
export const graveyard = (state: GameState, value: Warrior[]) => {
  const seen = new Set<WarriorId>((state.graveyard || []).map((w) => w.id));
  const fresh = value.filter((w) => {
    if (seen.has(w.id)) return false;
    seen.add(w.id);
    return true;
  });
  if (fresh.length > 0) state.graveyard = [...(state.graveyard || []), ...fresh];
};

/**
 * Apply dead-warrior registry additions — append-only, id-deduplicated.
 * Also stamps every matching tournament participant snapshot 'Dead': the
 * bracket record stays self-describing instead of harbouring a stale
 * 'Active' copy of a warrior who can never fight again.
 */
export const deadWarriorIds = (state: GameState, value: WarriorId[]) => {
  if (value.length === 0) return;
  const seen = new Set<WarriorId>(state.deadWarriorIds || []);
  const fresh = value.filter((id) => {
    if (seen.has(id)) return false;
    seen.add(id);
    return true;
  });
  if (fresh.length > 0) state.deadWarriorIds = [...(state.deadWarriorIds || []), ...fresh];

  const dead = new Set<string>(state.deadWarriorIds ?? []);
  if (dead.size === 0) return;
  for (const t of state.tournaments ?? []) {
    for (const p of t.participants ?? []) {
      if (dead.has(p.id) && p.status !== 'Dead' && !p.isDead) {
        p.status = 'Dead';
        p.isDead = true;
      }
    }
  }
};

/**
 * Apply kill-event additions — append-only, deduplicated by event id.
 * Dedupe is deliberately NOT by victim: a second Kill outcome against an
 * already-dead warrior is corruption the oracle counts — killOutcomes
 * exceeding unique deaths is exactly the divergence tripwire.
 */
export const killEvents = (state: GameState, value: KillEvent[]) => {
  if (value.length === 0) return;
  const seen = new Set<string>((state.killEvents || []).map((e) => e.id));
  const fresh = value.filter((e) => {
    if (seen.has(e.id)) return false;
    seen.add(e.id);
    return true;
  });
  if (fresh.length > 0) state.killEvents = [...(state.killEvents || []), ...fresh];
};

/**
 * Apply retired warriors to state.
 */
export const retired = (state: GameState, value: Warrior[]) => {
  state.retired = [...(state.retired || []), ...value];
};

/**
 * Apply earned epithets to final-state warriors — rank-guarded so entries can
 * never downgrade an existing or earlier-queued higher epithet. Iterates the
 * live rosters directly (the findWarriorById cache may hold stale objects
 * after same-tick roster replacements).
 */
export const warriorEpithets = (state: GameState, value: readonly WarriorEpithetAward[]) => {
  for (const { warriorId, epithet } of value) {
    const w =
      state.roster.find((x) => x.id === warriorId) ??
      (state.rivals ?? []).flatMap((r) => r.roster).find((x) => x.id === warriorId) ??
      // Tournament-only warriors (emergency freelancers) can hold titles.
      (state.tournaments ?? [])
        .flatMap((t) => t.participants ?? [])
        .find((x) => x.id === warriorId);
    if (!w) continue;
    if (epithetRankOf(epithet) > epithetRankOf(w.epithet)) w.epithet = epithet;
  }
};

/**
 * Warriors impact handlers map.
 */
export const warriorsHandlers = {
  rosterUpdates,
  rosterRemovals,
  rosterAdditions,
  graveyard,
  retired,
  deadWarriorIds,
  killEvents,
  warriorEpithets,
};
