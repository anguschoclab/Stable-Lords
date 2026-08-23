import type { CSSProperties } from 'react';
import { cryptoRandom } from '@/utils/cryptoRandom';

/** Thunderstorm with rain, lightning flashes, and darkening. */
export function ThunderstormEffect() {
  return (
    <div className="absolute inset-0 pointer-events-none">
      <div className="absolute inset-0 bg-arena-steel/20" />
      {/* Lightning strike simulation */}
      <div className="absolute inset-0 animate-pulse-slow motion-reduce:animate-none opacity-10 bg-white" />
      {Array.from({ length: 60 }).map((_, i) => (
        <div
          key={i}
          className="absolute w-px h-6 bg-arena-steel/40 animate-rain motion-reduce:animate-none"
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

/** Arcane storm with reality-warping sky and crackling sparks. */
export function ArcaneStormEffect() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {/* Reality-warping sky */}
      <div
        className="absolute inset-0 opacity-25"
        style={{
          background:
            'linear-gradient(120deg, rgba(80,0,200,0.15), rgba(0,200,255,0.12), rgba(160,0,255,0.15))',
          backgroundSize: '200% 200%',
          animation: 'bronzeShimmer 4s linear infinite',
        }}
      />
      {/* Lightning flashes */}
      <div className="absolute inset-0 bg-primary/10 animate-pulse motion-reduce:animate-none" />
      {/* Crackling arcane sparks */}
      {Array.from({ length: 35 }).map((_, i) => (
        <div
          key={i}
          className="absolute w-1 h-1 bg-arena-pop/70 rounded-full animate-mana-spark motion-reduce:animate-none"
          style={
            {
              left: `${cryptoRandom() * 100}%`,
              top: `${cryptoRandom() * 100}%`,
              '--tx': `${(cryptoRandom() - 0.5) * 140}px`,
              '--ty': `${(cryptoRandom() - 0.5) * 140}px`,
              animationDelay: `${cryptoRandom() * 3}s`,
            } as unknown as CSSProperties & Record<string, string>
          }
        />
      ))}
    </div>
  );
}

/** Aether storm — faster, more chaotic than Arcane Storm with prismatic particles. */
export function AetherStormEffect() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {/* Reality-warping prismatic background - faster and more chaotic than Arcane Storm */}
      <div
        className="absolute inset-0 opacity-30"
        style={{
          background:
            'linear-gradient(135deg, rgba(0,255,255,0.15), rgba(139,0,255,0.12), rgba(255,215,0,0.15), rgba(0,200,255,0.1))',
          backgroundSize: '300% 300%',
          animation: 'bronzeShimmer 3s linear infinite',
        }}
      />
      {/* Energy pulses - faster flash rate */}
      <div
        className="absolute inset-0 bg-arena-pop/15 animate-pulse motion-reduce:animate-none"
        style={{ animationDuration: '1.5s' }}
      />
      {/* Aether particles - more numerous and chaotic than Arcane Storm */}
      {Array.from({ length: 40 }).map((_, i) => (
        <div
          key={i}
          className="absolute w-1.5 h-1.5 bg-arena-pop/50 rounded-full animate-mana-spark motion-reduce:animate-none"
          style={
            {
              left: `${cryptoRandom() * 100}%`,
              top: `${cryptoRandom() * 100}%`,
              '--tx': `${(cryptoRandom() - 0.5) * 160}px`,
              '--ty': `${(cryptoRandom() - 0.5) * 160}px`,
              animationDelay: `${cryptoRandom() * 4}s`,
              animationDuration: `${2 + cryptoRandom() * 2}s`,
            } as unknown as CSSProperties & Record<string, string>
          }
        />
      ))}
      {/* Violet secondary particles for prismatic effect */}
      {Array.from({ length: 20 }).map((_, i) => (
        <div
          key={`v-${i}`}
          className="absolute w-1 h-1 bg-primary/40 rounded-full animate-mana-spark motion-reduce:animate-none"
          style={
            {
              left: `${cryptoRandom() * 100}%`,
              top: `${cryptoRandom() * 100}%`,
              '--tx': `${(cryptoRandom() - 0.5) * 120}px`,
              '--ty': `${(cryptoRandom() - 0.5) * 120}px`,
              animationDelay: `${cryptoRandom() * 3}s`,
              animationDuration: `${2.5 + cryptoRandom() * 2}s`,
            } as unknown as CSSProperties & Record<string, string>
          }
        />
      ))}
    </div>
  );
}

/** Meteor shower with streaking falling stars. */
export function MeteorShowerEffect() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {Array.from({ length: 30 }).map((_, i) => (
        <div
          key={i}
          className="absolute w-px h-8 bg-gradient-to-b from-orange-300/60 to-transparent animate-rain motion-reduce:animate-none"
          style={{
            left: `${cryptoRandom() * 100}%`,
            top: '-10%',
            transform: 'rotate(18deg)',
            animationDelay: `${cryptoRandom() * 3}s`,
            animationDuration: `${0.6 + cryptoRandom() * 0.6}s`,
          }}
        />
      ))}
    </div>
  );
}
