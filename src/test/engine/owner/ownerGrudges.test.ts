/**
 * ownerGrudges tests.
 */
import { describe, it, expect } from 'vitest';
import { processOwnerGrudges, calculateRivalryScore } from '@/engine/owner/grudges';

describe('ownerGrudges - processOwnerGrudges', () => {
  const mockState: any = {
    week: 10,
    arenaHistory: [
      {
        id: 'f1',
        week: 9,
        a: 'W1',
        d: 'W2',
        warriorIdA: 'w1',
        warriorIdD: 'w2',
        styleA: 'Brawler',
        styleD: 'Brawler',
        winner: 'A',
        by: 'Kill',
      },
    ],
    rivals: [
      {
        owner: { id: 'o1', personality: 'Aggressive', stableName: 'Aggro' },
        roster: [{ id: 'w1', name: 'W1', status: 'Active' }],
      },
      {
        owner: { id: 'o2', personality: 'Tactician', stableName: 'Tact' },
        roster: [{ id: 'w2', name: 'W2', status: 'Active' }],
      },
    ],
  };

  it('should create a new grudge when personalities clash and blood is spilled', () => {
    // Aggressive vs Tactician is a known clash in ownerData
    const { grudges, gazetteItems } = processOwnerGrudges(mockState, []);

    expect(grudges.length).toBe(1);
    expect(grudges[0]!.intensity).toBe(2);
    expect(gazetteItems[0]).toContain('NEW RIVALRY');
  });

  it('should escalate existing grudges on further kills', () => {
    const existingGrudge = {
      id: 'g1',
      ownerIdA: 'o1',
      ownerIdB: 'o2',
      intensity: 2,
      reason: 'Old feud',
      startWeek: 1,
      lastEscalation: 1,
    };

    const { grudges, gazetteItems } = processOwnerGrudges(mockState, [existingGrudge as any]);

    expect(grudges[0]!.intensity).toBe(3);
    expect(gazetteItems[0]).toContain('GRUDGE DEEPENS');
  });

  it('should not decay grudges if lastEscalation is recent', () => {
    const existingGrudge = {
      id: 'g1',
      ownerIdA: 'o3',
      ownerIdB: 'o4',
      intensity: 3,
      reason: 'Old feud',
      startWeek: 1,
      lastEscalation: 8, // state.week is 10, difference is 2 <= 4
    };

    const { grudges } = processOwnerGrudges(mockState, [existingGrudge as any]);

    expect(grudges[0]!.intensity).toBe(3);
  });

  it('should decay grudges if lastEscalation is old', () => {
    const existingGrudge = {
      id: 'g1',
      ownerIdA: 'o3',
      ownerIdB: 'o4',
      intensity: 3,
      reason: 'Old feud',
      startWeek: 1,
      lastEscalation: 5, // state.week is 10, difference is 5 > 4
    };

    const { grudges } = processOwnerGrudges(mockState, [existingGrudge as any]);

    expect(grudges[0]!.intensity).toBe(2);
  });

  it('should trigger season feud event when intensity crosses 4 threshold', () => {
    const existingGrudge = {
      id: 'g1',
      ownerIdA: 'o1',
      ownerIdB: 'o2',
      intensity: 3,
      reason: 'Old feud',
      startWeek: 1,
      lastEscalation: 1,
    };

    const { grudges, gazetteItems } = processOwnerGrudges(mockState, [existingGrudge as any]);

    expect(grudges[0]!.intensity).toBe(4);
    expect(gazetteItems[1]).toContain('SEASON FEUD');
  });

  it('should not trigger season feud if intensity was already 4 or higher', () => {
    const existingGrudge = {
      id: 'g1',
      ownerIdA: 'o1',
      ownerIdB: 'o2',
      intensity: 4,
      reason: 'Old feud',
      startWeek: 1,
      lastEscalation: 1,
    };

    const { grudges, gazetteItems } = processOwnerGrudges(mockState, [existingGrudge as any]);

    expect(grudges[0]!.intensity).toBe(5);
    expect(gazetteItems.some((i) => i.includes('SEASON FEUD'))).toBe(false);
  });
});

describe('ownerGrudges - calculateRivalryScore', () => {
  it('should calculate score correctly', () => {
    expect(calculateRivalryScore(9, 1, 1)).toBe(5); // 3 (bouts) + 5 (death) + 3 (upset) = 11 -> clamped to 5
    expect(calculateRivalryScore(3, 0, 0)).toBe(1); // 1 + 0 + 0 = 1
  });
});
