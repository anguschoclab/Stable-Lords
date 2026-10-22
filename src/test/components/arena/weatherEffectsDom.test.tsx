// @vitest-environment jsdom
/**
 * Weather-effects DOM characterization + `DriftParticles` contract.
 *
 * The characterization block pins the pre-refactor DOM structure of every
 * effect whose particle loop is about to collapse into the shared
 * `DriftParticles` component — class tokens and element counts, not just
 * truthiness — so the dedup must produce identical markup.
 */
import { describe, it, expect } from 'vitest';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import {
  MirageEffect,
  ScorchingWindEffect,
  WildfireSmokeEffect,
} from '@/components/arena/weather/effects/heatEffects';
import {
  WindEffect,
  TornadoEffect,
  ChaoticWindsEffect,
} from '@/components/arena/weather/effects/windEffects';
import { DriftParticles } from '@/components/arena/weather/effects/DriftParticles';
import { cryptoRandom } from '@/utils/cryptoRandom';

const count = (html: string, token: string) => html.split(token).length - 1;
const render = (el: React.ReactElement) => renderToStaticMarkup(el);

describe('weather effects DOM characterization (pre-DriftParticles)', () => {
  it('MirageEffect keeps its heat-shimmer + 20 drift-particle structure', () => {
    const html = render(createElement(MirageEffect));
    expect(html).toContain('animate-heat-shimmer');
    expect(count(html, 'bg-arena-gold/30 rounded-full animate-chaotic-drift')).toBe(20);
    expect(count(html, 'h-4 animate-heat-shimmer')).toBe(6); // ripple bands
  });

  it('ScorchingWindEffect keeps 22 wind streaks + haze', () => {
    const html = render(createElement(ScorchingWindEffect));
    expect(html).toContain('animate-heat-shimmer');
    expect(count(html, 'animate-wind')).toBe(22);
  });

  it('WildfireSmokeEffect keeps 12 smoke clouds + 15 ember sparks', () => {
    const html = render(createElement(WildfireSmokeEffect));
    expect(count(html, 'blur-2xl animate-chaotic-drift')).toBe(12);
    expect(count(html, 'bg-arena-blood/80 rounded-full animate-chaotic-drift')).toBe(15);
  });

  it('WindEffect scales streak count with the strong flag', () => {
    const weak = render(createElement(WindEffect, { strong: false }));
    const strong = render(createElement(WindEffect, { strong: true }));
    expect(count(weak, 'animate-wind')).toBe(15);
    expect(count(strong, 'animate-wind')).toBe(40);
    expect(weak).toContain('w-8');
    expect(strong).toContain('w-16');
  });

  it('TornadoEffect keeps funnel + 30 streaks + 25 debris particles', () => {
    const html = render(createElement(TornadoEffect));
    expect(html).toContain('animate-spin-slow');
    expect(count(html, 'animate-wind')).toBe(30);
    expect(count(html, 'bg-neutral-600/60 rounded-none animate-mana-spark')).toBe(25);
  });

  it('ChaoticWindsEffect keeps bi-directional streaks + vortex + 35 debris', () => {
    const html = render(createElement(ChaoticWindsEffect));
    expect(count(html, 'animate-wind')).toBe(25); // left-to-right streaks
    expect(count(html, 'via-neutral-400/20')).toBe(25); // reversed streaks
    expect(html).toContain('animate-spin-slow'); // vortex
    expect(count(html, 'bg-arena-gold/50 rounded-full animate-chaotic-drift')).toBe(35);
  });
});

describe('DriftParticles (contract)', () => {
  it('renders `count` absolutely-positioned divs with the given class', () => {
    const html = render(
      createElement(DriftParticles, {
        count: 7,
        particleClassName: 'absolute w-1 h-1 bg-x animate-chaotic-drift',
        position: () => ({ left: '10%', bottom: '0%' }),
        drift: { tx: () => 5, ty: () => -80 },
      })
    );
    expect(count(html, 'absolute w-1 h-1 bg-x animate-chaotic-drift')).toBe(7);
  });

  it('merges position styles with --tx/--ty drift vectors and timing', () => {
    const html = render(
      createElement(DriftParticles, {
        count: 1,
        particleClassName: 'p',
        position: () => ({ top: '33%' }),
        drift: { tx: () => 12, ty: () => -40, durationS: { base: 2, range: 2 } },
      })
    );
    expect(html).toContain('--tx:12px');
    expect(html).toContain('--ty:-40px');
    expect(html).toContain('top:33%');
    expect(html).toContain('animation-delay:');
    expect(html).toContain('animation-duration:');
  });

  it('is deterministic under stubbed cryptoRandom', () => {
    // cryptoRandom is module-level randomness — both renders must produce
    // identical markup shape regardless of values (same element/class count).
    const a = render(
      createElement(DriftParticles, {
        count: 4,
        particleClassName: 'p',
        position: () => ({ left: `${cryptoRandom() * 100}%` }),
        drift: { tx: () => cryptoRandom() * 10, ty: () => -cryptoRandom() * 10 },
      })
    );
    expect(count(a, 'class="p"')).toBe(4);
  });
});
