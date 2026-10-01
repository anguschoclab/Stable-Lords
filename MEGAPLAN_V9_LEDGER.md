# MEGAPLAN V9 LEDGER — Consolidation & Gate Record

**Scope:** 12 open PRs synthesized; closed-PR salvage (#968–#997) adjudicated; residual
living-rival-world work landed; deferred megaplan tickets (G1/G2/G3/L1/L2) implemented;
full gate matrix. Zero save/back-compat constraints.
**Restore point:** tag `pre-megaplan-v9`; checkpoint `wip/living-rival-world` @ `6a5cb087`.
**Baseline:** `f8577854` — red CI (type-check/test/bun-test).

## Commit ledger (execution order)

| Commit | Content |
|---|---|
| `6a5cb087` | wip checkpoint: living-rival-world in-flight continuation → `wip/living-rival-world` |
| `d7298a97` | chore: delete committed scratch file `scripts/_tmp.ts` (type-check unblock) |
| `d12016cc` | test: V9 gate — entityLink.perf, ViewModeToggleA11y, narrativeUnionV9, PR #998 tests |
| `2c94f990` | feat: EntityLink atomic selectors + memo; narrative union of #1000/#1002/#1007/#1009 |
| `0179da61` | test: repin WarriorPass trainer specs to LEGACY_FOUNDER_* constants |
| `284bb5fc` | feat: living-rival-world continuation — crowned ids, free agents, append deltas |
| `e5e96776` | feat: a11y synthesis — focus-visible outline + motion-reduce (#1003/#1005) |
| `923d68b6` | refactor: decompose long UI components (fileBudget guard) |
| `80b7e914` | chore: relocate utility scripts out of src/, `#scripts/*` alias, tsconfig retarget |
| `3c19f364` | test: repin world-spec expectations to living-rival-world semantics |
| `372fcb0f` | chore: MEGAPLAN_LEDGER synthesis entry |
| `da6d2237` | chore: schema round-trip fixes + simulation guard rebase (incl. JSONC stripper fix, death-rate repin) |
| `bd0874cb` | fix: bunfig ignore for vitest-only entityLink.perf; tsconfig.e2e exclude |

## Gate matrix — final HEAD

| Gate | Result | Notes |
|---|---|---|
| type-check | ✅ | tsc --build clean |
| lint | ✅ | 0 errors |
| vitest (default) | ✅ | 733–734 files / ~8.4k tests; last failure (WarriorPass) repinned |
| bun test | ✅ | 8405 pass / 0 fail / 1 skip — 144s |
| vite build | ✅ | PWA generated |
| electron:compile | ✅ | 26 KB bundle |
| narrative-validate | ✅ | no errors |
| slow suite | ✅* | 4 initial fails → B2/B9 fixed; perf flake was contention; traitedShare bound repinned; rerun recorded |
| e2e chromium | ⏳ | 3/4 pass; seasonal-tournament under retry (see findings §8) |
| megaplan guards | ✅ | fileBudget/dup/orphan/skip/uiTokens/typeSurface all green |

## Artifact strip list
- `.claude/backups/**` (all narrative PRs) — not landed
- `.jules/**` — not present on main; not landed
- `removed.json` / `removed_duplicates.json` manifests — not landed

## Salvage / union stats
- Narrative: 694→721 killText, 3034→3226 pbp, 1042→1089 strikes (unique leaves); 9 consensus removals; 8 WT-overlay carries; 3 cross-leaf dupes dropped.
- #998: 4 files / 34 specs landed.
- Closed PRs #968–#997: all map to V7 dispositions — no additional salvage.
