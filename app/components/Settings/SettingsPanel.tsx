'use client';

import { useState } from 'react';
import { loadSettings, saveSettings } from '@/app/lib/storage';
import Button from '@/app/components/Button/Button';
import styles from './SettingsPanel.module.css';

interface Props {
  onClose: () => void;
}

export default function SettingsPanel({ onClose }: Props) {
  const settings = loadSettings();
  const [dailyGoal, setDailyGoal] = useState(settings.dailyGoal);
  const [maxPuffs, setMaxPuffs] = useState(settings.maxPuffs);

  function handleClose() {
    saveSettings({
      dailyGoal: dailyGoal || 10,
      maxPuffs: maxPuffs || 12,
    });
    onClose();
  }

  function handleReset() {
    if (confirm('모든 흡연 기록을 삭제하시겠습니까?')) {
      localStorage.removeItem('hanmogum_data');
      handleClose();
    }
  }

  return (
    <div className={styles.overlay} onClick={e => { if (e.target === e.currentTarget) handleClose(); }}>
      <div className={styles.panel}>
        <h2>
          설정
          <button className={styles.closeBtn} onClick={handleClose}>&times;</button>
        </h2>
        <div className={styles.item}>
          <div className={styles.label}>
            하루 목표
            <small>하루 최대 개비 수</small>
          </div>
          <input
            type="number"
            className={styles.input}
            min={1} max={50}
            value={dailyGoal}
            onChange={e => setDailyGoal(parseInt(e.target.value) || 0)}
          />
        </div>
        <div className={styles.item}>
          <div className={styles.label}>
            한 개비 퍼프 수
            <small>한 개비에 필요한 퍼프</small>
          </div>
          <input
            type="number"
            className={styles.input}
            min={3} max={30}
            value={maxPuffs}
            onChange={e => setMaxPuffs(parseInt(e.target.value) || 0)}
          />
        </div>
        <Button variant="danger" fullWidth onClick={handleReset}>모든 기록 초기화</Button>
      </div>
    </div>
  );
}
