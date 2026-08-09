import { cryptoRandom } from '@/utils/cryptoRandom';

/** Light mist drifting across the arena. */
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

/** Dense fog heavily obscuring the arena. */
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

/** Crimson blood fog with drifting red mist particles. */
export function BloodFogEffect() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {/* Crimson fog base */}
      <div
        className="absolute inset-0 animate-fog-drift"
        style={{
          background:
            'radial-gradient(ellipse at 50% 80%, rgba(120,0,0,0.15) 0%, rgba(80,0,0,0.4) 100%)',
        }}
      />
      {/* Drifting blood-red mist particles */}
      {Array.from({ length: 35 }).map((_, i) => (
        <div
          key={`mist-${i}`}
          className="absolute w-2 h-2 rounded-full animate-fog-drift"
          style={{
            left: `${cryptoRandom() * 100}%`,
            top: `${cryptoRandom() * 100}%`,
            background: `rgba(${100 + cryptoRandom() * 50},0,0,${0.1 + cryptoRandom() * 0.15})`,
            filter: 'blur(8px)',
            animationDelay: `${cryptoRandom() * 5}s`,
            animationDuration: `${6 + cryptoRandom() * 4}s`,
          }}
        />
      ))}
      {/* Ominous red glow pulse */}
      <div
        className="absolute inset-0 animate-pulse-slow motion-reduce:animate-none"
        style={{
          background: 'radial-gradient(ellipse at 50% 50%, rgba(139,0,0,0.1) 0%, transparent 70%)',
        }}
      />
    </div>
  );
}
