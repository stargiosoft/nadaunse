# iOS Safari 스와이프 뒤로가기 버그 - 종합 브리핑

> **상태**: ✅ 해결 완료 (2026-02-11)
> **재현 환경**: iOS Safari, 스테이징/프로덕션
> **브랜치**: production

---

## 요약

이 프로젝트에서 iOS Safari 스와이프 뒤로가기는 **두 가지 별개의 버그**로 발생했다.
각각 근본 원인이 다르며, 독립적인 해결이 필요했다.

| # | 버그 | 근본 원인 | 해결 방법 | 해결일 |
|---|------|----------|----------|--------|
| 1 | 스와이프 시 Google OAuth 페이지로 이동 | Google OAuth redirect가 히스토리에 제거 불가능한 엔트리 3~4개 추가 | Google OAuth를 팝업(새 탭) 모드로 전환 | 2026-02-11 |
| 2 | 보고서 읽은 후 스와이프 시 `/my-report-list`로 이동 | MyReportList → 홈 이동 시 `replace: true` 누락 | `navigate('/', { replace: true })` 적용 (3곳) | 2026-02-11 |

---

## 버그 1: Google OAuth 히스토리 오염

### 증상
- 홈 → 무료/유료 콘텐츠 상세 → iOS 스와이프 뒤로가기 → **Google OAuth 로그인 페이지로 이동**
- Google 계정 로그인 후 홈 ↔ 콘텐츠 상세를 2~3회 왕복하면 재현

### 근본 원인

Google OAuth redirect 모드는 브라우저 히스토리에 **제거 불가능한** 엔트리를 3~4개 추가한다:

```
히스토리 스택 (Google 로그인 후):
[1] 이전 페이지들...
[2] accounts.google.com/o/oauth2/auth   ← 제거 불가
[3] accounts.google.com/signin/oauth    ← 제거 불가
[4] accounts.google.com/CheckCookie     ← 제거 불가
[5] nadaunse.com/auth/callback          ← replace로 처리 가능
[6] nadaunse.com/ (홈)
[7] nadaunse.com/free/content/123
```

- `window.location.replace()`는 나다운세→Google 이동 시 1개만 제거
- Google 내부 리다이렉트(계정 선택, consent, CheckCookie)는 **제어 불가**
- Guard Entry 1개로는 부족: 홈 왕복 2~3회 시 소모 → Google 엔트리에 도달

### 실패한 시도들 (7가지)

| # | 시도 | 결과 |
|---|------|------|
| 1 | `navigate('/', { replace: true })` 버튼 핸들러 | 버튼 클릭은 정상, 스와이프에는 효과 없음 |
| 2 | History Guard Entry 패턴 (`replaceState('/')` + `pushState`) | Guard Entry가 소모되면 Google 엔트리 돌파 |
| 3 | DirectEntryHistoryGuard state 보존 | 부분 개선, 근본 해결 안 됨 |
| 4 | Google OAuth `window.location.replace()` | Google 내부 리다이렉트 제어 불가 |
| 5 | popstate 핸들러 | Guard Entry와 충돌, pushState가 popstate 트리거 → 악화 |
| 6 | contentId 변경 감지 가드 | 같은 라우트 내 id 변경만 감지, OAuth 이탈 감지 불가 |
| 7 | bfcache 핸들러 (`pageshow`) | bfcache 복원 시에만 동작, 일반 스와이프에 무효 |

### 해결: Google OAuth 팝업(새 탭) 모드 전환

**핵심 인사이트**: 카카오 로그인은 이미 팝업 기반(`window.Kakao.Auth.login`)이라 이 문제가 없었음.
Google도 팝업/새 탭으로 전환하면 부모 탭의 히스토리가 오염되지 않는다.

**수정 파일**:
| 파일 | 변경 내용 |
|------|----------|
| `src/lib/auth.ts` | `signInWithGoogle` → `getGoogleOAuthUrl()`, `signInWithGooglePopup()`, `signInWithGoogleRedirect()` 3분할 |
| `src/pages/AuthCallback.tsx` | 팝업 모드 감지 (`google_oauth_popup_mode`) → localStorage 신호 전송 + `window.close()` |
| `src/components/LoginPageNew.tsx` | `handleGoogleLogin` 재작성: `window.open()` → 팝업 모드, 차단 시 redirect fallback |

**플로우**:
```
1. 사용자 "Google 로그인" 클릭
2. window.open('about:blank') → 새 탭 즉시 열기 (동기, iOS 팝업 차단 회피)
3. getGoogleOAuthUrl() → OAuth URL 획득 (비동기)
4. 새 탭을 OAuth URL로 이동
5. Google OAuth 전체 플로우가 새 탭에서 진행
6. /auth/callback 으로 리다이렉트 (새 탭)
7. AuthCallback이 팝업 모드 감지 → 세션 처리 → localStorage 신호 → window.close()
8. 부모 탭이 storage 이벤트로 결과 수신 → 콜백 실행
```

