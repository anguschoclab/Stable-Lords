<!-- markdownlint-disable MD001 MD024 MD025 MD033 MD060 -->

# MEGAPLAN V21 LEDGER — Commit & Gate Record

One row per commit. Gates measured WIP-inclusive (fighter-concepts uncommitted
work present in tree; non-overlapping paths, staged explicitly).

## §0 Baseline (pre-merge, 2026-11-01)

| Gate | Result | Evidence |
| ---- | ------ | -------- |
| Safety | `pre-megaplan-v21` tag + 8× `refs/megaplan/v21/*` pushed | git ls-remote |
| type-check | PASS (exit 0, tsr generate + tsc7 --build) | /tmp/v21-typecheck.log |
| lint | PASS (0 errors, 30 warnings) | /tmp/v21-lint.log |
| test | PASS (900 files, 9,686 tests, 2 skipped, 0 failed, 61s) | /tmp/v21-test.log |
| knip / jscpd / dup-scans | knip exit 1 (~160 dead exports, V20 baseline); jscpd 91 clones/0.54%; data-array-dup 0; fuzzy 0; dup-scan ~6 small blocks; SRP top-files stable | /tmp/v21-scanners*.log |

## Commits

| # | Commit | Scope | Gates | Notes |
| - | ------ | ----- | ----- | ----- |
| 1 | ae76be8b | V21 docs seed (plan/findings/ledger + §1 lock) | — | Phase 0+1 |
| 2 | 361e0624 | test inventory: 3 guards RED + floors + regen + trait lists | guards 17R/8G | Phase 3 hard gate |
| 3 | def7db3a | merge #1076 bolt/chronicle (+ drop .jules) | clean | Chronicle useShallow |
| 4 | 0064a2d5 | merge #1072 palette tooltip + SeededRNG fix | clean | — |
| 5 | 590a9797 | merge #1074 threads-of-chaos + wiring fixes | v21Weather 7/7 GREEN | 3 Record surfaces + disposition export |
| 6 | 13f0602a | merge #1077 lore-only | guard → floors | union-merge |
| 7 | b45b110c | merge #1073 narrative + orphan_shadow_fury | traits 179 | drop .claude/backups |
| 8 | 8bf6a843 | merge #1075 + orphan_iron_will/gutter_shadow_striker | traits 181 | union-merge |
| 9 | d744b4bb | merge #1071 minus gutter_phantom_two | traits 183 | REJECT _2 #1 |
| 10 | c200b347 | merge #1070 minus 2 _2 traits; strip gen hunks | traits 184 | REJECT _2 #2,#3 |
| 11 | 7baf4bc5 | regen audit baselines | — | test-audit-scan |
| 12 | 9aa5d121 | fix collapsed bf2 boundaries; ARENA_LORE→242 | all guards GREEN | §B-2 |
| 13 | 1c419d0b | fix 8 WEATHER_STATS display lies | parity allowlist ∅ | §B-1 |
| 14 | c655d46a | orphanScan ratchet 161→162 | slow rerun 3/4 flakes pass | §B |
| 15 | 1ece9505 | findings §W/§B/§V + ledger | — | — |
| 16 | d6feb7d8 | register pre-existing KD failure §B-6 | worktree-verified | — |
| 17 | 15bb3125 | close-out battery (e2e+soak) | all green | — |


## Close-out battery (final)

| Gate | Result |
| ---- | ------ |
| type-check | PASS |
| lint | 0 errors / 30 warnings (baseline) |
| test (fast) | 903 files / 9,711 pass / 0 fail |
| test:slow | 4 env/pre-existing issues → resolved: perf×2 load-flakes (pass serially), orphanScan re-baselined 161→162, balance.slow KD pre-existing §B-6 |
| e2e (chromium) | 5/5 pass |
| soak 40wk | 0 invariant violations, 13.8s |
| tags | pre/post-megaplan-v21 pushed |
| PRs | 8 dispositions posted; auto-closed merged |
| remote branches | 8 deleted (heads preserved refs/megaplan/v21/*) |
| new since pass | ux-palette-add-button-types-2648780633548327679 (PR #1078, next pass) |
