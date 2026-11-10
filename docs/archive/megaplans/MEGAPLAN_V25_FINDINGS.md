<!-- markdownlint-disable MD001 MD024 MD025 MD033 MD060 -->
# MEGAPLAN V25 FINDINGS — Winning Warrior Types Canon Adjudication

Every claim from the supplied Arena-93 article batch (Assur's "Winning
Warrior Types", "Pure Offensives", "Pure Defensives", "Tank Hybrids",
"Tank Hybrids Addendum", "High Skill Hybrids", "Riposting Hybrids",
"What the Style") re-verified against the code. Verdicts: **APPROVED** /
**CORRECTED** / **DISPROVED** / **IMPLEMENTED** / **CONTRADICTS → harmonise**.

## Batch A — Cross-cutting doctrine (Winning Warrior Types)

| Claim | Verdict | Evidence |
|---|---|---|
| Three ways to win: Offensives / Defensives / Hybrids | **APPROVED → data** | No archetype taxonomy exists — `StyleFamily` (offensive/defensive/mixed) is a *style* axis, `statGeneration.Archetype` is a name/trait flavor axis. New `WinningArchetype` + `STYLE_ARCHETYPE_FIT` module. |
| Offensives need ≥Good damage (~20 ST+SZ), WT key, WL primary endurance, DF 11 perfect/7 ok, SP even | **IMPLEMENTED (mostly)** | `designReview.ts` physicals axes + `DESIGN_REVIEW_THRESHOLDS` cover DF-11, WL dead-zone, Boyd damage-sum. Gap: no *archetype-level* classification → Phase 3. |
| Defensives: ST/CN/WL key, heavy armor, SP useless, SZ small, DF 11 perfect | **IMPLEMENTED (mostly)** | TP scum frame note (`designReview.ts:213`), STYLE_DESIGN_MINIMUMS TP row {WT11,WL15}. Archetype-level guidance → Phase 3. |
| Hybrids: moderate CN, ST 9-11, WT wanted, WL style-dependent, SP unnecessary, DF ≥11 | **APPROVED → data** | `designBars` per archetype + Design Review notes (Phase 3). |
| ST/WL never <7 (AB low-ST exception; WL<7 only for PS/AB/TP/PR) | **IMPLEMENTED** | `DA_ST_FLOOR`/`DA_WL_FLOOR` = 7 (`designDoctrine.ts:230`); recruit gen floors them (`recruitGenerator.ts:104`). Endurance-conserving list {PS,AB,TP,PR} = four lowest `*_ENDURANCE_MULT` ✓. |
| DF 11 magical | **IMPLEMENTED** | DF<11 review note + breakpoint tables. |
| Speed least important for hybrids/defensives | **APPROVED → data** | Encoded as `designBars` (SP ≤ guidance) + review note. |
| Size best on offensives; big hybrids squeezed | **APPROVED → data** | 'Big hybrid' review note (Phase 3). |

## Batch B — Pure Offensives / Pure Defensives guides

