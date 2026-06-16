// Initialize HowlerGlobal for Electron environment
if (typeof window.HowlerGlobal === 'undefined') {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Howler.js type incompatibility with Electron (external library)
  (window as any).HowlerGlobal = {};
}
