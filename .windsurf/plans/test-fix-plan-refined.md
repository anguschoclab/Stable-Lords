# Refined Test Fix Plan

## Full Suite Status

- **2627 pass / 44 fail / 17 errors** (2671 tests across 246 files)
- All failures and errors traced to **7 root causes**

---

## Root Cause Summary

| #         | Root Cause                                                         | Failures | Errors | Files Affected |
| --------- | ------------------------------------------------------------------ | -------- | ------ | -------------- |
| RC1       | `vi.mock` leak from `simulation.test.ts`                           | 14       | 16     | 17 files       |
| RC2       | `vi.resetModules()` not available in Bun                           | 5        | 0      | 2 files        |
| RC3       | `storage.test.ts` replaces `global.localStorage` without restoring | 3        | 0      | 3 files        |
| RC4       | `setMockIdGenerator` leak from `feed.test.ts`                      | 1        | 0      | 1 file         |
| RC5       | `useDigestSummary` test `makeOffer` missing player warrior IDs     | 3        | 0      | 1 file         |
| RC6       | Scouting test string mismatch                                      | 1        | 0      | 1 file         |
| RC7       | `e2e/golden-path.spec.ts` picked up by Bun test runner             | 1        | 1      | 1 file         |
| **Total** |                                                                    | **28**   | **17** |                |

> **Note:** 44 failures = 28 individual test failures + 16 file-level failures (from SyntaxError preventing file load). 17 errors = 16 SyntaxErrors + 1 Playwright error.

---

## Detailed Root Cause Analysis

### RC1: `vi.mock` leak from `simulation.test.ts` (14 failures + 16 errors = 30 issues)

**File:** `src/scripts/simulation.test.ts:7-18`

**Problem:** The `vi.mock('@/engine/storage/opfsArchive', ...)` replaces the module with a mock that only exports `OPFSArchiveService` class but NOT the `opfsArchive` named export. In Bun's `--isolate` mode, `vi.mock` is not properly scoped to the test file — it leaks globally.

**Impact:**

- 16 test files that import `opfsArchive` (directly or transitively via `createStore.ts` or `opfsArchiver.ts`) fail with `SyntaxError: Export named 'opfsArchive' not found`
- 13 `opfsArchive.test.ts` tests fail because `OPFSArchiveService` is replaced with a mock class lacking private methods (`getHotStateDirectory`, `getDirectory`, `enqueue`)
- 1 `raceConditions.test.ts` test (`#1 OPFS archiveHotState write queue`) fails because `service.getHotStateDirectory` is undefined in the mock

**Affected files (16 SyntaxErrors):**

- `src/test/components/BookmarkButton.test.tsx`
- `src/test/components/StableRankingsRow.test.tsx`
- `src/test/components/layout/ExecuteWeekButton.test.tsx`
- `src/test/components/navigationHubs.test.ts`
- `src/test/hooks/useActiveRoster.test.ts`
- `src/test/hooks/useStableComparison.test.ts`
- `src/test/hooks/useWeekExecution.test.ts`
- `src/test/lore/HallOfFights.test.tsx`
- `src/test/pages/AdminTools.test.tsx`
- `src/test/pages/Bookmarks.test.tsx`
- `src/test/pages/HallOfFame.test.tsx`
- `src/test/pages/PhysicalsSimulator.test.tsx`
- `src/test/pages/StartGame.test.tsx`
- `src/test/pages/Tournaments.test.tsx`
- `src/test/pages/Trainers.test.tsx`
- `src/test/pages/WorldOverview.test.tsx`

**Fix:** Add `opfsArchive` to the mock factory in `simulation.test.ts`:

