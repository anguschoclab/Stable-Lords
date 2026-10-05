import { BoutOffer, GameState, Warrior } from '@/types/state.types';
import { buildActiveWarriorMap } from '@/utils/roster';
import { isActive } from '@/engine/warrior/warriorStatus';
import { boutOfferAbsoluteWeek } from '@/engine/core/absoluteWeek';

/**
 * Defines the shape of bout pairing.
 */
export interface BoutPairing {
  a: Warrior;
  d: Warrior;
  isRivalry: boolean;
  rivalStable?: string;
  rivalStableId?: string;
  contractId?: string;
}

/** Extract the owning tournament id from a synthetic `tour_*` contractId. */
export function tournamentIdFromContractId(contractId?: string): string | undefined {
  if (!contractId?.startsWith('tour_')) return undefined;
  const parts = contractId.split('_');
  // tour_<tournamentId>_<round>_<matchIndex> — tournamentId may itself
  // contain underscores, so drop the fixed prefix + two trailing segments.
  if (parts.length < 4) return undefined;
  return parts.slice(1, -2).join('_');
}

/**
 * Result of pairing generation. `voidedOffers` are Signed contracts that lost
 * the one-bout-per-warrior dedupe — callers must cancel them explicitly.
 */
interface PairingsResult {
  pairings: BoutPairing[];
  voidedOffers: BoutOffer[];
}

/**
 * Deterministic ordering for conflicting signed offers. Title bouts take
 * precedence once `titleArenaId` exists (Phase 3); until then offer-id order
 * keeps the outcome independent of map insertion order.
 */
function compareOffersForPairing(a: BoutOffer, b: BoutOffer): number {
  const aTitle = a.titleArenaId ? 0 : 1;
  const bTitle = b.titleArenaId ? 0 : 1;
  if (aTitle !== bTitle) return aTitle - bTitle;
  return String(a.id) < String(b.id) ? -1 : String(a.id) > String(b.id) ? 1 : 0;
}

/**
 * Collect this day's tournament pairings. Tournament combatants take
 * precedence over signed offers (they reserve the warriors first), but their
 * pairings are still emitted after contract pairings to preserve the
 * established ordering.
 */
function collectTournamentPairings(
  state: GameState,
  warriorMap: Map<string, Warrior>,
  committedWarriors: Set<string>
): BoutPairing[] {
  const tournamentPairings: BoutPairing[] = [];
  if (state.isTournamentWeek && state.activeTournamentId) {
    const tournament = state.tournaments.find((t) => t.id === state.activeTournamentId);
    if (tournament) {
      // Round 1 is Day 1, Round 2 is Day 2, etc.
      const currentDay = state.day || 0;
      const tournamentBouts = tournament.bracket.filter(
        (b) => b.round === currentDay && b.winner === undefined
      );

      tournamentBouts.forEach((bout) => {
        const wA = warriorMap.get(bout.warriorIdA);
        const wD = warriorMap.get(bout.warriorIdD);

        if (wA && wD) {
          committedWarriors.add(wA.id);
          committedWarriors.add(wD.id);
          tournamentPairings.push({
            a: wA,
            d: wD,
            isRivalry: true, // Tournaments are always high stakes
            rivalStable: state.rivalMap?.get(bout.stableIdD || '')?.owner.stableName || 'Rival',
            rivalStableId: bout.stableIdD,
            contractId: `tour_${tournament.id}_${bout.round}_${bout.matchIndex}`,
          });
        }
      });
    }
  }
  return tournamentPairings;
}

interface ResolveContractOfferArgs {
  offer: BoutOffer;
  state: GameState;
  warriorMap: Map<string, Warrior>;
  committedWarriors: Set<string>;
  activeChampionIds: Set<string>;
  deadIds: ReadonlySet<string>;
  pairings: BoutPairing[];
  voidedOffers: BoutOffer[];
}

