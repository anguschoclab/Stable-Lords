<!-- markdownlint-disable MD001 MD024 MD025 MD033 MD060 -->
# MEGAPLAN V25 PLAN — Assur's Winning Warrior Types Canon Integration (VALIDATED)

Port Assur's Arena-93 "winning warrior types" corpus (Pure Offensives, Pure Defensives, Tank Hybrids + low-will addendum, High-Skill Hybrids, Riposting Hybrids, Winning Warrior Types, What the Style) into the game as a new archetype data module, Design Review guidance, fighter concept builds, codex/archives content, AI doctrine and armor fitting, and a mechanics audit.

**Branch:** `main` (direct commits, V18–V24 precedent). **Restore tag:**
`pre-megaplan-v25`. **Ledger:** `MEGAPLAN_V25_LEDGER.md`.
**Findings:** `MEGAPLAN_V25_FINDINGS.md` — per-claim adjudication.
**Constraints:** zero save-file/backwards-compat — all changes additive;
`Warrior` untouched.

**Sequencing:** runs atop in-flight `MEGAPLAN_V24` (strategy/tactics/equipment
canon — Phases 4–6 landed, Phase 7 WIP in working tree). Shared files:
`designDoctrine.ts`, `designReview.ts`, `fighterConcepts.ts` — merge around
V24 hunks; never stage user WIP files wholesale
(`EncumbranceBar.tsx`, `equipment.utils.ts`, `items.ts`, and the current
V24 Phase-7 batch).

**Test-first mandate (binding):** Phase 1 authors the ENTIRE spec batch
before any implementation commit. Every spec must compile and be observed
RED — failing on its assertion, not an import error. Specs covering
already-correct behavior are marked **[regression-lock]**.

## Phase 0 — Docs (commit 0)

`git tag pre-megaplan-v25`; `MEGAPLAN_V25_{FINDINGS,PLAN,LEDGER}.md`.

## Phase 1 — Spec batch RED (commit 1) — NO implementation

| Spec | Asserts | Status |
|---|---|---|
| `src/test/data/warriorArchetypes.canon.test.ts` | 6 archetypes w/ label/doctrine/keyStats/designBars/recommendedStyles/armor/strategy; `STYLE_ARCHETYPE_FIT` covers all 10 styles (LU ≥3 fits; TP ⊆ {pureDefensive,tankHybrid,ripostingHybrid}; ST ⊆ pureOffensive); weapon ids resolve in `items.ts`; armor ids respect each listed style's `restrictedStyles` | RED |
| `src/test/engine/warrior/designReview.v25.test.ts` | classification items: tank ST/CN bar, offensive WT≥11 warn, SP 10–12 riposte dead-band info, high-SZ hybrid note, AB low-ST viability info, hybrid over-encumbrance warn via `computeEncumbranceCapacity` | RED |
| `src/test/data/fighterConcepts.v25.test.ts` | each new build: `canonStats` sums 84, `stats` sums `ATTRIBUTE_TOTAL`, clamps honored; named entries (Snotling lineage, flagship WS tank) present | RED |
| `src/test/components/styleArchives/archetypeTags.test.tsx` | StyleCard renders archetype-fit chips sourced from `STYLE_ARCHETYPE_FIT` | RED |
| `src/test/pages/help/winningTypes.test.tsx` | codex section: three ways to win + archetype list + style tier notes | RED |
| `src/test/engine/ai/archetypeDoctrine.test.ts` | tank-classified warrior → OE floored ≥5; pure-defensive-classified → capped low plan; riposte-classified non-riposte-learning styles eligible for Riposte tactic | RED |
| `src/test/engine/equipment/archetypeArmor.test.ts` | archetype-aware armor fitting: tank → heaviest legal within carry + `restrictedStyles`; hybrid → no OVER; AB never plate | RED |
| `src/test/megaplan/v25Archetypes.guard.test.ts` | data integrity: FIT coverage, bars in [3,25], concept sums, id resolution | RED |
| `src/test/engine/combat/v25MechanicsAudit.test.ts` | regression-locks: burn order, dodge→riposte, Riposte tactic in WS pools, encumbrance endurance channel, `NO_ARMOR_ADD` | [regression-lock] |
| `src/test/engine/favorites/rhythmAlwaysOn.test.ts` | `getFavoriteRhythmBonus` returns bonus with `discovered=false` | RED |