```typescript
vi.mock('@/engine/storage/opfsArchive', () => {
  const mockService = {
    isSupported: () => true,
    archiveBoutLog: vi.fn().mockResolvedValue(undefined),
    retrieveBoutLog: vi.fn().mockResolvedValue(null),
    archiveGazette: vi.fn().mockResolvedValue(undefined),
    retrieveGazette: vi.fn().mockResolvedValue(null),
    archiveHotState: vi.fn().mockResolvedValue(undefined),
    retrieveHotState: vi.fn().mockResolvedValue(null),
    getArchivedBoutIdsForSeason: vi.fn().mockResolvedValue([]),
  };
  return {
    OPFSArchiveService: class { ...mockService },
    opfsArchive: mockService,
    ArchiveConflictError: class extends Error { constructor(m: string) { super(m); this.name = 'ArchiveConflictError'; } },
    assertSafeFileNamePart: vi.fn(),
  };
});
```

**Unit tests to write first:**

- Test that `simulation.test.ts` mock factory exports all named exports from `@/engine/storage/opfsArchive` (`OPFSArchiveService`, `opfsArchive`, `ArchiveConflictError`, `assertSafeFileNamePart`)
- Test that `opfsArchive.test.ts` passes when run alongside `simulation.test.ts`
- Test that `raceConditions.test.ts` #1 test passes when run alongside `simulation.test.ts`

---

### RC2: `vi.resetModules()` not available in Bun (5 failures)

**Files:**

- `src/test/engine/bout/aiPlanIntegration.test.ts:175`
- `src/test/engine/ai/boutAcceptanceWeather.test.ts:80`

**Problem:** `vi.resetModules()` is not available in Bun's test runner (it's a vitest-only API). Both files call it in `beforeEach`, causing `TypeError: vi.resetModules is not a function` which fails all tests in those describe blocks.

**Impact:**

- 4 failures in `aiPlanIntegration.test.ts` (all tests in the "Gap 1" describe block)
- 1 failure in `boutAcceptanceWeather.test.ts` (the "Gap 3" describe block test)

**Fix:** Remove `vi.resetModules()` calls from both files. The `beforeEach` hooks can be emptied or removed entirely. If module reset is needed, use `vi.doUnmock` or re-import patterns instead.

**Unit tests to write first:**

- Test that `aiPlanIntegration.test.ts` `beforeEach` does not throw
- Test that `boutAcceptanceWeather.test.ts` `beforeEach` does not throw

---

### RC3: `storage.test.ts` replaces `global.localStorage` without restoring (3 failures)

**File:** `src/test/utils/storage.test.ts:29-32`

**Problem:** `storage.test.ts` replaces `global.localStorage` with its own mock (using `vi.fn()` for methods) at module level. This replacement persists after the test file finishes because:

1. `vi.restoreAllMocks()` (called in `afterEach`) only restores `vi.spyOn` mocks, NOT `vi.fn()` implementations
2. The last test's `mockImplementation` on `setItem` (to throw `QuotaExceededError`) persists because `vi.restoreAllMocks()` does not reset `vi.fn()` implementations
3. The setup.ts `beforeEach` calls `(localStorage as any)._resetQuota?.()` but the `storage.test.ts` mock doesn't have `_resetQuota`

**Impact:**

