# MEGAPLAN V24 — COMMIT LEDGER

One row per megaplan commit, chronological. Restore tag: `pre-megaplan-v24`
(HEAD at tagging: `31e24207 docs: land MEGAPLAN_V23_PLAN.md + repo-ise session plans convention`).

| # | Commit | Phase | Scope | Verify |
|---|--------|-------|-------|--------|
| 0 | 97f43e0b | 0 | docs: plan, findings, ledger open; restore tag set | typecheck ✓ |
| 1 | 9a974a72 | 1 | spec batch: 11 *.canon.test.ts files + inert compile scaffolding (ctx fields, stub helpers, constants, data modules, state field+schema). 81 assertion-level RED observed; skillTiers + learnCapAndBurn + offhandGrid are born-green regression-locks per plan. | typecheck ✓ · 81 RED assertions · 114 existing tests green (dualWield/jump/loadoutFitting/schedulingAssistant) |
| 2 | 400860c1 | 2-3 | canon weapon rows (DA WT7, HA WT5, SM/ME DF5, LG SZ7, SS/SH code swap, BA SZ3+offhandCarryReq SZ9); SZ-deficit is endurance-only; EncumbranceBar shows LIGHT/MEDIUM penalties; checkLoadoutWieldability (OH relax + MH×OH DF grid + offhandCarryReq) wired into fighter init + sim init; ambi gate on off-hand attack | typecheck ✓ · weaponReqs+offhandWield specs green · 1416/1467 engine+equipment tests green (51 remaining = later-phase RED specs) |
| 3 | (this commit) | 4 | tactic harmonisation: U → TACTIC_U_MULT (-0.5) with per-field ≤0 clamp (drain can never grant); doubleTacticSkillPenalty (-1 all six skills when off+def tactics both active) wired into exchangePrep; AI U-guard confirmed landed + pinned | typecheck ✓ · tacticSuitability.canon + updated tacticResolution pins green · 2233/2242 engine+ai tests green (9 remaining = later-phase RED) |
