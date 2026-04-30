---
name: economy-balance
description: Run economic balance simulations to detect inflation, deflation, lethality rates, and meta-drift patterns.
disable-model-invocation: true
---

# economy-balance

Runs economic balance simulations to track treasury health, lethality rates, and fighting style meta-drift over time.

## Usage

```
/economy-balance [filter]
```

## Test Groups

| Filter keyword | What it targets |
|----------------|----------------|
| (none) | Full 100-week balance simulation via daily oracle |
| quick | Quick 50-week balance check |
| meta | Meta-drift analysis only |
| economy | src/test/engine/economy.test.ts |
| balance | src/test/balance.test.ts |
| hardening | src/test/simulation_hardening.test.ts |

## Commands

**Run full balance report (100 weeks):**
```bash
bun scripts/daily_oracle.ts
```

**Run with a filter (e.g. /economy-balance economy):**
```bash
bun run test --reporter=verbose -- <filter>
```

**Run balance tests:**
```bash
bun run test --reporter=verbose src/test/balance.test.ts src/test/simulation_hardening.test.ts
```

**Run economy tests:**
```bash
bun run test --reporter=verbose src/test/engine/economy.test.ts
```

**Run meta-drift analysis:**
```bash
bun run test --reporter=verbose src/test/engine/metaDrift.test.ts
```

## Notes

- Daily oracle runs 100-week simulation and generates Daily_Balance_Report.md
- Report includes: treasury tracking, lethality rate, meta-drift by style, economic recommendations
- Meta-drift range: -10 (Struggling) to +10 (Dominant)
- Lethality rate should stay below 10% to prevent rapid roster depletion
- Economic constants tracked: FIGHT_PURSE, WIN_BONUS, WARRIOR_UPKEEP_BASE, FAME_DIVIDEND
- If treasury inflates >100k, consider increasing WARRIOR_UPKEEP_BASE or reducing FIGHT_PURSE
- Test timeout is 30s (set in vitest.config.ts) — simulation_hardening.test.ts may be slow
