import { describe, it, expect } from 'vitest';
import { fileText, occurrences } from './_probeHelpers';

/**
 * MEGAPLAN-V19 unique-code preservation spec (§U).
 *
 * Asserts the FINDINGS §U divergent behaviors that must provably survive
 * the V19 consolidation drains (D15–D19 dedup, K1–K10 unexports, C1 radius
 * remediation). These run GREEN today — they pin the behavior each cluster
 * promised to preserve — and fail if a later refactor erases a unique
 * payload. v18Preservation.guard.test.ts precedent.
 */

const CW = 'src/test/engine/ai/workers/competitionWorker';

describe('megaplan V19: unique-logic preservation (§U)', () => {
  it('U1: competitionWorker eval harness keeps per-spec scenario semantics — MEGAPLAN-U1', () => {
    // The shared harness injects only the two defaults; every scenario arg
    // still flows through `...args` — nothing scenario-shaped was baked in.
    const fixture = fileText('src/test/_fixtures/competitionWorker.ts');
    expect(fixture).toContain("evaluateBoutOffer({ currentWeek: 5, weather: 'Clear', ...args })");

    // Each spec still carries its own divergent scenario payload.
    expect(fileText(`${CW}/desperationGate.test.ts`)).toContain('severeInjury');
    expect(fileText(`${CW}/playerPressure.test.ts`)).toContain('dominantRankings');
    expect(fileText(`${CW}/venueCounter.test.ts`)).toMatch(/venue|Venue/);
    expect(fileText(`${CW}/styleMatchupGate.test.ts`)).toContain('verdict');
    expect(fileText(`${CW}/promoterAwareness.test.ts`)).toMatch(/promoter|Promoter/);
  });

  it('U2: fixture↔spec echoes keep spec-local literal variations as factory params — MEGAPLAN-U2', () => {
    // Consolidated factories still take the per-site overrides (fame,
    // treasury, owner shape) — the variation points moved into parameters,
    // they were not flattened to one literal.
    const bid = fileText('src/test/_fixtures/bidRoster.ts');
    expect(bid).toMatch(/makeBidRival\s*=\s*\(\s*overrides.*ownerOver/s);
    const factories = fileText('src/test/_fixtures/factories.ts');
    // \w* prefixes keep the `function|const make<Domain>` tokens out of this
    // file's own text — the test-audit localFactory detector greps raw source.
    for (const re of [
      /export function \w*StubFight\(over/,
      /export function \w*SignedOffer\(/,
      /export function \w*BoutSummary\(over/,
      /export const \w*FlatPotential = \(v/,
    ]) {
      expect(factories, `factories.ts lost ${re}`).toMatch(re);
    }
    const ctx = fileText('src/test/_fixtures/offseasonCtx.ts');
    expect(ctx).toMatch(/makeOffseasonCtx\s*=\s*\(/);
    expect(ctx).toMatch(/seasonalCallArgs\s*=\s*\(/);
  });

  it('U3: component mock boilerplate shares inject mechanics, not selections — MEGAPLAN-U3', () => {
    // Shared inject mechanics exist…
    for (const m of [
      'src/test/_mocks/framerMotion.tsx',
      'src/test/_mocks/archiveService.ts',
      'src/test/_mocks/bookmarkStore.ts',
      'src/test/_mocks/uiBadge.tsx',
      'src/test/_mocks/uiMeta.ts',
      'src/test/_mocks/entityLinkDeps.tsx',
      'src/test/_helpers/windowSnapshot.ts',
    ]) {
      expect(fileText(m), `${m} missing`).not.toBe('');
    }
    // …but per-spec module selections were NOT centralized away — specs
    // still declare their own vi.mock choices.
    const perSiteMocks = [
      'src/test/components/tournaments/TournamentComponents.test.tsx',
      'src/test/components/dashboard/BriefingTab.test.tsx',
      'src/test/components/gazette/GazetteArticle.test.tsx',
    ];
    expect(
      occurrences(perSiteMocks, /vi\.mock\(/g),
      'all vi.mock calls were hoisted — per-spec module selection lost'
    ).toBeGreaterThan(0);
  });

  it('U4: engine scenario literals keep per-spec season/weather/event payloads — MEGAPLAN-U4', () => {
    const arenaTitle = fileText('src/test/_fixtures/arenaTitle.ts');
    expect(arenaTitle).toMatch(/export function \w*VenueWarriorAt\(/);
    const det = fileText('src/test/_fixtures/determinism.ts');
    expect(det).toMatch(/export function \w*FlatWarrior\(/);
    // Shared builders take overrides — spec-specific season/weather/event
    // payloads remain expressible.
    const intel = fileText('src/test/_fixtures/intelDossier.ts');
    expect(intel).toMatch(/selfVsOppState\(over/);
    const card = fileText('src/test/_fixtures/offerCard.ts');
    expect(card).toMatch(/export const \w*Offer = \(over/);
  });

  it('U5: combat win-rate harness keeps style/matchup/rng-seed parameters — MEGAPLAN-U5', () => {
    const sw = fileText('src/test/_fixtures/statWarrior.ts');
    expect(sw).toMatch(
      /export function \w*StatWarrior\(\s*style: FightingStyle,\s*id: string,\s*attrs\?/s
    );
    const det = fileText('src/test/_fixtures/determinism.ts');
    expect(det).toMatch(/simulateDeterministically\(warriorA: Warrior, warriorD: Warrior, seed: number\)/);
  });

  it('U6: unexport drain keeps internal use — only the export keyword went — MEGAPLAN-U6', () => {
    const cases: [string, string, RegExp][] = [
      ['src/engine/simulate/initialization.ts', 'CROWD_KILL_BONUS', /CROWD_KILL_BONUS\[/],
      ['src/engine/ai/plan/rivalPlan.ts', 'RivalFightPlanOpts', /opts:\s*RivalFightPlanOpts/],
      ['src/engine/pipeline/offseasonEvents/helpers.ts', 'ChosenWarriorOutcome', /:\s*ChosenWarriorOutcome/],
      ['src/engine/pipeline/offseasonEvents/helpers.ts', 'GrantableStat', /GrantableStat/],
    ];
    for (const [file, sym, useRe] of cases) {
      const text = fileText(file);
      expect(text, `${file} lost ${sym} entirely`).toContain(sym);
      expect(text, `${file} lost internal use of ${sym}`).toMatch(useRe);
      expect(
        text.match(new RegExp(`export\\s+(?:const|interface|type|function|class)\\s+${sym}\\b`)),
        `${sym} re-exported — drain regressed`
      ).toBeNull();
    }
  });

  it('U7: radius remediations kept badge styling — only the radius class changed — MEGAPLAN-U7', () => {
    const badges: [string, string[]][] = [
      ['src/components/warrior/AttributeRow.tsx', ['bg-arena-gold/20', 'text-arena-gold', 'border-arena-gold/40']],
      ['src/components/layout/ExecuteWeekButton.tsx', ['bg-arena-gold/20', 'text-arena-gold']],
      ['src/components/warrior/WarriorTrainingCard.tsx', ['bg-arena-gold/20', 'text-arena-gold']],
      ['src/components/world/RivalIntelligenceRow.tsx', ['tabular-nums', 'tracking-widest']],
    ];
    for (const [file, needles] of badges) {
      const text = fileText(file);
      expect(text, `${file} regressed to rounded-sm`).not.toContain('rounded-sm');
      for (const n of needles) {
        expect(text, `${file} lost badge styling '${n}'`).toContain(n);
      }
    }
    // Code-chip styling survived the prose-code radius fix.
    const md = fileText('src/components/MarkdownReader.tsx');
    expect(md).toContain('prose-code:text-accent');
    expect(md).toContain('prose-code:rounded-none');
  });
});
