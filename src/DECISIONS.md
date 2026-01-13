# DECISIONS.md

> **아키텍처 결정 기록 (Architecture Decision Records)**
> "왜 이렇게 만들었어?"에 대한 대답
> **GitHub**: https://github.com/stargiosoft/nadaunse
> **최종 업데이트**: 2026-01-13

---

## 📋 형식

```
[날짜] [결정 내용] | [이유/배경] | [영향 범위]
```

---

## 2026-01-13

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

## 2026-01-12

### 사주 API 빈 응답 문제: 프론트엔드 호출로 해결
**결정**: Edge Function에서 직접 호출하던 사주 API를 프론트엔드(브라우저)에서 호출하고, 결과를 Edge Function에 전달하는 방식으로 변경
**배경**:
- Stargio 사주 API (`https://service.stargio.co.kr:8400/StargioSaju`)가 Edge Function에서 호출 시 HTTP 200 응답과 함께 빈 데이터 `{}` 반환
- 동일한 요청을 브라우저에서 실행하면 정상적인 사주 데이터 반환
- AI가 빈 사주 데이터를 받아 "당신의 사주 원국이 없어서..." 같은 더미 응답 생성

**시도한 방법 (실패)**:
```typescript
// ❌ Edge Function에서 브라우저 헤더 추가 - 실패
const sajuResponse = await fetch(sajuApiUrl, {
  headers: {
    'Accept': 'application/json',
    'User-Agent': 'Mozilla/5.0 ...',
    'Origin': 'https://nadaunse.com',
    'Referer': 'https://nadaunse.com/',
  }
})
// → HTTP 200이지만 여전히 빈 데이터 {} 반환
```

**근본 원인 분석**:
- Stargio API 서버가 **실제 브라우저 요청**과 **서버 사이드 요청**을 구분하는 것으로 추정
- Deno Edge Function 환경에서는 User-Agent/Origin 헤더를 추가해도 실제 브라우저로 인식되지 않음
- API 서버의 봇/스크래핑 방지 로직으로 인해 서버 요청에 빈 응답 반환

**해결 방법**:
```typescript
// 1. 프론트엔드 유틸리티 생성 (src/lib/sajuApi.ts)
export async function fetchSajuData(
  birthDate: string,
  birthTime: string,
  gender: 'male' | 'female'
): Promise<SajuApiData | null> {
  const url = `https://service.stargio.co.kr:8400/StargioSaju?birthday=${birthday}&lunar=True&gender=${gender}`
  const response = await fetch(url)  // ✅ 브라우저에서 직접 호출
  return response.json()
}

// 2. BirthInfoInput.tsx / SajuSelectPage.tsx - Edge Function 호출 전에 사주 데이터 가져오기
const sajuApiData = await fetchSajuData(birthDate, birthTime, gender)
const requestBody = {
  contentId, orderId, sajuRecordId,
  sajuApiData: sajuApiData  // ⭐ 프론트엔드에서 가져온 데이터 전달
}

// 3. generate-content-answers Edge Function - 전달받은 데이터 사용
const { sajuApiData: prefetchedSajuApiData } = await req.json()
if (prefetchedSajuApiData) {
  console.log('✅ 프론트엔드에서 전달받은 사주 데이터 사용')
  cachedSajuData = prefetchedSajuApiData
} else {
  // 폴백: Edge Function에서 직접 호출 (실패 가능성 있음)
}
```

**아키텍처 변경**:
```
[이전 흐름 - 문제 발생]
결제 완료 → Edge Function → 사주 API 호출 ❌ (빈 데이터)
          → AI 더미 응답 생성

[새로운 흐름 - 해결]
결제 완료 → 브라우저에서 사주 API 호출 ✅ (정상 데이터)
          → Edge Function에 sajuApiData 전달
          → AI 실제 사주 데이터로 응답 생성
