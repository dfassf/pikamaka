'use client';

import { useState } from 'react';
import { AppSettings } from '@/app/lib/types';
import { markTutorialSeen } from '@/app/lib/storage';
import Button from '@/app/components/Button/Button';
import DatePicker from '@/app/components/DatePicker/DatePicker';
import styles from './Tutorial.module.css';

interface Props {
  onClose: () => void;
  onSaveSettings: (partial: Partial<AppSettings>) => void;
}

const TOTAL_STEPS = 4;

export default function Tutorial({ onClose, onSaveSettings }: Props) {
  const [step, setStep] = useState(0);
  const [closing, setClosing] = useState(false);

  // 스텝 3: 금연 시작일
  const [quitDate, setQuitDate] = useState('');
  // 스텝 4: 흡연량 + 갑 가격
  const [prevAmount, setPrevAmount] = useState('');
  const [packPrice, setPackPrice] = useState('');

  function finish() {
    setClosing(true);
    markTutorialSeen();
    setTimeout(onClose, 250);
  }

  function next() {
    // 스텝 3에서 "다음" → 금연 시작일 저장
    if (step === 2 && quitDate) {
      onSaveSettings({ quitDate });
    }
    // 스텝 4에서 "시작하기" → 흡연량 + 가격 저장
    if (step === 3) {
      const partial: Partial<AppSettings> = {};
      if (prevAmount) partial.prevDailyAmount = Number(prevAmount);
      if (packPrice) partial.packPrice = Number(packPrice);
      if (Object.keys(partial).length > 0) onSaveSettings(partial);
      finish();
      return;
    }
    setStep(s => s + 1);
  }

  function skip() {
    if (step === 3) {
      finish();
      return;
    }
    setStep(s => s + 1);
  }

  const isLast = step === TOTAL_STEPS - 1;
  const showSkip = step >= 2;

  return (
    <div className={`${styles.overlay} ${closing ? styles.closing : ''}`}>
      <div className={styles.card}>
        {/* 스텝 인디케이터 */}
        <div className={styles.dots}>
          {Array.from({ length: TOTAL_STEPS }, (_, i) => (
            <div key={i} className={`${styles.dot} ${i === step ? styles.dotActive : ''} ${i < step ? styles.dotDone : ''}`} />
          ))}
        </div>

        {/* 스텝 0: 사용법 */}
        {step === 0 && (
          <div className={styles.stepContent}>
            <h2><span>필까말까</span> 사용법</h2>
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
                <p>&ldquo;습&rdquo; 소리로 들이쉬기<br/>&ldquo;후&rdquo; 소리로 내쉬기</p>
              </div>
            </div>
          </div>
        )}

        {/* 스텝 1: 기록 소개 */}
        {step === 1 && (
          <div className={styles.stepContent}>
            <div className={styles.bigIcon}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 20V10"/>
                <path d="M18 20V4"/>
                <path d="M6 20v-4"/>
              </svg>
            </div>
            <h2>기록이 쌓이면<br/><span>통계</span>를 볼 수 있어요</h2>
            <p className={styles.subText}>
              매 한 개비가 자동으로 기록되고<br/>
              주간 추이와 흡연 패턴을 확인할 수 있습니다
            </p>
          </div>
        )}

        {/* 스텝 2: 금연 시작일 */}
        {step === 2 && (
          <div className={styles.stepContent}>
            <div className={styles.bigIcon}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                <line x1="16" y1="2" x2="16" y2="6"/>
                <line x1="8" y1="2" x2="8" y2="6"/>
                <line x1="3" y1="10" x2="21" y2="10"/>
              </svg>
            </div>
            <h2>금연은 언제<br/><span>시작</span>하셨나요?</h2>
            <p className={styles.subText}>금연 일수와 성과를 추적해 드려요</p>
            <DatePicker
              value={quitDate}
              onChange={setQuitDate}
              maxDate={new Date().toISOString().split('T')[0]}
            />
          </div>
        )}

        {/* 스텝 3: 흡연량 + 가격 */}
        {step === 3 && (
          <div className={styles.stepContent}>
            <div className={styles.bigIcon}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/>
                <path d="M16 8l-4 4-4-4"/>
              </svg>
            </div>
            <h2>금연 전<br/><span>흡연량</span>을 알려주세요</h2>
            <p className={styles.subText}>절약한 금액을 계산해 드려요</p>
            <div className={styles.inputGroup}>
              <label className={styles.inputLabel}>
                하루 흡연량
                <div className={styles.inputRow}>
                  <input
                    type="number"
                    className={styles.numberInput}
                    placeholder="10"
                    min={1}
                    max={99}
                    value={prevAmount}
                    onChange={e => setPrevAmount(e.target.value)}
                  />
                  <span className={styles.inputUnit}>개비</span>
                </div>
              </label>
              <label className={styles.inputLabel}>
                한 갑 가격
                <div className={styles.inputRow}>
                  <input
                    type="number"
                    className={styles.numberInput}
                    placeholder="4500"
                    min={100}
                    max={99999}
                    step={100}
                    value={packPrice}
                    onChange={e => setPackPrice(e.target.value)}
                  />
                  <span className={styles.inputUnit}>원</span>
                </div>
              </label>
            </div>
          </div>
        )}

        {/* 하단 네비게이션 */}
        <div className={styles.nav}>
          {showSkip && (
            <Button variant="ghost" fullWidth onClick={skip}>건너뛰기</Button>
          )}
          <Button variant="primary" fullWidth onClick={next}>
            {isLast ? '시작하기' : '다음'}
          </Button>
        </div>
      </div>
    </div>
  );
}
