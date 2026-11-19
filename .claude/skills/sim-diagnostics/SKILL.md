---
name: sim-diagnostics
description: Pick the right engine measurement/diagnostic harness for a simulation or repo-health question. Use whenever tuning balance, investigating drift/bias/lethality, checking determinism or liveness, measuring a single fight, or answering "is X realistic/healthy over N weeks/years" — catalogs every scripts/ harness (daily oracle 1000-week sim, world-diag snapshots, balance-lab, style-probe, soak, liveness probes, fight runners, audit scanners) with what each one actually reports.
---

# Engine Simulation Diagnostics — Which Tool for Which Question

All run from the repo root (`bun run …` / `bun scripts/…` / `node scripts/…`).
Measurement harnesses print to stdout; the oracle and audit scanners also write
committed reports under `docs/reports/` or `scripts/out/`.

## Simulation & balance

| Question                                            | Command                                                                               | What it reports                                                                                                                                                |
| --------------------------------------------------- | ------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Is the world healthy over ~19 years?                | `bun run oracle:daily` (`scripts/daily_oracle.ts`)                                    | 1000-week sim → `docs/reports/daily-balance-report.md`: treasury tracking, kill rate vs the ~8% weekly-arena floor, style meta-drift, economic recommendations |
| Matchup matrix / win rate by era & career stage?    | `SNAP=snap.json bun run scripts/world-diag.ts 1000 12345`                             | Real-world run (~100 s): matrix, per-era win rates, population share, kills; writes the snapshot `balance-lab` reads                                           |
| Quick fixture + snapshot win rates?                 | `bun run scripts/balance-lab.ts snap.json`                                            | ~3 s fixture + world-snapshot rates; `LAB='{"floor":{"WS":[…]}}'` overrides via `scripts/lab-overrides.ts` — try changes without editing source                |
| What are a style's _effective_ skills in the world? | `bun run scripts/style-probe.ts`                                                      | Per-style effective skills on a world snapshot — check before tuning (floored skills don't respond to penalties)                                               |
| Base harness under the oracle                       | `scripts/simulation-harness.ts`                                                       | The week-loop the oracle wraps — use for custom horizons/metrics                                                                                               |
| Does the world stay alive & varied?                 | `bun scripts/liveness-diag.ts`, `livingworld-seed-probe.ts`, `probe-liveness-seed.ts` | World-liveness gradient probes (rival churn, event variety)                                                                                                    |
| Soak a build                                        | `bun scripts/soak.mjs`                                                                | 40-week soak — smoke for long-horizon crashes/drift                                                                                                            |
| Emergent behavior report                            | `bun run scripts/emergent-report.ts`                                                  | Emergent-pattern summary over simulated time                                                                                                                   |
| Tournament balance                                  | `bun run scripts/tournament-dominance.ts`                                             | Dominance/style spread across tournament brackets                                                                                                              |
| Advisor sanity                                      | `bun run scripts/advisor-probe.ts`, `advisor-e2e.ts`                                  | Stable-advisor recommendation checks                                                                                                                           |
| Inspect one fight                                   | `bun run scripts/run-fight.ts`, `build-fight.ts`                                      | Single-bout construction + play-by-play inspection                                                                                                             |
| Engine-pool perf                                    | `bun scripts/parallel-bench.mjs`                                                      | Shard/pool benchmark (persistent-shard-state findings)                                                                                                         |

## Determinism

| Question                        | Command                                                                                                                                                                                                                                      |
| ------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Same seed = same state?         | `bun run test --reporter=verbose src/test/engine/determinismAudit.test.ts src/test/engine/combat/resolutionDeterminism.test.ts src/test/engine/narrative/narrationDeterminism.test.ts src/test/engine/pipeline/offseasonDeterminism.test.ts` |
| Week-scale/parallel determinism | `bun run test:slow src/test/engine/sim/determinism.slow.test.ts src/test/engine/weekDeterminism.slow.test.ts src/test/engine/pipeline/parallelDeterminism.slow.test.ts`                                                                      |

See `determinism-debug` for the triage loop — failures are almost always
consumption-order bugs, not broken RNG.

## Narrative

| Question                | Command                                                                                                      |
| ----------------------- | ------------------------------------------------------------------------------------------------------------ |
| Tag references resolve? | `bun run narrative-validate` (`scripts/narrative_validate.ts`, exits non-zero)                               |
| Expand pools via Gemini | `bun run bard:daily` (`scripts/daily_bard.ts`, needs `GEMINI_API_KEY`) → `docs/reports/daily-bard-report.md` |

## Repo-health scanners

Zero-dep `.mjs` scanners — stdout summary + `scripts/out/*.json` report; most
exit 1 on violations and back `src/test/megaplan/*.guard*` specs (see
`guard-ratchet`):

`orphan-scan.mjs` (→ `docs/reports/orphan-report.md`), `data-array-dup-scan.mjs`,
`skill-path-scan.mjs` (skill-doc path drift), `ui-audit-scan.mjs`,
`test-audit-scan.mjs` (regenerates `src/test/_setup/runnerGroups.json` +
`auditBaseline.json`), `dedupe.mjs`, `dup-scan.mjs`, `fuzzy_dedupe.mjs`,
`function-length.mjs`, `param-count.mjs`, `srp-census.mjs`,
`entries-in-loop.mjs`, `scan-in-loop.mjs`, `ai-parity-funnel.mjs`,
`arena-lookup-scan.mjs`.

Plus `bun run dead-code` (knip — unused code, `dead-code:report` →
`scripts/out/knip-report.json`) and `bun run dupes` (jscpd — copy-paste ≥10
lines → `scripts/out/jscpd/`). Division of labor:
`docs/engineering/testing.md` §Code hygiene scans.

## Interpretation caution

- **Fixed seeds show existence, not distribution.** The world-diag convention
  is seeds 12345 / 777 / 2024 — vary before drawing balance conclusions
  (~±2pp per style seed noise, ~±1pp on kills).
- **Snapshot proxy exaggerates gaps** (random pairing, no survivorship
  feedback) — rank candidates in the lab, confirm in the world. See
  `combat-balance` for the fixture-vs-world two-surface rule.
- Registered watch items (TP dominance, world kill rate, LU/PR band edges)
  live in `docs/MEGAPLAN_BACKLOG.md` §2 — check before "discovering" them.
