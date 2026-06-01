import { describe, it, expect } from 'vitest';
import { getOutcomeStyles } from '@/utils/combat';
import type { FightOutcomeBy } from '@/types/combat.types';

describe('getOutcomeStyles', () => {
  it('returns blood variant for Kill', () => {
    const style = getOutcomeStyles('Kill');
    expect(style.variant).toBe('blood');
    expect(style.icon).toBe('Skull');
    expect(style.label).toBe('FATALITY');
    expect(style.bgClasses).toBe('bg-arena-blood/20 border-arena-blood/40');
    expect(style.textClass).toBe('text-arena-blood');
  });

  it('returns gold variant for KO', () => {
    const style = getOutcomeStyles('KO');
    expect(style.variant).toBe('gold');
    expect(style.icon).toBe('Zap');
    expect(style.label).toBe('KNOCKOUT');
    expect(style.bgClasses).toBe('bg-arena-gold/20 border-arena-gold/40');
    expect(style.textClass).toBe('text-arena-gold');
  });

  it('returns gold variant for Stoppage', () => {
    const style = getOutcomeStyles('Stoppage');
    expect(style.variant).toBe('gold');
    expect(style.icon).toBe('Shield');
    expect(style.label).toBe('STOPPAGE');
    expect(style.bgClasses).toBe('bg-primary/10 border-primary/20');
    expect(style.textClass).toBe('text-primary');
  });

  it('returns parchment variant for Exhaustion', () => {
    const style = getOutcomeStyles('Exhaustion');
    expect(style.variant).toBe('parchment');
    expect(style.icon).toBe('Activity');
    expect(style.label).toBe('EXHAUSTION');
    expect(style.bgClasses).toBe('bg-neutral-800 border-white/5');
    expect(style.textClass).toBe('text-muted-foreground');
  });

  it('returns parchment variant for Draw', () => {
    const style = getOutcomeStyles('Draw');
    expect(style.variant).toBe('parchment');
    expect(style.icon).toBeUndefined();
    expect(style.label).toBe('DRAW');
    expect(style.bgClasses).toBe('bg-neutral-900 border-white/5');
    expect(style.textClass).toBe('text-muted-foreground');
  });

  it('returns parchment variant for unknown outcomes', () => {
    const style = getOutcomeStyles('Unknown' as FightOutcomeBy);
    expect(style.variant).toBe('parchment');
    expect(style.label).toBe('UNKNOWN');
    expect(style.bgClasses).toBe('bg-neutral-900 border-white/5');
    expect(style.textClass).toBe('text-muted-foreground');
  });

  it('returns parchment variant for null', () => {
    const style = getOutcomeStyles(null);
    expect(style.variant).toBe('parchment');
    expect(style.icon).toBeUndefined();
    expect(style.label).toBe('UNKNOWN');
    expect(style.bgClasses).toBe('bg-neutral-900 border-white/5');
    expect(style.textClass).toBe('text-muted-foreground');
  });
});
