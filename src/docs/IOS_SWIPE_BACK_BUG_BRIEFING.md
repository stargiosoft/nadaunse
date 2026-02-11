# iOS Safari 스와이프 뒤로가기 버그 - 다음 세션 브리핑

> **상태**: ✅ 해결 (2026-02-11) — Google OAuth를 팝업(새 탭) 모드로 전환하여 근본 해결
> **해결 방법**: 부모 탭의 히스토리를 오염시키지 않도록 Google OAuth를 `window.open()` 팝업에서 진행
> **재현 환경**: iOS Safari, 스테이징 배포 후 테스트
> **브랜치**: production (staging에 force push)

---

## 1. 버그 설명

**증상**: 홈 → 무료/유료 콘텐츠 상세 페이지 → iOS 스와이프 뒤로가기 → **홈이 아닌 Google OAuth 로그인 페이지로 이동**

**재현 조건**:
- Google 계정으로 회원가입/로그인 후
- 홈 ↔ 콘텐츠 상세를 2~3회 왕복
- 스와이프 뒤로가기 시 Google OAuth consent 페이지가 나타남

**사용자 기대**: 스와이프 뒤로가기 = 항상 홈(/)으로 이동

---

## 2. 현재 코드에 적용된 수정들 (모두 실패)

### 수정 1: navigate('/', { replace: true }) - 버튼 핸들러
- **파일**: `src/App.tsx`
- FreeContentDetailWrapper, ProductDetailPage의 onBack/onHome을 `navigate('/', { replace: true })`로 변경
- **결과**: 버튼 클릭은 정상, **스와이프 뒤로가기에는 효과 없음** (JS가 개입할 수 없음)

### 수정 2: History Guard Entry 패턴
- **파일**: `src/components/FreeContentDetail.tsx` (99~117줄), `src/components/MasterContentDetailPage.tsx` (174~192줄)
- 콘텐츠 상세 마운트 시 `replaceState('/')` + `pushState(currentUrl)`로 히스토리에 홈 엔트리 삽입
- **원리**: 스와이프 뒤로가기 → 바로 앞 엔트리가 '/' → 홈으로 이동
- **결과**: 이론상 맞지만, 실제로는 Guard Entry가 소모되거나 Google OAuth 엔트리가 너무 많아서 돌파됨

### 수정 3: DirectEntryHistoryGuard 수정
- **파일**: `src/App.tsx` (101~127줄)
- `replaceState(null)` → `replaceState(currentState)` (React Router state 보존)
- **결과**: 부분 개선, 근본 해결 안 됨

### 수정 4: Google OAuth replace 모드
- **파일**: `src/lib/auth.ts` (signInWithGoogle 함수)
- `skipBrowserRedirect: true` + `window.location.replace(data.url)` 사용
- **의도**: OAuth 페이지가 히스토리에 남지 않게
- **결과**: Google 내부 리다이렉트(계정 선택, consent)가 여전히 3~4개 엔트리를 추가함

### 수정 5: popstate 핸들러 (추가 후 제거)
- popstate 이벤트로 스와이프 감지 → `navigate('/', { replace: true })`
- **결과**: Guard Entry와 충돌. popstate가 guard entry의 내부 상태 변경까지 가로채서 엔트리 소모 → 오히려 악화
- **현재 상태**: 제거됨 (FreeContentDetail.tsx 83~85줄에 주석만 남음)

### 수정 6: contentId 변경 감지 가드
- **파일**: `src/components/FreeContentDetail.tsx` (72~81줄)
- 같은 컴포넌트 인스턴스에서 contentId가 바뀌면 홈으로 리다이렉트
- **결과**: contentId가 바뀌는 경우(같은 /free/content/:id 라우트 내 다른 id)에만 동작. Google OAuth로 이탈하는 건 막지 못함

### 수정 7: bfcache 핸들러
- **파일**: 두 컴포넌트 모두
- `pageshow` 이벤트의 `event.persisted` 체크
- **결과**: bfcache 복원 시에만 동작. 일반 스와이프 뒤로가기에는 트리거 안 됨

---

## 3. 근본적 문제 분석

### 핵심 원인: Google OAuth가 브라우저 히스토리에 제거 불가능한 엔트리를 추가

```
실제 히스토리 스택 (Google 로그인 후):
[1] 이전 페이지들...
[2] accounts.google.com/o/oauth2/auth   ← 제거 불가
[3] accounts.google.com/signin/oauth    ← 제거 불가
[4] accounts.google.com/CheckCookie     ← 제거 불가
[5] nadaunse.com/auth/callback          ← replace로 처리 가능
[6] nadaunse.com/ (홈)
[7] nadaunse.com/free/content/123       ← Guard Entry로 홈 삽입
```

- `window.location.replace()`는 **나다운세→Google** 이동 시 1개만 제거
- Google 내부에서 발생하는 리다이렉트(계정 선택, consent, CheckCookie 등)는 **제어 불가**
- 결과: 히스토리에 3~4개의 Google 엔트리가 항상 존재
- Guard Entry 1개로는 부족: 홈 왕복 2~3회 = guard entry 소모 → Google 엔트리에 도달

### 왜 Guard Entry가 소모되는가?

Guard Entry 패턴: `[/, /free/content/123]`
1. 스와이프 뒤로가기 → `/` (guard entry) 도달 → React Router가 홈 렌더링
2. 다시 콘텐츠 상세 진입 → 새 guard entry 삽입: `[/, /, /free/content/456]`
3. 스와이프 뒤로가기 → `/` (새 guard)
4. 다시 진입 → 또 guard 삽입

**문제**: 매번 guard entry를 push하므로 `history.length`가 계속 증가.
하지만 **guard entry의 '/' URL이 React Router에게 실제로 홈 라우트를 매칭시키는지**가 핵심 의문점.

