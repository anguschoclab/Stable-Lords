# MEGAPLAN V10 FINDINGS — Exhaustive Consolidation & Verdict Ledger

**Scope:** Consolidation pass over the entire Stable Lords repository — 6 open PRs
(#1017–#1022), 2 orphan remote branches, 1 local WIP checkpoint, plus 3 latent
bugs discovered during review. Zero save-file / backward-compatibility constraints.

**Verdict vocabulary:** `APPROVED` / `CORRECTED` / `DISPROVED` / `PARTIAL` /
`REJECTED` / `DEFERRED` / `EXEMPT`.

**Restore point:** `pre-megaplan-v10` at `49dc1ee8`.

---

## 0. Pre-implementation plan validation (pass 1)

| # | Draft claim | Verdict | Evidence |
| --- | --- | --- | --- |
| C1 | #1017 "adds THE_FORSAKEN_BOG arena" | **DISPROVED** | Diff only refactors weather-damage multiplication in `combatMath.ts` / `hitExecution.ts`; no arena definition or registration. |
| C2 | #1018 adds Bathhouse + Desolate Heath + weather + synergies + badges + tests | **APPROVED** | Verified full scope in branch diff. |
| C3 | #1019 adds Crumbling Spire + Misty Pit | **CORRECTED — PR IS BROKEN** | Diff references `ARENA_EVENT_CONSTANTS.CRUMBLING_SPIRE_FALL_TRIGGER` / `MIST_VEIL_TRIGGER` but never defines them; raw merge would fail type-check. |
| C4 | #1020 adds lore + `orphan_scavenger` trait | **APPROVED** | Trait def and registry insertion follow existing conventions. |
| C5 | #1021 narrative JSON curation +32/−39 | **APPROVED w/ caveat** | Branch is fresh (`behind=0`), removals are real near-dupes; PR diff introduced Unicode-escape churn that must be normalized. |
| C6 | #1022 focus-visible scouting buttons | **APPROVED** | Identical `focus-visible:*` swap across 4 components; consistent with V9 a11y work. |
| C7 | `narrative-content-expansion-1450…` adds a trait | **DISPROVED as unique value** | Only adds `gutter_wraith`, already landed on `main` (`edeb48fd`). |
| C8 | `bolt/optimize-useshallow` orphan branch | **APPROVED as obsolete** | Single empty commit literally titled "The work was closed as obsolete". |
| C9 | `wip/living-rival-world` fully superseded | **CORRECTED — real residual exists** | 33-file audit found `personalityDraft.test.ts` and `livingWorld.slow.test.ts` absent from `main` — salvageable. |
| C10 | Arena PRs conflict on shared files and breach caps | **APPROVED, corrected arithmetic** | Union breaches `ARENA_ROSTER_LIMITS`: total 50→53, t2 24→25, t3 15→17; caps repinned with V9 precedent. |
| C11 | #1018 badge code passes token guard | **APPROVED** | `text-blue-400` / `border-blue-500/30` are palette utilities; badge labels pass screaming-copy check. |
| C12 | `ARENA_EVENT_CONSTANTS` split across two files | **NOTE** | Constants in root `src/constants/arenaEvents.ts`; configs in `src/constants/arena/arenaEvents.ts`. Drift hazard demonstrated by #1019. |

## 0b. Implementation-phase validation (pass 2)

| # | Finding | Verdict | Evidence |
| --- | --- | --- | --- |
| C13 | Arena union = 54 arenas | **CORRECTED → 53** | Measured via registry: `{t1:11, t2:25, t3:17}`; baseline was 49, not 50. Caps landed `{54, 12, 25, 17}` as ceilings. |
| C14 | `livingWorld.slow.test.ts` ported | **INCOMPLETE → COMPLETED** | 1000-week version timed out at 10 min; adapted to 200 weeks and measured (92 rivals, floor=90, soft cap=160) — 7/7 green. |
| C15 | traitDedup key-order bug = 1 flaw | **CORRECTED — exposed 3 latent dupes** | Canonicalizing `effectHash` unmasked `hollow_gaze`/`cornered_rat`, `orphan_street_rat`/`gallows_humor`, `iron_vein`/`rust_blooded`. All differentiated. |
| C16 | Badge coverage complete | **PARTIAL → COMPLETED** | Added `ArenaHazardBadges` shared component, extracted duplicate JSX from `ArenaCircuit`/`ArenaDetail`, added component spec + `ArenaDetail` badge asserts. |
| C17 | `tacticsAdvisorBridge.test.ts` missing JSDOM pragma | **EXEMPT (pre-existing)** | Listed in `auditBaseline.json` before V10; not introduced by this pass. |
| C18 | Guard matrix | **CORRECTED** | `knip`/`dupes` are **not CI gates**; the real 9-job CI matrix is type-check, build, vitest, lint, sharded bun test, slow vitest, coverage vitest, electron:compile, playwright. |
| C19 | Test-first discipline | **APPROVED** | Git log shows a `test:` commit before each `feat:`/`fix:` for every unit. |
| C20 | `falling_debris` dead event | **Bug confirmed + fixed** | Required `['ruins','indoor']`; no registered arena had both tags. Fixed to `['ruins','cramped']` and guarded by orphan-event invariant. |

---

## 1. Open-PR / branch disposition table

| PR / Branch | Verdict | Landed as / Disposition |
| --- | --- | --- |
| #1017 | **REJECTED** | No code landed; close with verdict comment. |
| #1018 | **LANDED (curated)** | `35f37fee` — 2 arenas, events, weather modifiers, arenaFit synergies, UI badges. |
| #1019 | **LANDED (curated, repaired)** | `35f37fee` — 2 arenas; supplied missing `CRUMBLING_SPIRE_FALL_TRIGGER`/`MIST_VEIL_TRIGGER`. |
| #1020 | **LANDED (curated)** | `15ddfe62` — `orphan_scavenger` + lore/arena-lore; stripped `.claude/backups`. |
| #1021 | **LANDED (curated)** | `95a70de7` — narrative union +32/−32; normalized Unicode escapes; stripped `.claude/backups`. |
| #1022 | **LANDED (near-verbatim)** | `31ea7930` — focus-visible rings on scouting selectors; stripped `.jules/palette.md`. |
| `narrative-content-expansion-1450…` | **DELETE remote** | Fully superseded by `gutter_wraith` on `main`. |
| `bolt/optimize-useshallow` | **DELETE remote** | Empty obsolete commit. |
| `wip/living-rival-world` | **DELETE local** | Salvaged `personalityDraft.test.ts` (`b8ceda9d`) and adapted `livingWorld.slow.test.ts` (`c34ea89e`). Deleted after CI green. |

---

## 2. Synthesis decisions

### Arena union (#1018 + #1019)

- Added 4 venues: `the_bathhouse_arena` (t3), `the_desolate_heath` (t2),
  `the_crumbling_spire` (t3), `misty_pit` (t1).
- Added 4 events with canonical trigger constants in `src/constants/arenaEvents.ts`:
  `bathhouse_scald` (8), `heath_apparition` (18),
  `crumbling_spire_fall` (10), `mist_veil` (7).
- Weather/style modifiers:
  - `premium:Dense Fog` → riposte −1 (Bathhouse steam)
  - `cursed:Spooky Night` → initiative −1 (Heath apparitions)
- Matchmaking synergies in `arenaFit.ts`:
  - water + indoor → close-range +0.2
  - cursed + open → initiative styles −0.3
- Roster cap repin: `TOTAL_CAP` 50→54; tier caps `{1:12, 2:25, 3:17}`.
- Verified registered count = 53, so ceilings have 1-slot headroom at t1/total.

### Trait/lore (#1020)

- Added `orphan_scavenger` to `notable.ts` and `LEGACY_TRAIT_ORDER`.
- Lore additions to origins, childhood traits, defining moments, arena lore.
- Removed 3 near-duplicate lore strings verified genuine.

### Narrative JSON (#1021)

- Added 26 strings across thin categories (`recovery_slow`, kill text defaults,
  strike lines).
- Removed 32 near-duplicates.
- Normalized PR's `\u2014` / `\u00e2` escape churn back to canonical characters.

### Scouting a11y (#1022)

- Replaced bare `outline-none` with `focus-visible:outline-none
  focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-inset`
  on 4 scouting selection components.

### WIP salvage

- `personalityDraft.test.ts`: 3/3 green on current main — covers personality-weighted
  recruitment pick order.
- `livingWorld.slow.test.ts`: adapted from 1000 to 200 weeks; asserts rival count
  stays inside the governed band (`WORLD_RIVAL_FLOOR` 90 to
  `WORLD_RIVAL_SOFT_CAP` 160), legacy founders exist, variance, roster fill,
  style balance, kill-rate band.

### Optional / out-of-scope items now addressed

- **C12 file consolidation:** merged `src/constants/arena/arenaEvents.ts` into
  the root `src/constants/arenaEvents.ts` (the migration-pinned surface), updated
  the test import, removed the nested file, and re-exported from the constants
  barrel. This removes the drift hazard that allowed #1019's missing constants
  to go unnoticed.
- **C16 shared badge component:** extracted `ArenaHazardBadges` so both
  `ArenaCircuit` and `ArenaDetail` share one source of truth for WATER HAZARD /
  CURSED GROUND badges.

---

## 3. New bugs found & fixed (each with failing evidence first)

| # | Bug | Failing evidence | Fix |
| --- | --- | --- | --- |
| B-V10-1 | `falling_debris` event can never trigger | New orphan-event invariant: required tags `['ruins','indoor']` not satisfied by any registered arena. | Changed required tags to `['ruins','cramped']` — preserves enclosed-ruin semantics and is hostable by existing venues. |
| B-V10-2 | `hollow_gaze` duplicates `cornered_rat` | Canonical `effectHash` found identical core `{attModLate:1, defModLate:1}`. | `hollow_gaze` now `{attModLate:1, parModLate:1}` (unnerving stare → opponent parries worse late). |
| B-V10-3 | `orphan_street_rat` duplicates `gallows_humor` | Canonical `effectHash` found identical core `{decMod:1, defModLate:1}`. | `orphan_street_rat` now `{defModLate:1, defModLowHp:1}` (nimble + hard to hit when desperate). |
| B-V10-4 | `iron_vein` duplicates `rust_blooded` core effect | Canonical `effectHash` found identical `{defMod:1, enduranceMult:0.9}` (`iron_vein` had extra `fightPlanMod` + synergies). | `rust_blooded` now `enduranceMult:0.85` (deeper exhaustion immunity). |

---

## 4. Architectural verdicts

- **#1017 reject rationale:** The refactor extracts a one-line multiplication
  into a helper and duplicates a docstring. It is behavior-identical churn with
  no arena delivered, so it conflicts with the PR's own title/body. Rejected.
- **Arena event system is dormant v2 config:** `ARENA_EVENTS`/`getEventsForArena`
  have zero production consumers; the file header explicitly labels events as
  "narrative-only for v1; mechanical effects for v2". The V10 events are added
  as dormant data only, consistent with existing entries. No wiring into combat
  resolution was attempted — that would be a new feature, not consolidation.
- **Cap repin is a ceiling adjustment, not a balance overhaul:** The union adds
  4 venues, so the existing hard ceilings are raised. Actual registered count
  (53) sits below the new ceilings, leaving headroom. This mirrors the V9
  precedent (`0feed447`).
- **Canonical `effectHash` is now a real guard:** The previous `JSON.stringify`
  implementation only detected duplicates when key insertion order happened to
  match, which is why 3 pairs of genuinely identical effects survived. Sorting
  keys before serialization makes the dedupe guard correct.

---

## 5. Gate matrix (recorded at end of V10 pass)

| Gate | Result | Notes |
| --- | --- | --- |
| `type-check` | ✅ green | `bun run type-check` passes. |
| `lint` | ✅ green | `eslint .` passes with 0 errors. |
| Vitest default | ✅ green | 752 test files, 8577 tests passed, 2 skipped. |
| Bun test (sharded) | ✅ green | All shards passed via CI-equivalent loop. |
| Vite build | ✅ green | `bun run build` passes. |
| Electron compile | ✅ green | `bun run electron:compile` passes. |
| Narrative validate | ✅ green | `bun run narrative-validate` passes. |
| Vitest slow suite | ✅ green | 28 test files, 188 tests passed. |
| Coverage vitest | ✅ green | `bun x vitest run --coverage --reporter=dot` passes with v8 thresholds. |
| Playwright e2e (Chromium) | ✅ green on CI | Local seasonal-tournament spec timed out identically on `pre-megaplan-v10` → pre-existing local-environment flakiness. CI run `37116138933` passed 9/9. |
| UI-audit-scan | ✅ 0 hits | No token-violation, screaming-copy, motion, RNG, or fake-chrome hits. |
| Orphan-scan | ✅ 0 unreachable pages | No orphan routes detected. |
| Data-array-dup-scan | ✅ clean | No duplicate data-array entries. |
| Test-audit-scan | ⚠️ pre-existing baseline | Only flag is `tacticsAdvisorBridge.test.ts` missing JSDOM pragma, already recorded in `auditBaseline.json` before V10. |
| `dupes` / jscpd | ✅ report-only | `--exit-code 0`; only small pre-existing blocks remain. |

---

## 6. Artifact strip list

- `.claude/backups/narrative/lore/deprecated_lore.md` (from #1020)
- `.claude/backups/narrative/removed_narrative.json` (from #1021)
- `.jules/palette.md` (from #1022)
- `src/constants/arena/arenaEvents.ts` (consolidated into root module)

---

## 7. Integration commits (test-first order)

1. `47fd1d54` test: V10 gate — scouting focus-visible a11y contracts (red for #1022)
2. `31ea7930` feat: focus-visible ring on scouting selection buttons (lands #1022)
3. `590935ea` test: V10 gate — narrative union invariants + thin-category floors (red for #1021)
4. `95a70de7` content: combat narrative curation +26/−32 (lands #1021)
5. `72ab761f` test: V10 gate — orphan_scavenger + lore/arena-lore specs (red for #1020)
6. `15ddfe62` content: orphan_scavenger trait + lore/arena-lore union (lands #1020)
7. `49973635` test: V10 gate — arena union specs + cap pins + orphan-event invariant (red for #1018/#1019)
8. `35f37fee` feat: V10 arena union — 4 venues, 4 events, weather synergies, tag badges (lands #1018+#1019)
9. `30811e26` test: canonicalize trait effectHash — key-order-insensitive dupe guard
10. `f7f6195a` fix: differentiate 3 latent duplicate trait effects
11. `b8ceda9d` test: salvage personalityDraft spec from wip/living-rival-world
12. `c34ea89e` test: salvage livingWorld.slow.test.ts — adapt weeks 1000→200
13. `0c4bcfab` test: repoint ARENA_EVENTS import to unified path (red for C12 consolidation)
14. `7094692f` refactor: consolidate split arena event files into `@/constants/arenaEvents`
15. `5a4e4db0` test: ArenaHazardBadges component spec + ArenaDetail badge coverage
16. `acce1cbe` refactor: extract shared ArenaHazardBadges component
17. `c7b21d4d` style: add JSDoc to ArenaHazardBadges
18. `057b34ad` chore: regenerate test-audit baselines for new specs

Final CI results:
- Code push (`7b3cae14`) → run `37116138933` — 9/9 green (~28m).
- Docs update push (`f1857ac6`) → run `37117750323` — 9/9 green (~25m).
Jobs: lint, type-check, bun-test (sharded), electron:compile, vitest default, vite build, slow vitest, playwright e2e (chromium), coverage.

---

## 8. Branch cleanup record

| Branch | Action | Status |
| --- | --- | --- |
| `feature/add-forsaken-bog-arena-12299480434468563509` (#1017) | close PR, delete remote | ✅ done |
| `jules-arena-architect-5441102121484693603` (#1018) | close PR, delete remote | ✅ done |
| `feat/new-arenas-6316601110013621996` (#1019) | close PR, delete remote | ✅ done |
| `narrative-content-expansion-12261878026456190493` (#1020) | close PR, delete remote | ✅ done |
| `jules-11124804984749789547-9f5700b0` (#1021) | close PR, delete remote | ✅ done |
| `ux/scouting-focus-visible-14683235908963971442` (#1022) | close PR, delete remote | ✅ done |
| `origin/bolt/optimize-useshallow-5591841664083074347` | delete remote | ✅ done |
| `origin/narrative-content-expansion-14508848799275203441` | delete remote | ✅ done |
| `wip/living-rival-world` (local) | delete after salvage verified | ✅ done |
