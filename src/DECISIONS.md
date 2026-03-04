# DECISIONS.md

> **아키텍처 결정 기록 (Architecture Decision Records)**
> "왜 이렇게 만들었어?"에 대한 대답
> **GitHub**: https://github.com/stargiosoft/nadaunse
> **최종 업데이트**: 2026-03-04

---

## 2026-03-04 공유 리워드 버그 수정 2건

**결정**: (1) REVOKE FROM PUBLIC 후 service_role GRANT 추가 (2) sprout_transactions CHECK 제약조건에 'reward' 타입 추가
**이유**: (1) `REVOKE EXECUTE FROM PUBLIC`이 service_role 권한도 제거하여 Edge Function에서 RPC 호출 불가 (500 에러) (2) `process_share_reward` RPC가 `transaction_type='reward'`로 INSERT 시 CHECK 제약조건 위반 (23514 에러)
**구현**: (1) 5개 RPC 함수에 `GRANT EXECUTE TO service_role` 명시적 부여 (2) `sprout_transactions_transaction_type_check`에 'reward' 추가
**영향 파일**: `migrations/20260303_protect_sprout_balance_rls.sql`, `migrations/20260304_add_reward_transaction_type.sql`

---

## 2026-03-04 새싹 잔액 보안 강화 (3중 방어)

**결정**: protect_sprout_balance 트리거 + REVOKE EXECUTE + GRANT service_role + sprout-charge PortOne 검증
**이유**: (1) `users` 테이블 RLS disabled 상태에서 `supabase.from('users').update({ sprout_balance: 999999 })` 가능 (2) SECURITY DEFINER RPC를 클라이언트에서 직접 호출(`supabase.rpc('process_sprout_charge')`)하여 Edge Function 결제 검증 우회 가능 (3) `sprout-charge` Edge Function이 PortOne 결제 확인 없이 충전 처리
**구현**: (1) BEFORE UPDATE 트리거로 `current_user IN ('authenticated','anon')` 시 sprout_balance 변경 차단 (SECURITY DEFINER RPC는 current_user='postgres'이므로 통과) (2) 5개 RPC 함수에서 PUBLIC/authenticated/anon EXECUTE 권한 제거 + **service_role에 명시적 GRANT** (⚠️ REVOKE FROM PUBLIC은 service_role도 제거하므로 필수) (3) sprout-charge에 PortOne API 결제 검증 + 금액 일치 확인 추가
**영향 파일**: `sprout-charge/index.ts`, `migrations/20260303_protect_sprout_balance_rls.sql`

---

## 2026-03-04 새싹 충전 후 로딩 UX 개선

**결정**: 충전 완료~SajuSelectPage 이동까지 전체화면 로딩 오버레이 표시
**이유**: 충전 성공 후 차감+주문 생성 등 ~3초 동안 충전 화면이 그대로 보임 (로딩 피드백 없음)
**구현**: `SproutChargingStationPage`에 `isDeducting` 상태 추가. 잔액 충분 시 즉시 `LoadingWithMessage("운세 준비 중이에요!")` 표시. SajuSelectPage 초기 로딩도 동일 메시지로 통일
**영향 파일**: `App.tsx`, `SajuSelectPage.tsx`

---

## 2026-03-03 공유 리워드 시스템 (레퍼럴 + 피보나치 회차)

**결정**: 레퍼럴 공유 → 피보나치 회차(1,1,2,3,5,8...)별 30새싹 리워드. 서버 측 IP+UA fingerprint로 부정 탐지
**이유**: 성장 초기 바이럴 유인 필요. 피보나치 난이도 상승으로 무한 어뷰징 방지. 클라이언트 fingerprint는 조작 가능 → 서버 생성(SHA-256) 필수
**구현**: `process-referral` Edge Function (서버 fingerprint) → `process_share_reward` RPC (SECURITY DEFINER, 원자적 처리). 부정 의심 시 기록만 하고 카운트/리워드 스킵 (차단 대신 사일런트 스킵)
**영향 파일**: `shareRewardService.ts`, `process-referral/index.ts`, `get-share-reward-status/index.ts`, `ShareRewardModal.tsx`, `ShareRewardInfoPage.tsx`

---

## 2026-03-03 ProfilePage 사주 캐시 검증 강화

**결정**: `hasValidCache` 판단 시 `saju_cache_checked` 플래그만으로 API 스킵 불가 → `primary_saju` 실제 존재 필수
**이유**: `primary_saju`를 삭제하는 경로가 10곳 이상(AlimtalkInfoInputPage, PaymentNew, SajuManagement 등)인데, 모든 곳에서 `saju_cache_checked`도 함께 삭제하도록 보장 불가. 플래그만 남으면 "사주 정보가 아직 없어요" 오표시
**변경**: `hasValidCache = cachedUser && (cachedSaju || sajuCacheChecked)` → `hasValidCache = cachedUser && cachedSaju`
**영향 파일**: `ProfilePage.tsx`, `AlimtalkInfoInputPage.tsx` (saju_cache_checked 삭제 추가), `SajuSelectPage.tsx` (전화번호 리다이렉트 전 primary_saju 캐시 설정)

---

## 2026-03-03 새싹 초기 지급량 단일 소스 (Column DEFAULT)

**결정**: `sprout_balance` 초기값을 DB Column DEFAULT 한 곳에서만 관리
**이유**: Edge Function(`users/index.ts`), `handle_new_user` 트리거, Column DEFAULT 3곳에 분산 → 값 불일치 발생 (스테이징에서 트리거 누락 + DEFAULT=20이라 20개 지급되는 버그)
**변경**: Edge Function과 트리거에서 `sprout_balance` 하드코딩 제거. 변경 시 `ALTER TABLE users ALTER COLUMN sprout_balance SET DEFAULT X;` 한 줄만 실행
**영향 파일**: `supabase/functions/users/index.ts`, `schema_dump.sql`

---

## 2026-03-03 새싹 충전소 모바일 결제 리다이렉트 지원

**결정**: `SproutChargingStation`에 `m_redirect_url` + App.tsx 리다이렉트 감지 추가
**이유**: 모바일에서 PortOne 결제 시 PG사 페이지로 리다이렉트됨. `m_redirect_url` 미설정 시 결제 후 복귀 불가 → "결제가 취소되었습니다" 오류. `PaymentNew.tsx`에는 이미 있었으나 `SproutChargingStation`에 누락
**구현**: URL params(`imp_uid`, `merchant_uid`, `packageId`)로 리다이렉트 감지 → `redirectPayment` prop으로 SproutChargingStation에 전달 → 자동 충전 처리
**영향 파일**: `SproutChargingStation.tsx`, `App.tsx`

---

## 2026-02-26 새싹(Sprout) 포인트 시스템 도입

**결정**: 콘텐츠별 직접 결제(KRW) → 새싹 포인트 기반 시스템으로 전환
**이유**: 소액 결제 반복 PG 수수료 부담 감소 (묶음 충전), 잔액으로 즉시 이용 가능, 보너스 새싹으로 대량 충전 유도 → ARPU 증가
**구현**: 신규 가입 20새싹, 유료 콘텐츠 30새싹, 충전 패키지 3종 (40/130/410새싹). DB: `users.sprout_balance`, `sprout_transactions`, `sprout_packages`. PG 함수 `process_sprout_charge`/`process_sprout_deduct` (SELECT FOR UPDATE 동시성 보호). Edge Functions: `sprout-charge`, `sprout-deduct`
**영향 파일**: `MasterContentDetailPage.tsx`, `SproutChargingStation.tsx`, `ProfilePage.tsx`, `App.tsx`, `TermsOfServicePage.tsx`

