# 필까말까 (pikamaka)

가상 흡연으로 금연을 돕는 모바일 웹앱.

담배를 피우고 싶을 때, 진짜 대신 가상으로. 터치하거나 마이크에 "습/후" 소리를 내면 화면 속 담배가 타들어갑니다.

## 주요 기능

- **가상 흡연** — 터치(꾹 누르기) 또는 마이크 입력으로 담배 피우기 시뮬레이션
- **흡연 기록** — 날짜별 가상 흡연 횟수 자동 기록
- **통계** — 주간 흡연량 차트, 일 평균, 최저 기록
- **금연 인사이트** — 금연 일수, 절약 금액, 안 피운 개비 + 시기별 응원 멘트
- **설정** — 하루 목표, 모금 수, 금연 시작일, 갑 가격 등

## 기술 스택

- Next.js (App Router) + React + TypeScript
- CSS Modules
- localStorage 기반 데이터 저장
- Web Audio API (마이크 입력 감지)

## 실행

```bash
npm install
npm run dev
```

## 프로젝트 구조

```
app/
├── components/
│   ├── SmokeView/      # 메인 흡연 화면
│   ├── RecordView/     # 기록 탭
│   ├── StatsView/      # 통계 탭
│   ├── Settings/       # 설정 탭
│   ├── DatePicker/     # 드럼롤 날짜 선택기
│   ├── BottomNav/      # 하단 네비게이션
│   └── Tutorial/       # 온보딩
├── hooks/
│   ├── useAudio.ts     # 마이크 입력 처리
│   ├── useCigarette.ts # 담배 상태 관리
│   ├── useTouchPuff.ts # 터치 입력 처리
│   └── useSmokeCanvas.ts # 연기 캔버스 애니메이션
├── lib/
│   ├── constants.ts    # 상수 (오디오 임계값, 마일스톤 등)
│   ├── storage.ts      # localStorage CRUD
│   └── types.ts        # 타입 정의
└── page.tsx            # 루트 페이지
```
