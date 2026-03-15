'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { AppSettings, MicState } from '@/app/lib/types';
import { EXHALE_DISPLAY_MS } from '@/app/lib/constants';
import { addRecord, getTodayCount } from '@/app/lib/storage';
import useSmokeCanvas from '@/app/hooks/useSmokeCanvas';
import useAudio from '@/app/hooks/useAudio';
import useCigarette from '@/app/hooks/useCigarette';
import useTouchPuff from '@/app/hooks/useTouchPuff';
import Cigarette from './Cigarette';
import DoneOverlay from './DoneOverlay';
import SmokeViewMicOverlays from './SmokeViewMicOverlays';
import styles from './SmokeView.module.css';

type StatusType = 'idle' | 'micReady' | 'inhaling' | 'micInhaling' | 'exhaling';

interface Props {
  settings: AppSettings;
  onViewRecord: () => void;
  beforeLeaveRef: React.MutableRefObject<(() => void) | null>;
  showMicTip?: boolean;
  onMicTipDismiss?: () => void;
  onShowGuide?: () => void;
}

const STATUS_TEXT: Record<StatusType, string> = {
  idle: '꾹 눌러서 한 모금',
  micReady: '습/후 소리를 내보세요',
  inhaling: '들이쉬는 중...',
  micInhaling: '습—',
  exhaling: '후—',
};

