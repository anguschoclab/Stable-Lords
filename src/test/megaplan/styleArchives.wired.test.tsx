// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import '@/test/_setup/setup';

/**
 * MEGAPLAN-G1 spec (test-first, skipped until Phase 5):
 *
 * Feature Integration Matrix #6 — "Style Archives Browser (10 warrior types)".
 * No browser exists today: the only FightingStyle enumeration in UI is the
 * WarriorBuilder dropdown. Spec surface: a browsable archives surface listing
 * all 10 canonical styles with compendium data (display name, description,
 * key stats/requirements), reachable via the World or Lore hub.
 *
 * Implementation contract (drives Phase-5 build):
 *   - `src/pages/StyleArchives.tsx` (or lore/) renders every FightingStyle
 *     value from STYLE_DISPLAY_NAMES — no hardcoded style list.
 *   - Routed at `/world/style-archives` (or lore route) + nav-linked.
 */
vi.mock('@tanstack/react-router', () => ({
  Link: ({ to, children }: { to: string; children: React.ReactNode }) => <a href={to}>{children}</a>,
  useParams: () => ({}),
  useNavigate: () => vi.fn(),
}));

describe('Style Archives browser (MEGAPLAN-G1)', () => {
  beforeEach(() => {});

  it('renders all 10 canonical fighting styles from the enum, not a hardcoded list', async () => {
    const { FightingStyle, STYLE_DISPLAY_NAMES } = await import('@/types/shared.types');
    const { render, screen } = await import('@testing-library/react');
    // Glob so the spec compiles before the page exists.
    const files = import.meta.glob('/src/pages/StyleArchives.*');
    const loader = Object.values(files)[0] as (() => Promise<Record<string, React.ComponentType>>) | undefined;
    const mod = loader ? await loader() : null;
    expect(mod, 'StyleArchives page missing').not.toBeNull();
    const Component = (mod!.default ?? mod!.StyleArchives) as React.ComponentType;
    render(<Component />);
    for (const style of Object.values(FightingStyle)) {
      expect(screen.getAllByText(STYLE_DISPLAY_NAMES[style]).length).toBeGreaterThan(0);
    }
  });

  it('is reachable — registered in the route tree', async () => {
    const { readFileSync } = await import('node:fs');
    const tree = readFileSync('src/routeTree.gen.ts', 'utf8');
    expect(tree).toMatch(/style-archives|StyleArchives/i);
  });
});
