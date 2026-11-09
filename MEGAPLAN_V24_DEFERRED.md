<!-- markdownlint-disable MD001 MD024 MD025 MD033 MD060 -->

# MEGAPLAN V24 DEFERRED — Noblish Island Canon Integration

Work deliberately deferred out of V24. Each item is registered here because
it is a design decision or an out-of-scope surface, not an unfinished fix.
Findings: `MEGAPLAN_V24_FINDINGS.md` · Plan: `MEGAPLAN_V24_PLAN.md` ·
Ledger: `MEGAPLAN_V24_LEDGER.md` · Restore tag: `pre-megaplan-v24`.

## D1 — Style-conditioned luckfactor pools (Drake's WS note) — ✅ LANDED

- **Canon:** "Wastes are bonused only in Attack and Parry" — style-scoped
  positive-luck pools (`STYLE_POSITIVE_LUCK_POOLS`) with negatives still
  free to land anywhere ("hosed stays canon").
- **Why originally deferred:** `rollLuckfactor`'s uniform shape was
  user-locked (V23 knack-parity decision). Post-close-out the user
  unlocked it.
- **Landed:** `STYLE_POSITIVE_LUCK_POOLS` in `constants/combat/combat/
  balance.ts` — only WS carries the canon-documented pool {ATT,PAR};
  off-pool positive draws clamp to 0 post-roll, negatives land anywhere,
  six draws consumed regardless (stream alignment pinned by spec).

## D2 — Dagger favored-style narrowing to {ST, AB} — ✅ LANDED (advisory)

- **Canon (Jalopy):** the dagger is "only fully suited to the striker or
  aimed-blow styles" — stricter than the current suitability row.
- **Landed:** the suitability table stays canon-locked; the canon intent
  surfaced advisory-side as a `dagger-style-fit` Design Review info item —
  emitted only when a DF<11 build on a non-ST/AB style is fenced into the
  light tier where the dagger is the best-fitting option.
- **Entry points:** `src/engine/warrior/designReview.ts` (reviewDoctrine).

## D3 — Learn-cap canon literals (20 skills per area) — ✅ LANDED

- **Canon:** "about 20 skills in each area before learning stops."
- **Landed:** `LEARN_PER_SKILL_CAP` 6→20, `LEARN_CAREER_CAP` 24→120 —
  canon bounds per-area learning, not careers; a lifetime learner can
  max every skill track. `effectiveLearnCap = cap − burns` semantics
  unchanged; spec asserts both literals.
- **Entry points:** `src/constants/combat/combat/learn.ts`.

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
