import { describe, it, expect } from 'vitest';
// V30-W7: the store boundary must not accept loadouts that fail
// validateLoadout — UI gating alone left a programmatic bypass.
import { useGameStore } from '@/state/useGameStore';
import { makeWarrior } from '@/test/_fixtures/factories';
import { makeAiTestState } from '@/test/_fixtures/aiTestState';
import type { WarriorId } from '@/types/shared.types';

const seedStore = (w = makeWarrior({ id: 'w1' as WarriorId })) => {
  useGameStore.getState().loadGame('v30-equip', makeAiTestState({ roster: [w] }) as never);
  return useGameStore.getState();
};

const legal = { weapon: 'epee', armor: 'none', shield: 'none', helm: 'none' };
const illegal = { weapon: 'QS', armor: 'none', shield: 'small_shield', helm: 'none' }; // two-handed + shield

describe('updateWarriorEquipment — store-boundary validation (V30)', () => {
  it('rejects a two-handed weapon paired with a shield (no state change)', () => {
    const st = seedStore();
    const before = st.roster.find((w) => w.id === ('w1' as WarriorId))!.equipment;
    st.updateWarriorEquipment('w1' as WarriorId, illegal);
    const after = useGameStore.getState().roster.find((w) => w.id === ('w1' as WarriorId))!.equipment;
    expect(after).toBe(before);
  });

  it('applies a legal loadout', () => {
    const st = seedStore();
    st.updateWarriorEquipment('w1' as WarriorId, legal);
    const after = useGameStore.getState().roster.find((w) => w.id === ('w1' as WarriorId))!.equipment;
    expect(after).toEqual(legal);
  });

  it('no-ops on an unknown warrior id', () => {
    const st = seedStore();
    const before = st.roster;
    st.updateWarriorEquipment('ghost' as WarriorId, legal);
    expect(useGameStore.getState().roster).toBe(before);
  });
});
