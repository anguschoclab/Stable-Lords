import { test, expect, type Page } from '@playwright/test';

const BASE_URL = 'http://localhost:8080';

/**
 * Seasonal Tournament E2E test:
 * 1. Start a new game (title → new game form → orphanage FTUE)
 * 2. Advance weeks until the seasonal tournament week (week 13 — every 13th week)
 * 3. Open the Tournaments page, go through the prep dialog, and complete the
 *    active seasonal tournament (EXECUTE NEXT BOUT + ADVANCE DAY ticks)
 * 4. Verify a supreme champion is crowned and the tournament lands in the
 *    Campaign Archives
 * 5. Advance past the tournament week and confirm the next week rolls over
 */

/**
 * Buttons that dismiss the various full-screen overlays that can appear.
 * Ordered topmost-first: DeathModal / WinScreen render at z-100 above the
 * Cycle Resolution overlay (z-50), so they must be dismissed first —
 * Playwright would otherwise stall waiting for click actionability on a
 * covered button.
 */
const DISMISS_PATTERNS = [
  /MEMORIALIZE & CONTINUE/,
  /Continue Legacy/,
  /Next Report/,
  /Acknowledge & Begin Planning/,
  /Honor the Fallen/,
];

/**
 * Probes for the real blocking overlays — all three render as fixed
 * full-screen containers (`div.fixed.inset-0`). Scoped to the container so
 * incidental in-page text (e.g. the "Realm Champion" achievement label on
 * the stable overview) can't masquerade as a modal.
 */
const OVERLAY_PROBES = [
  'div.fixed.inset-0:has-text("Cycle Resolution")',
  'div.fixed.inset-0:has-text("THE SANDS CLAIM ANOTHER")',
  'div.fixed.inset-0:has-text("Realm Champion")',
];

async function dismissBlockingOverlays(page: Page, maxPasses = 12) {
  for (let i = 0; i < maxPasses; i++) {
    // Fast exit when no overlay is up at all.
    const overlayPresent = await Promise.any(
      OVERLAY_PROBES.map((p) =>
        page
          .locator(p)
          .first()
          .isVisible({ timeout: 250 })
          .then((v) => (v ? true : Promise.reject(new Error('absent'))))
      )
    ).catch(() => false);
    if (!overlayPresent) return;

    let dismissed = false;
    for (const pattern of DISMISS_PATTERNS) {
      const btn = page.getByRole('button', { name: pattern });
      try {
        // Short timeouts: a covered button fails fast instead of stalling
        // the full actionability window.
        await btn.first().click({ timeout: 1_500 });
        await page.waitForTimeout(250);
        dismissed = true;
        break;
      } catch {
        /* not present or covered by a higher overlay */
      }
    }
    if (!dismissed) {
      // Diagnostic: report which overlay is up and what it contains so stalls
      // are debuggable rather than silent.
      for (const probe of OVERLAY_PROBES) {
        const el = page.locator(probe).first();
        if (await el.isVisible({ timeout: 100 }).catch(() => false)) {
          const text = await el
            .evaluate((n) => (n as HTMLElement).innerText)
            .catch(() => '(unreadable)');
          console.log(`[e2e] undismissed overlay probe=${probe}:\n${text?.slice(0, 400)}`);
          break;
        }
      }
      await page.waitForTimeout(300);
    }
  }
}

const ADVANCE_RE = /ADVANCE (WEEK|DAY) \d+/;

async function advanceLabel(page: Page): Promise<string> {
  const btn = page.getByRole('button', { name: ADVANCE_RE });
  return (await btn.getAttribute('aria-label')) ?? '';
}

/**
 * Reads the advance-button label after clearing any blocking overlays.
 * Returns 'busy' while the engine is resolving (label becomes
 * "Resolving Bouts…") or the button isn't in an advance state.
 */
