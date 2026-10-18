import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { HUBS, UTILITY_LINKS } from '@/components/layout/navigationHubs';

/**
 * Canonical IA contract:
 * - Stable owns stable-management surfaces only.
 * - World owns all world/competition/history surfaces, including Tournaments.
 * - Bookmarks is a utility destination, not a top-level hub.
 */
describe('canonical information architecture', () => {
  it('exposes exactly Stable and World hubs', () => {
    expect(HUBS.map((hub) => hub.id)).toEqual(['stable', 'world']);
  });

  it('gives World sole canonical ownership of tournaments', () => {
    const stable = HUBS.find((hub) => hub.id === 'stable');
    const world = HUBS.find((hub) => hub.id === 'world');

    const stableDestinations = (stable?.pages ?? []).map((page) => page.to as string);
    const worldDestinations = (world?.pages ?? []).map((page) => page.to as string);

    expect(stableDestinations).not.toContain('/world/tournaments');
    expect(worldDestinations).toContain('/world/tournaments');
  });

  it('moves Bookmarks to utilities without making it a hub', () => {
    const hubIds = HUBS.map((hub) => hub.id as string);
    const utilityDestinations = UTILITY_LINKS.map((link) => link.to as string);
    expect(hubIds).not.toContain('bookmarks');
    expect(utilityDestinations).toContain('/bookmarks');
  });

  it('groups Stable destinations by management task', () => {
    const stable = HUBS.find((hub) => hub.id === 'stable');
    const sectionsByPath = new Map(
      (stable?.pages ?? []).map((page) => [
        page.to as string,
        (page as { section?: string }).section,
      ])
    );

    expect(sectionsByPath.get('/stable')).toBe('Command');
    expect(sectionsByPath.get('/stable/arena')).toBe('Command');
    expect(sectionsByPath.get('/stable/roster')).toBe('Roster');
    expect(sectionsByPath.get('/stable/training')).toBe('Roster');
    expect(sectionsByPath.get('/stable/planner')).toBe('Roster');
    expect(sectionsByPath.get('/stable/equipment')).toBe('Roster');
    expect(sectionsByPath.get('/stable/finance')).toBe('Operations');
    expect(sectionsByPath.get('/stable/recruit')).toBe('Operations');
    expect(sectionsByPath.get('/tools/physicals-simulator')).toBe('Tools');
  });

  it('keeps Admin reachable only in development builds', () => {
    const admin = UTILITY_LINKS.find((link) => link.to === '/admin');
    const routeSource = readFileSync(path.resolve(__dirname, '../../routes/admin.tsx'), 'utf8');
    expect(admin && 'devOnly' in admin && admin.devOnly).toBe(true);
    expect(routeSource).toContain('import.meta.env.DEV ? AdminTools : NotFound');
  });
});
