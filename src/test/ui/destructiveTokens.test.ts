import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

// PR #992: destructive chrome must use the --destructive CSS token, never raw
// off-palette rgba(255,0,0) glows.
const FILES = [
  'src/components/layout/ResetDialog.tsx',
  'src/components/ledger/InsightManager/components/RevealModal.tsx',
  'src/components/ledger/InsightManager/components/TargetSummary.tsx',
];

describe('destructive styling uses design tokens (PR #992)', () => {
  for (const rel of FILES) {
    it(`${rel} contains no raw rgba(255,0,0) glow`, () => {
      const src = fs.readFileSync(path.resolve(process.cwd(), rel), 'utf-8');
      expect(src).not.toContain('rgba(255,0,0');
      expect(src).toContain('hsl(var(--destructive)');
    });
  }
});
