'use client';

import { useState, useRef, useCallback } from 'react';
import { AppSettings } from '@/app/lib/types';
import { addRecord, getTodayCount } from '@/app/lib/storage';

export type StatusType = 'idle' | 'micReady' | 'inhaling' | 'micInhaling' | 'exhaling';

export default function useCigarette(settings: AppSettings) {
  const [puffs, setPuffs] = useState(0);
  const [paperHeight, setPaperHeight] = useState(160);
  const [ashHeight, setAshHeight] = useState(0);
  const [done, setDone] = useState(false);
  const [doneMessage, setDoneMessage] = useState('');

  const doneRef = useRef(false);
  const puffsRef = useRef(0);

  const registerPuff = useCallback(() => {
    if (doneRef.current) return;
    puffsRef.current++;
    const p = puffsRef.current;
    setPuffs(p);

    const ratio = p / settings.maxPuffs;
    setPaperHeight(Math.max(20, 160 * (1 - ratio)));
    setAshHeight(Math.min(30, ratio * 40));

    if (navigator.vibrate) navigator.vibrate(10);

    if (p >= settings.maxPuffs) {
      // complete
      doneRef.current = true;
      setDone(true);
      addRecord(p);

      const todayCount = getTodayCount();
      if (todayCount <= settings.dailyGoal) {
        setDoneMessage(`오늘 ${todayCount}개비째입니다.\n진짜 담배 대신 한 모금으로 충분해요.`);
      } else {
        setDoneMessage(`오늘 ${todayCount}개비 — 목표(${settings.dailyGoal})를 넘었어요.\n조금만 줄여볼까요?`);
      }
      if (navigator.vibrate) navigator.vibrate([50, 30, 50]);
    }
  }, [settings.maxPuffs, settings.dailyGoal]);

  const reset = useCallback(() => {
    puffsRef.current = 0;
    doneRef.current = false;
    setPuffs(0);
    setPaperHeight(160);
    setAshHeight(0);
    setDone(false);
    setDoneMessage('');
  }, []);

  return {
    puffs, paperHeight, ashHeight, done, doneMessage, doneRef, puffsRef,
    registerPuff, reset,
  };
}
