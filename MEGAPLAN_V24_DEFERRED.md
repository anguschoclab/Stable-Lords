<!-- markdownlint-disable MD001 MD024 MD025 MD033 MD060 -->

# MEGAPLAN V24 DEFERRED — Noblish Island Canon Integration

Work deliberately deferred out of V24. Each item is registered here because
it is a design decision or an out-of-scope surface, not an unfinished fix.
Findings: `MEGAPLAN_V24_FINDINGS.md` · Plan: `MEGAPLAN_V24_PLAN.md` ·
Ledger: `MEGAPLAN_V24_LEDGER.md` · Restore tag: `pre-megaplan-v24`.

## D1 — Style-conditioned luckfactor pools (Drake's WS note)

- **Canon:** "Wastes are bonused only in Attack and Parry" — style-scoped
  positive-luck pools (`STYLE_POSITIVE_LUCK_POOLS`) with negatives still
  free to land anywhere ("hosed stays canon").
- **Why deferred:** `rollLuckfactor`'s uniform six-draw shape is marked
  **user-locked** in source (V23 knack-parity decision). Style-conditioning
  the pools re-opens a locked call — needs an explicit user decision, not
  a megaplan default.
- **Entry points:** `src/engine/warrior/luckfactor.ts` (rollLuckfactor),
  `src/constants/combat/`.

## D2 — Dagger favored-style narrowing to {ST, AB}

- **Canon (Jalopy):** the dagger is "only fully suited to the striker or
  aimed-blow styles" — stricter than the current suitability row.
- **Why deferred:** the weapon-suitability table is canon-locked under the
  combat-balance skill; narrowing it re-tunes every dagger matchup, not a
  spec-able flag. The reconciled armor model (DA ×0.7 vs mid armor, ×1.0
  plate tier) already carries most of the canon intent.
- **Entry points:** `src/data/equipment/weapons/items.ts` (suitability
  ratings), weaponIdCoverage specs.

## D3 — Learn-cap canon literals (20 skills per area)

- **Canon:** "about 20 skills in each area before learning stops."
- **Why deferred:** the engine's learn ladder is deliberately compressed
  (`LEARN_PER_SKILL_CAP = 6`, `LEARN_CAREER_CAP = 24`) — a 20-per-area
  literal would be ~6× the engine's economy. V24 locked the *semantics*
  instead (`effectiveLearnCap = cap − burnedSkills`), which is what the
  canon mechanism actually claims. Widening the ladder is an economy
  decision for a dedicated pass.
- **Entry points:** `src/engine/learning/learnRoll.ts`,
  `src/test/engine/learning/learnCapAndBurn.canon.test.ts`.

## D4 — Rhythm-bonus always-on

- **Canon:** a warrior fights better at their favorite rhythm whether or
  not the manager has discovered it (favorite-weapon/tactic parity).
- **Status:** V24 applied hidden-bonus parity to the favorite *weapon* and
  favorite *tactic*; the rhythm gate was kept as a documented house
  divergence. **V25 has since claimed it** — `rhythmAlwaysOn.test.ts`
  (V25 Phase-7.1 spec) asserts the always-on reading; that megaplan owns
  the change now.

## D5 — Out-of-scope game modes

- Bloodgames tournaments, Primus/ADM-tier play, PP (programmer prize)
  systems — referenced by the articles but outside Stable Lords' current
  mode set. No engine surface exists to pin them to; revisit if those
  modes ever land.
