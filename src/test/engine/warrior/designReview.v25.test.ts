/**
 * V25 — archetype-fit surfaces in the Design Review: the build is
 * classified against Assur's winning archetypes and canon-fit notes fire
 * at the articles' named bars.
 */
import { describe, it, expect } from 'vitest';
import { reviewWarriorDesign } from '@/engine/warrior/designReview';
import { FightingStyle } from '@/types/shared.types';
import type { Attributes } from '@/types/shared.types';

const attrs = (over: Partial<Attributes> = {}): Attributes => ({
  ST: 10,
  CN: 10,
  SZ: 10,
  WT: 10,
  WL: 10,
  SP: 10,
  DF: 10,
  ...over,
});

const find = (items: ReturnType<typeof reviewWarriorDesign>, re: RegExp) =>
  items.find((i) => re.test(`${i.title} ${i.detail}`));

describe('reviewWarriorDesign — archetype classification', () => {
  it('a scum TP build is identified as a pure defensive', () => {
    const items = reviewWarriorDesign(
      attrs({ ST: 13, CN: 18, SZ: 5, WT: 9, WL: 19, SP: 3, DF: 11 }),
      FightingStyle.TotalParry
    );
    const item = find(items, /pure defensive/i);
    expect(item).toBeDefined();
    expect(['info', 'ok', 'good']).toContain(item!.verdict);
  });

  it('a striker spread is identified as a pure offensive', () => {
    const items = reviewWarriorDesign(
      attrs({ ST: 15, CN: 8, SZ: 12, WT: 15, WL: 13, SP: 9, DF: 11 }),
      FightingStyle.StrikingAttack
    );
    expect(find(items, /pure offensive/i)).toBeDefined();
  });
});

describe('reviewWarriorDesign — archetype-fit notes', () => {
  it('tank-fit build short of ST/CN bars draws the tank-frame note', () => {
    // Classifies tank first but the chassis misses the frame bars.
    const items = reviewWarriorDesign(
      attrs({ ST: 14, CN: 10, SZ: 9, WT: 9, WL: 15, SP: 4, DF: 9 }),
      FightingStyle.BashingAttack
    );
    expect(find(items, /tank frame|tank hybrid/i)).toBeDefined();
  });

  it('offensive-fit build under WT 11 warns — canon bare minimum', () => {
    const items = reviewWarriorDesign(
      attrs({ ST: 15, WT: 9, WL: 13, DF: 11, SZ: 10 }),
      FightingStyle.StrikingAttack
    );
    const item = find(items, /wit.*11|offensive wit/i);
    expect(item).toBeDefined();
    expect(item!.verdict).toBe('warn');
  });

  it('riposte-fit build in the SP 10–12 dead band gets the advisory', () => {
    const items = reviewWarriorDesign(
      attrs({ ST: 11, CN: 12, WT: 15, WL: 11, SP: 11, DF: 15, SZ: 6 }),
      FightingStyle.ParryRiposte
    );
    expect(find(items, /riposte|dead band|speed/i)).toBeDefined();
  });

  it('high-size hybrid-fit build gets the big-hybrid note', () => {
    const items = reviewWarriorDesign(
      attrs({ ST: 12, CN: 12, WT: 15, WL: 12, DF: 12, SP: 5, SZ: 15 }),
      FightingStyle.ParryRiposte
    );
    expect(find(items, /big hybrid|size/i)).toBeDefined();
  });

  it('AB with low strength gets the surgeon-chassis viability note', () => {
    const items = reviewWarriorDesign(
      attrs({ ST: 5, WT: 17, WL: 11, DF: 21, CN: 8, SZ: 6, SP: 7 }),
      FightingStyle.AimedBlow
    );
    expect(find(items, /surgeon|aimed|low strength/i)).toBeDefined();
  });

  it('armor-dependent build that cannot carry a plate-class loadout warns', () => {
    // Defensive fit on a weak frame — APA/F would over-encumber, so the
    // build cannot be the scum it classified as.
    const items = reviewWarriorDesign(
      attrs({ ST: 9, CN: 9, WT: 7, WL: 15, SZ: 5, SP: 3, DF: 11 }),
      FightingStyle.TotalParry
    );
    expect(find(items, /encumbr|carry|over.?encumber/i)).toBeDefined();
  });
});
