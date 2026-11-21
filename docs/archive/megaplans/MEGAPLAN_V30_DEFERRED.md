# MEGAPLAN V30 — Deferred

Per user directive, all V30-plan watch items are in scope (W7–W9, G3) — this register is expected to carry only close-out spillover. Written at Phase 6.

## Open items

_None — both seed re-baselines landed (see below)._

## Resolved post-close-out (in-spec seed sweeps, 2026-11)

| Item                                                   | Resolution                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| ------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **worldLiveness competence-gradient seed re-baseline** | In-spec sweep of 42 candidates (temp specs replicating the spec's env — opfsArchive shared mock + id counter; the earlier probe-env caveat held). Re-seeded to **89**: medM=442, medN=52 (coherent denominator), gradient 8.500, coherence 0.135, masterN=19, noviceN=16, objWeeks 9224 — all verified in-spec; spec green in the slow tier. Runner-up 79 (gradient 26.286, but medN=21 — thin denominator). Observed pattern worth noting: most misses now fail the _coherence_ floor, not the gradient — the unified ruleset legitimately diversified rival intent. |
| **worldBalance roster-fill re-baseline**               | In-spec sweep: seed 31337's fill had _recovered_ to 0.952 on the current tree (the 94.4% reading predated the WS3/4 canon-armor stream re-roll) — marginal, so re-seeded rather than loosened. New seed **2024**: fill=1.000 (34/34), legacy=4, rivalCount min=90/max=91, kill=0.051, dark=2 — all bands verified in-spec; spec green in the slow tier.                                                                                                                                                                                                               |

## Resolved at close-out

- `orphanScan` ratchet 174→180: V30 canonical modules export their Args/Result/Outcome type surface — the scanner's known type-export blindspot (same class as baseline entries). Documented in the guard.
- `jscpdRatchet` baseline 106→96 clones (0.50%): scanLib extraction + test-helper drains + dead-code removal netted −10 clones.
