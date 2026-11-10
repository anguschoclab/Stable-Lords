<!-- markdownlint-disable MD001 MD024 MD025 MD033 MD060 -->
# MEGAPLAN V26 DEFERRED — Intentionally Punted Work

Items discovered during the parity implementation that are real but out of
scope for V26. Each has a severity and a suggested owner phase.

## D1 — Favorites UI has no `discovered.tactic` row (LOW)

`WarriorFavorites.discovered.tactic` + `tacticHints` ship in the schema and
the AI consumes them, but `src/components/warrior/favorites/` (WeaponAffinity /
BioRhythm / LearnAffinity sections) has no row surfacing the discovered
favorite tactic to the player. The field is live state; the display is a
follow-up UI task. The e2e smoke tier passes without it.

## D2 — `processTierProgression` is dead code (MEDIUM)

`SystemPass.ts:53` calls `processTierProgression(state, state.season, nextWeek)`
— `newSeason === state.season` is always true, so the function early-returns
`{}` every week. Tier promotion/demotion (Minor→Established→Major rules) never
fires. Also: its `resolveRng(rng, hashStr(createdAt) + week)` fallback would seed
from wall-clock `meta.createdAt` if it ever *did* fire without an rng — the only
wall-clock reader in the pipeline. Either wire `computeNextSeason(nextWeek)` as
`newSeason` or remove the call + function.

## D3 — `meta.createdAt` is wall-clock and lives in seeded state (LOW hazard)

`createFreshState` stamps `meta.createdAt = new Date().toISOString()` — the
only non-reproducible field in a seeded world (state digests differ run-to-run
on `meta` alone). Inert today only because D2's reader never fires. If a future
feature seeds an rng from `meta.createdAt`, seed parity breaks silently.
Candidate fix: stamp `weekToTimestamp(0)` or derive from world seed.

## D4 — `gazetteTemplateHelpers.t()` crypto fallback (LOW)

`t(template[], data)` without an rng picks via
`new SeededRNG(cryptoRandomInt(...))` — cosmetic gazette text is
non-reproducible run-to-run (observed in cross-engine digests; it does NOT
affect world trajectory since text isn't fed back into mechanics). Callers
that want determinism should thread the pass rng.

## D5 — Retained probe scripts (intentional)

- `scripts/livingworld-seed-probe.ts <seed>` — 200-week world probe printing
  the livingWorld assertions (style rates, rival floor/fill, kill rate,
  variance). Replicates the vitest setup env (test avatar catalog, combat
  narrative, id mock, event bus clear).
- `scripts/probe-liveness-seed.ts <seed>` — 104-week probe printing the
  worldLiveness competence-gradient/coherence assertions.

Both are dev-time re-baseline tools, excluded from `tsconfig.e2e.json` like
`world-diag.ts`/`balance-lab.ts`.

## D6 — Cross-engine determinism note (informational)

The `planWorldBouts` sort was re-ratcheted to a transitive comparator
(`Math.floor(fame/100)` bucket → `lastBoutWeek` → `fame`) because V8 and JSC
emit different orderings on non-total-order comparators. Any future sort in
the sim that mixes keys inside one comparator inherits the same hazard — add
new comparators as lexicographic key chains only.
