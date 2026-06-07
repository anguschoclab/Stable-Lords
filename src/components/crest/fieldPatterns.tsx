import React from 'react';
import type { FieldType } from '@/types/crest.types';

interface FieldColors {
  primary: string;
  secondary?: string;
  metal: string;
}

type FieldPatternRenderer = (colors: FieldColors) => React.ReactNode;

const FIELD_PATTERNS: Record<FieldType, FieldPatternRenderer> = {
  solid: ({ primary }) => <rect x="0" y="0" width="100" height="100" fill={primary} />,

  fess: ({ primary, secondary = primary }) => (
    <>
      <rect x="0" y="0" width="100" height="35" fill={primary} />
      <rect x="0" y="35" width="100" height="30" fill={secondary} />
      <rect x="0" y="65" width="100" height="35" fill={primary} />
    </>
  ),

  pale: ({ primary, secondary = primary }) => (
    <>
      <rect x="0" y="0" width="35" height="100" fill={primary} />
      <rect x="35" y="0" width="30" height="100" fill={secondary} />
      <rect x="65" y="0" width="35" height="100" fill={primary} />
    </>
  ),

  bend: ({ primary, secondary = primary }) => (
    <svg viewBox="0 0 100 100" preserveAspectRatio="none">
      <polygon points="0,0 30,0 100,70 100,100 70,100 0,30" fill={primary} />
      <polygon
        points="30,0 100,70 100,100 70,100 0,30 0,0"
        fill={secondary}
        transform="translate(10,-10)"
      />
    </svg>
  ),

  chevron: ({ primary, secondary = primary }) => (
    <>
      <polygon points="0,0 50,35 100,0 100,15 50,50 0,15" fill={primary} />
      <polygon points="0,15 50,50 100,15 100,100 0,100" fill={secondary} />
    </>
  ),

  cross: ({ primary, secondary = primary, metal }) => (
    <>
      <rect x="0" y="0" width="35" height="35" fill={primary} />
      <rect x="65" y="0" width="35" height="35" fill={primary} />
      <rect x="0" y="65" width="35" height="35" fill={primary} />
      <rect x="65" y="65" width="35" height="35" fill={primary} />
      <rect x="35" y="0" width="30" height="35" fill={secondary} />
      <rect x="35" y="65" width="30" height="35" fill={secondary} />
      <rect x="0" y="35" width="35" height="30" fill={secondary} />
      <rect x="65" y="35" width="35" height="30" fill={secondary} />
      <rect x="35" y="35" width="30" height="30" fill={metal} />
    </>
  ),

  saltire: ({ primary, secondary = primary }) => (
    <>
      <polygon
        points="0,0 25,0 50,25 75,0 100,0 100,25 75,50 100,75 100,100 75,100 50,75 25,100 0,100 0,75 25,50 0,25"
        fill={primary}
      />
      <polygon
        points="25,0 50,25 75,0 100,25 75,50 100,75 75,100 50,75 25,100 0,75 25,50 0,25"
        fill={secondary}
      />
    </>
  ),

  'per-pale': ({ primary, secondary = primary }) => (
    <>
      <rect x="0" y="0" width="50" height="100" fill={primary} />
      <rect x="50" y="0" width="50" height="100" fill={secondary} />
    </>
  ),

  'per-fess': ({ primary, secondary = primary }) => (
    <>
      <rect x="0" y="0" width="100" height="50" fill={primary} />
      <rect x="0" y="50" width="100" height="50" fill={secondary} />
    </>
  ),

  gyronny: ({ primary, secondary = primary }) => (
    <>
      <polygon points="50,0 100,0 100,50 50,50" fill={primary} />
      <polygon points="50,0 50,50 0,50 0,0" fill={secondary} />
      <polygon points="0,50 50,50 50,100 0,100" fill={primary} />
      <polygon points="50,50 100,50 100,100 50,100" fill={secondary} />
    </>
  ),

  'bend-sinister': ({ primary, secondary = primary }) => (
    <svg viewBox="0 0 100 100" preserveAspectRatio="none">
      <polygon points="100,0 70,0 0,70 0,100 30,100 100,30" fill={primary} />
      <polygon
        points="70,0 0,70 0,100 30,100 100,30 100,0"
        fill={secondary}
        transform="translate(-10,10)"
      />
    </svg>
  ),

  'chevron-inverted': ({ primary, secondary = primary }) => (
    <>
      <polygon points="0,0 100,0 100,85 50,50 0,85" fill={primary} />
      <polygon points="0,85 50,50 100,85 100,100 0,100" fill={secondary} />
    </>
  ),

  'pale-environ': ({ primary, secondary = primary }) => (
    <>
      <rect x="0" y="0" width="25" height="100" fill={primary} />
      <rect x="25" y="0" width="50" height="100" fill={secondary} />
      <rect x="75" y="0" width="25" height="100" fill={primary} />
    </>
  ),

  quarterly: ({ primary, secondary = primary }) => (
    <>
      <rect x="0" y="0" width="50" height="50" fill={primary} />
      <rect x="50" y="0" width="50" height="50" fill={secondary} />
      <rect x="0" y="50" width="50" height="50" fill={secondary} />
      <rect x="50" y="50" width="50" height="50" fill={primary} />
    </>
  ),
};

/**
 * Gets the field pattern renderer for a given field type.
 * Falls back to solid pattern if the type is not found.
 */
export function getFieldPattern(fieldType: FieldType, colors: FieldColors): React.ReactNode {
  const renderer = FIELD_PATTERNS[fieldType] || FIELD_PATTERNS.solid;
  return renderer(colors);
}
