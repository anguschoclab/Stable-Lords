/**
 * Weather registries — verifies WEATHER_CONFIG, WEATHER_STATS,
 * WEATHER_AMBIENCE, and WEATHER_VISUALS have entries for new weather types.
 *
 * Pre-merge test: will FAIL on main because new weather types don't exist yet.
 */
import { describe, it, expect } from 'vitest';
import { WEATHER_CONFIG } from '@/constants/arena/weather';
import type { WeatherType } from '@/types/shared.types';

describe('weather registries — new weather types', () => {
  describe('WEATHER_CONFIG', () => {
    it('Eldritch Eclipse exists with icon, colorClass, description', () => {
      const config = WEATHER_CONFIG['Eldritch Eclipse' as WeatherType];
      expect(config).toBeDefined();
      expect(config!.icon).toBeDefined();
      expect(config!.colorClass).toBeTruthy();
      expect(config!.description.length).toBeGreaterThan(5);
    });

    it('Moonlight Duel exists with icon, colorClass, description', () => {
      const config = WEATHER_CONFIG['Moonlight Duel' as WeatherType];
      expect(config).toBeDefined();
      expect(config!.icon).toBeDefined();
      expect(config!.colorClass).toBeTruthy();
      expect(config!.description.length).toBeGreaterThan(5);
    });
  });

  describe('WEATHER_STATS (WeatherWidget)', () => {
    it('Eldritch Eclipse stats string matches toned-down values', async () => {
      const mod = await import('@/components/widgets/WeatherWidget');
      const stats = (mod as any).WEATHER_STATS?.['Eldritch Eclipse' as WeatherType];
      expect(stats).toBeDefined();
      expect(stats).toContain('95%');
      expect(stats).toContain('+2');
    });

    it('Moonlight Duel stats string exists', async () => {
      const mod = await import('@/components/widgets/WeatherWidget');
      const stats = (mod as any).WEATHER_STATS?.['Moonlight Duel' as WeatherType];
      expect(stats).toBeDefined();
    });
  });

  describe('WEATHER_AMBIENCE (WeatherAudio)', () => {
    it('Eldritch Eclipse has ambience entry', async () => {
      const mod = await import('@/components/arena/audio/WeatherAudio');
      const ambience = (mod as any).WEATHER_AMBIENCE?.['Eldritch Eclipse' as WeatherType];
      expect(ambience).toBeDefined();
    });

    it('Moonlight Duel ambience is null (no ambience)', async () => {
      const mod = await import('@/components/arena/audio/WeatherAudio');
      const ambience = (mod as any).WEATHER_AMBIENCE?.['Moonlight Duel' as WeatherType];
      expect(ambience).toBeNull();
    });
  });

  describe('WEATHER_VISUALS (weather overlay)', () => {
    it('Eldritch Eclipse has a visual effect (function)', async () => {
      const mod = await import('@/components/arena/weather');
      const visual = (mod as any).WEATHER_VISUALS?.['Eldritch Eclipse' as WeatherType];
      expect(visual).toBeDefined();
      expect(typeof visual).toBe('function');
    });

    it('Moonlight Duel visual is null (no visual effect)', async () => {
      const mod = await import('@/components/arena/weather');
      const visual = (mod as any).WEATHER_VISUALS?.['Moonlight Duel' as WeatherType];
      expect(visual).toBeNull();
    });
  });
});
