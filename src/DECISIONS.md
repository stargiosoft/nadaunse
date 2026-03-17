# DECISIONS.md

> **아키텍처 결정 기록 (Architecture Decision Records)**
> "왜 이렇게 만들었어?"에 대한 대답
> **GitHub**: https://github.com/stargiosoft/nadaunse
> **최종 업데이트**: 2026-03-17
> **주요 결정**: 사주 프롬프트 카테고리별 최적화, 마음톡 모드 시스템 + SSE 아키텍처, 나다움 분석 시각화, Vite outputDirectory dist 통일, 업셀링 후킹 멘트 아키텍처, 상세 페이지 History Guard 제거, IndexNow, iOS 스와이프 뒤로가기, visit_dates 기반 재방문 통계

---

## 📋 형식

```
[날짜] [결정 내용] | [이유/배경] | [영향 범위]
```

---

## 2026-03-17

### 사주 프롬프트 최적화 — 카테고리별 선별 필드 추출 + 오행/십성 맥락 주입

**결정**: `generate-saju-answer`에서 전체 사주 JSON dump 대신, 질문 카테고리별 핵심 필드만 추출하고 오행 상생/상극 + 십성 상호작용 맥락을 자동 주입

**설계**:
- **공유 모듈**: `server/sajuKnowledgeMap.ts` — `classifyQuestionType()`, `buildOptimizedSajuPrompt()`
- **12 카테고리**: 개인운세, 연애, 이별, 궁합, 재물, 직업, 시험/학업, 건강, 인간관계, 자녀, 이사/매매, 기타
- **필드 관련성 매트릭스**: ●(필수)/○(선택)/-(제외) — ~42키 → 10-15키/질문
- **자동 분류**: `generate-content-answers`에서 `categoryMain` 전달, 미지정 시 키워드 기반 자동 분류
- **월별 데이터**: "3월", "이번 달" 등 감지 시 월간 간지/십성 포함

**이유**: 토큰 ~83% 절감 (7,000자→1,200자), AI가 관련 데이터에 집중하여 답변 품질 향상

**영향**: `server/sajuKnowledgeMap.ts`(신규), `generate-saju-answer/index.ts`, `generate-content-answers/index.ts`

---

## 2026-03-11

### 마음톡 모드 시스템 — 일반/사주/타로 3모드 + 라운드 + SSE 스트리밍

**결정**: 마음톡을 3가지 모드(일반/사주/타로)로 분리하고, 라운드 시스템으로 세션 관리

**설계**:
- **모드별 과금**: 일반(무료 무제한), 사주/타로(3회 무료→5새싹/회)
- **라운드 시스템**: `mind_talk_conversations` UNIQUE(user_id, session_date, mode, round) — 새로고침 시 round+1
- **SSE 스트리밍**: Gemini 2.5 Flash → Edge Function `mind-talk-chat`에서 SSE 전송 → 프론트 실시간 표시
- **한국어 멀티바이트 처리**: TextDecoder flush + 잔여 buffer 처리로 잘림 방지
- **4주 심리 흐름**: `user_situation_summaries` 주차별 최신 1건씩 AI에 전달
- **AI 선제 인사**: 모드 진입 시 심리 데이터 기반 첫 메시지 자동 생성

**이유**: 모드별 분리로 과금 모델 유연화, 라운드 시스템으로 대화 컨텍스트 격리, SSE로 UX 향상

**영향**: MindTalkPage.tsx, mind-talk-chat Edge Function, mind_talk_conversations/messages 테이블

---

### 나다움 분석 시각화 — AI JSON 포맷 + 오행 바 차트 + 게이지/스펙트럼

**결정**: 나다움 분석 결과를 구조화된 JSON(text+score+spectrum)으로 AI가 생성하고, 다양한 시각화 컴포넌트로 표시

**설계**:
- **AI 출력 포맷**: `{ text: string, score: number, spectrum: { left: string, right: string, value: number } }`
- **시각화**: ScoreGauge(반원형 0-100), SpectrumBar(2축 스펙트럼), 오행 수평 바 차트
- **나다움 유형 카드**: MBTI 스타일 16유형 + 그라디언트 + 명언
- **metadata JSONB**: `nadaum_analyses.metadata`에 AI JSON 전체 저장 (캐시 재생성용)
- **상세 해금 → 초대 기반**: ShareRewardModal 재사용, 친구 초대 0~4명 기반 단계적 해금

**이유**: 구조화된 JSON으로 일관된 시각화 가능, metadata 저장으로 재분석 없이 UI 렌더링

**영향**: NadaumAnalysisPage.tsx, NadaumAnalysisDetail.tsx, generate-nadaum-analysis Edge Function

---

### Vite outputDirectory — build → dist 통일

**결정**: Vite 빌드 출력 디렉토리를 `dist`로 통일하고, 관련 설정 모두 업데이트

**문제**: Vite `outDir: 'dist'`인데 prerender.mjs와 Vercel이 `build/`를 찾아서 배포 3연속 실패

**수정**:
1. `scripts/prerender.mjs`: `BUILD_DIR = resolve(__dirname, '..', 'dist')`
2. `vercel.json`: `"outputDirectory": "dist"` 추가

**이유**: Vite 기본값이 `dist`이므로 이에 맞춰 통일

**영향**: vercel.json, scripts/prerender.mjs

---

### BEST 운세 추천순 정렬 — 지수 감쇠 카테고리 점수 + 비로그인 localStorage 폴백

**결정**: 개인화된 '추천순' 정렬을 기본값으로 추가하고, 로그인/비로그인 사용자에 따라 다른 추천 전략 사용

**설계**:
- **테이블**: `user_category_interactions` — 사용자별 콘텐츠 카테고리 이용 기록 (UPSERT 방식)
- **트리거**: `orders`(유료 완료)와 `free_content_records`(무료 이용) AFTER INSERT 시 자동 기록
- **RPC**: `get_recommended_contents` — `get_home_contents`와 동일 시그니처 + 추천 로직
- **추천 로직 (로그인+이력)**:
  1. 대분류(`category_main`) 점수: `e^(-0.01d)` 지수 감쇠 (365일 이내)
  2. 중분류(`category_sub`) 점수: 동일 감쇠
  3. `recommended_paid_content_id` 부스트: 최근 90일 무료 콘텐츠의 업셀 대상 우선
  4. 폴백: `weekly_clicks DESC, created_at DESC`
- **비로그인 추천**: localStorage `recommended_paid_ids` 키에 최근 무료 결과의 추천 유료 콘텐츠 ID 저장 (최대 20개, 최신순) → 프론트엔드에서 인기순 결과를 재정렬

**이유**: DB 기반 추천은 로그인 사용자에게만 의미 있고, 비로그인 사용자는 localStorage가 유일한 개인화 수단. 지수 감쇠는 최근 관심사에 자연스럽게 가중치를 부여하면서도 과거 이력을 완전히 무시하지 않음

**영향**: FortuneAllPage.tsx, App.tsx, 4개 마이그레이션 파일, 4개 문서

---

## 2026-03-06

### 업셀링 후킹 멘트 아키텍처 — 추천 쿼리 경유 방식 채택

**결정**: `upsell_hook_text`를 product 객체가 아닌 `fetchRecommendedPaidContent()` 반환값으로 전달

**문제**:
- `master_contents.upsell_hook_text` 컬럼에 데이터가 있지만 UI에 "구체적인 흐름이 궁금하다면..." 하드코딩 문구만 노출
- App.tsx의 FreeResultPage에서 `product` 객체는 `id, title, type, category, image, description`만 매핑하는 변환 로직을 거침
- `upsell_hook_text`가 변환 과정에서 누락됨

**해결 방법**:
1. `fetchRecommendedPaidContent()` 반환 타입을 `MasterContent | null` → `{ content: MasterContent | null; hookText: string | null }`로 변경
2. 추천 유료 콘텐츠 조회 시 `upsell_hook_text`도 함께 SELECT
3. `CachedData` 인터페이스에 `upsellHookText` 필드 추가
4. App.tsx에서 별도 state로 관리하여 FreeSajuDetail에 prop 전달
5. FreeSajuDetail에서 `upsellHookText || '구체적인 흐름이 궁금하다면...'` 폴백 렌더링

**원칙**: DB 컬럼 → 프론트엔드 전달 시, 변환/매핑 로직을 거치는 경로(product 객체)보다 직접 전달 경로(추천 쿼리)가 안전

**영향 범위**:
- `src/lib/freeContentService.ts` — `fetchRecommendedPaidContent()` 반환 타입, `CachedData` 인터페이스
- `src/App.tsx` — `upsellHookText` state, FreeSajuDetail prop
- `src/components/FreeSajuDetail.tsx` — `upsellHookText` prop 수신 및 렌더링

### 무료→유료 콘텐츠 명시적 매핑 (`recommended_paid_content_id`)

**결정**: `master_contents`에 자기참조 FK `recommended_paid_content_id` 추가, 카테고리 자동 폴백과 명시적 매핑 2단계 구조

**배경**:
- 기존: 카테고리(category_sub → category_main) 기반 자동 매칭만 존재
- 문제: 같은 카테고리 내에서도 테마적 연관성이 떨어지는 유료 콘텐츠가 추천됨
- 예: "바람기 감별" 무료 → 카테고리 매칭으로 무관한 "결혼 시기" 유료가 추천

**구현**:
- `recommended_paid_content_id` (uuid, self-referencing FK): 명시적 1:1 매핑
- `upsell_hook_text` (text): 콘텐츠별 맞춤 후킹 멘트 (행동경제학 기반)
- 우선순위: 명시적 매핑 → category_sub 폴백 → category_main 폴백
- 기타/재미 카테고리는 매핑 제외 (NULL)

**현황** (2026-03-06): 무료 123개 중 117개 매핑 완료, 6개 기타/재미 제외

**영향 범위**: DB 컬럼 2개 추가, `freeContentService.ts` 쿼리 로직 수정

---

## 2026-03-05

### 상세 페이지 History Guard 제거 및 navigate(-1) 전환

**결정**: MasterContentDetailPage, FreeContentDetail의 History Guard(replaceState+pushState) 제거, onBack을 `navigate(-1)`로 전환

**문제**:
- best 운세 → 상품 상세 → iOS 스와이프 뒤로가기 → best 운세 → 상품 상세 → iOS 스와이프 뒤로가기 → **new 무료 운세 리스트로 이동** (버그)
- 4~5번째 사이클부터 히스토리 스택이 꼬이기 시작
- `history.length`가 14 → 19까지 증가, 유령 네비게이션(`/best-fortune` → `/`) 발생

**원인 (2026-02-06 결정과 동일 패턴)**:
```
MasterContentDetailPage mount 시:
  replaceState(state, '', '/best-fortune')  ← 현재 엔트리를 /best-fortune으로 교체
  pushState(state, '', '/master/content/detail/xxx')  ← 상세 URL 다시 push

onBack 시:
  navigate('/best-fortune', { replace: true })  ← 또 다른 /best-fortune 추가

→ 스택: [..., /best-fortune(원래), /best-fortune(guard), /best-fortune(replaced)]
→ 반복할수록 중복 엔트리 누적 + React Router state 불일치
→ 5-6 사이클 후 iOS 스와이프 시 이전 세션의 엔트리(/new-free, /free/content/...)로 빠짐
```

**해결 방법**:
1. **History Guard useEffect 제거** (MasterContentDetailPage, FreeContentDetail)
   - 매 상세 페이지 진입 시 replaceState+pushState로 엔트리를 삽입하면 반복 네비게이션 시 스택 오염
   - `DirectEntryHistoryGuard`(App.tsx)가 직접 URL 진입 시 홈(/) 삽입 역할을 이미 담당
2. **onBack: `navigate(-1)` 사용**
   - 유료 콘텐츠: `navigate('/best-fortune', { replace: true })` → `navigate(-1)`
   - 무료 콘텐츠: `navigate('/new-free', { replace: true })` → `navigate(-1)`
   - 탭 상태는 FortuneAllPage/NewFreeFortuneAllPage가 sessionStorage에서 자동 복원
3. **canGoBack state 추가** (FortuneAllPage, NewFreeFortuneAllPage, HomeScreenNew)
   - 상세 페이지 이동 시 `{ state: { canGoBack: true } }` 전달
   - `useGoBack` 훅이 직접 URL 진입 vs 앱 내 네비게이션 구분 가능

**핵심 원리 (DECISIONS.md 2026-02-06 결정 재확인)**:
- `navigate('/some-path', { replace: true })`는 히스토리 스택을 예측 불가능하게 만듦
- `navigate(-1)`는 브라우저의 자연스러운 뒤로가기 동작 보존
- History Guard는 `DirectEntryHistoryGuard`(App.tsx) 한 곳에서만 관리

**영향 범위**:
- `src/components/MasterContentDetailPage.tsx` — History Guard 제거, onBack `navigate(-1)` 전환, FreeContentDetail onBack 3곳 동일 수정
- `src/components/FreeContentDetail.tsx` — History Guard 제거
- `src/pages/FortuneAllPage.tsx` — handleItemClick에 `canGoBack: true` 추가
- `src/pages/NewFreeFortuneAllPage.tsx` — handleItemClick에 `canGoBack: true` 추가
- `src/pages/HomeScreenNew.tsx` — BestFortuneCard/슬라이더 navigate에 `canGoBack: true` 추가

**테스트**: iOS Safari에서 best 운세 ↔ 상품 상세 6회 이상 반복 후 스와이프 뒤로가기 정상 확인 ✅

---

## 2026-02-12

### IndexNow 프로토콜 도입 (검색엔진 인덱싱 촉진)

**결정**: IndexNow Edge Function을 생성하여 콘텐츠 배포/업데이트 시 검색엔진에 즉시 URL 제출

**배경**:
- 네이버: 220+ 페이지 중 12개만 색인, 사이트맵 제출 후에도 크롤링이 느림
- 구글: 브랜드 키워드("나다운세")만 유입, 콘텐츠 키워드 유입 없음
- 기존 방식(사이트맵 제출 + 수동 URL 수집 요청)은 수일~수주 소요

**구현**:
- `supabase/functions/index-now/index.ts`: POST로 URL 배열을 받아 `api.indexnow.org`에 제출
- `public/e32ae15605104f698d20fde140bc8e83.txt`: 키 검증 파일
- 환경변수: `INDEXNOW_API_KEY`

**호출 타이밍**: 콘텐츠 deploy 후, Vercel 빌드 완료 후

**한계**: 구글은 IndexNow 미지원 → Google Search Console에서 별도 URL 검사 필요

**영향 범위**: Edge Function 1개 추가 (31 → 32), 배포 스크립트 업데이트

---

## 2026-02-10

### 직접 URL 진입 시 뒤로가기/홈 버튼이 작동하지 않는 문제 (2중 방어 구조)

**결정**: `DirectEntryHistoryGuard` + `useGoBack` 훅의 2중 방어 구조로 해결

**문제**:
- 사용자가 콘텐츠 상세 페이지 URL을 직접 입력하거나 외부 링크로 진입할 때, 뒤로가기/홈 버튼 클릭 시 홈(`/`)으로 이동하지 않음
- `navigate(-1)` (history.back)은 브라우저 히스토리에 이전 페이지가 없으면 앱 밖으로 나가거나 아무 동작 없음
- iOS Safari 스와이프 백 제스처에서도 동일한 문제 발생

**왜 어려웠는가**:
- SPA에서 브라우저 히스토리 스택을 직접 조회할 수 없음 (`history.length`는 전체 탭 히스토리라 신뢰 불가)
- React Router의 `location.state`는 새로고침/직접 진입 시 null이 됨
- iOS Safari는 히스토리 조작(`replaceState`, `pushState`)에 대해 데스크톱 브라우저와 다르게 동작
- 여러 진입 경로(직접 URL, 외부 링크, 앱 내 네비게이션, 새로고침)를 모두 커버해야 함

**시도했다 실패한 접근**:
1. `history.length > 1` 체크 → 탭 전체 히스토리라 직접 진입 판별 불가
2. `document.referrer` 체크 → 같은 도메인 내 이동 시에도 빈 값일 수 있음
3. `navigate(-1)` 후 타이머로 fallback → 레이스 컨디션, iOS에서 불안정

**최종 해결 (2중 방어)**:

```
1차 방어: DirectEntryHistoryGuard (App.tsx)
  - 앱 초기화 시 현재 경로가 '/'가 아니면 히스토리에 홈을 삽입
  - replaceState(null, '', '/') → pushState(null, '', 현재URL)
  - sessionStorage로 세션당 1회만 실행
  - 효과: 브라우저 뒤로가기/스와이프 백 → 홈으로 이동

2차 방어: useGoBack 훅 (useIOSSafeNavigate.ts)
  - location.state.canGoBack 플래그 확인
  - 플래그 있음 → navigate(-1) (정상 뒤로가기)
  - 플래그 없음 → navigate(fallback, { replace: true }) (홈으로 이동)
  - 효과: 앱 내 뒤로가기 버튼 클릭 시 안전하게 처리
```

**핵심 포인트**:
- 두 방어를 동시에 사용하는 이유: HistoryGuard만으로는 앱 내 버튼 클릭을 커버 못하고, useGoBack만으로는 iOS 스와이프 백을 커버 못함
- `canGoBack` 플래그는 `useIOSSafeNavigate` 훅에서 네비게이션 시 자동으로 `location.state`에 설정

**영향 범위**:
- `src/App.tsx` - `DirectEntryHistoryGuard` 컴포넌트 추가
- `src/hooks/useIOSSafeNavigate.ts` - `useGoBack` 훅 구현
- `src/components/FreeContentDetailComponents.tsx` - TopNavigation에서 onBack/onHome 사용
- `src/components/MasterContentDetailPage.tsx` - 유료 콘텐츠 상세 페이지 동일 적용

---

### 재방문 고객 통계를 visit_dates 기반으로 전환

**결정**: 통계 대시보드의 재방문 고객 계산을 `last_login_at` → `visit_dates` (date[] 배열) 기반으로 변경

**배경**:
- `last_login_at`은 마지막 방문 시점 1개만 기록 → 기간 필터 시 중간 방문 데이터 누락
- `visit_dates`는 모든 방문 날짜를 배열로 저장 → 기간 내 정확한 재방문 데이터 제공 가능

**구현**:
- 개요 탭 전체 기간: `visit_count` → `visit_dates` 배열 길이 기준 (<=1: 신규, >=2: 재방문)
- 개요 탭 기간 필터: `last_login_at` 범위 → `visit_dates`에 기간 내 날짜 존재 + `created_at < startDate`
- 추세 탭: `last_login_at` 기반 쿼리 → `visit_dates.includes(dateKey)` + `created_at < dateKey`

**추가 수정 (타임존 버그)**:
- ISO 문자열에서 `.substring(0, 10)`으로 날짜 추출 시 UTC 날짜가 됨 (KST와 9시간 차이)
- `toLocalDateStr()` 함수로 로컬 시간 변환 적용
- `aggregateTrendData()` 주별 그룹키도 `toISOString().split('T')[0]` → 로컬 시간 변환

**영향 범위**:
- `src/lib/statsService.ts` - `fetchDashboardStats()`, `fetchDailyTrendStats()`, `aggregateTrendData()`

---

## 2026-02-09

### rejected_tags 태그 제외 시스템

**결정**: 사용자가 CheckRecordMe에서 선택하지 않은 태그를 `users.rejected_tags`에 누적 저장하고, 다음 태그 추출 시 AI가 해당 태그를 제외

**배경**:
- 사용자가 반복적으로 같은 태그를 거부하는 패턴 발생
- AI가 매번 동일한 태그를 추출하면 사용자 경험 저하

**구현**:
- `users.rejected_tags text[]` 컬럼 추가
- CheckRecordMe에서 미선택 태그를 `rejected_tags`에 누적 append (중복 제거)
- `extract-trait-tags` Edge Function에 `rejectedTags` 파라미터 추가
- AI 프롬프트에 "절대 사용 금지 태그" 섹션으로 반영

**영향 범위**:
- `src/components/CheckRecordMe.tsx` - saveTags(), handleSave() 양쪽 플로우
- `src/components/UnifiedResultPage.tsx` - 유료 콘텐츠 태그 추출 시 rejectedTags 전달
- `src/App.tsx` - 무료 콘텐츠 태그 추출 시 rejectedTags 전달
- `supabase/functions/extract-trait-tags/index.ts` - rejectedTags 프롬프트 반영

---

### last_login_at 갱신 로직 통합 (HomePage → App.tsx)

**결정**: `last_login_at` + `visit_count` 갱신을 HomePage에서 App.tsx의 `recordTodayVisit()`로 이동

**배경**:
- 기존: HomePage의 useEffect에서만 `last_login_at` + `visit_count` 갱신
- 문제: 사용자가 HomePage를 거치지 않고 다른 페이지로 직접 접근하면 `last_login_at` 갱신 안 됨
- StatsDashboard의 `returningCustomers` 계산 시 `last_login_at >= startDate` 필터 사용 → 방문했지만 카운트 안 됨
- `contentUsageRate`가 100% 초과 현상 발생

**구현**:
- `src/lib/auth.ts` `recordTodayVisit()` 수정:
  - `visit_dates` 갱신 + `visit_count` 증가 + `last_login_at` 갱신을 하나의 update로 통합
  - 이미 오늘 방문한 경우에도 `last_login_at`만 갱신 (접속 시각 추적)
- `src/pages/HomePage.tsx` 간소화:
  - 중복 방문 추적 로직 (~28줄) 제거
  - `recordTodayVisit()`에 위임

**영향 범위**:
- `src/lib/auth.ts` - recordTodayVisit() 로직 강화
- `src/pages/HomePage.tsx` - 중복 로직 제거
- `src/lib/statsService.ts` - returningCustomers, contentUsageRate 정확도 개선

---

### anonymous_free_views INSERT 방식 전환

**결정**: `generate-free-preview`에서 anonymous_free_views 기록을 upsert → INSERT로 변경, UNIQUE 제약 제거

**배경**:
- 기존: UNIQUE(fingerprint, content_id, viewed_date) + upsert → 같은 콘텐츠 재조회 시 카운트 안 됨
- 변경: 같은 콘텐츠 재조회도 매번 카운트하여 일일 제한 더 엄격하게 적용

**영향 범위**:
- `supabase/functions/generate-free-preview/index.ts` - upsert → INSERT
- `anonymous_free_views` 테이블 - UNIQUE 제약 제거

---

## 2026-02-06

### 비회원 무료 콘텐츠 일일 제한 (2중 검증 아키텍처)

**결정**: 클라이언트(localStorage) + 서버(IP+UA fingerprint) 2중 검증으로 비회원 하루 3개 제한

**배경**:
- 비회원이 무료 콘텐츠를 무제한 이용 → AI API 비용 증가
- localStorage만으로는 브라우저 데이터 삭제 시 우회 가능
- 로그인 없이도 사용자를 식별할 방법 필요

**아키텍처**:
```
1차 검증 (클라이언트, 즉시):
  FreeContentDetail.tsx → hasReachedLocalLimit()
  → localStorage 'free_content_views_v1' 확인
  → 3개 이상이면 LoginBottomSheet 표시

2차 검증 (서버, Edge Function):
  generate-free-preview → IP+UA SHA-256 fingerprint
  → anonymous_free_views 테이블 조회
  → 3개 이상이면 DAILY_LIMIT_REACHED 응답
```

**핵심 결정사항**:

| 항목 | 결정 | 이유 |
|------|------|------|
| fingerprint 방식 | IP + UserAgent SHA-256 | 서버에서 즉시 생성 가능, 개인정보 최소 수집 |
| 제한 단위 | 하루 3개 콘텐츠 | 체험 충분 + 남용 방지 균형 |
| 날짜 기준 | KST (한국 시간) | 한국 서비스, 자정 기준 초기화 |
| 같은 콘텐츠 재조회 | 매번 카운트 | INSERT 방식 (UNIQUE 제약 제거, 2026-02-09) |
| 검증 실패 시 | 서비스 계속 (가용성 우선) | DB 에러 시에도 콘텐츠 이용 가능 |
| 로그인 사용자 | 무제한 | 서버 검증 스킵 (`userId` 있으면 통과) |

**신규 파일**:
- `src/lib/freeContentLimitService.ts` — 클라이언트 제한 서비스
- `src/components/LoginBottomSheet.tsx` — 로그인 유도 바텀시트
- `supabase/migrations/20260206_add_guest_hash_to_free_content_records.sql` — anonymous_free_views 테이블

**수정 파일**:
- `supabase/functions/generate-free-preview/index.ts` — 서버 2차 검증 추가
- `src/components/FreeContentDetail.tsx` — 클라이언트 1차 검증 + LoginBottomSheet
- `src/components/FreeContentLoading.tsx` — DAILY_LIMIT_REACHED 응답 처리

**자동 정리 (pg_cron)**:
- `cleanup-anonymous-free-views` — 매일 KST 09:00 (UTC 00:00)에 전날 이전 `anonymous_free_views` 데이터 자동 삭제
- Edge Function이 아닌 pg_cron 직접 SQL 방식 (Supabase에서 pg_cron → Edge Function HTTP 호출 불가)
- 마이그레이션: `supabase/migrations/20260206_cleanup_anonymous_free_views_cron.sql`

---

## 2026-02-04

### 통계 대시보드 계산 로직 통일 (개요 ↔ 추세)

**결정**: 개요와 추세의 태그 관련 지표 계산 로직을 통일

**배경**:
- 문제: 같은 날짜를 조회해도 개요와 추세에서 수치가 다르게 표시됨
- 원인: 개요는 "콘텐츠 건 기준", 추세는 "개별 태그 기준"으로 계산

**계산 로직 정리**:

| 지표 | 계산 방식 | 비고 |
|------|----------|------|
| **태그 저장 고객** | `is_confirmed=TRUE` 태그를 가진 유니크 사용자 수 | 개요/추세 동일 |
| **확인 태그수** | 개별 확인 태그 수 (`is_confirmed=TRUE` 태그 개수) | 개요/추세 동일 |
| **태그 확인율** | 확인된 콘텐츠 건수 / 전체 콘텐츠 건수 | 콘텐츠 기준 |
| **회원당 태그** | 확인 태그수 / 태그 저장 고객 | 개요/추세 동일 |

**콘텐츠 건 그룹핑 기준**:
```
그룹 키 = user_id + source_type + created_at(초 단위)
```
- 같은 시점(초 단위)에 생성된 태그들은 하나의 콘텐츠 이용으로 간주
- 그룹 내 1개라도 `is_confirmed=TRUE`면 해당 콘텐츠는 "확인됨"

**영향 범위**:
- `src/lib/statsService.ts` - `fetchDashboardStats`, `fetchDailyTrendStats`
- `src/components/StatsDashboard.tsx` - UI 표시

---

### 추세 기간별 집계 단위 (일별/주별/월별)

**결정**: 추세 조회 기간에 따라 집계 단위를 자동 변경

**배경**:
- 문제: 90일, 1년 데이터를 일별로 표시하면 차트가 과밀하고 가독성 저하
- 해결: 기간별로 적절한 집계 단위 적용

**집계 단위 매핑**:

| 기간 | 집계 단위 | 라벨 예시 |
|------|----------|----------|
| **7일** | 일별 | 01/28, 01/29, ... |
| **30일** | 일별 | 01/05, 01/06, ... |
| **90일** | 주별 | 1월 1주, 1월 2주, ... |
| **1년** | 월별 | 1월, 2월, 3월, ... |

**집계 방식**:
- **합계**: 신규 회원, 매출, 태그 수, 콘텐츠 이용 건수 등
- **평균**: 태그 확인율 (태그가 있는 날의 평균), 참여 시간
- **재계산**: 비율 지표 (합계 기반으로 재계산)

**주 단위 기준**: 월요일 시작 (getWeekStart 함수)

**영향 범위**:
- `src/lib/statsService.ts` - `aggregateTrendData`, `getGranularityFromPreset`
- `src/components/StatsDashboard.tsx` - preset 전달

---

## 2026-02-09

### 배치 selfContinue 패턴 + shutdown 대응

**결정**: 배치 함수가 시간 제한 시 자기 자신을 재호출(selfContinue)하는 fire-and-forget 패턴 도입

**배경**:
- 문제 1: 관리자 "보고서 다시 보내기" 시 클라이언트가 while 루프로 isPartial 재호출 → 브라우저 타임아웃/shutdown
- 문제 2: Supabase Edge Function이 120~180초 실행 시 isolate shutdown 발생
- 문제 3: `.single()` 쿼리가 "본인" 사주 2개인 사용자에서 400 에러

**해결**:
1. **maxExecutionMs 60초**: 마지막 배치 포함 ~90초 이내 종료 → shutdown 방지
2. **selfContinue 파라미터**: `true`이면 시간 제한 후 남은 유저로 자기 자신 재호출 (fire-and-forget fetch)
3. **클라이언트 단순화**: 1회 호출 → "서버에 발송 요청 중..." → 결과 표시 → 끝
4. **`.single()` → `.limit(1)`**: `is_primary desc, created_at desc` 정렬로 복수 본인 사주 대응

**동작 흐름 (관리자 재발송)**:
```
클릭 → batch 함수 1회 호출 (selfContinue: true)
  → 60초간 ~6명 처리 → 클라이언트에 응답 반환
  → 동시에: 나머지로 자기 자신 재호출 (fire-and-forget)
  → 새 인스턴스: 60초간 ~6명 처리 → 또 셀프 호출...
  → 전체 완료 (Slack 알림)
관리자 브라우저는 첫 응답 받고 끝. 꺼도 됨.
```

**영향 범위**:
- `supabase/functions/generate-weekly-reports-batch/index.ts` - selfContinue, 60초 제한
- `supabase/functions/generate-weekly-report/index.ts` - `.single()` → `.limit(1)` 수정
- `src/components/MyReportList.tsx` - 클라이언트 while 루프 제거, fire-and-forget

---

## 2026-02-03

### 주간 보고서 자동 발송 시스템 (pg_cron + pg_net)

**결정**: Supabase의 pg_cron + pg_net 확장을 사용하여 주간 보고서 자동 발송

**배경**:
- 요구사항: 매주 특정 시간에 자동으로 보고서 생성 및 알림톡 발송
- 문제: 클라이언트 기반 스케줄링은 서버 종료 시 실행 불가
- 대안 검토: GitHub Actions, 외부 Cron 서비스 → Supabase 내장 기능 선택

**구현 아키텍처**:
```
pg_cron (Supabase 내장)
    ↓ 매주 일요일 12:00 KST부터 10분 간격 반복 호출
pg_net.http_post()
    ↓ Authorization: Bearer {service_role_key from Vault}
generate-weekly-reports-batch Edge Function
    ↓ concurrency: 3, 2초 간격, 60초 시간 제한
    ↓ selfContinue: 시간 제한 시 자기 자신 재호출 (fire-and-forget)
generate-weekly-report Edge Function (각 사용자별)
    ↓ GPT-5.1 보고서 생성
send-report-alimtalk Edge Function
    ↓ TalkDream API
알림톡 발송 완료
```

