import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PatronTokenService } from '@/engine/tokens/patronTokenService';
import type { GameState, InsightToken, InsightTokenType } from '@/types/state.types';
import type { IRNGService } from '@/engine/core/rng/IRNGService';
import { createFreshState } from '@/engine/factories/gameStateFactory';
import type { Warrior } from '@/types/warrior.types';

describe('PatronTokenService', () => {
  let mockState: GameState;
  let mockRng: IRNGService;

  beforeEach(() => {
    vi.restoreAllMocks();

    mockRng = {
      uuid: vi.fn().mockImplementation((prefix) => (prefix ? `${prefix}-uuid` : 'mock-uuid')),
      pick: vi.fn().mockImplementation((arr) => arr[0]),
    } as unknown as IRNGService;

    mockState = {
      week: 10,
      insightTokens: [],
      newsletter: [],
      roster: [],
    } as unknown as GameState;
  });

  describe('awardToken (fresh state)', () => {
    it('awards a token when insightTokens is undefined', () => {
      const state = createFreshState('test-seed');
      state.insightTokens = undefined as any;
      state.newsletter = undefined as any;

      const newState = PatronTokenService.awardToken(state, 'Weapon', 'Grand Tournament');

      expect(newState.insightTokens).toBeDefined();
      expect(newState.insightTokens!.length).toBe(1);
      expect(newState.insightTokens![0]!.type).toBe('Weapon');
      expect(newState.insightTokens![0]!.detail).toBe('Awarded from Grand Tournament');
      expect(newState.newsletter).toBeDefined();
      expect(newState.newsletter!.length).toBe(1);
      expect(newState.newsletter![0]!.title).toBe('Patronage Awarded');
    });

    it('awards a token when insightTokens is already populated', () => {
      const state = createFreshState('test-seed');
      state.insightTokens = [
        {
          id: 'existing-id' as any,
          type: 'Rhythm',
          warriorId: '' as any,
          warriorName: 'Unassigned',
          detail: 'Old Token',
          discoveredWeek: 1,
        },
      ];

      const newState = PatronTokenService.awardToken(state, 'Style', 'Arena');

      expect(newState.insightTokens!.length).toBe(2);
      expect(newState.insightTokens![1]!.type).toBe('Style');
      expect(newState.insightTokens![1]!.detail).toBe('Awarded from Arena');
    });

    it('uses provided RNG service for token ID generation', () => {
      const state = createFreshState('test-seed');
      const rng = {
        uuid: vi.fn().mockReturnValue('mock-uuid'),
      } as unknown as IRNGService;

      const newState = PatronTokenService.awardToken(state, 'Attribute', 'Source', rng);

      expect(newState.insightTokens![0]!.id).toBe('mock-uuid');
      expect(newState.newsletter![0]!.id).toBe('mock-uuid');
    });
  });

  describe('awardToken (mock state)', () => {
    it('awards a token correctly using RNG', () => {
      const state = PatronTokenService.awardToken(
        mockState,
        'Attribute' as InsightTokenType,
        'Tourney',
        mockRng
      );

      expect(state.insightTokens).toHaveLength(1);
      expect(state.insightTokens![0]).toEqual({
        id: 'mock-uuid',
        type: 'Attribute',
        warriorId: '',
        warriorName: 'Unassigned',
        detail: 'Awarded from Tourney',
        discoveredWeek: 10,
      });

      expect(state.newsletter).toHaveLength(1);
      expect(state.newsletter![0]).toEqual(
        expect.objectContaining({
          id: 'mock-uuid',
          week: 10,
          title: 'Patronage Awarded',
          items: expect.arrayContaining([expect.stringContaining('Attribute')]),
        })
      );
    });

    it('awards a token correctly using fallback ID generation', () => {
      const state = PatronTokenService.awardToken(mockState, 'Weapon' as InsightTokenType, 'Event');

      expect(state.insightTokens).toHaveLength(1);
      expect(state.insightTokens![0]!.type).toBe('Weapon');
      expect(state.newsletter).toHaveLength(1);
    });

    it('handles undefined insightTokens and newsletter arrays', () => {
      const stateWithoutArrays = { week: 5 } as unknown as GameState;
      const state = PatronTokenService.awardToken(
        stateWithoutArrays,
        'Rhythm' as InsightTokenType,
        'Event',
        mockRng
      );

      expect(state.insightTokens).toHaveLength(1);
      expect(state.newsletter).toHaveLength(1);
    });

    it('should award a new token to the state and add a newsletter item', () => {
      const result = PatronTokenService.awardToken(
        mockState,
        'Weapon',
        'Grand Tournament',
        mockRng
      );

      expect(result.insightTokens?.length).toBe(1);
      expect(result.insightTokens?.[0]).toEqual({
        id: 'mock-uuid',
        type: 'Weapon',
        warriorId: '',
        warriorName: 'Unassigned',
        detail: 'Awarded from Grand Tournament',
        discoveredWeek: 10,
      });

      expect(result.newsletter?.length).toBe(1);
      expect(result.newsletter?.[0]!.title).toBe('Patronage Awarded');
      expect(result.newsletter?.[0]!.items[0]).toContain('Weapon');
      expect(result.newsletter?.[0]!.items[0]).toContain('Grand Tournament');
      expect(mockRng.uuid).toHaveBeenCalledTimes(2); // Once for token, once for newsletter
    });

    it('should handle undefined insightTokens and newsletter arrays', () => {
      const emptyState = { week: 5 } as GameState;
      const result = PatronTokenService.awardToken(emptyState, 'Style', 'Local Arena');

      expect(result.insightTokens?.length).toBe(1);
      expect(result.insightTokens?.[0]!.type).toBe('Style');
      expect(result.newsletter?.length).toBe(1);
    });
  });

  describe('assignToken (fresh state)', () => {
    it('returns unmodified state if token is not found', () => {
      const state = createFreshState('test-seed');
      state.insightTokens = [];
      state.roster = [{ id: 'w1' } as Warrior];

      const newState = PatronTokenService.assignToken(state, 'nonexistent', 'w1');
      expect(newState).toBe(state);
    });

    it('returns unmodified state if warrior is not found', () => {
      const state = createFreshState('test-seed');
      state.insightTokens = [{ id: 't1' } as any];
      state.roster = [];

      const newState = PatronTokenService.assignToken(state, 't1', 'nonexistent');
      expect(newState).toBe(state);
    });

    it('handles undefined warrior.favorites safely', () => {
      const state = createFreshState('test-seed');
      state.insightTokens = [{ id: 't1', type: 'Weapon' } as any];
      state.roster = [{ id: 'w1', name: 'Tester', favorites: undefined } as Warrior];

      const newState = PatronTokenService.assignToken(state, 't1', 'w1');

      expect(newState.roster[0]!.favorites).toBeUndefined();
      expect(newState.insightTokens!.length).toBe(0);
    });

    it('processes Weapon token', () => {
      const state = createFreshState('test-seed');
      state.insightTokens = [{ id: 't1', type: 'Weapon' } as any];
      state.roster = [
        {
          id: 'w1',
          name: 'Tester',
          favorites: { discovered: {} },
        } as unknown as Warrior,
      ];

      const newState = PatronTokenService.assignToken(state, 't1', 'w1');

      expect(newState.roster[0]!.favorites!.discovered.weapon).toBe(true);
      expect(newState.insightTokens!.length).toBe(0);
    });

    it('processes Rhythm token', () => {
      const state = createFreshState('test-seed');
      state.insightTokens = [{ id: 't1', type: 'Rhythm' } as any];
      state.roster = [
        {
          id: 'w1',
          name: 'Tester',
          favorites: { discovered: {} },
        } as unknown as Warrior,
      ];

      const newState = PatronTokenService.assignToken(state, 't1', 'w1');

      expect(newState.roster[0]!.favorites!.discovered.rhythm).toBe(true);
      expect(newState.insightTokens!.length).toBe(0);
    });

    it('processes Attribute token with RNG', () => {
      const state = createFreshState('test-seed');
      state.insightTokens = [{ id: 't1', type: 'Attribute' } as any];
      state.roster = [
        {
          id: 'w1',
          name: 'Tester',
          favorites: { discovered: {} },
          attributes: { ST: 10, WT: 10, SP: 10, DF: 10 },
        } as unknown as Warrior,
      ];

      const rng = {
        pick: vi.fn().mockReturnValue('WT'),
        uuid: vi.fn().mockReturnValue('mock-uuid-2'),
      } as unknown as IRNGService;

      const newState = PatronTokenService.assignToken(state, 't1', 'w1', rng);

      expect(newState.roster[0]!.attributes.WT).toBe(11);
      // The removed token doesn't get detail updated in state since it's removed
      expect(newState.insightTokens!.length).toBe(0);
    });

    it('processes Attribute token with undefined attributes fallback', () => {
      const state = createFreshState('test-seed');
      state.insightTokens = [{ id: 't1', type: 'Attribute' } as any];
      state.roster = [
        {
          id: 'w1',
          name: 'Tester',
          favorites: { discovered: {} },
          attributes: {},
        } as unknown as Warrior,
      ];

      const rng = {
        pick: vi.fn().mockReturnValue('SP'),
        uuid: vi.fn().mockReturnValue('mock-uuid-3'),
      } as unknown as IRNGService;

      const newState = PatronTokenService.assignToken(state, 't1', 'w1', rng);

      expect(newState.roster[0]!.attributes.SP).toBe(11); // 10 + 1
    });

    it('processes Attribute token without RNG (fallback to first primary)', () => {
      const state = createFreshState('test-seed');
      state.insightTokens = [{ id: 't1', type: 'Attribute' } as any];
      state.roster = [
        {
          id: 'w1',
          name: 'Tester',
          favorites: { discovered: {} },
          attributes: { ST: 10, WT: 10, SP: 10, DF: 10 },
        } as unknown as Warrior,
      ];

      const newState = PatronTokenService.assignToken(state, 't1', 'w1');

      expect(newState.roster[0]!.attributes.ST).toBe(11); // Fallbacks to 'ST'
    });

    it('processes Style token', () => {
      const state = createFreshState('test-seed');
      state.insightTokens = [{ id: 't1', type: 'Style' } as any];
      state.roster = [
        {
          id: 'w1',
          name: 'Tester',
          favorites: { discovered: {} },
          baseSkills: { ATT: 5, DEF: 5, PHY: 5, MEN: 5 },
        } as unknown as Warrior,
      ];

      const newState = PatronTokenService.assignToken(state, 't1', 'w1');

      expect(newState.roster[0]!.baseSkills!.ATT).toBe(6);
    });

    it('processes Style token safely when baseSkills is undefined', () => {
      const state = createFreshState('test-seed');
      state.insightTokens = [{ id: 't1', type: 'Style' } as any];
      state.roster = [
        {
          id: 'w1',
          name: 'Tester',
          favorites: { discovered: {} },
          baseSkills: undefined,
        } as unknown as Warrior,
      ];

      const newState = PatronTokenService.assignToken(state, 't1', 'w1');

      expect(newState.roster[0]!.baseSkills).toBeUndefined();
    });

    it('processes Tactic token', () => {
      const state = createFreshState('test-seed');
      state.insightTokens = [{ id: 't1', type: 'Tactic' } as any];
      state.roster = [
        {
          id: 'w1',
          name: 'Tester',
          favorites: { discovered: {} },
          flair: [],
        } as unknown as Warrior,
      ];

      const newState = PatronTokenService.assignToken(state, 't1', 'w1');

      expect(newState.roster[0]!.flair).toContain('Tactical Insight');
    });

    it('processes Tactic token with undefined flair', () => {
      const state = createFreshState('test-seed');
      state.insightTokens = [{ id: 't1', type: 'Tactic' } as any];
      state.roster = [
        {
          id: 'w1',
          name: 'Tester',
          favorites: { discovered: {} },
          flair: undefined,
        } as unknown as Warrior,
      ];

      const newState = PatronTokenService.assignToken(state, 't1', 'w1');

      expect(newState.roster[0]!.flair).toEqual(['Tactical Insight']);
    });
  });

  describe('assignToken (state with seeded token)', () => {
    let stateWithToken: GameState;
    let baseWarrior: Warrior;
    const tokenId = 'test-token-id';
    const warriorId = 'test-warrior-id';

    beforeEach(() => {
      baseWarrior = {
        id: warriorId,
        name: 'Test Warrior',
        attributes: { ST: 10, WT: 10, SP: 10, DF: 10 },
        baseSkills: { ATT: 5, DEF: 5 },
        favorites: {
          weapon: 'Sword',
          rhythm: 'Aggressive',
          discovered: { weapon: false, rhythm: false },
        },
        flair: [],
      } as unknown as Warrior;

      stateWithToken = {
        week: 12,
        insightTokens: [
          {
            id: tokenId,
            type: 'Attribute' as InsightTokenType,
            warriorId: '',
            warriorName: 'Unassigned',
            detail: 'Awarded',
            discoveredWeek: 10,
          } as InsightToken,
        ],
        newsletter: [],
        roster: [baseWarrior],
      } as unknown as GameState;
    });

    it('does nothing if token is not found', () => {
      const state = PatronTokenService.assignToken(stateWithToken, 'invalid-token', warriorId);
      expect(state).toBe(stateWithToken);
    });

    it('does nothing if warrior is not found', () => {
      const state = PatronTokenService.assignToken(stateWithToken, tokenId, 'invalid-warrior');
      expect(state).toBe(stateWithToken);
    });

    it('assigns a Weapon token correctly', () => {
      stateWithToken.insightTokens![0]!.type = 'Weapon';
      const state = PatronTokenService.assignToken(stateWithToken, tokenId, warriorId);

      expect(state.insightTokens).toHaveLength(0);
      expect(state.roster[0]!.favorites!.discovered.weapon).toBe(true);
      expect(state.newsletter).toHaveLength(1);
    });

    it('assigns a Rhythm token correctly', () => {
      stateWithToken.insightTokens![0]!.type = 'Rhythm';
      const state = PatronTokenService.assignToken(stateWithToken, tokenId, warriorId);

      expect(state.insightTokens).toHaveLength(0);
      expect(state.roster[0]!.favorites!.discovered.rhythm).toBe(true);
    });

    it('assigns an Attribute token correctly (uses pick logic)', () => {
      mockRng.pick = vi.fn().mockReturnValue('WT');
      stateWithToken.insightTokens![0]!.type = 'Attribute';

      const state = PatronTokenService.assignToken(stateWithToken, tokenId, warriorId, mockRng);

      expect(state.insightTokens).toHaveLength(0);
      expect(state.roster[0]!.attributes.WT).toBe(11);
    });

    it('assigns an Attribute token correctly without RNG (fallback to first)', () => {
      stateWithToken.insightTokens![0]!.type = 'Attribute';
      const state = PatronTokenService.assignToken(stateWithToken, tokenId, warriorId);

      expect(state.roster[0]!.attributes.ST).toBe(11); // Fallback is first which is 'ST'
    });

    it('assigns a Style token correctly', () => {
      stateWithToken.insightTokens![0]!.type = 'Style';
      const state = PatronTokenService.assignToken(stateWithToken, tokenId, warriorId);

      expect(state.roster[0]!.baseSkills!.ATT).toBe(6);
    });

    it('assigns a Tactic token correctly', () => {
      stateWithToken.insightTokens![0]!.type = 'Tactic';
      const state = PatronTokenService.assignToken(stateWithToken, tokenId, warriorId);

      expect(state.roster[0]!.flair).toContain('Tactical Insight');
    });

    it('handles assigning to a warrior without favorites or baseSkills initialized', () => {
      const reallyEmptyWarrior = {
        id: warriorId,
        name: 'Empty',
        attributes: {},
        favorites: { discovered: {} },
      } as unknown as Warrior;
      stateWithToken.roster = [reallyEmptyWarrior];
      stateWithToken.insightTokens![0]!.type = 'Tactic';
      const state2 = PatronTokenService.assignToken(stateWithToken, tokenId, warriorId);
      expect(state2.roster[0]!.flair).toContain('Tactical Insight');
    });
  });

  describe('assignToken (mock state roster)', () => {
    let warrior: Warrior;

    beforeEach(() => {
      warrior = {
        id: 'w-1',
        name: 'Gronk',
        attributes: { ST: 10, WT: 10, SP: 10, DF: 10, EX: 10, CH: 10 },
        favorites: {
          discovered: { weapon: false, rhythm: false, style: false, tactic: false },
        },
        baseSkills: { ATT: 5, DEF: 5 },
        flair: [],
      } as unknown as Warrior;

      mockState.roster = [warrior];
      mockState.insightTokens = [
        { id: 't-weapon', type: 'Weapon' as InsightTokenType } as any,
        { id: 't-rhythm', type: 'Rhythm' as InsightTokenType } as any,
        { id: 't-attr', type: 'Attribute' as InsightTokenType } as any,
        { id: 't-style', type: 'Style' as InsightTokenType } as any,
        { id: 't-tactic', type: 'Tactic' as InsightTokenType } as any,
      ];
    });

    it('should return original state if token is not found', () => {
      const result = PatronTokenService.assignToken(mockState, 't-missing', 'w-1');
      expect(result).toBe(mockState);
    });

    it('should return original state if warrior is not found', () => {
      const result = PatronTokenService.assignToken(mockState, 't-weapon', 'w-missing');
      expect(result).toBe(mockState);
    });

    it('should assign a Weapon token, updating favorites and removing token', () => {
      const result = PatronTokenService.assignToken(mockState, 't-weapon', 'w-1', mockRng);

      const updatedWarrior = result.roster.find((w) => w.id === 'w-1');
      expect(updatedWarrior?.favorites?.discovered.weapon).toBe(true);
      expect(result.insightTokens?.find((t) => t.id === 't-weapon')).toBeUndefined();
      expect(result.newsletter?.[0]!.title).toBe('Patronage Internalized');
    });

    it('should assign a Rhythm token, updating favorites', () => {
      const result = PatronTokenService.assignToken(mockState, 't-rhythm', 'w-1', mockRng);

      const updatedWarrior = result.roster.find((w) => w.id === 'w-1');
      expect(updatedWarrior?.favorites?.discovered.rhythm).toBe(true);
    });

    it('should assign an Attribute token, increasing an attribute using RNG', () => {
      mockRng.pick = vi.fn().mockReturnValue('ST');
      const result = PatronTokenService.assignToken(mockState, 't-attr', 'w-1', mockRng);

      const updatedWarrior = result.roster.find((w) => w.id === 'w-1');
      expect(updatedWarrior?.attributes.ST).toBe(11);
      expect(mockRng.pick).toHaveBeenCalledWith(['ST', 'WT', 'SP', 'DF']);
    });

    it('should assign an Attribute token even if attributes object is sparse or missing', () => {
      warrior.attributes = {} as any; // Empty attributes
      const result = PatronTokenService.assignToken(mockState, 't-attr', 'w-1');

      const updatedWarrior = result.roster.find((w) => w.id === 'w-1');
      expect(updatedWarrior?.attributes.ST).toBe(11); // Defaults to 10 + 1
    });

    it('should assign a Style token, increasing ATT base skill', () => {
      const result = PatronTokenService.assignToken(mockState, 't-style', 'w-1', mockRng);

      const updatedWarrior = result.roster.find((w) => w.id === 'w-1');
      expect(updatedWarrior?.baseSkills?.ATT).toBe(6);
    });

    it('should assign a Tactic token, adding Tactical Insight to flair', () => {
      const result = PatronTokenService.assignToken(mockState, 't-tactic', 'w-1', mockRng);

      const updatedWarrior = result.roster.find((w) => w.id === 'w-1');
      expect(updatedWarrior?.flair).toContain('Tactical Insight');
    });

    it('should handle assigning tokens to warrior with no flair array defined', () => {
      delete (warrior as Partial<Warrior>).flair;
      const result = PatronTokenService.assignToken(mockState, 't-tactic', 'w-1', mockRng);

      const updatedWarrior = result.roster.find((w) => w.id === 'w-1');
      expect(updatedWarrior?.flair).toEqual(['Tactical Insight']);
    });

    it('should not throw if warrior favorites or baseSkills are undefined', () => {
      delete warrior.favorites;
      delete warrior.baseSkills;

      // Should not crash, just returns unmodified warrior (except for token removal)
      const result = PatronTokenService.assignToken(mockState, 't-weapon', 'w-1', mockRng);
      const updatedWarrior = result.roster.find((w) => w.id === 'w-1');

      expect(updatedWarrior?.favorites).toBeUndefined();
      expect(result.insightTokens?.length).toBe(4); // Token still consumed
    });

    it('should handle undefined newsletter array in assignToken', () => {
      delete (mockState as Partial<GameState>).newsletter;
      const result = PatronTokenService.assignToken(mockState, 't-weapon', 'w-1');
      expect(result.newsletter?.length).toBe(1);
      expect(result.newsletter?.[0]!.title).toBe('Patronage Internalized');
    });
  });
});
