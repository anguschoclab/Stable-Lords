# Terrablood Canon Claims Register (V31)

Distilled register of claims from the Terrablood PBM Archives (Duel II community
strategy collection — per-style design guides, Hoser Report #1–#15, weapon/armor
charts, tournament & Bloodgames material), audited against the live Stable Lords
codebase as part of MEGAPLAN V31.

**Provenance & caveat:** this is community strategy lore, not developer canon.
Managers contradict each other — `disputed` rows keep the conflicting claims
per-article rather than flattening them. Nothing here is authoritative until the
V31 adjudication gate rules on it (`MEGAPLAN_V31_FINDINGS.md` §2).

**Corpus note:** the original paste exceeded context capacity; surviving content
= the Aimed Blow concept set (summary), the full Bloodgames article text, the
article table-of-contents, and the canon formulas the plan already carried. Rows
cite the article each claim derives from. Where the code already embeds a canon
answer via the V22-era canon layer (`src/data/terrabloodCharts.ts` + the
`*.canon.test.ts` suite), the archive's competing lore formula is recorded as
`disputed` — the measured chart is the adjudicated source.

**Verdicts:** `implemented` (live code matches) · `missing` (no engine surface)
· `diverged` (code intentionally differs — check BACKLOG §3 for prior
adjudication) · `disputed` (archive self-contradicts or evidence is mixed).

Schema: `id | claim (article) | verdict | evidence (file:line) | status`

## C — Combat canon

