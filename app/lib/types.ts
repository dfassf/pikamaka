export interface CigaretteRecord {
  time: string;
  puffs: number;
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
}

export type MicState = 'idle' | 'inhaling' | 'exhaling';
export type ViewId = 'smoke' | 'record' | 'stats';
