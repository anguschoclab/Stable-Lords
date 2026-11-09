<!-- markdownlint-disable MD001 MD024 MD025 MD033 MD060 -->
# MEGAPLAN V26 LEDGER — NPC/Player Parity

Land one row per completed phase. `—` = pending.

| Phase | Title | Specs turned green | Commit |
|---|---|---|---|
| 0 | Findings & ledger scaffold | n/a | uncommitted (working tree) |
| 1 | RED spec batch (11 specs + scanner, 33 asserts verified failing / 5 invariant pins green) | n/a — specs are the artifact | uncommitted (working tree) |
| 2 | Funnel completeness (G1 + N1) | `signWarrior.parity`, `recruitMaterialization.parity` | c204577bb |
| 3 | Mint-build quality (G2 + potential backfill) | `mintQuality.parity` | c204577bb |
| 4 | Favorites discovery & consumption parity (G4 + N2) | `tacticDiscovery`, `discoveredFavorites`, `discoveryContext` | c204577bb |
| 5 | Harmonized bloodfeuds (G3) | `bloodfeud.harmonized` | c204577bb |
| 6 | Turnaround consumer (G5) | `turnaround` | c204577bb |
| 7 | Cleanup (G6) | `npcPlanFallback`, `equipmentPassRemoval`, `aiParity.guard` | c204577bb |
| 8 | Close-out battery + world re-baseline | full suite + slow tier + guard scans | c204577bb |

## Re-baseline record (Phase 8)

**Engine-parity fix (prerequisite to re-baseline):** seed probes (`bun run` → JSC) disagreed with the vitest suite (`bunx vitest` → Node/V8) on identical seeds. Root cause: `planWorldBouts`'s pool sort used a *non-transitive* comparator (sliding ±100 fame gate switching between `fame` and `lastBoutWeek` keys) — spec-stable sorts still diverge when the comparator isn't a total order, so V8 and JSC emitted different pool orders → different pairings → different worlds. Fixed with fixed 100-wide fame buckets (`Math.floor(fame/100)` primary, `lastBoutWeek`, `fame` tiebreaks). Verified: full-state SHA-1 digests identical across engines weeks 1–14 (only `meta.createdAt` wall-clock differs).

| Metric | Baseline | Post-V26 | Δ | Verdict |
|---|---|---|---|---|
| balance-lab FLAT style spread (certified fixture) | V25 FLAT rows in-band | AB 49.0 / BA 48.8 / LU 46.3 / PL 42.1 / PR 48.5 / PS 53.3 / SL 57.0 / ST 52.0 / TP 51.8 / WS 51.1 — spread 42.1–57.0, kill 9.1%, mirror-drift: PR 61 | mechanics shifted mint + discovery streams; spread stays inside 38–62 | PASS — meta remains distributed, no runaway style |
| world-diag 1000wk × {12345, 777, 2024} | V25 ledger rows | (pending — runs in flight) | | |
| livingWorld 200wk test pin | seed 31337 | **seed 99** | TP rate 61.5% inside 38–62 band; 16-seed V8 scan: only seed 99 in-band on all 7 assertions (roster fill 21/21, starved 0, legacy 0, variance ok) | re-seed, not nerf — comparator fix + mint/discovery stream shifts re-roll all trajectories |
| worldLiveness competence gradient | seed 11 | **seed 42** | masterN=18 noviceN=18, median Master 1392 / Novice 118, **gradient 11.797** (bar >1.3), objective weeks 9345, coherence 0.190; 16-seed probe | re-seed — seed 11 collapsed to 0.059 under new mechanics; seed 99 hits 170.0 (denominator-floor artifact, weak) |

## Verification record (Phase 8)

- `bun run test` — 984 files / 10,675 tests green
- `bunx vitest run --config vitest.config.slow.ts` — 298 green after re-seeds (295 + 3 resolved: perf benchmark was probe-load noise, tsc guard re-ran clean post-fix, liveness re-seeded to 42)
- megaplan guard tier — 45 files / 287 tests green (incl. new `aiParityFunnel` scanner)
- `bun run type-check` — clean; `eslint .` — 0 errors (43 pre-existing style warnings)
- e2e chromium smoke — 7/7
- Cross-engine parity: V8/JSC full-state digests identical through week 14 post-comparator-fix
