# Port "How to Build a Better Warrior" (Arena 93) — design doctrine + live builder review

✅ **COMPLETED.** Neon Necromancer's Arena-93 article is now canon data plus a live Design Review panel in the WarriorBuilder, built test-first.

## What shipped

**Content port**
- `src/data/designDoctrine.ts` — `StyleFamily` + `STYLE_FAMILY` (offensive LU/SL/ST/AB/BA, defensive TP/PR/PS, mixed WS/PL), `FAMILY_GUIDE` doctrines, `DESIGN_REVIEW_THRESHOLDS`.
- `src/data/fighterConcepts.ts` — 3 new concepts (canon 84-pt → auto-scaled): LU "Broke Stroker" (8/8/8/13/13/9/11), SL "Scimitar Adept" (7/7/12/11/14/8/11), ST "Low-Will Wonder" (14/8/6/14/7/12/9). Flow into builder presets, Style Archives, AI recruits.
- `src/pages/help/sections.tsx` + `Help.tsx` — new "Designing a Warrior" codex section (accordion value `design`).
- `src/pages/styleArchives/StyleCard.tsx` — family label + key attrs on every ConceptsPanel.
- `docs/Stable_Lords_Warrior_Design_Arena_93_v1.0.md` — companion doc with canon/scaled tables.

**Live advisor**
- `src/engine/warrior/designReview.ts` — pure `reviewWarriorDesign(attrs, style)` scoring the five axes: family key attrs (mixed uses min ATT/PAR/DEF), ≥1 physical at "good"+ (endurance tier/damage class/HP), well-suited weapons met via real reqs (SZ deficits never trainable; "in reach" = ST/WT/DF deficit ≤2), breakpoint-primed trains on {ST,WT,WL,SP,DF} + 21+ premium trains + TP scum-WT note + AB deftness canon tip, WT/WL longevity profiles.
- `src/components/WarriorBuilder/components/DesignReviewCard.tsx` — verdict-colored item list, mounted between `PhysicalsPreview` and `CreateButton`.

## Verification (all green)

- `bun run test` — 913 files / 9845 tests pass (test-first: new specs authored and confirmed failing before implementation)
- `bun run type-check` — 0 errors
- `bun run lint` — 0 errors
- `bun run e2e` — 5/5 chromium specs pass

## Ratchet/test adjustments made during implementation

- `runnerGroups.json` + `auditBaseline.json` regenerated via `scripts/test-audit-scan.mjs` (new test files → new isolation signals).
- `generateRecruitAttrs` striker assertion re-ratcheted: pool now mixes a low-DF canon build, so DF is no longer a clean +1 trend; WT leadership (+2.33) kept as the assertion.
- `designReview.ts` — namespace-imported `skillBreakpoints` (dedupe guard), extracted `nextThreshold`/`trainableDeficit` helpers (scan-in-loop guard), `Object.entries` iteration (non-null lint rule).
- Help section link labels made unique (`Try the Design Review`, `Style families in the archives`) to avoid a11y duplicate-link collisions.

## Known consequences (accepted)

- Seeded recruit pools shift for LU/SL/ST (larger concept pools + `conceptMean` drift).
- Slasher `conceptPrimaryAttr` flips WT→WL → apprentice signings get +1 WL (canon-consistent).
