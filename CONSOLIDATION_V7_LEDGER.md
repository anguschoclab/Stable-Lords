# V7 Consolidation Ledger (working file — folded into CONSOLIDATION_FINDINGS_V7.md at end)

## Environment note

Working **in-place** at `~/Documents/GitHub/stable-lords` per user direction (V5/V6 worked in `~/dev/` clones).
`brctl status` on repo path → "Client zone not found" (path not in a managed sync zone at check time); pack files healthy (2.1 MB + 32.7 MB); `git fsck --full` clean (dangling objects only); `bun install` restored 45 pkgs with **zero bun.lock churn**; key binaries materialized.

## Restore point

`pre-v7-consolidation` → `63c5b72d` (local; pushed in Phase 7).

## Baseline metrics (Phase 0, in-place)

| Metric | Baseline value | vs V6 final |
| ------ | -------------- | ----------- |
| type-check | **0 errors** | 0 — same |
| lint | **0 errors / 3 warnings** | 0/0 — REGRESSED (3 jsdoc warnings: `CouncilFilterTabs.tsx`, `CouncilBriefingWidget.tsx`) |
| test:all | **696 files / 7,952 pass / 2 FAIL / 2 skip** | 662/7,718/0 — RED (N-B) |
| build | OK, **159 precache** (5,306.87 KiB) | 156 — grew as expected |
| electron:compile | OK, 25.23 KB | same |
| narrative-validate | pass | pass |
| test:bun (CI) | **RED on main** | not in V6 metrics — N-A |
| test:slow (CI + local) | **RED** (2 fails) | not in V6 metrics — N-B |
| bun.lock artifactory refs | 0 (N4 pin holding) | same |
| Math.random in src excl. tests | — pending audit | 0 expected |

## Findings log

| id | file:line | category | severity | evidence | verdict | commit |
| --- | --------- | -------- | -------- | -------- | ------- | ------ |
| N-A | src/lib/bibleIndex.ts:31; src/test/buildConfigIntegrity.test.ts:89-97 | CI/bun compat | high | `import.meta.glob('../../docs/*.md', {query:'?raw',eager:true})` → unhandled `TypeError` under bun (bun glob lacks `?raw`/`eager` semantics); buildConfigIntegrity test execSyncs `bun run type-check` → nested `bun x` resolves deps + "Saved lockfile" mid-test, exits non-zero on CI | pending | — |
| N-B1 | src/test/engine/combat/traitBalance.slow.test.ts:204 | balance regression | high | `sturdy` (fightPlanMod AL-3/OE-2/killDesire-5 + CN/SZ+1) wins 26.67% < 32% floor — deterministic same value local+CI. Suspect: `5f92de0e` exhaustion-stoppage HP gate removed the stall-win condition defensive plans relied on (commit msg itself cites defensive monopoly). Decide: rebalance trait vs widen band | pending | — |
| N-B2 | src/test/engine/sim/worldLiveness.integration.slow.test.ts:59 | sim regression | high | `end.totalBouts (642) > mid.totalBouts (740)` fails — bout volume decays in second half of 26-week sim | pending | — |
| N-C | PR #990 `useAdminTools.test.ts` | PR defect | medium | replaces documented bun-safe `vi.spyOn` with `vi.mock`+`importOriginal` (unsupported under bun:test per file comment) → would deepen N-A. REJECT that hunk; extract #986 instead | pending | — |
| N-D | src/pages/Advisor/components/{CouncilFilterTabs,CouncilBriefingWidget}.tsx | lint hygiene | low | 3 new `jsdoc/require-jsdoc` warnings post-V6 (0/0 baseline drifted to 0/3) | pending | — |

## PR dispositions (Phase 2 — diffs read; comments all Jules boilerplate)

