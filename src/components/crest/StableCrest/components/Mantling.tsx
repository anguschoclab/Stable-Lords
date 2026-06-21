/**
 *
 */
export function Mantling({ color }: { color: string }): React.ReactNode {
  return (
    <g>
      <g opacity="0.35">
        <path
          d="M10,12 Q2,28 6,45 Q10,60 4,72 Q2,82 10,88 Q16,80 18,68 Q20,56 16,45 Q14,34 18,22 Q16,14 10,12 Z"
          fill={color}
        />
      </g>
      <g opacity="0.22">
        <path
          d="M14,18 Q8,32 12,48 Q16,62 12,74 Q16,78 20,72 Q18,60 22,48 Q24,36 20,24 Q18,16 14,18 Z"
          fill={color}
        />
      </g>
      <g opacity="0.35">
        <path
          d="M90,12 Q98,28 94,45 Q90,60 96,72 Q98,82 90,88 Q84,80 82,68 Q80,56 84,45 Q86,34 82,22 Q84,14 90,12 Z"
          fill={color}
        />
      </g>
      <g opacity="0.22">
        <path
          d="M86,18 Q92,32 88,48 Q84,62 88,74 Q84,78 80,72 Q82,60 78,48 Q76,36 80,24 Q82,16 86,18 Z"
          fill={color}
        />
      </g>
    </g>
  );
}
