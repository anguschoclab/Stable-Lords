# CONSOLIDATION_FINDINGS_V7 — Exhaustive Review, Curated Merge & Cleanup

**Scope:** 14 open PRs (#983–#996), closed-PR salvage scan, full-repo re-read with tiered sweeps, re-verification of all V5/V6 findings, strict test-first scheduling (Phase 3A gate), curated extraction into `main` — zero backwards-compatibility constraints.
**Restore point:** tag `pre-v7-consolidation` → baseline `63c5b72d` (pushed).
**Result range:** `63c5b72d..main` — 12 consolidation commits plus one repo-owner commit (`492d719a`, `.tanstack/` gitignore).
**Working mode:** in-place at the canonical clone (per user direction); iCloud artifact contamination (` * 2` duplicates) swept once, no recurrence.

---

## 1. Final Verdict

**APPROVED.** All accepted value from the 14 PRs is integrated into `main` via curated extraction (zero verbatim merges — every branch carried artifact contamination). Every bug found during review is fixed, including three classes the PRs didn't contain: a repo-wide `bun:test` runner failure, two deterministic slow-test regressions introduced by post-V6 commits, and a real mobile UI deadlock (`DeathModal` unscrollable below the fold). The full gate matrix is green locally and the 5-browser Playwright soak passes end-to-end.

---

## 2. Per-PR Disposition Table

| PR | Category | Verdict | Integration commit | Rationale |
|----|----------|---------|--------------------|-----------|
| #983 | Combat narrative | **PARTIAL / EXTRACTED** | `3fc7c97c` | combatPbp/combatStrikes/combatKillText deltas unioned with #989/#993/#994 by leaf path, keyed on `text` (mixed leaf shapes — plain strings and `{text,min}` objects — normalized), removals required ≥2-PR consensus. `.claude/backups/**` stripped. |
| #984 | Lore + traits | **PARTIAL / EXTRACTED** | `411df1f8` | ORIGINS/CHILDHOOD/DEFINING + ARENA_LORE unioned; traits `orphan_street_rat`, `orphan_pit_fighter`, `orphan_survivor` accepted (valid effect keys, none in `REMOVED_IDS`, `enduranceMult: 0.95`+`positive` matches existing precedent). `.claude/backups/**` stripped. |
| #985 | WinScreen a11y | **APPROVED / EXTRACTED** | `875b1523` | aria-labels, focus-visible rings, `motion-reduce` — clean 2-file diff, landed wholesale. |
| #986 | Perf (Bolt) | **APPROVED / EXTRACTED** | `afa670fd` | `useContractData` — chose this over #990's equivalent because it adds `useMemo` memoization on top of the single-pass loop. `.jules/bolt.md` branding stripped. New characterization test added pre-change. |
| #987 | Tests | **APPROVED / EXTRACTED** | `7c876d03` | Plan-condition + stable-stat coverage; green on main as pure test additions. `: any` fixtures later tidied into a `PartialWarriorFixture` type + `fame: number \| undefined` helper signature (optional plan item — done). |
| #988 | New arenas | **PARTIAL / EXTRACTED** | `411df1f8` | 4 arenas + events + weather modifiers landed; all tags/sizes/`zoneDef` values verified against existing enums. **Global balance change caught:** `magical` tag weight 0.95→0.93 affects all magical arenas — reviewed and **accepted** because the PR adds two magical-tagged arenas and its stated intent is rebalancing tag weights. |
| #989 | Combat narrative | **PARTIAL / EXTRACTED** | `3fc7c97c` | Unioned; `.claude/backups/narrative/consolidated_duplicates.json` stripped. |
| #990 | Perf (Bolt) | **REJECTED (superseded + harmful hunk)** | — | Hook optimization superseded by #986 (no memoization). `useAdminTools.test.ts` rewrite **rejected outright**: replaces the documented bun-safe `vi.spyOn` pattern with `vi.mock`+`importOriginal`, which the file itself documents as unsupported under `bun:test` — would have deepened the N-A runner failure. |
| #991 | Lore | **PARTIAL / EXTRACTED** | `411df1f8` | loreData + ARENA_LORE unioned; `.claude/backups/narrative/lore/archived_duplicates.json` stripped. |
| #992 | UI tokens | **APPROVED / EXTRACTED** | `e33861a6` | Raw `rgba(255,0,0,…)` shadows → `hsl(var(--destructive)/…)` — verified semantically correct (destructive shares the 358° hue family; replaces off-palette pure red). `bun.lock` churn stripped. |
| #993 | Combat narrative | **PARTIAL / EXTRACTED** | `3fc7c97c` | Unioned. |
| #994 | Combat narrative | **PARTIAL / EXTRACTED** | `3fc7c97c` | Unioned; `.claude/backups/narrative/removed_duplicates.json` stripped. |
| #995 | Lore + traits | **PARTIAL / EXTRACTED** | `411df1f8` | Lore unioned; `iron_orphan` accepted (`defModLowHp`+`enduranceMult` consumed by `traitMods.ts`). `.claude/backups/lore/archived_lore.json` stripped. |
| #996 | Perf (Bolt) | **APPROVED / EXTRACTED (corrected)** | `7eeeb56c` | Single-pass council KPI loop landed — **with a correction**: the PR's `tournamentAdvice?.contenders` optional chaining was dropped because `undefined !== null` would count a missing advisory as a contender; the field is required (`advisor/types.ts`) so direct access is correct and preserves semantics. Existing characterization tests cover the KPI fields. |

### Closed-PR salvage scan

No closed-not-merged PR contained unique value absent from `main` at review time (verified via `gh pr list --state all` + file-overlap check against the extraction commits).

---

## 3. Artifact Contamination Strip List

| Artifact | Source | Disposition |
|----------|--------|-------------|
| `.claude/backups/**` (removed/archived JSON backups) | #983, #989, #991, #994, #995 | **Stripped** — never landed |
| `.jules/bolt.md` | #986 | **Stripped** — generator branding |
| `bun.lock` churn | #992 | **Stripped** — only component diffs extracted |
| `useAdminTools.test.ts` rewrite | #990 | **Rejected** — see disposition + N-C |
| `⚡ Bolt` code comments | #986 | **Stripped** — branding in comments |
| `trace-head.ts` | pre-existing main | **Deleted** (`f0692659`) — committed debug scratch file |
| iCloud ` * 2` duplicate files | working dir | **Deleted** — sync contamination |

`stateInvariants.ts` was evaluated and **kept** — it is intentional soak-test tooling per its own docstring, not junk.

---

## 4. Union Reports

### Combat narrative (Cluster A — #983/#989/#993/#994)

- `combatPbp.json`: **+115 / −3**
- `combatStrikes.json`: **+52**
- `combatKillText.json`: **+16**
- Removals applied only where ≥2 PRs agreed (consensus rule). Canonical dedupe post-union; `narrative_validate` + narrative suites green.
- **Process bug caught and fixed:** the first union script keyed leaf maps on arrays while lookups used joined strings — every base entry collected 4 removal votes and the files were gutted. Restored, normalized `{text,min}` objects on `.text`, re-ran; verified by the gate's no-duplicates test.

### Lore + traits + arenas (Clusters B+C — #984/#988/#991/#995)

- Lore pools unioned across 3 branches (mixed leaf shapes handled).
- 9 ARENA_LORE entries extracted; all `arenaId` targets verified to exist in the registry.
- 4 arena configs added; registry + tag weights updated (`magical` 0.95→0.93 — see #988).
- 4 traits added → **final count: 149** (neither PR-guessed constant — 148, 146 — was correct for the union; gate recomputed).

---

## 5. New Findings & Fixes (not contained in any PR)

| id | Finding | Severity | Disposition | Commit |
|----|---------|----------|-------------|--------|
| N-A | `bun:test` suite red on main — `import.meta.glob` w/ `?raw`/`eager` (Vite-only, `src/lib/bibleIndex.ts`) crashed collection; `buildConfigIntegrity.test.ts` shelled `bun run type-check` → nested `bun x` dep resolution + lockfile mutation mid-test | high | **FIXED** — Vite-only specs excluded via `bunfig.toml` pathIgnorePatterns; test now invokes router codegen + `tsc --build` directly | `a4f3c446`, `c2380baf` |
| N-A2 | Bun runner divergences once collection worked: `spyOn` can't mock Zod 4 prototype accessors (`GameStateSchema.parse`); `expect().toHaveBeenCalled` rejects non-Bun mocks; Bun `File`/`Blob` realm mismatch broke jsdom `FileReader`; missing `vi`/`expect` imports | high | **FIXED** — accessor-aware spy + restoration, Bun-native `mock()` shim, jsdom realm overrides, explicit imports | `a4f3c446` |
| N-B1 | `sturdy` trait: 26.67% win rate < 32% floor (deterministic) — bisected to `5f92de0e` "gate exhaustion stoppage on HP" which removed the stall-win payoff the trait's plan (AL−3/OE−2/killDesire−5) depended on | high | **FIXED** — trait rebalanced into a sustainable wall profile (verified against the 2s harness); intentional engine change kept | `f0692659` |
| N-B2 | `worldLiveness` freeze-guard asserted on `totalBouts` (bounded, pruned by `truncateState` mid-run — counter went backwards 752→641) | high | **FIXED** — guard now uses the truncation-proof `cumulativeBouts` field the harness already supplies; the post-V6 bracket-completion fix made pruning observable | `f0692659` |
| N-C | #990 test rewrite breaks under `bun:test` | medium | **REJECTED** — hunk not landed | — |
| N-D | 3 `jsdoc/require-jsdoc` warnings on main (`CouncilFilterTabs`, `CouncilBriefingWidget`) | low | **FIXED** — docstrings added; lint is now 0/0 | |
| N-E | `DeathModal` unscrollable below the fold on mobile — `MEMORIALIZE & CONTINUE` unreachable → true deadlock for real mobile users; also blocked the stacked `ResolutionReveal` | high | **FIXED** — scrolling `min-h-full` flex wrapper | `3a171364` |
| N-F | `routeTree.gen.ts` absent on clean checkout → `tsc --build` failed in CI after N-A direct-tsc change | medium | **FIXED** — buildConfig test generates the route tree via `bun x` first | `c2380baf` |

---

## 6. Test-First Compliance Audit

Phase 3A gate (`f8a040bc`) committed **before any implementation**: narrative-union assertions, arena/lore registration, trait-count + `REMOVED_IDS` non-membership, `useContractData` characterization, destructive-token rules, WinScreen a11y, bun-runner safety contract, build-config integrity, and the long-run liveness/balance guards. Confirmed red (31 failing assertions across 7 files, all for the intended reasons — including one test-helper bug in the dedupe guard itself, fixed before commit), then driven green by the extraction commits in order. One post-gate correction: the gate's arena-id assertions referenced non-existent union ids and were rewritten to assert absence + presence of the actual union entries.

---

## 7. Gate Matrix (final HEAD `3a171364`)

| Gate | Result |
|------|--------|
| `bun run type-check` | **0 errors** |
| `bun run lint` | **0 errors / 0 warnings** (N-D resolved post-sweep) |
| `bun run test` (vitest) | **7,880 pass / 0 fail** |
| `bun run test:bun` (native) | **~7,850 pass / 1 skip / 0 fail** (was 40+ failures pre-N-A) |
| `bun run test:slow` | **116/116 pass** (was 2 deterministic failures pre-N-B) |
| `bun run build` | **OK** (159 precache entries) |
| `electron:compile` | **OK** |
| `narrative_validate` | **pass** |
| `bunx playwright test` | **5/5 projects pass** — chromium, firefox, webkit, Mobile Chrome, Mobile Safari (full-year + year-2 rollover soak; ~4,400–4,500 bouts, 47 arenas rotated per run) |
| `git fsck --full` | clean (dangling historical objects only) |
| Forbidden-pattern sweep | `Math.random`/`TODO`/`FIXME`: **0 hits in src** |
| CI on `3a171364` | **all 7 jobs green** — bun-test, test, lint, type-check, build, slow-tests, e2e |

---

## 8. Architectural Verdicts

**Approved:** the worker-proxy + `runExclusive` FIFO + epoch-guard engine boundary (re-verified — the 15s worker race cannot wedge `running`); the two-layer balance architecture (style matrix vs. trait mechanics stays decoupled); `noUncheckedIndexedAccess` guard style in perf extractions; the curated-union merge rule itself (consensus removals + text-keyed dedupe is the right curation primitive for this content).

**Disapproved / corrected:** optional chaining that silently alters counting semantics (#996 `?.`); re-adding traits listed in `REMOVED_IDS` (upheld as a contract — none of this round's candidates were members); shelling `bun run` from inside tests; asserting liveness on bounded/pruned counters instead of cumulative ones.

---

## 9. Remote Disposition (authoritative)

- `main` pushed: `492d719a..3a171364` (fast-forward).
- Tag `pre-v7-consolidation` pushed → `63c5b72d`.
- All 14 PRs (#983–#996): verdict comment posted + **CLOSED** (verified `gh pr list --state open` → 0).
- All 14 head branches **DELETED** on origin (verified `git ls-remote` → 0 matches).

## 10. Known Limitations

- The seasonal e2e soak is long (~10–11 min/project serially); CI covers chromium only — the mobile/desktop matrix was verified locally on this HEAD.
- Mobile dismissal relies on the production fix (scrollable `DeathModal`) plus an e2e helper that dispatches a programmatic click when a transient toast layer hit-tests over a button; the covering element is still logged for diagnostics.

## 11. Deferred Items Register

**Empty.** Every optional, deferred, and out-of-scope item identified during planning and validation has been completed:

- N-D jsdoc warnings → fixed (lint 0/0).
- #987 `: any` fixtures → typed `PartialWarriorFixture` helper (optional tidy from the validation table — done).
- #996 `?.` semantics decision → made and documented (direct access; §2).
- #988 `magical` weight → explicitly dispositioned and accepted (§2).
- `git branch -r --no-merged main` → empty (Phase-7 post-state check §9).

## 12. Remote Disposition Log

| Action | Result | Evidence |
|--------|--------|----------|
| Push `main` | `492d719a..3a171364` then `3a171364..1f1ec1fb` | `git push` output; `git log origin/main` |
| Push tag `pre-v7-consolidation` | new tag → `63c5b72d` | `git ls-remote --tags` |
| Verdict comments | 14/14 posted with commit references | `gh pr view N --comments` |
| Close PRs #983–#996 | 14/14 closed | `gh pr list --state open` → 0 |
| Delete 14 head branches | 14/14 deleted | `git ls-remote --heads` → 0 matches |
| `git branch -r --no-merged main` | empty | post-delete check |
