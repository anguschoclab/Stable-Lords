// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import WarriorDossierStats from '@/components/warrior/dossier/WarriorDossierStats';
import { ENCUMBRANCE_LABELS, computeEncumbranceClass } from '@/data/terrabloodCharts';
import { makeWarrior } from '@/test/_fixtures/factories';

describe('WarriorDossierStats — encumbrance capacity label (C5)', () => {
  it('displays the canonical encumbrance class label from ST/CN', () => {
    const warrior = makeWarrior({
      attributes: { ST: 21, CN: 21, SZ: 10, WT: 10, WL: 10, SP: 10, DF: 10 },
    });
    render(<WarriorDossierStats warrior={warrior} />);
    const cls = computeEncumbranceClass(21, 21);
    expect(screen.getByText(ENCUMBRANCE_LABELS[cls])).toBeInTheDocument();
  });
});
