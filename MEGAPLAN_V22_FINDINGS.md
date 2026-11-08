<!-- markdownlint-disable MD001 MD024 MD025 MD033 MD060 -->

# MEGAPLAN V22 FINDINGS — Noblish Island Canon Integration

Fifteen Arena-93/Noblish Island articles adjudicated claim-by-claim against
the codebase. Four parallel audits (creation/derived-stats, combat, design
guidance, training) + direct verification. Verdicts: **IMPLEMENTED** /
**PARTIAL** / **MISSING** / **CONTRADICTED** / **CANON-CONFLICT**.

## §0 Baseline

- Restore tag `pre-megaplan-v22` created. Working tree carries user WIP
  (~9 modified + untracked `docs/images/`) in non-overlapping paths
  (`progressionHandler.ts`, `warriorDefaults.ts`, help `sections.tsx` [!],
  `StartGame.tsx`, `TurnaroundCard.tsx`, orphan-scan files) — help
  `sections.tsx` IS in our scope; megaplan edits must merge around the
  user's hunks, never clobber.
- Suite tiers per CLAUDE.md: `bun run test` fast gate; `bun run test:slow`
  required because several items touch balance/determinism paths
  (skill tables, derived stats, combat mechanics).

## §1 Claim adjudication — grouped by article

### A. "Warrior Skill Base, a Real Life Example" (Doctor Dehydrate / CIC)

| # | Claim | Verdict | Evidence |
|---|-------|---------|----------|
| A1 | BAGMAN2 attr→skill breakpoint model + style modifiers + [I,R,A,P,F,D] | **IMPLEMENTED (shape)** | `computeBaseSkills` `skillCalc.ts:71-97`; `bp()` `skillBreakpoints.ts:21-27` |
| A2 | Specific chart values (WT15→9I3R7A7F2D; WL9→2A2P2F3D; SP10→2I3R2F4D; DF17→6I7R8A8P8F; ST9→2A2P; SZ18→2I-2P-2F) | **PARTIAL — tables truncated vs both published charts** | WT/WL/ST/SZ tables ✓ (minus BAGMAN DEC bumps). `SP_INI` has phantom +1@4 (canon starts @6), missing 15/21/22-25. `DF_DEF` gutted: `[5,13,15,21]`=3@17 vs canon 8@17. `DF_PAR` 5 vs 8@17. `DF_RIP` 5 vs 7@17. `SP_DEF`/`SP_DEC`/`SP_RIP` missing upper entries. Worked example repro: code I18/R11/A19/P8/F12/D7 raw vs canon I17/R13/A19/P10/F17/D9 |
| A3 | Striker style mods −7I,−4R,−12A,−9P,−12F,−1D | **CANON-CONFLICT (deliberate)** | `STYLE_PENALTIES` rebalanced 2026-04, documented `skillBreakpoints.ts:259-265`; canon table not preserved in-repo |
| A4 | HIGH WIT statement chart (WT row × skill-range → statement) | **PARTIAL (flattened approx)** | `warriorStatements.ts:49-60` binary high/low + WT-keyed text pick. Canon floors ignored (see A6); several canon texts missing ('nothing short of a genius…'); `bad` persona lacks riposte/parry/endurance categories |
| A5 | Endurance = WL×(ST+CN); HP = CN×2+SZmod+WLmod; carry chart; damage chart | **MIXED** | Endurance: **CONTRADICTED** — code uses `score=wl*3+stcn` approx (`terrabloodCharts.ts:223-237`), inflates tails ±1-2 bands, 'U' unreachable. HP: formula matches Sir-Jessie form but tables inflate +5-8 (see §C10). Carry/damage: **IMPLEMENTED** via ENC_TABLE/DMG_TABLE |
| A6 | Canon statement floors at 15WT (I≥10, R≥10, A≥7, P≥6, F≥3, D≥~9) | **MISSING** | statements emit for any skill level (`pickFromArchive` min:0 entries) — over-generates RIP/PAR statements |
| A7 | Ambidextrous: ~15% roll, +1 ATT, "Is AMBIDEXTROUS" | **MISSING** | No warrior field (`warrior.types.ts:171-243`); `narrativeIntro.ts:44-52` rolls handedness per-bout cosmetically (override `handedness` param exists but **no caller passes it** — `simulate/narrative.ts:49-74`); `checkWeaponRequirements` ambi param dead (only tests) |
| A8 | Predicted-vs-profile bonused/hosed analysis (±4 max) | **IMPLEMENTED** | `luckfactor` ±4 / ±6 PS (`skillCalc.ts:116-121`, `warrior.types.ts:178-180`), applied combat-only (`fighterState.ts:303-306`) |
| A9 | Expert (16-19) / Advanced Expert (20+) starting ratings shown on profile | **MISSING** | no rating display; WS INI floor 16 births experts organically but unnamed |
| A10 | Profile physical statements ("has POOR ENDURANCE", "CANNOT take a LOT", "VERY LITTLE WEIGHT", "does GREAT DAMAGE") | **MISSING** | no such prose in uiMeta or dossier; labels exist internally (`ENCUMBRANCE_LABELS`, `ENDURANCE_LABELS` in designReview, `DAMAGE_LABELS`) |

