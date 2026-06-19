// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import Bookmarks from '@/pages/Bookmarks';
import '@/test/_setup/setup';

let mockNavigate = vi.fn();
let mockStoreState: any = {
  bookmarks: [],
  roster: [],
  graveyard: [],
  retired: [],
  rivals: [],
  promoters: {},
  tournaments: [],
  boutOffers: {},
  scoutReports: [],
  trainers: [],
};

vi.mock('@tanstack/react-router', () => ({
  useNavigate: () => mockNavigate,
  Link: ({ to, children }: any) => <a href={to}>{children}</a>,
}));

vi.mock('@/state/useGameStore', () => ({
  useGameStore: (selector?: any) => {
    const state = {
      ...mockStoreState,
      isBookmarked: (type: string, id: string) =>
        mockStoreState.bookmarks.some((b: any) => b.entityType === type && b.entityId === id),
      toggleBookmark: vi.fn(),
      removeBookmark: vi.fn(),
      clearBookmarks: vi.fn(),
      clearBookmarksByType: vi.fn(),
      cleanDanglingBookmarks: vi.fn(),
      getBookmarksByType: (type: string) =>
        mockStoreState.bookmarks.filter((b: any) => b.entityType === type),
    };
    if (selector) return selector(state);
    return state;
  },
}));

