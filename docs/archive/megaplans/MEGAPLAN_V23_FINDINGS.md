# MEGAPLAN V23 — Arena 93 Game Concepts Integration — FINDINGS

Claim-by-claim adjudication of twelve Noblish Island articles (compilation:
"Duel2 - Arena 93 Newsletters / A compilation of Noblish Island Articles")
against the Stable Lords codebase. Every claim was re-verified by reading the
code before adjudication; the validation pass folded corrections directly into
this register and the plan.

Articles: Warrior Handedness (Pagan), Handedness notes (Sir Jessie Jest),
Effects of Coordination (SJJ), Knack, Getting the Jump (Pagan), Parry and Carry
(Assur), and seven design-doctrine articles (per-style minimums, burner
designs, "Learns Naturally" table, Drake's rollup-first method, ~15 canon
builds, style-mix guidance).

Plus V22 deferred pull-ins: **D1** dual-wield/off-hand, **D2** trains-burn-skills.

Legend: IMPLEMENTED | PARTIAL | MISSING | CONTRADICTED | ADJUDICATED-HOUSE |
ADJUDICATED-KEEP | CANON-CONFLICT | KEEP-V23

---

## A — Handedness (Pagan's "Warrior Handedness" + SJJ's handedness notes)

| # | Claim | Verdict | V23 action |
|---|-------|---------|------------|
| A1 | Arm hit drops the weapon in THAT hand; ambi weapon-side chosen lazily only when needed | MISSING — `disarm.ts` drops the single held weapon from either arm | Weapon-side gating (righty only drops on right-arm hit, etc.) + lazy ambi side-pick; full expression under D1 |
| A2 | Style-conditioned handedness; defensive styles produce more lefties/ambis (PR ~43% ambi) | MISSING — `rollHandedness` flat 85/7.5/7.5 | `rollHandedness(rng, style?)` conditioned table preserving the variable 1–2-draw shape |
| A3 | Ambis USE left hand more but carry primary in RIGHT; rare "reversed" ambi | MISSING | `ambi-reversed` variant (conditional 3rd draw only when result is ambidextrous); intro + off-hand use-weighting under D1 |
| A4 | Ambi +1 ATT | IMPLEMENTED (V22) | keep |

**Validation note:** `rollHandedness` consumes a variable 1–2 draws (early
return on 'right'). `makeWarrior` rolls it BEFORE favorites/traits/trainability
— the conditional ambi draw preserves count for non-ambi warriors only.
Creation-site order documented: warriorFactory:48, generate.ts:126/184,
freeAgents:26, orphanPool:79, recruitGenerator:171 — all have `style` in scope.

## B — Coordination (SJJ "Effects of Coordination")

| # | Claim | Verdict | V23 action |
|---|-------|---------|------------|
| B1 | Clumsy = SP+DF ≤ 16 | PARTIAL — `computeCoordination` boundary bug (`>=16` returns Slightly) | `total <= 16 → Clumsy` |
| B2 | Clumsy fighters drop weapons more | MISSING | `COORD_DISARM_MOD` per-tier into `rollDisarmChance` |
| B3 | Clumsy fighters fumble the backup draw | MISSING — backup auto-equips | `QUICKDRAW` roll at draw time; fail → FUMBLE event, retry next exchange |
| B4 | Clumsy slower to rise from knockdown | MISSING — `knockedDown` auto-clears in `exchangePrep.ts` | rise roll vs `COORD_RISE_CHANCE` at the existing clear site |
| B5 | (house) small KD-susceptibility term | KEEP-V23 (user-approved small speculative term) | `COORD_KD_SUSCEPT` into the knockdown roll, independently tunable |

## C — Getting the Jump (Pagan)

| # | Claim | Verdict | V23 action |
|---|-------|---------|------------|
| C1 | OE is the biggest controllable jump factor | MISSING — `sumInitiative` has INI, DEC×coeff, AL, weapon mod, tactics, etc. but no OE | `+ OE × JUMP_OE_COEFF` |
| C2 | Clash loop: re-resolve until a clear jump at bout open | MISSING — single `contestCheck` | first-exchange loop inside `resolveInitiativePhase`: re-roll until `|iniA−iniD| ≥ JUMP_DISPARITY` or `JUMP_CLASH_MAX`; emits CLASH events |
| C3 | Fight-string vs warrior-string model | IMPLEMENTED-equivalent | documented in FINDINGS only |

## D — Knack

| # | Claim | Verdict | V23 action |
|---|-------|---------|------------|
| D1 | Hidden luck factor incl. inverse | IMPLEMENTED — `luckfactor` + `bloodlust` | **change:** remove `PS_LUCKFACTOR_RANGE` (±6, ps.ts:10); all styles share `LUCKFACTOR_RANGE` (`balance.ts:19`) — single tunable constant |