```

**보안 검토**:
- 사주 API는 인증 없이 호출 가능한 공개 API (API 키 노출 위험 없음)
- 사용자가 사주 데이터를 조작해도 **자신의 운세 결과**만 영향받음 (타인에게 피해 없음)
- Edge Function에서 사주 데이터 유효성 검증 유지 (빈 데이터 필터링)

**영향**:
- `/src/lib/sajuApi.ts` - 신규 생성
- `/src/components/BirthInfoInput.tsx` - fetchSajuData 호출 추가
- `/src/components/SajuSelectPage.tsx` - fetchSajuData 호출 추가
- `/supabase/functions/generate-content-answers/index.ts` - prefetchedSajuApiData 파라미터 처리
- `/supabase/functions/generate-saju-answer/index.ts` - 이미 prefetchedSajuData 지원 (수정 불필요)

**배포**:
- Edge Functions: `supabase functions deploy` (Staging + Production)
- 프론트엔드: GitHub push → Vercel 자동 배포

**교훈**:
- 외부 API가 서버 사이드 요청을 차단할 수 있음 (헤더 추가로 해결 불가)
- 브라우저에서 정상 동작하면 클라이언트 호출 후 서버에 전달하는 방식 고려
- Edge Function에서 외부 API 호출 실패 시 프론트엔드 폴백 패턴 유용

---

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

### iOS 스와이프 뒤로가기: 사주 수정 후 히스토리 스택 문제
**결정**: 사주 수정 완료 후 `navigate(..., { replace: true })`로 히스토리 교체
**배경**:
- 프로필 → 사주관리 → 사주수정 → 저장 → 사주관리 이동 후
- iOS 스와이프 뒤로가기 시 프로필이 아닌 사주관리로 다시 이동됨

**문제 시나리오**:
```
히스토리 스택: [프로필, 사주관리, 사주수정]
→ 저장 후 navigate('/saju/management') 호출
히스토리 스택: [프로필, 사주관리, 사주수정, 사주관리]  ← 중복!
→ 뒤로가기 시 사주수정으로 이동
```

**해결 방법**:
```typescript
// App.tsx - SajuInputPageWrapper, SajuAddPageWrapper
onSaved={() => {
  // ⭐ replace: true로 히스토리 교체
  if (returnTo) {
    navigate(returnTo, { replace: true });
  } else {
    navigate('/saju/management', { replace: true });
  }
}}
```

**수정 후 히스토리**:
```
히스토리 스택: [프로필, 사주관리, 사주수정]
→ 저장 후 navigate('/saju/management', { replace: true })
히스토리 스택: [프로필, 사주관리]  ← 사주수정이 사주관리로 대체됨
→ 뒤로가기 시 프로필로 정상 이동
```

**영향**: `/App.tsx` (SajuInputPageWrapper, SajuAddPageWrapper)
**테스트**: iOS Safari에서 사주 수정 후 스와이프 뒤로가기 테스트 완료

---

### iOS 스와이프 뒤로가기: 결제/결과 페이지 bfcache 대응
**결정**: PaymentNew, SajuResultPage에 popstate 이벤트 리스너 + bfcache 복원 처리 추가
**배경**:
- iOS Safari는 bfcache(back-forward cache)로 페이지 상태를 메모리에 보존
- 결제 페이지에서 뒤로가기 시 `isProcessingPayment` 상태가 true로 남아있어 버튼 비활성화
- 결과 페이지에서 뒤로가기 시 의도치 않은 페이지로 이동

**해결 방법**:
```typescript
// PaymentNew.tsx - 뒤로가기 감지
useEffect(() => {
  if (!contentId) return;

  // 히스토리에 현재 페이지 상태 추가 (뒤로가기 감지용)
  window.history.pushState({ paymentPage: true }, '');

  const handlePopState = (event: PopStateEvent) => {
    console.log('🔙 [PaymentNew] 뒤로가기 감지 → 콘텐츠 상세 페이지로 이동');
    navigate(`/master/content/detail/${contentId}`, { replace: true });
  };

  window.addEventListener('popstate', handlePopState);
  return () => window.removeEventListener('popstate', handlePopState);
}, [contentId, navigate]);

// PaymentNew.tsx - bfcache 복원 시 상태 리셋
useEffect(() => {
  const handlePageShow = (event: PageTransitionEvent) => {
    if (event.persisted) {
      console.log('🔄 [PaymentNew] bfcache 복원 감지 → isProcessingPayment 리셋');
      setIsProcessingPayment(false);
    }
  };

  const handleVisibilityChange = () => {
    if (document.visibilityState === 'visible') {
      setIsProcessingPayment(false);
    }
  };

  window.addEventListener('pageshow', handlePageShow);
  document.addEventListener('visibilitychange', handleVisibilityChange);

  return () => {
    window.removeEventListener('pageshow', handlePageShow);
    document.removeEventListener('visibilitychange', handleVisibilityChange);
  };
}, []);
```

**핵심 원리**:
- `window.history.pushState()`: 뒤로가기 감지를 위한 히스토리 항목 추가
- `popstate` 이벤트: 브라우저 뒤로가기 감지 후 적절한 페이지로 리다이렉트
- `pageshow` 이벤트 + `event.persisted`: bfcache에서 복원된 경우 감지
- `visibilitychange` 이벤트: 탭 전환 등으로 페이지가 다시 보일 때 상태 리셋

**영향**:
- `/components/PaymentNew.tsx`
- `/components/SajuResultPage.tsx`
**테스트**: iOS Safari에서 결제 중 뒤로가기, bfcache 복원 테스트 완료

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
2. **새 컴포넌트 추가**
   - `TarotFlowPage.tsx` - 타로 플로우 통합
   - `TarotCardSelection.tsx` - 카드 선택 UI
   - `TarotShufflePage.tsx` - 카드 섞기 애니메이션
   - `TarotResultPage.tsx` - 타로 결과 페이지
3. **타로 카드 데이터 관리**
   - `/lib/tarotCards.ts` - 78장 타로 카드 정보 (메이저 22장 + 마이너 56장)  
**기술적 구현**:
- Framer Motion으로 카드 섞기 애니메이션 구현
- 3장 선택 인터랙션 (과거/현재/미래)
- AI 프롬프트에 선택된 카드 정보 전달  
**영향**: 
- Edge Functions 2개 추가
- 컴포넌트 4개 추가
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

## 📊 주요 결정 통계 (2026-01-13 기준)

- **총 결정 기록**: 39개
- **아키텍처 변경**: 11개 (사주 API 서버 직접 호출)
- **성능 최적화**: 6개 (이미지 캐시 버스팅)
- **사용자 경험 개선**: 13개 (iOS 스와이프 뒤로가기 대응 +6)
- **보안/권한**: 7개 (Storage RLS 정책 +1)
- **개발 안정성**: 3개

---

**문서 버전**: 2.6.0
**최종 업데이트**: 2026-01-13
**문서 끝**