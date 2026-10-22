/**
 * Simple logger to centralize console output in the Electron main process.
 * Mirrors src/utils/logger.ts — kept local because the electron tsconfig
 * project cannot import from src/ without breaking its composite file list.
 * Console usage is permitted by ESLint config for this file only.
 */
export const logger = {
  log: (...args: unknown[]) => {
    console.log(...args);
  },
  debug: (...args: unknown[]) => {
    console.debug(...args);
  },
  error: (...args: unknown[]) => {
    console.error(...args);
  },
  warn: (...args: unknown[]) => {
    console.warn(...args);
  },
};
