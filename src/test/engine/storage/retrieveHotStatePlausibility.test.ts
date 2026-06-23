import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { OPFSArchiveService } from '@/engine/storage/opfsArchive';
import { setMockOPFSFileText } from '@/test/_setup/setup';
import { SAVE_STATE_VERSION } from '@/constants/core';

describe('retrieveHotState plausibility check', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const validState = {
    meta: { gameName: 'Stable Lords', version: SAVE_STATE_VERSION, createdAt: '2024-01-01' },
    roster: [],
    arenaHistory: [],
    week: 1,
    year: 1,
    player: { id: 'p1', name: 'P', stableName: 'S', fame: 0, renown: 0, titles: 0 },
  };

  it('returns parsed state when JSON passes plausibility check', async () => {
    const service = new OPFSArchiveService();
    setMockOPFSFileText(JSON.stringify(validState));

    const result = await service.retrieveHotState('slot-valid');
    expect(result).not.toBeNull();
    expect(result!.week).toBe(1);
    expect(result!.meta.version).toBe(SAVE_STATE_VERSION);
  });

  it('returns null and logs error when JSON is not an object', async () => {
    const service = new OPFSArchiveService();
    setMockOPFSFileText('"just a string"');
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const result = await service.retrieveHotState('slot-string');
    expect(result).toBeNull();
    expect(errorSpy).toHaveBeenCalledWith(
      'corrupt/incompatible save: failed plausibility check',
      expect.objectContaining({ slotId: 'slot-string' })
    );
  });

  it('returns null when meta is missing', async () => {
    const service = new OPFSArchiveService();
    setMockOPFSFileText(JSON.stringify({ roster: [], week: 1, year: 1, player: {} }));
    vi.spyOn(console, 'error').mockImplementation(() => {});

    const result = await service.retrieveHotState('slot-no-meta');
    expect(result).toBeNull();
  });

  it('returns null when meta.version is not a string', async () => {
    const service = new OPFSArchiveService();
    setMockOPFSFileText(
      JSON.stringify({ ...validState, meta: { gameName: 'X', version: 123, createdAt: '' } })
    );
    vi.spyOn(console, 'error').mockImplementation(() => {});

    const result = await service.retrieveHotState('slot-bad-version');
    expect(result).toBeNull();
  });

  it('returns null when roster is not an array', async () => {
    const service = new OPFSArchiveService();
    setMockOPFSFileText(JSON.stringify({ ...validState, roster: 'not-array' }));
    vi.spyOn(console, 'error').mockImplementation(() => {});

    const result = await service.retrieveHotState('slot-bad-roster');
    expect(result).toBeNull();
  });

  it('returns null when week is not a number', async () => {
    const service = new OPFSArchiveService();
    setMockOPFSFileText(JSON.stringify({ ...validState, week: 'one' }));
    vi.spyOn(console, 'error').mockImplementation(() => {});

    const result = await service.retrieveHotState('slot-bad-week');
    expect(result).toBeNull();
  });

  it('returns null when player is missing', async () => {
    const service = new OPFSArchiveService();
    const { player: _player, ...noPlayer } = validState;
    setMockOPFSFileText(JSON.stringify(noPlayer));
    vi.spyOn(console, 'error').mockImplementation(() => {});

    const result = await service.retrieveHotState('slot-no-player');
    expect(result).toBeNull();
  });

  it('returns null when value is null', async () => {
    const service = new OPFSArchiveService();
    setMockOPFSFileText('null');
    vi.spyOn(console, 'error').mockImplementation(() => {});

    const result = await service.retrieveHotState('slot-null');
    expect(result).toBeNull();
  });

  it('still returns null on invalid JSON (pre-existing behavior)', async () => {
    const service = new OPFSArchiveService();
    setMockOPFSFileText('not-valid-json');
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    const result = await service.retrieveHotState('slot-bad-json');
    expect(result).toBeNull();
    expect(warnSpy).toHaveBeenCalledWith('Error retrieving hot state:', expect.any(Error));
  });
});

describe('SAVE_STATE_VERSION constant', () => {
  it('is exported and matches expected value', () => {
    expect(SAVE_STATE_VERSION).toBe('2.1.0-hardened');
  });
});