**핵심 결정 사항**:
1. **Vault 사용**: Edge Function Secrets와 별개로, pg_cron에서 사용할 service_role_key를 Vault에 저장
2. **배치 처리**: concurrency 3으로 병렬 처리, 2초 간격으로 API 부하 방지
3. **시간 제한 60초**: maxExecutionMs=60_000 (마지막 배치 포함 ~90초 이내 종료, Supabase isolate shutdown 방지)
4. **selfContinue 패턴**: 시간 제한 시 남은 유저 ID로 자기 자신을 재호출 (fire-and-forget fetch). 관리자 재발송 시 클라이언트 1회 호출로 끝, 브라우저 닫아도 서버에서 자동 완료
5. **이어하기 패턴**: pg_cron 10분 간격 반복 호출 시에는 기존 보고서 있는 유저 자동 스킵 (selfContinue 불필요)
6. **중복 방지**: 기존 보고서 있으면 자동 스킵 (forceRegenerate 옵션으로 강제 재생성 가능)

**영향 범위**:
- `supabase/functions/generate-weekly-report/`
- `supabase/functions/generate-weekly-reports-batch/`
- `supabase/functions/send-report-alimtalk/`
- `supabase/migrations/20260203_weekly_report_cron.sql`

---

### 관리자 패널 설계 (마스터 계정 전용)

**결정**: MyReportList.tsx에 마스터 계정 전용 관리자 패널 추가

**배경**:
- 요구사항: 보고서 발송 실패 시 수동 재발송 기능 필요
- 문제: 개발자만 DB 직접 접근 가능 → 운영자도 관리 가능해야 함

**구현 방식**:
```
users.role === 'master' 체크
    ↓
관리자 패널 표시
├── 주차 선택 드롭다운 (최근 8주)
├── "실패 보고서 조회" 버튼
│   └── get-failed-reports Edge Function 호출
│       └── 태그 있는데 보고서 없는 사용자 조회
├── 통계 표시 (태그 사용자, 발송 완료, 실패)
└── "보고서 다시 보내기" 버튼
    └── generate-weekly-reports-batch 1회 호출 (selfContinue: true)
        → 서버에서 자동 이어하기, 브라우저 닫아도 됨
```

**실패 판단 기준**:
- `user_trait_tags`에 해당 주 확정 태그 있음
- `weekly_reports`에 해당 주 보고서 없음
→ 이 조건을 만족하면 "실패"로 판단

**영향 범위**:
- `src/components/MyReportList.tsx`
- `supabase/functions/get-failed-reports/`

---

### GPT-5.1 주간 보고서 생성

**결정**: OpenAI GPT-5.1 Responses API를 사용하여 주간 보고서 생성

**배경**:
- 요구사항: 사용자의 사주 정보, 주간 태그, 이용 콘텐츠 기반 맞춤형 보고서
- 구성: 나 다시보기 + 3카드 타로 + 마음 처방 + To-Do List

**프롬프트 구조**:
```
1. 역할 정의: 심리 학자, 나 보고서 작성자
2. 지시사항: 4개 섹션별 작성 가이드
3. 권고사항: 유료 콘텐츠 가중치
4. 개인화 정보:
   - 주간 태그 (강점/단점)
   - 누적 태그
   - 이용 콘텐츠 (유료/무료)
5. 사주 정보 (Stargio API)
6. 타로 정보 (랜덤 3장)
7. 출력 양식 (JSON)
```

**재시도 로직**:
- 최대 6회 시도 (1회 + 5회 재시도)
- 지수 백오프: 2초, 4초, 8초, 16초, 32초

**영향 범위**:
- `supabase/functions/generate-weekly-report/index.ts`

---

### 계정 불일치 시 소유자 정보 마스킹 표시

**결정**: 알림톡 링크로 접속 시 다른 계정이면 소유자의 마스킹된 이메일을 표시

**배경**:
- 문제: 사용자가 알림톡 링크(유료 콘텐츠, 주간 보고서)를 클릭했을 때 다른 계정으로 로그인되어 있으면 "주문이 없습니다" 또는 "보고서가 없습니다"라는 모호한 메시지만 표시
- 요구사항: 어떤 계정으로 구매했는지 힌트를 제공하여 사용자가 올바른 계정으로 재로그인하도록 유도

**구현 방식**:
```
1. 프론트엔드: RLS로 데이터 조회 실패 → "다른 계정의 주문" 감지
2. Edge Function 호출: get-order-owner / get-report-owner
3. Service Role Key로 RLS 우회하여 소유자 정보 조회
4. auth.admin.getUserById()로 Auth 테이블에서 이메일/전화번호 조회
5. 마스킹 후 반환: gksruf813@gmail.com → gksruf***@gmail.com
```

**마스킹 규칙**:
- 이메일: 뒤 3글자 마스킹 (localPart.length - 3)
  - `gksruf813` → `gksruf***`
  - 3글자 이하면 첫 글자만 표시: `abc` → `a***`
- 전화번호: 중간 4자리 마스킹
  - `010-1234-5678` → `010-****-5678`

**다이얼로그 메시지**:
```
다른 계정으로 구매한 운세예요

{maskedEmail}으로
다시 로그인해 주세요.

[다른 계정으로 로그인] [홈으로 이동]
```

**영향 범위**:
- `supabase/functions/get-order-owner/` (NEW)
- `supabase/functions/get-report-owner/` (NEW)
- `src/components/UnifiedResultPage.tsx`
- `src/components/ReportWeeklyDetail.tsx`

---

## 2026-02-02

### 통계 대시보드 Google Analytics 통합

**결정**: GA4 Data API를 통해 전체 고객 통계를 조회하고, Supabase에서 회원가입 고객 통계를 별도로 조회

**배경**:
- 기존: Supabase users 테이블만으로 통계 조회 (회원가입 고객만)
- 문제: 비로그인 방문자 수, 전체 트래픽 파악 불가
- 요구사항: GA 전체 고객 통계와 회원가입 고객 통계를 함께 표시

**구현 방식**:

```
[통계 대시보드]
├── GA 전체 고객 통계 (get-ga-stats Edge Function)
│   ├── 전체 사용자수 (activeUsers)
│   ├── 신규 사용자수 (newUsers)
│   ├── 재방문 고객 (activeUsers - newUsers)
│   └── 재방문율 (재방문 / 전체 * 100)
│
└── 회원가입 고객 통계 (Supabase 직접 조회)
    ├── 총 방문 고객 (신규 + 재방문)
    ├── 회원가입율 (회원수 / GA 전체 * 100)
    ├── 무료/유료 콘텐츠 이용율
    ├── 회원 태그 저장율
    └── 태그 확인율 (콘텐츠 건 기준)
```

**날짜 범위 계산 (GA 기준)**:
- GA API는 endDate가 **inclusive** (포함)
- Supabase `.lt()` 연산자는 **exclusive** (미포함)
- 프리셋 계산 시 **오늘 제외** (GA와 동일하게)
  - 7일 필터: 어제 기준 -6일 ~ 어제 (총 7일)

**영향 범위**:
- Edge Function: `get-ga-stats` 신규 추가
- 컴포넌트: `StatsDashboard.tsx` 대폭 수정
- 서비스: `statsService.ts` 날짜 계산 로직 변경

---

### 태그 확인율 콘텐츠 건 기준 계산

**결정**: 태그 확인율을 태그 개수가 아닌 콘텐츠 이용 건 기준으로 계산

**배경**:
- 문제: 콘텐츠 1회 이용 시 태그 3개 생성 → 태그 개수로 계산하면 실제 확인율과 괴리
- 기존: 52/850 = 6.1% (태그 개수 기준)
- 실제: 콘텐츠 283건 이용, 확인한 건 = ?

**구현 방식**:

```typescript
// 콘텐츠 이용 건 기준으로 그룹핑
// user_id + source_type + created_at(초 단위)로 그룹핑
const groupKey = `${tag.user_id}_${sourceType}_${createdAtSec}`;

// 각 그룹에서 1개라도 확인(is_confirmed=true)하면 "확인된 건"으로 처리
if (tag.is_confirmed) {
  contentGroups[groupKey].hasConfirmed = true;
}

// 확인율 = 확인된 콘텐츠 건 / 전체 콘텐츠 건
const confirmRate = confirmedContents / totalContents * 100;
```

**변경 전후 비교**:
| 지표 | 변경 전 (태그 기준) | 변경 후 (콘텐츠 기준) |
|------|-------------------|---------------------|
| 분모 | 850개 태그 | 283건 콘텐츠 |
| 분자 | 52개 확인 태그 | X건 확인 콘텐츠 |
| 의미 | 태그별 확인율 | 콘텐츠당 태그 확인율 |

**영향 범위**: `statsService.ts` 태그 통계 계산 로직

---

### 나다움 보고서 (주간 보고서) 아키텍처 설계

**결정**: 주간 보고서 기능을 다단계 플로우로 구현 (보고서 상세 → 타로 → 마음챙김 → 응원글 → 쿠폰)

**배경**:
- 목표: 1주간 쌓인 나다움 태그를 분석하여 사용자에게 유의미한 인사이트 제공
- 요구사항: 보고서 열람 → 타로 카드 뽑기 → 마음 챙김 메시지 → 나에게 응원 한마디 → 쿠폰 발급

**구현 방식**:

```
[프로필 나의분석보고서 탭]
    ↓
MyReportList: weekly_reports 목록 조회 (캐시 5분)
    ↓
ReportWeeklyDetail: 핵심 인사이트 + 보충 설명
    ↓
ReportWeeklyTarot: 타로 카드 셔플 + 뽑기 (user_viewed로 1회 제한)
    ↓
ReportWeeklyTarotResult: 선택한 타로 카드 결과
    ↓
ReportWeeklyMindCare: AI 생성 마음 챙김 메시지
    ↓
ReportWeeklyMemo: 나에게 응원 한마디 입력
    ↓
CompletionCoupon: 10% 할인 쿠폰 발급
```

**DB 스키마**:
- `weekly_reports`: 주간 보고서 메타데이터 + 응원글(self_encouragement)
- `weekly_report_sections`: 섹션별 태그 분석 결과 (JSONB)
- `report_tarot_selections`: 보고서별 타로 선택 기록 (user_viewed 플래그)

**영향 범위**:
- 컴포넌트: 9개 신규 추가 (주간 보고서 전용)
- DB: 3개 테이블 추가
- 라우팅: `/test/report-weekly-*` 경로 7개 추가

---

### 타로 1회 제한: user_viewed 플래그 패턴

**결정**: `user_viewed` 불리언 플래그로 실제 사용자 상호작용 추적

**배경**:
- 문제: 보고서 2회 이상 열람 시 타로가 다시 뽑힘
- 원인: `report_tarot_selections` 레코드 존재 여부만 체크 (pre-generated 포함)
- 요구사항: 사용자가 실제로 카드를 뽑은 경우에만 스킵

**구현 방식**:

```typescript
// ReportWeeklyDetailWrapper (App.tsx)
const { count, error } = await supabase
  .from('report_tarot_selections')
  .select('id', { count: 'exact', head: true })
  .eq('report_id', id)
  .eq('user_viewed', true);  // ⭐ 핵심: 실제 뽑기 여부 확인

const hasTarotDrawn = count && count > 0;

if (hasTarotDrawn) {
  // 타로 건너뛰고 결과 페이지로
  navigate(`/test/report-weekly-tarot-result/${id}`);
} else {
  // 타로 뽑기 페이지로
  navigate(`/test/report-weekly-tarot/${id}`);
}
```

**user_viewed 플래그 용도**:
- `false`: 시스템이 미리 생성한 데이터 (pre-generated)
- `true`: 사용자가 실제로 상호작용한 데이터

**영향 범위**: `App.tsx` (ReportWeeklyDetailWrapper), `report_tarot_selections` 테이블

---

### 응원글 저장 시 캐시 무효화 전략

**결정**: 응원글 저장/수정 시 `my_report_cache` localStorage 즉시 삭제

**배경**:
- 문제: 응원글 저장 후 프로필 돌아가면 이전 캐시 데이터 표시
- 원인: MyReportList가 5분 TTL 캐시 사용, 저장 시 무효화 안 됨

**구현 방식**:

```typescript
// ReportWeeklyMemo.tsx - 신규 저장
const handleComplete = async () => {
  // ... 저장 로직

  localStorage.removeItem('my_report_cache');
  console.log('🗑️ [응원글] 보고서 목록 캐시 삭제');

  onNext();  // 쿠폰 페이지로 이동
};

// ReportWeeklyMemoEditWrapper (App.tsx) - 수정
const handleSave = async (text: string) => {
  // ... 업데이트 로직

  localStorage.removeItem('my_report_cache');
  console.log('🗑️ [응원글 수정] 보고서 목록 캐시 삭제');

  navigate(`/test/profile/나의분석보고서`);
};
```

**캐시 무효화 지점**:
1. `ReportWeeklyMemo.tsx`: 최초 응원글 저장 시
2. `App.tsx` (ReportWeeklyMemoEditWrapper): 응원글 수정 시

**영향 범위**: `ReportWeeklyMemo.tsx`, `App.tsx`

---

### 반복 방문 시 쿠폰 페이지 스킵

**결정**: 응원글이 이미 존재하면 쿠폰 발급 건너뛰고 프로필로 이동

**배경**:
- 문제: 보고서 2회 방문 시 또 쿠폰 발급 페이지 표시
- 원인: ReportWeeklyMemoWrapper가 응원글 존재 여부 체크 안 함

**구현 방식**:

```typescript
// ReportWeeklyMemoWrapper (App.tsx)
const ReportWeeklyMemoWrapper = () => {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const fromEdit = location.state?.fromEdit;

  // 응원글 존재 여부 확인
  const { data, error } = await supabase
    .from('weekly_reports')
    .select('self_encouragement')
    .eq('id', id)
    .single();

  const hasEncouragement = !!data?.self_encouragement;
  const shouldGoToProfile = fromEdit || hasEncouragement;

  return (
    <ReportWeeklyMemo
      reportId={id}
      onNext={() => {
        if (shouldGoToProfile) {
          navigate('/test/my-report-list');  // 프로필로
        } else {
          navigate(`/test/completion-coupon/${id}`);  // 쿠폰 발급
        }
      }}
    />
  );
};
```

**영향 범위**: `App.tsx` (ReportWeeklyMemoWrapper)

---

## 2026-01-30

### 회원가입 후 사주 정보/태그 저장 플로우 개선

**결정**: `clearUserCaches()`에서 `pending_trait_tags`가 있으면 `cached_saju_info`를 보존

**배경**:
- 문제: 로그아웃 상태에서 무료 콘텐츠 → 회원가입 시 사주 정보와 나다움 태그가 저장되지 않음
- 원인: `AuthCallback`에서 `clearUserCaches()` 호출 시 `cached_saju_info`가 삭제됨
- 영향: `PendingTagsCheck`에서 DB 저장에 필요한 사주 정보가 없어 저장 실패

**구현 방식**:

```
로그아웃 상태 무료 콘텐츠 이용
    ↓
CheckRecordMe: pending_trait_tags 저장 → 로그인 페이지
    ↓
로그인/회원가입 완료
    ↓
AuthCallback: clearUserCaches() 호출
    ↓
┌─────────────────────────────────────────────────────────────┐
│ clearUserCaches() 개선:                                       │
│                                                               │
│ const hasPendingTags = !!localStorage.getItem('pending_trait_tags'); │
│                                                               │
│ if (hasPendingTags) {                                         │
│   // cached_saju_info 보존 (PendingTagsCheck에서 DB 저장 필요) │
│   fixedCacheKeys = fixedCacheKeys.filter(                     │
│     key => key !== 'cached_saju_info'                         │
│   );                                                          │
│ }                                                             │
└─────────────────────────────────────────────────────────────┘
    ↓
/pending-tags-check 리다이렉트
    ↓
PendingTagsCheck: cached_saju_info로 사주 정보 DB 저장 ✅
```

**영향 범위**:
- `src/lib/auth.ts`: `clearUserCaches()` 로직 수정
- 사용자 경험: 회원가입 후 사주 정보와 나다움 태그가 정상 저장됨

---

### 무료 콘텐츠 answers 필드 포맷 개선

**결정**: `PendingTagsCheck`에서 저장하는 `answers` JSONB에 `question_id`, `question_order` 필드 포함

**배경**:
- 문제: 회원가입 후 이용 기록에서 무료 콘텐츠 타이틀만 표시되고 내용이 보이지 않음
- 원인: `PurchaseHistoryPage`가 `answers` 배열의 `question_id`, `question_order`로 정렬/표시하는데 해당 필드가 없음
- 영향: 무료 콘텐츠 상세 보기 시 빈 화면 표시

**구현 방식**:

```typescript
// PendingTagsCheck (App.tsx)
const answersForDb = freeResult.contentAnswers?.map((a, index) => ({
  question_id: `q${index + 1}`,      // ⭐ 추가
  question_order: index + 1,          // ⭐ 추가
  question_text: a.questionText,
  answer_text: a.answerText
})) || freeResult.results?.map((r, index) => ({
  question_id: r.questionId || `q${index + 1}`,
  question_order: r.questionOrder || (index + 1),
  question_text: r.questionText,
  answer_text: r.previewText
})) || [];

// PurchaseHistoryPage - 기존 레코드 호환용 fallback
results: record.answers?.map((a, index) => ({
  questionId: a.question_id || `q${index + 1}`,        // ⭐ fallback
  questionOrder: a.question_order ?? (index + 1),      // ⭐ fallback
  questionText: a.question_text,
  questionType: 'ai',
  previewText: a.answer_text
})) || [],
```

**영향 범위**:
- `src/App.tsx`: `PendingTagsCheck` 함수의 `answersForDb` 생성 로직
- `src/components/PurchaseHistoryPage.tsx`: `FreeContentRecord` 인터페이스, fallback 로직
- 사용자 경험: 이용 기록에서 무료 콘텐츠 상세 내용 정상 표시

---

### PendingTagsCheckPage 공통 로딩 UI 적용

**결정**: `PendingTagsCheckPage`의 로딩 화면을 `FreeContentLoading`과 동일한 공통 스타일로 변경

**배경**:
- 문제: 회원가입 후 나다움 기록 처리 중 단순한 스피너와 "처리 중..." 텍스트 표시
- 개선: 앱 전체 로딩 UI 일관성 유지

**구현 방식**:
```tsx
// Before
<div className="w-8 h-8 border-2 border-[#48b2af] border-t-transparent rounded-full animate-spin" />
<p>처리 중...</p>

// After (FreeContentLoading 공통 스타일)
<DotLoading />
<p>나다움 기록을</p>
<p>준비중이에요!</p>
```

**영향 범위**:
- `src/App.tsx`: `PendingTagsCheckPage` 컴포넌트의 return JSX
- 사용자 경험: 일관된 로딩 UI 제공

---

### 유료 콘텐츠 나다움 스킵 상태 처리

**결정**: `UnifiedResultPage`에서 DB 조회를 통해 `__SKIPPED__` 태그 또는 `is_confirmed=true` 태그를 감지하여 나다움 기록하기 스킵 여부 결정

**배경**:
- 문제: 유료 콘텐츠에서 "다음에 할래요" 클릭 후 재진입 시 마지막 질문에서 "완료" 대신 "다음" 표시
- 원인: `hasConfirmedTags`가 `PurchaseHistoryPage`에서만 전달되어, 다른 경로로 진입 시 감지 불가
- 영향: "다음" 클릭 시 `__SKIPPED__` 태그가 나다움 기록하기에 노출

**구현 방식**:

```
┌─────────────────────────────────────────────────────────────────┐
│           유료 콘텐츠 마지막 질문 버튼 상태 결정                   │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  1. hasConfirmedTags (from PurchaseHistoryPage)                 │
│     └── 이용기록에서 진입 시 state로 전달받음                     │
│                                                                 │
│  2. hasConfirmedTagsFromDB (DB 직접 조회)                        │
│     └── 태그 추출 시 DB에서 __SKIPPED__ 또는 is_confirmed 확인    │
│                                                                 │
│  버튼 레이블 = (hasConfirmedTags || hasConfirmedTagsFromDB)      │
│               ? "완료" : "다음"                                  │
│                                                                 │
│  "완료" 클릭 시: 홈으로 이동 (나다움 기록하기 스킵)                │
│  "다음" 클릭 시: /paid/nadaum-record로 이동                       │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**핵심 변경사항 (UnifiedResultPage.tsx)**:

1. **상태 추가**:
   ```typescript
   const [hasConfirmedTagsFromDB, setHasConfirmedTagsFromDB] = useState(false);
   ```

2. **태그 조회 시 `is_confirmed` 포함**:
   ```typescript
   let checkQuery = supabase
     .from('user_trait_tags')
     .select('tag_name, tag_type, is_confirmed')  // is_confirmed 추가
     .eq('user_id', userData.user.id);
   ```

3. **스킵/확정 여부 감지**:
   ```typescript
   const hasSkippedOrConfirmed = existingTagsForContent.some(
     t => t.tag_name === '__SKIPPED__' || t.is_confirmed === true
   );

   if (hasSkippedOrConfirmed) {
     setHasConfirmedTagsFromDB(true);
   }
   ```

4. **`__SKIPPED__` 필터링**:
   ```typescript
   const filteredTags = existingTagsForContent.filter(t => t.tag_name !== '__SKIPPED__');
   setExtractedTags(filteredTags.map(t => ({ name: t.tag_name, type: t.tag_type })));
   ```

5. **버튼 레이블 및 동작 수정**:
   ```typescript
   // BottomNavigation
   nextLabel={currentQuestionOrder === totalQuestions && (hasConfirmedTags || hasConfirmedTagsFromDB) ? '완료' : '다음'}

   // handleNext
   if (hasConfirmedTags || hasConfirmedTagsFromDB) {
     navigate('/');  // 나다움 기록하기 스킵
   }
   ```

**영향 범위**:
- `UnifiedResultPage.tsx`: 상태 추가, 조건부 로직 수정
- 사용자 경험: 스킵 후 재진입 시 "완료" 버튼 표시, `__SKIPPED__` 태그 UI 미노출

---

### 로그아웃 사용자 태그 저장 플로우 개선

**결정**: 로그아웃 상태에서 태그 저장 시 phone_number 바텀시트 대신 로그인 페이지로 리다이렉트, 로그인 후 자동 저장

**배경**:
- 문제: 로그아웃 사용자가 태그 저장 시 phone_number 바텀시트가 표시되지만, 로그인 없이는 저장 불가
- 원인: phone_number 바텀시트는 로그인 사용자 대상 기능
- 영향: 로그아웃 사용자의 태그/무료콘텐츠 결과가 손실됨

**구현 방식**:

```
로그아웃 상태에서 태그 저장 클릭
    ↓
┌─────────────────────────────────────────────────┐
│ CheckRecordMe.handlePrimaryButtonClick:          │
│ 1. pending_trait_tags → localStorage            │
│ 2. redirectAfterLogin = '/pending-tags-check'   │
│ 3. 로그인 페이지로 이동                           │
└─────────────────────────────────────────────────┘
    ↓
로그인/회원가입 완료
    ↓
┌─────────────────────────────────────────────────┐
│ PendingTagsCheckPage:                           │
│ 1. 사주 정보 저장 (cached_saju_info → DB)       │
│ 2. 무료 콘텐츠 결과 저장 (localStorage → DB)    │
│ 3. phone_number 확인                            │
│    - 있으면: 태그 저장 → 홈 이동                │
│    - 없으면: 바텀시트 오픈 → 태그 저장           │
└─────────────────────────────────────────────────┘
```

**영향 범위**:
- `App.tsx`: PendingTagsCheckPage 추가, WelcomeCoupon 플래그 초기화
- `CheckRecordMe.tsx`: 로그인 체크, saveTags/handleSave INSERT 로직 추가
- `PurchaseHistoryPage.tsx`: free_content_needs_refresh 플래그 확인

**주요 localStorage 키**:
- `pending_trait_tags`: 임시 태그 정보
- `redirectAfterLogin`: 로그인 후 리다이렉트 URL
- `open_phone_bottomsheet`: 바텀시트 자동 오픈 플래그
- `free_content_needs_refresh`: 이용기록 캐시 갱신 플래그

---

### CardContent 페이지네이션 및 UI 개선

**결정**: CardContent 컴포넌트 기본 노출 6개 + 페이지네이션, 태그 색상 변경

**배경**:
- 기존: 4개 노출, 더보기 클릭 시 홈으로 이동
- 변경: 6개 노출, 더보기 클릭 시 6개씩 추가 로드

**구현 방식**:
```typescript
const PAGE_SIZE = 6;
const handleMoreClick = async () => {
  const loadedIds = contents.map(c => c.id);
  const { data } = await supabase
    .from('master_contents')
    .not('id', 'in', `(${loadedIds.join(',')})`)
    .order('weekly_clicks', { ascending: false })
    .limit(PAGE_SIZE);
  // ...
};
```

**UI 변경**:
- 태그 배경색: #f0f8f8 (민트) → #f3f3f3 (회색)
- 태그 글자색: #41a09e (민트) → #999999 (회색)
- 정렬 기준: order_count → weekly_clicks

**영향 범위**: `CardContent.tsx`

---

### 프로덕션 배포 시 "Invalid JWT" 에러 재발 및 배포 스크립트 작성

**결정**: Edge Functions 배포 스크립트 작성하여 `--no-verify-jwt` 플래그 누락 방지

**배경**:
- 프로덕션 배포 후 유료 콘텐츠 결제 시 "Invalid JWT" 401 에러 발생
- `generate-content-answers` → `generate-saju-answer` / `generate-tarot-answer` / `send-alimtalk` 내부 호출 시 실패
- 스테이징에서는 정상 작동, 프로덕션에서만 실패
- 원인: 프로덕션에 `--no-verify-jwt` 플래그 없이 배포되어 있었음

**근본 원인 분석**:
```
generate-content-answers (프론트엔드에서 호출)
    │
    ├── 사용자 JWT로 인증 (정상)
    │
    └── 내부 함수 호출 시
        │
        └── Authorization: Bearer {SERVICE_ROLE_KEY}
            │
            └── ❌ Service Role Key는 JWT가 아님 → 검증 실패
```

**왜 매번 프로덕션 배포 시 발생하는가**:
| 원인 | 설명 |
|------|------|
| 수동 배포 | 매번 명령어 입력 시 `--no-verify-jwt` 플래그 누락 |
| 스테이징/프로덕션 분리 | 스테이징만 배포하고 프로덕션 배포 누락 |
| 함수별 의존성 미인지 | 어떤 함수가 내부 호출되는지 기억 못함 |

**해결: 배포 스크립트 작성**:

```
scripts/
├── deploy-production.bat   # 프로덕션 전체 배포 (24개 함수)
├── deploy-staging.bat      # 스테이징 전체 배포 (24개 함수)
├── deploy-core.bat         # 핵심 함수만 배포 (4개, 환경 선택)
└── README.md               # 사용 방법 문서
```

**npm scripts 추가 (package.json)**:
```json
{
  "scripts": {
    "deploy:prod": "scripts\\deploy-production.bat",
    "deploy:staging": "scripts\\deploy-staging.bat",
    "deploy:core": "scripts\\deploy-core.bat",
    "deploy:prod:core": "npx supabase functions deploy generate-content-answers --project-ref kcthtpmxffppfbkjjkub && ..."
  }
}
```

**--no-verify-jwt 필수 함수 목록**:
| 함수 | 이유 |
|------|------|
| `generate-saju-answer` | `generate-content-answers`에서 내부 호출 |
| `generate-tarot-answer` | `generate-content-answers`에서 내부 호출 |
| `send-alimtalk` | `generate-content-answers`에서 내부 호출 |

**사용 방법**:
```bash
# 프로덕션 전체 배포 (권장)
npm run deploy:prod

# 또는 핵심 함수만 빠르게 배포
npm run deploy:prod:core
```

**영향 범위**:
- `scripts/deploy-production.bat`: 프로덕션 배포 스크립트 신규 생성
- `scripts/deploy-staging.bat`: 스테이징 배포 스크립트 신규 생성
- `scripts/deploy-core.bat`: 핵심 함수 배포 스크립트 신규 생성
- `scripts/README.md`: 배포 가이드 문서 신규 생성
- `package.json`: npm scripts 추가

**교훈**:
- Edge Function 간 내부 호출이 있는 경우 `--no-verify-jwt` 플래그 필수
- 수동 배포는 실수가 발생하기 쉬움 → 배포 스크립트로 자동화
- 프로덕션 배포 전 스테이징 테스트 후 동일한 방식으로 배포

---

## 2026-01-29

### 무료/유료 콘텐츠 나다움 태그 통합 플로우

**결정**: 무료/유료 콘텐츠 모두 동일한 나다움 태그 추출 및 저장 플로우 적용

**배경**:
- 기존: 무료 콘텐츠만 나다움 태그 기록 기능 존재
- 요구사항: 유료 콘텐츠(심화 해석판)에서도 동일하게 나다움 태그 기록

**구현 방식**:

```
┌─────────────────────────────────────────────────────────────────┐
│                  나다움 태그 추출/저장 플로우                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────────────────────────────────────────────┐       │
│  │                  무료 콘텐츠                          │       │
│  │  FreeResultPage (마지막 페이지)                       │       │
│  │       ↓ 백그라운드로 extract-trait-tags 호출          │       │
│  │       ↓ '다음' 버튼 클릭                              │       │
│  │  ┌──────────────────────────────────────┐            │       │
│  │  │ 태그 추출 완료?                       │            │       │
│  │  │  ├─ YES → /nadaum-record/:id         │            │       │
│  │  │  └─ NO  → /product/:id/tag-loading   │            │       │
│  │  └──────────────────────────────────────┘            │       │
│  └──────────────────────────────────────────────────────┘       │
│                                                                 │
│  ┌──────────────────────────────────────────────────────┐       │
│  │                  유료 콘텐츠                          │       │
│  │  UnifiedResultPage (데이터 로드 시)                   │       │
│  │       ↓ 백그라운드로 extract-trait-tags 호출          │       │
│  │       ↓ 마지막 페이지에서 '다음' 버튼 클릭             │       │
│  │  ┌──────────────────────────────────────┐            │       │
│  │  │ 태그 추출 완료?                       │            │       │
│  │  │  ├─ YES → /paid/nadaum-record        │            │       │
│  │  │  └─ NO  → /paid/tag-loading          │            │       │
│  │  └──────────────────────────────────────┘            │       │
│  │  ※ from=purchase(다시보기)면 태그 추출 스킵           │       │
│  └──────────────────────────────────────────────────────┘       │
│                                                                 │
│  ┌──────────────────────────────────────────────────────┐       │
│  │                  공통: CheckRecordMe                  │       │
│  │  - 추출된 태그 표시 (장점 2개, 단점 1개)               │       │
│  │  - 사용자 태그 선택                                   │       │
│  │  - save-trait-tags 호출 → user_trait_tags 저장        │       │
│  │  - 완료 후 홈(/)으로 이동 + 토스트 표시               │       │
│  └──────────────────────────────────────────────────────┘       │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**핵심 변경사항**:

1. **UnifiedResultPage.tsx**:
   - 태그 추출 상태 추가: `extractedTags`, `isTagExtracted`, `isTagLoading`
   - 데이터 로드 완료 시 백그라운드로 `extract-trait-tags` 호출
   - `from=purchase`(다시보기)면 태그 추출 스킵
   - 마지막 페이지에서 태그 추출 완료 여부에 따라 분기 이동

