# PROJECT_CONTEXT.md

> **AI 디버깅 전용 컨텍스트 파일**
> 버그 발생 시 AI에게 가장 먼저 제공해야 하는 프로젝트 뇌(Brain)
> **GitHub**: https://github.com/stargiosoft/nadaunse
> **최종 업데이트**: 2026-02-26 (새싹 포인트 시스템 전환, 유료 콘텐츠 플로우 변경)

---

## 📚 Tech Stack

- **Frontend**: React 18.3.1 + TypeScript + React Router v7.11.0
- **Styling**: Tailwind CSS v4.0 (CSS 변수 기반)
- **Build Tool**: Vite 6.3.5
- **Backend**: Supabase
  - **Auth**:
    - Google: Supabase OAuth 팝업 모드 (`window.open` + `getGoogleOAuthUrl`)
    - Kakao: Kakao SDK 팝업 모드 (커스텀 구현, `signInWithPassword` 기반)
  - Database: PostgreSQL + RLS
  - Edge Functions: Deno runtime (34개)
  - **자동화**: pg_cron + pg_net (주간 보고서 발송)
- **AI**:
  - OpenAI GPT-4o, GPT-5.1 (주간 보고서)
  - Anthropic Claude-3.5-Sonnet
  - Google Gemini 2.5 Flash (이미지 생성)
- **Payment**: PortOne (구 아임포트) v2
- **Notification**: TalkDream API (카카오 알림톡)
- **Error Monitoring**: Sentry (사용자 컨텍스트, 에러 추적)
- **Hosting**: Vercel (Production: nadaunse.com)
- **Supabase 환경**:
  - Production: `kcthtpmxffppfbkjjkub`
  - Staging: `hyltbeewxaqashyivilu`
- **State Management**: React Hooks (useState, useEffect)
- **Animation**: Framer Motion
- **Image Optimization**:
  - PNG → WebP 변환 (ImageMagick WASM)
  - 압축률: 40-50% (PNG 300KB → WebP 150KB)
  - Supabase Storage (`thumbnails/{contentId}.webp`)

---

## 🎯 프로젝트 정체성

### 서비스 개요
- **타로/사주 운세 모바일 웹 서비스**
- iOS Safari 최적화 완료
- 무료/유료 콘텐츠 이원화 시스템

### 주요 통계
- **컴포넌트**: 72개 (활성화, backup 제외) - 주간 보고서 9개 + 통계 대시보드 2개 추가
- **Edge Functions**: 34개 (주간 보고서 4개 포함)
- **페이지 컴포넌트**: 42개
- **UI 컴포넌트 (shadcn/ui)**: 52개
- **스켈레톤**: 5개
- **타로 카드 덱**: 78장 (메이저 22장 + 마이너 56장)

### 필수 문서
- **[CLAUDE.md](../CLAUDE.md)** - 개발 규칙 (필독)

---

## 🗺️ System Map

### 전체 시스템 아키텍처

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              CLIENT LAYER                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│  [User Browser - Mobile First]                                              │
│      ↓                                                                      │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  React SPA (Vite 6.3.5)                                              │   │
│  │  ├── Pages (41개) ─────────────── 라우팅 (React Router v7)           │   │
│  │  ├── Components (75개) ────────── UI 렌더링 (Tailwind v4)            │   │
│  │  ├── Hooks ────────────────────── 상태 관리 (useState, useEffect)    │   │
│  │  ├── Services (/lib/) ─────────── 비즈니스 로직 (싱글톤 패턴)         │   │
│  │  └── Utils ────────────────────── 순수 유틸리티 함수                  │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘
                                      ↓
┌─────────────────────────────────────────────────────────────────────────────┐
│                              CACHE LAYER                                     │
├─────────────────────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐    │
│  │ Memory Cache │  │  Cache API   │  │ localStorage │  │sessionStorage│    │
│  │   (Map)      │  │ (50MB+)      │  │  (5-10MB)    │  │  (임시)      │    │
│  │   0.01ms     │  │  10-50ms     │  │   5-10ms     │  │   5-10ms     │    │
│  ├──────────────┤  ├──────────────┤  ├──────────────┤  ├──────────────┤    │
│  │ 타로 이미지   │  │ 타로 이미지   │  │ 사주 정보    │  │ 스크롤 위치   │    │
│  │ 썸네일 URL   │  │ 썸네일 이미지  │  │ 무료 콘텐츠  │  │ 폼 상태      │    │
│  └──────────────┘  └──────────────┘  └──────────────┘  └──────────────┘    │
└─────────────────────────────────────────────────────────────────────────────┘
                                      ↓
