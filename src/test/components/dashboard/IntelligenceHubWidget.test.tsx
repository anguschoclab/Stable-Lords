// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import type { GazetteStory, NewsletterItem, RivalStableData } from '@/types/state.types';

let mockState: any = {};

vi.mock('@/state/useGameStore', () => ({
  useGameStore: vi.fn((selector?: any) => (selector ? selector(mockState) : mockState)),
}));

vi.mock('zustand/react/shallow', () => ({
  useShallow: (fn: any) => fn,
}));

vi.mock('@tanstack/react-router', () => ({
  Link: ({ to, children, className }: any) => (
    <a href={to} className={className}>
      {children}
    </a>
  ),
}));

vi.mock('@/components/dashboard/AgentReasoningWidget', () => ({
  AgentReasoningWidget: ({ rival }: { rival?: RivalStableData }) => (
    <div data-testid="agent-reasoning" data-rival={rival?.id ?? 'undefined'} />
  ),
}));

vi.mock('@/components/dashboard/IntelligenceHubHeader', () => ({
  IntelligenceHubHeader: ({ totalCommCount }: { totalCommCount: number }) => (
    <div data-testid="hub-header" data-count={totalCommCount} />
  ),
}));

vi.mock('@/components/dashboard/GazetteTab', () => ({
  GazetteTab: ({ stories }: { stories: GazetteStory[] }) => (
    <div data-testid="gazette-tab" data-count={stories.length} data-first-id={stories[0]?.id ?? ''} />
  ),
}));

vi.mock('@/components/dashboard/BriefingTab', () => ({
  BriefingTab: ({ reports }: { reports: NewsletterItem[] }) => (
    <div data-testid="briefing-tab" data-count={reports.length} data-first-id={reports[0]?.id ?? ''} />
  ),
}));

vi.mock('@/components/dashboard/IntelligenceHubFooter', () => ({
  IntelligenceHubFooter: () => <div data-testid="hub-footer" />,
}));

vi.mock('@/components/ui/tabs', () => ({
  Tabs: ({ children, defaultValue }: any) => <div data-testid="tabs" data-default={defaultValue}>{children}</div>,
  TabsList: ({ children }: any) => <div data-testid="tabs-list">{children}</div>,
  TabsTrigger: ({ children, value, ...props }: any) => (
    <button data-testid={`tab-trigger-${value}`} data-value={value} role="tab" {...props}>{children}</button>
  ),
  TabsContent: ({ children, value }: any) => <div data-testid={`tab-content-${value}`} data-value={value}>{children}</div>,
}));

import { IntelligenceHubWidget } from '@/components/dashboard/IntelligenceHubWidget';

function makeGazette(id: string, week: number): GazetteStory {
  return {
    id: id as any,
    headline: `Headline ${id}`,
    body: 'Body text',
    mood: 'Calm' as any,
    tags: [],
    week,
  };
}

function makeNewsletter(id: string, week: number): NewsletterItem {
  return {
    id,
    week,
    title: `Report ${id}`,
    items: ['item'],
  };
}

function makeRival(id: string): RivalStableData {
  return {
    id: id as any,
    owner: { id: id as any, name: 'Rival', stableName: 'Rival Stable', fame: 0, renown: 0, titles: 0 },
    fame: 0,
    roster: [],
    treasury: 0,
    ledger: [],
    trainingAssignments: [],
  } as any;
}

