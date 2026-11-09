# MEGAPLAN V27 — Deferred scope

Items designed in `.devin/plans/megaplan-v27-tourney-classes.md` that shipped
partially or were consciously deferred at close-out.

## Phase 6 — Player entry surfaces

- **Warrior dossier depth**: the advisor surfaces `classId`/`fe`/`breakpointGap`
  and the Entry Desk shows frozen FE + breakpoint edge per warrior. A richer
  per-warrior dossier (favorite-weapon scouting, style-vs-class fit readout)
  remains future work.

## Phase 7 — AI metagame

- ~~**`classifyArchetype`-driven draft bias**~~: done — `tourneyDraftBonus`
  now scores the candidate's best winning-archetype fit (0–40), so scum/AB
  Rookies frames and WT-weighted upper-class frames both register.

## Phase 8 — Bracket UX

- ~~**"Advance all brackets" CTA label**~~: done — `ADVANCE BRACKETS`.

## Phase 10 — Grudge matches

- ~~**Player "Call out" UX**~~: done — completed class-bracket rows surface
  unbooked loser→killer pairs with a per-row Call out button
  (`fileGrudgeCallout` + `callOutGrudgeMatch` slice action). Auto-filing is
  now rival-losers-only: same rule, different chooser.
- ~~**Stablemate-killer hunts**~~: done — a second bracket pass hunts killers
  whose rival victim was already booked (deep-run killers), filed by the
  first unbooked same-stable finisher.
- ~~**Advisor breakpoint warning**~~: done — `grudgeWarning` fires when a
  pending grudge's +1 FE tips the next-freeze class breakpoint; rendered in
  the advisor council card.
- **Player stablemate hunts**: the manual call-out lane covers loser→killer
  only; letting the player send a stablemate after a killer is future work.

## Phase 11 — Close-out

- ~~**Chromium E2E smoke**~~: done — `bun run e2e` chromium 7/7 passed.
- ~~**World-liveness re-baseline**~~: done — livingWorld re-seeded 99→777,
  competence gradient re-seeded 42→88 (24-seed probe, honest denominators);
  both verified in-spec under vitest/V8.
