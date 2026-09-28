import { vi } from 'vitest';

/** Shared stub for @/engine/runtime/workerProxy — resolved no-op responses. */
export const engineProxy: {
  advanceWeek: ReturnType<typeof vi.fn>;
  advanceDay: ReturnType<typeof vi.fn>;
  skipToWeekEnd: ReturnType<typeof vi.fn>;
  runAutosim: ReturnType<typeof vi.fn>;
} = {
  advanceWeek: vi.fn().mockResolvedValue({ week: 2, phase: 'planning' }),
  advanceDay: vi.fn().mockResolvedValue({ week: 1, day: 1, phase: 'planning' }),
  skipToWeekEnd: vi.fn().mockResolvedValue({ week: 2, phase: 'planning' }),
  runAutosim: vi.fn(),
};