---

## 2026-02-25 초개인화 시스템 리팩토링 - 커버리지 확장 + 심리 상태 통합

**결정**: 초개인화 발동 조건을 "태그 1개+"에서 "태그 1개+ OR 최근 1주 콘텐츠 이용 기록"으로 확장. `user_situation_summaries` 통합 테이블 신설
**이유**: 전체 사용자의 ~30%만 태그를 모으고 있어 70%가 개인화 풀이를 받지 못함. 콘텐츠 이용 내역은 대부분의 사용자가 보유
**구현**: `generate-content-answers`에서 태그+콘텐츠 이용 내역 조회, gpt-4.1-nano로 심리 추출 → `user_situation_summaries` 저장. 주차별 최신 1건만 AI에 전달
**영향 파일**: `supabase/migrations/20260225_create_user_situation_summaries.sql`, `generate-content-answers`, `generate-saju-answer`, `generate-tarot-answer`, `generate-weekly-report`

---

### AI 개인화 구매 가이드 (generate-purchase-guide)

**결정**: 유료 상세 페이지에 gpt-4.1-nano 기반 AI 개인화 benefit 메시지 2줄 표시
**이유**: 무료→유료 랜딩 유저의 구매 전환 향상. 나다움 태그(기질/성향) 기반 맞춤 후킹 멘트 생성
**구현**: `trait_tags_cache`로 태그 유무 동기 판단 (없으면 스킵), localStorage 24시간 캐시, 콘텐츠 로드와 병렬 실행, `?from=free` 파라미터로 전환 추적
**영향 파일**: `MasterContentDetailPage.tsx`, `FreeSajuDetail.tsx`, `FreeContentResult.tsx`, 배포 스크립트

---

## 2026-02-24 MyReportList 보고서 생성 플로우 개선

**결정**: 보고서 생성 상태(generating/completed) sessionStorage 영속화 + 10초 폴링. 현재 주차 보고서 존재 시 안내 화면 상시 노출
**이유**: 탭 전환 시 React 상태 초기화 → 생성 중인데도 "보고서 먼저 받기" 버튼 노출 버그
**영향 파일**: `src/components/MyReportList.tsx`

---

### 미션성공쿠폰 추가 및 쿠폰 발급 프로세스 변경

**결정**: `coupons` 테이블에 `mission` 타입 쿠폰 추가, 태그 5개 이상 수집 시만 미션 쿠폰 발급. 재방문 쿠폰 로직 완전 제거
**이유**: 미션 달성 기반 보상으로 태그 수집 유도
**영향 파일**: `src/App.tsx`, `src/components/CompletionCoupon.tsx`, `supabase/functions/issue-revisit-coupon/`

---

## 2026-02-20 만세력 페이지 추가

**결정**: 프로필에서 본인 사주 기반 만세력(원국, 분석, 대운, 세운) 확인 기능 추가
**이유**: 사주 기반 만세력 열람 기능 요청
**구현**: `get-manse-data` Edge Function (3회 재시도+exponential backoff). localStorage fingerprint 기반 캐싱 (만료 없음). 비로그인 접근 허용 (로그인/사주 등록 유도 UI). Radix UI Accordion + Tailwind v4 호환
**영향 파일**: `supabase/functions/get-manse-data/`, `src/lib/manseService.ts`, `src/components/MansePage.tsx`, `src/App.tsx`, `src/components/ProfilePage.tsx`

---

## 2026-02-15 스테이징/프로덕션 주간 보고서 일정 분리 (WEEK_START_DAY)

**결정**: `WEEK_START_DAY` 환경변수 도입 (프로덕션: 0=일요일, 스테이징: 3=수요일). `SITE_URL` 환경변수로 스테이징의 프로덕션 URL 발송 방지
**이유**: 프로덕션/스테이징 로그 혼재 및 스테이징에서 프로덕션 URL 알림톡 발송 사고 발생
**추가**: `get-failed-reports` KST→UTC 타임존 변환 누락 수정. `deploy-staging.bat` 6개 함수에 `--no-verify-jwt` 누락 추가
**영향 파일**: `generate-weekly-reports-batch`, `generate-weekly-report`, `send-alimtalk`, `send-report-alimtalk`, `get-failed-reports`

---

## 2026-02-13 마스터 콘텐츠 질문 수정 FK constraint 우회

**결정**: DELETE-INSERT → UPDATE + INSERT + soft-handle DELETE 방식으로 변경
**이유**: `order_results.question_id → master_content_questions.id` FK constraint(23503)로 DELETE 실패. 기존 질문 row `id` 유지한 채 `question_text`, `question_type`, `question_order`만 UPDATE
**추가**: `originalQuestions` shallow copy → deep copy 변경 (변경 감지 항상 false 버그 수정)
**영향 파일**: `MasterContentDetail.tsx`

---

### 이용기록 제목 스냅샷 보존

**결정**: 콘텐츠 제목 변경 시 과거 이용기록이 새 제목으로 표시되는 문제 해결
**이유**: 유료 `orders.gname` 우선 표시 + 무료 `free_content_records.content_title` 컬럼 추가
**영향 파일**: `PurchaseHistoryPage.tsx`, `generate-free-preview`, `free_content_records` 테이블

---

### 모바일 PG 결제 뒤로가기 루프 해결 (popup 모드 전환)

**결정**: 모바일 결제 시 PortOne SDK의 redirect → `popup: true` (새 탭) 모드로 전환
**이유**: iOS Safari에서 다날 카드결제 후 뒤로가기 시 PG 중간 페이지 무한 루프. redirect 모드는 외부 PG 도메인이 히스토리에 쌓여 제어 불가
**핵심 교훈**: 모바일 redirect 모드는 외부 도메인 히스토리 오염이 불가피. popup 모드는 iOS Safari/Chrome 모두 새 탭으로 열림. sessionStorage/history 조작은 같은 오리진 내에서만 유효
**영향 파일**: `PaymentNew.tsx`, `App.tsx`, `PaymentComplete.tsx`, `index.html`

---

## 2026-02-12 IndexNow 프로토콜 도입

**결정**: IndexNow Edge Function 생성하여 콘텐츠 배포/업데이트 시 검색엔진에 즉시 URL 제출
**이유**: 네이버 220+ 페이지 중 12개만 색인. 기존 사이트맵/수동 요청은 수일~수주 소요
**제한**: 구글은 IndexNow 미지원 → Google Search Console 별도 필요
**영향 파일**: `supabase/functions/index-now/`, `public/e32ae15605104f698d20fde140bc8e83.txt`

---

### generate-content-answers Self-Continue 패턴 도입

**결정**: Edge Function이 request timeout(150초) 도달 전 120초에 안전 종료 후 자기 재호출 (최대 5회)
**이유**: 유료 콘텐츠(10개 질문) AI 생성 시 ~165초에 shutdown. **Supabase Pro Plan의 400초는 wall clock이지 request timeout이 아님** — HTTP 응답은 150초 안에 보내야 함
**구현**: DB에 중간 결과 저장 + 재호출 시 완료된 질문 자동 스킵 (idempotent). 기존 선례: `generate-weekly-reports-batch` 동일 패턴
**영향 파일**: `supabase/functions/generate-content-answers/index.ts`

---

### CSP 결제 장애 해결 (3주간 매출 손실)

