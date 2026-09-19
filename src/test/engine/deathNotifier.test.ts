import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('@/utils/logger', () => ({
  logger: {
    log: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
  },
}));

import { onWarriorDeath, clearDeathHandlers } from '@/engine/deathNotifier';
import { engineEventBus } from '@/engine/core/EventBus';
import { logger } from '@/utils/logger';

describe('deathNotifier', () => {
  // IMPORTANT: teardown must go through clearDeathHandlers() — never
  // engineEventBus.clear(). The module caches its bus unsubscribe in
  // `busSubscription`; clearing the bus directly would orphan that cache and
  // ensureSubscribed() would never re-subscribe.
  beforeEach(() => {
    clearDeathHandlers();
    vi.clearAllMocks();
  });

  afterEach(() => {
    clearDeathHandlers();
  });

  it('invokes the handler with the death notification payload', () => {
    const handler = vi.fn();
    onWarriorDeath(handler);

    engineEventBus.emit({
      type: 'WARRIOR_DEATH',
      payload: { warriorId: 'w1', name: 'Brutus' },
    });

    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler).toHaveBeenCalledWith({ warriorId: 'w1', name: 'Brutus' });
  });

  it('ignores non-death engine events', () => {
    const handler = vi.fn();
    onWarriorDeath(handler);

    engineEventBus.emit({
      type: 'WARRIOR_TRAINED',
      payload: { warriorId: 'w1', message: 'gained ATT', isGain: true },
    });
    engineEventBus.emit({
      type: 'SEASON_CHANGED',
      payload: { prevSeason: 'Spring', newSeason: 'Summer', year: 1 },
    });
    engineEventBus.emit({
      type: 'WEEK_ADVANCED',
      payload: { week: 2, state: {} as never },
    });

    expect(handler).not.toHaveBeenCalled();
  });

  it('invokes all registered handlers', () => {
    const h1 = vi.fn();
    const h2 = vi.fn();
    onWarriorDeath(h1);
    onWarriorDeath(h2);

    engineEventBus.emit({
      type: 'WARRIOR_DEATH',
      payload: { warriorId: 'w9', name: 'Cassius' },
    });

    expect(h1).toHaveBeenCalledTimes(1);
    expect(h2).toHaveBeenCalledTimes(1);
  });

  it('a throwing handler does not block the others and logs via logger.error', () => {
    const boom = new Error('handler exploded');
    const h1 = vi.fn(() => {
      throw boom;
    });
    const h2 = vi.fn();
    onWarriorDeath(h1);
    onWarriorDeath(h2);

    engineEventBus.emit({
      type: 'WARRIOR_DEATH',
      payload: { warriorId: 'w2', name: 'Falling Titan' },
    });

    expect(h2).toHaveBeenCalledTimes(1);
    expect(logger.error).toHaveBeenCalledWith('[deathNotifier] handler threw:', boom);
  });

  it('stops notifying after the returned unsubscribe is called', () => {
    const handler = vi.fn();
    const off = onWarriorDeath(handler);

    off();
    engineEventBus.emit({
      type: 'WARRIOR_DEATH',
      payload: { warriorId: 'w3', name: 'Silent Dead' },
    });

    expect(handler).not.toHaveBeenCalled();
  });

  it('clearDeathHandlers detaches the bus subscription so re-registration is not duplicated', () => {
    onWarriorDeath(vi.fn());
    clearDeathHandlers();

    const handler = vi.fn();
    onWarriorDeath(handler);
    engineEventBus.emit({
      type: 'WARRIOR_DEATH',
      payload: { warriorId: 'w4', name: 'Once Only' },
    });

    expect(handler).toHaveBeenCalledTimes(1);
  });
});
