<!-- markdownlint-disable MD001 MD024 MD025 MD033 MD060 -->

# MEGAPLAN V23 — Arena 93 Game Concepts Integration (VALIDATED)

Integrate twelve Noblish Island articles — handedness depth incl. dual-wield, coordination mechanics, the jump/clash model, encumbrance-parry alignment, and design-requirement doctrine — plus V22 deferred items D1 (off-hand/dual-wield) and D2 (trains-burn-skills).

**Branch:** `main` (direct commits, V18–V22 precedent) · **Restore tag:** `pre-megaplan-v23` · **Process artifacts:** `MEGAPLAN_V23_FINDINGS.md` (claim-by-claim adjudication) + `MEGAPLAN_V23_LEDGER.md` (one row per commit) + `MEGAPLAN_V23_DEFERRED.md` (new register) · **Spec-first mandate (binding):** every implementation item names its spec file; the spec must compile and be observed RED (assertion failure, not import error) before its implementation lands. · **Balance discipline (combat-balance skill):** constant → pure helper in `resolution/` → `FighterState` field if it spans exchanges → wire at real hook → integration spec → re-ratchet `STYLE_PENALTIES` only (never `MATCHUP_MATRIX` for power; antisymmetry guard stays green). · **Verification:** `bun run test` + `bun run type-check` + `bun run lint` every commit; `bun run test:slow` after any balance/determinism-touching phase; `balance-lab` snapshot before/after; `world-diag 1000 12345` (+777/2024 if deltas >2pp); `bun scripts/test-audit-scan.mjs` to regenerate runnerGroups/auditBaseline for new specs.

**User adjudications (locked):**
- **Deferred pull-ins:** D1 (off-hand/dual-wield) AND D2 (trains-burn-skills). D3 (Pagan damage model) and D4 (ADM tier) stay deferred — D4's Primus learn-back is canon's eventual release valve for burnt skills; without it, burns are permanent.
- **Encumbrance — middle ground:** `parPenalty → 0` on all tiers; DEF/INI penalties and enduranceMult unchanged; re-ratchet.
- **Knack:** unify `LUCKFACTOR_RANGE` — remove the Parry-Strike ±6 advantage; all styles share one tweakable constant.
- **Learn priorities:** harmonize the two canon sources (merge rule in §F2).
- **Off-hand model:** one weapon, OR weapon+shield, OR two weapons — `offhand` and `shield` mutually exclusive.
- **Trains-burn scope:** uniform — every +1 attribute gain crossing a breakpoint burns learn capacity; ST 7–14 and CN free.
- **Coordination KD susceptibility:** include small `COORD_KD_SUSCEPT` term.
- **Design doctrine:** advisory surfaces AND light AI-design heuristics.

## §0 Validation addendum — draft audited against code

Each draft premise re-checked by reading the code. Verdicts: **APPROVED** / **CORRECTED** / **DISPROVED**.

### Corrected premises (draft text updated to match)