---

## 버그 2: MyReportList 히스토리 잔류

### 증상
- 프로필 → "나의 분석 보고서" 탭 → 보고서 전체 읽기 → 홈으로 이동
- 홈에서 무료/유료 콘텐츠 상세 진입
- iOS 스와이프 뒤로가기 → **홈이 아닌 `/my-report-list`(보고서 목록)로 이동**

### 근본 원인

보고서 플로우의 navigate 패턴을 추적하면 원인이 명확하다:

```
✅ ProfilePage → /my-report-list   : navigate('/my-report-list', { replace: true })  → 정상
✅ MyReportList → 보고서 상세       : navigate('/report-weekly-detail/:id', { replace: true }) → 정상
✅ 보고서 상세 → 타로 → 마음처방 → 응원글 : 모두 { replace: true } → 정상
✅ 보고서 플로우 → /my-report-list  : navigate('/my-report-list', { replace: true }) → 정상
❌ MyReportList → 홈 /             : navigate('/')  ← replace 없음! 문제!
```

**보고서 플로우 내부는 전부 `replace: true`를 사용**하여 히스토리 1슬롯만 차지한다.
그런데 마지막에 MyReportList에서 홈으로 돌아갈 때만 `replace: true`가 빠져있었다.

결과적으로 히스토리 스택이 이렇게 된다:

```
히스토리 스택 (보고서 읽고 홈으로 돌아온 후):
[1] ... 이전 페이지들
[2] /my-report-list     ← replace 없이 push해서 잔류!
[3] /                   ← 현재 (홈)
[4] /free/content/:id   ← 콘텐츠 클릭

스와이프 뒤로가기: [4] → [3] → [2] /my-report-list 도달!
```

FreeContentDetail의 History Guard Entry가 있으면 히스토리가 더 복잡해진다:

```
[1] ... 이전 페이지들
[2] /my-report-list          ← 잔류
[3] /                        ← 홈
[4] / (Guard Entry)          ← Guard가 삽입한 홈 URL
[5] /free/content/:id        ← 현재

스와이프 1회: [5] → [4] (Guard) → React Router가 / 렌더링
스와이프 2회: [4] → [3] / (동일, 변화 없어 보임)
스와이프 3회: [3] → [2] /my-report-list 도달!
```

실제 사용에서는 Guard Entry 소모와 bfcache 동작이 겹쳐서 스와이프 1~2회만에 `/my-report-list`에 도달하는 경우도 있다.

### 해결: `navigate('/', { replace: true })` 적용

**수정 파일**: `src/components/MyReportList.tsx` (3곳)

| 위치 | 컴포넌트 | 용도 | 수정 전 → 수정 후 |
|------|----------|------|-------------------|
| 라인 78 | `WeeklyTagSummary` | "나다움 태그 모으기" 버튼 | `navigate('/')` → `navigate('/', { replace: true })` |
| 라인 140 | `WeeklyEmptySummary` | "나다움 태그 모으기" 버튼 | `navigate('/')` → `navigate('/', { replace: true })` |
| 라인 1413 | ArrowLeft (뒤로가기) | 상단 뒤로가기 화살표 | `navigate('/')` → `navigate('/', { replace: true })` |

**수정 후 히스토리**:
```
[1] ... 이전 페이지들
[2] /                   ← /my-report-list를 replace하여 홈으로 교체
[3] /free/content/:id   ← 콘텐츠 클릭

스와이프 뒤로가기: [3] → [2] / (홈) ✅ 정상
```

---

## Defense-in-Depth 계층 (현재 적용 중)

이 프로젝트에서 iOS 스와이프 뒤로가기 문제를 방지하기 위해 여러 방어 계층이 적용되어 있다:

| 계층 | 위치 | 역할 |
|------|------|------|
| **Google OAuth 팝업** | `auth.ts`, `LoginPageNew.tsx`, `AuthCallback.tsx` | OAuth 히스토리 오염 원천 차단 |
| **History Guard Entry** | `FreeContentDetail.tsx`, `MasterContentDetailPage.tsx` | 콘텐츠 상세 진입 시 홈 엔트리 삽입 |
| **DirectEntryHistoryGuard** | `App.tsx` | 외부 링크(알림톡 등)로 직접 진입 시 홈 엔트리 삽입 |
| **replace: true 일관 적용** | 보고서 플로우, 회원가입 플로우, 사주 수정 등 | 플로우 완료 후 히스토리에 잔류하지 않도록 |
| **bfcache 핸들러** | `FreeContentDetail.tsx`, `PaymentNew.tsx` 등 | iOS bfcache 복원 시 상태 리셋 |
| **contentId 변경 감지** | `FreeContentDetail.tsx` | 같은 라우트에서 id 변경 시 홈으로 리다이렉트 |

