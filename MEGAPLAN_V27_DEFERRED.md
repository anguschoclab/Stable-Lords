# MEGAPLAN V27 — Deferred scope

Items designed in `.devin/plans/megaplan-v27-tourney-classes.md` that shipped
partially or were consciously deferred at close-out. Every deferred item has
since landed — the file remains as the record of what shipped when.

## Phase 6 — Player entry surfaces

- ~~**Warrior dossier depth**~~: done — the Entry Desk row now carries a
  dossier line per warrior: winning-archetype fit (`classifyArchetype` best
  frame + score) and the favorite-weapon scout state (`Fav <name>` when
  discovered, `Chart → <name>?` on a chart suspect, `Fav uncharted`
  otherwise) via `suspectedFavoriteWeapon`.

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
- ~~**Player stablemate hunts**~~: done — `fileStablemateHunt` mirrors the AI
  lane's rule (the avenger must be an unbooked bracket finisher whose
  stablemate the killer felled, by frozen bracket stableIds) via the
  `sendStablemateHunt` slice action. Completed brackets surface hunt rows
  whenever a player victim is already booked but the killer isn't — one
  button per eligible stablemate.

## Phase 11 — Close-out

- ~~**Chromium E2E smoke**~~: done — `bun run e2e` chromium 7/7 passed.
- ~~**World-liveness re-baseline**~~: done — livingWorld re-seeded 99→777,
  competence gradient re-seeded 42→88 (24-seed probe, honest denominators);
  both verified in-spec under vitest/V8.