┌─────────────────────────────────────────────────────────────────────────────┐
│                            BACKEND LAYER (Supabase)                          │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────────────────┐      ┌─────────────────────────────────────────┐  │
│  │   Supabase Auth     │      │         Edge Functions (Deno)           │  │
│  │   ───────────────   │      │         ─────────────────────           │  │
│  │   • Google (팝업)   │      │   AI 생성 (10개)                         │  │
│  │   • Kakao (팝업)    │      │   ├── generate-free-preview             │  │
│  │   • Session 관리    │      │   ├── generate-master-content           │  │
│  │   • JWT 토큰        │      │   ├── generate-saju-answer/preview      │  │
│  └─────────────────────┘      │   ├── generate-tarot-answer/preview     │  │
│            ↓                  │   ├── generate-image-prompt             │  │
│  ┌─────────────────────┐      │   ├── generate-thumbnail                │
│   └── extract-trait-tags (나다움 태그, rejectedTags 지원)  │  │
│  │   PostgreSQL (RLS)  │      │                                         │  │
│  │   ───────────────   │      │   쿠폰 관리 (4개)                        │  │
│  │   • users           │←────→│   ├── get-available-coupons             │  │
│  │   • saju_records    │      │   ├── apply-coupon-to-order             │  │
│  │   • master_contents │      │   ├── issue-welcome-coupon              │  │
│  │   • orders          │      │   └── issue-revisit-coupon (미션쿠폰)   │  │
│  │   • order_results   │      │                                         │  │
│  │   • coupons         │      │   결제/환불 (3개)                        │  │
│  │   • user_coupons    │      │   ├── payment-webhook                   │  │
│  │   • user_trait_tags │      │   ├── process-payment                   │  │
│  │   ───────────────   │      │   ├── process-payment                   │  │
│  │   Triggers (5개)    │      │   └── process-refund                    │  │
│  │   Functions (5개)   │      │                                         │  │
│  └─────────────────────┘      │   기타 (6개)                             │  │
│            ↓                  │   ├── users, master-content             │  │
│  ┌─────────────────────┐      │   ├── send-alimtalk                     │  │
│  │   Supabase Storage  │      │   └── sentry-slack-webhook              │  │
│  │   ───────────────   │      └─────────────────────────────────────────┘  │
│  │   • thumbnails/     │                                                    │
│  │   • tarot-cards/    │                                                    │
│  │   • assets/         │                                                    │
│  └─────────────────────┘                                                    │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
                                      ↓
