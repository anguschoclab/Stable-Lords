---
name: run-headless-sim
description: Runs the long-horizon headless simulation diagnostics (oracle + soak)
disable-model-invocation: true
---

Run the canonical long-horizon simulations to validate sim stability (from the
repository root):

```bash
bun run oracle:daily      # 1000-week sim → docs/reports/daily-balance-report.md
bun scripts/soak.mjs      # 40-week soak — faster long-run smoke
```

`oracle:daily` (`scripts/daily_oracle.ts`) wraps
`scripts/simulation-harness.ts` and reports treasury tracking, kill rate vs the
~8% weekly-arena design floor, style meta-drift, and economic recommendations —
the same numbers the `economy-balance` runner summarizes. For targeted
questions (matchup matrix, liveness, one fight) see the `sim-diagnostics`
skill's full harness map.