**결정**: `vercel.json` CSP 헤더에 누락된 결제 도메인 2개 추가
**이유**: 2026-01-21 CSP 도입 시 `frame-src`에 `*.teledit.com` (다날), `form-action`에 `*.kakaopay.com` (카카오페이 모바일) 누락 → 1월 21일부터 약 3주간 일부 결제 차단
**핵심 교훈**: 결제 장애 시 브라우저 콘솔의 CSP 에러 메시지를 가장 먼저 확인. CSP 도입 시 PG사 서브도메인/파트너 도메인까지 파악 필요
**영향 파일**: `vercel.json`

---

## 2026-02-11 MyReportList → 홈 이동 시 히스토리 잔류 버그

**결정**: MyReportList에서 홈으로 이동하는 3곳 모두 `navigate('/', { replace: true })` 적용
**이유**: 플로우 내부만 `replace: true`로 처리하고 마지막 탈출 지점을 놓치면 iOS 스와이프 뒤로가기 시 히스토리에 잔류
**영향 파일**: `src/components/MyReportList.tsx`

---

### Google OAuth를 팝업(새 탭) 모드로 전환

**결정**: Google OAuth를 redirect → 팝업(새 탭) 방식으로 전환
**이유**: Google OAuth redirect 모드는 브라우저 히스토리에 제거 불가능한 엔트리 3~4개 추가 → iOS 스와이프 뒤로가기 시 Google 로그인 페이지로 이동. 카카오 로그인은 이미 팝업 기반이라 문제 없었음
**구현**: `window.open('about:blank')` 동기 호출 → OAuth URL 비동기 획득 → 새 탭에서 플로우 → localStorage 신호 → `window.close()`. fallback(redirect) 경로 유지
**영향 파일**: `src/lib/auth.ts`, `src/pages/AuthCallback.tsx`, `src/components/LoginPageNew.tsx`, `src/components/ExistingAccountPageNew.tsx`

---

## 2026-02-10 직접 URL 진입 시 뒤로가기/홈 버튼 (2중 방어 구조)

**결정**: `DirectEntryHistoryGuard` + `useGoBack` 훅의 2중 방어 구조
**이유**: SPA에서 직접 URL 진입 시 `navigate(-1)`은 앱 밖으로 나감. `history.length`는 전체 탭 히스토리라 신뢰 불가
**구현**: 1차: 앱 초기화 시 현재 경로가 `/`가 아니면 히스토리에 홈 삽입 (sessionStorage 1회). 2차: `location.state.canGoBack` 플래그 기반 분기
**영향 파일**: `src/App.tsx`, `src/hooks/useIOSSafeNavigate.ts`, `src/components/FreeContentDetailComponents.tsx`, `src/components/MasterContentDetailPage.tsx`

---

### 재방문 고객 통계를 visit_dates 기반으로 전환

**결정**: `last_login_at` → `visit_dates` (date[] 배열) 기반으로 변경
**이유**: `last_login_at`은 마지막 방문 1개만 기록 → 기간 필터 시 중간 방문 데이터 누락
**추가**: ISO 문자열 `.substring(0,10)` UTC 날짜 추출 → `toLocalDateStr()` KST 변환 적용
**영향 파일**: `src/lib/statsService.ts`

---

### 가입축하쿠폰 할인 금액 인상

**결정**: 3,000원 → 5,000원으로 인상
**영향 파일**: `coupons` 테이블, `issue-welcome-coupon` Edge Function

---

### 프로필 폰번호 바텀시트 1회 제한

**결정**: 프로필 → "나의 분석 보고서" 탭 클릭 시 폰번호 입력 바텀시트를 최초 1회만 표시
**이유**: 번호 입력을 원하지 않는 사용자가 매번 팝업 닫는 불편 해소
**영향 파일**: `src/components/ProfilePage.tsx`

---

### CompletionCoupon 하단 버튼 iOS Chrome 고정

**결정**: `sticky`/`fixed` → flex 레이아웃 (`shrink-0` + `flex-1 min-h-0`) + `height: 100dvh`
**이유**: iOS Chrome에서 `overflow-hidden` + `transform` 조합 시 `sticky`/`fixed` 작동 안 함
**영향 파일**: `src/components/CompletionCoupon.tsx`

---

## 2026-02-09 rejected_tags 태그 제외 시스템

**결정**: 사용자가 미선택한 태그를 `users.rejected_tags`에 누적 저장, AI가 해당 태그 제외
**이유**: 사용자가 반복적으로 같은 태그를 거부하는 패턴 → 사용자 경험 저하
**영향 파일**: `CheckRecordMe.tsx`, `UnifiedResultPage.tsx`, `App.tsx`, `supabase/functions/extract-trait-tags/`

---

### last_login_at 갱신 로직 통합 (HomePage → App.tsx)

**결정**: `last_login_at` + `visit_count` 갱신을 HomePage에서 App.tsx `recordTodayVisit()`로 이동
**이유**: 사용자가 HomePage를 거치지 않고 직접 접근 시 `last_login_at` 미갱신 → `contentUsageRate` 100% 초과
**영향 파일**: `src/lib/auth.ts`, `src/pages/HomePage.tsx`, `src/lib/statsService.ts`

---

### anonymous_free_views INSERT 방식 전환

**결정**: upsert → INSERT 변경, UNIQUE 제약 제거. 같은 콘텐츠 재조회도 매번 카운트
**영향 파일**: `supabase/functions/generate-free-preview/`, `anonymous_free_views` 테이블

---

### 배치 selfContinue 패턴 + shutdown 대응

**결정**: 배치 함수 maxExecutionMs 60초 + selfContinue 자기 재호출 (fire-and-forget)
**이유**: 클라이언트 while 루프 → 브라우저 타임아웃/shutdown. Supabase 120~180초 isolate shutdown. `.single()` 본인 사주 2개 시 400 에러
**구현**: 1회 호출 → 60초간 처리 → 남은 유저로 자기 재호출. 클라이언트는 첫 응답 받고 끝. `.single()` → `.limit(1)` 변경
**영향 파일**: `generate-weekly-reports-batch/`, `generate-weekly-report/`, `MyReportList.tsx`

---

### 유료 콘텐츠 초개인화 프롬프트 (나다움 태그 기반)

**결정**: `generate-saju-answer`, `generate-tarot-answer`에 `personalizationData` 파라미터 추가
**이유**: 나다움 태그를 운세 풀이에 반영하여 개인화 정확도 향상. positive 태그 1개+ 시 적용
**구현**: `generate-content-answers`에서 1회 DB 조회 후 하위 함수에 전달. 최근 4주 태그 + 누적 태그 + 심리 흐름을 프롬프트에 포함. 조회 실패 시 기본 프롬프트 fallback
**영향 파일**: `generate-content-answers/`, `generate-saju-answer/`, `generate-tarot-answer/`

---

### iOS 스와이프: FreeContentDetail 버그 수정

**결정**: `navigate('/')` → `navigate(-1)` + contentId 변경 감지 가드 + bfcache 핸들러
**이유**: `navigate('/')` push mode가 히스토리 스택에 중복 '/' 엔트리를 만들어 iOS 버퍼 시스템과 충돌
**규칙**: 콘텐츠 상세에서 홈으로 돌아갈 때는 반드시 `navigate(-1)`. 에러 fallback은 `navigate('/', { replace: true })`
**영향 파일**: `src/App.tsx`, `src/components/FreeContentDetail.tsx`

