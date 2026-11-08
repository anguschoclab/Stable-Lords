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
| 3 | — | Handedness wiring, profile surfaces, design notes, combat ratchets | 2–4 | canon+combat suites green | Handedness persisted at all 6 creation sites (+1 ATT baked via `applyHandednessAttack`); intro override wired in `simulate/narrative.ts`. Dossier `WarriorStatementsPanel` now renders physical-profile lines, Expert/Advanced-Expert suffixes, "Is Ambidextrous". `designReview` gained BA/PR/TP notes, aimer fragility, Little-damage, WL dead-zone, DF-11 gate + specs. Recruit card 66→70 fixed. `PoolWarrior.handedness` added. DEC_INI_COEFF 0.08→0.2 (decise.spec GREEN, +10 DEC ≈ 55% first-strike); tactic decBonus 8→6 after PS-Decise monopolized initiative (SL fixture swung 1×/bout). Penalty ratchets: SL ATT-10→-7/PAR-14→-10/DEF-15→-11, PS PAR-5→-7/DEF-10→-12/RIP-3→-7, ST ATT-9→-10. FLAT spread 45.5–58.2 all in band; SL-vs-PS attrition guard re-floored 0.4→0.30 (canon DF tables strengthened PS's counter package — 17.5% was the measured collapse). Remaining: will checks/surrender, in-bout endurance recovery, dodge→riposte, ATT→crit, fatigue barks, striker END bonus, always-on rhythm, secondary-damage threshold, help-text fixes (sections.tsx is user WIP — merge don't clobber), `wield:'dual'` callers (Phase-5), slow suite + world diag. |
