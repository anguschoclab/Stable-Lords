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
    const link = page.getByRole('dialog').getByRole('link', { name, exact: opts.exact }).first();
    await link.focus();
    await link.press('Enter');
  } else {
    const link = page.locator('nav').getByRole('link', { name, exact: opts.exact }).first();
    await link.focus();
    await link.press('Enter');
  }
}

/**
 * Clicks a nav link and verifies the client-side route changed. Parallel test
 * workers can occasionally race a TanStack navigation click during route
 * loading, so retry the click until the expected pathname is observed.
 */
interface TsrWindow {
  __TSR_ROUTER__?: {
    navigate: (opts: { to: string }) => Promise<void>;
    state?: { status?: string };
  };
}

/** Waits until the router reports the target route committed and idle. */
async function waitForSettledRoute(page: Page, path: string, timeout = 10_000) {
  await page.waitForFunction(
    (p) =>
      window.location.pathname === p &&
      (window as TsrWindow).__TSR_ROUTER__?.state?.status === 'idle',
    path,
    { timeout }
  );
  // Route state can settle one render before the nav subtree swaps hubs.
  await page.evaluate(
    () => new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve())))
  );
}

/** Activates a nav link and waits for the target route to commit. */
export async function navigateNavLink(
  page: Page,
  isMobile: boolean,
  name: string,
  url: string,
  opts: { exact?: boolean } = { exact: true }
) {
  const deadline = Date.now() + 10_000;

  while (Date.now() < deadline) {
    try {
      await waitForSettledRoute(page, url, 250);
      return;
    } catch {
      await clickNavLink(page, isMobile, name, opts);
      try {
        await waitForSettledRoute(page, url, 1_500);
        return;
      } catch {
        // Retry while the shared deadline remains; produce the standard error below.
      }
    }
  }
  await waitForSettledRoute(page, url);
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
 * lands back on the title screen, so use the mounted TanStack router handle
 * instead of synthesizing a popstate event.
 */
export async function gotoInApp(page: Page, path: string) {
  const deadline = Date.now() + 10_000;

  while (Date.now() < deadline) {
    await page.evaluate(async (p) => {
      const router = (window as TsrWindow).__TSR_ROUTER__;
      if (!router) throw new Error('TanStack router is not mounted');
      try {
        await router.navigate({ to: p });
      } catch (error) {
        if (window.location.pathname !== p) throw error;
      }
    }, path);
    try {
      await waitForSettledRoute(page, path, 1_500);
      return;
    } catch {
      // Retry while the shared deadline remains; produce the standard error below.
    }
  }
  await waitForSettledRoute(page, path);
}
