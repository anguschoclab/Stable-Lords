/**
 * A11y — Slider duplicate DOM ID detection.
 * Pre-merge test: verifies slider.tsx does NOT assign the same id
 * to both Root and Thumb elements. Catches V4 bug from PR #792.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import path from 'path';

describe('slider.tsx DOM ID uniqueness', () => {
  it('Slider Thumb does not share the same id as Root', () => {
    const filePath = path.resolve(process.cwd(), 'src/components/ui/slider.tsx');
    const content = readFileSync(filePath, 'utf-8');

    // Check if both Root and Thumb have id={id} directly (the V4 bug)
    const rootHasId = /<SliderPrimitive\.Root[^>]*\bid=\{id\}/.test(content);
    const thumbHasId = /<SliderPrimitive\.Thumb[^>]*\bid=\{id\}/.test(content);

    // Both having id={id} directly is the bug
    expect(rootHasId && thumbHasId).toBe(false);
  });

  it('Slider Thumb uses suffixed id when id is provided', () => {
    const filePath = path.resolve(process.cwd(), 'src/components/ui/slider.tsx');
    const content = readFileSync(filePath, 'utf-8');

    // If Thumb has an id, it should be suffixed (e.g., ${id}-thumb) or use a different pattern
    const thumbIdMatch = content.match(/<SliderPrimitive\.Thumb[^>]*\bid=\{([^}]+)\}/);
    if (thumbIdMatch) {
      const idExpr = thumbIdMatch[1];
      // Should not be just `id` — should be suffixed or conditional
      expect(idExpr).not.toBe('id');
    }
  });
});