### B. "Skills in Layman's Terms" + "More on Skills" (Gavin Rule / Assur)

| # | Claim | Verdict | Evidence |
|---|-------|---------|----------|
| B1 | INI = press attack / keep swinging / low-INI lets opp attack | **IMPLEMENTED (structural variant)** | one contested roll picks sole attacker per exchange (`initiativePhase.ts`, `resolution.ts:65-98`); momentum×2 snowball |
| B2 | DEC = first strike, fickle (die rolls dominate) | **PARTIAL/CONTRADICTED** | `skills.DEC` feeds ONLY the kill window (`killWindow.ts:234`, `DEC_COEFF 0.0003`); first-strike = INI contest; Decise *tactic* is the decise channel (`tacticResolution.ts:107`, `tacticCounter.ts`) — canon skill role absent |
| B3 | RIP = instant counter after successful dodge OR parry | **PARTIAL** | riposte after parry ✓ + after attacker whiff ✓ (`defense.ts:287-291`, whiff path :59-122); **successful dodge check → no riposte** (`defense.ts:289-290` `if(!isDodge)`) |
| B4 | ATT high → more crits (fancier hits, more damage) | **PARTIAL** | crits exist; chance driven by style passives + favorite weapon only (`damage.ts:187-198`) — `skills.ATT` never consulted |
| B5 | PAR bypassable; dodge not bypassable | **IMPLEMENTED** | `parryBypass` parry-branch only (`defenseCheck.ts:78`, `tacticResolution.ts:92,100`); dodge immune |
| B6 | In-app skill descriptions per canon | **PARTIAL** | help one-liners exist (`sections.tsx:390-412`); canon caveats absent; DEC described as "kill window" (engine-accurate, canon-wrong — resolves with B2 fix) |

### C. Stat articles (Ranking Stats / Will / Average / Order of Importance / Constitution / Speed / Damage / Encumbrance / Endurance)

