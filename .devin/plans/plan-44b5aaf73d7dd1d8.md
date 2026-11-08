# Arena 93 Lunger Articles — Full Port (Snorri / Wild Boar / Assur)

Port the three Arena-93 lunger articles across the repo's six established article surfaces — canon fighter concepts, strategy presets, design review, AI canon targeting + plan doctrine, strategy-validator warnings, and docs/codex — with a strict test-first (RED → GREEN) workflow and no mechanical balance changes.

## Scope decisions (confirmed with user)

- **Full port**: all six article surfaces (concepts → presets → design review → canon targeting/AI doctrine → validator → docs/codex).
- **Concepts**: add all 11 published qualifying spreads + a synthesized "Assur's Model" build → **12 new / 15 total LU concepts**.
- **Canon targeting**: `LU vs TP = −3` — hard "avoid the plague" gate (existing refusal path, no new mechanism).

## Validation findings (audited against live code — approve / correct)

### Approved as drafted
1. **`fighterConcepts.ts`** — LU has 3 concepts (Scrapper, Heavy Spear, Broke Stroker); `concept()` helper scales `canonStats` → `stats` via `scaleToAttributeBudget` (clamps to `ATTRIBUTE_MIN=3`/`MAX=25`, sums to `ATTRIBUTE_TOTAL=70`); canon-sum test accepts `[83,86]`; file ~750 lines, +~150 lands ~900 < 1300-line `fileBudget` data ceiling. Duplication-guard pair already exempted.
2. **All 12 canon spreads sum to exactly 84** (verified arithmetically) — safely inside the 83–86 contract.
3. **Weapon reqs**: `longsword` = ST 11 / SZ 3 / WT 13 / DF 11 — *exactly* Assur's published LO frame; `checkWeaponRequirements` + `trainableDeficit` already exist for the "in reach" warn pattern (SL scimitar precedent). Short spear is LU's CW favorite — consistent.
4. **`stylePresets.ts`** — `PhaseVals`/`PresetSpec` support `offTac`/`defTac`/`desperatePlan`/`target`/`protect`; `'none'` is a valid tactic; `getAITactics(LU)` already returns `Lunge`/`Dodge`. Two spec presets pinned by name at indices 0–1 — **appending canon sheets preserves pinned indices**; the spec two remain untouched.
5. **`canonTargeting.ts`** — `Partial<Record>` allows partial rows; ≤−3 refusal gate at `boutAcceptance/index.ts:64` handles the −3 automatically.
6. **Doctrine call order** (`coreGenerator/index.ts`): `applyPlanValidation` → `applyStyleDoctrine` runs **before** `applyStrategicLayer` → `buildPhasePlan`, so an AL floor on the base plan propagates into opening/mid/late phases automatically — correct insertion point confirmed.
7. **LU balance**: 49.3% fixture / 48.0% world — mid-band; no `STYLE_PENALTIES`/matrix/baseline re-ratchet. The mechanical article claims (initiative, burst, late fade, endurance burn, kill punch) are already modeled in `strategies.ts` + matchup cell.
8. **`DesperatePlan`** supports `{OE, AL, killDesire, offensiveTactic?, defensiveTactic?}` — no `target`/`protect` needed there.
9. **Weather/venue LU rows already exist** (`arena.ts` STYLE_WEATHER_MODIFIERS, `offerMatchmaking.isWeatherDisadvantaged`); articles are silent on weather → **no change there** (explicitly approved, not an oversight).
10. **`documentationParity.test.ts`** only scans DESIGN_BIBLE route tokens → doc edits unaffected.
11. **`styleMatcher`** (`getStyleMatchupMods` oe/al/kd) is a *separate* system from `canonTargetingBias` — its pinned LU tests are unaffected; we do not touch it.
12. `designReview.test.ts` LU usages are axis-filtered → new style-axis notes don't break them (one weapons-ok case gains an extra style-axis warn item — still passes).

