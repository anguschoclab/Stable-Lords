import { test, expect } from '@playwright/test';
import { startNewGame, gotoInApp } from './helpers';

test('debug import round trip', async ({ page }) => {
  test.setTimeout(120_000);
  page.on('console', (m) => m.type() === 'error' && console.log('[console]', m.text().slice(0, 300)));
  page.on('pageerror', (e) => console.log('[pageerror]', String(e).slice(0, 500)));

  await startNewGame(page);

  const offers = await page.evaluate(async () => {
    const storeModulePath = '/src/state/useGameStore.ts';
    const mod = (await import(/* @vite-ignore */ storeModulePath)) as {
      useGameStore: { getState: () => { boutOffers: Record<string, unknown> } };
    };
    return mod.useGameStore.getState().boutOffers;
  });
  console.log('[offers]', JSON.stringify(offers).slice(0, 2000));

  await gotoInApp(page, '/import-export');

  const downloadPromise = page.waitForEvent('download', { timeout: 10_000 });
  await page.getByRole('button', { name: 'Export JSON' }).click();
  const packPath = await (await downloadPromise).path();
  console.log('[pack]', packPath);

  await page.locator('input[aria-label="Choose save pack file"]').setInputFiles(packPath!);
  await page.waitForTimeout(3_000);

  const toasts = await page.locator('[data-sonner-toast]').allTextContents();
  console.log('[toasts]', JSON.stringify(toasts).slice(0, 2000));
});
