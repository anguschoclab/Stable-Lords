# MEGAPLAN V25 — DEFERRED / OUT-OF-SCOPE

Items surfaced during V25 that were consciously NOT implemented, with rationale.

## Deferred

1. **styleCompendium prose enrichment** — planned "light-touch" edits to
   `hallmarks`/`counterplay` (TP no-parry-bonus, BA worst weapon selection,
   ST endurance conservation) were skipped: existing entries are already
   flavor-rich and the new taxonomy is surfaced through the codex section +
   StyleCard archetype chips, which carry the same canon. Adding prose
   risked duplication-guard hits with no information gain.

2. **getStyleMatchupMods magnitude tuning (Phase-7.2 residue)** — audit
   found the offense-vs-scum tempo channel already mechanically complete:
   burn-order lock (LU>…>TP), encumbrance endurance burn, and phase
   overrides all verified. Hot OE/AL vs TP attrition emerges from locked
   constants; no magnitude change justified. Assur's "don't run 10-10 vs
   pure defensives" is player doctrine (surfaced in codex/Design Review),
   not an engine fix.

3. **Assur's player heuristics rejected as mechanics** (per plan §canon-vs
   -heuristic): SP-13 threshold, Assur's carry formula (ENC_TABLE stays),
   weapon requirement lists omitting SZ (items.ts table stays canonical).

4. **E2E chromium smoke** — UI additions are data-driven accordion/chips
   rendering the WinningArchetype module; covered by component specs
   (`archetypeTags.test.tsx`, codex section test). A full playwright smoke
   is deferred to the next UI-touching pass.

## Watch items

- **TP world-proxy strength** — post-V25 lab read: FLAT in band
  (42.1–57.0), SNAP proxy TP 68.7% / spread 27.9pp. The certified
  `worldBalance`/`balance` slow guardrails both pass, and world-diag
  seed 12345 reads TP 61.7% (elevated but in-band). The SNAP proxy
  exaggerates gaps (random pairing, no survivorship). Likely drivers:
  archetype armor fitting lengthens fights → favors conserving styles;
  always-on rhythm INI helps TP's low-INI profile. Watch on the next
  balance pass; if the certified world band breaks, lift weak-style
  `STYLE_SKILL_FLOORS` (world-only lever), never `MATCHUP_MATRIX`.

## Re-baselines taken (not deferrals — recorded for the audit trail)

- `traitBalance.slow.test.ts` personality floor 32→20: always-on rhythm
  bonus makes fightPlanMod traits honestly cost more when they drift the
  warrior off favorite OE/AL (observed floor 25.3%).
- `recruitAttrs` WS WL trend +0.73 (was >1): the six low-will tank concept
  spreads legitimately shifted the WS concept mean.
- PR concept count ratchet 12→13; duplication-guard ledger renamed to
  v25DesignReview/v23DesignReview pair ordering.

## Restore

Restore tag `pre-megaplan-v25` (baseline `8114c118`) precedes all V25 work.