describe('IntelligenceHubWidget', () => {
  beforeEach(() => {
    mockState = { week: 5, newsletter: [], gazettes: [], rivals: [] };
  });

  it('renders without crashing', () => {
    render(<IntelligenceHubWidget />);
    expect(screen.getByTestId('hub-header')).toBeInTheDocument();
    expect(screen.getByTestId('hub-footer')).toBeInTheDocument();
  });

  it('passes totalCommCount to IntelligenceHubHeader', () => {
    mockState = {
      week: 5,
      gazettes: [makeGazette('g1', 1), makeGazette('g2', 2)],
      newsletter: [makeNewsletter('n1', 1)],
      rivals: [],
    };
    render(<IntelligenceHubWidget />);
    expect(screen.getByTestId('hub-header')).toHaveAttribute('data-count', '3');
  });

  it('totalCommCount = gazettes.length + newsletter.length when both <= 5', () => {
    mockState = {
      week: 5,
      gazettes: [makeGazette('g1', 1), makeGazette('g2', 2), makeGazette('g3', 3)],
      newsletter: [makeNewsletter('n1', 1), makeNewsletter('n2', 2)],
      rivals: [],
    };
    render(<IntelligenceHubWidget />);
    expect(screen.getByTestId('hub-header')).toHaveAttribute('data-count', '5');
  });

  it('totalCommCount caps at last 5 gazettes + last 5 newsletter when both > 5', () => {
    mockState = {
      week: 5,
      gazettes: Array.from({ length: 8 }, (_, i) => makeGazette(`g${i}`, i)),
      newsletter: Array.from({ length: 7 }, (_, i) => makeNewsletter(`n${i}`, i)),
      rivals: [],
    };
    render(<IntelligenceHubWidget />);
    // 5 + 5 = 10
    expect(screen.getByTestId('hub-header')).toHaveAttribute('data-count', '10');
  });

  it('totalCommCount = 0 when both gazettes and newsletter are empty', () => {
    render(<IntelligenceHubWidget />);
    expect(screen.getByTestId('hub-header')).toHaveAttribute('data-count', '0');
  });

  it('handles undefined gazettes (|| [] guard)', () => {
    mockState = { week: 5, gazettes: undefined, newsletter: [makeNewsletter('n1', 1)], rivals: [] };
    render(<IntelligenceHubWidget />);
    expect(screen.getByTestId('hub-header')).toHaveAttribute('data-count', '1');
  });

  it('handles undefined newsletter (|| [] guard)', () => {
    mockState = { week: 5, gazettes: [makeGazette('g1', 1)], newsletter: undefined, rivals: [] };
    render(<IntelligenceHubWidget />);
    expect(screen.getByTestId('hub-header')).toHaveAttribute('data-count', '1');
  });

  it('passes last 5 gazettes reversed to GazetteTab', () => {
    mockState = {
      week: 5,
      gazettes: Array.from({ length: 8 }, (_, i) => makeGazette(`g${i}`, i)),
      newsletter: [],
      rivals: [],
    };
    render(<IntelligenceHubWidget />);
    // slice(-5) = g3..g7, reversed = g7,g6,g5,g4,g3 → first = g7
    const gazetteTab = screen.getByTestId('gazette-tab');
    expect(gazetteTab).toHaveAttribute('data-count', '5');
    expect(gazetteTab).toHaveAttribute('data-first-id', 'g7');
  });

  it('passes last 5 newsletter reversed to BriefingTab', () => {
    mockState = {
      week: 5,
      gazettes: [],
      newsletter: Array.from({ length: 8 }, (_, i) => makeNewsletter(`n${i}`, i)),
      rivals: [],
    };
    render(<IntelligenceHubWidget />);
    const briefingTab = screen.getByTestId('briefing-tab');
    expect(briefingTab).toHaveAttribute('data-count', '5');
    expect(briefingTab).toHaveAttribute('data-first-id', 'n7');
  });

  it('passes rivals[0] to AgentReasoningWidget', () => {
    mockState = {
      week: 5,
      gazettes: [],
      newsletter: [],
      rivals: [makeRival('rival-1')],
    };
    render(<IntelligenceHubWidget />);
    expect(screen.getByTestId('agent-reasoning')).toHaveAttribute('data-rival', 'rival-1');
  });

  it('passes undefined to AgentReasoningWidget when rivals is empty', () => {
    mockState = { week: 5, gazettes: [], newsletter: [], rivals: [] };
    render(<IntelligenceHubWidget />);
    expect(screen.getByTestId('agent-reasoning')).toHaveAttribute('data-rival', 'undefined');
  });

  it('renders all three tab triggers: Gazette Feed, Scout Reports, Rival AI', () => {
    render(<IntelligenceHubWidget />);
    expect(screen.getByText('Gazette Feed')).toBeInTheDocument();
    expect(screen.getByText('Scout Reports')).toBeInTheDocument();
    expect(screen.getByText('Rival AI')).toBeInTheDocument();
  });

  it('default tab value is "gazette" (gazette tab content visible by default)', () => {
    render(<IntelligenceHubWidget />);
    const tabs = screen.getByTestId('tabs');
    expect(tabs).toHaveAttribute('data-default', 'gazette');
  });

  it('renders IntelligenceHubFooter', () => {
    render(<IntelligenceHubWidget />);
    expect(screen.getByTestId('hub-footer')).toBeInTheDocument();
  });
});
