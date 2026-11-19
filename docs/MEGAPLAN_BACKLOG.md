<!-- markdownlint-disable MD001 MD024 MD025 MD033 MD060 -->

# MEGAPLAN BACKLOG — Harmonized Register of Open Work

The living register for everything the megaplan lineage deliberately left
undone. It replaces per-version `*_DEFERRED.md` files as the place to look
first: at each megaplan close-out, open deferred items and watch items fold
into this document; the per-version docs are immutable audit records and
archive to `docs/archive/megaplans/` when a newer megaplan lands. Only the
latest version's `MEGAPLAN_V<N>_{PLAN,FINDINGS,LEDGER,DEFERRED}.md` set stays
at docs/ root.

**Current latest:** MEGAPLAN V29 (exhaustive review & full branch consolidation).
**Compiled:** 2026-11-10 — every row re-verified against the code the day it
was carried forward (see §1 status notes).

---

## 1. Open deferred register

| Prov | Item | Severity | Entry points | Status (verified 2026-11-10) |
| --- | --- | --- | --- | --- |
| V22-D3 | **Pagan literal damage model** — canon: damage = ST + class-variance + weapon-variance; armor soak = weight + 12 + type-bonus; ≤1 → bounce. Current model is `(class+4)×locMult×variance` + flat mitigation — same shape, different parameters. Needs a soak-rework pass + end-to-end damage/KO/kill distribution re-verification. | Own pass | `src/engine/combat/mechanics/damageCalc.ts:16-24`, `src/engine/combat/mechanics/weaponArmor.ts` (V29 corrected path — `resolution/` was stale) | **Open** — V29 NO-GO reaffirmed: rewriting the damage scale invalidates every combat baseline (kill rates, bout length, mortality); requires its own campaign with a dedicated RED battery + soak verification |
| V22-D4 | **ADM / graduation tier** — canon: basic caps 3–21, ADM caps 3–25; WL>21 grants INI bonus; graduation is a separate advancement tier. | Feature | `ATTRIBUTE_MAX` (`types/shared/attributes.ts:40` = 25), `src/engine/warrior/potential.ts`, training passes | **Open** — V29 NO-GO reaffirmed: caps are 3–25 throughout, no tier exists; design-level feature needing its own campaign |
| V24-D5 | **Out-of-scope game modes** — Bloodgames tournaments, Primus/ADM-tier play, PP (programmer prize) systems. | Scope boundary | No engine surface exists to pin them to | **Standing deferral** — revisit only if those modes ever land |
| V15 | **structuredClone residual churn** — V29 re-audit: `mutableInput` ownership flag now bypasses the clone wherever callers transfer ownership (autosim weeks 2+, pipeline contexts); the residual single clone is the semantically-required week-1 boundary copy. `cloneObject`/`copyDataProperties` no longer exist. | Perf | `weekPipeline/context.ts:53-64`, `autosim.ts:204` | **RESOLVED (V29)** — remaining clone is by-design |
| V15 | **Engine-pool persistent shard state** — `poolSize=1` stands; parallel-bench 0.33× documented. | Perf, doc-only | engine worker pool | **Deferred** (documented-only per scope) |
| V16-A11 | **Weather bid-priority one week stale** — `generateBoutBids` consumed `state.weather` at offer-emission time; bouts resolve a week later. | Low | `offers.ts` — now derives bout-week weather on an independent seeded stream (`rollWeather(SeededRNG(w*13), computeNextSeason(w))`) | **RESOLVED (V29)** — `rivalBidsWeather.test.ts` pins it |
| V21-B3 | **WEATHER_STATS stamina-token semantics** — convention confirmed: `DRAIN N%` ↔ `staminaMult = N/100` (endurance-cost rate). Three violators found (V29-B6 guard): Chaos Storm 0.8→1.25, Chaos Squall 0.85→1.15 (effect-side); Abyssal Tempest display 60%→160% (display-side — "heavily drains" + 1.6 effect were already consistent). | Docs decision | `weatherStats.ts:6`, `weatherEffects/table.ts` | **RESOLVED (V29)** — `v29WeatherStamina.guard.test.ts` enforces coherence for all 65 weathers |
| V21-B6 | **KD zero kill-rate differential** — V29 re-ran the slow tier: both kill specs PASS on current engine (`:308` KD differential + `:402` recruit kill-rate band). The suspected zero differential does not reproduce. | Re-verify | `balance.slow.test.ts:308` | **RESOLVED (V29)** — green as of V29 re-run |
| V26-D1 | **Favorites UI missing `discovered.tactic` row** — FavoritesCharting now surfaces it: "Tactics Revealed" count cell + "Favorite Tactics" distribution rows. | Low | `FavoritesCharting.tsx` | **RESOLVED (V29)** — `tacticRow.test.tsx` pins it |
| V26-D2 | **`processTierProgression` dead call** — `SystemPass` passed `state.season` (always equal → early return); now passes `computeNextSeason(nextWeek)` and threads the pass rng through `processSystemicProgression`. Promotion/demotion verified at season boundary. | Medium | `SystemPass.ts:36-58`, `tierProgression.ts` | **RESOLVED (V29)** — V29-D2 describe pins promote/demote/no-op |
| V26-D3 | **`meta.createdAt` wall-clock** — `createFreshState` now defaults `createdAt` to `weekToTimestamp(0)`; fresh states are bit-identical across calls. | Low | `gameStateFactory.ts:109` | **RESOLVED (V29)** — V29-D3 specs pin it |
| V26-D4 | **Gazette `t()` crypto fallback** — removed; array+no-rng picks the first template deterministically. Fallback was unreachable from all production callers. | Low | `gazetteTemplateHelpers.ts` | **RESOLVED (V29)** — V29-D4 spec pins determinism |
| V27-§5 | **Intentional design deferrals:** knack (`luckfactor`/`bloodlust` exist but stay hidden — no scout-rumor surface); Duel2's separate Novices class (0-FE post-freeze debut folds into Rookies under our fold); freeze deeper than T−2 (2-week window chosen); FTF-style real-time social systems (already emergent via dossiers/decoys). | Intentional | scout/intel surfaces; `TOURNAMENT_CLASSES` (`tournamentSelection/classes.ts:26`) | **Design deferrals** — revisit only on explicit canon push |

