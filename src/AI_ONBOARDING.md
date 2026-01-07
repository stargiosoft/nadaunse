# 🤖 AI 작업 인수인계 가이드

> **대상**: 이 프로젝트를 처음 맡는 AI 어시스턴트
> **목적**: 5분 안에 프로젝트 컨텍스트를 파악하고 즉시 작업 시작
> **GitHub**: https://github.com/stargiosoft/nadaunse
> **최종 업데이트**: 2026-01-07

---

## 🚀 Quick Start (처음 5분)

### 1단계: 프로젝트 이해 (2분)

```bash
# 1. README.md 먼저 읽기 (프로젝트 개요, 기술 스택)
cat README.md

# 2. PROJECT_CONTEXT.md 전체 읽기 (핵심 규칙, 플로우)
cat PROJECT_CONTEXT.md
```

**결과**: 
- ✅ Tech Stack 파악 (React + Supabase + AI)
- ✅ 프로젝트 구조 이해 (타로/사주 운세, 무료/유료 이원화)
- ✅ 절대 규칙 숙지 (Tailwind만, TypeScript 필수 등)
- ✅ 모바일 웹 최적화 규칙 이해

---

## 🎯 프로젝트 핵심 정보

### 프로젝트 성격
- **타로/사주 운세 모바일 웹 서비스**
- iOS Safari 최적화 완료
- 개발/배포 환경 자동 분리
- **Supabase 환경 분리**: Production / Staging

### 주요 통계
- **컴포넌트**: 51개 (활성화)
- **Edge Functions**: 17개
- **페이지**: 38개
- **UI 컴포넌트 (shadcn/ui)**: 48개
- **스켈레톤**: 5개

### 필수 문서
- **[CLAUDE.md](../CLAUDE.md)** - 개발 규칙 (필독)

---

## 📋 작업 유형 분류 (1분)

사용자 요청을 다음 6가지 중 하나로 분류:

| 작업 유형 | 설명 | 예시 |
|----------|------|------|
| **🐛 버그 수정** | 기능 오작동, 에러 | "스크롤 복원 안 돼요" |
| **✨ 새 기능 추가** | 기존에 없던 기능 | "별점 평가 기능 추가" |
| **🎨 UI 수정** | 디자인 변경 | "버튼 색상 변경" |
| **📊 데이터 작업** | DB 스키마, API 수정 | "테이블 컬럼 추가" |
| **🔧 리팩토링** | 코드 개선 (기능 동일) | "중복 코드 제거" |
| **📱 모바일 최적화** | iOS/Android 렌더링 이슈 | "둥근 모서리 안 보여요" |

---

## 📖 작업별 필수 문서

### 🐛 버그 수정
```bash
# 필수 (순서대로)
1. PROJECT_CONTEXT.md  # 전체 읽기 (시스템 이해)
2. 버그 관련 파일      # file_search로 찾기
3. DECISIONS.md        # "왜 이렇게 구현했는지" 확인
```

**체크리스트**:
- [ ] Critical Rules 위반 여부 확인
- [ ] 버그 체크리스트 섹션 확인 (PROJECT_CONTEXT.md)
- [ ] 관련 Edge Function 로그 확인
- [ ] 개발 환경에서만 발생하는지 확인 (`import.meta.env.DEV`)

---

### ✨ 새 기능 추가
```bash
# 필수 (순서대로)
1. PROJECT_CONTEXT.md    # Critical Rules, 파일 구조
2. components-inventory.md  # 재사용 가능한 컴포넌트 확인 (51개)
3. DATABASE_SCHEMA.md    # DB 스키마 (테이블 추가 필요 시)
4. DECISIONS.md          # 기존 설계 패턴 확인
```

**체크리스트**:
- [ ] 기존 컴포넌트 재사용 가능한지 확인
- [ ] DB 스키마 변경 필요한지 확인
- [ ] Edge Function 추가 필요한지 확인 (현재 17개)
- [ ] 무료/유료 분기 필요한지 확인
- [ ] 개발 전용 기능인지 확인 (배포 시 제외 필요)

---

