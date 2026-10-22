import { describe, it, expect } from 'vitest';
import {
  candidateExists,
  fileText,
  occurrences,
} from './_probeHelpers';

/**
 * MEGAPLAN-V19 test-tier deduplication spec (authored test-first).
 *
 * Verdicted DEBT clusters from MEGAPLAN_V19_FINDINGS §D — the 70-pair
 * TEST_DEBT_PAIRS ledger drained in five harmonization families (plus a
 * preamble-idiom re-verdict). Each contract asserts the shared home exists
 * and the verbatim offender literals are gone (v18Dedup precedent).
 *
 * The live-ledger invariant in duplication.guard.test.ts is the per-pair
 * teeth: every drained pair must fall off the scan and out of
 * TEST_DEBT_PAIRS — or fail loudly as a stale registration.
 */

const CW = 'src/test/engine/ai/workers/competitionWorker';
const CW_SPECS = [
  `${CW}/desperationGate.test.ts`,
  `${CW}/playerPressure.test.ts`,
  `${CW}/promoterAwareness.test.ts`,
  `${CW}/responseNotes.test.ts`,
  `${CW}/styleMatchupGate.test.ts`,
  `${CW}/venueCounter.test.ts`,
  `${CW}/offerProcessor.test.ts`,
];

describe('megaplan V19: test-tier deduplication', () => {
  it('D15: shared evalOffer harness exists + verbatim evaluateBoutOffer arg-blocks drained — MEGAPLAN-D15', () => {
    const fixture = fileText('src/test/_fixtures/competitionWorker.ts');
    expect(fixture, 'no shared competitionWorker eval harness found').toMatch(
      /export function evalBoutOffer/
    );
    // The cloned verbatim arg-shape (offer/rival/warrior/currentWeek:5/
    // weather:'Clear') drains into the wrapper — per-spec overrides remain.
    const re =
      /offer:\s*\w+,\s*\n\s*rival:\s*\w+,\s*\n\s*warrior:\s*\w+,\s*\n\s*currentWeek:\s*5,\s*\n\s*weather:\s*'Clear'/g;
    const offenders = [
      ...CW_SPECS,
      'src/test/engine/matchmaking/weatherAwareMatchmaking.test.ts',
    ].filter((f) => occurrences([f], re) > 0);
    expect(offenders, 'verbatim evaluateBoutOffer arg-blocks still inline').toEqual([]);
  });

  it('D16: fixture-literal echoes drained — specs repoint to fixture exports — MEGAPLAN-D16', () => {
    const offenders = [
      // bidRoster makeOwner literal tail
      ...[
        'src/test/engine/bout/aiPlanIntegration.test.ts',
        'src/test/engine/pipeline/passes/RivalStrategyPass.slow.test.ts',
      ].filter(
        (f) =>
          occurrences(
            [f],
            /stableName:\s*'Stable',\s*\n\s*fame:\s*100,\s*\n\s*renown:\s*50,\s*\n\s*titles:\s*0,\s*\n\s*personality:\s*'Pragmatic'/g
          ) > 0
      ),
      // ResolutionReveal i18n literal echo — shared i18n fixture instead
      ...['src/test/components/ResolutionReveal.selector.test.tsx'].filter(
        (f) => occurrences([f], /step_gazette:\s*'The Gazette'/g) > 0
      ),
    ];
    expect(offenders, 'fixture literal echoes still inline').toEqual([]);
  });

  it('D17: shared framer-motion mock + dashboard-tab state exist; boilerplate sites repointed — MEGAPLAN-D17', () => {
    expect(
      candidateExists(['src/test/_mocks/framerMotion.tsx', 'src/test/_mocks/framerMotion.ts']),
      'no shared framer-motion passthrough mock'
    ).toBe(true);
    const offenders = [
      'src/test/components/tournaments/TournamentComponents.test.tsx',
      'src/test/components/tournaments/TournamentsReadiness.test.tsx',
    ].filter(
      (f) =>
        occurrences([f], /vi\.mock\('framer-motion'/g) > 0 &&
        !fileText(f).includes('__SHARED_MOCKS.framerMotion')
    );
    expect(offenders, 'inline framer-motion mock factories still inline').toEqual([]);

    // mockStateRef dashboard-tab literal (Brutus/Cassius roster + Wolf Pack
    // rival + Dragon's Hearth player) — cloned across three specs.
    const dashState =
      fileText('src/test/_fixtures/dashboardTabState.ts') +
      fileText('src/test/_fixtures/dashboardTabs.ts');
    expect(dashState, 'no shared dashboard-tab mock state fixture').toMatch(
      /dashboardTab|mockTabState|makeTabState/
    );
    const stateOffenders = [
      'src/test/components/dashboard/BriefingTab.test.tsx',
      'src/test/components/dashboard/GazetteTab.test.tsx',
      'src/test/components/gazette/GazetteArticle.test.tsx',
    ].filter(
      (f) =>
        occurrences([f], /\{\s*id:\s*'w1',\s*name:\s*'Brutus'\s*\}/g) > 0 &&
        occurrences([f], /stableName:\s*'Wolf Pack'/g) > 0
    );
    expect(stateOffenders, 'dashboard-tab mockStateRef literals still inline').toEqual([]);
  });

  it('D18: shared makeVenueWarriorAt + makeFlatWarrior helpers exist; local clones drained — MEGAPLAN-D18', () => {
    const arenaTitle = fileText('src/test/_fixtures/arenaTitle.ts');
    expect(arenaTitle, 'arenaTitle fixture must export the venue-warrior builder').toMatch(
      /export function makeVenueWarrior/
    );
    const wrapperRe = /function\s+(warriorAtArena|venueWarrior)\s*\(/g;
    const wrapperOffenders = [
      'src/test/engine/championship/arenaChampionship.test.ts',
      'src/test/engine/championship/arenaChampionshipPass.test.ts',
      'src/test/engine/advisor/crownBidFocus.test.ts',
      'src/test/engine/advisor/rivalRoles.test.ts',
    ].filter((f) => occurrences([f], wrapperRe) > 0);
    expect(wrapperOffenders, 'local venue-warrior wrappers still inline').toEqual([]);

    const fixtureText =
      fileText('src/test/_fixtures/factories.ts') +
      fileText('src/test/_fixtures/determinism.ts');
    expect(fixtureText, 'fixtures must export makeFlatWarrior').toMatch(/makeFlatWarrior/);
    const flatRe =
      /attrs:\s*\{\s*ST:\s*15,\s*CN:\s*15,\s*SZ:\s*15,\s*WT:\s*15,\s*WL:\s*15,\s*SP:\s*15,\s*DF:\s*15\s*\}/g;
    const flatOffenders = [
      'src/test/engine/combat/aiIntentTelemetry.test.ts',
      'src/test/engine/narrative/narrationDeterminism.test.ts',
    ].filter((f) => occurrences([f], flatRe) > 1);
    expect(flatOffenders, 'flat-attrs warrior literals still inline').toEqual([]);
  });

  it('D19: shared equipment-loadout fixture exists; verbatim loadout literals drained — MEGAPLAN-D19', () => {
    expect(
      candidateExists([
        'src/test/_fixtures/equipmentLoadout.ts',
        'src/test/_fixtures/equipment.ts',
      ]),
      'no shared equipment-loadout fixture'
    ).toBe(true);
    const loadoutRe =
      /weapon:\s*'longsword',\s*\n\s*armor:\s*'plate_armor',\s*\n\s*shield:\s*'large_shield'/g;
    const loadoutOffenders = [
      'src/test/components/equipment/EncumbranceBar.test.tsx',
      'src/test/engine/combat/equipmentIntegration.test.ts',
    ].filter((f) => occurrences([f], loadoutRe) > 0);
    expect(loadoutOffenders, 'loadout literals still inline').toEqual([]);
  });
});