async function settledAdvanceLabel(page: Page): Promise<string> {
  await dismissBlockingOverlays(page, 4);
  const label = await advanceLabel(page);
  return ADVANCE_RE.test(label) ? label : 'busy';
}

/**
 * Like settledAdvanceLabel, but reports 'busy' until the label has moved
 * off `prev` — i.e. the week/day actually rolled over. Without this, the
 * transient "Resolving Bouts…" state would read as progress.
 */
async function progressedLabel(page: Page, prev: string): Promise<string> {
  const label = await settledAdvanceLabel(page);
  return label === 'busy' || label === prev ? 'busy' : label;
}

/**
 * Clicks the advance button, retrying through covering modals and the
 * in-flight "Resolving Bouts…" state instead of stalling on actionability.
 */
async function clickAdvance(page: Page): Promise<void> {
  const btn = page.getByRole('button', { name: ADVANCE_RE });
  for (let attempt = 0; attempt < 8; attempt++) {
    await dismissBlockingOverlays(page, 4);
    try {
      await btn.click({ timeout: 5_000 });
      return;
    } catch {
      /* covered by a modal or disabled while resolving — retry */
    }
  }
  await btn.click({ timeout: 30_000 });
}

interface WarriorSnap {
  id: string;
  stableId?: string;
  medals?: { gold?: number; silver?: number; bronze?: number };
  discoveredWeapon?: boolean;
  discoveredRhythm?: boolean;
  att?: number;
  attrSum?: number;
}

interface StateSnap {
  treasury: number;
  playerId?: string;
  ledgerPrizeCount: number;
  warriors: Record<string, WarriorSnap>;
  rivals: Record<string, { treasury: number; fame: number }>;
  tournaments: {
    id: string;
    name?: string;
    tierId?: string;
    completed: boolean;
    champion?: string;
    bracket?: {
      round: number;
      matchIndex: number;
      warriorIdA: string;
      warriorIdD: string;
      winner?: 'A' | 'D' | null;
    }[];
  }[];
}

/**
 * Minimal shape of a store warrior, as read inside the page. Kept local so
 * the e2e project stays decoupled from src's `@/` alias type graph.
 */
interface RawWarrior {
  id: string;
  stableId?: string;
  career?: { medals?: { gold?: number; silver?: number; bronze?: number } };
  favorites?: { discovered?: { weapon?: boolean; rhythm?: boolean } };
  baseSkills?: { ATT?: number };
  attributes?: Record<string, number>;
}

/**
 * Minimal shape of a store tournament bout, as read inside the page.
 */
interface RawTournamentBout {
  round: number;
  matchIndex: number;
  warriorIdA: string;
  warriorIdD: string;
  winner?: 'A' | 'D' | null;
}

/**
 * Minimal shape of the live zustand game state read inside the page — only
 * the fields snapshotState touches.
 */
interface RawGameState {
  treasury: number;
  player?: { id: string };
  ledger?: { category: string }[];
  roster?: RawWarrior[];
  rivals?: { id: string; treasury: number; fame: number; roster?: RawWarrior[] }[];
  tournaments?: {
    id: string;
    name?: string;
    tierId?: string;
    completed: boolean;
    champion?: string;
    bracket?: RawTournamentBout[];
  }[];
}

/**
 * Reads the live zustand game store inside the page. The vite dev server
 * returns the already-instantiated module, so `useGameStore.getState()`
 * reflects the real game state.
 */
