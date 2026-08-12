import { cryptoRandom } from '@/utils/cryptoRandom';

/** Blizzard with heavy snow particles and steel overlay. */
export function BlizzardEffect() {
  return (
    <div className="absolute inset-0 pointer-events-none">
      <div className="absolute inset-0 bg-arena-steel/5 mix-blend-overlay" />
      {Array.from({ length: 80 }).map((_, i) => (
        <div
          key={i}
          className="absolute w-1 h-1 bg-white/60 rounded-full animate-snow motion-reduce:animate-none"
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

/** Hailstorm with fast-falling ice particles. */
export function HailstormEffect() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      <div className="absolute inset-0 bg-arena-pop/5 mix-blend-overlay" />
      {Array.from({ length: 70 }).map((_, i) => (
        <div
          key={i}
          className="absolute w-1 h-1.5 bg-arena-pop/70 animate-hail motion-reduce:animate-none"
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
