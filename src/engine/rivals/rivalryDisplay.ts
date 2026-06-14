/**
 *
 */
export const intensityLabel = (n: number) =>
  n >= 5 ? 'Blood Feud' : n >= 4 ? 'Bitter' : n >= 3 ? 'Heated' : n >= 2 ? 'Tense' : 'Simmering';

/**
 *
 */
export const intensityColor = (n: number) =>
  n >= 4 ? 'text-destructive' : n >= 2 ? 'text-arena-gold' : 'text-primary';

/**
 *
 */
export const intensityBgColor = (n: number) => (n >= 4 ? 'bg-destructive' : 'bg-arena-gold');
