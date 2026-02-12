# PROJECT_CONTEXT.md

> **AI 디버깅 전용 컨텍스트 파일**
> 버그 발생 시 AI에게 가장 먼저 제공해야 하는 프로젝트 뇌(Brain)
> **GitHub**: https://github.com/stargiosoft/nadaunse
> **최종 업데이트**: 2026-02-09 (v2.8.0 - 초개인화 프로덕션 배포, 미션성공쿠폰 추가)

---

## 📚 Tech Stack

- **Frontend**: React 18.3.1 + TypeScript + React Router v7.11.0
- **Styling**: Tailwind CSS v4.0 (CSS 변수 기반)
- **Build Tool**: Vite 6.3.5
- **Backend**: Supabase
  - **Auth**:
    - Google: Supabase OAuth (`signInWithOAuth`)
    - Kakao: Kakao SDK (커스텀 구현, `signInWithPassword` 기반)
  - Database: PostgreSQL + RLS
  - Edge Functions: Deno runtime (31개)
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
- **Edge Functions**: 31개 (주간 보고서 4개 포함)
- **페이지 컴포넌트**: 42개
- **UI 컴포넌트 (shadcn/ui)**: 48개
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
│  │  ├── Components (55개) ────────── UI 렌더링 (Tailwind v4)            │   │
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
│  │   • Google OAuth    │      │   AI 생성 (10개)                         │  │
│  │   • Kakao OAuth     │      │   ├── generate-free-preview             │  │
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
│  │   • orders          │      │   └── issue-revisit-coupon              │  │
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
│  [사용자] → [로그인 버튼] → [OAuth Provider (Google/Kakao)]                  │
│      ↓                              ↓                                        │
│  [AuthCallback.tsx] ← ─ ─ ─ ─ [리다이렉트 + 토큰]                            │
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
│  │  generate-content-answers                                         │       │
│  │      ↓                                                           │       │
│  │  [user_trait_tags 조회] → [초개인화 데이터 구성]                    │       │
│  │      ↓                                                           │       │
│  │  [Stargio 사주 API] → [AI 운세 생성 (초개인화)] → [order_results]  │       │
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
│  │  generate-content-answers                                         │       │
│  │      ↓                                                           │       │
│  │  [getTarotCardsForQuestions()] → 78장 덱에서 카드 사전 선택        │       │
│  │      ↓                                                           │       │
│  │  [AI 타로 해석 생성] → [order_results 저장]                        │       │
│  │  ※ 카드는 이 시점에 이미 결정됨!                                   │       │
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
│  [보고서 생성 단계] (일요일 pg_cron 자동 또는 관리자 수동 재발송)            │
│       │ generate-weekly-reports-batch → generate-weekly-report 호출          │
│       │ concurrency 3, 60초 제한, selfContinue 자동 이어하기                │
│       │ → OpenAI API로 보고서 콘텐츠 생성                                    │
│       │ → weekly_reports + weekly_report_sections 저장                       │
│       │ → report_tarot_selections에 타로 카드 사전 선택                      │
│       ↓                                                                      │
│  [MyReportList] ─────────────────────────────────────────────────────────  │
│       │ 프로필 > "나의 분석 보고서" 탭                                        │
│       │ 이번 주 태그 수 + 월별 보고서 목록 표시                               │
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
│  │  [CompletionCoupon] → 쿠폰 발급 (1회차: 미션성공쿠폰, 2회차+: 재방문쿠폰) │   │
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
│  │                   Components Layer (55개)                            │   │
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
│  │  │ UI Components (/components/ui/) - shadcn/ui 기반 (48개)        │ │   │
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
│  │  │ (싱글톤)        │ │  쿠폰 로직      │ │  인증 헬퍼      │       │   │
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

### 1. 스타일링
- ✅ **Tailwind CSS 우선 사용** (v4.0 CSS 변수 기반)
- ❌ `styled-components`, `emotion` 절대 금지
- ❌ `text-*`, `font-*`, `leading-*` 클래스 **사용 금지** (globals.css에 토큰 정의됨)
- ⚠️ **Tailwind Arbitrary Value 제한**:
  - v4에서 일부 arbitrary value 작동 안 함 (HEX 색상, 픽셀 spacing 등)
  - 1순위: globals.css에 CSS 변수 정의
  - 2순위: inline style 사용 (예외 허용)
  - 참고: `DECISIONS.md` → "2026-01-16 Tailwind CSS v4 Arbitrary Value 제한"

### 2. 타입 정의
- ✅ **TypeScript `interface` 필수 정의**
- ❌ `any` 타입 **절대 금지**
- ✅ Supabase API 응답은 반드시 타입 체크

### 3. 파일 구조
- ✅ **React Router v6** 사용 (`/App.tsx`가 라우터)
- ✅ 페이지 컴포넌트: `/pages/*.tsx`, `/components/*Page.tsx`
- ✅ 재사용 컴포넌트: `/components/*.tsx` (51개)
- ✅ 비즈니스 로직: `/lib/*.ts` (서비스 클래스)
- ✅ 유틸리티: `/utils/*.ts`

### 4. 이미지 처리
- ✅ **Figma 임포트 이미지**: `figma:asset/` 스킴 사용 (경로 접두사 금지)
- ✅ **새 이미지**: `ImageWithFallback` 컴포넌트 필수 사용
- ✅ **SVG**: `/imports/svg-*.ts` 파일에서 임포트
- ✅ **이미지 저장 위치**: `/public` 폴더 (절대 경로 `/image.jpg`로 참조)
- ❌ **외부 이미지 URL 사용 금지**: CSP(Content Security Policy)로 차단됨
- ✅ **CSP 허용 도메인**: `'self'`, `data:`, `blob:`, `https://*.supabase.co`, `https://*.kakaocdn.net`

### 5. 비즈니스 로직 패턴
- ✅ **싱글톤 서비스 클래스** 패턴 사용 (`FreeContentService`)
- ✅ **JSDoc 주석** 모든 public 메서드에 필수
- ✅ **에러 핸들링**: try-catch + 구조화된 로깅