## 2. Watch items

Logged trends — re-measure at each world re-baseline, not per commit.

- **TP world dominance: 62→64.2%.** Slow structural climb across V22→V26
  re-baselines (62.9% V22 → 61.7–62.8% V24 → 63.5–64.2% V26). Adjudicated
  canon-accurate (scum/TP is the documented dominant metagame answer; the
  certified FLAT lab band holds at ~51.8). The registered lever, if it ever
  crosses band: damp TP drill accrual/development — NOT combat numbers.
- **World kill rate 4.78–4.85%** post-V26 (was 6.8–6.9% V24) vs the ~8%
  design floor — mint DA floors + capped potential → fewer glass-cannon
  deaths. Watch whether the floor responds on the next world run.
- **LU floor / PR band edge** (V22 §3): LU 42.7% bottom-of-band, PR 55.8%
  approaching the edge — re-check on the next world-diag; both have
  ratchet candidates documented in the V22 deferred archive.
- **Slow-suite flakes under load** (V22 §4): `killDeathDivergence`, perf
  160-stable ceiling, autosim timing, worldLiveness gradient each pass
  standalone — re-run clean before assuming a regression.
- **Hook-timeout flake class — root-caused (V29)**:`vitest.config.ts`
  `hookTimeout: 10000` vs `testTimeout: 120000`; `setup.node.ts` reset hooks
  lazy-import `useGameStore`'s heavy graph and exceed 10s on starved
  workers. Aligned to 30000 (slow-config precedent). Covers
  `opfsArchiverFlush` (V29 baseline) and `tacticDiscovery.parity` (V28).
- **First scheduled `daily_sim`/`daily_bard` run post-V28** (V28): confirm
  `git add docs/reports/*` lands regenerated reports and no root-level
  `Daily_*` files resurrect. Emitter paths + workflow `git add` repointed;
  can't be verified until the next nightly run.