2. **App.tsx 라우트 추가**:
   ```typescript
   <Route path="/paid/tag-loading" element={<PaidTagExtractionLoadingWrapper />} />
   <Route path="/paid/nadaum-record" element={<PaidNadaumRecordWrapper />} />
   ```

3. **CheckRecordMe.tsx props 확장**:
   ```typescript
   interface CheckRecordMeProps {
     contentId?: string;
     orderId?: string;           // NEW: 유료 콘텐츠용
     tags?: { name: string; type: 'positive' | 'negative' | 'neutral' }[];
     sourceType?: 'free_content' | 'paid_content';  // NEW
     onBack?: () => void;
     onHome?: () => void;
     onSkip?: () => void;
     onComplete?: () => void;    // NEW: 저장 완료 콜백
   }
   ```

4. **save-trait-tags 호출 시 source_order_id 추가**:
   ```typescript
   const { data, error } = await supabase.functions.invoke('save-trait-tags', {
     body: {
       tags: selectedTags,
       source_content_id: contentId || null,
       source_order_id: orderId || null,    // ⭐ 유료 콘텐츠용
       source_type: sourceType              // ⭐ 동적으로 전달
     }
   });
   ```

**영향 범위**:
- `src/components/UnifiedResultPage.tsx`: 태그 추출 상태 및 분기 로직 추가
- `src/App.tsx`: 유료 콘텐츠용 Wrapper 컴포넌트 및 라우트 추가
- `src/components/CheckRecordMe.tsx`: props 확장 및 onComplete 콜백 추가
- `supabase/functions/extract-trait-tags/index.ts`: GPT-5-nano 태그 추출
- `supabase/functions/save-trait-tags/index.ts`: user_trait_tags 테이블 저장

---

### 무료 콘텐츠 결과 페이지 이중 로딩 수정

**결정**: App.tsx에서 이미 로드한 DB 데이터를 FreeSajuDetail에 직접 전달하여 이중 조회 방지

**배경**:
- 문제: "나다움 기록하기 → 뒤로가기" 시 로딩이 2번 표시됨
  - 1차: App.tsx `PageLoader` (DB에서 `dbResult` 조회)
  - 2차: FreeSajuDetail "운세 기록을 불러오는 중..." (동일한 데이터 재조회)
- 원인: App.tsx가 `dbResult`를 이미 로드했는데, FreeSajuDetail에 `dbRecordId`만 전달하여 동일한 `free_content_records` 데이터를 다시 DB에서 조회

**해결 방식**:

```
[기존 - 이중 로딩]
App.tsx: DB 조회 (dbResult) → PageLoader 표시
    ↓
FreeSajuDetail: dbRecordId만 받음 → 다시 DB 조회 → "운세 기록을 불러오는 중..." 표시

[수정 후 - 단일 로딩]
App.tsx: DB 조회 (dbResult) → PageLoader 표시
    ↓
FreeSajuDetail: dbData={dbResult} 직접 전달 → 즉시 렌더링 (추가 로딩 없음)
```

**영향 범위**:
- `src/App.tsx`: `dbData={dbResult}` prop 전달 추가
- `src/components/FreeSajuDetail.tsx`:
  - `dbData` prop 추가
  - `getInitialData()`: dbData가 있으면 바로 CachedData 형식으로 변환하여 사용
  - `isLoadingFromDB` 초기값: dbData가 있으면 `false`로 설정
  - useEffect: dbData가 있으면 `loadFromDatabase()` 호출 생략

---

## 2026-01-28

### 무료 콘텐츠 DB 저장 구조 도입

**결정**: 로그인 사용자의 무료 콘텐츠 이용 기록을 `free_content_records` 테이블에 저장

**배경**:
- 기존: 무료 콘텐츠 결과는 localStorage에만 저장 → "운세 기록" 페이지에서 조회 불가
- 요구사항: 로그인 사용자는 무료 콘텐츠도 "운세 기록"에서 다시 볼 수 있어야 함

**구현 방식**:

```
┌─────────────────────────────────────────────────────────────────┐
│                    무료 콘텐츠 저장 흐름                          │
├─────────────────────────────────────────────────────────────────┤
│  [FreeContentLoading.tsx]                                       │
│       ↓                                                         │
│  Edge Function: generate-free-preview 호출                       │
│       ↓                                                         │
│  ┌──────────────────┬──────────────────────────────┐           │
│  │ 로그인 사용자     │ 비로그인 사용자               │           │
│  ├──────────────────┼──────────────────────────────┤           │
│  │ free_content_    │ DB 저장 스킵                  │           │
│  │ records INSERT   │ localStorage만 사용           │           │
│  │ record_id 반환   │ record_id: null              │           │
│  └──────────────────┴──────────────────────────────┘           │
│       ↓                                                         │
│  navigate 시 fromDB: !!dbRecordId 전달                          │
│       ↓                                                         │
│  [FreeSajuDetail.tsx]                                           │
│  ┌──────────────────┬──────────────────────────────┐           │
│  │ fromDB: true     │ fromDB: false                │           │
│  │ DB에서 조회      │ localStorage에서 조회         │           │
│  └──────────────────┴──────────────────────────────┘           │
└─────────────────────────────────────────────────────────────────┘
```

**테이블 스키마** (`free_content_records`):
```sql
id              uuid PRIMARY KEY
user_id         uuid REFERENCES users(id)
content_id      uuid REFERENCES master_contents(id)
saju_record_id  uuid REFERENCES saju_records(id)
full_name       text NOT NULL
gender          text NOT NULL
birth_date      timestamptz NOT NULL
birth_time      text
is_guest        boolean DEFAULT false
answers         jsonb NOT NULL  -- AI 생성 답변 배열
created_at      timestamptz DEFAULT now()
```

**RLS 정책**:
- SELECT: `auth.uid() = user_id` (본인 기록만 조회)
- INSERT: `auth.uid() = user_id` (본인 기록만 생성)

**영향 범위**:
- `supabase/migrations/20260128_create_free_content_records.sql`: 테이블 생성
- `supabase/functions/generate-free-preview/index.ts`: DB INSERT 로직 추가
- `src/components/FreeContentLoading.tsx`: `fromDB` 플래그 전달
- `src/components/FreeSajuDetail.tsx`: DB 조회 로직 (기존 존재)
- `src/components/PurchaseHistoryPage.tsx`: 무료 체험판 탭 조회

---

## 2026-01-26

### UnifiedResultPage에서 URL.revokeObjectURL() 완전 제거

**결정**: `UnifiedResultPage.tsx`에서 모든 `URL.revokeObjectURL()` 호출을 제거하고, Blob URL 생명주기를 `blobUrlCache` 모듈에서 전역 관리

**배경**:
- 유료 결제 후 타로 결과 페이지에서 `GET blob:https://nadaunse.com/xxx net::ERR_FILE_NOT_FOUND` 에러 발생
- `requestAnimationFrame`으로 revoke 지연 시도했으나 여전히 에러 발생 (스테이징 검증)

**근본 원인**:
```typescript
// React의 비동기 상태 업데이트 타이밍 문제
setCardBackImage(newBlobUrl);  // 1. state 업데이트 "예약"
URL.revokeObjectURL(oldBlobUrl);  // 2. 즉시 실행 - 이전 URL 해제

// 문제: React가 DOM을 업데이트하기 전에 revoke가 실행됨
// → 브라우저가 아직 oldBlobUrl을 렌더링 중인데 해당 URL이 이미 무효화됨
```

**해결 방식**:
```typescript
// ❌ 기존 (문제)
if (previousBlobUrlRef.current?.startsWith('blob:')) {
  URL.revokeObjectURL(previousBlobUrlRef.current);
  previousBlobUrlRef.current = null;
}

// ✅ 변경 (해결)
// Blob URL은 blobUrlCache에서 전역 관리 - 컴포넌트에서 revoke하지 않음
previousBlobUrlRef.current = null;
```

**메모리 영향 분석**:
- 타로 카드: 78장 × ~100KB = ~7.8MB (최대)
- 실제 사용: 세션당 ~10장 = ~1MB
- blobUrlCache에서 캐시 만료 시 자동 정리
- 모바일 브라우저도 무리 없는 수준

**영향 범위**:
- `src/components/UnifiedResultPage.tsx`: 모든 `URL.revokeObjectURL()` 호출 제거
- `src/lib/blobUrlCache.ts`: 기존 전역 관리 유지 (변경 없음)

**커밋**: `22cf0cb9`

---

### TarotShufflePage "선택 완료" 버튼 즉시 네비게이션 패턴

**결정**: 카드 선택 후 "선택 완료" 버튼 클릭 시 DB 업데이트를 기다리지 않고 즉시 결과 페이지로 이동

**배경**:
- 사용자가 "선택 완료" 버튼을 클릭해도 즉시 반응이 없음
- Supabase 쿼리(~400ms) 완료 후에야 네비게이션 실행

**기존 방식 (문제)**:
```typescript
const handleConfirmCard = async () => {
  setIsSavingCard(true);

  // ❌ Supabase 쿼리 완료까지 대기 (~400ms)
  const { data: orderResults } = await supabase
    .from('order_results')
    .select('question_order')
    .eq('order_id', orderId);

  // ❌ 추가 쿼리 및 업데이트...
  await supabase.from('order_results').update({...});

  // 여기서야 네비게이션 실행
  navigate(`/result?orderId=${orderId}...`);
};
```

**변경 방식 (해결)**:
```typescript
const handleConfirmCard = async () => {
  if (!orderId || isSavingCard) return;
  setIsSavingCard(true);

  // ✅ 즉시 결과 페이지로 이동 (사용자 체감 즉각 반응)
  navigate(`/result?orderId=${orderId}&questionOrder=${questionOrder}...`, { replace: true });

  // ✅ 백그라운드에서 DB 업데이트 (실패해도 UX 영향 없음)
  try {
    await supabase.from('order_results')
      .update({ tarot_user_viewed: true })
      .eq('order_id', orderId)
      .eq('question_order', questionOrder);
  } catch (error) {
    console.error('tarot_user_viewed 업데이트 실패:', error);
    // 결과 페이지 이동은 이미 완료 - 에러 무시
  }
};
```

**UX 개선**:
- 버튼 클릭 → 즉시 페이지 전환 (0ms 체감)
- DB 업데이트는 백그라운드 처리

**영향 범위**:
- `src/components/TarotShufflePage.tsx`: `handleConfirmCard` 함수 수정

**커밋**: `0933fa43`

---

### Edge Function Cold Start 방지를 위한 Warm-up

**결정**: 앱 로드 시 `/users` Edge Function에 OPTIONS preflight 요청을 보내 Cold Start 방지

**배경**:
- 프로덕션에서 카카오 로그인 시 3초+ 지연 발생
- `/users` Edge Function의 Cold Start가 주요 원인
- Edge Function이 일정 시간 호출되지 않으면 "잠든" 상태가 되어 첫 호출 시 초기화 시간 발생

**해결 방식**:
```typescript
// App.tsx - 앱 로드 시 warm-up
useEffect(() => {
  const warmupEdgeFunctions = async () => {
    try {
      // OPTIONS preflight 요청으로 함수만 로드 (실제 로직 실행 안 함)
      await fetch(`https://${projectId}.supabase.co/functions/v1/users`, {
        method: 'OPTIONS',
      });
      console.log('⚡ Edge Function warm-up 완료');
    } catch {
      console.debug('⚡ Edge Function warm-up 실패 (무시됨)');
    }
  };
  warmupEdgeFunctions();
}, []);
```

**장점**:
- 사용자가 앱에 접속하면 백그라운드로 Edge Function "예열"
- 카카오 로그인 시 이미 함수가 "따뜻한" 상태이므로 즉시 응답
- OPTIONS 요청은 실제 비즈니스 로직을 실행하지 않아 안전

**영향 범위**:
- `src/App.tsx`: warm-up useEffect 추가

**커밋**: `1fcb5433`

---

## 2026-01-23

### generate-content-answers 배치 처리 → 병렬 처리 롤백

**결정**: `generate-content-answers` Edge Function을 배치 처리(GPT 한 번에 모든 질문)에서 병렬 처리(질문별 개별 API 호출)로 롤백

**배경**:
- 배치 처리 버전에서 GPT-5.1에 모든 질문을 한 번에 전달하는 방식 도입
- 프로덕션에서 500 에러 및 응답 품질 저하 발생
- 사용자 무한 로딩 현상 (ai_generation_completed: false 상태 유지)
- 11-21초 내 실패 → 내부 오류로 추정 (타임아웃 아님)

**변경 내용**:

| 항목 | 배치 버전 (이전) | 병렬 버전 (롤백) |
|------|------------------|------------------|
| API 호출 방식 | GPT-5.1에 모든 질문 한 번에 전달 | 질문별로 `generate-saju-answer`, `generate-tarot-answer` 개별 호출 |
| 처리 방식 | 배치 프롬프트로 일괄 처리 | `Promise.all()` 병렬 처리 |
| 재시도 | 배치 실패 시 개별 fallback | 질문당 최대 5회 재시도 (2초, 4초, 6초, 8초 대기) |
| 타임아웃 | 300초 | 200초 |
| 코드 크기 | ~1000줄 (타로 덱, 배치 프롬프트 포함) | ~550줄 |

**롤백 커밋**: `8de4635a` (병렬 처리 버전)

**백업 파일**: `supabase/back_up/generate-content-answers_batch_version_2026-01-22.ts`

**영향 범위**:
- `supabase/functions/generate-content-answers/index.ts`: 병렬 처리 버전으로 교체
- 스테이징/프로덕션: 재배포 완료

**향후 고려사항**:
- 배치 처리 재도입 시 GPT 프롬프트 최적화 필요
- 응답 품질 모니터링 후 재검토

---

## 2026-01-22

### 동적 Sitemap 자동 생성 (Edge Function)

**결정**: 정적 sitemap.xml 대신 Supabase Edge Function으로 동적 생성

**배경**:
- SEO 최적화를 위해 sitemap.xml 필요
- 콘텐츠가 자주 추가/수정되므로 정적 파일 관리 비효율
- 유료/무료 콘텐츠 상세 페이지가 검색 유입의 주요 랜딩 페이지

**구현 방식**:

1. **Edge Function 생성** (`supabase/functions/generate-sitemap/index.ts`)
   ```typescript
   // DB에서 deployed 상태 콘텐츠 조회 (유료 + 무료)
   const { data: contents } = await supabase
     .from('master_contents')
     .select('id, content_type, updated_at')
     .eq('status', 'deployed')
     .order('weekly_clicks', { ascending: false });

   // XML 생성
   // - 유료: /product/:id (priority 0.9)
   // - 무료: /free/content/:id (priority 0.8)
   ```

2. **Vercel Rewrite 설정** (`vercel.json`)
   ```json
   {
     "rewrites": [
       {
         "source": "/sitemap.xml",
         "destination": "https://kcthtpmxffppfbkjjkub.supabase.co/functions/v1/generate-sitemap"
       }
     ]
   }
   ```

3. **정적 파일 제거**
   - `public/sitemap.xml` 삭제 (백업: `public/sitemap.xml.static-backup`)
   - Vercel이 정적 파일 우선 서빙하므로 제거 필수

**Sitemap 우선순위 (priority)**:
| 페이지 유형 | priority | changefreq |
|------------|----------|------------|
| 홈페이지 (`/`) | 1.0 | daily |
| 유료 콘텐츠 (`/product/:id`) | 0.9 | weekly |
| 무료 콘텐츠 (`/free/content/:id`) | 0.8 | weekly |
| 약관/정책 페이지 | 0.3 | monthly |

**캐싱 전략**:
- `Cache-Control: public, max-age=3600, s-maxage=3600` (1시간)
- Vercel Edge에서 캐싱되므로 매 요청마다 Edge Function 호출 안 함
- 에러 시 5분만 캐싱 (`max-age=300`)

**배포 명령어**:
```bash
# 스테이징
npx supabase functions deploy generate-sitemap --project-ref hyltbeewxaqashyivilu --no-verify-jwt

# 프로덕션
npx supabase functions deploy generate-sitemap --project-ref kcthtpmxffppfbkjjkub --no-verify-jwt
```

**주의사항**:
- `--no-verify-jwt` 필수: sitemap.xml은 인증 없이 접근 가능해야 함
- Edge Function 로그는 캐시 미스 시에만 기록됨

**프론트엔드 로그**:
- 콘텐츠 배포 시 콘솔에 sitemap 등록 로그 출력
  ```
  🗺️ sitemap 자동 등록 완료 - 다음 크롤링 시 반영됨: 콘텐츠명 (id)
  ```

**테스트 방법**:
- 프로덕션: `https://nadaunse.com/sitemap.xml`
- 스테이징 (직접 호출): `https://hyltbeewxaqashyivilu.supabase.co/functions/v1/generate-sitemap`

**영향 범위**:
- `supabase/functions/generate-sitemap/index.ts`: 신규 생성
- `vercel.json`: rewrite 규칙 추가
- `public/sitemap.xml`: 삭제
- `src/components/MasterContentList.tsx`: sitemap 등록 로그 추가

**참고**:
- Google Search Console에서 sitemap 제출 필요
- robots.txt에 sitemap 경로 명시됨: `Sitemap: https://nadaunse.com/sitemap.xml`

---

## 2026-01-21

### 타로 셔플 배경 이미지 CSP 오류 수정

**결정**: 모든 이미지를 로컬 `/public` 폴더에 저장하고 절대 경로로 참조

**배경**:
- TarotGame 컴포넌트에서 외부 URL (`https://i.postimg.cc/...`) 사용
- staging 서버에서 CSP(Content Security Policy) 위반으로 이미지 로딩 차단
- 콘솔 오류: `Loading the image 'https://i.postimg.cc/...' violates the following Content Security Policy directive: "img-src 'self' data: blob: https://*.supabase.co https://*.kakaocdn.net"`
- CSP 허용 도메인: `'self'`, `data:`, `blob:`, `https://*.supabase.co`, `https://*.kakaocdn.net`

**문제점**:
1. 외부 이미지 호스팅 서비스(`postimg.cc`) 사용으로 CSP 차단
2. 배경 이미지가 표시되지 않음 (청록색 배경 패턴 누락)
3. 외부 서비스 의존성으로 인한 안정성 문제 (서비스 장애 시 이미지 미표시)

**해결 방법**:
1. **이미지 다운로드**: 외부 URL에서 로컬로 다운로드
   ```bash
   curl -L "https://i.postimg.cc/WzwkjYXT/talo-seupeuledeu-batang-(wonbon).jpg" -o public/tarot-shuffle-background.jpg
   ```

2. **코드 수정**: 외부 URL → 절대 경로
   ```tsx
   // Before (TarotGame.tsx:6)
   const tarotBackground = "https://i.postimg.cc/WzwkjYXT/talo-seupeuledeu-batang-(wonbon).jpg";

   // After
   const tarotBackground = "/tarot-shuffle-background.jpg";
   ```

3. **프리로딩 코드 수정** (LoadingPage.tsx:206)
   ```tsx
   // Before
   const tarotBackgroundUrl = 'https://i.postimg.cc/...';

   // After
   const tarotBackgroundUrl = '/tarot-shuffle-background.jpg';
   ```

**추가 개선**:
- TarotGame Container에서 title prop이 없을 때 기본값 표시
  ```tsx
  // Before
  <p>{title}</p>

  // After
  <p>{title || "질문을 떠올려 주세요"}</p>
  ```

**영향 범위**:
- `TarotGame.tsx`: 배경 이미지 경로 변경
- `LoadingPage.tsx`: 이미지 프리로딩 경로 변경
- `/public/tarot-shuffle-background.jpg`: 새 파일 추가 (9.8KB)
- CSP 오류 완전히 제거됨
- 배경 이미지 정상 표시

**새로운 규칙**:
- ✅ **모든 이미지는 `/public` 폴더에 저장**
- ✅ **절대 경로로 참조** (예: `/image.jpg`)
- ❌ **외부 이미지 URL 사용 금지** (CSP 차단됨)
- ✅ **Supabase Storage 이미지는 사용 가능** (`https://*.supabase.co`)
- ✅ **카카오 프로필 이미지는 사용 가능** (`https://*.kakaocdn.net`)

**참고 문서**:
- `CLAUDE.md` → "### 5. 이미지 처리 (CSP 제한)"
- `★PUBLISHING_GUIDE★.md` → "## 9. 이미지 처리 (CSP 제한)"

### 타로 셔플 모바일 전체 화면 배경 최적화

**결정**: iOS Safari/Chrome에서 주소창 아래까지 배경 이미지 표시 + 데스크톱 440px 프레임 제한

**배경**:
- 모바일 Safari: 하단 주소창 아래에 흰색 여백 표시
- 모바일 Chrome: 아래로 당겨서 새로고침 기능 차단됨
- 데스크톱: 440px 프레임 밖까지 배경 이미지 표시되어 불필요한 영역 차지
- 페이지 스크롤이 가능하여 사용자 경험 저하

**문제점**:
1. **iOS Safari**: `100vh` 계산이 주소창을 포함한 높이로 설정되어 실제 보이는 영역보다 작음
2. **Chrome pull-to-refresh**: `overflow: hidden`으로 인해 새로고침 제스처 차단
3. **데스크톱**: 배경 이미지가 max-width 제한 없이 전체 화면에 표시
4. **스크롤**: 콘텐츠 높이가 viewport보다 커서 스크롤 발생

**해결 방법**:
1. **iOS Safari 주소창 대응**:
   ```tsx
   // body 배경 동적 설정 (모바일만)
   const isMobile = window.innerWidth <= 440;
   if (isMobile) {
     document.body.style.backgroundColor = '#41a09e';
     document.body.style.backgroundImage = `url(${tarotBackground})`;
     document.body.style.backgroundSize = 'cover';
     document.body.style.backgroundAttachment = 'fixed';
   }
   ```

2. **Safari 주소창 색상 변경**:
   ```tsx
   // 테마 색상 동적 변경 (민트색 → 진한 청록색)
   const metaThemeColor = document.querySelector('meta[name="theme-color"]');
   if (metaThemeColor) {
     metaThemeColor.setAttribute('content', '#267973');
   }
   ```

3. **스크롤 차단 (pull-to-refresh 허용)**:
   ```tsx
   // body 고정하여 스크롤 완전 차단
   document.body.style.overflow = 'hidden';
   document.body.style.position = 'fixed';
   document.body.style.width = '100%';
   document.body.style.height = '100%';
   ```

4. **데스크톱 배경 제한**:
   ```tsx
   // 데스크톱: body 흰색, 컴포넌트 내부에 배경 이미지
   if (!isMobile) {
     document.body.style.backgroundColor = '#ffffff';
   }
   // TarotGame 내부에 배경 div 추가
   <div className="absolute inset-0" style={{ backgroundImage: `url(${tarotBackground})` }} />
   ```

5. **상단 네비게이션 고정**:
   ```tsx
   // absolute → fixed로 변경
   <div className="fixed top-0 left-0 right-0 bg-white h-[52px] z-50 max-w-[440px]">
   ```

**영향 범위**:
- `TarotGame.tsx`: body 배경 동적 설정, 테마 색상 변경, 스크롤 차단
- `TarotShufflePage.tsx`: 상단 네비 고정, overflow-hidden 추가
- `TestTarotPage.tsx`: 새 테스트 페이지 생성 (로그인 불필요)
- `index.html`: viewport-fit=cover 추가
- `App.tsx`: /test/tarot 라우트 추가

**결과**:
- ✅ iOS Safari: 주소창 아래까지 배경 이미지 표시
- ✅ Safari 주소창: 배경색과 어울리는 진한 청록색 (`#267973`)
- ✅ Chrome pull-to-refresh: 작동 가능
- ✅ 데스크톱: 440px 프레임 안에만 배경 표시, 밖은 흰색
- ✅ 스크롤: 완전히 차단되어 고정된 화면
- ✅ 상단 네비: 스크롤 시에도 고정

**트레이드오프**:
- Safari 주소창과 배경색이 완벽히 일치하지 않음 (배경 이미지 패턴 vs 단색)
- `position: fixed` 사용으로 일부 Chrome 기기에서 pull-to-refresh가 작동하지 않을 수 있음

**테스트 페이지**:
- `/test/tarot` 라우트 추가 (로그인 불필요)
- 개발/테스트 환경에서 타로 UI 빠르게 확인 가능

---

## 2026-01-20

### HTTP 캐시 전략 수립 (vercel.json)

**결정**: Vercel 배포 시 리소스 유형별 HTTP 캐시 헤더 적용

**배경**:
- 프로젝트 초기 vercel.json에 캐시 헤더 설정이 없어 브라우저가 기본값만 사용
- JS/CSS 번들, 이미지, HTML 등 모든 리소스가 매번 서버에서 다운로드
- 재방문 시에도 네트워크 요청이 발생하여 페이지 로딩 속도 저하
- 특히 타로 카드 이미지(78장)와 콘텐츠 썸네일이 반복적으로 다운로드됨

**구현**:
```json
{
  "headers": [
    {
      "source": "/assets/(.*)",
      "headers": [{
        "key": "Cache-Control",
        "value": "public, max-age=31536000, immutable"
      }]
    },
    {
      "source": "/:path*\\.(jpg|jpeg|png|webp|svg|gif|ico)",
      "headers": [{
        "key": "Cache-Control",
        "value": "public, max-age=86400, stale-while-revalidate=604800"
      }]
    },
    {
      "source": "/",
      "headers": [{
        "key": "Cache-Control",
        "value": "public, max-age=0, must-revalidate"
      }]
    }
  ]
}
```

**리소스 유형별 전략**:
| 리소스 | 캐시 정책 | 이유 |
|--------|----------|------|
| JS/CSS 번들 (`/assets/*`) | 1년 캐싱, immutable | Vite가 파일명에 해시 추가, 절대 안 바뀜 |
| 이미지 (*.png, *.jpg 등) | 1일 캐싱 + 1주일 백그라운드 재검증 | 가끔 바뀜, stale-while-revalidate로 빠른 로드 |
| HTML (`/`, `/index.html`) | 항상 최신 (max-age=0) | 배포 즉시 반영 필요 |

**예상 효과**:
- ✅ 첫 방문: 기준 대비 30-50% 빠름 (CDN 엣지 캐시 활용)
- ✅ 재방문: 기준 대비 50-80% 빠름 (브라우저 캐시에서 즉시 로드)
- ✅ 네트워크 요청: 70-90% 감소

**영향 범위**:
- `vercel.json`: HTTP 캐시 헤더 추가
- 모든 페이지: 리소스 로딩 속도 개선

**주의사항**:
- Vercel glob 패턴 사용 (정규식 X)
- `/:path*\.(jpg|jpeg|png)` 형식으로 작성
- immutable 플래그는 파일명 변경 시에만 사용

---

### 콘텐츠 썸네일 Cache API 적용

**결정**: 타로 카드와 동일한 Cache API 전략을 콘텐츠 썸네일에도 적용

**배경**:
- 홈 화면에서 콘텐츠 썸네일이 매번 다운로드됨
- imagePreloader.ts는 브라우저 메모리 캐시만 사용 (탭 닫으면 사라짐)
- 타로 카드는 Cache API로 7일간 영구 저장되어 안정적인 반면, 썸네일은 매번 재다운로드
- 홈 화면 로딩 속도가 느리다는 사용자 피드백

**구현**:
```typescript
// src/lib/thumbnailCache.ts (신규 생성)
const CACHE_NAME = 'thumbnails-v1';
const CACHE_EXPIRY_MS = 24 * 60 * 60 * 1000; // 1일

// 타로 캐시와 동일한 구조
- 싱글톤 Cache 인스턴스 (caches.open() 1회만 호출)
- 메모리 캐시 (Map<contentId, {imageUrl, cachedAt}>)
- 배치 처리 (최대 6개씩 동시 다운로드)
```

**이중 캐싱 전략**:
```typescript
// HomePage.tsx
// 1. imagePreloader: 브라우저 메모리 캐시 (즉시 로드)
await preloadImages(imageUrls, 'low');

// 2. thumbnailCache: Cache API (영구 저장, 백그라운드)
preloadThumbnails(newContents).catch(err => {
  console.log('⚠️ Cache API 저장 실패 (무시):', err);
});
```

**만료 시간 차이**:
- 타로 카드: 7일 (절대 안 바뀜, 78장 고정)
- 콘텐츠 썸네일: 1일 (관리자가 업데이트 가능, 썸네일 변경 가능성 있음)

**예상 효과**:
- ✅ 홈 화면 체감 속도 2배 개선
- ✅ 재방문 시 썸네일 즉시 표시
- ✅ 네트워크 요청 70-90% 감소

**영향 범위**:
- `src/lib/thumbnailCache.ts`: 신규 생성 (429줄)
- `src/pages/HomePage.tsx`: 썸네일 캐시 통합 (2곳)

**트레이드오프**:
- 장점: 빠른 로딩, 오프라인 지원 가능성
- 단점: 썸네일 업데이트 시 최대 1일 지연 (캐시 만료 대기)
- 해결: 관리자가 썸네일 변경 시 버전 파라미터 추가 (`?v=2`) 또는 캐시 수동 삭제

---

### 구매 내역 DB 쿼리 병렬화

**결정**: "운세 보기" 버튼 클릭 시 2개의 DB 쿼리를 순차 실행에서 병렬 실행으로 변경

**배경**:
- 구매 내역에서 "운세 보기" 클릭 시 0.5초 로딩 발생
- `master_content_questions` 쿼리: 200-500ms
- `order_results` 쿼리: 200-500ms
- **총 400-1000ms 지연** (순차 실행)

**기존 코드 (순차 실행)**:
```typescript
// 1️⃣ 전체 질문 개수 조회
const { data: questionsData } = await supabase
  .from('master_content_questions')
  .select('id')
  .eq('content_id', item.content_id);

const totalQuestions = questionsData?.length || 0;

// 2️⃣ 생성 완료된 답변 개수 조회
const { data: resultsData } = await supabase
  .from('order_results')
  .select('id, orders!inner(user_id)')
  .eq('order_id', item.id);

const completedAnswers = resultsData?.length || 0;
```

**개선 코드 (병렬 실행)**:
```typescript
// 1️⃣ 병렬로 질문 개수 & 답변 개수 조회
const [questionsResult, resultsResult] = await Promise.all([
  supabase
    .from('master_content_questions')
    .select('id', { count: 'exact', head: true })
    .eq('content_id', item.content_id),
  supabase
    .from('order_results')
    .select('id, orders!inner(user_id)', { count: 'exact', head: true })
    .eq('order_id', item.id)
]);

const totalQuestions = questionsResult.count || 0;
const completedAnswers = resultsResult.count || 0;
```

**추가 최적화**:
- `select('id')` → `{ count: 'exact', head: true }`
- ID 배열 전송 불필요, count만 반환
- 데이터 전송량 20-30% 감소

**예상 효과**:
- ✅ 400-1000ms → 150-400ms (62.5% 개선)
- ✅ 사용자 체감 속도 2배 빠름

**영향 범위**:
- `src/components/PurchaseHistoryPage.tsx`: handleViewPurchase 함수 (Line 246-272)

**에러 핸들링**:
- Promise.all 중 하나가 실패해도 개별 에러 핸들링 유지
- questionsResult.error, resultsResult.error 각각 체크

---

### 타로 캐시 성능 최적화 (싱글톤 + 메모리 캐시 + 배치 처리)

