# Engine Reviewer Journal

Field format: `## YYYY-MM-DD - [Title]` then Discovery / Rule / Check entries.
Record traps, rejected approaches, and discovered invariants — not routine
"all clean" sweeps.

## 2026-11-22 — Determinism/RNG sweep: in-year week trap, doc drift, inert lint glob

**Discovery — `state.week` repeats every year.** In-year week (1–52) is NOT a
safe seed component for id mints: `weekSkip.ts::appendTournamentRecap` seeded
`new SeededRNG(week).uuid()`, so year-2 tournament-week recaps minted the same
newsletter id as year-1 (rendered `key={item.id}` in `EventLog.tsx`). The
sanctioned cross-year pattern is `state.absoluteWeek ?? state.week`
(SystemPass, RecruitmentPass, rosterSlice all use it). Fixed to
`state.absoluteWeek ?? week`. Any `new SeededRNG(state.week …)` or
`hashStr(… state.week)` on an id/output path deserves a second look.

**Rule — `scripts/seeded-id-scan.mjs` first.** It is the authoritative engine
determinism scan (generateId / cryptoRandom / Math.random /
crypto.getRandomValues in `src/engine/**`, with a deliberate allowlist for
`initialization.ts` unseeded-fight fallback and `warriorFactory.ts` rng-less
mints). Run it before hand-grepping; both "violations" I chased were already
sanctioned allowlist entries.

**Check — the rng-policy seed table drifts.** Two failure modes found: (a)
semantic — doc said `state.week * 6151 + 29` for SystemPass but the code has
used `absoluteWeek * 6151 + 29` since V26 (week ≠ absoluteWeek — real drift,
doc was wrong); (b) paths rot as monoliths split (`rivalStableShard.ts` →
`rivalStableShard/processStable.ts`, `RivalStrategyPass.ts` →
`RivalStrategyPass/roster.ts`, `weekPipelineService.ts` → `weekPipeline/
context.ts`). When auditing, verify each row's expression AND path.

**Discovery — `narrativeContent` split-init is safe by design.** The lazy
fields are exactly six: `pbp`, `strikes`, `conclusions`, `passives`,
`kill_text`, `crowd_reactions` (undefined until `loadCombatNarrative()`);
everything else (`gazette`, `ux_metadata`, `recruitment`, `events`,
`offseason_events`, `blurbs`, `commentary`, `recap`, `fanfare`, `meta`,
`persona`, `memorials`) is populated at module init, so module-scope reads of
eager fields (e.g. `MOOD_TONE` in `gazetteTemplateHelpers.ts`) are fine. Only
`narrativePBPUtils.ts` touches lazy fields — guarded by `if (!narrativeContent.pbp)`.

**Discovery — the UI→engine eslint boundary is inert.** `eslint.config.js`'s
`no-restricted-imports` glob `**/engine/!(types/common|worker/*)` does not
match `@/engine/...` alias imports (verified via minimatch — returns false
for `@/engine/warrior/x`). Dozens of components import engine internals and
lint stays clean; the boundary holds by convention/review, not enforcement.
Flagging, not fixing — fixing the glob would turn latent violations into a
red tree.

**Invariant confirmed.** `resolveBout` bout seeds come from
`hashStr(`${ctx.week}|${aId}|${dId}`)` where both call sites
(`boutProcessorService.ts` in-line, `enginePool.ts` shard) pass
`state.absoluteWeek` — shard ≡ in-line. `RivalShardInput.index` is the
`state.rivals` ordering position, fixed before dispatch. `finalizeState`
never reads `ctx.rootRng` — the `new SeededRNG(0)` in `syncedShardState.ts`
is a placeholder (fragile if finalize ever draws from it — worth a comment
someday).