- **`tacticDiscovery.parity.test.ts` suite-load flake** (V28): passed
  standalone; signature matches the hook-timeout class above — root cause
  now fixed via `hookTimeout: 30000`.

## 3. House divergences (adjudicated keeps)

Deliberate divergences from Duel2/Noblish canon — documented so future
findings don't re-litigate them.

- **Rolled-base+14 creation** — flat 70-pt allocation + editable SZ stays
  (documented house rule, not the canon rolled-84 model).
- **`ENC_TABLE` over the article formula** — the Terrablood class chart
  (`src/data/terrabloodCharts.ts:174`) stays the class-letter source; the
  `ST+min(ST,CN)−6` formula disagrees on cells (25/25 → 36 vs 44), no
  consistent merger exists.
- **Numeric skills shown** — canon hides them; the dossier shows numbers.
- **Rhythm always-on** — favorite-rhythm bonus applies whether or not the
  manager discovered it (landed V25; supersedes V22's `discovered`-gate
  keep).
- **Learn caps canon literals** — `LEARN_PER_SKILL_CAP = 20`,
  `LEARN_CAREER_CAP = 120` (`constants/combat/combat/learn.ts`).
- **Intentional AI/player asymmetries** (V26 §B): `AI_TRAINING_EFFECTIVENESS
  = 0.8` attempt-rate handicap; `competenceJitter`; personality gating —
  design, not gap. Player-only surfaces (PlanBuilder, Design Review,
  TurnaroundCard, Almanac, insight tokens) vs AI-only surfaces (planIntel
  dossiers, strategy-lab memory, masked decoys) — different interfaces
  over the same intent.

## 4. Engineering rules carried forward

- **Lexicographic comparator chains only in sim sorts** — V8 and JSC emit
  different orderings on non-total-order comparators (V26 cross-engine
  divergence; fixed at `worldMatchmaking.ts:167-176`: fame/100 bucket →
  lastBoutWeek → fame). Any new sim sort must be a key chain, never a
  mixed-key gate.
- **Re-baseline discipline** — seeded-test re-baselines use multi-seed
  probes and honest denominators; a seed is never kept just to keep a
  metric in-band (V24–V27 precedent).
- **Retained probe scripts** — `scripts/livingworld-seed-probe.ts <seed>`
  (200-week livingWorld assertions) and `scripts/probe-liveness-seed.ts
  <seed>` (104-week competence-gradient/coherence) are dev-time
  re-baseline tools, excluded from `tsconfig.e2e.json`. **V29 caveat**:
  `probe-liveness-seed.ts` does NOT replicate the
  `worldLiveness.integration` spec's module environment (the spec's
  `vi.mock(opfsArchive)` shared stub diverges the seeded trajectory), so
  its per-seed metrics are unreliable predictors of in-spec results —
  re-baseline sweeps for that spec must run in-spec (temp probe specs
  mirroring its env), then the winner is verified in-spec as before.
  V29's re-baseline to seed 42 was done this way.
- **Fold convention** — every megaplan close-out writes/updates this
  register; `*_DEFERRED.md` files describe what shipped vs punted *within*
  their version; this file is the only cross-version backlog.
- **`testQualityAudit` compliance** — new `src/test/megaplan/` guards must
  register a `GUARD_REGISTRY` disposition; new specs regenerate
  `runnerGroups.json` via `bun scripts/test-audit-scan.mjs`.

## 5. Resolved index

Families whose deferred work all landed — details in the archived docs.

