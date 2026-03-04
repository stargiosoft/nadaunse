# PROJECT_CONTEXT.md

> **AI 디버깅 전용 컨텍스트 파일**
> 버그 발생 시 AI에게 가장 먼저 제공해야 하는 프로젝트 뇌(Brain)
> **GitHub**: https://github.com/stargiosoft/nadaunse
> **최종 업데이트**: 2026-03-03

---

## 📚 Tech Stack

Tech Stack → [README.md](../README.md) 참조

---

## 🎯 프로젝트 정체성

### 서비스 개요
- **타로/사주 운세 모바일 웹 서비스**
- iOS Safari 최적화 완료
- 무료/유료 콘텐츠 이원화 시스템

통계 → [components-inventory.md](./components-inventory.md) 참조

### 필수 문서
- **[CLAUDE.md](../CLAUDE.md)** - 개발 규칙 (필독)

---

## 🗺️ System Map

### 전체 시스템 아키텍처

```
Client: React SPA (Vite) → Pages(41개) + Components(75개) + Services(/lib/) + Utils
Cache: Memory(Map) → Cache API → localStorage → sessionStorage (상세: CLAUDE.md 캐싱 전략)
                                      ↓
┌─────────────────────────────────────────────────────────────────────────────┐
│                            BACKEND LAYER (Supabase)                          │
├─────────────────────────────────────────────────────────────────────────────┤
│  Auth: Google(팝업) + Kakao(팝업) + Session/JWT                              │
│  DB: PostgreSQL + RLS + Triggers(6개) + Functions(5개)                       │
│  Storage: thumbnails/, tarot-cards/, assets/                                │
│  Edge Functions (Deno): AI생성(10) + 쿠폰(4) + 결제(3) + 보고서(4)          │
│    + 새싹충전소(2) + 모니터링(3) + 마스터콘텐츠(2) + SEO(2) + 공유리워드(2) │
│    + 기타(6)                                                                │
└─────────────────────────────────────────────────────────────────────────────┘
                                      ↓
┌─────────────────────────────────────────────────────────────────────────────┐
│                          EXTERNAL SERVICES                                   │
│  AI: OpenAI GPT-4o/5.1 + Claude 3.5 + Gemini 2.5                           │
│  Payment: PortOne v2 (카카오페이, 토스, 카드)                                │
│  Notification: TalkDream API (카카오 알림톡)                                 │
│  Saju: Stargio API (IP+Key 인증)                                            │
│  Monitoring: Sentry | Hosting: Vercel                                       │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 데이터 흐름 (Data Flow)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         1. 인증 플로우 (OAuth)                               │
├─────────────────────────────────────────────────────────────────────────────┤
│  [로그인 버튼] → [팝업 OAuth] → [AuthCallback.tsx] → [clearUserCaches()]   │
│  → [Supabase Auth Session] → [users upsert] → [약관 동의] → [WelcomePage] │
│  → pending_trait_tags 있으면 → [PendingTagsCheckPage] → [홈]               │
│    (saju_records 저장, free_content_records 저장, 태그 저장)                 │
│  → pending_trait_tags 없으면 → [홈]                                         │
│  ※ Google/Kakao 모두 팝업 모드 → 부모 탭 히스토리 오염 없음                  │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│                      2. 무료 콘텐츠 생성 플로우                               │
├─────────────────────────────────────────────────────────────────────────────┤
│  [FreeContentDetail] → [사주 입력/선택] → [FreeContentLoading]              │
│  → [generate-free-preview] → [Stargio API] → [AI 생성] → [결과 표시]       │
│  ※ 로그아웃: localStorage 캐시 / 로그인: DB 저장 가능                        │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│              2-1. 비회원 무료 콘텐츠 일일 제한 (하루 3개)                      │
├─────────────────────────────────────────────────────────────────────────────┤
│  1차 검증 (클라이언트): freeContentLimitService → localStorage 확인          │
│  → 3개 이상: LoginBottomSheet 표시                                          │
│  2차 검증 (서버): generate-free-preview → IP+UA SHA-256 fingerprint         │
│  → anonymous_free_views 테이블 확인 → 3개 이상: DAILY_LIMIT_REACHED         │
│  ※ 로그인 사용자: 무제한 / 같은 콘텐츠 재조회: 카운트 안 함                   │
│  ※ 서비스 파일: src/lib/freeContentLimitService.ts                          │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│                      3. 유료 콘텐츠 결제 플로우                               │
├─────────────────────────────────────────────────────────────────────────────┤
│  [MasterContentDetailPage] → [PaymentNew] → [쿠폰 선택] → [PortOne 결제]   │
│  → [payment-webhook] → [process-payment] → [orders 생성]                   │
│  → [사주 입력/선택] → [LoadingPage 폴링]                                    │
│  → [generate-content-answers (Self-Continue)] → [초개인화 조건 판단]         │
│  → [AI 운세 생성] → [order_results] → [UnifiedResultPage]                   │
│  → [CheckRecordMe 나다움 기록] → [send-alimtalk]                            │
│                                                                              │
│  관련 파일:                                                                  │
│  • /components/MasterContentDetailPage.tsx, PaymentNew.tsx                  │
│  • /components/LoadingPage.tsx, UnifiedResultPage.tsx, CheckRecordMe.tsx    │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│                         4. 타로 콘텐츠 플로우                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│  [결제 완료] → [LoadingPage]                                                 │
│  → [generate-content-answers] → 78장 덱에서 카드 사전 선택                   │
│  → [AI 타로 해석 생성] → [order_results 저장]                                │
│  → [TarotShufflePage] → [TarotGame UI 연출] (실제 카드는 이미 선택됨)        │
│  → [UnifiedResultPage] → 사전 선택된 카드 이미지 + AI 해석 표시             │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│                   5. 마스터 콘텐츠 관리 플로우 (관리자 전용)                    │
├─────────────────────────────────────────────────────────────────────────────┤
│  ※ 관리자(role='master')만 접근 가능                                        │
│  [MasterContentList] → [MasterContentCreate] → 기본정보 입력                │
│  → [MasterContentQuestions] → 질문지 작성                                   │
│  → [master_contents 저장] → [AI 썸네일 생성]                                │
│  → [MasterContentLoadingPage] → [status = 'deployed']                       │
│  수정: [MasterContentDetail] → 기본정보/질문지 수정, 썸네일 재생성            │
│                                                                              │
│  관련 파일:                                                                  │
│  • /components/MasterContent{Create,Questions,Detail,List,LoadingPage}.tsx  │
│  • /components/MasterContentDetailPage.tsx (사용자용 상세)                   │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│                      6. 나다움 보고서 플로우 (주간 보고서)                      │
├─────────────────────────────────────────────────────────────────────────────┤
│  [태그 수집] → user_trait_tags (is_confirmed = true)                        │
│  [생성] pg_cron → generate-weekly-reports-batch → generate-weekly-report    │
│  → OpenAI API → weekly_reports + sections 저장 + 타로 카드 사전 선택         │
│  [열람] MyReportList → ReportWeeklyDetail → ReportWeeklyTarot (1회)         │
│  → ReportWeeklyTarotResult → ReportWeeklyMindCare → ReportWeeklyMemo       │
│  → CompletionCoupon (tag_count>=5만)                                        │
│  [다시보기] Detail → TarotResult(셔플 스킵) → MindCare → Memo(view)         │
│  [응원글 수정] ReportWeeklyMemoEdit → my_report_cache 삭제                   │
│                                                                              │
│  관련 파일:                                                                  │
│  • /components/MyReportList.tsx, ReportWeekly{Detail,Tarot,TarotResult}.tsx │
│  • /components/ReportWeekly{MindCare,Memo,MemoEdit}.tsx                     │
│  • /components/CompletionCoupon.tsx                                          │
│  관련 테이블: weekly_reports, weekly_report_sections,                        │
│    report_tarot_selections, user_trait_tags                                  │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│                      7. 공유 리워드 플로우                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│  [공유] MasterContentDetailPage → ShareRewardModal → 카카오/링크 공유       │
│  → URL에 ?ref=NDS-XXXXXX 포함                                              │
│  [캡처] 링크 접속 → captureReferralFromUrl() → localStorage 저장 (7일 유효) │
│  [처리] 회원가입 완료 → AuthCallback → processReferral()                    │
│  → process-referral Edge Function → IP+UA fingerprint 검증                 │
│  → process_share_reward RPC → 피보나치 회차 카운트 → 달성 시 30새싹 지급    │
│  ※ 부정 의심(동일 fingerprint 3건↑): 기록만 하고 카운트/리워드 스킵         │
│  ※ 서비스 파일: src/lib/shareRewardService.ts                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 🚨 Critical Rules (절대 규칙)

> **상세 규칙은 [CLAUDE.md](../CLAUDE.md) 참조** (스타일링, TypeScript, 환경 분리, iOS Safari, 이미지 CSP, Supabase 환경, Edge Functions, 사주 API, 캐싱, 보안)

### 파일 구조 규칙
- React Router v7 사용 (`/App.tsx`가 라우터)
- 페이지: `/pages/*.tsx`, `/components/*Page.tsx`
- 재사용 컴포넌트: `/components/*.tsx`
- 비즈니스 로직: `/lib/*.ts` (싱글톤 서비스 클래스)
- 유틸리티: `/utils/*.ts`

### 비즈니스 로직 패턴
- 싱글톤 서비스 클래스 (`FreeContentService` 등)
- JSDoc 주석 + try-catch + 구조화된 로깅

---

## 📂 File Structure (Key Files)

### 🎯 기능별 빠른 참조 (Quick Reference by Feature)

<details>
<summary><b>홈 고도화 (홈 리디자인) - 11페이지 + 4유틸</b></summary>

```
/pages/HomeScreenNew.tsx               → 홈 화면 (라우트: /)
/pages/FortuneAllPage.tsx              → BEST 운세 전체보기 (라우트: /best-fortune)
/pages/NewFreeFortuneAllPage.tsx       → NEW 무료 운세 전체보기 (라우트: /new-free)
/pages/SearchPage.tsx                  → 운세 검색 (라우트: /search, fuse.js 퍼지 검색)
/pages/SajuConsultPage.tsx             → 사주 상담 입력 (라우트: /saju-consult)
/pages/SajuConsultLoadingPage.tsx      → 사주 상담 로딩 (라우트: /saju-consult/loading)
/pages/SajuConsultResultPage.tsx       → 사주 상담 결과 (라우트: /saju-consult/result)
/pages/SajuRecommendedFortunePage.tsx  → 이어서 보기 좋은 운세 (라우트: /saju-consult/result/recommended)
/pages/TaroConsultPage.tsx             → 타로 상담 입력 (라우트: /taro-consult)
/pages/TaroConsultLoadingPage.tsx      → 타로 상담 로딩 (라우트: /taro-consult/loading)
/pages/TaroConsultResultPage.tsx       → 타로 상담 결과 (라우트: /taro-consult/result, 카드 플립 애니메이션)
/components/TextareaInput.tsx          → 상담 입력 텍스트 영역
/components/RecommendedCarousel.tsx    → 결과 페이지 추천 캐러셀
/lib/consultStatus.ts                  → 상담 상태 localStorage 관리 (idle/completed, 일별 초기화)
/hooks/useScrollDirection.ts           → 스크롤 방향 감지 훅 (RAF 기반)
```

**소스**: Figma Make 퍼블리싱 코드 이관 (UI 셸만, 비즈니스 로직 미연동)
**에셋**: `public/home-v2/` (PNG 18개), `src/imports/svg-*.ts` (13개), Lottie JSON 1개
</details>

<details>
<summary><b>무료 콘텐츠 (사주)</b></summary>

```
/components/FreeContentDetail.tsx       → 무료 상세 (메인)
/components/FreeContentDetailComponents.tsx → UI 컴포넌트 모음
/components/FreeBirthInfoInput.tsx      → 사주 입력
/components/FreeSajuSelectPage.tsx      → 사주 선택
/components/FreeContentLoading.tsx      → 무료 로딩 (공통 로딩으로도 사용)
/components/FreeSajuDetail.tsx          → 사주 결과 (전체) + 유료 추천 카드
/components/FreeContentResult.tsx       → 사주 결과 (대체 UI) + 유료 추천 카드
/components/CheckRecordMe.tsx           → 나다움 기록하기 (태그 선택/저장)
/lib/freeContentService.ts              → 비즈니스 로직 + 유료 추천 (캐시/추천 로직)
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
/components/UnifiedResultPage.tsx       → 사주/타로 통합 결과 (/result 라우트)
/components/TableOfContentsBottomSheet.tsx → 목차 바텀시트
/components/CheckRecordMe.tsx           → 나다움 기록하기 (태그 선택/저장)
```
</details>

<details>
<summary><b>타로 콘텐츠</b></summary>

```
/components/TarotShufflePage.tsx        → 타로 셔플 페이지 (라우트: /tarot/shuffle)
/components/TarotGame.tsx               → 카드 섞기 + 선택 UI (21장, iOS Safari 전체화면 배경 대응)
/components/ReportWeeklyTarot.tsx       → 이번 주 보고서 타로 (slotCount=3)
/pages/TestTarotPage.tsx                → 테스트용 타로 페이지 (라우트: /test/tarot, 로그인 불필요)
/components/UnifiedResultPage.tsx       → 사주/타로 통합 결과 (/result 라우트)
/lib/tarotCards.ts                      → 타로 카드 데이터 (78장) + 유틸리티 함수
/lib/tarotImageCache.ts                 → 타로 카드 이미지 캐싱
/public/tarot-shuffle-background.jpg    → 타로 셔플 배경 이미지 (CSP 대응, 9.8KB)
```

**TarotGame slotCount 설정**:
| 사용처 | slotCount | 설명 |
|--------|-----------|------|
| `TarotShufflePage` | 1 (기본값) | 유료 콘텐츠 타로 - 카드 1장 선택 |
| `ReportWeeklyTarot` | 3 | 이번 주 보고서 - 카드 3장 선택 |
</details>

<details>
<summary><b>나다움 보고서 (주간 보고서) - 8개</b></summary>

```
/components/MyReportList.tsx            → 나의 분석 보고서 목록 + UI (병합됨)
/components/ReportWeeklyDetail.tsx      → 핵심 인사이트 + 보충 설명
/components/ReportWeeklyTarot.tsx       → 타로 카드 셔플 + 뽑기 (3장)
/components/ReportWeeklyTarotResult.tsx → 타로 카드 결과 표시
/components/ReportWeeklyMindCare.tsx    → 마음 챙김 메시지 (AI 생성)
/components/ReportWeeklyMemo.tsx        → 나에게 응원 한마디 입력
/components/ReportWeeklyMemoEdit.tsx    → 응원글 수정
/components/CompletionCoupon.tsx        → 쿠폰 발급 완료 페이지
```

**주요 패턴**:
- `user_viewed` 플래그: 타로 1회 제한 (실제 뽑기 여부 추적)
- 캐시 무효화: 응원글 저장/수정 시 `my_report_cache` 삭제
- 라우팅: `/test/report-weekly-*` 경로 (App.tsx)
</details>

<details>
<summary><b>사주 정보 관리</b></summary>

```
/components/SajuManagementPage.tsx      → 사주 관리 메인
/components/SajuInputPage.tsx           → 내 사주 입력
/components/SajuAddPage.tsx             → 관계 사주 추가
/components/SajuDetail.tsx              → 사주 상세
/components/SajuCard.tsx                → 사주 카드 공통 컴포넌트
/components/SajuKebabMenu.tsx           → 케밥 메뉴
/components/PrimarySajuChangeDialog.tsx → 대표 사주 변경
/components/ConfirmDialog.tsx           → 확인 다이얼로그
```
</details>

<details>
<summary><b>프로필</b></summary>

```
/components/ProfilePage.tsx             → 프로필 메인
/components/MansePage.tsx               → 만세력 (사주 입력 폼 + 만세력 결과, 로그인 시 DB 저장)
/components/PurchaseHistoryPage.tsx     → 구매 내역
/components/NadaumTagsList.tsx          → 나다움 태그 페이지 (라우트: /profile/nadaum-tags)
/components/NadaumTags.tsx              → 나다움 태그 표시 컴포넌트
/components/ReceiveMyAnalysis.tsx       → "나의 분석 보고서" 탭 클릭 시 전화번호 입력 (최초 1회)
/components/RecordMePhoneBottomSheet.tsx → 전화번호 입력 바텀시트 (프로필에서 사용)
```
</details>

<details>
<summary><b>통계 대시보드 (Master 전용)</b></summary>

```
/components/StatsDashboard.tsx          → 통계 대시보드 메인
/lib/statsService.ts                    → 통계 데이터 조회 서비스
/supabase/functions/get-ga-stats/       → GA4 API 연동 Edge Function
```

**주요 기능**:
| 섹션 | 데이터 소스 | 설명 |
|------|------------|------|
| GA 전체 고객 통계 | Google Analytics 4 | 전체 사용자, 신규, 재방문, 재방문율 |
| 회원가입 고객 통계 | Supabase (users) | 신규/재방문 고객, 회원가입율 |
| 콘텐츠 이용 통계 | Supabase (orders, free_content_records) | 무료/유료 이용율 |
| 태그 통계 | Supabase (user_trait_tags) | 태그 저장율, 확인율 (콘텐츠 건 기준) |

**개요 기간 필터**: 오늘, 7일, 30일, 90일, 전체

**추세 기간별 집계 단위**:
| 기간 | 집계 단위 |
|------|----------|
| 7일, 30일 | 일별 |
| 90일 | 주별 (월요일 기준) |
| 1년 | 월별 |

**태그 지표 계산 방식** (개요/추세 동일):
| 지표 | 계산식 |
|------|--------|
| 태그 저장 고객 | `is_confirmed=TRUE` 태그를 가진 유니크 사용자 수 |
| 확인 태그수 | 개별 `is_confirmed=TRUE` 태그 개수 |
| 태그 확인율 | 확인된 콘텐츠 건수 / 전체 콘텐츠 건수 |
| 회원당 태그 | 확인 태그수 / 태그 저장 고객 |

**콘텐츠 건 그룹핑**: `user_id + source_type + created_at(초 단위)`
- 1개라도 확인(is_confirmed=true)하면 "확인된 건"

> 상세 결정 배경: `DECISIONS.md` → "2026-02-04 통계 대시보드 계산 로직 통일"
</details>

<details>
<summary><b>마스터 콘텐츠 관리 (6개)</b></summary>

```
/components/MasterContentCreate.tsx     → 콘텐츠 생성 (기본정보: 제목, 설명, 가격)
/components/MasterContentQuestions.tsx  → 질문지 작성 (AI 프롬프트용)
/components/MasterContentDetail.tsx     → 콘텐츠 상세/수정 (관리자용)
/components/MasterContentDetailPage.tsx → 사용자용 상세 페이지
/components/MasterContentList.tsx       → 콘텐츠 목록 관리 (수정/삭제/배포)
/components/MasterContentLoadingPage.tsx → AI 썸네일 생성 로딩 (관리자 전용)
```
</details>

<details>
<summary><b>인증 & 회원가입</b></summary>

```
/components/LoginPageNew.tsx            → 로그인
/components/TermsPage.tsx               → 약관 동의
/components/WelcomeCouponPage.tsx       → 회원가입 완료 (웰컴 쿠폰 안내)
/components/ExistingAccountPageNew.tsx  → 기존 계정 연동
/components/SessionExpiredDialog.tsx    → 세션 만료
/components/PrivacyPolicyPage.tsx       → 개인정보처리방침
/components/TermsOfServicePage.tsx      → 이용약관
/lib/auth.ts                            → 인증 헬퍼
/pages/AuthCallback.tsx                 → OAuth 콜백
```
</details>

<details>
<summary><b>로딩 페이지 (3개)</b></summary>

```
/components/FreeContentLoading.tsx      → 무료 로딩 + 공통 로딩 (Edge Function 동기 호출)
/components/LoadingPage.tsx             → 유료 로딩 (주문 완료 폴링)
/components/MasterContentLoadingPage.tsx → AI 썸네일 생성 로딩 (관리자 전용)
```
</details>

<details>
<summary><b>공유 리워드</b></summary>

```
/components/ShareRewardModal.tsx        → 공유 리워드 바텀시트 (카카오/링크 공유)
/components/ShareRewardInfoPage.tsx     → 공유 리워드 안내 페이지 (/share-reward-info)
/lib/shareRewardService.ts              → 레퍼럴 캡처/처리, 리워드 상태 조회
/supabase/functions/process-referral/   → 레퍼럴 처리 Edge Function (서버 fingerprint)
/supabase/functions/get-share-reward-status/ → 리워드 현황 조회 Edge Function
```
</details>

<details>
<summary><b>공통 UI</b></summary>

```
/components/ui/*                        → shadcn/ui 재사용 컴포넌트 (52개)
/components/skeletons/*                 → 로딩 스켈레톤 (5개)
/components/NavigationHeader.tsx        → 헤더
/components/Footer.tsx                  → 푸터
/components/BottomNavigation.tsx        → 하단 네비게이션
/components/ErrorPage.tsx               → 공통 에러 페이지
/components/ErrorBoundary.tsx           → 에러 바운더리
```
</details>

---

### 세션 설정 (Supabase Auth)

| 항목 | 값 |
|------|-----|
| Access Token 만료 | 7일 (604,800초) |
| Refresh Token | 만료 없음 (1회 사용 후 자동 갱신) |
| 세션 유지 | 무제한 (로그아웃 전까지) |

> **파일별 상세 위치**: [components-inventory.md](./components-inventory.md) 참조

### Supabase Edge Functions

**📚 상세 문서**: [EDGE_FUNCTIONS_GUIDE.md](../supabase/EDGE_FUNCTIONS_GUIDE.md) - 각 함수별 입력/출력 형식, 배포 방법

---

## 🗄️ Database Schema

**📚 상세 문서**: [DATABASE_SCHEMA.md](./DATABASE_SCHEMA.md) - 전체 테이블, 컬럼, 타입, 제약조건, 인덱스

---

## 🔀 주요 플로우

### 1. 무료 콘텐츠 플로우 (사주/타로)

홈 → FreeContentDetail → "무료로 보기" → 로그인 체크
- **로그아웃**: localStorage 캐시 확인 → 있으면 사주 입력(캐시), 없으면 사주 입력(신규)
- **로그인**: DB(saju_records) 조회 → 있으면 사주 선택, 없으면 사주 입력(신규)
→ AI 생성 요청 (Edge Function) → FreeContentLoading (2초 폴링)
→ 결과 페이지 (FreeSajuDetail / FreeContentResult) → 유료 추천 카드 1개

**핵심 클래스**: `FreeContentService` (`/lib/freeContentService.ts`)

**주요 파일**: FreeContentDetail, FreeContentDetailComponents, FreeBirthInfoInput, FreeSajuSelectPage, FreeContentLoading, FreeSajuDetail, FreeContentResult, TarotResultPage

**Edge Functions**: generate-free-preview, generate-saju-preview, generate-tarot-preview

**특징**: 로그아웃 사용자도 이용 가능 / localStorage 캐시 / 로그인 시 DB 저장 가능 / 사주+타로 지원

---

### 2. 유료 콘텐츠 플로우 (심화 해석판) -- 새싹 포인트 기반

홈 → MasterContentDetailPage → "지금 풀이 확인하기" → 로그인 필수
→ 새싹 잔액 확인 (users.sprout_balance)
- **잔액 >= 30새싹**: 즉시 차감 (sprout-deduct)
- **잔액 < 30새싹**: 새싹 충전소(SproutChargingStation) → 패키지 선택 → PortOne 결제 → sprout-charge → sprout-deduct
  - 모바일: `m_redirect_url`로 PG 결제 후 복귀 → App.tsx에서 URL params(`imp_uid`)로 리다이렉트 감지 → `redirectPayment` prop 전달
→ 사주 정보 확인 (DB 있으면 SajuSelectPage, 없으면 BirthInfoInput)
  - SajuSelectPage → 전화번호 미등록 시 AlimtalkInfoInputPage로 이동 (이동 전 `primary_saju` 캐시 설정)
→ generate-master-content → AI 응답 → order_results 저장 → 폴링 완료 확인
→ SajuResultPage → CheckRecordMe (나다움 기록)

**주요 파일**: MasterContentDetailPage, SproutChargingStation, useSproutBalance, BirthInfoInput, SajuSelectPage, AlimtalkInfoInputPage, SajuResultPage, CheckRecordMe

**Edge Functions**: sprout-charge, sprout-deduct, generate-master-content

**특징**: 새싹(포인트) 기반 (30새싹) / 충전 패키지 3종 (40/130/410새싹) / DB 영구 저장 / 3중 보안 (protect_sprout_balance 트리거 + RPC EXECUTE 권한 제거 + PortOne 결제 검증)

**캐시 주의**: ProfilePage는 `primary_saju` localStorage가 실제 존재해야만 API 스킵. `saju_cache_checked` 플래그만으로는 캐시 유효 판단 안 함 (DECISIONS.md 2026-03-03 참조)

---

### 2-1. 계정 불일치 처리 플로우 (알림톡 링크 접속)

알림톡 링크 클릭 → UnifiedResultPage / ReportWeeklyDetail
→ 세션 체크: 로그아웃 → 로그인 페이지 / 로그인 → RLS로 데이터 조회
→ 본인 데이터: 결과 표시 / 다른 계정 데이터: 계정 불일치 감지
→ Edge Function (get-order-owner / get-report-owner) → Service Role Key로 RLS 우회
→ 소유자 이메일/전화번호 마스킹 → "다른 계정으로 구매한 운세예요" 다이얼로그

**관련 파일**: UnifiedResultPage, ReportWeeklyDetail, get-order-owner, get-report-owner

---

### 3. 타로 서비스 플로우

결제 → orders 생성 → LoadingPage → generate-content-answers 호출
→ getTarotCardsForQuestions(questionCount): 78장 덱에서 카드 **사전 선택**
→ 선택된 카드로 AI 타로 해석 생성 → order_results에 (질문, 카드명, 해석) 저장
→ LoadingPage 폴링 (2초) → /tarot/shuffle (TarotShufflePage)
→ TarotGame: 21장 더미 카드 UI 연출 (idle→mixing→gathered→spreading→selected)
→ 타로 결과 표시 (SajuResultPage): order_results에서 사전 선택된 카드 이미지 + AI 해석

**핵심**: 카드 선택은 백엔드에서 먼저 완료, TarotGame UI는 연출만 담당

**주요 파일**: TarotShufflePage, TarotGame (5단계 애니메이션, slotCount prop: 1|3), ReportWeeklyTarot (slotCount=3), tarotCards.ts (78장 덱 + 유틸리티), tarotImageCache.ts

**Edge Functions**: generate-content-answers (메인), generate-tarot-preview (무료)

---

### 4. 스크롤 위치 복원 플로우 (backup/HomePage.tsx → HomeScreenNew.tsx로 교체됨)

홈 → 콘텐츠 클릭 → sessionStorage 저장 (scrollY, contentCount, should_restore_scroll)
→ 상세 페이지 → 뒤로가기 → 홈 마운트 → useLayoutEffect 즉시 실행
→ 저장된 scrollY로 복원 시도 → contentCount >= 저장된 수 확인
→ YES: requestAnimationFrame으로 스크롤 / NO: 추가 로드 후 재시도

**디버깅 도구**: `scrollRestoreLogger` (`/utils/scrollRestoreLogger.ts`)

---

## 🐛 주요 버그 유형 & 체크리스트

### 1. 스크롤 복원 실패
**증상**: 뒤로가기 시 최상단으로만 이동
**체크**:
- [ ] `scrollRestoreLogger` 로그 확인 (SAVE → RESTORE_ATTEMPT → SUCCESS/FAIL)
- [ ] `contentCount`와 실제 렌더링된 콘텐츠 수 비교
- [ ] 페이지 높이 (`scrollHeight`) vs 목표 스크롤 위치 (`scrollY`)
- [ ] sessionStorage 값 확인 (`homepage_scroll_state`)

---

### 2. 무료 콘텐츠 생성 실패
**증상**: 로딩 무한 대기, AI 응답 없음
**체크**:
- [ ] `FreeContentService.requestGeneration()` 호출 성공 여부
- [ ] Edge Function `/generate-free-preview` 로그 확인
- [ ] Supabase AI Logs 테이블 확인 (에러 메시지)
- [ ] localStorage 캐시 키 충돌 여부
- [ ] API 키 (OPENAI_API_KEY, ANTHROPIC_API_KEY) 설정 확인

---

### 3. 결제 후 사주 정보 연동 실패
**증상**: 결제 완료 후 사주 입력 화면으로 이동하지 않음
**체크**:
- [ ] `orders.saju_record_id`가 null인지 확인
- [ ] `PaymentComplete.tsx`의 `useEffect` 조건 확인
- [ ] RLS 정책으로 인한 쿼리 실패 여부
- [ ] `orders` 테이블에 주문이 정상 생성되었는지 확인

---

### 4. 쿠폰 적용 오류
**증상**: 쿠폰 선택했는데 할인 미적용
**체크**:
- [ ] `user_coupons.is_used = false`인지 확인
- [ ] Edge Function `/apply-coupon-to-order` 응답 확인
- [ ] `orders.paid_amount`와 쿠폰 할인액 계산 검증
- [ ] 쿠폰 발급 여부 확인 (`user_coupons` 테이블)

---

### 5. 목차 표시 개수 불일치
**증상**: AI가 10개 질문만 생성했는데 목차에 20개 표시됨
**체크**:
- [ ] `TableOfContentsBottomSheet.tsx`에 하드코딩된 더미 데이터 있는지 확인
- [ ] `order_results` 테이블의 실제 행 수 조회 (`SELECT COUNT(*)`)
- [ ] 로그에서 "질문 리스트 조회 완료: X 개" 메시지 확인
- [ ] `questions` 배열에 spread 연산자로 추가 데이터 혼입 여부

---

### 6. 이미지 로딩 느림 (썸네일)
**증상**: 리스트/카드 섹션에서 이미지 로드 3초 이상 소요
**체크**:
- [ ] `preloadImages()` 호출 여부 확인
- [ ] localStorage 캐시 활용 여부 (`*_cache_v*` 키)
- [ ] 네트워크 탭에서 이미지 크기 확인 (원본 vs 썸네일)
- [ ] Priority 설정 (`high` vs `low`) 적절한지 검토
- [ ] `/lib/imagePreloader.ts` 정상 작동 확인

---

### 7. iOS Safari 둥근 모서리 렌더링 이슈
**증상**: iOS Safari에서 `border-radius`가 적용된 이미지/컨테이너의 모서리가 잘림
**체크**:
- [ ] `overflow: hidden` + `border-radius` 조합 사용 중인지 확인
- [ ] `transform-gpu` 클래스가 추가되어 있는지 확인
- [ ] 실제 iOS Safari 기기에서 테스트
- [ ] 다른 브라우저(Chrome, Firefox)에서도 정상 작동 확인

**해결**: `overflow-hidden rounded-* transform-gpu` 조합 사용

---

> **해결된 버그 #8~#14**: 이미 코드에 반영 완료. 상세 내용은 `DECISIONS.md` 참조
> - #8 개발용 버튼 프로덕션 노출 → `DEV` 플래그 적용
> - #9~#11 iOS 스와이프 뒤로가기 → `replace: true` + 상태 체크
> - #12 사주 API → Edge Function 서버 직접 호출 (SAJU_API_KEY)
> - #13 iOS CTA 클릭 누락 → `pointer-events-auto` + 영역 분리
> - #14 bfcache → `pageshow` 이벤트 상태 리셋

---

## 📚 추가 참고 문서

> **상세 이력**: `DECISIONS.md`에서 모든 설계 결정과 변경 이력 확인 가능

- **[CLAUDE.md](../CLAUDE.md)** - 개발 규칙 (필독!)
- **[DECISIONS.md](./DECISIONS.md)** - 아키텍처 결정 기록
- **[DATABASE_SCHEMA.md](./DATABASE_SCHEMA.md)** - DB 스키마 상세
- **[components-inventory.md](./components-inventory.md)** - 컴포넌트 목록
- **[supabase/EDGE_FUNCTIONS_GUIDE.md](../supabase/EDGE_FUNCTIONS_GUIDE.md)** - Edge Functions 가이드
- **[supabase/DATABASE_TRIGGERS_AND_FUNCTIONS.md](../supabase/DATABASE_TRIGGERS_AND_FUNCTIONS.md)** - Database Triggers & Functions

---

**문서 버전**: 4.0.0
**최종 업데이트**: 2026-03-03
**문서 끝**