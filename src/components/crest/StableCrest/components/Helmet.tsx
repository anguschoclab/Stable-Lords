export function Helmet({ metal }: { metal: string }): React.ReactNode {
  const isGold = metal === '#D4AF37';
  const shadow = isGold ? '#8B7016' : '#808080';
  const highlight = isGold ? '#F5D76E' : '#E8E8E8';
  return (
    <g transform="translate(50, 4)">
      <ellipse cx="0" cy="0" rx="14" ry="9" fill={shadow} />
      <ellipse cx="0" cy="-1" rx="13" ry="8" fill={metal} />
      <ellipse cx="-3" cy="-3" rx="5" ry="2.5" fill={highlight} opacity="0.7" />
      <path d="M-11,5 Q-10,9 -8,11 L8,11 Q10,9 11,5 Z" fill={shadow} />
      <path d="M-10,4 Q-9,8 -7,10 L7,10 Q9,8 10,4 Z" fill={metal} />
      <rect x="-9" y="-4" width="18" height="8" rx="1.5" fill={shadow} opacity="0.9" />
      <line x1="-8" y1="-2" x2="8" y2="-2" stroke={metal} strokeWidth="0.8" />
      <line x1="-8" y1="0" x2="8" y2="0" stroke={metal} strokeWidth="0.8" />
      <line x1="-8" y1="2" x2="8" y2="2" stroke={metal} strokeWidth="0.8" />
      <line x1="0" y1="-10" x2="0" y2="4" stroke={shadow} strokeWidth="1" />
      <circle cx="-9" cy="4" r="0.8" fill={highlight} />
      <circle cx="9" cy="4" r="0.8" fill={highlight} />
    </g>
  );
}