| ID | Claim (article) | Verdict | Evidence | Status |
| --- | --- | --- | --- | --- |
| C1 | Scimitar is the reliable AB default; daggers, epees, short swords, short spears struggle to penetrate armor (AB Castle Style / Aimed Blows My Way) | implemented | `data/equipment/weaponStyles.ts:22,72,80,90` (AB suitabilities incl. SC); `data/equipment/weapons/items.ts:365` AB `favoredStyles`; armor-penetration handled by `constants/combat/combat/weaponArmorMatrix.ts` (V24-F2) | resolved |
| C2 | Padded leather or ring mail is the standard AB armor, incl. dodge builds (AB Castle Style) | implemented | canon armor ids + suitability in `src/data/equipment/armor.ts`; armor canon spec `src/test/data/equipment/armor.canon.test.ts` | resolved |
| C3 | Shields avoided; off-hand weapon only with a one-handed primary (AB guides) | implemented | `data/equipment/offhandGrid.ts` canon dual-DF grid; `engine/combat/resolution/offhandAttack.ts:48-55`; `src/test/engine/equipment/offhandWield.canon.test.ts` | resolved |
| C4 | HP = `3.75·CN + SZ + WL/2`; endurance ≈ `CN·WL + ST/10` or `ST+CN+WT/2+WL` (Hoser #15 / design guides) | disputed | code implements the measured Terrablood lookup tables instead — `data/terrabloodCharts.ts` HP `CN·2 + SZmod + WLmod` ("100% accuracy, n=3650"), endurance (ST+CN)×WL lookup, damage ST×SZ table. Lore formulas superseded by measured canon | resolved (chart wins — no action) |
| C5 | Death: vitals hit + kill intent → death roll; hp-floor → infirmary roll → death roll; ~90% of deaths via intent (Mechanics of Death) | implemented | `engine/combat/mechanics/deathRolls.ts` (`deathRollFailChance`, `infirmaryFailChance`, `rollInfirmaryOutcome` — comment cites the ~90% split) | resolved |
| C6 | Weapon-vs-armor effectiveness table (Hoser #12 + Jessie Jest basher notes) | implemented | `constants/combat/combat/weaponArmorMatrix.ts`; `src/test/engine/combat/weaponArmor.canon.test.ts` | resolved |
| C7 | Weapon stat-requirement table — ST/SZ/WT/DF minimums per weapon (Hoser #1) | implemented | `checkWeaponRequirements` + weapon req data; `src/test/data/equipment/weaponReqs.canon.test.ts` | resolved |
| C8 | Weapon breakage folklore — QS/GA/GS "break a lot" (Hoser reports) | missing | no `weaponBreak`/breakage mechanic in `src/engine/` or `src/constants/` | DECISION-NEEDED |
| C9 | Two-weapon deftness requirements — 2×EP needs 21 DF, 17 if ambidextrous (design guides) | implemented | `data/equipment/offhandGrid.ts` (canon quantized table 3/5/7/9/11/15); ambidextrous bypasses VHC profile at `engine/combat/resolution/offhandAttack.ts:51-55`; `DUAL_VHC_SUM_MIN=32`, `DUAL_VHC_STAT_MIN=15` in `constants/combat/combat/balance.ts:75-77` | resolved |

## D — Design heuristics

| ID | Claim (article) | Verdict | Evidence | Status |
| --- | --- | --- | --- | --- |
| D1 | AB profile: ST 8–9+ (normal damage-giving), CN normal+, small SZ, WT 17+, WL 9–15 (11–13 preferred), SP normal coordination, DF 17+ — "most important attribute"; 21 beneficial not mandatory (AB Castle Style / Aimed Blows My Way) | disputed | archive itself split: "never design AB below 21 DF" vs "17 works, 21 not mandatory". Code embeds the adjudicated middle: `designReview.ts:164-176` canon tip DF<21 with warn/info split (`T.AB_DF_CANON`/`T.AB_DF_WARN`); `ARCHETYPE_DESIGN_BARS.AB_ST_VIABILITY` (`designReview.ts:654`); `STYLE_ARCHETYPE_FIT[AB]` (`data/warriorArchetypes.ts:351`) | resolved (prior adjudication embedded) |
| D2 | Odd-stat skill breakpoints (13/15/17/21); "no bonus at 19 except speed"; DF-21 "double attack skills" rumor (Hoser #1/stats guides) | implemented | `src/engine/warrior/skillBreakpoints.ts` canonical Terrablood breakpoint tables; `src/test/engine/warrior/skillBreakpoints.canon.test.ts`; `designReview.ts:842` warns the WL dead-zone between 9/15/17/21 | resolved |
| D3 | Evaluation thresholds — WT+WL+DF ≥ 49 = "Primus-bound", ≥ 35 = basic/ADM viable; the 17-17-17 "Triplett" (Hoser #15) | missing | `designReview.ts` has no WT+WL+DF composite threshold; `warriorValue.ts`/`potential.ts` lack the 49/35 cut lines; `highSkillHybrid` archetype approximates the Triplett but no explicit bar | DECISION-NEEDED |
| D4 | Ambidexterity grants off-hand capability regardless of coordination profile (design guides) | implemented | `Warrior.handedness` ('ambidextrous'/'ambi-reversed') bypasses VHC at `offhandAttack.ts:51-55` | resolved |
| D5 | Kill-optimized Bloodgames archetypes: 17-3-3-21-21-8-11 ST, 17-16-3-3-21-3-21 AB, 17-3-3-21-21-12-7 SL (Bloodgames) | missing | `STYLE_ARCHETYPE_FIT`/`ARCHETYPE_DESIGN_BARS` cover archetype families, not the extreme kill-design profiles; SZ-3 kill chassis isn't a recruit archetype | evidence fold → V24-D5 |
| D6 | Skill base + NEX (number-to-expert) tables per attribute (Terrablood skill chart) | implemented | `skillBreakpoints.ts` + learn tables; `src/test/engine/learning/learnCapAndBurn.canon.test.ts`; `src/test/data/skillTiers.canon.test.ts` | resolved |
| D7 | "Luck factor" 0/5/10/15 assigned at roll-up (Hoser Report) | disputed | archive's flat-scale model vs code's canonical ±4-per-skill `luckfactor` (`types/warrior.types.ts:190-192`, `engine/warrior/skillCalc.ts:140` `rollLuckfactor`) — two canon sources conflict; code adopted the per-skill model (V22 canon layer) | resolved (model adopted) — surface question = M3 |

## S — Strategy & AI depth

| ID | Claim (article) | Verdict | Evidence | Status |
| --- | --- | --- | --- | --- |
| S1 | Offensive AB seeks first strike; low-speed builds compensate with decisiveness skills/tactic (AB Castle Style) | implemented | `ai/plan/coreGenerator/doctrine.ts:20-27` AB plan caps (OE floor 4 "stand around looking for an opening", KD cap 7) citing Raf/Assur/Trump/Manimal/Paradox; decisiveness tactic in `types/shared/fightPlan.ts` | resolved |
| S2 | Defensive AB parries/dodges early to exhaust the opponent, then attacks (Aimed Blows My Way) | missing | `ripostingHybrid` archetype exists (`warriorArchetypes.ts`) but no exhaust-then-strike plan curve/decoy template for AB in `ai/plan/` | DECISION-NEEDED |
| S3 | AB is an offensive style — not TP wait-out nor lunger overpower (AB guides) | implemented | `STYLE_ARCHETYPE_FIT[AB]` excludes `tankHybrid`/`pureDefensive` (`warriorArchetypes.ts:351`); AB OE floor + KD cap in `doctrine.ts` | resolved |
| S4 | Per-style OE/AL favorite-rhythm distributions (favorites charts) | implemented | `favorites/favorites.ts` `STYLE_RHYTHM_RANGES` + `FAVORITE_TACTIC_POOLS` (canon distributions, Arena 93 graduate data cited); `src/test/engine/favorites/favoriteTactic.canon.test.ts` | resolved |
| S5 | Tactic-suitability matrix BA/SL/LU/DE × PA/DO/RP/RS rated ws/s/u per style (Hoser #13) | implemented | `engine/strategy/tacticSuitability.ts`; `src/test/engine/combat/tacticSuitability.canon.test.ts` | resolved |
| S6 | Style-vs-style dominance from arena records — e.g. LUA>BA, PRP>LUA (Hoser #9, arena 25 data) | disputed | one arena's empirical records vs the tuned `MATCHUP_MATRIX` (`constants/combat/combat/matchup.ts:66-77`) — house matrix is a balance tool; prior adjudication holds TP dominance canon-accurate (BACKLOG §3) | DECISION-NEEDED (retune vs keep) |
| S7 | Kill meta: KD 10, vitals targeting, SZ 3 / WT 21 / WL 21 chassis, unusual killing weapons (Battle Axe) (Bloodgames) | missing | canon targeting + `mechanics/` kill window exist, but no kill-focused doctrine (AI KD caps ≤ 7-8; `doctrine.ts`) and no SZ-3 kill chassis archetype | evidence fold → V24-D5 |

## M — Meta systems

| ID | Claim (article) | Verdict | Evidence | Status |
| --- | --- | --- | --- | --- |
| M1 | Challenge resolution ordering: DA warriors → bloodfeuds → tournament-victor challenges → normal challenges (first, then second) → random (MAKING YOUR CHALLENGES GO THROUGH + Hoser #9) | missing | bloodfeud entitlement + priority exists (`engine/matchmaking/bloodfeud.ts`, `promoters/offerMatchmaking.ts:183`); `CHALLENGE_BONUS×N` multiplicity (`:231-237`); strict ordering + TV leg unbuilt — BACKLOG V24-F1/F4 | DECISION-NEEDED (blocked on F4) |
| M2 | Bloodgames: 10 rounds, no replacements, top-3-of-different-styles get ADM graduation + immortality, kills-primary ranking, ~5× death rate, unique kill text (Bloodgames) | missing | no engine surface — BACKLOG V24-D5 standing deferral | evidence fold → V24-D5 |
| M3 | Knack / "luck factor" surface — scout rumors revealing hidden bonused/hosed skills (Hoser Report luck factor) | missing | `luckfactor`/`bloodlust` hidden (`types/warrior.types.ts:190-196`); no luck/knack surface in `advisor/intelAdvisor.ts`, `stableCouncil/directives.ts`, or scout reports — BACKLOG V27-§5 "revisit on explicit canon push" | DECISION-NEEDED |
| M4 | Skill-rank ladder E/AE/M/AM/GM/ARCH at 16/20/26/34/44/56 (skill chart) | diverged | `data/skillTiers.ts` implements through Advanced Master (34) per Consortium Q&A citation; Grandmaster (44)/Archmaster (56) absent — the Q&A canon only attests to AM; GM/ARCH is archive lore | DECISION-NEEDED (extend vs keep Q&A canon) |
| M5 | Selective training: stat raises burn learn slots (crossing breakpoints); CN trains grant no skills (Arena 93 canon) | implemented | `engine/learning/skillBurn.ts` ("trains-burn-skills economy… ST 7–14 / CN freedom falls out"); `src/test/engine/learning/learnCapAndBurn.canon.test.ts` | resolved |
| M6 | ADM graduation tier — separate advancement with 3–25 caps (Hoser Report) | missing | `ATTRIBUTE_MAX` = 25 throughout (`types/shared/attributes.ts:40`), no tier — BACKLOG V22-D4 own campaign | evidence fold → V22-D4 |
| M7 | Unique kill narration ("pierced completely through"/"skewered") as Bloodgames flavor (Bloodgames) | missing | kill-narrative spec exists but no Bloodgames-exclusive pool — V24-D5 coupled | evidence fold → V24-D5 |

## Coverage note

Rows cover every claim surviving in the archive's recoverable text plus the
formulas/thresholds the plan already carried. Claims that exist only as article
titles in the truncated table-of-contents (e.g. "Tank Lunger", "Mojo's Parry
Riposte") contribute their *known* canon claims where they overlap rows above;
new mechanics hidden in unrecoverable article bodies are out of the register's
reach — a limitation recorded in FINDINGS §1.
