import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import path from 'node:path';

/**
 * V30 surface guard — pins the harmonization's dead-code removals and
 * single-emitter consolidations so the footguns can't silently regrow.
 */
const REPO = path.resolve(__dirname, '../../..');
const read = (rel: string) => readFileSync(path.join(REPO, rel), 'utf8');

function* walk(dir: string): Generator<string> {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory() && !e.name.startsWith('.') && e.name !== 'node_modules') yield* walk(p);
    else if (/\.tsx?$/.test(e.name)) yield p;
  }
}

describe('v30Surface guard', () => {
  it('careerUpdate no longer exports the dead updateWarriorAfterBout (opposite-semantics footgun)', () => {
    const src = read('src/engine/warrior/careerUpdate.ts');
    expect(src).not.toMatch(/export function updateWarriorAfterBout/);
  });

  it('worldSlice no longer carries the dead appendFight/updateWarriorStatus actions', () => {
    // The file that hosted them must stay deleted — it contained only the
    // two dead actions, so its return would reintroduce both.
    expect(existsSync(path.join(REPO, 'src/state/slices/worldSlice/combatActions.ts'))).toBe(false);
    const types = read('src/state/slices/worldSlice/types.ts');
    expect(types).not.toMatch(/appendFight:/);
    expect(types).not.toMatch(/updateWarriorStatus:/);
  });

  it('exactly one extractWeekSummary exists engine-wide (namesake collision retired)', () => {
    let count = 0;
    for (const f of walk(path.join(REPO, 'src'))) {
      const rel = path.relative(REPO, f).split(path.sep).join('/');
      if (rel.includes('/test/')) continue;
      const src = readFileSync(f, 'utf8');
      count += (src.match(/function extractWeekSummary/g) ?? []).length;
    }
    expect(count).toBe(1);
  });

  it('offense/defense args are a single interface (alias only)', () => {
    const src = read('src/engine/combat/resolution/offenseDefense/types.ts');
    // Post-consolidation one of the pair is a type alias — no second
    // identical interface may regrow.
    const interfaces =
      src.match(/interface (OffenseDefenseArgs|ResolveCombatOffenseDefenseArgs)/g) ?? [];
    expect(interfaces.length).toBe(1);
  });

  it('the tournament path consumes the shared stampLastBoutWeek emitter', () => {
    const src = read('src/engine/matchmaking/tournamentSelection/resolution/results.ts');
    expect(src).not.toMatch(/function lastBoutWeekImpact/);
    const pipeline = read('src/engine/bout/services/boutResolution.ts');
    expect(pipeline).not.toMatch(/function rosterUpdateImpacts/);
  });
});
