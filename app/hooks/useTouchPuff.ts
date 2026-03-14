'use client';

import { useRef, useCallback, useEffect } from 'react';
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
  const callbacksRef = useRef({ onPuff, onSpark, isDone });

  useEffect(() => {
    callbacksRef.current = { onPuff, onSpark, isDone };
  }, [onPuff, onSpark, isDone]);

  const startPuffLoop = useCallback(() => {
    let puffStart = performance.now();
    function tick() {
      if (!pressingRef.current || callbacksRef.current.isDone()) return;
      callbacksRef.current.onSpark();
      const elapsed = performance.now() - puffStart;
      if (elapsed >= PUFF_MS) {
        callbacksRef.current.onPuff();
        puffStart = performance.now();
      }
      rafPuffId.current = requestAnimationFrame(tick);
    }
    rafPuffId.current = requestAnimationFrame(tick);
  }, []);

  const startInhale = useCallback(() => {
    if (callbacksRef.current.isDone()) return;
    pressingRef.current = true;
    inhaleStartRef.current = performance.now();
    startPuffLoop();
  }, [startPuffLoop]);

  /** 들이쉰 시간(ms) 리턴 */
  const endInhale = useCallback((): number => {
    if (!pressingRef.current) return 0;
    pressingRef.current = false;
    cancelAnimationFrame(rafPuffId.current);
    return performance.now() - inhaleStartRef.current;
  }, []);

  return { startInhale, endInhale, pressingRef };
}
