import type { CSSProperties } from 'react';
import { cn } from '@/lib/utils';
import { cryptoRandom } from '@/utils/cryptoRandom';

/**
 * Self-contained weather overlay effects for the arena background.
 *
 * The effects are dispatched through {@link WEATHER_EFFECTS}, an *ordered*
 * registry: the first entry whose `match` predicate accepts the (lowercased)
 * weather string wins. Ordering is significant and intentionally mirrors the
 * original if/else chain — e.g. the generic `rain` matcher precedes (and thus
 * shadows) `acid rain`, preserving historical behavior.
 */

function RainEffect() {
  return (
    <div className="absolute inset-0 pointer-events-none">
      {Array.from({ length: 50 }).map((_, i) => (
        <div
          key={i}
          className="absolute w-px h-4 bg-blue-300/30 animate-rain"
          style={{
            left: `${cryptoRandom() * 100}%`,
            animationDelay: `${cryptoRandom() * 2}s`,
            animationDuration: `${0.5 + cryptoRandom() * 0.5}s`,
          }}
        />
      ))}
    </div>
  );
}

function MistEffect() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      <div
        className="absolute inset-0 animate-fog-drift"
        style={{
          background:
            'radial-gradient(ellipse at 50% 80%, rgba(200,200,200,0.05) 0%, rgba(150,150,150,0.3) 100%)',
          filter: 'blur(20px)',
          width: '120%',
          left: '-10%',
        }}
      />
    </div>
  );
}

function HeatEffect() {
  return (
    <div
      className="absolute inset-0 pointer-events-none animate-heat-shimmer"
      style={{
        background:
          'linear-gradient(180deg, transparent 0%, rgba(255,200,100,0.1) 50%, transparent 100%)',
      }}
    />
  );
}

function AbyssalGloomEffect() {
  return (
    <div
      className="absolute inset-0 pointer-events-none"
      style={{
        background:
          'radial-gradient(circle at center, rgba(30,0,50,0.3) 10%, rgba(0,0,0,0.7) 90%)',
        mixBlendMode: 'multiply',
      }}
    />
  );
}

function WindEffect({ weather }: { weather: string }) {
  const isGale = weather.includes('gale') || weather.includes('scorching wind');
  return (
    <div className="absolute inset-0 pointer-events-none">
      {Array.from({ length: isGale ? 40 : 15 }).map((_, i) => (
        <div
          key={i}
          className={cn('absolute h-px bg-white/20 animate-wind', isGale ? 'w-16' : 'w-8')}
          style={{
            top: `${cryptoRandom() * 100}%`,
            left: `-20%`,
            animationDelay: `${cryptoRandom() * 4}s`,
            animationDuration: `${0.8 + cryptoRandom() * 1.5}s`,
            opacity: 0.05 + cryptoRandom() * 0.15,
          }}
        />
      ))}
    </div>
  );
}

function EclipseEffect() {
  return (
    <div
      className="absolute inset-0 pointer-events-none"
      style={{
        background: 'radial-gradient(circle at center, transparent 20%, rgba(0,0,0,0.6) 70%)',
      }}
    />
  );
}

function BloodMoonEffect() {
  return (
    <div
      className="absolute inset-0 pointer-events-none animate-pulse-slow"
      style={{
        background: 'radial-gradient(ellipse at top, rgba(139,0,0,0.3) 0%, transparent 80%)',
        boxShadow: 'inset 0 0 100px rgba(139,0,0,0.15)',
      }}
    />
  );
}

function SpookyNightEffect() {
  return (
    <div
      className="absolute inset-0 pointer-events-none animate-pulse-slow"
      style={{
        background: 'radial-gradient(ellipse at top, rgba(75,0,130,0.4) 0%, transparent 80%)',
        boxShadow: 'inset 0 0 100px rgba(75,0,130,0.15)',
      }}
    />
  );
}

function SandstormEffect() {
  return (
    <div
      className="absolute inset-0 pointer-events-none"
      style={{
        background:
          'radial-gradient(ellipse at center, rgba(180,120,50,0.2) 0%, rgba(180,120,50,0.4) 100%)',
        mixBlendMode: 'multiply',
      }}
    />
  );
}

function BlizzardEffect() {
  return (
    <div className="absolute inset-0 pointer-events-none">
      <div className="absolute inset-0 bg-blue-500/5 mix-blend-overlay" />
      {Array.from({ length: 80 }).map((_, i) => (
        <div
          key={i}
          className="absolute w-1 h-1 bg-white/60 rounded-full animate-snow"
          style={{
            left: `${cryptoRandom() * 100}%`,
            top: `${cryptoRandom() * 100}%`,
            animationDelay: `${cryptoRandom() * 3}s`,
            animationDuration: `${2 + cryptoRandom() * 2}s`,
            filter: 'blur(1px)',
          }}
        />
      ))}
    </div>
  );
}

function DenseFogEffect() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      <div
        className="absolute inset-0 animate-fog-drift"
        style={{
          background:
            'radial-gradient(ellipse at 50% 50%, rgba(200,200,200,0.1) 0%, rgba(150,150,150,0.6) 100%)',
          filter: 'blur(40px)',
          width: '120%',
          left: '-10%',
        }}
      />
    </div>
  );
}

