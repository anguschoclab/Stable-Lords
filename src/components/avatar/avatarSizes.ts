/** Named or pixel size for avatar portraits. */
export type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | number;

/** Pixel dimensions for the named avatar sizes. */
export const AVATAR_SIZE_MAP: Record<Exclude<AvatarSize, number>, number> = {
  xs: 32,
  sm: 48,
  md: 80,
  lg: 128,
  xl: 256,
};
