import { test, expect, type Page } from '@playwright/test';
import { clickNavLink, startNewGame } from './helpers';

/**
 * Route-aware primary CTA (DESIGN_PAGE_SYSTEM_v1.0 §1):
 * the shared top-bar action swaps label + behavior per route; detail and
 * lore routes get none. This spec boots a real game and asserts the
 * rendered CTA contract on every mapped route.
 *
 * Note: direct page.goto() lands on the title screen — in-app routes are
 * reached by clicking nav links inside the shell.
 */

const CTA_PATTERN =
  /EXECUTE WEEK|BEGIN CYCLE|VIEW CARD|ADVANCE BRACKET|COMMIT REGIMEN|SIGN CONTRACT|CLOSE SEASON/;

async function expectCta(page: Page, name: RegExp) {
  const cta = page.getByRole('button', { name }).first();
  await expect(cta).toBeVisible({ timeout: 10_000 });
  return cta;
}

test('primary CTA swaps label and behavior per route', async ({
  page,
  isMobile,
}: {
  page: Page;
  isMobile: boolean;
}) => {
  test.setTimeout(isMobile ? 240_000 : 120_000);
  await startNewGame(page);
  await page.waitForSelector(isMobile ? 'button[aria-label="Open navigation menu"]' : 'nav', {
    timeout: 15_000,
  });

  const nav = (name: string, opts: { exact?: boolean } = { exact: true }) =>
    clickNavLink(page, isMobile, name, opts);

  // ── advance-intent routes (stable hub) ─────────────────────────────────
  await nav('Stable', { exact: false });
  await page.waitForTimeout(500);

  await nav('Overview');
  await expectCta(page, /EXECUTE WEEK 1/);

  await nav('Bouts');
  await expectCta(page, /BEGIN CYCLE/);

  await nav('Training');
  await expectCta(page, /COMMIT REGIMEN/);

  await nav('Planner');
  await expectCta(page, /COMMIT REGIMEN/);

  await nav('Offseason');
  await expectCta(page, /CLOSE SEASON/);

  // ── page-intent routes ──────────────────────────────────────────────────
  await nav('Arena');
  await expectCta(page, /VIEW CARD/);

  // Recruit: SIGN CONTRACT stays disabled until a recruit is selected.
  await nav('Recruit');
  const signCta = await expectCta(page, /SIGN CONTRACT/);
  await expect(signCta).toBeDisabled();

  // Select the first recruit card — the shared CTA becomes enabled.
  // Cards are the clickable surfaces containing a warrior-name <h3>.
  const firstCard = page.locator('main div.cursor-pointer:has(h3)').first();
  if (await firstCard.isVisible({ timeout: 5_000 }).catch(() => false)) {
    await firstCard.click();
    await expect(signCta).toBeEnabled();
  }

  // ── world hub ───────────────────────────────────────────────────────────
  await nav('World', { exact: false });
  await page.waitForTimeout(500);

  // Tournaments: ADVANCE BRACKET is disabled while no live bracket exists
  // (a fresh week-1 game has no tournament in progress).
  await nav('Tournaments');
  const bracketCta = await expectCta(page, /ADVANCE BRACKET/);
  await expect(bracketCta).toBeDisabled();

  // Scouting's SIGN CONTRACT routes to the contract market — rival warriors
  // are not signable (poaching is AI-side), so this is an honest redirect.
  await nav('Scouting');
  const scoutCta = await expectCta(page, /SIGN CONTRACT/);
  await scoutCta.click();
  await page.waitForURL('**/stable/recruit', { timeout: 10_000 });
  await expectCta(page, /SIGN CONTRACT/);

  // ── detail route: no primary CTA ────────────────────────────────────────
  // Roster → click the first warrior link → warrior detail page.
  await nav('Stable', { exact: false });
  await page.waitForTimeout(500);
  await nav('Roster');
  const warriorLink = page.locator('main a[href^="/warrior/"]').first();
  if (await warriorLink.isVisible({ timeout: 5_000 }).catch(() => false)) {
    await warriorLink.click();
    await page.waitForURL('**/warrior/**', { timeout: 10_000 });
    await expect(page.getByRole('button', { name: CTA_PATTERN })).toHaveCount(0);
  }
});
