/**
 * AI debug instrumentation gate.
 *
 * `__AI_DEBUG` is a dev-only escape hatch: set `globalThis.__AI_DEBUG = true`
 * (browser console, test, or Electron main) to surface AI telemetry in
 * contexts where it is normally suppressed — e.g. in-bout AI_INTENT reason
 * codes during headless mass simulation. Defaults off so production and the
 * balance harness pay zero event-churn cost.
 */
export function isAIDebugEnabled(): boolean {
  return (globalThis as { __AI_DEBUG?: boolean }).__AI_DEBUG === true;
}
