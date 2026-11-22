# Finance Agent Journal

## 2026-11-22 — `burnRate` is signed; a windfall week read as a bigger allowance

**Finding:** `agentMemory.burnRate` is `lastTreasury − currentTreasury` — a
_signed_ one-week delta, not a burn magnitude. `checkBudget`
(`src/engine/ai/workers/budgetWorker.ts`) folded it straight into the
reserve addend (`treasury − (reserve + burnRate)`), so a profitable week
(negative burnRate) _inflated_ `availableTreasury`. The windfall is already
inside `treasury`, so the gain was spendable twice — a purse-rich week
silently green-lit hires/signings/bids the stable's runway couldn't cover,
and an Aggressive owner's 1.5× tolerance amplified the phantom cash further.

**Learning:** The signed delta is a faithful observation worth keeping —
schema (`z.number()`) and `consolidateAgentMemory` tests pin it negative on
income weeks, and other consumers may legitimately want the sign ("net +200
last week"). The lie was in the _use_: burn-rate signals reserve demand;
income is already priced into the treasury figure itself. Same shape as the
upkeep-scaled reserve fix — structural runway math on one side, observed
flow on the other, never summed twice.

**Rule:** When a memory signal feeds a spending gate, check its sign
convention before adding it to a reserve — clamp (`Math.max(0, burnRate)`)
at the use site rather than re-signing the stored value. A one-week
positive delta tightens (the stable demonstrably burns more than projected
upkeep); a negative delta is noise, not extra headroom. And
`projectCashFlow`'s horizon path correctly ignores burnRate entirely —
projected upkeep already covers the structural outflow.
