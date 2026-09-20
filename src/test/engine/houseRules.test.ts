/**
 * House Rules (Design Bible §21) — non-canonical permadeath variants.
 * Canonical default is full permadeath; house rules must only weaken it.
 */
import { describe, it, expect } from 'vitest';
import { handleDeath } from '@/engine/bout/mortalityHandler';
import { simulateFight, defaultPlanForWarrior } from '@/engine/simulate';
import { computeWarriorStats } from '@/engine/skillCalc';
import type { GameState } from '@/types/state.types';
import type { Warrior } from '@/types/warrior.types';
import { FightingStyle, type Attributes } from '@/types/shared.types';
import type { FightOutcome } from '@/types/combat.types';
import type { WarriorId, StableId } from '@/types/shared.types';

const KILLER_ATTRS: Attributes = {
  ST: 25, CN: 21, SZ: 21, WT: 21, WL: 21, SP: 21, DF: 17,
};
const FRAIL_ATTRS: Attributes = {
  ST: 5, CN: 3, SZ: 9, WT: 9, WL: 9, SP: 9, DF: 5,
};

function makeWarrior(id: string, style: FightingStyle, attrs: Attributes): Warrior {
  const { baseSkills, derivedStats } = computeWarriorStats(attrs, style);
  return {
    id: id as WarriorId,
    name: id,
    style,
    attributes: attrs,
    baseSkills,
    derivedStats,
    fame: 0,
    popularity: 0,
    titles: [],
    injuries: [],
    flair: [],
    career: { wins: 0, losses: 0, kills: 0 },
    champion: false,
    status: 'Active',
    age: 20,
    traits: [],
  };
}

describe('house rules — death rate multiplier', () => {
  const killer = makeWarrior('killer', FightingStyle.BashingAttack, KILLER_ATTRS);
  const victim = makeWarrior('victim', FightingStyle.TotalParry, FRAIL_ATTRS);

  it('canonical mult (1) produces kills in a lopsided matchup', () => {
    let kills = 0;
    for (let i = 0; i < 40; i++) {
      const o = simulateFight(
        defaultPlanForWarrior(killer),
        defaultPlanForWarrior(victim),
        killer,
        victim,
        1000 + i * 7919
      );
      if (o.by === 'Kill') kills++;
    }
    expect(kills).toBeGreaterThan(0);
  });

  it('deathRateMult 0 produces zero kills across the same seeds', () => {
    let kills = 0;
    for (let i = 0; i < 40; i++) {
      const o = simulateFight(
        defaultPlanForWarrior(killer),
        defaultPlanForWarrior(victim),
        killer,
        victim,
        1000 + i * 7919,
        undefined,
        'Clear',
        'standard_arena',
        undefined,
        true,
        0
      );
      if (o.by === 'Kill') kills++;
    }
    expect(kills).toBe(0);
  });
});

describe('house rules — severe injury instead of death', () => {
  const outcome: FightOutcome = { winner: 'A', by: 'Kill', minutes: 5, log: [] };

  it('converts a Kill into a Critical injury with no graveyard entry', () => {
    const wA = { id: 'wa' as WarriorId, name: 'A', stableId: 'player-1' as StableId, injuries: [] } as unknown as Warrior;
    const wD = {
      id: 'wd' as WarriorId,
      name: 'D',
      stableId: 'player-1' as StableId,
      injuries: [],
    } as unknown as Warrior;
    const s = {
      week: 1,
      roster: [wA, wD],
      graveyard: [],
      rivalMap: new Map(),
      rivalries: [],
      houseRules: { deathRateMult: 1, severeInjuryInsteadOfDeath: true },
    } as unknown as GameState;

    const res = handleDeath(s, wA, wD, outcome, 1, []);

    expect(res.death).toBe(false);
    expect(res.playerDeath).toBe(false);
    expect(res.deathNames).toHaveLength(0);
    expect(res.impact.graveyard).toBeUndefined();
    const upd = res.impact.rosterUpdates?.get(wD.id);
    expect(upd?.injuries?.[0]?.severity).toBe('Critical');
    expect(res.impact.newsletterItems?.[0]?.items[0]).toContain('House rule');
  });

  it('canonical rules still produce a death', () => {
    const wA = { id: 'wa' as WarriorId, name: 'A', stableId: 'player-1' as StableId, injuries: [] } as unknown as Warrior;
    const wD = {
      id: 'wd' as WarriorId,
      name: 'D',
      stableId: 'player-1' as StableId,
      injuries: [],
    } as unknown as Warrior;
    const s = {
      week: 1,
      season: 'Spring',
      roster: [wA, wD],
      graveyard: [],
      rivalMap: new Map(),
      rivalries: [],
    } as unknown as GameState;

    const res = handleDeath(s, wA, wD, outcome, 1, []);
    expect(res.death).toBe(true);
  });
});
