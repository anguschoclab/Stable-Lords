// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import type { Warrior } from '@/types/warrior.types';
import type { FightingStyle, WarriorId } from '@/types/shared.types';

// --- Router mock ---
vi.mock('@tanstack/react-router', () => ({
  useParams: vi.fn(() => ({ id: 'w1' })),
  useNavigate: vi.fn(() => vi.fn()),
  Link: ({ children }: any) => <span>{children}</span>,
}));

// --- Sub-component mocks (shallow) ---
vi.mock('@/components/warrior/WarriorHeroHeader', () => ({
  WarriorHeroHeader: () => <div data-testid="hero-header" />,
}));
vi.mock('@/components/warrior/BiometricsTab', () => ({
  BiometricsTab: () => <div data-testid="biometrics-tab" />,
}));
vi.mock('@/components/warrior/MissionControlTab', () => ({
  MissionControlTab: () => <div data-testid="mission-tab" />,
}));
vi.mock('@/components/warrior/ChronicleTab', () => ({
  ChronicleTab: () => <div data-testid="chronicle-tab" />,
}));
vi.mock('@/components/bookmarks/BookmarkButton', () => ({
  BookmarkButton: () => <div data-testid="bookmark-btn" />,
}));
vi.mock('@/components/ui/PageHeader', () => ({
  PageHeader: ({ eyebrow, actions }: any) => (
    <div data-testid="page-header">
      <span data-testid="eyebrow">{eyebrow}</span>
      <div data-testid="header-actions">{actions}</div>
    </div>
  ),
}));
vi.mock('@/components/ui/PageFrame', () => ({
  PageFrame: ({ children }: any) => <div>{children}</div>,
}));
vi.mock('@/components/ui/SectionDivider', () => ({
  SectionDivider: ({ label }: any) => <div data-testid="section-divider">{label}</div>,
}));
vi.mock('@/components/ui/Surface', () => ({
  Surface: ({ children }: any) => <div>{children}</div>,
}));
vi.mock('@/components/ui/ImperialRing', () => ({
  ImperialRing: ({ children }: any) => <div>{children}</div>,
}));
vi.mock('@/components/ui/separator', () => ({
  Separator: () => <hr />,
}));

// --- Engine / store mocks ---
vi.mock('@/engine/gazette/gazetteDetections', () => ({
  computeStreaks: vi.fn(() => new Map()),
}));
vi.mock('@/engine/simulate', () => ({
  defaultPlanForWarrior: vi.fn(() => ({})),
}));
vi.mock('@/engine/warriorStatus', () => ({
  isActive: vi.fn(() => true),
}));
vi.mock('@/lib/obfuscation', () => ({
  obfuscateWarrior: vi.fn((_w: any) => _w),
}));
vi.mock('@/utils/warriorCollection', () => ({
  buildWarriorMap: vi.fn((args: any) => {
    const map = new Map();
    for (const w of [...args.roster, ...args.rivals, ...args.graveyard, ...args.retired]) {
      map.set(w.id, w);
    }
    return map;
  }),
}));
vi.mock('sonner', () => ({ toast: { success: vi.fn() } }));

let mockRoster: Warrior[] = [];
let mockRivals: Warrior[] = [];

vi.mock('@/state/useGameStore', () => ({
  useGameStore: (selector: any) =>
    selector({
      roster: mockRoster,
      graveyard: [],
      retired: [],
      rivals: mockRivals,
      arenaHistory: [],
      insightTokens: [],
      setState: vi.fn(),
      retireWarrior: vi.fn(),
    }),
}));

// --- Fixtures ---
function makeWarrior(overrides: Partial<Warrior> = {}): Warrior {
  return {
    id: (overrides.id ?? 'w1') as WarriorId,
    name: overrides.name ?? 'Spartacus',
    style: 'StrikingAttack' as FightingStyle,
    attributes: { ST: 10, CN: 10, SZ: 10, WT: 10, WL: 10, SP: 10, DF: 10 },
    baseSkills: { ATT: 10, DEF: 10, INI: 10, PAR: 10, RIP: 10, DEC: 10 },
    derivedStats: { hp: 100, endurance: 100, damage: 5, encumbrance: 0 },
    injuries: [],
    career: { wins: 5, losses: 3, kills: 1 },
    fame: 7,
    popularity: 3,
    titles: [],
    flair: [],
    champion: false,
    status: 'Active',
    ...overrides,
  } as Warrior;
}

import WarriorDetail from '@/pages/WarriorDetail';
import { computeStreaks } from '@/engine/gazette/gazetteDetections';
import { isActive } from '@/engine/warriorStatus';

