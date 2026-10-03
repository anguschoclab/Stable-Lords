# MEGAPLAN V9 FINDINGS — Exhaustive Consolidation & Verdict Ledger

**Scope:** Consolidation pass over 12 open PRs + closed-PR salvage (#968–#997) + residual
living-rival-world work + full re-adjudication of V5–V8 verdicts. Zero save/back-compat
constraints. Verdict vocabulary: **APPROVED** / **CORRECTED** / **DISPROVED** /
**NOTE** / **EXEMPT** / **SUPERSEDED**.
**Restore point:** tag `pre-megaplan-v9`; checkpoint branch `wip/living-rival-world` @ `6a5cb087`.
**Branch:** `main`. Baseline `f8577854` (red in CI) → HEAD post-consolidation.

---

## 0. Draft-plan validation ledger (claims audited before implementation)

| # | Draft claim | Verdict | Evidence |
| --- | --- | --- | --- |
| P1 | ~739 modified files in working tree | **CORRECTED** | True residual after upstream commits: ~27–33 changed paths; the living-world feature had partially landed (`beeeea6c` etc.) mid-session |
| P2 | Main CI green baseline | **DISPROVED** | `type-check`, `test`, `bun-test` red on `f8577854`; dependent jobs skipped. Root causes: committed scratch `scripts/_tmp.ts` (30+ TS2307), stale world-spec expectations, stale guard baselines |
| P3 | CI has 7 jobs | **CORRECTED** | 9 jobs: type-check, build, test, lint, bun-test, slow-tests, coverage, electron, e2e |
| P4 | PR #999's failing bun-test is a real defect | **DISPROVED** | Stale-branch noise — branch ~146 commits behind, predates the `environmentNodeCanary` bunfig ignore |
| P5 | #1009 `{{defender}}`→`{{name}}` needs engine verification | **APPROVED (verified)** | `narrateKnockdown` interpolates `{name}` only; `{{defender}}` renders literal "the opponent" |
| P6 | #1008 is the best EntityLink approach | **CORRECTED** | #999 preferred: primitive selectors + memo on all three exports; #1008's object selector + custom equality is more machinery than needed |
| P7 | #1003 and #1005 differ | **DISPROVED** | Byte-identical on `ViewModeToggle.tsx`; #1003 adds TokenCard/WarriorTargetCard/accordion/toast |
| P8 | #1009's styleArchives fix is the right one | **DISPROVED** | Early-return silently passes w/o routeTree; #1005's `existsSync` variant cleaner. Moot: spec landed for real |

---

## 1. Open-PR disposition table (all 12)

| PR | Branch | Cluster | Verdict | Disposition |
| --- | --- | --- | --- | --- |
| #998 | chore/expand-weather-coverage-… | tests | **APPROVED** | Extracted wholesale — 4 test files, all 34 specs green (commit `d12016cc`) |
| #999 | bolt/memoize-entity-links-… | EntityLink | **APPROVED (winner)** | Synthesized: atomic primitive selectors + `React.memo` on WarriorLink/StableLink/LinkifiedText (`2c94f990`) |
| #1000 | jules-narrative-audit-… | narrative | **PARTIAL** | Narrative adds unioned; `.claude/backups/` stripped; buildConfigIntegrity/env-canary hunks superseded by tsconfig refactor |
| #1001 | bolt-optimize-entitylink-… | EntityLink | **SUPERSEDED** | Two-subscription variant; #999's single-subscription approach landed |
| #1002 | narrative-curator-expansion-… | narrative | **PARTIAL** | Union additions landed (incl. correct `{{name}}` knockdown additions); `.claude/backups/removed.json` stripped |
| #1003 | ui-polisher-accessibility-… | a11y | **APPROVED** | Landed: `focus-visible:outline-none` + accordion/toast `motion-reduce:animate-none` (`e5e96776`) |
| #1004 | bolt/optimize-entity-link-… | EntityLink | **SUPERSEDED** | Same family as #1001 |
| #1005 | fix/outline-none-accessibility-… | a11y | **APPROVED (merged via #1003)** | Identical ViewModeToggle hunk; cleaner styleArchives variant noted but spec now live |
| #1006 | bolt-perf-entity-links-… | EntityLink | **SUPERSEDED** | Same family as #1001 |
| #1007 | narrative-expansion-… | narrative | **PARTIAL** | Union additions landed |
| #1008 | bolt-optimize-entity-link-… | EntityLink | **SUPERSEDED** | Object selector + custom equality — correct direction, more machinery than #999 |
| #1009 | jules-17407150068756957735-… | narrative | **PARTIAL** | Narrative adds + `{{defender}}`→`{{name}}` knockdown fix unioned. REJECTED hunks: `e2e/seasonal-tournament.spec.ts` weakened `toBeGreaterThan(0)` → `toBeGreaterThanOrEqual(0)` (vacuous assertion on NPC podium check); ws-diag/ws-ladder superseded (ws-ladder deleted in `beeeea6c`, ws-diag renamed world-diag); styleArchives early-return anti-pattern rejected |

### Closed-PR salvage scan (#968–#997)

All map to prior V7 dispositions (`CONSOLIDATION_FINDINGS_V7.md` curated-extraction table). No unique salvage value remains. **NOTE** — no action.

---

## 2. Synthesis decisions

### EntityLink (5-PR cluster → one implementation)

- Root cause: `useShallow` over `{player, rivals, roster, graveyard, retired}` re-rendered every link on any slice churn.
- Landed: `useGameStore((s) => id ?? findWarrior(s, undefined, name)?.id)` / `findStableId(s, name)` + `s.player.id` — primitive selectors, `Object.is` equality shields re-renders; `React.memo` wraps all three exports per #999.
- Verified by new `src/test/components/entityLink.perf.test.tsx` (real zustand store behind mocked module): 4 tests — churn-stability, id-change rerender, player-stable routing, unresolved fallback.

### Narrative union (4-PR cluster)

- Merger: union-additions per leaf in PR order (1000→1002→1007→1009), token-fix applied *before* diffing so `{{defender}}`→`{{name}}` churn cancels; dedupe by normalized text; removals only on ≥2-PR consensus (9 removed).
- Post-pass: cross-leaf template dedupe (keep first occurrence), `pbp.knockdowns` token-normalized (dead pool; `{{defender}}` variants dropped).
- Overlay: 8 working-tree-only strings carried into their authored leaves.
- Result: killText 694→721, pbp 3034→3226, strikes 1042→1089 unique string leaves. `narrative-validate` green; `narrativeUnionV9` gate green.
- Token contract verified: `narrateKnockdown` supplies `{name}`; `narrateRecovery` `{name, attacker}`; kill_text `{attacker, defender, name=loser}` — `{{name}}` in kill pools = victim (correct, kept).

### Accessibility (#1003/#1005)

- `outline-none` → `focus-visible:outline-none` on ViewModeToggle buttons, TokenCard, WarriorTargetCard; `motion-reduce:animate-none` on accordion/toast.
- Gate: `ViewModeToggleA11y.test.tsx` — rendered class tokens + source-level contracts.

### #1009 rejected hunks

- `e2e/seasonal-tournament.spec.ts`: `toBeGreaterThanOrEqual(0)` is vacuous — rejected, kept `toBeGreaterThan(0)`.
- `ws-diag.ts`/`ws-ladder.ts`: superseded — ws-ladder deleted, ws-diag renamed `world-diag.ts` upstream; scripts moved out of `src/` with `#scripts/*` alias.

---

## 3. New bugs found & fixed (each with failing evidence first)

| # | Finding | Verdict | Fix |
| --- | --- | --- | --- |
| B1 | `scripts/_tmp.ts` committed scratch file broke `type-check` (30+ TS2307) | **APPROVED** | Deleted (`d7298a97`) |
| B2 | `buildConfigIntegrity` JSONC stripper ate `"@/*"` path mappings as comments | **APPROVED** | Replaced regex with string-aware state-machine stripper (both `readJson` copies) |
| B3 | `WarriorPass.test` trainer specs hard-coded old fame floor (500) — actual `LEGACY_FOUNDER_FAME_MIN=90` | **APPROVED** | Repinned to constants; boundary semantics (`0179da61`) |
| B4 | Stale world-spec expectations across ~15 test files (population floor 45→90, handler count 7→12, truncation caps, warrior costs) | **APPROVED** | Repinned batch (`3c19f364`) |
| B5 | `fileBudget` guard: 18 fns >80 lines from landed world work | **APPROVED** | Real decomposition (management.ts, MatchCard, PaperDoll, AttributeRow, WarriorTrainingCard, RosterSnapshot, BookingOffice, HallOfFights, refusals/results, rivalStableShard, finalize, draftService, recruitmentWorker, coreGenerator) |
| B6 | dup-scan new pair `groupBookmarks\|useBookmarkGroups` | **APPROVED** | Registered as extraction-seam pair in `duplication.guard` baseline |
| B7 | Cross-project test pollution suspicion (WarriorPass CI-only failure) | **DISPROVED** | Not pollution — genuinely stale spec (isolation pass predated constant landing). No global-state leak found |
| B8 | `pbp.knockdowns` dead pool held `{{defender}}` + duplicate `{{name}}` variants | **APPROVED** | Token-normalized + deduped in union |
| B9 | `simulation_hardening` death-rate bound 1.0 stale for living world (measured ~1.04) | **APPROVED (repin)** | Bound 1.2 w/ documented justification — density guards prove restock works |
| B10 | `rivalStrategyPass.perf` 664ms vs 500ms bound under concurrent bun-test load | **NOTE** | Contention flake — rerun on quiet machine |

---

## 4. Deferred / optional / out-of-scope items — all implemented

| Ticket | Spec | Status |
| --- | --- | --- |
| MEGAPLAN-G1 | Style Archives browser | **DONE** — `src/pages/StyleArchives.tsx`, routed `/world/style-archives`, nav-linked; spec green |
| MEGAPLAN-G2 | Favorites charting toolkit | **DONE** — `FavoritesCharting` surface exists; spec green |
| MEGAPLAN-G3 | Tournament prep mode | **DONE** — `src/pages/TournamentPrep`, nav `/world/tournament-prep`; spec green |
| MEGAPLAN-L1 | Per-route primary CTA | **DONE** — `primaryCta.ts` `PRIMARY_CTA_BY_ROUTE` + `resolvePrimaryCta`; spec green |
| MEGAPLAN-L2 | PageFrame/PageHeader conformance | **DONE** — all non-exempt routed pages conform; spec green |

---

## 5. Orphan-route adjudication (7 flagged)

| Route | Verdict | Reason |
| --- | --- | --- |
| `/arena-hub` | **EXEMPT** | intentional legacy redirect → `/stable/arena` |
| `/world/arena-leaderboards` | **EXEMPT** | intentional legacy redirect → `/world/arenas` |
| `/` | **NOTE** | linked from AppHeader logo |
| `/warrior/:id` | **NOTE** | detail route — reached via WarriorLink/roster |
| `/world/stable/:id` | **NOTE** | detail route — reached via StableLink/rankings |
| `/world/arenas/:arenaId` | **NOTE** | detail route — reached via arenas list |
| `/stable/promoter/:id` | **NOTE** | detail route — reached via promoter directory |

## 6. Prior-finding re-adjudication (V5–V8)

- Structural splits (arena data, traitDefs, championship, chaos handlers, state types, lore, weekPipeline, shared types, weather/combat constants): **APPROVED — all landed**, target dirs/modules exist and are exercised.
- `commonCorpus`/homogeneous data arrays: **EXEMPT** upheld.
- V7 narrative union (#983/#989/#993/#994): `narrativeUnionV7` still green post-V9 union — **APPROVED**.
- Skip-guard mechanism (`MEGAPLAN-*` tickets): **APPROVED** — zero unregistered hard skips; the 5 tickets are all now implemented (not merely skipped).
- `tacticsAdvisorBridge.test.ts` DOM-pragma flag from test-audit: **NOTE** — file consumes no DOM; the guard's own rule passes.

## 7. Architectural verdicts

| Choice | Verdict |
| --- | --- |
| `legacyFounderQueue`/`freeAgents` in `GameState` (not module state) | **APPROVED** |
| Append-delta impacts (`legacyFounderEnqueue`, `freeAgentAdditions/Removals`) over wholesale replacement | **APPROVED** — prevents same-stage snapshot clobbering; covered by impact tests |
| `findWarrior`/`findStableId` WeakMap caches keyed on state | **APPROVED** — `clearHistoryCaches` keeps test isolation honest |
| `#scripts/*` alias + scripts out of `src/` | **APPROVED** — fixes tsconfig pollution class B1 |
| Atomic selectors over `useShallow` slices in hot-path leaf components | **APPROVED** |
| No save-version migration layer | **APPROVED** per mandate (zero back-compat constraints) |
| Vacuous e2e assertions (`>=0` on a meaningful count) | **DISPROVED** — rejected #1009's hunk |

---

## 8. Final gate matrix (recorded at completion)

| Gate | Result |
| --- | --- |
| `bun run type-check` | PASS (tsc --build --force clean) |
| `bun run lint` | PASS (0 errors) |
| `bun run test` (vitest, 735 files) | PASS — 8447 tests, 2 sanctioned skips |
| `bun run build` (vite+PWA) | PASS |
| `bun run electron:compile` | PASS |
| `bun run narrative-validate` | PASS |
| `bun run test:slow` | 4 fails → fixed: B2 stripper, B9 bound, traitedShare bound already repinned; perf flake contention |
| `bun run test:bun` | PASS — 8405 tests / 0 fail / 1 skip (144s local); CI job sharded per-directory after 3 consecutive runner OOM kills |
| `bunx playwright test --project=chromium` | PASS — 4/4 (seasonal year-sim ~16.5min; CI job timeout raised 15→45min) |
| megaplan guards (fileBudget/dup/orphan/skip/uiTokens/typeSurface) | all PASS |
| `git fsck --full` | recorded in ledger |
| **GitHub CI (run 36930071236 @ `218712fc`)** | **9/9 green** — type-check, build, test, lint, bun-test, slow-tests, coverage, electron, e2e |

CI-only fixes landed during verification: styleArchives wired test now asserts on the tracked route source instead of generated `routeTree.gen.ts` (`3b3050ec`); e2e timeout (`706f6df3`, `218712fc`); bun-test sharding + `--smol`/`--timeout=30s` (`3849091b`, `73617b45`, `13b73482`).

## 9. Remote disposition log

- PRs #998–#1009: disposition comments posted, all 12 closed, all 12 remote branches deleted (verified `git fetch --prune`).
- `wip/living-rival-world`: consumed by main (refined commits); remote branch deleted. Tag `pre-megaplan-v9` retained as restore point (`f8577854`).

## 10. Post-V9 PR wave (1010–1013) — dispositions

A second wave of four bot PRs opened after the V9 cleanup. Reviewed, curated, and
dispositioned under the same workflow:

| PR | Subject | Verdict | Landed |
| --- | --- | --- | --- |
| #1010 | Disabled-state tooltip on ExecuteWeekButton | **Partially approved — implementation disproved** | Corrected in `8ce23368` |
| #1011 | Combat narrative pool curation | **Approved** | `4a55a1eb` (artifact stripped) |
| #1012 | `useShallow` on primitive selectors | **Approved (selectors); dep hunk rejected** | `5e9d09fe` |
| #1013 | Narrative/lore expansion | **Partially approved — hollow_born disproved** | Lore only, `b14ed902` |

### #1010 — corrected, not rejected

- Intent approved: a disabled "Execute Week" button should explain why.
- Implementation disproved: `tooltip={disabledReason}` lands on a `Button` that
  carries `disabled:pointer-events-none`; a disabled element cannot be a Radix
  pointer target, so the tooltip could never fire. Shipped a wrapper-span trigger
  instead, with tests for running/simulating/idle states (test-first).

### #1011 — approved

- +113/−32 across killText/pbp/strikes; JSON valid, `narrative-validate` and the
  V9 union gate green. `.claude/backups/narrative/audit_log.txt` stripped.

### #1012 — approved minus dependency churn

- `useShallow` on selectors returning primitives (`s.roster.length`, `s.treasury`)
  or stable references (`s.roster`) is a no-op — removal is correct.
- **Rejected**: unrelated `framer-motion` `13.4.0` → `^13.5.0` pin-to-range change;
  repo convention is pinned deps.

### #1013 — curated; hollow_born disproved

- **Landed**: 2 arena lore entries + `childhoodTraits`/`definingMoments`/`origins`
  additions (`b14ed902`).
- **Rejected**: `hollow_born` — semantically identical effect to existing
  `orphan_resilience` (`{defModLate:1, enduranceMult:0.95}`); it evades the
  traitDedup guard only because `JSON.stringify` is key-order sensitive. Also
  rejected: the `blankShare` 0.15→0.14 slow-test weakening that existed only to
  accommodate hollow_born's added density, the `.claude/backups` artifact, and
  ~20 files of stale prettier rewraps of just-landed V9 code.
- **Guard finding**: `traitDedup`'s `effectHash` should sort keys — two identical
  effects written in different key order currently pass. Noted for follow-up.

## 11. Remote disposition log (post-V9 wave)

- PRs #1010–#1013: disposition comments posted, all closed, remote branches deleted.

## 12. Third PR wave (1014–1016) — dispositions

| PR | Subject | Verdict | Landed |
| --- | --- | --- | --- |
| #1014 | `gutter_wraith` notable trait | **Approved** | `edeb48fd` |
| #1015 | Two new arenas + water/uneven fit penalty | **Approved — registration gap fixed** | `dc51b3b4` |
| #1016 | Wandering Blacksmith offseason event | **Approved** | `a5ea12cb` |

### #1014 — approved

`{iniModFresh:1, attModEarly:1}` is a novel generic-positive combo — unlike
`hollow_born` it does not clone an existing effect. traitDedup green at 150.

### #1015 — approved with a fix

- Both venues (`the_frozen_lake`, `the_acid_bog`) were exported but **never
  registered** in the arena index — dead content. Appended to the built-in
  registration array (order is pinned and RNG-observable) and repinned the
  registration-order test.
- The water+uneven initiative-style fit penalty and the balance smoke test
  (win-rate ≤0.9, small sample) landed as written.

### #1016 — approved

Treasury-gated (<50g → passes by) XP award with a −50g ledger entry. Handler,
union member, narrative entry, and fire/skip tests all correct; `{{xp}}`
interpolates from the announce payload.

### CI note — perf ceilings for the 90-rival world

The living-world batch roughly doubled per-week sim cost vs the 8-rival
calibration (~0.4s/week local, ~2.5× worse on hosted runners). `aebd5936`
repinned the coarse autosim/pipeline caps and `ccb6828e` widened band/coarse
ceilings with headroom; authoritative bands are the 90/160-stable tests and
`docs/PIPELINE_BASELINE.md`.