## Phase 2 — Archetype data module

New `src/data/warriorArchetypes.ts` — `WinningArchetype` union (distinct axis
from `statGeneration`'s name-flavor `Archetype`); `WINNING_ARCHETYPES`
(guide per archetype: label/family/doctrine/keyStats/designBars/
recommendedStyles/cautionStyles/weapons/armor/strategy/notes);
`STYLE_ARCHETYPE_FIT`; `ARCHETYPE_DESIGN_BARS`; `classifyArchetype`.

## Phase 3 — Design Review

`reviewArchetypeFit(attrs, style)` appended to `reviewWarriorDesign` —
best-fit info + targeted warns (Tank frame, Offensive wit, Riposte dead
band, Big hybrid, Surgeon chassis, Over-encumbered hybrid via
`computeEncumbranceCapacity`). `id` per V24 convention.

## Phase 4 — Fighter concepts

Assur's spreads (article order = `ATTRIBUTE_KEYS`; `concept()` scales):
WS `21-15-6-11-7-13-11` (flagship), `17-16-5-11-8-16-11`,
`21-13-5-11-10-13-11`, `17-10-8-15-10-7-17`, `17-14-4-17-9-8-15`,
`17-13-4-17-9-13-11`; AB Snotling line `17-15-6-17-8-4-17`,
`15-16-8-11-7-10-17`, `15-15-7-11-7-8-21`; PR `21-11-7-11-7-12-15`
("marginal" note); `21-9-14-17-8-4-11` excluded (documented failure).
Duplication-guard exemption registered.

## Phase 5 — Codex + Style Archives

`help/sections.tsx` `WinningTypesSection`; `StyleCard` archetype chips +
archives legend; `styleCompendium` light-touch enrichment.

## Phase 6 — AI (HIGH balance impact)

`applyStyleDoctrine` archetype shaping: tank-classified → OE≥5 floor;
defensive-classified → conservative caps; riposte-classified → Riposte
tactic nudge. Armor fitting: `EquipmentPass`/creation path — tank →
heaviest legal within carry; hybrids → never OVER. Mandatory world
re-baseline (rival survivability).

## Phase 7 — Mechanics audit (each: RED spec → implement → ratchet)

1. **Rhythm always-on** — `favorites.ts:300` gates `getFavoriteRhythmBonus`
   on `discovered.rhythm`, contradicting header + canon → remove gate.
2. **Offense-vs-scum tempo audit** — verify `getStyleMatchupMods`
   magnitudes; strengthen only if AI still runs hot vs TP-classified foes.
3. **Residue** — weapon reqs vs `items.ts` (post-V24); ENC_TABLE stays.

## Phase 8 — Ratchet + close-out (mandatory)

`balance-lab` before/after; `world-diag` 12345/777/2024 after Phases 4+6;
re-ratchet `STYLE_PENALTIES`/`STYLE_SKILL_FLOORS` only; `bun run test` +
`type-check` + `lint` + `test:slow`; `test-audit-scan` regen; `e2e`
chromium; duplication-guard allowlists; ledger close;
`MEGAPLAN_V25_DEFERRED.md`.

## §0 Validation addendum — see FINDINGS for the full claim-by-claim table

Validated highlights: all 10 Assur spreads sum 84 in `ATTRIBUTE_KEYS`
order; burn order/dodge→riposte/encumbrance channel/Riposte tactic
already canon (regression-locks); rhythm bonus still discovery-gated
(real divergence → Phase 7.1); AI rivals never upgrade armor (real gap →
Phase 6, HIGH impact); articles omit SZ in req lists (spec asserts
`items.ts` table); APA/APM restricted for AB/LU/SL (armor advice filters
`restrictedStyles`); duplication guard requires `MIXED_EXEMPT_PAIRS` +
baseline updates for new literal-pin specs.
