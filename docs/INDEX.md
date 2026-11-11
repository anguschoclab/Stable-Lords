# Stable Lords — Docs Index

The docs/ catalogue. Layout convention lives in [`AGENTS.md`](../AGENTS.md)
§Docs layout; `src/test/megaplan/docsLayout.guard.test.ts` enforces it —
every non-archive doc must appear here.

| Dir | Family |
| --- | --- |
| `design/` | Canon specs + UI-design docs — the in-game Help bible corpus |
| `engineering/` | Testing, RNG, pipeline, setup references + live audits |
| `reports/` | Generated committed reports |
| `manual/` | Player-facing manual + screenshots |
| `archive/` | Frozen history: `megaplans/`, `audits/`, `summaries/`, `superpowers/` |

## Megaplan (protocol)

- [`MEGAPLAN_BACKLOG.md`](MEGAPLAN_BACKLOG.md) — living register of open deferred items, watch items, and house divergences
- [`MEGAPLAN_V28_PLAN.md`](MEGAPLAN_V28_PLAN.md) — docs taxonomy & convention ratchet plan
- [`MEGAPLAN_V28_FINDINGS.md`](MEGAPLAN_V28_FINDINGS.md) — validated findings
- [`MEGAPLAN_V28_LEDGER.md`](MEGAPLAN_V28_LEDGER.md) — phase commits & stream changes
- [`MEGAPLAN_V28_DEFERRED.md`](MEGAPLAN_V28_DEFERRED.md) — deferred scope & watch items

## Design — the bible corpus

Canon (`stable-lords-*`):

- [`stable-lords-master-design-bible-v1.0-nonlossy-stable-lords-naming.md`](design/stable-lords-master-design-bible-v1.0-nonlossy-stable-lords-naming.md) — verbatim non-lossy collation of all design material
- [`stable-lords-warrior-design-and-creation-spec-v0.3-definitive.md`](design/stable-lords-warrior-design-and-creation-spec-v0.3-definitive.md) — warrior creation spec (definitive)
- [`stable-lords-warrior-potential-spec-v1.0.md`](design/stable-lords-warrior-potential-spec-v1.0.md) — potential system
- [`stable-lords-warrior-design-arena-93-v1.0.md`](design/stable-lords-warrior-design-arena-93-v1.0.md) — "How to Build a Better Warrior" (Arena 93)
- [`stable-lords-fighter-concepts-arena-93-v1.0.md`](design/stable-lords-fighter-concepts-arena-93-v1.0.md) — long-term fighter concepts (Arena 93)
- [`stable-lords-fighting-styles-compendium-v0.3-duelmasters-names.md`](design/stable-lords-fighting-styles-compendium-v0.3-duelmasters-names.md) — the ten canonical styles
- [`stable-lords-dueling-bout-system-and-style-matchup-matrix-v0.1.md`](design/stable-lords-dueling-bout-system-and-style-matchup-matrix-v0.1.md) — bout system + style matchup matrix
- [`stable-lords-matchmaking-and-scheduling-spec-v1.0.md`](design/stable-lords-matchmaking-and-scheduling-spec-v1.0.md) — matchmaking/scheduling
- [`stable-lords-training-mechanics-spec-v1.0.md`](design/stable-lords-training-mechanics-spec-v1.0.md) — training & progression
- [`stable-lords-strategy-editor-spec-v1.0.md`](design/stable-lords-strategy-editor-spec-v1.0.md) — strategy editor & fight plan
- [`stable-lords-equipment-armor-encumbrance-spec-v0.1.md`](design/stable-lords-equipment-armor-encumbrance-spec-v0.1.md) — equipment/armor/encumbrance
- [`stable-lords-kill-death-and-permadeath-spec-v0.2.md`](design/stable-lords-kill-death-and-permadeath-spec-v0.2.md) — kill, death & permadeath
- [`stable-lords-combat-log-and-kill-narrative-spec-v0.1.md`](design/stable-lords-combat-log-and-kill-narrative-spec-v0.1.md) — combat log & kill narrative
- [`stable-lords-canonical-pbp-reference-v0.2.md`](design/stable-lords-canonical-pbp-reference-v0.2.md) — canonical PBP narration patterns
- [`stable-lords-ai-dueling-behavior-spec-v0.1.md`](design/stable-lords-ai-dueling-behavior-spec-v0.1.md) — AI dueling behavior
- [`stable-lords-orphanage-recruitment-spec-v1.0.md`](design/stable-lords-orphanage-recruitment-spec-v1.0.md) — orphanage & recruitment
- [`combat-spatial-system-design.md`](design/combat-spatial-system-design.md) — distance state machine, exchange phases, arenas

UI design system:

- [`design-bible-ui-v1.0.md`](design/design-bible-ui-v1.0.md) — "Codex Sanguis" design system
- [`design-control-center-v1.0.md`](design/design-control-center-v1.0.md) — "The Tablinum" dashboard
- [`design-page-system-v1.0.md`](design/design-page-system-v1.0.md) — page shell extended to every route

## Engineering

- [`testing.md`](engineering/testing.md) — test layout, tiers, and conventions
- [`rng-policy.md`](engineering/rng-policy.md) — `Math.random` ban + seeded-RNG rules
- [`mac-setup.md`](engineering/mac-setup.md) — Mac setup guide
- [`pipeline-audit.md`](engineering/pipeline-audit.md) — time-advancement systems audit (guarded by `v14PipelineDocs`)
- [`pipeline-dependency-map.md`](engineering/pipeline-dependency-map.md) — pass ownership map (guarded by `v14PipelineDocs`)
- [`pipeline-baseline.md`](engineering/pipeline-baseline.md) — benchmark baselines & targets
- [`pipeline-parallelism.md`](engineering/pipeline-parallelism.md) — worker-pool findings (ship gate failed, `poolSize=1`)
- [`batch-advance-production.md`](engineering/batch-advance-production.md) — batch/headless advance production notes
- [`combat-subsystems-2026-06.md`](engineering/combat-subsystems-2026-06.md) — kill windows, distance contest, fatigue deep-dive
- [`bard-engine-context.md`](engineering/bard-engine-context.md) — bard narrative engine context & audit
- [`ai-behavior-audit-v3.md`](engineering/ai-behavior-audit-v3.md) — live AI-behavior audit register (v1/v2 archived)

## Reports (generated — regenerate, don't hand-edit)

- [`daily-balance-report.md`](reports/daily-balance-report.md) — `bun run oracle:daily` (CI: `daily_sim.yml`)
- [`daily-bard-report.md`](reports/daily-bard-report.md) — `bun run bard:daily` (CI: `daily_bard.yml`)
- [`orphan-report.md`](reports/orphan-report.md) — `node scripts/orphan-report.mjs` (PO triage doc)

## Manual

- [`user-manual.md`](manual/user-manual.md) — the player-facing manual (screenshots in `manual/images/`)

## Archive

Frozen history — docs here are immutable audit records; stale internal
references are left verbatim.

- [`archive/megaplans/`](archive/megaplans/) — megaplan lineage docs V8-era through V27 (indexed in `MEGAPLAN_BACKLOG.md` §6)
- [`archive/audits/`](archive/audits/) — `ai-behavior-audit-v{1,2}.md`, `orphan-feature-audit-v{1,2}.md`
- [`archive/summaries/`](archive/summaries/) — `refactoring-summary.md`, `pipeline-tick-implementation-summary.md`
- [`archive/superpowers/`](archive/superpowers/) — June-2026 superpowers `plans/` + `specs/` + the combat-spatial impl plan
