# Port Arena-93 Parry-Riposte newsletter canon into Stable Lords (validated, test-first)

Mine the seven Arena-93 ripper articles for 10 canonical PR fighter concepts plus richer doctrine/compendium/presets/AI targeting, and bring the engine in line with canon — PR endurance burn fix, SL matchup edge, KD-gated riposte opportunities, and a post-master riposte-tactic warning — with all unit tests written and failing before any implementation.

## Validation audit (this pass)

Every claim in the draft was re-verified against the code. Verdicts:

**APPROVED (verified accurate)**
- `FIGHTER_CONCEPTS[ParryRiposte]` has exactly 2 concepts (Webweaver, Quicksilver). All 10 proposed canon spreads sum to exactly 84 → pass the `[83,86]` test guard automatically.
- PR `tempo.enduranceMult` = **1.04, the highest of all 10 styles** (`strategies.ts:148`), applied multiplicatively to endurance cost via `getEnduranceMult` (`api.ts:27`) at `enduranceCosts.ts:54,68`. Canon + `STYLE_IDENTITY.fatigueBurn='Low'` (`identity.ts:43`) both contradict it → real discrepancy.
- `MATCHUP_MATRIX` SL↔PR = 0/0 (`matchup.ts` rows 4 & 6); setting +1/−1 keeps pair sum 0 → antisymmetry guard stays green. Anti-striker (+1) and AB-bane (−1) already correct.
- `canonTargeting.ts` has only TP and AB rows. **New finding:** `boutAcceptance/index.ts:64` treats bias ≤ −3 as a hard avoid — so `PR→AB = −3` automatically yields canon "the bane" hard-avoid behavior in AI challenge acceptance. Consumed by `boutBidding/generation.ts:68,81`.
- `performRiposteCheck` signature `{rng, def, matchup, fat, penaltyOrBonus, curPass, curAntiSynDef}` adds `penaltyOrBonus` to the RIP skillCheck (`riposteCheck.ts:29-33`). Two call sites in `defense.ts`: `resolveWhiffRiposte` (line 70) and `handleSuccessfulDefense` (line 175) — both must get the KD penalty. `def.activePlan` exists (`types.ts:32`), `s.phaseKey` exists (`offenseDefense/types.ts:46`); the KD-read pattern is proven at `defense.ts:242-244`.
- `validateStrategy(plan, warrior?)` is non-blocking (`strategyValidator.ts`); the UI passes `warrior` (`usePlanOrchestration.ts:41`) so warnings actually surface. Mastery formula precedent: `career.wins + career.losses` (`MasterySection.tsx:14`), `Warrior.career` required (`warrior.types.ts:184`).
- Weapon reqs field-verified: EP 7/3/15/15, SH 5/3/11/3, SC 9/3/11/11, SS 9/3/5/7, LO 11/3/13/11, LS 11/9/5/9 (`items.ts`) — all match the article chart.
- Tactic suitability (Lunge WS off; Parry+Riposte WS def), weapon suitability (EP=CW, zero marginal weapons), rhythm ranges (OE 3-6/AL 4-7), STYLE_SKILL_FLOORS — all already canon.
- Existing tests are concept-agnostic: `fighterConcepts.test.ts` auto-covers new concepts; `WarriorBuilder.test.tsx` uses `concepts[0]` dynamically; `StyleCard.test.tsx` iterates `guide.concepts`; `statGeneration.test.ts` asserts nearest-concept distance ≤3 (new concepts can only shrink distance); `canonTargeting.test.ts` covers only TP/AB rows.
- Matrix-pinning tests are safe: `styleMatchupGate.test.ts` pins WS↔AB (±3), `resolution.test.ts` pins ST↔SL + TP↔ST, `resolutionDeterminism.test.ts` uses SL↔PR but asserts determinism only.
- `balance.ts` already hosts `PR_*` constants (`PR_COUNTER_ON_PARRY` etc.) — correct home for the new knob.
- Tooling verified present: `scripts/balance-lab.ts`, `world-diag.ts`, `simulation-harness.ts`, `style-probe.ts`, `lab-overrides.ts`; `duplication.guard.test.ts` exempts fighterConcepts canon literal pins.
- `getBestDefensiveTactic(PR)` returns 'Riposte' (payoff 4 vs Parry 2 in `tacticAdvisor.ts`) — the advisor is already canon-aligned for young rippers.

