// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import '@/test/_setup/setup';
import { EncumbranceBar } from '@/components/equipment/EncumbranceBar';
import type { EquipmentLoadout } from '@/data/equipment';
import { getLoadoutWeight } from '@/data/equipment';

const lightLoadout: EquipmentLoadout = {
  weapon: 'dagger',
  armor: 'none_armor',
  shield: 'none_shield',
  helm: 'none_helm',
};

const mediumLoadout: EquipmentLoadout = {
  weapon: 'longsword',
  armor: 'leather',
  shield: 'small_shield',
  helm: 'none_helm',
};

const heavyLoadout: EquipmentLoadout = {
  weapon: 'longsword',
  armor: 'plate_armor',
  shield: 'large_shield',
  helm: 'full_helm',
};

describe('EncumbranceBar', () => {
  it('renders the encumbrance label and weight/carry display', () => {
    render(<EncumbranceBar totalWeight={5} carryCap={20} loadout={lightLoadout} />);
    expect(screen.getByText('Encumbrance')).toBeInTheDocument();
    expect(screen.getByText(/5 \/ 20/)).toBeInTheDocument();
  });

  it('shows Unencumbered tier label for NONE tier', () => {
    render(<EncumbranceBar totalWeight={5} carryCap={20} loadout={lightLoadout} />);
    expect(screen.getByText(/Unencumbered/)).toBeInTheDocument();
  });

  it('shows Light tier label for LIGHT tier', () => {
    const weight = getLoadoutWeight(mediumLoadout);
    // carryCap chosen so ratio lands in LIGHT (0.60–0.80)
    const carryCap = Math.ceil(weight / 0.70);
    render(<EncumbranceBar totalWeight={weight} carryCap={carryCap} loadout={mediumLoadout} />);
    expect(screen.getByText(/Light/)).toBeInTheDocument();
  });

  it('shows Medium tier label for MEDIUM tier', () => {
    const weight = getLoadoutWeight(mediumLoadout);
    // carryCap chosen so ratio lands in MEDIUM (0.80–1.00)
    const carryCap = Math.ceil(weight / 0.90);
    render(<EncumbranceBar totalWeight={weight} carryCap={carryCap} loadout={mediumLoadout} />);
    expect(screen.getByText(/Medium/)).toBeInTheDocument();
  });

  it('shows Heavy tier label for HEAVY tier', () => {
    const weight = getLoadoutWeight(heavyLoadout);
    // carryCap chosen so ratio lands in HEAVY (1.00–1.20)
    const carryCap = Math.ceil(weight / 1.10);
    render(<EncumbranceBar totalWeight={weight} carryCap={carryCap} loadout={heavyLoadout} />);
    // The tier label appears in the header: "weight / carryCap · Heavy"
    expect(screen.getByText(new RegExp(`${weight} / ${carryCap}.*Heavy`))).toBeInTheDocument();
  });

  it('shows Over-encumbered tier label for OVER tier', () => {
    const weight = getLoadoutWeight(heavyLoadout);
    // carryCap chosen so ratio >= 1.20
    const carryCap = Math.floor(weight / 1.30);
    render(<EncumbranceBar totalWeight={weight} carryCap={carryCap} loadout={heavyLoadout} />);
    // The tier label appears in the header: "weight / carryCap · Over-encumbered"
    expect(screen.getByText(new RegExp(`${weight} / ${carryCap}.*Over-encumbered`))).toBeInTheDocument();
  });

  it('does not render penalty details for NONE tier', () => {
    render(<EncumbranceBar totalWeight={5} carryCap={20} loadout={lightLoadout} />);
    expect(screen.queryByText(/combat penalties apply/)).not.toBeInTheDocument();
  });

  it('does not render penalty details for LIGHT tier', () => {
    const weight = getLoadoutWeight(mediumLoadout);
    const carryCap = Math.ceil(weight / 0.70);
    render(<EncumbranceBar totalWeight={weight} carryCap={carryCap} loadout={mediumLoadout} />);
    expect(screen.queryByText(/combat penalties apply/)).not.toBeInTheDocument();
  });

  it('renders penalty details for HEAVY tier with INI, DEF, PAR, and END values', () => {
    const weight = getLoadoutWeight(heavyLoadout);
    const carryCap = Math.ceil(weight / 1.10);
    render(<EncumbranceBar totalWeight={weight} carryCap={carryCap} loadout={heavyLoadout} />);
    expect(screen.getByText(/combat penalties apply/)).toBeInTheDocument();
    // HEAVY penalties: iniPenalty=-3, defPenalty=-1, parPenalty=-1, enduranceMult=1.3
    expect(screen.getByText(/-3 INI/)).toBeInTheDocument();
    expect(screen.getByText(/-1 DEF/)).toBeInTheDocument();
    expect(screen.getByText(/-1 PAR/)).toBeInTheDocument();
    expect(screen.getByText(/30% END/)).toBeInTheDocument();
  });

  it('renders penalty details for OVER tier with larger penalties', () => {
    const weight = getLoadoutWeight(heavyLoadout);
    const carryCap = Math.floor(weight / 1.30);
    render(<EncumbranceBar totalWeight={weight} carryCap={carryCap} loadout={heavyLoadout} />);
    expect(screen.getByText(/combat penalties apply/)).toBeInTheDocument();
    // OVER penalties: iniPenalty=-4, defPenalty=-2, parPenalty=-2, enduranceMult=1.5
    expect(screen.getByText(/-4 INI/)).toBeInTheDocument();
    expect(screen.getByText(/-2 DEF/)).toBeInTheDocument();
    expect(screen.getByText(/-2 PAR/)).toBeInTheDocument();
    expect(screen.getByText(/50% END/)).toBeInTheDocument();
  });

  it('does not render penalty details for MEDIUM tier (only HEAVY/OVER show penalties)', () => {
    const weight = getLoadoutWeight(mediumLoadout);
    const carryCap = Math.ceil(weight / 0.90);
    render(<EncumbranceBar totalWeight={weight} carryCap={carryCap} loadout={mediumLoadout} />);
    // Component only shows penalty details for HEAVY and OVER tiers
    expect(screen.queryByText(/combat penalties apply/)).not.toBeInTheDocument();
  });
});
