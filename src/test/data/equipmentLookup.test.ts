import { describe, it, expect } from 'vitest';
import { getItemById, getItemByCode, ALL_EQUIPMENT } from '@/data/equipment';
import { WEAPONS } from '@/data/equipment/weapons';
import { ARMORS } from '@/data/equipment/armor';
import { SHIELDS } from '@/data/equipment/shields';
import { HELMS } from '@/data/equipment/helms';

describe('getItemById', () => {
  it('finds every weapon by id', () => {
    for (const w of WEAPONS) {
      expect(getItemById(w.id)?.id).toBe(w.id);
    }
  });

  it('finds every armor by id', () => {
    for (const a of ARMORS) {
      expect(getItemById(a.id)?.id).toBe(a.id);
    }
  });

  it('finds every shield by id', () => {
    for (const s of SHIELDS) {
      expect(getItemById(s.id)?.id).toBe(s.id);
    }
  });

  it('finds every helm by id', () => {
    for (const h of HELMS) {
      expect(getItemById(h.id)?.id).toBe(h.id);
    }
  });

  it('finds all items in ALL_EQUIPMENT by id', () => {
    for (const item of ALL_EQUIPMENT) {
      expect(getItemById(item.id)?.id).toBe(item.id);
    }
  });

  it('returns undefined for unknown id', () => {
    expect(getItemById('nonexistent_item')).toBeUndefined();
  });

  it('returns undefined for empty string id', () => {
    expect(getItemById('')).toBeUndefined();
  });

  it('returns the correct item object (not a clone)', () => {
    const broadsword = getItemById('broadsword');
    expect(broadsword?.name).toBe('Broadsword');
    expect(broadsword?.weight).toBe(4);
    expect(broadsword?.slot).toBe('weapon');
  });

  it('finds none_shield, none_armor, none_helm by id', () => {
    expect(getItemById('none_shield')?.name).toBe('None');
    expect(getItemById('none_armor')?.name).toBe('None');
    expect(getItemById('none_helm')?.name).toBe('None');
  });
});

describe('getItemByCode', () => {
  it('finds every weapon by code', () => {
    for (const w of WEAPONS) {
      if (w.code) {
        expect(getItemByCode(w.code)?.id).toBe(w.id);
      }
    }
  });

  it('finds every armor by code', () => {
    for (const a of ARMORS) {
      if (a.code) {
        expect(getItemByCode(a.code)?.id).toBe(a.id);
      }
    }
  });

  it('finds every helm by code', () => {
    for (const h of HELMS) {
      if (h.code) {
        expect(getItemByCode(h.code)?.id).toBe(h.id);
      }
    }
  });

  it('returns undefined for unknown code', () => {
    expect(getItemByCode('ZZ')).toBeUndefined();
  });

  it('returns undefined for empty string code', () => {
    expect(getItemByCode('')).toBeUndefined();
  });

  it('finds broadsword by code BS', () => {
    expect(getItemByCode('BS')?.id).toBe('broadsword');
  });

  it('finds epee by code EP', () => {
    expect(getItemByCode('EP')?.id).toBe('epee');
  });
});