### Corrections the audit forced into the plan
- **R1 — `styleDoctrine.test.ts:42-46` BREAKS**: `'does not touch other styles'` uses an LU warrior and asserts `plan(9,9,9)` passes through unchanged; the LU KD-cap 8 makes `killDesire` 8. **Fix in the same test-first pass**: swap that control case to `BashingAttack` (a still-doctrine-free style) and update its comment.
- **R2 — `generateRecruitAttrs.test.ts:40` AT RISK**: 'LU recruits trend toward canon WT' asserts `agile.WT > neutral.WT + 1`. Ticket counts should stay stable (WT mean ≈12.7→3 tickets before and after), but the mean leader shifts WT→WL. **Verify; if it fails, update the assertion to canon WL leadership** (canon-true).
- **R3 — `conceptPrimaryAttr(LU)` flips WT→WL** (new mean WL ≈14.7 > WT ≈12.7): the apprentice bump in `signWarrior.ts:116` becomes **+1 WL**. Canon-consistent (all three articles name WL the lifeline) — an intended, noted behavior change; verify nothing else pins it.
- **R4 — `canonTargetingBias` has TWO consumers**, not one: the ≤−3 refusal gate AND `boutBidding/generation.ts:68,81` bid scoring. LU bids against TP opponents will also be scored down — intended, must be noted.
- **R5 — help text is already stale**: says "nine canonical parry-lungers" but PL has 11 concepts — fix counts while adding the LU line.
- **R6 — naming collision**: `src/engine/ai/plan/strategyValidator.ts` (hard validator) ≠ `src/engine/strategy/strategyValidator.ts` (soft warnings). **We edit the latter**; its test is `src/test/engine/strategyValidator.test.ts` (engine root — matches `testQualityAudit` domain filing).
- **R7 — `boutAcceptance.test.ts` has no LU-warrior coverage** (existing LU mentions are PL-warrior tests) → new refuse/accept specs required.
- **R8 — `snap.json` is committed**; LU recruit-pool change perturbs seeded world gen → world snapshots shift; run `test:slow`, re-baseline via world-diag if the snapshot pipeline requires it.
- **R9 — concepts doc LU section omits Broke Stroker** (shows only 2 concepts) → fix while expanding.
- **R10 — compendium doc LU section** (`docs/...Compendium...:183-224`) has a strategy/AI-heuristics block ("higher AL, moderate OE; TP/PR avoid wasteful OE") — reconcile with canon specifics.
- **R11 — `boutBidding.test.ts` LU-warrior mentions are weather paths** → safe; verify during implementation that no bid-score test pairs an LU warrior vs a TP opponent.

## Canon sources (what we're encoding)

- **Snorri** — even spread doctrine; ST 9–13 (13 → long spear), CN ≥9 (~13 pref), SZ ≥9 (12+ for damage), WT 12–17 (15 fair), WL ~15, SP 7–11+ (low-S school OK, 11+ better), DF 11+ (hits legs). Skill bases: 13-10-9-15-15-11-11 (50% ini/att, 30% par, 35% def, 20% rip) and 9-15-8-15-13-11-13 (60% rip). Strategy: hi-hi-mod, 5–8 KD, weapons epee/long sword/short spear/long spear; light armor; one of the highest endurance burns.
- **Wild Boar "Defensive Lunger"** — Perfect 13-7-4-21-17-5-17; actuals 11-3-10-17-17-9-17 and 13-11-6-17-19-5-13; minimums 11-3-4-17-13-5-13. Strategy: Off 4→9 desp, Act 6 min-1 tapering 4→9 desp, KD 4→9; any lunging weapon; protect body; never fight defensively vs other lungers.
- **Assur's model** — STR 11+ (LO), CON 8ish+, SIZ any, WIT 13+, WIL 21, SPD 5+, DFT 11+; LO + SC vs plate; ALE/APL + any helm; 7-10 min-1 lazy-career default, lower AL fast, OE ~7; usually no tactics; 7-10 desperation. Hybrid; kills early. Worst matchup: plate scum — "avoid like the plague"; best: hybrids, strikers, bashers; danger from very high-att/init offensives. Graduates: 12-13-8-13-21-6-11 / 9-15-11-14-20-5-10 / 9-11-8-15-21-7-13 / 10-10-4-16-20-14-10 / 9-11-13-13-19-9-10 (→11-13-13-14-21-9-11 post-train) / 9-9-13-17-21-4-11.
- **Excluded as sub-standard**: Boar minimums (66) and 11-3-10-… actual (74) fail the canon 83–86 contract.

