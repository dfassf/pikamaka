export const DEFAULT_MAX_PUFFS = 12;
export const DEFAULT_DAILY_GOAL = 10;
export const DEFAULT_PACK_PRICE = 4500; // 한 갑 기본 가격 (원)

export const STORAGE_KEYS = {
  DATA: 'hanmogum_data',
  SETTINGS: 'hanmogum_settings',
  TUTORIAL_SEEN: 'hanmogum_tutorial_seen',
  STATS_UNLOCK: 'hanmogum_stats_unlock',
} as const;

export const PUFF_MS = 1500;           // 터치 1모금 시간(ms)
export const EXHALE_DISPLAY_MS = 1200; // 내쉬기 텍스트 표시 시간(ms)

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

// 금연 일수 기반 마일스톤 (minDays 내림차순 — 첫 매칭 사용)
export const QUIT_MILESTONES = [
  { minDays: 365, message: '1년을 넘기셨어요! 심장병 위험이 흡연자의 절반으로 줄었습니다. 정말 대단해요!' },
  { minDays: 180, message: '반년이 지났어요! 폐 기능이 눈에 띄게 좋아졌을 거예요. 이제 거의 비흡연자나 다름없어요!' },
  { minDays: 90, message: '3개월 돌파! 체내 니코틴이 거의 사라졌어요. 금단현상도 이제 옛말이죠? 너무 잘하고 계세요!' },
  { minDays: 30, message: '한 달을 버텼어요! 폐 기능이 회복되기 시작하는 시기예요. 숨쉬기가 한결 편해졌을 거예요. 대단합니다!' },
  { minDays: 14, message: '2주 돌파! 금단현상이 서서히 줄어드는 시기예요. 가장 힘든 고비를 넘기고 계세요. 정말 멋져요!' },
  { minDays: 7, message: '일주일째! 지금이 가장 힘든 시기인데 정말 잘 버티고 계세요. 여기서 포기하면 안 돼요! 응원합니다!' },
  { minDays: 3, message: '3일째! 체내 니코틴이 빠져나가기 시작해요. 금단현상이 올 수 있지만 곧 나아질 거예요. 힘내세요!' },
  { minDays: 1, message: '금연 첫날! 두통이나 짜증이 날 수 있어요. 정상적인 금단현상이니 걱정 마세요. 시작이 반이에요!' },
  { minDays: 0, message: '오늘부터 새로운 시작이에요! 금연을 결심한 것만으로도 대단합니다. 함께 해볼까요?' },
] as const;

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
