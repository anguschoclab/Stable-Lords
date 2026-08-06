// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import '@/test/_setup/setup';
import { SlotSelector } from '@/components/equipment/SlotSelector';
import { FightingStyle } from '@/types/shared.types';
import { getAvailableItems } from '@/data/equipment';

describe('SlotSelector', () => {
  it('renders the label text', () => {
    render(
      <SlotSelector
        slot="weapon"
        label="Weapon"
        icon={<span data-testid="icon">W</span>}
        selectedId=""
        style={FightingStyle.StrikingAttack}
        disabled={false}
        onChange={vi.fn()}
      />
    );
    expect(screen.getByText('Weapon')).toBeInTheDocument();
  });

  it('renders a Select trigger (combobox)', () => {
    render(
      <SlotSelector
        slot="weapon"
        label="Weapon"
        icon={<span>W</span>}
        selectedId=""
        style={FightingStyle.StrikingAttack}
        disabled={false}
        onChange={vi.fn()}
      />
    );
    expect(screen.getByRole('combobox')).toBeInTheDocument();
  });

  it('renders the icon element', () => {
    render(
      <SlotSelector
        slot="weapon"
        label="Weapon"
        icon={<span data-testid="test-icon">W</span>}
        selectedId=""
        style={FightingStyle.StrikingAttack}
        disabled={false}
        onChange={vi.fn()}
      />
    );
    expect(screen.getByTestId('test-icon')).toBeInTheDocument();
  });

  it('disables the select when disabled prop is true', () => {
    render(
      <SlotSelector
        slot="weapon"
        label="Weapon"
        icon={<span>W</span>}
        selectedId=""
        style={FightingStyle.StrikingAttack}
        disabled={true}
        onChange={vi.fn()}
      />
    );
    const trigger = screen.getByRole('combobox');
    expect(trigger).toBeDisabled();
  });

  it('shows blocked message when disabled', () => {
    render(
      <SlotSelector
        slot="shield"
        label="Shield"
        icon={<span>S</span>}
        selectedId=""
        style={FightingStyle.StrikingAttack}
        disabled={true}
        onChange={vi.fn()}
      />
    );
    expect(screen.getByText(/blocked/i)).toBeInTheDocument();
  });

  it('renders item description when an item is selected', () => {
    const items = getAvailableItems('weapon', FightingStyle.StrikingAttack);
    const firstItem = items[0];
    if (!firstItem) return;
    render(
      <SlotSelector
        slot="weapon"
        label="Weapon"
        icon={<span>W</span>}
        selectedId={firstItem.id}
        style={FightingStyle.StrikingAttack}
        disabled={false}
        onChange={vi.fn()}
      />
    );
    expect(screen.getByText(firstItem.description)).toBeInTheDocument();
  });

  it('renders weight badge when selected item has weight > 0', () => {
    const items = getAvailableItems('weapon', FightingStyle.StrikingAttack);
    const heavyItem = items.find((i) => i.weight > 0);
    if (!heavyItem) return;
    render(
      <SlotSelector
        slot="weapon"
        label="Weapon"
        icon={<span>W</span>}
        selectedId={heavyItem.id}
        style={FightingStyle.StrikingAttack}
        disabled={false}
        onChange={vi.fn()}
      />
    );
    expect(screen.getByText(/enc/i)).toBeInTheDocument();
  });
});