## Workflow — strict test-first (RED → GREEN)

> Repo convention (V21 megaplan): commit the complete spec inventory (RED) *before* merges. All new tests go into **existing** spec files — correct domains, no new files needed.

### Phase 0 — RED spec inventory (all tests written first, verified failing for the right reasons)

Extend these existing files; run `bun run test` and confirm each new spec fails because the feature doesn't exist yet:

1. **`src/test/data/fighterConcepts.test.ts`**
   - `LungingAttack: has 15 concepts` (currently 3 → RED).
   - Canon-spread pins for all 12 new builds (name → exact `canonStats`; all sum 84).
   - "every LU concept preserves canon 83–86 + scaled=70/min/max invariants" via existing coverage loop.
2. **`src/test/engine/bout/stylePresets.test.ts`** — extend the LU block:
   - pins: `list[0]` Blitz, `list[1]` Sustained Pressure stay (regression), `list.length === 5`.
   - New specs: `Assur's Lazy 7-10` base 7/10, `offensiveTactic 'none'`, `desperatePlan {OE:7,AL:10}`; `Defensive Lunger` opening AL 6 + late AL 4 + `target 'Right Leg'` + `protect 'Body'` + `defensiveTactic 'Dodge'`; `Snorri's Tempo` opening OE/AL > late OE/AL.
