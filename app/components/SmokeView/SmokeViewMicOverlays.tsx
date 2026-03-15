'use client';

import styles from './SmokeView.module.css';

interface Props {
  showMicDenied: boolean;
  onCloseMicDenied: () => void;
  showMicTip?: boolean;
  onMicTipDismiss?: () => void;
}

export default function SmokeViewMicOverlays({
  showMicDenied,
  onCloseMicDenied,
  showMicTip,
  onMicTipDismiss,
}: Props) {
  const handleMicTipDismiss = onMicTipDismiss ?? (() => {});

  return (
    <>
      {showMicDenied && (
        <div className={styles.micTipOverlay} role="dialog" aria-modal="true" onClick={onCloseMicDenied}>
          <div className={styles.micDeniedModal} onClick={e => e.stopPropagation()}>
            <div className={styles.micDeniedIcon}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
                <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
                <line x1="12" y1="19" x2="12" y2="23"/>
                <line x1="8" y1="23" x2="16" y2="23"/>
                <line x1="1" y1="1" x2="23" y2="23"/>
              </svg>
            </div>
            <h3>마이크 권한이 필요해요</h3>
            <p>
              마이크로 피우려면<br/>
              마이크 접근 권한을 허용해 주세요.<br/><br/>
              <strong>&ldquo;습&rdquo;</strong> 소리로 들이쉬고<br/>
              <strong>&ldquo;후&rdquo;</strong> 소리로 내쉬는<br/>
              음성 인식 기능에 사용됩니다.
            </p>
            <button className={styles.micTipButton} onClick={onCloseMicDenied} autoFocus>
              확인
            </button>
          </div>
        </div>
      )}

      {showMicTip && (
        <div className={styles.micTipOverlay} role="dialog" aria-modal="true" aria-labelledby="mic-tip-title" onClick={handleMicTipDismiss}>
          <div className={styles.micTipSpotlight} />
          <div className={styles.micTipTooltip} onClick={e => e.stopPropagation()}>
            <div className={styles.micTipArrow} />
            <h3 id="mic-tip-title">마이크로 피우기</h3>
            <p>
              마이크 권한을 허용하면<br/>
              <strong>&ldquo;습&rdquo;</strong> 소리로 들이쉬고<br/>
              <strong>&ldquo;후&rdquo;</strong> 소리로 내쉴 수 있어요
            </p>
            <button className={styles.micTipButton} onClick={handleMicTipDismiss} autoFocus>
              확인
            </button>
          </div>
        </div>
      )}
    </>
  );
}
