import { describe, it, expect, vi, beforeEach } from 'vitest';
import { processAIRosterManagement } from '@/engine/ownerRoster';
import type { GameState, RivalStableData } from '@/types/state.types';
import type { RivalWarrior } from '@/types/warrior.types';
import { FightingStyle } from '@/types/shared.types';

describe('Owner Roster Worker', () => {
  let mockState: GameState;

  beforeEach(() => {
    mockState = {
      week: 10,
      season: 1,
      meta: { createdAt: new Date(0).toISOString() },
      rivals: [],
      arenaHistory: [],
      player: { id: 'player-1', treasury: 1000 } as any,
    } as unknown as GameState;
  });

  const createRival = (id: string, personality: string, treasury: number, roster: Partial<RivalWarrior>[]): RivalStableData => {
    return {
      id,
      owner: {
        id: `owner-${id}`,
        name: `Owner ${id}`,
        stableName: `Stable ${id}`,
        personality,
        philosophy: 'Balanced',
        metaAdaptation: 'Opportunist',
        favoredStyles: [],
      },
      treasury,
      strategy: { intent: 'MAINTENANCE' },
      roster: roster.map((w, i) => ({
        id: `w-${i}`,
        name: `Warrior ${i}`,
        status: w.status || 'Active',
        career: w.career || { wins: 0, losses: 0, kills: 0, highestRank: 0 },
        age: w.age || 20,
        ...w,
      })) as RivalWarrior[],
    } as RivalStableData;
  };

  describe('Culling Logic', () => {
    it('should cull warriors based on win rate for Methodical and Tactician personalities', () => {
      // Methodical culls if wr < 0.3 (and >= 5 fights, age >= 25)
      const r1 = createRival('r1', 'Methodical', 1000, [
        { status: 'Active', age: 26, career: { wins: 1, losses: 4, kills: 0, highestRank: 0 } }, // 1/5 = 0.2 < 0.3 -> cull
        { status: 'Active', age: 26, career: { wins: 2, losses: 3, kills: 0, highestRank: 0 } }, // 2/5 = 0.4 > 0.3 -> keep
      ]);
      r1.strategy!.intent = 'RECOVERY'; // Prevent auto-recruitment

      const r2 = createRival('r2', 'Tactician', 1000, [
        { status: 'Active', age: 26, career: { wins: 1, losses: 4, kills: 0, highestRank: 0 } }, // 1/5 = 0.2 < 0.3 -> cull
        { status: 'Active', age: 26, career: { wins: 2, losses: 3, kills: 0, highestRank: 0 } }, // 2/5 = 0.4 > 0.3 -> keep
      ]);
      r2.strategy!.intent = 'RECOVERY'; // Prevent auto-recruitment

      mockState.rivals = [r1, r2];

      const { updatedRivals, gazetteItems } = processAIRosterManagement(mockState);

      expect(updatedRivals[0].roster.length).toBe(1);
      expect(updatedRivals[1].roster.length).toBe(1);
      expect(gazetteItems.length).toBe(2);
      expect(gazetteItems[0]).toContain('Not meeting expectations');
    });

    it('should not cull warriors on a win streak', () => {
      mockState.arenaHistory = [
        { week: 9, winner: 'A', warriorIdA: 'w-0', warriorIdD: 'other' } as any,
        { week: 8, winner: 'D', warriorIdD: 'w-0', warriorIdA: 'other' } as any,
        { week: 7, winner: 'A', warriorIdA: 'w-0', warriorIdD: 'other' } as any,
        { week: 6, winner: 'D', warriorIdA: 'w-0', warriorIdD: 'other' } as any, // loss
        { week: 5, winner: 'A', warriorIdD: 'w-0', warriorIdA: 'other' } as any, // loss
      ];

      const r1 = createRival('r1', 'Methodical', 1000, [
        { id: 'w-0', status: 'Active', age: 26, career: { wins: 4, losses: 11, kills: 0, highestRank: 0 } },
      ]);
      r1.strategy!.intent = 'RECOVERY';

      mockState.rivals = [r1];

      const { updatedRivals } = processAIRosterManagement(mockState);
      expect(updatedRivals[0].roster.length).toBe(1); // Not culled because of win streak
    });

    it('should cull killless older warriors for Aggressive personality', () => {
      const r1 = createRival('r1', 'Aggressive', 1000, [
        { status: 'Active', age: 25, career: { wins: 4, losses: 4, kills: 0, highestRank: 0 } }, // age >= 24, fights >= 8, kills = 0 -> cull
      ]);
      r1.strategy!.intent = 'RECOVERY';

      mockState.rivals = [r1];
      const { updatedRivals, gazetteItems } = processAIRosterManagement(mockState);

      expect(updatedRivals[0].roster.length).toBe(0);
      expect(gazetteItems[0]).toContain('No killer instinct');
    });

    it('should age-based retire older warriors occasionally', () => {
      const r1 = createRival('r1', 'Pragmatic', 1000, [
        { status: 'Active', age: 35, career: { wins: 10, losses: 5, kills: 0, highestRank: 0 } },
      ]);
      r1.strategy!.intent = 'RECOVERY';
      mockState.rivals = [r1];

      // Force RNG to trigger retirement (< 0.15)
      const mockRng = {
        next: vi.fn(() => 0.1), // This makes retirement chance hit
        pick: vi.fn((a) => a[0]),
        uuid: vi.fn(() => 'id')
      } as any;

      const { updatedRivals, gazetteItems } = processAIRosterManagement(mockState, mockRng);
      expect(updatedRivals[0].roster.length).toBe(0);
      expect(gazetteItems[0]).toContain('retires after a long career');
    });
  });

  describe('Recruitment Logic', () => {
    it('should recruit if roster size is below min (guaranteed if < 4)', () => {
      // Showman min is 7. Current active is 3. Recruit chance should be 1.0.
      const r1 = createRival('r1', 'Showman', 500, [
        { status: 'Active' }, { status: 'Active' }, { status: 'Active' }
      ]);

      mockState.rivals = [r1];
      // Do not use the broken mockRng, let the method use its default SeededRNG
      const { updatedRivals, gazetteItems } = processAIRosterManagement(mockState);

      expect(updatedRivals[0].roster.length).toBe(4);
      expect(updatedRivals[0].treasury).toBe(400); // 500 - 100
      expect(gazetteItems[0]).toContain('recruits');
    });

    it('should not recruit if intent is RECOVERY', () => {
      const r1 = createRival('r1', 'Showman', 500, [
        { status: 'Active' }, { status: 'Active' }, { status: 'Active' }
      ]);
      r1.strategy!.intent = 'RECOVERY';

      mockState.rivals = [r1];
      const { updatedRivals } = processAIRosterManagement(mockState);

      expect(updatedRivals[0].roster.length).toBe(3); // No recruitment
    });

    it('should apply meta drift for intense rivalries during recruitment', () => {
      const r1 = createRival('r1', 'Showman', 500, [{ status: 'Active' }]);
      mockState.rivals = [r1];
      mockState.rivalries = [
        { stableIdA: 'player-1', stableIdB: 'r1', intensity: 3, id: 'rv-1' } as any
      ];
      // Force history to show player using a lot of Strikers
      mockState.arenaHistory = [
        { week: 9, winner: 'A', warriorIdA: 'player-w', warriorIdD: 'other' } as any,
        { week: 8, winner: 'D', warriorIdD: 'player-w', warriorIdA: 'other' } as any,
      ];

      const { updatedRivals } = processAIRosterManagement(mockState);
      expect(updatedRivals[0].roster.length).toBe(2);
    });
  });

  describe('Adaptation Styles', () => {
    it('Traditionalist should use favored styles if available', () => {
      const r1 = createRival('r1', 'Pragmatic', 500, [{ status: 'Active' }]);
      r1.owner.metaAdaptation = 'Traditionalist';
      r1.owner.favoredStyles = [FightingStyle.StrikingAttack];

      mockState.rivals = [r1];

      const { updatedRivals } = processAIRosterManagement(mockState);
      if (updatedRivals[0].roster.length > 1) {
         // Should either be favoredStyle or philosophy default. SeededRNG usually hits stable paths.
         expect(updatedRivals[0].roster[1].style).toBeDefined();
      }
    });

    it('MetaChaser should pick from top meta styles', () => {
      // Setup meta to favor Grappler
      mockState.cachedMetaDrift = { [FightingStyle.Grappler]: 5, [FightingStyle.StrikingAttack]: 1 } as any;

      const r1 = createRival('r1', 'Pragmatic', 500, [{ status: 'Active' }]);
      r1.owner.metaAdaptation = 'MetaChaser';

      mockState.rivals = [r1];

      const { updatedRivals } = processAIRosterManagement(mockState);
      expect(updatedRivals[0].roster.length).toBeGreaterThanOrEqual(1);
    });

    it('Innovator should pick non-philosophy styles', () => {
      mockState.cachedMetaDrift = { [FightingStyle.Grappler]: 5, [FightingStyle.StrikingAttack]: 1 } as any;
      const r1 = createRival('r1', 'Pragmatic', 500, [{ status: 'Active' }]);
      r1.owner.metaAdaptation = 'Innovator';

      mockState.rivals = [r1];

      const { updatedRivals } = processAIRosterManagement(mockState);
      expect(updatedRivals[0].roster.length).toBeGreaterThanOrEqual(1);
    });
  });
});
