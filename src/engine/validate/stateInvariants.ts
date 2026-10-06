/**
 * State-invariant validation — structural assertions that must hold after any
 * week/quarter/year advance, regardless of execution path (sequential or
 * shard-parallel). Run in dev via `finalizeState` (import.meta.env.DEV),
 * periodically in soak.mjs, and in CI slow tests; each check is O(state)
 * and off the hot path.
 *
 * Violations are reported, never thrown mid-run — callers decide whether to
 * abort (CI) or log (soak).
 */
import type { GameState, TitleStatus, ArenaReignEndReason } from '@/types/state.types';
import type { Warrior } from '@/types/warrior.types';
import { findWarriorById } from '@/engine/core/warriorLookup';

/** A single violated invariant. */
interface InvariantViolation {
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

/** Roster id uniqueness across every stable + per-warrior NaN checks. */
function checkRosterIntegrity(state: GameState, out: InvariantViolation[]): void {
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
}

/**
 * Graveyard coherence: a dead warrior must never remain on any roster. The
 * weekly-bout pipeline once left rival victims Active on their stable's
 * roster — they kept fighting, were "killed" repeatedly, and could even be
 * crowned posthumously before the vacancy sweep noticed.
 */
function checkGraveyardCoherence(state: GameState, out: InvariantViolation[]): void {
  const deadIds = new Set((state.graveyard ?? []).map((w) => w.id));
  if (deadIds.size === 0) return;
  for (const w of state.roster ?? []) {
    if (deadIds.has(w.id)) {
      out.push({
        id: 'graveyard-roster-disjoint',
        message: `dead warrior ${w.id} still on player roster`,
      });
    }
  }
  for (const r of state.rivals ?? []) {
    for (const w of r.roster ?? []) {
      if (deadIds.has(w.id)) {
        out.push({
          id: 'graveyard-roster-disjoint',
          message: `dead warrior ${w.id} still on rival ${r.id} roster`,
        });
      }
    }
  }
}

/**
 * Dead-registry coverage: `deadWarriorIds` is the never-truncated liveness
 * authority. Any registered-dead (or graveyard-listed) id found inside an
 * active store — rosters, recruit pools, founder queue — is a resurrection:
 * it will be bookable, draftable, and re-killable. Participants stamped
 * 'Dead' are the legal exception — a self-describing historical record.
 */
function checkDeadIdCoverage(state: GameState, out: InvariantViolation[]): void {
  const deadIds = new Set<string>([
    ...(state.deadWarriorIds ?? []),
    ...(state.graveyard ?? []).map((w) => w.id as string),
  ]);
  if (deadIds.size === 0) return;

  for (const w of state.roster ?? []) {
    if (deadIds.has(w.id)) {
      out.push({
        id: 'dead-id-in-active-store',
        message: `dead warrior ${w.id} on player roster`,
      });
    }
  }
  for (const r of state.rivals ?? []) {
    for (const w of r.roster ?? []) {
      if (deadIds.has(w.id)) {
        out.push({
          id: 'dead-id-in-active-store',
          message: `dead warrior ${w.id} on rival ${r.id} roster`,
        });
      }
    }
  }
  for (const w of state.freeAgents ?? []) {
    if (deadIds.has(w.id)) {
      out.push({ id: 'dead-id-in-active-store', message: `dead warrior ${w.id} in freeAgents` });
    }
  }
  for (const w of state.recruitPool ?? []) {
    if (deadIds.has(w.id)) {
      out.push({ id: 'dead-id-in-active-store', message: `dead warrior ${w.id} in recruitPool` });
    }
  }
  for (const w of state.retired ?? []) {
    if (deadIds.has(w.id)) {
      out.push({ id: 'dead-id-in-active-store', message: `dead warrior ${w.id} in retired pool` });
    }
  }
  for (const w of state.legacyFounderQueue ?? []) {
    if (deadIds.has(w.id)) {
      out.push({
        id: 'dead-id-in-active-store',
        message: `dead warrior ${w.id} in legacyFounderQueue`,
      });
    }
  }
  // Participant snapshots are legitimate historical records once stamped
  // 'Dead' — only an unstamped (still-'Active') dead id is corruption.
  for (const t of state.tournaments ?? []) {
    for (const p of t.participants ?? []) {
      if (deadIds.has(p.id) && p.status !== 'Dead' && !p.isDead) {
        out.push({
          id: 'dead-id-in-active-store',
          message: `dead warrior ${p.id} live in tournament ${t.id} participants`,
        });
      }
    }
  }
}

/** The graveyard is a set of unique deaths — never a log. */
function checkGraveyardUniqueness(state: GameState, out: InvariantViolation[]): void {
  const seen = new Set<string>();
  for (const w of state.graveyard ?? []) {
    if (seen.has(w.id)) {
      out.push({
        id: 'graveyard-unique-ids',
        message: `duplicate graveyard entry for warrior ${w.id}`,
      });
    }
    seen.add(w.id);
  }
}

/** Dead is terminal — a warrior can't be both in the graveyard and retired. */
function checkDeadRetiredDisjoint(state: GameState, out: InvariantViolation[]): void {
  const deadIds = new Set<string>([
    ...(state.deadWarriorIds ?? []),
    ...(state.graveyard ?? []).map((w) => w.id as string),
  ]);
  if (deadIds.size === 0) return;
  for (const w of state.retired ?? []) {
    if (deadIds.has(w.id)) {
      out.push({
        id: 'dead-retired-overlap',
        message: `warrior ${w.id} is both dead and retired`,
      });
    }
  }
}

/**
 * Signed offers must reference living, present warriors — an offer that can
 * never resolve is bookkeeping drift (never pays out, never penalizes).
 */
function checkStaleSignedOffers(state: GameState, out: InvariantViolation[]): void {
  const offers = state.boutOffers ? Object.values(state.boutOffers) : [];
  if (offers.length === 0) return;

  const deadIds = new Set<string>([
    ...(state.deadWarriorIds ?? []),
    ...(state.graveyard ?? []).map((w) => w.id as string),
  ]);
  const retiredIds = new Set<string>((state.retired ?? []).map((w) => w.id as string));
  const liveIds = new Set<string>();
  for (const w of state.roster ?? []) liveIds.add(w.id);
  for (const r of state.rivals ?? []) for (const w of r.roster ?? []) liveIds.add(w.id);
  for (const w of state.freeAgents ?? []) liveIds.add(w.id);
  for (const w of state.recruitPool ?? []) liveIds.add(w.id);
  // Tournament-only warriors (emergency freelancers) live in participants.
  for (const t of state.tournaments ?? [])
    for (const p of t.participants ?? []) if (!deadIds.has(p.id)) liveIds.add(p.id);

  for (const offer of offers) {
    if (offer.status !== 'Signed') continue;
    for (const wId of offer.warriorIds ?? []) {
      if (!wId) continue;
      if (deadIds.has(wId)) {
        out.push({
          id: 'stale-signed-offer',
          message: `signed offer ${offer.id} references dead warrior ${wId}`,
        });
      } else if (retiredIds.has(wId)) {
        out.push({
          id: 'stale-signed-offer',
          message: `signed offer ${offer.id} references retired warrior ${wId}`,
        });
      } else if (!liveIds.has(wId)) {
        out.push({
          id: 'stale-signed-offer',
          message: `signed offer ${offer.id} references missing warrior ${wId}`,
        });
      }
    }
  }
}

/** Treasury / ledger sanity. */
function checkFinances(state: GameState, out: InvariantViolation[]): void {
  if (typeof state.treasury === 'number' && Number.isNaN(state.treasury)) {
    out.push({ id: 'no-nan', message: 'treasury is NaN' });
  }
  for (const entry of state.ledger ?? []) {
    if (typeof entry.amount === 'number' && Number.isNaN(entry.amount)) {
      out.push({ id: 'no-nan', message: `ledger entry ${entry.id} has NaN amount` });
    }
  }
}

/**
 * Map ↔ collection coherence (week caches): warriorToOfferIds must only
 * reference offers that exist and that list the warrior; warriorMap must be
 * a faithful index of all rosters when present.
 */
function checkCacheCoherence(state: GameState, out: InvariantViolation[]): void {
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
}

/**
 * Validates structural invariants on a GameState. Returns all violations
 * found (empty array = clean). Pure — never mutates state.
 */
export function validateStateInvariants(state: GameState): InvariantViolation[] {
  const out: InvariantViolation[] = [];

  checkRosterIntegrity(state, out);
  checkGraveyardCoherence(state, out);
  checkDeadIdCoverage(state, out);
  checkGraveyardUniqueness(state, out);
  checkDeadRetiredDisjoint(state, out);
  checkStaleSignedOffers(state, out);
  checkFinances(state, out);
  checkCacheCoherence(state, out);

  // ── Calendar sanity ──────────────────────────────────────────────────
  if (state.week !== undefined && (state.week < 1 || state.week > 52)) {
    out.push({ id: 'calendar', message: `week ${state.week} outside 1..52` });
  }
  if (state.day !== undefined && (state.day < 0 || state.day > 7)) {
    out.push({ id: 'calendar', message: `day ${state.day} outside 0..7` });
  }

  out.push(...validateArenaChampions(state));

  return out;
}

const TITLE_STATUSES: ReadonlySet<TitleStatus> = new Set([
  'active',
  'pendingReengagement',
  'dormant',
]);
const END_REASONS: ReadonlySet<ArenaReignEndReason> = new Set([
  'defeated',
  'died',
  'retired',
  'stripped',
  'relinquished',
  'displaced',
]);

/** Numeric title-record fields sanity-checked per reign — module-level so the
 *  per-title loop doesn't rebuild a literal + entries array each iteration. */
const TITLE_NUMERIC_FIELDS = ['refusals', 'deferrals', 'noContenderStreak'] as const;

/**
 * Arena-championship invariants. The heavy hitter is the single-crown rule —
 * one warrior may reign over at most one arena — plus vacancy hygiene: after
 * any week advance, a reigning champion must be living and unretired (the
 * vacancy sweep owns the died/retired transitions). Title-record fields are
 * sanity-checked so corrupt records surface instead of silently skewing
 * contender ladders.
 */
export function validateArenaChampions(state: GameState): InvariantViolation[] {
  const out: InvariantViolation[] = [];
  const push = (message: string) => out.push({ id: 'arena-champions', message });

  const deadIds = new Set([
    ...(state.deadWarriorIds ?? []),
    ...(state.graveyard ?? []).map((w) => w.id),
  ]);
  const retiredIds = new Set((state.retired ?? []).map((w) => w.id));
  const crownsByWarrior = new Map<string, string[]>();

  for (const [arenaId, title] of Object.entries(state.arenaChampions ?? {})) {
    if (!TITLE_STATUSES.has(title.status)) {
      push(`${arenaId}: invalid title status '${title.status}'`);
    }
    for (const field of TITLE_NUMERIC_FIELDS) {
      const value = title[field];
      if (!Number.isFinite(value) || value < 0) {
        push(`${arenaId}: ${field} is ${value}`);
      }
    }
    for (const [warriorId, until] of Object.entries(title.declinedContenders ?? {})) {
      if (!Number.isFinite(until) || until < 0) {
        push(`${arenaId}: declinedContenders[${warriorId}] = ${until}`);
      }
    }
    for (const h of title.history ?? []) {
      if (!END_REASONS.has(h.endReason)) {
        push(`${arenaId}: history entry for ${h.warriorId} has invalid endReason '${h.endReason}'`);
      }
      if (h.endedAbsoluteWeek < h.startedAbsoluteWeek) {
        push(
          `${arenaId}: reign ${h.warriorId} ends (${h.endedAbsoluteWeek}) before it starts (${h.startedAbsoluteWeek})`
        );
      }
    }

    const reign = title.champion;
    if (!reign) continue;
    const arenas = crownsByWarrior.get(reign.warriorId) ?? [];
    arenas.push(arenaId);
    crownsByWarrior.set(reign.warriorId, arenas);

    if (!Number.isFinite(reign.defenses) || reign.defenses < 0) {
      push(`${arenaId}: champion ${reign.warriorId} defenses = ${reign.defenses}`);
    }
    if (!Number.isFinite(reign.startedAbsoluteWeek)) {
      push(`${arenaId}: champion ${reign.warriorId} has non-finite startedAbsoluteWeek`);
    }
    if (deadIds.has(reign.warriorId)) {
      push(`${arenaId}: champion ${reign.warriorId} is in the graveyard but still reigning`);
    } else if (retiredIds.has(reign.warriorId)) {
      push(`${arenaId}: champion ${reign.warriorId} is retired but still reigning`);
    } else if (!findWarriorById(state, reign.warriorId)) {
      push(`${arenaId}: champion ${reign.warriorId} not found in any roster`);
    }
  }

  for (const [warriorId, arenas] of crownsByWarrior) {
    if (arenas.length > 1) {
      push(
        `${warriorId} reigns over ${arenas.length} arenas (${arenas.join(', ')}) — single crown violated`
      );
    }
  }

  for (const g of state.grandChampions ?? []) {
    if (!g.warriorId || !g.tournamentId || !Number.isFinite(g.year)) {
      push(`grandChampions entry missing warrior/tournament/year: ${JSON.stringify(g)}`);
    }
  }

  return out;
}
