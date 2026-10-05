import { describe, it, expect } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';

/**
 * MEGAPLAN-V13 monolith-restructure spec (test-first, skipped until Phase 4):
 *
 * Every >400-line *logic* file identified by the V11 audit must be split below
 * the target budget — the file either shrinks to ≤400 lines or is replaced by
 * a sibling directory (path absent). Data corpora and generated files are
 * exempt (see fileBudget.test.ts ceilings for the global ratchet).
 */

const REPO = path.resolve(__dirname, '../../..');
const TARGET_BUDGET = 400;

// V11 restructure targets — logic files >400 lines at baseline.
const TARGETS = [
  'src/engine/ai/workers/competitionWorker/boutAcceptance.ts',
  'src/engine/ai/intentEngine.ts',
  'src/engine/combat/resolution/offenseDefense.ts',
  'src/engine/pipeline/passes/RivalStrategyPass.ts',
  'src/engine/combat/resolution/exchangeHelpers/execution/hitExecution.ts',
  'src/engine/combat/mechanics/weatherEffects.ts',
  'src/engine/ai/workers/competitionWorker/offerProcessor.ts',
  'src/engine/ai/plan/coreGenerator.ts',
  'src/engine/matchmaking/tournamentSelection/resolution.ts',
  'src/engine/ai/workers/competitionWorker/boutBidding.ts',
  'src/engine/recruitment/recruitment.ts',
  'src/pages/ArenaHub.tsx',
  'src/components/ledger/TreasuryOverview.tsx',
  'src/engine/simulate/simulationLoop.ts',
  'src/engine/matchmaking/schedulingAssistant.ts',
  'src/engine/advisor/boutOfferAdvisor.ts',
  'src/components/layout/AppHeader.tsx',
];

function lineCount(rel: string): number | null {
  const p = path.join(REPO, rel);
  if (!existsSync(p)) return null;
  return readFileSync(p, 'utf8').split('\n').length;
}

describe('megaplan V11: monolith restructure budgets', () => {
describe('MEGAPLAN-V13', () => {
  it.each(TARGETS.map((t) => [t] as const))(
    '%s is split to ≤ %d lines (or replaced by a directory)',
    (target) => {
      const lines = lineCount(target);
      expect(
        lines === null || lines <= TARGET_BUDGET,
        `${target} is ${lines} lines — split into sibling modules (≤${TARGET_BUDGET})`
      ).toBe(true);
    }
  );
});
});
