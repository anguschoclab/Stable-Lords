# V3 PR Disposition Table

All 55 open PRs evaluated against codebase. Dispositions verified by diffing branches against main and reading source code.

## Category A: Dependabot — Dependency Bumps (9 PRs)

| PR # | Package | Verdict | Rationale |
|------|---------|---------|-----------|
| #831 | @types/react 19.2.18 | MERGE | Types-only, upgrade first |
| #833 | @types/react-dom 19.2.4 | MERGE | Types-only, upgrade first |
| #832 | react-dom 19.2.8 | MERGE | VERIFIED: codebase uses createRoot, no deprecated APIs |
| #836 | react 19.2.8 | MERGE | VERIFIED: LOW RISK, no class components, no string refs |
| #835 | typescript 7.0.2 | MERGE | Upgrade after React; current installed is 5.9.3 (pkg says 6.0.2) |
| #830 | recharts 3.10.1 | MERGE | Check API changes in chart components |
| #866 | framer-motion 13.1.1 | MERGE | Check API changes in 27 files using framer-motion |
| #865 | lucide-react 1.33.0 | MERGE | Check for removed/renamed icons across 246 files |
| #834 | next-themes 0.4.6 | MERGE | Minor — safe |

## Category B: Bolt simulationMetrics (6 PRs — ALL DUPLICATES)

| PR # | Branch | Verdict | Rationale |
|------|--------|---------|-----------|
| #842 | bolt/generator-optimization-* | DISAPPROVED | Duplicate — #867 is cleaner |
| #859 | bolt-remove-generator-* | MERGE | Clean diff, verified identical approach |
| #863 | bolt/sim-metrics-generator-alloc-* | DISAPPROVED | Verbose, redundant null-checks |
| #867 | bolt-optimize-sim-metrics-iter-* | DISAPPROVED | Equivalent to #859, picking one |
| #871 | bolt/remove-generator-simulation-metrics-* | DISAPPROVED | Duplicate |
| #873 | bolt-optimize-sim-metrics-* | DISAPPROVED | Duplicate |

**Note**: Merge either #859 or #867 (both verified equivalent). Disapprove the other 5.

## Category C: Bolt Economy Loops (2 PRs)

| PR # | Branch | Verdict | Rationale |
|------|--------|---------|-----------|
| #825 | bolt-economy-reduce-optimizations-* | DISAPPROVED | 672-line junk routeTree.gen.ts, less comprehensive |
| #839 | bolt-economy-reduction-optimization-* | MERGE | More comprehensive (also optimizes totalIncome/totalExpenses), no junk |

## Category D: Narrative Content (18 PRs)

| PR # | Branch | Files | Verdict | Rationale |
|------|--------|-------|---------|-----------|
| #822 | combat-narrative-curation-* | 5 files, +380/-371 | DISAPPROVED | Massive rewrite, high conflict risk, mostly shuffling |
| #824 | feat/combat-chronicler-* | 3 files, +90/-49 | CHERRY-PICK | Clean additions to combat JSON, no junk |
| #828 | narrative-curation-* | 3 files, +37/-18 | CHERRY-PICK | Small clean additions to combat JSON |
| #840 | chore/narrative-content-expansion-* | 6 files, +75/-4 | DISAPPROVED | Contains junk files: test_roll.ts, test_type.ts |
| #843 | combat-narrative-curation-* | 1 file, +1/-1 | DISAPPROVED | Trivial — only changes slow test, no real content |
| #849 | narrative-pool-curation-* | 5 files, +65/-65 | DISAPPROVED | Net-zero change (shuffling, not adding) |
| #850 | feat/narrative-content-expansion-* | 38 files, +347/-134 | DISAPPROVED | Scope too broad — touches economy, combat, tests. Not a narrative PR |
| #852 | jules-narrative-expansion-* | 4 files, +728/-40 | DISAPPROVED | 672-line junk routeTree.gen.ts |
| #854 | narrative-expansion-* | 4 files, +96/-24 | MERGE | Clean arenas + lore + traits expansion, good content volume |
| #856 | jules-*-c26e0c9c | 3 files, +42/-20 | CHERRY-PICK | Clean combat JSON additions |
| #861 | lore-keeper-content-expansion-* | 10 files, +75/-20 | MERGE | Arenas + lore + traits + CI/e2e updates, well-rounded |
| #862 | palette/narrative-expansion-* | 4 files, +103/-74 | CHERRY-PICK | Combat JSON + uiMeta, good dedup |
| #864 | jules-narrative-refresh-* | 10 files, +80/-130 | CHERRY-PICK | Heavy dedup across all narrative files |
| #868 | lore-expansion-* | 4 files, +70/-18 | DISAPPROVED | Overlaps with #854 (same files: arenas, loreData, traitDefs) |
| #870 | combat-chronicler-narrative-expansion-* | 4 files, +131/-71 | MERGE | Largest clean combat JSON expansion |
| #872 | feature/combat-chronicler-curation-* | 8 files, +81/-35 | MERGE | Combat JSON + CI/e2e, well-rounded |
| #875 | feature/lore-expansion-* | 6 files, +51/-14 | DISAPPROVED | Overlaps with #854 and #861 (same files) |
| #877 | update-combat-narrative-* | 4 files, +48/-16 | MERGE | Clean combat JSON + package.json, includes kill text |