---

### iOS 스와이프: 콘텐츠 상세 navigate('/') → navigate(-1) 전환

**결정**: 콘텐츠 상세 페이지의 뒤로가기/홈 버튼에서 `navigate('/')` (push) → `navigate(-1)` 변경
**이유**: push mode로 '/' 중복 추가 → 4~5번째 사이클부터 히스토리 스택 꼬임
**영향 파일**: `src/App.tsx` (3곳), `MasterContentDetailPage.tsx` (10곳), `FreeContentLoading.tsx` (11곳 → replace)

---

## 2026-02-06 비회원 무료 콘텐츠 일일 제한 (2중 검증)

**결정**: 클라이언트(localStorage) + 서버(IP+UA SHA-256 fingerprint) 2중 검증으로 비회원 하루 3개 제한
**이유**: 비회원 무제한 이용 → AI API 비용 증가. localStorage만으로는 우회 가능
**구현**: 1차: `FreeContentDetail.tsx` → `hasReachedLocalLimit()` → `LoginBottomSheet`. 2차: `generate-free-preview` → fingerprint → `anonymous_free_views` 테이블 조회. 검증 실패 시 서비스 계속 (가용성 우선). 로그인 사용자 무제한
**자동 정리**: pg_cron 매일 KST 09:00에 전날 이전 데이터 삭제
**영향 파일**: `src/lib/freeContentLimitService.ts`, `src/components/LoginBottomSheet.tsx`, `generate-free-preview/`, `FreeContentDetail.tsx`, `FreeContentLoading.tsx`

---

## 2026-02-04 통계 대시보드 계산 로직 통일 (개요 ↔ 추세)

**결정**: 개요와 추세의 태그 관련 지표 계산 로직 통일. 콘텐츠 건 그룹핑: `user_id + source_type + created_at(초 단위)`
**이유**: 같은 날짜 조회해도 개요/추세에서 수치가 다르게 표시 (개요: 콘텐츠 건 기준 vs 추세: 개별 태그 기준)
**영향 파일**: `src/lib/statsService.ts`, `src/components/StatsDashboard.tsx`

---

### 추세 기간별 집계 단위

**결정**: 7일/30일=일별, 90일=주별, 1년=월별 자동 변경
**영향 파일**: `src/lib/statsService.ts`, `src/components/StatsDashboard.tsx`

---

## 2026-02-03 주간 보고서 자동 발송 시스템 (pg_cron + pg_net)

**결정**: Supabase pg_cron + pg_net으로 주간 보고서 자동 발송
**구현**: pg_cron 매주 일요일 12:00 KST 10분 간격 → pg_net.http_post → `generate-weekly-reports-batch` (concurrency 3, 2초 간격, 60초 제한 + selfContinue) → `generate-weekly-report` (GPT-5.1) → `send-report-alimtalk`
**핵심**: Vault에 service_role_key 저장. 이어하기 패턴 (기존 보고서 있는 유저 자동 스킵). forceRegenerate 옵션
**영향 파일**: `generate-weekly-report/`, `generate-weekly-reports-batch/`, `send-report-alimtalk/`, 마이그레이션 SQL

---

### 관리자 패널 설계 (마스터 계정 전용)

**결정**: MyReportList에 마스터 계정 전용 관리자 패널 추가 (주차 선택, 실패 보고서 조회, 재발송)
**이유**: 운영자도 보고서 발송 실패 시 수동 재발송 가능하도록
**영향 파일**: `src/components/MyReportList.tsx`, `supabase/functions/get-failed-reports/`

---

### GPT-5.1 주간 보고서 생성

**결정**: OpenAI GPT-5.1 Responses API로 주간 보고서 생성 (나 다시보기 + 3카드 타로 + 마음 처방 + To-Do List)
**구현**: 최대 6회 시도, 지수 백오프 (2~32초)
**영향 파일**: `supabase/functions/generate-weekly-report/`

---

### 계정 불일치 시 소유자 정보 마스킹 표시

**결정**: 알림톡 링크 접속 시 다른 계정이면 소유자의 마스킹된 이메일/전화번호 표시
**구현**: `get-order-owner`/`get-report-owner` Edge Function → Service Role Key로 RLS 우회 → 이메일 뒤 3글자 마스킹, 전화번호 중간 4자리 마스킹
**영향 파일**: `get-order-owner/`, `get-report-owner/`, `UnifiedResultPage.tsx`, `ReportWeeklyDetail.tsx`

---

## 2026-02-02 통계 대시보드 Google Analytics 통합

**결정**: GA4 Data API로 전체 고객 통계 + Supabase 회원가입 고객 통계를 함께 표시
**이유**: 비로그인 방문자 수/전체 트래픽 파악 불가
**주의**: GA API endDate는 inclusive, Supabase `.lt()`는 exclusive. 프리셋은 오늘 제외
**영향 파일**: `get-ga-stats` Edge Function, `StatsDashboard.tsx`, `statsService.ts`

---

### 태그 확인율 콘텐츠 건 기준 계산

**결정**: 태그 개수 기준 → 콘텐츠 이용 건 기준으로 변경 (`user_id + source_type + created_at(초 단위)` 그룹핑)
**영향 파일**: `statsService.ts`

---

### 나다움 보고서 (주간 보고서) 아키텍처

**결정**: 다단계 플로우 (보고서 상세 → 타로 → 마음챙김 → 응원글 → 쿠폰)
**구현**: DB 3개 테이블 (`weekly_reports`, `weekly_report_sections`, `report_tarot_selections`). `user_viewed` 플래그로 타로 1회 제한. 응원글 저장 시 `my_report_cache` 즉시 삭제. 응원글 존재 시 쿠폰 페이지 스킵
**영향 파일**: 주간 보고서 컴포넌트 9개, DB 3개 테이블

---

## 2026-01-30 회원가입 후 사주 정보/태그 저장 플로우 개선

**결정**: `clearUserCaches()`에서 `pending_trait_tags` 있으면 `cached_saju_info` 보존
**이유**: 로그아웃 → 무료 콘텐츠 → 회원가입 시 `clearUserCaches()`가 `cached_saju_info` 삭제 → `PendingTagsCheck` 사주 저장 실패
**영향 파일**: `src/lib/auth.ts`

---

### 무료 콘텐츠 answers 필드 포맷 개선

**결정**: `PendingTagsCheck`에서 저장하는 `answers` JSONB에 `question_id`, `question_order` 필드 포함
**이유**: `PurchaseHistoryPage`가 해당 필드로 정렬/표시하는데 없어서 빈 화면 표시
**영향 파일**: `src/App.tsx` (PendingTagsCheck), `src/components/PurchaseHistoryPage.tsx`

---

### 유료 콘텐츠 나다움 스킵 상태 처리

**결정**: `UnifiedResultPage`에서 DB 조회로 `__SKIPPED__` 태그 또는 `is_confirmed=true` 감지 → 마지막 질문 버튼을 "완료"로 표시
**이유**: "다음에 할래요" 클릭 후 재진입 시 "다음" 대신 "완료" 표시 필요
**영향 파일**: `UnifiedResultPage.tsx`

---

### 로그아웃 사용자 태그 저장 플로우 개선

**결정**: phone_number 바텀시트 대신 로그인 페이지로 리다이렉트, 로그인 후 자동 저장
**이유**: 로그아웃 사용자의 태그/무료콘텐츠 결과가 손실됨
**구현**: `pending_trait_tags` + `redirectAfterLogin` → PendingTagsCheckPage에서 사주/콘텐츠/태그 저장
**영향 파일**: `App.tsx`, `CheckRecordMe.tsx`, `PurchaseHistoryPage.tsx`

