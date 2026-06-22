import { describe, it, expect } from 'vitest';
import { processAIRosterManagement } from '@/engine/owner/roster/management';
import type { GameState, RivalStableData } from '@/types/state.types';
import type { Warrior } from '@/types/warrior.types';
import { FightingStyle } from '@/types/shared.types';

function warrior(id: string, traits: string[], over: Partial<Warrior> = {}): Warrior {
  return {
    id,
    name: id,
    style: FightingStyle.SlashingAttack,
    styleName: FightingStyle.SlashingAttack,
    attributes: { WT: 12, WL: 12, ST: 12, SP: 12, DF: 12, AG: 12 },
    fame: 10,
    career: { wins: 5, losses: 5, kills: 1 },
    status: 'Active',
    age: 26,
    traits,
    ...over,
  } as unknown as Warrior;
}

function methodicalRival(roster: Warrior[]): RivalStableData {
  return {
    id: 's1',
    owner: {
      id: 's1',
      name: 'Slow Sam',
      stableName: 'The Patient',
      fame: 0,
      renown: 0,
      titles: 0,
      personality: 'Methodical',
    },
    fame: 0,
    roster,
    treasury: 5000,
    ledger: [],
    trainingAssignments: [],
  } as unknown as RivalStableData;
}

describe('liability cull honors the Release recommendation', () => {
  it('a 2-flaw warrior is released even by the most lenient personality', () => {
    // High fame (100) pulls the liability score down to ~68 — below Methodical's
    // threshold of 78, but the Release recommendation still fires (2 flaws + score > 55).
    // Without wiring the Release signal, this warrior survives under Methodical.
    const flawed = warrior('flawed', ['fragile', 'slow'], { fame: 100 });
    const clean = warrior('clean', ['quick'], { fame: 100 });
    const filler = (n: string) => warrior(n, [], { fame: 100 });
    const rival = methodicalRival([flawed, clean, filler('a'), filler('b'), filler('c')]);
    const state = {
      week: 40,
      rivals: [rival],
      roster: [],
      graveyard: [],
      retired: [],
      arenaHistory: [],
    } as unknown as GameState;

    const { updatedRivals } = processAIRosterManagement(state);
    const updated = updatedRivals[0]!;
    const stillActive = updated.roster.filter((w) => w.status === 'Active').map((w) => w.id);

    expect(stillActive).not.toContain('flawed');
    expect(stillActive).toContain('clean');
  });
});
