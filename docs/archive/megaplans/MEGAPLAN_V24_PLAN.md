<!-- markdownlint-disable MD001 MD024 MD025 MD033 MD060 -->
# MEGAPLAN V24 PLAN — Noblish Island Strategy Canon Integration (VALIDATED)

**Branch:** `main` (direct commits, V18–V23 precedent). **Restore tag:**
`pre-megaplan-v24`. **Ledger:** `MEGAPLAN_V24_LEDGER.md`.
**Findings:** `MEGAPLAN_V24_FINDINGS.md` — per-article adjudication.
**Constraints:** zero save-file/backwards-compat.
**Decisions (locked):** full implementation; contested items = **harmonise**
(blend canon into the house model, document, never silently revert a house
rule).

**Test-first mandate (binding):** Phase 1 authors the ENTIRE spec batch
before any implementation commit. Every spec must compile and be observed
RED — failing on its assertion, not an import error. Specs covering
already-correct behavior are marked **[regression-lock]** — born green by
design, they pin canon.

## Phase 0 — Docs (commit 0)

`git tag pre-megaplan-v24`; `MEGAPLAN_V24_{FINDINGS,PLAN,LEDGER}.md`.

## Phase 1 — Spec batch RED (commit 1) — NO implementation

| Spec | Asserts | Status |
|---|---|---|
| `src/test/data/equipment/weaponReqs.canon.test.ts` | 22 Assur rows; SS=shortsword; BA reqSZ3+offhandCarryReq; SZ-deficit endurance-only | RED |
| `src/test/engine/equipment/offhandWield.canon.test.ts` | OH ignores WT+SZ, same ST; DF grid (5×7→9, 15×15→22); BA+offhand SZ9; ambi gate on OFFHAND_ATTACK | RED |
| `src/test/engine/combat/tacticSuitability.canon.test.ts` | per-U-tactic net bonus sum ≤−1; double-tactic −1/skill; AI no-U | RED |
| `src/test/engine/favorites/favoriteTactic.canon.test.ts` | tactic from WS pool; PR/PS/PL weights; bonus fires hidden | RED |
| `src/test/engine/combat/clashLoop.canon.test.ts` | jitter, early-exit, ≤MAX, seed-deterministic | RED |
| `src/test/engine/combat/weaponArmor.canon.test.ts` | DA vs {scale,chain} < pierce baseline; DA vs plate ≥ baseline; lunge KD; 2H parry surcharge; WH/HA/QS/SS ini | RED |
| `src/test/engine/matchmaking/bloodfeud.canon.test.ts` | victim-side entitlement; 4wk expiry; priority offer; stable-avoid penalty; double-challenge 2× | RED |
| `src/test/engine/combat/kdAndPresets.canon.test.ts` | KD≥9 tax; TP Scum Wall 1/1/Parry; PL Dodge Wall; LU desperate-dodge | RED |
| `src/test/engine/warrior/designDoctrine.canon.test.ts` | ST/WL<7, DF tiers, AB DF 17/21 [regression-lock]; low-burn steering RED; tier labels 16/20/26/34 RED | mixed |
| `src/test/engine/learning/learnCapAndBurn.canon.test.ts` | `effectiveLearnCap` = cap − burns; CN yields 0 skills; vital-target kill bump | [regression-lock] |

## Phase 2 — Canon data fixes

`items.ts` req rows (DA WT7, HA WT5, SM DF5, ME DF5, LG SZ7); SH↔SS codemod
with literal keep-set; BA `reqSZ:3`+`offhandCarryReq:{SZ:9}`;
`SZ_REQ_NO_ATT_PENALTY`; EncumbranceBar LIGHT/MEDIUM surfacing.

## Phase 3 — Offhand wield model

`checkLoadoutWieldability(loadout, attrs)` + `OFFHAND_DF_GRID`; wire
fighterState/loadoutFitting/EquipmentPass/WeaponRequirementBadge/
validateLoadout; `OFFHAND_AMBI_GATE` in `offhandAttack.ts`.

## Phase 4 — Tactic harmonisation

