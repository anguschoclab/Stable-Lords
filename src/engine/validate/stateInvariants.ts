/**
 * State-invariant validation — structural assertions that must hold after any
 * week/quarter/year advance, regardless of execution path (sequential or
 * shard-parallel). Run periodically in soak.mjs and CI slow tests; each check
 * is O(state) and off the hot path.
 *
 * Violations are reported, never thrown mid-run — callers decide whether to
 * abort (CI) or log (soak).
 */
import type { GameState } from '@/types/state.types';
import type { Warrior } from '@/types/warrior.types';

/** A single violated invariant. */
export interface InvariantViolation {
  /** Stable machine-readable invariant id, e.g. 'roster-id-unique'. */
  id: string;
  message: string;
}

const hasNaN = (v: unknown): boolean =>
  typeof v === 'number'
    ? Number.isNaN(v)
    : typeof v === 'object' && v !== null
      ? Object.values(v).some(hasNaN)
      : false;

function checkWarrior(w: Warrior, where: string, out: InvariantViolation[]): void {
  if (!w.id) out.push({ id: 'warrior-id', message: `${where}: warrior missing id` });
  if (hasNaN(w.attributes))
    out.push({ id: 'no-nan', message: `${where}: ${w.name} has NaN attributes` });
  if (typeof w.fame === 'number' && Number.isNaN(w.fame))
    out.push({ id: 'no-nan', message: `${where}: ${w.name} has NaN fame` });
}

/**
 * Validates structural invariants on a GameState. Returns all violations
 * found (empty array = clean). Pure — never mutates state.
 */
export function validateStateInvariants(state: GameState): InvariantViolation[] {
  const out: InvariantViolation[] = [];

  // ── Roster id uniqueness across every stable ─────────────────────────
  const seen = new Map<string, string>();
  const claim = (id: string | undefined, where: string) => {
    if (!id) return;
    const prev = seen.get(id);
    if (prev && prev !== where) {
      out.push({
        id: 'roster-id-unique',
        message: `warrior ${id} appears in both ${prev} and ${where}`,
      });
    } else {
      seen.set(id, where);
    }
  };
  for (const w of state.roster ?? []) {
    claim(w.id, 'player roster');
    checkWarrior(w, 'player roster', out);
  }
  for (const r of state.rivals ?? []) {
    const inner = new Set<string>();
    for (const w of r.roster ?? []) {
      if (inner.has(w.id)) {
        out.push({
          id: 'roster-id-unique',
          message: `duplicate warrior id ${w.id} within rival ${r.id}`,
        });
      }
      inner.add(w.id);
      checkWarrior(w, `rival ${r.id}`, out);
    }
  }

  // ── Treasury / ledger sanity ─────────────────────────────────────────
  if (typeof state.treasury === 'number' && Number.isNaN(state.treasury)) {
    out.push({ id: 'no-nan', message: 'treasury is NaN' });
  }
  for (const entry of state.ledger ?? []) {
    if (typeof entry.amount === 'number' && Number.isNaN(entry.amount)) {
      out.push({ id: 'no-nan', message: `ledger entry ${entry.id} has NaN amount` });
    }
  }

  // ── Map ↔ collection coherence (week caches) ─────────────────────────
  // warriorToOfferIds must only reference offers that exist and that list
  // the warrior; every offer's warriors must be indexed.
  if (state.warriorToOfferIds && state.boutOffers) {
    for (const [wId, offerIds] of state.warriorToOfferIds) {
      for (const oId of offerIds) {
        const offer = state.boutOffers[oId];
        if (!offer) {
          out.push({
            id: 'offer-index-coherence',
            message: `warriorToOfferIds[${wId}] references missing offer ${oId}`,
          });
        } else if (!offer.warriorIds.includes(wId)) {
          out.push({
            id: 'offer-index-coherence',
            message: `offer ${oId} does not list warrior ${wId} indexed to it`,
          });
        }
      }
    }
  }

  // warriorMap must be a faithful index of all rosters when present.
  if (state.warriorMap) {
    for (const w of state.roster ?? []) {
      if (state.warriorMap.get(w.id) !== w) {
        out.push({
          id: 'cache-coherence',
          message: `warriorMap does not point at roster object for ${w.id}`,
        });
      }
    }
    for (const r of state.rivals ?? []) {
      for (const w of r.roster ?? []) {
        if (state.warriorMap.get(w.id) !== w) {
          out.push({
            id: 'cache-coherence',
            message: `warriorMap does not point at roster object for ${w.id}`,
          });
        }
      }
    }
  }

  // ── Calendar sanity ──────────────────────────────────────────────────
  if (state.week !== undefined && (state.week < 1 || state.week > 52)) {
    out.push({ id: 'calendar', message: `week ${state.week} outside 1..52` });
  }
  if (state.day !== undefined && (state.day < 0 || state.day > 7)) {
    out.push({ id: 'calendar', message: `day ${state.day} outside 0..7` });
  }

  return out;
}
