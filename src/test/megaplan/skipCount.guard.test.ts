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

// Registered spec-skip tickets — currently empty: every ticketed phase has
// landed and been un-skipped. Register a new MEGAPLAN-* ticket here before
// parking a test-first spec under .skip.
const REGISTERED_SKIP_TICKETS = new Set<string>();

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

  it('no stale phase-pending markers in spec files', () => {
    // Scanned against whole file contents, not line-by-line — stale claims
    // have been observed split across line breaks ("RED until\nthe Phase-5b
    // …") and in "until <work> lands" form, which a narrower per-line check
    // missed after the referenced work had shipped.
    const STALE =
      /\b(?:skipped|red|partially red)\s+until\s+(?:the\s+)?(?:Phase\b|[^.]*?\blands?\b)|\bContract TBD\b/gi;
    const offenders: string[] = [];
    for (const file of testFiles(TEST_ROOT)) {
      if (file === SELF) continue; // this file's regex literals would self-match
      const content = readFileSync(file, 'utf8');
      for (const match of content.matchAll(STALE)) {
        offenders.push(`${file}:${content.slice(0, match.index).split('\n').length}`);
      }
    }
    expect(
      offenders,
      'spec docblock still claims pending phase work that has landed — rewrite as live guard'
    ).toEqual([]);
  });
});
