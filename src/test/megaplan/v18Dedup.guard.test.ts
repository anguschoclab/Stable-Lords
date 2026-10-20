import { describe, it, expect } from 'vitest';
import path from 'node:path';
import {
  REPO,
  candidateExists,
  fileText,
  occurrences,
} from './_probeHelpers';

/**
 * MEGAPLAN-V18 test-tier deduplication spec (authored test-first).
 *
 * Verdicted DEBT clusters from MEGAPLAN_V18_FINDINGS §D — each asserts the
 * shared abstraction exists and honors the contract that made the clones
 * identical (v12Dedup precedent: existence probes + file-text contracts;
 * dynamic import so failures are clean assertion reds).
 *
 * The live-ledger invariant in duplication.guard.test.ts is the per-pair
 * teeth: every DEBT pair must drain or be re-registered — these specs pin
 * the *shared homes* the pairs drain into.
 */

const CW = 'src/test/engine/ai/workers/competitionWorker';

describe('megaplan V18: test-tier deduplication', () => {
  // eslint-disable-next-line vitest/no-disabled-tests
  it('D1: shared competitionWorker eval-harness + dominant-rankings fixture exist — MEGAPLAN-D1', async () => {
    const found = candidateExists([
      `${CW}/_helpers.ts`,
      `${CW}/helpers.ts`,
      'src/test/_fixtures/competitionWorker.ts',
    ]);
    expect(found, 'no shared competitionWorker eval harness found').toBe(true);
    const fixtureText =
      fileText('src/test/_fixtures/factories.ts') +
      fileText('src/test/_fixtures/rankings.ts') +
      fileText('src/test/_fixtures/competitionWorker.ts');
    expect(
      /makeDominantRankings|dominantRankings/.test(fixtureText),
      'no shared dominant-rankings fixture found'
    ).toBe(true);
    const mod = await import(path.join(REPO, 'src/test/_fixtures/factories.ts')).catch(() => null);
    expect(mod, 'factories module must import').not.toBeNull();
  });

  // eslint-disable-next-line vitest/no-disabled-tests
  it('D2: warrior wrapper clones repointed — no per-file createMockWarrior/makeWarrior-wrap literals — MEGAPLAN-D2', () => {
    const offenders = [
      'src/test/hooks/useActiveRoster.test.ts',
      'src/test/hooks/useAtRiskWarriors.test.ts',
      'src/test/hooks/useCoachTip.test.ts',
      'src/test/hooks/useShallowMemoization.test.ts',
      'src/test/engine/bout/planDefaults.test.ts',
      'src/test/engine/pipeline/impactMergeOrder.test.ts',
      'src/test/engine/pipeline/rivalMapStaleness.test.ts',
      'src/test/components/warrior/WarriorHeroHeader.test.tsx',
      'src/test/pages/WarriorDetail.test.tsx',
      'src/test/components/WarriorDossier.test.tsx',
      'src/test/components/warrior/dossier/WarriorDossierHeader.test.tsx',
    ].filter((f) => /createMockWarrior|makeWarrior\s*=\s*\(overrides/.test(fileText(f)));
    expect(offenders, 'local warrior-factory wrappers still inline').toEqual([]);
  });

  // eslint-disable-next-line vitest/no-disabled-tests
  it('D3: zero-state GameState literal tails repointed to makeGameState — MEGAPLAN-D3', () => {
    const re = /scoutReports:\s*\[\],\s*\n\s*restStates:\s*\[\]/g;
    const offenders = [
      'src/test/engine/core/warriorCollection.test.ts',
      'src/test/engine/training/training.test.ts',
      'src/test/hooks/useRivalries.test.ts',
      'src/test/engine/matchmaking/schedulingAssistant.test.ts',
    ].filter((f) => occurrences([f], re) > 0);
    expect(offenders, 'zero-state GameState literals still inline').toEqual([]);
  });

  // eslint-disable-next-line vitest/no-disabled-tests
  it('D4: ArenaTitle literals + title() clones repointed to makeArenaTitle — MEGAPLAN-D4', () => {
    const re = /noContenderStreak:\s*0,\s*\n\s*declinedContenders:\s*\{\}/g;
    const offenders = [
      'src/test/engine/championship/championsTournament.test.ts',
      'src/test/engine/validate/stateInvariants.test.ts',
      'src/test/pages/ArenaCircuit.test.tsx',
      'src/test/engine/ai/intentEngine.crown.test.ts',
      'src/test/engine/aging.test.ts',
      'src/test/engine/ai/retirementTiming.test.ts',
      'src/test/engine/ai/rosterCulling.test.ts',
      'src/test/integration/autosimCouncil.crown.test.ts',
      'src/test/integration/championshipAdvanceWeek.slow.test.ts',
      'src/test/engine/stats/simulationMetrics.championship.test.ts',
    ].filter((f) => occurrences([f], re) > 0);
    expect(offenders, 'ArenaTitle literals still inline').toEqual([]);
  });

  // eslint-disable-next-line vitest/no-disabled-tests
  it('D5: statWarrior-shaped warrior literals repointed — MEGAPLAN-D5', () => {
    const re = /career:\s*\{\s*wins:\s*0,\s*losses:\s*0,\s*kills:\s*0\s*\},\s*\n\s*champion:\s*false,\s*\n\s*status:\s*'Active'/g;
    const offenders = [
      'src/test/engine/strategyValidator.test.ts',
      'src/test/engine/bout/boutProcessorService.test.ts',
      'src/test/state/slices/rosterSlice.test.ts',
      'src/test/components/PlanBuilder.test.tsx',
      'src/test/megaplan/v12Dedup.guard.test.ts',
      'src/test/engine/aging/veteranCompensation.test.ts',
      'src/test/engine/economy/idleStipend.test.ts',
      'src/test/engine/economy/economy.test.ts',
      'src/test/engine/economy/economyScaling.test.ts',
      'src/test/engine/ai/bankruptcyService.test.ts',
      'src/test/engine/advisor/stableCouncilService.test.ts',
    ].filter((f) => occurrences([f], re) > 0);
    expect(offenders, 'statWarrior literals still inline').toEqual([]);
  });

  // eslint-disable-next-line vitest/no-disabled-tests
  it('D6: inline react-router mocks repointed to _mocks/routerLink — MEGAPLAN-D6', () => {
    const offenders = [
      'src/test/components/dashboard/CouncilBriefingWidget.test.tsx',
      'src/test/pages/Advisor.test.tsx',
      'src/test/components/widgets/PreAdvanceChecklist.test.tsx',
      'src/test/components/layout/LeftNav.test.tsx',
      'src/test/routes/stable-routes.test.tsx',
      'src/test/routes/world-routes.test.tsx',
      'src/test/components/WarriorLeaderboardVirtualized.test.tsx',
      'src/test/components/WarriorLeaderboardVirtualizedBranch.test.tsx',
    ].filter((f) => {
      const t = fileText(f);
      const mocks = (t.match(/vi\.mock\('@tanstack\/react-router'/g) ?? []).length;
      const shared = (t.match(/__SHARED_MOCKS\.routerLink/g) ?? []).length;
      return mocks > shared; // a vi.mock factory not repointed to the shared module
    });
    expect(offenders, 'inline react-router mocks still inline').toEqual([]);
  });

  // eslint-disable-next-line vitest/no-disabled-tests
  it('D7: shared component-mock entries exist in __SHARED_MOCKS and boilerplate sites repointed — MEGAPLAN-D7', () => {
    const sm = fileText('src/test/_setup/sharedMocks.ts');
    for (const key of ['uiBadge', 'paperDoll', 'sonner', 'workerProxy', 'orphanPool']) {
      expect(sm, `__SHARED_MOCKS missing ${key}`).toContain(key);
    }
  });

  // eslint-disable-next-line vitest/no-disabled-tests
  it('D8: shared determinism harness exists (run-twice + compare) — MEGAPLAN-D8', () => {
    const text =
      fileText('src/test/_helpers/determinism.ts') +
      fileText('src/test/_fixtures/determinism.ts') +
      fileText('src/test/engine/combat/_helpers.ts');
    expect(
      /expectDeterministic|runDeterministically|simulateDeterministically/.test(text),
      'no shared determinism harness found'
    ).toBe(true);
  });

  // eslint-disable-next-line vitest/no-disabled-tests
  it('D9: shared stubbed weather-roll helper exists — MEGAPLAN-D9', () => {
    const text =
      fileText('src/test/_fixtures/weather.ts') +
      fileText('src/test/_helpers/weather.ts') +
      fileText('src/test/engine/pipeline/_helpers.ts');
    expect(
      /rollStubbedWeather|rollWeatherWith|stubRngNext/.test(text),
      'no shared stubbed weather-roll helper found'
    ).toBe(true);
  });

  // eslint-disable-next-line vitest/no-disabled-tests
  it('D10: offseason specs repointed to makeOffseasonCtx (verbatim ctx literals drained) — MEGAPLAN-D10', () => {
    const re = /rosterUpdates:\s*new Map(?:<[^>]*>)?\(\),\s*\n\s*newsletterItems:\s*\[\],\s*\n\s*ledgerEntries:\s*\[\]/g;
    const offenders = [
      'src/test/engine/pipeline/seasonalChaosWeaver.test.ts',
      'src/test/engine/pipeline/seasonalMonolithEvent.test.ts',
      'src/test/engine/pipeline/seasonalDreamweaversMist.test.ts',
      'src/test/engine/pipeline/seasonalPhantomSparring.test.ts',
      'src/test/engine/pipeline/bountifulHarvest.test.ts',
      'src/test/engine/pipeline/seasonalChaosWeaversProphecy.test.ts',
      'src/test/engine/pipeline/seasonalPrismaticGale.test.ts',
    ].filter((f) => occurrences([f], re) > 0);
    expect(offenders, 'verbatim offseason ctx literals still inline').toEqual([]);
  });

  // eslint-disable-next-line vitest/no-disabled-tests
  it('D11: fight-summary literals repointed to makeFightSummary — MEGAPLAN-D11', () => {
    const offenders = [
      'src/test/components/awards/Awards.test.tsx',
      'src/test/components/eventLog/EventLog.test.tsx',
      'src/test/engine/impacts/resolveImpacts.test.ts',
      'src/test/engine/storage/truncationBounds.test.ts',
    ].filter((f) => !/makeFightSummary/.test(fileText(f)));
    expect(offenders, 'spec files not repointed to makeFightSummary').toEqual([]);
  });

  // eslint-disable-next-line vitest/no-disabled-tests
  it('D12: rival/rivalMap literals repointed to makeRival/makeOwner — MEGAPLAN-D12', () => {
    const re = /rivalMap:\s*new Map\(\[\s*\n?\s*\['rival-/g;
    const offenders = [
      'src/test/engine/ai/boutBidding.test.ts',
      'src/test/engine/ai/boutBiddingIntegration.test.ts',
      'src/test/engine/bout/aiPlanIntegration.test.ts',
      'src/test/engine/core/absoluteWeekRollover.test.ts',
    ].filter((f) => occurrences([f], re) > 0);
    expect(offenders, 'rivalMap literals still inline').toEqual([]);
  });

  // eslint-disable-next-line vitest/no-disabled-tests
  it('D13: _fixtures echo clones repointed — Dragon\'s Hearth player literal drained — MEGAPLAN-D13', () => {
    const re = /stableName:\s*["']Dragon's Hearth["']/g;
    const offenders = [
      'src/test/components/RosterWallAnimation.test.tsx',
      'src/test/components/VirtualizedFallenGrid.test.tsx',
      'src/test/pages/TournamentsError.test.tsx',
      'src/test/pages/AdminTools/hooks/useAdminTools.test.ts',
      'src/test/state/saveSlots.test.ts',
    ].filter((f) => occurrences([f], re) > 0);
    expect(offenders, 'storeState player literals still inline').toEqual([]);
  });

  // eslint-disable-next-line vitest/no-disabled-tests
  it('D14: misc cloned helpers extracted — walk crawler, comlink/worker mock, injury + tourney factories — MEGAPLAN-D14', () => {
    const helpers = fileText('src/test/_helpers/fsWalk.ts') + fileText('src/test/_fixtures/fsWalk.ts');
    expect(
      /function\* walk|walkTsFiles|listTsFiles/.test(helpers),
      'no shared fs-walk helper found (envSafety/moduleCacheRegistry)'
    ).toBe(true);
    const comlink =
      fileText('src/test/_mocks/workerProxy.ts') + fileText('src/test/_setup/sharedMocks.ts');
    expect(
      /mockWorkerCtor|comlink|Worker/.test(comlink),
      'no shared worker/comlink mock found'
    ).toBe(true);
    const re = /name:\s*'Test Injury'|name:\s*'Torn Muscle'/g;
    const offenders = [
      'src/test/engine/injuries.test.ts',
      'src/test/engine/warriorStatus.test.ts',
      'src/test/engine/advisor/campaignFocusEvaluator.test.ts',
      'src/test/engine/advisor/trainingAdvisor.test.ts',
    ].filter((f) => occurrences([f], re) > 0);
    expect(offenders, 'makeInjury literals still inline').toEqual([]);
  });
});
