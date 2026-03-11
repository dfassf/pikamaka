import { AppData, AppSettings, DayRecord } from './types';
import { DEFAULT_MAX_PUFFS, DEFAULT_DAILY_GOAL } from './constants';

export function todayKey(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function loadData(): AppData {
  try {
    return JSON.parse(localStorage.getItem('hanmogum_data') || '') || { records: [] };
  } catch {
    return { records: [] };
  }
}

export function saveData(data: AppData): void {
  localStorage.setItem('hanmogum_data', JSON.stringify(data));
}

export function loadSettings(): AppSettings {
  try {
    const s = JSON.parse(localStorage.getItem('hanmogum_settings') || '');
    return {
      maxPuffs: s?.maxPuffs || DEFAULT_MAX_PUFFS,
      dailyGoal: s?.dailyGoal || DEFAULT_DAILY_GOAL,
    };
  } catch {
    return { maxPuffs: DEFAULT_MAX_PUFFS, dailyGoal: DEFAULT_DAILY_GOAL };
  }
}

export function saveSettings(settings: AppSettings): void {
  localStorage.setItem('hanmogum_settings', JSON.stringify(settings));
}

export function addRecord(puffs: number): void {
  const data = loadData();
  const key = todayKey();
  let day = data.records.find(r => r.date === key);
  if (!day) {
    day = { date: key, cigarettes: [] };
    data.records.push(day);
  }
  day.cigarettes.push({
    time: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }),
    puffs,
  });
  saveData(data);
}

export function getTodayCount(): number {
  const data = loadData();
  const day = data.records.find(r => r.date === todayKey());
  return day ? day.cigarettes.length : 0;
}

export function isTutorialSeen(): boolean {
  return !!localStorage.getItem('hanmogum_tutorial_seen');
}

export function markTutorialSeen(): void {
  localStorage.setItem('hanmogum_tutorial_seen', '1');
}
