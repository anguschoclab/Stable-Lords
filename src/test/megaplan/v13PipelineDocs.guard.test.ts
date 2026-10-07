import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { WEEK_PIPELINE_PASSES } from '@/engine/pipeline/services/weekPipeline/passes';

/**
 * MEGAPLAN-V13 pipeline-docs drift guard (test-first, red until Phase 5e):
 *
 * L1/A-finding — docs/PIPELINE_DEPENDENCY_MAP.md's stage table drifted from
 * WEEK_PIPELINE_PASSES: it lists `recruitment` under `world` (code: `core`),
 * `progression` under `content` (code: `world`), omits `arenaChampionship`
 * and `seasonal` entirely, and lists `boutSimulation` as a pass when it is a
 * pre-stage phase. This spec pins the documentation to the declared table so
 * future drift fails the suite.
 */

const REPO = path.resolve(__dirname, '../../..');
const DEP_MAP = readFileSync(path.join(REPO, 'docs/PIPELINE_DEPENDENCY_MAP.md'), 'utf8');
const AUDIT = readFileSync(path.join(REPO, 'docs/PIPELINE_AUDIT.md'), 'utf8');

/** Parse `| \`stage\` | id, id, id |` rows from the dependency map. */
function docStageTable(): Record<string, string[]> {
  const table: Record<string, string[]> = {};
  for (const line of DEP_MAP.split('\n')) {
    const m = line.match(/^\|\s*`(core|world|content)`\s*\|\s*([^|]+)\|/);
    if (!m) continue;
    table[m[1]!] = m[2]!
      .split(',')
      .map((s) => s.trim().replace(/`/g, '').replace(/\s*\(.*\)\s*/g, ''))
      .filter(Boolean);
  }
  return table;
}

const codeStages = (): Record<string, string[]> => {
  const byStage: Record<string, string[]> = { core: [], world: [], content: [] };
  for (const p of WEEK_PIPELINE_PASSES) byStage[p.stage]!.push(p.id);
  return byStage;
};

describe('megaplan V13: pipeline docs match WEEK_PIPELINE_PASSES', () => {
  it('dependency-map stage table lists exactly the declared passes per stage', () => {
    const doc = docStageTable();
    const code = codeStages();
    for (const stage of ['core', 'world', 'content'] as const) {
      expect(
        doc[stage]?.slice().sort(),
        `DEPENDENCY_MAP '${stage}' row drifted from WEEK_PIPELINE_PASSES`
      ).toEqual(code[stage]!.slice().sort());
    }
  });

  it('every declared pass id appears somewhere in the dependency map', () => {
    const docIds = Object.values(docStageTable()).flat();
    for (const p of WEEK_PIPELINE_PASSES) {
      expect(docIds, `pass '${p.id}' missing from DEPENDENCY_MAP stage table`).toContain(p.id);
    }
  });

  it('dependency map names no pass that is not declared (boutSimulation is a phase, not a pass)', () => {
    const declared = new Set(WEEK_PIPELINE_PASSES.map((p) => p.id));
    const docIds = Object.values(docStageTable()).flat();
    const phantom = docIds.filter((id) => !declared.has(id));
    expect(phantom, `phantom passes in DEPENDENCY_MAP: ${phantom.join(', ')}`).toEqual([]);
  });

  it('audit doc does not repeat the stale "15 passes" count', () => {
    expect(AUDIT, 'PIPELINE_AUDIT still claims 15 passes — actual table has 16').not.toMatch(
      /15 passes?|15 staged passes/i
    );
  });
});