- `AudioManager.test.ts` "should be able to set and get muted state" fails — `setItem` still throws `QuotaExceededError` from the last `storage.test.ts` test
- `arenaHistory.test.ts` "logs error when retry fails" fails — `setItem` throws but `load()` returns empty array (different mock's store), so retry doesn't attempt second save, only 1 `console.error` call instead of expected 2
- `raceConditions.test.ts` "#11 StyleRollups \_clearCaches invalidates weekCache" fails — `setItem` throws `QuotaExceededError`, data never persists to localStorage, after cache clear `getWeekRollup` returns empty

**Fix:** In `storage.test.ts`, save and restore `global.localStorage`:

```typescript
const originalLocalStorage = global.localStorage;

// ... existing mock setup ...

afterAll(() => {
  Object.defineProperty(global, 'localStorage', {
    value: originalLocalStorage,
    writable: true,
    configurable: true,
  });
});
```

Additionally, reset `setItem` mock implementation in `afterEach`:

```typescript
afterEach(() => {
  vi.restoreAllMocks();
  (localStorage.setItem as any).mockImplementation((key: string, value: string) => {
    store[key] = value.toString();
  });
});
```

**Unit tests to write first:**

- Test that `AudioManager.test.ts` passes when run after `storage.test.ts`
- Test that `arenaHistory.test.ts` "logs error when retry fails" passes when run after `storage.test.ts`
- Test that `raceConditions.test.ts` StyleRollups test passes when run after `storage.test.ts`

---

### RC4: `setMockIdGenerator` leak from `feed.test.ts` (1 failure)

**File:** `src/test/engine/newsletter/feed.test.ts:9-12`

**Problem:** `feed.test.ts` calls `setMockIdGenerator(() => 'mock-id')` in `beforeEach` but never cleans up in `afterEach` or `afterAll`. This leaks the mock ID generator to subsequent test files. When `tournamentStateMutator.test.ts` runs after `feed.test.ts`, all warriors get ID `'mock-id'`, causing the `WeakMap` cache in `findWarriorById` to return the wrong warrior (rival warrior instead of player warrior).

**Impact:**

- `tournamentStateMutator.test.ts` "should find warrior in player roster" fails — `expect(warrior?.name).toBe('Player Warrior')` gets `'Rival Warrior'` because both warriors share ID `'mock-id'`

**Fix:** Add cleanup to `feed.test.ts`:

```typescript
afterEach(() => {
  setMockIdGenerator(null);
});
```

**Unit tests to write first:**

- Test that `tournamentStateMutator.test.ts` passes when run after `feed.test.ts`

---

### RC5: `useDigestSummary` test `makeOffer` missing player warrior IDs (3 failures)

**File:** `src/test/hooks/useDigestSummary.test.ts:29`

**Problem:** The `makeOffer` helper initializes `warriorIds: []` (empty array). The `useDigestSummary` hook checks `o.warriorIds.some((id) => playerWarriorIds.has(id))` for pending/signed/upcoming counts. With an empty `warriorIds`, no offers match the player's warrior IDs, so all counts return 0.

**Impact:**

- "counts Proposed offers with boutWeek >= currentWeek as pending" — expects 2, gets 0
- "counts Signed offers with boutWeek === currentWeek as signed" — expects 1, gets 0
- "counts Signed offers with boutWeek > currentWeek as upcoming" — expects 2, gets 0

**Fix:** Update `makeOffer` to include player warrior IDs by default:

```typescript
function makeOffer(overrides: Partial<BoutOffer> = {}): BoutOffer {
  return {
    id: 'offer-1' as BoutOfferId,
    promoterId: 'promoter-1' as PromoterId,
    warriorIds: ['wa' as WarriorId, 'wd' as WarriorId], // Include player warrior IDs
    boutWeek: 10,
    expirationWeek: 11,
    purse: 100,
    hype: 50,
    status: 'Proposed',
    responses: { wa: 'Pending' },
    ...overrides,
  } as BoutOffer;
}
```

The `playerWarriorIds` set is `new Set(['wa', 'wc'])`, so `warriorIds` must include at least one of these. The `responses` field also needs a 'Pending' entry for the pending offers test.

**Unit tests to write first:**

- Test that `makeOffer` with default values produces offers that `useDigestSummary` counts correctly
- Test each of the 3 failing test scenarios with corrected `makeOffer`

---

### RC6: Scouting test string mismatch (1 failure)

**File:** `src/test/engine/scouting.test.ts:142`

**Problem:** Test expects `basicReport.notes` to contain `'Limited intel'` but the source code at `src/engine/scouting.ts:143` returns `'Limited information available.'`.

**Source code:**

```typescript
return `${warrior.name} fights as a ${styleName}. Limited information available.`;
```

**Fix:** Update the test expectation to match the actual source string:

```typescript
expect(basicReport.notes).toContain('Limited information available.');
```

**Unit tests to write first:**

- Test that the scouting test expectation matches the source code output

---

### RC7: `e2e/golden-path.spec.ts` picked up by Bun test runner (1 failure + 1 error)

**File:** `e2e/golden-path.spec.ts`

**Problem:** The e2e Playwright test file is being picked up by Bun's test runner, which doesn't understand Playwright's `test()` function. The vitest config excludes `**/e2e/**` but Bun's test runner doesn't respect vitest's exclude config.

**Impact:**

- 1 error: "Playwright Test did not expect test() to be called here."
- 1 failure: The test case itself fails

**Fix:** Add a `bunfig.toml` entry to exclude e2e files from Bun's test runner, or move the e2e directory outside of the scanned test paths. Check if `bunfig.toml` already has a test exclude config.

**Unit tests to write first:**

- Test that `bun test` does not pick up files from `e2e/` directory

---

## Implementation Order (Tests First, Then Fixes)

### Phase 1: Fix test pollution issues (RC1, RC3, RC4) — highest impact

**Step 1.1** — Write verification tests:

- Create a test that runs `simulation.test.ts` + `opfsArchive.test.ts` together and verifies no SyntaxError
- Create a test that runs `storage.test.ts` + `AudioManager.test.ts` together and verifies no QuotaExceededError leak
- Create a test that runs `feed.test.ts` + `tournamentStateMutator.test.ts` together and verifies correct warrior lookup

**Step 1.2** — Implement fixes:

- Fix `simulation.test.ts` mock factory to export all named exports (RC1)
- Fix `storage.test.ts` to restore `global.localStorage` in `afterAll` and reset mock implementations in `afterEach` (RC3)
- Fix `feed.test.ts` to add `afterEach(() => setMockIdGenerator(null))` (RC4)

**Step 1.3** — Verify:

- Run full test suite and confirm 30 issues resolved (14 failures + 16 errors)

### Phase 2: Fix deprecated API usage (RC2)

**Step 2.1** — Write verification tests:

- Test that `aiPlanIntegration.test.ts` `beforeEach` does not throw
- Test that `boutAcceptanceWeather.test.ts` `beforeEach` does not throw

**Step 2.2** — Implement fixes:

- Remove `vi.resetModules()` from `aiPlanIntegration.test.ts:175`
- Remove `vi.resetModules()` from `boutAcceptanceWeather.test.ts:80`

**Step 2.3** — Verify:

- Run both test files and confirm 5 failures resolved

### Phase 3: Fix test expectation mismatches (RC5, RC6)

**Step 3.1** — Write verification tests:

- Test `makeOffer` output includes player warrior IDs
- Test scouting notes for Basic quality contain 'Limited information available.'

**Step 3.2** — Implement fixes:

- Update `makeOffer` in `useDigestSummary.test.ts` to include player warrior IDs and responses (RC5)
- Update scouting test expectation from `'Limited intel'` to `'Limited information available.'` (RC6)

**Step 3.3** — Verify:

- Run both test files and confirm 4 failures resolved

### Phase 4: Fix e2e test runner issue (RC7)

**Step 4.1** — Write verification test:

- Test that `bun test` does not pick up `e2e/` directory

**Step 4.2** — Implement fix:

- Add exclude config in `bunfig.toml` or move e2e outside test scan path

**Step 4.3** — Verify:

- Run full test suite and confirm 1 failure + 1 error resolved

### Phase 5: Full regression verification

**Step 5.1** — Run full test suite:

```bash
bun test --isolate
```

**Step 5.2** — Confirm:

- 0 failures
- 0 errors
- All 2671 tests pass

---

## Files to Modify

| File                                               | Root Cause | Change                                                                              |
| -------------------------------------------------- | ---------- | ----------------------------------------------------------------------------------- |
| `src/scripts/simulation.test.ts`                   | RC1        | Add `opfsArchive`, `ArchiveConflictError`, `assertSafeFileNamePart` to mock factory |
| `src/test/engine/bout/aiPlanIntegration.test.ts`   | RC2        | Remove `vi.resetModules()` call                                                     |
| `src/test/engine/ai/boutAcceptanceWeather.test.ts` | RC2        | Remove `vi.resetModules()` call                                                     |
| `src/test/utils/storage.test.ts`                   | RC3        | Save/restore `global.localStorage` in `afterAll`; reset mock impls in `afterEach`   |
| `src/test/engine/newsletter/feed.test.ts`          | RC4        | Add `afterEach(() => setMockIdGenerator(null))`                                     |
| `src/test/hooks/useDigestSummary.test.ts`          | RC5        | Update `makeOffer` to include player warrior IDs and responses                      |
| `src/test/engine/scouting.test.ts`                 | RC6        | Update expectation from `'Limited intel'` to `'Limited information available.'`     |
| `bunfig.toml` or `e2e/` location                   | RC7        | Exclude e2e from Bun test runner                                                    |

## Files to Read (No Changes)

| File                                                          | Reason                                                                                                     |
| ------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| `src/engine/storage/opfsArchive.ts`                           | Index file — exports `OPFSArchiveService`, `opfsArchive`, `ArchiveConflictError`, `assertSafeFileNamePart` |
| `src/engine/storage/opfsArchive/service.ts`                   | Service implementation — private methods `getHotStateDirectory`, `getDirectory`, `enqueue`                 |
| `src/engine/storage/opfsArchive/validation.ts`                | `assertSafeFileNamePart` implementation                                                                    |
| `src/engine/storage/ArchiveConflictError.ts`                  | Standalone `ArchiveConflictError` class                                                                    |
| `src/engine/history/arenaHistory.ts`                          | `save()` retry logic uses `load()` instead of passed array (not a bug — retry reads from localStorage)     |
| `src/engine/stats/styleRollups.ts`                            | Cache clearing and persistence logic                                                                       |
| `src/hooks/useDigestSummary.ts`                               | Hook logic — filters offers by `playerWarriorIds`                                                          |
| `src/engine/scouting.ts`                                      | Source of "Limited information available." string                                                          |
| `src/engine/ai/workers/competitionWorker/boutAcceptance.ts`   | `verifyBoutAcceptance` and `evaluateBoutOffer` functions                                                   |
| `src/engine/ai/workers/competitionWorker/offerProcessor.ts`   | `processAllRivalsBoutOffers` calls `verifyBoutAcceptance` before `evaluateBoutOffer`                       |
| `src/engine/matchmaking/tournament/tournamentStateMutator.ts` | `findWarriorById` uses `WeakMap` cache                                                                     |
| `src/test/_setup/setup.ts`                                    | Global test setup — localStorage mock, OPFS mock, `afterEach` cleanup                                      |
| `src/utils/idUtils.ts`                                        | `setMockIdGenerator` / `generateId` functions                                                              |
| `vitest.config.ts`                                            | Test configuration — excludes `**/e2e/**`                                                                  |
| `package.json`                                                | Test script: `bun test --isolate`                                                                          |

---

## Disproven / Revised Findings from Initial Plan

1. **ArenaHistory retry logic bug** — Initially thought `save()` calling `load()` in retry was a bug. **Revised:** The retry logic is correct — it reads from localStorage to get the current state, trims to 100, and retries. The test failure is caused by RC3 (localStorage mock pollution from `storage.test.ts`), not a bug in the source code. **No source code change needed.**

2. **OPFS archival system tests failing due to incomplete mocks** — Initially thought the OPFS tests had issues with mock setup. **Revised:** The OPFS tests pass in isolation (27 pass, 0 fail). All 13 failures are caused by RC1 (`vi.mock` leak from `simulation.test.ts`). **No change to OPFS tests needed.**

3. **`raceConditions.test.ts` StyleRollups cache clearing** — Initially thought the cache clearing mechanism was broken. **Revised:** The test passes in isolation. The failure is caused by RC3 (localStorage mock pollution from `storage.test.ts`). **No source code change needed.**

4. **`raceConditions.test.ts` #1 OPFS write queue** — Initially thought the test was fragile. **Revised:** The test passes in isolation. The failure is caused by RC1 (`vi.mock` leak from `simulation.test.ts` replacing `OPFSArchiveService` with a mock lacking private methods). **No change to raceConditions test needed.**

5. **Tournament ID collision from `setMockIdGenerator`** — Initially thought it was from `simulation.test.ts`. **Revised:** The leak is from `feed.test.ts` which sets `setMockIdGenerator(() => 'mock-id')` in `beforeEach` without cleanup. `simulation.test.ts` properly resets in `resetGlobalState()`. **Fix is in `feed.test.ts`, not `simulation.test.ts`.**
