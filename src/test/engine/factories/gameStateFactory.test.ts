import { describe, it, expect } from 'vitest';
import { createFreshState } from '@/engine/factories/gameStateFactory';
import { SAVE_STATE_VERSION } from '@/constants/core/core';
import { DEFAULT_PROGRESSION } from '@/constants/progression';
import { BACKSTORY_IDS } from '@/data/backstories';
import { FightingStyle } from '@/types/shared.types';
import type { OwnerPersonality } from '@/types/state.types';

const VALID_PERSONALITIES: OwnerPersonality[] = [
  'Aggressive',
  'Methodical',
  'Showman',
  'Pragmatic',
  'Tactician',
];

const INITIAL_STYLES = [
  FightingStyle.AimedBlow,
  FightingStyle.BashingAttack,
  FightingStyle.LungingAttack,
  FightingStyle.SlashingAttack,
  FightingStyle.StrikingAttack,
  FightingStyle.WallOfSteel,
];

const RIVAL_NAME_POOL = [
  'Shadow Blades',
  'Crimson Guard',
  'Golden Lions',
  'Silent Storm',
  'Gilded Fang',
  'Onyx Shield',
  'Iron Crown',
  'Azure Rose',
  'Nightfall',
  'Ebon Hand',
  'Vanguard',
];

const SEED = 'test-seed-123';

