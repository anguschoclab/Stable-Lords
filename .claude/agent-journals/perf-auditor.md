# Perf-Auditor Journal

Field structure: **Finding** (site + complexity) / **Rule** (durable lesson) /
**Check** (how to spot it next time).

## 2026-11-22 — Stripped week caches make resolver fallbacks hot

**Finding:** `rivalDraftMeta` (`src/engine/recruitment/draftService.ts`) filtered
all of `arenaHistory` (cap 500) through `resolveWarriorOwner` per fight — and
`createMutableWeekContext` (`weekPipeline/context.ts` `stripWeekCaches`)
removes `warriorToStableMap` before the pipeline runs, so every call took the
O(all rival rosters) fallback. Worst case per heated rival per week:
~500 fights × ~1.5 resolves × ~half the world's warriors ≈ 10⁵–10⁶ identity
checks. Fixed by hoisting the rival-invariant "last 10 player fights" set to
`aiDraftFromPool` top-level (`lastPlayerFights`) with an O(1) membership test.

**Rule:** `resolveWarriorOwner` is O(1) ONLY where `warriorToStableMap`
survives. Inside week-pipeline passes the map is stripped on clone (and
rebuilt by `buildWeekCaches` on the *resolved* state between boundaries —
check whether your site runs before or after a rebuild). Treat any
per-fight/per-offer resolver call inside a pipeline pass as an O(total
rosters) scan until proven otherwise.

**Rule:** exact `resolveWarriorOwner(...)?.isPlayer === true` equivalence is
`map.has(id) ? map.get(id).isPlayer : rosterIds.has(id)` — a map *hit* early-
returns (roster never consulted), a map *miss* scans live rosters. A bare
`playerIds` union of map+roster is NOT equivalent when fixtures inject a
synthetic map (ownerRoster.test.ts does exactly that).

**Check:** when a scan site needs `.slice(-N)` of a filtered array, walk the
source backward and stop at N — same elements, same order after `.reverse()`,
no full-array pass. Also: the `functions >80` ratchet in fileBudget.test.ts
sits exactly at baseline — ANY function crossing 80 fails the suite; extract
a helper rather than re-baseline.

**Clean bills:** scan-in-loop (93) + entries-in-loop (5) outputs are fully
allowlisted — the scanners are exhausted; hunt manually. `RecruitmentPass`
`intakeNames()` rebuild is bounded (≤~10 calls/week, ~10³ ops) — left alone.
`skillCalc.ts` `new Set(pool)` is once-per-call over a bounded constant pool.
