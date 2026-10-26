/**
 * Weekly gazette — personal ads flush + seeded rival taunts.
 */
import { describe, it, expect } from 'vitest';
import { flushGazette } from '@/engine/narrative/gazette';
import { makeGameState, makeRival, makeWarrior, makeOwner } from '@/test/_fixtures/factories';
import type { StableId } from '@/types/shared.types';

const rivalWith = (name: string, stableName: string, fame: number) =>
  makeRival({
    id: `stable-${name}` as StableId,
    roster: [makeWarrior({ name, fame })],
    owner: makeOwner({ stableName }),
  });

describe('flushGazette', () => {
  it('flushes queued player ads into a Personal Ads newsletter item and clears the queue', () => {
    const state = makeGameState({ rivals: [] });
    state.playerAds = ['HAIL THE SANDS', 'SEEKING RIVALS OF HONOR'];
    flushGazette(state);
    const adItem = state.newsletter.find((n) => n.title === 'Personal Ads');
    expect(adItem).toBeDefined();
    expect(adItem!.items).toEqual(['HAIL THE SANDS', 'SEEKING RIVALS OF HONOR']);
    expect(state.playerAds).toEqual([]);
  });

  it('emits no ad item when the queue is empty but still posts a taunt', () => {
    const state = makeGameState({
      rivals: [rivalWith('Crowsfoot', 'Iron Mercy', 120)],
    });
    state.playerAds = [];
    flushGazette(state);
    expect(state.newsletter.find((n) => n.title === 'Personal Ads')).toBeUndefined();
    const taunt = state.newsletter.find((n) => n.title === 'Arena Taunts');
    expect(taunt).toBeDefined();
    expect(taunt!.items[0]).toContain('Crowsfoot');
    expect(taunt!.items[0]).toContain('Iron Mercy');
  });

  it('the loudest stable is the highest-fame rival warrior', () => {
    const state = makeGameState({
      rivals: [
        rivalWith('Quiet One', 'Low Table', 10),
        rivalWith('Big Mouth', 'Top Table', 200),
        rivalWith('Mid Voice', 'Mid Table', 60),
      ],
    });
    flushGazette(state);
    const taunt = state.newsletter.find((n) => n.title === 'Arena Taunts');
    expect(taunt!.items[0]).toContain('Big Mouth');
    expect(taunt!.items[0]).toContain('Top Table');
  });

  it('is deterministic for the same week', () => {
    const build = () => {
      const s = makeGameState({ rivals: [rivalWith('Crowsfoot', 'Iron Mercy', 120)] });
      s.week = 12;
      flushGazette(s);
      return s.newsletter.find((n) => n.title === 'Arena Taunts')!.items[0];
    };
    expect(build()).toBe(build());
  });

  it('does nothing harmful on an empty game state', () => {
    const state = makeGameState({ rivals: [] });
    flushGazette(state);
    expect(state.newsletter.length).toBe(0);
  });

  it('flushes player spotlights into titled Spotlight items and clears the queue', () => {
    const hero = makeWarrior({ name: 'Bloodfang' });
    const state = makeGameState({ roster: [hero], rivals: [] });
    state.playerSpotlights = [{ warriorId: hero.id as string, text: 'Watch this one.' }];
    flushGazette(state);
    const item = state.newsletter.find((n) => n.title === 'Spotlight: Bloodfang');
    expect(item).toBeDefined();
    expect(item!.items).toEqual(['Watch this one.']);
    expect(state.playerSpotlights).toEqual([]);
  });

  it('falls back to a generic title when the spotlighted warrior cannot be found', () => {
    const state = makeGameState({ roster: [], rivals: [] });
    state.playerSpotlights = [{ warriorId: 'ghost-id', text: 'A mystery.' }];
    flushGazette(state);
    expect(state.newsletter.find((n) => n.title === 'Spotlight: Unknown Warrior')).toBeDefined();
  });
});
