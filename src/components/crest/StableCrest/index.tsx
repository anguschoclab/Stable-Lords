import React, { useMemo } from 'react';
import type { CrestData, ShieldShape } from '@/types/crest.types';
import { getFieldPattern } from '../fieldPatterns';
import { ChargeComponent } from './components/ChargeComponent';
import { Mantling } from './components/Mantling';
import { Helmet } from './components/Helmet';

interface StableCrestProps {
  crest: CrestData;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | number;
  showMantling?: boolean;
  showHelmet?: boolean;
  animate?: boolean;
  className?: string;
  selected?: boolean;
  showTooltip?: boolean;
  showGenerationBadge?: boolean;
}

const SIZE_MAP = {
  xs: 16,
  sm: 24,
  md: 40,
  lg: 64,
  xl: 120,
};

const SHIELD_PATHS: Record<ShieldShape, string> = {
  heater: 'M10,10 h80 v40 c0,25 -20,40 -40,40 s-40,-15 -40,-40 z',
  french: 'M10,15 h80 c0,30 -20,50 -40,55 s-40,-25 -40,-55 z',
  swiss: 'M15,10 h70 v50 c0,20 -15,30 -35,30 s-35,-10 -35,-30 z',
  spanish:
    'M10,10 h80 c0,20 -10,35 -20,45 l20,25 l-40,-25 l-40,25 l20,-25 c-10,-10 -20,-25 -20,-45 z',
  lozenge: 'M50,10 l40,40 l-40,40 l-40,-40 z',
};

/**
 *
 */
export function StableCrest({
  crest,
  size = 'md',
  showMantling,
  showHelmet,
  animate = false,
  className = '',
  selected = false,
  showTooltip = true,
  showGenerationBadge = true,
}: StableCrestProps): React.ReactElement {
  const pixelSize = typeof size === 'number' ? size : SIZE_MAP[size];
  const shouldShowMantling = showMantling ?? pixelSize >= 64;
  const shouldShowHelmet = showHelmet ?? pixelSize >= 64;
  const shieldPath = SHIELD_PATHS[crest.shieldShape] || SHIELD_PATHS.heater;
  const metalColor = crest.metalColor === 'gold' ? '#D4AF37' : '#C0C0C0';
  const glowColor =
    crest.metalColor === 'gold' ? 'rgba(212, 175, 55, 0.3)' : 'rgba(192, 192, 192, 0.25)';

  const glowStyle: React.CSSProperties =
    pixelSize >= 64
      ? {
          filter: `drop-shadow(0 0 ${pixelSize * 0.15}px ${glowColor})`,
        }
      : {};

  const containerStyle: React.CSSProperties = {
    width: pixelSize,
    height: pixelSize,
    display: 'inline-block',
    position: 'relative',
    transition: 'transform 200ms ease-out, filter 200ms ease-out',
    willChange: 'transform',
    ...glowStyle,
    ...(animate && {
      animation: 'crestFadeIn 0.3s ease-out',
    }),
  };

  const heraldicDesc = useMemo(() => {
    const metal = crest.metalColor === 'gold' ? 'Or' : 'Argent';
    const field = crest.fieldType === 'solid' ? '' : ` ${crest.fieldType}`;
    const charge =
      crest.charge.count > 1 ? `${crest.charge.count} ${crest.charge.name}s` : crest.charge.name;
    return `${metal}${field} with ${charge}`;
  }, [crest]);

  const hasGeneration = showGenerationBadge && crest.generation && crest.generation > 0;

  return (
    <div
      className={`stable-crest ${className} ${selected ? 'ring-2 ring-accent/50 rounded-none' : ''} group`}
      style={containerStyle}
      title={showTooltip ? heraldicDesc : undefined}
    >
      <div className="w-full h-full transition-transform duration-200 ease-out group-hover:scale-105">
        <svg
          viewBox="0 0 100 100"
          width={pixelSize}
          height={pixelSize}
          aria-label={`Stable crest: ${crest.charge.name} on ${crest.fieldType} field`}
          className="transition-all duration-200 group-hover:drop-shadow-lg"
        >
          <defs>
            <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="1" dy="1" stdDeviation="1" floodOpacity="0.3" />
            </filter>
          </defs>

          {shouldShowMantling && <Mantling color={crest.primaryColor} />}
          {shouldShowHelmet && <Helmet metal={metalColor} />}

          <g filter="url(#shadow)">
            <clipPath id="shieldClip">
              <path d={shieldPath} />
            </clipPath>

            <g clipPath="url(#shieldClip)">
              {getFieldPattern(crest.fieldType, {
                primary: crest.primaryColor,
                secondary: crest.secondaryColor,
                metal: metalColor,
              })}
            </g>

            <path d={shieldPath} fill="none" stroke={metalColor} strokeWidth="3" />

            <clipPath id="chargeClip">
              <path d={shieldPath} />
            </clipPath>
            <g clipPath="url(#chargeClip)">
              <ChargeComponent charge={crest.charge} metal={metalColor} />
            </g>
          </g>
        </svg>
      </div>

      {animate && (
        <style>{`
          @keyframes crestFadeIn {
            from { opacity: 0; transform: scale(0.9); }
            to { opacity: 1; transform: scale(1); }
          }
        `}</style>
      )}

      {hasGeneration && (
        <div
          className="absolute -bottom-1 -right-1 text-[8px] font-black px-1 py-0.5 rounded-none bg-black/80 border border-accent/30 text-accent/80"
          style={{ fontSize: Math.max(8, pixelSize * 0.15) }}
        >
          G{crest.generation}
        </div>
      )}
    </div>
  );
}

export { SIZE_MAP };
