# MEGAPLAN V17 FINDINGS — Validated Audit of 10 open PRs + PR-touched domains

## Approved (verified in code)

- **A1 — `signWarrior` unified funnel approved.** Every roster addition
  (pool draft, generated fallback, clearance wire, poach settlement) passes
  capacity → funds → dead-identity → conversion in one place
  (`src/engine/recruitment/signWarrior.ts:180`). No parallel sign path exists.
- **A2 — Trait registry drift-guard works.** `LEGACY_TRAIT_ORDER` must equal
  merged registry keys at runtime; all four lore/trait PRs updated it
  correctly and the curated union kept parity (count 165→175).
- **A3 — #1058 hitExecution assertions are honest.** AimedBlow armor bypass,
  hit-location index shift, trainer/crowd kill-window multipliers, and
  MID/LATE kill thresholds all match production
  (`resolution/exchangeHelpers/execution/hitExecution/damage.ts:61-63`).
- **A4 — #1062 optimization is real.** `useShallow` primitive-ID projections
  re-render only on roster id-set change, not array identity. Applied to
  `WeeklyDigestWidget.tsx` + `useRivalryAlerts.ts`; stray bot `plan.md`
  rejected.
- **A5 — All 12 curated arena-lore `arenaId`s are valid** (incl.
  `the_crystal_spire`, a real `late.ts` venue distinct from
  `crystal_cavern`); all `type: 'hazard'` tags are schema-legal
  `ArenaLoreEntry` values; all 10 traits' effect fields (`OE`/`AL`/
  `killDesire`) are legal `FightPlan` keys.
- **A6 — `#1055` content is stylistically compliant after curation** — its
  `"SHIELD"`-caps lines normalized to lowercase `shield` (82:1 house
  convention); `"SHIELD ARM"` hit-location tokens correctly left uppercase.
- **A7 — `useRivalryAlerts` funnel gates well-ordered**; roster-id memo is a
  strict improvement with no semantic change.

## Corrected draft claims

- **C1 — #1063 DELETES the 7 helper scripts**, it does not re-add them —
  legitimate cleanup; zero references verified before deletion.
- **C2 — #1061 adds zero narrative content** despite its title — its JSON
  deletions are byte-identical to #1059's (same md5), its `_setup` JSON
  churn is regenerated `test-audit-scan` output, and its guard-test bump
  was already on main.
- **C3 — `_setup/{runnerGroups,auditBaseline}.json` are generated** — must
  regenerate via `scripts/test-audit-scan.mjs`, never hand-edit.
- **C4 — #1059/#1061/#1063 shared an identical 13-line fuzzy-dupe
  deletion** — landed exactly once, backed up at
  `.claude/backups/narrative/v17_fuzzy_removed.json`.
- **C5 — 7 of 10 PRs were 17–18 commits behind main** — every hunk re-checked
  against current main rather than trusting the diff base.

## New findings

- **N1 — Duplicate lore titles are precedented.** "The Rusting Grasp"
  collides across #1056 (iron cage) and #1060 (flooded vault); existing
  repo already has "The Drowning Grasp" and "The First Blood" twice.
  IDs + arenaIds are the integrity constraint — kept as authored.
- **N2 — `.claude/backups/` is gitignored but prior backups are tracked** —
  new backup force-added to match convention.

## Bugs found & fixed

- **F1 — `buildResolutionPayload` crashed on `undefined` newsletter**
  (`src/state/resolutionPayload.ts:22`) — worker round-trip surfaced as
  "Worker advancement failed: TypeError" stderr in `storeGuards.test.ts`.
  Widened param to `NewsletterItem[] | undefined`, matching its other
  `?? []` defaults. Contract test added.
- **F2 — `useShallowStability` audit guard was dead since inception** —
  regexes required `)=>` (no space); Prettier always emits `) =>`.
  Repaired whitespace, bounded matches to a single statement (`[^;}]`),
  narrowed `.map` rule to the real hazard (object-allocating callbacks),
  added planted-positive self-checks. Verified: flags planted
  `.map(() => ({...}))`, accepts primitive projections
  (`ONBOARDING_QUESTS.map(q => q.done(s))`) and the #1062 id-map.
- **F3 — Legacy-founder stables could debut over the roster cap** —
  `applyLegacyFounder` (`src/engine/ai/expansionService.ts:66`) overwrites
  `owner.personality` *after* the roster was minted under the template
  personality cap. Tactician/Methodical founder (cap 8) on an Aggressive
  template mint (10) → 10 actives > cap 8 — the exact
  `roster-cap-exceeded` invariant the content-union RNG shift surfaced in
  the week-40 soak. Fix: re-clamp minted roster to the derived cap.
  Contract test sweeps 60 seeds.
