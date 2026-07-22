interface IconMedallionProps {
  icon: React.ReactNode;
  className?: string;
}

export function IconMedallion({ icon, className }: IconMedallionProps) {
  return (
    <div
      className={`flex items-center justify-center w-20 h-20 mx-auto relative ${className ?? ''}`}
    >
      <div
        className="absolute inset-0 rounded-full"
        style={{
          background:
            'conic-gradient(from 0deg, rgba(201, 151, 42, 0.5), rgba(201, 151, 42, 0.15), rgba(201, 151, 42, 0.5), rgba(201, 151, 42, 0.15), rgba(201, 151, 42, 0.5))',
          padding: '1px',
        }}
      >
        <div className="w-full h-full rounded-full bg-background" />
      </div>
      <div
        className="relative z-10 flex items-center justify-center w-14 h-14 rounded-full"
        style={{
          background:
            'radial-gradient(ellipse at 35% 35%, rgba(160, 40, 48, 0.95) 0%, #872228 55%, rgba(100, 20, 26, 0.9) 100%)',
          boxShadow:
            '0 4px 16px rgba(135, 34, 40, 0.5), inset 0 1px 0 rgba(255, 200, 200, 0.15), inset 0 -1px 0 rgba(0,0,0,0.3)',
        }}
      >
        {icon}
      </div>
    </div>
  );
}
