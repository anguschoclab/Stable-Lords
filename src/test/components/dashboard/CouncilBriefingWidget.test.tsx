// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { CouncilBriefingWidget } from '@/pages/ControlCenter/components/CouncilBriefingWidget';
import { seedAdvisorScenario } from '@/test/_fixtures/advisorSeed';
import '@/test/_setup/setup';

vi.mock('@tanstack/react-router', () => ({ ...__SHARED_MOCKS.routerLink }));

describe('CouncilBriefingWidget', () => {
  beforeEach(() => {
    seedAdvisorScenario();
  });

  it('renders War Council briefing card with link to /stable/advisor', () => {
    render(<CouncilBriefingWidget />);

    expect(screen.getAllByText(/War Council/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/Review War Council/i)).toBeDefined();
  });
});