**DISAPPROVED / corrected by validation**
1. **`stylePresets.test.ts:8-11` asserts "exactly 2 presets per style (20 total)"** — the draft missed this; adding 2 PR presets breaks the guard. The test must be updated FIRST (≥2 global, plus explicit PR=4 name assertions).
2. **Short Spear reqWT**: article chart says 7, game has 5 — the game matches the Terrablood canonical chart (off-limits canon data per combat-balance skill). **Do not "fix"**; reviewed and rejected.
3. **`planBias.ts:46` autoTune sets `defensiveTactic:'Riposte'` for PR while `getAITactics` returns 'Parry'** — pre-existing inconsistency, not introduced by this change. Left as-is; the new validator warning will correctly flag autoTune's Riposte on Master-tier rippers (warning is info-level, non-blocking).
4. **PR `STYLE_PENALTIES` RIP is tied with DEC at −1** for "least-penalised" — preserve that tie in any re-ratchet (shape rule: RIP must remain no-more-penalised than every other skill).
5. **Article endurance formula** ((ST+CN)·WL ≈ 350) is a *design heuristic*, not the engine formula — the `terrabloodCharts` endurance chart is canonical and stays; the formula is used only inside concept notes text.
6. `strategyValidator.test.ts` **already exists** with a `createMockWarrior` helper — the warning test extends it (not a new file); `career` must be populated in the mock for the mastery gate.
7. Confirmed **out of scope**: off-hand attack simulation (no offhand strike mechanic exists in resolution — `dualWieldReq` is data-only), minute-level strategy arrays (engine uses 3 exchange-thirds via `getPhaseByExchange`), encumbrance formula swap (chart is canonical).

## Implementation — strict test-first order

### Phase 0 — Write/update all unit tests (RED before any source change)

1. **`src/test/engine/bout/stylePresets.test.ts`** — UPDATE the "exactly 2 (20 total)" guard → `≥2` per style; add assertions that PR has 4 presets named `['Classic Counter','Aggressive Riposte','Fast Ripper','Third-Minute Surge']` with all OE/AL/KD in 1–10 (existing loops cover ranges).
2. **`src/test/data/fighterConcepts.test.ts`** — add a PR describe: `concepts.length === 12`, the 10 new build names present, and spot-check `canonStats` sums (auto-covered invariants also apply).
3. **`src/test/engine/ai/canonTargeting.test.ts`** — add PR describe: `canonTargetingBias(PR, ST) ≥ 2`, `(PR, TP) ≥ 1`, `(PR, AB) ≤ −3` (hard-avoid band), `(PR, SL) < 0`, `(PR, LU) === 0`.
4. **`src/test/engine/stylePassives.test.ts`** — add `getEnduranceMult(FightingStyle.ParryRiposte) < 1.0`.
5. **`src/test/engine/combat/resolution.test.ts`** — add `getMatchupBonus(SL, PR) > 0` and `getMatchupBonus(PR, SL) < 0` sign assertions (antisymmetry already guarded globally).
6. **NEW `src/test/engine/combat/prKillDesireRiposte.test.ts`** — reuse the `setupExchange` harness pattern from `offenseDefense.test.ts` (defaults `fD` to PR): run N seeded `resolveContestedDefense` calls with `fD.activePlan.killDesire = 2` vs `= 5`; assert RIPOSTE-event count strictly lower at KD 2, and that a non-PR defender's riposte count is unaffected by KD (style-gating check).
7. **`src/test/engine/strategyValidator.test.ts`** — new describe for `PR_RIPOSTE_PAST_MASTER`: PR warrior `career.wins+losses ≥ 30` with `defensiveTactic:'Riposte'` (base or any phase) → `info` warning; same plan on Novice PR → none; non-PR Master → none.

### Phase 1 — Content port (data only, zero engine risk)

