import type { CSSProperties } from 'react';
import { cn } from '@/lib/utils';
import { cryptoRandom } from '@/utils/cryptoRandom';

/** Wind streak effect, configurable intensity. */
export function WindEffect({ strong }: { strong: boolean }) {
  return (
    <div className="absolute inset-0 pointer-events-none">
      {Array.from({ length: strong ? 40 : 15 }).map((_, i) => (
        <div
          key={i}
          className={cn('absolute h-px bg-white/20 animate-wind', strong ? 'w-16' : 'w-8')}
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

/** Tornado with swirling funnel, wind streaks, and debris. */
export function TornadoEffect() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {/* Swirling funnel */}
      <div
        className="absolute left-1/2 top-0 -translate-x-1/2 h-full w-2/3 animate-spin-slow opacity-30"
        style={{
          background:
            'conic-gradient(from 0deg at 50% 60%, rgba(120,120,130,0) 0deg, rgba(160,160,170,0.28) 90deg, rgba(120,120,130,0) 180deg, rgba(160,160,170,0.28) 270deg, rgba(120,120,130,0) 360deg)',
          filter: 'blur(8px)',
          clipPath: 'polygon(36% 0, 64% 0, 90% 100%, 10% 100%)',
        }}
      />
      {/* Fast wind streaks */}
      {Array.from({ length: 30 }).map((_, i) => (
        <div
          key={i}
          className="absolute h-px w-20 bg-neutral-300/25 animate-wind"
          style={{
            top: `${cryptoRandom() * 100}%`,
            left: '-20%',
            animationDelay: `${cryptoRandom() * 1.5}s`,
            animationDuration: `${0.5 + cryptoRandom() * 0.6}s`,
          }}
        />
      ))}
      {/* Whipping debris */}
      {Array.from({ length: 25 }).map((_, i) => (
        <div
          key={`d${i}`}
          className="absolute w-1 h-1 bg-neutral-600/60 rounded-sm animate-mana-spark"
          style={
            {
              left: `${30 + cryptoRandom() * 40}%`,
              top: `${cryptoRandom() * 100}%`,
              '--tx': `${(cryptoRandom() - 0.5) * 70}px`,
              '--ty': `${(cryptoRandom() - 0.5) * 70}px`,
              animationDelay: `${cryptoRandom() * 3}s`,
            } as unknown as CSSProperties & Record<string, string>
          }
        />
      ))}
    </div>
  );
}

/** Chaotic winds with bi-directional streaks and swirling vortex. */
export function ChaoticWindsEffect() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {/* Hazy sand atmosphere */}
      <div className="absolute inset-0 bg-arena-gold/10 mix-blend-multiply" />

      {/* Bi-directional wind streaks - left to right */}
      {Array.from({ length: 25 }).map((_, i) => (
        <div
          key={`lr-${i}`}
          className="absolute h-px bg-gradient-to-r from-transparent via-arena-gold/25 to-transparent animate-wind"
          style={{
            top: `${cryptoRandom() * 100}%`,
            left: '-20%',
            width: `${16 + cryptoRandom() * 24}px`,
            animationDelay: `${cryptoRandom() * 3}s`,
            animationDuration: `${0.4 + cryptoRandom() * 0.8}s`,
          }}
        />
      ))}

      {/* Bi-directional wind streaks - right to left (reversed) */}
      {Array.from({ length: 25 }).map((_, i) => (
        <div
          key={`rl-${i}`}
          className="absolute h-px bg-gradient-to-l from-transparent via-neutral-400/20 to-transparent"
          style={{
            top: `${cryptoRandom() * 100}%`,
            right: '-20%',
            width: `${16 + cryptoRandom() * 24}px`,
            animationDelay: `${cryptoRandom() * 3}s`,
            animation: `wind ${0.5 + cryptoRandom() * 0.9}s linear infinite reverse`,
          }}
        />
      ))}

      {/* Swirling vortex hint - subtle center disturbance */}
      <div
        className="absolute left-1/2 top-1/4 -translate-x-1/2 h-1/2 w-1/2 animate-spin-slow opacity-20"
        style={{
          background:
            'conic-gradient(from 0deg at 50% 50%, rgba(180,120,50,0) 0deg, rgba(160,140,100,0.2) 90deg, rgba(180,120,50,0) 180deg, rgba(160,140,100,0.2) 270deg, rgba(180,120,50,0) 360deg)',
          filter: 'blur(12px)',
        }}
      />

      {/* Sand debris particles with chaotic drift */}
      {Array.from({ length: 35 }).map((_, i) => (
        <div
          key={`d-${i}`}
          className="absolute w-0.5 h-0.5 bg-arena-gold/50 rounded-full animate-chaotic-drift"
          style={
            {
              left: `${cryptoRandom() * 100}%`,
              top: `${cryptoRandom() * 100}%`,
              '--tx': `${(cryptoRandom() - 0.5) * 100}px`,
              '--ty': `${(cryptoRandom() - 0.5) * 60}px`,
              animationDelay: `${cryptoRandom() * 3}s`,
              animationDuration: `${2 + cryptoRandom() * 2}s`,
            } as unknown as CSSProperties & Record<string, string>
          }
        />
      ))}
    </div>
  );
}
