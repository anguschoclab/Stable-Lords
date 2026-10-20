// @vitest-environment jsdom
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import StyleArchives from '@/pages/StyleArchives';
import { FightingStyle, STYLE_DISPLAY_NAMES } from '@/types/shared.types';
import '@/test/_setup/setup';

describe('Style Archives page', () => {
  it('searches compendium text and exposes an accessible empty state with recovery', () => {
    render(<StyleArchives />);
    const search = screen.getByRole('searchbox', { name: 'Search styles' });

    fireEvent.change(search, { target: { value: 'no such discipline' } });
    expect(screen.getByRole('status')).toHaveTextContent('No disciplines match your query');

    fireEvent.click(screen.getByRole('button', { name: 'Clear search' }));
    expect(search).toHaveValue('');
    for (const style of Object.values(FightingStyle)) {
      expect(screen.getAllByText(STYLE_DISPLAY_NAMES[style]).length).toBeGreaterThan(0);
    }
  });
});