---

### 프로덕션 배포 시 "Invalid JWT" 에러 재발 및 배포 스크립트 작성

**결정**: Edge Functions 배포 스크립트 작성하여 `--no-verify-jwt` 플래그 누락 방지
**이유**: 수동 배포 시 `--no-verify-jwt` 누락으로 프로덕션에서 매번 401 에러 반복
**구현**: `scripts/deploy-production.bat`, `deploy-staging.bat`, `deploy-core.bat`. npm scripts `deploy:prod`, `deploy:staging`, `deploy:core`
**영향 파일**: `scripts/`, `package.json`

---

## 2026-01-29 무료/유료 콘텐츠 나다움 태그 통합 플로우

**결정**: 무료/유료 콘텐츠 모두 동일한 나다움 태그 추출 및 저장 플로우 적용
**구현**: 백그라운드 `extract-trait-tags` 호출 → 추출 완료 여부에 따라 분기 → `CheckRecordMe`에서 태그 선택/저장. 유료 콘텐츠 `from=purchase` (다시보기)면 태그 추출 스킵
**영향 파일**: `UnifiedResultPage.tsx`, `App.tsx`, `CheckRecordMe.tsx`, `extract-trait-tags/`, `save-trait-tags/`

---

### 무료 콘텐츠 결과 페이지 이중 로딩 수정

**결정**: App.tsx에서 이미 로드한 DB 데이터를 FreeSajuDetail에 `dbData` prop으로 직접 전달
**이유**: "나다움 기록하기 → 뒤로가기" 시 로딩 2번 표시 (동일 데이터 재조회)
**영향 파일**: `src/App.tsx`, `src/components/FreeSajuDetail.tsx`

---

## 2026-01-28 무료 콘텐츠 DB 저장 구조 도입

**결정**: 로그인 사용자의 무료 콘텐츠 이용 기록을 `free_content_records` 테이블에 저장
**이유**: 기존 localStorage만 → "운세 기록" 페이지에서 조회 불가
**구현**: Edge Function에서 로그인 사용자면 INSERT + record_id 반환. `fromDB` 플래그로 DB/localStorage 분기
**영향 파일**: 마이그레이션 SQL, `generate-free-preview/`, `FreeContentLoading.tsx`, `FreeSajuDetail.tsx`, `PurchaseHistoryPage.tsx`

---

## 2026-01-26 UnifiedResultPage URL.revokeObjectURL() 완전 제거

**결정**: `UnifiedResultPage.tsx`에서 모든 `URL.revokeObjectURL()` 제거, Blob URL 생명주기를 `blobUrlCache`에서 전역 관리
**이유**: React 비동기 상태 업데이트 타이밍으로 revoke 후 아직 렌더링 중인 URL이 무효화됨
**영향 파일**: `src/components/UnifiedResultPage.tsx`

---

### TarotShufflePage "선택 완료" 즉시 네비게이션

**결정**: 카드 선택 후 DB 업데이트를 기다리지 않고 즉시 결과 페이지로 이동
**이유**: Supabase 쿼리 ~400ms 완료 대기 → 0ms 체감으로 개선
**영향 파일**: `src/components/TarotShufflePage.tsx`

---

### Edge Function Cold Start 방지 Warm-up

**결정**: 앱 로드 시 `/users` Edge Function에 OPTIONS preflight 요청으로 Cold Start 방지
**이유**: 프로덕션에서 카카오 로그인 시 3초+ 지연 (Cold Start 원인)
**영향 파일**: `src/App.tsx`

---

## 2026-01-23 generate-content-answers 배치 → 병렬 처리 롤백

**결정**: GPT-5.1 모든 질문 한 번에 전달 (배치) → 질문별 개별 API 호출 (병렬)로 롤백
**이유**: 배치 버전에서 500 에러, 응답 품질 저하, 사용자 무한 로딩 발생
**영향 파일**: `supabase/functions/generate-content-answers/`

---

## 2026-01-22 동적 Sitemap 자동 생성 (Edge Function)

**결정**: 정적 sitemap.xml 대신 `generate-sitemap` Edge Function으로 동적 생성
**이유**: 콘텐츠 자주 추가/수정되므로 정적 파일 관리 비효율
**구현**: DB에서 deployed 콘텐츠 조회 → XML 생성 (유료 priority 0.9, 무료 0.8). Vercel rewrite + 1시간 캐싱. `--no-verify-jwt` 필수
**영향 파일**: `supabase/functions/generate-sitemap/`, `vercel.json`, `MasterContentList.tsx`

---

## 2026-01-21 타로 셔플 배경 이미지 CSP 오류 수정

**결정**: 모든 이미지를 로컬 `/public` 폴더에 저장하고 절대 경로로 참조
**이유**: 외부 URL (`postimg.cc`) → CSP 위반으로 이미지 차단
**규칙**: 모든 이미지는 `/public`에 저장. 외부 이미지 URL 사용 금지. Supabase Storage, 카카오 CDN은 허용
**영향 파일**: `TarotGame.tsx`, `LoadingPage.tsx`

---

### 타로 셔플 모바일 전체 화면 배경 최적화

**결정**: iOS Safari 주소창 아래까지 배경 이미지 표시 + 데스크톱 440px 프레임 제한
**구현**: 모바일: body 배경 동적 설정 + `theme-color` 변경 + `position: fixed`로 스크롤 차단. 데스크톱: body 흰색, 컴포넌트 내부 배경
**영향 파일**: `TarotGame.tsx`, `TarotShufflePage.tsx`, `index.html`, `App.tsx`

---

## 2026-01-20 HTTP 캐시 전략 수립

**결정**: Vercel 배포 시 리소스 유형별 HTTP 캐시 헤더 적용
**구현**: JS/CSS 번들 (`/assets/*`) 1년 immutable. 이미지 1일 + 1주 stale-while-revalidate. HTML 항상 최신 (max-age=0)
**영향 파일**: `vercel.json`

---

### 콘텐츠 썸네일 Cache API 적용

**결정**: 타로 캐시와 동일한 Cache API 전략 (싱글톤 + 메모리 캐시 + 배치 처리)을 썸네일에 적용
**구현**: 1일 만료 (타로 7일). 메모리 캐시(Map) → Cache API → Network 순서. 배치 최대 6개씩
**영향 파일**: `src/lib/thumbnailCache.ts`, `src/pages/HomePage.tsx`

---

### 구매 내역 DB 쿼리 병렬화

**결정**: "운세 보기" 클릭 시 2개 DB 쿼리를 순차 → `Promise.all` 병렬 실행. `select('id')` → `{ count: 'exact', head: true }` 최적화
**이유**: 400-1000ms → 150-400ms (62.5% 개선)
**영향 파일**: `src/components/PurchaseHistoryPage.tsx`

---

### 타로 캐시 성능 최적화

**결정**: 구매 내역 타로 이미지 프리로드 1-6초 → 0.3-0.8초 (75% 개선)
**구현**: 싱글톤 Cache 인스턴스 (132회 → 1회), 메모리 캐시 Map (99.9% 빠른 조회), 배치 처리 (6개씩), 프리로드 132개 → 10개로 제한
**영향 파일**: `src/lib/tarotImageCache.ts`, `src/components/PurchaseHistoryPage.tsx`