3. **`src/test/engine/warrior/designReview.test.ts`** — new `Arena 93 lunger canon` block:
   - `DF<11` → style warn (LO/def-tap); `WT<13` + `ST<11` → same warn (Assur frame); within-reach (`deficit ≤2` via `trainableDeficit`) → `in reach` note.
   - `CN<9` → info (Snorri's "don't go below 9"; Boar's low-CN exception).
   - `SZ<12 && ST<13` → info (damage-rating caution).
   - `max−min ≤4` → info praising even spread.
   - `WT≥17` → info (Snorri's diminishing-returns caveat).
   - Non-leak spec: same attrs under SL/ST produce **no** LU messages (existing leak pattern).
4. **`src/test/engine/ai/canonTargeting.test.ts`** — new `LU doctrine` describe: `LU→TP ≤ −3`; `LU→ST`, `LU→BA`, `LU→PS` (hybrid) `> 0`; `LU→PL ≥ 0`; unmapped styles `0`.
5. **`src/test/engine/ai/styleDoctrine.test.ts`** — **edit first**: swap the `'does not touch other styles'` control from LU→`BashingAttack` + comment; add `LU doctrine (Arena 93)` describe: `AL floor 4` (plan(9,1,9)→AL 4), `KD cap 8` (plan(9,9,9)→kd 8), canon plans `7/10/6` and `4/6/4` pass through untouched.
6. **`src/test/engine/strategyValidator.test.ts`** — new `Lunger canon (Arena 93)` block:
   - `LU_SUSTAINED_HIGH_AL` fires (late AL ≥6 while OE<AL) for LU, not for SL.
   - `LU_LOW_OFFENSE` fires (OE≤3 && AL≤5) for LU — the "avoid like the plague is scum posture" inverse: a passive lunger isn't a lunger.
   - `LU_TACTICS_HEAVY` info when ≥2 of {offTac,defTac,phase tactics} are forced (Assur "laziness is king").
   - No-leak spec: same plans on TP/BA produce no LU codes. Existing LU case at line ~1043 (OE5/AL5/KD5 + Parry) must stay silent — verify.
7. **`src/test/engine/ai/workers/competitionWorker/boutAcceptance.test.ts`** — new describe: LU warrior refuses TP offer (`accepted:false`, `/style beats ours/`), accepts an ST offer; title-bout/vendetta overrides still apply per existing harness.
8. **`src/test/data/designDoctrine.test.ts`** — verify `STYLE_FAMILIES.offensive` still includes LU (regression pin already at line 34 — confirm, extend if the doc string changes).
9. **`src/test/engine/owner/roster/generateRecruitAttrs.test.ts`** — **pre-fix if needed**: after Phase 1 lands, either WT pin still passes (keep) or update to canon WL/WL+WT leadership with a comment citing the mean shift.
10. **Docs/help regression** — if a cheap assertion exists for help-bullet counts, extend; otherwise manual check during verification.

*Phase-0 acceptance: `bun run test` shows only the new specs failing (RED), each for the stated reason; `bun run type-check` stays green (tests compile — data/test fixtures don't require new types).*

### Phase 1 — Concepts + doctrine text (GREEN: spec group 1, 8)

`src/data/fighterConcepts.ts`:
- Rewrite LU `doctrine` (Snorri+Assur: even spread; ST/CN/WL all spend-worthy; LO at 13 ST vs epee trade-off; endurance burn ⇒ conservative rhythm; best-vs-offensives/dies-vs-scum; early kill punch).
- Append 12 `concept(...)` entries after Broke Stroker, canon order Snorri→Boar→Assur:

| # | Name | canonStats | Line |
|---|------|-----------|------|
| 1 | Even Spread | 13-12-12-12-12-12-11 | Snorri's first — long spear, nearly won his DA match |
| 2 | The Aesir | 13-10-9-15-15-11-11 | Snorri's best skill base (50% ini/att) |
| 3 | Riposte Gamble | 9-15-8-15-13-11-13 | 60% riposte, no parry — "sort of useless" |
| 4 | Boar's Perfect | 13-7-4-21-17-5-17 | Wild Boar's theoretical defensive lunger |
| 5 | Boar's Graduate | 13-11-6-17-19-5-13 | Actual graduate w/ attack expert |
| 6 | Assur's Model | 11-14-9-13-21-5-11 | Synthesized minimum-meeting build (marked synthesized in notes, Crimson-Striker precedent) |
| 7 | The Fantastic | 12-13-8-13-21-6-11 | 17-6 despite normal damage |
| 8 | Freshman Crown | 9-15-11-14-20-5-10 | TC'd freshman busting stats |
| 9 | The Natural | 9-11-8-15-21-7-13 | Graduated 14-7, no trains |
| 10 | Lucky Roll | 10-10-4-16-20-14-10 | 16-5 on luck; missed LO suitability |
| 11 | The Standard | 9-11-13-13-19-9-10 | Trained → 11-13-13-14-21-9-11, then 18-6 |
| 12 | Arena Ace | 9-9-13-17-21-4-11 | 17-4 in an easy arena |

  Names are new and unique (no dupes across concepts). Notes carry the record/lineage; tactics strings cite the source ("hi-hi-mod", "Off 4/Act 6 taper", "7-10 minute 1, AL off fast").

### Phase 2 — Design review (GREEN: spec group 3)

- `src/data/designDoctrine.ts` — add thresholds: `LUNGER_DF_FLOOR=11`, `LUNGER_EVEN_SPREAD=4`, `LUNGER_CN_SOFT_FLOOR=9`, `LUNGER_DAMAGE_ST=13`, `LUNGER_DAMAGE_SZ=12`, `LUNGER_WT_CEIL=17` (existing `WEAPON_DEFICIT_IN_REACH=2`, `HIGH_WT=17` reused).
- `src/engine/warrior/designReview.ts` — add `if (style === FightingStyle.LungingAttack) items.push(...lungerCanonNotes(attrs));` in `reviewStyle` (same insertion shape as PL/ST/PS); module-local `lungerCanonNotes()` emits warn/info items above, all copy citing source managers.

### Phase 3 — Presets (GREEN: spec group 2)

`src/engine/bout/stylePresets.ts` — append 3 LU presets after Sustained Pressure:
- `Assur's Lazy 7-10` — `{OE:7,AL:10,KD:6}`, phases `{7,10,6}→{7,5,5}→{6,4,4}`, `offensiveTactic:'none'`, `desperatePlan:{OE:7,AL:10,killDesire:6}`.
- `Defensive Lunger` — `{OE:4,AL:5,KD:4}`, phases `{4,6,4}→{4,4,4}→{4,4,5}`, `defensiveTactic:'Dodge'`, `offensiveTactic:'none'`, `target:'Right Leg'`, `protect:'Body'`, `desperatePlan:{OE:9,AL:9,killDesire:9}` (all-out when cornered).
- `Snorri's Tempo` — `{OE:9,AL:9,KD:7}`, phases `{9,9,7}→{7,7,6}→{5,6,5}` (hi-hi-mod, 5–8 KD band), signature tactics Lunge/Dodge via defaults.
- Description strings cite Snorri/Boar/Assur, matching the PL/SL canon-label style.

### Phase 4 — AI canon targeting + plan doctrine (GREEN: spec groups 4, 5, 7)

- `src/engine/ai/matchup/canonTargeting.ts` — add `LUNGER_TARGETING` row: `TP −3` ("avoid like the plague"); `ST +2`, `BA +2`, `PS +1` ("hybrids and strikers/bashers are your best matchups"); `PR +1` (assassin-style defensive — kill window exists before they settle in); `SL −1` ("very high attack or initiative offensives can cause problems"); `WS −1`, `AB −1`, `PL +1`... *final small magnitudes tuned to the row; every nonzero entry gets a source comment; omissions default 0.*
- `src/engine/ai/plan/coreGenerator/doctrine.ts` — add `LungingAttack` branch after PL: `plan.AL = max(4, AL)` (a lunger too slow to move isn't a lunger); `plan.killDesire = min(8, KD)` (Snorri's 5–8 band). Canonical comment block citing all three managers; constants `LUNGER_AL_FLOOR=4`, `LUNGER_KD_CAP=8`.

### Phase 5 — Strategy validator (GREEN: spec group 6)

`src/engine/strategy/strategyValidator.ts` (the **soft-warning** file — not `ai/plan/strategyValidator.ts`):
- Named constants `LUNGER_AL_HIGH=6`, `LUNGER_OE_LOW=3`, `LUNGER_AL_LOW=5`, `LUNGER_TACTIC_COUNT=2`.
- `lungerRhythmWarnings(plan, OE, AL, out)` — codes `LU_SUSTAINED_HIGH_AL` (warn), `LU_LOW_OFFENSE` (warn), `LU_TACTICS_HEAVY` (info); copy cites Snorri (endurance burn), Boar (taper), Assur (laziness). Wire in `validateStrategy` after `plCanonWarnings`.

### Phase 6 — Docs, compendium, help (GREEN: group 10)

- `docs/Stable_Lords_Fighter_Concepts_Arena_93_v1.0.md` — expand LU section: all 15 concepts w/ scaled stats + canonStats + notes, plus a matchup/doctrine para; **also backfill missing Broke Stroker**.
- `docs/Stable_Lords_Fighting_Styles_Compendium_v0.3_...md` — reconcile the LU section (`:183-224`): strategy guidance → hi-hi-mod/7-10 taper; AI heuristics → "avoid plate scum; feast on offensives".
- `src/data/styleCompendium.ts` — enrich LU `weaknesses` (scum/plate), `equipment` (LO/SS/LS/E; ALE/APL), `strategy` (7-10 → taper, 5–8 KD).
- `src/pages/help/sections.tsx` — update styles bullet to include LU + fix stale PL count ("nine"→"eleven").

## Files to modify

- `src/data/fighterConcepts.ts`, `src/data/designDoctrine.ts`, `src/data/styleCompendium.ts`
- `src/engine/warrior/designReview.ts`, `src/engine/bout/stylePresets.ts`
- `src/engine/ai/matchup/canonTargeting.ts`, `src/engine/ai/plan/coreGenerator/doctrine.ts`
- `src/engine/strategy/strategyValidator.ts`
- `src/pages/help/sections.tsx`
- `docs/Stable_Lords_Fighter_Concepts_Arena_93_v1.0.md`, `docs/Stable_Lords_Fighting_Styles_Compendium_v0.3_DUELMASTERS_NAMES.md`
- Tests: `src/test/data/fighterConcepts.test.ts`, `src/test/data/designDoctrine.test.ts`, `src/test/engine/warrior/designReview.test.ts`, `src/test/engine/bout/stylePresets.test.ts`, `src/test/engine/ai/canonTargeting.test.ts`, `src/test/engine/ai/styleDoctrine.test.ts` (control fix + new block), `src/test/engine/ai/workers/competitionWorker/boutAcceptance.test.ts`, `src/test/engine/strategyValidator.test.ts`, `src/test/engine/owner/roster/generateRecruitAttrs.test.ts` (conditional fix).

## Behavior changes to call out (zero-compat constraint — allowed)

- **Seeded world shifts**: LU recruit pool 3→15 perturbs `generateArchetypeAttrs`/`recruitGenerator` concept picks and `conceptMean` → different world snapshots (snap.json may need regeneration).
- **`conceptPrimaryAttr(LU)`: WT→WL** → apprentice signings get +1 WL (canon-consistent).
- **LU AI plans**: AL floored at 4, KD capped at 8 → propagates into generated phases (correct-by-construction ordering).
- **LU matchmaking**: vs TP now hard-refuses offers AND scores bids down — AI lungers stop feeding scum.
- **LU warnings**: PlanBuilder/advisor surfaces show 3 new advisory codes on LU plans.

## Verification

- [ ] Phase 0: `bun run test` — only new specs fail (RED); `bun run type-check` green.
- [ ] Each phase: `bun run test <changed spec files>` → green before next phase.
- [ ] Final: `bun run test`, `bun run type-check`, `bun run lint`.
- [ ] `bun run test:slow` — REQUIRED here: seeded recruit gen + plan doctrine + targeting feed world sims and the balance harness. Watch `generateRecruitAttrs` WT pin, `statGeneration`, `stylePresets`, `styleDoctrine` control case.
- [ ] `bun run scripts/world-diag.ts` — confirm LU stays mid-band (~45–55%); regenerate `snap.json` only if the balance-report pipeline requires a fresh snapshot.
- [ ] `bun run scripts/balance-lab.ts` — confirm flat-fixture rates hold; LU should stay ~49% (no power change intended).
- [ ] File budgets: `fighterConcepts.ts` ~900 < 1300; `designReview.ts` < 1600 — `bun run test src/test/megaplan`.
- [ ] Manual: grep `fighterConcepts.test.ts` canon pins vs article numbers one final pass.

## Risks / watch-list

- **`styleDoctrine.test.ts` LU control case** — fixed in Phase 0 (swap to BashingAttack).
- **`generateRecruitAttrs` WT pin** — likely survives (ticket counts stable) but is the first thing to check in the slow run.
- **LU row affects bid scoring** (`boutBidding/generation.ts`), not just refusal — verify no bid test pairs LU warrior vs TP.
- **LU doctrine clamp propagates to phases** — intended; confirm no existing phase test pins a sub-4 LU AL.
- **15-concept pool raises LU recruit quality variance** — mean shifts WL-led; bounded by existing ±3 jitter tests.
- Guard tests to mind: `fileBudget`, `duplication` (pair already exempted), `testQualityAudit` (domains already correct — all edits extend existing spec files).