async function snapshotState(page: Page): Promise<StateSnap> {
  return page.evaluate(async () => {
    // Non-literal specifier: resolved at runtime by vite dev (returns the
    // live module instance), invisible to tsc which only checks e2e types.
    const storeModulePath = '/src/state/useGameStore.ts';
    const mod = (await import(/* @vite-ignore */ storeModulePath)) as {
      useGameStore: { getState: () => RawGameState };
    };
    const s = mod.useGameStore.getState();
    const snapWarrior = (w: RawWarrior) => [
      w.id,
      {
        id: w.id,
        stableId: w.stableId,
        medals: w.career?.medals,
        discoveredWeapon: w.favorites?.discovered?.weapon,
        discoveredRhythm: w.favorites?.discovered?.rhythm,
        att: w.baseSkills?.ATT,
        attrSum: Object.values(w.attributes ?? {}).reduce<number>(
          (a, b) => a + (typeof b === 'number' ? b : 0),
          0
        ),
      },
    ] as const;
    const warriors: Record<string, WarriorSnap> = {};
    for (const w of s.roster ?? []) warriors[w.id] = snapWarrior(w)[1];
    for (const r of s.rivals ?? []) {
      for (const w of r.roster ?? []) warriors[w.id] = snapWarrior(w)[1];
    }
    return {
      treasury: s.treasury,
      playerId: s.player?.id,
      ledgerPrizeCount: (s.ledger ?? []).filter((l) => l.category === 'prize').length,
      warriors,
      rivals: Object.fromEntries(
        (s.rivals ?? []).map((r) => [r.id, { treasury: r.treasury, fame: r.fame }])
      ),
      tournaments: (s.tournaments ?? []).map((t) => ({
        id: t.id,
        name: t.name,
        tierId: t.tierId,
        completed: t.completed,
        champion: t.champion,
        bracket: (t.bracket ?? []).map((b) => ({
          round: b.round,
          matchIndex: b.matchIndex,
          warriorIdA: b.warriorIdA,
          warriorIdD: b.warriorIdD,
          winner: b.winner,
        })),
      })),
    };
  });
}

