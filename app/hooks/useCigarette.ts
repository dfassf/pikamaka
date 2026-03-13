'use client';

import { useState, useRef, useCallback } from 'react';
import { AppSettings } from '@/app/lib/types';

export default function useCigarette(settings: AppSettings) {
  const [puffs, setPuffs] = useState(0);
  const [paperHeight, setPaperHeight] = useState(160);
  const [ashHeight, setAshHeight] = useState(0);
  const [done, setDone] = useState(false);

  const doneRef = useRef(false);
  const puffsRef = useRef(0);

  /** 모금 등록. true 리턴 = 개비 완료 */
  const registerPuff = useCallback((): boolean => {
    if (doneRef.current) return false;
    puffsRef.current++;
    const p = puffsRef.current;
    setPuffs(p);

    const ratio = p / settings.maxPuffs;
    setPaperHeight(Math.max(20, 160 * (1 - ratio)));
    setAshHeight(Math.min(30, ratio * 40));

    if (p >= settings.maxPuffs) {
      doneRef.current = true;
      setDone(true);
      return true;
    }
    return false;
  }, [settings.maxPuffs]);

  const reset = useCallback(() => {
    puffsRef.current = 0;
    doneRef.current = false;
    setPuffs(0);
    setPaperHeight(160);
    setAshHeight(0);
    setDone(false);
  }, []);

  return {
    puffs, paperHeight, ashHeight, done, doneRef, puffsRef,
    registerPuff, reset,
  };
}
