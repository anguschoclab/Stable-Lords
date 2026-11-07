// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { DesignReviewCard } from '@/components/WarriorBuilder/components/DesignReviewCard';
import { FightingStyle, type Attributes } from '@/types/game';

const ATTRS: Attributes = { ST: 10, CN: 10, SZ: 10, WT: 13, WL: 13, SP: 10, DF: 11 };

describe('DesignReviewCard', () => {
  it('renders the review panel', () => {
    const { container } = render(
      <DesignReviewCard attrs={ATTRS} style={FightingStyle.LungingAttack} />
    );
    expect(screen.getByText('Design Review')).toBeInTheDocument();
    expect(container.firstChild).toBeInTheDocument();
  });

  it('lists review items for the build', () => {
    render(<DesignReviewCard attrs={ATTRS} style={FightingStyle.LungingAttack} />);
    expect(screen.getAllByRole('listitem').length).toBeGreaterThanOrEqual(3);
  });

  it('re-renders when the spread changes', () => {
    const { rerender } = render(
      <DesignReviewCard attrs={ATTRS} style={FightingStyle.LungingAttack} />
    );
    rerender(
      <DesignReviewCard
        attrs={{ ...ATTRS, WL: 5 }}
        style={FightingStyle.LungingAttack}
      />
    );
    expect(screen.getByText('Design Review')).toBeInTheDocument();
  });
});
