# PROJECT_CONTEXT.md

> **AI 디버깅 전용 컨텍스트 파일** — 프로젝트 아키텍처, 데이터 흐름, 파일 참조
> **GitHub**: https://github.com/stargiosoft/nadaunse
> **최종 업데이트**: 2026-03-06

---

## Tech Stack

- **Frontend**: React 18.3.1 + TypeScript + React Router v7.11.0 + Tailwind CSS v4.0 + Vite 6.3.5
- **Backend**: Supabase (Auth, PostgreSQL + RLS, Edge Functions 42개, pg_cron + pg_net)
- **Auth**: Google (Supabase OAuth) | Kakao (SDK + signInWithPassword)
- **AI**: OpenAI GPT-4o/GPT-5.1 | Claude-3.5-Sonnet | Gemini 2.5 Flash
- **Payment**: PortOne v2 | **Notification**: TalkDream API | **Monitoring**: Sentry | **Deploy**: Vercel
- **Supabase**: Production `kcthtpmxffppfbkjjkub` | Staging `hyltbeewxaqashyivilu`

---

## System Map (요약)

```
[React SPA] → [Cache Layer (Memory/CacheAPI/localStorage)] → [Supabase (Auth/DB/Edge Functions/Storage)]
                                                              → [External: OpenAI, Stargio API, PortOne, TalkDream, Sentry]
```

**주요 데이터 흐름**:
1. **인증**: OAuth → AuthCallback → clearUserCaches → 약관 동의 → WelcomeCoupon → (pending_trait_tags시 PendingTagsCheck) → 홈
2. **무료 콘텐츠**: FreeContentDetail → 사주 입력/선택 → generate-free-preview → 결과
3. **유료 콘텐츠**: MasterContentDetailPage → PaymentNew → 결제 → 사주 입력 → generate-content-answers → LoadingPage(폴링) → UnifiedResultPage → CheckRecordMe
4. **타로**: 결제 → generate-content-answers(카드 사전 선택) → TarotShufflePage(UI 연출만) → 결과 표시
5. **마스터 관리**: MasterContentCreate → Questions → generate-image-prompt → generate-thumbnail → 배포
6. **주간 보고서**: pg_cron → generate-weekly-reports-batch → generate-weekly-report → 알림톡 → MyReportList → Detail → Tarot → MindCare → Memo → Coupon

---

## 📂 File Structure (Key Files)

### 기능별 빠른 참조 (Quick Reference by Feature)

<details>
<summary><b>홈 v2 (HomeScreenNew) - 11페이지</b></summary>

```
/pages/HomeScreenNew.tsx               → 메인 홈 (기존 HomePage.tsx 교체)
/pages/FortuneAllPage.tsx              → BEST 운세 전체보기 (/best-fortune)
/pages/NewFreeFortuneAllPage.tsx       → 무료 운세 전체보기 (/new-free)
/pages/SearchPage.tsx                  → 검색 (/search, fuse.js 기반)
/pages/SajuConsultPage.tsx             → 사주 상담 입력 (/saju-consult)
/pages/SajuConsultLoadingPage.tsx      → 사주 상담 로딩
/pages/SajuConsultResultPage.tsx       → 사주 상담 결과
/pages/SajuRecommendedFortunePage.tsx  → 추천 운세 전체보기
/pages/TaroConsultPage.tsx             → 타로 상담 입력 (/taro-consult)
/pages/TaroConsultLoadingPage.tsx      → 타로 상담 로딩
/pages/TaroConsultResultPage.tsx       → 타로 상담 결과
/components/RecommendedCarousel.tsx    → 추천 콘텐츠 캐러셀
/components/TextareaInput.tsx          → 상담 입력 텍스트 영역
/hooks/useScrollDirection.ts           → 스크롤 방향 감지 훅
/lib/consultStatus.ts                  → 상담 상태 localStorage 관리
/lib/consultLimitService.ts            → 비회원 상담 1회 제한
/lib/consultRecommendationService.ts   → AI 카테고리 기반 동적 추천
```

**Edge Functions**: `generate-saju-consult`, `generate-tarot-consult`
**DB**: `anonymous_consult_views`, `user_consult_daily`
</details>

<details>
<summary><b>무료 콘텐츠 (사주)</b></summary>