---

## 2026-01-19 타로 카드 이미지 로딩 실패 해결 (모바일 최적화)

**결정**: `getCachedTarotImage()` Blob URL 대신 실제 Storage URL 반환
**이유**: 모바일 브라우저 메모리 관리로 Blob URL 무효화 + React 리렌더링 타이밍 충돌
**영향 파일**: `src/lib/tarotImageCache.ts`

---

### 타로 카드 캐시 공란 이슈 히스토리 (최종 해결)

**결정**: `currentResult`를 `useMemo`로 래핑 (객체 참조 안정화) + 3단계 재시도 로직 (캐시 재시도 → Storage URL 폴백 → 에러 표시)
**이유**: `allResults.find()` 매 렌더링 새 참조 → useEffect 불필요 재실행. 빠른 전환 시 `currentResult` 일시적 undefined
**핵심 교훈**: React useEffect 객체 dependency는 참조 변경 시 재실행 → useMemo 필수. 복잡한 생명주기 관리보다 재시도 로직이 더 안정적
**영향 파일**: `src/lib/tarotImageCache.ts`, `src/components/UnifiedResultPage.tsx`

---

### 사주 정보 카드 구분자 SVG → CSS div

**결정**: SajuCard/SajuManagementPage 구분자를 SVG → CSS div (inline style `width: '1px'`)로 변경
**이유**: Tailwind v4 arbitrary value + 모바일 고해상도 디스플레이에서 렌더링 불일치
**영향 파일**: `SajuCard.tsx`, `SajuManagementPage.tsx`

---

### UnifiedResultPage AnimatePresence 제거

**결정**: Framer Motion `AnimatePresence`/`motion.div` 제거 → 일반 `div`
**이유**: 모바일 터치 스크롤 완전 불가 (AnimatePresence가 터치 이벤트 가로챔)
**영향 파일**: `src/components/UnifiedResultPage.tsx`

---

### ResultCompletePage iOS Safari 스크롤 바운스 수정

**결정**: `relative min-h-screen` → `fixed inset-0` + `flex-col` 레이아웃 패턴
**이유**: iOS Safari `overscrollBehaviorY: 'none'`만으로는 바운스 완전 제거 불가
**영향 파일**: `src/components/ResultCompletePage.tsx`

---

## 2026-01-17 order_results tarot_card_id 컬럼 제거

**결정**: 미사용 `tarot_card_id` 컬럼 제거. `tarot_card_name`만 사용
**영향 파일**: `order_results` 테이블

---

### 사주 정보 선택 페이지: 캐시 기반 즉시 렌더링

**결정**: `saju_records_cache` localStorage 캐시 활용하여 API 호출 없이 즉시 렌더링
**이유**: 0원 결제 후 사주 선택 이동 시 불필요한 로딩 (~200ms API 호출)
**구현**: PaymentNew에서 캐시 확인 → 있으면 로딩 스킵. App.tsx onPurchase에서 캐시 우선 → API fallback
**영향 파일**: `PaymentNew.tsx`, `App.tsx`, `FreeSajuSelectPage.tsx`, `SajuSelectPage.tsx`

---

### 타로 카드 선택: 백엔드 사전 선택 vs 프론트엔드 UI 연출 분리

**결정**: 타로 카드를 **백엔드에서 사전 선택** (LoadingPage 시점 AI 해석 완료) + **프론트엔드 UI 연출** (TarotGame 21장 더미 카드 애니메이션)으로 분리
**이유**: "사용자는 카드를 선택한다고 느끼지만 실제로는 이미 결정되어 있다" → 기다림 없이 즉시 결과 확인 + 카드 선택 재미
**영향 파일**: `/lib/tarotCards.ts`, `TarotShufflePage.tsx`, `TarotGame.tsx`, `generate-content-answers/`

---

## 2026-01-16 타로 카드 이름 일관성 버그 수정

**결정**: `generate-content-answers`에서 타로 풀이 생성 시 `order_results.tarot_card_name` (사용자 선택 카드) 우선 사용
**이유**: `master_content_questions.tarot_cards`가 null → AI 랜덤 선택 → 타이틀과 내용 카드명 불일치
**영향 파일**: `supabase/functions/generate-content-answers/`

---

### Tailwind CSS v4 Arbitrary Value 제한

**결정**: Tailwind v4에서 arbitrary value 미작동 시 inline style 사용 허용
**근본 원인**: `globals.css` base typography 스타일과 Tailwind 클래스 간 CSS 우선순위 충돌 (Tailwind v4 자체 문제가 아님)
**규칙**: 타이포그래피/색상은 반드시 inline style. 레이아웃(flex, grid)은 Tailwind OK. 1순위: CSS 변수 → Tailwind 토큰. 2순위: inline style
**영향 파일**: `ProfilePage.tsx`, `NadaumRecordPage.tsx`, `DuckIllustration.tsx`, `CLAUDE.md`

---

### FigmaMake 통합 시 스타일 충돌 해결

**결정**: FigmaMake 생성 코드 통합 시 타이포그래피/색상은 반드시 inline style로 변환
**이유**: FigmaMake 코드가 `text-[15px]`, `font-medium` 등 Tailwind arbitrary value 사용 → `globals.css` base 스타일에 덮어씌워짐
**규칙**: `text-[*]`, `font-[*]`, `leading-[*]`, `bg-[#...]` → inline style. 레이아웃은 Tailwind OK
**영향 파일**: `NadaumRecordPage.tsx`, `DuckIllustration.tsx`, `nadaum-svg-paths.ts`

---

### 나다운 태그 Feature Flag (DEV)

**결정**: 나다운 태그 섹션을 `DEV` 플래그로 감싸 프로덕션에서 숨김
**영향 파일**: `src/components/ProfilePage.tsx`

---

### 결제 오버레이 감지: 보이는 요소만 감지

**결정**: `display: none`/`visibility: hidden` iframe/div를 무시하도록 개선
**이유**: 카카오페이 숨겨진 본인인증 iframe이 결제 오버레이로 감지 → 무한 로딩
**구현**: `offsetParent !== null` + `display !== 'none'` + `visibility !== 'hidden'` 3단계 체크
**영향 파일**: `src/components/PaymentNew.tsx`

---

### 0원 결제 시 로딩 UX 개선

**결정**: 0원 결제 시 "결제 페이지로 이동중" 로딩 없이 바로 주문 처리
**영향 파일**: `src/components/PaymentNew.tsx`

---

## 2026-01-14 generate-free-preview 사주 API 연동

**결정**: 무료 콘텐츠에도 유료와 동일하게 Stargio 사주 API 호출하여 상세 사주 데이터를 프롬프트에 포함
**이유**: 무료 콘텐츠 품질 고도화. 폴백: API 실패 시 기본 정보만 사용 (graceful degradation)
**영향 파일**: `supabase/functions/generate-free-preview/`

---

## 2026-01-13 Gemini 생성 이미지 WebP 변환

**결정**: Gemini API PNG → WebP 변환 (ImageMagick WASM, 품질 85)
**이유**: 평균 40-50% 파일 크기 감소. 폴백: 변환 실패 시 원본 PNG 저장
**영향 파일**: `supabase/functions/generate-thumbnail/`

---

### Edge Function 간 호출 시 --no-verify-jwt