**결정**: 구매 내역 페이지의 타로 이미지 프리로드 성능을 1-6초에서 0.3-0.8초로 개선

**배경**:
- 구매 내역 132개 주문의 타로 이미지를 모두 프리로드 시도
- 매 호출마다 `caches.open()` 반복 (132회 × 20ms = 2.6초)
- 132개 동시 네트워크 요청 → 브라우저 연결 풀 초과 (최대 6개)
- "이미 캐시됨" 상태에도 매번 Cache API match 실행 (132회 × 10-50ms)
- **총 1-6초 추가 지연**

**문제 분석**:
1. **caches.open() 반복**: 매번 Cache API 열기 (20ms)
2. **동시성 제어 없음**: 132개 fetch 요청이 동시 발생
3. **중복 체크 비효율**: Cache API 비동기 조회 (10-50ms)

**해결 방법**:

**1) 싱글톤 Cache 인스턴스**:
```typescript
let cacheInstance: Cache | null = null;
let cachePromise: Promise<Cache> | null = null;

async function getCacheInstance(): Promise<Cache> {
  if (cacheInstance) return cacheInstance;

  if (!cachePromise) {
    cachePromise = caches.open(CACHE_NAME).then(cache => {
      cacheInstance = cache;
      return cache;
    });
  }

  return cachePromise;
}
```
- 효과: 132회 × 20ms = 2.6초 → 1회 = 20ms (99% 감소)

**2) 메모리 캐시**:
```typescript
const memoryCache = new Map<string, { imageUrl: string; cachedAt: number }>();

async function initMemoryCache(): Promise<void> {
  // localStorage 메타데이터 → 메모리로 복사
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key?.startsWith('tarot_meta_')) {
      const metadata = JSON.parse(localStorage.getItem(key)!);
      const cardName = key.replace('tarot_meta_', '');

      // 만료 체크 후 메모리에 저장
      if (Date.now() - metadata.cachedAt <= CACHE_EXPIRY_MS) {
        memoryCache.set(cardName, {
          imageUrl: metadata.imageUrl,
          cachedAt: metadata.cachedAt
        });
      }
    }
  }
}
```
- 효과: Cache API 조회 (10-50ms) → 메모리 조회 (0.01ms) (99.9% 빠름)

**3) 배치 처리**:
```typescript
async function batchPromises<T>(
  tasks: (() => Promise<T>)[],
  concurrency: number = 6
): Promise<PromiseSettledResult<T>[]> {
  const results: PromiseSettledResult<T>[] = [];

  for (let i = 0; i < tasks.length; i += concurrency) {
    const batch = tasks.slice(i, i + concurrency);
    const batchResults = await Promise.allSettled(batch.map(task => task()));
    results.push(...batchResults);
  }

  return results;
}
```
- 효과: 132개 동시 → 6개씩 배치 (브라우저 연결 풀 최적화)

**4) 프리로드 범위 제한**:
```typescript
// Before: 132개 모두 프리로드
completedOrders.forEach(order => {
  preloadTarotImages(order.id, supabaseUrl);
});

// After: 최근 10개만 프리로드
const recentOrders = completedOrders.slice(0, 10);
recentOrders.forEach(order => {
  preloadTarotImages(order.id, supabaseUrl);
});
```
- 효과: 초기 프리로드 132개 → 10개 (92% 감소)

**예상 효과**:
| 최적화 | Before | After | 개선 |
|--------|--------|-------|------|
| caches.open() | 132회 × 20ms = 2.6초 | 1회 = 20ms | 99% ↓ |
| 캐시 체크 | 132회 × 20ms = 2.6초 | 132회 × 0.01ms = 0.0013초 | 99.9% ↓ |
| 동시 fetch | 132개 동시 | 6개씩 배치 | 95% ↓ |
| 프리로드 범위 | 132개 | 10개 | 92% ↓ |
| **총 프리로드 시간** | **1-6초** | **0.3-0.8초** | **75% ↓** |

**영향 범위**:
- `src/lib/tarotImageCache.ts`:
  - getCacheInstance() 추가
  - initMemoryCache() 추가
  - batchPromises() 추가
  - preloadTarotImages() 수정
- `src/components/PurchaseHistoryPage.tsx`:
  - Top 10 프리로드로 제한

**트레이드오프**:
- 장점: 극적인 성능 개선 (75% 빠름)
- 단점: 메모리 사용량 약간 증가 (78장 × 150bytes = 11.7KB, 무시 가능)
- 위험: Promise.allSettled로 일부 실패해도 계속 진행

---

## 2026-01-19

### 타로 카드 이미지 로딩 실패 문제 해결 (모바일 최적화)
**결정**: `tarotImageCache.ts`의 `getCachedTarotImage()` 함수를 Blob URL 대신 실제 Storage URL 반환하도록 변경

**배경**:
- 모바일 환경에서 UnifiedResultPage의 이전/다음 버튼 클릭 시 타로 카드 이미지가 간헐적으로 로드 실패
- 에러 로그에서 캐시 히트는 성공하지만 이미지 로드 완전 실패 발생
- 특히 빠른 페이지 전환 시 문제가 더 자주 발생

**원인 분석**:
```typescript
// 기존 코드 (문제 있음)
const blob = await response.blob();
const blobUrl = URL.createObjectURL(blob);  // blob:http://... URL 생성
return blobUrl;
```

1. **Blob URL 메모리 누수**: `getCachedTarotImage()` 호출 시마다 새로운 blob URL 생성
2. **미회수 Blob URL**: 이전에 생성한 blob URL을 `URL.revokeObjectURL()`로 해제하지 않음
3. **모바일 메모리 제약**: 모바일 브라우저의 엄격한 메모리 관리로 인해 사용되지 않는 blob URL 가비지 컬렉션
4. **타이밍 문제**: React 리렌더링으로 새 blob URL 생성 후 이전 URL이 `<img>` 태그에 남아있을 때 브라우저가 해당 URL을 무효화하면 이미지 로드 실패

**해결 방법**:
```typescript
// After - Storage URL 직접 반환 (안정적)
export async function getCachedTarotImage(cardName: string): Promise<string | null> {
  // Cache API에서 이미지 존재 여부만 확인
  const cache = await caches.open(CACHE_NAME);
  const response = await cache.match(metadata.imageUrl);
  
  if (!response) {
    return null;
  }

  // ⭐ Blob URL 생성하지 않고 실제 Storage URL 반환
  return metadata.imageUrl;  // https://...supabase.co/storage/...
}
```

**장점**:
- ✅ Blob URL 생성/해제 로직 불필요 → 메모리 누수 제거
- ✅ 브라우저가 Cache API와 자체 HTTP 캐시를 활용하여 네트워크 요청 최소화
- ✅ 모바일에서도 안정적인 이미지 로딩 (URL 무효화 문제 없음)
- ✅ 빠른 페이지 전환에도 이미지 정상 표시

**영향 범위**:
- `src/lib/tarotImageCache.ts`: `getCachedTarotImage()` 함수
- `src/components/UnifiedResultPage.tsx`: 변경 없음 (기존 코드 그대로 작동)

**참고**:
- Cache API는 HTTP(S) URL을 키로 사용하여 Response 객체 저장
- 브라우저는 동일 URL 요청 시 Cache API → HTTP 캐시 → 네트워크 순서로 조회
- Blob URL 없이도 캐싱 효과 동일하게 유지

---

### 타로 카드 캐시 공란 이슈 히스토리 (2025-2026)

**배경**:
UnifiedResultPage에서 타로 카드 이미지가 간헐적으로 공란으로 표시되는 문제가 반복 발생하며, 여러 차례 개선 작업을 진행함

**주요 이슈 타임라인**:

**1) #S564: 메모리 캐시와 Cache API 동기화 문제**
- **증상**: 첫 화면은 정상, 2번째 질문부터 타로 카드 이미지가 빈 화면으로 표시
- **원인**: 
  - localStorage 메타데이터는 존재하지만 Cache API에 실제 이미지가 없는 불일치 상태
  - `getCachedTarotImage()`가 메타데이터만 확인하고 Cache API 실제 존재 여부를 검증하지 않음
- **해결**: Cache API 체크 로직 추가 (메타데이터 + 실제 캐시 모두 확인)

**2) #S566: 보이지 않는 컨텐츠 문제**
- **증상**: 타로 카드 영역이 렌더링되지만 이미지가 보이지 않음 (invisible content)
- **원인**: 
  - Framer Motion AnimatePresence 블로킹 문제
  - 이미지 로드 타이밍과 애니메이션 충돌
- **해결**: AnimatePresence 및 motion.div 제거, 단순 렌더링으로 변경

**3) 2026-01-20: 타로 캐시 성능 최적화**
- **증상**: 구매 내역 페이지에서 1-6초 지연 발생
- **원인**:
  - 132개 주문의 타로 이미지 프리로드 시 `caches.open()` 132회 반복 (2.6초)
  - 동시 네트워크 요청 132개 → 브라우저 연결 풀(6개) 초과
  - Cache API match 중복 조회 (132회 × 10-50ms)
- **해결**: 
  - 싱글톤 Cache 인스턴스 (99% 감소)
  - 메모리 캐시 추가 (99.9% 빠른 조회)
  - 배치 처리 (6개씩 병렬)
  - 프리로드 범위 제한 (132개 → 10개)
- **성능 개선**: 1-6초 → 0.3-0.8초 (75% 개선)

**4) 2026-01-20: Blob URL 제거 (모바일 최적화)**
- **증상**: 모바일에서 UnifiedResultPage 이전/다음 버튼 클릭 시 타로 카드 이미지 간헐적 로드 실패
- **원인**:
  - `getCachedTarotImage()` 호출마다 새로운 blob URL 생성
  - `URL.revokeObjectURL()` 미실행으로 메모리 누수
  - 모바일 브라우저의 엄격한 메모리 관리로 사용되지 않는 blob URL 가비지 컬렉션
  - React 리렌더링 시 타이밍 이슈 (새 blob URL 생성 중 이전 URL 무효화)
- **해결**:
  - Blob URL 생성 제거
  - Cache API에서 확인 후 실제 Storage URL 직접 반환
  - 브라우저 자체 캐싱 메커니즘 활용 (Cache API → HTTP 캐시 → 네트워크)
- **효과**:
  - 메모리 누수 제거
  - 모바일 안정성 향상
  - 빠른 페이지 전환에도 이미지 정상 표시

**5) 2026-01-20: useMemo + 재시도 로직 (최종 해결)**
- **증상**: Blob URL 방식으로 복원했지만 여전히 모바일에서 간헐적 로드 실패, "비타로" 로그가 타로 카드에서 발생
- **근본 원인**:
  - `currentResult` 객체가 매 렌더링마다 `allResults.find()`로 재생성되어 새로운 참조 생성
  - useEffect의 dependency에 `currentResult?.question_order` 등이 포함되어 있어 객체 참조 변경 시 불필요한 재실행
  - 빠른 페이지 전환 시 `currentResult`가 일시적으로 undefined가 되어 "비타로" 조건 트리거
  - 복잡한 Blob URL 생명주기 관리가 React 리렌더링과 타이밍 충돌
- **해결**:
  - `currentResult`를 `useMemo`로 래핑하여 객체 참조 안정화:
    ```typescript
    const currentResult = useMemo(() => {
      return allResults.find(r => r.question_order === currentQuestionOrder);
    }, [allResults, currentQuestionOrder]);
    ```
  - Blob URL 생명주기 관리 대신 **3단계 재시도 로직** 도입:
    1. 캐시 재시도 (최대 3회, 매번 새로운 Blob URL 생성)
    2. Storage URL 폴백 (직접 네트워크 요청)
    3. 에러 표시
  - `retryCount` state 추가로 재시도 횟수 관리
  - 이미지 로드 시작 시 `retryCount` 초기화
- **핵심 개선**:
  - useMemo로 불필요한 useEffect 재실행 방지 (객체 참조 안정화)
  - 재시도 로직으로 타이밍 이슈 우회 (복잡한 생명주기 관리 불필요)
  - 네트워크 폴백으로 최종 안정성 보장
- **커밋**: `0cf16a41` (feat: 타로 카드 이미지 로드 실패 시 자동 재시도 로직 추가)

**교훈**:
- 캐시 레이어 간 동기화 검증 필수 (메타데이터 ≠ 실제 데이터)
- 애니메이션 라이브러리는 이미지 로드 타이밍과 충돌 가능성 검토 필요
- Blob URL 사용 시 생명주기 관리 필수 (생성/해제)
- 모바일 환경의 메모리 제약을 고려한 최적화 전략 필요
- **⭐ React useEffect의 객체 dependency는 참조 변경 시 재실행됨** - 원시값(primitive) 사용하거나 useMemo로 참조 안정화 필수
- **⭐ 복잡한 생명주기 관리보다 재시도 로직이 더 안정적** - 타이밍 이슈가 많은 환경에서는 Retry 패턴이 더 효과적
- **⭐ 디버깅 시 상태 변화 타임라인 추적 필수** - 컴포넌트 리렌더링, useEffect 실행 순서를 로그로 추적해야 근본 원인 파악 가능

**영향 범위**:
- `src/lib/tarotImageCache.ts`: 캐시 로직 핵심, Blob URL 생성
- `src/components/UnifiedResultPage.tsx`: 타로 카드 결과 표시, useMemo + 재시도 로직
- `src/components/PurchaseHistoryPage.tsx`: 프리로드 최적화

---

## 2026-01-19

### 사주 정보 카드 구분자(|) 렌더링 방식 변경 (SVG → CSS div)
**결정**: `SajuCard.tsx`, `SajuManagementPage.tsx`의 구분자(|)를 SVG에서 순수 CSS div로 변경

**배경**:
- iPhone 모바일에서 사주 정보 카드의 구분자(|)가 페이지마다 다르게 렌더링되는 문제 발생
- SajuCard는 w-[1px] Tailwind 클래스 + SVG strokeWidth 사용
- SajuManagementPage는 w-[0.5px] + w-[12px] 혼용
- 동일한 구분자인데 두께가 다르게 표시됨 (일부는 보이지 않음)

**원인 분석**:
- Tailwind CSS v4의 arbitrary value (w-[1px], w-[0.5px])는 모바일 고해상도 디스플레이에서 예측 불가능하게 렌더링
- w-[1px]는 디바이스 픽셀 비율(2x~3x)에 따라 2~3픽셀로 확대되어 두껍게 보임
- w-[0.5px]는 일부 브라우저에서 렌더링되지 않거나 1px로 올림 처리됨
- SVG strokeWidth도 브라우저마다 다르게 해석

**해결 방법**:
```tsx
// Before - SVG 방식 (렌더링 불일치)
<svg width="1" height="12" viewBox="0 0 1 12">
  <line x1="0.5" y1="0" x2="0.5" y2="12" stroke="#D4D4D4" strokeWidth="0.7"/>
</svg>

// After - CSS div 방식 (렌더링 일관성)
<div
  className="h-[6px]"
  style={{
    width: '1px',
    backgroundColor: '#D4D4D4',
    borderRadius: '0.5px'
  }}
/>
```

**변경 내용**:
1. **높이 통일**: h-[12px] → h-[6px] (텍스트 베이스라인 16px의 37.5%)
2. **너비 명시**: inline style `width: '1px'` 사용 (Tailwind arbitrary value 대신)
3. **라운드 처리**: `borderRadius: '0.5px'` 추가 (양 끝을 부드럽게)
4. **색상**: `backgroundColor: '#D4D4D4'` 직접 지정

**적용 범위**:
- `SajuCard.tsx` - FreeSajuSelectPage, SajuSelectPage, SajuManagementPage에서 공통 사용
- `SajuManagementPage.tsx` - 내 사주 섹션, 함께 보는 사주 섹션 모두 적용

**트레이드오프**:
- ✅ 모든 모바일 디바이스에서 일관된 렌더링
- ✅ 코드 단순화 (SVG 제거)
- ✅ 디자인 시안과 일치 (h-[6px] + borderRadius)
- ⚠️ inline style 사용 (Tailwind 규칙 예외 - CLAUDE.md 2순위 해결책)

**교훈**:
- Tailwind CSS v4 arbitrary value는 모바일 고해상도 디스플레이에서 주의 필요
- 픽셀 단위 작업은 inline style로 명시적 지정이 안전
- 디자인 일관성이 중요한 요소는 CSS 기본 속성 사용 권장

**관련 커밋**:
- `20152598` - SajuCard.tsx 구분자 SVG → inline style 전환
- `8666f196` - SajuManagementPage.tsx 구분자 SVG 제거 → 단순 div
- `5cfc6ad7` - 구분자 높이 6px + borderRadius 0.5px 적용

---

### UnifiedResultPage에서 Framer Motion AnimatePresence 제거
**결정**: `UnifiedResultPage.tsx`에서 `AnimatePresence`와 `motion.div`를 제거하고 일반 `div`로 교체

**배경**:
- 운세 결과 페이지(`/result`)에서 모바일 터치 스크롤이 전혀 작동하지 않는 심각한 버그 발생
- 마우스로 스크롤바를 직접 드래그해야만 스크롤 가능
- iOS Safari, Android Chrome 모두에서 터치 스크롤 불가