/** Resolve a signed offer into a pairing — or void it (champion choke point / double-booking). */
function resolveContractOffer(args: ResolveContractOfferArgs): void {
  const { offer, state, warriorMap, committedWarriors, activeChampionIds } = args;
  const { deadIds, pairings, voidedOffers } = args;
  const idA = offer.warriorIds[0];
  const idD = offer.warriorIds[1];
  if (
    !offer.titleArenaId &&
    ((idA && activeChampionIds.has(idA)) || (idD && activeChampionIds.has(idD)))
  ) {
    voidedOffers.push(offer);
    return;
  }
  const wA = idA ? warriorMap.get(idA) : undefined;
  const wD = idD ? warriorMap.get(idD) : undefined;

  // A signed offer that can no longer field both combatants is voided rather
  // than silently dropped — an un-voided Signed offer lingers as a ghost that
  // never resolves, never pays out, and never penalizes.
  if (
    !wA ||
    !wD ||
    !isActive(wA) ||
    !isActive(wD) ||
    deadIds.has(wA.id) ||
    deadIds.has(wD.id)
  ) {
    voidedOffers.push(offer);
    return;
  }

  // A warrior can only fight once per week — later contracts are voided
  // by the caller so no ghost Signed offer is left dangling.
  if (committedWarriors.has(wA.id) || committedWarriors.has(wD.id)) {
    voidedOffers.push(offer);
    return;
  }
  committedWarriors.add(wA.id);
  committedWarriors.add(wD.id);

  // Find which stable wD belongs to using O(1) map lookup
  const stableInfo = state.warriorToStableMap?.get(wD.id);
  const rivalStable =
    stableInfo && !stableInfo.isPlayer ? state.rivalMap?.get(stableInfo.stableId) : undefined;

  pairings.push({
    a: wA,
    d: wD,
    isRivalry: (offer.hype || 0) > 150, // Use hype as a proxy for rivalry
    rivalStable: rivalStable?.owner.stableName,
    rivalStableId: rivalStable?.id,
    contractId: offer.id,
  });
}

/**
 * Generate pairings.
 */
export function generatePairings(state: GameState): PairingsResult {
  const currentWeek = state.absoluteWeek;
  const pairings: BoutPairing[] = [];
  const voidedOffers: BoutOffer[] = [];

  // ⚡ Bolt: Use cached warriorMap if available, otherwise build it
  const warriorMap = state.warriorMap || buildActiveWarriorMap(state);

  // Warriors already committed this week (tournament combatants first — the
  // bracket is authoritative — then signed contracts). One bout per warrior.
  const committedWarriors = new Set<string>();

  const tournamentPairings = collectTournamentPairings(state, warriorMap, committedWarriors);

  // The persistent death registry (never truncated) plus the graveyard — a
  // stale 'Active' snapshot of a dead warrior cannot satisfy a contract.
  const deadIds = new Set<string>([
    ...(state.deadWarriorIds ?? []),
    ...(state.graveyard ?? []).map((w) => w.id as string),
  ]);

  // Derive pairings from Signed Contracts for this week
  const allOffers = Object.values(state.boutOffers || {});
  const currentOffers = allOffers
    .filter((o) => o.status === 'Signed' && boutOfferAbsoluteWeek(o) === currentWeek)
    .sort(compareOffersForPairing);

  // Choke point: an ACTIVE-status reigning champion only ever fights title
  // bouts — any non-title pairing involving them is voided, regardless of
  // which producer created the offer. Pending/dormant champions resolve
  // their signed ordinary offers normally.
  const activeChampionIds = new Set(
    Object.values(state.arenaChampions ?? {}).flatMap((t) =>
      t.status === 'active' && t.champion ? [t.champion.warriorId as string] : []
    )
  );

  currentOffers.forEach((offer) =>
    resolveContractOffer(
      { offer: offer, state: state, warriorMap: warriorMap, committedWarriors: committedWarriors, activeChampionIds: activeChampionIds, deadIds: deadIds, pairings: pairings, voidedOffers: voidedOffers }
    )
  );

  return { pairings: [...pairings, ...tournamentPairings], voidedOffers };
}
