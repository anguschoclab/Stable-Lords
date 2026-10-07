import { expect, type Page } from '@playwright/test';

const BASE_URL = 'http://localhost:8080';

/**
 * Clicks a side-panel nav link. On mobile viewports the side nav is hidden;
 * links live inside the hamburger sheet (role=dialog) which auto-closes
 * after each navigation. Hub links embed alert badges, so their accessible
 * names carry a suffix like "Stable 3 alerts for Stable" — match loosely.
 */
export async function clickNavLink(
  page: Page,
  isMobile: boolean,
  name: string,
  opts: { exact?: boolean } = { exact: true }
) {
  if (isMobile) {
    await page.getByRole('button', { name: 'Open navigation menu' }).click();
    await page.getByRole('dialog').getByRole('link', { name, exact: opts.exact }).first().click();
  } else {
    await page.locator('nav').getByRole('link', { name, exact: opts.exact }).first().click();
  }
}

/**
 * Drives the full new-game bootstrap: title → new game form → orphanage
 * FTUE → lands on the main app shell (arena hub), ready for navigation.
 */
export async function startNewGame(page: Page, names: { owner?: string; stable?: string } = {}) {
  // ── Title Screen → New Game ─────────────────────────────────────────────
  await page.goto(BASE_URL + '/');
  // Wait for the title screen to render
  await page.waitForSelector('text=NEW GAME', { timeout: 15_000 });
  await page.getByRole('button', { name: /NEW GAME/ }).click();

  // ── New Game Form ───────────────────────────────────────────────────────
  await page.waitForSelector('#owner-name', { timeout: 10_000 });
  await page.fill('#owner-name', names.owner ?? 'Test Owner');
  await page.fill('#stable-name', names.stable ?? 'Test Stable');

  // Pick the first backstory option — BackstoryPicker buttons are
  // <button> elements inside a grid.
  const backstoryOption = page
    .locator('button[type="button"]')
    .filter({
      hasText:
        /Former|Mercenary|Noble|Gladiator|Scholar|Thief|Priest|Merchant|Soldier|Hunter|Sailor|Blacksmith|Innkeeper|Farmer|Healer|Beggar/,
    })
    .first();
  await backstoryOption.click();

  // Click "ENTER THE ORPHANAGE"
  await page.getByRole('button', { name: /ENTER THE ORPHANAGE/ }).click();

  // ── Orphanage FTUE ──────────────────────────────────────────────────────
  // The Orphanage may start at step 1 (Warrior Selection) since we already
  // set owner/stable name in the New Game form.
  await page.waitForSelector('text=To the Arena', { timeout: 15_000 });

  // Select 3 warrior cards (they are div.cursor-pointer elements)
  const warriorCards = page.locator('div.cursor-pointer');
  await warriorCards.nth(0).click();
  await warriorCards.nth(1).click();
  await warriorCards.nth(2).click();

  // Click "To the Arena"
  await page.getByRole('button', { name: /To the Arena/ }).click();

  // Step 2: Set the Plan — click "To the Arena" again.
  // Wait for the exiting step-1 subtree to unmount — its button shares the
  // same label, and clicking it is a no-op (slow browsers race this).
  // Even after the count settles, Firefox/WebKit can still be mid-transition
  // with pointer-events disabled — retry the click until the step advances.
  await page.waitForSelector('text=Set the Plan', { timeout: 15_000 });
  const toArena = page.getByRole('button', { name: /To the Arena/ });
  await expect(toArena).toHaveCount(1);
  await expect(async () => {
    if (await toArena.count()) await toArena.click();
    await page.waitForSelector('text=Continue', { timeout: 3_000 });
  }).toPass({ timeout: 20_000 });

  // Step 2: First Blood — click "Continue"
  await page.waitForSelector('text=Continue', { timeout: 15_000 });
  await page.getByRole('button', { name: /Continue/ }).click();

  // Step 3: Story Begins — click "Enter the Arena Hub"
  await page.waitForSelector('text=Enter the Arena Hub', { timeout: 15_000 });
  await page.getByRole('button', { name: /Enter the Arena Hub/ }).click();
}

/**
 * Client-side navigation to an in-app route that has no nav link
 * (/mods, /import-export, /admin, …). A full `page.goto` reloads the SPA and
 * lands back on the title screen, so instead we pushState + dispatch
 * popstate, which TanStack Router's history listener picks up.
 */
export async function gotoInApp(page: Page, path: string) {
  await page.evaluate((p) => {
    window.history.pushState({}, '', p);
    window.dispatchEvent(new PopStateEvent('popstate'));
  }, path);
}
