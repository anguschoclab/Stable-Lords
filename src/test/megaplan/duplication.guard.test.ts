import { describe, it, expect } from 'vitest';
// @ts-expect-error — .mjs scanner has no types
import { collectDuplicates } from '../../../scripts/dup-scan.mjs';

/**
 * Duplication guard — megaplan Phase-4 ratchet.
 *
 * Baseline (2026-09-27, exact-normalized, 8-line blocks): 967 pair-clusters —
 * 84 src↔src, 780 test↔test, 103 mixed.
 *
 * Rebaselined during Phase 3 (130 src↔src), then V11 Phase-4 dedupe brought
 * the live count to 43; MEGAPLAN-V12 (D1–D11 consolidation) brought it to 32.
 * V17 whole-repo prettier pass normalized line/quote formatting, which
 * unmasked 9 latent parallel-boilerplate pairs → 36.
 *
 * V18 triage split the ledger in two (validated per-pair against source):
 *   EXEMPT_PAIRS — permanent structural overlap (prop-name echoes, shard
 *     barrels, vendor/parallel implementations). Registered knowingly, not
 *     dedupe targets.
 *   DEBT_PAIRS — genuine cloned logic slated for elimination. Drains to
 *     zero; each dedup commit removes its entries.
 * V18 dedup then drained all 9 debt pairs (statGrantOutcome/makeMinorInjury
 * ×7 offseason, DriftParticles, rivalFightPlan) → baseline 36→27.
 * NEW duplicate pairs fail loudly; a pair leaving either set must be dead
 * on the scan (the stale-entries test enforces the live-ledger invariant).
 */
const SRC_TO_SRC_BASELINE = 27;

const EXEMPT_PAIRS = new Set([
  // ─── Page↔hook / barrel extraction seams — thin interface overlap (prop
  // destructuring, import preambles) across the shell↔extracted-module
  // boundary, not behavioral duplication. Established project pattern.
  'src/components/EventLog.tsx|src/components/eventLog/index.ts',
  'src/components/PlanBuilder.tsx|src/components/planBuilder/usePlanOrchestration.ts',
  'src/pages/TrainingPlanner/hooks/useTrainingPlanner.ts|src/pages/TrainingPlanner/index.tsx',
  'src/components/scouting/StableComparison.tsx|src/hooks/useScoutingStableComparison.ts',
  'src/components/stable/RosterWarriorRow.tsx|src/hooks/useActiveRoster.ts',
  'src/components/tournaments/TournamentSchedule.tsx|src/hooks/useTournamentSchedule.ts',
  'src/pages/AdminTools/hooks/useAdminTools.ts|src/pages/AdminTools/index.tsx',
  'src/pages/ControlCenter/components/RankingsBar.tsx|src/pages/ControlCenter/hooks/useControlCenter.ts',
  'src/pages/HallOfFame/hooks/useHallOfFame.ts|src/pages/HallOfFame/index.tsx',
  'src/pages/Scouting.tsx|src/pages/scouting/useScouting.ts',
  'src/pages/StartGame.tsx|src/pages/startGame/hooks/useSaveSlots.ts',
  'src/pages/StartGame.tsx|src/pages/startGame/useStartGame.ts',
  'src/pages/Trainers.tsx|src/pages/Trainers/hooks/useTrainers.ts',
  'src/pages/WarriorDetail.tsx|src/pages/WarriorDetail/hooks/useWarriorDetail.ts',

  // ─── Shard-boundary boilerplate — file→directory splits carry the same
  // import preamble into orchestrator + sibling shards. Registered knowingly.
  'src/engine/combat/resolution/exchangeHelpers/execution/hitExecution/index.ts|src/engine/combat/resolution/exchangeHelpers/execution/hitExecution/killWindow.ts',
  'src/engine/combat/resolution/offenseDefense/index.ts|src/engine/combat/resolution/offenseDefense/prepare.ts',
  'src/engine/combat/resolution/offenseDefense/prepare.ts|src/engine/combat/resolution/offenseDefense/types.ts',
  'src/engine/simulate/simulationLoop/index.ts|src/engine/simulate/simulationLoop/types.ts',
  // Data barrel adjacency — items.ts is the per-item shard, weapons.ts the
  // curated registry; overlap is re-export/import preamble only.
  'src/data/equipment/weapons.ts|src/data/equipment/weapons/items.ts',

  // ─── Intentional parallel implementations / ordered design data.
  // crestGenerator↔enumSources: post-V12-D4 the generator's per-tier lists are
  // ordered pick-tables whose sequence is load-bearing for rollWeighted —
  // they legitimately re-state the canonical literals as design data.
  'src/engine/crest/crestGenerator.ts|src/types/enumSources.ts',
  // Parallel storage backends (Electron IPC vs OPFS) share the persistence
  // scaffold — different environments, same contract shape.
  'src/engine/storage/electronArchive.ts|src/engine/storage/opfsArchive/service.ts',
  // Nav shell is intentionally rendered twice (desktop rail vs mobile sheet).
  'src/components/layout/LeftNav.tsx|src/components/layout/MobileNav.tsx',
  // shadcn overlay boilerplate (portal+overlay+content skeleton) — vendor
  // component shape, not shared app logic.
  'src/components/ui/alert-dialog.tsx|src/components/ui/sheet.tsx',
  // shared shadcn Select/search toolbar boilerplate — different option domains
  // (recruit tier/style vs. list sorts), styling, and behavior. The toolbar
  // moved scouting/rivalListShell → ui/ListToolbar when lists adopted it.
  'src/components/ui/ListToolbar.tsx|src/pages/Recruit/components/RecruitFilters.tsx',
  // Shared dashboard/settings card idiom — divergent content, same shell.
  'src/components/dashboard/BriefingTab.tsx|src/components/dashboard/GazetteTab.tsx',
  'src/components/layout/ArenaSettings.tsx|src/components/stable/FighterConfigCard.tsx',
  // Warrior-card avatar block idiom — the sm-size AvatarForEntity + adjacent
  // flex wrapper is a shared display pattern, not behavioral duplication.
  'src/components/stable/StableRosterTab.tsx|src/components/stable/VeteranReassignmentDialog.tsx',
]);

