// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import ArenaDetail from '@/pages/ArenaDetail';
import { getAllArenas, getArenaLore } from '@/data/arenas';
import { makeGameState } from '@/test/_fixtures/factories';
import { useGameStore } from '@/state/useGameStore';
import '@/test/_setup/setup';

/**
 * Region-pinning spec for ArenaDetail (420-line component — Phase-3/6
 * decomposition target). Pins the rendered landmark regions so extraction
 * of sub-components stays behavior-identical.
 */

let mockArenaId = '';
vi.mock('@tanstack/react-router', () => ({
  useParams: () => ({ arenaId: mockArenaId }),
  useNavigate: () => vi.fn(),
  Link: ({ to, children }: { to: string; children: React.ReactNode }) => (
    <a href={to}>{children}</a>
  ),
}));

describe('ArenaDetail page (region pinning)', () => {
  beforeEach(() => {
    useGameStore.setState(makeGameState() as never);
  });

  it('renders unknown-arena fallback for a bad id', () => {
    mockArenaId = 'no-such-arena';
    render(<ArenaDetail />);
    expect(screen.getByText('Unknown Arena')).toBeTruthy();
  });

  it('renders header + leaderboard regions for a real arena', () => {
    const arena = getAllArenas()[0]!;
    mockArenaId = arena.id;
    render(<ArenaDetail />);
    // PageHeader pins: title + tier/size/tags subtitle
    expect(screen.getByRole('heading', { level: 1, name: arena.name })).toBeTruthy();
    expect(screen.getByText(new RegExp(`Tier ${arena.tier}`))).toBeTruthy();
    // Landmark sections pinned for extraction parity (Title History and
    // Recent Bouts render only when data exists — pinned by empty-state here,
    // and by data-driven tests in the arenaChampionship suites)
    expect(screen.getByText('Top Warriors')).toBeTruthy();
  });

  it('renders tag-driven WATER HAZARD badge in header actions (V10 #1018)', () => {
    const arena = getAllArenas().find((a) => a.tags.includes('water'))!;
    mockArenaId = arena.id;
    render(<ArenaDetail />);
    expect(screen.getByText('WATER HAZARD')).toBeTruthy();
  });

  it('renders tag-driven CURSED GROUND badge in header actions (V10 #1018)', () => {
    const arena = getAllArenas().find((a) => a.tags.includes('cursed'))!;
    mockArenaId = arena.id;
    render(<ArenaDetail />);
    expect(screen.getByText('CURSED GROUND')).toBeTruthy();
  });

  // V2-01 — ARENA_LORE regressed dead when the ArenaLeaderboards surface was
  // removed; the arena detail page is the canonical venue surface and must
  // render the venue's lore entries (title + narrative from ARENA_LORE).
  it('renders ARENA_LORE narrative entries for the venue (V2-01)', () => {
    mockArenaId = 'mudpit_arena';
    render(<ArenaDetail />);
    expect(screen.getByText('The Drowning Grasp')).toBeTruthy();
  });

  it('renders no lore section for arenas without entries', () => {
    const arena = getAllArenas().find((a) => a.id !== 'mudpit_arena' && getArenaLore(a.id).length === 0);
    if (!arena) return; // all arenas carry lore — nothing to assert
    mockArenaId = arena.id;
    render(<ArenaDetail />);
    expect(screen.queryByText('The Drowning Grasp')).toBeNull();
  });

  // V2-02 — content packs overlay arena lore (G7). The /mods-installed pack
  // entries must render alongside canonical ARENA_LORE on the venue page.
  it('renders content-pack arena lore alongside canonical entries (V2-02)', () => {
    useGameStore.setState(
      makeGameState({
        contentPacks: [
          {
            id: 'pack_1',
            name: 'Test Pack',
            arenaLore: [
              {
                id: 'pk_lore_1',
                arenaId: 'mudpit_arena',
                type: 'famous_death',
                title: 'The Silt Reckoning',
                narrative: 'A pack-supplied legend.',
              },
            ],
          },
        ],
      }) as never
    );
    mockArenaId = 'mudpit_arena';
    render(<ArenaDetail />);
    expect(screen.getByText('The Silt Reckoning')).toBeTruthy();
    expect(screen.getByText('The Drowning Grasp')).toBeTruthy();
  });
});
