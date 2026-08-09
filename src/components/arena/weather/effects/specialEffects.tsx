import type { CSSProperties } from 'react';
import { cryptoRandom } from '@/utils/cryptoRandom';

/** Aurora Borealis with dancing colored bands and starfield. */
export function AuroraBorealisEffect() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {/* Deep night sky base */}
      <div className="absolute inset-0 bg-black/30" />
      {/* Dancing aurora bands — green and violet waves */}
      {Array.from({ length: 4 }).map((_, i) => (
        <div
          key={`aurora-${i}`}
          className="absolute inset-x-0 h-1/3 animate-fog-drift"
          style={{
            top: `${5 + i * 12}%`,
            background: `linear-gradient(90deg, transparent 0%, rgba(${i % 2 === 0 ? '0,255,150' : '140,0,255'},0.${8 + i * 2}) 30%, rgba(${i % 2 === 0 ? '0,200,200' : '180,0,255'},0.${10 + i * 2}) 50%, rgba(${i % 2 === 0 ? '0,255,150' : '140,0,255'},0.${8 + i * 2}) 70%, transparent 100%)`,
            filter: 'blur(20px)',
            opacity: 0.6,
            animationDelay: `${i * 1.5}s`,
            animationDuration: `${8 + i * 2}s`,
          }}
        />
      ))}
      {/* Subtle starfield */}
      {Array.from({ length: 25 }).map((_, i) => (
        <div
          key={`star-${i}`}
          className="absolute w-0.5 h-0.5 bg-white/60 rounded-full animate-pulse-slow motion-reduce:animate-none"
          style={{
            left: `${cryptoRandom() * 100}%`,
            top: `${cryptoRandom() * 40}%`,
            animationDelay: `${cryptoRandom() * 4}s`,
          }}
        />
      ))}
    </div>
  );
}

/** Gravity anomaly with floating debris and distortion rings. */
export function GravityAnomalyEffect() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {/* Warped reality tint */}
      <div
        className="absolute inset-0 animate-pulse-slow motion-reduce:animate-none"
        style={{
          background:
            'radial-gradient(ellipse at 50% 50%, rgba(100,50,200,0.15) 0%, rgba(50,0,100,0.08) 50%, transparent 100%)',
        }}
      />
      {/* Floating debris — particles drifting upward (reversed gravity) */}
      {Array.from({ length: 30 }).map((_, i) => (
        <div
          key={`debris-${i}`}
          className="absolute w-1 h-1 bg-neutral-400/60 rounded-sm animate-chaotic-drift"
          style={
            {
              left: `${cryptoRandom() * 100}%`,
              bottom: '0%',
              '--tx': `${(cryptoRandom() - 0.5) * 80}px`,
              '--ty': `-${100 + cryptoRandom() * 120}px`,
              animationDelay: `${cryptoRandom() * 4}s`,
              animationDuration: `${3 + cryptoRandom() * 3}s`,
            } as unknown as CSSProperties & Record<string, string>
          }
        />
      ))}
      {/* Gravitational distortion rings */}
      {Array.from({ length: 3 }).map((_, i) => (
        <div
          key={`ring-${i}`}
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-arena-fame/20 animate-pulse-slow motion-reduce:animate-none"
          style={{
            width: `${100 + i * 80}px`,
            height: `${100 + i * 80}px`,
            animationDelay: `${i * 0.8}s`,
          }}
        />
      ))}
    </div>
  );
}

/** Rainbow with prismatic arc and sparkle particles. */
export function RainbowEffect() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {/* Prismatic arc overlay */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(180deg, transparent 0%, rgba(255,0,0,0.04) 20%, rgba(255,165,0,0.04) 30%, rgba(255,255,0,0.04) 40%, rgba(0,255,0,0.04) 50%, rgba(0,150,255,0.04) 60%, rgba(75,0,130,0.04) 70%, transparent 100%)',
        }}
      />
      {/* Subtle prismatic sparkle particles */}
      {Array.from({ length: 20 }).map((_, i) => (
        <div
          key={`sparkle-${i}`}
          className="absolute w-1 h-1 rounded-full animate-mana-spark"
          style={
            {
              left: `${cryptoRandom() * 100}%`,
              top: `${cryptoRandom() * 60}%`,
              background: `hsl(${cryptoRandom() * 360}, 80%, 70%)`,
              opacity: '0.4',
              '--tx': `${(cryptoRandom() - 0.5) * 40}px`,
              '--ty': `${(cryptoRandom() - 0.5) * 40}px`,
              animationDelay: `${cryptoRandom() * 4}s`,
              animationDuration: `${3 + cryptoRandom() * 3}s`,
            } as unknown as CSSProperties & Record<string, string>
          }
        />
      ))}
      {/* Soft golden glow at the horizon */}
      <div
        className="absolute bottom-0 inset-x-0 h-1/3 animate-pulse-slow motion-reduce:animate-none"
        style={{
          background:
            'radial-gradient(ellipse at 50% 100%, rgba(255,215,0,0.08) 0%, transparent 80%)',
        }}
      />
    </div>
  );
}
