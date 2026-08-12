import type { CSSProperties } from 'react';
import { cryptoRandom } from '@/utils/cryptoRandom';

/** Heat shimmer effect overlay. */
export function HeatEffect() {
  return (
    <div
      className="absolute inset-0 pointer-events-none animate-heat-shimmer motion-reduce:animate-none"
      style={{
        background:
          'linear-gradient(180deg, transparent 0%, rgba(255,200,100,0.1) 50%, transparent 100%)',
      }}
    />
  );
}

/** Solar flare with blinding radial light. */
export function SolarFlareEffect() {
  return (
    <div
      className="absolute inset-0 pointer-events-none animate-pulse-slow motion-reduce:animate-none"
      style={{
        background:
          'radial-gradient(ellipse at top, rgba(255,240,180,0.25) 0%, rgba(255,200,80,0.08) 40%, transparent 75%)',
        mixBlendMode: 'screen',
      }}
    />
  );
}

/** Scorching wind with hot haze and wind streaks. */
export function ScorchingWindEffect() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {/* Warm haze */}
      <div
        className="absolute inset-0 animate-heat-shimmer motion-reduce:animate-none"
        style={{
          background:
            'linear-gradient(180deg, rgba(255,170,80,0.06) 0%, rgba(255,140,60,0.12) 60%, transparent 100%)',
        }}
      />
      {/* Hot wind streaks */}
      {Array.from({ length: 22 }).map((_, i) => (
        <div
          key={i}
          className="absolute h-px w-24 bg-gradient-to-r from-transparent via-arena-gold/30 to-transparent animate-wind motion-reduce:animate-none"
          style={{
            top: `${cryptoRandom() * 100}%`,
            left: '-20%',
            animationDelay: `${cryptoRandom() * 2}s`,
            animationDuration: `${0.7 + cryptoRandom() * 0.8}s`,
          }}
        />
      ))}
    </div>
  );
}

/** Mirage with heat ripples and shimmering particles. */
export function MirageEffect() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {/* Intense heat haze base */}
      <div
        className="absolute inset-0 animate-heat-shimmer motion-reduce:animate-none"
        style={{
          background:
            'linear-gradient(180deg, rgba(255,200,100,0.15) 0%, rgba(255,180,80,0.2) 40%, rgba(255,160,60,0.1) 70%, transparent 100%)',
        }}
      />
      {/* Rippling illusion layers — distorted horizontal bands */}
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={`ripple-${i}`}
          className="absolute inset-x-0 h-4 animate-heat-shimmer motion-reduce:animate-none"
          style={{
            top: `${30 + i * 10}%`,
            background: `linear-gradient(90deg, transparent 0%, rgba(255,200,100,0.${10 + i * 2}) 50%, transparent 100%)`,
            filter: 'blur(4px)',
            animationDelay: `${i * 0.3}s`,
            animationDuration: `${2 + i * 0.5}s`,
          }}
        />
      ))}
      {/* Shimmering heat particles rising */}
      {Array.from({ length: 20 }).map((_, i) => (
        <div
          key={`shimmer-${i}`}
          className="absolute w-1 h-1 bg-arena-gold/30 rounded-full animate-chaotic-drift motion-reduce:animate-none"
          style={
            {
              left: `${cryptoRandom() * 100}%`,
              bottom: '0%',
              '--tx': `${(cryptoRandom() - 0.5) * 30}px`,
              '--ty': `-${80 + cryptoRandom() * 60}px`,
              animationDelay: `${cryptoRandom() * 3}s`,
              animationDuration: `${2 + cryptoRandom() * 2}s`,
            } as unknown as CSSProperties & Record<string, string>
          }
        />
      ))}
    </div>
  );
}

/** Wildfire smoke with billowing clouds and ember sparks. */
export function WildfireSmokeEffect() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {/* Dark smoky haze */}
      <div className="absolute inset-0 bg-neutral-900/30 mix-blend-multiply" />
      {/* Billowing smoke clouds — large, slow, rising */}
      {Array.from({ length: 12 }).map((_, i) => (
        <div
          key={`smoke-${i}`}
          className="absolute rounded-full blur-2xl animate-chaotic-drift motion-reduce:animate-none"
          style={
            {
              left: `${cryptoRandom() * 100}%`,
              bottom: '-15%',
              width: `${80 + cryptoRandom() * 60}px`,
              height: `${80 + cryptoRandom() * 60}px`,
              background: `rgba(${60 + cryptoRandom() * 40},${40 + cryptoRandom() * 30},${30 + cryptoRandom() * 20},${0.15 + cryptoRandom() * 0.1})`,
              '--tx': `${(cryptoRandom() - 0.5) * 60}px`,
              '--ty': `-${120 + cryptoRandom() * 80}px`,
              animationDelay: `${cryptoRandom() * 5}s`,
              animationDuration: `${4 + cryptoRandom() * 4}s`,
            } as unknown as CSSProperties & Record<string, string>
          }
        />
      ))}
      {/* Ember sparks within the smoke */}
      {Array.from({ length: 15 }).map((_, i) => (
        <div
          key={`spark-${i}`}
          className="absolute w-0.5 h-0.5 bg-arena-blood/80 rounded-full animate-chaotic-drift motion-reduce:animate-none"
          style={
            {
              left: `${cryptoRandom() * 100}%`,
              bottom: '0%',
              '--tx': `${(cryptoRandom() - 0.5) * 40}px`,
              '--ty': `-${80 + cryptoRandom() * 60}px`,
              animationDelay: `${cryptoRandom() * 3}s`,
              animationDuration: `${2 + cryptoRandom() * 2}s`,
            } as unknown as CSSProperties & Record<string, string>
          }
        />
      ))}
    </div>
  );
}
