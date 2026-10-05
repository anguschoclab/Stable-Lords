import { test, expect, type Page } from '@playwright/test';
import { clickNavLink, startNewGame } from './helpers';

/**
 * Golden path E2E test:
 * 1. Start a new game (title → new game form → orphanage FTUE)
 * 2. Click through every side-panel menu item in Stable + World hubs
 * 3. Verify the route-aware primary CTA (VIEW CARD on Arena)
 * 4. Advance a week via BEGIN CYCLE and dismiss the resolution modal
 */

test('golden path: new game → navigate all pages → fight → advance week', async ({
  page,
  isMobile,
}: {
  page: Page;
  isMobile: boolean;
}) => {
  // Mobile runs are slower (sheet open/close animation per nav click).
  test.setTimeout(isMobile ? 240_000 : 120_000);

  const nav = (name: string, opts: { exact?: boolean } = { exact: true }) =>
    clickNavLink(page, isMobile, name, opts);

  // ── 1–3. Title → New Game → Orphanage FTUE → App Shell ─────────────────
  await startNewGame(page);

  // ── 4. Main App — Navigate Side Panel Menu Items ────────────────────────
  // Wait for the app shell to load (left nav on desktop, hamburger on mobile)
  await page.waitForSelector(isMobile ? 'button[aria-label="Open navigation menu"]' : 'nav', {
    timeout: 15_000,
  });

  // Record initial week from the live store — DOM text matching is unreliable:
  // the "Week N concluded." toast precedes the header in DOM order and on
  // mobile viewports the header's week display is hidden entirely.
  const readWeek = (): Promise<number> =>
    page.evaluate(async () => {
      // Non-literal specifier: resolved at runtime by vite dev, invisible to tsc.
      const storeModulePath = '/src/state/useGameStore.ts';
      const mod = (await import(/* @vite-ignore */ storeModulePath)) as {
        useGameStore: { getState: () => { week: number } };
      };
      return mod.useGameStore.getState().week;
    });
  const initialWeek = await readWeek();

  // --- Stable Hub pages ---
  const stablePages = [
    'Overview',
    'War Council',
    'Roster',
    'Training',
    'Planner',
    'Arena',
    'Equipment',
    'Bouts',
    'Promoters',
    'Trainers',
    'Finance',
    'Recruit',
    'Offseason',
    'Simulator',
    // 'Tournaments' also appears in the stable hub but lands on a world route;
    // it is covered in the worldPages sweep below.
  ];

  for (const label of stablePages) {
    await nav(label);
    // Wait for page transition animation + content
    await page.waitForTimeout(800);
    // Verify no crash — check that main content area still exists
    await expect(page.locator('main').first()).toBeVisible();
  }

  // --- Switch to World hub ---
  await nav('World', { exact: false });
  await page.waitForTimeout(500);

  const worldPages = [
    'Rankings',
    'Arenas',
    'Tournaments',
    'Prep Mode',
    'Scouting',
    'Style Archives',
    'Chronicle',
    'Hall of Fame',
    'Graveyard',
    // Lore route — leaving the world hub collapses its page list, so it must
    // be visited last.
    'Hall of Fights',
  ];

  for (const label of worldPages) {
    await nav(label);
    await page.waitForTimeout(800);
    await expect(page.locator('main').first()).toBeVisible();
  }

  // --- Switch to Bookmarks hub ---
  await nav('Bookmarks', { exact: false });
  await page.waitForTimeout(500);
  await expect(page.locator('main').first()).toBeVisible();

  // ── 5. Arena Hub → Execute Week (Fight) ─────────────────────────────────
  // Navigate to Arena — the route-aware CTA here is VIEW CARD (page-registered
  // scroll action), not the week pipeline.
  await nav('Stable', { exact: false });
  await page.waitForTimeout(500);
  await nav('Arena');
  await page.waitForTimeout(1000);
  await expect(page.getByRole('button', { name: /VIEW CARD/ })).toBeVisible();

  // Navigate to Bouts — its CTA is BEGIN CYCLE, which runs the week pipeline.
  await nav('Bouts');
  await page.waitForTimeout(1000);
  const advanceWeekBtn = page.getByRole('button', { name: /BEGIN CYCLE/ });
  await advanceWeekBtn.click();

  // Wait for the week advancement to complete (resolution modal appears)
  // The ResolutionReveal modal has "Cycle Resolution" as its title
  await page.waitForSelector('text=Cycle Resolution', { timeout: 30_000 });

  // ── 6. Dismiss Resolution Modal ─────────────────────────────────────────
  // Click through all resolution steps: gazette → injuries → bouts → math → (memorial) → close
  // The button text changes: "Next Report", "Acknowledge & Begin Planning", or "Honor the Fallen"
  for (let i = 0; i < 6; i++) {
    const nextBtn = page.getByRole('button', {
      name: /Next Report|Acknowledge & Begin Planning|Honor the Fallen/,
    });
    try {
      await nextBtn.first().waitFor({ state: 'visible', timeout: 2000 });
      await nextBtn.first().click();
      await page.waitForTimeout(500);
    } catch {
      break;
    }
  }

  // ── 7. Verify Week Advanced ─────────────────────────────────────────────
  await page.waitForTimeout(1000);
  expect(await readWeek()).toBeGreaterThan(initialWeek);

  // Take a final screenshot for verification
  await page.screenshot({ path: 'e2e/screenshots/golden-path-final.png', fullPage: false });
});