**원인 분석**:
- `AnimatePresence mode="popLayout"`이 터치 이벤트를 가로채서 스크롤 컨테이너로 전달하지 않음
- Framer Motion의 layout 애니메이션이 스크롤 컨테이너의 터치 이벤트 처리를 방해
- 이전에도 동일한 문제가 발생하여 `mode="wait"`로 변경한 이력 있음 (#1598, #1599)

**시도한 해결 방법**:
1. `mode="wait"` → 공백 문제 발생 (exit 애니메이션 완료까지 대기)
2. `mode="popLayout"` → 터치 스크롤 불가
3. **최종 결정**: AnimatePresence 완전 제거

**변경 내용**:
```tsx
// Before - 터치 스크롤 불가
import { motion, AnimatePresence } from 'motion/react';

<AnimatePresence mode="popLayout" initial={false} custom={direction}>
  <motion.div
    key={`result-${currentQuestionOrder}`}
    custom={direction}
    variants={slideVariants}
    initial="enter"
    animate="center"
    exit="exit"
    transition={{ duration: 0.2, ease: "easeOut" }}
    className="bg-[#f9f9f9] rounded-[16px] p-[20px] w-full"
  >
    {/* 콘텐츠 */}
  </motion.div>
</AnimatePresence>

// After - 터치 스크롤 정상 작동
<div
  key={`result-${currentQuestionOrder}`}
  className="bg-[#f9f9f9] rounded-[16px] p-[20px] w-full"
>
  {/* 콘텐츠 */}
</div>
```

**제거된 코드**:
- `import { motion, AnimatePresence } from 'motion/react'`
- `slideVariants` 객체
- `direction` 계산 로직
- `prevOrderRef` ref

**트레이드오프**:
- ❌ 질문 전환 시 슬라이드 애니메이션 없음
- ✅ 터치 스크롤 100% 정상 작동
- ✅ 코드 단순화 (불필요한 상태/ref 제거)
- ✅ 번들 사이즈 감소 (motion import 제거)

**영향 범위**:
- `/components/UnifiedResultPage.tsx` - 운세 결과 페이지

**교훈**:
- Framer Motion의 AnimatePresence는 스크롤 컨테이너 내부에서 사용 시 터치 이벤트 충돌 주의
- 스크롤이 필수인 페이지에서는 CSS transition이나 애니메이션 없는 전환 권장
- 모바일 터치 스크롤 테스트는 실제 기기에서 반드시 수행

---

### ResultCompletePage iOS Safari 스크롤 바운스 버그 수정
**결정**: `ResultCompletePage.tsx`에 `fixed inset-0` + `flex-col` 레이아웃 패턴 적용하여 스크롤 바운스 제거

**배경**:
- "풀이는 여기까지예요" 페이지에서 아래로 스크롤 시 화면이 위아래로 여러번 빠르게 바운스하는 버그 발생
- iOS Safari에서 특히 심각하게 발생 (Android Chrome에서도 동일)
- 이전에 SajuResultPage, SajuSelectPage 등에서 동일한 증상 해결한 이력 있음 (commit: `132ef2d0`)

**원인 분석**:
- `relative min-h-screen` 레이아웃 사용 시 iOS Safari가 페이지 전체를 스크롤 영역으로 인식
- `overscrollBehaviorY: 'none'`만으로는 iOS Safari 바운스 효과 완전히 제거 불가
- 페이지 전체가 고정되지 않고 유동적으로 움직이면서 바운스 발생

**해결 방법 (SajuSelectPage 패턴 재사용)**:
```tsx
// Before - 바운스 발생
<div className="bg-white relative min-h-screen w-full flex justify-center">
  <div className="w-full max-w-[440px] relative">
    <div className="bg-white h-[52px] sticky top-0 z-20 w-full">
      {/* Top Navigation */}
    </div>
    <motion.div className="flex flex-col gap-[32px] items-center w-full max-w-[440px] mx-auto pb-[140px]">
      {/* Main Content */}
    </motion.div>
  </div>
</div>

// After - 바운스 제거
<div className="bg-white fixed inset-0 flex justify-center">
  <div className="w-full max-w-[440px] h-full flex flex-col bg-white">
    {/* Top Navigation - shrink-0로 고정 높이 */}
    <div className="bg-white h-[52px] shrink-0 z-20 w-full">
      {/* Navigation */}
    </div>

    {/* Main Content - flex-1 overflow-auto로 스크롤 영역 설정 */}
    <div className="flex-1 overflow-auto w-full">
      <motion.div className="flex flex-col gap-[32px] items-center w-full max-w-[440px] mx-auto pb-[140px]">
        {/* Content */}
      </motion.div>
    </div>
  </div>
</div>
```

**변경 내용**:
1. **Layout 구조 변경**:
   - `relative min-h-screen` → `fixed inset-0 flex justify-center`
   - `max-w-[440px] relative` → `max-w-[440px] h-full flex flex-col bg-white`

2. **Top Navigation**:
   - `sticky top-0` → `shrink-0` (고정 높이)

3. **Main Content 영역**:
   - 새로운 wrapper div 추가: `flex-1 overflow-auto w-full`
   - 이 영역만 스크롤되도록 설정

4. **불필요한 코드 제거**:
   - `overscrollBehaviorY` useEffect 제거 (fixed layout에서는 불필요)

**동작 원리**:
```
fixed inset-0 (화면 전체 고정)
└── max-w-[440px] h-full flex flex-col (세로 플렉스 컨테이너)
    ├── Top Navigation (shrink-0 - 고정 높이)
    ├── Main Content (flex-1 overflow-auto - 스크롤 영역)
    └── Bottom Home Indicator (fixed)
```

**트레이드오프**:
- ✅ iOS Safari 스크롤 바운스 완전히 제거
- ✅ 안정적인 레이아웃 (화면 전체 고정)
- ✅ 코드 단순화 (불필요한 useEffect 제거)
- ✅ 동일한 패턴을 여러 페이지에서 재사용 가능

**영향 범위**:
- `/components/ResultCompletePage.tsx` - 풀이 완료 페이지

**참고 커밋**:
- `132ef2d0`: 사주 정보 선택 페이지 스크롤 바운스 버그 수정 v2
- 동일한 패턴이 적용된 페이지: `SajuSelectPage.tsx`, `FreeSajuSelectPage.tsx`, `ProfilePage.tsx`

**교훈**:
- iOS Safari 스크롤 바운스는 `fixed inset-0` + `flex-col` 레이아웃으로 해결 가능
- `overscrollBehaviorY: 'none'`만으로는 iOS Safari 바운스 완전히 제거 불가
- 검증된 패턴을 재사용하면 빠르고 안정적으로 문제 해결 가능
- 스크롤 관련 버그는 실제 iOS 기기에서 반드시 테스트 필요

---

## 2026-01-17

### order_results 테이블에서 tarot_card_id 컬럼 제거
**결정**: `order_results` 테이블에서 `tarot_card_id` 컬럼 제거, `tarot_card_name`만 사용

**배경**:
- `tarot_card_id`는 초기 설계에서 타로 카드를 식별하기 위해 추가된 컬럼
- 실제 구현에서는 `tarot_card_name` (문자열)으로 카드를 식별하고 이미지 URL 생성
- `tarot_card_id`는 실제 코드에서 사용되지 않음 (읽기/쓰기 없음)
- 불필요한 컬럼으로 인한 혼란 방지 필요

**제거된 컬럼**:
```sql
-- order_results 테이블
tarot_card_id TEXT  -- ❌ 제거됨 (사용 안 함)
```

**계속 사용되는 컬럼**:
```sql
-- order_results 테이블
tarot_card_name TEXT        -- ✅ 카드 이름 (예: "The Fool", "Ace of Cups")
tarot_card_image_url TEXT   -- ✅ Supabase Storage URL
```

**영향 범위**:
- ✅ 프론트엔드: 변경 없음 (tarot_card_id 사용 안 함)
- ✅ Edge Functions: 변경 없음 (tarot_card_name만 사용)
- ✅ 레거시 코드: _backup 폴더의 TarotResultPage.tsx, SajuResultPage.tsx에만 존재

**참고**:
- 타로 카드 이미지 URL 생성: `/lib/tarotCards.ts`의 `getTarotCardImageUrl(cardName)` 함수 사용
- 카드 이름으로 Supabase Storage URL 직접 생성 가능

---

### 사주 정보 선택 페이지: 캐시 기반 즉시 렌더링 (무료/유료/프로필 통합)
**결정**: 무료 콘텐츠, 유료 콘텐츠, 프로필 페이지 모두에서 `saju_records_cache` localStorage 캐시를 활용하여 API 호출 없이 즉시 렌더링

**배경**:
- 0원 결제 후 사주 선택 페이지 이동 시 불필요한 로딩 페이지가 표시됨
- PaymentNew → onPurchase 콜백에서 매번 DB API 쿼리 실행 (~200ms)
- 사주 정보는 이미 localStorage 캐시에 존재하는데도 재조회

**문제 흐름 (Before)**:
```
1. PaymentNew (0원 결제 완료)
   ↓
2. onPurchase 콜백 실행
   ↓ DB API 쿼리 (사주 존재 여부 확인)
   ↓ "잠시만 기다려주세요" 로딩 표시
   ↓
3. SajuSelectPage 이동
   ↓ 캐시 있음 → API 스킵 (즉시 렌더링)
   ↓
❌ 문제: 이미 캐시가 있는데 로딩이 표시됨
```

**해결 방법**:

#### 1. PaymentNew.tsx - 결제 시작 전 캐시 확인
```typescript
// ⚡ 0원 결제 + 캐시 있음 → 로딩 표시 스킵
let shouldSkipLoading = false;
if (totalPrice === 0) {
  const cachedJson = localStorage.getItem('saju_records_cache');
  if (cachedJson) {
    const cached = JSON.parse(cachedJson);
    shouldSkipLoading = cached.length > 0;
    console.log('🚀 [PaymentNew] 캐시 있음 → 로딩 표시 스킵');
  }
}

// 조건부 로딩 표시 (캐시 없을 때만)
if (!shouldSkipLoading) {
  setIsProcessingPayment(true);
}

// ... 결제 로직 ...

// 캐시 여부에 따라 페이지 이동
if (shouldSkipLoading) {
  onPurchase(); // 즉시 이동
} else {
  setTimeout(() => onPurchase(), 50); // 로딩 유지
}
```

#### 2. App.tsx - onPurchase 콜백에서 캐시 우선 확인
```typescript
onPurchase={async () => {
  // 🚀 1순위: 캐시 확인 (동기, 즉시)
  const cachedJson = localStorage.getItem('saju_records_cache');
  let hasSaju = false;

  if (cachedJson) {
    const cached = JSON.parse(cachedJson);
    hasSaju = cached.length > 0;
    console.log('🚀 캐시 발견 → API 쿼리 스킵');
  }

  // 🔍 2순위: 캐시 없을 때만 API 쿼리
  if (!hasSaju) {
    const { data: mySaju } = await supabase
      .from('saju_records')
      .select('id')
      .eq('user_id', user.id)
      .eq('is_primary', true)
      .maybeSingle();
    hasSaju = !!mySaju;
  }

  // 페이지 이동
  if (hasSaju) {
    navigate(`/product/${id}/saju-select`);
  } else {
    navigate(`/product/${id}/birthinfo`);
  }
}}
```

**핵심 원리**:
1. **PaymentNew**: 결제 시작 전 캐시 확인 → 캐시 있으면 `isProcessingPayment` 설정 안 함
2. **App.tsx**: `onPurchase` 콜백에서 캐시 우선 확인 → API는 폴백으로만 사용
3. **SajuSelectPage**: 기존 캐시 기반 렌더링 로직 유지 (변경 없음)

**캐시 키**:
- `saju_records_cache` - 무료/유료 공통 사주 정보 캐시
- 사주 추가/수정/삭제 시 자동 업데이트

**동작 흐름 (After)**:
```
1. PaymentNew (0원 결제 완료)
   ↓ 캐시 확인 → 있음
   ↓ isProcessingPayment = false (로딩 스킵)
   ↓
2. onPurchase 콜백 실행
   ↓ 캐시 확인 → 있음
   ↓ API 쿼리 스킵
   ↓
3. SajuSelectPage 즉시 이동
   ↓ 캐시로 즉시 렌더링
   ↓
✅ 결과: 로딩 없이 부드러운 페이지 전환
```

**성능 개선**:
| 상황 | Before | After | 개선 |
|------|--------|-------|------|
| **0원 결제 + 캐시 있음** | ~200ms API + 로딩 표시 | 즉시 이동 | 100% ⚡ |
| **0원 결제 + 캐시 없음** | ~200ms API + 로딩 표시 | ~200ms API + 로딩 표시 | 동일 |

**적용 범위**:
- `/components/PaymentNew.tsx` (550-660번 줄) - 캐시 확인 로직 추가
- `/src/App.tsx` (518-582번 줄) - PaymentNewPage의 두 onPurchase 콜백 수정
- `/components/FreeSajuSelectPage.tsx` - 기존 캐시 기반 렌더링 유지
- `/components/SajuSelectPage.tsx` - 기존 캐시 기반 렌더링 유지
- `/components/ProfilePage.tsx` - 기존 캐시 기반 렌더링 유지

**사용자 경험 개선**:
- ✅ 0원 결제 후 "잠시만 기다려주세요" 로딩 완전히 제거
- ✅ 결제 페이지 → 사주 선택 페이지 전환이 부드럽고 즉시 완료
- ✅ iOS Safari 스와이프 뒤로가기 시에도 캐시로 즉시 렌더링
- ✅ 무료/유료/프로필 모든 플로우에서 일관된 빠른 UX

**테스트 완료**:
- 0원 결제 (쿠폰 전액 할인) → 사주 선택 ✅
- 사주 캐시 없는 경우 → 사주 입력 ✅
- iOS Safari 스와이프 뒤로가기 ✅

---

### 타로 카드 선택 로직: 백엔드 사전 선택 vs 프론트엔드 UI 연출 분리 설계
**결정**: 타로 카드 선택을 **백엔드 사전 선택 (실제 로직)** + **프론트엔드 UI 연출 (재미 요소)** 로 분리

**배경**:
- 타로 운세 서비스에서 "카드 선택"은 중요한 사용자 경험 요소
- 하지만 AI 해석 생성은 LoadingPage 시점에 완료되어야 함 (결과 페이지 즉시 표시)
- 사용자가 카드를 "선택"하는 재미와 AI 생성 효율성을 모두 충족해야 함

**설계 철학**:
> **"사용자는 카드를 선택한다고 느끼지만, 실제로는 이미 결정되어 있다"**

**시스템 구조**:

#### 1. 타로 카드 덱 구조 (78장)
```typescript
// /lib/tarotCards.ts
export const TAROT_DECK = [
  // 메이저 아르카나 (22장)
  { id: 'major-0', name: 'The Fool', category: 'major' },
  { id: 'major-1', name: 'The Magician', category: 'major' },
  // ... 20장 더

  // 마이너 아르카나 (56장)
  // Wands (14장)
  { id: 'wands-ace', name: 'Ace of Wands', category: 'wands' },
  { id: 'wands-2', name: 'Two of Wands', category: 'wands' },
  // ... 12장 더

  // Cups (14장), Swords (14장), Pentacles (14장)
  // ...
];

// 질문 개수만큼 중복 없이 랜덤 선택
export function getTarotCardsForQuestions(questionCount: number) {
  const shuffled = [...TAROT_DECK].sort(() => Math.random() - 0.5);
  const selected = shuffled.slice(0, questionCount);
  return selected.reduce((acc, card, index) => {
    acc[index + 1] = card.name; // { 1: "The Fool", 2: "Ace of Cups", ... }
    return acc;
  }, {} as Record<number, string>);
}
```

#### 2. 백엔드 사전 선택 (LoadingPage 시점)
```typescript
// supabase/functions/generate-content-answers/index.ts
// ⚡ 질문 개수만큼 타로 카드 미리 선택
const tarotCards = getTarotCardsForQuestions(questions.length);
console.log('🎴 [타로] 사전 선택된 카드:', tarotCards);
// { 1: "The Fool", 2: "Ace of Cups", 3: "The High Priestess" }

// 각 질문마다 카드 할당 + AI 해석 생성
for (const question of questions) {
  const selectedCard = tarotCards[question.question_number];

  // AI 타로 해석 생성
  const answer = await generateTarotAnswer({
    question: question.question_text,
    tarotCard: selectedCard,
    // ...
  });

  // order_results에 저장
  await supabase.from('order_results').insert({
    order_id: orderId,
    question_number: question.question_number,
    question_text: question.question_text,
    answer_text: answer,
    tarot_card_name: selectedCard, // ⭐ 카드명 함께 저장
  });
}
```

**핵심**: AI 해석은 LoadingPage 시점에 모두 완료 → 사용자는 "기다림 없이" 결과 확인 가능

#### 3. 프론트엔드 UI 연출 (TarotShufflePage)
```typescript
// /components/TarotGame.tsx (458줄, 5단계 애니메이션)
// ⚠️ 이 컴포넌트는 순수하게 "재미"를 위한 UI 연출

const stages = [
  'idle',       // 21장 겹쳐진 상태
  'mixing',     // 카드 섞기 애니메이션 (5가지 패턴 랜덤)
  'gathered',   // 왼쪽 하단으로 모으기
  'spreading',  // 부채꼴 펼치기 (아치형)
  'selected',   // 카드 1장 선택
];

// 사용자가 "선택"한 카드는 무시됨!
const handleCardClick = (index: number) => {
  setSelectedCardIndex(index);
  // ⚠️ 실제로는 백엔드에서 이미 선택된 카드를 보여줄 뿐
};
```

**핵심**: 21장 더미 카드로 시각적 재미 제공, 실제 선택과는 무관

#### 4. 결과 표시 (SajuResultPage)
```typescript
// order_results에서 사전 선택된 카드 표시
const { data: result } = await supabase
  .from('order_results')
  .select('tarot_card_name, answer_text')
  .eq('order_id', orderId)
  .eq('question_number', currentQuestion)
  .single();

// 사용자가 TarotGame에서 "선택"한 카드는 무시
// 백엔드에서 사전 선택한 카드를 표시
<TarotCardImage cardName={result.tarot_card_name} />
<AnswerText>{result.answer_text}</AnswerText>
```

**전체 플로우**:
```
1. 결제 완료 → LoadingPage 진입
   ↓
2. Edge Function 호출 (generate-content-answers)
   ├─ 질문 3개라면 78장 덱에서 3장 랜덤 선택
   ├─ { 1: "The Fool", 2: "Ace of Cups", 3: "The High Priestess" }
   ├─ 각 카드로 AI 해석 생성
   └─ order_results에 (질문, 카드명, 해석) 저장
   ↓
3. LoadingPage 폴링 → 완료 감지
   ↓
4. TarotShufflePage 이동 (1번째 질문)
   ├─ TarotGame 애니메이션 연출 (21장 더미 카드)
   ├─ 사용자가 카드 "선택" (재미 요소)
   └─ "다음" 버튼 클릭
   ↓
5. SajuResultPage (1번째 질문 결과)
   ├─ order_results에서 1번 질문 카드 조회
   ├─ "The Fool" 이미지 + AI 해석 표시
   └─ (사용자가 "선택"한 카드는 무시됨)
   ↓
6. 다음 질문 있으면 다시 4번으로 (2번째 질문)
```

**왜 이렇게 설계했는가?**

| 요구사항 | 해결 방법 | 이유 |
|----------|-----------|------|
| **빠른 결과 표시** | 백엔드 사전 선택 + AI 생성 | LoadingPage에서 모든 해석 완료 → 결과 페이지 즉시 표시 |
| **사용자 재미** | TarotGame UI 연출 | 카드 섞기, 선택 애니메이션으로 몰입감 제공 |
| **일관성 유지** | 카드명 order_results 저장 | 타이틀과 내용의 카드명 불일치 방지 |
| **재생성 대응** | order_results 우선 조회 | 사용자가 선택한 카드로 재생성 가능 |

**트레이드오프**:
- ✅ **장점**: 사용자는 기다림 없이 즉시 결과 확인 + 카드 선택 재미
- ⚠️ **단점**: 사용자가 "선택"한 카드와 실제 카드가 다를 수 있음 (하지만 사용자는 모름)

**핵심 파일**:
- `/lib/tarotCards.ts` - 78장 타로 덱 + 유틸리티 함수
- `/components/TarotShufflePage.tsx` - 타로 셔플 페이지 (라우트)
- `/components/TarotGame.tsx` - 카드 섞기 + 선택 UI 연출 (458줄, 5단계 애니메이션)
- `supabase/functions/generate-content-answers/index.ts` - 백엔드 사전 선택 + AI 생성

**사용자 경험**:
- ✅ "내가 선택한 카드로 운세를 봤다"는 느낌
- ✅ 기다림 없이 즉시 결과 확인 (AI 생성은 이미 완료)
- ✅ 시각적으로 풍부한 카드 선택 애니메이션

**영향 범위**: 타로 운세 전체 플로우

---

## 2026-01-16

### 타로 카드 이름 일관성 버그 수정 (AI 생성 시 사용자 선택 카드 사용)
**결정**: `generate-content-answers` Edge Function에서 타로 풀이 생성 시 `order_results` 테이블의 `tarot_card_name` (사용자가 선택한 카드)을 우선 사용하도록 수정

**배경**:
- 사용자가 타로 카드 셔플 페이지에서 카드를 선택하고 저장 (예: "The High Priestess")
- 하지만 AI가 생성한 풀이에서는 다른 카드 이름이 나타남 (예: "Three of Wands")
- 결과 페이지의 타이틀 카드명과 내용의 카드명이 불일치하여 사용자 혼란 발생

**근본 원인**:
```typescript
// ❌ 문제: master_content_questions.tarot_cards 값이 null이라 AI가 랜덤으로 카드 선택
response = await fetchWithTimeout(`${supabaseUrl}/functions/v1/generate-tarot-answer`, {
  body: JSON.stringify({
    tarotCards: question.tarot_cards  // null → AI가 임의로 선택
  })
})
```

**문제 흐름**:
```
1. 사용자 카드 선택 (TarotShufflePage)
   ↓ order_results.tarot_card_name = "The High Priestess" 저장

2. AI 생성 요청 (generate-content-answers)
   ↓ question.tarot_cards = null 전달

3. AI 랜덤 선택 (generate-tarot-answer)
   ↓ "Three of Wands"로 풀이 생성

4. 결과 불일치 ❌
   - 타이틀: "The High Priestess"
   - 내용: "Three of Wands"
```

**해결 방법**:
```typescript
// ✅ 해결: order_results에서 사용자가 선택한 카드 먼저 확인
let selectedTarotCard = question.tarot_cards || null;

// order_results에 이미 선택된 카드가 있는지 확인
const { data: existingCard } = await supabase
  .from('order_results')
  .select('tarot_card_name')
  .eq('order_id', orderId)
  .eq('question_id', question.id)
  .single();

if (existingCard?.tarot_card_name) {
  selectedTarotCard = existingCard.tarot_card_name;
  console.log(`🎴 [타로] 사용자가 선택한 카드 사용: ${selectedTarotCard}`);
} else {
  console.log(`🎴 [타로] 카드 지정 없음 → AI가 랜덤 선택`);
}

// AI에 선택된 카드 전달
response = await fetchWithTimeout(`${supabaseUrl}/functions/v1/generate-tarot-answer`, {
  body: JSON.stringify({
    tarotCards: selectedTarotCard  // 사용자 선택 카드 또는 null
  })
})
```

**수정 파일**:
- `supabase/functions/generate-content-answers/index.ts` (291-324번 줄)

**배포**:
- Staging: `hyltbeewxaqashyivilu` ✅
- Production: `kcthtpmxffppfbkjjkub` ✅

**영향 범위**:
- 타로 풀이 결과 페이지: 타이틀과 내용의 카드명이 일치 ✅
- 사용자 경험: 선택한 카드에 대한 정확한 풀이 제공 ✅
- 재생성: 기존 주문은 재생성 시 order_results의 카드명 사용 ✅

**예상 동작 (수정 후)**:
```
1. 사용자 카드 선택
   ↓ order_results.tarot_card_name = "The High Priestess"

2. AI 생성 요청
   ↓ order_results 조회 → "The High Priestess" 발견

3. AI 생성
   ↓ "The High Priestess"로 풀이 생성

4. 결과 일치 ✅
   - 타이틀: "The High Priestess"
   - 내용: "The High Priestess"
```

---

### Tailwind CSS v4 Arbitrary Value 제한 및 Inline Style 사용
**결정**: Tailwind CSS v4에서 arbitrary value가 일부 상황에서 작동하지 않을 때 inline style 사용 허용

**배경**:
- Tailwind CSS v4로 업그레이드 후 일부 arbitrary value가 런타임에 적용되지 않는 문제 발견
- 특히 HEX 색상 값 (`bg-[#f0f8f8]`), 픽셀 단위 패딩 (`px-[7px]`) 등이 적용 안 됨
- 브라우저 개발자 도구에서 확인 시 해당 클래스가 생성되지 않음
- CSS 캐시 클리어, 개발 서버 재시작(`--force` 플래그), 하드 리프레시 모두 시도했으나 해결 안 됨

**⚠️ 근본 원인 (2026-01-16 FigmaMake 통합 시 발견)**:
문제의 근본 원인은 Tailwind v4 자체가 아니라 **`globals.css`의 base typography 스타일과 Tailwind 클래스 간의 CSS 우선순위 충돌**입니다.

```css
/* globals.css에 정의된 base 스타일이 Tailwind 유틸리티 클래스를 덮어씀 */
/* 예: p, span 등에 정의된 font-family, line-height 등 */
```

이 base 스타일들이 Tailwind의 `text-[15px]`, `font-[500]`, `leading-[22px]` 등의 유틸리티 클래스보다 **CSS 우선순위가 높거나 충돌**하여 Tailwind 클래스가 적용되지 않습니다.

**증상**:
- 텍스트가 세로로 표시됨 (line-height 미적용)
- 폰트 크기가 의도와 다름
- 체크마크 등 SVG 아이콘이 비정상적으로 커짐
- 전체 레이아웃이 깨짐

**문제 사례**:
```tsx
// ❌ 작동하지 않음 - globals.css base 스타일에 덮어씌워짐
<div className="bg-[#f0f8f8] px-[7px] py-[7px]">
  <p className="text-[15px] font-[500] leading-[22px] text-[#368683]">태그</p>
</div>

// ✅ 해결책: 타이포그래피/색상은 inline style 사용
<div className="flex items-center justify-center"
     style={{ backgroundColor: '#f0f8f8', padding: '7px', borderRadius: '999px' }}>
  <p style={{
    fontFamily: 'Pretendard Variable',
    fontSize: '15px',
    fontWeight: 500,
    lineHeight: '22px',
    color: '#368683'
  }}>태그</p>
</div>
```

**속성별 사용 가이드**:
| 속성 유형 | 권장 방법 | 이유 |
|----------|----------|------|
| 타이포그래피 (fontSize, fontWeight, lineHeight, letterSpacing) | **inline style 필수** | globals.css 충돌 |
| 색상 (color, backgroundColor, borderColor) | **inline style 필수** | arbitrary value 미작동 |
| 레이아웃 (flex, grid, items-center, justify-between) | Tailwind OK | 충돌 없음 |
| 포지셔닝 (relative, absolute, fixed) | Tailwind OK | 충돌 없음 |
| 크기 (width, height) | inline style 권장 | arbitrary value 불안정 |
| 간격 (gap, padding, margin) | Tailwind 토큰 OK, arbitrary는 inline | 일부 arbitrary 미작동 |
| 테두리 (rounded, border) | Tailwind OK | 대부분 작동 |

**해결 방법 우선순위**:
1. **1순위**: globals.css에 CSS 변수로 정의 후 Tailwind 토큰 사용
   ```css
   :root {
     --color-nadaum-tag-bg: #f0f8f8;
     --color-nadaum-tag-text: #368683;
   }
   ```
   ```tsx
   <div className="bg-[var(--color-nadaum-tag-bg)]">
   ```

2. **2순위**: inline style 사용 (FigmaMake 통합 등 외부 코드에 권장)
   ```tsx
   <div style={{ backgroundColor: '#f0f8f8' }}>
   ```

**적용 파일**:
- `src/components/ProfilePage.tsx`: 나다운 태그 섹션
- `src/components/NadaumRecordPage.tsx`: FigmaMake 통합 컴포넌트
- `src/imports/DuckIllustration.tsx`: FigmaMake 일러스트 컴포넌트

**개발 원칙 수정**:
- CLAUDE.md 업데이트: Tailwind arbitrary value 작동하지 않을 시 inline style 예외 허용
- 특히 **FigmaMake 통합 시 타이포그래피/색상은 반드시 inline style 사용**

**관련 파일**:
- `src/components/ProfilePage.tsx`
- `src/components/NadaumRecordPage.tsx`
- `src/imports/DuckIllustration.tsx`
- `CLAUDE.md` (스타일링 규칙 업데이트)

---

### FigmaMake 통합 시 스타일 충돌 문제 및 해결
**결정**: FigmaMake 생성 코드 통합 시 타이포그래피/색상 속성은 반드시 inline style로 변환

**배경**:
- FigmaMake(Figma 플러그인)로 '나다움 기록하기' (ND_NR_001) 화면 퍼블리싱 후 프로젝트에 통합 시도
- FigmaMake 자체 미리보기에서는 정상 렌더링
- 프로젝트에 통합 후 **디자인이 완전히 깨지는 현상** 발생

**증상 상세**:
1. **텍스트 세로 표시**: `text-[15px]`, `leading-[22px]` 등이 적용되지 않아 글자가 세로로 나열
2. **체크마크 비대화**: `size-7` 클래스가 의도대로 작동하지 않아 체크 아이콘이 화면을 가득 채움
3. **색상 미적용**: `bg-[#f0f8f8]`, `text-[#368683]` 등 배경색/글자색이 적용 안 됨
4. **전체 레이아웃 붕괴**: 버튼, 카드, 일러스트 배치가 모두 깨짐

**원인**:
FigmaMake는 Tailwind arbitrary value를 적극 사용하여 코드 생성:
```tsx
// FigmaMake 생성 코드 예시
<p className="text-[15px] font-medium leading-[25.5px] tracking-[-0.3px] text-[#368683]">
  설득력 있는
</p>
```

하지만 이 프로젝트의 `globals.css`에 정의된 base typography 스타일이 Tailwind 클래스를 덮어쓰기 때문에 스타일이 적용되지 않음.

**해결 과정**:
1. ❌ **시도 1**: FigmaMake 원본 코드 그대로 복사 → 실패 (디자인 깨짐)
2. ❌ **시도 2**: Tailwind v4 캐시 클리어, 서버 재시작 → 실패
3. ✅ **시도 3**: 타이포그래피/색상을 모두 inline style로 변환 → 성공

**최종 해결책 - 변환 패턴**:
```tsx
// ❌ FigmaMake 원본 (작동 안 함)
<p className="text-[15px] font-medium leading-[25.5px] tracking-[-0.3px] text-[#368683]">
  설득력 있는
</p>

// ✅ 변환 후 (정상 작동)
<p style={{
  fontFamily: 'Pretendard Variable',
  fontSize: '15px',
  fontWeight: 500,
  lineHeight: '25.5px',
  letterSpacing: '-0.3px',
  color: '#368683'
}}>
  설득력 있는
</p>
```

**FigmaMake 권장 프롬프트**:
향후 FigmaMake 사용 시 아래 프롬프트를 추가하면 변환 작업 최소화:
```
코드 생성 규칙:
1. 모든 텍스트 스타일(fontSize, fontWeight, lineHeight, color, letterSpacing)은
   반드시 inline style로 작성하세요. Tailwind의 text-*, font-*, leading-* 클래스를 사용하지 마세요.
2. 배경색, 테두리색 등 색상 관련 속성도 inline style로 작성하세요.
3. 레이아웃(flex, grid, items-center 등)은 Tailwind 클래스를 사용해도 됩니다.
4. fontFamily는 'Pretendard Variable'을 사용하세요.
5. gap, padding 등 spacing에서 arbitrary value가 필요하면 inline style을 사용하세요.
```

**통합 체크리스트**:
- [ ] `text-[*]`, `font-[*]`, `leading-[*]`, `tracking-[*]` → inline style 변환
- [ ] `bg-[#...]`, `text-[#...]`, `border-[#...]` → inline style 변환
- [ ] `size-*` 클래스 → `width`, `height` inline style 변환
- [ ] SVG path 데이터 → `src/imports/` 폴더에 별도 파일로 분리
- [ ] 일러스트/아이콘 컴포넌트 → inline style 전면 적용

**생성된 파일**:
- `src/components/NadaumRecordPage.tsx` - 메인 페이지 컴포넌트
- `src/imports/nadaum-svg-paths.ts` - SVG 경로 데이터 모듈
- `src/imports/DuckIllustration.tsx` - 오리 캐릭터 일러스트 컴포넌트

**교훈**:
1. **외부 도구 생성 코드는 그대로 사용 불가** - 프로젝트 환경에 맞게 변환 필수
2. **globals.css base 스타일 주의** - Tailwind 클래스와 충돌 가능성 항상 고려
3. **미리보기 ≠ 실제 환경** - FigmaMake 미리보기가 정상이어도 통합 후 테스트 필수
4. **레이아웃은 Tailwind, 스타일링은 inline** - 하이브리드 접근법이 가장 안정적

**관련 파일**:
- `src/components/NadaumRecordPage.tsx`
- `src/imports/DuckIllustration.tsx`
- `src/imports/nadaum-svg-paths.ts`
- `CLAUDE.md` (FigmaMake 통합 가이드 섹션 추가)

---

### 나다운 태그 기능 Feature Flag (DEV)
**결정**: 나다운 태그 섹션을 `DEV` 플래그로 감싸 프로덕션에서 숨김

**배경**:
- 나다운 태그는 개발/기획 중인 신규 기능
- 스테이징 환경에서는 테스트를 위해 노출 필요
- 프로덕션(nadaunse.com)에서는 완전히 숨김 필요

**구현**:
```tsx
{/* 나다운 태그 Section - 프로덕션에서는 숨김 (스테이징/개발 환경에서만 표시) */}
{DEV && (
  <>
    <motion.div>나다운 태그 UI</motion.div>
  </>
)}
```

**환경별 노출 여부**:
- ✅ **로컬(localhost)**: 표시
- ✅ **스테이징(기타 figma.site)**: 표시
- ❌ **프로덕션(nadaunse.com, www.nadaunse.com, nadaunse.figma.site)**: 숨김

**적용 파일**:
- `src/components/ProfilePage.tsx` (604-661번 줄)

**영향 범위**:
- ProfilePage 마이페이지
- 나다운 태그 관련 신규 기능 개발 시 동일 패턴 적용

---

### 결제 오버레이 감지 로직 개선 (보이는 요소만 감지)
**결정**: PaymentNew.tsx의 결제 오버레이 감지 로직에서 `display: none` 또는 `visibility: hidden` 상태의 iframe/div를 무시하도록 개선

**배경**:
- 카카오페이 결제 시 숨겨진 본인인증 iframe(`display: none`)도 결제 오버레이로 감지되는 버그 발견
- 실제 결제 QR 화면이 아닌 숨겨진 iframe 감지로 "결제 페이지로 이동중" 로딩이 해제되지 않음
- 사용자는 무한 로딩 화면만 보고 실제 결제 UI를 볼 수 없음

**문제 코드**:
```typescript
// ❌ 문제: 숨겨진 iframe도 감지됨
allIframes.forEach(iframe => {
  const src = iframe.getAttribute('src') || '';
  if (src.includes('iamport') || src.includes('kakaopay')) {
    paymentFrame = iframe;  // display:none인 iframe도 감지!
  }
});
```

**로그 증거**:
```
✅ [PaymentNew] 결제 오버레이 발견: <iframe ... style="display: none;">
```

**해결 방법**:
```typescript
// ✅ 해결: 실제로 보이는 요소만 감지
allIframes.forEach(iframe => {
  const src = iframe.getAttribute('src') || '';
  const isVisible = iframe.offsetParent !== null &&
                    getComputedStyle(iframe).display !== 'none' &&
                    getComputedStyle(iframe).visibility !== 'hidden';

  if (isVisible && (src.includes('iamport') || src.includes('kakaopay'))) {
    paymentFrame = iframe;
  }
});
```

**visibility 체크 3단계**:
1. `offsetParent !== null`: DOM에서 실제 렌더링되는지 확인
2. `display !== 'none'`: CSS display 속성 확인
3. `visibility !== 'hidden'`: CSS visibility 속성 확인

**적용 범위**:
- `startPaymentOverlayWatch()` 함수: iframe 감지 로직 (131-146번 줄)
- `startPaymentOverlayWatch()` 함수: div 오버레이 감지 로직 (148-166번 줄)
- `isPaymentOverlayOpen()` 함수: iframe 감지 로직 (225-240번 줄)
- `isPaymentOverlayOpen()` 함수: div 오버레이 감지 로직 (242-260번 줄)

**영향**:
- 결제 오버레이 감지 정확도 향상
- 무한 로딩 버그 해결
- 카카오페이/다날 등 모든 PG사에 동일하게 적용

**적용 파일**:
- `src/components/PaymentNew.tsx`

---

### 0원 결제 시 로딩 UX 개선
**결정**: 0원 결제(쿠폰으로 100% 할인) 시 "결제 페이지로 이동중" 로딩을 표시하지 않고 바로 주문 처리

**배경**:
- 0원 결제는 PG(포트원) 호출 없이 바로 주문 저장 후 다음 단계로 이동
- 기존 로직: 모든 결제에서 `setIsProcessingPayment(true)` 호출 → "결제 페이지로 이동중" 표시
- 0원 결제 시 불필요한 로딩이 2번 표시되는 혼란스러운 UX
  1. "결제 페이지로 이동중" (불필요)
  2. "잠시만 기다려주세요" (실제 로딩)

**개선 전 플로우**:
```
0원 구매 클릭 → "결제 페이지로 이동중" → "잠시만 기다려주세요" → 결과 페이지
                     ↑ 불필요한 로딩
```

**개선 후 플로우**:
```
0원 구매 클릭 → "잠시만 기다려주세요" → 결과 페이지
```

**구현**:
```typescript
// handlePurchaseClick()
const finalContentId = contentId || productId;

// 0원 결제는 로딩 없이 바로 처리
if (totalPrice === 0) {
  // setIsProcessingPayment(true) 호출 없음 ✅
  try {
    const savedOrder = await saveOrder({...});
    onPurchase(); // "잠시만 기다려주세요" 표시
  } catch (error) {
    setIsProcessingPayment(false);
  }
  return;
}

// 유료 결제만 로딩 표시
setIsProcessingPayment(true);  // ✅ 여기서만 호출
console.log('🔄 [PaymentNew] 유료 결제 처리 시작');
```

**로딩 표시 조건 정리**:
| 결제 금액 | 로딩 메시지 | 표시 시점 |
|----------|-----------|---------|
| 0원 | "잠시만 기다려주세요" | `onPurchase()` 호출 시 |
| 유료 | "결제 페이지로 이동중" | PG 모듈 호출 전 |

**적용 파일**:
- `src/components/PaymentNew.tsx` (539-660번 줄)

**영향**:
- 0원 결제 UX 개선 (불필요한 로딩 제거)
- 유료 결제 플로우는 기존과 동일하게 유지
- 중복 `setIsProcessingPayment(true)` 호출 제거 (696번 줄 삭제)

---

## 2026-01-14

### generate-free-preview 사주 API 연동 (무료 콘텐츠 품질 고도화)
**결정**: 무료 콘텐츠 생성 시에도 유료 콘텐츠와 동일하게 Stargio 사주 API를 호출하여 상세 사주 데이터를 AI 프롬프트에 포함
**배경**:
- 기존 `generate-free-preview`: 단순 생년월일/성별 정보만 사용하여 사주 콘텐츠 생성
- `generate-content-answers` (유료): SAJU_API_KEY로 상세 사주 데이터(격국, 일주, 대운 등) 활용
- 무료 콘텐츠도 동일한 품질의 사주 분석 제공 필요

**구현**:
```typescript
// supabase/functions/generate-free-preview/index.ts (142-248번 줄)

// 1. SAJU_API_KEY 환경변수 사용
const sajuApiKey = Deno.env.get('SAJU_API_KEY')?.trim()

// 2. 날짜/시간 포맷 변환 (로그인/게스트 모드 분기)
const birthday = dateOnly + timeOnly  // YYYYMMDDHHmm

// 3. 사주 API 호출 (브라우저 헤더 흉내, 최대 3번 재시도)
const sajuApiUrl = `https://service.stargio.co.kr:8400/StargioSaju?birthday=${birthday}&lunar=True&gender=${gender}&apiKey=${sajuApiKey}`
const sajuResponse = await fetch(sajuApiUrl, {
  headers: {
    'User-Agent': 'Mozilla/5.0...',
    'Origin': 'https://nadaunse.com',
    'Referer': 'https://nadaunse.com/',
    // ... 브라우저 헤더
  }
})

// 4. 상세 사주 정보를 questionerInfo에 추가
const fullQuestionerInfo = questionerInfo + detailedSajuInfo
```

**프롬프트 변경**:
```
## **사주 정보**
${fullQuestionerInfo}  // 기본 정보 + 상세 사주 데이터 (JSON)
```

**폴백 전략**:
- SAJU_API_KEY 미설정 또는 API 호출 실패 시 기본 정보만 사용
- 에러가 발생해도 무료 콘텐츠 생성은 계속 진행 (graceful degradation)

**변경 파일**:
- `supabase/functions/generate-free-preview/index.ts`: 사주 API 호출 로직 추가 (142-248번 줄)

**영향 범위**:
- 무료 콘텐츠 생성 플로우
- `generate-free-preview` Edge Function

**결과**: 무료 콘텐츠도 유료와 동일한 품질의 상세 사주 분석 제공

---

## 2026-01-13

### Gemini 생성 이미지 WebP 변환 및 저장 최적화
**결정**: Gemini 2.5 Flash Image가 생성한 PNG 이미지를 WebP 포맷으로 변환하여 Supabase Storage에 저장
**배경**:
- Gemini API는 PNG 포맷으로 이미지 반환
- PNG는 무손실 압축이지만 파일 크기가 큼 (평균 200-500KB)
- 썸네일 이미지는 리스트 페이지에서 다수가 로드되므로 최적화 필수
- WebP는 품질 손실 최소화하면서 파일 크기 30-50% 감소

**구현**:
```typescript
// supabase/functions/generate-thumbnail/index.ts (195-218번 줄)

// 1. ImageMagick WASM 초기화 (서버 시작 시 1회)
import { ImageMagick, initializeImageMagick, MagickFormat } from 'npm:@imagemagick/magick-wasm@0.0.30'
const wasmBytes = await Deno.readFile(new URL('magick.wasm', import.meta.resolve('npm:@imagemagick/magick-wasm@0.0.30')))
await initializeImageMagick(wasmBytes)

// 2. PNG → WebP 변환
finalBytes = ImageMagick.read(pngBytes, (img): Uint8Array => {
  img.quality = 85  // 품질 85 (파일 크기와 품질 균형)
  return img.write(MagickFormat.WebP, (data) => new Uint8Array(data))
})

const compressionRatio = ((1 - finalBytes.length / pngBytes.length) * 100).toFixed(1)
console.log(`✅ WebP 변환 완료: ${pngBytes.length} → ${finalBytes.length} bytes (${compressionRatio}% 감소)`)
```

**폴백 전략**:
- WebP 변환 실패 시 원본 PNG로 저장
- 모든 브라우저 호환성 보장 (WebP 미지원 시 PNG 폴백)

**Storage 최적화**:
- 파일명: `thumbnails/{contentId}.webp` (고정)
- `upsert: true`로 재생성 시 덮어쓰기
- 타임스탬프 없는 URL 사용 (HTTP 캐시 활용)
- 클라이언트에서 cache-busting 처리 (`?v=${timestamp}`)

**성능 개선**:
- 평균 압축률: **40-50% 감소** (PNG 300KB → WebP 150KB)
- 리스트 페이지 로딩 시간 단축
- 모바일 데이터 사용량 절감

**라이브러리**:
- `@imagemagick/magick-wasm@0.0.30`: Deno Edge Runtime 호환 WASM 버전
- 서버리스 환경에서 바이너리 없이 이미지 변환 가능

**영향 범위**:
- `generate-thumbnail` Edge Function
- 마스터 콘텐츠 썸네일 생성/재생성
- `master_contents.thumbnail_url` 필드

**배포 상태**:
- 이미 스테이징/프로덕션에 배포 완료
- Production: v13 (2026-01-13 09:01:23)
- Staging: v11 (2026-01-13 08:57:38)

**결과**: 썸네일 로딩 속도 개선, 스토리지 비용 절감

---

### Edge Function 간 호출 시 JWT 검증 비활성화 (--no-verify-jwt)
**결정**: Edge Function에서 다른 Edge Function 호출 시 JWT 검증을 비활성화하여 배포
**배경**:
- Production에서 유료 콘텐츠 결제 시 "Invalid JWT" 에러 발생
- `generate-content-answers` → `generate-saju-answer` / `generate-tarot-answer` 호출 시 401 에러
- `generate-content-answers` → `send-alimtalk` 호출 시 401 에러
- 로그: `{ code: 401, message: "Invalid JWT" }`
- Staging은 정상 작동, Production만 실패

**근본 원인**:
- Edge Function 간 내부 호출 시 `Authorization: Bearer ${SUPABASE_SERVICE_ROLE_KEY}` 헤더 사용
- Service Role Key는 JWT가 아니므로 Supabase 인프라 레벨에서 JWT 검증 실패
- Production의 특정 Edge Functions에 JWT 검증이 활성화되어 있었음
- Staging은 JWT 검증이 비활성화되어 있어서 정상 작동

**해결 방법**:
```bash
# --no-verify-jwt 플래그로 재배포 (Production + Staging 모두)
npx supabase functions deploy \
  generate-saju-answer \
  generate-tarot-answer \
  generate-content-answers \
  send-alimtalk \
  --project-ref kcthtpmxffppfbkjjkub \
  --no-verify-jwt

npx supabase functions deploy \
  generate-saju-answer \
  generate-tarot-answer \
  generate-content-answers \
  send-alimtalk \
  --project-ref hyltbeewxaqashyivilu \
  --no-verify-jwt
```

**왜 JWT 검증을 비활성화해도 안전한가?**:
- Edge Function 간 내부 호출은 Supabase 인프라 내부에서만 발생 (외부 노출 없음)
- `SUPABASE_SERVICE_ROLE_KEY`는 Supabase Secret으로 안전하게 관리됨
- 외부 클라이언트에서는 여전히 JWT 검증이 필요하지만, 내부 호출에는 불필요
- Service Role Key는 모든 권한을 가진 마스터 키이므로 JWT 검증보다 강력함

**대안 검토**:
1. ❌ `apikey` 헤더 사용: 시도했으나 "Missing authorization header" 에러 발생
2. ❌ JWT 생성 후 전달: 불필요한 오버헤드, Service Role Key로 충분
3. ✅ **JWT 검증 비활성화**: 가장 간단하고 안전한 해결책

**영향 범위**:
- `generate-saju-answer`: 사주 답변 생성 (내부 호출용)
- `generate-tarot-answer`: 타로 답변 생성 (내부 호출용)
- `generate-content-answers`: 답변 병렬 생성 (진입점)
- `send-alimtalk`: 알림톡 발송 (내부 호출용)

**배포 결과**:
- Production: 2026-01-13 13:40~13:43 배포 완료
- Staging: 2026-01-13 13:46:44 배포 완료
- "Invalid JWT" 에러 해결, 유료 콘텐츠 결제 정상 작동

**교훈**:
- Edge Function 간 내부 호출이 있는 경우 `--no-verify-jwt` 플래그 필수
- Staging/Production 환경 설정 차이를 주의깊게 확인해야 함
- Service Role Key는 JWT가 아니므로 JWT 검증 대상이 아님
- 배포 시 일관된 플래그 사용 중요 (환경별 차이 방지)

---

### JWT 설정 변경 후 Edge Functions 재배포 필요
**결정**: JWT 토큰 만료 시간 변경 시 모든 Edge Functions를 재배포해야 함
**배경**:
- JWT Access Token 만료 시간을 1시간(3600초) → 7일(604800초)로 변경
- Staging/Production 모두 설정 변경 완료
- 하지만 Production에서 유료 콘텐츠 결제 시 "Invalid JWT" 에러 발생
- Staging은 정상 작동, Production만 실패

**근본 원인**:
- JWT 설정 변경 후 **Staging Edge Functions는 재배포했지만 Production은 재배포하지 않음**
- 옛날 버전의 Edge Functions가 새로운 JWT 설정과 호환되지 않음
- 특히 내부 API 호출(`generate-content-answers` → `generate-saju-answer` / `generate-tarot-answer`)에서 SERVICE_ROLE_KEY 검증 실패

**해결 방법**:
```bash
# Production에 Edge Functions 재배포
supabase functions deploy generate-saju-answer --project-ref kcthtpmxffppfbkjjkub
supabase functions deploy generate-tarot-answer --project-ref kcthtpmxffppfbkjjkub
```

**교훈**:
- JWT 관련 설정(만료 시간, Secret 등) 변경 시 **모든 Edge Functions를 재배포**해야 함
- Staging과 Production 환경 모두에서 동일하게 재배포 필요
- Edge Functions는 빌드 시점의 JWT 설정을 캐싱하므로, 설정 변경만으로는 즉시 반영되지 않음

**영향**: 유료 콘텐츠 결제 및 AI 생성 플로우
**결과**: Production 재배포 후 "Invalid JWT" 에러 해결

---

### 사주 API 서버 직접 호출: SAJU_API_KEY 도입
**결정**: 프론트엔드에서 호출하던 사주 API를 다시 Edge Function(서버)에서 호출하도록 변경. API 키 인증 방식 사용.
**배경**:
- 기존 방식: 브라우저에서 사주 API 직접 호출 후 Edge Function에 전달 (빈 응답 문제 해결용)
- 문제점: API가 키 인증을 요구하게 되어 프론트엔드에서 호출 시 API 키 노출 위험
- 해결: 서버에서 `SAJU_API_KEY` 환경변수를 사용하여 안전하게 호출

**구현**:
```typescript
// Edge Function (generate-content-answers/index.ts, 96-174번 줄)
const sajuApiKey = Deno.env.get('SAJU_API_KEY')?.trim()
const sajuApiUrl = `https://service.stargio.co.kr:8400/StargioSaju?birthday=${birthday}&lunar=True&gender=${gender}&apiKey=${sajuApiKey}`
console.log('📞 사주 API URL:', sajuApiUrl.replace(sajuApiKey, '***'))  // 키는 마스킹

// 브라우저 헤더 흉내 (중요!)
const sajuResponse = await fetch(sajuApiUrl, {
  method: 'GET',
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36...',
    'Origin': 'https://nadaunse.com',
    'Referer': 'https://nadaunse.com/',
    // ... 기타 브라우저 헤더
  }
})

