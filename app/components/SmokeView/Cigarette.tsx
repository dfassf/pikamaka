import { forwardRef } from 'react';
import styles from './SmokeView.module.css';

interface Props {
  paperHeight: number;
  ashHeight: number;
  inhaling: boolean;
}

const Cigarette = forwardRef<HTMLDivElement, Props>(
  ({ paperHeight, ashHeight, inhaling }, emberRef) => (
    <div className={styles.cigaretteWrapper}>
      <div className={`${styles.breathGuide} ${inhaling ? styles.active : ''}`} />
      <div className={styles.cigarette}>
        <div className={styles.ash} style={{ height: ashHeight }} />
        <div ref={emberRef} className={`${styles.ember} ${inhaling ? styles.glowing : ''}`} />
        <div className={styles.paper} style={{ height: paperHeight }} />
        <div className={styles.filter} />
      </div>
    </div>
  )
);

Cigarette.displayName = 'Cigarette';
export default Cigarette;
