import { cn } from '@/lib/utils';

/**
 * Body part type.
 */
type BodyPart = 'Head' | 'Torso' | 'LeftArm' | 'RightArm' | 'Legs';

/**
 * Defines the shape of paper doll props.
 */
interface PaperDollProps {
  healthMap: Partial<Record<BodyPart, number>>;
  className?: string;
}

/**
 * Paper doll.
 * @param - { health map, class name }.
 */
export function PaperDoll({ healthMap, className }: PaperDollProps) {
  const getPartColor = (part: BodyPart) => {
    const hp = healthMap[part] ?? 100;
    if (hp <= 0) return 'fill-neutral-900';
    if (hp < 20) return 'fill-destructive';
    if (hp <= 50) return 'fill-arena-gold';
    return 'fill-green-500';
  };

  return (
    <div className={cn('relative w-full max-w-48 aspect-[1/2]', className)}>
      <svg
        viewBox="0 0 100 200"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full"
      >
        {/* Head */}
        <circle
          cx="50"
          cy="25"
          r="15"
          className={cn(
            'transition-colors duration-500 motion-reduce:transition-none',
            getPartColor('Head')
          )}
          data-testid="body-part-head"
          stroke="currentColor"
          strokeWidth="2"
        />

        <BodyPath d="M35 45H65L70 110H30L35 45Z" part="Torso" getPartColor={getPartColor} />
        <BodyPath d="M30 50L10 100L15 105L35 60" part="LeftArm" getPartColor={getPartColor} />
        <BodyPath d="M70 50L90 100L85 105L65 60" part="RightArm" getPartColor={getPartColor} />
        {/* Legs (Simplified as one unit for now, as per Lead Engineer's spec "Legs") */}
        <BodyPath
          d="M35 110L25 180H45L50 130L55 180H75L65 110"
          part="Legs"
          getPartColor={getPartColor}
        />
      </svg>
    </div>
  );
}

const BODY_PART_TEST_IDS: Record<BodyPart, string> = {
  Head: 'body-part-head',
  Torso: 'body-part-torso',
  LeftArm: 'body-part-left-arm',
  RightArm: 'body-part-right-arm',
  Legs: 'body-part-legs',
};

/** One limb on the doll — colored by the health map. */
function BodyPath({
  d,
  part,
  getPartColor,
}: {
  d: string;
  part: BodyPart;
  getPartColor: (part: BodyPart) => string;
}) {
  return (
    <path
      d={d}
      className={cn(
        'transition-colors duration-500 motion-reduce:transition-none',
        getPartColor(part)
      )}
      data-testid={BODY_PART_TEST_IDS[part]}
      stroke="currentColor"
      strokeWidth="2"
    />
  );
}
