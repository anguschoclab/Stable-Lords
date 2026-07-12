# Codebase Audit: Stubs, Dead Code, and Unwired Features

## Summary

Deep dive through the entire `src/` tree identifying scaffolded, stubbed, dead, and not-wired-in code. Findings are categorized by severity and actionability.

---

## 1. Redirect-Only Route Stubs (Low — intentional aliases)

Entire navigation hubs under `/command/` and `/ops/` are redirect-only stubs pointing to `/stable/` equivalents. These appear to be planned navigation restructures that were never built out. They are harmless but represent dead route files.

### `/command/` hub (6 files — all redirect to `/stable/`)

| Route file                        | Redirects to       |
| --------------------------------- | ------------------ |
| `src/routes/command/index.tsx`    | `/stable`          |
| `src/routes/command/arena.tsx`    | `/stable/arena`    |
| `src/routes/command/combat.tsx`   | `/stable/arena`    |
| `src/routes/command/roster.tsx`   | `/stable/roster`   |
| `src/routes/command/training.tsx` | `/stable/training` |
| `src/routes/command/tactics.tsx`  | `/stable/planner`  |

### `/ops/` hub (8 files — all redirect to `/stable/`)

| Route file                     | Redirects to        |
| ------------------------------ | ------------------- |
| `src/routes/ops/index.tsx`     | `/stable`           |
| `src/routes/ops/overview.tsx`  | `/stable/roster`    |
| `src/routes/ops/roster.tsx`    | `/stable/roster`    |
| `src/routes/ops/recruit.tsx`   | `/stable/recruit`   |
| `src/routes/ops/finance.tsx`   | `/stable/finance`   |
| `src/routes/ops/equipment.tsx` | `/stable/equipment` |
| `src/routes/ops/contracts.tsx` | `/stable/bouts`     |
| `src/routes/ops/personnel.tsx` | `/stable/trainers`  |
| `src/routes/ops/offseason.tsx` | `/stable/offseason` |
| `src/routes/ops/promoters.tsx` | `/stable/promoters` |

### Other redirect stubs

| Route file                          | Redirects to      |
| ----------------------------------- | ----------------- |
| `src/routes/world/intelligence.tsx` | `/world/scouting` |
| `src/routes/run-round.tsx`          | `/stable/arena`   |

**Action**: Leave as-is. These are harmless URL aliases. The `HUBS` navigation config in `navigationShared.tsx` only exposes `stable`, `world`, and `bookmarks` hubs — `/command/` and `/ops/` are not surfaced to users.

---

## 2. Dead Code — `AIBoutService` (Critical — fully duplicated, remove)

**File**: `src/engine/matchmakingServices.ts:81-140`

`AIBoutService` exports two methods that are **never called** anywhere in production code:

- **`updateWarriorRecord`** — Duplicated by `src/engine/bout/warriorStateUpdater.ts` which has identical logic (career wins/losses/kills + byArena tracking). The live code uses `warriorStateUpdater.ts` via `boutProcessorService.ts`.
- **`generateRivalryNarrative`** — Duplicated by `src/engine/rivals/rivalUtils.ts:generateRivalryNarrative` which has the same templates (with emoji). The live code uses `rivalUtils.ts` via `rivals/index.ts`.

**`MatchScoringService`** in the same file IS used (by `rivalryLogic.ts`), so only `AIBoutService` should be removed.

**Action**: Remove `AIBoutService` from `matchmakingServices.ts`. Keep `MatchScoringService`.

---

## 3. Dead Code — `planBias.ts` (Critical — unique logic, should be wired in)

**File**: `src/engine/planBias.ts` (entire file, 70 lines)

Two exported functions, **never imported in production code** (only in `test/engine/planBias.test.ts`):

### `autoTuneFromBias(plan, bias)`

Maps a strategic "bias" string (`head-hunt`, `hamstring`, `gut`, `guard-break`, `balanced`) to fight plan adjustments (target zone, kill desire, OE/AL, tactic suggestions). This is **unique logic** — the AI plan generator (`coreGenerator.ts`) sets `target` via `getAITarget` in `levers.ts` using personality/intent, but has no concept of the bias presets. This could be surfaced as player-facing quick presets in the PlanBuilder UI.

### `reconcileGearTwoHanded(draft, equipment)`

Removes shield when a two-handed weapon is equipped. This logic is **partially duplicated** inline in `EquipmentLoadout.tsx:55-58` (`handleSlotChange`), but `planBias.ts` version works on `Partial<FightPlan>` drafts rather than the loadout UI. The AI plan generator does NOT call this — AI plans could theoretically have shield + two-handed weapon conflicts.

**Action**: Wire `autoTuneFromBias` into the AI plan generator as a post-processing step, and call `reconcileGearTwoHanded` in `coreGenerator.ts` to prevent invalid AI loadouts. Alternatively, surface `autoTuneFromBias` as UI quick-presets in PlanBuilder.

