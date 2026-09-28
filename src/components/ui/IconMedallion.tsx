interface IconMedallionProps {
  icon: React.ReactNode;
  className?: string;
}

/**
 *
 */
export function IconMedallion({ icon, className }: IconMedallionProps) {
  return (
    <div
      className={`flex items-center justify-center w-20 h-20 mx-auto relative ${className ?? ''}`}
    >
      <div
        className="absolute inset-0 rounded-full"
        style={{
          background:
            'conic-gradient(from 0deg, rgba(var(--gold-glow-rgb), 0.5), rgba(var(--gold-glow-rgb), 0.15), rgba(var(--gold-glow-rgb), 0.5), rgba(var(--gold-glow-rgb), 0.15), rgba(var(--gold-glow-rgb), 0.5))',
          padding: '1px',
        }}
      >
        <div className="w-full h-full rounded-full bg-background" />
      </div>
      <div
        className="relative z-10 flex items-center justify-center w-14 h-14 rounded-full"
        style={{
          background:
            'radial-gradient(ellipse at 35% 35%, rgba(var(--blood-mid-rgb), 0.95) 0%, hsl(var(--primary)) 55%, rgba(var(--blood-deep-rgb), 0.9) 100%)',
          boxShadow:
            '0 4px 16px rgba(var(--blood-glow-rgb), 0.5), inset 0 1px 0 rgba(var(--blush-rgb), 0.15), inset 0 -1px 0 rgba(var(--void-rgb), 0.3)',
        }}
      >
        {icon}
      </div>
    </div>
  );
}