| Prov | Items | Disposition |
| --- | --- | --- |
| V9 | traitDedup `effectHash` key-order follow-up | Landed — keys sorted, pinned by spec |
| V22 | D1 dual-wield/off-hand, D2 trains-burn-skills | Landed V23 (`46e26119`, `c967fbb9`) |
| V24 | D1 luck pools, D2 dagger advisory, D3 learn-cap literals, D4 rhythm gate | Landed post-close-out (D4 → V25's always-on) |
| V25 | All deferred + watch items | Resolved — see archived V25_DEFERRED |
| V26 | None (D1–D4 carried above, D5–D6 → §4) | — |
| V27 | All deferred items | Landed — V27_DEFERRED fully struck |
| Consolidation V5–V7 | All deferred | Resolved — registers empty/resolved |
| Test-suite audit | All waves | Complete — 0 TEST_DEBT pairs at Wave-2 close |

## 6. Archive index

Per-version docs live at `docs/archive/megaplans/` (git history preserved
via rename). Themes are one-liners; the docs themselves are the audit
trail.

| Version | Theme | Docs | Restore tag |
| --- | --- | --- | --- |
| unversioned (~V8) | Full-repo exhaustive review & verdict tables | FINDINGS, LEDGER | `pre-megaplan-v8` |
| MEGAPLAN_V9 | 12 open PRs + closed-PR salvage + V5–V8 re-adjudication | FINDINGS, LEDGER | `pre-megaplan-v9` |
| MEGAPLAN_V10 | 6 open PRs + orphan branches + latent findings | FINDINGS, LEDGER | `pre-megaplan-v10` |
| MEGAPLAN_V11 | Whole-repo re-read, refactor & integration deep-dive | FINDINGS, LEDGER | `pre-megaplan-v11` |
| MEGAPLAN_V12 | SRP/DRY exhaustive audit | FINDINGS, LEDGER | `pre-megaplan-v12` |
| MEGAPLAN_V14 | Pipeline & time-advancement campaign | LEDGER only | `pre-megaplan-v14` |
| MEGAPLAN_V15 | Re-audit + 23-PR adjudication | FINDINGS, LEDGER, PLAN | `pre-megaplan-v15` |
| MEGAPLAN_V16 | Validated audit (3 source-read rounds) | FINDINGS, LEDGER, PLAN | `pre-megaplan-v16` |
| MEGAPLAN_V17 | 10 open PRs + PR-touched domains | FINDINGS, LEDGER | `pre-megaplan-v17` |
| MEGAPLAN_V18 | Seeded audit baseline | FINDINGS, LEDGER, PLAN | `pre-megaplan-v18` |
| MEGAPLAN_V19 | Full re-baseline | FINDINGS, LEDGER, PLAN | `pre-megaplan-v19` |
| MEGAPLAN_V20 | Exhaustive review & branch consolidation | FINDINGS, LEDGER, PLAN | `pre-megaplan-v20` |
| MEGAPLAN_V21 | Exhaustive review & consolidation | FINDINGS, LEDGER, PLAN | `pre-megaplan-v21` |
| MEGAPLAN_V22 | Noblish Island canon (15 articles) | DEFERRED, FINDINGS, LEDGER, PLAN | `pre-megaplan-v22` |
| MEGAPLAN_V23 | Arena 93 game concepts + V22 pull-ins (no DEFERRED register — lived in V22's) | FINDINGS, LEDGER, PLAN | `pre-megaplan-v23` |
| MEGAPLAN_V24 | Noblish Island strategy canon | DEFERRED, FINDINGS, LEDGER, PLAN | `pre-megaplan-v24` |
| MEGAPLAN_V25 | Winning Warrior Types canon | DEFERRED, FINDINGS, LEDGER, PLAN | `pre-megaplan-v25` |
| MEGAPLAN_V26 | NPC/player parity audit | DEFERRED, FINDINGS, LEDGER, PLAN | untagged |
| MEGAPLAN_V27 | Tournament classes / FE / freeze dates | DEFERRED, FINDINGS, LEDGER, PLAN | untagged |
| MEGAPLAN_V28 | Docs taxonomy, bible-corpus boundary & convention ratchet | DEFERRED, FINDINGS, LEDGER, PLAN | untagged |
| CONSOLIDATION_V5–V7 | PR consolidation waves | FINDINGS×3, LEDGER×2 | `pre-consolidation-*`, `pre-v7-consolidation` |
| TEST_SUITE_AUDIT | Test-suite audit & reorganization (Waves 1–2) | PLAN, LEDGER + TEST_AUDIT_FINDINGS | `pre-test-audit-v2` |
