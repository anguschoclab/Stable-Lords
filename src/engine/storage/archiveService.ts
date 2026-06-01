import { ArchiveService, ElectronArchiveService } from './electronArchive';

/**
 * Runtime singleton for the archive service.
 * In Electron: uses ElectronArchiveService (via IPC to main process).
 * In web/browser: falls back to OPFSArchiveService.
 */
export let archiveService: ArchiveService;

if (typeof window !== 'undefined' && window.electronAPI) {
  archiveService = new ElectronArchiveService();
} else {
  // Fallback to OPFS for web version (will be removed after full Electron migration)
  const { OPFSArchiveService } = await import('./opfsArchive');
  archiveService = new OPFSArchiveService();
}

// Re-export the instance for backward compatibility
export { archiveService as opfsArchive };
