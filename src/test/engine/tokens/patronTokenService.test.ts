import { describe, it, expect, vi } from 'vitest';
import { PatronTokenService } from '@/engine/tokens/patronTokenService';
import type { GameState } from '@/types/state.types';
import type { IRNGService } from '@/engine/core/rng/IRNGService';
import { createFreshState } from '@/engine/factories/gameStateFactory';
import type { Warrior } from '@/types/warrior.types';

describe('PatronTokenService', () => {
  describe('awardToken', () => {
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
          discoveredWeek: 1
        }
      ];

      const newState = PatronTokenService.awardToken(state, 'Style', 'Arena');

      expect(newState.insightTokens!.length).toBe(2);
      expect(newState.insightTokens![1]!.type).toBe('Style');
      expect(newState.insightTokens![1]!.detail).toBe('Awarded from Arena');
    });

    it('uses provided RNG service for token ID generation', () => {
      const state = createFreshState('test-seed');
      const mockRng = {
        uuid: vi.fn().mockReturnValue('mock-uuid')
      } as unknown as IRNGService;

      const newState = PatronTokenService.awardToken(state, 'Attribute', 'Source', mockRng);

      expect(newState.insightTokens![0]!.id).toBe('mock-uuid');
      expect(newState.newsletter![0]!.id).toBe('mock-uuid');
    });
  });

  describe('assignToken', () => {
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
      state.roster = [{
        id: 'w1',
        name: 'Tester',
        favorites: { discovered: {} }
      } as unknown as Warrior];

      const newState = PatronTokenService.assignToken(state, 't1', 'w1');

      expect(newState.roster[0]!.favorites!.discovered.weapon).toBe(true);
      expect(newState.insightTokens!.length).toBe(0);
    });

    it('processes Rhythm token', () => {
      const state = createFreshState('test-seed');
      state.insightTokens = [{ id: 't1', type: 'Rhythm' } as any];
      state.roster = [{
        id: 'w1',
        name: 'Tester',
        favorites: { discovered: {} }
      } as unknown as Warrior];

      const newState = PatronTokenService.assignToken(state, 't1', 'w1');

      expect(newState.roster[0]!.favorites!.discovered.rhythm).toBe(true);
      expect(newState.insightTokens!.length).toBe(0);
    });

    it('processes Attribute token with RNG', () => {
      const state = createFreshState('test-seed');
      state.insightTokens = [{ id: 't1', type: 'Attribute' } as any];
      state.roster = [{
        id: 'w1',
        name: 'Tester',
        favorites: { discovered: {} },
        attributes: { ST: 10, WT: 10, SP: 10, DF: 10 }
      } as unknown as Warrior];

      const mockRng = {
        pick: vi.fn().mockReturnValue('WT'),
        uuid: vi.fn().mockReturnValue('mock-uuid-2')
      } as unknown as IRNGService;

      const newState = PatronTokenService.assignToken(state, 't1', 'w1', mockRng);

      expect(newState.roster[0]!.attributes.WT).toBe(11);
      // The removed token doesn't get detail updated in state since it's removed
      expect(newState.insightTokens!.length).toBe(0);
    });

    it('processes Attribute token with undefined attributes fallback', () => {
      const state = createFreshState('test-seed');
      state.insightTokens = [{ id: 't1', type: 'Attribute' } as any];
      state.roster = [{
        id: 'w1',
        name: 'Tester',
        favorites: { discovered: {} },
        attributes: {}
      } as unknown as Warrior];

      const mockRng = {
        pick: vi.fn().mockReturnValue('SP'),
        uuid: vi.fn().mockReturnValue('mock-uuid-3')
      } as unknown as IRNGService;

      const newState = PatronTokenService.assignToken(state, 't1', 'w1', mockRng);

      expect(newState.roster[0]!.attributes.SP).toBe(11); // 10 + 1
    });

    it('processes Attribute token without RNG (fallback to first primary)', () => {
      const state = createFreshState('test-seed');
      state.insightTokens = [{ id: 't1', type: 'Attribute' } as any];
      state.roster = [{
        id: 'w1',
        name: 'Tester',
        favorites: { discovered: {} },
        attributes: { ST: 10, WT: 10, SP: 10, DF: 10 }
      } as unknown as Warrior];

      const newState = PatronTokenService.assignToken(state, 't1', 'w1');

      expect(newState.roster[0]!.attributes.ST).toBe(11); // Fallbacks to 'ST'
    });

    it('processes Style token', () => {
      const state = createFreshState('test-seed');
      state.insightTokens = [{ id: 't1', type: 'Style' } as any];
      state.roster = [{
        id: 'w1',
        name: 'Tester',
        favorites: { discovered: {} },
        baseSkills: { ATT: 5, DEF: 5, PHY: 5, MEN: 5 }
      } as unknown as Warrior];

      const newState = PatronTokenService.assignToken(state, 't1', 'w1');

      expect(newState.roster[0]!.baseSkills!.ATT).toBe(6);
    });

    it('processes Style token safely when baseSkills is undefined', () => {
      const state = createFreshState('test-seed');
      state.insightTokens = [{ id: 't1', type: 'Style' } as any];
      state.roster = [{
        id: 'w1',
        name: 'Tester',
        favorites: { discovered: {} },
        baseSkills: undefined
      } as unknown as Warrior];

      const newState = PatronTokenService.assignToken(state, 't1', 'w1');

      expect(newState.roster[0]!.baseSkills).toBeUndefined();
    });

    it('processes Tactic token', () => {
      const state = createFreshState('test-seed');
      state.insightTokens = [{ id: 't1', type: 'Tactic' } as any];
      state.roster = [{
        id: 'w1',
        name: 'Tester',
        favorites: { discovered: {} },
        flair: []
      } as unknown as Warrior];

      const newState = PatronTokenService.assignToken(state, 't1', 'w1');

      expect(newState.roster[0]!.flair).toContain('Tactical Insight');
    });

    it('processes Tactic token with undefined flair', () => {
      const state = createFreshState('test-seed');
      state.insightTokens = [{ id: 't1', type: 'Tactic' } as any];
      state.roster = [{
        id: 'w1',
        name: 'Tester',
        favorites: { discovered: {} },
        flair: undefined
      } as unknown as Warrior];

      const newState = PatronTokenService.assignToken(state, 't1', 'w1');

      expect(newState.roster[0]!.flair).toEqual(['Tactical Insight']);
    });
  });
});
