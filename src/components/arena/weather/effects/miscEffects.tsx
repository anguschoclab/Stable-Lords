import type { CSSProperties } from 'react';
import { cryptoRandom } from '@/utils/cryptoRandom';

/** Sandstorm with sandy haze and multiply blend. */
export function SandstormEffect() {
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

/** Ashfall with falling ash particles and darkening haze. */
export function AshfallEffect() {
  return (
    <div className="absolute inset-0 pointer-events-none">
      <div className="absolute inset-0 bg-neutral-900/10 mix-blend-multiply" />
      {Array.from({ length: 40 }).map((_, i) => (
        <div
          key={i}
          className="absolute w-1 h-1 bg-neutral-500/40 animate-ash-fall"
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

/** Mana surge with shimmering magical energy and sparks. */
export function ManaSurgeEffect() {
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
          className="absolute w-1.5 h-1.5 bg-arena-pop/40 rounded-full animate-mana-spark"
          style={
            {
              left: `${cryptoRandom() * 100}%`,
              top: `${cryptoRandom() * 100}%`,
              '--tx': `${(cryptoRandom() - 0.5) * 100}px`,
              '--ty': `${(cryptoRandom() - 0.5) * 100}px`,
              animationDelay: `${cryptoRandom() * 4}s`,
            } as unknown as CSSProperties & Record<string, string>
          }
        />
      ))}
    </div>
  );
}

/** Locust swarm with buzzing insects and golden haze. */
export function LocustSwarmEffect() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      <div className="absolute inset-0 bg-arena-gold/10 mix-blend-multiply" />
      {Array.from({ length: 60 }).map((_, i) => (
        <div
          key={i}
          className="absolute w-1 h-1 bg-neutral-800/70 rounded-full animate-mana-spark"
          style={
            {
              left: `${cryptoRandom() * 100}%`,
              top: `${cryptoRandom() * 100}%`,
              '--tx': `${(cryptoRandom() - 0.5) * 80}px`,
              '--ty': `${(cryptoRandom() - 0.5) * 80}px`,
              animationDelay: `${cryptoRandom() * 3}s`,
            } as unknown as CSSProperties & Record<string, string>
          }
        />
      ))}
    </div>
  );
}
