import { describe, it, expect } from 'vitest';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';

/**
 * MEGAPLAN-TEST skip-count guard.
 *
 * The test-first mandate allows spec-encoding tests to land `.skip`ped before
 * their implementing phase — but only against a named MEGAPLAN ticket, and
 * the count can only shrink as phases un-skip their specs. A stray `.skip`
 * anywhere else, or a megaplan skip without a ticket id, fails here so no
 * test can be silently parked and forgotten.
 *
 * Rules:
 *   1. No hard skip (`describe.skip(` / `it.skip(` / `test.skip(` / `x...(`)
 *      may appear in src/test OUTSIDE src/test/megaplan/.
 *   2. Inside megaplan, every hard skip must sit on a line naming a
 *      `MEGAPLAN-` ticket.
 *   3. Megaplan hard-skip count must not exceed the registered ticket set
 *      below. Removing a skip as its phase lands is always safe; adding one
 *      requires registering the ticket here.
 */

const TEST_ROOT = path.resolve(__dirname, '..');

// Registered spec-skip tickets (un-skip as the owning phase lands).
const REGISTERED_SKIP_TICKETS = new Set([
  'MEGAPLAN-G1', // Style Archives browser
  'MEGAPLAN-G2', // favorites charting toolkit
  'MEGAPLAN-G3', // tournament prep mode
  'MEGAPLAN-L1', // per-route primary CTA
  'MEGAPLAN-L2', // PageFrame/PageHeader conformance
  'MEGAPLAN-V11', // dead-surface elimination (schema barrels, aliases, dead hooks/files)
  'MEGAPLAN-V12', // duplicate consolidation (shared helpers + standings primitive)
  'MEGAPLAN-V13', // monolith restructure budgets (>400-line targets)
  'MEGAPLAN-V14', // wiring contracts (constants liveness)
]);

const HARD_SKIP = /\b(?:describe|it|test)\.skip\s*\(|\bx(?:describe|it|test)\s*\(/;

function* testFiles(dir: string): Generator<string> {
  for (const entry of readdirSync(dir)) {
    const full = path.join(dir, entry);
    if (statSync(full).isDirectory()) yield* testFiles(full);
    else if (/\.(?:test|spec)\.[tj]sx?$/.test(entry)) yield full;
  }
}

describe('megaplan: skip-count guard', () => {
  const SELF = __filename;

  it('no hard skips outside src/test/megaplan', () => {
    const offenders: string[] = [];
    for (const file of testFiles(TEST_ROOT)) {
      if (file.includes('/megaplan/') || file === SELF) continue;
      readFileSync(file, 'utf8')
        .split('\n')
        .forEach((line, i) => {
          if (HARD_SKIP.test(line)) offenders.push(`${file}:${i + 1}`);
        });
    }
    expect(
      offenders,
      'hard .skip found outside megaplan — give it a MEGAPLAN- ticket or fix the test'
    ).toEqual([]);
  });

  it('every megaplan skip names a registered MEGAPLAN- ticket', () => {
    const dir = path.join(TEST_ROOT, 'megaplan');
    const unregistered: string[] = [];
    let total = 0;
    for (const file of testFiles(dir)) {
      if (file === SELF) continue;
      readFileSync(file, 'utf8')
        .split('\n')
        .forEach((line, i) => {
          if (!HARD_SKIP.test(line)) return;
          total++;
          const ticket = line.match(/MEGAPLAN-[A-Z]\d+/)?.[0];
          if (!ticket || !REGISTERED_SKIP_TICKETS.has(ticket))
            unregistered.push(`${file}:${i + 1} → ${ticket ?? 'no ticket'}`);
        });
    }
    expect(unregistered, 'megaplan .skip without a registered MEGAPLAN- ticket').toEqual([]);
    expect(
      total,
      `megaplan skip count grew past the ${REGISTERED_SKIP_TICKETS.size} registered tickets`
    ).toBeLessThanOrEqual(REGISTERED_SKIP_TICKETS.size);
  });
});
