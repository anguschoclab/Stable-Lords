import { describe, it, expect } from 'vitest';
import { getTagDescription } from '@/data/tagDescriptions';
import uiMeta from '@/data/narrative/uiMeta.json';

describe('getTagDescription', () => {
  it('should return the correct description for flair tags', () => {
    const tag = 'Flashy';
    const expected = (uiMeta as any).meta.flair.Flashy;
    expect(getTagDescription(tag)).toBe(expected);
  });

  it('should return the correct description for title tags', () => {
    const tag = 'Champion';
    const expected = (uiMeta as any).meta.title.Champion;
    expect(getTagDescription(tag)).toBe(expected);
  });

  it('should return the correct description for injury tags', () => {
    const tag = 'Broken Arm';
    const expected = (uiMeta as any).meta.injury['Broken Arm'];
    expect(getTagDescription(tag)).toBe(expected);
  });

  it('should return the correct description for status tags', () => {
    const activeExpected = (uiMeta as any).meta.status.Active;
    const deadExpected = (uiMeta as any).meta.status.Dead;
    const retiredExpected = (uiMeta as any).meta.status.Retired;

    expect(getTagDescription('Active')).toBe(activeExpected);
    expect(getTagDescription('Dead')).toBe(deadExpected);
    expect(getTagDescription('Retired')).toBe(retiredExpected);
  });

  it('should return a fallback message for unknown tags', () => {
    const unknownTag = 'SuperLegendary';
    const expectedFallback = `${unknownTag} — a notable trait earned through arena combat.`;
    expect(getTagDescription(unknownTag)).toBe(expectedFallback);
  });

  it('should handle empty strings by returning the fallback message', () => {
    const emptyTag = '';
    const expectedFallback = `${emptyTag} — a notable trait earned through arena combat.`;
    expect(getTagDescription(emptyTag)).toBe(expectedFallback);
  });
});
