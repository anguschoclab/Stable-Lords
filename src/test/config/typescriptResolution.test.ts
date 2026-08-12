import { describe, it, expect } from 'vitest';

describe('typescript module resolution', () => {
  it('require("typescript") returns a module with a version string', () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const ts = require('typescript');
    expect(ts.version).toBeDefined();
    expect(typeof ts.version).toBe('string');
    expect(ts.version).toMatch(/^\d+\.\d+\.\d+/);
  });

  it('require("typescript") returns a module with versionMajorMinor', () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const ts = require('typescript');
    expect(ts.versionMajorMinor).toBeDefined();
    expect(typeof ts.versionMajorMinor).toBe('string');
    expect(ts.versionMajorMinor).toMatch(/^\d+\.\d+/);
  });

  it('require("typescript") is not an empty object (circular resolution guard)', () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const ts = require('typescript');
    expect(Object.keys(ts).length).toBeGreaterThan(0);
  });
});
