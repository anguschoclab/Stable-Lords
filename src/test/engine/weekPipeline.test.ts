import { describe, it, expect } from 'vitest';
import { processTierProgression } from '@/engine/pipeline/core/tierProgression';
import { GameState } from '@/types/game';
import { type StableId } from '@/types/shared.types';

describe('processTierProgression', () => {
  const mockState = {
    season: 'Spring',
    week: 1,
    rivals: [
      {
        // rivalsUpdates is keyed by rival.id (StableId) — owner.id is the OwnerId.
        id: 'rival-1',
        owner: { id: 'owner-1', stableName: 'Rival 1' },
        tier: 'Minor',
        roster: Array(5).fill({
          status: 'Active',
          career: { wins: 20, kills: 5, losses: 0 },
        }),
      },
    ],
    meta: { createdAt: new Date().toISOString(), gameName: 'Stable Lords', version: '1.0' },
    newsletter: [],
    recruitPool: [{ id: 'old' }],
  } as any as GameState;

  it('should return StateImpact with tier promotion when season changes', () => {
    const impact = processTierProgression(mockState, 'Summer', 14);

    // Should return StateImpact object
    expect(impact).toBeDefined();
    expect(impact.rivalsUpdates).toBeDefined();
    expect(impact.rivalsUpdates).toBeInstanceOf(Map);

    // Should promote rival from Minor to Established
    const rivalUpdate = impact.rivalsUpdates?.get('rival-1' as StableId);
    expect(rivalUpdate).toBeDefined();
    expect(rivalUpdate?.tier).toBe('Established');

    // Should clear recruit pool
    expect(impact.recruitPool).toEqual([]);

    // Should add newsletter items
    expect(impact.newsletterItems).toBeDefined();
    expect(impact.newsletterItems?.length).toBeGreaterThan(0);
    expect(impact.newsletterItems?.[0]!.title).toBe('Stable Rankings Update');
  });

  it("should return empty StateImpact if season hasn't changed", () => {
    const impact = processTierProgression(mockState, 'Spring', 2);

    // Should return empty object when season hasn't changed
    expect(impact).toEqual({});
  });

  it('should promote an Established stable to Major', () => {
    const customState = {
      ...mockState,
      rivals: [
        {
          id: 'rival-2',
          owner: { id: 'owner-2', stableName: 'Rival 2' },
          tier: 'Established',
          roster: Array(8).fill({
            status: 'Active',
            career: { wins: 5, kills: 1, losses: 2 }, // Total wins: 40, Total kills: 8, Fights: 56, win ratio > 0.6
          }),
        },
      ],
    } as any as GameState;

    const impact = processTierProgression(customState, 'Summer', 14);
    const rivalUpdate = impact.rivalsUpdates?.get('rival-2' as StableId);
    expect(rivalUpdate?.tier).toBe('Major');
    expect(impact.newsletterItems?.[0]?.items[0]).toContain('ascends to Major stable status');
  });

  it('should demote an Established stable to Minor due to low active count', () => {
    const customState = {
      ...mockState,
      rivals: [
        {
          id: 'rival-3',
          owner: { id: 'owner-3', stableName: 'Rival 3' },
          tier: 'Established',
          roster: [
            { status: 'Active', career: { wins: 20, kills: 5, losses: 5 } },
            { status: 'Active', career: { wins: 20, kills: 5, losses: 5 } },
            { status: 'Dead', career: { wins: 20, kills: 5, losses: 5 } },
          ], // Active count is 2 (< 3)
        },
      ],
    } as any as GameState;

    const impact = processTierProgression(customState, 'Summer', 14);
    const rivalUpdate = impact.rivalsUpdates?.get('rival-3' as StableId);
    expect(rivalUpdate?.tier).toBe('Minor');
    expect(impact.newsletterItems?.[0]?.items[0]).toContain('falls to Minor status');
  });

  it('should demote a Major stable to Established due to low active count', () => {
    const customState = {
      ...mockState,
      rivals: [
        {
          id: 'rival-4',
          owner: { id: 'owner-4', stableName: 'Rival 4' },
          tier: 'Major',
          roster: [
            { status: 'Active', career: { wins: 50, kills: 10, losses: 10 } },
            { status: 'Active', career: { wins: 50, kills: 10, losses: 10 } },
            { status: 'Active', career: { wins: 50, kills: 10, losses: 10 } },
          ], // Active count is 3 (< 4)
        },
      ],
    } as any as GameState;

    const impact = processTierProgression(customState, 'Summer', 14);
    const rivalUpdate = impact.rivalsUpdates?.get('rival-4' as StableId);
    expect(rivalUpdate?.tier).toBe('Established');
    expect(impact.newsletterItems?.[0]?.items[0]).toContain('downgraded to Established');
  });

  it('should do nothing for Legendary stables', () => {
    const customState = {
      ...mockState,
      rivals: [
        {
          id: 'rival-5',
          owner: { id: 'owner-5', stableName: 'Rival 5' },
          tier: 'Legendary',
          roster: Array(2).fill({
            status: 'Active',
            career: { wins: 1, kills: 0, losses: 10 },
          }),
        },
      ],
    } as any as GameState;

    const impact = processTierProgression(customState, 'Summer', 14);
    const rivalUpdate = impact.rivalsUpdates?.get('rival-5' as StableId);
    expect(rivalUpdate).toBeUndefined();
    expect(impact.newsletterItems).toBeUndefined();
  });
});