// ─── DEBT — genuine cloned logic, drain to zero. V17's whole-repo prettier
// pass normalized quote style and line wrapping across already-parallel
// handlers, surfacing 8-line blocks that prior formatting differences had
// masked. All 9 drained: statGrantOutcome/makeMinorInjury (7 offseason
// pairs), DriftParticles (weather particle JSX), rivalFightPlan (rival-plan
// grudge+aiPlan tail).
const DEBT_PAIRS = new Set<string>([]);

// ═══ V18 — test↔test ledger (exact-normalized w8). This tier was never
// gated before V18, so boilerplate cloned freely: inline literal copies of
// _fixtures/* seeds, per-file `makeWarrior`/`title()`/`createMockWarrior`
// helper clones, and repeated vi.mock/harness boilerplate. Verdict split
// (V18 Phase-1 triage, all 150 pairs read): 4 EXEMPT literal pins +
// import-preamble echoes vs. 146 DEBT clones with an obvious shared home.
// DEBT drains as clusters land in `src/test/_fixtures/` / `_mocks/` /
// `_helpers` per the V18 §D table — MEGAPLAN-D1…D14.
// Post-V18 close-out: drained pairs fell off the scan → live 74 (4 exempt +
// 70 residual debt), baseline ratcheted 150→74 and debt budget 146→70.
// The 1,804-line tournamentSelection spec was split into 8 sibling files —
// their shared vi.mock/import preambles surface 6 new exempt pair-clusters
// (same category as the retired awardsTokens↔tournamentSelection entry) → 79.
// V19 (D15–D19) drained the entire 22-pair residual: verbatim offer-eval arg
// blocks → shared bidRoster/competitionWorker helpers, venue/flat/bare-warrior
// wrappers → statWarrior/arenaTitle/determinism fixtures, loadout/state/injury/
// fight-summary literals → shared pins, mock preambles → __SHARED_MOCKS. The 5
// pairs left live are preamble/call-shape echoes registered knowingly below —
// same exemption category as the V18 tournamentSelection preambles.
const TEST_TO_TEST_BASELINE = 12;
const TEST_DEBT_BUDGET = 0;

