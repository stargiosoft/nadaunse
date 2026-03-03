# 공유 리워드 기능 구현 계획서

> **작성일**: 2026-02-26
> **최종 업데이트**: 2026-02-27
> **상태**: Phase 1~2 코드 구현 완료 → Staging 배포 대기
> **관련 문서**: CLAUDE.md, PROJECT_CONTEXT.md, DATABASE_SCHEMA.md

---

## 1. 기능 개요

### 서비스 목적
- 사용자가 콘텐츠를 친구에게 공유 → 친구가 회원가입 → 공유한 사용자에게 **30새싹** 리워드 지급
- 리워드 회차마다 필요한 친구 수가 **피보나치 수열**로 증가 → 초기 진입장벽 낮추되, 무한 어뷰징 방지

### 피보나치 수열 회차 설계

| 회차 | 필요 친구 수 | 리워드 | 누적 친구 수 | 누적 새싹 |
|------|-------------|--------|-------------|----------|
| 1차 | **1명** | 30새싹 | 1명 | 30 |
| 2차 | **1명** | 30새싹 | 2명 | 60 |
| 3차 | **2명** | 30새싹 | 4명 | 90 |
| 4차 | **3명** | 30새싹 | 7명 | 120 |
| 5차 | **5명** | 30새싹 | 12명 | 150 |
| 6차 | **8명** | 30새싹 | 20명 | 180 |
| 7차 | **13명** | 30새싹 | 33명 | 210 |
| ... | 피보나치(n) | 30새싹 | ... | ... |

- **최대 회차 제한: 없음** (무제한 도전 가능)
- 피보나치 계산: `f(1)=1, f(2)=1, f(n)=f(n-1)+f(n-2)`

---

## 2. 설계 결정 (Design Decisions)

### Q1. 레퍼럴 코드 방식
- **결정: 유저당 고정 1개**
- 형식: `NDS-{랜덤6자}` (예: `NDS-a3xK9m`)
- 회원가입 시 자동 생성, 변경 불가
- 장점: 단순, 기억하기 쉬움, 관리 비용 낮음

### Q2. 친구 카운팅 방식
- **결정: 회차별 리셋**
- 1회차 1명 달성 → 카운트 0으로 리셋 → 2회차 새로 카운팅
- UI에서 "이번 회차 N/M명" 형태로 직관적 표시 가능
- 예시: 3회차 진행 중 → "2명 중 1명 완료" 표시

### Q3. 최대 회차 제한
- **결정: 제한 없음**
- 피보나치 수열 자체가 자연스러운 난이도 곡선 제공
- 6차(8명) 이상부터는 자연스럽게 도전자 감소

### Q4. 부정 방지
- **결정: 기존 무료 콘텐츠 비회원 제한과 동일한 검증 방식 적용**
- 현행 시스템: 클라이언트(localStorage) + 서버(IP+UA SHA-256 fingerprint) 이중 검증
- 공유 리워드에도 동일하게 적용:
  - 레퍼럴 가입 시 IP+UA fingerprint 기록
  - 동일 fingerprint로 다수 가입 시 카운트 제외 (같은 추천인 기준 3개 이상 차단)
- 추가 부정 방지(본인 다중 가입, 가입 후 즉시 탈퇴 등)는 **향후 개발 예정**

### Q5. 리워드 알림
- **결정: 현재 버전은 알림 없음**
- 프로필 페이지에서 새싹 잔액 변동으로 충전 여부 확인 가능 (`useSproutBalance`)
- **고도화 예정**: 리워드 수급 내역 확인 페이지, 카카오 알림톡 발송

---

## 3. 전체 플로우

### 3-1. 공유 → 가입 → 리워드 플로우

