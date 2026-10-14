import { describe, it, expect } from 'vitest';
import {
  deriveAbsoluteWeek,
  displayWeek,
  resolveAbsoluteWeek,
  boutOfferAbsoluteWeek,
  boutOfferExpirationAbsoluteWeek,
  isSeasonalTournamentWeek,
  isChampionsTournamentWeek,
  isTournamentWeekOfYear,
  weeksUntilNextSeasonalTournament,
  isTournamentPrepWeek,
  weeksUntilChampionsTournament
} from '@/engine/core/absoluteWeek';

describe('absoluteWeek utils', () => {
  it('deriveAbsoluteWeek', () => {
    expect(deriveAbsoluteWeek(1, 1)).toBe(1);
    expect(deriveAbsoluteWeek(1, 52)).toBe(52);
    expect(deriveAbsoluteWeek(2, 1)).toBe(53);
    expect(deriveAbsoluteWeek(2, 52)).toBe(104);
    // handles missing or 0
    expect(deriveAbsoluteWeek(0, 0)).toBe(1);
    expect(deriveAbsoluteWeek(undefined, undefined)).toBe(1);
  });

  it('displayWeek', () => {
    expect(displayWeek(1)).toBe(1);
    expect(displayWeek(52)).toBe(52);
    expect(displayWeek(53)).toBe(1);
    expect(displayWeek(104)).toBe(52);
    expect(displayWeek(0)).toBe(1);
  });

  it('resolveAbsoluteWeek', () => {
    // Current year offer
    expect(resolveAbsoluteWeek(10, 5)).toBe(10);
    // Next year offer (wrapped)
    expect(resolveAbsoluteWeek(2, 50)).toBe(54);
    // Same week
    expect(resolveAbsoluteWeek(5, 5)).toBe(5);
  });

  it('boutOfferAbsoluteWeek & boutOfferExpirationAbsoluteWeek', () => {
    const offerWithAbs = { boutWeek: 2, expirationWeek: 5, createdAbsoluteWeek: 52 } as any;
    expect(boutOfferAbsoluteWeek(offerWithAbs)).toBe(54);
    expect(boutOfferExpirationAbsoluteWeek(offerWithAbs)).toBe(57);

    // Legacy support
    const legacyOffer = { boutWeek: 15, expirationWeek: 16 } as any;
    expect(boutOfferAbsoluteWeek(legacyOffer)).toBe(15);
    expect(boutOfferExpirationAbsoluteWeek(legacyOffer)).toBe(16);
  });

  it('Tournament checks', () => {
    // Constants from @/constants/core/dates:
    // SEASONAL = [10, 20, 30, 42]
    // CHAMPIONS = 52

    expect(isSeasonalTournamentWeek(10)).toBe(true);
    expect(isSeasonalTournamentWeek(11)).toBe(false);

    expect(isChampionsTournamentWeek(52)).toBe(true);
    expect(isChampionsTournamentWeek(51)).toBe(false);

    expect(isTournamentWeekOfYear(10)).toBe(true);
    expect(isTournamentWeekOfYear(52)).toBe(true);
    expect(isTournamentWeekOfYear(1)).toBe(false);
  });

  it('weeksUntilNextSeasonalTournament', () => {
    expect(weeksUntilNextSeasonalTournament(10)).toBe(0);
    expect(weeksUntilNextSeasonalTournament(9)).toBe(1);
  });

  it('isTournamentPrepWeek', () => {
    // Prep weeks are < TOURNAMENT_PREP_WEEKS (usually 4, so distance 0, 1, 2, 3)
    expect(isTournamentPrepWeek(7)).toBe(true); // 3 weeks until 10
    expect(isTournamentPrepWeek(10)).toBe(true); // 0 weeks until
    expect(isTournamentPrepWeek(6)).toBe(false); // 4 weeks until
  });

  it('weeksUntilChampionsTournament', () => {
    expect(weeksUntilChampionsTournament(1)).toBe(51);
    expect(weeksUntilChampionsTournament(52)).toBe(0);
  });

  it('Tournament checks wrapped', () => {
    // Tests for edge cases we missed before
    expect(isSeasonalTournamentWeek(10 + 52)).toBe(true); // Wraps safely
    expect(isChampionsTournamentWeek(52)).toBe(true);
    expect(isTournamentWeekOfYear(10)).toBe(true);
    expect(isTournamentWeekOfYear(52)).toBe(true);
  });

  it('weeksUntilNextSeasonalTournament wraps', () => {
    expect(weeksUntilNextSeasonalTournament(42)).toBe(0);
    expect(weeksUntilNextSeasonalTournament(52)).toBe(10); // 52 -> 1..10 = 10 weeks
  });

  it('weeksUntilChampionsTournament edge cases', () => {
    expect(weeksUntilChampionsTournament(1)).toBe(51);
    expect(weeksUntilChampionsTournament(52)).toBe(0);
  });
});
