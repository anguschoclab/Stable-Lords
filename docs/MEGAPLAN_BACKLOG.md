<!-- markdownlint-disable MD001 MD024 MD025 MD033 MD060 -->

# MEGAPLAN BACKLOG — Harmonized Register of Open Work

The living register for everything the megaplan lineage deliberately left
undone. It replaces per-version `*_DEFERRED.md` files as the place to look
first: at each megaplan close-out, open deferred items and watch items fold
into this document; the per-version docs are immutable audit records and
archive to `docs/archive/megaplans/` when a newer megaplan lands. Only the
latest version's `MEGAPLAN_V<N>_{PLAN,FINDINGS,LEDGER,DEFERRED}.md` set stays
at repo root.

**Current latest:** MEGAPLAN V27 (tournament classes / FE / freeze dates).
**Compiled:** 2026-11-10 — every row re-verified against the code the day it
was carried forward (see §1 status notes).

---

## 1. Open deferred register

| Prov | Item | Severity | Entry points | Status (verified 2026-11-10) |
|---|---|---|---|---|
| V22-D3 | **Pagan literal damage model** — canon: damage = ST + class-variance + weapon-variance; armor soak = weight + 12 + type-bonus; ≤1 → bounce. Current model is `(class+4)×locMult×variance` + flat mitigation — same shape, different parameters. Needs a soak-rework pass + end-to-end damage/KO/kill distribution re-verification. | Own pass | `src/engine/combat/mechanics/damageCalc.ts:21-24`, `src/engine/combat/resolution/weaponArmor.ts` | **Open** — "stays deferred" reaffirmed by V23 findings |
| V22-D4 | **ADM / graduation tier** — canon: basic caps 3–21, ADM caps 3–25; WL>21 grants INI bonus; graduation is a separate advancement tier. | Feature | `ATTRIBUTE_MAX` (`types/shared.types`), `src/engine/warrior/potential.ts`, training passes | **Open** — caps are 3–25 throughout, no tier exists |
| V24-D5 | **Out-of-scope game modes** — Bloodgames tournaments, Primus/ADM-tier play, PP (programmer prize) systems. | Scope boundary | No engine surface exists to pin them to | **Standing deferral** — revisit only if those modes ever land |
| V15 | **`cloneObject`/`copyDataProperties` ~2–3% residual churn** — remaining cost is pass-boundary object spreads, not the boundary clone; a fix needs impact-application restructuring out of proportion to the residual. | Perf, low | impact-application layer | **Deferred-again** (re-evaluated V15, evidence updated) |
| V15 | **Engine-pool persistent shard state** — `poolSize=1` stands; parallel-bench 0.33× documented. | Perf, doc-only | engine worker pool | **Deferred** (documented-only per scope) |
| V16-A11 | **Weather bid-priority one week stale** — `generateBoutBids` consumes `state.weather` (current week) at offer-emission time; bouts resolve a week later under next week's weather. Acceptance already evaluates the correct bout-week weather — only the bid *priority* modifier lags. | Low | `src/engine/pipeline/passes/RivalStrategyPass/offers.ts:46` | **Open** — pre-existing, confirmed mechanism |
| V21-B3 | **WEATHER_STATS stamina-token semantics** — 'Chaos Storm' displays "STAMINA DRAIN 125%" but `staminaMult: 0.8` (drains *slower*); sibling 'Cursed Eclipse' uses the direct-mult convention (125% ↔ 1.25). Decide whether display tokens are drain-fraction or mult, then fix display or effect. | Docs decision | `src/constants/arena/weatherStats.ts:61`, `src/engine/combat/mechanics/weatherEffects/table.ts:418` | **Open** — contradiction still live |
| V21-B6 | **KD zero kill-rate differential** — `balance.slow` KD spec ("high killDesire (10) should produce more kills than low killDesire (1)") produced zero differential post canon-death-model; registered as pre-existing, not merge-caused. | Re-verify | `src/test/engine/economy/balance.slow.test.ts:308` | **Re-verify** — spec exists; current pass/fail undetermined without running the slow tier |
| V26-D1 | **Favorites UI missing `discovered.tactic` row** — `WarriorFavorites.discovered.tactic` + `tacticHints` ship in schema and the AI consumes them; no favorites-section row surfaces the discovered tactic to the player. | Low | `src/components/warrior/favorites/` (WeaponAffinity / BioRhythm / LearnAffinity sections) | **Open** — zero `tactic` refs in the section (verified) |
| V26-D2 | **`processTierProgression` is dead code** — `SystemPass.ts:53` calls it with `state.season` as `newSeason`; `tierProgression.ts:64` early-returns on equality, so Minor→Established→Major promotion/demotion never fires. Hazard: its `resolveRng(rng, hashStr(createdAt) + week)` fallback (L66–67) would seed from wall-clock `meta.createdAt` if it ever fired without rng — the only wall-clock reader in the pipeline. Either wire `computeNextSeason(nextWeek)` as `newSeason` or remove call + function. | Medium | `src/engine/pipeline/passes/SystemPass.ts:53`, `src/engine/pipeline/core/tierProgression.ts:58-110` | **Open** — verified still dead-called |
| V26-D3 | **`meta.createdAt` is wall-clock inside seeded state** — `createFreshState` stamps `new Date().toISOString()`; the only non-reproducible field in a seeded world (state digests differ run-to-run on `meta` alone). Inert today only because D2's reader never fires; if a future feature seeds an rng from it, seed parity breaks silently. Candidate: stamp `weekToTimestamp(0)` or derive from world seed. | Low | `src/engine/factories/gameStateFactory.ts:109` | **Open** — verified |
| V26-D4 | **Gazette `t()` crypto fallback** — without an rng it picks via `new SeededRNG(cryptoRandomInt(...))`; cosmetic gazette text is non-reproducible run-to-run (does NOT affect world trajectory — text isn't fed back into mechanics). | Low | `src/engine/gazette/gazetteTemplateHelpers.ts:61-66` | **Open** — thread the pass rng at deterministic callers |
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
  re-baseline tools, excluded from `tsconfig.e2e.json`.
- **Fold convention** — every megaplan close-out writes/updates this
  register; `*_DEFERRED.md` files describe what shipped vs punted *within*
  their version; this file is the only cross-version backlog.
- **`testQualityAudit` compliance** — new `src/test/megaplan/` guards must
  register a `GUARD_REGISTRY` disposition; new specs regenerate
  `runnerGroups.json` via `bun scripts/test-audit-scan.mjs`.

## 5. Resolved index

Families whose deferred work all landed — details in the archived docs.

| Prov | Items | Disposition |
|---|---|---|
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
|---|---|---|---|
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
| MEGAPLAN_V27 | Tournament classes / FE / freeze dates | DEFERRED, FINDINGS, LEDGER, PLAN — **at root (latest)** | untagged |
| CONSOLIDATION_V5–V7 | PR consolidation waves | FINDINGS×3, LEDGER×2 | `pre-consolidation-*`, `pre-v7-consolidation` |
| TEST_SUITE_AUDIT | Test-suite audit & reorganization (Waves 1–2) | PLAN, LEDGER + TEST_AUDIT_FINDINGS | `pre-test-audit-v2` |