const TEST_EXEMPT_PAIRS = new Set([
  // enumSourcesSync re-enumerates the weather union — re-listing the
  // canonical literals is the sync guard's entire purpose (literal pin).
  'src/test/_fixtures/weather.ts|src/test/schemas/enumSourcesSync.test.ts',
  // Characterization spec deliberately re-pins the weapon→style tables
  // verbatim — the pin is the test.
  'src/test/data/equipment/weaponStyles.characterization.test.ts|src/test/data/equipment/weaponStyles.test.ts',
  // Sibling specs split out of the old 1,804-line tournamentSelection file
  // share its mock-registration + fixture-import preamble — a shared import
  // preamble, not a clone. Same category as the retired
  // awardsTokens↔tournamentSelection pair this replaced.
  'src/test/engine/matchmaking/tournamentSelection/awards.test.ts|src/test/engine/matchmaking/tournamentSelection/resolveRound.test.ts',
  'src/test/engine/matchmaking/tournamentSelection/awards.test.ts|src/test/engine/matchmaking/tournamentSelection/sweep.test.ts',
  'src/test/engine/matchmaking/tournamentSelection/bracket.test.ts|src/test/engine/matchmaking/tournamentSelection/resolveRound.test.ts',
  'src/test/engine/matchmaking/tournamentSelection/completion.test.ts|src/test/engine/matchmaking/tournamentSelection/resolveRound.test.ts',
  'src/test/engine/matchmaking/tournamentSelection/generation.test.ts|src/test/engine/matchmaking/tournamentSelection/results.test.ts',
  'src/test/engine/matchmaking/tournamentSelection/resolveRound.test.ts|src/test/engine/matchmaking/tournamentSelection/sweep.test.ts',
  // Shared weatherSuitability import preamble + derived OFFSEASON set echo.
  'src/test/engine/ai/weatherDisposition.completeness.test.ts|src/test/engine/ai/weatherSuitability.test.ts',
  // ─── V19 — post-drain residue: identical import/fixture preambles and
  // call-shape idioms left after the real logic moved into shared helpers.
  // resolveImpactsCoverage↔impactMergeOrder both alias makeBareWarrior and
  // import the same fixture set — an import preamble, not shared logic.
  'src/test/engine/impacts/resolveImpactsCoverage.test.ts|src/test/engine/pipeline/impactMergeOrder.test.ts',
  // ChronicleTab↔MissionControlTab share the jsdom/render/uiSurface mock
  // preamble only; their bodies test different components.
  'src/test/components/warrior/ChronicleTab.test.tsx|src/test/components/warrior/MissionControlTab.test.tsx',
  // grudgeWorldDecoupling↔playerGrudges share only the factory-import list.
  'src/test/engine/pipeline/grudgeWorldDecoupling.test.ts|src/test/engine/pipeline/playerGrudges.test.ts',
]);

// V19 close-out: all registered debt pairs drained — set stays empty and the
// live-ledger invariant keeps it that way (budget 0).
const TEST_DEBT_PAIRS = new Set<string>([]);

// ═══ V18 — mixed src↔test ledger (exact-normalized w8). All 27 pairs are
// intentional literal pins: specs re-stating canonical production literals
// (zero-state objects, enum unions, ctx key lists, barrel/mocks surfaces)
// as assertion data — the duplication is the point.
const MIXED_BASELINE = 18;

const MIXED_EXEMPT_PAIRS = new Set([
  'src/components/layout/MobileNav.tsx|src/test/_mocks/routerLink.tsx',
  'src/components/world/WarriorLeaderboardFilters.tsx|src/test/components/FilterToggleButton.test.tsx',
  'src/data/equipment/weaponStyles.ts|src/test/data/equipment/weaponStyles.test.ts',
  'src/data/equipment/weapons.ts|src/test/data/equipment/weaponStyles.test.ts',
  'src/data/equipment/weapons/items.ts|src/test/data/equipment/weaponStyles.test.ts',
  'src/engine/combat/resolution/resolution.ts|src/test/engine/combat/enduranceCosts.test.ts',
  'src/engine/combat/resolution/resolution.ts|src/test/engine/combat/offenseDefense.test.ts',
  'src/engine/factories/warriorDefaults.ts|src/test/_fixtures/statWarrior.ts',
  'src/engine/narrative/index.ts|src/test/engine/narrative/combatNarrators.test.ts',
  'src/engine/traits/mods.ts|src/test/engine/traitMods.test.ts',
  'src/engine/traits/registry.ts|src/test/engine/combat/traitBalance.slow.test.ts',
  'src/engine/weather/seasonalWeather.ts|src/test/engine/pipeline/weatherSeasonExclusivity.test.ts',
  'src/test/_fixtures/weather.ts|src/types/enumSources.ts',
  'src/test/components/warrior/condition/ConditionTriggerSection.test.tsx|src/types/enumSources.ts',
  'src/test/megaplan/typeSurface.test.ts|src/types/state.types.ts',
  'src/test/schemas/enumSourcesSync.test.ts|src/types/enumSources.ts',
  'src/test/schemas/schemaCharacterization.test.ts|src/types/enumSources.ts',
  // makeBoutSummary in _fixtures re-states WeekStatsService's zeroed
  // summary shape — a canonical production-literal pin for mock returns.
  'src/engine/bout/services/WeekStatsService.ts|src/test/_fixtures/factories.ts',
]);

