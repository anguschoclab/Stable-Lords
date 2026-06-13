import type { CSSProperties } from 'react';
import { cn } from '@/lib/utils';
import { cryptoRandom } from '@/utils/cryptoRandom';

export function RainEffect() {
  return (
    <div className="absolute inset-0 pointer-events-none">
      {Array.from({ length: 50 }).map((_, i) => (
        <div
          key={i}
          className="absolute w-px h-4 bg-primary/30 animate-rain"
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

export function BloodRainEffect() {
  return (
    <div className="absolute inset-0 pointer-events-none">
      {Array.from({ length: 55 }).map((_, i) => (
        <div
          key={i}
          className="absolute w-px h-4 bg-arena-blood/40 animate-rain"
          style={{
            left: `${cryptoRandom() * 100}%`,
            animationDelay: `${cryptoRandom() * 2}s`,
            animationDuration: `${0.5 + cryptoRandom() * 0.5}s`,
          }}
        />
      ))}
      {/* Crimson pooling on the sand */}
      <div className="absolute bottom-0 left-0 right-0 h-1/3 bg-arena-blood/10 blur-xl" />
    </div>
  );
}

export function MistEffect() {
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

export function HeatEffect() {
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

export function SolarFlareEffect() {
  return (
    <div
      className="absolute inset-0 pointer-events-none animate-pulse-slow"
      style={{
        background:
          'radial-gradient(ellipse at top, rgba(255,240,180,0.25) 0%, rgba(255,200,80,0.08) 40%, transparent 75%)',
        mixBlendMode: 'screen',
      }}
    />
  );
}

export function AbyssalGloomEffect() {
  return (
    <div
      className="absolute inset-0 pointer-events-none"
      style={{
        background: 'radial-gradient(circle at center, rgba(30,0,50,0.3) 10%, rgba(0,0,0,0.7) 90%)',
        mixBlendMode: 'multiply',
      }}
    />
  );
}

export function CursedMiasmaEffect() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      <div
        className="absolute inset-0 animate-fog-drift"
        style={{
          background:
            'radial-gradient(ellipse at 50% 80%, rgba(120,40,160,0.12) 0%, rgba(80,20,110,0.45) 100%)',
          filter: 'blur(30px)',
          width: '120%',
          left: '-10%',
        }}
      />
    </div>
  );
}

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

export function EclipseEffect() {
  return (
    <div
      className="absolute inset-0 pointer-events-none"
      style={{
        background: 'radial-gradient(circle at center, transparent 20%, rgba(0,0,0,0.6) 70%)',
      }}
    />
  );
}

export function BloodMoonEffect() {
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

export function SpookyNightEffect() {
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

export function BlizzardEffect() {
  return (
    <div className="absolute inset-0 pointer-events-none">
      <div className="absolute inset-0 bg-arena-steel/5 mix-blend-overlay" />
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

export function DenseFogEffect() {
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

export function ThunderstormEffect() {
  return (
    <div className="absolute inset-0 pointer-events-none">
      <div className="absolute inset-0 bg-arena-steel/20" />
      {/* Lightning strike simulation */}
      <div className="absolute inset-0 animate-pulse-slow opacity-10 bg-white" />
      {Array.from({ length: 60 }).map((_, i) => (
        <div
          key={i}
          className="absolute w-px h-6 bg-arena-steel/40 animate-rain"
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

export function AshfallEffect() {
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

export function MeteorShowerEffect() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {Array.from({ length: 30 }).map((_, i) => (
        <div
          key={i}
          className="absolute w-px h-8 bg-gradient-to-b from-orange-300/60 to-transparent animate-rain"
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

export function AcidRainEffect() {
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

export function LocustSwarmEffect() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      <div className="absolute inset-0 bg-amber-950/10 mix-blend-multiply" />
      {Array.from({ length: 60 }).map((_, i) => (
        <div
          key={i}
          className="absolute w-1 h-1 bg-stone-800/70 rounded-full animate-mana-spark"
          style={
            {
              left: `${cryptoRandom() * 100}%`,
              top: `${cryptoRandom() * 100}%`,
              '--tx': `${(cryptoRandom() - 0.5) * 80}px`,
              '--ty': `${(cryptoRandom() - 0.5) * 80}px`,
              animationDelay: `${cryptoRandom() * 3}s`,
            } as CSSProperties & Record<string, string>
          }
        />
      ))}
    </div>
  );
}

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
          className="absolute h-px w-20 bg-stone-300/25 animate-wind"
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
          className="absolute w-1 h-1 bg-stone-600/60 rounded-sm animate-mana-spark"
          style={
            {
              left: `${30 + cryptoRandom() * 40}%`,
              top: `${cryptoRandom() * 100}%`,
              '--tx': `${(cryptoRandom() - 0.5) * 70}px`,
              '--ty': `${(cryptoRandom() - 0.5) * 70}px`,
              animationDelay: `${cryptoRandom() * 3}s`,
            } as CSSProperties & Record<string, string>
          }
        />
      ))}
    </div>
  );
}

export function ScorchingWindEffect() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {/* Warm haze */}
      <div
        className="absolute inset-0 animate-heat-shimmer"
        style={{
          background:
            'linear-gradient(180deg, rgba(255,170,80,0.06) 0%, rgba(255,140,60,0.12) 60%, transparent 100%)',
        }}
      />
      {/* Hot wind streaks */}
      {Array.from({ length: 22 }).map((_, i) => (
        <div
          key={i}
          className="absolute h-px w-24 bg-gradient-to-r from-transparent via-amber-300/30 to-transparent animate-wind"
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

export function HailstormEffect() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      <div className="absolute inset-0 bg-arena-pop/5 mix-blend-overlay" />
      {Array.from({ length: 70 }).map((_, i) => (
        <div
          key={i}
          className="absolute w-1 h-1.5 bg-arena-pop/70 animate-hail"
          style={{
            left: `${cryptoRandom() * 100}%`,
            top: '-5%',
            animationDelay: `${cryptoRandom() * 1.2}s`,
            animationDuration: `${0.35 + cryptoRandom() * 0.3}s`,
          }}
        />
      ))}
    </div>
  );
}

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
      <div className="absolute inset-0 bg-primary/10 animate-pulse" />
      {/* Crackling arcane sparks */}
      {Array.from({ length: 35 }).map((_, i) => (
        <div
          key={i}
          className="absolute w-1 h-1 bg-arena-pop/70 rounded-full animate-mana-spark"
          style={
            {
              left: `${cryptoRandom() * 100}%`,
              top: `${cryptoRandom() * 100}%`,
              '--tx': `${(cryptoRandom() - 0.5) * 140}px`,
              '--ty': `${(cryptoRandom() - 0.5) * 140}px`,
              animationDelay: `${cryptoRandom() * 3}s`,
            } as CSSProperties & Record<string, string>
          }
        />
      ))}
    </div>
  );
}

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
        className="absolute inset-0 bg-arena-pop/15 animate-pulse"
        style={{ animationDuration: '1.5s' }}
      />
      {/* Aether particles - more numerous and chaotic than Arcane Storm */}
      {Array.from({ length: 40 }).map((_, i) => (
        <div
          key={i}
          className="absolute w-1.5 h-1.5 bg-arena-pop/50 rounded-full animate-mana-spark"
          style={
            {
              left: `${cryptoRandom() * 100}%`,
              top: `${cryptoRandom() * 100}%`,
              '--tx': `${(cryptoRandom() - 0.5) * 160}px`,
              '--ty': `${(cryptoRandom() - 0.5) * 160}px`,
              animationDelay: `${cryptoRandom() * 4}s`,
              animationDuration: `${2 + cryptoRandom() * 2}s`,
            } as CSSProperties & Record<string, string>
          }
        />
      ))}
      {/* Violet secondary particles for prismatic effect */}
      {Array.from({ length: 20 }).map((_, i) => (
        <div
          key={`v-${i}`}
          className="absolute w-1 h-1 bg-primary/40 rounded-full animate-mana-spark"
          style={
            {
              left: `${cryptoRandom() * 100}%`,
              top: `${cryptoRandom() * 100}%`,
              '--tx': `${(cryptoRandom() - 0.5) * 120}px`,
              '--ty': `${(cryptoRandom() - 0.5) * 120}px`,
              animationDelay: `${cryptoRandom() * 3}s`,
              animationDuration: `${2.5 + cryptoRandom() * 2}s`,
            } as CSSProperties & Record<string, string>
          }
        />
      ))}
    </div>
  );
}

export function ChaoticWindsEffect() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {/* Hazy sand atmosphere */}
      <div className="absolute inset-0 bg-amber-900/10 mix-blend-multiply" />

      {/* Bi-directional wind streaks - left to right */}
      {Array.from({ length: 25 }).map((_, i) => (
        <div
          key={`lr-${i}`}
          className="absolute h-px bg-gradient-to-r from-transparent via-amber-400/25 to-transparent animate-wind"
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
          className="absolute h-px bg-gradient-to-l from-transparent via-stone-400/20 to-transparent"
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
          className="absolute w-0.5 h-0.5 bg-amber-600/50 rounded-full animate-chaotic-drift"
          style={
            {
              left: `${cryptoRandom() * 100}%`,
              top: `${cryptoRandom() * 100}%`,
              '--tx': `${(cryptoRandom() - 0.5) * 100}px`,
              '--ty': `${(cryptoRandom() - 0.5) * 60}px`,
              animationDelay: `${cryptoRandom() * 3}s`,
              animationDuration: `${2 + cryptoRandom() * 2}s`,
            } as CSSProperties & Record<string, string>
          }
        />
      ))}
    </div>
  );
}

export function EmberRainEffect() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {/* Dark reddish-orange haze */}
      <div className="absolute inset-0 bg-arena-blood/20 mix-blend-multiply" />
      {/* Falling embers */}
      {Array.from({ length: 60 }).map((_, i) => (
        <div
          key={`ember-${i}`}
          className="absolute w-1 h-1 bg-arena-blood rounded-full animate-hail drop-shadow-[0_0_4px_rgba(251,146,60,0.8)]"
          style={{
            left: `${cryptoRandom() * 100}%`,
            top: '-5%',
            animationDelay: `${cryptoRandom() * 2}s`,
            animationDuration: `${1.5 + cryptoRandom() * 2}s`,
            opacity: 0.6 + cryptoRandom() * 0.4,
          }}
        />
      ))}
      {/* Rising heat distortion/smoke */}
      {Array.from({ length: 15 }).map((_, i) => (
        <div
          key={`smoke-${i}`}
          className="absolute w-16 h-16 bg-stone-500/10 rounded-full blur-xl animate-chaotic-drift"
          style={
            {
              left: `${cryptoRandom() * 100}%`,
              bottom: '-10%',
              '--tx': `${(cryptoRandom() - 0.5) * 50}px`,
              '--ty': `-${100 + cryptoRandom() * 100}px`,
              animationDelay: `${cryptoRandom() * 4}s`,
              animationDuration: `${3 + cryptoRandom() * 3}s`,
            } as CSSProperties & Record<string, string>
          }
        />
      ))}
    </div>
  );
}
