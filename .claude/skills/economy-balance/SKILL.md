---
name: economy-balance
description: Run economy tests and long-horizon balance diagnostics. Delegates harness selection to sim-diagnostics and implementation to stable-management.
disable-model-invocation: true
---

# Economy balance runner

`sim-diagnostics` owns the harness catalog; `stable-management` owns money-flow
implementation; `combat-balance` owns combat tuning and its fixture/world gates.
Do not infer a balance fix from a single treasury threshold or snapshot.

```bash
bun run test --reporter=verbose "src/test/engine/economy/" "src/test/engine/metaDrift.test.ts"
bun run test:slow "src/test/engine/economy/balance.slow.test.ts" "src/test/engine/economy/worldBalance.slow.test.ts"
bun run oracle:daily
```

The oracle runs **1,000 weeks**, not 100 or 50, and overwrites
`docs/reports/daily-balance-report.md`. The slow command deliberately opts into
simulation gates; it is not a routine check for docs or UI changes. For a shorter run use the
harness options documented in `sim-diagnostics`, not an unsupported `quick`
keyword. Read current constants and the backlog before proposing economy or
lethality changes; a report recommendation is not permission to alter canon.
