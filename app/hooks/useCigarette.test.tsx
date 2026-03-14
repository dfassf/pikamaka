import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import useCigarette from '@/app/hooks/useCigarette';

describe('useCigarette', () => {
  it('registerPuff가 상태를 누적하고 max 도달 시 완료된다', () => {
    const { result } = renderHook(() =>
      useCigarette({ maxPuffs: 2, dailyGoal: 10, packPrice: 4500 }),
    );

    act(() => {
      expect(result.current.registerPuff()).toBe(false);
    });
    expect(result.current.puffs).toBe(1);
    expect(result.current.done).toBe(false);

    act(() => {
      expect(result.current.registerPuff()).toBe(true);
    });
    expect(result.current.puffs).toBe(2);
    expect(result.current.done).toBe(true);
    expect(result.current.doneRef.current).toBe(true);
  });

  it('reset이 상태를 초기화한다', () => {
    const { result } = renderHook(() =>
      useCigarette({ maxPuffs: 3, dailyGoal: 10, packPrice: 4500 }),
    );

    act(() => {
      result.current.registerPuff();
      result.current.registerPuff();
    });
    expect(result.current.puffs).toBe(2);

    act(() => {
      result.current.reset();
    });

    expect(result.current.puffs).toBe(0);
    expect(result.current.paperHeight).toBe(160);
    expect(result.current.ashHeight).toBe(0);
    expect(result.current.done).toBe(false);
    expect(result.current.doneRef.current).toBe(false);
  });
});
