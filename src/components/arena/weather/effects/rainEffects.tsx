import { cryptoRandom } from '@/utils/cryptoRandom';

/** Rain particle effect overlay. */
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

/** Blood rain particle effect with crimson pooling. */
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

/** Acid rain with sizzling glow on the arena floor. */
export function AcidRainEffect() {
  return (
    <div className="absolute inset-0 pointer-events-none">
      <div className="absolute inset-0 bg-arena-pop/5 mix-blend-color" />
      {Array.from({ length: 60 }).map((_, i) => (
        <div
          key={i}
          className="absolute w-px h-5 bg-arena-pop/30 animate-rain"
          style={{
            left: `${cryptoRandom() * 100}%`,
            animationDelay: `${cryptoRandom() * 2}s`,
            animationDuration: `${0.6 + cryptoRandom() * 0.4}s`,
          }}
        />
      ))}
      {/* Acid sizzle glow on floor */}
      <div className="absolute bottom-0 left-0 right-0 h-1/3 bg-arena-pop/5 blur-xl animate-pulse" />
    </div>
  );
}

/** Ember rain with falling embers and rising smoke. */
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
          className="absolute w-16 h-16 bg-neutral-500/10 rounded-full blur-xl animate-chaotic-drift"
          style={
            {
              left: `${cryptoRandom() * 100}%`,
              bottom: '-10%',
              '--tx': `${(cryptoRandom() - 0.5) * 50}px`,
              '--ty': `-${100 + cryptoRandom() * 100}px`,
              animationDelay: `${cryptoRandom() * 4}s`,
              animationDuration: `${3 + cryptoRandom() * 3}s`,
            } as unknown as import('react').CSSProperties & Record<string, string>
          }
        />
      ))}
    </div>
  );
}