| # | Claim | Verdict | Evidence |
|---|-------|---------|----------|
| C1 | WL #1 stat (endurance, HP, stat raises, survival, skills) | **IMPLEMENTED (doctrine) / CONTRADICTED (help)** | WL keys all families (`designDoctrine.ts:53-67`); help calls WT "most important" (`sections.tsx:255-260`) — inverted |
| C2 | WL breakpoints 7/9/15/17/21; 10-14 dead zone; "9 or 15" | **PARTIAL** | tables encode 7→15 cliff ✓; dead zone untaught; canon WL9→+1DEC (BAGMAN) absent from `WL_DEC` |
| C3 | Breakpoints every 4th (5,9,13,17,21,25), DF 11, odd>even | **PARTIAL** | real per-skill tables used (finer than article); builder sliders unmarked; help breakpoint text inaccurate (`sections.tsx:270-273`); odd>even absent |
| C4 | HP = CN×2 + SZmod(-5..+5) + WLmod(0→+9 from WL13) | **CANON-CONFLICT** | code tables: SZ 0..+10, WL +1@5..+10@25 — inflates ~+5-8; worked example: canon Sir-Jessie→15 "Cannot take a lot" ✓ matches profile; code→22 "Average" ✗. BUT code cites Ben Weinstein n=3650 fit — newer canon; adjudicate in plan |
| C5 | HP rating names (Very Frail 1-14 / Cannot take a lot 15-20 / Average 21-29 / Can take a lot 30-34 / Tremendous 35-47 / Seemingly unaffected 48+) | **MISSING** | no hp→label function anywhere |
| C6 | Endurance E=(ST+CN)×WL, bands 0-180/181-240/235-390/391-509/510-639/640-699/770+ | **CONTRADICTED** | linear `wl*3+stcn` approx (`terrabloodCharts.ts:228-236`); mid-range OK, tails inflated (ST5/CN5/WL21: canon Poor→code Good = +2 bands); 'U' tier unreachable |
| C7 | Burn order LU-WS-SL-BA-PL-ST-PR-AB-PS-TP | **PARTIAL** | mults encoded (SL1.05>LU=WS1.02>PL1.0>BA0.98>PS=ST0.96>PR=AB0.94>TP0.9) — SL hotter than LU/WS contradicts canon #3; PS misplaced; BA/PL swapped; TP lowest ✓ |
| C8 | Burn scales with AL↑, OE↑, weight carried | **IMPLEMENTED** | `combatFatigue.ts:14-32`, encumbrance `enduranceMult` + armor `enduranceCostMod` (`enduranceCosts.ts:52-76,98-104`) |
| C9 | Exhaustion: defense penalized/absent while tired; 'staggers'/'no longer has endurance' lines | **PARTIAL** | `fatiguePenalty` −4/−8 at 45%/25% (`combatFatigue.ts:46-56`) feeds all checks; `FATIGUE` event + canon barks exist but **never emitted — dead code** (`narrativeStatus.ts:61-65`) |
| C10 | Fade-back rest & endurance recovery | **MISSING** | endurance monotonically decreases in-bout; no rest action/regen |
| C11 | Will checks: exhausted → WL check vs collapse; wounded → surrender; KD low→surrender-live, high→fight-on-die | **PARTIAL** | collapse: `endurance≤0 AND hp<45%` auto-stoppage, no WL roll (`enduranceCosts.ts:122-148`); surrender: plan-gated YIELD at hp&end<15%, no WL/KD (`outcomes.ts:6-48`); KD influences combat elsewhere but not surrender |
| C12 | Encumbrance formula ST+min(ST,CN)−6, bands A0-10/B11-15/C16-21/D21-25/E26-33/F33-44 | **PARTIAL (alt canon)** | code uses ENC_TABLE (Terrablood chart) → caps 6-36; approximates bands; top-end under-counts (ST25/CN25: 36 vs 44). Graduated ratio-tier penalties are an invented mechanic (`encumbrance.ts`) — documented |
| C13 | Striker innate endurance bonus | **PARTIAL (weak)** | `ST_ENDURANCE_MULT 0.96` burn discount only; no pool bonus |
| C14 | SP+DF>31 VHC; +either>14 → "weapon in each hand" free off-hand shot | **PARTIAL** | `computeCoordination` tiers ✓ (off-by-one at 16; extra non-canon tiers 28/40) rendered on dossier; off-hand mechanic + statement **MISSING**; dual-wield data dead |
| C15 | Pagan damage model: ST+class-var+weapon-var; armor weight+12+type-bonus soak; ≤1→bounce min-1; secondary statements = HARD fixed threshold | **PARTIAL** | damage = (class+4)×loc×variance +heft (`damageCalc.ts:9-24`); soak = type-mod + flat mitigation (same shape); min-1 ✓ (`damageCalc.ts:24`, `weaponArmor.ts:68`); bounce lines exist via glancing severity; **secondary statements ratio-of-maxHP not fixed threshold** (`narrativeStatus.ts:17-34`) |
| C16 | Damage ratings Little→Super-Human(+Unearthly) | **IMPLEMENTED** | `DAMAGE_LABELS` `skillCalc.ts:200-211`; shown in builder/design review only — not on dossier |
| C17 | 'Average' stats ~9-10, ranges 3-21 | **PARTIAL** | builder is 70-pt pool / range 3-25 (house); no average teaching; SZ fully editable (canon: rolled, unchangeable) |
| C18 | Recruit "66 Attribute Points" text | **CONTRADICTED** | `Recruit/index.tsx:92` stale — real budget 70 |

### D. Warrior Design article (She-Puppy) + guidance surfaces

| # | Claim | Verdict | Evidence |
|---|-------|---------|----------|
| D1 | 14 discretionary points on rolled base | **CONTRADICTED (house rule)** | flat 70-pt allocation; SZ editable. Keep as documented divergence |
| D2 | Per-style design advice | **PARTIAL** | designReview canon notes for SL/PL/ST/PS/WS/LU; **BA/PR/TP missing**; AB weakness unwarned; PR Good+-damage bar missing; LU anchored to longsword not shortspear |
| D3 | Weapon suitability + minimums + "≥1 suited wieldable" | **IMPLEMENTED** | reqs canon (epee WT15/DF15, scimitar DF11, shortspear ST9, LO WT13); `reviewWeapons` warn; loadout badges |
| D4 | Stat tiering (WL8 WT7 DF7 SZ6 ST6 SP5 CN3) / Assur order | **MISSING** | no ranked model anywhere; help inverts WL/WT |
| D5 | Little damage crippling; AB/TP tolerate; PR/BA want Good+; LU damage-or-endurance | **PARTIAL** | physicals axis warns only if all three sub-good; no per-style damage bars (ST pairing + LU caution exist) |
| D6 | Design-time teaching of breakpoints/dead zones | **PARTIAL** | `reviewTrainability` flags primed attrs; no WL dead-zone callout; no DF-11 callout |

### E. Training articles