## E — Parry and Carry (Assur)

| # | Claim | Verdict | V23 action |
|---|-------|---------|------------|
| E1 | Encumbrance has ~zero impact on parry/dodge | CONTRADICTED — `TIER_PENALTIES` penalizes PAR −1/−2 | `parPenalty → 0` on all tiers (constant-only; `FighterState.encumbrancePenalty.{ini,def,par}` is dead state — only `enduranceMult` is read per-exchange, verified `enduranceCosts.ts:58,72`); re-ratchet |
| E2 | Carry capacity `ST + min(ST,CN) − 6` | ADJUDICATED-KEEP (V22 C12 kept canonical A–F table) | none |
| E3 | No parry skills from ST 7→15 | chart-true — `ST_PAR` grants at 7 then 15 (`skillBreakpoints.ts:44-50`) | doc note only |

## F — Design doctrine (seven articles)

| # | Claim | Verdict | V23 action |
|---|-------|---------|------------|
| F1 | Per-style minimum-stat tables + hybrid table | PARTIAL — `designDoctrine`/`designReview` exist as surfaces | `STYLE_DESIGN_MINIMUMS` data + `minimums` review item |
| F2 | "Learns Naturally" orderings vs `STYLE_LEARN_PRIORITY` (Pagan) | CANON-CONFLICT — BA/SL/WS diverge | **Harmonize** (user-locked): both-agree top-2 keep position → article parenthetical fills 3rd → remainder keeps Pagan order. BA `ATT,DEC,INI`; SL `INI,ATT,DEC,RIP`; WS `ATT,PAR,INI` |
| F3 | Burner designs (dump-stats, short career) | MISSING | designReview info note; pairs with D2 |
| F4 | Drake rollup-first method + DA rejection rule (<7WL / <7ST) | MISSING — `generateRecruitAttrs` ticket-pool | designReview note + AI recruit reject/retry or floor-clamp |
| F5 | ~15 canon example builds | MISSING | `FIGHTER_CONCEPTS` entries — each ships `canonStats` (84-pt verbatim) + `stats` (scaled to 68–74 band) |
| F6 | Style-mix guidance | PARTIAL | doc note + light diversity weight in `pickRecruitStyle` |

## G — Deferred pull-ins

- **D1 dual-wield (PULLED IN):** `EquipmentLoadout.offhand?: string`;
  `validateLoadout` → `DUAL_WITH_SHIELD` (weapon / weapon+shield / two
  weapons only — user-locked); `WieldMode` already exists
  (`'off_hand'|'dual'` — call-site wiring only); VHC gate (SP+DF>31 AND
  either>14) → free off-hand shot once per offensive exchange
  (`OFFHAND_ATTACK` event); side-gated drops via hand map (righty
  right=primary, lefty mirrored, ambi lazy via `AMBI_PRIMARY_RIGHT_BIAS`,
  reversed flips); off-hand weight counts in `getLoadoutWeight` (backup
  stays uncounted — sheathed house rule); intro + UI.
- **D2 trains-burn (PULLED IN):** `burnedSkills` on `Warrior`; **generic
  breakpoint-delta rule** — each +1 gain burns `bp(table,new)−bp(table,old)`
  slots per skill (ST→15 burns; ST 7–14 and CN auto-free — no special
  casing); wired at `applyAttributeGain` and `applyXP`
  (`progression.ts:146-148`); effective learn cap =
  `LEARN_PER_SKILL_CAP − burnedSkills[skill]`; advisor copy teaches the
  trade.
- **D3** Pagan literal damage model — stays deferred.
- **D4** ADM/graduation tier — stays deferred (canon's eventual release
  valve for burnt skills; without it, burns are permanent).

## Validation corrections folded into the plan

1. Handedness draw shape is variable 1–2, not fixed-2 (draft corrected).
2. `FighterState.encumbrancePenalty.{ini,def,par}` is dead state — only
   `enduranceMult` read per-exchange (`enduranceCosts.ts:58,72`).
3. `FIGHTER_CONCEPTS` requires `canonStats`+`stats` pairs; article spreads
   (~84-pt) must be scaled into the 68–74 in-game band.
4. `WieldMode` already covers `'off_hand'|'dual'` — wiring, not new types.
5. `COMBAT_EVENT_TYPES` is a closed tuple (`enumSources.ts:300-322`) — new
   events need enum + schema + narrator + audio + pbp-lines plumbing.
6. Luckfactor spec lives at `src/test/engine/luckfactor.test.ts`.
7. `getLoadoutWeight` ignores `backup`; decision: count `offhand`, keep
   `backup` uncounted.
8. `WieldMode`/`checkWeaponRequirements` call sites currently never pass
   `wield:'dual'` — `dualWieldReqAmbi` is dormant until Phase 5 wiring.
