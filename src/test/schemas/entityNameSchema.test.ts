import { describe, it, expect } from 'vitest';
import { EntityNameSchema } from '@/schemas/entityNameSchema';
import { WarriorSchema } from '@/schemas/warriorSchemas';
import { OwnerSchema } from '@/schemas/economySchemas';
import { makeWarrior, makeOwner } from '@/test/_fixtures/factories';

/**
 * Entity-name schema transform — the save-import boundary. Names embedded
 * in crafted saves are cleaned at deserialization so markdown/HTML
 * metacharacters can't flow into gazette narratives and linkify.
 */
describe('EntityNameSchema', () => {
  it('passes ordinary names through unchanged', () => {
    expect(EntityNameSchema.parse('The Gilded Lions')).toBe('The Gilded Lions');
    expect(EntityNameSchema.parse("Dragon's Hearth")).toBe("Dragon's Hearth");
  });

  it('strips markdown/HTML metacharacters', () => {
    expect(EntityNameSchema.parse('<img src=x onerror=alert(1)>')).toBe('img srcx onerroralert1');
    expect(EntityNameSchema.parse('a](javascript:x) [b')).toBe('ajavascriptx b');
  });

  it('falls back to Unknown when nothing usable remains', () => {
    expect(EntityNameSchema.parse('<>:[](){}')).toBe('Unknown');
  });

  it('cleans WarriorSchema.name', () => {
    const dirty = makeWarrior({ name: 'Evil](javascript:alert(1))[x' });
    const parsed = WarriorSchema.parse(dirty);
    expect(parsed.name).toBe('Eviljavascriptalert1x');
  });

  it('cleans OwnerSchema name and stableName', () => {
    const dirty = makeOwner({ name: '<Owner>', stableName: 'St[ab](javascript:x)le' });
    const parsed = OwnerSchema.parse(dirty);
    expect(parsed.name).toBe('Owner');
    expect(parsed.stableName).toBe('Stabjavascriptxle');
  });
});