┌─────────────────────────────────────────────────────────────────────────────┐
│                          EXTERNAL SERVICES                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐             │
│  │    AI APIs      │  │   Payment       │  │   Notification  │             │
│  │  ─────────────  │  │  ─────────────  │  │  ─────────────  │             │
│  │  OpenAI GPT-4o  │  │  PortOne v2     │  │  TalkDream API  │             │
│  │  Claude 3.5     │  │  (카카오페이,   │  │  (카카오 알림톡) │             │
│  │  Gemini 2.5     │  │   토스, 카드)   │  │                 │             │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘             │
│           ↓                    ↓                    ↓                       │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐             │
│  │  Stargio API    │  │   Sentry        │  │   Vercel        │             │
│  │  ─────────────  │  │  ─────────────  │  │  ─────────────  │             │
│  │  사주 데이터     │  │  에러 모니터링   │  │  배포/호스팅    │             │
│  │  (IP+Key 인증)  │  │  실시간 추적    │  │  CDN, SSL      │             │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘             │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 데이터 흐름 (Data Flow)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         1. 인증 플로우 (OAuth)                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  [사용자] → [로그인 버튼] → [팝업(새 탭)으로 OAuth Provider 열기]             │
│      ↓                              ↓                                        │
│  [AuthCallback.tsx] ← ─ ─ ─ ─ [팝업에서 인증 완료 + localStorage 신호]       │
│  ※ Google/Kakao 모두 팝업 모드 → 부모 탭 히스토리 오염 없음                   │
│      ↓                                                                       │
│  [clearUserCaches()] → pending_trait_tags 있으면 cached_saju_info 보존      │
│      ↓                                                                       │
│  [Supabase Auth] → [Session 생성] → [users 테이블 upsert]                   │
│      ↓                                                                       │
│  [약관 동의 체크] → [TermsPage] → [WelcomeCouponPage]                        │
│      ↓                                                                       │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │ pending_trait_tags 있으면 → [PendingTagsCheckPage]                   │    │
│  │   1. cached_saju_info → saju_records 저장                           │    │
│  │   2. localStorage 무료 콘텐츠 결과 → free_content_records 저장       │    │
│  │   3. phone_number 있으면 → 태그 저장 → 홈                           │    │
│  │      phone_number 없으면 → 나다움 기록하기 페이지 → 바텀시트 오픈    │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│      ↓ (pending_trait_tags 없으면)                                          │
│  [홈]                                                                       │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│                      2. 무료 콘텐츠 생성 플로우                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  [FreeContentDetail] → [사주 입력/선택] → [FreeContentLoading]              │
│         ↓                                        ↓                          │
│  ┌──────────────────────────────────────────────────────────────────┐       │
│  │                    Edge Function 호출                             │       │
│  │  generate-free-preview                                           │       │
│  │      ↓                                                           │       │
│  │  [Stargio 사주 API] → [사주 데이터 수신]                          │       │
│  │      ↓                                                           │       │
│  │  [AI API (GPT-4o/Claude)] → [운세 생성]                          │       │
│  │      ↓                                                           │       │
│  │  [응답 반환] ─────────────────────────────────────────────────────│───→  │
│  └──────────────────────────────────────────────────────────────────┘   ↓   │
│                                                                    [결과 표시]│
│  ※ 로그아웃: localStorage 캐시 / 로그인: DB 저장 가능                        │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│              2-1. 비회원 무료 콘텐츠 일일 제한 (하루 3개)                      │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  [FreeContentDetail] → "무료로 보기" 클릭                                    │
│         ↓                                                                    │
│  1차 검증 (클라이언트, 즉시):                                                │
│    freeContentLimitService.hasReachedLocalLimit()                            │
│    → localStorage 'free_content_views_v1' 확인                              │
│    → ❌ 3개 이상 → LoginBottomSheet 표시 (로그인 유도)                       │
│    → ✅ 미만 → 사주 입력 → FreeContentLoading 진행                          │
│         ↓                                                                    │
│  2차 검증 (서버, Edge Function):                                             │
│    generate-free-preview → IP+UA SHA-256 fingerprint                        │
│    → anonymous_free_views 테이블 오늘 조회 수 확인                           │
│    → ❌ 3개 이상 → { success: false, error: 'DAILY_LIMIT_REACHED' }         │
│    → ✅ 미만 → 조회 기록 upsert → AI 생성 진행                              │
│                                                                              │
│  ※ 로그인 사용자: 무제한 (서버 검증 스킵)                                    │
│  ※ 같은 콘텐츠 재조회: 카운트 안 함 (UNIQUE 제약)                            │
│  ※ 서비스 파일: src/lib/freeContentLimitService.ts                          │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│                      3. 유료 콘텐츠 결제 플로우                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  [MasterContentDetailPage] → [PaymentNew] → [쿠폰 선택 (선택)]              │
│         ↓                         ↓                                         │
│  ┌──────────────────────────────────────────────────────────────────┐       │
│  │  PortOne 결제 SDK                                                 │       │
│  │      ↓                                                           │       │
│  │  [PG사 결제창] → [결제 완료]                                       │       │
│  │      ↓                                                           │       │
│  │  [payment-webhook] ← ─ ─ ─ [PortOne 서버 콜백]                    │       │
│  │      ↓                                                           │       │
│  │  [process-payment] → [orders 생성] → [user_coupons 사용 처리]     │       │
│  └──────────────────────────────────────────────────────────────────┘       │
│         ↓                                                                   │
│  [사주 입력/선택] → [LoadingPage (폴링)]                                     │
│         ↓                                                                   │
│  ┌──────────────────────────────────────────────────────────────────┐       │
│  │  generate-content-answers (Self-Continue 패턴)                     │       │
│  │      ↓                                                           │       │
│  │  [태그 + 콘텐츠 이용 내역 조회] → [초개인화 조건 판단]             │       │
│  │      ↓ (이용 내역 있으면)                                         │       │
│  │  [gpt-4.1-nano 심리 추출] → [user_situation_summaries 저장/조회]  │       │
│  │      ↓                                                           │       │
│  │  [Stargio 사주 API] → [AI 운세 생성 (초개인화)] → [order_results]  │       │
│  │      ↓                                                           │       │
│  │  [120초 경과 시] → 자기 재호출 (미완료 질문만 이어서 처리)          │       │
│  │      ↓                                                           │       │
│  │  [orders.ai_generation_completed = true]                          │       │
│  └──────────────────────────────────────────────────────────────────┘       │
│         ↓                                                                   │
│  [UnifiedResultPage] → [TableOfContents] → [CheckRecordMe (나다움 기록)]    │
│         ↓                                                                   │
│  [send-alimtalk] → [카카오 알림톡 발송]                                      │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│                         4. 타로 콘텐츠 플로우                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  [결제 완료] → [LoadingPage]                                                 │
│       ↓                                                                      │
│  ┌──────────────────────────────────────────────────────────────────┐       │
│  │  generate-content-answers (Self-Continue 패턴)                     │       │
│  │      ↓                                                           │       │
│  │  [getTarotCardsForQuestions()] → 78장 덱에서 카드 사전 선택        │       │
│  │      ↓                                                           │       │
│  │  [AI 타로 해석 생성] → [order_results 저장]                        │       │
│  │  ※ 카드는 이 시점에 이미 결정됨!                                   │       │
│  │  ※ 120초 초과 시 자기 재호출로 이어서 처리                          │       │
│  └──────────────────────────────────────────────────────────────────┘       │
│       ↓                                                                      │
│  [TarotShufflePage] → [TarotGame]                                           │
│       ↓                                                                      │
│  ┌──────────────────────────────────────────────────────────────────┐       │
│  │  UI 연출 (사용자 경험용, 실제 선택 아님)                            │       │
│  │  idle → mixing → gathered → spreading → selected                 │       │
│  └──────────────────────────────────────────────────────────────────┘       │
│       ↓                                                                      │
│  [UnifiedResultPage] → 사전 선택된 카드 이미지 + AI 해석 표시               │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│                   5. 마스터 콘텐츠 관리 플로우 (관리자 전용)                    │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ※ 관리자(role='master')만 접근 가능한 콘텐츠 생성/관리 플로우               │
│                                                                              │
│  [MasterContentList] ──────────────────────────────────────────────────────│
│       │ 콘텐츠 목록 관리 (수정/삭제/배포)                                     │
│       ↓                                                                      │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  신규 콘텐츠 생성                                                     │   │
│  │  [MasterContentCreate] → 기본정보 입력 (제목, 설명, 가격)              │   │
│  │       ↓                                                               │   │
│  │  [MasterContentQuestions] → 질문지 작성 (AI 프롬프트용)                │   │
│  │       ↓                                                               │   │
│  │  [master_contents 테이블 저장] → status: 'loading'                    │   │
│  │       ↓                                                               │   │
│  │  ┌─────────────────────────────────────────────────────────────┐     │   │
│  │  │  AI 썸네일 생성 (Edge Function)                              │     │   │
│  │  │  generate-image-prompt → generate-thumbnail                  │     │   │
│  │  │       ↓                                                      │     │   │
│  │  │  [Gemini 2.5 Flash] → 이미지 생성                            │     │   │
│  │  │       ↓                                                      │     │   │
│  │  │  [Supabase Storage] → thumbnails/{contentId}.webp 저장       │     │   │
│  │  └─────────────────────────────────────────────────────────────┘     │   │
│  │       ↓                                                               │   │
│  │  [MasterContentLoadingPage] → AI 생성 완료 폴링 (최대 2분)            │   │
│  │       ↓                                                               │   │
│  │  [master_contents.status = 'deployed'] → 콘텐츠 배포 완료             │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│       ↓                                                                      │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  콘텐츠 수정/상세                                                     │   │
│  │  [MasterContentDetail] → 콘텐츠 상세/수정 (관리자용)                   │   │
│  │       ↓                                                               │   │
│  │  • 기본정보 수정 (제목, 설명, 가격)                                   │   │
│  │  • 질문지 수정                                                        │   │
│  │  • 썸네일 재생성 (imageCacheBuster로 캐시 버스팅)                     │   │
│  │  • 콘텐츠 아카이브/삭제                                               │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│       ↓                                                                      │
│  [MasterContentDetailPage] → 사용자용 상세 페이지 (구매 유도)               │
│                                                                              │
│  **관련 파일**:                                                              │
│  • /components/MasterContentCreate.tsx     → 콘텐츠 생성                    │
│  • /components/MasterContentQuestions.tsx  → 질문지 작성                    │
│  • /components/MasterContentDetail.tsx     → 상세/수정 (관리자)             │
│  • /components/MasterContentDetailPage.tsx → 상세 (사용자)                  │
│  • /components/MasterContentList.tsx       → 목록 관리                      │
│  • /components/MasterContentLoadingPage.tsx → AI 썸네일 로딩                │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│                      6. 나다움 보고서 플로우 (주간 보고서)                      │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ※ 로그인 사용자가 무료/유료 콘텐츠에서 모은 태그로 주간 보고서 생성          │
│                                                                              │
│  [태그 수집 단계] ────────────────────────────────────────────────────────  │
│       │ 무료/유료 콘텐츠 결과 페이지에서 태그 선택                            │
│       │ → user_trait_tags 테이블에 저장 (is_confirmed = true)               │
│       ↓                                                                      │
│  [보고서 생성 단계] (pg_cron 자동: 프로덕션 일요일/스테이징 수요일, 또는 관리자 수동 재발송) │
│       │ generate-weekly-reports-batch → generate-weekly-report 호출          │
│       │ concurrency 3, 120초 제한, selfContinue 자동 이어하기               │
│       │ WEEK_START_DAY: 프로덕션=0(일~토), 스테이징=3(수~화)               │
│       │ → OpenAI API로 보고서 콘텐츠 생성                                    │
│       │ → weekly_reports + weekly_report_sections 저장                       │
│       │ → report_tarot_selections에 타로 카드 사전 선택                      │
│       ↓                                                                      │
│  [MyReportList] ─────────────────────────────────────────────────────────  │
│       │ 프로필 > "나의 분석 보고서" 탭                                        │
│       │ 이번 주 태그 수 + 월별 보고서 목록 표시                               │
│       │ 보고서 생성 상태 sessionStorage 유지 + 10초 폴링                     │
│       │ 현재 주차 보고서 존재 시 "이번 주 보고서가 도착했어요" 표시            │
│       │ 바텀시트: framer-motion spring 애니메이션 + drag-to-dismiss           │
│       ↓                                                                      │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  보고서 열람 플로우 (최초 1회)                                        │   │
│  │                                                                       │   │
│  │  [ReportWeeklyDetail] → 주간 운세 요약                                │   │
│  │       ↓                                                               │   │
│  │  [ReportWeeklyTarot] → 타로 카드 셔플 & 뽑기 (1회만)                  │   │
│  │       ↓ (user_viewed = true로 업데이트)                               │   │
│  │  [ReportWeeklyTarotResult] → 타로 카드 해석 결과                      │   │
│  │       ↓                                                               │   │
│  │  [ReportWeeklyMindCare] → 마음 처방 + 다음주 목표                     │   │
│  │       ↓                                                               │   │
│  │  [ReportWeeklyMemo] → "나 응원하기" 작성 (write 모드)                 │   │
│  │       ↓                                                               │   │
│  │  [CompletionCoupon] → 미션 쿠폰 발급 (tag_count≥5인 경우만, 미달 시 스킵) │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│       ↓                                                                      │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  보고서 다시보기 플로우                                               │   │
│  │                                                                       │   │
│  │  [ReportWeeklyDetail] → 주간 운세 요약                                │   │
│  │       ↓ (타로 이미 뽑음 - user_viewed = true)                         │   │
│  │  [ReportWeeklyTarotResult] → 타로 결과 바로 표시 (셔플 스킵)          │   │
│  │       ↓                                                               │   │
│  │  [ReportWeeklyMindCare] → 마음 처방                                   │   │
│  │       ↓                                                               │   │
│  │  [ReportWeeklyMemo] → 응원글 보기 (view 모드) → 프로필로 이동         │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│       ↓                                                                      │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  응원글 수정 플로우 (프로필에서 연필 아이콘 클릭)                      │   │
│  │                                                                       │   │
│  │  [ReportWeeklyMemoEdit] → 응원글 수정                                 │   │
│  │       ↓ (저장 시 my_report_cache 삭제)                                │   │
│  │  [ReportWeeklyMemo] → 수정된 응원글 확인 (view 모드)                  │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
│  **관련 파일**:                                                              │
│  • /components/MyReportList.tsx          → 보고서 목록 (프로필 탭)            
│  • /components/ReportWeeklyDetail.tsx    → 주간 운세 요약                   │
│  • /components/ReportWeeklyTarot.tsx     → 타로 셔플 & 뽑기                 │
│  • /components/ReportWeeklyTarotResult.tsx → 타로 결과                      │
│  • /components/ReportWeeklyMindCare.tsx  → 마음 처방                        │
│  • /components/ReportWeeklyMemo.tsx      → 나 응원하기                      │
│  • /components/ReportWeeklyMemoEdit.tsx  → 응원글 수정                      │
│  • /components/CompletionCoupon.tsx      → 쿠폰 발급                        │
│                                                                              │
│  **관련 테이블**:                                                            │
│  • weekly_reports          → 주간 보고서 메타 정보                          │
│  • weekly_report_sections  → 보고서 섹션 (my_story, tarot, prescription)   │
│  • report_tarot_selections → 타로 카드 선택 정보                            │
│  • user_trait_tags         → 사용자 나다움 태그                             │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 프론트엔드 레이어 구조

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        FRONTEND ARCHITECTURE                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                         App.tsx (Router)                             │   │
│  │  React Router v7 - 모든 라우트 정의, 페이지 Wrapper 컴포넌트         │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│       ↓                                                                      │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                      Pages Layer (41개)                              │   │
│  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐   │   │
│  │  │  HomePage   │ │ProfilePage  │ │ PaymentNew  │ │LoadingPage  │   │   │
│  │  │  (홈)       │ │ (프로필)    │ │  (결제)     │ │  (로딩)     │   │   │
│  │  └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘   │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│       ↓                                                                      │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                   Components Layer (75개)                            │   │
│  │  ┌───────────────────────────────────────────────────────────────┐ │   │
│  │  │ Feature Components (도메인별)                                   │ │   │
│  │  │ • FreeContent*    - 무료 콘텐츠 (6개)                          │ │   │
│  │  │ • MasterContent*  - 유료 콘텐츠 관리 (6개)                      │ │   │
│  │  │ • Saju*           - 사주 관리 (7개)                            │ │   │
│  │  │ • Tarot*          - 타로 (3개)                                 │ │   │
│  │  │ • Payment*        - 결제 (4개)                                 │ │   │
│  │  │ • Auth*           - 인증 (5개)                                 │ │   │
│  │  └───────────────────────────────────────────────────────────────┘ │   │
│  │  ┌───────────────────────────────────────────────────────────────┐ │   │
│  │  │ UI Components (/components/ui/) - shadcn/ui 기반 (52개)        │ │   │
│  │  │ • Button, Input, Dialog, Sheet, Toast, Skeleton 등            │ │   │
│  │  └───────────────────────────────────────────────────────────────┘ │   │
│  │  ┌───────────────────────────────────────────────────────────────┐ │   │
│  │  │ Common Components                                              │ │   │
│  │  │ • NavigationHeader, Footer, BottomNavigation                  │ │   │
│  │  │ • ErrorPage, ErrorBoundary, ImageWithFallback                 │ │   │
│  │  └───────────────────────────────────────────────────────────────┘ │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│       ↓                                                                      │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                    Services Layer (/lib/)                            │   │
│  │  ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐       │   │
│  │  │freeContentService│ │  coupon.ts     │ │    auth.ts      │       │   │
│  │  │(싱글톤+유료추천)│ │  쿠폰 로직      │ │  인증 헬퍼      │       │   │
│  │  └─────────────────┘ └─────────────────┘ └─────────────────┘       │   │
│  │  ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐       │   │
│  │  │ tarotCards.ts   │ │tarotImageCache  │ │thumbnailCache   │       │   │
│  │  │ 78장 덱 데이터   │ │ Cache API      │ │ Cache API      │       │   │
│  │  └─────────────────┘ └─────────────────┘ └─────────────────┘       │   │
│  │  ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐       │   │
│  │  │fetchWithRetry   │ │   logger.ts    │ │   sentry.ts    │       │   │
│  │  │ 재시도 로직     │ │ 구조화 로깅    │ │ 에러 모니터링   │       │   │
│  │  └─────────────────┘ └─────────────────┘ └─────────────────┘       │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│       ↓                                                                      │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                     Utils Layer (/utils/)                            │   │
│  │  analytics.ts, scrollRestoreLogger.ts, supabase/info.tsx            │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 환경별 배포 구조

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         DEPLOYMENT ENVIRONMENTS                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                        PRODUCTION                                    │   │
│  │  Domain: nadaunse.com, www.nadaunse.com                              │   │
│  │  Supabase: kcthtpmxffppfbkjjkub                                      │   │
│  │  Features: 모든 기능 활성화, DEV=false                               │   │
│  │  Monitoring: Sentry 활성화                                           │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                         STAGING                                      │   │
│  │  Domain: Vercel Preview URLs                                         │   │
│  │  Supabase: hyltbeewxaqashyivilu                                      │   │
│  │  Features: 테스트 기능 포함, DEV=true                                │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                        DEVELOPMENT                                   │   │
│  │  Domain: localhost:5173                                              │   │
│  │  Supabase: hyltbeewxaqashyivilu (Staging과 동일)                     │   │
│  │  Features: 디버그 도구 활성화, DEV=true                              │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                       FIGMA MAKE                                     │   │
│  │  Domain: nadaunse.figma.site                                         │   │
│  │  Supabase: kcthtpmxffppfbkjjkub (Production)                         │   │
│  │  Features: DEV=false (도메인 기반 감지, /lib/env.ts)                 │   │
│  │  ※ import.meta.env.DEV가 부정확할 수 있어 도메인 체크 필수           │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
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