---

## 4. No-Op Telemetry (Low — infrastructure ready, never activated)

**File**: `src/engine/telemetry.ts`

`setTelemetryProvider()` is exported but **never called** anywhere in the codebase. The `globalProvider` remains `noopProvider` forever, meaning all `telemetry.timing()`, `telemetry.increment()`, and `telemetry.gauge()` calls are silent no-ops.

The telemetry calls themselves ARE wired in (`timeAdvance/service.ts` calls `telemetry.timing` and `telemetry.increment`), but the provider is never installed. This is infrastructure that was built but never connected to a real backend.

**Action**: Leave as-is. This is intentionally extensible infrastructure. A real provider can be plugged in later without changing call sites.

---

## 5. Audio Placeholder Stubs (Medium — components render null, no sound)

### `src/components/arena/audio/WeatherAudio.tsx`

- Renders `null` — no audio playback
- Two `useEffect` hooks contain `// Audio crossfade placeholder — implement actual playback here` and `// Volume update placeholder — implement actual playback here`
- Has full weather→ambience sound mapping table (60+ weather types) but never plays anything

### `src/components/arena/audio/CrowdAudio.tsx`

- Renders `null` — no audio playback
- `useEffect` contains `// Audio placeholder — implement actual playback here`
- Has crowd state→sound mapping table but never plays anything

Both are imported by `ArenaAudio.tsx` which is imported by `ArenaView.tsx` — they are wired into the component tree but produce no output.

**Action**: Implement actual audio playback using the existing `audioManager` (`src/lib/AudioManager.ts`), or remove the components if ambient weather/crowd audio is not planned.

---

## 6. Hardcoded Fake Metric (Critical — UI lies to user)

**File**: `src/components/PlanBuilder.tsx:142`

```tsx
<span>Simulation Accuracy: 94.2%</span>
```

This is a **fabricated static string** displayed to the user as if it were a real metric. It never changes and has no backing calculation.

**Action**: Remove this line, or replace with a real computed value if one exists.

---

## 7. Placeholder RNG in Simulation Init (Non-issue — overwritten by caller)

**File**: `src/engine/simulate/initialization.ts:119`

```ts
rng: () => 0, // Placeholder, will be set by caller
```

The `rng` field is initialized to a no-op `() => 0` but is overwritten by the caller before use. This is a defensive default, not a stub.

**Action**: No action needed. The comment is accurate — the caller sets the real RNG.

---

## 8. Intentional Scaffold — Rival Startup Roster (Non-issue)

**File**: `src/engine/rivals/rivalStableFactory.ts:5-12`

Documented "catch-up scaffold" where startup rivals use `biasedAttrs` instead of the shared recruit pool. This is explicitly audited and intentional — ongoing rival recruitment goes through the proper pipeline.

**Action**: No action needed. Well-documented design decision.

---

## 9. Temporary Test Harnesses (Low — not production code)

### `src/scripts/emergent-report.test.ts`

Self-described as "Temporary deep-instrumentation harness: runs a long headless sim and prints an emergent-behavior report. Not a real test."

### `src/scripts/simulation.test.ts`

Minimal test wrapper around `simulation-harness.ts`.

### `src/scripts/simulation-harness.ts`

Used only by the above two test files and one slow integration test.

**Action**: Leave as-is. These are dev/diagnostic tools, not shipped code.

---

## 10. Legacy/Backward-Compatibility Code (Non-issue)

Several files contain "legacy" markers for backward compatibility:

- `src/engine/autosim.ts:309` — `legacyOnProgress` parameter for old call signature
- `src/engine/health.ts:11` — "extracted from the legacy pipeline"
- `src/engine/warrior/careerUpdate.ts:116` — "Legacy-compatible function"
- `src/engine/economy.ts:86` — "unknown/legacy arena id → treat as tier 1"
- `src/engine/tokens/patronTokenService.ts:87` — "Tactical Insight (Legacy)"
- `src/engine/bout/progressionHandler.ts:119` — `void rivalStableId` marker for future use

**Action**: No action needed. These are intentional compatibility bridges.

---

## Priority Actions

| #   | Severity | Item                               | Action                                        |
| --- | -------- | ---------------------------------- | --------------------------------------------- |
| 1   | Critical | `AIBoutService` dead code          | Remove (fully duplicated)                     |
| 2   | Critical | `planBias.ts` dead code            | Wire into AI plan generator or PlanBuilder UI |
| 3   | Critical | Fake "94.2%" metric in PlanBuilder | Remove hardcoded string                       |
| 4   | Medium   | Audio placeholder stubs            | Implement or remove                           |
| 5   | Low      | Redirect route stubs               | Leave as URL aliases                          |
| 6   | Low      | No-op telemetry                    | Leave as extensible infrastructure            |
| 7   | Low      | Test harnesses                     | Leave as dev tools                            |
