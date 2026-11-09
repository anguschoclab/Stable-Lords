import type { GameState, TournamentEntry, Warrior } from '@/types/state.types';
import type { TournamentId, WarriorId } from '@/types/shared.types';
import type { IRNGService } from '@/engine/core/rng/IRNGService';
import { SeededRNG } from '@/utils/random';
import { fightEquivalentsOf } from '@/engine/warrior/careerUpdate';
import { isActive } from '@/engine/warrior/warriorStatus';
import { collectUsedWarriorNames } from '@/engine/core/warriorCollection';
import { buildTournament } from './committee';
import { generateFreelancer } from './utils';
import { TOURNAMENT_CLASSES, classForFE, type TournamentClassId } from './classes';

/** Class-bracket emission output: emitted entries + the active bracket id. */
export interface ClassEmissionResult {
  tournaments: TournamentEntry[];
  activeTournamentId?: TournamentId;
}

/** Next power of two ≥ n — bracket sizes must stay single-elimination clean. */
function nextPow2(n: number): number {
  return Math.pow(2, Math.ceil(Math.log2(n || 1)));
}

/** Every rostered warrior, indexed — the declared/invited id resolution pool. */
function rosteredById(state: GameState): Map<string, Warrior> {
  const byId = new Map<string, Warrior>();
  for (const w of state.roster ?? []) byId.set(w.id, w);
  for (const r of state.rivals ?? []) for (const w of r.roster) byId.set(w.id, w);
  return byId;
}

/**
 * The class a declared/invited warrior enters — FROZEN FE when the snapshot
 * holds it, live FE otherwise (a warrior who slipped in post-freeze still
 * needs a class; the locked one only exists for snapshot members).
 */
function classOfEntrant(
  cycle: { feByWarrior: Record<string, number> },
  byId: Map<string, Warrior>,
  id: string
): TournamentClassId {
  const fe = cycle.feByWarrior[id] ?? fightEquivalentsOf(byId.get(id)!);
  return classForFE(fe);
}

/**
 * Class-bracket emission — Duel2 canon, week T.
 *
 * One bracket per populated class: entrants are (invited ∪ declared-in-class)
 * deduped − scratched − non-live ids, gated by the class minimum field.
 * Viable fields pad up to the next power of two (≤ the class cap) with
 * class-scaled freelancers so byes never decide a class podium. The active
 * bracket is the one holding the most player-stable entrants — deterministic
 * fallback is class order (rookies first).
 */
export function emitClassTournaments(
  state: GameState,
  nextWeek: number,
  rng: IRNGService
): ClassEmissionResult {
  const cycle = state.tournamentCycle;
  // Freeze is the gate: no cycle (or a stale one for another week) → nothing.
  if (!cycle || cycle.forWeek !== nextWeek) {
    return { tournaments: [], activeTournamentId: undefined };
  }

  const byId = rosteredById(state);
  // Scratches = the cycle ledger ∪ rival-filed scratches (RECOVERY/SURVIVAL
  // stables pull their invites through tournamentScratchIds).
  const scratched = new Set<string>([
    ...(cycle.scratched ?? []),
    ...(state.rivals ?? []).flatMap((r) => r.tournamentScratchIds ?? [] as string[]),
  ]);
  // Declarations = the player-filed ledger ∪ every rival's tournamentEntryIds
  // (AI stables file through planTournamentEntries, not the cycle ledger).
  const declaredIds = [
    ...(Object.values(cycle.declared ?? {}).flat() as string[]),
    ...(state.rivals ?? []).flatMap((r) => r.tournamentEntryIds ?? [] as string[]),
  ];
  const usedNames = collectUsedWarriorNames(state);
  const seedRng = rng as SeededRNG;
  const tournaments: TournamentEntry[] = [];

  for (const spec of TOURNAMENT_CLASSES) {
    const invited = (cycle.invited[spec.id] ?? []) as string[];
    const declaredInClass = declaredIds.filter(
      (id) => classOfEntrant(cycle, byId, id) === spec.id
    );
    const entrantIds = [...new Set([...invited, ...declaredInClass])].filter(
      (id) => !scratched.has(id)
    );
    const entrants = entrantIds
      .map((id) => byId.get(id))
      .filter((w): w is Warrior => !!w && isActive(w))
      .slice(0, spec.fieldCap);

    // Viability is judged on the PADDED field — a scratched/depleted entry
    // list that still reaches the minimum bracket size gets freelancer
    // backfill rather than canceling the class outright.
    const target = Math.min(nextPow2(entrants.length), spec.fieldCap);
    if (target < spec.minField) continue;
    const field = [...entrants];
    for (const w of field) usedNames.add(w.name);
    while (field.length < target) {
      const freelancer = generateFreelancer(
        spec.id,
        field.length,
        seedRng,
        usedNames,
        spec.freelancerPool
      );
      usedNames.add(freelancer.name);
      field.push(freelancer);
    }

    const tournament = buildTournament({
      tierId: spec.id,
      tierName: spec.name,
      warriors: field,
      week: nextWeek,
      season: cycle.season ?? state.season,
      rng: seedRng,
      year: state.year ?? 1,
    });
    tournament.classId = spec.id;
    tournaments.push(tournament);
  }

  // Active bracket: most player-stable entrants; a tie keeps class order.
  let activeTournamentId: TournamentId | undefined;
  let mostPlayerEntrants = -1;
  for (const t of tournaments) {
    const playerCount = t.participants.filter((p) => p.stableId === state.player.id).length;
    if (playerCount > mostPlayerEntrants) {
      mostPlayerEntrants = playerCount;
      activeTournamentId = t.id;
    }
  }

  return { tournaments, activeTournamentId };
}