### 🎨 UI 수정
```bash
# 필수
1. PROJECT_CONTEXT.md     # Critical Rules (스타일링 규칙)
2. /styles/globals.css    # Tailwind 토큰 확인
3. components-inventory.md   # UI 컴포넌트 위치
```

**절대 금지**:
- ❌ `text-*`, `font-*`, `leading-*` 클래스 사용 (globals.css에 정의됨)
- ❌ `styled-components`, `inline style` 사용
- ❌ Tailwind 외 CSS 라이브러리 사용

**iOS Safari 체크리스트**:
- [ ] `overflow: hidden` + `border-radius` 조합 사용 시 `transform-gpu` 추가
- [ ] 둥근 모서리가 잘리는지 실제 iOS Safari에서 확인
- [ ] 하단 고정 CTA는 `BottomCTA` 컴포넌트 재사용

---

### 📊 데이터 작업
```bash
# 필수
1. DATABASE_SCHEMA.md     # 전체 DB 구조 파악
2. PROJECT_CONTEXT.md     # RLS 정책, Edge Functions
3. /lib/supabase.ts       # Supabase 클라이언트 설정
4. supabase/EDGE_FUNCTIONS_GUIDE.md  # Edge Functions 17개 목록
```

**체크리스트**:
- [ ] RLS 정책 추가 필요한지 확인
- [ ] 마이그레이션 SQL 파일 작성
- [ ] Edge Function에서 접근 가능한지 확인
- [ ] Service Role Key 필요한지 확인

---

### 🔧 리팩토링
```bash
# 필수
1. DECISIONS.md           # 기존 설계 의도 이해
2. PROJECT_CONTEXT.md     # Critical Rules 준수
3. 해당 파일의 JSDoc 주석  # 원래 목적 확인
```

**체크리스트**:
- [ ] 기능 변경 없이 코드만 개선하는지 확인
- [ ] 기존 설계 패턴 유지 (싱글톤 서비스 클래스 등)
- [ ] TypeScript 타입 정확히 정의
- [ ] 개발 전용 코드는 `import.meta.env.DEV`로 분리 유지

---

### 📱 모바일 최적화
```bash
# 필수
1. PROJECT_CONTEXT.md     # 모바일 최적화 규칙
2. /styles/globals.css    # 반응형 토큰
3. 해당 컴포넌트 파일      # 실제 렌더링 확인
```

**iOS Safari 렌더링 이슈 해결법**:
```tsx
// ✅ 올바른 예시 - transform-gpu 추가
<div className="overflow-hidden rounded-2xl transform-gpu">
  {/* 둥근 모서리가 정상적으로 보임 */}
</div>

// ❌ 잘못된 예시 - iOS에서 잘림
<div className="overflow-hidden rounded-2xl">
  {/* iOS Safari에서 둥근 모서리가 잘릴 수 있음 */}
</div>
```

---

## 🚨 Critical Rules (암기 필수)

### ✅ 반드시 해야 할 것

#### 1. TypeScript 타입 정의
```typescript
// ✅ 올바름
interface User {
  id: string;
  name: string;
}

// ❌ 금지
const user: any = {...};
```

#### 2. Tailwind CSS만 사용
```tsx
// ✅ 올바름
<div className="flex items-center gap-2">

// ❌ 금지
<div style={{ display: 'flex' }}>
```

#### 3. 개발/배포 환경 분리
```tsx
// ✅ 개발 전용 UI 요소 (배포 시 자동 제외)
{import.meta.env.DEV && (
  <button onClick={handleDebug}>디버그 버튼</button>
)}

// ❌ 개발 전용 버튼이 프로덕션에 노출됨
<button onClick={handleDebug}>디버그 버튼</button>
```

**적용 대상**:
- 테스트 버튼
- 디버깅 도구
- UI 테스팅용 직접 이동 버튼
- 개발자 전용 로그 출력
- 에러 페이지 테스트 버튼

#### 4. iOS Safari 최적화
```tsx
// ✅ 둥근 모서리 렌더링 이슈 해결
<div className="overflow-hidden rounded-2xl transform-gpu">
  <img src="..." alt="..." />
</div>

// ❌ iOS에서 둥근 모서리가 잘릴 수 있음
<div className="overflow-hidden rounded-2xl">
  <img src="..." alt="..." />
</div>
```

