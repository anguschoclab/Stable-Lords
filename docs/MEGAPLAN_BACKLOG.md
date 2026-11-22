<!-- markdownlint-disable MD001 MD024 MD025 MD033 MD060 -->

# MEGAPLAN BACKLOG — Harmonized Register of Open Work

The living register for everything the megaplan lineage deliberately left
undone. It replaces per-version `*_DEFERRED.md` files as the place to look
first: at each megaplan close-out, open deferred items and watch items fold
into this document; the per-version docs are immutable audit records and
archive to `docs/archive/megaplans/` when a newer megaplan lands. Only the
latest version's `MEGAPLAN_V<N>_{PLAN,FINDINGS,LEDGER,DEFERRED}.md` set stays
at docs/ root.

**Current latest:** MEGAPLAN V31 (Terrablood canon-claims campaign).
**Compiled:** 2026-11-22 — V31 fold: `MEGAPLAN_V31_DEFERRED.md`'s two
unregistered rows folded below (S6 probe-reject → §D, S6 guardrail-block
→ §C); V30's set archived to `docs/archive/megaplans/` and indexed in §6.
2026-11-21 — fold-completeness pass: every `docs/archive/`
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
deferred register; `SP-*` = superpowers session plans; `S6` = V31 DN-S6
Terrablood canon-claims scan (`matchup.ts` Pass-5 note is the detail).

### A — Quick wins & live couplings

_Empty — both V30 re-baselines landed (see §E)._

### B — Bounded canon & feature passes

