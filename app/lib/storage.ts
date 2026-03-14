import { AppData, AppSettings } from './types';
import { DEFAULT_MAX_PUFFS, DEFAULT_DAILY_GOAL, DEFAULT_PACK_PRICE, STORAGE_KEYS } from './constants';

export function formatDateKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function todayKey(): string {
  return formatDateKey(new Date());
}

export function loadData(): AppData {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.DATA) || '') || { records: [] };
  } catch {
    return { records: [] };
  }
}

export function saveData(data: AppData): void {
  localStorage.setItem(STORAGE_KEYS.DATA, JSON.stringify(data));
}

export function loadSettings(): AppSettings {
  try {
    const s = JSON.parse(localStorage.getItem(STORAGE_KEYS.SETTINGS) || '');
    return {
      maxPuffs: s?.maxPuffs || DEFAULT_MAX_PUFFS,
      dailyGoal: s?.dailyGoal || DEFAULT_DAILY_GOAL,
      quitDate: s?.quitDate,
      prevDailyAmount: s?.prevDailyAmount,
      packPrice: s?.packPrice ?? DEFAULT_PACK_PRICE,
    };
  } catch {
    return { maxPuffs: DEFAULT_MAX_PUFFS, dailyGoal: DEFAULT_DAILY_GOAL, packPrice: DEFAULT_PACK_PRICE };
  }
}

export function saveSettings(settings: AppSettings): void {
  localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
}

export function addRecord(): void {
  const data = loadData();
  const key = todayKey();
  let day = data.records.find(r => r.date === key);
  if (!day) {
    day = { date: key, cigarettes: [] };
    data.records.push(day);
  }
  day.cigarettes.push({
    time: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }),
  });
  saveData(data);
}

export function getTodayCount(): number {
  const data = loadData();
  const day = data.records.find(r => r.date === todayKey());
  return day ? day.cigarettes.length : 0;
}

export function isTutorialSeen(): boolean {
  return !!localStorage.getItem(STORAGE_KEYS.TUTORIAL_SEEN);
}

export function markTutorialSeen(): void {
  localStorage.setItem(STORAGE_KEYS.TUTORIAL_SEEN, '1');
}

export function isStatsUnlocked(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEYS.STATS_UNLOCK) === todayKey();
  } catch {
    return false;
  }
}

export function unlockStats(): void {
  try {
    localStorage.setItem(STORAGE_KEYS.STATS_UNLOCK, todayKey());
  } catch {}
}
