import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useArenaAnimation } from '@/hooks/useArenaAnimation';

describe('#10 useArenaAnimation — no module-level mutable state', () => {
  it('two independent instances maintain separate fighter names', () => {
    const { result: instanceA } = renderHook(() =>
      useArenaAnimation([], 0, 100, 100, null, false, 'Alice', 'Bob')
    );
    const { result: instanceB } = renderHook(() =>
      useArenaAnimation([], 0, 100, 100, null, false, 'Charlie', 'Diana')
    );

    // Each instance should have its own state — no shared module-level mutation
    expect(instanceA.current.fighterA).toBeDefined();
    expect(instanceA.current.fighterD).toBeDefined();
    expect(instanceB.current.fighterA).toBeDefined();
    expect(instanceB.current.fighterD).toBeDefined();

    // Modifying one instance should not affect the other
    act(() => {
      instanceA.current.updatePose('A', { x: 50, stance: 'advancing' });
    });

    expect(instanceA.current.fighterA.x).toBe(50);
    expect(instanceA.current.fighterA.stance).toBe('advancing');
    // Instance B's fighter A should still be at the default position
    expect(instanceB.current.fighterA.x).toBe(25);
    expect(instanceB.current.fighterA.stance).toBe('neutral');
  });

  it('reset on one instance does not affect another', () => {
    const { result: instanceA } = renderHook(() =>
      useArenaAnimation([], 0, 100, 100, null, false, 'Alice', 'Bob')
    );
    const { result: instanceB } = renderHook(() =>
      useArenaAnimation([], 0, 100, 100, null, false, 'Charlie', 'Diana')
    );

    act(() => {
      instanceA.current.updatePose('A', { x: 99 });
    });
    act(() => {
      instanceB.current.updatePose('A', { x: 88 });
    });

    expect(instanceA.current.fighterA.x).toBe(99);
    expect(instanceB.current.fighterA.x).toBe(88);

    act(() => {
      instanceA.current.reset();
    });

    expect(instanceA.current.fighterA.x).toBe(25);
    expect(instanceB.current.fighterA.x).toBe(88);
  });
});