```tsx
// TarotGame props
interface TarotGameProps {
  slotCount?: 1 | 3;  // placeholder 슬롯 개수 (기본값: 1)
  // ...
}

// 사용 예시
<TarotGame slotCount={3} />  // ReportWeeklyTarot에서 3장 선택
<TarotGame />                // TarotShufflePage에서 1장 선택 (기본값)
```
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

### Supabase Edge Functions (34개)
| 만세력 | 1개 | Saju API 프록시 (get-manse-data) |
| 기타 | 2개 | 서버 상태, 콘텐츠 답변 생성 |

**📚 상세 문서**: [EDGE_FUNCTIONS_GUIDE.md](../supabase/EDGE_FUNCTIONS_GUIDE.md) - 각 함수별 입력/출력 형식, 배포 방법

---

## 🗄️ Database Schema

### 핵심 테이블 요약

| 테이블 | 용도 | 주요 컬럼 |
|--------|------|----------|
| `users` | 사용자 계정 | provider, role, 약관 동의 |
| `saju_records` | 사주 정보 | 생년월일, 성별, 음력/양력, 띠 |
| `master_contents` | 운세 콘텐츠 | 제목, 가격, 썸네일, status |
| `orders` | 결제 주문 | 결제 금액, PortOne ID, AI 생성 완료 여부 |
| `order_results` | AI 생성 결과 | 질문/답변 쌍 |
| `user_coupons` | 사용자 쿠폰 | 발급/사용 추적 |
| `coupons` | 쿠폰 마스터 | 할인 금액, 쿠폰 타입 (welcome, revisit, mission) |

