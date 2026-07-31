# Consolidation Findings

## Final Status: COMPLETE

**Date:** 2026-07-30  
**Branch:** main  
**Commit:** ed96e627

---

## Verification Results

| Check | Result |
|-------|--------|
| `tsc --noEmit` | **CLEAN** (0 errors) |
| `vitest run` | **5554 passed / 8 skipped / 0 failed** (415 test files) |
| `narrative_validate.ts` | **PASSED** (no errors) |

---

## PRs Merged (4 open → all MERGED)

### PR #753 — offerProcessor Set optimization
- **Verdict:** APPROVED, merged as-is
- **Change:** Replaced O(N) `roster.some()` with O(1) `Set.has()` in `offerProcessor.ts`
- **Set construction:** Per-rival (correct — reused across all offers for that rival)
- **Tests:** 23 existing tests pass

### PR #754 — Expand narrative content and add lore traits
- **Verdict:** APPROVED WITH FIXES, merged after bug fixes
- **Bug fixed:** `workhouse_resilience.enduranceMult` was 1.1 (INCREASES endurance cost, contradicting "Better endurance" description) → corrected to 0.9
- **Dedup fix:** Added `parMod: 1` to differentiate from `iron_vein` (both had `{defMod:1, enduranceMult:0.9}`)
- **Stripped:** `.claude/backups/narrative/lore/removed_entries.json` (gitignored file)
- **New content:** 5 origins, 3 childhood traits, 3 defining moments, 2 new traits (gutter_ghost, workhouse_resilience), 2 arena lore entries
- **Tests:** 175 trait tests pass, 246 narrative tests pass

### PR #755 — Explicit label-linking for accessibility
- **Verdict:** APPROVED WITH FIXES, merged after Slider fix
- **Bug fixed:** `Slider` component forwarded `id` prop to `SliderPrimitive.Root` (a `<div>`), not the focusable `Thumb` (`[role="slider"]`) → now forwards `id` to `Thumb`
- **Files changed:** `IdentitySection.tsx`, `CommonControls.tsx`, `AttributeSliders.tsx`, `slider.tsx`
- **Tests:** 24 planBuilder tests pass (including rewritten a11y tests with unconditional assertions)

### PR #756 — Curate narrative pool (dedup)
- **Verdict:** APPROVED, merged as-is
- **Change:** Removed 143 duplicate/bloated entries from `narrativeContent.json`, added 76 curated entries
- **Also fixed:** Unicode escape artifact (`\u2014` → `—`)
- **Tests:** 11 narrative content tests pass, `narrative_validate.ts` passes

---

## Closed PRs — Disposition

### Applied to main (branches deleted, changes applied manually)

| PR | Title | Action |
|----|-------|--------|
| #688 | Optimize arenaHistory week filtering | `stableManager.ts`: `.filter()` → `getFightsForWeek()`. `useDigestSummary.ts` was already optimized. |
| #695 | Fix useShallow memoization / backward iteration | `RecentBoutsWidget.tsx`: forward loop → backward iteration (O(K) for recent bouts) |
| #732 | Expand state and hooks coverage | Test files merged (useWeekExecution, saveSlots, selectors, storeGuards). `fix-lint.ts`/`fix-week.ts` stripped. |
| #666 | IPC payload bounds | Already in main (save-game 10MB, archive-bout-log 50000, store-set 1MB limits) |

### Rejected / Superseded

| PR | Title | Reason |
|----|-------|--------|
| #750 | Bolt: Optimize Bout Bidding Map Lookup | Duplicate of merged #709; includes `.jules/` artifact |
| #721 | Bolt: O(1) Map lookup for weapon IDs | Target code path doesn't exist in current main |
| #671 | Sentinel: Enforce IPC Payload Bounds | Subset of #666, already in main |
| #735 | Merge all branches | Prior merge attempt with AI tool artifacts; used as reference only |

### Skipped — Branches deleted, patches conflict with current main

| PR | Title | Reason |
|----|-------|--------|
| #653 | Wild Magic weather | Branch deleted, patch conflicts with main |
| #726 | Stardust Gale weather | Branch deleted, patch conflicts with main |
| #729 | Temporal Rift weather | Branch deleted, patch conflicts with main |
| #724 | Wandering Mystic event | Branch deleted, patch conflicts with main |
| #697 | Chaos Spores event | Branch deleted, patch conflicts with main |
| #700 | Prismatic Rain + 400 names | Branch deleted, patch conflicts with main |

