---
name: run-all-tests
description: Runs the fast unit test suite (default test command)
disable-model-invocation: true
---

Run the fast unit test suite to verify codebase integrity (from the repository
root):

```bash
bun run test
```

This is `bun x vitest run` over `src/test/**` excluding `*.slow.test.*` — the
standard gate for every change. Suite tiers:

| Command                 | Suite                                                                                                   | When                                                 |
| ----------------------- | ------------------------------------------------------------------------------------------------------- | ---------------------------------------------------- |
| `bun run test`          | fast vitest tier                                                                                        | every change                                         |
| `bun run test:slow`     | slow tier (`vitest.config.slow.ts`) — multi-week sims, subprocess audits, balance/determinism harnesses | when touching sim/pipeline/economy paths; nightly CI |
| `bun run test:all`      | everything (`vitest.config.all.ts`)                                                                     | pre-release                                          |
| `bun run test:bun`      | `bun test --isolate` native-runner parity                                                               | CI `bun-test` job                                    |
| `bun run test:coverage` | v8 coverage w/ floors                                                                                   | adhoc                                                |

Filter by path: `bun run test -- src/test/engine/combat/`; by title:
`bun run test -- -t "pattern"`. Per-domain runner skills
(`combat-sim`, `ai-agent`, `training-coach`, `recruitment-scout`,
`tournament-bracket`, `pipeline-seasonal`, `integration-autosim`,
`economy-balance`, `narrative-validate`) carry curated filter maps.
