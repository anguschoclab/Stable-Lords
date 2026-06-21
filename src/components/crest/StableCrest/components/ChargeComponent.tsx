import { getChargePathsByType, type ChargePath } from '@/engine/crest/chargePaths';
import type { CrestData } from '@/types/crest.types';

function getPostureTransform(posture?: CrestData['charge']['posture']): string {
  switch (posture) {
    case 'rampant':
      return 'rotate(-18 50 50)';
    case 'passant':
      return 'skewX(-6)';
    case 'sejant':
      return 'translate(0 6) scale(1 0.82)';
    case 'statant':
      return '';
    case 'couchant':
      return 'translate(0 10) scale(1.05 0.7)';
    case 'forcene':
      return 'rotate(14 50 50) skewY(-4)';
    default:
      return '';
  }
}

/**
 *
 */
export function ChargeComponent({
  charge,
  metal,
}: {
  charge: CrestData['charge'];
  metal: string;
}): React.ReactNode {
  const paths = getChargePathsByType(charge.type);
  const chargeData: ChargePath | undefined = paths[charge.name];

  if (!chargeData) return null;

  const count = charge.count;
  const postureTransform = getPostureTransform(charge.posture);

  const renderPath = (tx: number, ty: number, s: number, key?: string | number) => (
    <g key={key} transform={`translate(${tx} ${ty}) scale(${s})`}>
      {postureTransform ? (
        <g transform={postureTransform}>
          <path d={chargeData.path} fill={metal} />
        </g>
      ) : (
        <path d={chargeData.path} fill={metal} />
      )}
    </g>
  );

  if (count === 1) {
    return renderPath(25, 27, 0.5);
  }

  if (count === 2) {
    return (
      <>
        {renderPath(17, 39, 0.32, 'l')}
        {renderPath(51, 39, 0.32, 'r')}
      </>
    );
  }

  return (
    <>
      {renderPath(36, 22, 0.28, 't')}
      {renderPath(19, 50, 0.28, 'bl')}
      {renderPath(53, 50, 0.28, 'br')}
    </>
  );
}