| Draft item | Verdict | Evidence + correction |
|------------|---------|------------------------|
| "Handedness: identical 2-draw shape" | **CORRECTED** | `rollHandedness` (`skillCalc.ts:168-171`) consumes a **variable 1–2 draws**: returns after 1 draw for 'right' (85%), 2 for left/ambi. Style conditioning preserves that shape (thresholds only). `ambi-reversed` appends a conditional draw only when result is ambidextrous → ambi warriors consume 3 draws — shape stays variable-by-design; document the new draw order at all 6 sites. |
| `encumbrancePenalty.{ini,def,par}Penalty` live per-exchange | **DISPROVED (new finding)** | `FighterState.encumbrancePenalty` is **dead state** for ini/def/par — only `enduranceMult` is ever read (`enduranceCosts.ts:58,72`). PAR/DEF/INI penalties apply solely via the `encPenalties` bake in `fighterState.ts` `skillAddends`. Correction: `parPenalty→0` is a **one-line constant change** in `TIER_PENALTIES` with no hidden consumers; optionally prune the dead fields or keep for forward-compat. |
| "Add ~15 canon example spreads to FIGHTER_CONCEPTS" | **CORRECTED** | Article builds are ~84-pt Duel2 budgets; concepts require BOTH `canonStats` (verbatim 84-pt) and `stats` (scaled 68–74 band, TOTAL_MIN/MAX per `statGeneration.ts:30-31`). Every new spread must ship both fields — scaling preserves the design's priority order, not literal values. |
| "Loadout gains `wield` mode type" | **DISPROVED — already exists** | `WieldMode = 'normal' | 'two_handed' | 'off_hand' | 'dual'` is already defined and consumed by `checkWeaponRequirements` (`equipment.utils.ts:113,160`). Work is *call-site wiring only*: pass `{wield:'dual'}`/`{wield:'off_hand'}`/`ambidextrous` from loadout/fighter-build — no type additions. |
| `LoadoutIssue` gets `DUAL_WITH_SHIELD` | **APPROVED, wired** | `validateLoadout` at `equipment.utils.ts:219`; UI consumes `EquipmentLoadout.tsx:46`; AI path `rosterWorkerEquipment.ts` must also respect it. |
| New event types `CLASH`/`FUMBLE`/`OFFHAND_ATTACK`/`QUICKDRAW` | **CORRECTED — closed enum** | `COMBAT_EVENT_TYPES` is a closed tuple (`enumSources.ts:300-322`) — new types require: `enumSources.ts` + `schemaEnums.ts` sync + `narrateEvents/handlers.ts` narrator map + `useBoutPlayback`/`AudioManager` sfx mapping + `combatPbp.json` lines. Enumerated as a distinct sub-task per mechanic. |
| `src/test/engine/warrior/luckfactor.test.ts` (spec path) | **CORRECTED** | existing spec is `src/test/engine/luckfactor.test.ts` — extend in place, do not create a duplicate. |
| D2 "ST 7–14 & CN free" needs special-casing | **DISPROVED as special-case** | `ST_ATT`/`ST_PAR` grant at 7 then 15 (`skillBreakpoints.ts:32-50`) — so a generic **breakpoint-delta** rule (`bp(table,new)−bp(table,old) > 0` per skill → burn that many slots) automatically yields "ST raises landing ≤14 free, CN always free (no tables)". Implement generically; spec pins the article's free-window examples as test cases. |
| `applyXP` burn wiring point | **APPROVED** | `src/engine/warrior/progression.ts:146-148` — `newAttrs` + `computeWarriorStats` recompute; burn hook goes here and in `applyAttributeGain` (`attributeTraining.ts:70-79`). |
| `makeWarrior` handedness position | **CORRECTED** | `warriorFactory.ts:48` rolls handedness **before** favorites/traits/trainability draws — any shape change shifts downstream draws at this site; the conditional ambi draw is safe only because it preserves count for non-ambi. All 6 creation sites have `style` in scope before the call (generate.ts:126,184 · freeAgents:26 · orphanPool:79 · recruitGenerator:171 · warriorFactory:48). |
| `getLoadoutWeight` for off-hand | **CORRECTED (decision)** | `getLoadoutWeight` counts weapon+armor+shield+helm, **not** `backup` (`equipment.utils.ts:105-110`). Decision: count `offhand` weight (it's wielded); keep `backup` uncounted (sheathed) — documented house rule. |
| Clash-loop insertion point | **APPROVED** | inside `resolveInitiativePhase`, gated on the first exchange (`ctx.exchange` exists); each non-decisive roll emits `CLASH` and re-draws on the main stream — documented as new consumption. |
| Disarm side-gating call sites | **APPROVED** | `tryDisarm` is the only chance-roll site; `hitLoc` carries 'left arm'/'right arm'. `FighterState` gains `handedness` + `offhandWeaponId`; hand map resolved in `disarm.ts`. |
| Off-hand parry mods | **APPROVED (simpler than drafted)** | Weapon items already carry `shieldParryBonus`/`shieldAttPenalty` (`items.ts:303,325,348`) — off-hand weapon DEF/ATT contributions reuse `getShieldModifiers(offhandId)`; no new mod type. |
| AI DA-rule insertion point | **APPROVED** | `generateRecruitAttrs` (`recruitGenerator.ts:84-134`) — ticket-pool + concept-mean blend; DA rule = post-generation rejection check (Drake's <7WL / <7ST / style-minimum floors) with bounded retry, or floor-clamp. |

### Approved premises (unchanged)

| Draft item | Evidence |
|------------|----------|
| `sumInitiative` lacks an OE term | `initiativePhase.ts:41-64` — INI + `DEC×DEC_INI_COEFF` + `alIniMod` + matchup + fat + defMods + tacticIni + tempo + passives + mastery − legHits + psych + momentum + trainer + weather/surface/arenaEvent + `getWeaponInitiativeMod` + traits. No OE. |
| `knockedDown` auto-clears | `exchangePrep.ts:332-339` — rise gate wires here. |
| Backup auto-equips on disarm | `disarm.ts:138-141` — fumble path = delayed assignment + retry. |
| `simulate/narrative.ts` passes `handedness` to intros | wired lines ~58-74 (V22). |
| `disarmRng` dedicated stream exists | `simulateFight.ts:60,91` — seeded `boutSeed ^ DISARM_RNG_SEED_XOR`; coordination/draw/rise rolls consume this stream. |
| `computeCoordination` off-by-one | `terrabloodCharts.ts:415` — `>= 16` returns Slightly; article says 6–16 Clumsy → boundary `<= 16`. |
| `STYLE_LEARN_PRIORITY` vs "Learns naturally" | BA/SL/WS diverge as analyzed → harmonization rule in §F2. |
| Learn caps | `LEARN_PER_SKILL_CAP=6`, `LEARN_CAREER_CAP=24` (`learn.ts`); stat-train skill gain is automatic via `computeWarriorStats` recompute — strictly upside today (matches V22 E2). |

## §1 Claim adjudication vs code (validated)

### A — Handedness (Pagan + Sir Jessie Jest)
| # | Claim | Verdict | Work |
|---|-------|---------|------|
| A1 | Arm hit drops the weapon in THAT hand; ambi side chosen lazily | MISSING — `disarm.ts` drops sole held weapon from either arm | Weapon-side gating + lazy ambi pick (Phase 4); full expression under D1 (Phase 5) |
| A2 | Style-conditioned handedness (defensive → more lefty/ambi; PR ~43%) | MISSING — flat 85/7.5/7.5 | `rollHandedness(rng, style?)` conditioned table; preserves 1–2-draw shape |
| A3 | Ambi USE left more but primary in RIGHT; rare reversed ambi | MISSING — no use/carry split | `ambi-reversed` variant (conditional 3rd draw); off-hand use-weighting + intro under D1 |
| A4 | +1 ATT ambi | IMPLEMENTED (V22) | keep |

### B — Coordination (Sir Jessie Jest)
| # | Claim | Verdict | Work |
|---|-------|---------|------|
| B1 | Clumsy = SP+DF ≤16 | PARTIAL — boundary bug at 16 | `total <= 16 → Clumsy` + spec |
| B2 | Clumsy drops weapons more | MISSING | `COORD_DISARM_MOD` per tier into `rollDisarmChance` |
| B3 | Clumsy fumbles backup draw | MISSING | `QUICKDRAW` roll for low tiers; fail → FUMBLE event, draw retried next exchange |
| B4 | Clumsy slower to rise + small knockdown susceptibility | MISSING | rise roll vs `COORD_RISE_CHANCE` at the `knockedDown` clear site; `COORD_KD_SUSCEPT` into the knockdown roll |

### C — Getting the Jump (Pagan)
| # | Claim | Verdict | Work |
|---|-------|---------|------|
| C1 | OE is biggest controllable jump factor | MISSING — no OE term | `+ OE × JUMP_OE_COEFF` (~0.4 initial, tune via lab) |
| C2 | Clash-until-disparity at bout open | MISSING | first-exchange loop inside `resolveInitiativePhase`: re-roll until `|iniA−iniD| ≥ JUMP_DISPARITY` or `JUMP_CLASH_MAX`; `CLASH` events |
| C3 | Fight/warrior string model | IMPLEMENTED-equivalent | documentation |

### D — Knack
| # | Claim | Verdict | Work |
|---|-------|---------|------|
| D1 | Hidden luck incl. inverse | IMPLEMENTED | **change:** delete `PS_LUCKFACTOR_RANGE` (`constants/combat/styles/ps.ts:10`) — all styles share `LUCKFACTOR_RANGE` (`balance.ts:19`); update `src/test/engine/luckfactor.test.ts`; watch PS row |

### E — Parry and Carry (Assur)
| # | Claim | Verdict | Work |
|---|-------|---------|------|
| E1 | Encumbrance: ~0 parry impact | CONTRADICTED — TIER_PENALTIES hits PAR | `parPenalty→0` all tiers (constant-only, no hidden consumers — validated dead state); ratchet |
| E2 | Carry = ST+min(ST,CN)−6 | adjudicated-keep (V22 C12) | none |
| E3 | No parry skills from ST 7→15 | chart-true (`ST_PAR` grants 7 then 15) | doc note |

### F — Design doctrine (7 articles)
| # | Claim | Verdict | Work |
|---|-------|---------|------|
| F1 | Per-style minimums + hybrid table | PARTIAL | `STYLE_DESIGN_MINIMUMS` data + `minimums` designReview item |
| F2 | "Learns naturally" orderings | CANON-CONFLICT (BA/SL/WS) | **harmonized:** both-agree top-2 keep position → article parenthetical fills 3rd → remaining keep Pagan order. Result: BA `ATT,DEC,INI,…`; SL `INI,ATT,DEC,RIP,…`; WS `ATT,PAR,INI,…`; other rows pinned unchanged |
| F3 | Burner pattern | MISSING | designReview info note; pairs with D2 |
| F4 | Drake rollup-first + DA rule | MISSING | designReview note + `generateRecruitAttrs` reject/retry or floor-clamp |
| F5 | ~15 canon builds | MISSING | `FIGHTER_CONCEPTS` entries with `canonStats` (84-pt) + `stats` (scaled) |
| F6 | Style-mix | PARTIAL | doc note + light diversity weight in `pickRecruitStyle` |

### G — Deferred pull-ins
- **D1 dual-wield:** `EquipmentLoadout.offhand?: string`; `validateLoadout` adds `DUAL_WITH_SHIELD` (weapon / weapon+shield / two weapons only); `checkWeaponRequirements` call sites pass `{wield:'dual'|'off_hand', ambidextrous}`; VHC gate (SP+DF>31 AND either>14) → `offhandAttack.ts` free shot once per offensive exchange (`OFFHAND_ATTACK` event); disarm drops struck arm's weapon (hand map: righty right=primary, lefty mirrored, ambi lazy per `AMBI_PRIMARY_RIGHT_BIAS`; reversed flips); off-hand weight counts in `getLoadoutWeight`; dual-wield intro + EquipmentLoadout UI; ratchet.
- **D2 trains-burn:** `burnedSkills: Partial<Record<keyof BaseSkills, number>>` on `Warrior`; generic breakpoint-delta rule — each +1 gain computes `bp(table,new)−bp(table,old)` per skill, burns that many slots (ST→15 burns, ST 7–14 and CN auto-free); wired in `applyAttributeGain` + `applyXP` (+ any trainer-coached gain sites); effective cap = `LEARN_PER_SKILL_CAP − burnedSkills[skill]`; advisor copy teaches the trade; world learn-rate drift via world-diag.

## §2 Spec inventory — ALL authored in Phase 1, observed RED, before any implementation

| Spec | Covers |
|------|--------|
| `src/test/engine/warrior/coordination.canon.test.ts` | tier boundaries (16=Clumsy) + disarm/draw/rise/KD mod directions |
| `src/test/engine/warrior/handedness.test.ts` (extend) | style-conditioned distribution, `ambi-reversed`, draw-shape contract |
| `src/test/engine/combat/disarmSide.test.ts` | righty can't drop on left-arm hit (single weapon); ambi lazy pick; dual drops struck-arm weapon |
| `src/test/engine/combat/quickdraw.test.ts` | clumsy FUMBLE path + next-exchange retry; non-clumsy unaffected |
| `src/test/engine/combat/knockdownRise.test.ts` | clumsy stays down ≥1 extra exchange at seeded rate |
| `src/test/engine/combat/jump.test.ts` | OE term direction (paired monte-carlo) + CLASH events bounded ≤ `JUMP_CLASH_MAX` |
| `src/test/data/equipment/encumbrance.test.ts` (extend) | `parPenalty === 0` on all tiers |
| `src/test/engine/combat/dualWield.test.ts` | VHC gate, OFFHAND_ATTACK frequency, dual/ambi req paths, off-hand shield-mods |
| `src/test/data/equipment/loadout.validation.test.ts` | `DUAL_WITH_SHIELD` blocks shield+offhand; three legal states pass |
| `src/test/engine/learning/trainsBurn.test.ts` | breakpoint-train burns (ST 14→15), free raises (ST 9→10, CN), XP path, cap decrement |
| `src/test/data/learnPriorities.harmonized.test.ts` | merged BA/SL/WS orderings; all other rows pinned |
| `src/test/engine/warrior/designReview.v23.test.ts` | minimums axis, burner note, rollup-order note |
| `src/test/engine/luckfactor.test.ts` (extend) | PS parity range |
| `src/test/engine/owner/recruitGenerator.da.test.ts` | AI DA rule rejects <7WL/<7ST builds |
| `src/test/engine/narrative/narrativeIntro.test.ts` (extend) | dual-wield + ambi-reversed intro lines |
| `src/test/engine/bout/fighterState.test.ts` (extend) | `coordination`/`handedness`/`offhandWeaponId` baked at build |
| `src/test/megaplan/v23Canon.guard.test.ts` | constants ratchet (tiers, knobs, minimums, harmonized table) |

## §3 Files to modify (validated map)
- `src/engine/warrior/skillCalc.ts` — style-conditioned `rollHandedness`, `ambi-reversed`, luckfactor parity
- `src/data/terrabloodCharts.ts` — `computeCoordination` boundary
- `src/data/equipment/encumbrance.ts` — `parPenalty→0`
- `src/engine/combat/resolution/disarm.ts` — coordination mod, side-gating, fumbled draw
- `src/engine/combat/resolution/exchangePrep.ts` — rise gate
- `src/engine/combat/resolution/initiativePhase.ts` — OE term + clash loop
- `src/engine/combat/resolution/offhandAttack.ts` (new) — VHC free shot
- `src/engine/bout/fighterState.ts` — `coordination`/`handedness`/`offhandWeaponId`; dead `encumbrancePenalty` fields pruned or kept
- `src/data/equipment/{equipment.types,equipment.utils,weapons/items}.ts` — `offhand` slot, `DUAL_WITH_SHIELD`, weight counting, req call-site opts
- `src/types/enumSources.ts` + `src/schemas/schemaEnums.ts` + `narrateEvents/handlers.ts` + `AudioManager.ts`/`useBoutPlayback` + `combatPbp.json` — event-type plumbing for CLASH/FUMBLE/OFFHAND_ATTACK
- `src/data/{designDoctrine,learnPriorities,fighterConcepts}.ts` + `src/engine/warrior/designReview.ts` — doctrine surfaces
- `src/engine/learning/learnRoll.ts` + `trainingGains/attributeTraining.ts` + `warrior/progression.ts` — burn economy
- `src/constants/combat/combat/{balance.ts, styles/*}` — `COORD_*`, `JUMP_*`, `AMBI_*`, `QUICKDRAW_*`, `DUAL_*` knobs; `PS_LUCKFACTOR_RANGE` removal
- `src/engine/owner/roster/recruitGenerator.ts` — DA rule
- `src/engine/ai/workers/rosterWorkerEquipment.ts` — dual-loadout validity for AI
- `src/engine/simulate/narrative.ts` — dual-wield intro
- `src/pages/help/sections.tsx` + `src/components/EquipmentLoadout.tsx` — doctrine teaching + slot UI
- `MEGAPLAN_V23_{FINDINGS,PLAN,LEDGER,DEFERRED}.md` — process artifacts

## §4 Sequencing (validation-corrected)
| Phase | Content | Risk | Gate |
|-------|---------|------|------|
| 0 | Restore tag, FINDINGS, ledger | — | — |
| 1 | **ENTIRE spec batch RED** — all §2 files committed, compiled, failing on assertions | none | specs fail for intended reason |
| 2 | Canon data: coordination boundary, style-handedness + reversed, minimums, concepts, review notes, help, luckfactor parity | low | fast tier |
| 3 | Encumbrance `parPenalty→0` + ratchet | LOW-MED (constant-only per validation) | lab + fixture |
| 4 | Combat mechanics: coordination effects, OE→jump, clash loop, side-gated disarm | MED-HIGH | per-item spec + ratchet |
| 5 | D1 dual-wield (loadout → reqs → state → off-hand shot → lazy drops → intro/UI) | HIGH | spec batch + world |
| 6 | D2 trains-burn (generic bp-delta rule + ledgers + advisor copy) | MED | world learn-rate check |
| 7 | Close-out: slow suite, world-diag 3 seeds, watch re-baseline, DEFERRED register | — | all green |

## §5 Determinism / RNG draw-order notes (validated)
- Handedness: variable 1–2 draws today; style conditioning preserves shape; `ambi-reversed` appends a 3rd draw **only for ambis** (conditional, consistent with the existing variable contract — but it does shift downstream draws at `makeWarrior` for ambi warriors; documented, determinism specs gate).
- Coordination/quickdraw/rise rolls: dedicated `disarmRng` stream family — never perturb the main stream.
- Clash loop: main-stream draws at bout open — new consumption, documented.
- Luckfactor parity: same 6 draws, narrower PS range.
- Off-hand attack: consumes the normal attack-roll pipeline (same stream shape as any extra swing).

## §6 Acceptance criteria
- [x] SP+DF≤16 = Clumsy; clumsy warriors drop more, fumble draws, stay down longer; small KD-suscept term.
- [x] `sumInitiative` has OE term; first exchange emits ≤ `JUMP_CLASH_MAX` CLASH events.
- [x] Style-conditioned handedness + ambi-reversed; intros/equipment honor it.
- [x] `parPenalty===0` all tiers; fixture + world bands green post-ratchet.
- [x] Single-weapon disarm only via weapon arm; ambi drops resolve lazily.
- [x] Dual-wield: off-hand slot (shield-exclusive) + VHC free shot + dual/ambi req paths + lazy drops + intro/UI.
- [x] Every +1 attribute gain crossing a breakpoint burns learn capacity (generic bp-delta); ST≤14/CN/XP-free-window cases pinned.
- [x] designReview: minimums + burner + rollup-order; FIGHTER_CONCEPTS spreads with `canonStats`+`stats`; AI DA rule.
- [x] `LUCKFACTOR_RANGE` single constant; PS parity; knack documented.
- [x] Harmonized learn priorities pinned for BA/SL/WS.
- [x] All §2 specs exist, were committed RED in Phase 1, and are GREEN at close.
- [x] All ten styles [0.40,0.60] fixture AND world; kill bands green; TP 61.9% / world-kill 6.65% watch items re-baselined; ledger complete.

## §7 Risks (validated)
- **D1 scope** — free shot strictly VHC-gated: fixture all-15s (SP+DF=30) is NOT VHC → fixture barely moves; world warriors with SP/DF>14 gain → world ratchet is the real gate.
- **Side-gated disarm** halves disarm incidence for single-weapon warriors → retune `DISARM_*` to prior incidence (measure drop rate before/after, not guess).
- **D2 inverts doctrine** — advisor/AI copy must teach it; world-diag verifies learn accrual.
- **PS luckfactor parity** shrinks PS variance — watch PS row.
- **OE→jump** shifts strike order toward high-OE plans — probe decise/TP interplay in lab before world.
- **New event types** touch a closed enum + schema + narrator + audio — bundle per-mechanic to avoid partial plumbing.