| Claim | Verdict | Evidence |
|---|---|---|
| ST best pure offensive; BA next (worse weapons, less conservation); SL third; PS viable | **APPROVED → data + presets** | `STYLE_ARCHETYPE_FIT` membership; `canonTargeting` biases corroborate. Presets exist (Assur's Opener etc.). |
| Speed vs damage weapon split (SS/DA speed; BA/SC/BS damage; LO all-purpose) | **CORRECTED — articles omit SZ** | `items.ts` reqs verified: SS 9/3SZ/5/7, DA 3/3SZ/7/7(V24 WT7), QS 11/9SZ/11/11, WH 13/5/7, BA 15/3SZ/7/9(+SZ9 offhand, V24), SC 9/11/11, BS 11/9/7, LO 11/13/11, HL 17/9/9/11, GS 15/9/9/11, MAUL 15/9SZ/5/7, GA 13/9/11. Article fragments silently drop SZ — spec asserts `items.ts`, not fragments. |
| Run hot 10-10; vs pure defensives AL 1 | **IMPLEMENTED (partially)** | `getStyleMatchupMods`: ST-vs-TP {oe−1,al−1}, LU-vs-TP/PR {oe−2}. Magnitudes ≠ literal "AL 1" — Phase-7.2 audits whether AI still lands hot vs scum. |
| No armor → death risk; ALE minimum | **IMPLEMENTED** | `deathRolls.ts` `NO_ARMOR_ADD` binary cliff. |
| Response tactic counters decise; tactics cut both ways | **IMPLEMENTED** | `tacticCounter.ts` + `tacticSuitability` U-entries (V24 U-drain landed). |
| Pure defensive: TP king (PAR base, endurance conservation); PS next (best conservation + small shield); PR fine; PL high-burn; WS highest potential parry, heavy weapons | **APPROVED → data** | `WINNING_ARCHETYPES.pureDefensive.recommendedStyles` + caution notes; matches `STYLE_PENALTIES` ordering identity. |
| Scum 1-1 Parry, big shields, APA/F | **IMPLEMENTED (V24)** | 'Scum Wall' preset landed in V24 Phase 6; shield reqs in `items.ts`/`shields.ts`. |
| Dodge defensives: LU king in basic (highest DEF base, learns DEF), AB second; high AL, low OE; don't overencumber | **IMPLEMENTED (partially)** | LU learns DEF/DEF-base is canon; 'Dodge Wall' PL preset (V24). AB dodge-defensive = emerging property of AB model — documented in archetype notes. |
| AB pure-defensive knowledge gap acknowledged by Assur | **APPROVED → notes** | `archetype.notes` carries the caveat verbatim-ish. |

## Batch C — Tank Hybrids + Addendum

| Claim | Verdict | Evidence |
|---|---|---|
| Tanks: encumbrance+HP first, skills afterthought; ST/CN ≥14 (84-pt) often more; ATT > PAR > DEF most useful | **APPROVED → data** | `designBars` scaled to 70-pt (ST/CN ≥12); ordering in `designBars.keySkills`. |
| Any style tanks; higher-attack styles better; LU highest ATT; AB@21DF just under; 4-way tie PL/WS/BA/SL; TP worst | **APPROVED → data** | `STYLE_ARCHETYPE_FIT` tank membership + notes; consistent with `STYLE_PENALTIES` ATT ordering. |
| Tank weapons: Maul, BS, BA, LS (low reqs) | **CORRECTED** | Req rows verified in `items.ts` (SZ silently dropped in article). |
| Tanks run OE 5+, AL anything | **APPROVED → AI doctrine** | Phase-6 `applyStyleDoctrine` tank floor OE≥5. |
| APA/F norm | **CORRECTED — style-restricted** | `plate_armor` restricted {AB,LU,SL}; `plate_mail` restricted {AB,LU}. Armor guidance filters `restrictedStyles`. |
| Addendum low-will tank: ST 15+, CN 13+, SZ ≤7 (84-pt), WT 11-21, WL only "enough", SP+DF+WT → 5+ RIP base | **APPROVED → data (heuristic caveats)** | `lowWillTankHybrid.designBars` scaled; "5+ RIP base" is a player heuristic (chart-verified `SP_RIP`/`DF_RIP`/`WT_RIP` already canon) — implemented as an advisory `minRipBase` scoring term via `computeBaseSkills`, never as a hard gate. |
| Addendum styles: AB + WS proven; PR others' success; LU should work; PL "should" | **APPROVED → FIT map** | As listed. |
| PS "bad starting skills, bad learning — might fail" | **APPROVED → notes** | Caution note, not exclusion (PS stays in tank fit, consistent with Assur's "best tanking style of the lower attack styles"). |
| Example spreads (10 builds, all sum 84) | **APPROVED → concepts** | Order = `ATTRIBUTE_KEYS`; `concept()` scales; PR failure `21-9-14-17-8-4-11` excluded. |

## Batch D — High-Skill / Riposting Hybrids

| Claim | Verdict | Evidence |
|---|---|---|
| High-skill: WT 17/21 (≥11 floor), DF ≥11, WL 7-9 ok for conserving styles; LU/WS/PL/AB | **APPROVED → data** | `designBars`; CONSENTING styles per burn mults. |
| "Don't over-encumber your hybrid" | **IMPLEMENTED** | Encumbrance tiers + endurance channel; review surfaces tier. |
| Riposting hybrids: encumbrance bars APL 9 / ASM 11 / APA 14 (Str/Con each); HP prized; ST 9+, DF 11+, SP 3-9, WL 7-21 | **APPROVED → data** | Carry bars map to house armor ids (padded/leather→scale_mail→plate_armor); `designBars` capture. |
| SP 13 big riposte breakpoint; 10-12 bad starting place | **CORRECTED — heuristic, not chart** | `SP_RIP` canon table (V22): +1@13, +2@11, +1@5,7,9,15,17. Advisory 'Riposte dead band' note only — no table edit. |
| PR king of riposting hybrids; AB natural learner; LU king of all hybrids; TP similar to PR; WS/PL can fake it | **APPROVED → FIT map** | As listed; matches `styleRiposteBonus` mechanics (PR counter-on-parry, PL momentum rip). |
| No shields on riposting hybrids | **APPROVED → notes** | Advisory only (tank profile already prefers 1H). |
| Riposte tactic fakes riposte; hardest to riposte: SL/LU | **IMPLEMENTED (tactic exists)** | 'Riposte' DefensiveTactic, WS for LU/TP/PR/AB/WS/PS, S for PL. Assur's "hard to riposte" means *defending against* SL/LU — different axis. |
| Favorite-rhythm bands (PR 5-6AL/3-4OE … WOS 3-4AL/5-6OE) | **IMPLEMENTED — harmonised** | `STYLE_RHYTHM_RANGES` brackets each band; PL wider per Tripwire canon. |
| Riposte fires after parry AND dodge | **IMPLEMENTED** | `defense.ts:78` + `:252` — both windows check riposte. |

## Batch E — What the Style (style tiers / weaknesses)

| Claim | Verdict | Evidence |
|---|---|---|
| ST premiere pure offensive; can't be bonused in ATT; top tourney style | **APPROVED → compendium/archives** | STYLE_COMPENDIUM + `STYLE_POSITIVE_LUCK_POOLS` (V24 WS ⊆ {ATT,PAR} mechanic — no-bonus rule per style). |
| TP ultimate defensive; worst ATT; can't be bonused in PAR | **APPROVED → compendium** | Same. |
| BA "poor man's striker"; worst weapon selection (no big-four) | **APPROVED → compendium note** | Light enrichment Phase 5. |
| LU ultimate hybrid; highest ATT+DEF; highest burn; once dominant post-grad | **APPROVED → compendium note** | Matches burn order + FIT map. |
| WS tied-highest skills; SC/BA/BS suited; bonus only ATT/PAR | **APPROVED** | `STYLE_POSITIVE_LUCK_POOLS` covers the bonus-shape claim. |
| SL hardest pure offensive; no decise learn | **APPROVED → compendium note** | Learn priorities data. |
| PS most flexible; conserves best; shunned by tourney managers | **APPROVED → notes** | Burn mult 0.93 lowest but TP 0.9 — Assur's "perhaps better than any" ≈ correct; note phrases it as canon. |
| AB big-three tourney; can't be bonused in DEC; FI bonus post-grad | **APPROVED (partial)** | FI→DEF bonus exists? — verify in Phase-7 residue; bonus-shape via luck pools. |
| PR great hybrid, ok defensive; low skills; 2nd-tier tourney | **APPROVED → notes** | |
| PL strong skills; "poor man's lunger"; basic difficulties | **APPROVED → notes** | |

## Batch F — Engine-truth divergences found during audit

| Finding | Disposition |
|---|---|
| `getFavoriteRhythmBonus` still gates on `fav.discovered.rhythm` (`favorites.ts:300`) — header claims always-on; V22 Phase-4.8 never landed | **Phase-7.1 fix** — remove gate (weapon/tactic already always-on; Assur canon agrees) |
| AI rivals never upgrade armor — `EquipmentPass` only swaps favorite weapons; creation default `leather`+`leather_cap` for everyone | **Phase-6 fix** — archetype-aware armor fitting; HIGH balance impact; own spec + world re-baseline |
| `getStyleMatchupMods` vs-scum throttle is directional but small (−1/−2) | **Phase-7.2 audit** — measure generated plans vs TP opponents; only then strengthen |
| `STYLE_ARCHETYPE` (name/trait flavor) vs new `WinningArchetype` collision | **Document, no rename** — comments at both sites |
| Articles' req lists omit SZ everywhere | Specs assert `items.ts`, not fragments |
| fileBudget: fighterConcepts ~950 < 1300 data ceiling; designReview 808 grows — >800 counter may need rebaseline | Track in Phase 8 |
| Duplication guard: new literal-pin specs must register `MIXED_EXEMPT_PAIRS` + `MIXED_BASELINE` bump | Phase 1 + Phase 8 |