### 6. 개발/배포 환경 분리 (NEW!)
- ✅ **환경 감지 유틸리티**: `/lib/env.ts`의 `DEV`, `isProduction()`, `isDevelopment()` 사용
- ✅ **프로덕션 도메인**: `nadaunse.com`, `www.nadaunse.com`, `nadaunse.figma.site`
- ✅ **개발 전용 코드**: `import.meta.env.DEV` 대신 `/lib/env.ts`의 `DEV` 플래그 사용 권장
- ✅ **적용 대상**: 테스트 버튼, 디버깅 도구, UI 테스팅용 버튼
- ❌ **금지**: 개발 전용 코드가 프로덕션에 노출

**핵심 파일**: `/lib/env.ts`
```typescript
// Figma Make 환경에서는 import.meta.env.DEV가 프로덕션에서도 true일 수 있으므로
// 도메인 기반으로 환경을 감지
export const DEV: boolean  // nadaunse.com, nadaunse.figma.site에서는 false
export const isProduction(): boolean  // 프로덕션 도메인 체크
export const isDevelopment(): boolean  // 프로덕션이 아닌 모든 환경
export const isLocalhost(): boolean  // 로컬 환경 체크
export const isFigmaSite(): boolean  // Figma Make 환경 체크
```

**사용법**:
```tsx
// ✅ 권장 방법 - /lib/env.ts 사용
import { DEV } from '../lib/env';
{DEV && <button onClick={handleDebug}>디버그 버튼</button>}

// ⚠️ 대안 - import.meta.env.DEV (Figma Make에서 부정확할 수 있음)
{import.meta.env.DEV && <button onClick={handleDebug}>디버그 버튼</button>}
```

### 7. Supabase 환경 분리 (NEW!)
- ✅ **환경변수 기반 설정**: `VITE_SUPABASE_PROJECT_ID`, `VITE_SUPABASE_ANON_KEY`
- ✅ **Production**: `kcthtpmxffppfbkjjkub` (nadaunse.com)
- ✅ **Staging/Preview**: `hyltbeewxaqashyivilu` (Vercel Preview)
- ✅ **동적 URL 생성**: `https://${projectId}.supabase.co`

**핵심 파일**: `/utils/supabase/info.tsx`
```typescript
// 환경변수 기반 설정 (fallback: Production)
export const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID || "kcthtpmxffppfbkjjkub";
export const publicAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "<production-key>";
```

**Vercel 환경변수 설정**:
| 환경 | VITE_SUPABASE_PROJECT_ID |
|------|--------------------------|
| Production | `kcthtpmxffppfbkjjkub` |
| Preview | `hyltbeewxaqashyivilu` |
| Development | `hyltbeewxaqashyivilu` |

---

### 8. 사주 API 호출 (중요!) (NEW!)
- ✅ **Edge Function에서 서버 직접 호출**: `SAJU_API_KEY` 환경변수 사용 (IP 화이트리스트 + 키 인증)
- ✅ **브라우저 헤더 흉내**: User-Agent, Referer 등 브라우저 헤더 포함하여 호출
- ✅ **재시도 로직**: 최대 3번 재시도 (1초, 2초 간격)
- ❌ **프론트엔드 직접 호출 금지**: API 키 노출 위험

**핵심 파일**: `supabase/functions/generate-content-answers/index.ts` (96-174번 줄)
```typescript
// ✅ 올바른 패턴 - Edge Function에서 SAJU_API_KEY 사용
const sajuApiKey = Deno.env.get('SAJU_API_KEY')?.trim()
const sajuApiUrl = `https://service.stargio.co.kr:8400/StargioSaju?birthday=${birthday}&lunar=True&gender=${gender}&apiKey=${sajuApiKey}`
const sajuResponse = await fetch(sajuApiUrl, {
  method: 'GET',
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36...',
    'Origin': 'https://nadaunse.com',
    'Referer': 'https://nadaunse.com/',
    // ... 브라우저 헤더
  }
})

// ❌ 잘못된 패턴 - 프론트엔드에서 호출 (API 키 노출)
// const sajuData = await fetchSajuFromBrowser(birthInfo);
```

**상세 문서**: `DECISIONS.md` → "2026-01-13 사주 API 서버 직접 호출" 섹션

---

### 9. 모바일 최적화 (iOS Safari)
- ✅ **border-radius 렌더링 이슈 해결**: `transform-gpu` 클래스 추가
- ✅ **적용 조건**: `overflow: hidden` + `border-radius` 조합 사용 시
- ✅ **하단 고정 CTA**: 리팩토링된 컴포넌트 사용

```tsx
// ✅ 올바른 예시 - iOS Safari에서 정상 렌더링
<div className="overflow-hidden rounded-2xl transform-gpu">
  <img src="..." alt="..." />
</div>

// ❌ 잘못된 예시 - iOS에서 둥근 모서리 잘림
<div className="overflow-hidden rounded-2xl">
  <img src="..." alt="..." />
</div>
```

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
/components/PurchaseHistoryPage.tsx     → 구매 내역
/components/NadaumTagsList.tsx          → 나다움 태그 페이지 (라우트: /profile/nadaum-tags)
/components/NadaumTags.tsx              → 나다움 태그 표시 컴포넌트
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
/components/ui/*                        → shadcn/ui 재사용 컴포넌트 (26개)
/components/skeletons/*                 → 로딩 스켈레톤 (5개)
/components/NavigationHeader.tsx        → 헤더
/components/Footer.tsx                  → 푸터
/components/BottomNavigation.tsx        → 하단 네비게이션
/components/ErrorPage.tsx               → 공통 에러 페이지
/components/ErrorBoundary.tsx           → 에러 바운더리
```
</details>

---

### 🔐 인증 & 회원가입
```
/lib/auth.ts                    → Supabase Auth 헬퍼 함수 (clearUserCaches, recordTodayVisit 포함)
/lib/supabase.ts                → Supabase 클라이언트 설정
/pages/AuthCallback.tsx         → OAuth 콜백 처리
/components/LoginPageNew.tsx    → 로그인 페이지
/components/TermsPage.tsx       → 약관 동의 페이지
/components/WelcomeCouponPage.tsx → 회원가입 완료 (웰컴 쿠폰 안내)
/components/ExistingAccountPageNew.tsx  → 기존 계정 연동
/components/SessionExpiredDialog.tsx    → 세션 만료 다이얼로그
App.tsx (PendingTagsCheckPage)  → 회원가입 후 사주/무료콘텐츠/태그 저장
```

