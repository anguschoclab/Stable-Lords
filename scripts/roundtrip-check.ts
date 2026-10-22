/**
 * Save/load schema round trip on a matured world.
 *   bun run scripts/roundtrip-check.ts [weeks=200] [seed=777]
 * Runs the harness, JSON-serializes the final GameState, re-parses through
 * GameStateSchema, and spot-checks megaplan fields survived.
 */
import { runSimulation } from './simulation-harness';
import { GameStateSchema } from '@/schemas/gameStateSchema';
import { stripNonSerializable } from '@/state/serialization';

import { logger } from '@/utils/logger';

const weeks = Number(process.argv[2] ?? 200);
const seed = Number(process.argv[3] ?? 777);

const { finalState } = await runSimulation({
  weeks,
  seed,
  logFrequency: 0,
  ignoreBankruptcy: true,
});

const json = JSON.stringify(stripNonSerializable(finalState));
logger.log(
  `serialized ${(json.length / 1024 / 1024).toFixed(1)} MB at week ${finalState.absoluteWeek}`
);

const result = GameStateSchema.safeParse(JSON.parse(json));
if (!result.success) {
  logger.log('SCHEMA FAIL');
  for (const issue of result.error.issues.slice(0, 15)) {
    logger.log(`  ${issue.path.join('.')} — ${issue.message}`);
  }
  process.exit(1);
}

const rt = result.data;
const founded = rt.rivals.filter((r) => r.owner?.foundedByWarriorId);
logger.log('SCHEMA OK');
logger.log(
  `  rivals=${rt.rivals.length} legacyFounded=${founded.length} founderQueue=${rt.legacyFounderQueue?.length ?? 0}`
);
logger.log(
  `  freeAgents=${rt.freeAgents?.length ?? 0} recruitPool=${rt.recruitPool?.length ?? 0}`
);
const gens = founded.reduce((m: Map<number, number>, r) => {
  const g = r.owner.generation ?? 1;
  m.set(g, (m.get(g) ?? 0) + 1);
  return m;
}, new Map<number, number>());
logger.log(
  `  generations=${[...gens.entries()].map(([g, n]) => `gen${g}:${n}`).join(' ') || 'none'}`
);

// OUT=file.json writes an importable save (start screen → import slot).
if (process.env.OUT) {
  const fs = await import('node:fs');
  fs.writeFileSync(process.env.OUT, json);
  logger.log(`save file: ${process.env.OUT}`);
}
