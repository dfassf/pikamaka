'use client';

import { useState } from 'react';
import { markTutorialSeen } from '@/app/lib/storage';
import styles from './Tutorial.module.css';

interface Props {
  onClose: () => void;
}

export default function Tutorial({ onClose }: Props) {
  const [closing, setClosing] = useState(false);

  function handleClose() {
    setClosing(true);
    markTutorialSeen();
    setTimeout(onClose, 250);
  }

  return (
    <div
      className={`${styles.overlay} ${closing ? styles.closing : ''}`}
      onClick={e => { if (e.target === e.currentTarget) handleClose(); }}
    >
      <div className={styles.card}>
        <h2><span>한 모금</span> 사용법</h2>

        <div className={styles.section}>
          <div className={styles.icon}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 18v-6M8 18v-4M16 18v-2M6 12a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v6H6v-6z"/>
            </svg>
          </div>
          <div className={styles.desc}>
            <h3>터치로 피우기</h3>
            <p>화면을 꾹 누르면 들이쉬기<br/>손을 떼면 내쉬기</p>
          </div>
        </div>

        <div className={styles.section}>
          <div className={styles.icon}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
              <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
              <line x1="12" y1="19" x2="12" y2="23"/>
              <line x1="8" y1="23" x2="16" y2="23"/>
            </svg>
          </div>
          <div className={styles.desc}>
            <h3>마이크로 피우기</h3>
            <p>마이크를 켜고 &ldquo;습&rdquo; 소리로 들이쉬기<br/>&ldquo;후&rdquo; 소리로 내쉬기</p>
          </div>
        </div>

        <div className={styles.section}>
          <div className={styles.icon}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 20V10"/>
              <path d="M18 20V4"/>
              <path d="M6 20v-4"/>
            </svg>
          </div>
          <div className={styles.desc}>
            <h3>기록 & 목표</h3>
            <p>매 한 개비가 기록되고<br/>하루 목표 대비 진행률을 확인</p>
          </div>
        </div>

        <button className={styles.closeBtn} onClick={handleClose}>알겠어요</button>
      </div>
    </div>
  );
}
