import { test, expect, type Page } from '@playwright/test';

const BASE_URL = 'http://localhost:8080';

/**
 * Seasonal Tournament E2E — full game year soak:
 * 1. Start a new game (title → new game form → orphanage FTUE)
 * 2. Advance through all 52 weeks of year 1:
 *    - Each season's final week (13/26/39/52) is a tournament week — the
 *      active tier is played through the UI (prep dialog → EXECUTE NEXT BOUT
 *      → ADVANCE DAY ticks) to completion.
 *    - Every completed tournament is verified: champion crowned, archive
 *      entry, prize purse + fame + medals paid out to player/NPC stables.
 *    - Season boundaries (Spring→Summer→Fall→Winter→Spring) are asserted.
 * 3. The year boundary (week 52 → week 1, year 2) must roll over cleanly:
 *    day/week fields reset, tournament-week flags cleared, and no stale
 *    incomplete tournament may linger (leftover tiers auto-resolve at the
 *    tournament-week rollover).
 * 4. Year 2's spring tournament (week 13) must work end-to-end — same
 *    season+week as year 1's, so it proves tournament ids are unique across
 *    years rather than colliding on `t-{tier}-{season}-{week}`.
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
  week: number;
  year: number;
  day: number;
  season?: string;
  isTournamentWeek?: boolean;
  activeTournamentId?: string;
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
  week: number;
  year: number;
  day?: number;
  season?: string;
  isTournamentWeek?: boolean;
  activeTournamentId?: string;
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
      week: s.week,
      year: s.year,
      day: s.day ?? 0,
      season: s.season,
      isTournamentWeek: s.isTournamentWeek,
      activeTournamentId: s.activeTournamentId,
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

const TIER_PURSE: Record<string, number> = { GOLD: 5000, SILVER: 2500, BRONZE: 1200, IRON: 600 };
const FAME_BY_PLACE = { 1: 100, 2: 50, 3: 25 } as const;
type CompletedTourney = NonNullable<StateSnap['tournaments'][number]>;

/**
 * Asserts that a just-completed tournament paid out correctly:
 * medals on podium warriors, purse + fame on the owning stables (player or
 * NPC/AI rivals), and ledger entries for player winnings.
 */
function verifyPrizePayout(
  preFinalSnap: StateSnap,
  postSnap: StateSnap,
  tourney: CompletedTourney
) {
  const bracket = tourney.bracket ?? [];
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

  const tierPurse = TIER_PURSE[(tourney.tierId ?? '').toUpperCase()] ?? 600;
  const expectedPurses: [string | undefined, number, 'gold' | 'silver' | 'bronze'][] = [
    [first, tierPurse, 'gold'],
    [second, Math.floor(tierPurse * 0.5), 'silver'],
    [third, Math.floor(tierPurse * 0.25), 'bronze'],
  ];

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
    const prizeFame = FAME_BY_PLACE[(placeIdx + 1) as 1 | 2 | 3];
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
    expect(postSnap.treasury - preFinalSnap.treasury).toBeGreaterThanOrEqual(playerExpectedGold);
    expect(postSnap.ledgerPrizeCount).toBeGreaterThan(preFinalSnap.ledgerPrizeCount);
  }

  // NPC (rival-stable) prize money must actually land — token effects are
  // applied directly to rival warriors by the awards pass. At least one NPC
  // placer is expected in a 64-slot bracket of mostly rival warriors.
  expect(rivalExpected.size, 'at least one podium finisher should be an NPC').toBeGreaterThan(0);
}