**결정**: 내부 호출 Edge Function은 `--no-verify-jwt`로 배포
**이유**: Service Role Key는 JWT가 아니므로 Supabase 인프라 레벨에서 JWT 검증 실패
**안전성**: 내부 호출은 Supabase 인프라 내부에서만 발생. Service Role Key는 Secret으로 관리
**영향 파일**: `generate-saju-answer`, `generate-tarot-answer`, `generate-content-answers`, `send-alimtalk`

---

### JWT 설정 변경 후 Edge Functions 재배포 필요

**결정**: JWT 만료 시간 변경 (1시간 → 7일) 시 모든 Edge Functions 재배포 필수
**이유**: Edge Functions는 빌드 시점의 JWT 설정을 캐싱하므로 설정 변경만으로는 즉시 반영 안 됨

---

### 사주 API 서버 직접 호출: SAJU_API_KEY

**결정**: 프론트엔드 → Edge Function(서버)에서 사주 API 호출. `SAJU_API_KEY` 환경변수 + 브라우저 헤더 흉내 + 3회 재시도
**이유**: API 키 인증 요구 → 프론트엔드에서 호출 시 키 노출 위험
**영향 파일**: `generate-content-answers/`, `BirthInfoInput.tsx`, `SajuSelectPage.tsx`

---

### Storage 썸네일 삭제: RLS SELECT + DELETE 정책

**결정**: `storage.objects`에 SELECT + DELETE 정책 모두 추가
**이유**: Supabase Storage DELETE 작업에 SELECT 정책도 필요 (파일 조회 후 삭제). `remove()` 응답 `[]` = 권한 문제
**영향 파일**: `MasterContentDetail.tsx`, Storage RLS

---

### 썸네일 이미지 캐시 버스팅: imageCacheBuster

**결정**: 썸네일 재생성 시 `?v=${Date.now()}` 쿼리 파라미터로 브라우저 캐시 무효화
**영향 파일**: `MasterContentDetail.tsx`, `MasterContentList.tsx`

---

### iOS 스와이프: FreeSajuDetail 결과 페이지 네비게이션

**결정**: X 버튼 = 홈으로. 시스템 뒤로가기(popstate) = 콘텐츠 상세로. bfcache(pageshow) = 콘텐츠 상세로
**이유**: 시스템 뒤로가기 시 로딩 페이지로 이동하는 버그
**영향 파일**: `src/App.tsx`, `src/components/FreeSajuDetail.tsx`

---

### iOS 홈페이지 무한 스와이프 (동적 버퍼 재충전)

**결정**: pushState 특성 (현재 위치 뒤 엔트리 삭제) 활용하여 히스토리 5~7 범위 유지하며 무한 스와이프 지원
**이유**: 기존: 히스토리 무한 증가 → 앱 종료. 고정 버퍼 3개 → 6회 후 소진
**구현**: 버퍼 5개 초기화 + popstate 핸들러에서 절반 이하 소진 시 재충전. 홈 상태 도달 시 전체 재생성
**영향 파일**: `src/pages/HomePage.tsx`

---

## 2026-01-12 iOS 첫 번째 클릭 이벤트 누락

**결정**: 하단 고정 CTA 버튼에 `pointer-events-auto` 명시 + 스크롤 컨테이너 하단 패딩/높이 제한
**이유**: iOS Safari 터치 이벤트가 스크롤 컨테이너 레이어에 먼저 등록. z-index만으로는 터치 이벤트 우선순위 보장 안 됨
**영향 파일**: `PaymentNew.tsx`, `MasterContentDetailPage.tsx`, `FreeContentDetail.tsx` 등 fixed bottom 버튼 페이지

---

## 2026-01-11 로그인 직후 프로필 강제 리로드

**결정**: `show_login_toast`와 `force_profile_reload` 별도 플래그로 분리
**이유**: `show_login_toast`가 HomePage에서 즉시 제거되어 ProfilePage 도달 시 플래그 없음 → 캐시 사용 → 사주 정보 미표시
**영향 파일**: `AuthCallback.tsx`, `ProfilePage.tsx`, `App.tsx`

---

### iOS 스와이프: 사주 관리 replace: true 적용

**결정**: 사주관리 ↔ 사주추가/수정 간 이동 모두 `replace: true` + popstate 이벤트 제거
**이유**: push 방식으로 히스토리 중복 엔트리 → 스와이프 뒤로가기 시 사주관리로 돌아감
**영향 파일**: `App.tsx`, `SajuManagementPage.tsx`

---

### iOS 스와이프: PaymentNew popstate 제거

**결정**: `pushState` + `popstate` 패턴 제거, bfcache `pageshow` 핸들러만 유지
**이유**: `pushState` + `navigate(replace)` 조합이 히스토리 스택을 예측 불가능하게 만듦
**영향 파일**: `PaymentNew.tsx`

---

### iOS 스와이프: 프로필/사주관리 캐시 기반 렌더링

**결정**: `useState` 초기값으로 localStorage 캐시 동기 로드 + 캐시 있으면 애니메이션 identity transform으로 대체
**이유**: 스와이프 뒤로가기 시 불필요한 리로드 느낌 (애니메이션 재실행, 목록 순서 일시 변경)
**영향 파일**: `ProfilePage.tsx`, `SajuManagementPage.tsx`

---

## 2026-01-07 iOS 스와이프: 회원가입 플로우 히스토리 관리

**결정**: 각 페이지에서 마운트 시 상태 확인 후 적절한 페이지로 리다이렉트
**이유**: Google OAuth 외부 리다이렉트로 히스토리에 여러 항목 생성 → 스와이프 뒤로가기 시 완료된 페이지로 돌아감
**구현**: LoginPage: 로그인 상태면 홈으로. TermsPage: 완료면 홈으로, tempUser 없으면 로그인으로. WelcomeCoupon: 확인했으면 홈으로
**영향 파일**: `App.tsx` (LoginPageNewWrapper, TermsPageWrapper, WelcomeCouponPageWrapper)

---

### Sentry 에러 모니터링 연동

**결정**: Sentry 연동하여 실시간 에러 추적, 사용자 컨텍스트 설정, `tracesSampleRate: 0.1`
**영향 파일**: `src/lib/sentry.ts`, `src/lib/auth.ts`, `src/pages/AuthCallback.tsx`, `src/main.tsx`, `ErrorBoundary.tsx`

---

### 구조화된 로거 도입

**결정**: `console.log` 대신 `logger` 사용 (환경별 로그 레벨, 민감정보 자동 마스킹)
**영향 파일**: `src/lib/logger.ts`

---

### 재시도 로직 (Exponential Backoff)

**결정**: `fetchWithRetry` 함수 (maxRetries: 3, baseDelay: 1000, 4xx 즉시 실패)
**영향 파일**: `src/lib/fetchWithRetry.ts`

---

### 결제 웹훅 (PortOne 서버 콜백)

**결정**: 서버 웹훅으로 결제 상태 확인 (클라이언트만 판단 시 조작 위험)
**영향 파일**: `supabase/functions/payment-webhook/`

---

### 결제 트랜잭션 원자성 보장

**결정**: 주문 생성 + 쿠폰 사용을 PostgreSQL Function `process_payment_complete`로 단일 트랜잭션 처리
**영향 파일**: `supabase/functions/process-payment/`

---

### 환불 처리 기능

**결정**: 포트원 환불 API 연동 + 쿠폰 자동 복원. PostgreSQL Function `process_refund`
**영향 파일**: `supabase/functions/process-refund/`, `orders` 테이블

---

### Kakao OAuth 시크릿 환경변수화

