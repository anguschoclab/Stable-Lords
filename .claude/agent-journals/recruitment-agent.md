# Recruitment Agent Journal

Critical learnings only — see `.claude/agent-journals/README.md`.

## 2026-11-22 - Draft gate-desperation ≠ price-urgency

**Finding:** `draftPoolSignings` (src/engine/ai/workers/recruitmentWorker.ts)
has TWO distinct predicates that are easy to conflate: `desperation` (gate:
`needsRecruit || activeCount < minRoster || isMajorDraftWeek` — lets a
negative-score candidate sign) and `urgent` (valuation: `needsRecruit ||
activeCount < minRoster` — quarters `priceSensitivity` via
`AI_DRAFT_URGENT_PRICE_SCALE` so a needy stable stops haggling).

**Learning:** `isMajorDraftWeek` deliberately belongs ONLY to the gate — a
calendar event is not vacancy pressure, and a comfortable stable on draft
week should keep its thrift. The price term is a _ranking_ input;
`checkBudget` alone owns affordability, so scaling the price penalty is safe
for treasury invariants (reserve + burnRate still gate every signing).
Urgency decays inside the loop because `activeCount` rises per signing —
only the first pick(s) under pressure pay nearer asking.

**Rule:** Future scoring changes must keep these predicates separate; never
fold `isMajorDraftWeek` into the price-urgency path, and never move price
into `checkBudget` (selection preference vs. solvency are different jobs).
