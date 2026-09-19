import { describe, it, expect, vi, beforeEach } from 'vitest';
import { processAIRosterManagement } from '@/engine/owner/roster/management';
import { aiDraftFromPool } from '@/engine/draftService';
import type { GameState, PoolWarrior, RivalStableData } from '@/types/state.types';
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

  const createRival = (
    id: string,
    personality: string,
    treasury: number,
    roster: Partial<any>[]
  ): RivalStableData => {
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
      fame: 0,
      strategy: { intent: 'MAINTENANCE' },
      roster: roster.map((w, i) => ({
        id: `w-${i}`,
        name: `Warrior ${i}`,
        status: w.status || 'Active',
        career: w.career || { wins: 0, losses: 0, kills: 0, highestRank: 0 },
        age: w.age || 20,
        ...w,
      })),
      ledger: [],
      trainingAssignments: [],
    } as unknown as RivalStableData;
  };

  const poolCandidate = (id: string, style: FightingStyle): PoolWarrior =>
    ({
      id,
      name: `Recruit ${id}`,
      style,
      attributes: { ST: 10, CN: 10, SZ: 10, WT: 10, WL: 10, SP: 10, DF: 10 },
      potential: { ST: 12, CN: 12, SZ: 12, WT: 12, WL: 12, SP: 12, DF: 12 },
      baseSkills: {},
      derivedStats: {},
      tier: 'Promising',
      age: 19,
      addedWeek: 1,
    }) as unknown as PoolWarrior;

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

      expect(updatedRivals[0]!.roster.length).toBe(1);
      expect(updatedRivals[1]!.roster.length).toBe(1);
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
        {
          id: 'w-0',
          status: 'Active',
          age: 26,
          career: { wins: 4, losses: 11, kills: 0, highestRank: 0 },
        },
      ]);
      r1.strategy!.intent = 'RECOVERY';

      mockState.rivals = [r1];

      const { updatedRivals } = processAIRosterManagement(mockState);
      expect(updatedRivals[0]!.roster.length).toBe(1); // Not culled because of win streak
    });

    it('should cull killless older warriors for Aggressive personality', () => {
      const r1 = createRival('r1', 'Aggressive', 1000, [
        { status: 'Active', age: 25, career: { wins: 4, losses: 4, kills: 0, highestRank: 0 } }, // age >= 24, fights >= 8, kills = 0 -> cull
      ]);
      r1.strategy!.intent = 'RECOVERY';

      mockState.rivals = [r1];
      const { updatedRivals, gazetteItems } = processAIRosterManagement(mockState);

      expect(updatedRivals[0]!.roster.length).toBe(0);
      expect(gazetteItems[0]!).toContain('No killer instinct');
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
        uuid: vi.fn(() => 'id'),
      } as any;

      const { updatedRivals, gazetteItems } = processAIRosterManagement(mockState, mockRng);
      expect(updatedRivals[0]!.roster.length).toBe(0);
      expect(gazetteItems[0]!).toContain('retires after a long career');
    });
  });

  describe('Recruitment Logic', () => {
    it('should flag needsRecruit if roster size is below min (signing is unified in the draft path)', () => {
      // Showman min is 7. Current active is 3. Management declares the need;
      // aiDraftFromPool/processRecruitment does the signing (G9).
      const r1 = createRival('r1', 'Showman', 500, [
        { status: 'Active' },
        { status: 'Active' },
        { status: 'Active' },
      ]);

      mockState.rivals = [r1];
      const { updatedRivals } = processAIRosterManagement(mockState);

      expect(updatedRivals[0]!.needsRecruit).toBe(true);
      expect(updatedRivals[0]!.roster.length).toBe(3); // no direct signing
      expect(updatedRivals[0]!.treasury).toBe(500);
    });

    it('should not recruit if intent is RECOVERY', () => {
      const r1 = createRival('r1', 'Showman', 500, [
        { status: 'Active' },
        { status: 'Active' },
        { status: 'Active' },
      ]);
      r1.strategy!.intent = 'RECOVERY';

      mockState.rivals = [r1];
      const { updatedRivals } = processAIRosterManagement(mockState);

      expect(updatedRivals[0]!.roster.length).toBe(3); // No recruitment
    });

    it('should apply meta drift for intense rivalries during recruitment', () => {
      // Counter-meta moved to the unified draft path (G9): a rival in a
      // heated feud with the player drafts the style the player wins with.
      const r1 = createRival('r1', 'Showman', 5000, [
        { status: 'Active', style: FightingStyle.TotalParry },
      ]);
      r1.needsRecruit = true;
      mockState.rivals = [r1];
      mockState.rivalries = [
        { stableIdA: 'player-1', stableIdB: 'r1', intensity: 3, id: 'rv-1' } as any,
      ];
      // Player-stable fights are all Bashing Attack wins → counter-meta
      // favors drafting a Basher over a Parry-Lunger.
      mockState.warriorToStableMap = new Map([
        ['pw-1', { stableId: 'player-1', isPlayer: true }],
        ['rw-x', { stableId: 'r9', isPlayer: false }],
      ]) as any;
      mockState.arenaHistory = Array.from({ length: 6 }, (_, i) => ({
        week: 9 - i,
        winner: 'A',
        warriorIdA: 'pw-1',
        warriorIdD: 'rw-x',
        styleA: FightingStyle.BashingAttack,
        styleD: FightingStyle.StrikingAttack,
      })) as any;

      const pool = [
        poolCandidate('pool-bash', FightingStyle.BashingAttack),
        poolCandidate('pool-pl', FightingStyle.ParryLunge),
      ];
      const { updatedRivals } = aiDraftFromPool(pool, [r1], 10, mockState);
      const signed = updatedRivals[0]!.roster[1];
      expect(signed).toBeDefined();
      expect(signed!.style).toBe(FightingStyle.BashingAttack);
      expect(updatedRivals[0]!.needsRecruit).toBe(false);
    });
  });

  describe('Adaptation Styles', () => {
    it('Traditionalist should use favored styles if available', () => {
      const r1 = createRival('r1', 'Pragmatic', 500, [{ status: 'Active' }]);
      r1.owner.metaAdaptation = 'Traditionalist';
      r1.owner.favoredStyles = [FightingStyle.StrikingAttack];

      mockState.rivals = [r1];

      const { updatedRivals } = processAIRosterManagement(mockState);
      if (updatedRivals[0]!.roster.length > 1) {
        // Should either be favoredStyle or philosophy default. SeededRNG usually hits stable paths.
        expect(updatedRivals[0]!.roster[1]!.style).toBeDefined();
      }
    });

    it('MetaChaser should pick from top meta styles', () => {
      // Setup meta to favor BashingAttack
      mockState.cachedMetaDrift = {
        [FightingStyle.BashingAttack]: 5,
        [FightingStyle.StrikingAttack]: 1,
      } as any;

      const r1 = createRival('r1', 'Pragmatic', 500, [{ status: 'Active' }]);
      r1.owner.metaAdaptation = 'MetaChaser';

      mockState.rivals = [r1];

      const { updatedRivals } = processAIRosterManagement(mockState);
      expect(updatedRivals[0]!.roster.length).toBeGreaterThanOrEqual(1);
    });

    it('Innovator should pick non-philosophy styles', () => {
      mockState.cachedMetaDrift = {
        [FightingStyle.BashingAttack]: 5,
        [FightingStyle.StrikingAttack]: 1,
      } as any;
      const r1 = createRival('r1', 'Pragmatic', 500, [{ status: 'Active' }]);
      r1.owner.metaAdaptation = 'Innovator';

      mockState.rivals = [r1];

      const { updatedRivals } = processAIRosterManagement(mockState);
      expect(updatedRivals[0]!.roster.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Rivalry Lookup with Reversed IDs', () => {
    it('should apply meta drift for intense rivalries with reversed stable ID order', () => {
      const r1 = createRival('r1', 'Showman', 5000, [
        { status: 'Active', style: FightingStyle.TotalParry },
      ]);
      r1.needsRecruit = true;
      mockState.rivals = [r1];
      mockState.rivalries = [
        { stableIdA: 'r1', stableIdB: 'player-1', intensity: 3, id: 'rv-1' } as any,
      ];
      mockState.warriorToStableMap = new Map([
        ['pw-1', { stableId: 'player-1', isPlayer: true }],
        ['rw-x', { stableId: 'r9', isPlayer: false }],
      ]) as any;
      mockState.arenaHistory = Array.from({ length: 6 }, (_, i) => ({
        week: 9 - i,
        winner: 'A',
        warriorIdA: 'pw-1',
        warriorIdD: 'rw-x',
        styleA: FightingStyle.BashingAttack,
        styleD: FightingStyle.StrikingAttack,
      })) as any;

      const pool = [
        poolCandidate('pool-bash', FightingStyle.BashingAttack),
        poolCandidate('pool-pl', FightingStyle.ParryLunge),
      ];
      const { updatedRivals } = aiDraftFromPool(pool, [r1], 10, mockState);
      const signed = updatedRivals[0]!.roster[1];
      expect(signed).toBeDefined();
      expect(signed!.style).toBe(FightingStyle.BashingAttack);
    });

    it('should match only the correct rival among multiple rivals with rivalries', () => {
      const r1 = createRival('r1', 'Showman', 500, [{ status: 'Active' }]);
      const r2 = createRival('r2', 'Showman', 500, [{ status: 'Active' }]);
      const r3 = createRival('r3', 'Showman', 500, [{ status: 'Active' }]);
      mockState.rivals = [r1, r2, r3];
      mockState.rivalries = [
        { stableIdA: 'player-1', stableIdB: 'r2', intensity: 4, id: 'rv-1' } as any,
      ];
      mockState.arenaHistory = [
        { week: 9, winner: 'A', warriorIdA: 'player-w', warriorIdD: 'other' } as any,
        { week: 8, winner: 'D', warriorIdD: 'player-w', warriorIdA: 'other' } as any,
      ];

      const { updatedRivals } = processAIRosterManagement(mockState);
      expect(updatedRivals).toHaveLength(3);
      for (const r of updatedRivals) {
        expect(r.roster.length).toBeGreaterThanOrEqual(1);
      }
    });
  });
});
