/**
 * BackstoryPicker accessibility tests — verifies aria-pressed and focus-visible styles.
 */
// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import BackstoryPicker from '@/components/startGame/BackstoryPicker';
import { BACKSTORY_LIST } from '@/data/backstories';

vi.mock('@/state/useGameStore', () => ({
  useGameStore: vi.fn(),
  useWorldState: vi.fn(),
  useBookmarks: vi.fn(() => []),
}));

vi.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, ...props }: any) => (
    <button {...props} onClick={onClick}>{children}</button>
  ),
}));

describe('BackstoryPicker accessibility', () => {
  it('renders buttons with aria-pressed reflecting selection state', () => {
    const firstId = BACKSTORY_LIST[0]!.id;
    const { container } = render(
      <BackstoryPicker value={firstId} onChange={() => {}} onRandomize={() => {}} />
    );
    const buttons = container.querySelectorAll('button[type="button"]');
    // Find the backstory buttons (not the randomize button)
    const backstoryButtons = Array.from(buttons).filter(
      (b) => b.getAttribute('aria-label') !== 'Randomize backstory'
    );
    expect(backstoryButtons.length).toBeGreaterThan(0);
    for (const btn of backstoryButtons) {
      const pressed = btn.getAttribute('aria-pressed');
      expect(pressed).toBeDefined();
    }
    // The selected one should have aria-pressed="true"
    const selectedBtn = backstoryButtons.find((b) => b.getAttribute('aria-pressed') === 'true');
    expect(selectedBtn).toBeDefined();
  });

  it('applies focus-visible classes to backstory buttons', () => {
    const { container } = render(
      <BackstoryPicker value={null} onChange={() => {}} onRandomize={() => {}} />
    );
    const buttons = container.querySelectorAll('button[type="button"]');
    const backstoryButtons = Array.from(buttons).filter(
      (b) => b.getAttribute('aria-label') !== 'Randomize backstory'
    );
    expect(backstoryButtons.length).toBeGreaterThan(0);
    for (const btn of backstoryButtons) {
      expect(btn.className).toMatch(/focus-visible:/);
      expect(btn.className).toMatch(/ring-inset/);
    }
  });
});
