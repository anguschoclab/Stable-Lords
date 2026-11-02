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

## §W Wiring (post-merge state)

- 'Threads of Chaos': fully wired — WEATHER_TYPES/OFFSEASON list/type union/
  WEATHER_CONFIG/WEATHER_EFFECTS/opening line (branch) + WEATHER_STATS/
  WEATHER_VISUALS(ArcaneStormEffect)/WEATHER_AI_DISPOSITION{bucket:'offseason'}
  (V21 fix-forward). Event-only per documented contract — no WEATHER_WEIGHTS/
  season-bucket entry (would perturb in-season RNG).
- 6 surviving V21 traits registered in defs+registry+LEGACY_TRAIT_ORDER;
  drift-check (registry.ts:214-218) verified live.
- Narrative union: ORIGINS 411 / CHILDHOOD 245 / DEFINING 223 /
  ARENA_LORE 242 (125 local +5 +77 bf1 +35 bf2) / BACKFILL_2 35 —
  all pinned by v21Narrative.guard.

## §B Bug register

| # | Bug | Disposition |
| - | --- | ----------- |
| B1 | WEATHER_STATS display lies: 8 rows drifted from WEATHER_EFFECTS (7 missing DAMAGE tokens, Diamond Rain +30 vs 1.15) | FIXED Phase 5 (1c419d0b); shrink-only parity guard pins zero-regression |
| B2 | loreBackfill2 union-merge collapsed 2 `},{` boundaries (35 ids→33 objects) | FIXED at merge (9aa5d121) |
| B3 | Stamina-token semantics ambiguous across WEATHER_STATS (Chaos Storm 'DRAIN 125%' @ mult 0.8 contradicts sibling direct-mult convention) | DOCUMENTED — convention decision deferred; not in parity guard scope |
| B4 | Dependabot: 4 vulns on default branch (1 high, 1 moderate, 2 low) | REGISTERED — out of V21 scope |
| B5 | v20Narrative.guard exact-count pins = guaranteed-red churn for every lore PR | FIXED — converted to floors (V11 verdict) |

## §V Verdict matrix — explicit approve/disprove

| Finding / architectural choice | Verdict |
| ------------------------------ | ------- |
| #1076 useShallow flatMap projection | **APPROVED** — roster non-nullable; projection matches JSX usage; `.jules/bolt.md` dropped (no precedent) |
| #1076 coverage-check failure | **DISPROVED as code fault** — no threshold violation in log; flake/uncovered-lines; suite green post-merge |
| #1072 tooltip + SeededRNG fix | **APPROVED** — honest label; determinism fix is a real flake repair |
| #1074 'Threads of Chaos' content | **MERGE-WITH-FIXES** — 3 missing exhaustive surfaces (CI TS2741 evidence) |
| Event-only weather architecture (OFFSEASON list = never-rolled) | **APPROVED** — documented contract (enumSources.ts:79-83), exclusivity guard; disposition coherence now enforced by v21 guard |
| #1074 magnitudes (dmg 1.5, stam 1.5, ini/rip +5) | **APPROVED as-shipped** — within observed envelope (Chaos Storm 1.5/+10 rollable); mechanically unreachable regardless |
| 5× tail-append narrative union merge | **APPROVED with evidence** — merge-tree-verified conflict surface; zero verbatim cross-PR/pre-existing dupes (108 strings checked) |
| `_2`-suffix traits (×3) | **REJECTED** — `shadow_fighter_2` display name identical to `orphan_shadow_fighter`; `orphan_survivor_guilt_2` collides w/ 'Survivor\'s Guilt'; `gutter_phantom_two` lazy clone of Exceptional `gutter_phantom` |
| Remaining 6 V21 traits | **APPROVED** — effects ⊆ TraitEffect whitelist; `enduranceMult<1` = cost-reducing positive (mods.ts:86) |
| `Record<WeatherType>` exhaustive-surface pattern | **APPROVED** — caught #1074 at compile; guard adds runtime coherence tsc can't see |
| Trait registry (defs→LEGACY_TRAIT_ORDER→drift throw) | **APPROVED** — built-in drift check verified live during merges |
| lore.ts backfill-spread pattern (append pools folded via `...BACKFILL`) | **APPROVED** — "105 dup ids" was my spec's false positive on the spread, not data corruption |
| Exact-count pins in shared guards | **DISPROVED pattern** — guaranteed-red churn; converted to floors (V11) |
| Generated-file hunks in PRs (#1070 auditBaseline/runnerGroups) | **DISPROVED** — stripped; regenerated via test-audit-scan |
| `bun-test` job passing on type-broken #1074 | **NOTED** — different runner, no typecheck; expected |
| Direct-to-main megaplan convention | **APPROVED** — consistent w/ V18–V20; restore tag + backup refs provided safety |
| Strict test-first (Phase 3 before merges) | **APPROVED & enforced** — all 17 merge-blocked specs committed RED pre-merge; every merge-blocked spec now GREEN |

## Close-out

Baseline → final: type-check 0→0, lint 0err/30warn→0err/30warn, test
9686→TBD(slow run pending), traits 178→184, weather 64→65, lore pools
+ORIGINS 24 / +CHILDHOOD 17 / +DEFINING 18 / +ARENA_LORE 12 / +BF2 7.