describe('WarriorDetail', () => {
  beforeEach(() => {
    mockRoster = [makeWarrior()];
    mockRivals = [];
    vi.mocked(computeStreaks).mockReturnValue(new Map());
    vi.mocked(isActive).mockReturnValue(true);
  });

  // --- Empty state ---
  it('renders "No gladiator bears this mark." for unknown warrior id', () => {
    mockRoster = [];
    render(<WarriorDetail />);
    expect(screen.getByText('No gladiator bears this mark.')).toBeInTheDocument();
  });

  it('renders "Return to the Ludus" button in empty state', () => {
    mockRoster = [];
    render(<WarriorDetail />);
    expect(screen.getByText('Return to the Ludus')).toBeInTheDocument();
  });

  // --- Eyebrow labels ---
  it('renders "Your Gladiator" eyebrow for player-owned warrior', () => {
    render(<WarriorDetail />);
    expect(screen.getByTestId('eyebrow')).toHaveTextContent('Your Gladiator');
  });

  it('renders "Rival Gladiator" eyebrow for rival warrior', () => {
    mockRoster = [];
    mockRivals = [makeWarrior()];
    render(<WarriorDetail />);
    expect(screen.getByTestId('eyebrow')).toHaveTextContent('Rival Gladiator');
  });

  // --- Header action area ---
  it('renders "Scroll of Deeds" label in header action area', () => {
    render(<WarriorDetail />);
    expect(screen.getByText('Scroll of Deeds')).toBeInTheDocument();
  });

  it('renders "Grant Rudis" button for active player-owned warrior', () => {
    render(<WarriorDetail />);
    expect(screen.getByText('Grant Rudis')).toBeInTheDocument();
  });

  it('does not render "Grant Rudis" for inactive warrior', () => {
    vi.mocked(isActive).mockReturnValue(false);
    render(<WarriorDetail />);
    expect(screen.queryByText('Grant Rudis')).not.toBeInTheDocument();
  });

  // --- Sidebar section dividers ---
  it('renders "Standing" SectionDivider', () => {
    render(<WarriorDetail />);
    const dividers = screen.getAllByTestId('section-divider');
    expect(dividers.some((d) => d.textContent === 'Standing')).toBe(true);
  });

  it('renders "Blood Ledger" SectionDivider', () => {
    render(<WarriorDetail />);
    const dividers = screen.getAllByTestId('section-divider');
    expect(dividers.some((d) => d.textContent === 'Blood Ledger')).toBe(true);
  });

  // --- Sidebar stat labels ---
  it('renders "Renown" stat label', () => {
    render(<WarriorDetail />);
    expect(screen.getByText('Renown')).toBeInTheDocument();
  });

  it('renders "Crowd Favor" stat label', () => {
    render(<WarriorDetail />);
    expect(screen.getByText('Crowd Favor')).toBeInTheDocument();
  });

  it('renders "Bouts Fought" stat label', () => {
    render(<WarriorDetail />);
    expect(screen.getByText('Bouts Fought')).toBeInTheDocument();
  });

  it('renders "Slain" stat label', () => {
    render(<WarriorDetail />);
    expect(screen.getByText('Slain')).toBeInTheDocument();
  });

  // --- Champion badge ---
  it('renders "Champion of the Arena" badge when warrior.champion is true', () => {
    mockRoster = [makeWarrior({ champion: true })];
    render(<WarriorDetail />);
    expect(screen.getByText('Champion of the Arena')).toBeInTheDocument();
  });

  it('does not render champion badge when warrior.champion is false', () => {
    render(<WarriorDetail />);
    expect(screen.queryByText('Champion of the Arena')).not.toBeInTheDocument();
  });

  // --- Tab labels ---
  it('renders tab label "DOSSIER"', () => {
    render(<WarriorDetail />);
    expect(screen.getByText('DOSSIER')).toBeInTheDocument();
  });

  it('renders tab label "WAR PLAN"', () => {
    render(<WarriorDetail />);
    expect(screen.getByText('WAR PLAN')).toBeInTheDocument();
  });

  it('renders tab label "CHRONICLE"', () => {
    render(<WarriorDetail />);
    expect(screen.getByText('CHRONICLE')).toBeInTheDocument();
  });

  // --- Streak labels ---
  it('renders "${n}-Bout Reign" streak label for positive streak', () => {
    vi.mocked(computeStreaks).mockReturnValue(new Map([['w1' as WarriorId, 3]]));
    render(<WarriorDetail />);
    expect(screen.getByText('3-Bout Reign')).toBeInTheDocument();
  });

  it('renders "${n}-Bout Slump" streak label for negative streak', () => {
    vi.mocked(computeStreaks).mockReturnValue(new Map([['w1' as WarriorId, -2]]));
    render(<WarriorDetail />);
    expect(screen.getByText('2-Bout Slump')).toBeInTheDocument();
  });

  it('renders no streak badge when streakVal is 0', () => {
    vi.mocked(computeStreaks).mockReturnValue(new Map([['w1' as WarriorId, 0]]));
    render(<WarriorDetail />);
    expect(screen.queryByText(/Bout Reign/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Bout Slump/)).not.toBeInTheDocument();
  });
});