**세션 설정** (Supabase Auth):
| 항목 | 값 | 설명 |
|------|-----|------|
| Access Token 만료 | 7일 (604,800초) | JWT 토큰 유효 기간 |
| Refresh Token | 만료 없음 | 1회 사용 후 자동 갱신 |
| 세션 유지 | 무제한 | 로그아웃 전까지 자동 로그인 |

### 🎨 UI 컴포넌트
```
/components/ui/                 → shadcn/ui 기반 재사용 컴포넌트 (26개)
/components/skeletons/          → 로딩 스켈레톤 UI (5개)
/components/figma/              → Figma 전용 컴포넌트 (보호 파일)
/imports/                       → Figma 디자인 임포트 파일
```

### 📄 페이지 (라우트)
```
/App.tsx                        → React Router 설정 (메인 라우터)
/pages/HomePage.tsx             → 홈 (콘텐츠 목록)

# 무료 콘텐츠
/components/FreeContentDetail.tsx       → 무료 상세 (메인)
/components/FreeContentDetailComponents.tsx → UI 컴포넌트 모음
/components/FreeBirthInfoInput.tsx      → 무료 사주 입력
/components/FreeSajuSelectPage.tsx      → 무료 사주 선택
/components/FreeSajuDetail.tsx          → 무료 사주 결과 (전체)

# 유료 콘텐츠
/components/MasterContentDetailPage.tsx → 유료 콘텐츠 상세 (메인)
/components/PaymentNew.tsx              → 결제 페이지
/components/PaymentComplete.tsx         → 결제 완료
/components/PurchaseFailure.tsx         → 결제 실패
/components/AlimtalkInfoInputPage.tsx   → 알림톡 전화번호 입력
/components/BirthInfoInput.tsx          → 유료 사주 입력
/components/SajuSelectPage.tsx          → 유료 사주 선택
/components/UnifiedResultPage.tsx       → 사주/타로 통합 결과 (/result 라우트)
/components/TableOfContentsBottomSheet.tsx → 목차 바텀시트

# 타로 콘텐츠
/components/TarotShufflePage.tsx        → 타로 셔플 페이지 (라우트: /tarot/shuffle)
/components/TarotGame.tsx               → 카드 섞기 + 선택 UI (21장, iOS Safari 전체화면 배경 대응)
/pages/TestTarotPage.tsx                → 테스트용 타로 페이지 (라우트: /test/tarot, 로그인 불필요)
/components/UnifiedResultPage.tsx       → 사주/타로 통합 결과 (/result 라우트)
/public/tarot-shuffle-background.jpg    → 타로 셔플 배경 이미지 (CSP 대응, 9.8KB)

# 프로필 & 사주 관리
/components/ProfilePage.tsx             → 프로필 (사주 관리)
/components/SajuManagementPage.tsx      → 사주 정보 관리
/components/SajuInputPage.tsx           → 내 사주 입력
/components/SajuAddPage.tsx             → 관계 사주 추가
/components/PurchaseHistoryPage.tsx     → 구매 내역

# 마스터 콘텐츠 관리 (6개)
/components/MasterContentCreate.tsx     → 콘텐츠 생성 (기본정보)
/components/MasterContentQuestions.tsx  → 질문지 작성 (AI 프롬프트용)
/components/MasterContentDetail.tsx     → 콘텐츠 상세/수정 (관리자용)
/components/MasterContentList.tsx       → 콘텐츠 목록 관리
```

### ⏳ 로딩 페이지
```
# 무료 콘텐츠 로딩 (공통 로딩으로도 사용)
/components/FreeContentLoading.tsx
  → 무료 콘텐츠 로딩 + 공통 로딩 페이지
  → Edge Function 동기 호출 (DB 폴링 제거)
  → localStorage 결과 저장
  → 무료 콘텐츠 캐싱 로직 포함

# 유료 콘텐츠 로딩
/components/LoadingPage.tsx
  → 유료 콘텐츠 전용 로딩 페이지
  → 주문 완료 폴링 (orders.ai_generation_completed)
  → 타로/사주 콘텐츠 생성 대기
  → 무료 콘텐츠 캐싱 + 이미지 프리로드

# AI 썸네일 생성 로딩
/components/MasterContentLoadingPage.tsx
  → 마스터 콘텐츠 AI 썸네일 생성 로딩
  → AI 생성 완료 폴링 (최대 2분)
  → 관리자 전용
```

### 🧠 비즈니스 로직
```
/lib/freeContentService.ts      → 무료 콘텐츠 비즈니스 로직 (싱글톤)
/lib/masterContentAI.ts         → 유료 콘텐츠 AI 생성 로직
/lib/coupon.ts                  → 쿠폰 관리 로직
/lib/auth.ts                    → 인증 헬퍼
/lib/sajuApi.ts                 → 사주 API 호출 로직
/lib/zodiacUtils.ts             → 띠 계산 유틸
/lib/zodiacCalculator.ts        → 띠 계산기
/lib/tarotCards.ts              → 타로 카드 데이터 (78장) + 유틸리티 함수
/lib/tarotImageCache.ts         → 타로 카드 이미지 캐싱 (Cache API + 메모리 캐시)
/lib/thumbnailCache.ts          → 콘텐츠 썸네일 캐싱 (Cache API + 메모리 캐시)
/lib/image.ts                   → 이미지 최적화 헬퍼
/lib/imagePreloader.ts          → 이미지 프리로더 (브라우저 메모리 캐시)
/lib/adBannerConfig.ts          → 광고 배너 설정
/lib/logger.ts                  → 구조화된 로거 (민감정보 마스킹)
/lib/fetchWithRetry.ts          → 재시도 로직 (Exponential Backoff)
/lib/sentry.ts                  → Sentry 에러 모니터링 초기화
```

### 🛠️ 유틸리티
```
/utils/analytics.ts             → Google Analytics 연동
/utils/scrollRestoreLogger.ts   → 스크롤 복원 디버깅 로거
```

### 🗄️ Supabase Edge Functions (21개)