| # | Claim | Verdict | Evidence |
|---|-------|---------|----------|
| E1 | WL-driven stat raises; ~2-per-stat cap | **IMPLEMENTED** | `WL×0.05` base, repeat-halving, seasonal cap 3, potential DR (`attributeTraining.ts`, `potential.ts:71-78`) |
| E2 | Stat trains burn future learns; ST 7-14 & CN free trains | **MISSING (structural)** | no shared skills/trains budget; stat training strictly upside (costs only the lost bout) — inverts "skills first" canon doctrine |
| E3 | WT main learn stat, WL lesser | **PARTIAL** | WT sole learn gate (`learnRoll.ts:121-124`); WL zero learn role |
| E4 | Style learn priorities / mode skills | **IMPLEMENTED** | Pagan `STYLE_LEARN_PRIORITY` + favorite-learn affinity (`learnPriorities.ts`, `learnRoll.ts:45-76`) |
| E5 | Caps 3-21 basic / 25 ADM; WL>21→INI | **CONTRADICTED (house)** | 3-25 throughout, no ADM tier; WL>21 grants nothing |
| E6 | XP level-ups grant free stat raises | **NOTE** | `progression.ts:118-151` +1 attr/5XP, no skill cost |

### F. Cross-cutting defects found

| # | Item | Severity |
|---|------|----------|
| F1 | `DF_DEF`/`DF_PAR`/`DF_RIP`/`SP_*` tables truncated vs stated Terrablood source — under-skills every high-SP/DF warrior | HIGH (data bug + balance) |
| F2 | AB canon "double ATT skills from DF" rule absent | MED (data bug) |
| F3 | Wit-statement: canon floors ignored; `bad` persona missing 3 categories; unreachable entries (min>25 vs WT key); duplicate-min dead entries; "(N)" numerals in texts; 'genius' text absent | MED |
| F4 | Ambidextrous/handedness: no persisted flag; per-bout cosmetic RNG; +1 ATT absent; `dualWieldReq*`/`offHandReq`/`ambidextrous` params dead | MED |
| F5 | No profile physical statements (endurance/HP/carry/damage prose); no HP rating labels; no Expert ratings | MED |
| F6 | No will-check / WL-KD surrender; no in-bout endurance recovery; DEC skill unused for strike order; dodge-check grants no riposte; ATT→no-crit-link | MED-HIGH (mechanics) |
| F7 | Endurance formula approx inflates tails; 'U' unreachable; fatigue barks dead (`FATIGUE` event never emitted); `isMastery` on HIT never set | MED |
| F8 | Help contradictions: WT>WL ordering, breakpoint text, encumbrance "f(ST,CN,SZ)", DEC-as-kill-window | LOW-MED |
| F9 | `BASE_GAIN_CHANCE` dead export; TOTAL_CAP 120 (training) vs 80 (XP); aging penalty 25 vs 28 (drills); learnedSkills+drills stack unclamped past 20 | LOW |
| F10 | Favorite-rhythm INI bonus gated on `discovered` despite doc "ALWAYS ON" | LOW-MED |
| F11 | Canon style-penalty + BAGMAN2 tables not preserved in-repo (values only in delta comments) | LOW |
| F12 | `narrativeIntro` handedness override dead (no caller passes); per-bout re-roll contradicts persistent warrior identity | MED |

## §V Verdict matrix — what gets built vs documented

| Bucket | Items |
|--------|-------|
| **Fix now — canon data bugs** | F1 table fixes (w/ re-ratchet), F2 AB DF×2, F3 persona/floor repairs, F4 ambidextrous, F5 profile statements + HP labels + expert ratings, F8 help, C18 Recruit 66→70, F12 intro wiring |
| **Fix now — mechanics (balance-verified)** | B2 DEC→first-strike, B3 dodge→riposte, B4 ATT→crit, C9 fatigue barks wiring, C11 will-checks + KD surrender, C10 fade-back recovery, C13 striker endurance bonus, C6 endurance formula, C7 burn-order retune, F10 rhythm always-on, C15 fixed-threshold secondary statements |
| **Adjudicated — article wins over code** | C4 HP tables → Sir Jessie Jest (validated by Chronic Pain example); WL_DEC +1@9, WT_DEC +1@7 (BAGMAN source = the CIC these articles quote) |
| **Adjudicated — code stands (house rules)** | D1 70-pt pool + editable SZ; C12 ENC_TABLE vs formula; E5 3-25 no-ADM; A3 rebalanced penalties; numeric skills shown (canon hides them) |
| **Deferred — structural, needs own pass** | E2 trains-burn economy; C14 off-hand/dual-wield combat (needs loadout model); C16-adjacent damage-formula rewrite; ADM graduation tier |
