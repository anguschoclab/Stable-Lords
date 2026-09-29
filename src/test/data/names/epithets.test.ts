/**
 * Earned epithets — deterministic per-cause tables, rank ordering,
 * milestone evaluation, and legend qualification.
 */
import { describe, it, expect } from 'vitest';
import {
  EPITHET_TABLES,
  EPITHET_RANK,
  epithetFor,
  epithetRankOf,
  milestoneEpithet,
  qualifiesForLegend,
  type EpithetCause,
} from '@/data/names/epithets';

const career = (wins: number, losses: number, kills: number) => ({ wins, losses, kills });

describe('epithetFor', () => {
  it('is deterministic per (cause, warriorId)', () => {
    expect(epithetFor('kill_5', 'w1')).toBe(epithetFor('kill_5', 'w1'));
    expect(epithetFor('arena_champion', 'w1')).toBe(epithetFor('arena_champion', 'w1'));
  });

  it('returns a member of the cause table', () => {
    for (const cause of Object.keys(EPITHET_TABLES) as EpithetCause[]) {
      const e = epithetFor(cause, 'w-test');
      expect(EPITHET_TABLES[cause], `${cause} → ${e}`).toContain(e);
    }
  });

  it('varies across warriors', () => {
    const seen = new Set(
      Array.from({ length: 40 }, (_, i) => epithetFor('kill_5', `w${i}`))
    );
    expect(seen.size).toBeGreaterThan(1);
  });
});

describe('EPITHET_RANK / epithetRankOf', () => {
  it('grand_champion outranks everything', () => {
    const max = Math.max(...Object.values(EPITHET_RANK));
    expect(EPITHET_RANK.grand_champion).toBe(max);
  });

  it('arena_champion outranks milestone and legend epithets', () => {
    expect(EPITHET_RANK.arena_champion).toBeGreaterThan(EPITHET_RANK.kill_10);
    expect(EPITHET_RANK.arena_champion).toBeGreaterThan(EPITHET_RANK.legend);
  });

  it('epithetRankOf resolves stored epithet strings back to ranks', () => {
    const e = epithetFor('kill_5', 'w1');
    expect(epithetRankOf(e)).toBe(EPITHET_RANK.kill_5);
    expect(epithetRankOf(undefined)).toBe(0);
    expect(epithetRankOf('some unknown epithet')).toBe(0);
  });
});

describe('milestoneEpithet', () => {
  it('awards kill milestones at 3/5/10 kills', () => {
    const at3 = milestoneEpithet('wA', career(5, 5, 3));
    const at5 = milestoneEpithet('wA', career(5, 5, 5));
    const at10 = milestoneEpithet('wA', career(5, 5, 10));
    expect(at3).toBeDefined();
    expect(EPITHET_TABLES.kill_3).toContain(at3);
    expect(EPITHET_TABLES.kill_5).toContain(at5);
    expect(EPITHET_TABLES.kill_10).toContain(at10);
  });

  it('awards undefeated milestone at 10-0', () => {
    const e = milestoneEpithet('wB', career(10, 0, 0));
    expect(e).toBeDefined();
    expect(EPITHET_TABLES.undefeated_10).toContain(e);
  });

  it('does not award undefeated once a loss exists', () => {
    // 12-1 record, 0 kills — no milestone qualifies
    expect(milestoneEpithet('wC', career(12, 1, 0))).toBeUndefined();
  });

  it('returns undefined below all thresholds', () => {
    expect(milestoneEpithet('wD', career(2, 3, 0))).toBeUndefined();
  });

  it('never downgrades an existing higher-ranked epithet', () => {
    const champion = epithetFor('arena_champion', 'wE');
    expect(milestoneEpithet('wE', career(5, 5, 3), champion)).toBeUndefined();
  });

  it('upgrades when a higher rank is earned', () => {
    const low = epithetFor('kill_3', 'wF');
    const next = milestoneEpithet('wF', career(6, 4, 5), low);
    expect(next).toBeDefined();
    expect(EPITHET_TABLES.kill_5).toContain(next);
  });
});

describe('qualifiesForLegend', () => {
  it('qualifies distinguished careers', () => {
    expect(qualifiesForLegend({ career: { wins: 50, kills: 0 } })).toBe(true);
    expect(qualifiesForLegend({ career: { wins: 5, kills: 10 } })).toBe(true);
    expect(qualifiesForLegend({ fame: 1500 })).toBe(true);
    expect(qualifiesForLegend({ titles: ['Grand Champion'] })).toBe(true);
  });

  it('does not qualify journeymen', () => {
    expect(qualifiesForLegend({ career: { wins: 10, kills: 0 }, fame: 100 })).toBe(false);
    expect(qualifiesForLegend({})).toBe(false);
  });
});