```
[User A] 콘텐츠 상세 페이지 (MasterContentDetailPage)
    ↓
"공유하고 30새싹 받기" 버튼 클릭
    ↓
ShareRewardModal 열림
    ├─ 로그인 상태 → 공유 채널 선택 (카카오톡 / 링크 복사)
    └─ 로그아웃 상태 → "로그인하고 리워드 받기" 버튼
    ↓
공유 링크 생성: nadaunse.com/product/{contentId}?ref={referralCode}
    ↓
[User B] 링크 클릭
    ↓
App.tsx captureReferralFromUrl() → localStorage 저장 + URL에서 ref 제거
    ↓
콘텐츠 상세 페이지 도착
    ↓
[User B] 회원가입 진행 (Google / Kakao)
    ↓
AuthCallback.tsx → 신규 사용자 감지
    ├─ getPendingReferral() → localStorage에서 ref 코드 확인
    ├─ 있으면 → processReferral() non-blocking 호출
    └─ 없으면 → 기존 플로우 유지
    ↓
process-referral Edge Function
    ├─ 1. ref 코드 → referrer_id 조회 (users 테이블)
    ├─ 2. process_share_reward RPC 호출
    │     ├─ 자기 추천 방지
    │     ├─ 중복 가입 체크 (UNIQUE 제약)
    │     ├─ IP+UA fingerprint 부정 방지 (3개 이상 차단)
    │     ├─ referral_signups 기록
    │     ├─ 현재 회차 카운트 증가
    │     └─ 회차 달성 시 → 30새싹 자동 적립 + 다음 회차 생성
    └─ 3. 결과 반환 (성공 여부, 리워드 지급 여부)
    ↓
[User A] 프로필에서 새싹 잔액 확인
```

### 3-2. 리워드 상태 조회 플로우

```
[User A] 공유 모달 열기 또는 리워드 안내 페이지 접근
    ↓
useShareRewardStatus() → get-share-reward-status Edge Function 호출
    ↓
응답:
{
  referralCode: "NDS-a3xK9m",
  currentRound: 3,
  requiredCount: 2,
  currentCount: 1,
  totalRewardsEarned: 60,
  totalFriendsReferred: 3
}
    ↓
UI에 "이번 회차: 2명 중 1명 완료" 표시
```

---

## 4. DB 스키마 설계

### 4-1. users 테이블 변경

```sql
ALTER TABLE users ADD COLUMN IF NOT EXISTS referral_code TEXT UNIQUE;
-- 기존 사용자: 마이그레이션에서 일괄 생성
-- 신규 사용자: users Edge Function에서 자동 생성
```

### 4-2. referral_signups (신규 테이블)

```sql
CREATE TABLE referral_signups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  referred_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reward_round INTEGER NOT NULL,
  ip_fingerprint TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT unique_referred UNIQUE (referred_id)
);
```

### 4-3. share_rewards (신규 테이블)

```sql
CREATE TABLE share_rewards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  round INTEGER NOT NULL,
  required_count INTEGER NOT NULL,
  current_count INTEGER NOT NULL DEFAULT 0,
  sprout_amount INTEGER NOT NULL DEFAULT 30,
  achieved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT unique_user_round UNIQUE (user_id, round)
);
```

### 4-4. RPC 함수
- `get_fibonacci(n)` - 피보나치 계산 (IMMUTABLE)
- `process_share_reward(p_referrer_id, p_referred_id, p_ip_fingerprint)` - 리워드 처리 (SECURITY DEFINER)

### 4-5. RLS 정책
- `referral_signups`: 본인 추천 기록만 SELECT 가능
- `share_rewards`: 본인 리워드 회차만 SELECT 가능
- INSERT/UPDATE는 Edge Function (Service Role Key)에서만 처리

---

## 5. Edge Functions (신규 2개)

### 5-1. process-referral
| 항목 | 내용 |
|------|------|
| **경로** | `supabase/functions/process-referral/index.ts` |
| **트리거** | User B 회원가입 시 AuthCallback에서 non-blocking 호출 |
| **인증** | JWT (User B의 토큰) |
| **--no-verify-jwt** | 불필요 |

### 5-2. get-share-reward-status
| 항목 | 내용 |
|------|------|
| **경로** | `supabase/functions/get-share-reward-status/index.ts` |
| **트리거** | 공유 모달 열 때, 리워드 안내 페이지 진입 시 |
| **인증** | JWT (본인 토큰) |

---

## 6. 안내 페이지 콘텐츠 ("꼭 확인해주세요")

기존 수익 모델(10% 수익, 출금, 세금) → 새싹 리워드 프로모션으로 전면 교체

```
꼭 확인해주세요

• 공유 링크를 통해 친구가 회원가입을 완료해야 1명으로 인정돼요
• 이미 가입된 회원이 링크를 눌러도 친구 수에 포함되지 않아요
• 리워드는 회차가 올라갈수록 필요한 친구 수가 늘어나요
  - 1회차 1명 → 2회차 1명 → 3회차 2명 → 4회차 3명 → ...
• 카카오톡 또는 링크 복사 버튼으로 공유해야 인정돼요
  (URL 직접 복사는 인정 안 돼요)
• 새싹은 회차 조건 달성 즉시 자동 적립돼요
• 본인 다중 가입 등 부정한 방법으로 얻은 새싹은 회수될 수 있어요
• 리워드 조건과 보상은 사전 공지 후 변경될 수 있어요
```

