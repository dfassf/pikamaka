export const DEFAULT_MAX_PUFFS = 12;
export const DEFAULT_DAILY_GOAL = 10;

// 오디오 임계값 (실측 데이터 기반 — 변경 금지)
export const AUDIO = {
  GAIN: 2.5,
  COMPRESSOR: {
    threshold: -35,
    knee: 20,
    ratio: 6,
    attack: 0.01,
    release: 0.15,
  },
  ANALYSER: {
    fftSize: 1024,
    smoothingTimeConstant: 0.5,
    minDecibels: -90,
    maxDecibels: -10,
  },
  // 주파수 대역 경계 (Hz)
  BAND_LOW_START: 200,
  BAND_LOW_END: 1200,
  BAND_HISS_START: 2000,
  BAND_HISS_END: 6000,
  // 동적 임계값 오프셋 (noiseFloor 기준)
  QUIET_OFFSET: 0.001,
  LOUD_OFFSET: 0.012,
  SOUNDING_OFFSET: 0.002,
  // 판정 기준
  HISS_THRESHOLD: 0.15,
  LOW_R_THRESHOLD: 0.22,
  // 디바운싱 (ms)
  DEBOUNCE_IDLE: 200,
  DEBOUNCE_ACTIVE: 120,
} as const;

export const TIPS = [
  '담배를 피우고 싶을 때 3분만 참아보세요. 흡연 충동은 대개 3-5분 내에 사라집니다.',
  '물을 자주 마시면 흡연 욕구를 줄이는 데 도움이 됩니다.',
  '가벼운 운동은 니코틴 갈망을 줄이는 데 효과적입니다.',
  '금연 후 20분이면 심박수가 정상으로 돌아옵니다.',
  '금연 1년 후 심장병 위험이 흡연자의 절반으로 줄어듭니다.',
  '흡연 충동이 올 때 심호흡을 5번 해보세요.',
  '가상 흡연으로 손과 입의 습관을 대체해 보세요.',
  '금연 후 48시간이면 미각과 후각이 살아납니다.',
];
