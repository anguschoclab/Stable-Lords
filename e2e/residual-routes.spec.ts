import { test, expect } from '@playwright/test';
import { gotoInApp, startNewGame } from './helpers';

/**
 * Residual route coverage — utility/lore routes not reachable through the
 * hub nav (/mods, /import-export, /admin, /lore/hall-of-fights).
 *
 * Per DESIGN_PAGE_SYSTEM §1 none of these carry a registered primary CTA, so
 * the shared top bar must render no CTA action on them. Each page is also
 * smoke-checked for its header title so a blank/crashed render fails loudly.
 */
test('residual routes render and expose no primary CTA', async ({ page }) => {
  await startNewGame(page);
  await page.waitForSelector('header', { timeout: 15_000 });

  const ctaLabels =
    /EXECUTE WEEK|BEGIN CYCLE|VIEW CARD|ADVANCE BRACKET|COMMIT REGIMEN|SIGN CONTRACT|CLOSE SEASON/i;
  const cases: { path: string; title: RegExp }[] = [
    { path: '/mods', title: /Mods & House Rules/i },
    { path: '/import-export', title: /Import \/ Export/i },
    { path: '/admin', title: /Administration/i },
    // The Hall of Fights page renders under its "Chronicle" header.
    { path: '/lore/hall-of-fights', title: /Chronicle/i },
  ];

  for (const { path, title } of cases) {
    // On slow/mobile runtimes the popstate-driven navigation can race the
    // app-shell settle — retry navigation until the target page renders.
    await expect(async () => {
      await gotoInApp(page, path);
      // PageHeader renders the title in an h1 — assert the heading role so
      // hidden duplicate labels (mobile-only chrome) don't satisfy the check.
      await expect(page.getByRole('heading', { name: title, level: 1 })).toBeVisible({
        timeout: 5_000,
      });
    }).toPass({ timeout: 30_000 });
    await expect(page.locator('main').first()).toBeVisible({ timeout: 15_000 });
    // No primary CTA in the shared top bar on unmapped routes
    await expect(page.locator('header').getByRole('button', { name: ctaLabels })).toHaveCount(0);
  }
});
