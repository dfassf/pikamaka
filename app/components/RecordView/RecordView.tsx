'use client';

import { useMemo } from 'react';
import { loadData, getTodayCount, todayKey } from '@/app/lib/storage';
import { AppSettings } from '@/app/lib/types';
import styles from './RecordView.module.css';

interface Props {
  settings: AppSettings;
}

export default function RecordView({ settings }: Props) {
  const data = useMemo(() => loadData(), []);
  const todayCount = getTodayCount();
  const today = todayKey();

  const pct = Math.min(100, (todayCount / settings.dailyGoal) * 100);
  const sorted = [...data.records].sort((a, b) => b.date.localeCompare(a.date));

  return (
    <div className={styles.root}>
      <div className={styles.todaySummary}>
        <div className={styles.date}>
          {new Date().toLocaleDateString('ko-KR', {
            year: 'numeric', month: 'long', day: 'numeric', weekday: 'short',
          })}
        </div>
        <div className={styles.count}>{todayCount}</div>
        <div className={styles.label}>개비</div>
        <div className={styles.goal}>
          <div className={styles.goalBar}>
            <div
              className={`${styles.goalBarFill} ${pct > 100 ? styles.over : ''}`}
              style={{ width: `${pct}%` }}
            />
          </div>
          <div className={styles.goalText}>{todayCount} / {settings.dailyGoal}</div>
        </div>
      </div>

      <div className={styles.recordList}>
        {!sorted.length ? (
          <div className={styles.empty}>
            <div className={styles.emptyIcon}>📋</div>
            <p>아직 기록이 없습니다.<br />첫 가상 흡연을 시작해보세요.</p>
          </div>
        ) : (
          sorted.map(day => {
            const d = new Date(day.date + 'T00:00:00');
            const dateStr = d.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric', weekday: 'short' });
            const times = day.cigarettes.map(c => c.time).join(', ');
            const isToday = day.date === today;
            return (
              <div key={day.date} className={`${styles.recordDay} ${isToday ? styles.today : ''}`}>
                <div className={styles.dayInfo}>
                  <div className={styles.dayDate}>{dateStr}{isToday ? ' (오늘)' : ''}</div>
                  <div className={styles.dayDetail}>{times}</div>
                </div>
                <div className={styles.dayCount}>{day.cigarettes.length}</div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