**📚 상세 문서**: [DATABASE_SCHEMA.md](./DATABASE_SCHEMA.md) - 전체 컬럼, 타입, 제약조건, 인덱스

---

## 🔀 주요 플로우

### 1. 무료 콘텐츠 플로우 (사주/타로)

```
홈 → 무료 상세 (FreeContentDetail) → "무료로 보기" 클릭
    ↓
로그인 체크 (Supabase Auth)
    ↓
┌─────────────┬─────────────┐
│ 로그아웃     │ 로그인       │
│ localStorage │ DB 조회      │
│ 캐시 확인    │ saju_records │
└─────────────┴─────────────┘
    ↓             ↓
┌───┴───┐     ┌───┴───┐
│       │     │       │
있음   없음   있음   없음
│       │     │       │
↓       ↓     ↓       ↓
사주    사주   사주    사주
입력    입력   선택    입력
(캐시)  (입력) (DB)   (입력)
│       │     │       │
└───┬───┴─────┴───┬───┘
    │             │
    ↓             ↓
AI 생성 요청 (Edge Function)
    ↓
로딩 페이지 (FreeContentLoading)
    │ (폴링: 2초마다)
    ↓
결과 페이지 (FreeSajuDetail / FreeContentResult)
    ↓
유료 추천 카드 1개 (동일 카테고리 인기순, 이미 읽은 것 제외)
```

