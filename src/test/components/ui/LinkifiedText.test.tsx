// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { LinkifiedText } from '@/components/ui/LinkifiedText';

vi.mock('@/components/EntityLink', () => ({
  WarriorLink: ({ name, className }: { name: string; className?: string }) => (
    <span
      data-testid="warrior-link"
      data-name={name}
      className={className}
      aria-label={`Open details for warrior ${name}`}
    >
      {name}
    </span>
  ),
  StableLink: ({ name, className }: { name: string; className?: string }) => (
    <span
      data-testid="stable-link"
      data-name={name}
      className={className}
      aria-label={`Open details for stable ${name}`}
    >
      {name}
    </span>
  ),
}));

describe('LinkifiedText', () => {
  it('renders warrior names as WarriorLink', () => {
    render(<LinkifiedText text="Brutus defeated Cassius" names={['Brutus', 'Cassius']} />);
    const links = screen.getAllByTestId('warrior-link');
    expect(links).toHaveLength(2);
    expect(links[0]).toHaveAttribute('data-name', 'Brutus');
    expect(links[1]).toHaveAttribute('data-name', 'Cassius');
  });

  it('renders stable names as StableLink', () => {
    render(
      <LinkifiedText
        text="Dragon's Hearth defeated Wolf Pack"
        names={[]}
        stableNames={["Dragon's Hearth", 'Wolf Pack']}
      />
    );
    const links = screen.getAllByTestId('stable-link');
    expect(links).toHaveLength(2);
    expect(links[0]).toHaveAttribute('data-name', "Dragon's Hearth");
    expect(links[1]).toHaveAttribute('data-name', 'Wolf Pack');
  });

  it('handles mixed warrior and stable names in same text', () => {
    render(
      <LinkifiedText
        text="Brutus of Dragon's Hearth faced Cassius"
        names={['Brutus', 'Cassius']}
        stableNames={["Dragon's Hearth"]}
      />
    );
    expect(screen.getAllByTestId('warrior-link')).toHaveLength(2);
    expect(screen.getAllByTestId('stable-link')).toHaveLength(1);
  });

  it('falls back to plain text when no names match', () => {
    const { container } = render(<LinkifiedText text="No entities here" names={['Brutus']} />);
    expect(container.textContent).toBe('No entities here');
    expect(screen.queryByTestId('warrior-link')).not.toBeInTheDocument();
    expect(screen.queryByTestId('stable-link')).not.toBeInTheDocument();
  });

  it('backward compatible: works with only names prop (no stableNames)', () => {
    render(<LinkifiedText text="Brutus fought Cassius" names={['Brutus', 'Cassius']} />);
    expect(screen.getAllByTestId('warrior-link')).toHaveLength(2);
    expect(screen.queryByTestId('stable-link')).not.toBeInTheDocument();
  });

  it('longest-first matching: "Marcus Aurelius" matched before "Marcus"', () => {
    render(
      <LinkifiedText text="Marcus Aurelius won the bout" names={['Marcus', 'Marcus Aurelius']} />
    );
    const links = screen.getAllByTestId('warrior-link');
    expect(links).toHaveLength(1);
    expect(links[0]).toHaveAttribute('data-name', 'Marcus Aurelius');
  });

  it('stable name takes priority when warrior and stable share same name', () => {
    render(
      <LinkifiedText
        text="Spartacus fought bravely"
        names={['Spartacus']}
        stableNames={['Spartacus']}
      />
    );
    expect(screen.queryByTestId('warrior-link')).not.toBeInTheDocument();
    expect(screen.getAllByTestId('stable-link')).toHaveLength(1);
  });

  it('empty stableNames array behaves identically to no stableNames prop', () => {
    render(<LinkifiedText text="Brutus fought" names={['Brutus']} stableNames={[]} />);
    expect(screen.getAllByTestId('warrior-link')).toHaveLength(1);
    expect(screen.queryByTestId('stable-link')).not.toBeInTheDocument();
  });
});
