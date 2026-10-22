import { vi, type Mock } from 'vitest';

/** Shared inert stub for @/engine/storage/archiveService — loadGame paths
 *  call archiveService methods, so specs keep them silent. */
export const archiveService: {
  archiveHotState: Mock;
  retrieveHotState: Mock;
  deleteHotState: Mock;
} = {
  archiveHotState: vi.fn(),
  retrieveHotState: vi.fn(),
  deleteHotState: vi.fn(),
};
