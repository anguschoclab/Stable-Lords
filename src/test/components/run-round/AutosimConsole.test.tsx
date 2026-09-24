/**
 * AutosimConsole — War Council Autopilot toggle forwards the option to onStart.
 */
// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { AutosimConsole } from '@/components/run-round/AutosimConsole';

function renderConsole(onStart = vi.fn()) {
  render(
    <AutosimConsole isSimulating={false} progress={null} result={null} onStart={onStart} />
  );
  return onStart;
}

describe('AutosimConsole council autopilot', () => {
  it('forwards councilAutoPilot: false by default', () => {
    const onStart = renderConsole();
    fireEvent.click(screen.getByText('4 Wks (Short)'));
    expect(onStart).toHaveBeenCalledWith(4, { councilAutoPilot: false });
  });

  it('forwards councilAutoPilot: true when the toggle is engaged', () => {
    const onStart = renderConsole();
    fireEvent.click(screen.getByRole('switch', { name: /war council autopilot/i }));
    fireEvent.click(screen.getByText('13 Wks (Full Season)'));
    expect(onStart).toHaveBeenCalledWith(13, { councilAutoPilot: true });
  });
});
