import { test, expect, type Page } from '@playwright/test';

const BASE_URL = 'http://localhost:8082';

/**
 * Golden path E2E test:
 * 1. Start a new game (title → new game form → orphanage FTUE)
 * 2. Click through every side-panel menu item in Stable + World hubs
 * 3. Enter a warrior into a fight on the Arena Hub
 * 4. Advance a week and dismiss the resolution modal
 */

test('golden path: new game → navigate all pages → fight → advance week', async ({
  page,
}: {
  page: Page;
}) => {
  test.setTimeout(120_000);

  // ── 1. Title Screen → New Game ──────────────────────────────────────────
  await page.goto(BASE_URL + '/');
  // Wait for the title screen to render
  await page.waitForSelector('text=NEW GAME', { timeout: 15_000 });
  await page.getByRole('button', { name: /NEW GAME/ }).click();

  // ── 2. New Game Form ────────────────────────────────────────────────────
  await page.waitForSelector('#owner-name', { timeout: 10_000 });
  await page.fill('#owner-name', 'Test Owner');
  await page.fill('#stable-name', 'Test Stable');

  // Pick the first backstory option
  // BackstoryPicker buttons are <button> elements inside a grid
  const backstoryOption = page.locator('button[type="button"]').filter({ hasText: /Former|Mercenary|Noble|Gladiator|Scholar|Thief|Priest|Merchant|Soldier|Hunter|Sailor|Blacksmith|Innkeeper|Farmer|Healer|Beggar/ }).first();
  await backstoryOption.click();

  // Click "ENTER THE ORPHANAGE"
  await page.getByRole('button', { name: /ENTER THE ORPHANAGE/ }).click();

  // ── 3. Orphanage FTUE ───────────────────────────────────────────────────
  // The Orphanage may start at step 1 (Warrior Selection) since we already
  // set owner/stable name in the New Game form.
  // Wait for warrior selection cards to appear
  await page.waitForSelector('text=To the Arena', { timeout: 15_000 });

  // Select 3 warrior cards (they are div.cursor-pointer elements)
  const warriorCards = page.locator('div.cursor-pointer');
  await warriorCards.nth(0).click();
  await warriorCards.nth(1).click();
  await warriorCards.nth(2).click();

  // Click "To the Arena"
  await page.getByRole('button', { name: /To the Arena/ }).click();

  // Step 2: First Blood — click "Continue"
  await page.waitForSelector('text=Continue', { timeout: 15_000 });
  await page.getByRole('button', { name: /Continue/ }).click();

  // Step 3: Story Begins — click "Enter the Arena Hub"
  await page.waitForSelector('text=Enter the Arena Hub', { timeout: 15_000 });
  await page.getByRole('button', { name: /Enter the Arena Hub/ }).click();

  // ── 4. Main App — Navigate Side Panel Menu Items ────────────────────────
  // Wait for the app shell to load (left nav visible on desktop)
  await page.waitForSelector('nav', { timeout: 15_000 });

  // Record initial week from the header
  const weekText = await page.locator('text=/Week \\d+/').first().textContent();
  const initialWeek = parseInt(weekText?.match(/Week (\d+)/)?.[1] ?? '1', 10);

  // --- Stable Hub pages ---
  const stablePages = [
    'Overview',
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
  ];

  for (const label of stablePages) {
    await page.getByRole('link', { name: label, exact: true }).click();
    // Wait for page transition animation + content
    await page.waitForTimeout(800);
    // Verify no crash — check that main content area still exists
    await expect(page.locator('main').first()).toBeVisible();
  }

  // --- Switch to World hub ---
  await page.getByRole('link', { name: 'World', exact: true }).first().click();
  await page.waitForTimeout(500);

  const worldPages = [
    'Rankings',
    'Arenas',
    'Tournaments',
    'Scouting',
    'Chronicle',
    'Hall of Fame',
    'Graveyard',
  ];

  for (const label of worldPages) {
    await page.getByRole('link', { name: label, exact: true }).click();
    await page.waitForTimeout(800);
    await expect(page.locator('main').first()).toBeVisible();
  }

  // --- Switch to Bookmarks hub ---
  await page.getByRole('link', { name: 'Bookmarks', exact: true }).first().click();
  await page.waitForTimeout(500);
  await expect(page.locator('main').first()).toBeVisible();

  // ── 5. Arena Hub → Execute Week (Fight) ─────────────────────────────────
  // Navigate to Arena
  await page.getByRole('link', { name: 'Stable', exact: true }).first().click();
  await page.waitForTimeout(500);
  await page.getByRole('link', { name: 'Arena', exact: true }).click();
  await page.waitForTimeout(1000);

  // Click "EXECUTE WEEK" button to open the combat panel
  const executeWeekBtn = page.getByRole('button', { name: /EXECUTE WEEK|EXECUTE DAY/ });
  await executeWeekBtn.click();
  await page.waitForTimeout(1000);

  // Click "EXECUTE CYLCE" (note: typo in source code) to run bouts
  const executeCycleBtn = page.getByRole('button', { name: /EXECUTE CYLCE|EXECUTE CYCLE/ });
  await executeCycleBtn.click();

  // Wait for the week advancement to complete (resolution modal appears)
  // The ResolutionReveal modal has "Cycle Resolution" as its title
  await page.waitForSelector('text=Cycle Resolution', { timeout: 30_000 });

  // ── 6. Dismiss Resolution Modal ─────────────────────────────────────────
  // Click through all resolution steps: gazette → injuries → bouts → math → (memorial) → close
  // The button text changes: "Next Report", "Acknowledge & Begin Planning", or "Honor the Fallen"
  for (let i = 0; i < 6; i++) {
    const nextBtn = page.getByRole('button', { name: /Next Report|Acknowledge & Begin Planning|Honor the Fallen/ });
    const count = await nextBtn.count();
    if (count === 0) break;
    await nextBtn.click();
    await page.waitForTimeout(500);
  }

  // ── 7. Verify Week Advanced ─────────────────────────────────────────────
  await page.waitForTimeout(1000);
  const newWeekText = await page.locator('text=/Week \\d+/').first().textContent();
  const newWeek = parseInt(newWeekText?.match(/Week (\d+)/)?.[1] ?? '1', 10);
  expect(newWeek).toBeGreaterThan(initialWeek);

  // Take a final screenshot for verification
  await page.screenshot({ path: 'e2e/screenshots/golden-path-final.png', fullPage: false });
});
