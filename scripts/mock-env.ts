/**
 * Mock environment for headless execution.
 */

const mockLocalStorage = {
  getItem: () => null,
  setItem: () => {},
  removeItem: () => {},
  clear: () => {},
  key: () => null,
  length: 0,
};

const mockNavigator = {
  userAgent: "node",
  appVersion: "5.0 (Node)",
  platform: "mac",
};

const mockDocument = {
  createElement: () => ({
    style: {},
    setAttribute: () => {},
    appendChild: () => {},
  }),
};

// Use Object.defineProperty to override read-only properties in Node 21+
Object.defineProperty(globalThis, "localStorage", {
  value: mockLocalStorage,
  writable: true,
  configurable: true,
});

Object.defineProperty(globalThis, "navigator", {
  value: mockNavigator,
  writable: true,
  configurable: true,
});

Object.defineProperty(globalThis, "window", {
  value: globalThis,
  writable: true,
  configurable: true,
});

Object.defineProperty(globalThis, "document", {
  value: mockDocument,
  writable: true,
  configurable: true,
});