| 카테고리 | 개수 | 주요 기능 |
|----------|------|----------|
| AI 생성 | 8개 | 무료/유료 콘텐츠, 사주/타로 운세, 썸네일 생성 |
| 쿠폰 관리 | 4개 | 조회, 적용, 웰컴/재방문/미션성공 쿠폰 발급 |
| 결제/환불 | 3개 | 웹훅 검증, 결제 처리, 환불 |
| 사용자 관리 | 2개 | 사용자, 마스터 콘텐츠 |
| 알림 | 1개 | 카카오 알림톡 발송 |
| 모니터링 | 1개 | Sentry → Slack 중계 |
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
결과 페이지 (FreeSajuDetail / TarotResultPage)
```

**핵심 클래스**: `FreeContentService` (`/lib/freeContentService.ts`)

**주요 파일**:
- `/components/FreeContentDetail.tsx` - 무료 상세 페이지 (메인)
- `/components/FreeContentDetailComponents.tsx` - UI 컴포넌트 모음
- `/components/FreeBirthInfoInput.tsx` - 사주 입력 (로그인/로그아웃 분기)
- `/components/FreeSajuSelectPage.tsx` - 사주 선택 (로그인 사용자만)
- `/components/FreeContentLoading.tsx` - 로딩 (폴링)
- `/components/FreeSajuDetail.tsx` - 사주 결과 페이지
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

### 2. 유료 콘텐츠 플로우 (심화 해석판)

```
홈 → 심화해석판 상세 (MasterContentDetailPage) → "구매하기" 클릭
    ↓
로그인 필수 체크
    ↓
┌─────────┬─────────┐
│ 로그아웃 │ 로그인   │
│ 로그인   │ 결제     │
│ 페이지   │ 페이지   │
└─────────┴─────────┘
    │         │
    └────┬────┘
         ↓
    포트원 결제 (PaymentNew)
    ⭐ 최근 개선 (2026-01-16):
    - 0원 결제: "결제 페이지로 이동중" 로딩 제거
    - 오버레이 감지: display:none iframe 무시
         ↓
    쿠폰 적용 (선택)
    - 웰컴 쿠폰 (3000원)
    - 재방문 쿠폰 (2000원)
    - 미션성공 쿠폰
         ↓
    결제 완료 → orders 생성
    (0원 결제는 PG 호출 없이 바로 처리)
         ↓
    카카오 알림톡 발송 (send-alimtalk)
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
    (여러 질문-답변 쌍)
          ↓
    폴링으로 완료 확인
    (orders.ai_generation_completed)
          ↓
    결과 페이지 (SajuResultPage)
          ↓
    목차 바텀시트 (TableOfContentsBottomSheet)
          ↓
    나다움 기록하기 (CheckRecordMe)
    - 태그 선택/저장
    - 전화번호 입력 바텀시트
```

**주요 파일**:
- `/components/MasterContentDetailPage.tsx` - 유료 상세 페이지 (메인)
- `/components/PaymentNew.tsx` - 결제 페이지
- `/components/CouponBottomSheetNew.tsx` - 쿠폰 선택
- `/components/BirthInfoInput.tsx` - 사주 입력 (결제 후)
- `/components/SajuSelectPage.tsx` - 사주 선택
- `/components/LoadingPage.tsx` - 로딩 (프로그레스 바)
- `/components/SajuResultPage.tsx` - 사주 결과
- `/components/TableOfContentsBottomSheet.tsx` - 목차 (질문 리스트)
- `/components/CheckRecordMe.tsx` - 나다움 기록하기 (태그 선택/저장)

**Edge Functions**: 
- `/generate-master-content` - 유료 콘텐츠 생성
- `/get-available-coupons` - 사용 가능 쿠폰 조회
- `/apply-coupon-to-order` - 쿠폰 적용
- `/send-alimtalk` - 알림톡 발송

**특징**:
- ✅ 로그인 필수
- ✅ 심화 해석판만 결제
- ✅ DB에 영구 저장
- ✅ 쿠폰 적용 가능
- ✅ 카카오 알림톡 자동 발송
- ✅ 목차 기능 (질문별 스크롤 이동)

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

### 8. 개발용 버튼이 프로덕션에 노출됨
**증상**: 배포 환경에서 테스트/디버그 버튼이 사용자에게 보임
**체크**:
- [ ] `import.meta.env.DEV` 조건으로 감싸져 있는지 확인
- [ ] 빌드 후 실제 프로덕션 환경에서 테스트
- [ ] 개발 전용 로그가 프로덕션에 출력되는지 확인

**해결 방법**:
```tsx
// ✅ 올바른 예시
{import.meta.env.DEV && (
  <button onClick={handleDebug}>디버그 버튼</button>
)}

// ❌ 잘못된 예시
<button onClick={handleDebug}>디버그 버튼</button>
```

**적용 파일들**:
- `/components/LoginPageNew.tsx` - 테스트 버튼
- `/components/MasterContentDetailPage.tsx` - 개발 플래그

**참고**: ProfilePage.tsx의 디버그 버튼들은 2026-01-15에 완전 제거됨

---

### 9. iOS 스와이프 뒤로가기로 회원가입 페이지 재진입 (NEW!)
**증상**: 회원가입 완료 후 여러 번 스와이프 뒤로가기 시 로그인/약관/환영쿠폰 페이지로 돌아감
**체크**:
- [ ] OAuth 플로우 관련 페이지인지 확인 (로그인, 약관, 환영쿠폰)
- [ ] 페이지 마운트 시 상태 체크 로직이 있는지 확인
- [ ] `navigate(..., { replace: true })` 사용했는지 확인
- [ ] localStorage/sessionStorage 상태 플래그 확인

**원인**:
- OAuth 외부 리다이렉트 전 로그인 페이지가 히스토리에 남음
- `replace: true`는 현재 네비게이션만 대체, 이전 항목은 그대로

**해결 방법**:
```tsx
// 각 회원가입 플로우 페이지에서 마운트 시 상태 체크
useEffect(() => {
  const user = localStorage.getItem('user');
  if (user) {
    // 이미 로그인 완료 → 홈으로 리다이렉트
    navigate('/', { replace: true });
  }
}, [navigate]);
```

**적용 파일들**:
- `/App.tsx` - LoginPageNewWrapper, TermsPageWrapper, WelcomeCouponPageWrapper
- **상세 문서**: `DECISIONS.md` → "2026-01-07 - iOS 스와이프 뒤로가기" 섹션

---

### 10. iOS 스와이프 뒤로가기: 프로필/사주관리 페이지 리로드 (NEW!)
**증상**: 스와이프 뒤로가기 시 프로필/사주관리 페이지가 리로드되는 것처럼 보임
**체크**:
- [ ] `getInitialState()`에서 localStorage 캐시를 동기적으로 로드하는지 확인
- [ ] `useState` 초기값으로 캐시 데이터를 설정하는지 확인
- [ ] framer-motion 애니메이션이 캐시 존재 시 스킵되는지 확인
- [ ] `*_needs_refresh` 플래그로 API 호출을 제어하는지 확인

**원인**:
- API 호출은 스킵해도 framer-motion 애니메이션이 매번 재실행됨
- `getInitialState()`와 `setSajuList()`의 정렬 로직 불일치

**해결 방법**:
```tsx
// 캐시가 있으면 애니메이션 스킵
const skipAnimation = initialState.hasCache;
const itemVariants = skipAnimation
  ? { hidden: { opacity: 1, y: 0 }, visible: { opacity: 1, y: 0 } }
  : { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } };
```

**적용 파일들**:
- `/components/ProfilePage.tsx`
- `/components/SajuManagementPage.tsx`
- **상세 문서**: `DECISIONS.md` → "2026-01-11 - 프로필/사주관리 페이지 캐시 기반 렌더링" 섹션

---

### 11. iOS 스와이프 뒤로가기: 사주 수정 후 히스토리 꼬임 (NEW!)
**증상**: 사주 수정 후 사주관리로 이동 → 스와이프 뒤로가기 시 프로필이 아닌 사주관리로 또 이동
**체크**:
- [ ] `onSaved` 콜백에서 `navigate(..., { replace: true })` 사용하는지 확인
- [ ] 브라우저 히스토리 스택 확인 (개발자 도구 → Application → History)

**원인**:
- `navigate('/saju/management')` 호출 시 새 히스토리 항목이 추가됨
- 히스토리: [프로필, 사주관리, 사주수정, 사주관리] ← 중복

**해결 방법**:
```tsx
// App.tsx - SajuInputPageWrapper, SajuAddPageWrapper
onSaved={() => navigate('/saju/management', { replace: true })}
```

**적용 파일들**:
- `/App.tsx` - SajuInputPageWrapper, SajuAddPageWrapper
- **상세 문서**: `DECISIONS.md` → "2026-01-11 - 사주 수정 후 히스토리 스택 문제" 섹션

---

### 12. 사주 API 호출 방식 (최종 해결) (NEW!)
**증상**: AI가 더미 데이터로 응답, 실제 사주 정보 없이 운세 생성
**체크**:
- [ ] Edge Function에서 `SAJU_API_KEY` 환경변수를 사용하고 있는지 확인
- [ ] 브라우저 헤더(User-Agent, Referer 등)를 포함하고 있는지 확인
- [ ] 재시도 로직이 작동하는지 확인 (최대 3번)
- [ ] Supabase Secrets에 `SAJU_API_KEY`가 설정되어 있는지 확인

**원인**:
- Stargio API 서버가 IP 화이트리스트 + API 키 방식으로 인증
- 브라우저 헤더 없이 호출 시 차단될 수 있음

**최종 해결 방법**:
```typescript
// Edge Function에서 SAJU_API_KEY 사용하여 서버 직접 호출
const sajuApiKey = Deno.env.get('SAJU_API_KEY')?.trim()
const sajuApiUrl = `https://service.stargio.co.kr:8400/StargioSaju?birthday=${birthday}&lunar=True&gender=${gender}&apiKey=${sajuApiKey}`

// 브라우저 헤더 흉내
const sajuResponse = await fetch(sajuApiUrl, {
  method: 'GET',
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36...',
    'Origin': 'https://nadaunse.com',
    'Referer': 'https://nadaunse.com/',
    // ... 기타 브라우저 헤더
  }
})
```

**적용 파일들**:
- `supabase/functions/generate-content-answers/index.ts` (96-174번 줄)
- **상세 문서**: `DECISIONS.md` → "2026-01-13 사주 API 서버 직접 호출" 섹션

---

### 13. iOS 하단 고정 CTA 첫 번째 클릭 무반응 (NEW!)
**증상**: iOS Safari에서 하단 고정 버튼의 첫 번째 클릭/터치가 무반응 (로그도 없음)
**체크**:
- [ ] 스크롤 컨테이너와 Fixed 버튼 간 z-index 충돌 확인
- [ ] `pointer-events-auto` 명시적 설정 여부 확인
- [ ] 스크롤 컨테이너 영역이 Fixed 버튼 영역을 침범하는지 확인

**원인**:
- iOS Safari에서 z-index만으로는 터치 이벤트 우선순위가 보장되지 않음
- 스크롤 컨테이너의 터치 이벤트가 Fixed 버튼을 가로챔

**해결 방법**:
```tsx
// Fixed 버튼에 명시적 pointer-events 설정
<div className="fixed bottom-0 z-50 pointer-events-auto">
  <button>구매하기</button>
</div>

// 스크롤 컨테이너 영역 제한
<div className="overflow-auto pb-[100px]">  {/* 버튼 영역만큼 padding */}
  {/* 콘텐츠 */}
</div>
```

**적용 파일들**:
- 하단 고정 CTA 사용하는 모든 페이지
- **상세 문서**: `DECISIONS.md` → "2026-01-12 iOS 첫 번째 클릭 이벤트 누락" 섹션

---

### 14. iOS 스와이프 뒤로가기: 결제 페이지 bfcache 문제
**증상**: 결제 페이지에서 뒤로가기 후 다시 진입 시 결제 버튼이 비활성화 상태로 남아있음
**체크**:
- [ ] `pageshow` 이벤트로 bfcache 복원을 감지하는지 확인
- [ ] `event.persisted`로 bfcache 복원 여부 판단하는지 확인
- [ ] `visibilitychange` 이벤트로 탭 전환 시 상태 리셋하는지 확인
- [ ] `popstate` 이벤트로 뒤로가기 감지하는지 확인

**원인**:
- iOS Safari bfcache가 페이지 상태(React state)를 메모리에 보존
- `isProcessingPayment = true` 상태가 그대로 남아있음

**해결 방법**:
```tsx
// bfcache 복원 시 상태 리셋
useEffect(() => {
  const handlePageShow = (event: PageTransitionEvent) => {
    if (event.persisted) {
      setIsProcessingPayment(false);
    }
  };
  window.addEventListener('pageshow', handlePageShow);
  return () => window.removeEventListener('pageshow', handlePageShow);
}, []);
```

**적용 파일들**:
- `/components/PaymentNew.tsx`
- `/components/SajuResultPage.tsx`
- **상세 문서**: `DECISIONS.md` → "2026-01-11 - 결제/결과 페이지 bfcache 대응" 섹션

---

## 📝 디버깅 시 AI에게 제공할 정보

버그 발생 시 아래 형식으로 AI에게 요청하세요:

```markdown
## 긴급 디버깅 요청

