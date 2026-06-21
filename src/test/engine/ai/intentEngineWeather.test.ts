/**
 * Gap 7 — intentEngine only checks 'Rainy' weather.
 * pickWeeklyIntent and verifyIntentSkepticism should consider all
 * hazardous weather types (Blizzard, Sandstorm, Gale, Tornado, etc.)
 * when deciding strategic intent for precision-heavy stables.
 */
import { describe, it, expect } from 'vitest';
import { FightingStyle } from '@/types/shared.types';
import type { GameState, RivalStableData } from '@/types/state.types';
import { pickWeeklyIntent, verifyIntentSkepticism } from '@/engine/ai/intentEngine';

// ─── Helpers ────────────────────────────────────────────────────────────────

function makeRival(overrides: Partial<RivalStableData> = {}): RivalStableData {
  return {
    id: 'rival-1' as any,
    owner: {
      id: 'owner-1' as any,
      name: 'Owner',
      stableName: 'Stable',
      fame: 100,
      renown: 50,
      titles: 0,
      personality: 'Pragmatic',
      favoredStyles: [],
    },
    roster: [],
    treasury: 1000,
    fame: 100,
    ledger: [],
    trainingAssignments: [],
    ...overrides,
  } as RivalStableData;
}

function makeLungeRoster(): any[] {
  // 3 LungingAttack + 1 BashingAttack = 75% precision-heavy
  return [
    {
      id: 'w1',
      name: 'L1',
      style: FightingStyle.LungingAttack,
      status: 'Active',
      injuries: [],
      attributes: { CN: 10 },
    },
    {
      id: 'w2',
      name: 'L2',
      style: FightingStyle.LungingAttack,
      status: 'Active',
      injuries: [],
      attributes: { CN: 10 },
    },
    {
      id: 'w3',
      name: 'L3',
      style: FightingStyle.LungingAttack,
      status: 'Active',
      injuries: [],
      attributes: { CN: 10 },
    },
    {
      id: 'w4',
      name: 'B1',
      style: FightingStyle.BashingAttack,
      status: 'Active',
      injuries: [],
      attributes: { CN: 10 },
    },
  ];
}

function makeState(weather: string): GameState {
  return {
    week: 5,
    season: 'Spring',
    year: 1,
    weather: weather as any,
    treasury: 1000,
    fame: 500,
    popularity: 500,
    roster: [],
    rivals: [],
    arenaHistory: [],
  } as any as GameState;
}

// ─── Tests ──────────────────────────────────────────────────────────────────

describe('Gap 7: pickWeeklyIntent checks hazardous weather beyond Rainy', () => {
  it('returns RECOVERY for precision-heavy stable in Blizzard', () => {
    const rival = makeRival({ roster: makeLungeRoster() as any });
    const state = makeState('Blizzard');
    const intent = pickWeeklyIntent(rival, state);
    expect(intent).toBe('RECOVERY');
  });

  it('returns RECOVERY for precision-heavy stable in Sandstorm', () => {
    const rival = makeRival({ roster: makeLungeRoster() as any });
    const state = makeState('Sandstorm');
    const intent = pickWeeklyIntent(rival, state);
    expect(intent).toBe('RECOVERY');
  });

  it('returns RECOVERY for precision-heavy stable in Gale', () => {
    const rival = makeRival({ roster: makeLungeRoster() as any });
    const state = makeState('Gale');
    const intent = pickWeeklyIntent(rival, state);
    expect(intent).toBe('RECOVERY');
  });

  it('returns RECOVERY for precision-heavy stable in Tornado', () => {
    const rival = makeRival({ roster: makeLungeRoster() as any });
    const state = makeState('Tornado');
    const intent = pickWeeklyIntent(rival, state);
    expect(intent).toBe('RECOVERY');
  });

  it('does NOT trigger RECOVERY for precision-heavy stable in Clear weather', () => {
    const rival = makeRival({ roster: makeLungeRoster() as any, treasury: 500 });
    const state = makeState('Clear');
    const intent = pickWeeklyIntent(rival, state);
    // Should not be RECOVERY due to weather (only Rainy triggers currently)
    expect(intent).not.toBe('RECOVERY');
  });
});

describe('Gap 7: verifyIntentSkepticism checks hazardous weather beyond Rainy', () => {
  it('disproves VENDETTA in Blizzard for precision-heavy stable', () => {
    const rival = makeRival({
      roster: [{ status: 'Active', style: FightingStyle.LungingAttack } as any],
      strategy: { intent: 'VENDETTA', planWeeksRemaining: 5 },
    });
    const state = makeState('Blizzard');
    expect(verifyIntentSkepticism(rival, state)).toBe(true);
  });

  it('disproves EXPANSION in Sandstorm for precision-heavy stable', () => {
    const rival = makeRival({
      roster: [{ status: 'Active', style: FightingStyle.LungingAttack } as any],
      strategy: { intent: 'EXPANSION', planWeeksRemaining: 3 },
    });
    const state = makeState('Sandstorm');
    expect(verifyIntentSkepticism(rival, state)).toBe(true);
  });

  it('does NOT disprove in Clear weather', () => {
    const rival = makeRival({
      roster: [
        { status: 'Active' } as any,
        { status: 'Active' } as any,
        { status: 'Active' } as any,
      ],
      strategy: { intent: 'CONSOLIDATION', planWeeksRemaining: 3 },
      treasury: 500,
    });
    const state = makeState('Clear');
    expect(verifyIntentSkepticism(rival, state)).toBe(false);
  });
});
