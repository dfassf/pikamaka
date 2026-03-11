'use client';

import { useState, useRef, useCallback } from 'react';
import { AppSettings, MicState } from '@/app/lib/types';
import useSmokeCanvas from '@/app/hooks/useSmokeCanvas';
import useAudio from '@/app/hooks/useAudio';
import useCigarette, { StatusType } from '@/app/hooks/useCigarette';
import Cigarette from './Cigarette';
import DoneOverlay from './DoneOverlay';
import styles from './SmokeView.module.css';

interface Props {
  settings: AppSettings;
  onViewRecord: () => void;
}

const STATUS_TEXT: Record<StatusType, string> = {
  idle: '꾹 눌러서 한 모금',
  micReady: '습/후 소리를 내보세요',
  inhaling: '들이쉬는 중...',
  micInhaling: '습—',
  exhaling: '후—',
};

export default function SmokeView({ settings, onViewRecord }: Props) {
  const [status, setStatus] = useState<StatusType>('idle');
  const [glowing, setGlowing] = useState(false);
  const [breathActive, setBreathActive] = useState(false);
  const [hintVisible, setHintVisible] = useState(true);
  const [micActive, setMicActive] = useState(false);
  const [volPct, setVolPct] = useState(0);
  const [volActive, setVolActive] = useState(false);
  const [showBoost, setShowBoost] = useState(false);

  const emberRef = useRef<HTMLDivElement>(null);
  const pressingRef = useRef(false);
  const inhaleStartRef = useRef(0);
  const rafPuffId = useRef<number>(0);
  const micActiveRef = useRef(false);
  const micInhalingRef = useRef(false);
  const exhalingRef = useRef(false);

  const { canvasRef, emitSmoke, emitSparks, clearParticles } = useSmokeCanvas({ emberRef });
  const { startMic, stopMic } = useAudio();
  const cig = useCigarette(settings);

  // 비주얼 초기화 헬퍼
  const setVisual = useCallback((g: boolean, b: boolean) => {
    setGlowing(g);
    setBreathActive(b);
  }, []);

  const defaultStatus = useCallback((): StatusType =>
    micActiveRef.current ? 'micReady' : 'idle'
  , []);

  // 새 담배
  const handleReset = useCallback(() => {
    cig.reset();
    inhaleStartRef.current = 0;
    setVisual(false, false);
    setShowBoost(false);
    setStatus(defaultStatus());
    clearParticles();
  }, [cig, clearParticles, setVisual, defaultStatus]);

  // --- 터치 입력 (시간 기반 — 120Hz에서도 동일 속도) ---
  const PUFF_MS = 2000; // 1퍼프에 2초

  const startPuffLoop = useCallback(() => {
    let puffStart = performance.now();
    function tick() {
      if (!pressingRef.current || cig.doneRef.current) return;
      emitSparks();
      const elapsed = performance.now() - puffStart;
      if (elapsed >= PUFF_MS) {
        cig.registerPuff();
        puffStart = performance.now();
      }
      rafPuffId.current = requestAnimationFrame(tick);
    }
    rafPuffId.current = requestAnimationFrame(tick);
  }, [emitSparks, cig]);

  const startInhale = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (cig.doneRef.current) return;
    e.preventDefault();
    if (hintVisible) setHintVisible(false);
    pressingRef.current = true;
    inhaleStartRef.current = performance.now();
    setVisual(true, true);
    setStatus('inhaling');
    if (navigator.vibrate) navigator.vibrate(30);
    startPuffLoop();
  }, [hintVisible, startPuffLoop, cig.doneRef, setVisual]);

  const endInhale = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (!pressingRef.current) return;
    e.preventDefault();
    pressingRef.current = false;
    cancelAnimationFrame(rafPuffId.current);
    setVisual(false, false);
    if (cig.doneRef.current) return;

    setStatus('exhaling');
    const inhaleMs = performance.now() - inhaleStartRef.current;
    const count = Math.min(Math.floor(inhaleMs / 60) + 3, 20);
    emitSmoke(count, false, true);
    if (navigator.vibrate) navigator.vibrate(15);

    setTimeout(() => {
      if (!pressingRef.current && !micInhalingRef.current && !cig.doneRef.current) {
        setStatus(defaultStatus());
      }
    }, 1200);
  }, [emitSmoke, cig.doneRef, setVisual, defaultStatus]);

  // --- 마이크 콜백 ---
  const handleMicStateChange = useCallback((state: MicState, prevState: MicState) => {
    if (state === 'inhaling') {
      micInhalingRef.current = true;
      inhaleStartRef.current = performance.now();
      setVisual(true, true);
      setShowBoost(false);
      setStatus('micInhaling');
    } else if (state === 'exhaling') {
      if (prevState === 'inhaling') cig.registerPuff();
      micInhalingRef.current = false;
      exhalingRef.current = true;
      setVisual(false, false);
      setShowBoost(true);
      setStatus('exhaling');
    } else {
      if (prevState === 'inhaling') {
        cig.registerPuff();
        emitSmoke(12, false, true);
        setStatus('exhaling');
        if (navigator.vibrate) navigator.vibrate(15);
        setTimeout(() => setStatus('micReady'), 800);
      } else {
        setStatus('micReady');
      }
      micInhalingRef.current = false;
      exhalingRef.current = false;
      setVisual(false, false);
      setShowBoost(false);
    }
  }, [cig, emitSmoke, setVisual]);

  const handleMicVolume = useCallback((rms: number, isQuiet: boolean) => {
    setVolPct(Math.min(100, rms * 2000));
    setVolActive(!isQuiet);
    if (exhalingRef.current && !cig.doneRef.current) {
      emitSmoke(Math.floor(rms * 150) + 3, true, true);
    }
  }, [emitSmoke, cig.doneRef]);

  const toggleMic = useCallback(async () => {
    if (micActiveRef.current) {
      stopMic();
      micActiveRef.current = false;
      micInhalingRef.current = false;
      exhalingRef.current = false;
      setMicActive(false);
      setShowBoost(false);
      setVisual(false, false);
      if (!pressingRef.current) setStatus('idle');
      return;
    }
    try {
      await startMic({ onStateChange: handleMicStateChange, onVolume: handleMicVolume }, cig.doneRef);
      micActiveRef.current = true;
      setMicActive(true);
      setHintVisible(false);
      setStatus('micReady');
    } catch {
      alert('마이크 권한이 필요합니다.');
    }
  }, [startMic, stopMic, handleMicStateChange, handleMicVolume, cig.doneRef, setVisual]);

  // --- 상태 텍스트 렌더링 ---
  const isAction = status === 'inhaling' || status === 'micInhaling';
  const isExhale = status === 'exhaling';
  const statusEl = isAction
    ? <span className={`${styles.action} ${styles.inhale}`}>{STATUS_TEXT[status]}</span>
    : isExhale
      ? <span className={`${styles.action} ${styles.exhale}`}>{STATUS_TEXT[status]}</span>
      : <>{STATUS_TEXT[status]}</>;

  return (
    <div className={styles.root}>
      <div className={styles.canvasWrap}>
        <canvas ref={canvasRef} />
      </div>

      {micActive && (
        <div className={styles.volMeter}>
          <div className={styles.volBarTrack}>
            <div className={styles.volBarFill} style={{ width: `${volPct}%`, background: volActive ? 'var(--accent)' : 'var(--text-dim)' }} />
          </div>
        </div>
      )}
      {showBoost && <div className={styles.micBoost}>BLOW +</div>}

      <button className={`${styles.micToggle} ${micActive ? styles.micActive : ''}`} onClick={toggleMic} title="마이크 (습/후 감지)">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
          <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
          <line x1="12" y1="19" x2="12" y2="23"/>
          <line x1="8" y1="23" x2="16" y2="23"/>
        </svg>
      </button>

      <div
        className={styles.touchZone}
        onMouseDown={startInhale} onMouseUp={endInhale} onMouseLeave={endInhale}
        onTouchStart={startInhale} onTouchEnd={endInhale} onTouchCancel={endInhale}
        onContextMenu={e => e.preventDefault()}
      >
        <Cigarette ref={emberRef} paperHeight={cig.paperHeight} ashHeight={cig.ashHeight} glowing={glowing} breathActive={breathActive} />

        <div className={styles.statusArea}>
          <div className={styles.statusText}>{statusEl}</div>
          <div className={styles.puffCounter}>퍼프 <strong>{cig.puffs}</strong> / {settings.maxPuffs}</div>
        </div>

        {hintVisible && (
          <div className={styles.hint}>
            <div className={styles.hintFinger}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 18v-6M8 18v-4M16 18v-2M6 12a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v6H6v-6z"/>
              </svg>
            </div>
            꾹 누르기 = 들이쉬기<br/>떼기 = 내쉬기
          </div>
        )}
      </div>

      {cig.done && <DoneOverlay message={cig.doneMessage} onNewCig={handleReset} onViewRecord={onViewRecord} />}
    </div>
  );
}
