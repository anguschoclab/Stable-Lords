import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { GazetteStep } from '@/components/resolution-reveal/GazetteStep';
import { MathStep } from '@/components/resolution-reveal/MathStep';
import { InjuriesStep } from '@/components/resolution-reveal/InjuriesStep';
import { MemorialStep } from '@/components/resolution-reveal/MemorialStep';
import { BoutsStep } from '@/components/resolution-reveal/BoutsStep';

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: { children?: React.ReactNode } & Record<string, unknown>) => (
      <div {...props}>{children}</div>
    ),
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock('@/components/ui/scroll-area', () => ({
  ScrollArea: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

vi.mock('@/components/ui/separator', () => ({
  Separator: () => <hr />,
}));

vi.mock('@/components/BoutViewer', () => ({
  default: () => <div data-testid="bout-viewer">BoutViewer</div>,
}));

vi.mock('@/engine/narrative/fightAnalysis', () => ({
  buildFightAnalysis: () => ({ summary: 'test' }),
}));

vi.mock('@/data/narrativeContent.json', () => ({
  default: {
    fanfare: {
      report_medical: 'Medical Report',
      report_treasury: 'Treasury Report',
      memorial_title: 'In Memoriam',
    },
  },
}));

describe('GazetteStep', () => {
  it('renders without crashing with empty gazette', () => {
    const { container } = render(<GazetteStep gazette={[]} />);
    expect(container.firstChild).toBeInTheDocument();
  });
});

describe('MathStep', () => {
  it('renders without crashing with null report', () => {
    const { container } = render(<MathStep lastSimulationReport={undefined} />);
    expect(container.firstChild).toBeInTheDocument();
  });
});

describe('InjuriesStep', () => {
  it('renders without crashing with empty data', () => {
    const { container } = render(<InjuriesStep injuries={[]} deaths={[]} />);
    expect(container.firstChild).toBeInTheDocument();
  });

  it('renders injury text when injuries present', () => {
    render(<InjuriesStep injuries={['Alice injured']} deaths={[]} />);
    expect(screen.getByText('Alice injured')).toBeInTheDocument();
  });
});

describe('MemorialStep', () => {
  it('renders without crashing with empty data', () => {
    const { container } = render(<MemorialStep deadWarriors={[]} />);
    expect(container.firstChild).toBeInTheDocument();
  });
});

describe('BoutsStep', () => {
  it('renders without crashing with empty bouts', () => {
    const { container } = render(<BoutsStep bouts={[]} />);
    expect(container.firstChild).toBeInTheDocument();
  });
});