test('seasonal tournaments: full game year + year-2 rollover tourney', async ({
  page,
  isMobile,
}: {
  page: Page;
  isMobile: boolean;
}) => {
  // A full year soak: 52 week advances + 4 tournament weeks.
  test.setTimeout(1_500_000);

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

  await page.waitForSelector(isMobile ? 'button[aria-label="Open navigation menu"]' : 'nav', {
    timeout: 15_000,
  });
  await dismissBlockingOverlays(page);

  // ── 4. Play one tournament week through the UI ──────────────────────────
  // Plays the active tier's tournament to completion: prep dialog →
  // EXECUTE NEXT BOUT (round 1) → ADVANCE DAY ticks (rounds 2-6). Verifies
  // champion + archive entry + prize payout, then returns control while the
  // week still has day advances remaining.
  const runTournamentWeek = async (weekSnap: StateSnap) => {
    const activeId = weekSnap.activeTournamentId;
    const tourneyWeek = weekSnap.week;
    const tourneySeason = weekSnap.season;
    if (!activeId) throw new Error('tournament week without activeTournamentId');

    await clickNavLink('Tournaments');
    await page.waitForTimeout(800);
    await dismissBlockingOverlays(page);

    // The prep dialog auto-opens when the bracket is untouched; fall back to
    // the manual opener if it didn't. Escape clears the dialog if it opened
    // for a leftover (already-generated but unplayed) tier.
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
      } else {
        await page.keyboard.press('Escape').catch(() => undefined);
      }
    }

    // The active manifest must be present with a live bracket.
    await expect(page.getByText('Tournament Active')).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText('LIVE PHASE')).toBeVisible();

    const executeBoutBtn = page.getByRole('button', { name: /EXECUTE NEXT BOUT/ });
    await expect(executeBoutBtn).toBeVisible({ timeout: 10_000 });
    await executeBoutBtn.click();

    const tourneyProgress = async () => {
      const t = (await snapshotState(page)).tournaments.find((x) => x.id === activeId);
      return {
        done: t?.completed ?? false,
        bouts: (t?.bracket ?? []).filter((b) => b.winner).length,
      };
    };

    // Round 1 resolves through the manifest button (32 bouts for a 64-slot bracket).
    await expect
      .poll(async () => (await tourneyProgress()).bouts, {
        timeout: 60_000,
        message: 'round 1 should resolve via EXECUTE NEXT BOUT',
      })
      .toBeGreaterThan(0);

    // Remaining rounds resolve via ADVANCE DAY — the natural tournament-week
    // flow. Each day must move the bracket forward or complete it.
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

    await expect
      .poll(async () => (await tourneyProgress()).done, { timeout: 60_000 })
      .toBe(true);

    // ── Champion + archives verification ──────────────────────────────────
    // The manifest may already show the next tier's tournament, so verify
    // through the archives + live state.
    await clickNavLink('Tournaments');
    await page.waitForTimeout(800);
    await dismissBlockingOverlays(page);
    // The prep dialog auto-opens for the leftover unplayed tier — dismiss it.
    await page.keyboard.press('Escape').catch(() => undefined);

    const postSnap = await snapshotState(page);
    const tourney = postSnap.tournaments.find((t) => t.id === activeId);
    if (!tourney) throw new Error('tracked seasonal tournament missing');
    expect(tourney.completed).toBe(true);
    expect(tourney.champion).toBeTruthy();

    await expect(page.getByText('Champion Archives').first()).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText(new RegExp(`Wk ${tourneyWeek}`)).first()).toBeVisible();
    if (tourney.champion) {
      await expect(page.getByText(tourney.champion).first()).toBeVisible();
    }

    if (!preFinalSnap) throw new Error('pre-final snapshot missing');
    verifyPrizePayout(preFinalSnap, postSnap, tourney);

    return { id: activeId, week: tourneyWeek, season: tourneySeason, year: weekSnap.year };
  };

  // ── 5. Year loop — every week of year 1 ─────────────────────────────────
  // Season boundaries sit on weeks 13/26/39/52; each of those is a
  // tournament week played to completion. The loop ends when the year rolls
  // over to Year 2 · Week 1.
  const EXPECTED_SEASON: Record<number, string> = {
    13: 'Spring',
    26: 'Summer',
    39: 'Fall',
    52: 'Winter',
  };
  const completedTourneys: { id: string; week: number; season?: string; year: number }[] = [];
  let yearTwoStartSnap: StateSnap | undefined;

  for (let guard = 0; guard < 160; guard++) {
    // Wait until any in-flight resolution finishes and overlays are clear.
    await expect
      .poll(() => settledAdvanceLabel(page), { timeout: 120_000 })
      .not.toBe('busy');

    const snap = await snapshotState(page);

    // Capture the state right after the year rollover — every year-1
    // tournament (played or leftover tier) must already be completed.
    if (snap.year === 2 && snap.week === 1 && !yearTwoStartSnap) {
      yearTwoStartSnap = snap;
    }

    // Done once year 2's spring tournament week has rolled over to week 14.
    if (snap.year === 2 && snap.week > 13) break;

    const active = snap.tournaments.find((t) => t.id === snap.activeTournamentId);
    if (snap.isTournamentWeek && active && !active.completed) {
      // Season at each tournament week must match the quarter boundary.
      expect(
        snap.season,
        `tournament week ${snap.week} should be ${EXPECTED_SEASON[snap.week]}`
      ).toBe(EXPECTED_SEASON[snap.week]);
      completedTourneys.push(await runTournamentWeek(snap));
      continue;
    }

    const label = await advanceLabel(page);
    await clickAdvance(page);

    // Confirm the tick rolled over — the poll keeps dismissing resolution /
    // death overlays until the header shows the next week (or tournament day).
    await expect
      .poll(() => progressedLabel(page, label), { timeout: 120_000 })
      .not.toBe('busy');
  }

  // ── 6. Year rollover assertions ─────────────────────────────────────────
  if (!yearTwoStartSnap) throw new Error('year-2 rollover snapshot missing');
  expect(yearTwoStartSnap.year, 'year should increment at the 52→1 boundary').toBe(2);
  expect(yearTwoStartSnap.week, 'week should wrap to 1').toBe(1);
  expect(yearTwoStartSnap.day, 'day should reset').toBe(0);
  expect(yearTwoStartSnap.isTournamentWeek, 'tournament-week flag should clear').toBe(false);
  expect(yearTwoStartSnap.season, 'season should wrap back to Spring').toBe('Spring');

  // The week-52 rollover must have resolved every year-1 bracket — all 16
  // generated tournaments (4 tiers × 4 seasons) completed, none stale.
  expect(yearTwoStartSnap.tournaments.length, 'expected 16 year-1 tournaments').toBe(16);
  expect(
    yearTwoStartSnap.tournaments.every((t) => t.completed),
    'no stale incomplete tournament may survive the year boundary'
  ).toBe(true);

  // Tournament ids must be unique across the whole run — year 2 regenerates
  // the same season+week slots, so collisions would break find-by-id.
  const endSnap = await snapshotState(page);
  const allIds = endSnap.tournaments.map((t) => t.id);
  expect(new Set(allIds).size, 'tournament ids must be unique across years').toBe(
    allIds.length
  );

  // One completed tournament per season boundary in year 1, plus year 2's
  // spring tournament proving the new-year brackets resolve.
  expect(completedTourneys.length, 'expected 5 tournaments (4 in year 1 + year-2 spring)').toBe(5);
  expect(
    completedTourneys
      .filter((t) => t.year === 1)
      .map((t) => t.week)
      .sort((a, b) => a - b)
  ).toEqual([13, 26, 39, 52]);
  expect(completedTourneys.filter((t) => t.year === 1).map((t) => t.season)).toEqual([
    'Spring',
    'Summer',
    'Fall',
    'Winter',
  ]);
  expect(completedTourneys.filter((t) => t.year === 2).map((t) => t.week)).toEqual([13]);

  for (const t of completedTourneys) {
    const tourney = endSnap.tournaments.find((x) => x.id === t.id);
    expect(tourney?.completed, `${t.id} should be completed`).toBe(true);
    expect(tourney?.champion, `${t.id} should have a champion`).toBeTruthy();
  }

  // End state: year 2, week 14 — past year 2's tournament week, and the
  // season boundary has ticked over to Summer.
  expect(endSnap.year).toBe(2);
  expect(endSnap.week).toBe(14);
  expect(endSnap.isTournamentWeek).toBe(false);
  expect(endSnap.season).toBe('Summer');

  // Header shows the settled week-advance state.
  await expect
    .poll(() => settledAdvanceLabel(page), { timeout: 60_000 })
    .toMatch(/ADVANCE WEEK 14/);

  // Final screenshot for the report.
  await page.screenshot({ path: 'e2e/screenshots/seasonal-tournament-final.png', fullPage: false });
});
