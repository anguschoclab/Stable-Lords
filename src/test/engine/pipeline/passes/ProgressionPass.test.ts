import { describe, it, expect, beforeEach } from 'vitest';
import { createFreshState } from '@/engine/factories/gameStateFactory';
import { populateTestState } from '@/test/_setup/testHelpers';
import { runProgressionPass } from '@/engine/pipeline/passes/ProgressionPass';
import { DEFAULT_PROGRESSION } from '@/constants/progression';
import type { GameState, TournamentEntry, AnnualAward } from '@/types/state.types';
import type { TournamentId, WarriorId } from '@/types/shared.types';
import { FightingStyle } from '@/types/shared.types';
import { makeWarrior } from '@/engine/factories/warriorFactory';

describe('ProgressionPass', () => {
  let state: GameState;

  beforeEach(() => {
    state = createFreshState('test-seed');
    state = populateTestState(state);
  });

  describe('Stable standing computation', () => {
    it('player highest fame → standing 1', () => {
      state.fame = 999;
      state.rivals.forEach((r) => {
        r.fame = 100;
      });

      const impact = runProgressionPass(state, 5, 1);

      expect(impact.progression).toBeDefined();
      expect(impact.progression!.stableStanding).toBe(1);
      expect(impact.progression!.totalStables).toBe(state.rivals.length + 1);
    });

    it('player mid fame → correct rank', () => {
      state.fame = 250;
      state.rivals[0]!.fame = 300;
      state.rivals[1]!.fame = 200;
      state.rivals[2]!.fame = 100;
      state.rivals[3]!.fame = 50;
      state.rivals[4]!.fame = 400;
      state.rivals.slice(5).forEach((r) => {
        r.fame = 10;
      });

      const impact = runProgressionPass(state, 5, 1);

      expect(impact.progression!.stableStanding).toBe(3);
    });

    it('player lowest fame → standing = totalStables', () => {
      state.fame = 0;
      state.rivals.forEach((r) => {
        r.fame = 100;
      });

      const impact = runProgressionPass(state, 5, 1);

      expect(impact.progression!.stableStanding).toBe(state.rivals.length + 1);
    });

    it('deterministic tie-break — same fame → titles → stableId', () => {
      state.fame = 100;
      state.player.titles = 7;
      state.rivals = [
        {
          id: 'rival_a' as any,
          owner: {
            id: 'rival_a' as any,
            name: 'A',
            stableName: 'A',
            fame: 100,
            renown: 0,
            titles: 3,
          },
          fame: 100,
          roster: [],
          treasury: 0,
          ledger: [],
          trainingAssignments: [],
        },
        {
          id: 'rival_z' as any,
          owner: {
            id: 'rival_z' as any,
            name: 'Z',
            stableName: 'Z',
            fame: 100,
            renown: 0,
            titles: 5,
          },
          fame: 100,
          roster: [],
          treasury: 0,
          ledger: [],
          trainingAssignments: [],
        },
      ];

      const impact = runProgressionPass(state, 5, 1);

      expect(impact.progression!.stableStanding).toBe(1);
    });
  });

  describe('TOP_10_STABLE', () => {
    it('completes when standing <= 10', () => {
      state.fame = 500;
      state.rivals.forEach((r, i) => {
        r.fame = i < 5 ? 600 : 50;
      });

      const impact = runProgressionPass(state, 5, 1);
      const obj = impact.progression!.objectives.find((o) => o.id === 'TOP_10_STABLE');

      expect(obj!.completed).toBe(true);
      expect(obj!.completedWeek).toBeDefined();
      expect(obj!.completedYear).toBeDefined();
    });
  });

  describe('TOP_3_STABLE', () => {
    it('completes when standing <= 3', () => {
      state.fame = 300;
      state.rivals[0]!.fame = 200;
      state.rivals[1]!.fame = 100;
      state.rivals[2]!.fame = 50;
      state.rivals[3]!.fame = 400;
      state.rivals[4]!.fame = 350;
      state.rivals.slice(5).forEach((r) => {
        r.fame = 10;
      });

      const impact = runProgressionPass(state, 5, 1);
      const obj = impact.progression!.objectives.find((o) => o.id === 'TOP_3_STABLE');

      expect(obj!.completed).toBe(true);
    });

    it('does NOT complete when standing > 3', () => {
      state.fame = 50;
      state.rivals.forEach((r, i) => {
        r.fame = 200 + i * 10;
      });

      const impact = runProgressionPass(state, 5, 1);
      const obj = impact.progression!.objectives.find((o) => o.id === 'TOP_3_STABLE');

      expect(obj!.completed).toBe(false);
    });
  });

  describe('FIRST_TOURNAMENT_WIN', () => {
    it('completes when champion is player warrior (by NAME)', () => {
      const warrior = makeWarrior('w1' as WarriorId, 'Slasher Sam', FightingStyle.StrikingAttack, {
        ST: 10,
        CN: 10,
        SZ: 10,
        WT: 10,
        WL: 10,
        SP: 10,
        DF: 10,
      });
      state.roster = [warrior];
      state.tournaments = [
        {
          id: 't1' as TournamentId,
          season: 'Spring',
          week: 13,
          tierId: 'Gold',
          name: 'Test Cup',
          bracket: [],
          participants: [],
          champion: 'Slasher Sam',
          completed: true,
        } as TournamentEntry,
      ];

      const impact = runProgressionPass(state, 14, 1);
      const obj = impact.progression!.objectives.find((o) => o.id === 'FIRST_TOURNAMENT_WIN');

      expect(obj!.completed).toBe(true);
    });

    it('does NOT complete when champion is rival warrior', () => {
      const playerWarrior = makeWarrior(
        'w1' as WarriorId,
        'Player One',
        FightingStyle.StrikingAttack,
        {
          ST: 10,
          CN: 10,
          SZ: 10,
          WT: 10,
          WL: 10,
          SP: 10,
          DF: 10,
        }
      );
      state.roster = [playerWarrior];
      state.tournaments = [
        {
          id: 't1' as TournamentId,
          season: 'Spring',
          week: 13,
          tierId: 'Gold',
          name: 'Test Cup',
          bracket: [],
          participants: [],
          champion: 'Rival 0 Warrior 0',
          completed: true,
        } as TournamentEntry,
      ];

      const impact = runProgressionPass(state, 14, 1);
      const obj = impact.progression!.objectives.find((o) => o.id === 'FIRST_TOURNAMENT_WIN');

      expect(obj!.completed).toBe(false);
    });

    it('does NOT complete for incomplete tournament', () => {
      state.tournaments = [
        {
          id: 't1' as TournamentId,
          season: 'Spring',
          week: 13,
          tierId: 'Gold',
          name: 'Test Cup',
          bracket: [],
          participants: [],
          champion: undefined,
          completed: false,
        } as TournamentEntry,
      ];

      const impact = runProgressionPass(state, 14, 1);
      const obj = impact.progression!.objectives.find((o) => o.id === 'FIRST_TOURNAMENT_WIN');

      expect(obj!.completed).toBe(false);
    });
  });

  describe('HALL_OF_FAMER', () => {
    it('completes when player warrior has WARRIOR_OF_YEAR award', () => {
      const warrior = makeWarrior('w1' as WarriorId, 'Champ', FightingStyle.StrikingAttack, {
        ST: 10,
        CN: 10,
        SZ: 10,
        WT: 10,
        WL: 10,
        SP: 10,
        DF: 10,
      });
      state.roster = [warrior];
      state.awards = [
        {
          year: 1,
          type: 'WARRIOR_OF_YEAR',
          warriorId: 'w1' as WarriorId,
          warriorName: 'Champ',
          stableId: 'stable-player',
          stableName: "Dragon's Hearth",
          value: 20,
          reason: 'Best warrior',
        } as AnnualAward,
      ];

      const impact = runProgressionPass(state, 1, 2);
      const obj = impact.progression!.objectives.find((o) => o.id === 'HALL_OF_FAMER');

      expect(obj!.completed).toBe(true);
    });

    it('completes when player warrior has KILLER_OF_YEAR award', () => {
      const warrior = makeWarrior('w1' as WarriorId, 'Killer', FightingStyle.StrikingAttack, {
        ST: 10,
        CN: 10,
        SZ: 10,
        WT: 10,
        WL: 10,
        SP: 10,
        DF: 10,
      });
      state.roster = [warrior];
      state.awards = [
        {
          year: 1,
          type: 'KILLER_OF_YEAR',
          warriorId: 'w1' as WarriorId,
          warriorName: 'Killer',
          stableId: 'stable-player',
          stableName: "Dragon's Hearth",
          value: 10,
          reason: 'Most kills',
        } as AnnualAward,
      ];

      const impact = runProgressionPass(state, 1, 2);
      const obj = impact.progression!.objectives.find((o) => o.id === 'HALL_OF_FAMER');

      expect(obj!.completed).toBe(true);
    });

    it('does NOT complete for rival warrior award', () => {
      const playerWarrior = makeWarrior('w1' as WarriorId, 'Player', FightingStyle.StrikingAttack, {
        ST: 10,
        CN: 10,
        SZ: 10,
        WT: 10,
        WL: 10,
        SP: 10,
        DF: 10,
      });
      state.roster = [playerWarrior];
      state.awards = [
        {
          year: 1,
          type: 'WARRIOR_OF_YEAR',
          warriorId: 'r_0_w_0' as WarriorId,
          warriorName: 'Rival Warrior',
          stableId: 'rival_stable_0',
          stableName: 'Rival Stable 0',
          value: 20,
          reason: 'Best warrior',
        } as AnnualAward,
      ];

      const impact = runProgressionPass(state, 1, 2);
      const obj = impact.progression!.objectives.find((o) => o.id === 'HALL_OF_FAMER');

      expect(obj!.completed).toBe(false);
    });

    it('does NOT complete for CLASS_MVP award', () => {
      const warrior = makeWarrior('w1' as WarriorId, 'Champ', FightingStyle.StrikingAttack, {
        ST: 10,
        CN: 10,
        SZ: 10,
        WT: 10,
        WL: 10,
        SP: 10,
        DF: 10,
      });
      state.roster = [warrior];
      state.awards = [
        {
          year: 1,
          type: 'CLASS_MVP',
          warriorId: 'w1' as WarriorId,
          warriorName: 'Champ',
          stableId: 'stable-player',
          stableName: "Dragon's Hearth",
          value: 15,
          reason: 'Class MVP',
        } as AnnualAward,
      ];

      const impact = runProgressionPass(state, 1, 2);
      const obj = impact.progression!.objectives.find((o) => o.id === 'HALL_OF_FAMER');

      expect(obj!.completed).toBe(false);
    });
  });

  describe('REALM_CHAMPION', () => {
    it('completes at year boundary when standing === 1', () => {
      state.fame = 999;
      state.rivals.forEach((r) => {
        r.fame = 100;
      });

      const impact = runProgressionPass(state, 1, 2);
      const obj = impact.progression!.objectives.find((o) => o.id === 'REALM_CHAMPION');

      expect(obj!.completed).toBe(true);
      expect(impact.progression!.status).toBe('won');
      expect(impact.progression!.wonYear).toBe(state.year);
      expect(impact.progression!.wonWeek).toBe(state.week);
    });

    it('does NOT complete mid-year even if standing === 1', () => {
      state.fame = 999;
      state.rivals.forEach((r) => {
        r.fame = 100;
      });

      const impact = runProgressionPass(state, 26, 1);
      const obj = impact.progression!.objectives.find((o) => o.id === 'REALM_CHAMPION');

      expect(obj!.completed).toBe(false);
      expect(impact.progression!.status).toBe('active');
    });

    it('does NOT complete at year boundary if standing !== 1', () => {
      state.fame = 50;
      state.rivals.forEach((r) => {
        r.fame = 200;
      });

      const impact = runProgressionPass(state, 1, 2);
      const obj = impact.progression!.objectives.find((o) => o.id === 'REALM_CHAMPION');

      expect(obj!.completed).toBe(false);
    });
  });

  describe('Idempotency', () => {
    it('objectives stamp completedWeek/completedYear once (no duplicate)', () => {
      state.progression = {
        ...DEFAULT_PROGRESSION,
        objectives: DEFAULT_PROGRESSION.objectives.map((o) =>
          o.id === 'TOP_10_STABLE'
            ? { ...o, completed: true, completedWeek: 3, completedYear: 1 }
            : o
        ),
      };

      const impact = runProgressionPass(state, 5, 1);
      const obj = impact.progression!.objectives.find((o) => o.id === 'TOP_10_STABLE');

      expect(obj!.completedWeek).toBe(3);
      expect(obj!.completedYear).toBe(1);
    });

    it('status does NOT change to won if already continued', () => {
      state.fame = 999;
      state.rivals.forEach((r) => {
        r.fame = 100;
      });
      state.progression = {
        ...DEFAULT_PROGRESSION,
        status: 'continued',
        objectives: DEFAULT_PROGRESSION.objectives.map((o) =>
          o.id === 'REALM_CHAMPION'
            ? { ...o, completed: true, completedWeek: 52, completedYear: 1 }
            : o
        ),
      };

      const impact = runProgressionPass(state, 1, 2);

      expect(impact.progression!.status).toBe('continued');
    });
  });

  describe('Newsletter & gazette', () => {
    it('newsletter items pushed on objective completion', () => {
      state.fame = 500;
      state.rivals.forEach((r, i) => {
        r.fame = i < 5 ? 600 : 50;
      });

      const impact = runProgressionPass(state, 5, 1);

      expect(impact.newsletterItems).toBeDefined();
      expect(impact.newsletterItems!.length).toBeGreaterThan(0);
    });

    it('gazette items pushed on REALM_CHAMPION completion', () => {
      state.fame = 999;
      state.rivals.forEach((r) => {
        r.fame = 100;
      });

      const impact = runProgressionPass(state, 1, 2);

      expect(impact.gazettes).toBeDefined();
      expect(impact.gazettes!.length).toBeGreaterThan(0);
    });
  });

  describe('Edge cases', () => {
    it('pass returns progression in impact', () => {
      const impact = runProgressionPass(state, 5, 1);

      expect(impact.progression).toBeDefined();
      expect(impact.progression!.stableStanding).toBeGreaterThan(0);
    });

    it('handles missing progression state gracefully', () => {
      (state as any).progression = undefined;

      const impact = runProgressionPass(state, 5, 1);

      expect(impact.progression).toBeDefined();
      expect(impact.progression!.objectives).toHaveLength(5);
    });
  });
});
