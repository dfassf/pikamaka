import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import useTouchPuff from '@/app/hooks/useTouchPuff';

let now = 1000;

describe('useTouchPuff', () => {
  beforeEach(() => {
    now = 1000;
    vi.spyOn(performance, 'now').mockImplementation(() => now);
    vi.spyOn(window, 'requestAnimationFrame').mockImplementation(() => 1);
    vi.spyOn(window, 'cancelAnimationFrame').mockImplementation(() => undefined);
  });

  it('완료 상태면 startInhale가 동작하지 않는다', () => {
    const onPuff = vi.fn();
    const onSpark = vi.fn();
    const { result } = renderHook(() =>
      useTouchPuff({ onPuff, onSpark, isDone: () => true }),
    );

    act(() => {
      result.current.startInhale();
    });

    expect(result.current.pressingRef.current).toBe(false);
    expect(window.requestAnimationFrame).not.toHaveBeenCalled();
  });

  it('startInhale/endInhale로 누름 상태와 시간 계산이 된다', () => {
    const onPuff = vi.fn();
    const onSpark = vi.fn();
    const { result } = renderHook(() =>
      useTouchPuff({ onPuff, onSpark, isDone: () => false }),
    );

    act(() => {
      result.current.startInhale();
    });
    expect(result.current.pressingRef.current).toBe(true);
    expect(window.requestAnimationFrame).toHaveBeenCalled();

    now = 1500;

    let elapsed = 0;
    act(() => {
      elapsed = result.current.endInhale();
    });

    expect(result.current.pressingRef.current).toBe(false);
    expect(elapsed).toBe(500);
    expect(window.cancelAnimationFrame).toHaveBeenCalledWith(1);
  });
});