8. **`src/data/fighterConcepts.ts`** — append 10 PR concepts after the existing 2 (keeps `concepts[0]` = Webweaver for tests/picker stability):
   - **Daydream** `17-14-4-17-7-8-17` — "the best Parry Riposte ever" (Assur, on DDB); scum-leaning frame, damage bar met.
   - **Consortium Hybrid** `21-8-11-21-7-3-13` — Assur's favorite design, "use again without hesitation".
   - **Freshman Scum** `17-15-10-6-21-4-11` — classic scum ripper; WL carries endurance and trains.
   - **The Art** `9-7-7-21-13-6-21` — Blackhawk's "perfect" ripper; WT→DF→WL priority.
   - **Necrom's Paragon** `9-4-5-17-21-11-17` — tiny frame, huge parry; epee-capable.
   - **Thror's Lesson** `15-10-9-15-15-6-14` — Necrom's real ripper; notes carry the early-stat-train cautionary tale.
   - **Fantasy Duelist** `11-11-11-15-15-6-15` — Palinc's dual-wield survivor; off-hand weapon notes.
   - **Dawnrain** `9-13-5-15-17-8-17` — Jorja's Tailida; little-damage lesson + ST train to 14 plan; low/mod rhythm.
   - **Scovellie** `9-13-8-17-17-5-15` — meets Cadmus's basic-ripper physicals ((ST+CN)·WL≈374).
   - **Santee** `13-7-14-17-15-8-10` — the size-14 outlier; big rippers can graduate (mod/mod, slash fave, LO).
   - Rewrite `doctrine`: GOOD+ damage first, then carry/HP/parry; hybrids and scum both viable; SC/LO staples + EP/SH (+SS/LS low-wit); light armor within carry; each warrior's own rhythm (start ~4-6, experiment); lunge-or-nothing offensively, parry/riposte defensively; hunts strikers and scum, dies to aimed blows, struggles vs slashers. Notes/tactics text *adapted* per the file's existing convention.
   - Intended side effect: `generateArchetypeAttrs`/`conceptMean` pull AI PR recruits toward canon builds.
9. **`src/data/styleCompendium.ts`** — PR hallmarks gain canon facts (low endurance burn, natural striker-killer/scum-hunter, low skill base requiring learned skills); counterplay names aimed blows starving the riposte.
10. **`docs/Stable_Lords_Fighter_Concepts_Arena_93_v1.0.md`** — extend PR section: new build tables (canon + scaled), enriched doctrine, source articles cited.
11. **`src/pages/help/sections.tsx`** — "1-2 named builds" → "named builds".

### Phase 2 — Mechanics (each change lands only after its Phase-0 test exists)

12. **`src/engine/stylePassives/strategies.ts`** — PR `tempo.enduranceMult` 1.04 → `0.94`.
13. **`src/constants/combat/combat/matchup.ts`** — `M[SL][PR]` 0→+1, `M[PR][SL]` 0→−1.
14. **`src/engine/ai/matchup/canonTargeting.ts`** — add PR row: `ST +2.5`, `TP +1.5`, `AB −3` (auto-triggers `boutAcceptance` hard-avoid), `SL −1.5`.
15. **`src/constants/combat/combat/balance.ts`** — add `PR_LOW_KD_THRESHOLD = 3`, `PR_LOW_KD_RIPOSTE_PENALTY = 2` (tunable knobs per skill convention).
16. **`src/engine/combat/resolution/offenseDefense/defense.ts`** — compute `defKD = def.activePlan.phases?.[s.phaseKey]?.killDesire ?? def.activePlan.killDesire ?? 5`; at both `performRiposteCheck` sites subtract the penalty from `penaltyOrBonus` when `def.style === ParryRiposte && defKD <= PR_LOW_KD_THRESHOLD`.
17. **`src/engine/strategy/strategyValidator.ts`** — new `PR_RIPOSTE_PAST_MASTER` info warning: `warrior.style === ParryRiposte` + `getMastery(career.wins + career.losses).tier` ≥ `Master` + `defensiveTactic === 'Riposte'` on base or any phase.
18. **`src/engine/bout/stylePresets.ts`** — append PR presets:
    - **Fast Ripper** (Cadmus): opening `{OE:8,AL:8,KD:6}` burst → mid `{OE:5,AL:5,KD:7}` → late `{OE:8,AL:10,KD:5}`; base `{OE:7,AL:7,KD:6}`.
    - **Third-Minute Surge** (Blackhawk): opening `{OE:3,AL:4,KD:5}` → mid `{OE:6,AL:4,KD:5}` → late `{OE:3,AL:5,KD:2}`; base `{OE:4,AL:4,KD:5}`.

