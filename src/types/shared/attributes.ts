/**
 * Defines the shape of attributes.
 */
export interface Attributes {
  ST: number; // Strength (3-25)
  CN: number; // Constitution (3-25)
  SZ: number; // Size (3-25)
  WT: number; // Wit (3-25)
  WL: number; // Will (3-25)
  SP: number; // Speed (3-25)
  DF: number; // Deftness (3-25)
}

/**
 * Attribute_keys.
 */
export const ATTRIBUTE_KEYS: (keyof Attributes)[] = ['ST', 'CN', 'SZ', 'WT', 'WL', 'SP', 'DF'];

/**
 * Attribute_labels.
 */
export const ATTRIBUTE_LABELS: Record<keyof Attributes, string> = {
  ST: 'Strength',
  CN: 'Constitution',
  SZ: 'Size',
  WT: 'Wit',
  WL: 'Will',
  SP: 'Speed',
  DF: 'Deftness',
};

/**
 * Attribute_min.
 */
export const ATTRIBUTE_MIN = 3;

/**
 * Attribute_max.
 */
export const ATTRIBUTE_MAX = 25;

/**
 * Attribute_total.
 */
export const ATTRIBUTE_TOTAL = 70;
