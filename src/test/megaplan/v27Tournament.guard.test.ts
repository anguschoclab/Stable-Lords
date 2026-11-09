import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import {
  TOURNAMENT_CLASSES,
  CLASS_INVITE_COUNT,
  STABLE_CLASS_ENTRY_CAP,
  TOURNAMENT_FREEZE_OFFSET,
  classForFE,
} from '@/engine/matchmaking/tournamentSelection/classes';

const SRC = join(__dirname, '../../engine/matchmaking/tournamentSelection');

/**
 * V27 structural ratchet — the class table is the single source of truth for
 * FE bands, and new tournament-selection modules must not reintroduce the
 * retired rank-band tier ids (Gold/Silver/Bronze/Iron) for seasonal play.
 */
describe('V27 tournament-class guard', () => {
  it('class table stays the canon five, contiguous and ordered', () => {
    expect(TOURNAMENT_CLASSES.map((c) => c.id)).toEqual([
      'rookies',
      'apprentices',
      'initiates',
      'adepts',
      'champions',
    ]);
    expect(CLASS_INVITE_COUNT).toBe(16);
    expect(STABLE_CLASS_ENTRY_CAP).toBe(4);
    expect(TOURNAMENT_FREEZE_OFFSET).toBe(2);
  });

  it('classForFE covers every boundary without gaps', () => {
    for (let fe = 0; fe <= 64; fe++) {
      expect(TOURNAMENT_CLASSES.map((c) => c.id)).toContain(classForFE(fe));
    }
  });

  it('new V27 modules never reference the retired rank-band tier ids', () => {
    const v27Modules = ['classes.ts', 'freeze.ts', 'emission.ts'].map((f) => join(SRC, f));
    for (const file of v27Modules) {
      const src = readFileSync(file, 'utf8');
      for (const tier of ["'Gold'", "'Silver'", "'Bronze'", "'Iron'"]) {
        expect(src.includes(tier), `${file} references ${tier}`).toBe(false);
      }
    }
  });

  it('tournamentSelection sources expose no leftover applyTournamentKill', () => {
    const files = readdirSync(join(SRC, 'resolution')).map((f) =>
      join(SRC, 'resolution', f)
    );
    for (const file of files) {
      const src = readFileSync(file, 'utf8');
      expect(src.includes('applyTournamentKill'), `${file} keeps the bespoke kill path`).toBe(
        false
      );
    }
  });
});
