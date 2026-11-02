// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@/test/_setup/setup';
import { StyleCard } from '@/pages/styleArchives/StyleCard';
import { FIGHTER_CONCEPTS } from '@/data/fighterConcepts';
import { FightingStyle, STYLE_DISPLAY_NAMES } from '@/types/shared.types';

describe('StyleCard — fighter concepts', () => {
  it('renders the style doctrine and every canon concept', () => {
    const style = FightingStyle.AimedBlow;
    const guide = FIGHTER_CONCEPTS[style];
    render(<StyleCard style={style} />);

    expect(screen.getByText(STYLE_DISPLAY_NAMES[style])).toBeTruthy();
    expect(screen.getByText(guide.doctrine)).toBeTruthy();
    for (const concept of guide.concepts) {
      expect(
        screen.getByText(concept.name),
        `concept ${concept.name} not rendered`
      ).toBeTruthy();
    }
  });

  it('renders stat chips for each concept spread', () => {
    render(<StyleCard style={FightingStyle.WallOfSteel} />);
    // Stat chips render each attribute key at least once per concept.
    for (const key of ['ST', 'CN', 'SZ', 'WT', 'WL', 'SP', 'DF']) {
      expect(screen.getAllByText(new RegExp(`${key}\\s+\\d+`)).length).toBeGreaterThan(0);
    }
  });
});