**결정**: 하드코딩 시크릿 → `VITE_KAKAO_AUTH_SECRET` 환경변수
**영향 파일**: `src/lib/auth.ts`

---

## 2026-01-06 Supabase 환경변수 기반 설정

**결정**: 하드코딩된 Project ID/Anon Key → `VITE_SUPABASE_PROJECT_ID`, `VITE_SUPABASE_ANON_KEY` 환경변수
**이유**: Staging/Production 분리. Vercel Preview에서 Production DB 연결 방지
**영향 파일**: `src/utils/supabase/info.tsx`, `src/lib/supabase.ts`, `src/lib/zodiacUtils.ts`

---

### 도메인 기반 환경 감지: /lib/env.ts

**결정**: `import.meta.env.DEV` 대신 도메인 기반 환경 감지 유틸리티
**이유**: Figma Make에서 `import.meta.env.DEV`가 프로덕션 배포 시에도 true
**프로덕션 도메인**: `nadaunse.com`, `www.nadaunse.com`, `nadaunse.figma.site`
**제공 함수**: `DEV`, `isProduction()`, `isDevelopment()`, `isLocalhost()`, `isFigmaSite()`
**영향 파일**: `src/lib/env.ts`

---

### 개발/배포 환경 자동 분리

**결정**: 모든 개발 전용 UI를 `import.meta.env.DEV` 조건으로 감싸기 (Vite 빌드 시 자동 제거)
**영향 파일**: `LoginPageNew.tsx`, `ProfilePage.tsx`, `MasterContentDetailPage.tsx`

---

### iOS Safari transform-gpu

**결정**: `overflow: hidden` + `border-radius` 조합에 `transform-gpu` 클래스 추가
**이유**: iOS Safari 하드웨어 가속 버그로 둥근 모서리 렌더링 실패
**영향 파일**: 모든 `rounded-*` + `overflow-hidden` 조합

---

### 타로 서비스 통합

**결정**: 사주 운세 시스템에 타로 서비스 추가 (통합 운세 플랫폼)
**구현**: Edge Functions 2개 추가, 78장 타로 카드 덱 (`/lib/tarotCards.ts`), TarotGame 5단계 애니메이션
**영향 파일**: `generate-tarot-answer/`, `generate-tarot-preview/`, `TarotShufflePage.tsx`, `TarotGame.tsx`, `tarotCards.ts`

---

## 2025-12-31 목차 바텀시트 더미 데이터 제거

**결정**: `TableOfContentsBottomSheet.tsx`에서 하드코딩 더미 질문 데이터 제거 → DB 조회 결과만 표시
**이유**: AI는 10개 질문 생성, UI는 더미 15개 추가해 25개 표시 버그

---

### 로딩 페이지 이미지 프리로딩 최적화

**결정**: 무료 콘텐츠 추천 섹션에 localStorage 캐시 (5분 TTL) + 우선순위 프리로딩 적용
**이유**: 썸네일 FCP 약 60% 단축
**영향 파일**: `LoadingPage.tsx`, `imagePreloader.ts`

---

## 2025-12-20 스크롤 복원: sessionStorage + useLayoutEffect

**결정**: 브라우저 네이티브 스크롤 복원 비활성화 후 직접 구현
**이유**: React Router v6 렌더링 순서로 자동 복원 미작동
**영향 파일**: `HomePage.tsx`, `scrollRestoreLogger.ts`

---

## 2025-12-19 FreeContentService 싱글톤 클래스

**결정**: 무료 콘텐츠 로직을 싱글톤 클래스로 분리 (로그인/로그아웃 분기, localStorage vs DB)
**영향 파일**: `src/lib/freeContentService.ts`

---

## 2025-12-18 사주 정보 입력: 4개 컴포넌트 분리

**결정**: 용도별 분리 — FreeBirthInfoInput (무료), BirthInfoInput (유료), SajuInputPage (프로필), SajuAddPage (관계)
**이유**: 각 맥락마다 저장 로직이 다름. 중복 코드보다 명확한 책임 분리가 유지보수에 유리

---

### 대표 사주: is_primary 필드

**결정**: `saju_records`에 `is_primary` boolean 추가 (사용자당 1개만 true). Database Trigger로 자동 관리
**영향 파일**: 마이그레이션 SQL, `SajuManagementPage.tsx`

---

### 사주 음력/양력: calendar_type + 띠 자동 계산

**결정**: `calendar_type (solar/lunar)`, `zodiac (띠)` 컬럼 추가. Database Function `calculate_zodiac()`으로 자동 계산
**영향 파일**: `zodiacUtils.ts`, 마이그레이션 SQL

---

## 2025-12-17 쿠폰 시스템: source_order_id vs used_order_id

**결정**: 쿠폰 발급 원인 주문 (`source_order_id`) + 쿠폰 사용 주문 (`used_order_id`) 2개 FK
**이유**: 재방문 쿠폰 발급 맥락 추적 (첫 결제 A → 쿠폰 발급 → 두 번째 결제 B에 사용)
**영향 파일**: `src/lib/coupon.ts`, `issue-revisit-coupon/`

---

### 카카오 알림톡 통합: TalkDream API

**결정**: 결제 완료 시 카카오 알림톡 자동 발송 (`send-alimtalk` Edge Function)
**이유**: 사용자가 AI 생성 완료 시점을 놓치는 문제. 카카오톡 도달률 95%+
**비용**: 1건당 약 9원
**영향 파일**: `supabase/functions/send-alimtalk/`

---

## 2025-12-16 이미지 최적화: Supabase Storage Thumbnail Variant

**결정**: `getThumbnailUrl(url, 'list' | 'detail')` 헬퍼 함수로 Supabase Storage 자동 리사이즈 활용
**이유**: 첫 로딩 시간 3.2초 → 1.1초 (70% 단축)
**영향 파일**: `src/lib/image.ts`, `HomePage.tsx`

---

## 2025-12-15 any 타입 전면 금지

**결정**: `any` 사용 금지. Supabase API 응답은 반드시 interface 정의. 예외: `unknown` 후 타입 가드
**영향 파일**: 전체 프로젝트

---

## 2025-12-14 Tailwind CSS v4.0 토큰 시스템

**결정**: `globals.css` CSS 변수로 디자인 토큰 정의. 폰트 Tailwind 클래스 (`text-*`, `font-*`) 사용 금지
**이유**: Figma 디자인 타이포그래피가 HTML 태그별 정의 → Tailwind 클래스와 충돌

---

## 2025-12-13 무료 콘텐츠 localStorage 캐시 전략

**결정**: 비로그인 사용자 무료 콘텐츠는 DB 저장 없이 localStorage에만 휘발성 저장
**이유**: 개인정보 최소 수집, 서버 부하 감소, 로그인 유도 효과
**영향 파일**: `src/lib/freeContentService.ts`

---

## 2025-12-12 AI 생성: Edge Function 분리 (무료 vs 유료)

**결정**: `/generate-free-preview` (무료, 빠른 응답 30초) + `/generate-master-content` (유료, 품질 중시 2분)로 분리
**이유**: 응답 속도/품질 요구사항 다름. API Rate Limit 분리

---

## 2025-12-10 컴포넌트 구조: components vs pages 분리

**결정**: 라우트 페이지는 `/pages/`, 재사용 컴포넌트는 `/components/`
**예외**: Figma 임포트 컴포넌트는 라우트여도 `/components/`에 유지

---

**문서 버전**: 4.0.0
**최종 업데이트**: 2026-03-03