```
/components/FreeContentDetail.tsx       → 무료 상세 (메인)
/components/FreeContentDetailComponents.tsx → UI 컴포넌트 모음
/components/FreeBirthInfoInput.tsx      → 사주 입력
/components/FreeSajuSelectPage.tsx      → 사주 선택
/components/FreeContentLoading.tsx      → 무료 로딩 (공통 로딩으로도 사용)
/components/FreeSajuDetail.tsx          → 사주 결과 (전체)
/components/CheckRecordMe.tsx           → 나다움 기록하기 (태그 선택/저장)
/components/RecordMePhoneBottomSheet.tsx → 전화번호 입력 바텀시트
/lib/freeContentService.ts              → 비즈니스 로직
```
</details>

<details>
<summary><b>유료 콘텐츠 (심화 해석판)</b></summary>

```
/components/MasterContentDetailPage.tsx → 유료 상세 (메인)
/components/PaymentNew.tsx              → 결제
/components/CouponBottomSheetNew.tsx    → 쿠폰 선택 바텀시트
/components/PaymentComplete.tsx         → 결제 완료
/components/PurchaseFailure.tsx         → 결제 실패
/components/BirthInfoInput.tsx          → 사주 입력
/components/SajuSelectPage.tsx          → 사주 선택
/components/LoadingPage.tsx             → 유료 로딩 (주문 완료 폴링)
/components/UnifiedResultPage.tsx       → 사주/타로 통합 결과 (/result)
/components/TableOfContentsBottomSheet.tsx → 목차 바텀시트
/components/CheckRecordMe.tsx           → 나다움 기록하기
```
</details>

<details>
<summary><b>타로 콘텐츠</b></summary>

```
/components/TarotShufflePage.tsx        → 타로 셔플 (/tarot/shuffle)
/components/TarotGame.tsx               → 카드 섞기 + 선택 UI (slotCount: 1|3)
/components/ReportWeeklyTarot.tsx       → 보고서 타로 (slotCount=3)
/lib/tarotCards.ts                      → 78장 덱 데이터 + 유틸리티
/lib/tarotImageCache.ts                 → 타로 이미지 캐싱
```

**핵심**: 카드는 백엔드(generate-content-answers)에서 사전 선택됨, TarotGame은 UI 연출만
</details>

<details>
<summary><b>나다움 보고서 (주간 보고서) - 8개</b></summary>

```
/components/MyReportList.tsx            → 보고서 목록 (프로필 탭)
/components/ReportWeeklyDetail.tsx      → 핵심 인사이트
/components/ReportWeeklyTarot.tsx       → 타로 셔플 (3장)
/components/ReportWeeklyTarotResult.tsx → 타로 결과
/components/ReportWeeklyMindCare.tsx    → 마음 챙김
/components/ReportWeeklyMemo.tsx        → 응원 한마디
/components/ReportWeeklyMemoEdit.tsx    → 응원글 수정
/components/CompletionCoupon.tsx        → 쿠폰 발급
```

**패턴**: `user_viewed` 플래그(타로 1회 제한) | 응원글 저장 시 `my_report_cache` 삭제
</details>

<details>
<summary><b>사주 정보 관리</b></summary>

```
/components/SajuManagementPage.tsx      → 사주 관리 메인
/components/SajuInputPage.tsx           → 내 사주 입력
/components/SajuAddPage.tsx             → 관계 사주 추가
/components/SajuDetail.tsx              → 사주 상세
/components/SajuCard.tsx                → 사주 카드
/components/SajuKebabMenu.tsx           → 케밥 메뉴
/components/PrimarySajuChangeDialog.tsx → 대표 사주 변경
```
</details>

<details>
<summary><b>프로필</b></summary>

```
/components/ProfilePage.tsx             → 프로필 메인
/components/PurchaseHistoryPage.tsx     → 구매 내역
```
</details>

<details>
<summary><b>통계 대시보드 (Master 전용)</b></summary>

```
/components/StatsDashboard.tsx          → 통계 대시보드 메인
/lib/statsService.ts                    → 통계 데이터 조회
/supabase/functions/get-ga-stats/       → GA4 API Edge Function
```

**기간 필터**: 오늘, 7일, 30일, 90일, 전체
**태그 확인율**: 확인된 콘텐츠 건수 / 전체 콘텐츠 건수 (user_id + source_type + created_at 그룹핑)
</details>

