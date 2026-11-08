# MEGAPLAN V25 — Assur's Winning Warrior Types Canon Integration (VALIDATED)

Port Assur's Arena-93 "winning warrior types" corpus (Pure Offensives, Pure Defensives, Tank Hybrids + low-will addendum, High-Skill Hybrids, Riposting Hybrids, Winning Warrior Types, What the Style) into the game as a new archetype data module, Design Review guidance, fighter concept builds, codex/archives content, AI doctrine and armor fitting, and a mechanics audit — as MEGAPLAN V25 per house convention, strictly test-first.

## Context

The supplied articles are Assur's Arena-93 archetype doctrine: the "three basic ways to win" (Offensives / Defensives / Hybrids) plus five archetype guides — Pure Offensive, Pure Defensive, Tank Hybrid, Low-Will Tank Hybrid (addendum), High-Skill Hybrid, Riposting Hybrid — and "What the Style" per-style assessments. This is a **new taxonomy orthogonal to `StyleFamily`** (`designDoctrine.ts`, offensive/defensive/mixed, from the Neon Necromancer article): style-family describes how a style fights; winning archetype describes how a *build* wins.

**Sequencing:** `MEGAPLAN_V24` (strategy/tactics/equipment canon) is in-flight on `main` — Phase 1 spec batch committed (`9a974a72`), implementation phases pending; `MEGAPLAN_V24_LEDGER.md` open. This corpus is a distinct batch → **MEGAPLAN V25**, landing on top of V24's tree. Shared files with V24: `designDoctrine.ts`, `designReview.ts` (V24 Phase 9), `fighterConcepts.ts`. V25 phases touching them merge around V24 hunks.

**Constraints:** zero save-file/backwards-compat (user-locked). New data is additive; `Warrior` untouched.

**House convention** (V18–V24 precedent): `git tag pre-megaplan-v25`; `MEGAPLAN_V25_{FINDINGS,PLAN,LEDGER}.md` in repo root; **test-first is binding** — Phase 1 authors the entire spec batch before any implementation commit; every spec compiles and is observed RED (assertion failures, not import errors); already-correct behavior gets `[regression-lock]` specs; ledger row per commit.

**WIP caveat:** uncommitted user changes in `src/components/equipment/EncumbranceBar.tsx`, `src/data/equipment/equipment.utils.ts`, `src/data/equipment/weapons/items.ts` (V24 Phase-2 work in progress — BA offhand rows, SH↔SS, EncumbranceBar LIGHT/MEDIUM). Merge around them; never stage their files wholesale.

## §0 Validation addendum — draft audited against code

Each draft premise re-checked by reading the code. Verdicts: **APPROVED** / **CORRECTED** / **DISPROVED** / **NEW FINDING**.