// 최대 3번 재시도 (1초, 2초 간격)
```

**변경 내용**:
- `generate-content-answers/index.ts`: SAJU_API_KEY로 서버 직접 호출
- `BirthInfoInput.tsx`: 프론트엔드 사주 API 호출 제거
- `SajuSelectPage.tsx`: 프론트엔드 사주 API 호출 제거
- `lib/sajuApi.ts`: 더 이상 사용되지 않음 (프론트엔드 호출 금지)

**Supabase Secret 설정**:
- `SAJU_API_KEY`: Stargio 사주 API 인증 키
- Staging/Production 모두 설정 필요

**영향**: 사주 콘텐츠 결제 및 AI 생성 플로우
**결과**: API 키 보안 유지 + 서버 직접 호출로 안정성 확보

---

### Storage 썸네일 삭제: RLS 정책 추가 (SELECT + DELETE)
**결정**: 마스터 콘텐츠 삭제 시 Storage 썸네일도 삭제되도록 RLS 정책 추가
**배경**:
- 마스터 콘텐츠 삭제 시 DB 데이터는 삭제되지만 Storage 썸네일은 남아있음
- `supabase.storage.remove()` 호출이 에러 없이 빈 배열 `[]` 반환 (삭제 실패)
- Storage RLS 정책이 없어서 클라이언트에서 삭제 불가

**근본 원인**:
- Supabase Storage에서 DELETE 작업을 위해서는 **SELECT + DELETE 정책 모두 필요**
- DELETE만 있으면 파일 조회가 안 되어 삭제 대상을 찾을 수 없음

**해결 방법**:
```sql
-- SELECT 정책 (DELETE 전 파일 조회 필요)
CREATE POLICY "Allow authenticated to select thumbnails"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'assets' AND name LIKE 'thumbnails/%');

-- DELETE 정책
CREATE POLICY "Allow authenticated to delete thumbnails"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'assets' AND name LIKE 'thumbnails/%');
```

**코드 수정** (`MasterContentDetail.tsx`):
```typescript
// thumbnail_url에서 Storage 경로 추출
const url = contentData.thumbnail_url;
const storagePathMatch = url.match(/\/storage\/v1\/object\/public\/assets\/(.+?)(?:\?|$)/);
if (storagePathMatch && storagePathMatch[1]) {
  const thumbnailPath = storagePathMatch[1]; // thumbnails/xxx.webp
  await supabase.storage.from('assets').remove([thumbnailPath]);
}
```

**영향**:
- Staging/Production 모두 정책 적용
- `/src/components/MasterContentDetail.tsx` - 경로 추출 로직 수정

**교훈**:
- Supabase Storage RLS에서 DELETE는 SELECT 정책도 필요
- `remove()` 응답이 `[]`면 권한 문제 (에러가 아님)
- 응답이 `[{...}]`면 삭제 성공

---

### 썸네일 이미지 캐시 버스팅: imageCacheBuster 상태 도입
**결정**: 썸네일 재생성 시 브라우저 캐시 문제를 해결하기 위해 `imageCacheBuster` 상태를 도입하여 URL에 버전 쿼리 파라미터 추가
**배경**:
- 마스터 콘텐츠 관리에서 썸네일 재생성 시 브라우저 캐시로 인해 이전 이미지가 계속 표시됨
- Supabase Storage 파일명이 동일하면 브라우저가 캐시된 이미지 반환
- 강력 새로고침 없이는 새 이미지 확인 불가

**해결 방법**:
```typescript
// MasterContentDetail.tsx
const [imageCacheBuster, setImageCacheBuster] = useState(Date.now());

// 썸네일 재생성 완료 시 캐시 버스터 업데이트
const handleRegenerateThumbnail = async () => {
  await regenerateThumbnail(contentId);
  setImageCacheBuster(Date.now()); // ⭐ 캐시 무효화
};

// 이미지 URL에 버전 쿼리 파라미터 추가
<img src={`${thumbnailUrl}?v=${imageCacheBuster}`} />
```

**적용 파일**:
- `/components/MasterContentDetail.tsx` - 상세 페이지 썸네일 캐시 버스팅
- `/components/MasterContentList.tsx` - 목록 실시간 업데이트 캐시 버스팅

**핵심 원리**:
- URL 쿼리 파라미터가 변경되면 브라우저는 새 리소스로 인식
- 타임스탬프를 사용하면 매번 고유한 URL 생성
- 불필요한 API 호출 없이 클라이언트 측에서 캐시 제어

**영향**: 마스터 콘텐츠 관리 페이지 (목록, 상세)
**결과**: 썸네일 재생성 후 즉시 새 이미지 표시, 사용자 경험 개선

---

### iOS 스와이프 뒤로가기: FreeSajuDetail 결과 페이지 네비게이션 수정
**결정**: FreeSajuDetail에서 X 버튼은 홈으로, 시스템 뒤로가기는 콘텐츠 상세로 이동
**배경**:
- 무료 콘텐츠 결과 페이지(FreeSajuDetail)에서 시스템 뒤로가기 시 로딩 페이지로 이동하는 버그
- X 버튼: 홈으로 이동 (기존 동작 유지)
- 시스템 뒤로가기/iOS 스와이프: 콘텐츠 상세로 이동

**문제 시나리오**:
```
1. /product/{id} (무료 콘텐츠 상세)
2. /product/{id}/loading/free (로딩)
3. /product/{id}/result/free (결과)
→ 시스템 뒤로가기 시 2번 로딩 페이지로 이동 (버그)
→ 원하는 동작: 1번 콘텐츠 상세로 이동
```

**해결 방법**:
```typescript
// FreeSajuDetail.tsx - contentId prop 추가 및 popstate/bfcache 핸들러
useEffect(() => {
  if (!contentId) return;
  window.history.pushState({ freeSajuDetailPage: true }, '');

  const handlePopState = () => {
    navigate(`/product/${contentId}`, { replace: true });
  };

  const handlePageShow = (event: PageTransitionEvent) => {
    if (event.persisted) {
      navigate(`/product/${contentId}`, { replace: true });
    }
  };

  window.addEventListener('popstate', handlePopState);
  window.addEventListener('pageshow', handlePageShow);
  return () => {
    window.removeEventListener('popstate', handlePopState);
    window.removeEventListener('pageshow', handlePageShow);
  };
}, [contentId, navigate]);
```

**핵심 원리**:
- X 버튼(`onClose`): 홈으로 이동 (기존 동작 유지)
- 시스템 뒤로가기(`popstate`): 콘텐츠 상세로 리다이렉트
- iOS bfcache 복원(`pageshow`): 콘텐츠 상세로 리다이렉트

**영향**: `/src/App.tsx`, `/src/components/FreeSajuDetail.tsx`

---

### iOS 스와이프 뒤로가기: 홈페이지 무한 스와이프 지원 (동적 버퍼 재충전) ✅ 해결됨
**결정**: pushState의 특성(현재 위치 뒤 엔트리 삭제)을 활용하여 동적으로 버퍼를 재충전, 무한 스와이프 지원
**상태**: ✅ **테스트 완료 - 2026-01-14 프로덕션 배포**

**문제 상황**:
- 홈 → 콘텐츠 상세 → 스와이프 뒤로가기 → 홈 반복 시 히스토리 무한 증가 (기존 버그)
- history.length: 49 → 53 → 58 → 63... 무한 증가 후 앱 종료
- 버퍼 3개만 추가하면 6회 반복 후 페이지 닫힘 (부분 수정의 한계)
- **요구사항**: 무한 번 반복해도 페이지가 닫히지 않아야 함

**왜 HomePage만 특별한가?**:
| 페이지 | 특성 | 버퍼 필요 | 이유 |
|--------|------|----------|------|
| PaymentNew, SajuManagementPage | 앞에 다른 페이지가 있음 | ❌ 불필요 | 뒤로가면 이전 페이지로 이동 |
| **HomePage** | **앱의 최초 진입점** | ✅ **동적 버퍼 필요** | 뒤로갈 곳이 없어 앱 종료됨 |

**핵심 인사이트 - pushState의 숨겨진 동작**:
`pushState`는 **현재 위치 뒤의 모든 엔트리를 삭제**한 후 새 엔트리를 추가함.
이 특성을 활용하면 버퍼를 재충전하면서도 히스토리 길이를 일정하게 유지할 수 있음
```
[버퍼 중간(index 2) 도달 시]
stack: [Home, buf0, buf1, buf2, buf3, buf4]
                         ↑ current
→ pushState 호출

[결과: 뒤쪽 엔트리(buf3, buf4) 삭제 + 새 버퍼 추가]
stack: [Home, buf0, buf1, buf2, newBuf]
                               ↑ current
→ history.length 유지됨!
```

**해결 방법**:
```typescript
const BUFFER_COUNT = 5;

// 🔧 1단계: 최초 진입 시 홈 상태 마킹 + 버퍼 초기화
useEffect(() => {
  const isIOS = /iPhone|iPad|iPod/.test(navigator.userAgent);
  const isHistoryInitialized = sessionStorage.getItem('homepage_history_initialized');

  // 콘텐츠에서 돌아온 경우 플래그만 제거 (버퍼는 이미 존재)
  const hasNavigatedFromHome = sessionStorage.getItem('navigatedFromHome');
  if (hasNavigatedFromHome) {
    sessionStorage.removeItem('navigatedFromHome');
    return;
  }

  if (isIOS && !isHistoryInitialized) {
    // 홈 상태 마킹 (버퍼 모두 소진 시 식별용)
    window.history.replaceState({ type: 'home', index: 0 }, '', window.location.href);

    // 버퍼 5개 추가
    for (let i = 0; i < BUFFER_COUNT; i++) {
      window.history.pushState({ type: 'home_buffer', index: i }, '', window.location.href);
    }
    sessionStorage.setItem('homepage_history_initialized', 'true');
  }
}, []);

// 🔧 2단계: popstate 핸들러 - 버퍼 동적 재충전 (핵심!)
useEffect(() => {
  const isIOS = /iPhone|iPad|iPod/.test(navigator.userAgent);
  if (!isIOS) return;

  const handlePopstate = (event: PopStateEvent) => {
    const state = event.state;
    if (window.location.pathname !== '/') return; // 홈에서만 동작

    // Case 1: 버퍼 영역 - 중간 이하 도달 시 새 버퍼 추가
    if (state?.type === 'home_buffer') {
      const bufferIndex = state.index ?? 0;
      const threshold = Math.floor(BUFFER_COUNT / 2); // 2
      if (bufferIndex <= threshold) {
        window.history.pushState({ type: 'home_buffer', index: BUFFER_COUNT - 1 }, '', window.location.href);
      }
      return;
    }

    // Case 2: 홈 상태 도달 - 버퍼 전체 재생성
    if (state?.type === 'home') {
      for (let i = 0; i < BUFFER_COUNT; i++) {
        window.history.pushState({ type: 'home_buffer', index: i }, '', window.location.href);
      }
      return;
    }

    // Case 3: 상태 없음 - 앱 최초 진입점 (비상 복구)
    if (!state) {
      window.history.replaceState({ type: 'home', index: 0 }, '', window.location.href);
      for (let i = 0; i < BUFFER_COUNT; i++) {
        window.history.pushState({ type: 'home_buffer', index: i }, '', window.location.href);
      }
    }
  };

  window.addEventListener('popstate', handlePopstate);
  return () => window.removeEventListener('popstate', handlePopstate);
}, []);
```

**히스토리 길이 분석**:
| 시나리오 | 이전 (버그) | 수정 후 |
|---------|------------|---------|
| 초기 | 4 | 6 (Home + 5버퍼) |
| 왕복 10회 | 54+ (무한 증가) | 5~7 (일정 유지) |
| 무한 스와이프 | 앱 종료 | ✅ 계속 홈 유지 |

**변경 사항**:
1. 버퍼 3개 → 5개 증가 (연속 스와이프 대응)
2. 홈 상태 마킹 추가 (`replaceState`로 `type: 'home'` 설정)
3. popstate 핸들러 추가 (동적 버퍼 재충전)
4. pushState의 특성 활용하여 히스토리 길이 5~7 범위 유지

**왜 이 방식이 작동하는가?**:
```
기존 방식 (실패):
- 홈 진입마다 버퍼 추가 → 히스토리 무한 증가 → 메모리 문제 → 앱 종료
- 버퍼 고정 3개 → 6회 왕복 후 버퍼 소진 → 앱 종료

새 방식 (성공):
- pushState 호출 시 "현재 위치 뒤 엔트리 자동 삭제" 특성 활용
- 버퍼가 절반 이하로 소진되면 새 버퍼 추가 (뒤쪽 자동 정리)
- 히스토리 길이 5~7로 일정하게 유지되면서 무한 스와이프 가능
```

**영향**: `/src/pages/HomePage.tsx`
**테스트**: ✅ iOS Safari에서 홈 ↔ 콘텐츠 상세 **10회 이상 왕복** 및 홈에서 **무한 스와이프** 테스트 완료

---

## 2026-01-12

### iOS 첫 번째 클릭 이벤트 누락: z-index/pointer-events 충돌 해결
**결정**: 스크롤 컨테이너와 Fixed 하단 버튼 간의 z-index 및 pointer-events 충돌 문제 해결
**배경**:
- iOS Safari에서 하단 고정 CTA 버튼의 첫 번째 클릭이 로그조차 잡히지 않는 버그 발생
- 두 번째 클릭부터는 정상 작동
- 콘솔 로그에 클릭 이벤트가 전혀 기록되지 않아 이벤트 자체가 전달되지 않는 것으로 확인

**문제 시나리오**:
```
1. 페이지 로드 후 스크롤 컨테이너가 전체 화면 차지
2. 하단 고정 버튼(fixed, z-index: 50)이 렌더링됨
3. 첫 번째 클릭 시도 → 이벤트 누락 (로그 없음)
4. 두 번째 클릭 시도 → 정상 작동
```

**근본 원인**:
- 스크롤 가능한 컨테이너(`overflow-y-auto`)가 하단 고정 버튼 영역까지 확장
- iOS Safari의 터치 이벤트 처리 순서 문제:
  1. 첫 터치가 스크롤 컨테이너 레이어에 먼저 등록됨
  2. z-index가 높아도 pointer-events가 명시적으로 설정되지 않으면 하위 레이어가 이벤트 캡처
  3. 두 번째 터치부터 올바른 레이어로 이벤트 전달

**해결 방법**:
```tsx
// ✅ 하단 고정 버튼에 pointer-events 명시적 설정
<div className="fixed bottom-0 left-0 right-0 z-50 pointer-events-auto">
  <button className="w-full h-14 bg-primary text-white">
    구매하기
  </button>
</div>

// ✅ 스크롤 컨테이너의 하단 패딩 확보 (버튼 영역만큼)
<div className="overflow-y-auto pb-20">
  {/* 콘텐츠 */}
</div>
```

**추가 최적화**:
```tsx
// 스크롤 컨테이너가 하단 버튼 영역을 침범하지 않도록 높이 제한
<div className="overflow-y-auto max-h-[calc(100vh-5rem)]">
  {/* 5rem = 하단 버튼 높이 + 여백 */}
</div>
```

**핵심 원리**:
- iOS Safari는 터치 이벤트를 레이어별로 처리하며, 첫 터치 시 레이어 인식 과정이 필요
- `pointer-events: auto`를 명시적으로 설정하면 해당 요소가 우선적으로 이벤트를 수신
- 스크롤 컨테이너의 영역을 명확히 제한하여 fixed 요소와의 충돌 방지
- z-index만으로는 터치 이벤트 우선순위가 보장되지 않음

**테스트 결과**:
- iOS Safari 17.x: 첫 클릭부터 정상 작동 확인 ✅
- iOS Chrome: 정상 작동 확인 ✅
- Android Chrome: 정상 작동 확인 ✅
- Desktop Safari/Chrome: 정상 작동 확인 ✅

**영향**:
- 모든 하단 고정 CTA 버튼 컴포넌트
- `/components/PaymentNew.tsx`
- `/components/MasterContentDetailPage.tsx`
- `/components/FreeContentDetail.tsx`
- 기타 fixed bottom 버튼을 사용하는 모든 페이지

**교훈**:
- iOS Safari의 터치 이벤트는 z-index만으로 제어 불가
- `pointer-events` 속성을 명시적으로 설정하는 것이 안전
- 스크롤 컨테이너와 fixed 요소 간 영역 겹침을 최소화해야 함
- 모바일 이벤트 디버깅 시 첫 상호작용 테스트 필수

---

## 2026-01-11

### 로그인 직후 프로필 페이지 강제 리로드: 별도 플래그 사용
**결정**: `show_login_toast`와 `force_profile_reload` 별도 플래그로 분리
**배경**:
- 로그인 후 프로필 접속 시 사주 정보가 표시되지 않는 문제
- `show_login_toast` 플래그가 HomePage에서 즉시 제거되어 ProfilePage 도달 시 플래그 없음
- AuthCallback에서 사주 프리페칭 시도 시 무한 로딩 발생
- 로그인 로직을 건드리지 않고 해결 필요

**문제 시나리오**:
```
1. 로그인 → AuthCallback (show_login_toast = true)
2. 홈 리다이렉트 → HomePage
   - LoginToast 컴포넌트에서 show_login_toast 감지
   - 토스트 표시 후 즉시 플래그 제거
3. 프로필 클릭 → ProfilePage
   - show_login_toast 이미 없음
   - 캐시 있으면 API 호출 스킵
   - 사주 정보 없음으로 표시 (버그!)
```

**해결 방법**:
```typescript
// AuthCallback.tsx - 두 개의 독립적인 플래그 설정
sessionStorage.setItem('show_login_toast', 'true');        // 토스트 표시용
sessionStorage.setItem('force_profile_reload', 'true');    // 프로필 API 강제 호출용

// ProfilePage.tsx - 별도 플래그로 강제 리로드 감지
const forceReload = sessionStorage.getItem('force_profile_reload') === 'true';

// 캐시가 있어도 강제 리로드 시 API 호출
if (initialState.hasCache && !needsRefresh && !forceReload) {
  return; // API 호출 스킵
}

if (forceReload) {
  // API 호출 → 사주 정보 + 캐시 저장
  // ...
  sessionStorage.removeItem('force_profile_reload'); // 한 번만 호출
}
```

**동작 흐름**:
```
1. 로그인 → AuthCallback
   - show_login_toast = true (토스트용)
   - force_profile_reload = true (프로필 리로드용)

2. 홈 리다이렉트 → HomePage
   - show_login_toast 감지 → 토스트 표시
   - show_login_toast 제거 (HomePage에서)

3. 프로필 클릭 → ProfilePage
   - force_profile_reload = true 감지 ✅
   - API 강제 호출 → 사주 정보 + 캐시 저장
   - force_profile_reload 제거

4. 다음 프로필 방문
   - force_profile_reload 없음
   - 캐시 사용 (API 호출 스킵)
```

**핵심 원리**:
- 토스트 표시와 프로필 리로드를 별도 플래그로 분리
- show_login_toast: HomePage LoginToast에서만 사용 (즉시 제거)
- force_profile_reload: ProfilePage에서만 사용 (API 호출 후 제거)
- 각 플래그의 생명주기가 독립적으로 관리됨

**영향**:
- `/src/pages/AuthCallback.tsx`
- `/src/components/ProfilePage.tsx`
- `/src/App.tsx` (WelcomeCouponPageWrapper)
**테스트**: 로그아웃 → 로그인 → 프로필 클릭 → 사주 정보 표시 확인

---

### iOS 스와이프 뒤로가기: 사주 관리 네비게이션에 replace: true 적용
**결정**: 사주 관리 페이지에서 사주 추가/수정 페이지로 이동할 때 `replace: true` 옵션 사용
**배경**:
- 프로필 → 사주관리 → 사주추가/수정 → 저장 → 사주관리 이동 후
- iOS 스와이프 뒤로가기 시 프로필이 아닌 사주관리로 다시 돌아가는 버그
- 히스토리 스택에 사주관리 페이지가 중복으로 쌓이는 문제

**문제 시나리오**:
```
히스토리 스택:
98: /profile
99: /saju/management  ← 첫 방문
100: /saju/add        ← 새 엔트리 추가

저장 후 navigate('/saju/management', { replace: true }):
98: /profile
99: /saju/management  ← 원래 엔트리 (여전히 존재!)
100: /saju/management ← 100번이 교체됨

→ 스와이프 뒤로가기 시 #99 /saju/management로 이동 (버그!)
→ 다시 스와이프 뒤로가기해야 프로필로 이동
```

**근본 원인**:
- 사주관리 → 사주추가/수정 이동 시 `push` 방식으로 새 엔트리 생성
- 저장 후 `replace: true`로 현재 엔트리만 교체
- 하지만 이전에 push된 사주관리 엔트리(#99)는 그대로 남음

**해결 방법**:
```typescript
// App.tsx - SajuManagementPageWrapper
// ⭐ 사주관리 → 사주추가/수정 이동 시 replace: true 적용
function SajuManagementPageWrapper() {
  const navigate = useNavigate();

  return (
    <SajuManagementPage
      onBack={goBack}
      // ⭐ replace: true로 현재 히스토리 엔트리를 교체
      onNavigateToInput={() => navigate('/saju/input', { replace: true })}
      onNavigateToAdd={() => navigate('/saju/add', { replace: true })}
      onEditMySaju={(sajuInfo) => {
        navigate('/saju/input', {
          replace: true,  // ⭐ 히스토리 교체
          state: { editMode: true, sajuData: sajuInfo, returnTo: '/saju/management' }
        });
      }}
      onEditOtherSaju={(sajuInfo) => {
        navigate('/saju/add', {
          replace: true,  // ⭐ 히스토리 교체
          state: { editMode: true, sajuData: sajuInfo, returnTo: '/saju/management' }
        });
      }}
    />
  );
}

// SajuAddPageWrapper, SajuInputPageWrapper도 동일하게 replace: true 사용
onSaved={() => {
  if (returnTo) {
    navigate(returnTo, { replace: true });
  } else {
    navigate('/saju/management', { replace: true });
  }
}}
```

**수정 후 히스토리**:
```
히스토리 스택:
98: /profile
99: /saju/management  ← 첫 방문

navigate('/saju/add', { replace: true }):
98: /profile
99: /saju/add  ← #99가 교체됨 (새 엔트리 추가 안 됨!)

저장 후 navigate('/saju/management', { replace: true }):
98: /profile
99: /saju/management  ← 다시 교체

→ 스와이프 뒤로가기 시 #98 /profile로 정상 이동 ✅
```

**핵심 원리**:
- 히스토리 스택에서 중복 엔트리를 만들지 않는 것이 핵심
- 사주관리 ↔ 사주추가/수정 간 이동은 모두 `replace: true` 사용
- 이렇게 하면 히스토리가 `[프로필, 사주관리]` 또는 `[프로필, 사주추가]`로만 유지됨
- iOS 스와이프 뒤로가기가 브라우저의 자연스러운 히스토리 탐색으로 동작

**popstate 이벤트는 제거**:
- SajuManagementPage에서 `popstate` 이벤트 리스너 제거
- iOS 스와이프 뒤로가기와 충돌 방지
- bfcache 핸들러(`pageshow`, `visibilitychange`, `focus`)만 유지

**영향**:
- `/src/App.tsx` (SajuManagementPageWrapper, SajuAddPageWrapper, SajuInputPageWrapper)
- `/src/components/SajuManagementPage.tsx` (popstate 제거)

**테스트**:
- iOS Safari에서 프로필 → 사주관리 → 사주추가 → 저장 → 스와이프 뒤로가기 → 프로필 확인 ✅
- 히스토리 스택에 중복 엔트리가 없음을 로그로 확인

**관련 이슈**: PaymentNew.tsx에서도 유사한 `popstate` 제거 패턴 적용 (DECISIONS.md 151-203번 줄 참고)

---

### iOS 스와이프 뒤로가기: PaymentNew popstate 핸들러 제거
**결정**: PaymentNew.tsx에서 `pushState` + `popstate` 패턴 제거, bfcache 핸들러만 유지
**배경**:
- 유료 콘텐츠 상세 → 결제 → 스와이프 뒤로가기 → 유료 콘텐츠 상세 (OK)
- → 다시 스와이프 뒤로가기 → 홈이 아닌 유료 콘텐츠 상세로 이동 (버그)

**문제 원인**:
```typescript
// ❌ 이전 코드 - 히스토리 스택 중복 발생
useEffect(() => {
  window.history.pushState({ paymentPage: true }, '');

  const handlePopState = () => {
    navigate(`/master/content/detail/${contentId}`, { replace: true });
  };

  window.addEventListener('popstate', handlePopState);
  return () => window.removeEventListener('popstate', handlePopState);
}, [contentId, navigate]);
```

**히스토리 스택 분석**:
```
1. 초기: [Home, Detail, Payment]
2. pushState: [Home, Detail, Payment, {dummy}]
3. 스와이프 뒤로가기 → popstate 발생
4. navigate(replace): [Home, Detail, Detail] ← Payment가 Detail로 대체됨!
5. 다시 스와이프 뒤로가기 → Detail (Home이 아닌)
```

**해결 방법**:
```typescript
// ✅ 수정된 코드 - pushState/popstate 제거, bfcache만 유지
useEffect(() => {
  const handlePageShow = (event: PageTransitionEvent) => {
    if (event.persisted) {
      setIsProcessingPayment(false); // bfcache 복원 시 상태 리셋만
    }
  };

  window.addEventListener('pageshow', handlePageShow);
  return () => window.removeEventListener('pageshow', handlePageShow);
}, []);
```

**핵심 원리**:
- `pushState` + `navigate(replace)` 조합은 히스토리 스택을 예측 불가능하게 만듦
- iOS 스와이프 뒤로가기는 브라우저가 자연스럽게 처리하도록 두는 것이 최선
- bfcache 복원 시 상태 리셋만 처리 (버튼 비활성화 상태 해제 등)

**영향**: `/components/PaymentNew.tsx`
**테스트**: iOS Safari에서 결제 페이지 진입 후 여러 번 스와이프 뒤로가기 테스트 완료

---

### iOS 스와이프 뒤로가기: 프로필/사주관리 페이지 캐시 기반 렌더링
**결정**: ProfilePage, SajuManagementPage에 캐시 기반 초기 렌더링 적용
**배경**:
- iOS Safari 스와이프 뒤로가기 시 페이지가 불필요하게 리로드되는 것처럼 보임
- API 호출은 스킵해도 framer-motion 애니메이션이 매번 재실행됨
- SajuManagementPage에서 목록 순서가 순간적으로 바뀌는 현상

**문제 시나리오**:
```
1. 프로필 → 사주관리 → 사주수정 → 저장 → 사주관리로 이동
2. iOS 스와이프 뒤로가기
3. → 프로필 페이지가 리로드되는 것처럼 보임 (애니메이션 재실행)
4. → 사주관리 목록 순서가 순간적으로 바뀜 (정렬 불일치)
```

**해결 방법**:
```typescript
// 1. 동기적 캐시 초기화 (useState 초기값으로 캐시 사용)
const getInitialState = () => {
  try {
    const cached = localStorage.getItem('primary_saju');
    if (cached) {
      return { data: JSON.parse(cached), hasCache: true };
    }
  } catch (e) {}
  return { data: null, hasCache: false };
};

