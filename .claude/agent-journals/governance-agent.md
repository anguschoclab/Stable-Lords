# Governance Agent — Journal

Critical learnings only. Format: `## YYYY-MM-DD - [Title]` / **Finding:** / **Learning:** / **Rule:**

## 2026-11-22 - Honor-culture grudge promise was a dead path

**Finding:** `honorCulture.ts`'s doc comment promised "the slighted stable's grudge runs deeper," but no consumer implemented it — a down-challenge in an honor-bound venue produced only a gazette stigma note (player path, `boutResolution.ts`) and a pairwise pick penalty (AI path, `boutBidding/conversion.ts`). The slighted owner never reacted.

**Learning:** `FightSummary` stamps `arenaId`, `fameA`, `fameD`, and `contractId` at bout time (`reportingHandler.ts`). That is the reliable channel for post-hoc bout attribution in `processOwnerGrudges` — `state.warriorMap` lookups both miss dead/removed warriors and reflect *current* fame, not the mismatch that actually happened. The `ownerGrudges` write is already declared on the `world` pass, so new grudge sources belong inside `processOwnerGrudges`, not in bout-resolution impacts (shard workers would drop undeclared fields).

**Rule:** Grudge intensity carries a semantic ladder — kill ignites at 2, slight/upset at 1; `AI_GRUDGE_AVOID_MIN_INTENSITY` is 3, so intensity-1 slights only heat fight plans (`grudgeKD`/`grudgeAL`) without triggering stable avoidance. Match new grudge causes to that ladder, keep the `PERSONALITY_CLASH` gate for rival×rival ignitions, and emit a gazette line per ignition/escalation so the standing change stays visible.