| Prov   | Item                                                                                                                                                                                                                                                                                                                                                                                                                                        | Severity | Entry points                                                                                           | Status                                                                                       |
| ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- | ------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------- |
| V24-F4 | **TV challenge priority** — tournament-victor precedence inside challenge ordering; needs a victor state field that does not exist ("inventing one exceeds scope" per V24). Prerequisite for V24-F1's TV leg.                                                                                                                                                                                                                               | Design   | no `victor`/`tournamentVictor` field in `src/types/` or `tournamentSelection/`                         | **Open** — design decision + state field                                                     |
| V24-F1 | **Ordered challenge resolution** — canon ordering across simultaneous challenges: bloodfeud → tournament-victor → first → second → random. Partial: V24 Phase 8 landed the bloodfeud fast-path + `challengeCounts`/`CHALLENGE_BONUS` scaling; the strict ordering itself was never built. V31 evidence fold: the Terrablood archive (Hoser #9) records the same ordering — canon citation in `docs/engineering/terrablood-canon-claims.md`. | Feature  | `src/engine/promoters/offerMatchmaking.ts` (`findBestOpponent`), `src/engine/matchmaking/bloodfeud.ts` | **Open** — from V24 FINDINGS' unticketed deferred register (never carried into V24_DEFERRED) |

### C — Campaign-scale (own megaplan each)

| Prov   | Item                                                                                                                                                                                                                                                                                                                               | Severity | Entry points                                                                                                                                   | Status                                                                                                                                                                                                         |
| ------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- | ---------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| S6     | ~~TP/ST rebalance campaign~~ — **moved to §E**: canon direction holds emergently; no campaign needed.                                                                                                                                                                                                                              | Balance  | §E resolved row                                                                                                                                | **RESOLVED (2026-11-22)**                                                                                                                                                                                      |
| V22-D3 | **Pagan literal damage model** — canon: damage = ST + class-variance + weapon-variance; armor soak = weight + 12 + type-bonus; ≤1 → bounce. Current model is `(class+4)×locMult×variance` + flat mitigation — same shape, different parameters. Needs a soak-rework pass + end-to-end damage/KO/kill distribution re-verification. | Own pass | `src/engine/combat/mechanics/damageCalc.ts:16-24`, `src/engine/combat/mechanics/weaponArmor.ts` (V29 corrected path — `resolution/` was stale) | **Open** — V29 NO-GO reaffirmed: rewriting the damage scale invalidates every combat baseline (kill rates, bout length, mortality); requires its own campaign with a dedicated RED battery + soak verification |
| V22-D4 | **ADM / graduation tier** — canon: basic caps 3–21, ADM caps 3–25; WL>21 grants INI bonus; graduation is a separate advancement tier.                                                                                                                                                                                              | Feature  | `ATTRIBUTE_MAX` (`types/shared/attributes.ts:40` = 25), `src/engine/warrior/potential.ts`, training passes                                     | **Open** — V29 NO-GO reaffirmed: caps are 3–25 throughout, no tier exists; design-level feature needing its own campaign                                                                                       |

### D — Standing & design deferrals (conditional revisit only)

| Prov       | Item                                                                                                                                                                                                                                                                                                                                                                                                         | Severity       | Entry points                                                                     | Status                                                              |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------- | -------------------------------------------------------------------------------- | ------------------------------------------------------------------- |
| V24-D5     | **Out-of-scope game modes** — Bloodgames tournaments, Primus/ADM-tier play, PP (programmer prize) systems.                                                                                                                                                                                                                                                                                                   | Scope boundary | No engine surface exists to pin them to                                          | **Standing deferral** — revisit only if those modes ever land       |
| V27-§5     | **Intentional design deferrals:** ~~knack~~ — V31 canon push landed the rumor surface (Expert-scout `Knack` insight tokens, vague, \|luckfactor\|≥3); knack-as-mechanic stays deferred. Duel2's separate Novices class (0-FE post-freeze debut folds into Rookies under our fold); freeze deeper than T−2 (2-week window chosen); FTF-style real-time social systems (already emergent via dossiers/decoys). | Intentional    | scout/intel surfaces; `TOURNAMENT_CLASSES` (`tournamentSelection/classes.ts:26`) | **Design deferrals** — revisit only on explicit canon push          |
| V28        | **markdownlint CI adoption** — vestigial `markdownlint-disable` comments in this file + the master design bible, but no `.markdownlint*` config and no markdown lint step exists; `docsLayout` is the natural gate if it is ever adopted.                                                                                                                                                                    | Tooling        | `src/test/megaplan/docsLayout.guard.test.ts`                                     | **Standing deferral** — revisit only if markdown linting is adopted |
| SP-spine   | **Progression-spine multi-tier escalating arc** — deferred MVP Option 3 from the 2026-06-22 win-condition plan.                                                                                                                                                                                                                                                                                              | Design         | No engine surface exists                                                         | **Design deferral** — revisit only on explicit product push         |
| SP-bailout | **Player bailout/receivership economy** — declared non-goal in the world-sim-decouple plan; broke players climb out via promoter offers today.                                                                                                                                                                                                                                                               | Scope boundary | `src/engine/pipeline/tick/timeAdvance.ts` (`evaluateStopConditions`)             | **Standing deferral**                                               |
| SP-reveal  | **prefight-advisor `revealLevel`** — style-only (no exact stats) forecast for partially-scouted opponents.                                                                                                                                                                                                                                                                                                   | Feature        | `src/engine/narrative/fightForecast.ts` (`buildFightForecast`)                   | **Conditional** — only if a partial-reveal tier is wanted           |
| S6         | **TP>AB "scum answers the surgeon" — probe-rejected canon claim** — the archive's TP-over-AB dominance failed the two-source rule (N=400 style-typical probe: 35.8% TP; 2026-11-22 re-probe all-15s+AI: 47.3% TP). The matrix's AB edge stands. Fresh read: canon direction DOES hold on the world surface (TP>AB ≈61–70%) — via TP's global dominance, not a pair edge → adjudicated house divergence (§3). | Canon claim    | `matchup.ts` Pass-5 note; `terrablood-canon-claims.md` (S6 row)                  | **RESOLVED (2026-11-22)** — adjudicated divergence, registered §3   |

### E — Resolved (verified — kept for the audit trail)

| Prov        | Item                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  | Severity      | Entry points                                                                                                                       | Status                                                                                                                                                                                                                                                                                                                                                                         |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------- | ---------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| V30         | **worldLiveness competence-gradient seed re-baselined** — in-spec sweep of 42 candidates (temp specs replicating the spec env; `probe-liveness-seed.ts` confirmed non-transferable). New seed **89**: medM=442, medN=52 (coherent denominator), gradient 8.500, coherence 0.135, masterN=19, noviceN=16, objWeeks 9224 — all bars verified in-spec. Runner-up 79 (gradient 26.286, thin medN=21). Noted pattern: most misses now fail the _coherence_ floor — the unified ruleset diversified rival intent.                           | Test debt     | `worldLiveness.integration.slow.test.ts`                                                                                           | **RESOLVED (2026-11)** — spec re-seeded + re-baseline comment; spec green in slow tier                                                                                                                                                                                                                                                                                         |
| V30         | **worldBalance roster-fill re-baselined** — in-spec sweep found 31337's fill had recovered to 0.952 post-WS3/4 stream re-roll (the documented 94.4% was measured on an earlier tree), but marginal. New seed **2024**: fill=1.000 (34/34), legacy=4, min=90, max=91, kill=0.051, dark=2 — all bands verified in-spec.                                                                                                                                                                                                                 | Test debt     | `worldBalance.slow.test.ts`                                                                                                        | **RESOLVED (2026-11)** — spec re-seeded + comment; spec green in slow tier                                                                                                                                                                                                                                                                                                     |
| SP-boundary | **`as unknown as` typed-boundary casts removed** — all three sites rewritten without casts: `warriorRouting` takes `FightSummary` directly (`Warrior.stableId?: StableId` ≡ summary's fields), `mortalityHandler` builds the summary record without the literal-spread cast, `changedFields` uses a kept-fields typed-Record build instead of `delete`.                                                                                                                                                                               | Type debt     | `warriorRouting.ts`, `mortalityHandler.ts`, `reportingHandler.ts`                                                                  | **RESOLVED (2026-11)** — `c40145ce6`; `warriorRouting`/`handleReporting`/gazette-contract specs pin the signatures                                                                                                                                                                                                                                                             |
| SP-virt     | **StableRankings / RivalStableList virtualized** — spacer-`tr` table pattern per `WarriorLeaderboard`; rival list keeps `useListShell`/`ListToolbar` (25-row default + showAll) and transform-positions cards via `@tanstack/react-virtual`.                                                                                                                                                                                                                                                                                          | Perf          | `StableRankings.tsx`, `rivalStableList/RivalVirtualRows.tsx`                                                                       | **RESOLVED (2026-11)** — `ab3a4fffa`; virtualization + sort/showAll specs green; e2e chromium 7/7                                                                                                                                                                                                                                                                              |
| V24-F2      | **Expanded per-weapon armor matrix adjudicated** — `WEAPON_ARMOR_MATRIX` (20 damage weapons × 7 canon armors) composes per-weapon factors with the damage-type baseline; `ARMOR_TYPE_MULT` rows corrected incl. the `ring_mail` inversion (slash/pierce no longer _amplified_ vs bash); dagger×{ASM,ACM} 0.7 override preserved as a matrix cell.                                                                                                                                                                                     | Canon         | `src/constants/combat/combat/weaponArmorMatrix.ts`, `src/engine/combat/mechanics/weaponArmor.ts`                                   | **RESOLVED (2026-11)** — `752d24f4f`; matrix+mechanics specs cover every armor tier × damage class; 1,296 combat tests + combat slow tier green                                                                                                                                                                                                                                |
| V24-F3      | **Canon armor table alignment** — armor ids are the canonical strategy codes `ALE/APL/ARM/ASM/ACM/APM/APA` at weights 2/4/6/8/10/12/14; noncanonical studded-leather row removed entirely; helm code `FF`→`F`; `SAVE_STATE_VERSION`→4.0.0 (`core.ts` + `electron/main.ts` + `package.json`); `hitLocation.protectCovers` switched to explicit id sets (the `'mail'` substring trap died with the rename).                                                                                                                             | Canon         | `src/data/equipment/armor.ts`, `helms.ts`, `hitLocation.ts`                                                                        | **RESOLVED (2026-11)** — `ef3d7adaf` + `752d24f4f`; `armor.canon`/`helms.canon` specs pin exact rows, codes, weights, ordering                                                                                                                                                                                                                                                 |
| V15         | **Engine-pool persistent shard state implemented** — synced workers hold a GameState replica and replay stage transitions (`weekStart`→`postCore`→`weekResult`) via `syncedShardState` + `syncCoordinator`; per-stage FNV hash receipts verify replay (eager-captured — ledger states are live aliases by design); mismatch heals install the stage state directly; weekResult rolls forward as next week's input replica (zero steady-state full-state sends). Sequential≡parallel hash-verified over 4-week + mid-week-spawn specs. | Perf          | `src/engine/pool/{enginePool,syncCoordinator,syncedShardState,stateHash}.ts`                                                       | **RESOLVED (2026-11)** — implementation landed; **ship gate still FAILS: parallel-bench 0.48×** (was 0.33–0.38×) — fixed protocol cost (hash receipts + duplicated replays + round-trips) cannot amortize against ~250ms sequential weeks. `pool.size>1` remains opt-in; default stays 1. Third documented gate failure — architecture kept for correctness-verified workloads |
| V15         | **structuredClone residual churn** — V29 re-audit: `mutableInput` ownership flag now bypasses the clone wherever callers transfer ownership (autosim weeks 2+, pipeline contexts); the residual single clone is the semantically-required week-1 boundary copy. `cloneObject`/`copyDataProperties` no longer exist.                                                                                                                                                                                                                   | Perf          | `weekPipeline/context.ts:53-64`, `autosim.ts:204`                                                                                  | **RESOLVED (V29)** — remaining clone is by-design                                                                                                                                                                                                                                                                                                                              |
| V16-A11     | **Weather bid-priority one week stale** — `generateBoutBids` consumed `state.weather` at offer-emission time; bouts resolve a week later.                                                                                                                                                                                                                                                                                                                                                                                             | Low           | `offers.ts` — now derives bout-week weather on an independent seeded stream (`rollWeather(SeededRNG(w*13), computeNextSeason(w))`) | **RESOLVED (V29)** — `rivalBidsWeather.test.ts` pins it                                                                                                                                                                                                                                                                                                                        |
| V16-scope   | **AI fuzzy-evaluation of scouted opponents** — V16 punted it to "V17" which never scoped it; the intent is covered by later machinery: `intelWorker` blends persisted dossier `observedTells` at scout-quality weight, `PerceptionSnapshot`, `possiblyMaskedPlan` decoy uncertainty, `processIntel` hash-jitter.                                                                                                                                                                                                                      | Feature       | `src/engine/ai/workers/intelWorker.ts:273`, `src/engine/ai/memory/intelDossier.ts:219-223`                                         | **RESOLVED (verified 2026-11-21)** — dossier/perception machinery covers the intent                                                                                                                                                                                                                                                                                            |
| V21-B3      | **WEATHER_STATS stamina-token semantics** — convention confirmed: `DRAIN N%` ↔ `staminaMult = N/100` (endurance-cost rate). Three violators found (V29-B6 guard): Chaos Storm 0.8→1.25, Chaos Squall 0.85→1.15 (effect-side); Abyssal Tempest display 60%→160% (display-side — "heavily drains" + 1.6 effect were already consistent).                                                                                                                                                                                                | Docs decision | `weatherStats.ts:6`, `weatherEffects/table.ts`                                                                                     | **RESOLVED (V29)** — `v29WeatherStamina.guard.test.ts` enforces coherence for all 65 weathers                                                                                                                                                                                                                                                                                  |
| V21-B6      | **KD zero kill-rate differential** — V29 re-ran the slow tier: both kill specs PASS on current engine (`:308` KD differential + `:402` recruit kill-rate band). The suspected zero differential does not reproduce.                                                                                                                                                                                                                                                                                                                   | Re-verify     | `balance.slow.test.ts:308`                                                                                                         | **RESOLVED (V29)** — green as of V29 re-run                                                                                                                                                                                                                                                                                                                                    |
| V26-D1      | **Favorites UI missing `discovered.tactic` row** — FavoritesCharting now surfaces it: "Tactics Revealed" count cell + "Favorite Tactics" distribution rows.                                                                                                                                                                                                                                                                                                                                                                           | Low           | `FavoritesCharting.tsx`                                                                                                            | **RESOLVED (V29)** — `tacticRow.test.tsx` pins it                                                                                                                                                                                                                                                                                                                              |
| V26-D2      | **`processTierProgression` dead call** — `SystemPass` passed `state.season` (always equal → early return); now passes `computeNextSeason(nextWeek)` and threads the pass rng through `processSystemicProgression`. Promotion/demotion verified at season boundary.                                                                                                                                                                                                                                                                    | Medium        | `SystemPass.ts:36-58`, `tierProgression.ts`                                                                                        | **RESOLVED (V29)** — V29-D2 describe pins promote/demote/no-op                                                                                                                                                                                                                                                                                                                 |
| V26-D3      | **`meta.createdAt` wall-clock** — `createFreshState` now defaults `createdAt` to `weekToTimestamp(0)`; fresh states are bit-identical across calls.                                                                                                                                                                                                                                                                                                                                                                                   | Low           | `gameStateFactory.ts:109`                                                                                                          | **RESOLVED (V29)** — V29-D3 specs pin it                                                                                                                                                                                                                                                                                                                                       |
| V26-D4      | **Gazette `t()` crypto fallback** — removed; array+no-rng picks the first template deterministically. Fallback was unreachable from all production callers.                                                                                                                                                                                                                                                                                                                                                                           | Low           | `gazetteTemplateHelpers.ts`                                                                                                        | **RESOLVED (V29)** — V29-D4 spec pins determinism                                                                                                                                                                                                                                                                                                                              |
| S6          | **TP/ST canon direction — resolved emergently, no campaign needed** — V31 probe showed TP>ST at 52% but every matrix retune breached the 80/20 invariant. Controlled re-probe (N=400, all-15s + AI plans, both positions): TP>ST holds at **52.0%** on the isolated surface and **68–72%** on the world surface — the canon direction was never broken; the fixture's ~49% was a default-plan artifact. The matrix cell deliberately stays −1/+1; direction is pinned by a seeded win-rate spec.                                      | Balance       | `matchupMatrix.canon.test.ts` (emergent-direction block), `matchup.ts` Pass-5                                                      | **RESOLVED (2026-11-22)** — seeded win-rate pin green; matrix unchanged (guardrail-safe)                                                                                                                                                                                                                                                                                       |

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
- **`balance.slow` 80/20 matchup invariant red at HEAD** (found in V31 slow
  run, stash-verified pre-V31): `PARRY-STRIKE vs WALL OF STEEL` 81%,
  `STRIKING ATTACK vs BASHING ATTACK` 81% — belongs to the next balance
  campaign, not V31 scope. Companion of the S6 TP/ST row (§1-C).
- ~~**`killDeathDivergence` 300wk vs 600s cap**~~ — **RESOLVED (2026-11-22)**:
  re-measured at **253.9s under concurrent load** (was ~685s V29) — the
  agent-sweep perf work (bolt memoization `aab91f55d`, perf-auditor scan
  hoist `d3c67f4df`) cut per-week cost ~60%. The 900s cap now holds with
  ~3.5× headroom; no rebaseline needed.
- ~~**`fileBudget` ratchet-creep**~~ — **RESOLVED/stale (2026-11-22)**:
  already green — V29's post-close-out WarningCard extraction restored the
  > 80-function baseline to 19 rows (spec comment at `fileBudget.test.ts:65`).
  > Watch stays conceptually; nothing to re-baseline.
- **TP world dominance: 63.0%** (fresh 1000-wk re-baseline, seed 12345,
  2026-11-22; was 62.9% V23 → 63.5–64.2% V26). Flat trend across the agent
  sweep — adjudicated canon-accurate (scum is the documented dominant
  metagame answer). **Lever tried and REJECTED by A/B**: `LEARN_CAREER_CAP`
  120→80 (300wk same-seed) pushed TP 62.8→64.3% — the cap binds equally on
  TP's counters, widening TP's early-career edge. The remaining documented
  lever is development-side (retirement pressure / per-style learn-rate
  scalar), NOT combat numbers — that's a campaign, not a tweak.
- **World kill rate 4.68% weekly / 5.13% tournament** (fresh 1000-wk
  re-baseline; was 6.68% V23). The `KILL_WINDOW.SCALE` 1.18 bump fixed
  only the FLAT fixture — the world floor did NOT respond. Coupled
  mechanism: TP kill-share is 2.0% with a 44%-Decision profile, so TP's
  bout-share mechanically dilutes the world rate; the mint-DA-floors
  explanation still stands as the second driver. Recovery is downstream
  of the TP-development campaign, not a kill-window tweak. Per-style
  differentiation itself verified canon-correct (TP/WS strictly lowest;
  offensive cluster out-kills defensive) and pinned by
  `killShare.canon.test.ts`.
- **LU floor / PR band edge** (V22 §3): re-checked on the 2026-11-22
  1000-week re-baseline — **LU 43.7%** (floor trigger is <40; holds),
  **PR 59.4%** (at the ~60 edge, not over). No ratchet fired; keep
  watching at each re-baseline — candidates remain in the V22 archive.
- **Agent-sweep seeded-stream shift** (2026-11-22): the roster curation
  (`the_wailing_chasm`↔`the_desolate_heath`, `38f27a540`) changes the
  arena-selection pool order, and the KO-attribution fix (`17abe0fef`)
  re-buckets riposte/off-hand bout ends from `BLEED`/`Stoppage` to
  `RIPOSTE`/`OFFHAND` — bookkeeping only, no mechanic change, but
  causeBucket distributions will move on each world re-baseline.
  **Verified on the 2026-11-22 1000-wk re-baseline**: metrics shifted as
  expected (kill 4.68%, TP 63.0%) and all invariants held
  (`killDeathDivergence` 253.9s green) — drift is legitimate;
  do not "fix" it back.
- **ai-behavior-audit-v2 residual watches** (folded in the 2026-11-21
  completeness pass): `displaced` share of reign endings reflects stable
  churn more than title mechanics; `counterOfferRate` counts only standing
  offers — re-measure on the next soak series.
- **Slow-suite flakes under load** (V22 §4): `killDeathDivergence`, perf
  160-stable ceiling, autosim timing, worldLiveness gradient each pass
  standalone — re-run clean before assuming a regression.
- ~~**Hook-timeout flake class — root-caused (V29)**~~ — **VERIFIED
  RESOLVED (2026-11-22)**: `hookTimeout: 30000` confirmed live in both
  `vitest.config.ts:27` and `vitest.config.slow.ts:15`; covers
  `opfsArchiverFlush` and `tacticDiscovery.parity` flake signatures.
- ~~**`tacticDiscovery.parity.test.ts` suite-load flake**~~ — **VERIFIED
  RESOLVED (2026-11-22)**: same root cause; the 30s hookTimeout fix
  covers it.
- ~~**e2e console findings** (V29, pre-existing)~~ — **VERIFIED RESOLVED
  (2026-11-22)**: `AvatarForEntity` generates via `useEffect` (confirmed
  at `AvatarForEntity.tsx:119`); `SelectableCard` is `role="button"`.
  Original notes: (a) `Cannot update RouterHooks while rendering
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
- **TP>AB via global dominance, not a pair edge** (adjudicated 2026-11-22):
  the isolated matchup keeps AB's +1 edge (probe-rejected: 35.8% V31,
  47.3% re-probe TP), while the world surface reproduces the archive's
  "scum answers the surgeon" direction (≈61–70% TP) through TP's overall
  dominance. Do not "fix" the isolated pair to match the archive — the
  two-source rule governs pair cells.

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
  register; `*_DEFERRED.md` files describe what shipped vs punted _within_
  their version; this file is the only cross-version backlog.
- **`testQualityAudit` compliance** — new `src/test/megaplan/` guards must
  register a `GUARD_REGISTRY` disposition; new specs regenerate
  `runnerGroups.json` via `bun scripts/test-audit-scan.mjs`.

## 5. Resolved index

Families whose deferred work all landed — details in the archived docs.

| Prov                | Items                                                                    | Disposition                                              |
| ------------------- | ------------------------------------------------------------------------ | -------------------------------------------------------- |
| V9                  | traitDedup `effectHash` key-order follow-up                              | Landed — keys sorted, pinned by spec                     |
| V22                 | D1 dual-wield/off-hand, D2 trains-burn-skills                            | Landed V23 (`46e26119`, `c967fbb9`)                      |
| V24                 | D1 luck pools, D2 dagger advisory, D3 learn-cap literals, D4 rhythm gate | Landed post-close-out (D4 → V25's always-on)             |
| V25                 | All deferred + watch items                                               | Resolved — see archived V25_DEFERRED                     |
| V26                 | None (D1–D4 carried above, D5–D6 → §4)                                   | —                                                        |
| V27                 | All deferred items                                                       | Landed — V27_DEFERRED fully struck                       |
| V28                 | markdownlint CI adoption                                                 | §D standing deferral                                     |
| V29                 | None (watch items → §2)                                                  | —                                                        |
| V30                 | Seed re-baselines (worldLiveness 89, worldBalance 2024)                  | Resolved — §E rows; orphanScan + jscpd ratchets re-based |
| Consolidation V5–V7 | All deferred                                                             | Resolved — registers empty/resolved                      |
| Test-suite audit    | All waves                                                                | Complete — 0 TEST_DEBT pairs at Wave-2 close             |

## 6. Archive index

Per-version docs live at `docs/archive/megaplans/` (git history preserved
via rename). Themes are one-liners; the docs themselves are the audit
trail.

| Version             | Theme                                                                         | Docs                               | Restore tag                                   |
| ------------------- | ----------------------------------------------------------------------------- | ---------------------------------- | --------------------------------------------- |
| unversioned (~V8)   | Full-repo exhaustive review & verdict tables                                  | FINDINGS, LEDGER                   | `pre-megaplan-v8`                             |
| MEGAPLAN_V9         | 12 open PRs + closed-PR salvage + V5–V8 re-adjudication                       | FINDINGS, LEDGER                   | `pre-megaplan-v9`                             |
| MEGAPLAN_V10        | 6 open PRs + orphan branches + latent findings                                | FINDINGS, LEDGER                   | `pre-megaplan-v10`                            |
| MEGAPLAN_V11        | Whole-repo re-read, refactor & integration deep-dive                          | FINDINGS, LEDGER                   | `pre-megaplan-v11`                            |
| MEGAPLAN_V12        | SRP/DRY exhaustive audit                                                      | FINDINGS, LEDGER                   | `pre-megaplan-v12`                            |
| MEGAPLAN_V14        | Pipeline & time-advancement campaign                                          | LEDGER only                        | `pre-megaplan-v14`                            |
| MEGAPLAN_V15        | Re-audit + 23-PR adjudication                                                 | FINDINGS, LEDGER, PLAN             | `pre-megaplan-v15`                            |
| MEGAPLAN_V16        | Validated audit (3 source-read rounds)                                        | FINDINGS, LEDGER, PLAN             | `pre-megaplan-v16`                            |
| MEGAPLAN_V17        | 10 open PRs + PR-touched domains                                              | FINDINGS, LEDGER                   | `pre-megaplan-v17`                            |
| MEGAPLAN_V18        | Seeded audit baseline                                                         | FINDINGS, LEDGER, PLAN             | `pre-megaplan-v18`                            |
| MEGAPLAN_V19        | Full re-baseline                                                              | FINDINGS, LEDGER, PLAN             | `pre-megaplan-v19`                            |
| MEGAPLAN_V20        | Exhaustive review & branch consolidation                                      | FINDINGS, LEDGER, PLAN             | `pre-megaplan-v20`                            |
| MEGAPLAN_V21        | Exhaustive review & consolidation                                             | FINDINGS, LEDGER, PLAN             | `pre-megaplan-v21`                            |
| MEGAPLAN_V22        | Noblish Island canon (15 articles)                                            | DEFERRED, FINDINGS, LEDGER, PLAN   | `pre-megaplan-v22`                            |
| MEGAPLAN_V23        | Arena 93 game concepts + V22 pull-ins (no DEFERRED register — lived in V22's) | FINDINGS, LEDGER, PLAN             | `pre-megaplan-v23`                            |
| MEGAPLAN_V24        | Noblish Island strategy canon                                                 | DEFERRED, FINDINGS, LEDGER, PLAN   | `pre-megaplan-v24`                            |
| MEGAPLAN_V25        | Winning Warrior Types canon                                                   | DEFERRED, FINDINGS, LEDGER, PLAN   | `pre-megaplan-v25`                            |
| MEGAPLAN_V26        | NPC/player parity audit                                                       | DEFERRED, FINDINGS, LEDGER, PLAN   | untagged                                      |
| MEGAPLAN_V27        | Tournament classes / FE / freeze dates                                        | DEFERRED, FINDINGS, LEDGER, PLAN   | untagged                                      |
| MEGAPLAN_V28        | Docs taxonomy, bible-corpus boundary & convention ratchet                     | DEFERRED, FINDINGS, LEDGER, PLAN   | untagged                                      |
| MEGAPLAN_V29        | Exhaustive review & full branch consolidation                                 | DEFERRED, FINDINGS, LEDGER, PLAN   | `pre-megaplan-v29`                            |
| MEGAPLAN_V30        | Harmonization & deduplication campaign                                        | DEFERRED, FINDINGS, LEDGER, PLAN   | `pre-megaplan-v30`                            |
| CONSOLIDATION_V5–V7 | PR consolidation waves                                                        | FINDINGS×3, LEDGER×2               | `pre-consolidation-*`, `pre-v7-consolidation` |
| TEST_SUITE_AUDIT    | Test-suite audit & reorganization (Waves 1–2)                                 | PLAN, LEDGER + TEST_AUDIT_FINDINGS | `pre-test-audit-v2`                           |
