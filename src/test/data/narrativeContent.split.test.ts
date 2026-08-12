import { describe, it, expect, beforeAll } from 'vitest';
import { getFromArchive, peekArchive, richHitLocation } from '@/engine/narrative/narrativePBPUtils';
import { SeededRNG } from '@/utils/random';
import { loadCombatNarrative } from '@/data/narrative';

// Domain file imports — these will fail until Phase 2B creates them
import combatPbp from '@/data/narrative/combatPbp.json';
import combatStrikes from '@/data/narrative/combatStrikes.json';
import combatKillText from '@/data/narrative/combatKillText.json';
import combatConclusions from '@/data/narrative/combatConclusions.json';
import combatPassives from '@/data/narrative/combatPassives.json';
import gazette from '@/data/narrative/gazette.json';
import recruitment from '@/data/narrative/recruitment.json';
import offseason from '@/data/narrative/offseason.json';
import announcer from '@/data/narrative/announcer.json';
import uiMeta from '@/data/narrative/uiMeta.json';

import { narrativeContent as assembledContent } from '@/data/narrative';

beforeAll(async () => { await loadCombatNarrative(); });

const ORIGINAL_KEYS = [
  'blurbs',
  'commentary',
  'conclusions',
  'crowd_reactions',
  'events',
  'fanfare',
  'gazette',
  'kill_text',
  'memorials',
  'meta',
  'offseason_events',
  'passives',
  'pbp',
  'persona',
  'recap',
  'recruitment',
  'strikes',
  'ux_metadata',
] as const;

describe('narrativeContent split — domain files', () => {
  it('combatPbp.json contains pbp and crowd_reactions keys', () => {
    expect(combatPbp).toBeDefined();
    expect(typeof combatPbp).toBe('object');
    expect('pbp' in combatPbp).toBe(true);
    expect('crowd_reactions' in combatPbp).toBe(true);
  });

  it('combatStrikes.json contains strikes key', () => {
    expect(combatStrikes).toBeDefined();
    expect('strikes' in combatStrikes).toBe(true);
  });

  it('combatKillText.json contains kill_text key', () => {
    expect(combatKillText).toBeDefined();
    expect('kill_text' in combatKillText).toBe(true);
  });

  it('combatConclusions.json contains conclusions key', () => {
    expect(combatConclusions).toBeDefined();
    expect('conclusions' in combatConclusions).toBe(true);
  });

  it('combatPassives.json contains passives key', () => {
    expect(combatPassives).toBeDefined();
    expect('passives' in combatPassives).toBe(true);
  });

  it('gazette.json contains gazette and ux_metadata keys', () => {
    expect(gazette).toBeDefined();
    expect('gazette' in gazette).toBe(true);
    expect('ux_metadata' in gazette).toBe(true);
  });

  it('recruitment.json contains recruitment key', () => {
    expect(recruitment).toBeDefined();
    expect('recruitment' in recruitment).toBe(true);
  });

  it('offseason.json contains offseason_events and events keys', () => {
    expect(offseason).toBeDefined();
    expect('offseason_events' in offseason).toBe(true);
    expect('events' in offseason).toBe(true);
  });

  it('announcer.json contains blurbs, commentary, and recap keys', () => {
    expect(announcer).toBeDefined();
    expect('blurbs' in announcer).toBe(true);
    expect('commentary' in announcer).toBe(true);
    expect('recap' in announcer).toBe(true);
  });

  it('uiMeta.json contains fanfare, meta, persona, and memorials keys', () => {
    expect(uiMeta).toBeDefined();
    expect('fanfare' in uiMeta).toBe(true);
    expect('meta' in uiMeta).toBe(true);
    expect('persona' in uiMeta).toBe(true);
    expect('memorials' in uiMeta).toBe(true);
  });
});

describe('narrativeContent split — assembled object', () => {
  it('has all 18 top-level keys', () => {
    const keys = Object.keys(assembledContent).sort();
    expect(keys).toEqual([...ORIGINAL_KEYS].sort());
  });

  it('assembled pbp deep-equals combatPbp.json pbp', () => {
    expect(assembledContent.pbp).toEqual((combatPbp as any).pbp);
  });

  it('assembled strikes deep-equals combatStrikes.json strikes', () => {
    expect(assembledContent.strikes).toEqual((combatStrikes as any).strikes);
  });

  it('assembled gazette deep-equals gazette.json gazette', () => {
    expect(assembledContent.gazette).toEqual((gazette as any).gazette);
  });

  it('assembled fanfare deep-equals uiMeta.json fanfare', () => {
    expect(assembledContent.fanfare).toEqual((uiMeta as any).fanfare);
  });

  it('assembled recruitment deep-equals recruitment.json recruitment', () => {
    expect(assembledContent.recruitment).toEqual((recruitment as any).recruitment);
  });

  it('assembled memorials deep-equals uiMeta.json memorials', () => {
    expect(assembledContent.memorials).toEqual((uiMeta as any).memorials);
  });
});

describe('narrativeContent split — utility functions work on assembled data', () => {
  it('getFromArchive retrieves pbp.openers', () => {
    const rng = new SeededRNG(1);
    const template = getFromArchive(rng, ['pbp', 'openers']);
    expect(template).toBeDefined();
    expect(typeof template).toBe('string');
    expect(template.length).toBeGreaterThan(0);
  });

  it('peekArchive finds strikes.slashing.glancing', () => {
    const result = peekArchive(['strikes', 'slashing', 'glancing']);
    expect(result).not.toBeNull();
    expect(Array.isArray(result)).toBe(true);
    expect(result!.length).toBeGreaterThan(0);
  });

  it('getFromArchive retrieves blurbs.neutral', () => {
    const rng = new SeededRNG(1);
    const template = getFromArchive(rng, ['blurbs', 'neutral']);
    expect(template).toBeDefined();
    expect(typeof template).toBe('string');
  });

  it('richHitLocation returns a non-empty string', () => {
    const rng = new SeededRNG(1);
    const result = richHitLocation(rng, 'chest');
    expect(result).toBeDefined();
    expect(result.length).toBeGreaterThan(0);
  });
});

describe('narrativeContent split — direct accessors work on assembled data', () => {
  it('fanfare.report_math is a string', () => {
    expect(typeof (assembledContent as any).fanfare.report_math).toBe('string');
  });

  it('recruitment.names is a non-empty array', () => {
    expect(Array.isArray((assembledContent as any).recruitment.names)).toBe(true);
    expect((assembledContent as any).recruitment.names.length).toBeGreaterThan(0);
  });

  it('gazette.fights.Kill is a non-empty array', () => {
    expect(Array.isArray((assembledContent as any).gazette.fights.Kill)).toBe(true);
    expect((assembledContent as any).gazette.fights.Kill.length).toBeGreaterThan(0);
  });

  it('meta.flair is a non-empty object', () => {
    expect(typeof (assembledContent as any).meta.flair).toBe('object');
    expect(Object.keys((assembledContent as any).meta.flair).length).toBeGreaterThan(0);
  });

  it('persona.good is defined', () => {
    expect((assembledContent as any).persona.good).toBeDefined();
  });

  it('offseason_events is a non-empty object', () => {
    expect(typeof (assembledContent as any).offseason_events).toBe('object');
    expect(Object.keys((assembledContent as any).offseason_events).length).toBeGreaterThan(0);
  });

  it('events.tavern_brawl has title and newsletter', () => {
    const evt = (assembledContent as any).events.tavern_brawl;
    expect(evt).toBeDefined();
    expect(evt.title).toBeDefined();
    expect(evt.newsletter).toBeDefined();
  });
});
