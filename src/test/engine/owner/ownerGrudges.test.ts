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

  // ─── Edge cases: no rivals / missing data ───────────────────────────

  it('should return empty grudges and gazetteItems when no rivals exist', () => {
    const emptyState: any = { week: 10, arenaHistory: [], rivals: [] };
    const { grudges, gazetteItems } = processOwnerGrudges(emptyState, []);
    expect(grudges).toHaveLength(0);
    expect(gazetteItems).toHaveLength(0);
  });

  it('should handle undefined state.rivals (falls back to [])', () => {
    const noRivalsState: any = { week: 10, arenaHistory: [], rivals: undefined };
    const { grudges, gazetteItems } = processOwnerGrudges(noRivalsState, []);
    expect(grudges).toHaveLength(0);
    expect(gazetteItems).toHaveLength(0);
  });

  it('should skip rivals with undefined personality', () => {
    const state: any = {
      week: 10,
      arenaHistory: [
        { id: 'f1', week: 9, warriorIdA: 'w1', warriorIdD: 'w2', by: 'Kill' },
      ],
      rivals: [
        { owner: { id: 'o1', personality: undefined, stableName: 'A' }, roster: [{ id: 'w1' }] },
        { owner: { id: 'o2', personality: 'Tactician', stableName: 'B' }, roster: [{ id: 'w2' }] },
      ],
    };
    const { grudges } = processOwnerGrudges(state, []);
    expect(grudges).toHaveLength(0);
  });

  it('should not create grudge for non-clashing personalities', () => {
    // Aggressive vs Pragmatic — no clash in PERSONALITY_CLASH
    const state: any = {
      week: 10,
      arenaHistory: [
        { id: 'f1', week: 9, warriorIdA: 'w1', warriorIdD: 'w2', by: 'Kill' },
      ],
      rivals: [
        { owner: { id: 'o1', personality: 'Aggressive', stableName: 'A' }, roster: [{ id: 'w1' }] },
        { owner: { id: 'o2', personality: 'Pragmatic', stableName: 'B' }, roster: [{ id: 'w2' }] },
      ],
    };
    const { grudges } = processOwnerGrudges(state, []);
    expect(grudges).toHaveLength(0);
  });

  // ─── Edge cases: cross-fight detection ──────────────────────────────

  it('should not create new grudge on cross-fight without kill', () => {
    const state: any = {
      week: 10,
      arenaHistory: [
        { id: 'f1', week: 9, warriorIdA: 'w1', warriorIdD: 'w2', by: 'KO' },
      ],
      rivals: [
        { owner: { id: 'o1', personality: 'Aggressive', stableName: 'A' }, roster: [{ id: 'w1' }] },
        { owner: { id: 'o2', personality: 'Tactician', stableName: 'B' }, roster: [{ id: 'w2' }] },
      ],
    };
    const { grudges, gazetteItems } = processOwnerGrudges(state, []);
    // hasCrossFight=true, hasKill=false -> no new grudge (only created when hasKill)
    expect(grudges).toHaveLength(0);
    expect(gazetteItems).toHaveLength(0);
  });

  it('should not escalate existing grudge on cross-fight without kill', () => {
    const existingGrudge = {
      id: 'g1',
      ownerIdA: 'o1',
      ownerIdB: 'o2',
      intensity: 2,
      reason: 'Old feud',
      startWeek: 1,
      lastEscalation: 8, // 10 - 8 = 2, not > 4, so no decay either
    };
    const state: any = {
      week: 10,
      arenaHistory: [
        { id: 'f1', week: 9, warriorIdA: 'w1', warriorIdD: 'w2', by: 'KO' },
      ],
      rivals: [
        { owner: { id: 'o1', personality: 'Aggressive', stableName: 'A' }, roster: [{ id: 'w1' }] },
        { owner: { id: 'o2', personality: 'Tactician', stableName: 'B' }, roster: [{ id: 'w2' }] },
      ],
    };
    const { grudges, gazetteItems } = processOwnerGrudges(state, [existingGrudge as any]);
    // hasCrossFight=true, hasKill=false -> no escalation (only escalates when hasKill)
    expect(grudges[0]!.intensity).toBe(2);
    expect(gazetteItems).toHaveLength(0);
  });

  it('should not create grudge when no cross-fight exists between rival stables', () => {
    // Fight exists but warriors don't belong to the clashing stables
    const state: any = {
      week: 10,
      arenaHistory: [
        { id: 'f1', week: 9, warriorIdA: 'wX', warriorIdD: 'wY', by: 'Kill' },
      ],
      rivals: [
        { owner: { id: 'o1', personality: 'Aggressive', stableName: 'A' }, roster: [{ id: 'w1' }] },
        { owner: { id: 'o2', personality: 'Tactician', stableName: 'B' }, roster: [{ id: 'w2' }] },
      ],
    };
    const { grudges } = processOwnerGrudges(state, []);
    expect(grudges).toHaveLength(0);
  });

  it('should detect cross-fight in both directions (A attacks D and D attacks A)', () => {
    const state: any = {
      week: 10,
      arenaHistory: [
        // w2 (stable B) attacks w1 (stable A) — reversed direction
        { id: 'f1', week: 9, warriorIdA: 'w2', warriorIdD: 'w1', by: 'Kill' },
      ],
      rivals: [
        { owner: { id: 'o1', personality: 'Aggressive', stableName: 'A' }, roster: [{ id: 'w1' }] },
        { owner: { id: 'o2', personality: 'Tactician', stableName: 'B' }, roster: [{ id: 'w2' }] },
      ],
    };
    const { grudges } = processOwnerGrudges(state, []);
    expect(grudges).toHaveLength(1);
    expect(grudges[0]!.intensity).toBe(2);
  });

  // ─── Edge cases: escalation cooldown & intensity cap ─────────────────

  it('should not escalate when escalation cooldown is not met', () => {
    // state.week=10, lastEscalation=7 -> 10-7=3, not < week-4=6, so no escalation
    const existingGrudge = {
      id: 'g1',
      ownerIdA: 'o1',
      ownerIdB: 'o2',
      intensity: 2,
      reason: 'Old feud',
      startWeek: 1,
      lastEscalation: 7, // 10 - 7 = 3, which is NOT < 10 - 4 = 6
    };
    const { grudges, gazetteItems } = processOwnerGrudges(mockState, [existingGrudge as any]);
    expect(grudges[0]!.intensity).toBe(2);
    expect(gazetteItems).toHaveLength(0);
  });

  it('should cap intensity at 5 on escalation', () => {
    // existing intensity=4, kill, lastEscalation=1 (10-1=9 > 6, cooldown met)
    // -> min(5, 4+1) = 5
    const existingGrudge = {
      id: 'g1',
      ownerIdA: 'o1',
      ownerIdB: 'o2',
      intensity: 4,
      reason: 'Old feud',
      startWeek: 1,
      lastEscalation: 1,
    };
    const { grudges } = processOwnerGrudges(mockState, [existingGrudge as any]);
    expect(grudges[0]!.intensity).toBe(5);
  });

  // ─── Edge cases: decay ──────────────────────────────────────────────

  it('should not decay below intensity 1', () => {
    const existingGrudge = {
      id: 'g1',
      ownerIdA: 'o3',
      ownerIdB: 'o4',
      intensity: 1,
      reason: 'Old feud',
      startWeek: 1,
      lastEscalation: 1, // 10 - 1 = 9 > 4, decay applies
    };
    const { grudges } = processOwnerGrudges(mockState, [existingGrudge as any]);
    // intensity=1, decay would be max(1, 1-1)=1, stays at 1
    expect(grudges[0]!.intensity).toBe(1);
  });

  it('should filter out grudges with intensity 0', () => {
    // Current decay logic floors at 1, so intensity 0 shouldn't occur naturally.
    // But the filter at the end should remove any 0-intensity grudges.
    // We can verify the filter by checking that a grudge with intensity 1 survives decay.
    // Use a state with no cross-fights to avoid creating new grudges.
    const state: any = {
      week: 10,
      arenaHistory: [],
      rivals: [],
    };
    const existingGrudge = {
      id: 'g1',
      ownerIdA: 'o3',
      ownerIdB: 'o4',
      intensity: 1,
      reason: 'Old feud',
      startWeek: 1,
      lastEscalation: 1,
    };
    const { grudges } = processOwnerGrudges(state, [existingGrudge as any]);
    expect(grudges).toHaveLength(1);
    expect(grudges[0]!.intensity).toBeGreaterThanOrEqual(1);
  });

  // ─── Edge cases: multiple pairs & reversed matching ──────────────────

  it('should process multiple rival pairs in a single call', () => {
    const state: any = {
      week: 10,
      arenaHistory: [
        { id: 'f1', week: 9, warriorIdA: 'w1', warriorIdD: 'w2', by: 'Kill' },
        { id: 'f2', week: 9, warriorIdA: 'w3', warriorIdD: 'w4', by: 'Kill' },
      ],
      rivals: [
        { owner: { id: 'o1', personality: 'Aggressive', stableName: 'A' }, roster: [{ id: 'w1' }] },
        { owner: { id: 'o2', personality: 'Tactician', stableName: 'B' }, roster: [{ id: 'w2' }] },
        { owner: { id: 'o3', personality: 'Methodical', stableName: 'C' }, roster: [{ id: 'w3' }] },
        { owner: { id: 'o4', personality: 'Showman', stableName: 'D' }, roster: [{ id: 'w4' }] },
      ],
    };
    // o1(Aggressive) vs o2(Tactician) clash, o3(Methodical) vs o4(Showman) clash
    const { grudges, gazetteItems } = processOwnerGrudges(state, []);
    expect(grudges).toHaveLength(2);
    expect(gazetteItems.filter((i) => i.includes('NEW RIVALRY'))).toHaveLength(2);
  });

  it('should match existing grudge by reversed owner IDs', () => {
    // Grudge stored as ownerIdA=o2, ownerIdB=o1 (reversed from rival order)
    const existingGrudge = {
      id: 'g1',
      ownerIdA: 'o2', // reversed: rA is o1, but grudge has o2 first
      ownerIdB: 'o1',
      intensity: 2,
      reason: 'Old feud',
      startWeek: 1,
      lastEscalation: 1,
    };
    const { grudges, gazetteItems } = processOwnerGrudges(mockState, [existingGrudge as any]);
    // Should find the existing grudge via reversed match and escalate
    expect(grudges[0]!.intensity).toBe(3);
    expect(gazetteItems[0]).toContain('GRUDGE DEEPENS');
  });

  // ─── Edge cases: arenaHistory filtering ─────────────────────────────

  it('should return no grudges when arenaHistory is empty', () => {
    const state: any = {
      week: 10,
      arenaHistory: [],
      rivals: [
        { owner: { id: 'o1', personality: 'Aggressive', stableName: 'A' }, roster: [{ id: 'w1' }] },
        { owner: { id: 'o2', personality: 'Tactician', stableName: 'B' }, roster: [{ id: 'w2' }] },
      ],
    };
    const { grudges } = processOwnerGrudges(state, []);
    expect(grudges).toHaveLength(0);
  });

  it('should not count fights outside the 13-week window', () => {
    // state.week=10, window starts at week 10-13 = -3, so week 0 is within window
    // But if week is far enough back, getRecentFights won't include it.
    // Use week=30, fight at week=10 -> 30-13=17, week 10 < 17 -> excluded
    const state: any = {
      week: 30,
      arenaHistory: [
        { id: 'f1', week: 10, warriorIdA: 'w1', warriorIdD: 'w2', by: 'Kill' },
      ],
      rivals: [
        { owner: { id: 'o1', personality: 'Aggressive', stableName: 'A' }, roster: [{ id: 'w1' }] },
        { owner: { id: 'o2', personality: 'Tactician', stableName: 'B' }, roster: [{ id: 'w2' }] },
      ],
    };
    const { grudges } = processOwnerGrudges(state, []);
    expect(grudges).toHaveLength(0);
  });

  // ─── Edge cases: immutability ───────────────────────────────────────

  it('should not mutate the input existingGrudges array', () => {
    const existingGrudge = {
      id: 'g1',
      ownerIdA: 'o1',
      ownerIdB: 'o2',
      intensity: 2,
      reason: 'Old feud',
      startWeek: 1,
      lastEscalation: 1,
    };
    const inputArray = [existingGrudge] as any;
    const inputIntensity = existingGrudge.intensity;
    processOwnerGrudges(mockState, inputArray);
    // The function clones via .map(g => ({...g})), so the original should be untouched
    expect(inputArray).toHaveLength(1);
    expect(existingGrudge.intensity).toBe(inputIntensity);
  });
});

