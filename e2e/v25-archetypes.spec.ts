import { test, expect } from '@playwright/test';
import { startNewGame, gotoInApp } from './helpers';

/**
 * V25 archetype-surface smoke — the deferred e2e item from MEGAPLAN_V25:
 * the WinningTypesSection codex entry and the StyleCard archetype chips
 * render real taxonomy content (not just compile-level component specs).
 */

test('codex teaches the winning-archetype taxonomy', async ({ page, isMobile }) => {
  test.setTimeout(isMobile ? 240_000 : 120_000);
  await startNewGame(page);
  await gotoInApp(page, '/help');

  // Accordion trigger exists and opens the section.
  const trigger = page.getByText('Winning Warrior Types', { exact: true });
  await expect(trigger).toBeVisible({ timeout: 15_000 });
  await trigger.click();

  // The six archetype labels are real data (warriorArchetypes.ts labels).
  for (const label of [
    'Pure Offensive',
    'Pure Defensive',
    'Tank Hybrid',
    'Low-Will Tank',
    'High-Skill Hybrid',
    'Riposting Hybrid',
  ]) {
    await expect(page.getByText(label, { exact: false }).first()).toBeVisible();
  }
});

test('style archives cards show archetype-fit chips', async ({ page, isMobile }) => {
  test.setTimeout(isMobile ? 240_000 : 120_000);
  await startNewGame(page);
  await gotoInApp(page, '/world/style-archives');

  // Every style card carries a "Winning Fits" chip cluster — assert the
  // surface heading and at least two distinct archetype labels rendered.
  await expect(page.getByText('Winning Fits').first()).toBeVisible({ timeout: 15_000 });
  const labels = ['Pure Offensive', 'Pure Defensive', 'Tank Hybrid', 'Riposting Hybrid'];
  let visible = 0;
  for (const label of labels) {
    if (await page.getByText(label, { exact: true }).first().isVisible().catch(() => false)) {
      visible++;
    }
  }
  expect(visible, 'expected ≥2 distinct archetype chips on the archives grid').toBeGreaterThanOrEqual(2);
});
