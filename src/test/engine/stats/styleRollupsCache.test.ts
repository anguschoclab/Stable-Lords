import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { StyleRollups } from '@/engine/stats/styleRollups';

describe('#11c StyleRollups._clearCaches invalidates weekCache', () => {
  beforeEach(() => {
    localStorage.clear();
    StyleRollups._clearCaches();
  });

  afterEach(() => {
    localStorage.clear();
    StyleRollups._clearCaches();
  });

  it('clearing caches causes data to be reloaded from localStorage', () => {
    StyleRollups.addFight({
      week: 1,
      styleA: 'Gladiator',
      styleD: 'Retiarius',
      winner: 'A',
      by: 'Kill',
    });

    const week1 = StyleRollups.getWeekRollup(1);
    expect(week1['Gladiator']).toBeDefined();
    expect(week1['Gladiator']?.w).toBe(1);

    StyleRollups._clearCaches();

    const week1After = StyleRollups.getWeekRollup(1);
    expect(week1After['Gladiator']).toBeDefined();
  });
});