### 1. 프로젝트 문맥
(이 PROJECT_CONTEXT.md 전체 내용 붙여넣기)

### 2. 버그 증상
- **발생 페이지**: (예: HomePage.tsx)
- **발생 환경**: (예: 개발/프로덕션, iOS Safari/Chrome)
- **재현 단계**: 
  1. 홈 화면 스크롤 다운
  2. 콘텐츠 클릭
  3. 뒤로가기
  4. → 최상단으로만 이동됨
- **예상 동작**: 원래 스크롤 위치로 복원
- **실제 동작**: 최상단(0px)으로 이동

### 3. 관련 로그
(콘솔 로그, scrollRestoreLogger 출력 등 붙여넣기)

### 4. 관련 파일 (추정)
- /pages/HomePage.tsx (스크롤 복원 로직)
- /utils/scrollRestoreLogger.ts (로거)

### 5. 이미 시도한 해결 방법
- sessionStorage 값 확인 → 정상
- contentCount 확인 → 정상
- ...

### 요청사항
- 근본 원인 분석
- 수정 코드 제공
- 재발 방지 테스트 케이스 추가
```

---

## 🔄 업데이트 이력

| 버전 | 날짜 | 변경 내용 | 작성자 |
|------|------|-----------|--------|
| 2.8.0 | 2026-02-09 | **초개인화 프로덕션 배포** - generate-content-answers/saju-answer/tarot-answer 초개인화 프롬프트 프로덕션 배포. **미션성공쿠폰 추가** - coupons 테이블에 mission 타입 추가, CompletionCoupon 발급 로직 변경 (1회차: mission, 2회차+: revisit). 유료 콘텐츠 플로우에 초개인화 데이터 흐름 반영 | AI Assistant |
| 2.7.0 | 2026-02-09 | **rejected_tags 시스템 추가** - CheckRecordMe 미선택 태그 누적 저장, extract-trait-tags rejectedTags 파라미터 추가. **last_login_at 통합** - HomePage → auth.ts recordTodayVisit()로 이동. **anonymous_free_views INSERT 전환** - upsert→INSERT, UNIQUE 제약 제거. TagCouponBottomSheet 추가 | AI Assistant |
| 2.6.0 | 2026-02-03 | **계정 불일치 처리 플로우 추가** - 알림톡 링크 접속 시 다른 계정이면 소유자 마스킹 이메일 표시, get-order-owner/get-report-owner Edge Function 추가 | AI Assistant |
| 2.5.0 | 2026-02-02 | **나다움 보고서 플로우 추가** - System Map에 6번째 데이터 흐름 추가 (태그 수집 → 보고서 생성 → 열람/다시보기/수정 플로우), 9개 컴포넌트 문서화, 4개 테이블 참조 | AI Assistant |
| 2.3.0 | 2026-01-23 | **문서 중복 제거** - Database Schema, Edge Functions 섹션 간소화 (상세 문서 참조로 변경), 관리 포인트 감소 | AI Assistant |
| 2.2.0 | 2026-01-23 | **마스터 콘텐츠 관리 플로우 추가** - System Map에 5번째 데이터 흐름 추가 (콘텐츠 생성/질문지 작성/AI 썸네일 생성/배포 플로우), 관련 6개 컴포넌트 문서화 | AI Assistant |
| 2.1.0 | 2026-01-23 | **System Map 대폭 보강** - 전체 시스템 아키텍처 다이어그램, 데이터 흐름 (인증/무료/유료/타로 플로우), 프론트엔드 레이어 구조, 환경별 배포 구조 추가 | AI Assistant |
| 2.0.2 | 2026-01-22 | **TarotGame slotCount 설정** - TarotGame에 slotCount prop 추가 (1 \| 3, 기본값: 1), TarotShufflePage는 1장, ReportWeeklyTarot은 3장 선택, 버튼 레이블/카드 선택 로직 slotCount 기반 동작 | AI Assistant |
| 2.0.1 | 2026-01-20 | **UI/UX 및 성능 개선** - UnifiedResultPage Framer Motion 제거 (타로 카드 2번째 질문부터 공란 버그 수정), SajuAddPage 관계 선택 리스트 변경 (9개 → 6개: 연인/가족/친구/지인/동료/기타), DB 마이그레이션 (관계 필드 정규화), ProfilePage 로그아웃 확인 다이얼로그 추가, ConfirmDialog 이중 레이어 버그 수정, 사주 삭제 성능 최적화 3개 페이지 (2초 → 0.3초, Promise.all 병렬 처리), SajuAddPage 관계 선택 bottom sheet 간격 수정 (pb-[100px] → pb-[24px]), DECISIONS.md 타로 카드 캐시 이슈 히스토리 문서화 | AI Assistant |
| 2.0.0 | 2026-01-20 | **캐싱 전략 대폭 개선** - vercel.json HTTP 캐시 헤더 추가 (JS/CSS 1년, 이미지 1일), thumbnailCache.ts 신규 생성 (콘텐츠 썸네일 Cache API), 타로 캐시 최적화 (싱글톤 + 메모리 캐시 + 배치 처리, 1-6초 → 0.3-0.8초), 구매 내역 DB 쿼리 병렬화 (400-1000ms → 150-400ms) | AI Assistant |
| 1.9.2 | 2026-01-19 | AlimtalkInfoInputPage 추가, SajuCard/SajuManagementPage 구분자 렌더링 방식 변경 (SVG → CSS div), 컴포넌트 개수 업데이트 (54→55개) | AI Assistant |
| 1.9.1 | 2026-01-17 | 📂 File Structure 전면 현행화 - UnifiedResultPage 추가, SajuResultPage/TarotResultPage 레거시 제거, 누락 파일 추가 (PurchaseFailure, SajuCard, ConfirmDialog, PrivacyPolicy, TermsOfService, tarotImageCache, imagePreloader, sajuApi, adBannerConfig, zodiacCalculator 등) | AI Assistant |
| 1.9.0 | 2026-01-17 | 타로 카드 뽑기 로직 상세 문서화 - TAROT_DECK (78장), 카드 선택 로직, TarotGame 애니메이션 5단계, 컴포넌트 개수 업데이트 (51→55개) | AI Assistant |
| 1.8.7 | 2026-01-16 | HomePage 탭바 스크롤 숨김/노출 기능 추가 - 아래 스크롤 시 SegmentedControl (종합/심화 해석판/무료 체험판) 자동 숨김, 위 스크롤 시 노출, 애니메이션 개선 (300ms ease-out) | AI Assistant |
| 1.8.6 | 2026-01-16 | FreeContentDetail 광고 배너 하단 250px 여백 추가 (inline style) - 하단 CTA 버튼과 충분한 공간 확보 | AI Assistant |
| 1.0.0 | 2025-12-20 | 초기 문서 작성 | AI Assistant |
| 1.1.0 | 2025-12-20 | DEV_FLOW.md 통합 (무료/유료 플로우 추가) | AI Assistant |
| 1.2.0 | 2026-01-06 | 타로 서비스 추가, 개발/배포 환경 분리, iOS Safari 최적화, 컴포넌트 51개/Edge Functions 17개 반영 | AI Assistant |
| 1.3.0 | 2026-01-07 | iOS 스와이프 뒤로가기 히스토리 관리 버그 해결 추가 | AI Assistant |
| 1.4.0 | 2026-01-07 | 개발 안정성 강화 - Sentry, 로거, 재시도 로직, 결제 웹훅/환불, Edge Functions 20개 | AI Assistant |
| 1.4.1 | 2026-01-09 | 마스터 콘텐츠 관리 섹션 추가 (6개 컴포넌트 상세화) | AI Assistant |
| 1.5.0 | 2026-01-09 | FreeProductDetail 백업, FreeContentDetail로 대체 (하드코딩 더미 데이터 버그 수정) | AI Assistant |
| 1.5.1 | 2026-01-11 | ResultCompletePage 문서화 추가 (풀이 완료 페이지, 재방문 쿠폰) | AI Assistant |
| 1.6.0 | 2026-01-11 | iOS 스와이프 뒤로가기 버그 체크리스트 추가 (#10~#12) | AI Assistant |
| 1.7.0 | 2026-01-13 | 사주 API 백엔드 서버 직접 호출 (SAJU_API_KEY 사용), 이미지 캐시 버스팅, iOS 클릭 이벤트 버그 추가 | AI Assistant |
| 1.8.0 | 2026-01-15 | TarotDemo.tsx 삭제, ResultCompletePage 토스트 아이콘 변경 (PositiveIcon), 결과 페이지 레이아웃 조정 | AI Assistant |
| 1.8.1 | 2026-01-15 | ProfilePage.tsx 디버그 버튼 제거, Footer 레이아웃 개선 (min-height wrapper + flexible spacer) | AI Assistant |
| 1.8.2 | 2026-01-16 | SajuManagementPage 타이포그래피/레이아웃 정밀 조정 (섹션 타이틀 font-semibold, 프로필 이름 font-medium, 간격 최적화) | AI Assistant |
| 1.8.3 | 2026-01-16 | WelcomeCouponPage 수직 중앙 정렬 (pb-[160px]) | AI Assistant |
| 1.8.4 | 2026-01-16 | iOS Safari 상태바 색상 흰색으로 변경 (theme-color #ffffff) | AI Assistant |
| 1.8.5 | 2026-01-16 | FreeSajuSelectPage, SajuCard UI 통일 (SajuManagementPage와 동일) - 섹션 타이틀 font-semibold, 프로필 이름 font-medium, 간격 조정 | AI Assistant |

---

## 🎯 최근 주요 개선사항 (2026-01-20)

### ✅ 캐싱 전략 대폭 개선 (NEW!)
- **HTTP 캐시 헤더 추가** (`vercel.json`):
  - JS/CSS 번들: 1년 캐싱 (immutable)
  - 이미지: 1일 캐싱 + 1주일 백그라운드 재검증
  - HTML: 항상 최신 (max-age=0)
  - **효과**: 페이지 로딩 속도 30-50% 개선, 재방문 시 50-80% 빠름
- **콘텐츠 썸네일 Cache API** (`thumbnailCache.ts` 신규):
  - 타로 캐시와 동일한 구조 (싱글톤 + 메모리 캐시 + 배치 처리)
  - 만료 시간: 1일 (콘텐츠 업데이트 반영)
  - **효과**: 홈 화면 체감 속도 2배 개선
- **타로 캐시 성능 최적화** (`tarotImageCache.ts`):
  - 싱글톤 Cache 인스턴스 (caches.open() 99% 감소)
  - 메모리 캐시 (Cache API 조회 → 메모리 조회, 99.9% 빠름)
  - 배치 처리 (최대 6개씩 동시 다운로드)
  - 프리로드 범위 제한 (132개 → 10개)
  - **효과**: 1-6초 → 0.3-0.8초 (75% 개선)
- **구매 내역 DB 쿼리 병렬화** (`PurchaseHistoryPage.tsx`):
  - Promise.all로 2개 쿼리 동시 실행
  - count-only 쿼리로 데이터 전송량 감소
  - **효과**: 400-1000ms → 150-400ms (62.5% 개선)
- **핵심 파일**: `vercel.json`, `src/lib/thumbnailCache.ts`, `src/lib/tarotImageCache.ts`, `src/components/PurchaseHistoryPage.tsx`
- **상세 문서**: `DECISIONS.md` → "2026-01-20 캐싱 전략" 섹션

### ✅ 사주 API 백엔드 직접 호출 (최종 해결)
- **문제**: Edge Function에서 Stargio 사주 API 호출 시 HTTP 200이지만 빈 데이터 `{}` 반환
- **원인**: API 서버가 서버 사이드 요청을 실제 브라우저 요청과 구분하여 차단
- **최종 해결**: Edge Function에서 `SAJU_API_KEY` 환경변수를 사용하여 서버 직접 호출 (IP 화이트리스트 + 키 인증)
- **핵심 파일**: `supabase/functions/generate-content-answers/index.ts` (96-174번 줄)
- **상세 문서**: `DECISIONS.md` → "2026-01-13 사주 API 서버 직접 호출" 섹션

### ✅ 썸네일 이미지 캐시 버스팅 (NEW!)
- **문제**: 썸네일 재생성 시 브라우저 캐시로 인해 이전 이미지 계속 표시
- **해결**: `imageCacheBuster` 상태로 URL에 버전 쿼리 파라미터 추가
- **핵심 파일**: `/components/MasterContentDetail.tsx`, `/components/MasterContentList.tsx`

### ✅ iOS 첫 번째 클릭 이벤트 누락 해결 (NEW!)
- **문제**: iOS Safari에서 하단 고정 CTA 버튼의 첫 번째 클릭이 로그조차 잡히지 않음
- **원인**: 스크롤 컨테이너와 Fixed 하단 버튼 간의 z-index/pointer-events 충돌
- **해결**: `pointer-events-auto` 명시적 설정 + 스크롤 컨테이너 영역 제한
- **상세 문서**: `DECISIONS.md` → "2026-01-12 iOS 첫 번째 클릭 이벤트 누락" 섹션

### ✅ 무료 콘텐츠 상세 페이지 버그 수정
- **문제**: 뒤로가기 시 `FreeProductDetail` 컴포넌트의 하드코딩된 더미 데이터 노출
- **원인**: `ProductDetailPage`에서 구버전 `FreeProductDetail` 사용 (운세 구성이 하드코딩됨)
- **해결**: `FreeProductDetail.tsx` → `_backup` 폴더로 이동, `FreeContentDetail` 사용하도록 변경
- **핵심 파일**:
  - `App.tsx` (ProductDetailPage에서 FreeContentDetail 렌더링)
  - `FreeContentDetail.tsx` (DB에서 질문 데이터 조회)
  - `FreeContentDetailComponents.tsx` (FortuneComposition 등 UI 컴포넌트)

### ✅ iOS 스와이프 뒤로가기 히스토리 관리
- OAuth 회원가입 플로우에서 발생하는 히스토리 스택 문제 해결
- 각 페이지에서 마운트 시 상태 체크 후 적절한 페이지로 리다이렉트
- **핵심 파일**: `App.tsx` (LoginPageNewWrapper, TermsPageWrapper, WelcomeCouponPageWrapper)
- **상세 문서**: `DECISIONS.md` → "2026-01-07 - iOS 스와이프 뒤로가기" 섹션

### ✅ 개발/배포 환경 자동 분리
- **도메인 기반 환경 감지**: `/lib/env.ts` 파일을 통한 정확한 환경 판별
  - 프로덕션 도메인: `nadaunse.com`, `www.nadaunse.com`, `nadaunse.figma.site`
  - `import.meta.env.DEV`는 Figma Make 환경에서 부정확할 수 있어 대체
- **환경 유틸리티 함수**:
  - `DEV`: 개발 환경 여부 (프로덕션에서 false)
  - `isProduction()`: 프로덕션 도메인 체크
  - `isDevelopment()`: 프로덕션이 아닌 모든 환경
  - `isLocalhost()`: 로컬 환경 체크
  - `isFigmaSite()`: Figma Make 환경 체크
- **적용 컴포넌트**:
  - `LoginPageNew.tsx`: `isDevelopment()`로 테스트 버튼 분기
  - `App.tsx`: 프로덕션 환경 체크 및 `import.meta.env.DEV` 오버라이드
- 테스트 버튼, 디버깅 도구가 프로덕션에 노출되지 않음
- **참고**: ProfilePage.tsx의 디버그 버튼들은 2026-01-15에 완전 제거됨

### ✅ iOS Safari 렌더링 최적화
- `transform-gpu` 클래스로 `border-radius` 이슈 해결
- 맛보기 카드, 이미지 컨테이너 등 적용 완료
- iOS Safari 실제 기기 테스트 완료

### ✅ 타로 서비스 통합
- 타로 카드 섞기, 선택, 결과 페이지 추가
- 사주/타로 통합 운세 서비스로 확장
- AI 타로 해석 생성 기능 완료

### ✅ 하단 고정 CTA 리팩토링
- 모바일 최적화된 하단 CTA 컴포넌트 개선
- 일관된 사용자 경험 제공

### ✅ Edge Functions 확장
- 총 20개 Edge Functions 운영 중
- AI 생성 8개, 쿠폰 관리 4개, 사용자 관리 2개, 알림 1개, 결제/환불 3개, 기타 2개

### ✅ 개발 안정성 강화 (NEW!)
- **Sentry 에러 모니터링**: 실시간 에러 추적, 사용자 컨텍스트 자동 설정 (`setUser`)
  - 핵심 파일: `src/lib/sentry.ts`, `src/lib/auth.ts`
- **구조화된 로거**: 환경별 로그 레벨, 민감정보 자동 마스킹
  - 핵심 파일: `src/lib/logger.ts`
- **재시도 로직**: Exponential Backoff (1s, 2s, 4s), 최대 3회 재시도
  - 핵심 파일: `src/lib/fetchWithRetry.ts`
- **결제 웹훅 구현**: 포트원 서버 콜백으로 결제 검증 강화
  - Edge Function: `payment-webhook`
- **결제 트랜잭션 원자성**: PostgreSQL Function으로 주문+쿠폰 원자적 처리
  - Edge Function: `process-payment`, DB Function: `process_payment_complete`
- **환불 처리 기능**: 포트원 환불 API 연동, 쿠폰 복원 로직
  - Edge Function: `process-refund`, DB Function: `process_refund`
- **환경변수 보안**: `VITE_KAKAO_AUTH_SECRET`, `VITE_SENTRY_DSN` 추가

---

## 📚 추가 참고 문서

- **[README.md](./README.md)** - 프로젝트 개요 및 빠른 시작
- **[AI_ONBOARDING.md](./AI_ONBOARDING.md)** - AI 작업 가이드 (필독!)
- **[DECISIONS.md](./DECISIONS.md)** - 아키텍처 결정 기록
- **[DATABASE_SCHEMA.md](./DATABASE_SCHEMA.md)** - DB 스키마 상세
- **[components-inventory.md](./components-inventory.md)** - 컴포넌트 목록 (51개)
- **[supabase/EDGE_FUNCTIONS_GUIDE.md](./supabase/EDGE_FUNCTIONS_GUIDE.md)** - Edge Functions 가이드 (20개)
- **[supabase/DATABASE_TRIGGERS_AND_FUNCTIONS.md](./supabase/DATABASE_TRIGGERS_AND_FUNCTIONS.md)** - Database Triggers & Functions

---

**문서 버전**: 2.3.0
**최종 업데이트**: 2026-01-23
**문서 끝**