#### 5. JSDoc 주석 (public 메서드)
```typescript
/**
 * 무료 콘텐츠 AI 생성 요청
 * @param params - 생성 파라미터
 * @throws {Error} Edge Function 호출 실패 시
 */
async requestGeneration(params: RequestGenerationParams): Promise<void>
```

#### 6. 구조화된 로깅
```typescript
// ✅ 올바름
scrollRestoreLogger.save({ scrollY: 500, contentCount: 12 });

// ❌ 금지
console.log('스크롤:', 500);
```

---

### ❌ 절대 하지 말아야 할 것

#### 1. 폰트 관련 Tailwind 클래스 사용
- ❌ `text-2xl`, `font-bold`, `leading-tight` 등
- ✅ `globals.css`에 정의된 토큰만 사용

#### 2. Styled-components 또는 inline style
- ❌ `styled.div`, `<div style={{...}}>`
- ✅ Tailwind 클래스만 사용

#### 3. any 타입 사용
- ❌ `const data: any = ...`
- ✅ 명확한 interface 정의

#### 4. 보호된 파일 수정
- ❌ `/components/figma/ImageWithFallback.tsx`
- ✅ 다른 파일에서 import해서 사용

#### 5. 개발 전용 코드를 프로덕션에 노출
- ❌ 테스트 버튼이 배포 환경에 보임
- ✅ `import.meta.env.DEV` 조건으로 분리

#### 6. iOS Safari 최적화 무시
- ❌ `overflow: hidden` + `border-radius`만 사용
- ✅ `transform-gpu` 클래스 추가

---

## 🔍 파일 찾기 치트시트

