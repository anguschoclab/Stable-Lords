// @vitest-environment jsdom
/**
 * V25 — Style Archives archetype chips: each style card surfaces its
 * winning-archetype fits from STYLE_ARCHETYPE_FIT (never hardcoded).
 */
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@/test/_setup/setup';
import { StyleCard } from '@/pages/styleArchives/StyleCard';
import { STYLE_ARCHETYPE_FIT, WINNING_ARCHETYPES } from '@/data/warriorArchetypes';
import { FightingStyle } from '@/types/shared.types';

describe('StyleCard — archetype chips', () => {
  it('renders the style\'s archetype-fit labels from the FIT map', () => {
    const style = FightingStyle.TotalParry;
    render(<StyleCard style={style} />);
    for (const fit of STYLE_ARCHETYPE_FIT[style] ?? []) {
      expect(
        screen.getByText(new RegExp(WINNING_ARCHETYPES[fit].label, 'i')),
        `chip for ${fit} not rendered`
      ).toBeTruthy();
    }
  });

  it('a lunger card shows multiple archetype fits — the ultimate hybrid', () => {
    const style = FightingStyle.LungingAttack;
    render(<StyleCard style={style} />);
    const fits = STYLE_ARCHETYPE_FIT[style] ?? [];
    expect(fits.length).toBeGreaterThanOrEqual(3);
    for (const fit of fits) {
      expect(screen.getByText(new RegExp(WINNING_ARCHETYPES[fit].label, 'i'))).toBeTruthy();
    }
  });
});
