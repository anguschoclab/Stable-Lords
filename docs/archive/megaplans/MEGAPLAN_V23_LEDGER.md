# MEGAPLAN V23 — COMMIT LEDGER

One row per megaplan commit, chronological. Restore tag: `pre-megaplan-v23`
(HEAD at tagging: `4e1c86aa chore: drop scratch tier-probe script`).

| # | Commit | Phase | Scope | Verify |
|---|--------|-------|-------|--------|
| 0 | (this file + FINDINGS) | 0 | docs: plan, findings, ledger open | — |
| 1 | b3e1ac09 | 1 | spec batch (17 files) + compile scaffolding — all observed RED | type-check green; ~40 new assertions failing as intended |
| 2 | fd01ed8c | 2–4 | canon data (coord boundary, style-handedness + ambi-reversed, luckfactor parity, minimums + DA-rule + rollup, learn priorities, help) · encumbrance parPenalty→0 · combat mechanics (side-gated disarm + lazy ambi pick, coord drop/fumble/rise/KD-suscept, OE→jump, clash loop) | disarm/coord/jump/quickdraw/knockdownRise/dualWield specs green; disarm.test re-aimed to weapon arm + re-seeded 1002; EncumbranceBar/fighterState assertions updated; guards rebaselined |
| 3 | 46e26119 | 5 | D1 dual-wield: loadout legal states + DUAL_WITH_SHIELD/TWO_HANDED_WITH_OFFHAND, getLoadoutWeight offhand, VHC gate + OFFHAND_ATTACK wired, off-hand parry-side bake | dualWield + loadout.validation 14/14 |
| 4 | c967fbb9 | 6 | D2 trains-burn: generic bp-delta rule (ST≤14/CN free emerge from tables), burnedSkills ledger, effectiveLearnCap gates bout pool, gain-path wiring + advisor copy | trainsBurn 11/11 — all 17 specs GREEN |
| 5 | d6cf1322 | 7 | balance ratchet: BA/SL floors up, enduranceMult HEAVY 1.3→1.6 / OVER 1.5→2.0, KILL_WINDOW.SCALE 1.1→1.18; TP/PR penalty nudges tried then REVERTED (WS→TP 88% / SL→PR 83% / WS→PR 84% cells blew past the 80% cap — documented in skillBreakpoints comments); BA mirror center documented (0.44, second-actor counter edge); traitBalance sample widened 250→500 (true rate ~0.585); worldBalance + worldLiveness seed re-baselines (V23 handedness draws re-rolled trajectories — same remedy as the 8 documented prior re-baselines); DEFERRED register D1/D2 landed + watch re-baseline | FLAT 41.0–56.4 all in band, kill 9.3% ≥ 9% floor; world-diag 1000wk: TP 62.9 watch-flagged, LU 42.7 new watch, kill 6.68% flat |