| PR | Branch | Category | Verdict | Extraction plan | Evidence |
| -- | ------ | -------- | ------- | --------------- | -------- |
| #983 | narrative-curation-…62430 | combat narrative | EXTRACT→union | combatPbp/Strikes/KillText deltas → curated union; strip `.claude/backups/narrative/removed_entries.json` | +63/−26 |
| #984 | lore-expansion-…60441 | lore+traits | EXTRACT→union | ORIGINS/CHILDHOOD/DEFINING + ARENA_LORE union; +3 traits (orphan_street_rat/pit_fighter/survivor — valid keys, no killWindowBonus, not in REMOVED_IDS); EXPECTED_COUNT 148→recompute | +65/−9 |
| #985 | ui-polish-winscreen-a11y-… | a11y | APPROVED/EXTRACT | WinScreen.tsx wholesale (+aria-labels, motion-reduce, focus-visible rings) | +4/−2, clean |
| #986 | bolt-optimize-contract-data-… | perf | APPROVED/EXTRACT | useContractData.ts useMemo+single-pass (superior impl); strip `.jules/bolt.md` | +29/−5 |
| #987 | expand-coverage-… | tests | APPROVED/EXTRACT | 2 test files verbatim; tidy `: any` if lint-clean version trivial | +37/−0 |
| #988 | feature/new-arenas-… | feature | PARTIAL-pending | 4 arenas + events + weather mods + constants; **magical tag weight 0.95→0.93 needs explicit disposition** | +102/−3, 7 files |
| #989 | chore/narrative-expansion-… | combat narrative | EXTRACT→union | same as #983; strip `.claude/backups/narrative/consolidated_duplicates.json` | +361/−22 |
| #990 | bolt/optimize-contract-data-… | perf | PARTIAL/SUPERSEDED | hook diff superseded by #986 (no useMemo); **reject useAdminTools.test.ts rewrite (N-C)** | +27/−4 |
| #991 | update-lore-… | lore | EXTRACT→union | loreData + arenas.ts lore union; strip `.claude/backups/narrative/lore/archived_duplicates.json` | +41/−7 |
| #992 | ui-polish-colors-… | ui tokens | APPROVED/EXTRACT | 3 component diffs; **strip bun.lock churn**; destructive=358° hue family — semantically correct | +59/−63 |
| #993 | jules-…cec1c58 | combat narrative | EXTRACT→union | same as #983 | +89/−36 |
| #994 | fix-narrative-bloat-… | combat narrative | EXTRACT→union | same; strip `.claude/backups/narrative/removed_duplicates.json` | +56/−18 |
| #995 | chore/narrative-lore-… | lore+traits | EXTRACT→union | union + iron_orphan trait (valid: defModLowHp+enduranceMult); EXPECTED_COUNT 146→recompute; strip `.claude/backups/lore/archived_lore.json` | +54/−9 |
| #996 | bolt/optimize-stable-council-report-… | perf | APPROVED/EXTRACT | single-pass loop w/ required `!c` guard (noUncheckedIndexedAccess); `?.` redundant (fields required, advisor/types.ts:125) but harmless; drop stray blank lines | +18/−11 |

### Artifact strip list

- `.claude/backups/**`: #983, #989, #991, #994, #995
- `.jules/bolt.md`: #986
- `bun.lock` churn: #992
- #990 `useAdminTools.test.ts` rewrite: rejected (N-C)

### Narrative union plan (Cluster A)

Files: `combatPbp.json`, `combatStrikes.json`, `combatKillText.json` — 4 branches each.
Merge rule per leaf: `(base − union(removals)) ∪ union(additions)`, keyed on `text`, first-seen order, removals need ≥2-PR consensus, then canonical dedupe + narrative_validate + narrativeContent* suites.

### Lore union plan (Cluster B)

`loreData.ts` ORIGINS/CHILDHOOD_TRAITS/DEFINING_MOMENTS + `arenas.ts` ARENA_LORE across #984/#991/#995 (+21/+24/+21 lines each). Traits: union 4 candidates → `traitDedup.test.ts` EXPECTED_COUNT = 145 + unique-accepted (max 149).

## Test-first tracker (Phase 3A gate)

| Change item | Required tests | Test file | Gate | Impl commit |
| ----------- | -------------- | --------- | ---- | ----------- |
| Cluster A union | leaf-count + schema + validate | existing narrative suites + new count asserts | pending | — |
| Cluster B traits | EXPECTED_COUNT + REMOVED_IDS non-membership | traitDedup.test.ts | pending | — |
| #988 arenas | registry count + PR tests ported + magical-weight disposition test | newArenaArchitect/arenaFit | pending | — |
| #986 hook | characterization (outputs + memo) | src/test/**/useContractData.test.ts (new) | pending | — |
| #996 report | KPI characterization | src/test/engine/advisor/… | pending | — |
| #985 a11y | aria/focus/motion-reduce asserts | WinScreen test | pending | — |
| #992 tokens | no raw rgba(255,0,0 in 3 components | source assertion test | pending | — |
| N-A | bun-collectable spec or ignore-list contract | TBD | pending | — |
| N-B | failing slow specs themselves | existing | pending | — |
