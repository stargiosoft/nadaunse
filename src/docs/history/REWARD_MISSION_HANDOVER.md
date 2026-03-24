# 리워드 미션 기능 인수인계서

> **작성일**: 2026-03-16
> **상태**: v1.0 (초기 구현 완료)

---

## 1. 기능 개요

**리워드함**은 사용자가 나다움 태그를 수집하면서 달성할 수 있는 미션 목록과 보상을 한눈에 확인하는 페이지입니다.

| 항목 | 내용 |
|------|------|
| **진입점** | 홈 화면 우측 상단 리워드 아이콘 (기존 프로필 아이콘 대체) |
| **경로** | `/rewards` |
| **로그인 필요** | 예 (비로그인 시 로그인 유도 다이얼로그) |

---

## 2. 파일 구조

| 파일 | 역할 |
|------|------|
| `src/pages/RewardMissionPage.tsx` | 리워드함 페이지 (신규) |
| `src/pages/HomeScreenNew.tsx` | 홈 헤더 아이콘 변경 (UserIcon → RewardIcon) |
| `src/App.tsx` | `/rewards` 라우트 추가 |

### 변경 이력

| 파일 | 변경 내용 |
|------|----------|
| `HomeScreenNew.tsx` | `UserIcon` → `RewardIcon` (선물 상자 SVG), `handleUserIconClick` → `handleRewardClick`, 네비게이션 `/profile` → `/rewards` |
| `App.tsx` | `import RewardMissionPage` 추가, `<Route path="/rewards">` 추가 |

---

## 3. 미션 목록

총 **7개** 미션이 정의되어 있으며, 모두 나다움 태그 수집 기반입니다.

| # | 미션 ID | 미션명 | 필요 태그 | 보상 종류 | 보상 내용 | CTA |
|---|---------|--------|-----------|----------|----------|-----|
| 1 | `first-tags` | 나다움 태그 5개 모으기 | 5개 | 새싹 | 새싹 30개 | - |
| 2 | `unlock-report` | 나다움 보고서 열기 | 5개 | 보고서 | 주간 보고서 오픈 | - |
| 3 | `analysis-nature` | 기질·성격 상세 분석 | 5개 | 보고서 | 상세 분석 오픈 | `/nadaum/nature` |
| 4 | `analysis-career` | 직업·적성 상세 분석 | 10개 | 보고서 | 상세 분석 오픈 | `/nadaum/career` |
| 5 | `analysis-health` | 건강·체질 상세 분석 | 15개 | 보고서 | 상세 분석 오픈 | `/nadaum/health` |
| 6 | `analysis-love` | 연애·궁합 상세 분석 | 20개 | 보고서 | 상세 분석 오픈 | `/nadaum/love` |
| 7 | `analysis-money` | 재물·금전 상세 분석 | 25개 | 보고서 | 상세 분석 오픈 | `/nadaum/money` |

### 미션 상태 판정

```
완료: tagCount >= mission.tagRequired
진행중: tagCount < mission.tagRequired (프로그레스 바 표시)
```

미션 상태는 **실시간 DB 조회** 기반이며, 별도 미션 완료 테이블은 없습니다.

---

## 4. 데이터 흐름

### 4.1 페이지 로드 시 조회

```
RewardMissionPage mount
  ├── getAuthUser() → 비로그인이면 로그인 다이얼로그 표시
  │
  ├── [병렬 조회]
  │   ├── user_trait_tags (count, is_confirmed=true) → tagCount
  │   └── sprout_transactions (transaction_type='reward') → totalRewardSprouts 합산
  │
  └── useSproutBalance() → 현재 새싹 잔고 (캐시 + DB)
```

### 4.2 조회하는 테이블

| 테이블 | 조회 내용 | 조건 |
|--------|----------|------|
| `user_trait_tags` | 확인된 태그 수 (count) | `user_id`, `is_confirmed = true` |
| `sprout_transactions` | 리워드 새싹 합계 | `user_id`, `transaction_type = 'reward'` |
| `users` | 새싹 잔고 (`sprout_balance`) | `useSproutBalance` 훅 |

### 4.3 새싹 보상 지급 흐름 (기존 로직)

리워드함 페이지에서는 **표시만** 합니다. 실제 새싹 지급은 기존 `CheckRecordMe` 컴포넌트에서 수행:

```
CheckRecordMe → saveTags() 완료
  → grant-mission-sprout Edge Function 호출
  → process_mission_reward RPC (30새싹 지급)
  → sprout_transactions 기록 (transaction_type='reward')
  → writeSproutBalanceCache() 캐시 갱신
```

