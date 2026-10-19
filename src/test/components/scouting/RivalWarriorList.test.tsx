/**
 * RivalWarriorList — the scouting column gains list-shell search so a
 * warrior can be found by name, epithet, or style without knowing the
 * stable first-hand.
 * @vitest-environment jsdom
 */
import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { TooltipProvider } from '@/components/ui/tooltip';
import { RivalWarriorList } from '@/components/scouting/RivalWarriorList';
import { makeWarrior } from '@/test/_fixtures/factories';
import type { WarriorId } from '@/types/shared.types';
import { FightingStyle } from '@/types/shared.types';

const w = (id: string, name: string, over: Record<string, unknown> = {}) =>
  makeWarrior({ id: id as WarriorId, name, ...over });

function renderList(warriors: ReturnType<typeof w>[]) {
  return render(
    <TooltipProvider>
      <RivalWarriorList
        warriors={warriors}
        selectedWarriorId={null}
        onSelectWarrior={() => {}}
        reports={[]}
        stableName="Iron Wolves"
      />
    </TooltipProvider>
  );
}

describe('RivalWarriorList — search', () => {
  it('filters warriors by name', () => {
    renderList([w('w-1', 'Karg the Red'), w('w-2', 'Morga')]);
    const search = screen.getByLabelText('Filter warriors');
    fireEvent.change(search, { target: { value: 'karg' } });
    expect(screen.getByLabelText(/Select rival warrior Karg/i)).toBeInTheDocument();
    expect(screen.queryByLabelText(/Select rival warrior Morga/i)).not.toBeInTheDocument();
  });

  it('filters warriors by epithet', () => {
    renderList([w('w-1', 'Karg', { epithet: 'the Red' }), w('w-2', 'Morga')]);
    const search = screen.getByLabelText('Filter warriors');
    fireEvent.change(search, { target: { value: 'red' } });
    expect(screen.getByLabelText(/Select rival warrior Karg/i)).toBeInTheDocument();
    expect(screen.queryByLabelText(/Select rival warrior Morga/i)).not.toBeInTheDocument();
  });

  it('filters warriors by style display name', () => {
    renderList([
      w('w-1', 'Karg', { style: FightingStyle.BashingAttack }),
      w('w-2', 'Morga', { style: FightingStyle.AimedBlow }),
    ]);
    const search = screen.getByLabelText('Filter warriors');
    fireEvent.change(search, { target: { value: 'aimed' } });
    expect(screen.queryByLabelText(/Select rival warrior Karg/i)).not.toBeInTheDocument();
    expect(screen.getByLabelText(/Select rival warrior Morga/i)).toBeInTheDocument();
  });

  it('offers a sort control', () => {
    renderList([w('w-1', 'Karg')]);
    expect(screen.getByLabelText('Sort list')).toBeInTheDocument();
  });
});