<details>
<summary><b>마스터 콘텐츠 관리 (6개 + Edge Function 1개)</b></summary>

```
/components/MasterContentCreate.tsx     → 콘텐츠 생성
/components/MasterContentQuestions.tsx  → 질문지 작성
/components/MasterContentDetail.tsx     → 상세/수정 (관리자)
/components/MasterContentDetailPage.tsx → 상세 (사용자)
/components/MasterContentList.tsx       → 목록 관리
/components/MasterContentLoadingPage.tsx → AI 썸네일 로딩
```

**Edge Functions**: `generate-upsell-mapping` (무료 콘텐츠 생성 시 업셀링 자동 매핑, GPT-4.1-nano)
</details>

<details>
<summary><b>인증 & 회원가입</b></summary>

```
/components/LoginPageNew.tsx            → 로그인 (Kakao/Google OAuth)
/components/TermsPage.tsx               → 약관 동의
/components/WelcomeCouponPage.tsx       → 회원가입 완료
/components/ExistingAccountPageNew.tsx  → 기존 계정 연동
/components/SessionExpiredDialog.tsx    → 세션 만료
/lib/auth.ts                            → 인증 헬퍼 (clearUserCaches, recordTodayVisit)
/pages/AuthCallback.tsx                 → OAuth 콜백
App.tsx (PendingTagsCheckPage)          → 회원가입 후 사주/태그 저장
```

**세션**: Access Token 7일 | Refresh Token 만료 없음 | 자동 로그인
</details>

<details>
<summary><b>사주/타로 상담 체험 (AI 상담)</b></summary>

```
/pages/SajuConsultPage.tsx               → 사주 상담 입력
/pages/SajuConsultLoadingPage.tsx        → 사주 상담 로딩
/pages/SajuConsultResultPage.tsx         → 사주 상담 결과
/pages/TaroConsultPage.tsx               → 타로 상담 입력
/pages/TaroConsultLoadingPage.tsx        → 타로 상담 로딩
/pages/TaroConsultResultPage.tsx         → 타로 상담 결과 (카드 플립)
/components/RecommendedCarousel.tsx      → 추천 캐러셀
/lib/consultStatus.ts                    → 상담 상태 (일별 초기화)
/lib/consultLimitService.ts              → 비회원 1회 제한
/lib/consultRecommendationService.ts     → AI 기반 추천
```

**비회원 제한**: SHA-256(IP+UA) fingerprint 기반 1회 | 로그인 유저 1일 1회
</details>

<details>
<summary><b>공통 UI</b></summary>

```
/components/ui/*                        → shadcn/ui (48개)
/components/skeletons/*                 → 스켈레톤 (5개)
/components/NavigationHeader.tsx        → 헤더
/components/Footer.tsx                  → 푸터
/components/BottomNavigation.tsx        → 하단 네비게이션
/components/ErrorPage.tsx               → 에러 페이지
/components/ErrorBoundary.tsx           → 에러 바운더리
/components/ImageWithFallback.tsx       → 이미지 fallback
```
</details>

---

## 비즈니스 로직 & 유틸리티

```
/lib/freeContentService.ts      → 무료 콘텐츠 (싱글톤)
/lib/coupon.ts                  → 쿠폰 관리
/lib/auth.ts                    → 인증 헬퍼
/lib/tarotCards.ts              → 타로 78장 + 유틸리티
/lib/tarotImageCache.ts         → 타로 캐싱 (Cache API + 메모리)
/lib/thumbnailCache.ts          → 썸네일 캐싱
/lib/fetchWithRetry.ts          → 재시도 (Exponential Backoff)
/lib/logger.ts                  → 구조화된 로거
/lib/sentry.ts                  → Sentry 초기화
/utils/analytics.ts             → GA 연동
/utils/scrollRestoreLogger.ts   → 스크롤 복원 디버깅
```

---

## DB Schema (요약)

