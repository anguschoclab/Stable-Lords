# Perf audit sweep B6 — findings-doc residuals (P1, P2, P4, P5, P6)

Continuation of the archived B5 sweep: work the remaining open items in
`.devin/plans/perf-audit-findings.md`. Same discipline — output-preserving
only, byte-identical A/B soak, commit per item.

## Status

- ✅ P1 `bestMatchupModifier` per-member bound + early-exit — landed, soak
  byte-identical; `rivalStrategy` 213.7→174.7 ms avg, `promoter` 37.2→31.0
- ⬜ P2 promoter pass internals (measure → act or document)
- ⬜ P4 non-pass harness overhead decomposition (measure → document)
- ⬜ P5 GlobalSearch rescan memo (trivial)
- ✅ P6 perf-audit SKILL.md cardinality correction — already correct in doc
  (lines 68-73 cite TRUNCATION_CAPS); findings item stale

## Items

### P1 — `bestMatchupModifier` residual (generation.ts:103)

B3's bucket-bound prune skips hopeless style buckets. Remaining cost:
`scorePairwiseMatchup` per in-bound member (~0.5–1.2M cheap calls/wk).
In this ctx shape the score is exactly
`100 + bonus*25 + fameTerm + (aWR−bWR)*20` (rivalry/rank/h2h terms all
zero — ctx fields not passed).

Exact-preserving levers:

- Per-member bound: `clamp((bonus*25 + fameTerm + aWR*20)/20, −5, 5) +
  biases` ≥ true member score (wrTerm ≤ aWR*20; fameTerm is exact per
  member). Skip the call when bound ≤ running max.
- Total early-exit: when `matchupModifier` reaches the current bucket's
  bound, no later member/bucket can beat it → return immediately.
- Verify: same-seed A/B soak byte-identical + existing
  `generateBoutBids` equivalence specs (Phase-0 T2/T6 cover output shape;
  bid equivalence spec pins exact offers).

### P2 — promoter internals

`promoter` now 37.2 ms avg post-B5. Re-profile (`bun --cpu-prof` 40wk)
and decompose; act only if a single output-preserving lever is clear,
else document the breakdown.

### P4 — harness overhead decomposition

603.6-era doc warned soak ms/wk ≠ advanceWeek (archive drain, pulse
logging, tracker). Post-B5: 460.3 total vs ~300 ms/wk inside passes —
the non-pass delta is still large. Decompose once, document in
pipeline-baseline.md.

### P5 — GlobalSearch rescan

`searchEntities` reruns O(corpus) per store change while the modal is
open. WeakMap memo on (state, q) or `useMemo` on [state, query] —
trivial.

### P6 — SKILL.md cardinality fix

`perf-audit` says arenaHistory is "hundreds→thousands, never shrinks" —
wrong: `TRUNCATION_CAPS.arenaHistory = 500`. Cite the real caps.