test('seasonal tournament: play to tournament week and crown a champion', async ({
  page,
  isMobile,
}: {
  page: Page;
  isMobile: boolean;
}) => {
  // This is a long haul: ~12 week advancements plus tournament resolution.
  test.setTimeout(600_000);

  const clickNavLink = async (name: string, opts: { exact?: boolean } = { exact: true }) => {
    if (isMobile) {
      await page.getByRole('button', { name: 'Open navigation menu' }).click();
      await page
        .getByRole('dialog')
        .getByRole('link', { name, exact: opts.exact })
        .first()
        .click();
    } else {
      await page.locator('nav').getByRole('link', { name, exact: opts.exact }).first().click();
    }
  };

  // ── 1. Title Screen → New Game ──────────────────────────────────────────
  await page.goto(BASE_URL + '/');
  await page.waitForSelector('text=NEW GAME', { timeout: 15_000 });
  await page.getByRole('button', { name: /NEW GAME/ }).click();

  // ── 2. New Game Form ────────────────────────────────────────────────────
  await page.waitForSelector('#owner-name', { timeout: 10_000 });
  await page.fill('#owner-name', 'Tourney Owner');
  await page.fill('#stable-name', 'Tourney Stable');

  const backstoryOption = page
    .locator('button[type="button"]')
    .filter({
      hasText:
        /Former|Mercenary|Noble|Gladiator|Scholar|Thief|Priest|Merchant|Soldier|Hunter|Sailor|Blacksmith|Innkeeper|Farmer|Healer|Beggar/,
    })
    .first();
  await backstoryOption.click();

  await page.getByRole('button', { name: /ENTER THE ORPHANAGE/ }).click();

  // ── 3. Orphanage FTUE ───────────────────────────────────────────────────
  await page.waitForSelector('text=To the Arena', { timeout: 15_000 });
  const warriorCards = page.locator('div.cursor-pointer');
  await warriorCards.nth(0).click();
  await warriorCards.nth(1).click();
  await warriorCards.nth(2).click();
  await page.getByRole('button', { name: /To the Arena/ }).click();

  await page.waitForSelector('text=Set the Plan', { timeout: 15_000 });
  await expect(page.getByRole('button', { name: /To the Arena/ })).toHaveCount(1);
  await page.getByRole('button', { name: /To the Arena/ }).click();

  await page.waitForSelector('text=Continue', { timeout: 15_000 });
  await page.getByRole('button', { name: /Continue/ }).click();

  await page.waitForSelector('text=Enter the Arena Hub', { timeout: 15_000 });
  await page.getByRole('button', { name: /Enter the Arena Hub/ }).click();

  // ── 4. Advance weeks until tournament week (ADVANCE DAY label) ──────────
  await page.waitForSelector(isMobile ? 'button[aria-label="Open navigation menu"]' : 'nav', {
    timeout: 15_000,
  });
  await dismissBlockingOverlays(page);

  let enteredTournamentWeek = false;
  for (let i = 0; i < 20; i++) {
    // Wait until any in-flight resolution finishes and overlays are clear.
    await expect
      .poll(() => settledAdvanceLabel(page), { timeout: 120_000 })
      .not.toBe('busy');

    const label = await advanceLabel(page);
    if (/ADVANCE DAY/.test(label)) {
      enteredTournamentWeek = true;
      break;
    }

    await clickAdvance(page);

    // Confirm the week rolled over — the poll keeps dismissing resolution /
    // death overlays until the header shows the next week (or tournament day).
    await expect
      .poll(() => progressedLabel(page, label), { timeout: 120_000 })
      .not.toBe('busy');
  }

  expect(enteredTournamentWeek).toBe(true);

  // ── 5. Tournaments page — prep console + bracket ────────────────────────
  await clickNavLink('Tournaments');
  await page.waitForTimeout(1000);
  await expect(page.locator('main').first()).toBeVisible();

  // The prep dialog auto-opens when the bracket is untouched; fall back to
  // the manual opener if it didn't.
  const initiateBtn = page.getByRole('button', { name: /INITIATE SEASON CAMPAIGN/ });
  try {
    await initiateBtn.waitFor({ state: 'visible', timeout: 5_000 });
    await initiateBtn.click();
  } catch {
    const openPrep = page.getByRole('button', { name: /OPEN PREPARATION CONSOLE/ });
    if (await openPrep.isVisible().catch(() => false)) {
      await openPrep.click();
      await initiateBtn.waitFor({ state: 'visible', timeout: 5_000 });
      await initiateBtn.click();
    }
  }

  // The active manifest must be present with a live bracket.
  await expect(page.getByText('Tournament Active')).toBeVisible({ timeout: 10_000 });
  await expect(page.getByText('LIVE PHASE')).toBeVisible();

  const executeBoutBtn = page.getByRole('button', { name: /EXECUTE NEXT BOUT/ });
  await expect(executeBoutBtn).toBeVisible({ timeout: 10_000 });

  const completedMatchesText = page.getByText(/\d+ matches completed/);
  const readCompleted = async () => {
    const t = await completedMatchesText.first().textContent().catch(() => null);
    return parseInt(t?.match(/(\d+) matches completed/)?.[1] ?? '0', 10);
  };

  // ── 6. Resolve the tournament ───────────────────────────────────────────
  // Round 1 via the manifest button, remaining rounds via ADVANCE DAY ticks
  // (the natural tournament-week flow) — six rounds total for a 64-slot
  // bracket (R1 32 → R2 16 → R3 8 → QF 4 → SF 2 → Finals+3rd 2).
  const before = await readCompleted();
  await executeBoutBtn.click();
  await expect
    .poll(readCompleted, { timeout: 60_000, message: 'round 1 should resolve 32 bouts' })
    .toBeGreaterThan(before);

  // Identify the tournament we just started — once it completes the manifest
  // swaps to the next tier, so DOM counters can't be trusted afterwards.
  const targetId = (await snapshotState(page)).tournaments.find(
    (t) => !t.completed && (t.bracket ?? []).some((b) => b.winner)
  )?.id;
  expect(targetId, 'could not identify the in-progress tournament').toBeTruthy();

  const tourneyProgress = async () => {
    const t = (await snapshotState(page)).tournaments.find((x) => x.id === targetId);
    return {
      done: t?.completed ?? false,
      bouts: (t?.bracket ?? []).filter((b) => b.winner).length,
    };
  };

  let preFinalSnap: StateSnap | undefined;
  for (let day = 0; day < 6; day++) {
    await expect
      .poll(() => settledAdvanceLabel(page), { timeout: 120_000 })
      .not.toBe('busy');

    const prog = await tourneyProgress();
    if (prog.done) break;

    const label = await advanceLabel(page);
    if (!/ADVANCE DAY/.test(label)) break; // week rolled over unexpectedly

    // Snapshot before each day — the last iteration captures the pre-prizes
    // state right before the tournament completes.
    preFinalSnap = await snapshotState(page);
    await clickAdvance(page);

    // A day tick resolves the current round and pops the resolution overlay.
    await expect
      .poll(() => progressedLabel(page, label), { timeout: 120_000 })
      .not.toBe('busy');

    await expect
      .poll(
        async () => {
          const p = await tourneyProgress();
          return p.done ? prog.bouts + 1 : p.bouts;
        },
        { timeout: 30_000, message: 'tournament bracket should advance each day' }
      )
      .toBeGreaterThan(prog.bouts);
  }

  // ── 7. Champion crowned ─────────────────────────────────────────────────
  // The manifest may have already swapped to the next tier's tournament, so
  // verify through state + the archives rather than the live bracket view.
  await expect
    .poll(async () => (await tourneyProgress()).done, { timeout: 30_000 })
    .toBe(true);

  await clickNavLink('Tournaments');
  await page.waitForTimeout(800);
  await dismissBlockingOverlays(page);

  // The completed tourney lands in the Champion Archives with its champion.
  const completedSnap = await snapshotState(page);
  const justFinished = completedSnap.tournaments.find((t) => t.id === targetId);
  expect(justFinished?.completed).toBe(true);
  expect(justFinished?.champion).toBeTruthy();

  const championName = justFinished?.champion;
  await expect(page.getByText('Champion Archives').first()).toBeVisible({ timeout: 10_000 });
  await expect(page.getByText(/Wk 13/).first()).toBeVisible();
  if (championName) {
    await expect(page.getByText(championName).first()).toBeVisible();
  }

  // ── 8. Prize verification — incl. NPC/AI winners ────────────────────────
  const postSnap = await snapshotState(page);
  if (!preFinalSnap) throw new Error('pre-final snapshot missing');

  const completedTourney = postSnap.tournaments.find((t) => t.id === targetId);
  if (!completedTourney) throw new Error('tracked seasonal tournament missing');
  expect(completedTourney.completed, 'tracked tournament should be completed').toBe(true);
  expect(completedTourney.champion).toBeTruthy();

  const bracket = completedTourney.bracket ?? [];
  const maxRound = Math.max(...bracket.map((b) => b.round));
  const finals = bracket.find((b) => b.round === maxRound && b.matchIndex === 0);
  const bronzeMatch = bracket.find((b) => b.round === maxRound && b.matchIndex === 1);
  expect(finals?.winner, 'finals bout should have a winner').toBeTruthy();

  const winnerOf = (b?: { winner?: 'A' | 'D' | null; warriorIdA: string; warriorIdD: string }) =>
    b ? (b.winner === 'A' ? b.warriorIdA : b.warriorIdD) : undefined;
  const loserOf = (b?: { winner?: 'A' | 'D' | null; warriorIdA: string; warriorIdD: string }) =>
    b ? (b.winner === 'A' ? b.warriorIdD : b.warriorIdA) : undefined;

  const first = winnerOf(finals);
  const second = loserOf(finals);
  const third = bronzeMatch ? winnerOf(bronzeMatch) : undefined;

  const tierPurse = 5000; // Gold tier (activeTournamentId is always the first tier)
  const expectedPurses: [string | undefined, number, 'gold' | 'silver' | 'bronze'][] = [
    [first, tierPurse, 'gold'],
    [second, Math.floor(tierPurse * 0.5), 'silver'],
    [third, Math.floor(tierPurse * 0.25), 'bronze'],
  ];

  const fameByPlace = { 1: 100, 2: 50, 3: 25 } as const;
  const rivalExpected = new Map<string, { gold: number; fame: number }>();
  let playerExpectedGold = 0;

  for (const [placeIdx, [warriorId, purse, medal]] of expectedPurses.entries()) {
    if (!warriorId) continue;
    const pre = preFinalSnap.warriors[warriorId];
    const post = postSnap.warriors[warriorId];

    // Medal recorded on the warrior (skipped only if they died in the final).
    if (pre && post) {
      expect(
        (post.medals?.[medal] ?? 0) - (pre.medals?.[medal] ?? 0),
        `${medal} medal should be awarded to ${warriorId}`
      ).toBe(1);
    }

    const stableId = post?.stableId ?? pre?.stableId;
    const prizeFame = fameByPlace[(placeIdx + 1) as 1 | 2 | 3];
    if (stableId && stableId !== postSnap.playerId) {
      // NPC winner — accumulate: one stable can hold multiple podium spots.
      const acc = rivalExpected.get(stableId) ?? { gold: 0, fame: 0 };
      acc.gold += purse;
      acc.fame += prizeFame;
      rivalExpected.set(stableId, acc);
    } else if (stableId === postSnap.playerId) {
      playerExpectedGold += purse;
    }
  }

  for (const [stableId, acc] of rivalExpected) {
    const preRival = preFinalSnap.rivals[stableId];
    const postRival = postSnap.rivals[stableId];
    expect(
      postRival,
      `rival stable ${stableId} should still exist for prize payout`
    ).toBeDefined();
    expect(
      (postRival?.treasury ?? 0) - (preRival?.treasury ?? 0),
      `rival stable ${stableId} should receive ${acc.gold}g in purses`
    ).toBe(acc.gold);
    expect(
      (postRival?.fame ?? 0) - (preRival?.fame ?? 0),
      `rival stable ${stableId} should receive ${acc.fame} fame`
    ).toBe(acc.fame);
  }

  if (playerExpectedGold > 0) {
    // Player winner: treasury + ledger prize entries.
    expect(postSnap.treasury - preFinalSnap.treasury).toBeGreaterThanOrEqual(
      playerExpectedGold
    );
  }

  // If the player placed, ledger prize entries must exist.
  const playerPlaced = [first, second, third].some(
    (id) => id && postSnap.warriors[id]?.stableId === postSnap.playerId
  );
  if (playerPlaced) {
    expect(postSnap.ledgerPrizeCount).toBeGreaterThan(preFinalSnap.ledgerPrizeCount);
  }

  // NPC (rival-stable) prize money must actually land — token effects are
  // applied directly to rival warriors by the awards pass. At least one NPC
  // placer is expected in a 64-slot bracket of mostly rival warriors.
  expect(
    rivalExpected.size,
    'at least one podium finisher should be an NPC'
  ).toBeGreaterThan(0);

  // ── 8. Advance past the tournament week ─────────────────────────────────
  // Day advances still work after completion (no-op rounds) until rollover.
  let guard = 0;
  while (guard++ < 8) {
    await expect
      .poll(() => settledAdvanceLabel(page), { timeout: 120_000 })
      .not.toBe('busy');
    const label = await advanceLabel(page);
    if (/ADVANCE WEEK 14/.test(label)) break;
    if (!/ADVANCE DAY/.test(label)) break;
    await clickAdvance(page);
  }

  await expect
    .poll(() => settledAdvanceLabel(page), { timeout: 120_000 })
    .toMatch(/ADVANCE WEEK 14/);

  // Final screenshot for the report.
  await page.screenshot({ path: 'e2e/screenshots/seasonal-tournament-final.png', fullPage: false });
});