**상세한 파일 구조는 [PROJECT_CONTEXT.md - File Structure](./PROJECT_CONTEXT.md#-file-structure-key-files)를 참조하세요.**

### 기능별 빠른 참조

기능별 파일 위치는 `PROJECT_CONTEXT.md`의 "기능별 빠른 참조" 섹션에서 확인하세요:
- 무료 콘텐츠 (사주)
- 유료 콘텐츠 (심화 해석판)  
- 타로 콘텐츠
- 사주 정보 관리
- 프로필 & 구매
- 인증
- 공통 UI

**전체 파일 구조**:
- 인증 관련: `PROJECT_CONTEXT.md`의 "🔐 인증 관련" 참조
- UI 컴포넌트: `PROJECT_CONTEXT.md`의 "🎨 UI 컴포넌트" 참조
- 비즈니스 로직: `PROJECT_CONTEXT.md`의 "🧠 비즈니스 로직" 참조
- Edge Functions: `PROJECT_CONTEXT.md`의 "🗄️ Supabase Edge Functions" 참조

---

## 📋 시나리오별 작업 흐름

### 시나리오 1: "iOS에서 둥근 모서리가 안 보여요" (모바일 최적화)

#### Step 1: 문제 파악
```markdown
증상: iOS Safari에서 overflow: hidden + border-radius 조합이 작동 안 함
원인: iOS Safari 렌더링 버그
```

#### Step 2: 해결 방법 적용
```tsx
// Before
<div className="overflow-hidden rounded-2xl">
  <img src="..." alt="..." />
</div>

// After - transform-gpu 추가
<div className="overflow-hidden rounded-2xl transform-gpu">
  <img src="..." alt="..." />
</div>
```

#### Step 3: 검증
- [ ] iOS Safari 실제 기기에서 확인
- [ ] Android Chrome에서도 정상 작동 확인
- [ ] 다른 브라우저에서도 테스트

---

### 시나리오 2: "개발용 버튼이 프로덕션에 보여요" (환경 분리)

#### Step 1: 문제 파악
```bash
file_search:
- content_pattern: "버튼|button"
- name_pattern: "**/*.tsx"
```

#### Step 2: 개발 전용 코드 분리
```tsx
// Before - 프로덕션에도 노출됨
<button onClick={handleTest}>테스트 버튼</button>

// After - 개발 환경에서만 보임
{import.meta.env.DEV && (
  <button onClick={handleTest}>테스트 버튼</button>
)}
```

#### Step 3: 적용 대상 확인
- [ ] 디버깅 버튼
- [ ] UI 테스팅용 직접 이동 버튼
- [ ] 개발자 전용 로그
- [ ] 에러 페이지 테스트 버튼

---

### 시나리오 3: "스크롤 복원이 안 돼요" (버그 수정)

#### Step 1: 컨텍스트 로드
```markdown
AI 프롬프트:
"PROJECT_CONTEXT.md 전체 내용을 먼저 읽어주세요."
```

#### Step 2: 버그 체크리스트 확인
```markdown
PROJECT_CONTEXT.md → "🐛 주요 버그 유형 & 체크리스트" 섹션
→ "1. 스크롤 복원 실패" 항목 확인
```

#### Step 3: 관련 파일 찾기
```bash
file_search:
- content_pattern: "scrollRestoreLogger"
- name_pattern: "**/*.tsx"
```

#### Step 4: 로그 분석 요청
```markdown
사용자에게 요청:
"scrollRestoreLogger 로그를 콘솔에서 복사해서 보내주세요."
```

#### Step 5: 수정 코드 작성
```typescript
// Critical Rules 준수:
// ✅ TypeScript interface 정의
// ✅ JSDoc 주석 추가
// ✅ 구조화된 로깅
```

---

### 시나리오 4: "프로필 페이지에 별점 평가 추가해주세요" (새 기능)

#### Step 1: 기존 구조 파악
```bash
# 1. 컴포넌트 인벤토리 확인 (51개 중)
cat components-inventory.md | grep "프로필"

# 2. DB 스키마 확인
cat DATABASE_SCHEMA.md | grep "users\|ratings"
```

#### Step 2: 설계 결정
```markdown
체크리스트:
- [ ] 별점 데이터를 어디에 저장? (새 테이블 vs 기존 테이블)
- [ ] 로그인 필수? (유료 vs 무료)
- [ ] UI 컴포넌트 재사용 가능? (components/ui/*)
- [ ] 개발 환경에서 먼저 테스트?
```

#### Step 3: DECISIONS.md 업데이트
```markdown
## [2026-01-06] 별점 평가 시스템 추가

### 결정 사항
- 새 테이블 `content_ratings` 생성
- RLS 정책: 본인만 수정 가능
- UI: shadcn/ui의 Star 아이콘 사용

### 근거
- 기존 orders 테이블과 분리 (확장성)
- 무료 콘텐츠에도 적용 가능하도록 설계
```

#### Step 4: 구현
```typescript
// 1. DB 마이그레이션 SQL 작성
// 2. TypeScript 타입 정의
// 3. UI 컴포넌트 작성 (Tailwind만 사용)
// 4. Edge Function 추가 (필요 시)
```

---

### 시나리오 5: "로딩 페이지 디자인 변경" (UI 수정)

#### Step 1: Critical Rules 확인
```bash
cat PROJECT_CONTEXT.md | grep -A 10 "Critical Rules"
```

**확인 사항**:
- ❌ `text-2xl`, `font-bold` 같은 폰트 클래스 사용 금지
- ✅ `globals.css`의 토큰만 사용
- ✅ iOS Safari 렌더링 이슈 확인

#### Step 2: 기존 파일 찾기
```bash
file_search:
- content_pattern: "LoadingPage"
- name_pattern: "**/*.tsx"
```

#### Step 3: 수정 전 globals.css 확인
```bash
cat /styles/globals.css | grep "@theme"
```

#### Step 4: Tailwind만 사용해서 수정
```tsx
// ✅ 올바른 예시
<div className="flex items-center justify-center h-screen bg-gray-50">
  <div className="space-y-4">
    {/* 폰트 크기는 globals.css에서 자동 적용됨 */}
    <h1>로딩 중...</h1>
  </div>
</div>

// ❌ 잘못된 예시
<div style={{ fontSize: '24px' }}>  {/* inline style 금지 */}
<div className="text-2xl">          {/* 폰트 클래스 금지 */}
```

---

## 📖 문서 간 관계도

```
README.md (시작점)
    │
    ├─→ AI_ONBOARDING.md (AI 필독, 5분)
    │
    ├─→ PROJECT_CONTEXT.md (핵심, 모든 작업 전 필독)
    │       │
    │       ├─→ DECISIONS.md (설계 의도)
    │       ├─→ DATABASE_SCHEMA.md (DB 구조)
    │       └─→ components-inventory.md (파일 위치, 51개)
    │
    ├─→ supabase/EDGE_FUNCTIONS_GUIDE.md (Edge Functions 17개)
    ├─→ supabase/DATABASE_TRIGGERS_AND_FUNCTIONS.md (트리거/함수)
    │
    └─→ Attributions.md (라이선스)
```

**읽는 순서** (작업 시작 전):
1. **README.md** (1분) - 프로젝트 개요
2. **AI_ONBOARDING.md** (1분) - 이 문서
3. **PROJECT_CONTEXT.md** (3분) - 시스템 전체 이해
4. **작업별 추가 문서** (2분) - DECISIONS.md, DATABASE_SCHEMA.md 등

---

## 🗺️ AI 작업 의사결정 트리

```
사용자 요청 받음
    ↓
┌──────────────────┐
│ 1. 컨텍스트 로드  │
│ PROJECT_CONTEXT  │
└────────┬─────────┘
         ↓
┌────────────────────────────────────┐
│ 2. 작업 유형 분류                   │
├────────────────────────────────────┤
│ A. 🐛 버그 수정                     │
│ B. ✨ 새 기능                       │
│ C. 🎨 UI 수정                       │
│ D. 📊 데이터 작업                   │
│ E. 🔧 리팩토링                      │
│ F. 📱 모바일 최적화 (NEW!)          │
└────────┬───────────────────────────┘
         ↓
┌─────────────────────────────────────┐
│ 3. 추가 문서 읽기 (작업별)           │
├─────────────────────────────────────┤
│ 버그     → 버그 체크리스트           │
│ 새 기능  → components-inventory.md  │
│ UI 수정  → globals.css              │
│ 데이터   → DATABASE_SCHEMA.md       │
│ 리팩토링 → DECISIONS.md              │
│ 모바일   → 모바일 최적화 가이드      │
└─────────┬───────────────────────────┘
         ↓
┌──────────────────┐
│ 4. file_search   │
│ 관련 파일 찾기    │
└────────┬─────────┘
         ↓
┌──────────────────┐
│ 5. Critical Rules 체크   │
│ - TypeScript?           │
│ - Tailwind only?        │
│ - JSDoc?                │
│ - import.meta.env.DEV? │
│ - transform-gpu?        │
└────────┬─────────────────┘
         ↓
┌──────────────┐
│ 6. 코드 작성  │
└────────┬─────┘
         ↓
┌───────────────────────┐
│ 7. DECISIONS.md 업데이트│
│ (새 기능인 경우)        │
└───────────────────────┘
```

---

## 🎯 작업 시작 전 최종 체크리스트

```markdown
[ ] README.md 읽음
[ ] AI_ONBOARDING.md 읽음 (이 문서)
[ ] PROJECT_CONTEXT.md 전체 읽음
[ ] Critical Rules 숙지
[ ] 작업 유형 분류 완료
[ ] 필요한 추가 문서 확인
[ ] 관련 파일 경로 파악 (51개 컴포넌트 중)
[ ] 기존 설계 패턴 이해 (DECISIONS.md)
[ ] 보호된 파일 확인 (수정 금지)
[ ] 개발/배포 환경 분리 확인
[ ] iOS Safari 최적화 확인
```

**모두 체크했다면** → 즉시 작업 시작 가능! 🚀

---

## 💡 효율적인 AI 작업 팁

### 1. 첫 응답에서 컨텍스트 요청
```markdown
사용자: "홈 화면 스크롤 복원 버그 수정해줘"

AI: "네! 먼저 프로젝트 컨텍스트를 파악하겠습니다."
→ read PROJECT_CONTEXT.md
→ file_search "scroll"
→ 버그 체크리스트 확인
→ 수정 제안
```

### 2. 불확실하면 DECISIONS.md 확인
```markdown
사용자: "왜 무료/유료 컴포넌트를 따로 만들었어요?"

AI: "DECISIONS.md를 확인하겠습니다."
→ read DECISIONS.md
→ [2025-12-18] 무료/유료 컴포넌트 분리 결정 찾기
→ 설계 의도 설명
```

### 3. 수정 후 DECISIONS.md 업데이트
```markdown
새 기능 추가 시:
1. 코드 작성
2. DECISIONS.md에 결정 사항 기록
3. PROJECT_CONTEXT.md 업데이트 (필요 시)
4. components-inventory.md 업데이트 (컴포넌트 추가 시)
```

### 4. 개발 전용 기능은 즉시 분리
```tsx
// 새 기능 추가 시 바로 확인
// "이 기능이 프로덕션에 노출되어야 하나?"
// → 아니면 import.meta.env.DEV로 감싸기

{import.meta.env.DEV && (
  <NewFeature />
)}
```

---

## 🆘 긴급 상황 대응

### 상황 1: "이 프로젝트 처음인데 급하게 버그 수정해야 해요"
```bash
# 3분 안에 최소 컨텍스트 파악
1. cat PROJECT_CONTEXT.md | head -100  # 상단 100줄만
2. 버그 증상 듣기
3. file_search로 관련 파일 찾기
4. Critical Rules 체크 (TypeScript, Tailwind, 환경 분리)
5. 즉시 수정 제안
```

### 상황 2: "문서가 너무 많아요, 뭐부터 봐야 해요?"
```bash
# 우선순위 (강제)
1순위: PROJECT_CONTEXT.md (필수, 3분)
2순위: AI_ONBOARDING.md (이 문서, 2분)
3순위: 작업별 추가 문서 (선택, 2분)
4순위: 나머지 (나중에)
```

### 상황 3: "이 코드 왜 이렇게 짰어요?"
```bash
# 설계 의도 확인
1. DECISIONS.md 검색
2. 관련 파일의 JSDoc 주석 확인
3. PROJECT_CONTEXT.md의 Critical Rules 확인
4. components-inventory.md에서 컴포넌트 역할 확인
```

### 상황 4: "iOS에서만 버그가 발생해요"
```bash
# 모바일 최적화 체크
1. transform-gpu 클래스 추가했는지 확인
2. overflow: hidden + border-radius 조합 확인
3. iOS Safari 실제 기기에서 테스트
4. PROJECT_CONTEXT.md의 모바일 최적화 섹션 확인
```

### 상황 5: "iOS 스와이프 뒤로가기로 이상한 페이지로 돌아가요" (NEW!)
```bash
# 히스토리 스택 문제 체크
1. OAuth 플로우 관련 페이지인지 확인 (로그인, 약관, 환영쿠폰)
2. navigate()에 { replace: true } 사용했는지 확인
3. 페이지 마운트 시 상태 체크 로직 있는지 확인
4. DECISIONS.md의 "iOS 스와이프 뒤로가기" 섹션 참조
```

**해결 패턴** (회원가입 플로우):
```typescript
// 페이지 마운트 시 상태 체크 → 적절한 페이지로 리다이렉트
useEffect(() => {
  const user = localStorage.getItem('user');
  if (user) {
    navigate('/', { replace: true }); // 이미 로그인됨 → 홈으로
  }
}, [navigate]);
```

---

## 📞 추가 질문이 있을 때

| 질문 유형 | 참고 문서 |
|----------|----------|
| "전체 시스템 구조는?" | PROJECT_CONTEXT.md |
| "왜 이렇게 설계했어?" | DECISIONS.md |
| "DB 테이블 구조는?" | DATABASE_SCHEMA.md |
| "이 컴포넌트 어디 있어?" | components-inventory.md (51개) |
| "Edge Functions 목록은?" | supabase/EDGE_FUNCTIONS_GUIDE.md (17개) |
| "빠르게 시작하려면?" | README.md |
| "라이선스 확인" | Attributions.md |
| "모바일 최적화는?" | AI_ONBOARDING.md (이 문서) |

---

## 🎓 마스터 체크리스트

**이 프로젝트를 완전히 이해했다면**:

```markdown
[ ] 무료/유료 콘텐츠 플로우 다이어그램 그릴 수 있다
[ ] 타로/사주 운세 서비스 차이를 설명할 수 있다
[ ] FreeContentService 클래스 역할 설명할 수 있다
[ ] Critical Rules 6가지 암기했다
[ ] Edge Functions 17개 목록 외웠다
[ ] Tailwind 폰트 클래스 사용 금지 이유 안다
[ ] RLS 정책이 뭔지 안다
[ ] localStorage vs DB 저장 분기 조건 안다
[ ] 스크롤 복원 로직 설명할 수 있다
[ ] import.meta.env.DEV 사용 목적 안다 (NEW!)
[ ] iOS Safari transform-gpu 이슈 해결법 안다 (NEW!)
[ ] 51개 컴포넌트 위치를 빠르게 찾을 수 있다
[ ] 개발/배포 환경 차이를 설명할 수 있다
```

**80% 이상 체크** → 프로젝트 마스터! 자유롭게 작업 가능 🎉

---

## 🔄 업데이트 이력

| 버전 | 날짜 | 변경 내용 | 작성자 |
|------|------|-----------|--------|
| 1.0.0 | 2025-12-21 | 초기 문서 작성 | AI Assistant |
| 1.1.0 | 2025-12-31 | LoadingPage 이미지 최적화, 목차 더미 데이터 제거 반영 | AI Assistant |
| 1.2.0 | 2026-01-06 | 개발/배포 환경 분리, iOS Safari 최적화, 타로 서비스 추가, 컴포넌트 51개/Edge Functions 17개 반영 | AI Assistant |
| 1.3.0 | 2026-01-07 | iOS 스와이프 뒤로가기 히스토리 관리 해결법 추가 | AI Assistant |

---

## 🎯 최근 주요 개선사항 (2026-01-07)

### ✅ iOS 스와이프 뒤로가기 히스토리 관리 (NEW!)
- OAuth 회원가입 플로우에서 발생하는 히스토리 스택 문제 해결
- 각 페이지에서 마운트 시 상태 체크 후 적절한 페이지로 리다이렉트
- **핵심 파일**: `App.tsx` (LoginPageNewWrapper, TermsPageWrapper, WelcomeCouponPageWrapper)
- **상세 문서**: `DECISIONS.md` → "2026-01-07 - iOS 스와이프 뒤로가기" 섹션

### ✅ 개발/배포 환경 분리
- `import.meta.env.DEV` 조건으로 개발 전용 UI 요소 자동 제외
- 테스트 버튼, 디버깅 도구가 프로덕션에 노출되지 않음

### ✅ iOS Safari 최적화
- `transform-gpu` 클래스로 `border-radius` 렌더링 이슈 해결
- 맛보기 카드, 이미지 컨테이너 등에 적용 완료

### ✅ 타로 서비스 통합
- 타로 카드 섞기, 선택, 결과 페이지 추가
- 사주/타로 통합 운세 서비스로 확장

### ✅ Supabase 환경 분리
- **Production**: `kcthtpmxffppfbkjjkub` (nadaunse.com)
- **Staging**: `hyltbeewxaqashyivilu` (Vercel Preview)
- 환경변수: `VITE_SUPABASE_PROJECT_ID`, `VITE_SUPABASE_ANON_KEY`
- 코드 수정 없이 Vercel 환경변수로 전환

### ✅ 하단 고정 CTA 리팩토링
- 모바일 최적화된 하단 CTA 컴포넌트 개선 완료
- 일관된 사용자 경험 제공

---

**문서 버전**: 1.3.0
**최종 업데이트**: 2026-01-07
**다음 AI에게**: 이 문서 읽는 데 5분 투자하면, 수십 시간의 삽질을 막을 수 있어요. iOS 스와이프 뒤로가기 히스토리 관리, 개발/배포 환경 분리, iOS Safari 최적화를 꼭 기억하세요! 화이팅! 🚀