describe('createFreshState', () => {
  describe('core state structure', () => {
    const state = createFreshState(SEED);

    it('sets meta.gameName to "Stable Lords"', () => {
      expect(state.meta.gameName).toBe('Stable Lords');
    });

    it('sets meta.version to SAVE_STATE_VERSION', () => {
      expect(state.meta.version).toBe(SAVE_STATE_VERSION);
    });

    it('sets meta.createdAt to default param', () => {
      expect(state.meta.createdAt).toBe('2024-01-01T00:00:00.000Z');
    });

    it('sets meta.createdAt to custom param', () => {
      const custom = '2025-06-15T12:30:00.000Z';
      const s = createFreshState(SEED, custom);
      expect(s.meta.createdAt).toBe(custom);
    });

    it('sets ftueComplete to false', () => {
      expect(state.ftueComplete).toBe(false);
    });

    it('sets ftueStep to 0', () => {
      expect(state.ftueStep).toBe(0);
    });

    it('sets isFTUE to true', () => {
      expect(state.isFTUE).toBe(true);
    });

    it('sets coachDismissed to empty array', () => {
      expect(state.coachDismissed).toEqual([]);
    });

    it('sets player.id to "stable-player"', () => {
      expect(state.player.id).toBe('stable-player');
    });

    it('sets player.name to "You"', () => {
      expect(state.player.name).toBe('You');
    });

    it('sets player.stableName to "Dragon\'s Hearth"', () => {
      expect(state.player.stableName).toBe("Dragon's Hearth");
    });

    it('sets player.fame to 0', () => {
      expect(state.player.fame).toBe(0);
    });

    it('sets player.renown to 0', () => {
      expect(state.player.renown).toBe(0);
    });

    it('sets player.titles to 0', () => {
      expect(state.player.titles).toBe(0);
    });

    it('sets fame to 0', () => {
      expect(state.fame).toBe(0);
    });

    it('sets popularity to 0', () => {
      expect(state.popularity).toBe(0);
    });

    it('sets treasury to 1000', () => {
      expect(state.treasury).toBe(1000);
    });

    it('sets ledger to empty array', () => {
      expect(state.ledger).toEqual([]);
    });

    it('sets week to 1', () => {
      expect(state.week).toBe(1);
    });

    it('sets year to 1', () => {
      expect(state.year).toBe(1);
    });

    it('sets day to 0', () => {
      expect(state.day).toBe(0);
    });

    it('sets phase to "planning"', () => {
      expect(state.phase).toBe('planning');
    });

    it('sets season to "Spring"', () => {
      expect(state.season).toBe('Spring');
    });

    it('sets weather to "Clear"', () => {
      expect(state.weather).toBe('Clear');
    });

    it('sets crowdMood to "Calm"', () => {
      expect(state.crowdMood).toBe('Calm');
    });

    it('sets roster to empty array', () => {
      expect(state.roster).toEqual([]);
    });

    it('sets graveyard to empty array', () => {
      expect(state.graveyard).toEqual([]);
    });

    it('sets retired to empty array', () => {
      expect(state.retired).toEqual([]);
    });

    it('sets arenaHistory to empty array', () => {
      expect(state.arenaHistory).toEqual([]);
    });

    it('sets newsletter to empty array', () => {
      expect(state.newsletter).toEqual([]);
    });

    it('sets gazettes to empty array', () => {
      expect(state.gazettes).toEqual([]);
    });

    it('sets hallOfFame to empty array', () => {
      expect(state.hallOfFame).toEqual([]);
    });

    it('sets tournaments to empty array', () => {
      expect(state.tournaments).toEqual([]);
    });

    it('sets trainers to empty array', () => {
      expect(state.trainers).toEqual([]);
    });

    it('sets hiringPool to empty array', () => {
      expect(state.hiringPool).toEqual([]);
    });

    it('sets trainingAssignments to empty array', () => {
      expect(state.trainingAssignments).toEqual([]);
    });

    it('sets seasonalGrowth to empty array', () => {
      expect(state.seasonalGrowth).toEqual([]);
    });

    it('sets scoutReports to empty array', () => {
      expect(state.scoutReports).toEqual([]);
    });

    it('sets restStates to empty array', () => {
      expect(state.restStates).toEqual([]);
    });

    it('sets rivalries to empty array', () => {
      expect(state.rivalries).toEqual([]);
    });

    it('sets matchHistory to empty array', () => {
      expect(state.matchHistory).toEqual([]);
    });

    it('sets playerChallenges to empty array', () => {
      expect(state.playerChallenges).toEqual([]);
    });

    it('sets playerAvoids to empty array', () => {
      expect(state.playerAvoids).toEqual([]);
    });

    it('sets ownerGrudges to empty array', () => {
      expect(state.ownerGrudges).toEqual([]);
    });

    it('sets insightTokens to empty array', () => {
      expect(state.insightTokens).toEqual([]);
    });

    it('sets moodHistory to empty array', () => {
      expect(state.moodHistory).toEqual([]);
    });

    it('sets unacknowledgedDeaths to empty array', () => {
      expect(state.unacknowledgedDeaths).toEqual([]);
    });

    it('sets awards to empty array', () => {
      expect(state.awards).toEqual([]);
    });

    it('sets bookmarks to empty array', () => {
      expect(state.bookmarks).toEqual([]);
    });

    it('sets rosterBonus to 0', () => {
      expect(state.rosterBonus).toBe(0);
    });

    it('sets isTournamentWeek to false', () => {
      expect(state.isTournamentWeek).toBe(false);
    });

    it('sets activeTournamentId to undefined', () => {
      expect(state.activeTournamentId).toBeUndefined();
    });

    it('sets promoters to empty object', () => {
      expect(state.promoters).toEqual({});
    });

    it('sets boutOffers to empty object', () => {
      expect(state.boutOffers).toEqual({});
    });

    it('sets realmRankings to empty object', () => {
      expect(state.realmRankings).toEqual({});
    });

    it('sets progression to DEFAULT_PROGRESSION', () => {
      expect(state.progression).toEqual(DEFAULT_PROGRESSION);
    });

    it('sets progression.status to "active"', () => {
      expect(state.progression.status).toBe('active');
    });

    it('sets progression.stableStanding to 0', () => {
      expect(state.progression.stableStanding).toBe(0);
    });

    it('sets progression.totalStables to 0', () => {
      expect(state.progression.totalStables).toBe(0);
    });

    it('sets progression.objectives to 5 objectives', () => {
      expect(state.progression.objectives).toHaveLength(5);
    });

    it('sets all progression objectives completed to false', () => {
      expect(state.progression.objectives.every((o) => o.completed === false)).toBe(true);
    });
  });

  describe('rivals generation', () => {
    const state = createFreshState(SEED);

    it('generates exactly 4 rivals', () => {
      expect(state.rivals).toHaveLength(4);
    });

    it('gives each rival a unique id', () => {
      const ids = state.rivals.map((r) => r.id);
      expect(new Set(ids).size).toBe(4);
    });

    it('sets each rival fame to 100', () => {
      expect(state.rivals.every((r) => r.fame === 100)).toBe(true);
    });

    it('sets each rival treasury in [1500, 2500)', () => {
      expect(state.rivals.every((r) => r.treasury >= 1500 && r.treasury < 2500)).toBe(true);
    });

    it('prefixes each owner name with "Lord "', () => {
      expect(state.rivals.every((r) => r.owner.name.startsWith('Lord '))).toBe(true);
    });

    it('sets owner.stableName from the rival name pool', () => {
      expect(state.rivals.every((r) => RIVAL_NAME_POOL.includes(r.owner.stableName))).toBe(true);
    });

    it('sets each owner.personality to a valid value', () => {
      expect(state.rivals.every((r) => VALID_PERSONALITIES.includes(r.owner.personality!))).toBe(true);
    });

    it('sets each owner.backstoryId to a valid BackstoryId', () => {
      expect(state.rivals.every((r) => BACKSTORY_IDS.includes(r.owner.backstoryId!))).toBe(true);
    });

    it('sets each owner.fame to 100', () => {
      expect(state.rivals.every((r) => r.owner.fame === 100)).toBe(true);
    });

    it('sets each owner.renown to 10', () => {
      expect(state.rivals.every((r) => r.owner.renown === 10)).toBe(true);
    });

    it('sets each owner.titles to 0', () => {
      expect(state.rivals.every((r) => r.owner.titles === 0)).toBe(true);
    });

    it('sets each owner.age in [35, 60)', () => {
      expect(state.rivals.every((r) => r.owner.age! >= 35 && r.owner.age! < 60)).toBe(true);
    });

    it('sets each owner.generation to 0', () => {
      expect(state.rivals.every((r) => r.owner.generation === 0)).toBe(true);
    });

    it('sets each rival roster to empty array', () => {
      expect(state.rivals.every((r) => r.roster.length === 0)).toBe(true);
    });

    it('sets each rival ledger to empty array', () => {
      expect(state.rivals.every((r) => r.ledger.length === 0)).toBe(true);
    });

    it('sets each rival trainingAssignments to empty array', () => {
      expect(state.rivals.every((r) => r.trainingAssignments.length === 0)).toBe(true);
    });

    it('selects 4 unique rival stable names', () => {
      const names = state.rivals.map((r) => r.owner.stableName);
      expect(new Set(names).size).toBe(4);
    });

    it('gives each rival owner a unique id', () => {
      const ownerIds = state.rivals.map((r) => r.owner.id);
      expect(new Set(ownerIds).size).toBe(4);
    });
  });

  describe('recruit pool generation', () => {
    const state = createFreshState(SEED);
    const pool = state.recruitPool;

    it('generates exactly 12 recruits', () => {
      expect(pool).toHaveLength(12);
    });

    it('names recruits "Recruit 1" through "Recruit 12"', () => {
      pool.forEach((r, i) => {
        expect(r.name).toBe(`Recruit ${i + 1}`);
      });
    });

    it('sets each tier to "Common"', () => {
      expect(pool.every((r) => r.tier === 'Common')).toBe(true);
    });

    it('sets each cost in [150, 300)', () => {
      expect(pool.every((r) => r.cost >= 150 && r.cost < 300)).toBe(true);
    });

    it('sets each addedWeek to 1', () => {
      expect(pool.every((r) => r.addedWeek === 1)).toBe(true);
    });

    it('sets each lore to the origin[0] string', () => {
      expect(pool.every((r) => r.lore === 'Found fighting for scraps in the pit districts.')).toBe(true);
    });

    it('assigns a valid fighting style from the 6 initial styles', () => {
      expect(pool.every((r) => INITIAL_STYLES.includes(r.style))).toBe(true);
    });

    it('uses each of the 6 styles exactly twice', () => {
      for (const style of INITIAL_STYLES) {
        expect(pool.filter((r) => r.style === style)).toHaveLength(2);
      }
    });

    it('keeps all 7 attributes in [7, 13] for each recruit', () => {
      for (const r of pool) {
        for (const key of ['ST', 'CN', 'SZ', 'WT', 'WL', 'SP', 'DF'] as const) {
          expect(r.attributes[key]).toBeGreaterThanOrEqual(7);
          expect(r.attributes[key]).toBeLessThanOrEqual(13);
        }
      }
    });

    it('generates a potential object with all 7 attribute keys', () => {
      for (const r of pool) {
        for (const key of ['ST', 'CN', 'SZ', 'WT', 'WL', 'SP', 'DF'] as const) {
          expect(r.potential[key]).toBeDefined();
          expect(typeof r.potential[key]).toBe('number');
        }
      }
    });

    it('sets each potential value >= corresponding attribute value', () => {
      for (const r of pool) {
        for (const key of ['ST', 'CN', 'SZ', 'WT', 'WL', 'SP', 'DF'] as const) {
          expect(r.potential[key]).toBeGreaterThanOrEqual(r.attributes[key]);
        }
      }
    });

    it('clamps each potential value to [8, 25]', () => {
      for (const r of pool) {
        for (const key of ['ST', 'CN', 'SZ', 'WT', 'WL', 'SP', 'DF'] as const) {
          expect(r.potential[key]).toBeGreaterThanOrEqual(8);
          expect(r.potential[key]).toBeLessThanOrEqual(25);
        }
      }
    });

    it('generates baseSkills with all 6 skill keys', () => {
      for (const r of pool) {
        for (const key of ['ATT', 'PAR', 'DEF', 'INI', 'RIP', 'DEC'] as const) {
          expect(r.baseSkills[key]).toBeDefined();
          expect(typeof r.baseSkills[key]).toBe('number');
        }
      }
    });

    it('generates derivedStats with hp, endurance, damage, encumbrance', () => {
      for (const r of pool) {
        expect(r.derivedStats.hp).toBeDefined();
        expect(r.derivedStats.endurance).toBeDefined();
        expect(r.derivedStats.damage).toBeDefined();
        expect(r.derivedStats.encumbrance).toBeDefined();
      }
    });

    it('generates luckfactor with all 6 skill keys', () => {
      for (const r of pool) {
        for (const key of ['ATT', 'PAR', 'DEF', 'INI', 'RIP', 'DEC'] as const) {
          expect(r.luckfactor[key]).toBeDefined();
          expect(typeof r.luckfactor[key]).toBe('number');
        }
      }
    });

    it('generates a favorites object for each recruit', () => {
      expect(pool.every((r) => r.favorites)).toBe(true);
    });

    it('generates a traits array for each recruit', () => {
      expect(pool.every((r) => Array.isArray(r.traits))).toBe(true);
    });

    it('sets trainability in [0.4, 0.9) for each recruit', () => {
      for (const r of pool) {
        expect((r as any).trainability).toBeGreaterThanOrEqual(0.4);
        expect((r as any).trainability).toBeLessThan(0.9);
      }
    });

    it('sets age in [18, 25] for each recruit', () => {
      for (const r of pool) {
        expect((r as any).age).toBeGreaterThanOrEqual(18);
        expect((r as any).age).toBeLessThanOrEqual(25);
      }
    });

    it('sets status to "Active" for each recruit', () => {
      expect(pool.every((r) => (r as any).status === 'Active')).toBe(true);
    });

    it('sets champion to false for each recruit', () => {
      expect(pool.every((r) => (r as any).champion === false)).toBe(true);
    });

    it('sets career to {wins:0, losses:0, kills:0} for each recruit', () => {
      expect(pool.every((r) => (r as any).career.wins === 0 && (r as any).career.losses === 0 && (r as any).career.kills === 0)).toBe(true);
    });

    it('generates an equipment object for each recruit', () => {
      expect(pool.every((r) => (r as any).equipment)).toBe(true);
    });

    it('gives each recruit a unique id', () => {
      const ids = pool.map((r) => r.id);
      expect(new Set(ids).size).toBe(12);
    });
  });

  describe('determinism', () => {
    it('same seed produces deep-equal state', () => {
      const s1 = createFreshState(SEED);
      const s2 = createFreshState(SEED);
      expect(s1).toEqual(s2);
    });

    it('different seeds produce different rival names', () => {
      const s1 = createFreshState('alpha');
      const s2 = createFreshState('beta');
      const names1 = s1.rivals.map((r) => r.owner.stableName);
      const names2 = s2.rivals.map((r) => r.owner.stableName);
      expect(names1).not.toEqual(names2);
    });

    it('different seeds produce different recruit attributes', () => {
      const s1 = createFreshState('alpha');
      const s2 = createFreshState('beta');
      const attrs1 = s1.recruitPool.map((r) => r.attributes.ST);
      const attrs2 = s2.recruitPool.map((r) => r.attributes.ST);
      expect(attrs1).not.toEqual(attrs2);
    });
  });

  describe('custom createdAt', () => {
    it('custom createdAt appears in meta.createdAt', () => {
      const custom = '2025-12-25T00:00:00.000Z';
      const s = createFreshState(SEED, custom);
      expect(s.meta.createdAt).toBe(custom);
    });

    it('custom createdAt does not affect other fields (same seed)', () => {
      const s1 = createFreshState(SEED);
      const s2 = createFreshState(SEED, '2099-01-01T00:00:00.000Z');
      const { meta: m1, ...rest1 } = s1;
      const { meta: m2, ...rest2 } = s2;
      expect(rest1).toEqual(rest2);
    });
  });
});