**핵심 클래스**: `FreeContentService` (`/lib/freeContentService.ts`)

**주요 파일**:
- `/components/FreeContentDetail.tsx` - 무료 상세 페이지 (메인)
- `/components/FreeContentDetailComponents.tsx` - UI 컴포넌트 모음
- `/components/FreeBirthInfoInput.tsx` - 사주 입력 (로그인/로그아웃 분기)
- `/components/FreeSajuSelectPage.tsx` - 사주 선택 (로그인 사용자만)
- `/components/FreeContentLoading.tsx` - 로딩 (폴링)
- `/components/FreeSajuDetail.tsx` - 사주 결과 페이지 (유료 추천 카드 포함)
- `/components/FreeContentResult.tsx` - 사주 결과 (대체 UI, 유료 추천 카드 포함)
- `/components/TarotResultPage.tsx` - 타로 결과 페이지

**Edge Functions**: 
- `/generate-free-preview` - 무료 맛보기 생성
- `/generate-saju-preview` - 사주 미리보기
- `/generate-tarot-preview` - 타로 미리보기

**특징**:
- ✅ 로그아웃 사용자도 이용 가능
- ✅ localStorage 캐시 (휘발성)
- ✅ 로그인 시 DB 저장 가능
- ✅ 사주/타로 모두 지원

---

### 2. 유료 콘텐츠 플로우 (심화 해석판) — 새싹 포인트 기반

```
홈 → 심화해석판 상세 (MasterContentDetailPage) → "지금 풀이 확인하기" 클릭
    ↓
로그인 필수 체크
    ↓
새싹 잔액 확인 (users.sprout_balance)
    ↓
┌──────────────────┬──────────────────┐
│ 잔액 >= 30새싹    │ 잔액 < 30새싹     │
│ 즉시 차감         │ 새싹 충전소 이동   │
│ (sprout-deduct)  │ (SproutCharging  │
│                  │  Station)        │
└──────────────────┴──────────────────┘
    │                    │
    │               패키지 선택 → PortOne 결제
    │               → sprout-charge Edge Function
    │               → 잔액 충전 → sprout-deduct
    │                    │
    └────────┬───────────┘
             ↓
    사주 정보 확인
             ↓
┌────────────┬────────────┐
│ DB에 있음   │ DB에 없음   │
│ SajuSelect │ BirthInfo  │
│ Page       │ Input      │
└────────────┴────────────┘
    │            │
    └─────┬──────┘
          ↓
    Edge Function 호출
    (generate-master-content)
          ↓
    AI 응답 → order_results 저장
          ↓
    폴링으로 완료 확인
          ↓
    결과 페이지 (SajuResultPage)
          ↓
    나다움 기록하기 (CheckRecordMe)
```

