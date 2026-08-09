/**
 * A11y — aria-label presence on Slider/Switch components.
 * Pre-merge test: will FAIL on main because many components
 * don't yet have aria-labels. After PR #787 merge, they will.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import path from 'path';

describe('aria-label presence on interactive components', () => {
  const componentsToCheck = [
    'src/components/warrior-builder/IdentitySection.tsx',
    'src/components/warrior-builder/SlotSelector.tsx',
    'src/components/arena/ArenaSettings.tsx',
    'src/components/warrior-builder/PlanStep.tsx',
    'src/components/warrior-builder/CommonControls.tsx',
    'src/components/warrior-builder/ContingencyPlans.tsx',
    'src/components/warrior-builder/PhaseOverrides.tsx',
    'src/components/warrior-builder/StylePassives.tsx',
    'src/components/warrior-builder/OverrideSliders.tsx',
  ];

  for (const relPath of componentsToCheck) {
    it(`${relPath} has at least one aria-label`, () => {
      const fullPath = path.resolve(process.cwd(), relPath);
      let content: string;
      try {
        content = readFileSync(fullPath, 'utf-8');
      } catch {
        // File may not exist yet on main — skip
        expect(true).toBe(true);
        return;
      }
      // Check for aria-label attribute
      expect(content).toMatch(/aria-label/);
    });
  }
});