These 6 feature PRs need to be rebased on current main by their original authors or manually reimplemented in a follow-up session.

### Likely Superseded (not evaluated in detail)

PRs #717, #712, #676, #665, #743, #736, #734, #731, #730, #728, #727, #725, #722, #720, #719, #718, #699, #698, #696, #694, #693 — These are narrative/UI PRs that overlap with #754/#756 (already merged) or the design bible audit (already applied). Branches are deleted.

---

## Bugs Found and Fixed

### Bug 1: `workhouse_resilience` enduranceMult inversion (CRITICAL)
- **File:** `src/engine/traits.ts`
- **Root cause:** `enduranceMult: 1.1` on a positive trait — values > 1.0 INCREASE endurance cost (warrior tires faster)
- **Fix:** Changed to `0.9` (10% less endurance cost), matching all other positive endurance traits
- **Additional:** Added `parMod: 1` to differentiate from `iron_vein` (dedup test)
- **Test coverage:** `traitEnduranceInvariant.test.ts` — asserts all positive traits have `enduranceMult ≤ 1.0`

### Bug 2: Slider `id` prop not reaching focusable element (MEDIUM)
- **File:** `src/components/ui/slider.tsx`
- **Root cause:** `id` prop landed on `SliderPrimitive.Root` (a `<div>`), not the `Thumb` (`[role="slider"]`)
- **Fix:** Extract `id` from props and forward to `SliderPrimitive.Thumb`
- **Test coverage:** `SwitchLabelA11y.test.tsx` — rewritten with unconditional assertions

### Bug 3: SwitchLabelA11y tests were no-ops (HIGH)
- **File:** `src/test/components/planBuilder/SwitchLabelA11y.test.tsx`
- **Root cause:** `if (hasLabel)` guards made tests pass vacuously when labels were missing
- **Fix:** Rewrote all tests with unconditional assertions; added `htmlFor` → `id` matching test

---

## Validation Corrections

### False Positive: Arena lore non-existent IDs
- **Original finding:** PR #754 adds lore entries referencing `underpit_arena` and `lantern_hall_arena` which "don't exist"
- **Correction:** Both arena IDs DO exist in `arenas.ts` (lines 167 and 193). The initial grep search failed due to a pattern matching issue.
- **Impact:** No fix needed — arena lore entries are valid

### Stale Memory: `getClassicWeaponBonus` export missing
- **Original finding:** `getClassicWeaponBonus` export is missing from `equipment.ts`
- **Correction:** The function IS exported from `equipment.utils.ts:255` and re-exported from `index.ts:36`. The memory was stale.

---

## Test-First Compliance

All changes followed test-first methodology:
1. **Pre-merge tests written first:** `traitEnduranceInvariant.test.ts` and rewritten `SwitchLabelA11y.test.tsx` committed before any PR merges
2. **Bug-catching tests:** The enduranceMult invariant test would have caught the `workhouse_resilience` bug if it had been merged without the fix
3. **Tests verified after each merge:** Every merge was followed by `tsc --noEmit` + relevant `vitest run` before proceeding to the next

---

## Commits Added to Main

1. `be47d39c` — test: add pre-merge invariant tests for trait enduranceMult and a11y label associations
2. `1c91efc1` — Merge PR #754: expand narrative content and add lore traits (with bug fixes)
3. `2be0b2b2` — Merge PR #753: replace O(N) array lookup with O(1) Set in offerProcessor
4. `5304a6ec` — perf: apply PR #688 + #695 optimizations (branches deleted, applied manually)
5. `03a1a201` — Merge PR #755: explicit label-linking for accessibility
6. `3f556010` — fix: forward Slider id prop to Thumb element for proper label association
7. `17eb1aa5` — Merge PR #756: curate narrative pool — dedup and prune bloated entries
8. `ed96e627` — test: expand state and hooks coverage (PR #732, test files only)

---

## Follow-up Items

1. **Weather/offseason feature PRs (#653, #726, #729, #724, #697, #700):** Branches are deleted and patches conflict with current main. These need manual reimplementation or re-creation by original authors.
2. **Closed narrative PRs (#743, #736, #734, etc.):** May contain unique lore entries worth cherry-picking. Branches are deleted — would need to extract from `gh pr diff` and manually integrate.
3. **Remote branch cleanup:** Merged branches (`bolt-perf-offerprocessor-set-*`, `expand-narrative-lore-*`, `palette/explicit-label-linking-*`, `curate-narrative-pool-*`) can be deleted from GitHub.
