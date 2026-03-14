'use client';

import { useState, useMemo, useCallback } from 'react';
import { AppSettings } from '@/app/lib/types';
import { loadData, getTodayCount, formatDateKey, isStatsUnlocked, unlockStats } from '@/app/lib/storage';
import { QUIT_MILESTONES } from '@/app/lib/constants';
import { isIntossRuntime } from '@/app/lib/intoss';
import styles from './StatsView.module.css';

const PACK_SIZE = 20;
const LOCKED_PREVIEW_BAR_HEIGHTS = [42, 64, 36, 58, 47, 70, 40] as const;

interface Props {
  settings: AppSettings;
}

export default function StatsView({ settings }: Props) {
  const [locked, setLocked] = useState(() => isIntossRuntime() && !isStatsUnlocked());

  const handleUnlock = useCallback(() => {
    // TODO: 광고 SDK 연동 시 여기서 loadAndShowRewarded() 호출
    unlockStats();
    setLocked(false);
  }, []);

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

  // 인사이트 계산
  const insight = useMemo(() => {
    if (!settings.quitDate || !settings.prevDailyAmount) return null;
    const quit = new Date(settings.quitDate + 'T00:00:00');
    const now = new Date();
    const diffMs = now.getTime() - quit.getTime();
    if (diffMs < 0) return null;

    const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const notSmoked = settings.prevDailyAmount * days;
    const pricePerCig = (settings.packPrice ?? 4500) / PACK_SIZE;
    const saved = Math.round(notSmoked * pricePerCig);

    const milestone = QUIT_MILESTONES.find(m => days >= m.minDays)!;
    return { days, notSmoked, saved, message: milestone.message };
  }, [settings.quitDate, settings.prevDailyAmount, settings.packPrice]);

  if (locked) {
    return (
      <div className={styles.root}>
        <div className={styles.lockedWrap}>
          <div className={styles.lockedBlur} aria-hidden>
            <div className={styles.statCards}>
              {['오늘', '일 평균', '최저 기록', '총 기록'].map(label => (
                <div key={label} className={styles.statCard}>
                  <div className={styles.statLabel}>{label}</div>
                  <div className={styles.statValue}>--</div>
                  <div className={styles.statUnit}>-</div>
                </div>
              ))}
            </div>
            <div className={styles.weeklyChart}>
              <h3>주간 흡연량</h3>
              <div className={styles.chartBars}>
                {['일','월','화','수','목','금','토'].map((d, idx) => (
                  <div key={d} className={styles.barWrapper}>
                    <div className={styles.barCount} />
                    <div className={styles.barTrack}>
                      <div
                        className={styles.bar}
                        style={{ height: `${LOCKED_PREVIEW_BAR_HEIGHTS[idx]}%` }}
                      />
                    </div>
                    <div className={styles.barLabel}>{d}</div>
                  </div>
                ))}
              </div>
            </div>
            <div className={styles.insightCard}>
              <h3>금연 인사이트</h3>
              <div className={styles.insightList}>
                {['금연 일째', '절약한 금액', '안 피운 개비'].map(label => (
                  <div key={label} className={styles.insightItem}>
                    <div className={styles.insightLabel}>{label}</div>
                    <div className={styles.insightValue}>---</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className={styles.lockedOverlay}>
            <button className={styles.unlockButton} onClick={handleUnlock}>
              광고 보고 통계 보기
            </button>
          </div>
        </div>
      </div>
    );
  }

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

      {insight && (
        <div className={styles.insightCard}>
          <h3>금연 인사이트</h3>
          <div className={styles.insightList}>
            <div className={styles.insightItem}>
              <div className={styles.insightLabel}>금연 일째</div>
              <div className={styles.insightValue}>{insight.days}일</div>
            </div>
            <div className={styles.insightItem}>
              <div className={styles.insightLabel}>절약한 금액</div>
              <div className={`${styles.insightValue} ${styles.insightSaved}`}>
                {insight.saved.toLocaleString()}원
              </div>
            </div>
            <div className={styles.insightItem}>
              <div className={styles.insightLabel}>안 피운 개비</div>
              <div className={styles.insightValue}>{insight.notSmoked.toLocaleString()}개비</div>
            </div>
          </div>
          <p className={styles.insightMessage}>{insight.message}</p>
        </div>
      )}
    </div>
  );
}