`TACTIC_U_MULT=-0.5`; `DOUBLE_TACTIC_SKILL_PENALTY`; AI U-guard in
`coreGenerator`.

## Phase 5 — Favorite tactic + WS luck pools

`WarriorFavorites.tactic`; `FAVORITE_TACTIC_POOLS` (canon weights);
`FAVORITE_TACTIC_BONUS` (hidden); `STYLE_POSITIVE_LUCK_POOLS`
(WS ⊆ {ATT,PAR}).

## Phase 6 — Clash + KD + presets

`JUMP_CLASH_JITTER` + early-exit; `KD_HIGH_PENALTY`; TP 'Scum Wall';
PL 'Dodge Wall'; LU `desperatePlan` dodge variant (Drake 10-10-4).

## Phase 7 — Weapon-vs-armor

`WEAPON_ARMOR_OVERRIDES` keyed weaponId×armorId inside `applyArmorTypeMod`
(DA: ×~0.7 vs {scale_mail,chain_mail}, floor vs plate);
`LUNGE_KNOCKDOWN_BONUS`; `TWOHANDED_PARRY_ENDURANCE_SURCHARGE`;
`FAST_WEAPON_INI` (WH/HA/QS/SS).

## Phase 8 — Challenge metagame

`playerBloodfeuds[]` on GameState; victim-side writer in `recordHandler.ts`;
`BLOODFEUD_PRIORITY`; stable-avoid `AVOID_PENALTY`; `DOUBLE_CHALLENGE_MULT`
(multiplicity counted before the Set); `stableAvoidSet` in PromoterPass.

## Phase 9 — Doctrine + labels

Low-burn steering (low ST+WL → PR/PS/AB/TP/ST); `SKILL_TIER_LABELS`
{16 Expert, 20 Adv. Expert, 26 Master, 34 Adv. Master} on dossier.

## Phase 10 — Ratchet + close-out (mandatory)

`bun run scripts/balance-lab.ts snap.json`; `SNAP=snap.json bun run
scripts/world-diag.ts 1000` seeds 12345/777/2024; re-ratchet ONLY
`STYLE_PENALTIES`/`STYLE_SKILL_FLOORS`; antisymmetry + kill band green;
`bun run test` + `type-check` + `test:slow`; ledger close;
`MEGAPLAN_V24_DEFERRED.md`.

## Files touched

- `data/equipment/weapons/items.ts`, `equipment.utils.ts`, new
  `offhandGrid.ts`; `engine/bout/fighterState.ts`, `loadoutFitting.ts`,
  `EquipmentPass.ts`, `offhandAttack.ts`
- `strategy/tacticSuitability.ts`, `mechanics/tacticResolution.ts`,
  `ai/plan/coreGenerator/modifiers.ts`
- `types/warrior.types.ts`, `favorites/favorites.ts`, `warrior/skillCalc.ts`
- `resolution/initiativePhase.ts`, `mechanics/weaponArmor.ts`, `weaponStats.ts`
- `types/state/gameState.ts`, `bout/recordHandler.ts`,
  `pipeline/passes/PromoterPass.ts`, `promoters/offerMatchmaking.ts`
- `bout/stylePresets.ts`; `data/designDoctrine.ts`, `warrior/designReview.ts`
- `constants/combat/combat/balance.ts`; `EncumbranceBar.tsx`; dossier labels
- 10 spec files + re-baselined suites

## Risks

- SH↔SS codemod — literal keep-set first (safe-codemod).
- U-negative + double-tactic + WS luck-pool shifts plans → ratchet mandatory.
- RNG streams (tactic roll, luck filter, clash jitter, bloodfeud) → fixed
  order; determinism suite; seeded re-baselines expected (V23 precedent).
- `checkLoadoutWieldability` single-resolver discipline (V23 lesson:
  existence ≠ integration).
- Negative `mult` inverts small trade-off fields — spec asserts net-sum.
- Learn-cap spec asserts semantics (cap − burns), not canon literals
  (engine ladder compressed to 6/24).
