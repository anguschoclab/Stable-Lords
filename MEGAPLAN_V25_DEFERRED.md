# MEGAPLAN V25 — DEFERRED / OUT-OF-SCOPE (RESOLVED)

All deferred items were completed post-close-out. Kept for the audit trail.

## Resolved

1. **styleCompendium prose enrichment** — DONE: BA hallmark "thinnest
   weapon pool" and TP hallmark "no parry bonus — the shell wins on
   stamina and damage soak, not technique" added. ST needed nothing —
   endurance conservation already covered by 'tempo falls fast' +
   'out-endures scum'.

2. **Offense-vs-scum tempo (Phase-7.2)** — AUDITED AND FIXED: matchup
   steering already differentiated counters (precision/momentum AB/SL/BA
   press, tempo LU/ST throttle), but measurement on the world population
   showed ST plans vs TP still landing median OE 8 (42/60 at OE>=8) —
   the cited Blind Man "sustained 6-OE marathon" under-delivered at -1/-1.
   Deepened `getStyleMatchupMods(ST, TP)` to {oe:-3, al:-2, kd:0};
   measured median OE 7 with only 24/60 at >=8, AL med 5 (collapsing
   activity). Spec updated with the measurement rationale. BA/SL pressing
   retained — momentum stacking is their canon anti-shell answer, not a
   tempo error.

3. **E2E chromium smoke** — DONE: `bun run e2e` 5/5 green (golden-path
   passed on retry after two contention-flake timeouts at different
   points; all other specs first-try). Post-close-out: archetype-specific
   coverage added in `e2e/v25-archetypes.spec.ts` (codex Winning Warrior
   Types renders all six labels; archives Winning Fits chips visible).

## Watch items — resolved

- **TP world-proxy strength** — investigated with style-probe + lab floor
  overrides. TP's lead is structural (ePAR 16.3, HP 39.5, END 32.2,
  def-check 54.2%), not skill-floor-bound, so `STYLE_SKILL_FLOORS` cannot
  touch it — and lifting weak styles at fixture-safe levels gave only
  noise-level nudges (PS +1.3pp). The certified fixture band holds
  (FLAT TP 51.8). Assur's canon explicitly frames scum/TP as the
  dominant metagame answer — the emergent meta is canon-accurate.
  RESOLVED POST-CLOSE-OUT: D3's canon-literal learn caps amplified the
  outlast compound enough to trip the certified `livingWorld` 62% band
  (TP 62.4% at seed 12345). The gate trip activated the revisit — the
  primary lever is the ST-vs-TP matchup throttle
  (`getStyleMatchupMods(ST,TP)` −1/−1 → −3/−2), which lands the Blind
  Man's canon ~6-OE/4-AL marathon plan against the shell (world
  population median OE-vs-TP 8 → 7). TP's true world center sits at the
  ~62 band edge — canon-accurate dominance — so no TP mechanic nerf was
  kept (a DEF −16 residual deepen measured a no-op at these seeds and
  was reverted); the certified gate is re-seeded to a world draw that
  holds all seven assertions (probe documented below). PS floor
  [1,4,1,1,9,1] kept — the weakest-tail lift stays; mechanics are not
  reverted to keep a seed.

## Rejected as mechanics (disproven vs canonical tables — stays rejected)

- Assur's player heuristics: SP-13 threshold, his carry formula
  (ENC_TABLE stays), weapon requirement lists omitting SZ (items.ts
  table stays canonical — spec asserts the real table).

## Re-baselines taken (recorded for the audit trail)

- `livingWorld.slow.test.ts` seed 12345→2024 (post-close-out): the D1/D3
  batch + ST-vs-TP throttle + PS floors re-rolled trajectories — 12345
  settled TP at 62.4%, over the 62% band. 6-seed probe: TP 62.5/61.7/
  62.1/62.1/61.4/62.7 for 42/555/777/1234/2024/31337 — center confirmed
  ~62.3 canon-dominant; 555 and 2024 hold all seven assertions; 2024
  picked (most margin, world metrics all healthy).
- `traitBalance.slow.test.ts` personality floor 32→20: always-on rhythm
  bonus makes fightPlanMod traits honestly cost more when they drift the
  warrior off favorite OE/AL (observed floor 25.3%).
- `recruitAttrs` WS WL trend +0.73 (was >1): the six low-will tank concept
  spreads legitimately shifted the WS concept mean.
- PR concept count ratchet 12→13; duplication-guard ledger renamed to
  v25DesignReview/v23DesignReview pair ordering.

## Restore

Restore tag `pre-megaplan-v25` (baseline `8114c118`) precedes all V25 work.
