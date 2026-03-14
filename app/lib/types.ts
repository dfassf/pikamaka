export interface CigaretteRecord {
  time: string;
}

export interface DayRecord {
  date: string;
  cigarettes: CigaretteRecord[];
}

export interface AppData {
  records: DayRecord[];
}

export interface AppSettings {
  maxPuffs: number;
  dailyGoal: number;
  quitDate?: string;        // ISO date 'YYYY-MM-DD'
  prevDailyAmount?: number;  // 금연 전 하루 흡연량 (개비)
  packPrice?: number;        // 한 갑 가격 (원)
}

export type MicState = 'idle' | 'inhaling' | 'exhaling';
export type ViewId = 'smoke' | 'record' | 'stats' | 'settings';