Guard Entry는 `window.history.state`를 현재 페이지의 state 그대로 복사함. 즉:
- URL은 `/` 이지만
- React Router state의 `idx`는 **콘텐츠 상세 페이지 시점의 idx**
- React Router가 이 `idx`와 내부 카운터를 비교하여 delta를 계산
- delta가 예상과 다르면 올바른 라우트로 이동하지 못할 수 있음

### 아직 시도하지 않은 접근법

1. **Guard Entry에 올바른 React Router state 설정**:
   - 현재: guard entry에 콘텐츠 상세의 state를 그대로 복사 (idx가 같음)
   - 문제: React Router는 같은 idx를 가진 두 엔트리를 구분 못함
   - 시도: guard entry의 idx를 `현재idx - 1`로 설정? (이전에 시도했다가 React Router 깨짐)

2. **React Router의 history 스택 직접 조작**:
   - `createBrowserRouter`의 내부 history 객체에 접근하여 조작

3. **서비스 워커로 Google OAuth URL 가로채기**:
   - 스와이프로 Google URL에 도달하면 서비스 워커가 홈으로 리다이렉트하는 응답 반환

4. **완전히 다른 접근: popstate + 조건부 처리**:
   - popstate에서 `window.location.pathname`이 콘텐츠 상세가 아니면 무시
   - 콘텐츠 상세이면서 사용자가 방금 뒤로가기를 한 경우에만 처리
   - 이전 시도에서 Guard Entry와 충돌한 이유: Guard Entry 삽입 시 발생하는 내부 popstate까지 가로챔

5. **Guard Entry를 여러 개 삽입**:
   - 1개가 아닌 3~4개의 guard entry를 삽입하여 Google 엔트리 도달 방지
   - 부작용: history.length 더 빠르게 100 도달

6. **visibilitychange + 위치 체크**:
   - 페이지가 visible로 돌아왔을 때 현재 URL이 콘텐츠 상세가 아니면 홈으로 리다이렉트

7. **Google OAuth를 팝업으로 변경**:
   - 팝업 창에서 OAuth 진행 → 메인 윈도우 히스토리 오염 없음
   - Supabase Auth에서 팝업 모드 지원 여부 확인 필요

---

## 4. 현재 코드 위치

| 파일 | 내용 |
|------|------|
| `src/App.tsx:101-127` | DirectEntryHistoryGuard (외부 진입 시 홈 삽입) |
| `src/App.tsx:2458-2459` | FreeContentDetailWrapper onBack/onHome (replace) |
| `src/App.tsx:518-519, 677-678` | ProductDetailPage onBack/onHome (replace) |
| `src/components/FreeContentDetail.tsx:68-117` | useFreeContentDetail 훅 (contentId가드, bfcache, guard entry) |
| `src/components/MasterContentDetailPage.tsx:160-192` | bfcache + guard entry |
| `src/lib/auth.ts:133-162` | signInWithGoogle (skipBrowserRedirect + replace) |

---

## 5. 테스트 방법

1. `npx vite build` (프로젝트 루트에서)
2. `git add . && git commit -m "fix: ..." && git push origin production:staging --force`
3. Vercel 스테이징 빌드 완료 대기
4. iOS Safari에서:
   - 모든 탭 닫기
   - 스테이징 URL 접속
   - Google 계정으로 로그인
   - 홈 → 무료 콘텐츠 상세 → 스와이프 뒤로가기 (2~3회 반복)
   - Google OAuth 페이지로 이동하지 않는지 확인

---

## 6. 주의사항

- **popstate 핸들러는 절대 사용하지 마세요**: Guard Entry 패턴과 100% 충돌. pushState/replaceState가 내부적으로 popstate를 트리거하여 guard entry를 소모함.
- **React Router state의 idx를 절대 변경하지 마세요**: React Router v6는 내부 카운터와 state.idx를 비교하여 delta 계산. idx 변경 시 전체 라우팅 깨짐.
- **navigate('/')는 push**: 항상 `navigate('/', { replace: true })` 사용 필수.
- **window.history.state는 항상 null이 아닌 현재 state**: replaceState/pushState 시 반드시 현재 state 보존.
- **iOS Safari에서만 테스트 가능**: 데스크톱 브라우저에서는 스와이프 뒤로가기를 재현할 수 없음.

---

## 7. 해결 — Google OAuth 팝업(새 탭) 모드 전환 (2026-02-11)

### 핵심 인사이트
카카오 로그인은 이미 팝업 기반(`window.Kakao.Auth.login({ throughTalk: false })`)이라 이 문제가 없었음.
Google도 팝업/새 탭으로 전환하면 부모 탭의 히스토리가 오염되지 않음.

### 수정 파일
| 파일 | 변경 내용 |
|------|----------|
| `src/lib/auth.ts` | `signInWithGoogle` → `getGoogleOAuthUrl()`, `signInWithGooglePopup()`, `signInWithGoogleRedirect()` 3분할 |
| `src/pages/AuthCallback.tsx` | 팝업 모드 감지 (`google_oauth_popup_mode`) → localStorage 신호 전송 + `window.close()` |
| `src/components/LoginPageNew.tsx` | `handleGoogleLogin` 재작성: `window.open()` → 팝업 모드, 차단 시 redirect fallback |

### 플로우
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

### 기존 defense-in-depth 코드 (유지)
- `DirectEntryHistoryGuard` (App.tsx)
- Guard entries (FreeContentDetail, MasterContentDetailPage)
- HomePage 버퍼 전략 (5개 pushState)
- bfcache 핸들러
- 모든 `navigate(..., { replace: true })`