export default function SmokeView({ settings, onViewRecord, beforeLeaveRef, showMicTip, onMicTipDismiss, onShowGuide }: Props) {
  const [status, setStatus] = useState<StatusType>('idle');
  const [inhaling, setInhaling] = useState(false);
  const [hintVisible, setHintVisible] = useState(true);
  const [micActive, setMicActive] = useState(false);
  const [volPct, setVolPct] = useState(0);
  const [volActive, setVolActive] = useState(false);
  const [showBoost, setShowBoost] = useState(false);
  const [doneMessage, setDoneMessage] = useState('');
  const [showMicDenied, setShowMicDenied] = useState(false);

  const emberRef = useRef<HTMLDivElement>(null);
  const micActiveRef = useRef(false);
  const micInhalingRef = useRef(false);
  const exhalingRef = useRef(false);

  // 마이크 팁 Escape 닫기
  useEffect(() => {
    if (!showMicTip) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onMicTipDismiss?.();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [showMicTip, onMicTipDismiss]);

  const { canvasRef, emitSmoke, emitSparks, clearParticles } = useSmokeCanvas({ emberRef });
  const { startMic, stopMic } = useAudio();
  const cig = useCigarette(settings);

  // --- 완료 처리 (저장 + 진동 + 메시지) ---
  const handleComplete = useCallback(() => {
    addRecord();
    const todayCount = getTodayCount();
    if (todayCount <= settings.dailyGoal) {
      setDoneMessage(`오늘 ${todayCount}개비째입니다.\n진짜 담배 대신 이걸로 충분해요.`);
    } else {
      setDoneMessage(`오늘 ${todayCount}개비 — 목표(${settings.dailyGoal})를 넘었어요.\n조금만 줄여볼까요?`);
    }
    if (navigator.vibrate) navigator.vibrate([50, 30, 50]);
  }, [settings.dailyGoal]);

  // 모금 등록 + 완료 시 부가 처리
  const doPuff = useCallback(() => {
    const completed = cig.registerPuff();
    if (navigator.vibrate) navigator.vibrate(10);
    if (completed) handleComplete();
  }, [cig, handleComplete]);

  // --- 터치 입력 ---
  const touch = useTouchPuff({
    onPuff: doPuff,
    onSpark: emitSparks,
    isDone: () => cig.doneRef.current,
  });

  // 탭 이동 시 진행 중인 모금 자동 저장 + 마이크 정리
  useEffect(() => {
    beforeLeaveRef.current = () => {
      if (cig.puffsRef.current > 0 && !cig.doneRef.current) {
        addRecord();
      }
      if (micActiveRef.current) {
        stopMic();
        micActiveRef.current = false;
      }
    };
  }, [beforeLeaveRef, cig.puffsRef, cig.doneRef, stopMic]);

  const defaultStatus = useCallback((): StatusType =>
    micActiveRef.current ? 'micReady' : 'idle'
  , []);

  // 새 담배
  const handleReset = useCallback(() => {
    cig.reset();
    setInhaling(false);
    setShowBoost(false);
    setDoneMessage('');
    setStatus(defaultStatus());
    clearParticles();
  }, [cig, clearParticles, defaultStatus]);

  // 담배 버리기 (진행 중인 담배를 버리고 1개비 카운트)
  const handleDiscard = useCallback(() => {
    addRecord();
    handleReset();
  }, [handleReset]);

  // --- 터치 이벤트 핸들러 ---
  const startInhale = (e: React.MouseEvent | React.TouchEvent) => {
    if (cig.doneRef.current) return;
    e.preventDefault();
    if (hintVisible) setHintVisible(false);
    setInhaling(true);
    setStatus('inhaling');
    if (navigator.vibrate) navigator.vibrate(30);
    touch.startInhale();
  };

  const endInhale = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    const inhaleMs = touch.endInhale();
    if (inhaleMs === 0) return;
    setInhaling(false);
    if (cig.doneRef.current) return;

    setStatus('exhaling');
    const count = Math.min(Math.floor(inhaleMs / 60) + 3, 20);
    emitSmoke(count, false, true);
    if (navigator.vibrate) navigator.vibrate(15);

    setTimeout(() => {
      if (!touch.pressingRef.current && !micInhalingRef.current && !cig.doneRef.current) {
        setStatus(defaultStatus());
      }
    }, EXHALE_DISPLAY_MS);
  };

  // --- 마이크 콜백 ---
  const handleMicStateChange = useCallback((state: MicState, prevState: MicState) => {
    if (state === 'inhaling') {
      micInhalingRef.current = true;
      setInhaling(true);
      setShowBoost(false);
      setStatus('micInhaling');
    } else if (state === 'exhaling') {
      if (prevState === 'inhaling') doPuff();
      micInhalingRef.current = false;
      exhalingRef.current = true;
      setInhaling(false);
      setShowBoost(true);
      setStatus('exhaling');
    } else {
      if (prevState === 'inhaling') {
        doPuff();
        emitSmoke(12, false, true);
        setStatus('exhaling');
        if (navigator.vibrate) navigator.vibrate(15);
        setTimeout(() => setStatus('micReady'), 800);
      } else {
        setStatus('micReady');
      }
      micInhalingRef.current = false;
      exhalingRef.current = false;
      setInhaling(false);
      setShowBoost(false);
    }
  }, [doPuff, emitSmoke]);

  const handleMicVolume = (rms: number, isQuiet: boolean) => {
    setVolPct(Math.min(100, rms * 2000));
    setVolActive(!isQuiet);
    if (exhalingRef.current && !cig.doneRef.current) {
      emitSmoke(Math.floor(rms * 150) + 3, true, true);
    }
  };

  const toggleMic = async () => {
    if (micActiveRef.current) {
      stopMic();
      micActiveRef.current = false;
      micInhalingRef.current = false;
      exhalingRef.current = false;
      setMicActive(false);
      setShowBoost(false);
      setInhaling(false);
      if (!touch.pressingRef.current) setStatus('idle');
      return;
    }
    try {
      await startMic({ onStateChange: handleMicStateChange, onVolume: handleMicVolume }, cig.doneRef);
      micActiveRef.current = true;
      setMicActive(true);
      setHintVisible(false);
      setStatus('micReady');
    } catch {
      setShowMicDenied(true);
    }
  };

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

      <button className={styles.helpButton} onClick={onShowGuide} title="사용법 보기">?</button>

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
        <Cigarette ref={emberRef} paperHeight={cig.paperHeight} ashHeight={cig.ashHeight} inhaling={inhaling} />

        <div className={styles.statusArea}>
          <div className={styles.statusText}>{statusEl}</div>
          <div className={styles.puffCounter}>모금 <strong>{cig.puffs}</strong> / {settings.maxPuffs}</div>
          {cig.puffs > 0 && !cig.done && (
            <button className={styles.discardButton} onPointerDown={e => e.stopPropagation()} onClick={handleDiscard} title="담배 버리기">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="3 6 5 6 21 6"/>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
              </svg>
              버리기
            </button>
          )}
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

      {cig.done && <DoneOverlay message={doneMessage} onNewCig={handleReset} onViewRecord={onViewRecord} />}

      <SmokeViewMicOverlays
        showMicDenied={showMicDenied}
        onCloseMicDenied={() => setShowMicDenied(false)}
        showMicTip={showMicTip}
        onMicTipDismiss={onMicTipDismiss}
      />
    </div>
  );
}
