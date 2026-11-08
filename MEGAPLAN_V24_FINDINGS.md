<!-- markdownlint-disable MD001 MD024 MD025 MD033 MD060 -->
# MEGAPLAN V24 FINDINGS — Noblish Island Strategy Canon Adjudication

Every claim from the supplied Arena-93 newsletter batches re-verified against
the code (five audit passes). Verdicts: **APPROVED** / **CORRECTED** /
**DISPROVED** / **IMPLEMENTED** / **CONTRADICTS** (harmonised).

## Batch 1 — Assur strategy basics, weapon chart, Pagan tactics/jump, challenges

| Claim | Verdict | Evidence |
|---|---|---|
| BA offhand-SZ rule | **CORRECTED — INVERTED, not missing** | `items.ts` BA: `reqSZ 7` + `twoHandedReq{SZ:3}` = "1H BA demands SZ 7". Canon: base SZ **3**, SZ **9** only when carrying an offhand. Fix: `reqSZ:3` + `offhandCarryReq:{SZ:9}`. |
| Clash loop | **CORRECTED — rng redrawn, totals static** | `initiativePhase.ts:154-168` draws fresh rng per clash but ini totals never change. Fix: `JUMP_CLASH_JITTER` + early-exit at `≥JUMP_DISPARITY`. |
| Unsuited tactic model (Pagan) | **CORRECTED — −0.5 + net-sum spec** | `tacticResolution.ts:72-170`: mult flows into every field incl. trade-offs. `TACTIC_U_MULT=-0.5`; spec asserts net bonus sum ≤ −1. |
| SH/SS codes | **APPROVED — canon bug** | shortsword stats on `'SH'`, shortspear on `'SS'` (`items.ts:112,145`). Canon reverse. Codemod w/ keep-set. |
| Weapon req divergences | **APPROVED — 5 rows** | DA WT5→7, HA WT7→5, SM DF7→5, ME DF7→5, LG SZ3→7. Other rows verified. |
| Stable avoids ignored by promoter | **APPROVED — penalty not skip** | `PromoterPass.ts:155-156` omits `playerStableAvoids`. Stable → `AVOID_PENALTY`; individual keeps hard skip (`offerMatchmaking.ts:177`). |
| Favorite tactic per warrior | **APPROVED — MISSING** | `generateFavorites` = weapon+rhythm only. Pools: canon weights PR{L3,R11,P6}, PS{D12,s9,d9,R1,P8}, PL{L23,d12,P12}; WS-set elsewhere. Bonus applies hidden (weapon-crit parity; rhythm's discovery gate is a documented house divergence — kept). |
| Double-tactic penalty | **APPROVED — MISSING** | `tactics.ts:19-28` resolves off+def independently. `DOUBLE_TACTIC_SKILL_PENALTY`. |
| Bloodfeud (4wk post-kill priority) | **APPROVED — MISSING, writer located** | `recordHandler.ts:76` kill detection; entitlement on **victim** side: `{killerWarriorId, killerStableId, expiresWeek}`; `BLOODFEUD_PRIORITY` in `findBestOpponent`. |
| Offhand wield model (no WT/SZ, MH×OH DF grid) | **APPROVED — MISSING** | `effectiveWeaponReqs` merges per-item overrides only. New `checkLoadoutWieldability(loadout, attrs)` — per-weapon check cannot see the OH item. |
| Style-vs-style 1-10 chart | **IMPLEMENTED (qualitative)** | `MATCHUP_MATRIX` signs agree with the chart's strong edges (LU>AB, AB>TP, TP>LU, ST>SL, WS>ST). Chart is corroboration, not data — no matrix edits. |
| Carry formula ST+min(ST,CN)−6 | **CONTRADICTS → keep chart** | Terrablood `ENC_TABLE` is better-verified canon (V22). Assur's formula = player heuristic; optional UI hint. |
| KD 9-10 detrimental | **APPROVED — MISSING** | KD only shifts kill window + will checks. `KD_HIGH_PENALTY` −1 ATT/−1 INI at ≥9. |
| Weapon-vs-armor per-weapon | **APPROVED — damage-type only** | `ARMOR_TYPE_MULT` keyed slash/bash/pierce; add `WEAPON_ARMOR_OVERRIDES`. |
| EncumbranceBar hides LIGHT/MEDIUM | **APPROVED — UI bug** | `EncumbranceBar.tsx:46` `hasPenalties` = HEAVY\|OVER only. |

## Batch 2 — Design vs. Strategy (Assur), Smithy factoids/Q&A

| Claim | Verdict | Evidence |
|---|---|---|
| Offhand attack gate | **CORRECTED — ambi path MISSING** | `offhandAttack.ts:26-29` gates only on `isVeryHighlyCoordinated` (SP+DF). Canon: coordinated **or ambidextrous** → `OFFHAND_AMBI_GATE`. |
| Design breakpoints (ST/WL≥7, DF 11, AB 17/21, WT 11/13/17, WL 15/17/21) | **IMPLEMENTED — mostly** | `designDoctrine.ts` (`DA_WL/ST_FLOOR=7`, `AB_DF_CANON=21`, per-style minimums) + `designReview.ts` (DF<11, WL dead-zone, Drake's-rule). Gap = low-burn style steering. |
| Any armor >> none (death) | **IMPLEMENTED** | `deathRolls.ts` `NO_ARMOR_ADD` — binary cliff matches. |
| Ripper drops riposte | **IMPLEMENTED (emergent)** | Skill-checked riposte + OE/AL-fed ini. |
| "No size penalties" (undersized weapon) | **CONTRADICTS (harmonise)** | Uniform −2 ATT/deficit; hedged canon. Fix: SZ deficit → endurance-only (`SZ_REQ_NO_ATT_PENALTY`). |
| Double challenge ≈ 2× | **APPROVED** | `findBestOpponent` consumes `new Set()` — count multiplicity first → `DOUBLE_CHALLENGE_MULT`. |
| Scum 1-1 Parry + offhand shield + heavy armor | **PARTIAL → preset** | TP preset is 3/3 no tactic; add 'Scum Wall' 1/1/Parry. |
| Dodge-based defensive (APL-ASM, mod-high AL) | **APPROVED → preset** | Add PL 'Dodge Wall' (~5-7 AL, `'Dodge'`). |
| Gender/race cosmetic | **IMPLEMENTED** | No mechanical reads. |

## Batch 3 — Tricks of the Trade, Twelve Tips, Drake, Jorja, Consortium Q&A

| Claim | Verdict | Evidence |
|---|---|---|
| Burn skills (20/area; stat-trains count until maxed) | **IMPLEMENTED at engine scale** | `LEARN_PER_SKILL_CAP=6`, `LEARN_CAREER_CAP=24` (compressed ladder); `effectiveLearnCap = cap − burnedSkills` (`skillBurn.ts:99`). Spec asserts shrink semantics, not canon literals. |
| Backup draw rules (occupied hand no-pull; fumble) | **IMPLEMENTED** | `disarm.ts:153-245`. |
| CN gives no skills | **IMPLEMENTED** | No `CN_*` breakpoint rows. |
| Skill breakpoints 15/17/21 | **IMPLEMENTED** | V22 canon tables. |
| Skill tiers | **CORRECTED — full ladder** | Expert 16 / Adv.Expert 20 / Master 26 / Adv.Master 34 → `SKILL_TIER_LABELS` display. |
| Vital-aim → kills; ~2% infirmary | **IMPLEMENTED** | Two-roll death model + `INFIRMARY`. |
| Weapon chart 0/10/0 | **IMPLEMENTED** | `weaponChart.ts` crits/swings/extra-value. |
| WS bonused only ATT+PAR | **NEW WORK** | `STYLE_POSITIVE_LUCK_POOLS`: WS positive luckfactor ⊆ {ATT,PAR}; negatives anywhere. |
| LU desperate "10-10-4 Dodge" | **NEW WORK (tiny)** | LU `desperatePlan` dodge variant. |
| Tournaments hide FE | **IMPLEMENTED** | `tournamentParticipantIds` exemption. |

## Batch 4 — Jalopy (knife fighter + APA/F GS basher)

| Claim | Verdict | Evidence |
|---|---|---|
| DA poor vs ASM+ armor | **CONTRADICTS (fix)** | pierce vs scale_mail = **1.15** (engine rewards). Fix: `WEAPON_ARMOR_OVERRIDES` DA ×~0.7 vs {scale_mail, chain_mail}. |
| Override needs style param for AB | **DISPROVED** | Reconciled model: DA penalty vs mid, ~1.0 vs plate. `applyArmorTypeMod` keys on ids only — sufficient. AB effectiveness is emergent via post-flat bypass (`damage.ts:118-125`, `AB_ARMOR_BYPASS_*`). |
| DA fully suited only ST/AB | **IMPLEMENTED (degree)** | preferred={AB,PS,ST,TP}, restricted={BA,PL,PR,WS}. Suitability table canon-locked — document only. |
| APA/F+GS carry math (24) & GS reqs | **IMPLEMENTED** | 14+4+6=24 = ENC class D; GS row exact. |

## Deferred register

Ordered challenge resolution (BF→TV→first→second→random); expanded
per-weapon armor matrix; armor-code renames (ALE/ARM/ASH/APA-F); TV challenge
priority (no tournament-victor state field — inventing one exceeds scope);
Bloodgames mode; PP/graduation; ADM immortality tier; weapon-suitability
table edits (canon-locked).