| 테이블 | 용도 |
|--------|------|
| `users` | 사용자 (provider, role, sprout_balance, rejected_tags, visit_dates) |
| `saju_records` | 사주 정보 (생년월일, 성별, is_primary) |
| `master_contents` | 콘텐츠 (제목, 가격, status, weekly_clicks, recommended_paid_content_id, upsell_hook_text) |
| `orders` | 결제 주문 (PortOne, ai_generation_completed) |
| `order_results` | AI 생성 결과 (질문/답변, 타로 카드) |
| `coupons` / `user_coupons` | 쿠폰 마스터/발급 |
| `user_trait_tags` | 나다움 태그 |
| `weekly_reports` / `weekly_report_sections` | 주간 보고서 |
| `report_tarot_selections` | 보고서 타로 (user_viewed 패턴) |
| `free_content_records` | 무료 콘텐츠 기록 |
| `anonymous_free_views` | 비회원 일일 제한 |
| `sprout_transactions` / `sprout_packages` | 새싹 거래 |

**상세**: [DATABASE_SCHEMA.md](./DATABASE_SCHEMA.md)

---

## Edge Functions (요약)

| 카테고리 | 개수 | 주요 |
|----------|------|------|
| AI 생성 | 9 | generate-free-preview, generate-saju/tarot-answer, generate-content-answers, extract-trait-tags |
| AI 상담 | 2 | generate-saju/tarot-consult |
| 주간 보고서 | 4 | generate-weekly-report(s-batch), send-report-alimtalk, get-failed-reports |
| 쿠폰 | 4 | issue-welcome/revisit-coupon, get-available-coupons, apply-coupon-to-order |
| 결제/환불/새싹 | 5 | payment-webhook, process-payment/refund, sprout-charge/deduct |
| 기타 | 17 | users, send-alimtalk, generate-sitemap, index-now, grant-mission-sprout 등 |

**상세**: [EDGE_FUNCTIONS_GUIDE.md](../supabase/EDGE_FUNCTIONS_GUIDE.md)

---

## 주요 버그 패턴 & 체크리스트

### 1. 스크롤 복원 실패
- `scrollRestoreLogger` 로그 확인 | `contentCount` vs 렌더링 수 | sessionStorage `homepage_scroll_state`

### 2. 무료 콘텐츠 생성 실패
- Edge Function 로그 확인 | API 키 설정 | localStorage 캐시 키 충돌

### 3. 결제 후 사주 연동 실패
- `orders.saju_record_id` null 확인 | RLS 정책 | 주문 정상 생성 확인

### 4. 쿠폰 적용 오류
- `user_coupons.is_used = false` | `/apply-coupon-to-order` 응답 | 할인액 계산

### 5. iOS Safari 둥근 모서리
- `overflow: hidden` + `border-radius` → `transform-gpu` 추가

### 6. 개발 버튼 프로덕션 노출
- `import { DEV } from '../lib/env'` → `{DEV && <button>...</button>}`

### 7. iOS 스와이프 뒤로가기 히스토리 꼬임
- History Guard는 `DirectEntryHistoryGuard`(App.tsx) 한 곳에서만 관리
- 상세 페이지: `navigate(-1)` 사용 (replace 금지)
- 상세: `DECISIONS.md` → "2026-03-05 History Guard 제거"

### 8. iOS 하단 CTA 첫 클릭 무반응
- Fixed 버튼에 `pointer-events-auto` | 스크롤 영역 padding으로 분리

### 9. iOS bfcache 결제 버튼 비활성화
- `pageshow` 이벤트 + `event.persisted`로 상태 리셋

### 10. 사주 API 빈 데이터
- `SAJU_API_KEY` 환경변수 | 브라우저 헤더 포함 | 재시도 로직

---

## 참고 문서

- **[CLAUDE.md](../CLAUDE.md)** - 개발 규칙 (필독)
- **[DECISIONS.md](./DECISIONS.md)** - 아키텍처 결정 기록
- **[DATABASE_SCHEMA.md](./DATABASE_SCHEMA.md)** - DB 스키마 상세
- **[components-inventory.md](./components-inventory.md)** - 컴포넌트 목록
- **[EDGE_FUNCTIONS_GUIDE.md](../supabase/EDGE_FUNCTIONS_GUIDE.md)** - Edge Functions 상세
- **[DATABASE_TRIGGERS_AND_FUNCTIONS.md](../supabase/DATABASE_TRIGGERS_AND_FUNCTIONS.md)** - Triggers/Functions
- **[RLS_POLICIES.md](../supabase/RLS_POLICIES.md)** - RLS 정책

---

**최종 업데이트**: 2026-03-06
