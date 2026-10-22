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
import { ageGroupForAge } from '@/engine/avatar/avatarGenerator';
import { BASE_ROSTER_CAP } from '@/constants/economy/roster';
import { isActive } from '@/engine/warrior/warriorStatus';
import { collectUsedWarriorIds } from '@/engine/core/warriorCollection';
import { indexBy } from '@/utils/collections';

/**
 * Apply roster updates to state.
 */
const rosterUpdates = (state: GameState, value: Map<WarriorId, Partial<Warrior>>) => {
  if (value.size === 0) return;
  const rosterById = indexBy(state.roster, (w) => w.id);
  for (const [id, update] of value) {
    const currentAge = rosterById.get(id)?.age;
    if (update.age !== undefined && ageGroupForAge(currentAge) !== ageGroupForAge(update.age)) {
      delete state.avatarCache?.[id];
    }
  }

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
const rosterRemovals = (state: GameState, value: WarriorId[]) => {
  if (value.length === 0) return;
  for (const id of value) delete state.avatarCache?.[id];
  state.roster = removeFromRoster(state.roster, value);
};

/**
 *
 */
const rosterAdditions = (state: GameState, value: Warrior[]) => {
  if (value.length === 0) return;
  // The funnel is the gatekeeper — impacts are the last line of defense:
  // dedupe against every known warrior id, clamp to the active cap.
  const usedIds = collectUsedWarriorIds(state);
  const room = BASE_ROSTER_CAP + (state.rosterBonus ?? 0) - state.roster.filter(isActive).length;
  if (room <= 0) return;
  const stamped = value
    .filter((w) => {
      if (usedIds.has(w.id)) return false;
      usedIds.add(w.id);
      return true;
    })
    .slice(0, room)
    .map((w) => (w.stableId ? w : { ...w, stableId: state.player?.id }));
  if (stamped.length > 0) state.roster = [...state.roster, ...stamped];
};

/**
 * Apply graveyard additions to state. Ids are deduplicated — a second Kill
 * outcome against an already-dead warrior must never create a second
 * graveyard entry (the graveyard is a set of unique deaths, not a log).
 */
const graveyard = (state: GameState, value: Warrior[]) => {
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
const deadWarriorIds = (state: GameState, value: WarriorId[]) => {
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
const killEvents = (state: GameState, value: KillEvent[]) => {
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
const retired = (state: GameState, value: Warrior[]) => {
  state.retired = [...(state.retired || []), ...value];
};

/**
 * Apply earned epithets to final-state warriors — rank-guarded so entries can
 * never downgrade an existing or earlier-queued higher epithet. Iterates the
 * live rosters directly (the findWarriorById cache may hold stale objects
 * after same-tick roster replacements).
 */
const warriorEpithets = (state: GameState, value: readonly WarriorEpithetAward[]) => {
  // One index across all three collections — precedence roster → rivals →
  // tournament participants, matching the previous find() chain exactly.
  const warriorById = new Map<string, Warrior>();
  const seed = (warriors: readonly Warrior[] | undefined) => {
    for (const w of warriors ?? []) {
      if (!warriorById.has(w.id)) warriorById.set(w.id, w);
    }
  };
  seed(state.roster);
  for (const r of state.rivals ?? []) seed(r.roster);
  for (const t of state.tournaments ?? []) seed(t.participants);
  for (const { warriorId, epithet } of value) {
    const w = warriorById.get(warriorId);
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
