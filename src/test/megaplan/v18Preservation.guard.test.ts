import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import path from 'node:path';

/**
 * MEGAPLAN-V18 unique-code preservation spec (authored test-first).
 *
 * Asserts the FINDINGS §U divergent behaviors that must provably survive
 * every SRP/DRY consolidation. These run GREEN today (they pin current
 * behavior) and fail if a refactor erases a unique payload — they are the
 * "no deletion unless behavior demonstrably lives on" teeth of Phase 5.
 */

const REPO = path.resolve(__dirname, '../../..');
const fileText = (p: string) => {
  try {
    return readFileSync(path.join(REPO, p), 'utf8');
  } catch {
    return '';
  }
};

describe('megaplan V18: unique-logic preservation (§U)', () => {
  it('U1: combat-log views keep divergent icon payloads — text badges vs Lucide JSX', () => {
    const mini = fileText('src/components/arena/MiniCombatLog.tsx');
    const tactical = fileText('src/components/arena/TacticalLogView.tsx');
    // MiniCombatLog renders short text badges.
    for (const badge of ["'HIT'", "'CRT'", "'KIL'", "'RIP'"]) {
      expect(mini, `MiniCombatLog lost the ${badge} badge`).toContain(`return ${badge}`);
    }
    // TacticalLogView renders per-type Lucide icons.
    for (const icon of ['Swords', 'Zap', 'Skull', 'Shield']) {
      expect(tactical, `TacticalLogView lost the ${icon} icon`).toContain(`<${icon}`);
    }
  });

  it('U2: weather effects keep per-effect divergent visuals', () => {
    const checks: [string, string[]][] = [
      ['src/components/arena/weather/effects/stormEffects.tsx', ['animate', 'Storm']],
      ['src/components/arena/weather/effects/heatEffects.tsx', ['Mirage', 'Heat']],
      ['src/components/arena/weather/effects/fogEffects.tsx', ['Fog']],
      ['src/components/arena/weather/effects/specialEffects.tsx', ['star']],
    ];
    for (const [file, needles] of checks) {
      const text = fileText(file);
      expect(text, `${file} empty after consolidation`).not.toBe('');
      for (const n of needles) {
        expect(text, `${file} lost divergent visual '${n}'`).toContain(n);
      }
    }
  });

  it('U3: competitionWorker specs keep per-spec scenario semantics', () => {
    // Each spec's distinct gate scenario must remain expressible post-harness.
    for (const f of [
      'playerPressure.test.ts',
      'venueCounter.test.ts',
      'styleMatchupGate.test.ts',
      'desperationGate.test.ts',
      'promoterAwareness.test.ts',
    ]) {
      const text = fileText(`src/test/engine/ai/workers/competitionWorker/${f}`);
      expect(text, `${f} lost its scenario assertions`).toContain('evaluateBoutOffer');
      expect(text, `${f} lost its expectations`).toContain('expect(');
    }
  });

  it('U4: shadcn overlay components keep distinct primitives', () => {
    const primitives: [string, string][] = [
      ['src/components/ui/dialog.tsx', 'DialogPrimitive'],
      ['src/components/ui/sheet.tsx', 'SheetPrimitive'],
      ['src/components/ui/alert-dialog.tsx', 'AlertDialogPrimitive'],
      ['src/components/ui/select.tsx', 'SelectPrimitive'],
      ['src/components/ui/tabs.tsx', 'TabsPrimitive'],
    ];
    for (const [file, needle] of primitives) {
      expect(fileText(file), `${file} lost its ${needle} primitive`).toContain(needle);
    }
  });

  it('U5: page hooks keep distinct return-shapes (no over-shared selector)', () => {
    const shapes: [string, string[]][] = [
      ['src/pages/AdminTools/hooks/useAdminTools.ts', ['skipWeek', 'skipMonth', 'skipSeason']],
      ['src/pages/ControlCenter/hooks/useControlCenter.ts', ['arenaHistory', 'boutOffers']],
      ['src/pages/orphanage/useFtueFlow.ts', ['step', 'useOrphanSelection']],
      ['src/pages/orphanage/ftueFlow/useOrphanSelection.ts', ['orphanPool', 'selectedWarriors']],
      ['src/pages/startGame/useStartGame.ts', ['screen', 'slots']],
    ];
    for (const [file, fields] of shapes) {
      const text = fileText(file);
      for (const f of fields) {
        expect(text, `${file} lost return field '${f}'`).toContain(f);
      }
    }
  });

  it('U6: offseason handler map keeps per-event effectType keys', () => {
    const text = fileText('src/engine/pipeline/seasonal.ts');
    for (const key of [
      'chaos_rift',
      'fame_boost',
      'tavern_brawl',
      'plague_outbreak',
    ]) {
      expect(text, `seasonal.ts lost the ${key} handler`).toContain(key);
    }
  });

  it('U7: ordered design data stays ordered literals (no merged loss)', () => {
    // Spot-pin first entries of load-bearing ordered tables.
    expect(fileText('src/data/names/commonCorpus.ts')).not.toBe('');
    const stable = fileText('src/data/names/stableNames.ts');
    expect(stable.indexOf("'The Bleeding'")).toBeLessThan(stable.indexOf("'The Severed'"));
    const owners = fileText('src/data/names/ownerNames.ts');
    expect(owners.indexOf("'Aldric'")).toBeLessThan(owners.indexOf("'Balthazar'"));
  });

  it('U8: distinct state-field key lists are not merged', () => {
    const stages = fileText('src/engine/pipeline/pipelineStages.ts');
    const plaus = fileText('src/engine/storage/opfsArchive/plausibility.ts');
    const reg = fileText('src/engine/traits/registry.ts');
    expect(stages).toContain('EXCLUSIVE_STRATEGY_KEYS');
    expect(plaus).toContain('ARRAY_FIELDS');
    expect(reg).toContain('LEGACY_TRAIT_ORDER');
    // The three lists carry different members — they must not collapse.
    expect(plaus).toContain("'graveyard'");
    expect(stages).toContain("'legacyFounderQueue'");
    expect(reg).toContain('LEGACY_TRAIT_ORDER');
  });

  it('U9: resolveCounteredOffers keeps per-counter-type verdict branches', () => {
    const text = fileText('src/engine/ai/workers/competitionWorker/offerProcessor/counters.ts');
    expect(text, 'counter branches collapsed').toContain('Countered');
  });

  it('U10: enum literal pins stay literal in sync specs', () => {
    const sync = fileText('src/test/schemas/enumSourcesSync.test.ts');
    const terms = fileText('src/test/config/terminology.test.ts');
    // Guards re-enumerate canonical literals — an import of the enum would
    // make the pin vacuous.
    expect(sync).toMatch(/'Clear'|'Rainy'|'Sweltering'/);
    expect(terms).toContain('Personnel Intel');
  });
});
