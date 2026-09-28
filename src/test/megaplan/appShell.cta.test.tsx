// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';

/**
 * MEGAPLAN-L1 spec (test-first, skipped until Phase 6):
 *
 * DESIGN_PAGE_SYSTEM_v1.0 §1 mandates a per-route primary CTA in the shared
 * top bar. The spec's route names predate the hub reorganization; the
 * canonical mapping (implemented via a location-aware CTA registry in
 * components/layout/navigationShared.tsx or similar) is:
 *
 *   '/'                        → EXECUTE WEEK N ›   (advances week)
 *   '/stable/bouts'            → BEGIN CYCLE ›
 *   '/stable/arena'            → VIEW CARD ›
 *   '/world/tournaments'       → ADVANCE BRACKET ›
 *   '/stable/training', '/stable/planner' → COMMIT REGIMEN ›
 *   '/stable/recruit', '/world/scouting'  → SIGN CONTRACT › (disabled until selection)
 *   '/stable/offseason'        → CLOSE SEASON ›
 *   detail pages               → no primary CTA (contextual secondaries only)
 *   lore pages                 → no primary CTA (reading rooms)
 *
 * Implementation contract: a route→CTA registry keyed on pathname prefixes,
 * consumed by AppHeader. This spec drives that surface.
 */
// The registry module lands with the Phase-6 CTA implementation — glob so the
// spec compiles before the module exists (empty map = not yet implemented).
const ctaModule = import.meta.glob<Record<string, unknown>>('/src/components/layout/primaryCta.*');

async function loadRegistry(): Promise<Record<string, unknown> | null> {
  const loader = Object.values(ctaModule)[0];
  return loader ? await loader() : null;
}

describe.skip('appShell per-route primary CTA (MEGAPLAN-L1)', () => {
  it('exposes a CTA registry keyed by route prefix', async () => {
    const mod = await loadRegistry();
    expect(mod, 'primaryCta registry module missing').not.toBeNull();
    const { PRIMARY_CTA_BY_ROUTE } = mod! as {
      PRIMARY_CTA_BY_ROUTE: Record<string, { label: unknown }>;
    };
    expect(PRIMARY_CTA_BY_ROUTE['/']).toMatchObject({ label: expect.stringMatching(/EXECUTE WEEK/i) });
    expect(PRIMARY_CTA_BY_ROUTE['/stable/bouts']).toMatchObject({ label: /BEGIN CYCLE/ });
    expect(PRIMARY_CTA_BY_ROUTE['/stable/arena']).toMatchObject({ label: /VIEW CARD/ });
    expect(PRIMARY_CTA_BY_ROUTE['/world/tournaments']).toMatchObject({ label: /ADVANCE BRACKET/ });
    expect(PRIMARY_CTA_BY_ROUTE['/stable/training']).toMatchObject({ label: /COMMIT REGIMEN/ });
    expect(PRIMARY_CTA_BY_ROUTE['/stable/planner']).toMatchObject({ label: /COMMIT REGIMEN/ });
    expect(PRIMARY_CTA_BY_ROUTE['/stable/recruit']).toMatchObject({ label: /SIGN CONTRACT/ });
    expect(PRIMARY_CTA_BY_ROUTE['/world/scouting']).toMatchObject({ label: /SIGN CONTRACT/ });
    expect(PRIMARY_CTA_BY_ROUTE['/stable/offseason']).toMatchObject({ label: /CLOSE SEASON/ });
  });

  it('resolves detail and lore routes to no primary CTA', async () => {
    const mod = await loadRegistry();
    expect(mod).not.toBeNull();
    const { resolvePrimaryCta } = mod! as { resolvePrimaryCta: (p: string) => unknown };
    for (const p of ['/warrior/w1', '/world/stable/s1', '/stable/promoter/p1', '/world/arenas/a1', '/world/chronicle', '/world/graveyard', '/lore/hall-of-fights', '/help'])
      expect(resolvePrimaryCta(p), `route ${p} should have no primary CTA`).toBeNull();
  });
});
