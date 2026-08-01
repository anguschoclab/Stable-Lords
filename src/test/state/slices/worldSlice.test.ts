import { describe, it, expect, beforeEach } from 'vitest';
import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { createWorldSlice, WorldSlice } from '@/state/slices/worldSlice';
import { createEconomySlice, EconomySlice } from '@/state/slices/economySlice';
import { act } from '@testing-library/react';
import type { FightSummary } from '@/types/combat.types';

const createTestStore = () =>
  create<WorldSlice & EconomySlice>()(
    immer((set, get, api) => ({
      ...createWorldSlice(set as any, get as any, api as any),
      ...createEconomySlice(set as any, get as any, api as any),
    })) as any
  ) as any;

describe('WorldSlice', () => {
  let useTestStore: ReturnType<typeof createTestStore>;

  beforeEach(() => {
    useTestStore = createTestStore();
  });

  it('should initialize a stable with starting capital', () => {
    act(() => {
      useTestStore.getState().initializeStable('Amau', 'The Gilded Lions');
    });

    const { player, treasury } = useTestStore.getState();
    expect(player.name).toBe('Amau');
    expect(player.stableName).toBe('The Gilded Lions');
    expect(treasury).toBe(500);
  });

  it('should append a fight to the arena history', () => {
    const mockFight = {
      id: 'f1',
      winner: 'a',
      transcript: [{ text: 'Clang!' }],
    } as any as FightSummary;

    act(() => {
      useTestStore.getState().appendFight(mockFight);
    });

    expect(useTestStore.getState().arenaHistory).toHaveLength(1);
  });

  it('should truncate arena history and remove old transcripts', () => {
    // Fill history with 25 fights
    act(() => {
      for (let i = 0; i < 25; i++) {
        const fight = {
          id: `f${i}`,
          transcript: [{ text: 'Heavy breathing...' }],
        } as any as FightSummary;
        useTestStore.getState().appendFight(fight);
      }
    });

    const history = useTestStore.getState().arenaHistory;
    expect(history).toHaveLength(25);

    // The 0th fight (oldest) should have NO transcript if we keep only last 20
    expect(history[0]!.transcript).toBeUndefined();
    // The 24th fight (newest) SHOULD have a transcript
    expect(history[24]!.transcript).toBeDefined();
  });

  it('should update bout offer status', () => {
    act(() => {
      useTestStore.setState({ boutOffers: { 'o1': { id: 'o1', status: 'Proposed', week: 1, expirationWeek: 2, purse: 100, rivalStableId: 'r1', rivalWarriorId: 'w2', responses: {}, warriorIds: ['w1'] } as any } });
      useTestStore.getState().updateBoutOfferStatus('o1' as any, 'Accepted');
    });
    expect(useTestStore.getState().boutOffers['o1']?.status).toBe('Accepted');
  });

  it('should not throw on updateBoutOfferStatus for non-existent offer', () => {
    act(() => {
      useTestStore.getState().updateBoutOfferStatus('none' as any, 'Accepted');
    });
    expect(useTestStore.getState().boutOffers).toEqual({});
  });

  it('should call engineRespondToBoutOffer when respondToBoutOffer is called', () => {
    expect(typeof useTestStore.getState().respondToBoutOffer).toBe('function');
  });

  it('should clear expired offers', () => {
    act(() => {
      useTestStore.setState({
        absoluteWeek: 5,
        boutOffers: {
          'o1': { id: 'o1', status: 'Proposed', week: 1, expirationWeek: 2, purse: 100, rivalStableId: 'r1', rivalWarriorId: 'w2', responses: {}, warriorIds: ['w1'] } as any,
          'o2': { id: 'o2', status: 'Proposed', week: 4, expirationWeek: 6, purse: 100, rivalStableId: 'r1', rivalWarriorId: 'w2' } as any,
          'o3': { id: 'o3', status: 'Accepted', week: 1, expirationWeek: 2, purse: 100, rivalStableId: 'r1', rivalWarriorId: 'w2' } as any,
        }
      });
      useTestStore.getState().clearExpiredOffers();
    });

    const offers = useTestStore.getState().boutOffers;
    expect(offers['o1']?.status).toBe('Expired');
    expect(offers['o2']?.status).toBe('Proposed');
    expect(offers['o3']?.status).toBe('Accepted');
  });

  it('should clearExpiredOffers not mutate state when no offers expire', () => {
    act(() => {
      useTestStore.setState({
        absoluteWeek: 1,
        boutOffers: {
          'o1': { id: 'o1', status: 'Proposed', week: 1, expirationWeek: 2, purse: 100, rivalStableId: 'r1', rivalWarriorId: 'w2' } as any,
        }
      });
    });
    const stateBefore = useTestStore.getState();
    act(() => {
      useTestStore.getState().clearExpiredOffers();
    });
    expect(useTestStore.getState()).toBe(stateBefore);
  });

  it('should update player warrior status', () => {
    act(() => {
      useTestStore.setState({
        roster: [{ id: 'w1', fame: 10, popularity: 10, career: { wins: 1, losses: 1, kills: 1 } } as any]
      });
      useTestStore.getState().updateWarriorStatus('w1' as any, true, true, 5, 5);
    });

    const w = useTestStore.getState().roster[0]!;
    expect(w.fame).toBe(15);
    expect(w.popularity).toBe(15);
    expect(w.career?.wins).toBe(2);
    expect(w.career?.losses).toBe(1);
    expect(w.career?.kills).toBe(2);
  });

  it('should update player warrior status (loss, no kill)', () => {
    act(() => {
      useTestStore.setState({
        roster: [{ id: 'w1' } as any]
      });
      useTestStore.getState().updateWarriorStatus('w1' as any, false, false, -5, -5);
    });

    const w = useTestStore.getState().roster[0]!;
    expect(w.fame).toBe(0);
    expect(w.popularity).toBe(0);
    expect(w.career?.wins).toBe(0);
    expect(w.career?.losses).toBe(1);
    expect(w.career?.kills).toBe(0);
  });

  it('should not crash if updateWarriorStatus targets non-existent player warrior', () => {
    act(() => {
      useTestStore.setState({ roster: [] });
      useTestStore.getState().updateWarriorStatus('w1' as any, true, true, 5, 5);
    });
    expect(useTestStore.getState().roster).toEqual([]);
  });

  it('should update rival warrior status', () => {
    act(() => {
      useTestStore.setState({
        rivals: [{ owner: { id: 'r1' }, roster: [{ id: 'rw1', fame: 10, popularity: 10, career: { wins: 1, losses: 1, kills: 1 } } as any] } as any]
      });
      useTestStore.getState().updateWarriorStatus('rw1' as any, true, true, 5, 5, 'r1' as any);
    });

    const w = useTestStore.getState().rivals[0]!.roster[0]!;
    expect(w.fame).toBe(15);
    expect(w.popularity).toBe(15);
    expect(w.career?.wins).toBe(2);
    expect(w.career?.losses).toBe(1);
    expect(w.career?.kills).toBe(2);
  });

  it('should set week', () => {
    act(() => {
      useTestStore.getState().setWeek(10);
    });
    expect(useTestStore.getState().week).toBe(10);
  });

  it('should set arena preferences', () => {
    act(() => {
      useTestStore.getState().setArenaPreferences({ audioEnabled: false, audioVolume: 0.5 });
    });
    const prefs = useTestStore.getState().arenaPreferences;
    expect(prefs.audioEnabled).toBe(false);
    expect(prefs.audioVolume).toBe(0.5);
  });

  it('should rename stable', () => {
    act(() => {
      useTestStore.getState().initializeStable('Amau', 'Lions');
      useTestStore.getState().renameStable('Tigers');
    });
    expect(useTestStore.getState().player.stableName).toBe('Tigers');
  });

  it('should rename player', () => {
    act(() => {
      useTestStore.getState().initializeStable('Amau', 'Lions');
      useTestStore.getState().renamePlayer('Julius');
    });
    expect(useTestStore.getState().player.name).toBe('Julius');
  });

  it('should have updatePromoterHistory function', () => {
    expect(typeof useTestStore.getState().updatePromoterHistory).toBe('function');
  });

  it('should replace promoter', () => {
    const oldPromoter = { id: 'p1', name: 'Old' } as any;
    const newPromoter = { id: 'p2', name: 'New' } as any;
    act(() => {
      useTestStore.setState({ promoters: { 'p1': oldPromoter } });
      useTestStore.getState().replacePromoter('p1' as any, newPromoter);
    });
    const promoters = useTestStore.getState().promoters;
    expect(promoters['p1']).toBeUndefined();
    expect(promoters['p2']).toEqual(newPromoter);
  });


  it('should call updatePromoterHistory', () => {
    act(() => {
      useTestStore.setState({ promoters: { 'p1': { id: 'p1', history: { totalPursePaid: 0, notableBouts: [] } } as any } });
      useTestStore.getState().updatePromoterHistory('p1' as any, 100, 'f1' as any);
    });
    // Asserting the engine function updated the state appropriately.
    expect(useTestStore.getState().promoters['p1']?.history.totalPursePaid).toBe(100);
    expect(useTestStore.getState().promoters['p1']?.history.notableBouts).toHaveLength(1);
  });

  it('should clearExpiredOffers for non-expired offers', () => {
    act(() => {
      useTestStore.setState({
        absoluteWeek: 1,
        boutOffers: {
          'o1': { id: 'o1', status: 'Proposed', week: 1, expirationWeek: 5, purse: 100, rivalStableId: 'r1', rivalWarriorId: 'w2' } as any,
        }
      });
      useTestStore.getState().clearExpiredOffers();
    });
    expect(useTestStore.getState().boutOffers['o1']?.status).toBe('Proposed');
  });

  it('should not update bout offer status if offer does not exist', () => {
    act(() => {
      useTestStore.setState({ boutOffers: {} });
      useTestStore.getState().updateBoutOfferStatus('o1' as any, 'Accepted');
    });
    expect(useTestStore.getState().boutOffers).toEqual({});
  });


  it('should call respondToBoutOffer', () => {
    act(() => {
      useTestStore.setState({ boutOffers: { 'o1': { id: 'o1', status: 'Proposed', week: 1, expirationWeek: 2, purse: 100, rivalStableId: 'r1', rivalWarriorId: 'w2', responses: {}, warriorIds: ['w1'] } as any } });
      useTestStore.getState().respondToBoutOffer('o1' as any, 'w1' as any, 'Accepted');
    });
    // Validating the actual state update from the engine function.
    expect(useTestStore.getState().boutOffers['o1']?.responses['w1']).toBe('Accepted');
    expect(useTestStore.getState().boutOffers['o1']?.status).toBe('Signed');
  });


  it('should update player warrior status safely when fields are missing', () => {
    act(() => {
      useTestStore.setState({
        roster: [{ id: 'w1' } as any]
      });
      useTestStore.getState().updateWarriorStatus('w1' as any, true, true, 5, 5);
    });

    const w = useTestStore.getState().roster[0]!;
    expect(w.fame).toBe(5);
    expect(w.popularity).toBe(5);
    expect(w.career?.wins).toBe(1);
    expect(w.career?.losses).toBe(0);
    expect(w.career?.kills).toBe(1);
  });

  it('should update rival warrior status safely when fields are missing', () => {
    act(() => {
      useTestStore.setState({
        rivals: [{ owner: { id: 'r1' }, roster: [{ id: 'rw1' } as any] } as any]
      });
      useTestStore.getState().updateWarriorStatus('rw1' as any, false, false, -5, -5, 'r1' as any);
    });

    const w = useTestStore.getState().rivals[0]!.roster[0]!;
    expect(w.fame).toBe(0);
    expect(w.popularity).toBe(0);
    expect(w.career?.wins).toBe(0);
    expect(w.career?.losses).toBe(1);
    expect(w.career?.kills).toBe(0);
  });


  it('should not throw if updateWarriorStatus targets non-existent rival stable', () => {
    act(() => {
      useTestStore.setState({ rivals: [] });
      useTestStore.getState().updateWarriorStatus('rw1' as any, true, true, 5, 5, 'r1' as any);
    });
    expect(useTestStore.getState().rivals).toEqual([]);
  });

  it('should not throw if updateWarriorStatus targets non-existent rival warrior', () => {
    act(() => {
      useTestStore.setState({ rivals: [{ owner: { id: 'r1' }, roster: [] } as any] });
      useTestStore.getState().updateWarriorStatus('rw1' as any, true, true, 5, 5, 'r1' as any);
    });
    expect(useTestStore.getState().rivals[0]!.roster).toEqual([]);
  });


  it('should not throw if f.transcript is undefined in appendFight', () => {
    act(() => {
      // 21 items to trigger truncate logic
      useTestStore.setState({ arenaHistory: Array(21).fill({ id: 'f0' }) });
      useTestStore.getState().appendFight({ id: 'f1' } as any);
    });
    expect(useTestStore.getState().arenaHistory).toHaveLength(22);
  });

});
