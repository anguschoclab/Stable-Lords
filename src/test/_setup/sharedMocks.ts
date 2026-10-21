/**
 * Shared vi.mock registry — setup-time bridge for module mocks.
 *
 * `vi.mock` factories cannot reference imports (vitest hoists them above the
 * module body) and cannot dynamically `import()` the shared module either —
 * that pattern deadlocks bun:test (see bunRunnerSafety). The bun-safe shape
 * is a sync factory returning a module-namespace object reachable through a
 * global installed by a setup file, which runs before any test module graph:
 *
 *   vi.mock('@/components/ui/tooltip', () => __SHARED_MOCKS.tooltip);
 *
 * Loaded via setup.node.ts — vitest loads it for every project and bun-setup
 * pulls it in through setup.ts, so both runners see the same registry.
 */
import * as bookmarkButton from '@/test/_mocks/bookmarkButton';
import * as engineProxy from '@/test/_mocks/engineProxy';
import * as entityLinks from '@/test/_mocks/entityLinks';
import * as fightForecast from '@/test/_mocks/fightForecast';
import * as fightForecastEngine from '@/test/_mocks/fightForecastEngine';
import * as gameStoreEmpty from '@/test/_mocks/gameStoreEmpty';
import * as gameStoreSelector from '@/test/_mocks/gameStoreSelector';
import * as opfsArchive from '@/test/_mocks/opfsArchive';
import * as orphanPool from '@/test/_mocks/orphanPool';
import * as paperDoll from '@/test/_mocks/paperDoll';
import * as radixTabs from '@/test/_mocks/radixTabs';
import * as routerLink from '@/test/_mocks/routerLink';
import * as scrollArea from '@/test/_mocks/scrollArea';
import * as sheet from '@/test/_mocks/sheet';
import * as skillCalc from '@/test/_mocks/skillCalc';
import * as sonner from '@/test/_mocks/sonner';
import * as stateSelectors from '@/test/_mocks/stateSelectors';
import * as tooltip from '@/test/_mocks/tooltip';
import * as tournamentEngine from '@/test/_mocks/tournamentEngine';
import * as tournamentHooks from '@/test/_mocks/tournamentHooks';
import * as tournamentScheduleUi from '@/test/_mocks/tournamentScheduleUi';
import * as tournamentSimulate from '@/test/_mocks/tournamentSimulate';
import * as tournamentWarriorLookup from '@/test/_mocks/tournamentWarriorLookup';
import * as patronTokenService from '@/test/_mocks/patronTokenService';
import * as uiBadge from '@/test/_mocks/uiBadge';
import * as uiImperialRing from '@/test/_mocks/uiImperialRing';
import * as uiSectionDivider from '@/test/_mocks/uiSectionDivider';
import * as uiSurface from '@/test/_mocks/uiSurface';
import * as useShallow from '@/test/_mocks/useShallow';
import * as weekPipeline from '@/test/_mocks/weekPipeline';
import * as workerProxy from '@/test/_mocks/workerProxy';

const registry = {
  bookmarkButton,
  engineProxy,
  entityLinks,
  fightForecast,
  fightForecastEngine,
  gameStoreEmpty,
  gameStoreSelector,
  opfsArchive,
  orphanPool,
  paperDoll,
  radixTabs,
  routerLink,
  scrollArea,
  sheet,
  skillCalc,
  sonner,
  stateSelectors,
  tooltip,
  tournamentEngine,
  tournamentHooks,
  tournamentScheduleUi,
  tournamentSimulate,
  tournamentWarriorLookup,
  patronTokenService,
  uiBadge,
  uiImperialRing,
  uiSectionDivider,
  uiSurface,
  useShallow,
  weekPipeline,
  workerProxy,
};

declare global {
  var __SHARED_MOCKS: typeof registry;
}

(globalThis as { __SHARED_MOCKS?: typeof registry }).__SHARED_MOCKS = registry;
