import { runSimulation } from '@/scripts/simulation-harness';
import { setMockIdGenerator } from '@/utils/idUtils';
import { engineEventBus } from '@/engine/core/EventBus';
import { NewsletterFeed } from '@/engine/newsletter/feed';
import type { GameState } from '@/types/state.types';

async function main() {
  let n = 0;
  setMockIdGenerator(() => `id_${++n}`);
  engineEventBus.clear();
  NewsletterFeed.clear();
  const { finalState } = await runSimulation({ weeks: 6, seed: 20261101, logFrequency: 999, ignoreBankruptcy: true });
  const s = finalState as GameState;
  console.log('SIG', s.treasury, s.week, s.roster.length, s.rivals.length, (s.arenaHistory ?? []).length);
}
main();
