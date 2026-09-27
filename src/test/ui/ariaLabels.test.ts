/**
 * A11y — aria-label presence on Slider/Switch components.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import path from 'path';

describe('aria-label presence on interactive components', () => {
  const componentsToCheck = [
    'src/components/WarriorBuilder/components/IdentitySection.tsx',
    'src/components/equipment/SlotSelector.tsx',
    'src/components/layout/ArenaSettings.tsx',
    'src/components/orphanage/PlanStep.tsx',
    'src/components/planBuilder/CommonControls.tsx',
    'src/components/planBuilder/ContingencyPlans.tsx',
    'src/components/planBuilder/PhaseOverrides.tsx',
    'src/components/planBuilder/StylePassives.tsx',
    'src/components/warrior/condition/OverrideSliders.tsx',
  ];

  for (const relPath of componentsToCheck) {
    it(`${relPath} has at least one aria-label`, () => {
      const fullPath = path.resolve(process.cwd(), relPath);
      // Missing file → readFileSync throws → hard failure (no soft-skip).
      const content = readFileSync(fullPath, 'utf-8');
      // Check for aria-label attribute
      expect(content).toMatch(/aria-label/);
    });
  }
});