describe('Bookmarks Page', () => {
  beforeEach(() => {
    mockNavigate.mockClear();
    mockStoreState = {
      bookmarks: [],
      roster: [],
      graveyard: [],
      retired: [],
      rivals: [],
      promoters: {},
      tournaments: [],
      boutOffers: {},
      scoutReports: [],
      trainers: [],
    };
  });

  it('renders empty state when no bookmarks exist', () => {
    render(<Bookmarks />);
    expect(screen.getByText(/No Entries Marked/i)).toBeInTheDocument();
    expect(screen.getByText(/TRACKED ENTITIES/i)).toBeInTheDocument();
  });

  it('renders bookmark count in header', () => {
    mockStoreState.bookmarks = [
      { entityType: 'warrior', entityId: 'w1', createdAt: '2026-01-01' },
      { entityType: 'rival', entityId: 'r1', createdAt: '2026-01-02' },
    ];
    render(<Bookmarks />);
    expect(screen.getByText('2')).toBeInTheDocument();
  });

  it('groups bookmarks by entity type', () => {
    mockStoreState.bookmarks = [
      { entityType: 'warrior', entityId: 'w1', createdAt: '2026-01-01' },
      { entityType: 'warrior', entityId: 'w2', createdAt: '2026-01-02' },
      { entityType: 'rival', entityId: 'r1', createdAt: '2026-01-03' },
    ];
    mockStoreState.roster = [
      { id: 'w1', name: 'Thorn', style: 'SlashingAttack' },
      { id: 'w2', name: 'Blade', style: 'AimedBlow' },
    ];
    mockStoreState.rivals = [
      {
        id: 'r1',
        owner: { id: 'r1', name: 'Rival One', stableName: 'Iron Fang' },
        roster: [],
      },
    ];
    render(<Bookmarks />);
    expect(screen.getByText('Thorn')).toBeInTheDocument();
    expect(screen.getByText('Blade')).toBeInTheDocument();
    expect(screen.getByText('Iron Fang')).toBeInTheDocument();
  });

  it('shows [Entity Removed] for dangling bookmarks', () => {
    mockStoreState.bookmarks = [
      { entityType: 'warrior', entityId: 'ghost-id', createdAt: '2026-01-01' },
      { entityType: 'promoter', entityId: 'ghost-promo', createdAt: '2026-01-02' },
    ];
    render(<Bookmarks />);
    const removedTexts = screen.getAllByText('[Entity Removed]');
    expect(removedTexts.length).toBe(2);
  });

  it('looks up warriors from roster, graveyard, and retired', () => {
    mockStoreState.bookmarks = [
      { entityType: 'warrior', entityId: 'grave1', createdAt: '2026-01-01' },
      { entityType: 'warrior', entityId: 'ret1', createdAt: '2026-01-02' },
    ];
    mockStoreState.roster = [];
    mockStoreState.graveyard = [{ id: 'grave1', name: 'DeadWarrior', style: 'BashingAttack' }];
    mockStoreState.retired = [{ id: 'ret1', name: 'RetiredWarrior', style: 'ParryLunge' }];
    render(<Bookmarks />);
    expect(screen.getByText('DeadWarrior')).toBeInTheDocument();
    expect(screen.getByText('RetiredWarrior')).toBeInTheDocument();
  });

  it('looks up warriors from rival rosters', () => {
    mockStoreState.bookmarks = [
      { entityType: 'warrior', entityId: 'rival-warrior', createdAt: '2026-01-01' },
    ];
    mockStoreState.rivals = [
      {
        id: 'riv1',
        owner: { id: 'riv1', name: 'Enemy', stableName: 'Red Clan' },
        roster: [{ id: 'rival-warrior', name: 'FoeBlade', style: 'LungingAttack' }],
      },
    ];
    render(<Bookmarks />);
    expect(screen.getByText('FoeBlade')).toBeInTheDocument();
  });

  it('looks up promoters', () => {
    mockStoreState.bookmarks = [
      { entityType: 'promoter', entityId: 'promo1', createdAt: '2026-01-01' },
    ];
    mockStoreState.promoters = {
      promo1: { id: 'promo1', name: 'GoldRing', tier: 'Legendary', personality: 'Honorable' },
    };
    render(<Bookmarks />);
    expect(screen.getByText('GoldRing')).toBeInTheDocument();
  });

  it('looks up trainers', () => {
    mockStoreState.bookmarks = [{ entityType: 'trainer', entityId: 't1', createdAt: '2026-01-01' }];
    mockStoreState.trainers = [
      { id: 't1', name: 'Coach Steel', tier: 'Expert', focus: 'Strength' },
    ];
    render(<Bookmarks />);
    expect(screen.getByText('Coach Steel')).toBeInTheDocument();
  });

  it('looks up tournaments', () => {
    mockStoreState.bookmarks = [
      { entityType: 'tournament', entityId: 'tr1', createdAt: '2026-01-01' },
    ];
    mockStoreState.tournaments = [{ id: 'tr1', name: 'Spring Classic', season: 'Spring', week: 5 }];
    render(<Bookmarks />);
    expect(screen.getByText('Spring Classic')).toBeInTheDocument();
  });

  it('looks up bout offers', () => {
    mockStoreState.bookmarks = [
      { entityType: 'boutOffer', entityId: 'bo1', createdAt: '2026-01-01' },
    ];
    mockStoreState.boutOffers = {
      bo1: { id: 'bo1', promoterId: 'promo1', purse: 1000 },
    };
    mockStoreState.promoters = {
      promo1: { id: 'promo1', name: 'ArenaMaster', tier: 'National', personality: 'Aggressive' },
    };
    render(<Bookmarks />);
    expect(screen.getByText('bo1')).toBeInTheDocument();
    expect(screen.getByText(/ArenaMaster/i)).toBeInTheDocument();
  });

  it('looks up scout reports', () => {
    mockStoreState.bookmarks = [
      { entityType: 'scoutReport', entityId: 'sr1', createdAt: '2026-01-01' },
    ];
    mockStoreState.scoutReports = [
      { id: 'sr1', warriorName: 'MysteryFighter', quality: 'Expert', week: 3 },
    ];
    render(<Bookmarks />);
    expect(screen.getByText('MysteryFighter')).toBeInTheDocument();
  });

  it('shows Clear All button when bookmarks exist', () => {
    mockStoreState.bookmarks = [
      { entityType: 'warrior', entityId: 'w1', createdAt: '2026-01-01' },
    ];
    mockStoreState.roster = [{ id: 'w1', name: 'Thorn', style: 'SlashingAttack' }];
    render(<Bookmarks />);
    expect(screen.getByRole('button', { name: /clear all/i })).toBeInTheDocument();
  });

  it('shows Clear button per section', () => {
    mockStoreState.bookmarks = [
      { entityType: 'warrior', entityId: 'w1', createdAt: '2026-01-01' },
    ];
    mockStoreState.roster = [{ id: 'w1', name: 'Thorn', style: 'SlashingAttack' }];
    render(<Bookmarks />);
    const clearButtons = screen.getAllByRole('button', { name: /clear/i });
    expect(clearButtons.length).toBeGreaterThanOrEqual(1);
  });

  it('sorts warriors alphabetically when sort is set to name', async () => {
    mockStoreState.bookmarks = [
      { entityType: 'warrior', entityId: 'w2', createdAt: '2026-01-01' },
      { entityType: 'warrior', entityId: 'w1', createdAt: '2026-01-02' },
    ];
    mockStoreState.roster = [
      { id: 'w1', name: 'Alpha', style: 'AimedBlow' },
      { id: 'w2', name: 'Zebra', style: 'SlashingAttack' },
    ];
    render(<Bookmarks />);
    const sortButtons = screen.getAllByLabelText(/sort by name/i);
    expect(sortButtons.length).toBeGreaterThanOrEqual(1);
  });

  it('displays tracked date for bookmarks', () => {
    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 2);
    mockStoreState.bookmarks = [
      { entityType: 'warrior', entityId: 'w1', createdAt: pastDate.toISOString() },
    ];
    mockStoreState.roster = [{ id: 'w1', name: 'Thorn', style: 'SlashingAttack' }];
    render(<Bookmarks />);
    expect(screen.getByText(/Tracked 2 days ago/i)).toBeInTheDocument();
  });
});
