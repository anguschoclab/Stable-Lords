import { test, expect, type Page } from '@playwright/test';
import { clickNavLink, startNewGame, gotoInApp } from './helpers';

/**
 * V13 changed-surface coverage — browser-level checks for the components
 * extracted/factored during the SRP+DRY campaign:
 *   · SelectableCard / selectionRowClasses (scouting pickers)
 *   · IconTabStrip (stable detail dossier tabs)
 *   · TooltipBadge (roster liability + potential chips)
 *   · readFileInput (import/export save-pack round trip)
 */

/** Reads the first rival stable id out of the live store. */
const firstRivalId = (page: Page): Promise<string> =>
  page.evaluate(async () => {
    // Non-literal specifier: resolved at runtime by vite dev, invisible to tsc.
    const storeModulePath = '/src/state/useGameStore.ts';
    const mod = (await import(/* @vite-ignore */ storeModulePath)) as {
      useGameStore: {
        getState: () => { rivals: { owner: { id: string } }[] };
      };
    };
    return mod.useGameStore.getState().rivals[0]?.owner.id ?? '';
  });

test('selectable rows + icon tab strip', async ({ page, isMobile }) => {
  test.setTimeout(isMobile ? 240_000 : 120_000);

  await startNewGame(page);

  // ── SelectableCard rows on the scouting page ────────────────────────────
  await page.waitForSelector(isMobile ? 'button[aria-label="Open navigation menu"]' : 'nav', {
    timeout: 15_000,
  });
  await clickNavLink(page, isMobile, 'World', { exact: false });
  await clickNavLink(page, isMobile, 'Scouting');

  const stableCard = page.getByRole('button', { name: /^Select rival stable / }).first();
  await expect(stableCard).toBeVisible({ timeout: 15_000 });

  // Selected treatment: SelectableCard raises the row (z-0 → z-10) and paints
  // the primary border + bottom accent bar.
  await stableCard.click();
  await expect(stableCard).toHaveClass(/z-10/);

  // Selecting a rival surfaces its warrior list — warrior cards share the shell.
  const warriorCard = page.getByRole('button', { name: /^Select rival warrior / }).first();
  await expect(warriorCard).toBeVisible({ timeout: 10_000 });
  await warriorCard.click();
  await expect(warriorCard).toHaveClass(/z-10/);

  // ── IconTabStrip on the stable-detail dossier ───────────────────────────
  const rivalId = await firstRivalId(page);
  expect(rivalId).not.toBe('');
  await gotoInApp(page, `/world/stable/${rivalId}`);

  const rosterTab = page.getByRole('button', { name: 'Roster', exact: true }).last();
  const logsTab = page.getByRole('button', { name: 'Logs', exact: true }).last();
  await expect(rosterTab).toBeVisible({ timeout: 10_000 });

  // Active tab carries the glowing bottom bar (bg-primary) — it moves on click.
  const overviewTab = page.getByRole('button', { name: 'Overview', exact: true }).last();
  await expect(overviewTab.locator('.bg-primary')).toHaveCount(1);
  await logsTab.click();
  await expect(logsTab.locator('.bg-primary')).toHaveCount(1);
  await rosterTab.click();
  await expect(rosterTab.locator('.bg-primary')).toHaveCount(1);
});

test('tooltip badges + save-pack import round trip', async ({ page, isMobile }) => {
  test.setTimeout(isMobile ? 240_000 : 120_000);

  await startNewGame(page);

  // ── TooltipBadge chips on the roster ────────────────────────────────────
  // Fresh orphanage warriors carry neither flaws nor potential, so seed the
  // first roster slot through the store (same store-import pattern as the
  // golden-path week probe).
  await page.evaluate(async () => {
    const storeModulePath = '/src/state/useGameStore.ts';
    const mod = (await import(/* @vite-ignore */ storeModulePath)) as {
      useGameStore: {
        getState: () => {
          roster: Record<string, unknown>[];
          setRoster: (roster: Record<string, unknown>[]) => void;
        };
      };
    };
    const { roster, setRoster } = mod.useGameStore.getState();
    const [first, ...rest] = roster;
    setRoster([
      {
        ...first,
        traits: ['fragile'],
        potential: { ST: 15, CN: 15, SZ: 15, WT: 15, WL: 15, SP: 15, DF: 15 },
      },
      ...rest,
    ]);
  });

  await page.waitForSelector(isMobile ? 'button[aria-label="Open navigation menu"]' : 'nav', {
    timeout: 15_000,
  });
  await clickNavLink(page, isMobile, 'Roster');

  // PotentialBadge renders the POT grade chip; LiabilityBadge renders a
  // 'Watch'/'Consider releasing' chip once the warrior carries a flaw.
  const potBadge = page.getByText('POT').first();
  await expect(potBadge).toBeVisible({ timeout: 10_000 });
  const liabilityBadge = page.getByText(/Consider releasing|Watch/).first();
  await expect(liabilityBadge).toBeVisible();

  // TooltipBadge opens its tooltip on hover (provider delayDuration = 400ms).
  await potBadge.hover();
  await expect(page.getByRole('tooltip')).toBeVisible({ timeout: 5_000 });
  await expect(page.getByRole('tooltip')).toContainText('Potential grade');
  // Move away so the tooltip dismisses before the next interaction.
  await page.getByRole('main').first().hover();

  // ── readFileInput: export → import round trip ───────────────────────────
  await gotoInApp(page, '/import-export');

  const downloadPromise = page.waitForEvent('download', { timeout: 10_000 });
  await page.getByRole('button', { name: 'Export JSON' }).click();
  const download = await downloadPromise;
  const packPath = await download.path();
  expect(packPath).toBeTruthy();
  await expect(page.getByText(/Exported save pack/)).toBeVisible({ timeout: 5_000 });

  // Feed the exported pack straight back through the hidden file input.
  await page.locator('input[aria-label="Choose save pack file"]').setInputFiles(packPath!);
  await expect(page.getByText(/Save pack imported — week/)).toBeVisible({ timeout: 10_000 });
});
