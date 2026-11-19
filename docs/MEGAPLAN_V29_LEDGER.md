# MEGAPLAN V29 — Ledger

**Plan:** `MEGAPLAN_V29_PLAN.md`
**Findings:** `MEGAPLAN_V29_FINDINGS.md`

## §0 — Baseline (pre-megaplan-v29)

| Gate | Result | Notes |
| --- | --- | --- |
| `bun run type-check` | **clean** | tsr generate + tsc --build |
| `bun run lint` | **0 errors, 42 warnings** | matches V28 baseline warning count |
| `bun run test` | **998/999 files · 10768/10771 tests** | sole failure `opfsArchiverFlush` = 10s afterEach hook timeout — suite-load flake class (standalone 6/6 green); new instance alongside V28's `tacticDiscovery.parity` watch item |
| `git merge-tree` (15 branches vs main) | 13 clean · 2 conflict | #1081/#1086 conflict only in generated `auditBaseline`/`runnerGroups` (strip+regen); narrative collisions are pairwise between branches, not vs main |
| coverage floors | `vitest.config.ts:60-67` | enforced by CI coverage job |
| dependabot alerts | **30 open** | `gh api .../dependabot/alerts` → FINDINGS §B |
| PR surface | 15 open PRs (#1079–#1093) | all bot-authored; 1 greeting comment each, 0 review threads (api-verified) |
| safety | `pre-megaplan-v29` tag + 15 `refs/megaplan/v29/pr-*` | pushed |
| contaminated-run note | first `bun run test` attempt discarded | ran concurrently with tsc+eslint → mass ~10s hook timeouts; re-ran serially for the honest baseline above |

## §2 — Scanner delta (Phase 2)

Read-only suite vs V28 baseline — **zero new violations**. Full detail in FINDINGS §W–§P. `test-audit-scan` regenerated `runnerGroups`/`auditBaseline` (timestamp drift only — rides into the Phase-3 commit).

## §3 — Test inventory (Phase 3 hard gate)

All specs authored and **observed RED** before any implementation (2026-11-19). 19 intended failures, each for the pinned reason:

| Spec | Failing tests | RED observed |
| --- | --- | --- |
| `v29Narrative.guard.test.ts` | 6 | union entries/counts 426/254/232/248 missing; per-PR killText adds; uiMeta 'Flashy' — uniqueness describes GREEN (pbp 'SOLAR PLEXUS' / uiMeta 'Fallen in combat.' allowlisted as pre-existing shared labels) |
| `v29Traits.guard.test.ts` | 3 | orphan traits absent; count 184 |
| `v29WeatherStamina.guard.test.ts` | 3 | Abyssal Tempest, Chaos Storm, Chaos Squall — 3 violators found (B3 broader than backlog's 1) |
| `SystemPass.test.ts` V29-D2 | 2 | promote/demote dead (tier unchanged); mid-season invariant GREEN |
| `gameStateFactory.test.ts` V29-D3 | 2 | wall-clock `createdAt`; cross-call `toEqual` fails |
| `gazetteTemplateHelpers.test.ts` V29-D4 | 1 | 20 draws → Set size ≠ 1 (deterministic) |
| `rivalBidsWeather.test.ts` V16-A11 | 1 | `weather='Chaos Storm'` vs bout-week `'Blood Rain'` — mock captured the buggy call |
| `tacticRow.test.tsx` V29-D1 | 1 | no tactic row in rendered DOM |
| v21Narrative/v21Traits floor conversions | 0 | GREEN — `toBe` → `toBeGreaterThanOrEqual` on 6 count pins |

Registered: `v29Narrative`, `v29Traits`, `v29WeatherStamina` → `GUARD_REGISTRY` LIVE_RATCHET.

## Phase commits

| Phase | Description | Commit | Notes |
| --- | --- | --- | --- |
| 0 | Tag + backup refs + V29 doc scaffold + V28 archive + guard/INDEX/BACKLOG atomic swap | `dcb4b1b5` | exactly-one-lineage invariant preserved |
| 2–3 | Scanner delta + FINDINGS §W–§P/§B + Phase-3 RED inventory + guard floors + registry | — | spec-first contract honored: 19 observed REDs, zero implementation |

## Verification record

- Phase 3 RED observation: 19 failing tests across 8 files, every failure matching its pinned reason (see §3).
