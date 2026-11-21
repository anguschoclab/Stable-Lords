<!-- markdownlint-disable MD001 MD024 MD025 MD033 MD060 -->

# MEGAPLAN BACKLOG — Harmonized Register of Open Work

The living register for everything the megaplan lineage deliberately left
undone. It replaces per-version `*_DEFERRED.md` files as the place to look
first: at each megaplan close-out, open deferred items and watch items fold
into this document; the per-version docs are immutable audit records and
archive to `docs/archive/megaplans/` when a newer megaplan lands. Only the
latest version's `MEGAPLAN_V<N>_{PLAN,FINDINGS,LEDGER,DEFERRED}.md` set stays
at docs/ root.

**Current latest:** MEGAPLAN V30 (harmonization & deduplication campaign).
**Compiled:** 2026-11-21 — fold-completeness pass: every `docs/archive/`
register (all DEFERRED/FINDINGS/PLAN/LEDGER sets, CONSOLIDATION V5–V7,
TEST_SUITE_AUDIT, audits/, summaries/, superpowers/) re-audited against
live code. Caught: the V24 FINDINGS deferred register was never ticketed or
folded (→ V24-F1–F4 below), V29's `fileBudget` watch fold was promised but
missed (→ §2), and V16's out-of-scope note orphaned when V17's scope never
materialized (resolved by later machinery). Superpowers session-plan
stragglers fold under `SP-*` provenance. Every row re-verified against the
code the day it was carried forward (see §1 status notes). Second pass the
same day re-verified each open row's entry points against live code
(including V30's in-flight W1.6 ownership-resolver wiring) and re-ordered
§1 into priority groups A–E + §2 by urgency.

---

## 1. Open deferred register

Ordered by priority: **A** (cheap wins / coupled to in-flight work) →
**B** (bounded canon & feature passes) → **C** (campaign-scale, own
megaplan each) → **D** (standing & design deferrals) → **E** (resolved —
kept for the audit trail). Prov tags: `V24-F*` = V24 FINDINGS' unticketed
deferred register; `SP-*` = superpowers session plans.

### A — Quick wins & live couplings

| Prov | Item | Severity | Entry points | Status |
| --- | --- | --- | --- | --- |
| SP-boundary | **`as unknown as` typed-boundary casts** — residual unsafe casts flagged out-of-scope in the 2026-06-16 combat-type-boundary plan (superpowers archive); still live. | Type debt | `src/engine/bout/reportingHandler.ts:69-70` (`stableId`), `src/engine/bout/mortalityHandler.ts:149` (`FightSummary`), `src/engine/bout/warriorRouting.ts:19` | **Open** — cheapest alongside V30: W1.6/W3/W9 are already rewiring these exact files; natural fold-in or standalone pass |
| SP-virt | **StableRankings / RivalStableList virtualization** — ~50-row lists deferred "optional" in the 2026-06-22 list-virtualization plan; still unvirtualized though `@tanstack/react-virtual` is already a dep (`VirtualizedFallenGrid`, `WarriorLeaderboard`). | Perf | `src/components/world/StableRankings.tsx`, `src/components/scouting/RivalStableList.tsx` | **Open** — low-priority polish |
| V30 | **worldLiveness competence-gradient seed re-baseline** — V30's unified ruleset re-rolled world trajectories; current seed's `med(topTreas)` inverted to −463 vs >1.3 gradient. Same class as V29's seed-88→42 inversion (`f3636f927`) — deterministic stream shift, not a mechanics defect. | Test debt | `src/test/engine/sim/worldLiveness.integration.slow.test.ts:359` | **Open** — in-spec seed sweep per the V29 process (spec-env only — `probe-liveness-seed.ts` env diverges); ~15–20 min per candidate |
| V30 | **worldBalance roster-fill re-baseline** — solvent-stable fill rate 94.4% vs ≥95% after the unified ruleset (unconditional AI training spend + injury risk). Marginal single-roster miss inside noise of the bar, not a collapse. | Test debt | `src/test/engine/economy/worldBalance.slow.test.ts:91` | **Open** — in-spec seed probe or justified threshold re-baseline (record reasoning; do NOT loosen silently) |

### B — Bounded canon & feature passes

| Prov | Item | Severity | Entry points | Status |
| --- | --- | --- | --- | --- |
| V24-F2 | **Expanded per-weapon armor matrix** — canon per-weapon armor interactions beyond the single dagger reconciliation row. | Canon | `WEAPON_ARMOR_OVERRIDES` (`src/constants/combat/combat/balance.ts:222` — `dagger`×{scale,chain} only), `src/engine/combat/mechanics/weaponArmor.ts:51` | **Open** — data-table expansion; co-schedule with V22-D3's soak rework if the same weaponArmor.ts files are in play |
| V24-F3 | **Armor-code renames** — canon letter codes (ALE/ARM/ASH/APA-F family) vs the descriptive ids in use. | Naming | `src/data/equipment/armor.ts` (`padded`…`plate_armor`) + every armor-id consumer | **Open** — codemod-scale, touches saved displays |
| V24-F4 | **TV challenge priority** — tournament-victor precedence inside challenge ordering; needs a victor state field that does not exist ("inventing one exceeds scope" per V24). Prerequisite for V24-F1's TV leg. | Design | no `victor`/`tournamentVictor` field in `src/types/` or `tournamentSelection/` | **Open** — design decision + state field |
| V24-F1 | **Ordered challenge resolution** — canon ordering across simultaneous challenges: bloodfeud → tournament-victor → first → second → random. Partial: V24 Phase 8 landed the bloodfeud fast-path + `challengeCounts`/`CHALLENGE_BONUS` scaling; the strict ordering itself was never built. | Feature | `src/engine/promoters/offerMatchmaking.ts` (`findBestOpponent`), `src/engine/matchmaking/bloodfeud.ts` | **Open** — from V24 FINDINGS' unticketed deferred register (never carried into V24_DEFERRED) |
| V15 | **Engine-pool persistent shard state** — `poolSize=1` stands (`createEnginePool(size = 1)`, `src/engine/pool/enginePool.ts:136`); parallel-bench 0.33× documented. Ordered-merge determinism must be proven if raised — would relieve the `killDeathDivergence` 900s-cap pressure. | Perf | `src/engine/pool/enginePool.ts`; `pool.size>1` paths already exist (`RivalStrategyPass`, `BoutSimulationPass`) | **Deferred** (documented-only per scope) |

### C — Campaign-scale (own megaplan each)

| Prov | Item | Severity | Entry points | Status |
| --- | --- | --- | --- | --- |
| V22-D3 | **Pagan literal damage model** — canon: damage = ST + class-variance + weapon-variance; armor soak = weight + 12 + type-bonus; ≤1 → bounce. Current model is `(class+4)×locMult×variance` + flat mitigation — same shape, different parameters. Needs a soak-rework pass + end-to-end damage/KO/kill distribution re-verification. | Own pass | `src/engine/combat/mechanics/damageCalc.ts:16-24`, `src/engine/combat/mechanics/weaponArmor.ts` (V29 corrected path — `resolution/` was stale) | **Open** — V29 NO-GO reaffirmed: rewriting the damage scale invalidates every combat baseline (kill rates, bout length, mortality); requires its own campaign with a dedicated RED battery + soak verification |
| V22-D4 | **ADM / graduation tier** — canon: basic caps 3–21, ADM caps 3–25; WL>21 grants INI bonus; graduation is a separate advancement tier. | Feature | `ATTRIBUTE_MAX` (`types/shared/attributes.ts:40` = 25), `src/engine/warrior/potential.ts`, training passes | **Open** — V29 NO-GO reaffirmed: caps are 3–25 throughout, no tier exists; design-level feature needing its own campaign |

### D — Standing & design deferrals (conditional revisit only)

| Prov | Item | Severity | Entry points | Status |
| --- | --- | --- | --- | --- |
| V24-D5 | **Out-of-scope game modes** — Bloodgames tournaments, Primus/ADM-tier play, PP (programmer prize) systems. | Scope boundary | No engine surface exists to pin them to | **Standing deferral** — revisit only if those modes ever land |
| V27-§5 | **Intentional design deferrals:** knack (`luckfactor`/`bloodlust` exist but stay hidden — no scout-rumor surface); Duel2's separate Novices class (0-FE post-freeze debut folds into Rookies under our fold); freeze deeper than T−2 (2-week window chosen); FTF-style real-time social systems (already emergent via dossiers/decoys). | Intentional | scout/intel surfaces; `TOURNAMENT_CLASSES` (`tournamentSelection/classes.ts:26`) | **Design deferrals** — revisit only on explicit canon push |
| V28 | **markdownlint CI adoption** — vestigial `markdownlint-disable` comments in this file + the master design bible, but no `.markdownlint*` config and no markdown lint step exists; `docsLayout` is the natural gate if it is ever adopted. | Tooling | `src/test/megaplan/docsLayout.guard.test.ts` | **Standing deferral** — revisit only if markdown linting is adopted |
| SP-spine | **Progression-spine multi-tier escalating arc** — deferred MVP Option 3 from the 2026-06-22 win-condition plan. | Design | No engine surface exists | **Design deferral** — revisit only on explicit product push |
| SP-bailout | **Player bailout/receivership economy** — declared non-goal in the world-sim-decouple plan; broke players climb out via promoter offers today. | Scope boundary | `src/engine/pipeline/tick/timeAdvance.ts` (`evaluateStopConditions`) | **Standing deferral** |
| SP-reveal | **prefight-advisor `revealLevel`** — style-only (no exact stats) forecast for partially-scouted opponents. | Feature | `src/engine/narrative/fightForecast.ts` (`buildFightForecast`) | **Conditional** — only if a partial-reveal tier is wanted |

### E — Resolved (verified — kept for the audit trail)

| Prov | Item | Severity | Entry points | Status |
| --- | --- | --- | --- | --- |
| V15 | **structuredClone residual churn** — V29 re-audit: `mutableInput` ownership flag now bypasses the clone wherever callers transfer ownership (autosim weeks 2+, pipeline contexts); the residual single clone is the semantically-required week-1 boundary copy. `cloneObject`/`copyDataProperties` no longer exist. | Perf | `weekPipeline/context.ts:53-64`, `autosim.ts:204` | **RESOLVED (V29)** — remaining clone is by-design |
| V16-A11 | **Weather bid-priority one week stale** — `generateBoutBids` consumed `state.weather` at offer-emission time; bouts resolve a week later. | Low | `offers.ts` — now derives bout-week weather on an independent seeded stream (`rollWeather(SeededRNG(w*13), computeNextSeason(w))`) | **RESOLVED (V29)** — `rivalBidsWeather.test.ts` pins it |
| V16-scope | **AI fuzzy-evaluation of scouted opponents** — V16 punted it to "V17" which never scoped it; the intent is covered by later machinery: `intelWorker` blends persisted dossier `observedTells` at scout-quality weight, `PerceptionSnapshot`, `possiblyMaskedPlan` decoy uncertainty, `processIntel` hash-jitter. | Feature | `src/engine/ai/workers/intelWorker.ts:273`, `src/engine/ai/memory/intelDossier.ts:219-223` | **RESOLVED (verified 2026-11-21)** — dossier/perception machinery covers the intent |
| V21-B3 | **WEATHER_STATS stamina-token semantics** — convention confirmed: `DRAIN N%` ↔ `staminaMult = N/100` (endurance-cost rate). Three violators found (V29-B6 guard): Chaos Storm 0.8→1.25, Chaos Squall 0.85→1.15 (effect-side); Abyssal Tempest display 60%→160% (display-side — "heavily drains" + 1.6 effect were already consistent). | Docs decision | `weatherStats.ts:6`, `weatherEffects/table.ts` | **RESOLVED (V29)** — `v29WeatherStamina.guard.test.ts` enforces coherence for all 65 weathers |
| V21-B6 | **KD zero kill-rate differential** — V29 re-ran the slow tier: both kill specs PASS on current engine (`:308` KD differential + `:402` recruit kill-rate band). The suspected zero differential does not reproduce. | Re-verify | `balance.slow.test.ts:308` | **RESOLVED (V29)** — green as of V29 re-run |
| V26-D1 | **Favorites UI missing `discovered.tactic` row** — FavoritesCharting now surfaces it: "Tactics Revealed" count cell + "Favorite Tactics" distribution rows. | Low | `FavoritesCharting.tsx` | **RESOLVED (V29)** — `tacticRow.test.tsx` pins it |
| V26-D2 | **`processTierProgression` dead call** — `SystemPass` passed `state.season` (always equal → early return); now passes `computeNextSeason(nextWeek)` and threads the pass rng through `processSystemicProgression`. Promotion/demotion verified at season boundary. | Medium | `SystemPass.ts:36-58`, `tierProgression.ts` | **RESOLVED (V29)** — V29-D2 describe pins promote/demote/no-op |
| V26-D3 | **`meta.createdAt` wall-clock** — `createFreshState` now defaults `createdAt` to `weekToTimestamp(0)`; fresh states are bit-identical across calls. | Low | `gameStateFactory.ts:109` | **RESOLVED (V29)** — V29-D3 specs pin it |
| V26-D4 | **Gazette `t()` crypto fallback** — removed; array+no-rng picks the first template deterministically. Fallback was unreachable from all production callers. | Low | `gazetteTemplateHelpers.ts` | **RESOLVED (V29)** — V29-D4 spec pins determinism |

## 2. Watch items

Logged trends — re-measure at each world re-baseline, not per commit.
Ordered by urgency: verified breakage → approaching ceilings → drift and
world-metric watches → resolved items (kept at the tail for the audit
trail).

- **`daily_sim`/`daily_bard` — VERIFIED FAILING** (V28 watch resolved
  negative, 2026-11-21): both workflows run green then die at `git push` —
  `GH006` protected-branch rejection (main requires 4 status checks; the
  workflow token can't bypass). No report commits since `0bd4fe52a`
  (2026-03-21) — the committed reports predate V28. No root-level `Daily_*`
  files resurrected. Latent bug seen in the same run: the bard ran MOCK (no
  `GEMINI_API_KEY`) and committed mock-generated templates — the dry-run
  path must be gated so it can never commit once push is fixed. Fix path:
  push to a bot branch + auto-PR, or a bypass-capable token.
- **Nightly `skillPathScan` red** (found in 2026-11-21 audit; nightly run
  44757730218): the slow guard fails on clean CI — `sim-diagnostics`
  SKILL.md references gitignored generated paths `scripts/out/jscpd/` +
  `scripts/out/knip-report.json` that don't exist in a fresh checkout.
  Fix = teach `scripts/skill-path-scan.mjs` to allowlist generated-output
  paths, or adjust the doc references.
- **`killDeathDivergence` 300wk vs 600s cap** (V29): the world sim outgrew
  the budget (~685s semi-solo); per-test cap raised to 900s — verified
  green solo at 628s. If per-week cost keeps climbing this re-fails.
- **`fileBudget` ratchet-creep** (V29 — fold missed at close-out, restored
  2026-11-21): #1092's CoachOverlay `useShallow` refactor pushed its spec
  file over the 80-line budget (19→20 rows). Legitimate merge-induced
  drift; watch for ratchet-creep on future UI merges — re-baseline only
  for real growth, not as a friction escape valve.
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
- **ai-behavior-audit-v2 residual watches** (folded in the 2026-11-21
  completeness pass): `displaced` share of reign endings reflects stable
  churn more than title mechanics; `counterOfferRate` counts only standing
  offers — re-measure on the next soak series.
- **Slow-suite flakes under load** (V22 §4): `killDeathDivergence`, perf
  160-stable ceiling, autosim timing, worldLiveness gradient each pass
  standalone — re-run clean before assuming a regression.
- **Hook-timeout flake class — root-caused (V29)**:`vitest.config.ts`
  `hookTimeout: 10000` vs `testTimeout: 120000`; `setup.node.ts` reset hooks
  lazy-import `useGameStore`'s heavy graph and exceed 10s on starved
  workers. Aligned to 30000 (slow-config precedent). Covers
  `opfsArchiverFlush` (V29 baseline) and `tacticDiscovery.parity` (V28).
- **`tacticDiscovery.parity.test.ts` suite-load flake** (V28): passed
  standalone; signature matches the hook-timeout class above — root cause
  now fixed via `hookTimeout: 30000`.
- **e2e console findings** (V29, pre-existing, observed in `bun run e2e`):
  **RESOLVED** — (a) `Cannot update RouterHooks while rendering
  AvatarForEntity`: `ensureAvatar` ran inside `useMemo` during render and
  called `set()` on cache misses; now the component subscribes to
  `avatarCache[entityId]` and generates via `useEffect` — also gains
  reactive refresh on `rerollAvatar`/`invalidateAvatar`. (b) Hydration
  error: `SelectableCard`'s outer element was `<button>` with
  `BookmarkButton` nested inside (`RivalWarriorList`); converted to
  `div role="button" tabIndex={0} aria-pressed` + Enter/Space handler —
  keyboard/focus/query parity preserved, nested controls legal. Full
  chromium e2e re-run: 7/7, zero console warnings; 186 component files /
  1319 tests green.

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
- **`docs/archive/` filenames stay verbatim** (V28): the ~100 archived
  lineage files keep their original (non-kebab) names as frozen audit
  records; `ARCHIVED_DOCS` in `megaplanDocLayout.guard.test.ts` pins them
  literally. Exempt from the kebab ratchet by design.

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
| MEGAPLAN_V29 | Exhaustive review & full branch consolidation | DEFERRED, FINDINGS, LEDGER, PLAN | `pre-megaplan-v29` |
| CONSOLIDATION_V5–V7 | PR consolidation waves | FINDINGS×3, LEDGER×2 | `pre-consolidation-*`, `pre-v7-consolidation` |
| TEST_SUITE_AUDIT | Test-suite audit & reorganization (Waves 1–2) | PLAN, LEDGER + TEST_AUDIT_FINDINGS | `pre-test-audit-v2` |