const initialState = getInitialState();
const [data, setData] = useState(initialState.data);

// 2. 캐시가 있으면 애니메이션 스킵
const skipAnimation = initialState.hasCache;
const itemVariants = skipAnimation
  ? { hidden: { opacity: 1, y: 0 }, visible: { opacity: 1, y: 0 } }  // 애니메이션 없음
  : { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }; // 기본 애니메이션

// 3. 캐시가 있고 refresh 플래그 없으면 API 호출 스킵
useEffect(() => {
  const needsRefresh = localStorage.getItem('profile_needs_refresh') === 'true';
  if (initialState.hasCache && !needsRefresh) {
    console.log('🚀 캐시 유효 → API 호출 스킵');
    return;
  }
  // API 호출...
}, []);

// 4. SajuManagementPage - getInitialState에서도 동일한 정렬 적용
const sortedOthers = [...others].sort((a, b) => {
  const dateA = new Date(a.created_at || 0).getTime();
  const dateB = new Date(b.created_at || 0).getTime();
  return dateB - dateA; // 최신순
});
```

**핵심 원리**:
- `useState` 초기값으로 localStorage 캐시 동기적 로드 (skeleton 없이 즉시 렌더링)
- 캐시가 있으면 framer-motion 애니메이션을 identity transform으로 대체
- `getInitialState()`와 `setSajuList()`에서 동일한 정렬 로직 적용 (순서 불일치 방지)
- `*_needs_refresh` 플래그로 실제 데이터 변경 시에만 API 재호출

**영향**:
- `/components/ProfilePage.tsx`
- `/components/SajuManagementPage.tsx`
**테스트**: iOS Safari에서 스와이프 뒤로가기 시 즉시 렌더링 확인

---

## 2026-01-07

### iOS 스와이프 뒤로가기: 회원가입 플로우 히스토리 관리
**결정**: 회원가입 관련 페이지(로그인, 약관, 환영쿠폰)에 상태 기반 리다이렉트 로직 추가
**배경**:
- iOS Safari/Chrome에서 스와이프 뒤로가기 시 이미 완료된 회원가입 페이지로 돌아가는 버그
- 구글 OAuth 플로우는 외부 URL 리다이렉트를 거치면서 브라우저 히스토리에 여러 항목 생성
- `navigate(..., { replace: true })`만으로는 OAuth 이전의 히스토리 항목(로그인 페이지 등)은 제거 불가

**문제 시나리오**:
```
1. 로그인 페이지 (push)
2. 구글 OAuth (외부 리다이렉트)
3. /auth/callback (replace)
4. /signup/terms (replace)
5. /welcome-coupon (replace)
6. / 홈 (replace)

→ 여러 번 뒤로가기하면 1번 로그인 페이지로 돌아감
```

**해결 방법**:
각 페이지에서 마운트 시 상태를 확인하고, 적절한 페이지로 리다이렉트

```typescript
// 1. LoginPageNewWrapper - 이미 로그인된 상태면 홈으로
useEffect(() => {
  const user = localStorage.getItem('user');
  if (user) {
    console.log('🔄 [LoginPage] 이미 로그인된 상태 → 홈으로 리다이렉트');
    navigate('/', { replace: true });
  }
}, [navigate]);

// 2. TermsPageWrapper - 회원가입 완료면 홈으로, tempUser 없으면 로그인으로
useEffect(() => {
  const user = localStorage.getItem('user');
  const tempUser = localStorage.getItem('tempUser');

  if (user) {
    navigate('/', { replace: true });
  } else if (!tempUser) {
    navigate('/login/new', { replace: true });
  }
}, [navigate]);

// 3. WelcomeCouponPageWrapper - 이미 환영 페이지를 봤으면 홈으로
useEffect(() => {
  const welcomed = sessionStorage.getItem('welcomePageViewed');
  if (welcomed) {
    navigate('/', { replace: true });
  }
}, [navigate]);

// 버튼 클릭 시 플래그 설정
const handleClose = () => {
  sessionStorage.setItem('welcomePageViewed', 'true');
  navigate('/', { replace: true });
};
```

**핵심 원리**:
- 뒤로가기로 해당 페이지에 도달해도 상태 확인 후 즉시 리다이렉트
- `localStorage.user`: 회원가입 완료 여부
- `localStorage.tempUser`: OAuth 인증 완료 후 약관 동의 대기 상태
- `sessionStorage.welcomePageViewed`: 환영 페이지 확인 여부 (세션 동안만 유지)

**영향**: `/App.tsx` (LoginPageNewWrapper, TermsPageWrapper, WelcomeCouponPageWrapper)
**적용 범위**: 구글/카카오 OAuth 회원가입 플로우 전체
**테스트**: iOS Safari, iOS Chrome에서 스와이프 뒤로가기 테스트 완료

---

### 개발 안정성 강화: Sentry 에러 모니터링 연동
**결정**: Sentry를 연동하여 실시간 에러 추적 및 사용자 컨텍스트 설정
**배경**:
- 프로덕션 환경에서 발생하는 에러를 추적할 방법이 없음
- 사용자 피드백 없이는 버그를 알 수 없는 상황
- 에러 발생 시 빠른 대응이 필요

**구현**:
```typescript
// src/lib/sentry.ts
import * as Sentry from '@sentry/react';

export function initSentry() {
  Sentry.init({
    dsn: import.meta.env.VITE_SENTRY_DSN,
    environment: isProduction() ? 'production' : 'development',
    tracesSampleRate: 0.1,
  });
}

export function setSentryUser(userId: string | null, email?: string) {
  if (userId) {
    Sentry.setUser({ id: userId, email });
  } else {
    Sentry.setUser(null);
  }
}
```

**적용 파일**:
- `src/lib/sentry.ts` - Sentry 초기화 및 유저 설정
- `src/lib/auth.ts` - 로그인/로그아웃 시 `setSentryUser` 호출
- `src/pages/AuthCallback.tsx` - OAuth 콜백에서 사용자 설정
- `src/main.tsx` - Sentry 초기화
- `src/components/ErrorBoundary.tsx` - `captureException` 호출

**장점**:
- ✅ 실시간 에러 알림 (Slack 연동 가능)
- ✅ 에러 발생 시 사용자 ID로 추적 가능
- ✅ 스택트레이스, 브라우저 정보 자동 수집
**영향**: 전체 프로젝트
**비용**: Sentry Free Tier (월 5K 에러)

---

### 개발 안정성 강화: 구조화된 로거 도입
**결정**: `console.log` 대신 구조화된 로거(`src/lib/logger.ts`)를 사용하여 환경별 로깅 및 민감정보 마스킹
**배경**:
- `console.log`로 민감정보(이메일, user_id)가 프로덕션에서 노출될 위험
- 환경별로 로그 레벨을 조절할 필요성
- 로그 포맷 일관성 부족

**구현**:
```typescript
// src/lib/logger.ts
const LOG_LEVELS = ['debug', 'info', 'warn', 'error'] as const;

function maskSensitiveData(data: unknown): unknown {
  // email, password, token 등 자동 마스킹
}

export const logger = {
  debug: (message: string, data?: unknown) => {
    if (isProduction()) return; // prod에서는 debug 로그 무시
    console.log(`[DEBUG] ${message}`, maskSensitiveData(data));
  },
  info: (message: string, data?: unknown) => { ... },
  warn: (message: string, data?: unknown) => { ... },
  error: (message: string, data?: unknown) => { ... },
};
```

**적용 파일**: `src/lib/logger.ts`
**장점**:
- ✅ 프로덕션에서 민감정보 자동 마스킹
- ✅ 환경별 로그 레벨 조절
- ✅ 일관된 로그 포맷
**영향**: 전체 프로젝트 (console.log → logger 교체 권장)

---

### 개발 안정성 강화: 재시도 로직 추가 (Exponential Backoff)
**결정**: 네트워크 요청 실패 시 자동 재시도 로직을 `fetchWithRetry` 함수로 구현
**배경**:
- 일시적인 네트워크 오류로 인한 요청 실패
- 서버 일시 장애 시 사용자 경험 저하
- 수동 재시도 부담

**구현**:
```typescript
// src/lib/fetchWithRetry.ts
export async function fetchWithRetry<T>(
  fn: () => Promise<T>,
  options: { maxRetries: 3, baseDelay: 1000 }
): Promise<T> {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      if (attempt === maxRetries - 1) throw error;
      if (is4xxError(error)) throw error; // 4xx는 재시도 안함

      const delay = baseDelay * Math.pow(2, attempt); // 1s, 2s, 4s
      await sleep(delay);
    }
  }
}
```

**적용 파일**: `src/lib/fetchWithRetry.ts`
**장점**:
- ✅ 일시적 오류 자동 복구
- ✅ Exponential Backoff로 서버 부하 방지
- ✅ 4xx 에러는 즉시 실패 (불필요한 재시도 방지)
**영향**: 중요한 API 호출 (결제, AI 생성 등)

---

### 개발 안정성 강화: 결제 웹훅 구현 (PortOne 서버 콜백)
**결정**: 클라이언트 리다이렉트 기반 결제 검증 대신, 서버 웹훅으로 결제 상태 확인
**배경**:
- 클라이언트에서만 결제 성공을 판단하면 조작 위험
- 네트워크 문제로 결제 완료 콜백이 도달 못할 수 있음
- 포트원 서버에서 직접 결제 검증 필요

**구현**:
```typescript
// supabase/functions/payment-webhook/index.ts
// 포트원 서버에서 결제 상태 변경 시 호출
// imp_uid로 포트원 API 조회 → 결제 금액 검증 → orders 상태 업데이트
```

**Edge Function**: `/payment-webhook`
**장점**:
- ✅ 서버 간 통신으로 조작 불가
- ✅ 결제 금액 일치 여부 검증
- ✅ webhook_verified_at 컬럼으로 검증 시점 기록
**영향**: 결제 플로우, orders 테이블

---

### 개발 안정성 강화: 결제 트랜잭션 원자성 보장
**결정**: 주문 생성 + 쿠폰 사용을 PostgreSQL Function으로 단일 트랜잭션 처리
**배경**:
- 기존: 주문 생성 → 쿠폰 적용이 분리되어 중간에 실패 시 불일치 발생
- 쿠폰은 사용됐는데 주문이 안 생기거나, 주문은 생겼는데 쿠폰이 안 차감되는 문제

**구현**:
```sql
-- PostgreSQL Function: process_payment_complete
CREATE OR REPLACE FUNCTION process_payment_complete(
  p_order_id UUID,
  p_coupon_id UUID DEFAULT NULL
) RETURNS JSONB AS $$
BEGIN
  -- 트랜잭션 내에서 원자적 처리
  UPDATE orders SET pstatus = 'paid' WHERE id = p_order_id;
  IF p_coupon_id IS NOT NULL THEN
    UPDATE user_coupons SET is_used = true, used_order_id = p_order_id WHERE id = p_coupon_id;
  END IF;
  RETURN '{"success": true}';
EXCEPTION
  WHEN OTHERS THEN
    RAISE; -- 롤백
END;
$$ LANGUAGE plpgsql;
```

**Edge Function**: `/process-payment`
**DB Function**: `process_payment_complete`
**장점**:
- ✅ 원자적 처리로 데이터 일관성 보장
- ✅ 실패 시 자동 롤백
- ✅ 중간 상태 불가능
**영향**: 결제 플로우, orders 및 user_coupons 테이블

---

### 개발 안정성 강화: 환불 처리 기능 구현
**결정**: 포트원 환불 API 연동 및 쿠폰 복원 로직 구현
**배경**:
- 환불 요청 시 수동으로 포트원 대시보드에서 처리 필요
- 쿠폰 사용 후 환불 시 쿠폰 복원 누락 가능성
- 환불 이력 추적 어려움

**구현**:
```sql
-- PostgreSQL Function: process_refund
CREATE OR REPLACE FUNCTION process_refund(
  p_order_id UUID,
  p_refund_amount INTEGER,
  p_refund_reason TEXT
) RETURNS JSONB AS $$
BEGIN
  -- 트랜잭션 내에서 원자적 처리
  UPDATE orders SET
    pstatus = 'refunded',
    refund_amount = p_refund_amount,
    refund_reason = p_refund_reason,
    refunded_at = NOW()
  WHERE id = p_order_id;

  -- 쿠폰 복원
  UPDATE user_coupons SET
    is_used = false,
    used_order_id = NULL
  WHERE used_order_id = p_order_id;

  RETURN '{"success": true}';
END;
$$ LANGUAGE plpgsql;
```

**Edge Function**: `/process-refund`
**DB Function**: `process_refund`
**장점**:
- ✅ 환불 시 쿠폰 자동 복원
- ✅ 환불 이력 추적 (refund_amount, refund_reason, refunded_at)
- ✅ 포트원 환불 API 연동
**영향**: orders 테이블 (refund 관련 컬럼 추가), user_coupons 테이블

---

### 개발 안정성 강화: Kakao OAuth 시크릿 환경변수화
**결정**: 하드코딩된 Kakao OAuth 시크릿을 환경변수로 이동
**배경**:
- 기존: `kakao_${kakaoUser.id}_nadaunse_secret_2025` 형태로 코드에 하드코딩
- 보안 취약점: 소스 코드 노출 시 인증 시크릿 노출
- 환경별 다른 시크릿 사용 불가

**수정 파일**: `src/lib/auth.ts:34`
**환경변수**: `VITE_KAKAO_AUTH_SECRET`
**장점**:
- ✅ 소스 코드에 민감정보 제거
- ✅ 환경별 다른 시크릿 사용 가능
- ✅ 시크릿 변경 시 재배포 불필요 (Vercel 환경변수만 변경)
**영향**: 인증 플로우

---

### Edge Functions 확장: 17개 → 20개
**결정**: 결제/환불 처리를 위한 Edge Functions 3개 추가
**추가된 Functions**:
1. `/payment-webhook` - 포트원 결제 웹훅 검증
2. `/process-payment` - 결제 트랜잭션 원자적 처리
3. `/process-refund` - 환불 처리 (쿠폰 복원 포함)

**현재 분류** (20개):
- AI 생성: 8개
- 쿠폰 관리: 4개
- 사용자 관리: 2개
- 알림: 1개 (카카오 알림톡)
- 결제/환불: 3개 **(NEW)**
- 기타: 2개

**영향**: `/supabase/functions/`, `/supabase/EDGE_FUNCTIONS_GUIDE.md`

---

## 2026-01-06

### Supabase 환경변수 기반 설정: Staging/Production 분리
**결정**: 하드코딩된 Supabase Project ID와 Anon Key를 환경변수 기반으로 변경
**배경**:
- 기존에 `src/utils/supabase/info.tsx`에 Production 값이 하드코딩되어 있음
- Staging 환경에서 테스트 시 매번 코드 수정 필요
- Vercel Preview 배포 시 Production DB에 연결되는 문제
**환경 구성**:
| 환경 | Project ID | Supabase URL |
|------|------------|--------------|
| Production | `kcthtpmxffppfbkjjkub` | https://kcthtpmxffppfbkjjkub.supabase.co |
| Staging | `hyltbeewxaqashyivilu` | https://hyltbeewxaqashyivilu.supabase.co |

**Vercel 환경변수**:
```
# Production
VITE_SUPABASE_PROJECT_ID=kcthtpmxffppfbkjjkub
VITE_SUPABASE_ANON_KEY=<production-anon-key>

# Preview/Development
VITE_SUPABASE_PROJECT_ID=hyltbeewxaqashyivilu
VITE_SUPABASE_ANON_KEY=<staging-anon-key>
```
**수정 파일**:
- `/src/utils/supabase/info.tsx` - 환경변수 기반 설정
- `/src/lib/supabase.ts` - storageKey 동적 생성
- `/src/lib/zodiacUtils.ts` - Storage URL 동적 생성
**장점**:
- ✅ 코드 수정 없이 환경 전환 가능
- ✅ Vercel Preview에서 Staging DB 사용
- ✅ Production 데이터 보호
**영향**: 전체 Supabase 연동 코드

---

### 도메인 기반 환경 감지: `/lib/env.ts` 유틸리티 도입
**결정**: Figma Make 환경에서 `import.meta.env.DEV`가 부정확하므로, 도메인 기반 환경 감지 로직을 `/lib/env.ts`로 분리  
**배경**: 
- Figma Make 플랫폼에서 `import.meta.env.DEV`가 프로덕션 배포 시에도 `true`로 설정되는 문제 발견
- `nadaunse.figma.site` 도메인이 테스트 URL이지만 실제 사용자에게 공개되는 프로덕션 환경  
**문제 상황**:
```tsx
// ❌ Figma Make에서 문제 발생
{import.meta.env.DEV && <DevButton />}  
// → nadaunse.figma.site에서도 개발 버튼 노출됨
```
**해결 방법**: 
1. `/lib/env.ts` 파일 생성 - 도메인 화이트리스트 기반 환경 감지
2. 프로덕션 도메인: `nadaunse.com`, `www.nadaunse.com`, `nadaunse.figma.site`
3. 위 도메인에서는 `DEV = false`, 나머지 환경(localhost 등)에서는 `DEV = true`  
**제공 함수**:
```typescript
export const DEV: boolean              // 개발 환경 플래그
export const isProduction(): boolean   // 프로덕션 도메인 체크
export const isDevelopment(): boolean  // 개발 환경 체크
export const isLocalhost(): boolean    // 로컬 환경 체크
export const isFigmaSite(): boolean    // Figma Make 환경 체크
```
**적용 컴포넌트**:
- `LoginPageNew.tsx`: `isDevelopment()`로 테스트 버튼 분기
- `ProfilePage.tsx`: `DEV` 플래그로 UI 테스팅 버튼 숨김
- `App.tsx`: 프로덕션 환경 체크 및 `import.meta.env.DEV` 오버라이드  
**장점**:
- ✅ 도메인만 추가하면 환경 구분 가능 (확장성)
- ✅ Figma Make 특수 환경에서도 정확한 환경 감지
- ✅ 중앙 집중식 환경 관리 (유지보수 편의)  
**영향**: 모든 프로덕션 도메인에서 개발 버튼 완전히 숨김, 사용자 경험 개선

---

### 개발/배포 환경 자동 분리: `import.meta.env.DEV` 조건 처리
**결정**: 모든 개발 전용 UI 요소(테스트 버튼, 디버깅 도구 등)를 `import.meta.env.DEV` 조건으로 감싸기  
**배경**: 
- 개발 편의를 위한 테스트 버튼들이 실제 배포 환경(유저 화면)에 노출되는 문제 발생
- 수동으로 빌드 전에 제거하는 방식은 휴먼 에러 위험 높음  
**고려한 대안**:
1. ~~환경변수 체크 (`process.env.NODE_ENV`)~~ → Vite에서는 `import.meta.env` 권장
2. ~~별도 브랜치 관리~~ → 머지 시 충돌 위험
3. **선택: `import.meta.env.DEV` 조건 처리** → Vite 빌드 시 자동 제거  
**적용 대상**:
- `/components/LoginPageNew.tsx` - 테스트 버튼 2개
- `/components/ProfilePage.tsx` - UI 테스팅용 직접 이동 버튼, 사주 미등록 화면 토글, 에러 페이지 확인 버튼
- `/components/MasterContentDetailPage.tsx` - `IS_DEV_MODE` 플래그  
**코드 예시**:
```tsx
// ✅ 배포 시 자동 제거됨
{import.meta.env.DEV && (
  <button onClick={handleDebug}>디버그 버튼</button>
)}
```
**영향**: 배포 환경에서 개발 요소 완전히 숨김, 사용자 경험 개선  
**결과**: 프로덕션 빌드 크기 약 2KB 감소, UI 정리 완료

---

### iOS Safari 렌더링 최적화: `transform-gpu` 속성 추가
**결정**: `overflow: hidden` + `border-radius` 조합을 사용하는 모든 컨테이너에 `transform-gpu` 클래스 추가  
**배경**: 
- iOS Safari에서 둥근 모서리(`border-radius`)가 `overflow: hidden`과 함께 사용 시 정상 렌더링되지 않는 버그 발견
- 특히 맛보기 카드 컨테이너에서 이미지 모서리가 잘리는 현상 발생  
**근본 원인**: iOS Safari의 하드웨어 가속 버그 (WebKit 렌더링 엔진 이슈)  
**고려한 대안**:
1. ~~`-webkit-transform: translateZ(0)`~~ → Tailwind에서 번거로움
2. ~~`will-change: transform`~~ → 과도한 GPU 사용
3. **선택: `transform-gpu` 클래스** → Tailwind v4.0에서 공식 지원, 성능 최적화됨  
**적용 위치**:
- 무료 콘텐츠 맛보기 카드 컨테이너
- 썸네일 이미지 래퍼
- 프로필 이미지 컨테이너
- 모든 `rounded-*` + `overflow-hidden` 조합  
**코드 예시**:
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
**영향**: iOS Safari 실제 기기에서 테스트 완료, 모든 브라우저 정상 작동  
**성능 영향**: GPU 가속 활용으로 스크롤 성능도 약간 개선 (60fps 안정화)  
**결과**: iOS 사용자 경험 대폭 개선, 디자인 의도대로 렌더링

---

### 하단 고정 CTA 컴포넌트 리팩토링
**결정**: 모바일 하단 고정 버튼을 별도 컴포넌트로 분리하고 일관된 스타일 적용  
**배경**: 
- 여러 페이지에서 하단 고정 CTA가 제각각 구현되어 일관성 부족
- iOS Safari에서 하단 네비게이션 바와 겹치는 문제  
**리팩토링 내용**:
- 공통 패딩 적용 (`pb-safe` 사용)
- z-index 통일 (50)
- 그라데이션 배경 통일
- 버튼 높이/폰트 통일  
**영향**: 
- 무료/유료 콘텐츠 상세 페이지
- 결제 페이지
- 프로필 관련 페이지  
**결과**: 
- 디자인 일관성 확보
- iOS Safe Area 대응 완료
- 유지보수성 향상

---

### 타로 서비스 통합: 사주/타로 운세 이원화 시스템
**결정**: 기존 사주 운세 시스템에 타로 서비스를 추가하여 통합 운세 플랫폼으로 확장  
**배경**: 
- 사주만으로는 서비스 다양성 부족
- 타로는 사주보다 진입 장벽 낮고 즉각적인 재미 제공
- 무료/유료 모델 모두 적용 가능  
**아키텍처 결정**:
1. **별도 Edge Functions 생성**
   - `/generate-tarot-answer` - 타로 해석 생성
   - `/generate-tarot-preview` - 타로 미리보기
2. **컴포넌트 구조** (2026-01-15 업데이트)
   - `TarotShufflePage.tsx` - 타로 셔플 페이지 (라우트: /tarot/shuffle)
   - `TarotGame.tsx` - 카드 섞기 + 선택 통합 컴포넌트
   - `TarotResultPage.tsx` - 타로 결과 페이지
   - ~~`TarotFlowPage.tsx`~~ - 레거시 (백업됨)
   - ~~`TarotCardSelection.tsx`~~ - 레거시 (백업됨)
3. **타로 카드 데이터 관리**
   - `/lib/tarotCards.ts` - 78장 타로 카드 정보 (메이저 22장 + 마이너 56장)
**기술적 구현**:
- Framer Motion으로 카드 섞기 애니메이션 구현 (TarotGame.tsx)
- 1장 선택 인터랙션 (질문별 1장씩)
- AI 프롬프트에 선택된 카드 정보 전달
**영향**:
- Edge Functions 2개 추가
- 컴포넌트 3개 활성 (2개 레거시 백업)
- `master_contents` 테이블에 `category_main = '타로'` 추가  
**결과**: 
- 서비스 다양성 확보
- 사용자 리텐션 증가 기대
- 무료 콘텐츠 전환율 향상

---

## 2025-12-31

### 목차 바텀시트: 하드코딩 더미 데이터 제거
**결정**: `TableOfContentsBottomSheet.tsx`에서 더미 질문 데이터(d6~d20) 완전 제거. DB 조회 결과만 표시  
**이유**: 
- AI API는 10개 질문만 생성했지만, UI는 더미 데이터 15개를 추가해 총 25개 표시하는 버그
- 실제 질문 수와 목차 표시 개수 불일치로 사용자 혼란  
**영향**: `/components/TableOfContentsBottomSheet.tsx`  
**수정**: `questions` 배열에 spread로 더미 추가하던 로직 제거 → `(questions || []).map()` 만 사용  
**교훈**: 개발 중 테스트 데이터는 반드시 `import.meta.env.DEV` 조건으로 감싸기

---

### 로딩 페이지: 무료 콘텐츠 이미지 프리로딩 최적화
**결정**: `LoadingPage.tsx`의 무료 콘텐츠 추천 섹션에 홈 화면과 동일한 이미지 최적화 전략 적용  
**이유**: 
- 썸네일 로드가 느려 사용자 경험 저하 (3초+ 대기)
- 홈 화면에서 이미 검증된 최적화 기법 재사용 가능  
**최적화 기법**: 
1. localStorage 캐시 (5분 TTL) - 무료 콘텐츠 데이터 재사용
2. 우선순위 프리로딩 - 처음 3개 `high` priority 즉시 로드
3. 백그라운드 프리페칭 - 4-6번째 썸네일 `low` priority 500ms 지연 로드
4. 캐시 히트 시에도 이미지 프리로드 (화면 전환 부드럽게)  
**영향**: `/components/LoadingPage.tsx`, `/lib/imagePreloader.ts`  
**성능 개선**: 썸네일 First Contentful Paint 약 60% 단축

---

## 2025-12-20

### 스크롤 복원: sessionStorage + useLayoutEffect 조합
**결정**: 브라우저 네이티브 스크롤 복원(`history.scrollRestoration = 'manual'`) 비활성화 후, sessionStorage + useLayoutEffect로 직접 구현  
**이유**: React Router v6에서 페이지 전환 시 React 렌더링 순서 때문에 브라우저 자동 복원이 제대로 작동하지 않음. 콘텐츠가 충분히 로드된 후 복원해야 깜빡임 없음  
**영향**: `/pages/HomePage.tsx`, `/utils/scrollRestoreLogger.ts`  
**트레이드오프**: 복잡도 증가, 디버깅 난이도 상승 (로거 추가로 완화)

---

## 2025-12-19

### 무료 콘텐츠: FreeContentService 싱글톤 클래스 패턴
**결정**: 무료 콘텐츠 로직을 `FreeContentService` 싱글톤 클래스로 분리  
**이유**: 
- 로그인/로그아웃 사용자 분기 로직이 복잡함 (localStorage vs DB)
- 여러 컴포넌트에서 재사용 필요
- JSDoc으로 API 문서화 가능  
**영향**: `/lib/freeContentService.ts`, `/components/FreeProductDetail.tsx`, `/components/FreeContentLoading.tsx`  
**참고**: `/docs/FREE_CONTENT_ARCHITECTURE.md`

---

## 2025-12-18

### 사주 정보 입력: 4개 컴포넌트로 분리
**결정**: 사주 입력 UI를 용도별로 4개 파일로 분리  
- `FreeBirthInfoInput.tsx` (무료 콘텐츠용)
- `BirthInfoInput.tsx` (유료 결제용)
- `SajuInputPage.tsx` (프로필 관리용)
- `SajuAddPage.tsx` (관계 사주 추가용)  
**이유**: 
- 각 맥락마다 저장 로직이 다름 (localStorage vs orders.saju_record_id vs saju_records)
- 공통 로직 추출 시 props drilling 지옥 발생
- 중복 코드보다 명확한 책임 분리가 유지보수에 유리  
**영향**: 전체 사주 입력 플로우  
**트레이드오프**: 중복 코드 발생 (허용 가능)

---

### 대표 사주: `is_primary` 필드 추가
**결정**: `saju_records` 테이블에 `is_primary (boolean)` 컬럼 추가. 사용자당 1개만 true 허용  
**이유**: 
- `notes = '본인'`만으로는 여러 개의 본인 사주 중 대표를 선택할 수 없음
- UX: "이 사주를 대표로 설정" 기능 필요  
**영향**: `/supabase/migrations/20241218_*.sql`, `/components/SajuManagementPage.tsx`  
**구현**: Database Trigger로 한 사용자의 다른 사주는 자동으로 `is_primary = false`로 변경

---

### 사주 음력/양력 구분: `calendar_type` 및 띠 자동 계산
**결정**: `saju_records` 테이블에 `calendar_type (solar/lunar)`, `zodiac (띠)` 컬럼 추가  
**배경**: 
- 기존에는 양력/음력 구분 없이 날짜만 저장
- 띠(십이지) 계산이 사주 해석에 필수적이지만 매번 계산하는 것은 비효율적  
**구현**:
- `calendar_type`: 사용자 입력 시 선택 ('solar' | 'lunar')
- `zodiac`: Database Function으로 생년월일 기반 자동 계산 및 저장  
**영향**: 
- `/lib/zodiacUtils.ts` - 띠 계산 로직
- `/supabase/DATABASE_TRIGGERS_AND_FUNCTIONS.md` - `calculate_zodiac()` 함수
- 모든 사주 입력 컴포넌트  
**결과**: AI 프롬프트에 띠 정보 포함하여 더 정확한 운세 생성 가능

---

## 2025-12-17

### 쿠폰 시스템: `source_order_id` vs `used_order_id`
**결정**: `user_coupons` 테이블에 두 개의 FK 추가  
- `source_order_id`: 쿠폰이 **발급된 원인**이 된 주문 (재방문 쿠폰용)
- `used_order_id`: 쿠폰을 **사용해서 결제한** 주문  
**이유**: 
- 재방문 쿠폰: 첫 결제(A) 완료 → 쿠폰 발급(`source_order_id = A`) → 두 번째 결제(B)에 사용(`used_order_id = B`)
- 단순히 `is_used` boolean만으로는 발급 맥락 추적 불가  
**영향**: `/lib/coupon.ts`, Edge Function `/issue-revisit-coupon`  
**참고**: `/docs/COUPON_SOURCE_ORDER_MIGRATION.md`

---

### 카카오 알림톡 통합: TalkDream API
**결정**: 결제 완료 시 카카오 알림톡 자동 발송 기능 추가  
**배경**: 
- 사용자가 결제 후 AI 생성 완료 시점을 놓치는 문제
- 푸시 알림보다 카카오톡이 도달률 높음 (95%+)  
**구현**:
- Edge Function `/send-alimtalk` 생성
- 결제 완료 → Webhook → 알림톡 발송
- TalkDream API 연동 (Supabase Secrets에 토큰 저장)  
**템플릿**:
```
[타로마루] 🔮 운세 결과가 완성되었습니다!
지금 바로 확인해보세요 👉 [링크]
```
**영향**: Edge Functions, 결제 플로우  
**비용**: 알림톡 1건당 약 9원 (발송 성공 시만 과금)  
**결과**: 결제 후 이탈률 감소, 사용자 만족도 향상

---

## 2025-12-16

### 이미지 최적화: Supabase Storage Thumbnail Variant
**결정**: 모든 썸네일 이미지는 `getThumbnailUrl(url, 'list' | 'detail')` 헬퍼 함수 사용  
**이유**: 
- 원본 이미지 크기가 크면 홈 화면 로딩 느려짐
- Supabase Storage가 자동으로 리사이즈 제공 (`?width=300`)  
**영향**: `/lib/image.ts`, `/pages/HomePage.tsx`, 모든 콘텐츠 상세 페이지  
**성능 개선**: 첫 로딩 시간 3.2초 → 1.1초 (70% 단축)

---

## 2025-12-15

### 타입 안전성: `any` 타입 전면 금지
**결정**: 프로젝트 전체에서 `any` 타입 사용 금지. Supabase API 응답은 반드시 interface 정의  
**이유**: 
- AI가 코드 해석 시 타입 정보가 가장 강력한 힌트
- 런타임 에러를 컴파일 타임에 방지  
**영향**: 전체 프로젝트  
**예외**: 외부 라이브러리 타입 정의 없을 때만 `unknown` 허용 후 타입 가드 사용

---

## 2025-12-14

### 스타일링: Tailwind CSS v4.0 토큰 시스템
**결정**: `globals.css`에 CSS 변수로 디자인 토큰 정의. 폰트 관련 Tailwind 클래스(`text-*`, `font-*`) 사용 금지  
**이유**: 
- Figma 디자인의 타이포그래피가 HTML 태그별로 정의됨 (`h1`, `h2`, `p`)
- Tailwind 클래스와 충돌 방지  
**영향**: `/styles/globals.css`, 전체 컴포넌트  
**예외**: 사용자가 명시적으로 특정 폰트 크기/굵기 요청 시에만 클래스 사용

---

## 2025-12-13

### 무료 콘텐츠: localStorage 캐시 전략
**결정**: 로그아웃 사용자의 무료 콘텐츠는 DB 저장 없이 localStorage에만 휘발성 저장  
**이유**: 
- 개인정보 수집 최소화 (비로그인 사용자는 DB에 아무것도 저장하지 않음)
- 서버 부하 감소
- 로그인 유도 효과 ("로그인하면 결과를 영구 저장할 수 있어요")  
**영향**: `/lib/freeContentService.ts`  
**트레이드오프**: 브라우저 캐시 삭제 시 결과 소실 (허용)

---

## 2025-12-12

### AI 생성: Edge Function 분리 (무료 vs 유료)
**결정**: 무료/유료 콘텐츠의 AI 생성 로직을 별도 Edge Function으로 분리  
- `/generate-free-preview` (무료용, 짧은 응답)
- `/generate-master-content` (유료용, 긴 응답)  
**이유**: 
- 무료는 빠른 응답(30초), 유료는 품질 중시(2분)
- 무료는 미리보기만, 유료는 DB 저장 필수
- API Rate Limit 분리  
**영향**: Supabase Edge Functions  
**비용**: 무료 함수는 캐싱 적극 활용 (AI API 호출 최소화)

---

### Edge Functions 확장: 총 20개 운영
**결정**: AI 생성, 쿠폰, 사용자 관리, 결제/환불 등을 위한 Edge Functions를 20개로 확장
**분류**:
- AI 생성: 8개 (사주/타로 각 4개)
- 쿠폰 관리: 4개 (조회, 적용, 발급 2개)
- 사용자 관리: 2개
- 알림: 1개 (카카오 알림톡)
- 결제/환불: 3개 (웹훅, 결제 처리, 환불 처리)
- 기타: 2개 (서버 상태, 콘텐츠 답변)
**이유**: 
- 비즈니스 로직을 클라이언트에서 분리하여 보안 강화
- API 키 노출 방지
- 서버리스 아키텍처로 비용 최적화  
**영향**: `/supabase/functions/`, `/supabase/EDGE_FUNCTIONS_GUIDE.md`  
**비용**: 월 500K 요청까지 무료 (Supabase Free Tier)

---

## 2025-12-10

### 컴포넌트 구조: components vs pages 분리
**결정**: 라우트 페이지는 `/pages/`에, 재사용 컴포넌트는 `/components/`에 배치  
**이유**: 
- React Router v6에서 `/App.tsx`가 라우터 역할
- Figma Make 환경에서는 `/App.tsx`가 진입점 고정
- 명확한 책임 분리  
**영향**: 전체 파일 구조  
**예외**: Figma 임포트 컴포넌트는 라우트여도 `/components/`에 유지 (Figma 디자인 추적 용이)

---

### 컴포넌트 총 52개로 확장
**결정**: 프로젝트 컴포넌트를 52개로 확장 (페이지 38개 + UI 14개)  
**배경**: 
- 초기 20여 개에서 기능 확장으로 증가
- 타로 서비스 추가로 4개 컴포넌트 증가
- 사주 관리, 쿠폰, 프로필 기능 강화  
**관리 방법**:
- `components-inventory.md`로 전체 컴포넌트 추적
- 카테고리별 분류 (인증, 결제, 무료/유료 콘텐츠, 타로, 사주 관리 등)
- 백업 컴포넌트는 `/components/_backup/`로 이동  
**영향**: `/components-inventory.md`  
**유지보수**: 새 컴포넌트 추가 시 인벤토리 즉시 업데이트

---

## 작성 가이드

1. **날짜 역순 정렬** (최신이 위)
2. **제목은 한 줄 요약**
3. **이유는 구체적으로** (숫자, 성능 개선 수치 포함 권장)
4. **영향 범위 명시** (파일 경로)
5. **트레이드오프 기록** (단점도 솔직하게)
6. **배경/고려한 대안/최종 결정 구조** (ADR 형식)
7. **코드 예시 포함** (가능한 경우)

---

## [2026-02-06] 선택 안 한 태그 재추출 방지

### 문제 상황
- 사용자가 나다움 기록하기에서 태그를 선택하지 않으면, 다음 콘텐츠에서 동일/유사한 태그가 다시 추출됨
- 사용자 경험 관점에서 이미 거부한 태그가 반복 노출되는 것은 바람직하지 않음

### 결정 사항
- `users.rejected_tags text[]` 컬럼에 미선택 태그를 누적 저장
- `extract-trait-tags` Edge Function 프롬프트에 금지 태그 섹션 추가
- AI가 동일하거나 의미가 매우 유사한 태그를 추출하지 않도록 지시

### 구현 방식
- **저장 시점**: `CheckRecordMe`에서 태그 확정 시 (saveTags, handleSave 모두)
- **조회 시점**: `App.tsx` (FreeResultPage), `UnifiedResultPage.tsx`에서 태그 추출 전
- **전달 방식**: `rejectedTags` 파라미터로 Edge Function에 전달
- **중복 제거**: `appendRejectedTags()`에서 Set으로 병합

### 근거
- DB 컬럼 방식 선택: 사용자별 영구 저장 필요, localStorage는 기기 종속적
- `users` 테이블에 추가: 별도 테이블 불필요 (본인 row만 읽기/쓰기)
- RLS 추가 불필요: 기존 `users` UPDATE 정책으로 커버
- 인덱스 불필요: 본인 row만 조회하므로 PK로 충분

---

## 📊 주요 결정 통계 (2026-01-16 기준)

- **총 결정 기록**: 38개
- **아키텍처 변경**: 10개 (사주 API 서버 직접 호출)
- **성능 최적화**: 6개 (이미지 캐시 버스팅)
- **사용자 경험 개선**: 13개 (결제 오버레이 감지, 0원 결제 UX)
- **보안/권한**: 7개 (Storage RLS 정책)
- **개발 안정성**: 3개

---

---

### iOS 스와이프 뒤로가기: 콘텐츠 상세 페이지 navigate('/') → navigate(-1) 전환
**결정**: 콘텐츠 상세 페이지의 뒤로가기/홈 버튼에서 `navigate('/')` (push mode) 대신 `navigate(-1)` 사용
**날짜**: 2026-02-06

**배경**:
- 홈 → 유료 상세 → 홈 → 무료 상세 → 홈 → 유료 상세 → iOS 스와이프 뒤로가기 시
- 홈이 아닌 무료 상세로 이동하고, 이후 페이지가 닫히는 버그
- 4~5번째 사이클부터 히스토리 스택이 꼬이기 시작

**문제 원인**:
```typescript
// ❌ navigate('/') = history.push → 히스토리 스택에 '/' 엔트리 중복 추가
onBack={() => navigate('/')}
onHome={() => navigate('/')}
```

**히스토리 스택 분석**:
```
정상 (navigate(-1)):
[Buffer×5, Home] → click → [Buffer×5, Home, Detail] → back → [Buffer×5, Home]