**주요 파일**:
- `/components/MasterContentDetailPage.tsx` - 유료 상세 페이지 (새싹 차감 로직)
- `/components/SproutChargingStation.tsx` - 새싹 충전소 (패키지 선택 + PortOne 결제)
- `/hooks/useSproutBalance.ts` - 새싹 잔액 조회 훅
- `/components/BirthInfoInput.tsx` - 사주 입력 (결제 후)
- `/components/SajuSelectPage.tsx` - 사주 선택
- `/components/SajuResultPage.tsx` - 사주 결과
- `/components/CheckRecordMe.tsx` - 나다움 기록하기 (태그 선택/저장)

**Edge Functions**:
- `/sprout-charge` - 새싹 충전 (PortOne 결제 후 잔액 증가)
- `/sprout-deduct` - 새싹 차감 (콘텐츠 열람 시)
- `/generate-master-content` - 유료 콘텐츠 생성

**특징**:
- ✅ 새싹(포인트) 기반 결제 (가격: 30새싹)
- ✅ 잔액 충분 시 즉시 차감, 부족 시 충전소 이동
- ✅ 충전 패키지 3종 (40/130/410새싹)
- ✅ DB에 영구 저장
- ✅ SECURITY DEFINER 함수로 잔액 조작 방지

---

### 2-1. 계정 불일치 처리 플로우 (알림톡 링크 접속)

```
알림톡 링크 클릭 (유료 콘텐츠 또는 주간 보고서)
    ↓
UnifiedResultPage / ReportWeeklyDetail
    ↓
세션 체크 (로그인 여부)
    ├─ 로그아웃 상태 → 로그인 페이지로 이동
    └─ 로그인 상태 → 데이터 조회
           ↓
       RLS로 orders/weekly_reports 조회
           ├─ 성공 (본인 데이터) → 결과 표시
           └─ 실패 (다른 계정 데이터) → 계정 불일치 감지
                  ↓
              Edge Function 호출
              (get-order-owner / get-report-owner)
                  ↓
              Service Role Key로 RLS 우회
                  ↓
              auth.admin.getUserById()로 소유자 조회
                  ↓
              이메일/전화번호 마스킹
              (gksruf813 → gksruf***)
                  ↓
              다이얼로그 표시:
              ┌─────────────────────────────┐
              │ 다른 계정으로 구매한 운세예요  │
              │                             │
              │ gksruf***@gmail.com으로      │
              │ 다시 로그인해 주세요.         │
              │                             │
              │ [다른 계정으로 로그인] [홈]   │
              └─────────────────────────────┘
```

**관련 파일**:
- `src/components/UnifiedResultPage.tsx` - 유료 콘텐츠 결과 페이지
- `src/components/ReportWeeklyDetail.tsx` - 주간 보고서 상세 페이지
- `supabase/functions/get-order-owner/` - 주문 소유자 조회
- `supabase/functions/get-report-owner/` - 보고서 소유자 조회

---

### 3. 타로 서비스 플로우

```
홈 → 타로 콘텐츠 상세 → 결제
    ↓
orders 생성 (사주/타로 정보 포함)
    ↓
LoadingPage (AI 생성 시작)
    ↓
Edge Function: generate-content-answers 호출
    │
    ├─ 타로 질문 개수 확인
    ├─ getTarotCardsForQuestions(questionCount) 호출
    │  → 78장 덱에서 질문 개수만큼 카드 **사전 선택**
    │  → { 1: "The Fool", 2: "Ace of Cups", ... } 형태로 저장
    ├─ 선택된 카드로 AI 타로 해석 생성
    └─ order_results에 (질문, 카드명, 해석) 저장
    ↓
LoadingPage 폴링 (2초마다)
    │ - orders.ai_generation_completed 체크
    │ - 완료되면 다음 단계로
    ↓
/tarot/shuffle (TarotShufflePage)
    ↓
TarotGame (카드 섞기 + 선택 - **UI 연출용**, 458줄)
    │ ⚠️ 실제 카드는 이미 백엔드에서 선택됨
    │ ⚠️ 사용자는 재미를 위해 카드를 "선택"하는 것
    │
    ├─ 1단계: idle (초기 상태, 21장 겹쳐진 상태)
    ├─ 2단계: mixing (카드 섞기 애니메이션, 5가지 패턴 랜덤)
    ├─ 3단계: gathered (카드 모으기, 왼쪽 하단으로 집결)
    ├─ 4단계: spreading (부채꼴 펼치기, 21장 아치형 배치)
    ├─ 5단계: selected (카드 1장 선택)
    │
    ↓
타로 결과 표시 (SajuResultPage)
    │ - order_results에서 사전 선택된 카드 이미지 표시
    │ - AI 해석 텍스트 표시
    │ (다음 질문이 있으면 다시 /tarot/shuffle로)
    ↓
모든 질문 완료 → CheckRecordMe (나다움 기록)
```

