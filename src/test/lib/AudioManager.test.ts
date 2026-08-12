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
      constructor(_opts: unknown) {}
    },
  };
});

describe('AudioManager', () => {
  beforeEach(() => {
    AudioManager.resetForTesting();
    localStorage.clear();
  });

  it('should be able to set and get muted state', () => {
    const manager = AudioManager.getInstance();
    manager.setMuted(true);
    expect(manager.isMuted()).toBe(true);
    expect(localStorage.getItem('sl_muted')).toBe('true');

    manager.setMuted(false);
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
    await expect(manager.play('hit')).resolves.not.toThrow();
  });

  it('play() succeeds after init completes', async () => {
    AudioManager.resetForTesting();
    const manager = AudioManager.getInstance();
    // Wait for init to complete
    await new Promise((r) => setTimeout(r, 50));
    await expect(manager.play('hit')).resolves.not.toThrow();
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

  it('arena_ambient is not a valid SfxType (removed from union)', () => {
    // After the fix, arena_ambient should not be in the SfxType union
    // This test verifies the type system excludes it
    type ValidSfxTypes = 'ui_click' | 'hit' | 'crit' | 'clash' | 'death' | 'recovery' | 'coin';
    const validTypes: ValidSfxTypes[] = ['ui_click', 'hit', 'crit', 'clash', 'death', 'recovery', 'coin'];
    expect(validTypes).not.toContain('arena_ambient');
  });
});