function ThunderstormEffect() {
  return (
    <div className="absolute inset-0 pointer-events-none">
      <div className="absolute inset-0 bg-blue-900/20" />
      {/* Lightning strike simulation */}
      <div className="absolute inset-0 animate-pulse-slow opacity-10 bg-white" />
      {Array.from({ length: 60 }).map((_, i) => (
        <div
          key={i}
          className="absolute w-px h-6 bg-blue-200/40 animate-rain"
          style={{
            left: `${cryptoRandom() * 100}%`,
            animationDelay: `${cryptoRandom() * 2}s`,
            animationDuration: `${0.4 + cryptoRandom() * 0.3}s`,
          }}
        />
      ))}
    </div>
  );
}

function AshfallEffect() {
  return (
    <div className="absolute inset-0 pointer-events-none">
      <div className="absolute inset-0 bg-stone-900/10 mix-blend-multiply" />
      {Array.from({ length: 40 }).map((_, i) => (
        <div
          key={i}
          className="absolute w-1 h-1 bg-stone-500/40 animate-ash-fall"
          style={{
            left: `${cryptoRandom() * 100}%`,
            animationDelay: `${cryptoRandom() * 5}s`,
            animationDuration: `${4 + cryptoRandom() * 3}s`,
          }}
        />
      ))}
    </div>
  );
}

function AcidRainEffect() {
  return (
    <div className="absolute inset-0 pointer-events-none">
      <div className="absolute inset-0 bg-lime-900/5 mix-blend-color" />
      {Array.from({ length: 60 }).map((_, i) => (
        <div
          key={i}
          className="absolute w-px h-5 bg-lime-400/30 animate-rain"
          style={{
            left: `${cryptoRandom() * 100}%`,
            animationDelay: `${cryptoRandom() * 2}s`,
            animationDuration: `${0.6 + cryptoRandom() * 0.4}s`,
          }}
        />
      ))}
      {/* Acid sizzle glow on floor */}
      <div className="absolute bottom-0 left-0 right-0 h-1/3 bg-lime-500/5 blur-xl animate-pulse" />
    </div>
  );
}

function ManaSurgeEffect() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      <div
        className="absolute inset-0 opacity-20"
        style={{
          background:
            'linear-gradient(45deg, rgba(255,0,255,0.1), rgba(0,255,255,0.1), rgba(255,0,255,0.1))',
          backgroundSize: '200% 200%',
          animation: 'bronzeShimmer 5s linear infinite',
        }}
      />
      {Array.from({ length: 25 }).map((_, i) => (
        <div
          key={i}
          className="absolute w-1.5 h-1.5 bg-fuchsia-400/40 rounded-full animate-mana-spark"
          style={
            {
              left: `${cryptoRandom() * 100}%`,
              top: `${cryptoRandom() * 100}%`,
              '--tx': `${(cryptoRandom() - 0.5) * 100}px`,
              '--ty': `${(cryptoRandom() - 0.5) * 100}px`,
              animationDelay: `${cryptoRandom() * 4}s`,
            } as CSSProperties & Record<string, string>
          }
        />
      ))}
    </div>
  );
}

interface WeatherEffectEntry {
  match: (weather: string) => boolean;
  render: (weather: string) => JSX.Element;
}

/** Ordered registry; first matching entry wins (see file header). */
const WEATHER_EFFECTS: WeatherEffectEntry[] = [
  { match: (w) => w.includes('rain'), render: () => <RainEffect /> },
  { match: (w) => w === 'mist', render: () => <MistEffect /> },
  {
    match: (w) => w.includes('blazing') || w.includes('sweltering'),
    render: () => <HeatEffect />,
  },
  { match: (w) => w.includes('abyssal gloom'), render: () => <AbyssalGloomEffect /> },
  {
    match: (w) => w.includes('gale') || w.includes('breezy') || w.includes('scorching wind'),
    render: (w) => <WindEffect weather={w} />,
  },
  { match: (w) => w.includes('eclipse'), render: () => <EclipseEffect /> },
  { match: (w) => w.includes('blood moon'), render: () => <BloodMoonEffect /> },
  { match: (w) => w.includes('spooky night'), render: () => <SpookyNightEffect /> },
  { match: (w) => w.includes('sandstorm'), render: () => <SandstormEffect /> },
  { match: (w) => w.includes('blizzard'), render: () => <BlizzardEffect /> },
  { match: (w) => w.includes('dense fog'), render: () => <DenseFogEffect /> },
  { match: (w) => w.includes('thunderstorm'), render: () => <ThunderstormEffect /> },
  { match: (w) => w.includes('ashfall'), render: () => <AshfallEffect /> },
  { match: (w) => w.includes('acid rain'), render: () => <AcidRainEffect /> },
  { match: (w) => w.includes('mana surge'), render: () => <ManaSurgeEffect /> },
];

/** Renders the first weather effect matching `weather`, or nothing. */
export function WeatherOverlay({ weather }: { weather: string }) {
  const weatherLower = weather.toLowerCase();
  const effect = WEATHER_EFFECTS.find((entry) => entry.match(weatherLower));
  return effect ? effect.render(weatherLower) : null;
}