| Draft item | Verdict | Evidence |
|---|---|---|
| `concept()` auto-scales 84→70 | **APPROVED** | `fighterConcepts.ts:124-135` — `scaleToAttributeBudget` (floor + largest-remainder, deterministic ties by `ATTRIBUTE_KEYS` order). `ATTRIBUTE_TOTAL=70`, MIN 3, MAX 25 (`shared/attributes.ts`). Article spread order ST-CN-SZ-WT-WL-SP-DF **equals** `ATTRIBUTE_KEYS` order — no remap needed. All 10 candidate spreads sum to 84 (verified arithmetically). |
| Concepts auto-flow to recruit gen | **CORRECTED** | Player recruits + orphans: `generateArchetypeAttrs` (`statGeneration.ts:40`) does `rng.pick(concepts)` — new spreads change *outcomes* on the same draw count → seeded world outputs change → re-baseline required. AI rivals: `generateAIRecruit` uses `generateRecruitAttrs` (`recruitGenerator.ts:85`), a ticket pool weighted by `conceptMean` — new concepts shift the mean → distribution changes with no RNG-count change. Both surfaces need world re-baseline, not RNG-order fixes. |
| fileBudget risk on fighterConcepts.ts | **CORRECTED — mostly a non-issue** | `fileBudget.test.ts`: `DATA_FILE_CEILING=1300` for `src/data/**`; fighterConcepts at 880 → ~950 with ~10 new concepts — comfortably under. The ">800 files" counter is already baselined at 4 including this file; line growth doesn't add a file. The *real* guard obligations are the **duplication guard** entries below. |
| Duplication guard | **NEW FINDING — must register** | `duplication.guard.test.ts` `MIXED_EXEMPT_PAIRS`: new spec files re-stating canonical literals must be registered (precedent: `fighterConcepts.ts|fighterConcepts.test.ts` for exactly this reason). Required entries: `src/data/fighterConcepts.ts|src/test/data/fighterConcepts.v25.test.ts`, `src/data/warriorArchetypes.ts|src/test/data/warriorArchetypes.canon.test.ts`, and any doctrine-literal pins (e.g. `designDoctrine.ts|designReview.v25.test.ts`) — plus `MIXED_BASELINE` bump per ledger comment. |
| Burn order already canon | **APPROVED — regression-lock** | `*_ENDURANCE_MULT`: LU 1.05, WS 1.03, SL 1.01, BA 1.0, PL 0.99, ST 0.97, PR 0.96, AB 0.95, PS 0.93, TP 0.9 — exactly Assur's LU>WS>SL>BA>PL>ST>PR>AB>PS>TP; pinned by `src/test/constants/burnOrder.test.ts`. Also confirms "endurance-conserving styles: PS/AB/TP/PR" (four lowest). |
| Dodge→riposte | **APPROVED — regression-lock** | `offenseDefense/defense.ts:234-252` — successful dodge fires `performRiposteCheck` (V22 landed). |
| Encumbrance channel | **APPROVED — regression-lock** | `encumbrance.ts` tiers + `enduranceMult` 1.05→2.0; canon "don't over-encumber your hybrid" mechanically real; V23 locked parry-neutrality (do not re-add parPenalty). |
| Riposte tactic exists | **APPROVED — regression-lock** | `DefensiveTactic` includes 'Riposte'; `tacticSuitability.ts` LU/TP/PR/AB/WS/PS 'WS', PL 'S', SL/BA 'U'. Assur's "hardest styles to riposte are SL/LU" refers to *riposting them*, not them riposting — a different axis, no contradiction. |
| Favorite-rhythm bands | **APPROVED — harmonised** | `STYLE_RHYTHM_RANGES` (`favorites.ts:37-51`) brackets Assur's "most common favorites" (PR 3-4OE/5-6AL ⊂ code 3-6/4-7; TP 1-2/3-4 ⊂ 1-4/1-4; L 7-8/7-8 ⊂ 6-9/6-9; WOS 5-6/3-4 ⊂ 5-9/2-7). PL is deliberately wider (Tripwire canon). Ranges intentionally widened for default-plan coverage — keep, document. |
| **Rhythm bonus always-on** | **DISPROVED — still discovery-gated** | `favorites.ts:300`: `if (!fav?.discovered.rhythm) return 0` — the file header claims "bonuses are ALWAYS ON" but the rhythm bonus is NOT; V22 Phase-4.8 apparently never landed. Promoted to Phase-7 audit fix (canon: rhythm works hidden — "warriors fight better at their favorites" whether or not the manager knows them). |
| Weapon req lists | **CORRECTED — articles omit SZ** | Article lists ("Maul 15/5/7", "LS 11/5/9") silently drop SZ reqs; `items.ts` verified: MAUL 15/9SZ/5/7, LS 11/9SZ/5/9, QS 11/9/11/11, WH 13/5/7, GS 15/9/9/11, HL 17/9/9/11, GA 13/9/11, LO 11/13/11, BA 15/3SZ/7/9 + offhand SZ9 (V24 fix in WIP), BS 11/9/7, HA 7/5/7, DA 3/7/7 (V24 pending WT7). Spec asserts the `items.ts` table, not article fragments. |
| "APA/F is the norm" for tanks | **CORRECTED — style-restricted** | `armor.ts`: `plate_armor` (APA, w14) restricted for AB/LU/SL; `plate_mail` (APM, w12) restricted for AB/LU. Canon armor advice applies only to legal styles — archetype guidance must filter by `restrictedStyles` (AB tanks use ASM/x; LU can't tank in plate at all, matching Assur's "low size" dodge-defensive caveat). Carry bars from canon (APL 9 / ASM 11 / APA 14 Str+Con each) map to house ids `padded`/`leather` → `scale_mail` → `plate_armor`. |
| AI tank armor ("APA/F for AI") | **NEW FINDING — real gap, HIGH impact** | `getStyleDefaultLoadout` gives every warrior `leather` + `leather_cap` at creation; `EquipmentPass` only swaps to discovered favorite weapons — **AI rivals never upgrade armor**. Scum in leather is canon-wrong. `equipmentOptimizer.ts` has style-keyed build profiles ('tank' prefers heavy) but is a UI recommendation tool, not applied to rivals. Genuine new mechanic: archetype-aware armor fitting honoring `restrictedStyles` + carry — flagged HIGH balance impact (rival survivability) → own spec + mandatory world re-baseline. |
| Encumbrance note in Design Review | **APPROVED — feasible, new** | `reviewWarriorDesign(attrs, style)` is pure; no carry check exists today. `computeEncumbranceCapacity(ST,CN)` (`terrabloodCharts`) + item `weight` make "would APA/F-class loadout over-encumber this frame?" computable in-review. |
| `applyStyleDoctrine` hook point | **APPROVED** | `coreGenerator/index.ts:110` calls `applyStyleDoctrine(plan, w)` with full `Warrior` (attributes available) after suitability bias — archetype shaping slots in after the style caps, same function region as V24 Phase-9 low-burn steering (merge, don't duplicate). |
| Matchup AL-throttle vs scum | **APPROVED — partially implemented** | `getStyleMatchupMods` already throttles: ST-vs-TP {oe−1,al−1} (Blind Man's grind), LU-vs-TP/PR {oe−2}, TP-vs-LU/WS {oe−2,al−1}. Assur's "run 1 AL vs pure defensives" is directionally covered; audit whether magnitude suffices — `canonTargeting` challenge biases already encode the avoid side. |
| `STYLE_ARCHETYPE` name collision | **CORRECTED — document, don't rename** | `statGeneration.ts` `Archetype = 'brutal'|'agile'|'cunning'|'tank'` feeds `generateTraits` + `generateWarriorName`/`cultureForArchetype` (name/trait flavor axis, 8 call sites). Renaming ripples for zero gain — keep it, name the new type `WinningArchetype`, and add a distinguishing comment at both definitions. |
| Warrior Builder concept picker | **APPROVED — free wiring** | `IdentitySection.tsx` reads `FIGHTER_CONCEPTS` directly — new entries appear automatically; `useWarriorBuilderState` applies `stats` spread. No UI code needed for Phase 4. |
| Test-first mandate | **APPROVED — strengthened** | Every implementation item below names its spec; Phase 1 lands all specs RED first (V24 precedent: compile + assertion-fail observed). Mechanics fixes each get a RED spec before the fix. |
| Heuristic vs chart claims | **APPROVED — document, never revert** | Assur's SP-13-riposte breakpoint and "5+ RIP base" rule are player heuristics; `SP_RIP` table is chart-corrected per V22 (+1@13, +2@11) — advisory copy only, no table edits. `ENC_TABLE` stays Terrablood canon over Assur's ST+min(ST,CN)−6 heuristic (V24 finding already locked this). |

## §1 Phase table

| Phase | Content | Balance risk | Gate |
|---|---|---|---|
| 0 | Docs: tag, FINDINGS (full adjudication), PLAN, LEDGER | none | typecheck |
| 1 | Spec batch RED — all specs authored, compiled, observed failing | none | specs RED |
| 2 | Archetype data module | none | fast tier |
| 3 | Design Review archetype-fit | none | fast tier |
| 4 | Fighter concept builds | low (recruit/AI distributions shift) | concepts spec + re-baseline flag |
| 5 | Codex + Style Archives surfaces | none | component specs + e2e smoke |
| 6 | AI: archetype plan shaping + tank armor fitting | **HIGH** (rival survivability, plan mix) | doctrine/armor specs + world re-baseline |
| 7 | Mechanics audit: rhythm always-on + residue | MED | each fix spec-first + lab |
| 8 | Ratchet + close-out | — | full + slow + world |

## §2 Phase 1 — Spec batch (all authored before implementation)

| Spec | Asserts | Status |
|---|---|---|
| `src/test/data/warriorArchetypes.canon.test.ts` | 6 archetypes w/ label/doctrine/keyStats/designBars/recommendedStyles/armor/strategy; `STYLE_ARCHETYPE_FIT` covers all 10 styles (LU ≥3 fits; TP ⊆ {pureDefensive,tankHybrid,ripostingHybrid}; ST ⊆ pureOffensive); weapon ids resolve in `items.ts`; armor ids respect each listed style's `restrictedStyles` | RED |
| `src/test/engine/warrior/designReview.v25.test.ts` | classification items: tank ST/CN bar, offensive WT≥11 warn, SP 10–12 riposte dead-band info, high-SZ hybrid note, AB low-ST viability info, hybrid over-encumbrance warn via `computeEncumbranceCapacity` | RED |
| `src/test/data/fighterConcepts.v25.test.ts` | each new build: `canonStats` sums 84, `stats` sums `ATTRIBUTE_TOTAL`, clamps honored; named entries (Snotling lineage, flagship WS tank) present | RED |
| `src/test/components/styleArchives/archetypeTags.test.tsx` | StyleCard renders archetype-fit chips sourced from `STYLE_ARCHETYPE_FIT` (no hardcoded labels) | RED |
| `src/test/pages/help/winningTypes.test.tsx` | codex section: three ways to win + archetype list + style tier notes | RED |
| `src/test/engine/ai/archetypeDoctrine.test.ts` | tank-classified warrior → OE floored ≥5; pure-defensive-classified → capped low plan; riposte-classified non-riposte-learning styles (LU/WS/TP/PL) eligible for Riposte tactic | RED |
| `src/test/engine/equipment/archetypeArmor.test.ts` | archetype-aware armor fitting: tank build → heaviest legal armor within carry + `restrictedStyles`; hybrid build → no OVER; AB never gets plate | RED |
| `src/test/megaplan/v25Archetypes.guard.test.ts` | data integrity: FIT map total coverage, bars within [3,25], no concept sum ≠ 70, armor/weapon ids resolve | RED |
| `src/test/engine/combat/v25MechanicsAudit.test.ts` | regression-locks: burn order (re-pin), dodge→riposte, Riposte tactic in WS pools, encumbrance endurance channel, `NO_ARMOR_ADD` | [regression-lock] |
| `src/test/engine/favorites/rhythmAlwaysOn.test.ts` *(if Phase-7.1 proceeds)* | `getFavoriteRhythmBonus` returns bonus with `discovered=false` | RED |

## §3 Phase 2 — Archetype data module

New `src/data/warriorArchetypes.ts`, mirroring `designDoctrine.ts`/`styleCompendium.ts` conventions:

- `export type WinningArchetype = 'pureOffensive' | 'pureDefensive' | 'tankHybrid' | 'lowWillTankHybrid' | 'highSkillHybrid' | 'ripostingHybrid'` (comment: distinct axis from `statGeneration`'s name-flavor `Archetype`).
- `WINNING_ARCHETYPES: Record<WinningArchetype, ArchetypeGuide>` — `label`, `family`, `doctrine`, `keyStats`, `designBars` (scaled 84→70 guidance), `recommendedStyles`/`cautionStyles`, `weapons` (ids resolved against `items.ts` — spec-enforced), `armor` (with `restrictedStyles` caveat — spec-enforced), `strategy { oeBand, alBand, tacticNotes }`, `notes`.
- `STYLE_ARCHETYPE_FIT: Record<FightingStyle, WinningArchetype[]>` — initial mapping from "What the Style" + archetype guides: LU {pureOffensive, pureDefensive, tankHybrid, highSkillHybrid, ripostingHybrid}; WS {tankHybrid, highSkillHybrid, pureDefensive, lowWillTankHybrid}; AB {highSkillHybrid, ripostingHybrid, lowWillTankHybrid, pureOffensive, pureDefensive}; PR {ripostingHybrid, pureDefensive, tankHybrid}; TP {pureDefensive, ripostingHybrid, tankHybrid}; BA {pureOffensive, tankHybrid}; ST {pureOffensive, tankHybrid}; SL {pureOffensive, tankHybrid}; PS {pureDefensive, tankHybrid, pureOffensive}; PL {pureDefensive, tankHybrid, ripostingHybrid}. (Exact per-style membership finalized in FINDINGS.)
- `ARCHETYPE_DESIGN_BARS` named constants.
- `classifyArchetype(attrs, style): { archetype, score }[]` — pure scoring over designBars ∩ style fit; consumed by Design Review and AI.

## §4 Phase 3 — Design Review (`src/engine/warrior/designReview.ts`)

- New `reviewArchetypeFit(attrs, style)` appended to `reviewWarriorDesign`'s chain. Emits: best-fit archetype `info` item; targeted warns/infos:
  - 'Tank frame' — tank-fit build short of scaled ST/CN bars.
  - 'Offensive wit' — WT < 11 on offensive-fit (canon: bare minimum).
  - 'Riposte dead band' — SP 10–12 on riposte-fit (Assur heuristic, advisory).
  - 'Big hybrid' — SZ high on hybrid-fit (points squeezed; canon: size suits offensives).
  - 'Surgeon chassis' — AB with low ST (canon: uniquely viable).
  - 'Over-encumbered hybrid' — computed carry capacity vs canonical APA/F-class loadout weight for hybrid-fit builds (uses `computeEncumbranceCapacity` + item weights).
- `DesignReviewItem.id` on each (V24 convention); merge around V24 Phase-9 doctrine additions; `DESIGN_REVIEW_THRESHOLDS` additions in `designDoctrine.ts`.

## §5 Phase 4 — Fighter concepts (`src/data/fighterConcepts.ts`)

Port Assur's spreads (article order = `ATTRIBUTE_KEYS` order; `concept()` scales automatically; `canonStats` preserves the 84-pt original):
- WS tank-riposte line: `21-15-6-11-7-13-11` (flagship, "7-3 in Rookies"), `17-16-5-11-8-16-11`, `21-13-5-11-10-13-11`, `17-10-8-15-10-7-17`, `17-14-4-17-9-8-15`, `17-13-4-17-9-13-11`.
- AB "Snotling" line (credit Manager): `17-15-6-17-8-4-17`, `15-16-8-11-7-10-17`, `15-15-7-11-7-8-21`.
- PR: `21-11-7-11-7-12-15` (notes honestly marked "marginal"); skip `21-9-14-17-8-4-11` (documented failure — excluded per canon).
- Register duplication-guard exemption; watch file size (~950 lines, under 1300 data ceiling).

## §6 Phase 5 — Codex + Style Archives

- `src/pages/help/sections.tsx`: new `WinningTypesSection` accordion — three ways to win; the five archetypes w/ doctrine; Assur's style tiers (ST premiere offensive, TP ultimate defensive, LU ultimate hybrid, big-three tourney styles AB/LU/ST); cross-stat doctrine (ST/WL never <7 [AB exception noted], DF-11 magic, AB DF 17/21, WT 11 min for offensives, speed least important for hybrids/defensives, size suits offensives).
- `src/pages/styleArchives/StyleCard.tsx`: archetype-fit chips from `STYLE_ARCHETYPE_FIT` + legend on `StyleArchives.tsx`. No hardcoded values (ui-honesty).
- `styleCompendium.ts`: light-touch enrichment of `hallmarks`/`counterplay` where "What the Style" sharpens entries (TP no-parry-bonus, BA worst weapon selection, ST endurance conservation).

## §7 Phase 6 — AI integration (HIGH balance impact)

- `coreGenerator/doctrine.ts`: after style caps, `classifyArchetype(w.attributes, w.style)` shaping — tank-classified → `OE ≥ 5` floor (canon: tanks run upper OE, "5+"); pure-defensive-classified → conservative ceilings; riposte-classified → Riposte-tactic eligibility nudge (suitability table already allows it for LU/WS/TP/PS; nudge pick weight only for riposte-fit builds). Merge around V24 Phase-9 low-burn steering.
- Armor fitting (new): archetype-aware armor selection honoring `restrictedStyles` + carry capacity — apply in `EquipmentPass` (extend beyond favorite-weapon swaps) and/or `getStyleDefaultLoadout`-adjacent creation path for AI. Tank-classified → heaviest legal armor (APA/F norm); hybrids → never OVER. Mandatory world re-baseline (rival survivability rises).
- Recruit gen: verify + spec only — `generateRecruitAttrs` already concept-weighted; no signature change.

## §8 Phase 7 — Mechanics audit (each: RED spec → implement → ratchet)

1. **Rhythm always-on** — `favorites.ts:300` still gates `getFavoriteRhythmBonus` behind `discovered.rhythm`, contradicting its own header doc and canon ("favorite rhythm works whether or not you know it"). Fix: remove gate (weapon/tactic precedent already always-on). Spec: `rhythmAlwaysOn.test.ts`.
2. **Offense-vs-scum tempo audit** — verify `getStyleMatchupMods` magnitudes produce Assur's "don't run 10-10 vs pure defensives" on AI plans; strengthen AL-throttle only if the audit shows hot plans vs TP-classified opponents (opponentStyle-propagated path).
3. **Remaining residue** — re-verify any claim not already locked (weapon req table vs items.ts incl. V24 pending fixes; carry formula stays ENC_TABLE — do NOT adopt Assur's heuristic; tank "concedes vs scum" needs no mechanic).
Any engine fix → combat-balance skill shape: constants in `constants/combat`, pure helper, spec-first, mandatory ratchet.

## §9 Phase 8 — Ratchet + close-out (mandatory)

- `bun run scripts/balance-lab.ts snap.json`; `SNAP=snap.json bun run scripts/world-diag.ts 1000` seeds 12345/777/2024 — **required** after Phases 4 (distribution shift) and 6 (armor fitting, doctrine shaping); re-ratchet `STYLE_PENALTIES`/`STYLE_SKILL_FLOORS` only, never `MATCHUP_MATRIX`.
- `bun run test` + `type-check` + `lint`; `bun run test:slow` (balance/determinism surfaces: new concepts + armor fitting change world outputs → seeded re-baselines expected, V23 precedent).
- `bun scripts/test-audit-scan.mjs` — regenerate runner groups/baseline for new spec files.
- `bun run e2e` chromium smoke (builder + archives UI).
- Duplication guard: `MIXED_EXEMPT_PAIRS` + `MIXED_BASELINE` updates.
- Ledger close; `MEGAPLAN_V25_DEFERRED.md` for out-of-scope items.

## Files touched

- New: `src/data/warriorArchetypes.ts`; `MEGAPLAN_V25_{PLAN,FINDINGS,LEDGER,DEFERRED}.md`; ~9-10 spec files
- Data: `fighterConcepts.ts`, `styleCompendium.ts`, `designDoctrine.ts`
- Engine: `designReview.ts`, `ai/plan/coreGenerator/doctrine.ts`, `pipeline/passes/EquipmentPass.ts` (or adjacent armor-fitting path), `favorites/favorites.ts` (Phase-7.1 only), `ai/matchup/styleMatcher.ts` (audit-driven only)
- UI: `help/sections.tsx`, `styleArchives/StyleCard.tsx`, `StyleArchives.tsx`
- Guards: `duplication.guard.test.ts` allowlists, `runnerGroups.json`/`auditBaseline.json` regen

## Acceptance criteria

- [ ] All six archetypes queryable with doctrine, styles, weapons, armor, strategy; every style has ≥1 archetype fit; all ids resolve.
- [ ] Design Review classifies a build and emits canon-fit guidance incl. computed encumbrance warn.
- [ ] ≥9 new Assur concept builds selectable in Warrior Builder; 84-pt canonStats + 70-pt stats verified per build.
- [ ] Codex + archives teach the taxonomy; on-screen values map to real data.
- [ ] AI: tank OE floor, defensive caps, riposte-tactic gating, archetype armor fitting honoring restrictions + carry.
- [ ] Rhythm bonus always-on (or explicitly deferred to DEFERRED with rationale).
- [ ] Every Phase-1 spec observed RED before its implementation commit; regression-locks born green.
- [ ] Balance harnesses green post-ratchet (fixture + world, all ten styles in band); ledger complete.

## Risks / decisions

- **V24 overlap** — shared files + user WIP on V24 Phase-2 files; V25 lands after/around V24 hunks.
- **Armor fitting is the biggest world-shift** — rivals upgrading leather→plate changes survivability, kill rates, and win bands; isolate it as its own commit with pre/post lab runs.
- **RNG/determinism** — concept additions change recruit outcomes (draw counts stable, contents differ); world re-baselines expected.
- **Taxonomy collision** — `Archetype` (name/trait flavor) vs `WinningArchetype` (build doctrine): kept distinct, documented at both sites.
- **fileBudget** — fighterConcepts ~950 lines < 1300 data ceiling; watch `designReview.ts` (808 → grows again; >800 counter is baselined at 4 — may need rebaseline).
- **Canon vs heuristic** — Assur's stat claims (SP-13, carry formula, req lists omitting SZ) are player heuristics; chart-verified tables are never reverted.
