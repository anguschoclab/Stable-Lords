/**
 * IconTabStrip accessibility contract (V15) — proper tab semantics:
 * tablist container, tab roles, aria-selected tracking, visible focus ring.
 */
// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { IconTabStrip } from '@/components/ui/IconTabStrip';
import { Swords, FileText } from 'lucide-react';

const TABS = [
  { id: 'a' as const, label: 'Alpha', icon: Swords },
  { id: 'b' as const, label: 'Beta', icon: FileText },
];

describe('IconTabStrip a11y contract', () => {
  it('container exposes role="tablist"', () => {
    render(<IconTabStrip tabs={TABS} activeTab="a" onChange={() => {}} />);
    expect(screen.getByRole('tablist')).toBeInTheDocument();
  });

  it('each tab exposes role="tab"', () => {
    render(<IconTabStrip tabs={TABS} activeTab="a" onChange={() => {}} />);
    const tabs = screen.getAllByRole('tab');
    expect(tabs).toHaveLength(2);
    expect(tabs[0]).toHaveAccessibleName('Alpha');
    expect(tabs[1]).toHaveAccessibleName('Beta');
  });

  it('aria-selected tracks the active tab', () => {
    const { rerender } = render(<IconTabStrip tabs={TABS} activeTab="a" onChange={() => {}} />);
    expect(screen.getByRole('tab', { name: 'Alpha' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('tab', { name: 'Beta' })).toHaveAttribute('aria-selected', 'false');
    rerender(<IconTabStrip tabs={TABS} activeTab="b" onChange={() => {}} />);
    expect(screen.getByRole('tab', { name: 'Alpha' })).toHaveAttribute('aria-selected', 'false');
    expect(screen.getByRole('tab', { name: 'Beta' })).toHaveAttribute('aria-selected', 'true');
  });

  it('tabs carry a visible keyboard focus ring', () => {
    render(<IconTabStrip tabs={TABS} activeTab="a" onChange={() => {}} />);
    for (const tab of screen.getAllByRole('tab')) {
      expect(tab.className).toContain('focus-visible:ring');
    }
  });
});
