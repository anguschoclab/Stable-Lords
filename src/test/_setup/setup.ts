/**
 * Back-compat barrel for the split setup chain.
 *
 * Vitest configs load setup.node.ts + setup.dom.ts directly as setupFiles.
 * This module exists for importers that predate the split (bun-setup.ts's
 * dynamic `import('./setup')`, tests importing the OPFS mock helpers) — it
 * executes both halves and re-exports the helpers.
 */
import './setup.node';
import './setup.dom';

export {
  setMockOPFSError,
  setMockOPFSFileText,
  setMockOPFSDirEntries,
  getMockOPFSDirHandleCalls,
} from './setup.node';
