import { describe, it, expect, vi, beforeEach } from 'vitest';
import { makeLedgerEntry } from '@/engine/impacts/ledgerHelpers';
import type { IRNGService } from '@/engine/core/rng/IRNGService';
import type { LedgerEntry } from '@/types/state.types';

function makeMockRng(): IRNGService {
  return {
    uuid: vi.fn().mockImplementation((prefix?: string) => (prefix ? `${prefix}-mock-id` : 'mock-id')),
    next: vi.fn().mockReturnValue(0),
    pick: vi.fn().mockImplementation(<T>(arr: T[]) => arr[0] as T),
    roll: vi.fn().mockReturnValue(0),
    shuffle: vi.fn().mockImplementation(<T>(arr: T[]) => [...arr]),
    pickWeighted: vi.fn().mockImplementation(<T>(items: T[]) => items[0] as T),
    chance: vi.fn().mockReturnValue(false),
  } as unknown as IRNGService;
}

describe('makeLedgerEntry', () => {
  let rng: IRNGService;

  beforeEach(() => {
    rng = makeMockRng();
  });

  it('returns a LedgerEntry with all fields matching inputs', () => {
    const entry = makeLedgerEntry(rng, 5, 'Tournament Prize', 250, 'prize');
    expect(entry).toEqual({
      id: 'ledger-mock-id',
      week: 5,
      label: 'Tournament Prize',
      amount: 250,
      category: 'prize',
    });
  });

  it('calls rng.uuid exactly once', () => {
    makeLedgerEntry(rng, 1, 'Test', 100, 'other');
    expect(rng.uuid).toHaveBeenCalledTimes(1);
  });

  it('passes the prefix "ledger" to uuid', () => {
    makeLedgerEntry(rng, 1, 'Test', 100, 'other');
    expect(rng.uuid).toHaveBeenCalledWith('ledger');
  });

  it('works with all 7 category types', () => {
    const categories: LedgerEntry['category'][] = [
      'fight',
      'training',
      'recruit',
      'trainer',
      'upkeep',
      'prize',
      'other',
    ];
    for (const category of categories) {
      const entry = makeLedgerEntry(rng, 1, 'Test', 100, category);
      expect(entry.category).toBe(category);
    }
  });

  it('handles positive amounts', () => {
    const entry = makeLedgerEntry(rng, 3, 'Mysterious Patron Donation', 500, 'other');
    expect(entry.amount).toBe(500);
  });

  it('handles negative amounts (debits)', () => {
    const entry = makeLedgerEntry(rng, 3, 'Goblin Merchant', -20, 'other');
    expect(entry.amount).toBe(-20);
  });

  it('handles zero amount', () => {
    const entry = makeLedgerEntry(rng, 1, 'Free Transfer', 0, 'other');
    expect(entry.amount).toBe(0);
  });

  it('handles large amounts without truncation', () => {
    const entry = makeLedgerEntry(rng, 10, 'Grand Jackpot', 999999, 'prize');
    expect(entry.amount).toBe(999999);
  });

  it('handles week 0', () => {
    const entry = makeLedgerEntry(rng, 0, 'Initial Entry', 100, 'other');
    expect(entry.week).toBe(0);
  });

  it('handles empty string label', () => {
    const entry = makeLedgerEntry(rng, 1, '', 100, 'other');
    expect(entry.label).toBe('');
  });

  it('does not mutate the rng mock beyond the uuid call', () => {
    makeLedgerEntry(rng, 1, 'Test', 100, 'other');
    expect(rng.next).not.toHaveBeenCalled();
    expect(rng.pick).not.toHaveBeenCalled();
  });

  it('returns a fresh object each call', () => {
    const entry1 = makeLedgerEntry(rng, 1, 'A', 100, 'other');
    const entry2 = makeLedgerEntry(rng, 1, 'A', 100, 'other');
    expect(entry1).not.toBe(entry2);
    expect(entry1).toEqual(entry2);
  });

  it('produces an id that is a string at runtime (branded type is transparent)', () => {
    const entry = makeLedgerEntry(rng, 1, 'Test', 100, 'other');
    expect(typeof entry.id).toBe('string');
  });
});