버그 (navigate('/')):
[Buffer×5, Home] → click → [Buffer×5, Home, Detail]
→ navigate('/') → [Buffer×5, Home, Detail, Home(NEW!)]  ← push로 중복!
→ click → [Buffer×5, Home, Detail, Home, Detail2]
→ navigate('/') → [Buffer×5, Home, Detail, Home, Detail2, Home(NEW!)]
→ iOS 스와이프 → Detail2로 이동 (Home이 아닌!)
```

**해결 방법**:
```typescript
// ✅ navigate(-1) = history.back() → 자연스러운 히스토리 탐색
onBack={() => navigate(-1)}
onHome={() => navigate(-1)}

// ✅ 에러 fallback은 replace로 (히스토리 쌓지 않음)
navigate('/', { replace: true })
```

**수정 파일 (3개)**:
- `src/App.tsx`: FreeContentDetailWrapper onHome, ProductDetailPage FreeContentDetail onBack/onHome (3곳)
- `src/components/MasterContentDetailPage.tsx`: 모든 navigate('/') → navigate(-1) (10곳)
- `src/components/FreeContentLoading.tsx`: 에러 fallback navigate('/') → navigate('/', { replace: true }) (11곳)

**핵심 원리** (기존 결정 재확인):
- `navigate('/')` (push mode)는 히스토리 스택에 중복 '/' 엔트리를 만들어 iOS 버퍼 시스템과 충돌
- 콘텐츠 상세에서 홈으로 돌아갈 때는 반드시 `navigate(-1)` 사용 (자연스러운 히스토리 탐색)
- 에러/예외 상황의 fallback은 `navigate('/', { replace: true })` 사용 (스택 오염 방지)
- **향후 새 페이지에서 홈으로 돌아가는 버튼 추가 시 반드시 `navigate(-1)` 사용할 것**

**테스트**: iOS Safari에서 홈 ↔ 유료/무료 상세 반복 이동 후 스와이프 뒤로가기로 정상 복귀 확인

---

---

## [2026-02-09] 유료 콘텐츠 초개인화 프롬프트 (나다움 태그 기반)

### 결정 사항
- `generate-saju-answer`, `generate-tarot-answer`에 `personalizationData` 파라미터 추가
- `generate-content-answers`에서 `user_trait_tags` 테이블 조회 후 태그 데이터를 하위 함수에 전달
- 태그가 있는 사용자: 최근 4주 태그 + 누적 태그 + 심리 흐름을 프롬프트에 포함
- 태그가 없는 사용자: 기존 기본 프롬프트 유지

### 초개인화 분기 조건
```typescript
if (pData && (pData.recentPositiveTags.length > 0 || pData.allPositiveTags.length > 0))
```
- positive 태그가 1개라도 있으면 초개인화 프롬프트 적용
- negative만 있고 positive가 0개인 경우 기본 프롬프트

### 프롬프트 구조 (초개인화 시)
```
## 질문자 정보
### 상황 (기존 questionerInfo)
### 질문자가 직접 선택한 기질/성향
  - 최근 4주 강점/단점 태그 (최우선 근거)
  - 누적 강점/단점 태그 (배경 지식)
### 질문자의 최근 4주간 심리 흐름
```

### 근거
- 사용자가 모은 나다움 태그를 운세 풀이에 반영하여 개인화 정확도 향상
- `generate-content-answers`에서 한 번만 DB 조회 후 하위 함수에 전달 (효율적)
- 조회 실패 시 graceful degradation (기본 프롬프트로 fallback)

### 영향 범위
- `supabase/functions/generate-content-answers/index.ts` - 태그 조회 + 전달 로직 추가
- `supabase/functions/generate-saju-answer/index.ts` - personalizationData 수신 + 프롬프트 분기
- `supabase/functions/generate-tarot-answer/index.ts` - 동일 패턴 적용
- 불필요한 `master_content_questions` DB 업데이트 로직 제거 (두 함수 모두)

### 배포 상태
- **프로덕션**: 2026-02-09 배포 완료 (generate-content-answers, generate-saju-answer, generate-tarot-answer)
- **스테이징**: 2026-02-06 배포 완료

---

### 미션성공쿠폰 추가 및 쿠폰 발급 프로세스 변경

**결정**: `coupons` 테이블에 `mission` 타입 쿠폰 추가, 주간 보고서 쿠폰 발급 로직 변경

**배경**:
- 기존: 주간 보고서 완료 시 항상 재방문 쿠폰 (revisit) 발급
- 변경: 1회차 보고서 → 미션성공쿠폰 (mission), 2회차 이후 → 재방문쿠폰 (revisit)
- 쿠폰 이름: "미션쿠폰" → "미션성공쿠폰"으로 명칭 변경

**구현**:
- `coupons` 테이블에 `coupon_type = 'mission'` 레코드 추가 (프로덕션 + 스테이징)
- CompletionCoupon에서 보고서 차수에 따라 쿠폰 타입 분기 (스테이징)

**배포 상태**:
- **프로덕션**: 미션성공쿠폰 데이터 + 발급 로직 모두 배포 완료 (2026-02-10)
- **스테이징**: 동일

**영향 범위**:
- `coupons` 테이블 - mission 타입 레코드 추가
- `supabase/migrations/20260206_add_mission_coupon.sql` - 마이그레이션 파일
- `src/components/CompletionCoupon.tsx` - 쿠폰 발급 분기 로직
- `supabase/functions/issue-revisit-coupon/` - 미션/재방문 쿠폰 분기 처리

---

### iOS 스와이프 뒤로가기: FreeContentDetail 버그 수정

**결정**: FreeContentDetail의 `navigate('/')` → `navigate(-1)` 전환 + contentId 변경 감지 가드 + bfcache 핸들러 추가

**문제**:
- 홈 → 무료 콘텐츠 상세(`/free/content/:id`) → iOS 스와이프 뒤로가기 시, 홈이 아닌 **다른 무료 콘텐츠 상세**로 이동
- `history.length: 100` (브라우저 최대치) 상태에서 히스토리 스택이 오염되어 발생
- MasterContentDetailPage는 이미 `navigate(-1)`로 수정되었으나 FreeContentDetail만 미적용 상태

**원인**:
1. FreeContentDetailWrapper/ProductDetailPage의 `onBack`/`onHome`이 `navigate('/')` (push) 사용 → 히스토리 엔트리를 계속 쌓아 history.length=100까지 증가
2. iOS Safari에서 히스토리 최대치 도달 시 pushState의 forward entry 정리가 불완전

**수정 내용**:
1. **navigate('/') → navigate(-1)** (App.tsx 3곳): FreeContentDetailWrapper, ProductDetailPage(캐시), ProductDetailPage(일반)의 onBack/onHome
2. **contentId 변경 감지 가드** (FreeContentDetail.tsx): `prevContentIdRef`로 같은 컴포넌트 인스턴스에서 contentId 변경 시 홈으로 리다이렉트
3. **bfcache 핸들러** (FreeContentDetail.tsx): FreeSajuDetail 패턴 따라 `pageshow` 이벤트 핸들러 추가

**안전성**:
- contentId 변경 감지는 `/free/content/:id` 라우트에서 같은 인스턴스가 다른 id로 re-render되는 경우(스와이프 뒤로가기)만 해당
- 추천 콘텐츠 클릭은 `/master/content/detail/`로 이동하므로 간섭 없음

**영향 범위**:
- `src/App.tsx` - FreeContentDetailWrapper, ProductDetailPage onBack/onHome
- `src/components/FreeContentDetail.tsx` - useFreeContentDetail 훅에 가드 로직 추가

---

## [2026-02-10] 가입축하쿠폰 할인 금액 인상 (3000원 → 5000원)

**결정 사항**:
- 가입축하쿠폰(welcome) 할인 금액을 3,000원에서 5,000원으로 인상

**구현**:
- `coupons` 테이블의 `discount_amount` 값 UPDATE (SQL 직접 실행)
- Edge Function `issue-welcome-coupon` 재배포

**배포 상태**: 프로덕션 + 스테이징 모두 반영 완료

---

## [2026-02-10] 프로필 폰번호 바텀시트 1회 제한

**결정 사항**:
- 프로필 → "나의 분석 보고서" 탭 클릭 시 폰번호 입력 바텀시트가 매번 뜨던 것을 **최초 1회만** 표시하도록 변경

**근거**:
- UX 개선: 번호 입력을 원하지 않는 사용자가 매번 팝업을 닫아야 하는 불편 해소
- 건너뛰기(닫기) 시에도 보고서 페이지로 자연스럽게 이동

**구현**:
- `localStorage`에 `phone_bottomsheet_shown` 플래그 저장
- 조건: `primarySaju` 있음 + `phone_number` 없음 + 플래그 없음 → 바텀시트 1회 표시
- 닫기(X) 클릭 시: 바텀시트 닫고 보고서 페이지로 이동

**영향 범위**:
- `src/components/ProfilePage.tsx` - 탭 클릭 핸들러 + onClose 콜백

---

## [2026-02-10] CompletionCoupon 하단 버튼 iOS Chrome 고정

**결정 사항**:
- 쿠폰 완료 화면의 "홈으로 가기" 버튼이 iOS Chrome에서 하단 고정되지 않는 문제 수정

**근거**:
- `sticky bottom-0`은 iOS Chrome에서 부모의 `overflow-hidden` + 내부 `transform` 조합 시 작동 안 함
- `fixed`도 동일한 이유로 실패

**구현**:
- `h-screen` + `overflow-hidden` → `height: 100dvh` (iOS 주소창 동적 대응)
- `sticky`/`fixed` → **flex 레이아웃** (`shrink-0`으로 버튼 영역 확보, `flex-1 min-h-0`으로 콘텐츠만 스크롤)
- `env(safe-area-inset-bottom)` 적용

**영향 범위**:
- `src/components/CompletionCoupon.tsx` - 레이아웃 구조 변경

---

## [2026-03-05] 사주/타로 상담 체험 기능

### 배경
- 홈 고도화의 일환으로 AI 사주/타로 상담 체험 기능 추가
- 무료 콘텐츠와 유료 콘텐츠 사이의 퍼널 역할

### 결정
1. **상담 플로우**: 질문 입력(300자) → 사주 확인 → AI 생성 → 결과 + 동적 추천
2. **비회원 제한**: fingerprint(SHA-256(IP+UA)) 기반 최초 1회 (`anonymous_consult_views` 테이블)
3. **로그인 유저 제한**: 1일 1회 (Edge Function에서 DB 레벨 검증)
4. **사주 조회 패턴**: `.eq('is_primary', true).single()` 대신 전체 목록 조회 후 JS `find(s.is_primary)` — ProfilePage와 동일 패턴 (PostgREST 406 에러 방지)
5. **동적 추천**: AI가 `recommendedCategory` 분류 → `consultRecommendationService`가 sub→main→전체 우선순위로 유료 콘텐츠 6개 조회
6. **타로 특징**: 사주 입력 불필요, 78장 덱 랜덤 카드, 3D 카드 플립 애니메이션
7. **세션 인증 타이밍**: 로그인 직후 DB 쿼리 시 `getSession()` 사용 (getUser()는 DB 쿼리의 Authorization 헤더에 반영 안 됨)

### 관련 파일
- 페이지: `SajuConsultPage`, `SajuConsultLoadingPage`, `SajuConsultResultPage`, `TaroConsultPage`, `TaroConsultLoadingPage`, `TaroConsultResultPage`
- Edge Functions: `generate-saju-consult`, `generate-tarot-consult`
- 서비스: `consultStatus.ts`, `consultLimitService.ts`, `consultRecommendationService.ts`

---

## 2026-03-05 미션 리워드 fingerprint 기반 기기 중복 방지

### 문제
태그 5개 달성 시 새싹 30개 지급하는 미션 리워드를, 같은 기기에서 다른 계정으로 로그인하여 반복 수령 가능

### 결정
1. `grant-mission-sprout` Edge Function에서 IP+UA SHA-256 fingerprint 생성 (기존 `generate-free-preview` 등과 동일 패턴)
2. `process_mission_reward` RPC에 `p_ip_fingerprint`, `p_check_only` 파라미터 추가
   - user_id 중복 체크 + fingerprint 기기 중복 체크 이중 검증
   - `check_only=true`: 지급 없이 자격만 확인 (컴포넌트 마운트 시 사전 체크)
3. fingerprint 차단된 사용자: 태그는 정상 저장, 태그 안내 페이지 + 미션 완료 페이지 모두 스킵 → 조용히 홈 이동 (별도 안내 없음)
4. `sprout_transactions.ip_fingerprint` 컬럼에 기록 저장

### 관련 파일
- DB: `sprout_transactions.ip_fingerprint` 컬럼, `process_mission_reward` RPC
- Edge Function: `grant-mission-sprout/index.ts`
- Frontend: `CheckRecordMe.tsx` (마운트 시 check_only 호출 + 지급 시 fingerprint_used 처리)

---

---

## 2026-03-06 Toast 시스템 UI 개선 및 위치 제어

### 결정
1. **Toast dark variant 스타일 확정**
   - 배경: `rgba(0, 0, 0, 0.40)` + `backdropFilter: blur(24px)` + `-webkit` prefix
   - 패딩: `6px 11px 6px 8px`, 아이콘-텍스트 갭: `6px`, 아이콘: 23px
   - 폰트: 13px Regular, 흰색
   - 동일 스타일을 NadaumTagsList 태그 삭제 토스트에도 적용

2. **Toast 등장 애니메이션**
   - `toast-animate-enter`: 아래→위 16px + scale 0.82→1
   - `cubic-bezier(0.16, 1, 0.3, 1)` ease-out (spring 오버슈트 제거)
   - `transform-origin: bottom center` — keyframes 내부가 아닌 CSS 규칙에 적용해야 함

3. **Toast 위치 제어 방식**
   - Sonner v2의 내부 포지셔닝을 최대한 활용
   - `[data-sonner-toaster]`의 `bottom`만 CSS `!important`로 오버라이드: `calc(env(safe-area-inset-bottom, 0px) + var(--toast-bottom-offset, 20px))`
   - 이전의 `transform: none`, `left/right: 0`, `display: flex`, `[data-sonner-toast] position: relative` 오버라이드가 Sonner 내부 레이아웃과 충돌하여 제거
   - App.tsx: `offset="20px"`, `className` 오버라이드 제거

4. **CTA 위 토스트 배치**
   - `toast.setBottomOffset(ctaHeight)`: `:root`의 `--toast-bottom-offset`을 `ctaHeight + 12px`로 설정
   - `toast.resetBottomOffset()`: 프로퍼티 제거로 기본값 20px 복원

### 관련 파일
- `/src/components/ui/Toast.tsx`
- `/src/styles/globals.css` (toast CSS 블록)
- `/src/lib/toast.tsx`
- `/src/App.tsx` (Toaster 설정)
- `/src/components/NadaumTagsList.tsx` (태그 삭제 토스트)

---

## 2026-03-10 iOS 모바일 스크롤 & 하단 버튼 가림 문제 해결

### 배경
- 문의하기(InquiryWritePage), 문의 내역(InquiryListPage), 문의 관리(MasterInquiryPage) 페이지에서 iOS Chrome 하단 툴바에 CTA 버튼이 가려지고, 스크롤이 동작하지 않는 문제 발생

### 문제 1: 하단 CTA 버튼이 iOS Chrome 툴바에 가려짐

**원인**: flex `shrink-0`로 배치된 하단 버튼이 iOS Chrome에서 브라우저 하단 툴바 뒤에 위치

**해결**: SajuConsultPage와 동일한 `position: absolute; bottom: 0` 패턴 적용

```
❌ 기존 (flex shrink-0 패턴)
<div class="h-full flex flex-col">
  <div class="shrink-0">헤더</div>
  <div class="flex-1 overflow-auto">콘텐츠</div>
  <div class="shrink-0">CTA 버튼</div>  ← iOS Chrome 툴바에 가려짐
</div>

✅ 수정 (absolute 패턴 — SajuConsultPage 동일)
<div style="position: relative; height: 100%; display: flex; flex-direction: column">
  <div>헤더</div>
  <div style="flex: 1; overflow-y: auto; padding-bottom: 100px">콘텐츠</div>
  <div style="position: absolute; bottom: 0; left: 0; right: 0">CTA 버튼</div>
</div>
```

**핵심 포인트**:
- 스크롤 영역에 `paddingBottom: 100px`을 줘서 absolute 버튼 뒤의 콘텐츠 가림 방지
- `position: absolute; bottom: 0`이 iOS Chrome에서도 브라우저 툴바 위에 정상 배치됨
- `100dvh`, `env(safe-area-inset-bottom)` 등은 iOS Chrome에서 효과 없음

### 문제 2: iOS에서 스크롤이 동작하지 않음

**원인**: `overflow-auto` 사용 시 iOS에서 스크롤 전파 문제 발생

**해결**: ProfilePage에서 검증된 패턴으로 통일

```
❌ 기존
<div class="flex-1 overflow-auto">

✅ 수정 (ProfilePage 동일 패턴)
<div class="flex-1 overflow-y-auto overflow-x-hidden overscroll-y-contain">
```

**핵심 포인트**:
- `overflow-y-auto`: 세로 스크롤만 활성화
- `overflow-x-hidden`: 좌우 스와이프 방지
- `overscroll-y-contain`: iOS에서 스크롤 전파 차단 (부모 스크롤로 전파되지 않음)

### 적용 규칙 (향후 새 페이지 작성 시)

1. **하단 고정 CTA가 있는 페이지**: absolute 패턴 사용 + 스크롤 영역 paddingBottom
2. **스크롤 영역**: 항상 `overflow-y-auto overflow-x-hidden overscroll-y-contain` 사용
3. **참고 페이지**: SajuConsultPage (CTA), ProfilePage (스크롤)

### 관련 파일
- `/src/components/InquiryWritePage.tsx`
- `/src/components/InquiryListPage.tsx`
- `/src/components/MasterInquiryPage.tsx`
- `/src/pages/SajuConsultPage.tsx` (참조 패턴)
- `/src/components/ProfilePage.tsx` (참조 패턴)

---

### 홈 버튼 네비게이션 — content_entry_source 무시, 항상 `/` 이동

**결정**: 홈 버튼(🏠 아이콘)은 유입 경로(`content_entry_source`)와 무관하게 항상 홈(`/`)으로 이동하도록 통일

**배경/문제**:
- 나다움 기록하기(`CheckRecordMe`)와 유료 상세(`MasterContentDetailPage`)의 홈 버튼이 `sessionStorage`의 `content_entry_source`(BEST 운세, 무료 운세 전체보기 등) 경로로 돌아가고 있었음
- 사용자가 홈 아이콘을 눌렀는데 홈이 아닌 중간 페이지로 이동하는 혼란 발생

**수정 내용**:
1. **`App.tsx` — `FreeNadaumRecordWrapper`**: `onHome={handleReturn}` → `onHome={() => navigate('/')}`
2. **`App.tsx` — `PaidNadaumRecordWrapper`**: `onHome={handleReturn}` → `onHome={() => navigate('/')}`
3. **`MasterContentDetailPage.tsx` — 헤더 홈 아이콘**: `onClick={onBack}` → `onClick={() => navigate('/', { replace: true })}`

**설계 원칙**:
- **홈 버튼(`onHome`)**: 항상 `/` — 사용자의 명시적 "홈으로 가겠다" 의사
- **스킵/완료(`onSkip`, `onComplete`)**: `content_entry_source`로 복귀 — 콘텐츠 플로우 자연스러운 이어보기
- **뒤로가기(`onBack`)**: `navigate(-1)` — 히스토리 자연 복귀

**관련 파일**:
- `/src/App.tsx` (FreeNadaumRecordWrapper, PaidNadaumRecordWrapper)
- `/src/components/MasterContentDetailPage.tsx` (헤더 홈 아이콘)
- `/src/components/CheckRecordMe.tsx` (handleHome → onHomeProp 호출)

---

### 사주 API 데이터 경량화 — 전체 JSON 대신 핵심 필드만 추출

**결정**: 사주 API(StargioSaju) 응답에서 전체 JSON을 AI 프롬프트에 넣지 않고, 핵심 20개 필드만 추출하여 전달

**배경/문제**:
- 사주 API 응답이 수십~수백 개 키를 포함하는 대용량 JSON
- 전체를 프롬프트에 포함하면 토큰 소모가 크고, AI 응답이 토큰 한도에 걸려 중간에 잘리는 현상 발생
- 마음톡 사주 상담(`mind-talk-chat`)에서 스트리밍 응답이 반복적으로 끊김

**추출 필드 (20개)**:
- **사주 구조**: 격국, 격국설명, 일주, 일주설명, 천간, 지지, 십성, 십이운성
- **운의 흐름**: 대운, 대운수, 세운
- **오행**: 발달오행, 오행비율
- **용신**: 용신, 용신설명, 희신
- **해석**: 성격, 적성, 건강
- **운세**: 올해운세, 이달운세, 오늘운세

**적용 범위**:
1. `supabase/functions/mind-talk-chat/index.ts` — 사주 모드 상담
2. `supabase/functions/generate-free-preview/index.ts` — 무료 콘텐츠 답변 생성

**효과**:
- 토큰 소모 대폭 절감 (API 비용 절약)
- AI 응답 잘림 현상 해소
- 응답 속도 개선 (컨텍스트가 작아 처리 빠름)

**관련 파일**:
- `/supabase/functions/mind-talk-chat/index.ts`
- `/supabase/functions/generate-free-preview/index.ts`

---

**문서 버전**: 4.0.0
**최종 업데이트**: 2026-03-11
**문서 끝**