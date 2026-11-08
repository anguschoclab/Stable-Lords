<!-- markdownlint-disable MD001 MD024 MD025 MD033 MD060 -->

# MEGAPLAN V22 LEDGER — Noblish Island Canon Integration

One row per commit. Findings: `MEGAPLAN_V22_FINDINGS.md` ·
Plan: `MEGAPLAN_V22_PLAN.md` · Restore tag: `pre-megaplan-v22`.

## §0 Baseline

- Tag `pre-megaplan-v22` created on c6689bc7. User WIP (12 files) carried,
  non-overlapping except `sections.tsx` (merge, don't clobber).
- FINDINGS + PLAN committed as docs.

## §1 Execution rows

| # | Commit | Scope | Phase | Tests | Notes |
|---|--------|-------|-------|-------|-------|
| 1 | cf422d81 | Canon charts + persona/profile surfaces | 1–3 partial | canon specs 61✓ | Broke: almanac (stubs), 4 combat-sim expectations, hallOfFame — re-ratchet pending |
| 2 | 33a1ca97 | Phase-3 re-ratchet (AB/ST penalty rows) | 3 | balance 11/11, world 10/10 | AB->WS sits at exactly 80 — fragile, watch on next power shift |
