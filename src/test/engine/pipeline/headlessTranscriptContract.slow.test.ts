import { describe, it, expect } from 'vitest';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import { createFreshState } from '@/engine/factories/gameStateFactory';
import { runAutosim } from '@/engine/autosim/autosim';
import { advanceWeek } from '@/engine/pipeline/services/weekPipelineService';

/**
 * MEGAPLAN-V14 headless-transcript contract (L3/A9):
 *
 * Headless execution (autosim, batch spans, `skipTo*`) must produce ZERO bout
 * transcripts — autosim has no `pendingArchives` field, so any ungated
 * `log.push` would accumulate silently inside `deferredBoutLogs` until
 * `truncateState`'s cap drops it. The invariant currently rests on a
 * structural null (`simulateFight` builds `log: headless ? [] : [...]`) plus
 * ~14 distributed `!headless` gates across the bout-sim tree. This file pins
 * BOTH layers: a runtime contract spec and a static guard that fails if a
 * new ungated push site (or an unreviewed file gaining one) appears.
 */

const ENGINE = path.resolve(__dirname, '../../../engine');

function* walk(dir: string): Generator<string> {
  for (const e of readdirSync(dir)) {
    const p = path.join(dir, e);
    if (statSync(p).isDirectory()) yield* walk(p);
    else if (p.endsWith('.ts')) yield p;
  }
}

const PUSH_RE = /\b(?:c\.)?log\.push\s*\(/;

/**
 * Directories whose `log.push` sites write user-facing bout transcripts and
 * therefore must be headless-gated. If bout logging gains a new source file,
 * add it here deliberately — after confirming the site is gated.
 */
const TRANSCRIPT_DIRS = [
  path.join(ENGINE, 'simulate'),
  path.join(ENGINE, 'bout'),
];

/**
 * Per-file count of `log.push` sites, each previously verified gated by
 * `headless` (audit A9, Oct 2026). A new site in a known file, or a push in
 * an unlisted file, fails loudly for review.
 */
const GATED_PUSH_COUNTS: Record<string, number> = {
  'simulate/narrative.ts': 9,
  'simulate/simulationLoop/narrate.ts': 3,
  'simulate/simulationLoop/outcomes.ts': 2,
  'simulate/simulationLoop/beats.ts': 3,
  'simulate/postFight.ts': 1,
};

describe('headless transcript contract', () => {
  it('every transcript push site lives in a known gated file, and that file still gates on headless', () => {
    const found = new Map<string, number>();
    for (const dir of TRANSCRIPT_DIRS) {
      for (const file of walk(dir)) {
        const src = readFileSync(file, 'utf8');
        const hits = src.split('\n').filter((l) => PUSH_RE.test(l)).length;
        if (hits > 0) found.set(path.relative(ENGINE, file), hits);
      }
    }
    for (const [rel, count] of found) {
      expect(
        GATED_PUSH_COUNTS[rel],
        `new log.push site(s) in unregistered file '${rel}' — verify it is headless-gated and add it to GATED_PUSH_COUNTS`
      ).toBe(count);
      // In-file gates are `headless` tokens; a file whose pushes are gated at
      // the call site instead must be pinned in CALL_SITE_GATED with evidence.
      const CALL_SITE_GATED: Record<string, string> = {
        // Intro lines are only constructed by simulateFight when !headless —
        // headless bouts initialise `log` as `[]` (simulateFight.ts).
        'simulate/narrative.ts': 'simulateFight.ts intro-builder conditional',
        // narrateExchangeEvents is invoked under `if (!headless)` in
        // simulationLoop/index.ts — the exchange loop never calls it headless.
        'simulate/simulationLoop/narrate.ts': 'simulationLoop/index.ts `if (!headless)` wrapper',
      };
      const src = readFileSync(path.join(ENGINE, rel), 'utf8');
      if (!CALL_SITE_GATED[rel]) {
        expect(src, `'${rel}' lost its headless gating entirely`).toMatch(/headless/);
      }
    }
    for (const rel of Object.keys(GATED_PUSH_COUNTS)) {
      expect(found.has(rel), `'${rel}' no longer pushes transcript lines — drop its registry entry`).toBe(
        true
      );
    }
  });

  it('headless week advances leave deferredBoutLogs empty', async () => {
    let state = createFreshState('v14-headless-contract', '2026-04-28T09:00:00Z');
    for (let i = 0; i < 4; i++) {
      state = await advanceWeek(state, { headless: true, mutableInput: i > 0 });
      expect(
        state.deferredBoutLogs ?? [],
        `headless week ${i + 1} produced deferred bout logs — an ungated transcript path leaked`
      ).toEqual([]);
    }
  });

  it('headless autosim produces no transcripts across a multi-week run', async () => {
    const state = createFreshState('v14-headless-autosim', '2026-04-28T09:00:00Z');
    const result = await runAutosim(state, { weeksToSim: 6, stopConditions: [] });
    expect(result.weeksSimmed).toBeGreaterThan(0);
    expect(
      result.finalState.deferredBoutLogs ?? [],
      'autosim accumulated deferred bout logs — headless transcript invariant violated'
    ).toEqual([]);
    // Transcripts on arenaHistory entries must also stay absent/empty.
    const leaked = (result.finalState.arenaHistory ?? []).filter(
      (f) => (f.transcript?.length ?? 0) > 0
    );
    expect(leaked, 'headless autosim left transcripts on arenaHistory entries').toEqual([]);
  });
});