**주요 파일**:
- `/components/TarotShufflePage.tsx` - 타로 셔플 페이지 (라우트: /tarot/shuffle)
- `/components/TarotGame.tsx` - 카드 섞기 + 선택 UI 연출 컴포넌트 (550줄+)
  - 5단계 애니메이션 시퀀스: idle → mixing → gathered → spreading → selected
  - 21장 타로 카드 인터랙션 (더미, 재미 요소)
  - 모바일 반응형 (320px ~ 440px)
  - ⚠️ 실제 카드는 이미 백엔드에서 선택되어 있음
  - **slotCount prop**: placeholder 슬롯 개수 설정 (1 | 3, 기본값: 1)
    - `TarotShufflePage`: slotCount=1 (유료 콘텐츠, 카드 1장)
    - `ReportWeeklyTarot`: slotCount=3 (이번 주 보고서, 카드 3장)
- `/components/ReportWeeklyTarot.tsx` - 이번 주 보고서 타로 페이지 (slotCount=3)
- `/lib/tarotCards.ts` - 타로 카드 데이터 + 유틸리티
  - TAROT_DECK: 78장 전체 덱 (메이저 22장 + 마이너 56장)
  - getRandomTarotCards(): 랜덤 카드 선택 (중복 없음)
  - getTarotCardsForQuestions(): 질문 개수만큼 카드 할당 (백엔드에서 호출)
  - getTarotCardImageUrl(): 타로 카드 이미지 URL 생성

**Edge Functions**:
- `/generate-content-answers` - 타로 카드 사전 선택 + AI 해석 생성 (메인 로직)
- `/generate-tarot-preview` - 타로 미리보기 (무료 콘텐츠용)

**타로 카드 선택 로직 (중요!)**:
1. **사전 선택 (LoadingPage 시점)**:
   - `generate-content-answers` Edge Function에서 `getTarotCardsForQuestions(questionCount)` 호출
   - 질문 개수만큼 78장 덱에서 중복 없이 랜덤 선택
   - { 1: "The Fool", 2: "Ace of Cups", ... } 형태로 저장
   - 선택된 카드로 AI 해석 생성
   - order_results에 (질문, 카드명, 해석) 저장

2. **UI 애니메이션 (TarotShufflePage 시점)**:
   - TarotGame에서 21장 더미 카드로 섞기/선택 연출
   - **실제 카드는 이미 백엔드에서 선택됨**
   - 사용자는 시각적 재미를 위해 카드를 "선택"

3. **결과 표시 (SajuResultPage)**:
   - order_results에서 사전 선택된 카드 이미지 + AI 해석 표시
   - 사용자가 TarotGame에서 "선택"한 카드는 무시됨

**특징**:
- ✅ 78장 전체 타로 덱 지원 (메이저 22장 + 마이너 56장)
- ✅ 카드 섞기 애니메이션 (5가지 패턴, UI 연출용)
- ✅ 카드 선택 인터랙션 (부채꼴 펼치기, 재미 요소)
- ✅ AI 타로 해석 생성 (LoadingPage 시점에 완료)
- ✅ 유료 콘텐츠 전용
- ✅ 타로 카드 이미지 Storage 연동 (Supabase assets 버킷)
- ⚠️ **카드 선택은 백엔드에서 먼저, UI는 나중에 연출만**

---

### 4. 스크롤 위치 복원 플로우 (HomePage.tsx)

```
홈 화면 → 콘텐츠 클릭
    ↓
sessionStorage에 저장:
- homepage_scroll_state: { scrollY, contentCount }
- homepage_should_restore_scroll: 'true'
    ↓
상세 페이지로 이동
    ↓
뒤로가기 (브라우저)
    ↓
홈 화면 마운트
    ↓
useLayoutEffect 즉시 실행
    ↓
저장된 scrollY로 복원 시도
    ↓
콘텐츠 로드 완료 대기
    ↓
contentCount >= 저장된 수?
    ↓
YES → requestAnimationFrame으로 스크롤
NO  → 추가 로드 후 재시도
```

**디버깅 도구**: `scrollRestoreLogger` (`/utils/scrollRestoreLogger.ts`)

**로그 출력 예시**:
```
🔵 [SCROLL SAVE] { scrollY: 1250, contentCount: 12 }
🟣 [RESTORE ATTEMPT] Target: 1250, Current: 0
🟢 [RESTORE SUCCESS] Final: 1250
```

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

### 7. iOS Safari 둥근 모서리 렌더링 이슈 (NEW!)
**증상**: iOS Safari에서 `border-radius`가 적용된 이미지/컨테이너의 모서리가 잘림  
**체크**:
- [ ] `overflow: hidden` + `border-radius` 조합 사용 중인지 확인
- [ ] `transform-gpu` 클래스가 추가되어 있는지 확인
- [ ] 실제 iOS Safari 기기에서 테스트
- [ ] 다른 브라우저(Chrome, Firefox)에서도 정상 작동 확인

**해결 방법**:
```tsx
// Before (iOS에서 잘림)
<div className="overflow-hidden rounded-2xl">
  <img src="..." />
</div>

// After (정상 렌더링)
<div className="overflow-hidden rounded-2xl transform-gpu">
  <img src="..." />
</div>
```

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
- **[supabase/EDGE_FUNCTIONS_GUIDE.md](../supabase/EDGE_FUNCTIONS_GUIDE.md)** - Edge Functions 가이드 (34개)
- **[supabase/DATABASE_TRIGGERS_AND_FUNCTIONS.md](../supabase/DATABASE_TRIGGERS_AND_FUNCTIONS.md)** - Database Triggers & Functions

---

**문서 버전**: 3.0.0
**최종 업데이트**: 2026-02-25
**문서 끝**