---

## 7. 구현 진행 상황 + TO DO LIST

### Phase 1: 백엔드 (DB + Edge Functions) — ✅ 코드 완료

| # | 작업 | 상태 | 파일 |
|---|------|------|------|
| 1 | 마이그레이션 SQL 작성 | ✅ 완료 | `supabase/migrations/20260227_add_share_reward_system.sql` |
| 2 | users 테이블 referral_code 컬럼 + 기존 사용자 일괄 생성 | ✅ 완료 | 마이그레이션 SQL에 포함 |
| 3 | users Edge Function에 referral_code 자동 생성 추가 | ✅ 완료 | `supabase/functions/users/index.ts` |
| 4 | `process-referral` Edge Function 구현 | ✅ 완료 | `supabase/functions/process-referral/index.ts` |
| 5 | `get-share-reward-status` Edge Function 구현 | ✅ 완료 | `supabase/functions/get-share-reward-status/index.ts` |
| 6 | **Staging에 마이그레이션 적용** | ⬜ 미완료 | Supabase Dashboard에서 SQL 실행 |
| 7 | **Staging에 Edge Functions 배포** | ⬜ 미완료 | `npm run deploy:staging` 또는 수동 배포 |

### Phase 2: 프론트엔드 (Core) — ✅ 핵심 로직 완료 / ⬜ UI 미완료

| # | 작업 | 상태 | 파일 |
|---|------|------|------|
| 8 | `shareRewardService.ts` 서비스 구현 | ✅ 완료 | `src/lib/shareRewardService.ts` |
| 9 | `useShareRewardStatus` Hook 구현 | ✅ 완료 | `src/hooks/useShareRewardStatus.ts` |
| 10 | `AuthCallback.tsx`에 레퍼럴 처리 로직 추가 | ✅ 완료 | `src/pages/AuthCallback.tsx` |
| 11 | `App.tsx`에 URL ref 파라미터 캡처 추가 | ✅ 완료 | `src/App.tsx` |
| 12 | **`ShareRewardModal` 컴포넌트 구현** | ⬜ 미완료 | `src/components/ShareRewardModal.tsx` |
| 13 | **`MasterContentDetailPage`에 공유 버튼 추가** | ⬜ 미완료 | `src/components/MasterContentDetailPage.tsx` |

### Phase 3: 안내 페이지 — ⬜ 미완료

| # | 작업 | 상태 | 파일 |
|---|------|------|------|
| 14 | **`ShareRewardInfoPage` 리뉴얼** | ⬜ 미완료 | `src/components/ShareRewardInfoPage.tsx` |
| 15 | **App.tsx에 안내 페이지 라우트 추가** | ⬜ 미완료 | `src/App.tsx` |

### Phase 4: 검증 및 배포 — ⬜ 미완료

| # | 작업 | 상태 | 비고 |
|---|------|------|------|
| 16 | Staging 마이그레이션 적용 | ⬜ | Supabase Dashboard → SQL Editor |
| 17 | Staging Edge Functions 배포 | ⬜ | process-referral, get-share-reward-status, users |
| 18 | Staging E2E 테스트 (공유 → 가입 → 리워드) | ⬜ | 전체 플로우 검증 |
| 19 | 부정 방지 검증 (동일 IP/기기) | ⬜ | fingerprint 3개 이상 차단 확인 |
| 20 | 배포 스크립트 업데이트 | ⬜ | `deploy-production.bat`, `deploy-staging.bat` |
| 21 | Production 마이그레이션 적용 | ⬜ | |
| 22 | Production 배포 | ⬜ | |

### Phase 5: 문서 업데이트 — ⬜ 미완료

| # | 작업 | 상태 | 파일 |
|---|------|------|------|
| 23 | CLAUDE.md 업데이트 (Edge Function 수, 배포 목록) | ⬜ | `CLAUDE.md` |
| 24 | PROJECT_CONTEXT.md 업데이트 (공유 리워드 플로우) | ⬜ | `src/PROJECT_CONTEXT.md` |
| 25 | DATABASE_SCHEMA.md 업데이트 (신규 테이블) | ⬜ | `src/DATABASE_SCHEMA.md` |
| 26 | components-inventory.md 업데이트 (신규 컴포넌트) | ⬜ | `src/components-inventory.md` |
| 27 | EDGE_FUNCTIONS_GUIDE.md 업데이트 | ⬜ | `supabase/EDGE_FUNCTIONS_GUIDE.md` |
| 28 | RLS_POLICIES.md 업데이트 | ⬜ | `supabase/RLS_POLICIES.md` |
| 29 | DATABASE_TRIGGERS_AND_FUNCTIONS.md 업데이트 | ⬜ | `supabase/DATABASE_TRIGGERS_AND_FUNCTIONS.md` |