### Phase 3 — Re-ratchet + guardrail verification

19. Run `bun run scripts/balance-lab.ts snap.json`; if PR leaves `[0.40,0.60]` or the world drifts, adjust **only** PR's `STYLE_PENALTIES` row (RIP stays tied-for-least-penalised with DEC). Use `LAB='{"floor":...}'`/penalty overrides via `lab-overrides.ts` before editing source. `scripts/style-probe.ts` to confirm which skills are floored before choosing the lever.
20. `bun run test:slow` — `balance.slow.test.ts` (antisymmetry, mirror band, absolute power, kill band) + `worldBalance.slow.test.ts` (seed 42 baseline — concept-pool + mechanic changes may force an honest re-baseline; document the new seed per that file's established comment convention). Confirm all 10 styles in band on fixture and world; world-diag on seeds 12345/777/2024 if noisy.
21. `bun run test`, `bun run type-check`, `bun run lint` — full suite, not just touched files (skill warns matrix-adjacent tests like `schedulingAssistant` have broken before).
22. Manual spot-checks: Warrior Builder PR picker lists 12 builds; Style Archives PR card renders; plan builder shows the Master-tier Riposte info warning on a veteran PR; AI rippers challenge strikers/scum and decline AB offers in a world probe.

## Files to Modify
- `src/data/fighterConcepts.ts`, `src/data/styleCompendium.ts`
- `src/engine/bout/stylePresets.ts`, `src/engine/ai/matchup/canonTargeting.ts`
- `src/engine/stylePassives/strategies.ts`, `src/engine/warrior/skillBreakpoints.ts` (re-ratchet only if harness demands)
- `src/constants/combat/combat/matchup.ts`, `src/constants/combat/combat/balance.ts`
- `src/engine/combat/resolution/offenseDefense/defense.ts`, `src/engine/strategy/strategyValidator.ts`
- `docs/Stable_Lords_Fighter_Concepts_Arena_93_v1.0.md`, `src/pages/help/sections.tsx`
- Tests: `stylePresets.test.ts` (update guard), `fighterConcepts.test.ts`, `canonTargeting.test.ts`, `stylePassives.test.ts`, `resolution.test.ts`, `strategyValidator.test.ts` — all extended; **new** `src/test/engine/combat/prKillDesireRiposte.test.ts`.

## Verification
- [ ] Phase-0 tests written first and confirmed failing before implementation (TDD red)
- [ ] `bun run test` + `bun run type-check` + `bun run lint` — full suite green
- [ ] `balance-lab` before/after; all 10 styles in [40,60] on fixture; `test:slow` green on both surfaces
- [ ] KD gate proven directional (fewer PR riposte events at KD ≤3, zero effect on other styles)
- [ ] UI spot-checks pass (picker, archives, validator warning)

## Risks / Notes
- Concept-pool growth shifts AI PR recruit generation + `conceptMean` (higher ST/WL mean — the intended damage-first canon signal); world-seeded slow tests may drift → honest re-baseline with the file's comment convention.
- Endurance buff (+10% effective stamina) vs SL edge + KD gate push PR power opposite directions; the lab/world runs decide the penalty re-ratchet.
- `generateArchetypeAttrs` consumes the same RNG count (1 pick + 3 perturbations) — determinism structure preserved, values shift.
- `duplication.guard.test.ts` fighterConcepts exemption covers canon literal pins; notes text must be *adapted* not verbatim per file convention.
- StyleCard "Signature Weapons" shows CW only (Epée for PR) — by design; articles' full W-list lives in doctrine/compendium text instead.