**Merge**: #854, #861, #870, #872, #877 (5 PRs)
**Cherry-pick**: #824, #828, #856, #862, #864 (5 PRs — unique content extracted)
**Disapprove**: #822, #840, #843, #849, #850, #852, #868, #875 (8 PRs)

## Category E: Palette/A11y (7 PRs)

| PR # | Branch | Verdict | Rationale |
|------|--------|---------|-----------|
| #823 | palette-select-aria-labels-* | MERGE | Broadest select a11y (5 files, includes package.json + test) |
| #826 | palette/common-controls-a11y-ids-* | MERGE | Unique — CommonControls slider IDs |
| #829 | palette-a11y-select-labels-* | DISAPPROVED | 672-line junk routeTree.gen.ts |
| #845 | palette-aria-labels-* | DISAPPROVED | 3-file subset of #823 |
| #848 | palette-ux-link-button-* | MERGE | Unique — Link/Button fix |
| #855 | palette-condition-a11y-* | MERGE | Unique — Plan Builder condition selects |
| #874 | palette-aria-labels-* | MERGE | Unique scope — IdentitySection, NewGameForm, SaveSlotCard, EditableText |

## Category F: Test Smith (4 PRs)

| PR # | Branch | Verdict | Rationale |
|------|--------|---------|-----------|
| #821 | test-smith-combat-checks-* | MERGE | 292 lines — attackCheck, defenseCheck, riposteCheck. Updates determinismAudit 36→40 |
| #846 | test-smith/combat-resolution-* | MERGE | 512 lines — combat damage, fatigue, math, bleed, counterstrike, guardBreak, psychState |
| #853 | test-smith-career-update-* | MERGE | 42 lines — careerUpdate coverage |
| #860 | test-coverage-expansion-* | MERGE | 414 insertions — injury/trait tests. CONFLICT on determinismAudit.test.ts:56 (same change as #821). Verify no assertion relaxation in refactored tests |

## Category G: Chaos Weaver/Features (6 PRs)

| PR # | Branch | Verdict | Rationale |
|------|--------|---------|-----------|
| #827 | feature/suspicious-mushroom-stew-* | MERGE | Offseason event only (7 files, no weather type). No weather count conflict |
| #841 | chaos-weaver/weeping-skies-* | MERGE | Weather + offseason event (18 files). Must update weather count test |
| #844 | feat/winds-of-chaos-weather-* | MERGE | Weather only (11 files). Must update weather count test |
| #847 | feature/shattered-skies-* | MERGE | Weather + offseason event (17 files). Most comprehensive. Must update weather count test |
| #857 | feature/ethereal-mist-weather-* | DISAPPROVED | Overlaps with #844 — same files, same weather type pattern |
| #858 | chaos-weaver-offseason-weather-* | MERGE | Offseason event + weather buff (9 files). Different scope from others |

**Merge order for weather PRs**: #827 (no weather) → #841 → #844 → #847 → #858 (one at a time, update count test each)

## Category H: Sentinel/Security (2 PRs)

| PR # | Branch | Verdict | Rationale |
|------|--------|---------|-----------|
| #851 | sentinel-fix-markdown-xss-* | MERGE | XSS fix — add urlTransform={defaultUrlTransform}. TEST FIRST: write XSS regression test |
| #876 | sentinel-fix-xss-reactmarkdown-* | DISAPPROVED | Identical to #851 |

## Category I: UI Polish (1 PR)

| PR # | Branch | Verdict | Rationale |
|------|--------|---------|-----------|
| #869 | ui-polisher-accessibility-visual-refiner-* | MERGE | 16 files, +41/-38. Design Bible fixes (surface-utils, weather effects, dialogs). Clean |

## Summary

| Verdict | Count |
|---------|-------|
| MERGE | 25 |
| CHERRY-PICK | 5 |
| DISAPPROVED | 25 |
| **Total** | **55** |
