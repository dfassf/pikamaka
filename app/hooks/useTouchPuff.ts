'use client';

import { useRef, useCallback } from 'react';
import { PUFF_MS } from '@/app/lib/constants';

interface UseTouchPuffOptions {
  onPuff: () => void;
  onSpark: () => void;
  isDone: () => boolean;
}

export default function useTouchPuff({ onPuff, onSpark, isDone }: UseTouchPuffOptions) {
  const pressingRef = useRef(false);
  const inhaleStartRef = useRef(0);
  const rafPuffId = useRef<number>(0);

  const startPuffLoop = useCallback(() => {
    let puffStart = performance.now();
    function tick() {
      if (!pressingRef.current || isDone()) return;
      onSpark();
      const elapsed = performance.now() - puffStart;
      if (elapsed >= PUFF_MS) {
        onPuff();
        puffStart = performance.now();
      }
      rafPuffId.current = requestAnimationFrame(tick);
    }
    rafPuffId.current = requestAnimationFrame(tick);
  }, [onPuff, onSpark, isDone]);

  const startInhale = useCallback(() => {
    if (isDone()) return;
    pressingRef.current = true;
    inhaleStartRef.current = performance.now();
    startPuffLoop();
  }, [isDone, startPuffLoop]);

  /** 들이쉰 시간(ms) 리턴 */
  const endInhale = useCallback((): number => {
    if (!pressingRef.current) return 0;
    pressingRef.current = false;
    cancelAnimationFrame(rafPuffId.current);
    return performance.now() - inhaleStartRef.current;
  }, []);

  return { startInhale, endInhale, pressingRef };
}
