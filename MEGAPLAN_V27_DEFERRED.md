# MEGAPLAN V27 — Deferred scope

Items designed in `.devin/plans/megaplan-v27-tourney-classes.md` that shipped
partially or were consciously deferred at close-out.

## Phase 6 — Player entry surfaces
- **Warrior dossier depth**: the advisor surfaces `classId`/`fe`/`breakpointGap`
  and the Entry Desk shows frozen FE + breakpoint edge per warrior. A richer
  per-warrior dossier (favorite-weapon scouting, style-vs-class fit readout)
  remains future work.

## Phase 7 — AI metagame
- **`classifyArchetype`-driven draft bias**: implemented as a WT-threshold
  bonus (21+/17+) for TOURNAMENT_CAMPAIGN stables. The plan's finer-grained
  archetype weight (scum/AB Rookies vs WT-weighted upper classes via
  `classifyArchetype`) can land when the tourney axis is consumed elsewhere.

## Phase 8 — Bracket UX
- **"Advance all brackets" CTA label**: the CTA resolves every unfinished
  bracket (engine behavior is correct); the button copy still says the
  singular form.

## Phase 10 — Grudge matches
- **Player "Call out" UX**: grudge offers auto-file on bracket completion and
  flow through the standard acceptance lane. The plan's per-row call-out
  button on completed class brackets is not yet a UI element.
- **Stablemate-killer hunts**: AI grudge lanes cover the loser-vs-killer
  rematch; hunting the warrior who killed a stablemate is deferred.
- **Advisor breakpoint warning**: a grudge bout that would push a warrior over
  next cycle's breakpoint is not yet flagged in advice text.

## Phase 11 — Close-out
- **Chromium E2E smoke** (entry desk, class tabs, grudge call-out): not run in
  this pass; the engine paths are spec-covered.
- **World-liveness re-baseline**: `test:slow` battery results pending at
  close-out; seeded streams intentionally shifted (Phases 3/5/8/10 — see
  LEDGER).
