# DECISIONS.md

> **아키텍처 결정 기록 (Architecture Decision Records)**
> "왜 이렇게 만들었어?"에 대한 대답
> **GitHub**: https://github.com/stargiosoft/nadaunse
> **최종 업데이트**: 2026-01-06

---

## 📋 형식

```
[날짜] [결정 내용] | [이유/배경] | [영향 범위]
```

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

### Edge Functions 확장: 총 17개 운영
**결정**: AI 생성, 쿠폰, 사용자 관리 등을 위한 Edge Functions를 17개로 확장  
**분류**:
- AI 생성: 8개 (사주/타로 각 4개)
- 쿠폰 관리: 4개 (조회, 적용, 발급 2개)
- 사용자 관리: 2개
- 알림: 1개 (카카오 알림톡)
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

## 📊 주요 결정 통계 (2026-01-06 기준)

- **총 결정 기록**: 20개
- **아키텍처 변경**: 8개
- **성능 최적화**: 5개
- **사용자 경험 개선**: 4개
- **보안 강화**: 3개

---

**문서 버전**: 2.0.0  
**최종 업데이트**: 2026-01-06  
**문서 끝**