const MIXED_DEBT_PAIRS = new Set<string>([]);

const IS_TEST = (f: string) => f.includes('/test/') || /\.(test|spec)\.tsx?$/.test(f);

describe('megaplan: duplication guard', () => {
  const { clusters, counts } = collectDuplicates();
  const pairKey = (c: { pair: string[] }) => `${c.pair[0]}|${c.pair[1]}`;
  const srcPairs = clusters.filter((c: { pair: string[] }) => c.pair.every((f) => !IS_TEST(f)));
  const testPairs = clusters.filter((c: { pair: string[] }) => c.pair.every(IS_TEST));
  const mixedPairs = clusters.filter(
    (c: { pair: string[] }) => c.pair.filter(IS_TEST).length === 1
  );
  const REGISTERED = new Set([...EXEMPT_PAIRS, ...DEBT_PAIRS]);
  const TEST_REGISTERED = new Set([...TEST_EXEMPT_PAIRS, ...TEST_DEBT_PAIRS]);
  const MIXED_REGISTERED = new Set([...MIXED_EXEMPT_PAIRS, ...MIXED_DEBT_PAIRS]);

  it('src↔src duplicate pair count never exceeds baseline', () => {
    expect(counts.srcToSrc).toBeLessThanOrEqual(SRC_TO_SRC_BASELINE);
  });

  it('every src↔src pair is registered (no NEW duplication)', () => {
    const novel = srcPairs.map(pairKey).filter((p: string) => !REGISTERED.has(p));
    expect(novel, 'new duplicate pairs introduced — dedupe or register knowingly').toEqual([]);
  });

  it('registered pairs stay pruned to live pairs (no stale entries)', () => {
    const live = new Set(srcPairs.map(pairKey));
    const stale = [...REGISTERED].filter((p) => !live.has(p));
    expect(
      stale,
      'EXEMPT_PAIRS/DEBT_PAIRS contain dead entries — remove them (live ledger)'
    ).toEqual([]);
  });

  it('DEBT_PAIRS drains — size never exceeds its remaining budget', () => {
    expect(DEBT_PAIRS.size).toBeLessThanOrEqual(9);
  });

  it('test↔test duplicate pair count never exceeds baseline', () => {
    expect(counts.testToTest).toBeLessThanOrEqual(TEST_TO_TEST_BASELINE);
  });

  it('every test↔test pair is registered (no NEW duplication)', () => {
    const novel = testPairs.map(pairKey).filter((p: string) => !TEST_REGISTERED.has(p));
    expect(
      novel,
      'new test↔test duplicate pairs introduced — consolidate into _fixtures/_mocks or register knowingly'
    ).toEqual([]);
  });

  it('test registered pairs stay pruned to live pairs (no stale entries)', () => {
    const live = new Set(testPairs.map(pairKey));
    const stale = [...TEST_REGISTERED].filter((p) => !live.has(p));
    expect(
      stale,
      'TEST_EXEMPT_PAIRS/TEST_DEBT_PAIRS contain dead entries — remove them (live ledger)'
    ).toEqual([]);
  });

  it('TEST_DEBT_PAIRS drains — size never exceeds its remaining budget', () => {
    expect(TEST_DEBT_PAIRS.size).toBeLessThanOrEqual(TEST_DEBT_BUDGET);
  });

  it('mixed duplicate pair count never exceeds baseline', () => {
    expect(counts.mixed).toBeLessThanOrEqual(MIXED_BASELINE);
  });

  it('every mixed pair is registered (no NEW duplication)', () => {
    const novel = mixedPairs.map(pairKey).filter((p: string) => !MIXED_REGISTERED.has(p));
    expect(
      novel,
      'new src↔test duplicate pairs introduced — literal pins register knowingly, logic clones get consolidated'
    ).toEqual([]);
  });

  it('mixed registered pairs stay pruned to live pairs (no stale entries)', () => {
    const live = new Set(mixedPairs.map(pairKey));
    const stale = [...MIXED_REGISTERED].filter((p) => !live.has(p));
    expect(
      stale,
      'MIXED_EXEMPT_PAIRS/MIXED_DEBT_PAIRS contain dead entries — remove them (live ledger)'
    ).toEqual([]);
  });
});
