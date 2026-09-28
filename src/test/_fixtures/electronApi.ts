import { vi } from 'vitest';

/** Shared stub for window.electronAPI in storage tests. */
export function createMockElectronAPI(overrides?: Partial<typeof window.electronAPI>) {
  return {
    saveGame: vi.fn().mockResolvedValue({ success: true }),
    loadGame: vi.fn().mockResolvedValue({ success: true, data: {} }),
    archiveBoutLog: vi.fn().mockResolvedValue({ success: true }),
    retrieveBoutLog: vi.fn().mockResolvedValue({ success: true, data: [] }),
    archiveGazette: vi.fn().mockResolvedValue({ success: true }),
    retrieveGazette: vi.fn().mockResolvedValue({ success: true, data: '' }),
    ...overrides,
  } as any as typeof window.electronAPI;
}
