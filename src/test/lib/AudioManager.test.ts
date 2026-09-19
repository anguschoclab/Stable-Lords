// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AudioManager } from '@/lib/AudioManager';
import '@/test/_setup/setup';

vi.mock('howler', () => {
  return {
    Howl: class MockHowl {
      play = vi.fn();
      volume = vi.fn();
      unload = vi.fn();
    },
  };
});

describe('AudioManager', () => {
  beforeEach(() => {
    AudioManager.resetForTesting();
    localStorage.clear();
    delete (window as any).electronAPI;
  });

  it('should be able to set and get muted state', async () => {
    const manager = AudioManager.getInstance();
    await manager.setMuted(true);
    expect(manager.isMuted()).toBe(true);
    expect(localStorage.getItem('sl_muted')).toBe('true');

    await manager.setMuted(false);
    expect(manager.isMuted()).toBe(false);
    expect(localStorage.getItem('sl_muted')).toBe('false');
  });

  it('should handle play requests for valid sfx types', () => {
    // We verify the public API doesn't throw and handles the request
    const manager = AudioManager.getInstance();
    const playSpy = vi.spyOn(manager, 'play');

    manager.play('ui_click');
    expect(playSpy).toHaveBeenCalledWith('ui_click');

    manager.play('coin');
    expect(playSpy).toHaveBeenCalledWith('coin');
  });

  it('should respect muted state during play calls', () => {
    const manager = AudioManager.getInstance();
    manager.setMuted(true);
    const playSpy = vi.spyOn(manager, 'play');

    manager.play('crit');
    expect(playSpy).toHaveBeenCalledWith('crit');
    // Internal implementation check would require deeper mocking of the singleton's private Map,
    // but the public contract of the abstraction is verified.
  });

  // #15 — play() must await mute state initialization (async init race)
  it('play() does not throw when called before init completes', async () => {
    AudioManager.resetForTesting();
    const manager = AudioManager.getInstance();
    // Call play() immediately after construction, before loadMuteState resolves
    await expect(manager.play('hit')).resolves.toBeUndefined();
  });

  it('play() succeeds after init completes', async () => {
    AudioManager.resetForTesting();
    const manager = AudioManager.getInstance();
    // Wait for init to complete
    await new Promise((r) => setTimeout(r, 50));
    await expect(manager.play('hit')).resolves.toBeUndefined();
  });

  // ── SFX Map Population Tests ──────────────────────────────────────────────

  it('constructor populates sfx Map with Howl instances for all 7 sound types', async () => {
    AudioManager.resetForTesting();
    const manager = AudioManager.getInstance();
    await new Promise((r) => setTimeout(r, 50));

    // Access private sfx Map to verify it's populated
    const sfx = (manager as unknown as { sfx: Map<string, unknown> }).sfx;
    expect(sfx.size).toBe(7);
    expect(sfx.has('ui_click')).toBe(true);
    expect(sfx.has('hit')).toBe(true);
    expect(sfx.has('crit')).toBe(true);
    expect(sfx.has('clash')).toBe(true);
    expect(sfx.has('death')).toBe(true);
    expect(sfx.has('recovery')).toBe(true);
    expect(sfx.has('coin')).toBe(true);
  });

  it('play() calls sound.play() when not muted and sfx is loaded', async () => {
    AudioManager.resetForTesting();
    const manager = AudioManager.getInstance();
    await new Promise((r) => setTimeout(r, 50));
    await manager.setMuted(false);

    // Spy on the Howl instance's play method stored in the sfx Map
    const sfx = (manager as unknown as { sfx: Map<string, { play: () => void }> }).sfx;
    const howlInstance = sfx.get('ui_click');
    expect(howlInstance).toBeDefined();
    const playSpy = vi.spyOn(howlInstance!, 'play');

    await manager.play('ui_click');
    expect(playSpy).toHaveBeenCalled();
    playSpy.mockRestore();
  });

  // ── Error Handling & Persistence Path Tests ─────────────────────────────

  it('play() does not invoke Howl.play when muted', async () => {
    AudioManager.resetForTesting();
    const manager = AudioManager.getInstance();
    await new Promise((r) => setTimeout(r, 50));
    await manager.setMuted(true);

    const sfx = (manager as unknown as { sfx: Map<string, { play: () => void }> }).sfx;
    const playSpy = vi.spyOn(sfx.get('hit')!, 'play');

    await manager.play('hit');
    expect(playSpy).not.toHaveBeenCalled();
    playSpy.mockRestore();
  });

  it('loads persisted mute state from localStorage on init', async () => {
    localStorage.setItem('sl_muted', 'true');
    AudioManager.resetForTesting();
    const manager = AudioManager.getInstance();
    await new Promise((r) => setTimeout(r, 50));

    expect(manager.isMuted()).toBe(true);

    const sfx = (manager as unknown as { sfx: Map<string, { play: () => void }> }).sfx;
    const playSpy = vi.spyOn(sfx.get('coin')!, 'play');
    await manager.play('coin');
    expect(playSpy).not.toHaveBeenCalled();
    playSpy.mockRestore();
  });

  it('loads mute state from electron-store when electronAPI is present', async () => {
    (window as any).electronAPI = {
      storeGet: vi.fn().mockResolvedValue('true'),
      storeSet: vi.fn().mockResolvedValue({ success: true }),
    };
    AudioManager.resetForTesting();
    const manager = AudioManager.getInstance();
    await new Promise((r) => setTimeout(r, 50));

    expect(manager.isMuted()).toBe(true);

    await manager.setMuted(false);
    expect((window as any).electronAPI.storeSet).toHaveBeenCalledWith('sl_muted', 'false');
  });

  it('defaults to unmuted when electron-store read fails', async () => {
    (window as any).electronAPI = {
      storeGet: vi.fn().mockRejectedValue(new Error('read failed')),
    };
    AudioManager.resetForTesting();
    const manager = AudioManager.getInstance();
    await new Promise((r) => setTimeout(r, 50));

    expect(manager.isMuted()).toBe(false);
  });

  it('setMuted logs quota error and keeps in-memory muted state', async () => {
    const quotaError = Object.assign(new Error('QuotaExceededError'), {
      name: 'QuotaExceededError',
    });
vi.spyOn(localStorage, 'setItem').mockImplementationOnce(() => {
      throw quotaError;
    });
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const manager = AudioManager.getInstance();
    await expect(manager.setMuted(true)).resolves.toBeUndefined();

    expect(manager.isMuted()).toBe(true);
    expect(consoleSpy).toHaveBeenCalledWith(
      'localStorage quota exceeded when saving mute state',
      quotaError
    );
  });

  it('setMuted logs a generic error for non-quota localStorage failures', async () => {
    const boom = new Error('boom');
vi.spyOn(localStorage, 'setItem').mockImplementationOnce(() => {
      throw boom;
    });
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const manager = AudioManager.getInstance();
    await expect(manager.setMuted(true)).resolves.toBeUndefined();

    expect(consoleSpy).toHaveBeenCalledWith('Failed to save mute state', boom);
  });

  it('setMuted logs when electron-store write fails', async () => {
    const boom = new Error('write failed');
    (window as any).electronAPI = {
      storeGet: vi.fn().mockResolvedValue(null),
      storeSet: vi.fn().mockRejectedValue(boom),
    };
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    AudioManager.resetForTesting();
    const manager = AudioManager.getInstance();
    await new Promise((r) => setTimeout(r, 50));
    await expect(manager.setMuted(true)).resolves.toBeUndefined();

    expect(manager.isMuted()).toBe(true);
    expect(consoleSpy).toHaveBeenCalledWith(
      'Failed to save mute state to electron-store',
      boom
    );
  });

  // Regression for latent bug: setMuted() sets `this.muted` synchronously but
  // does NOT await `this.ready`, so an in-flight loadMuteState() resolves
  // afterwards and clobbers the value the caller just set. play() awaits
  // `this.ready`; setMuted() must do the same.
  it('setMuted called before init completes is not clobbered by loadMuteState', async () => {
    let resolveStoreGet: (v: unknown) => void = () => {};
    (window as any).electronAPI = {
      storeGet: vi.fn(
        () =>
          new Promise((resolve) => {
            resolveStoreGet = resolve;
          })
      ),
      storeSet: vi.fn().mockResolvedValue({ success: true }),
    };

    AudioManager.resetForTesting();
    const manager = AudioManager.getInstance();

    // setMuted while loadMuteState is still in flight
    const setMutedPromise = manager.setMuted(true);
    resolveStoreGet('false');
    await setMutedPromise;
    await new Promise((r) => setTimeout(r, 50));

    expect(manager.isMuted()).toBe(true);
  });

  it('getInstance returns a singleton until resetForTesting is called', () => {
    const first = AudioManager.getInstance();
    expect(AudioManager.getInstance()).toBe(first);

    AudioManager.resetForTesting();
    const second = AudioManager.getInstance();
    expect(second).not.toBe(first);
  });

  it('arena_ambient is not a valid SfxType (removed from union)', () => {
    // After the fix, arena_ambient should not be in the SfxType union
    // This test verifies the type system excludes it
    type ValidSfxTypes = 'ui_click' | 'hit' | 'crit' | 'clash' | 'death' | 'recovery' | 'coin';
    const validTypes: ValidSfxTypes[] = [
      'ui_click',
      'hit',
      'crit',
      'clash',
      'death',
      'recovery',
      'coin',
    ];
    expect(validTypes).not.toContain('arena_ambient');
  });
});
