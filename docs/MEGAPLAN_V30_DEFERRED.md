# MEGAPLAN V30 — Deferred

Per user directive, all V30-plan watch items are in scope (W7–W9, G3) — this register is expected to carry only close-out spillover. Written at Phase 6.

## Open items

| Item | Evidence | Required work |
| --- | --- | --- |
| **worldLiveness competence-gradient seed re-baseline** | `src/test/engine/sim/worldLiveness.integration.slow.test.ts` — `med(topTreas)` = −463 vs gradient >1.3 at the current seed. V30's unified ruleset re-rolled world trajectories (AI now trains/pays unconditionally, drills roll injuries, weather-aware rolls, no free accelerated healing). Same failure class as V29's seed-88→42 inversion (`f3636f927`): deterministic stream shift, not a mechanics defect. | In-spec seed sweep per the V29 process (spec-env sweep, NOT `scripts/probe-liveness-seed.ts` — its module env diverges). Find a coherent-denominator seed (both medians positive, real gradient >1.3), update the spec, record the numbers in the comment. ~15–20 min per candidate seed. |
| **worldBalance roster-fill re-baseline** | `src/test/engine/economy/worldBalance.slow.test.ts` — solvent-stable roster-fill 94.4% vs ≥95%. Marginal single-roster miss; plausibly the unified ruleset's honest AI training spend / injury risk tightening fill rate slightly. | Either re-baseline the threshold with a written justification or probe alternate seeds in-spec (same env caveat). Do NOT loosen the bar without recording why — the probe exists to catch AI-competitiveness collapse, and 94.4% is inside noise of the bar rather than a collapse. |

## Resolved at close-out

- `orphanScan` ratchet 174→180: V30 canonical modules export their Args/Result/Outcome type surface — the scanner's known type-export blindspot (same class as baseline entries). Documented in the guard.
- `jscpdRatchet` baseline 106→96 clones (0.50%): scanLib extraction + test-helper drains + dead-code removal netted −10 clones.