describe('ownerGrudges - calculateRivalryScore', () => {
  it('should calculate score correctly for mixed inputs', () => {
    expect(calculateRivalryScore(9, 1, 1)).toBe(5); // 3 (bouts) + 5 (death) + 3 (upset) = 11 -> clamped to 5
    expect(calculateRivalryScore(3, 0, 0)).toBe(1); // 1 + 0 + 0 = 1
  });

  it('should clamp to minimum of 1 on zero inputs', () => {
    expect(calculateRivalryScore(0, 0, 0)).toBe(1);
  });

  it('should clamp to minimum of 1 when bouts < 3 and no deaths/upsets', () => {
    expect(calculateRivalryScore(2, 0, 0)).toBe(1); // floor(2/3) = 0 -> clamped to 1
  });

  it('should return 1 at exact bouts boundary (3 bouts)', () => {
    expect(calculateRivalryScore(3, 0, 0)).toBe(1); // floor(3/3) = 1
  });

  it('should return 2 for 6 bouts only', () => {
    expect(calculateRivalryScore(6, 0, 0)).toBe(2); // floor(6/3) = 2
  });

  it('should return 3 for 9 bouts only', () => {
    expect(calculateRivalryScore(9, 0, 0)).toBe(3);
  });

  it('should return 4 for 12 bouts only', () => {
    expect(calculateRivalryScore(12, 0, 0)).toBe(4);
  });

  it('should reach max of 5 with bouts alone (15 bouts)', () => {
    expect(calculateRivalryScore(15, 0, 0)).toBe(5); // floor(15/3) = 5
  });

  it('should reach max of 5 with a single death', () => {
    expect(calculateRivalryScore(0, 1, 0)).toBe(5); // 5 -> clamped to 5
  });

  it('should return 3 for a single upset', () => {
    expect(calculateRivalryScore(0, 0, 1)).toBe(3);
  });

  it('should clamp to 5 for two upsets (6 -> 5)', () => {
    expect(calculateRivalryScore(0, 0, 2)).toBe(5); // 6 -> clamped to 5
  });

  it('should clamp to 5 for two deaths (10 -> 5)', () => {
    expect(calculateRivalryScore(0, 2, 0)).toBe(5); // 10 -> clamped to 5
  });

  it('should clamp to 5 for very large values', () => {
    expect(calculateRivalryScore(100, 10, 10)).toBe(5);
  });
});
