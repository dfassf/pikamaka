'use client';

import { useMemo } from 'react';
import { loadData, getTodayCount, formatDateKey } from '@/app/lib/storage';
import { TIPS } from '@/app/lib/constants';
import styles from './StatsView.module.css';

export default function StatsView() {
  const data = loadData();
  const records = data.records;
  const totalDays = records.length;
  const totalCigs = records.reduce((s, d) => s + d.cigarettes.length, 0);
  const avgPerDay = totalDays > 0 ? (totalCigs / totalDays).toFixed(1) : '0';
  const todayCount = getTodayCount();

  // 최저 기록
  let bestCount = Infinity;
  let bestDay = '-';
  records.forEach(r => {
    if (r.cigarettes.length > 0 && r.cigarettes.length < bestCount) {
      bestCount = r.cigarettes.length;
      bestDay = new Date(r.date + 'T00:00:00').toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' });
    }
  });
  if (bestCount === Infinity) { bestCount = 0; bestDay = '-'; }

  // 주간 차트 데이터
  const weeklyDays = useMemo(() => {
    const today = new Date();
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const key = formatDateKey(d);
      const rec = records.find(r => r.date === key);
      days.push({
        label: d.toLocaleDateString('ko-KR', { weekday: 'short' }),
        count: rec ? rec.cigarettes.length : 0,
        isToday: i === 0,
      });
    }
    return days;
  }, [records]);

  const maxCount = Math.max(...weeklyDays.map(d => d.count), 1);

  // 랜덤 팁
  const tip = useMemo(() => TIPS[Math.floor(Math.random() * TIPS.length)], []);

  return (
    <div className={styles.root}>
      <div className={styles.statCards}>
        <div className={`${styles.statCard} ${styles.highlight}`}>
          <div className={styles.statLabel}>오늘</div>
          <div className={styles.statValue}>{todayCount}</div>
          <div className={styles.statUnit}>개비</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statLabel}>일 평균</div>
          <div className={styles.statValue}>{avgPerDay}</div>
          <div className={styles.statUnit}>개비</div>
        </div>
        <div className={`${styles.statCard} ${styles.success}`}>
          <div className={styles.statLabel}>최저 기록</div>
          <div className={styles.statValue}>{bestCount}</div>
          <div className={styles.statUnit}>{bestDay}</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statLabel}>총 기록</div>
          <div className={styles.statValue}>{totalDays}</div>
          <div className={styles.statUnit}>일</div>
        </div>
      </div>

      <div className={styles.weeklyChart}>
        <h3>주간 흡연량</h3>
        <div className={styles.chartBars}>
          {weeklyDays.map((d, i) => (
            <div key={i} className={styles.barWrapper}>
              <div className={styles.barCount}>{d.count || ''}</div>
              <div className={styles.barTrack}>
                <div
                  className={`${styles.bar} ${d.isToday ? styles.today : ''}`}
                  style={{ height: `${(d.count / maxCount) * 100}%` }}
                />
              </div>
              <div className={styles.barLabel}>{d.label}</div>
            </div>
          ))}
        </div>
      </div>

      <div className={styles.tipCard}>
        <h3>금연 팁</h3>
        <p>{tip}</p>
      </div>
    </div>
  );
}
