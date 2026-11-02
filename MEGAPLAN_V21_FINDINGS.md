<!-- markdownlint-disable MD001 MD024 MD025 MD033 MD060 -->

# MEGAPLAN V21 FINDINGS — Exhaustive Review & Consolidation

## §0 Baseline

Filled at Phase-0 close — see LEDGER §0. Working tree carries user's
fighter-concepts WIP (non-overlapping); baselines measured WIP-inclusive.
Dependabot: 4 vulnerabilities on default branch (1 high, 1 moderate, 2 low)
→ §B-registered.

## §1 Adjudication (locked — Phase 1, 2026-11-02)

Dedupe dry-run: zero verbatim cross-branch dupes, zero pre-existing dupes
(108 added strings checked vs all 5 main pools); fuzzy pass post-merge.

| PR | Verdict | Evidence |
| -- | ------- | -------- |
| #1076 bolt/chronicle | MERGE-WITH-FIXES — drop `.jules/bolt.md` (no `.jules/` on main); coverage-fail diagnosis deferred to merge (CI log shows no threshold line — flake or uncovered lines) | `roster: Warrior[]` non-nullable (game.ts:266) → flatMap safe; projection = JSX usage |
| #1072 palette/tooltip | MERGE | 'Session Controls' matches aria-label; `SeededRNG` determinism fix is a real flake fix |
| #1074 threads-of-chaos | MERGE-WITH-FIXES | CI TS2741 ×3: `weatherStats.ts:4`, `weather/index.tsx:45`, `weatherSuitability.ts:48`. OFFSEASON_WEATHER_TYPES membership is the documented event-only contract (enumSources.ts:79-83) — disposition `bucket:'offseason'`, visual `ArcaneStormEffect` (chaos-kin convention), stats string matching effect row. Balance: magnitudes ACCEPTED — 'Chaos Storm' (rollable, weight 0.1) ships damageMult 1.5/riposte +10; new row within chaos envelope |
| #1070 expand-lore-pools | MERGE-MINUS-TRAITS — reject `orphan_survivor_guilt_2` + `shadow_fighter_2`; keep `street_rat` | `shadow_fighter_2` display name 'Shadow Fighter' identical to existing `orphan_shadow_fighter`; `orphan_survivor_guilt_2` collides with 'Survivor\'s Guilt' |
| #1071 expand-narrative-pool | MERGE-MINUS-TRAITS — reject `gutter_phantom_two`; keep `gut_survivor`,`ash_breather` | 'Gutter Phantom II' lazy clone of Exceptional `gutter_phantom`; fractional `defMod:0.5` |
| #1075 add-new-narrative | MERGE | `orphan_iron_will`→exceptional, `gutter_shadow_striker`→notable; effects ⊆ TraitEffect |
| #1073 narrative-expansion | MERGE — drop `.claude/backups` hunk | `orphan_shadow_fury`→notable |
| #1077 lore-content-expansion | MERGE | lore only |

Union targets (pre-fuzzy-dedupe, recompute at merge): ORIGINS 411,
CHILDHOOD_TRAITS 245, DEFINING_MOMENTS 223, BACKFILL_2 35, ARENA_LORE ~131;
TRAITS 178+6 = **184** (6 surviving traits).

## §W Wiring / §D Dup / §A SRP / §K Dead code / §P Perf / §B Bugs / §V Verdicts

Populated through Phases 2–7.
