// @vitest-environment node
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import path from 'node:path';

const DOCS_DIR = path.resolve(__dirname, '../../../docs');
const DESIGN_DOCS = ['DESIGN_BIBLE_UI_v1.0.md', 'DESIGN_PAGE_SYSTEM_v1.0.md'];

const STALE_ROUTE_TOKENS = ['/run-round', '/gazette', '/hall-of-fame'];

/**
 * Documentation parity contract: the live route tree is the canonical IA.
 * Design documents must describe shipped routes, not retired pre-consolidation
 * paths. This intentionally covers the user-facing design specs only; audit
 * records may preserve historical names as findings.
 */
describe('design documentation parity', () => {
  it('does not document retired routes as current UI', () => {
    const violations: string[] = [];

    for (const file of DESIGN_DOCS) {
      const source = readFileSync(path.join(DOCS_DIR, file), 'utf8');
      for (const token of STALE_ROUTE_TOKENS) {
        if (source.includes(token)) violations.push(`${file}: ${token}`);
      }
    }

    expect(violations).toEqual([]);
  });
});