---

## 주의사항 (향후 개발 시)

### 반드시 지켜야 할 규칙

1. **플로우 페이지에서 홈으로 이동 시 반드시 `{ replace: true }` 사용**
   - 보고서, 회원가입, 사주 입력/수정 등 "플로우"를 거친 후 홈으로 이동할 때
   - `navigate('/')` ❌ → `navigate('/', { replace: true })` ✅
   - 이유: replace 없이 push하면 플로우 페이지가 히스토리에 남아서 스와이프 시 도달

2. **popstate 핸들러 사용 금지**
   - Guard Entry 패턴과 100% 충돌
   - `pushState`/`replaceState`가 내부적으로 popstate를 트리거하여 Guard Entry 소모

3. **React Router state의 idx 변경 금지**
   - React Router v7은 내부 카운터와 `state.idx`를 비교하여 delta 계산
   - idx 변경 시 전체 라우팅 깨짐

4. **`window.history.state`는 항상 보존**
   - `replaceState`/`pushState` 시 반드시 현재 state를 전달
   - `replaceState(null, ...)` ❌ → `replaceState(window.history.state, ...)` ✅

### 체크리스트: 새 페이지/플로우 추가 시

- [ ] 플로우 내부 페이지 간 이동에 `{ replace: true }` 적용했는가?
- [ ] 플로우 완료 후 홈/이전 페이지로 이동 시 `{ replace: true }` 적용했는가?
- [ ] `navigate('/')` 또는 `navigate('/some-page')`가 replace 없이 사용된 곳이 없는가?
- [ ] iOS Safari 실기기에서 스와이프 뒤로가기 테스트했는가?

---

## 테스트 방법

1. `npx vite build` (프로젝트 루트)
2. 스테이징 배포 후 iOS Safari에서 테스트
3. 테스트 시나리오:

### 시나리오 A: Google OAuth 오염 테스트
1. iOS Safari에서 모든 탭 닫기
2. 스테이징 URL 접속 → Google 계정으로 로그인
3. 홈 → 무료 콘텐츠 상세 → 스와이프 뒤로가기 (3~5회 반복)
4. ✅ Google OAuth 페이지로 이동하지 않아야 함

### 시나리오 B: MyReportList 잔류 테스트
1. 프로필 → "나의 분석 보고서" 탭 클릭
2. 보고서 1개 선택 → 전체 플로우 진행 (상세 → 타로 → 마음처방 → 응원글 → 완료)
3. 보고서 목록 → 뒤로가기 (홈으로 이동)
4. 홈에서 무료/유료 콘텐츠 상세 진입
5. 스와이프 뒤로가기
6. ✅ 홈(/)으로 이동해야 하며, `/my-report-list`로 이동하면 안 됨

### 시나리오 C: 복합 테스트
1. Google 로그인 → 보고서 읽기 → 홈 → 콘텐츠 상세 → 스와이프 뒤로가기 반복
2. ✅ 항상 홈으로 돌아와야 함

---

## 관련 파일 참조

| 파일 | 내용 |
|------|------|
| `src/lib/auth.ts` | Google OAuth 팝업 모드 (`getGoogleOAuthUrl`, `signInWithGooglePopup`) |
| `src/pages/AuthCallback.tsx` | 팝업 모드 감지 + localStorage 신호 |
| `src/components/LoginPageNew.tsx` | Google 로그인 버튼 핸들러 (팝업 → fallback redirect) |
| `src/components/MyReportList.tsx` | 보고서 목록 → 홈 이동 시 `replace: true` 적용 (3곳) |
| `src/components/FreeContentDetail.tsx:100-118` | History Guard Entry 패턴 |
| `src/components/MasterContentDetailPage.tsx` | History Guard Entry + bfcache |
| `src/App.tsx:101-127` | DirectEntryHistoryGuard |
| `src/App.tsx` | 보고서 플로우 Wrapper들 (모두 `replace: true`) |

---

## 수정 이력

| 날짜 | 변경 내용 |
|------|----------|
| 2026-02-11 | **버그 2 해결** - MyReportList → 홈 이동 시 `navigate('/', { replace: true })` 적용 (3곳) |
| 2026-02-11 | **버그 1 해결** - Google OAuth를 팝업(새 탭) 모드로 전환하여 히스토리 오염 원천 차단 |
| 2026-02-10 | popstate 핸들러 제거 (Guard Entry와 충돌) |
| 2026-01-07~02-10 | 7가지 시도 (모두 실패 또는 부분 해결) |

---

**문서 최종 업데이트**: 2026-02-11
