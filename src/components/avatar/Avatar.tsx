import { useMemo } from 'react';
import type { AvatarData } from '@/types/avatar.types';
import { cn } from '@/lib/utils';
import { AVATAR_SIZE_MAP, type AvatarSize } from './avatarSizes';

/** Props for the layered avatar portrait. */
export interface AvatarProps {
  portrait: AvatarData;
  size?: AvatarSize;
  className?: string;
  animate?: boolean;
}

/** Convert an optional hex tint into a CSS filter string. */
function tintToFilter(tint?: string): string | undefined {
  if (!tint) return undefined;
  // Parse hex into HSL-ish hue rotation. This is intentionally approximate
  // for placeholder art; real pixel-art assets are pre-colored.
  const clean = tint.replace('#', '');
  const r = parseInt(clean.slice(0, 2), 16) / 255;
  const g = parseInt(clean.slice(2, 4), 16) / 255;
  const b = parseInt(clean.slice(4, 6), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  const d = max - min;
  if (d !== 0) {
    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
        break;
      case g:
        h = ((b - r) / d + 2) / 6;
        break;
      case b:
        h = ((r - g) / d + 4) / 6;
        break;
    }
  }
  const hue = Math.round(h * 360);
  return `hue-rotate(${hue}deg) saturate(1.2)`;
}

/**
 * Render a layered avatar portrait as a stack of absolutely positioned images.
 */
export function Avatar({ portrait, size = 'md', className, animate = false }: AvatarProps) {
  const pixelSize = typeof size === 'number' ? size : AVATAR_SIZE_MAP[size];

  const sortedLayers = useMemo(
    () => [...portrait.layers].sort((a, b) => a.z - b.z),
    [portrait.layers]
  );

  return (
    <div
      className={cn(
        'relative inline-block overflow-hidden shrink-0',
        animate && 'animate-avatar-fade-in motion-reduce:animate-none',
        className
      )}
      style={{
        width: pixelSize,
        height: pixelSize,
        imageRendering: 'pixelated',
      }}
      role="img"
      aria-label={`Portrait of ${portrait.entityType}`}
    >
      {sortedLayers.map((layer) => (
        <img
          key={`${layer.category}-${layer.z}-${layer.src}`}
          src={layer.src}
          alt=""
          draggable={false}
          loading="lazy"
          decoding="async"
          className="absolute inset-0 w-full h-full pointer-events-none"
          style={{
            objectFit: 'contain',
            zIndex: layer.z,
            transform: `translate(${layer.offset?.x ?? 0}px, ${layer.offset?.y ?? 0}px)`,
            filter: tintToFilter(layer.tint),
          }}
        />
      ))}
    </div>
  );
}
