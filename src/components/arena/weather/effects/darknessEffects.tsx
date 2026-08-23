/** Eclipse darkness effect with radial shadow. */
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

/** Blood moon with crimson radial glow. */
export function BloodMoonEffect() {
  return (
    <div
      className="absolute inset-0 pointer-events-none animate-pulse-slow motion-reduce:animate-none"
      style={{
        background: 'radial-gradient(ellipse at top, rgba(139,0,0,0.3) 0%, transparent 80%)',
        boxShadow: 'inset 0 0 100px rgba(139,0,0,0.15)',
      }}
    />
  );
}

/** Spooky night with purple radial glow. */
export function SpookyNightEffect() {
  return (
    <div
      className="absolute inset-0 pointer-events-none animate-pulse-slow motion-reduce:animate-none"
      style={{
        background: 'radial-gradient(ellipse at top, rgba(75,0,130,0.4) 0%, transparent 80%)',
        boxShadow: 'inset 0 0 100px rgba(75,0,130,0.15)',
      }}
    />
  );
}

/** Abyssal gloom with supernatural darkness. */
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

/** Cursed miasma with sickening purple fog. */
export function CursedMiasmaEffect() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      <div
        className="absolute inset-0 animate-fog-drift motion-reduce:animate-none"
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