---

## 5. UI 구성

### 5.1 상단 카드 영역

```
┌─────────────────────────────────┐
│ 🌱 내 새싹              리워드 적립 │
│    80개                    +30  │
└─────────────────────────────────┘
┌─────────────────────────────────┐
│ 나다움 태그              12개 수집 │
└─────────────────────────────────┘
```

### 5.2 미션 카드

```
┌─────────────────────────────────┐
│ [이모지]  미션 제목         ✅/🔒 │
│           설명 텍스트             │
│           [🌱 새싹 30개]  달성!   │
│           [분석 보러가기] ← CTA   │
└─────────────────────────────────┘

미완료 시:
│           3 / 10개         30%  │
│           [████░░░░░░░░]        │
```

### 5.3 비로그인 다이얼로그

ConfirmDialog 스타일 (★DESIGN_SYSTEM★.md §3.5):
- 오버레이: `rgba(0, 0, 0, 0.6)`
- 컨테이너: 320px, radius 24px
- 아이콘: 76x76 원형 배경 `#E4F7F7`
- 2버튼: 돌아가기(#f3f3f3) + 로그인(#48b2af)

---

## 6. 홈 헤더 아이콘 변경

| Before | After |
|--------|-------|
| 사람 아이콘 (`UserIcon`) | 선물 상자 아이콘 (`RewardIcon`) |
| 클릭 → `/profile` (로그인) 또는 `/login` | 클릭 → `/rewards` (항상) |

프로필 진입은 이제 하단 탭바(`BottomTabBar`)의 프로필 탭으로만 가능합니다.

---

## 7. 디자인 시스템 준수 사항

| 항목 | 적용 |
|------|------|
| 페이지 레이아웃 | `max-w-[440px]` 중앙 정렬 (§2.1) |
| NavigationHeader | §3.1 (52px, fixed top-0) |
| 타이포그래피 | 모든 텍스트 inline style (§4.2) |
| 색상 토큰 | textPrimary `#151515`, textCaption `#848484` 등 (§1.1) |
| 아이콘 박스 | 44x44, radius 16px (§3.11) |
| 카드 border | `1px solid #f3f3f3` |
| 버튼 인터랙션 | `scale(0.99)` pointerDown (§3.3) |
| 다이얼로그 | 320px, radius 24px, 48px 버튼 (§3.5) |

---

## 8. 향후 확장 포인트

### 8.1 새 미션 추가

`MISSIONS` 배열에 `MissionDef` 객체를 추가하면 자동으로 UI에 반영됩니다:

```tsx
{
  id: 'new-mission',
  title: '미션 제목',
  description: '미션 설명',
  emoji: '🎯',
  color: '#48b2af',
  bgColor: '#f0f8f8',
  tagRequired: 30,       // 필요 태그 수
  rewardType: 'sprout',  // 'sprout' | 'report'
  rewardAmount: 50,      // sprout일 때만
  rewardLabel: '새싹 50개',
  ctaPath: '/some-page', // 선택 (완료 후 이동)
  ctaLabel: '보러가기',   // 선택
}
```

### 8.2 고려할 확장

| 기능 | 설명 |
|------|------|
| **미션 완료 테이블** | 현재 태그 수로만 판정 → DB에 미션 완료 기록 저장 시 이력 관리 가능 |
| **다양한 미션 조건** | 태그 외 조건 (연속 방문, 특정 콘텐츠 열람 등) 추가 시 `MissionDef`에 조건 타입 분기 필요 |
| **새싹 자동 지급** | 현재 새싹 지급은 `CheckRecordMe`에서만 → 리워드함에서 직접 "받기" 버튼 추가 가능 |
| **알림 뱃지** | 홈 아이콘에 미완료 미션 수 뱃지 표시 |
| **애니메이션** | 미션 완료 시 confetti/축하 모션 |

---

## 9. 관련 문서

| 문서 | 위치 |
|------|------|
| 디자인 시스템 | `src/docs/develop/★DESIGN_SYSTEM★.md` |
| DB 스키마 | `src/DATABASE_SCHEMA.md` (sprout_transactions, user_trait_tags) |
| Edge Function | `supabase/functions/grant-mission-sprout/index.ts` |
| 나다움 분석 | `src/docs/NADAUM_ANALYSIS_PROGRESS.md` |
| 컴포넌트 인벤토리 | `src/components-inventory.md` |

---

**최종 업데이트**: 2026-03-16
