import { runSimulation } from './simulation-harness';
import { setMockIdGenerator } from '@/utils/idUtils';
import { engineEventBus } from '@/engine/core/EventBus';
import type { GameState } from '@/types/state.types';

import { logger } from '@/utils/logger';

async function main() {
  let n = 0;
  setMockIdGenerator(() => `id_${++n}`);
  engineEventBus.clear();
  const { finalState } = await runSimulation({
    weeks: 6,
    seed: 20261101,
    logFrequency: 999,
    ignoreBankruptcy: true,
  });
  const s = finalState as GameState;
  logger.log(
    'SIG',
    s.treasury,
    s.week,
    s.roster.length,
    s.rivals.length,
    (s.arenaHistory ?? []).length
  );
}
main();
