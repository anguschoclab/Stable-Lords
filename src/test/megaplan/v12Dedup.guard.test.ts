import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import path from 'node:path';

/**
 * MEGAPLAN-V12 duplication-consolidation spec (test-first, red until Phase 4):
 *
 * Verdicted DEDUPE clusters from MEGAPLAN_V12_FINDINGS.md section A1 — each
 * asserts the shared abstraction exists and honors the contract that made the
 * duplicates identical. Behavioral asserts use dynamic import so failures are
 * clean assertion reds, not module-resolution crashes (v11Dedup precedent).
 */

const REPO = path.resolve(__dirname, '../../..');

const fileExists = (p: string) => existsSync(path.join(REPO, p));
const fileText = (p: string) => {
  try {
    return readFileSync(path.join(REPO, p), 'utf8');
  } catch {
    return '';
  }
};

const candidateExists = (paths: string[]) => paths.some(fileExists);

describe('megaplan V12: duplicate consolidation', () => {
  it('D1: a shared fresh-warrior defaults helper exists and returns fresh objects (no aliasing)', async () => {
    const found = candidateExists([
      'src/engine/factories/warriorDefaults.ts',
      'src/engine/factories/newWarriorDefaults.ts',
      'src/engine/warrior/warriorDefaults.ts',
    ]);
    expect(found, 'no shared fresh-warrior defaults module found').toBe(true);

    for (const p of [
      'src/engine/factories/warriorDefaults.ts',
      'src/engine/factories/newWarriorDefaults.ts',
      'src/engine/warrior/warriorDefaults.ts',
    ]) {
      if (!fileExists(p)) continue;
      const mod = await import(path.join(REPO, p));
      const make = mod.newWarriorDefaults ?? mod.default;
      expect(typeof make, `${p} must export newWarriorDefaults()`).toBe('function');
      const a = make();
      const b = make();
      // Canonical zero-state contract (pinned by warriorFactory.test.ts).
      expect(a).toMatchObject({
        fame: 0,
        popularity: 0,
        titles: [],
        injuries: [],
        flair: [],
        career: { wins: 0, losses: 0, kills: 0 },
        champion: false,
        status: 'Active',
      });
      // Variation point: each call must mint fresh containers — a shared const
      // would alias mutable arrays across warriors.
      a.titles.push('x');
      a.career.wins = 9;
      expect(b.titles).toEqual([]);
      expect(b.career.wins).toBe(0);
    }
  });

  it('D2: PendingResolutionDataSchema has a single home consumed by gameStateSchema', () => {
    const fight = fileText('src/schemas/fightSchemas.ts');
    const game = fileText('src/schemas/gameStateSchema.ts');
    expect(
      /export const PendingResolutionDataSchema/.test(fight),
      'PendingResolutionDataSchema not exported from fightSchemas.ts'
    ).toBe(true);
    expect(
      /PendingResolutionDataSchema/.test(game),
      'gameStateSchema.ts does not consume the shared schema'
    ).toBe(true);
  });

  it('D3: a shared trainer-bonus→mods mapping exists with the canonical math', async () => {
    const candidates = [
      'src/engine/trainers/combatMods.ts',
      'src/engine/trainers/trainerMods.ts',
      'src/engine/trainers/trainers.ts',
    ];
    const found = candidates.find(fileExists);
    expect(found, 'no trainers-domain module found').toBeTruthy();
    const text = fileText(found!);
    expect(
      /export (function|const) trainerBonusToMods/.test(text) ||
        candidates.filter((p) => p !== found && fileText(p).includes('trainerBonusToMods')).length > 0,
      'trainerBonusToMods not found in trainers domain'
    ).toBe(true);
  });

  it('D4: crestGenerator tier tables derive from (or stay inside) canonical FIELD_TYPES', async () => {
    const { FIELD_TYPES } = await import(path.join(REPO, 'src/types/enumSources.ts'));
    const gen = fileText('src/engine/crest/crestGenerator.ts');
    // Property guard (green now and post-refactor): every field-type literal
    // referenced by the generator must be a canonical FIELD_TYPES member.
    const literals = new Set([...gen.matchAll(/'([a-z-]+)'/g)].map((m) => m[1]));
    const fieldLike = [...literals].filter((l) =>
      [
        'solid', 'fess', 'pale', 'bend', 'bend-sinister', 'chevron',
        'chevron-inverted', 'cross', 'saltire', 'per-pale', 'per-fess',
        'pale-environ', 'gyronny', 'quarterly',
      ].includes(l)
    );
    for (const l of fieldLike) {
      expect(
        (FIELD_TYPES as readonly string[]).includes(l),
        `crestGenerator references non-canonical field type '${l}'`
      ).toBe(true);
    }
    // Post-refactor the generator must import the canonical list.
    expect(
      /FIELD_TYPES/.test(gen),
      'crestGenerator re-lists field types instead of consuming FIELD_TYPES'
    ).toBe(true);
  });

  it('D5: favoredName has a single home shared by both bout-viewer panels', () => {
    const found = candidateExists([
      'src/components/bout-viewer/favoredName.ts',
      'src/components/bout-viewer/utils.ts',
      'src/components/bout-viewer/favoredName.tsx',
    ]);
    expect(found, 'no shared favoredName module under components/bout-viewer/').toBe(true);
  });

  it('D6: a shared selectable-row/card primitive exists', () => {
    const found = candidateExists([
      'src/components/ui/SelectableRow.tsx',
      'src/components/ui/SelectableCard.tsx',
      'src/components/scouting/SelectableRow.tsx',
      'src/components/scouting/selectableRow.tsx',
    ]);
    expect(found, 'no shared selectable-row primitive found').toBe(true);
  });

  it('D7: a shared icon tab-strip primitive exists', () => {
    const found = candidateExists([
      'src/components/ui/IconTabStrip.tsx',
      'src/components/ui/TabStrip.tsx',
      'src/components/ui/iconTabStrip.tsx',
    ]);
    expect(found, 'no shared icon tab-strip primitive found').toBe(true);
  });

  it('D8: a shared JSON file-input reader exists (ImportExport/Mods scaffold)', () => {
    const text =
      fileText('src/lib/importExport.ts') +
      fileText('src/utils/importExport.ts') +
      fileText('src/utils/fileUtils.ts');
    expect(
      /export (function|const) (readJsonFileInput|readFileInput|readJsonUpload)/.test(text),
      'no shared file-input JSON reader found in lib/ or utils/'
    ).toBe(true);
  });

  it('D9: a shared tooltip-badge primitive exists', () => {
    const found = candidateExists([
      'src/components/ui/TooltipBadge.tsx',
      'src/components/stable/TooltipBadge.tsx',
      'src/components/ui/StatBadge.tsx',
    ]);
    expect(found, 'no shared tooltip-badge primitive found').toBe(true);
  });

  it('D10: expandable-bar toggle a11y is shared (hook or component)', () => {
    const found =
      candidateExists([
        'src/hooks/useToggleKeydown.ts',
        'src/hooks/useToggleBarKeydown.ts',
        'src/components/ui/ExpandableBarHeader.tsx',
      ]) || /useToggleKeydown|useToggleBarKeydown|ExpandableBarHeader/.test(fileText('src/components/arena/MiniCombatLog.tsx'));
    expect(found, 'no shared expandable-bar toggle handling found').toBe(true);
  });
});