### Phase 6: 고도화 (향후) — ⬜ 미완료

| # | 작업 | 상태 | 비고 |
|---|------|------|------|
| 30 | 리워드 수급 내역 페이지 | ⬜ | 프로필 탭 추가 |
| 31 | 회차 달성 시 카카오 알림톡 발송 | ⬜ | send-alimtalk 연동 |
| 32 | 가입 후 최소 유지 기간(7일) 검증 | ⬜ | 탈퇴 시 리워드 취소 |
| 33 | 통계 대시보드에 공유 리워드 지표 추가 | ⬜ | StatsDashboard 수정 |

---

## 8. 파일 목록 총정리

### 신규 생성 — ✅ 완료

| 파일 | 역할 | 상태 |
|------|------|------|
| `supabase/migrations/20260227_add_share_reward_system.sql` | DB 마이그레이션 (테이블 2개 + RPC 2개 + RLS + 인덱스) | ✅ |
| `supabase/functions/process-referral/index.ts` | 레퍼럴 처리 Edge Function | ✅ |
| `supabase/functions/get-share-reward-status/index.ts` | 리워드 상태 조회 Edge Function | ✅ |
| `src/lib/shareRewardService.ts` | ref 캡처, 처리, 링크 생성, 상태 조회 | ✅ |
| `src/hooks/useShareRewardStatus.ts` | 리워드 상태 조회 Hook | ✅ |

### 신규 생성 — ⬜ 미완료

| 파일 | 역할 | 상태 |
|------|------|------|
| `src/components/ShareRewardModal.tsx` | 공유 모달 (카카오톡/링크복사 + 회차 진행률) | ⬜ |
| `src/components/ShareRewardInfoPage.tsx` | 리워드 안내 페이지 | ⬜ |

### 수정 — ✅ 완료

| 파일 | 변경 내용 | 상태 |
|------|----------|------|
| `supabase/functions/users/index.ts` | 신규 사용자 생성 시 `referral_code` 자동 생성 | ✅ |
| `src/pages/AuthCallback.tsx` | 신규 사용자 감지 시 `processReferral()` non-blocking 호출 | ✅ |
| `src/App.tsx` | 앱 마운트 시 `captureReferralFromUrl()` 호출 | ✅ |

### 수정 — ⬜ 미완료

| 파일 | 변경 내용 | 상태 |
|------|----------|------|
| `src/components/MasterContentDetailPage.tsx` | "공유하고 30새싹 받기" 버튼 추가 | ⬜ |
| `src/App.tsx` | ShareRewardInfoPage 라우트 추가 | ⬜ |
| `scripts/deploy-production.bat` | 신규 Edge Function 2개 추가 | ⬜ |
| `scripts/deploy-staging.bat` | 신규 Edge Function 2개 추가 | ⬜ |

---

## 9. 다음 세션 시작 가이드

### 즉시 시작 가능한 작업 (우선순위순)

1. **Staging 마이그레이션 적용** → Supabase Dashboard에서 `20260227_add_share_reward_system.sql` 실행
2. **Staging Edge Functions 배포** → `process-referral`, `get-share-reward-status`, `users` (수정됨) 배포
3. **ShareRewardModal 컴포넌트 구현** → 기존 리워드 안내 페이지 디자인 참고
4. **MasterContentDetailPage에 공유 버튼 추가** → ShareRewardModal 연동
5. **ShareRewardInfoPage 리뉴얼** → "꼭 확인해주세요" 영역 교체

### 핵심 로직 요약 (이미 구현됨)

```
captureReferralFromUrl() → App.tsx 마운트 시 ?ref= 캡처 → localStorage
                           ↓
processReferral()        → AuthCallback 신규 사용자 감지 시 호출
                           ↓
process-referral EF      → referral_code → referrer_id 조회 → RPC 호출
                           ↓
process_share_reward()   → 검증 → referral_signups 기록 → 카운트 증가
                           → 회차 달성 시 30새싹 적립 + 다음 회차 생성
```

### 빌드 상태
- **Vite 빌드**: ✅ 성공 (2026-02-27 확인)
- **TypeScript 에러**: 없음

---

**문서 끝**
