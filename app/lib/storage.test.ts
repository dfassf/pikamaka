import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  addRecord,
  formatDateKey,
  getTodayCount,
  isStatsUnlocked,
  isTutorialSeen,
  loadData,
  loadSettings,
  markTutorialSeen,
  saveData,
  saveSettings,
  todayKey,
  unlockStats,
} from '@/app/lib/storage';
import { STORAGE_KEYS } from '@/app/lib/constants';

describe('storage', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('formatDateKey는 YYYY-MM-DD 포맷을 반환한다', () => {
    expect(formatDateKey(new Date('2026-03-14T12:00:00Z'))).toBe('2026-03-14');
  });

  it('loadData는 기본값을 반환한다', () => {
    expect(loadData()).toEqual({ records: [] });
  });

  it('loadData는 손상된 JSON일 때 기본값을 반환한다', () => {
    localStorage.setItem(STORAGE_KEYS.DATA, '{broken');
    expect(loadData()).toEqual({ records: [] });
  });

  it('saveData 후 loadData로 복원된다', () => {
    const sample = { records: [{ date: '2026-03-14', cigarettes: [{ time: '09:00' }] }] };
    saveData(sample);
    expect(loadData()).toEqual(sample);
  });

  it('loadSettings는 비어있으면 기본값을 반환한다', () => {
    const settings = loadSettings();
    expect(settings.maxPuffs).toBeGreaterThan(0);
    expect(settings.dailyGoal).toBeGreaterThan(0);
    expect(settings.packPrice).toBeGreaterThan(0);
  });

  it('saveSettings 후 loadSettings로 복원된다', () => {
    saveSettings({
      maxPuffs: 9,
      dailyGoal: 5,
      quitDate: '2026-03-10',
      prevDailyAmount: 12,
      packPrice: 5000,
    });

    expect(loadSettings()).toEqual({
      maxPuffs: 9,
      dailyGoal: 5,
      quitDate: '2026-03-10',
      prevDailyAmount: 12,
      packPrice: 5000,
    });
  });

  it('addRecord는 오늘 레코드를 생성하고 개비를 누적한다', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-03-14T09:00:00+09:00'));

    addRecord();
    addRecord();

    const data = loadData();
    expect(data.records).toHaveLength(1);
    expect(data.records[0].date).toBe(todayKey());
    expect(data.records[0].cigarettes).toHaveLength(2);
    expect(data.records[0].cigarettes[0].time).toBeTruthy();
  });

  it('getTodayCount는 오늘 개비 수를 반환한다', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-03-14T09:00:00+09:00'));

    addRecord();
    expect(getTodayCount()).toBe(1);
  });

  it('튜토리얼 seen 상태를 저장/조회한다', () => {
    expect(isTutorialSeen()).toBe(false);
    markTutorialSeen();
    expect(isTutorialSeen()).toBe(true);
  });

  it('통계 잠금 해제를 날짜 기준으로 저장/조회한다', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-03-14T09:00:00+09:00'));

    expect(isStatsUnlocked()).toBe(false);
    unlockStats();
    expect(isStatsUnlocked()).toBe(true);
  });
});
