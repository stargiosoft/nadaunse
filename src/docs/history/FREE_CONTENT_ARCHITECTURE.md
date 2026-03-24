# 무료 콘텐츠 아키텍처 문서

## 📋 목차
1. [개요](#개요)
2. [아키텍처 패턴](#아키텍처-패턴)
3. [파일 구조](#파일-구조)
4. [주요 컴포넌트](#주요-컴포넌트)
5. [서비스 클래스](#서비스-클래스)
6. [데이터 흐름](#데이터-흐름)
7. [캐싱 전략](#캐싱-전략)
8. [AI 생성 플로우](#ai-생성-플로우)
9. [사용 가이드](#사용-가이드)
10. [유지보수 가이드](#유지보수-가이드)

---

## 개요

무료 콘텐츠 시스템은 사용자에게 운세 콘텐츠의 무료 체험판을 제공하고, AI를 통해 개인화된 운세 답변을 생성하는 기능을 제공합니다.

### 주요 기능
- ✅ 무료 콘텐츠 상세 정보 조회
- ✅ 질문지 조회 및 표시
- ✅ 추천 콘텐츠 슬라이더
- ✅ AI 답변 생성 (OpenAI GPT-4)
- ✅ 로딩 및 결과 화면 전환
- ✅ 5분 캐싱으로 성능 최적화

### 기술 스택
- **Frontend**: React, TypeScript, Tailwind CSS
- **Backend**: Supabase (PostgreSQL, Edge Functions)
- **AI**: OpenAI GPT-4
- **State Management**: React Hooks
- **Caching**: LocalStorage

---

## 아키텍처 패턴

### Layered Architecture (계층화 아키텍처)

```
┌─────────────────────────────────────────┐
│         Presentation Layer              │
│  (FreeContentDetail.tsx)                │
│  - 사용자 인터랙션                       │
│  - UI 렌더링                             │
└─────────────────────────────────────────┘
                   ↓
┌─────────────────────────────────────────┐
│         Component Layer                 │
│  (FreeContentDetailComponents.tsx)      │
│  - 재사용 가능한 UI 컴포넌트             │
│  - Props 기반 렌더링                     │
└─────────────────────────────────────────┘
                   ↓
┌─────────────────────────────────────────┐
│         Business Logic Layer            │
│  (freeContentService.ts)                │
│  - 비즈니스 로직 처리                    │
│  - 데이터 변환 및 검증                   │
└─────────────────────────────────────────┘
                   ↓
┌─────────────────────────────────────────┐
│         Data Access Layer               │
│  (Supabase Client)                      │
│  - DB 쿼리                               │
│  - Edge Function 호출                    │
└─────────────────────────────────────────┘
```

### Design Patterns

#### 1. Singleton Pattern (싱글톤 패턴)
- **적용**: `FreeContentService`
- **목적**: 전역에서 하나의 서비스 인스턴스만 사용
- **장점**: 메모리 효율성, 일관된 상태 관리

```typescript
export class FreeContentService {
  private static instance: FreeContentService;

  public static getInstance(): FreeContentService {
    if (!FreeContentService.instance) {
      FreeContentService.instance = new FreeContentService();
    }
    return FreeContentService.instance;
  }
}
```

#### 2. Custom Hooks Pattern
- **적용**: `useFreeContentDetail`, `useSliderDrag`
- **목적**: 로직 재사용 및 관심사 분리
- **장점**: 테스트 용이성, 코드 재사용성

```typescript
function useFreeContentDetail(contentId: string, onBack: () => void) {
  // 상태 관리 로직
  // 비즈니스 로직
  // 이벤트 핸들러
  
  return {
    // State
    content,
    questions,
    // Actions
    handlePurchase,
    showMoreCards
  };
}
```

#### 3. Component Composition Pattern
- **적용**: UI 컴포넌트 분리
- **목적**: 재사용 가능한 작은 컴포넌트 구성
- **장점**: 유지보수성, 테스트 용이성

```typescript
<div>
  <TopNavigation {...props} />
  <ProductInfo content={content} />
  <DescriptionSection description={description} />
  <BottomButton onClick={handlePurchase} />
</div>
```

---

## 파일 구조

```
/lib/
  └── freeContentService.ts         # 비즈니스 로직 서비스 클래스

/components/
  ├── FreeContentDetail.tsx          # 메인 컨테이너 컴포넌트
  ├── FreeContentDetailComponents.tsx # UI 컴포넌트 모음
  ├── FreeContentLoading.tsx         # AI 생성 로딩 화면
  └── FreeContentResult.tsx          # AI 생성 결과 화면

/docs/
  └── FREE_CONTENT_ARCHITECTURE.md   # 아키텍처 문서
```

---

## 주요 컴포넌트

### 1. FreeContentDetail (메인 컨테이너)

**역할**: 무료 콘텐츠 상세 페이지의 메인 컴포넌트

**Props**:
```typescript
interface FreeContentDetailProps {
  contentId: string;              // 콘텐츠 ID
  onBack: () => void;             // 뒤로가기 핸들러
  onHome: () => void;             // 홈 버튼 핸들러
  onContentClick?: (contentId: string) => void;  // 콘텐츠 클릭 핸들러
  onBannerClick?: () => void;     // 배너 클릭 핸들러
}
```

**주요 기능**:
- 콘텐츠 데이터 로드 및 캐싱
- AI 생성 플래그 확인 및 처리
- 상태 관리 (로딩, 생성 중, 결과 표시)

**사용 예시**:
```typescript
<FreeContentDetail
  contentId="content-123"
  onBack={() => navigate(-1)}
  onHome={() => navigate('/')}
  onContentClick={(id) => navigate(`/content/${id}`)}
  onBannerClick={() => navigate('/banner-target')}
/>
```

### 2. FreeContentDetailComponents (UI 컴포넌트)

**역할**: 재사용 가능한 UI 컴포넌트 제공

**컴포넌트 목록**:

| 컴포넌트 | 설명 | Props |
|---------|------|-------|
| `TopNavigation` | 상단 네비게이션 바 | onBack, onHome, title |
| `ProductInfo` | 상품 이미지 및 정보 | content |
| `DescriptionSection` | 운세 설명 섹션 | description |
| `FortuneComposition` | 운세 구성 (질문 목록) | questions |
| `AdBanner` | 광고 배너 | onClick |
| `RecommendedCard` | 추천 콘텐츠 카드 | content, onClick |
| `ShowMoreButton` | 더 보기 버튼 | onClick |
| `BottomButton` | 하단 버튼 | onClick, text |

**디자인 시스템 적용**:
- 타이틀-설명 간격: **8px** (gap-[8px])
- 구분선 높이: **1px**
- 구분선 색상: **gray-100**
- 카드 제목 폰트: **15px**

---

## 서비스 클래스

### FreeContentService

**역할**: 무료 콘텐츠 관련 비즈니스 로직 처리

**주요 메서드**:

#### 1. 데이터 조회
```typescript
// 콘텐츠 정보 조회
async fetchContent(contentId: string): Promise<MasterContent>

// 질문지 조회
async fetchQuestions(contentId: string): Promise<Question[]>

// 추천 콘텐츠 조회
async fetchRecommendedContents(contentId: string): Promise<MasterContent[]>

// 사주 정보 조회
async fetchSajuData(sajuRecordId: string): Promise<SajuData>
```

#### 2. 캐싱
```typescript
// 캐시에서 데이터 로드
loadFromCache(contentId: string): CachedData | null

// 캐시에 데이터 저장
saveToCache(contentId: string, data: CachedData): void
```

#### 3. AI 생성
```typescript
// AI 미리보기 생성
async generatePreview(
  content: MasterContent,
  sajuData: SajuData,
  question: Question
): Promise<string>

// 모든 질문에 대해 AI 답변 생성
async generateAllAnswers(
  content: MasterContent,
  sajuRecordId: string,
  questions: Question[]
): Promise<Question[]>
```

#### 4. 통합 메서드
```typescript
// 전체 콘텐츠 데이터 로드 (캐시 우선)
async loadContentData(contentId: string): Promise<CachedData>

// AI 생성 플래그 확인 및 제거
checkGenerationFlag(contentId: string): { contentId: string; sajuRecordId: string } | null
```

---

## 데이터 흐름

### 1. 초기 로딩 플로우

```
사용자 페이지 접근
        ↓
useFreeContentDetail Hook 초기화
        ↓
freeContentService.loadContentData() 호출
        ↓
캐시 확인 (loadFromCache)
        ↓
    [캐시 있음]              [캐시 없음]
        ↓                        ↓
   캐시 데이터 반환        DB에서 조회 (fetchDataFromDB)
        ↓                        ↓
백그라운드 업데이트      Promise.all([
        ↓                 fetchContent,
   (비동기)                fetchQuestions,
                          fetchRecommendedContents
                        ])
                               ↓
                          캐시 저장
                               ↓
                          데이터 반환
                               ↓
                    State 업데이트 (setContent, setQuestions, etc.)
                               ↓
                          UI 렌더링
```

### 2. AI 생성 플로우

```
사주 정보 입력 완료 (SajuInputPage)
        ↓
localStorage에 플래그 저장
{
  contentId: "content-123",
  sajuRecordId: "saju-456"
}
        ↓
FreeContentDetail 페이지 이동
        ↓
checkGenerationFlag() 호출
        ↓
    [플래그 발견]            [플래그 없음]
        ↓                        ↓
startGeneration() 호출      일반 페이지 표시
        ↓
setIsGenerating(true)
        ↓
FreeContentLoading 화면 표시
        ↓
generateAllAnswers() 호출
        ↓
Promise.all([
  question1 → Edge Function,
  question2 → Edge Function,
  question3 → Edge Function,
  ...
])
        ↓
AI 답변 생성 완료
        ↓
setGeneratedResults(results)
setShowResult(true)
        ↓
FreeContentResult 화면 표시
```

---

## 캐싱 전략

### Cache-First Strategy

```typescript
// 1. 캐시 우선 확인
const cachedData = this.loadFromCache(contentId);
if (cachedData) {
  // 즉시 캐시 데이터 반환
  return cachedData;
}

// 2. 캐시 없으면 DB 조회
const freshData = await this.fetchDataFromDB(contentId);

// 3. 조회한 데이터 캐싱
this.saveToCache(contentId, freshData);

return freshData;
```

### 캐시 구조

```typescript
interface CachedData {
  content: MasterContent;      // 콘텐츠 정보
  questions: Question[];       // 질문지
  recommended: MasterContent[]; // 추천 콘텐츠
}

// LocalStorage 저장 형식
{
  data: CachedData,
  timestamp: number  // 캐시 생성 시간
}
```

### 캐시 만료

- **만료 시간**: 5분 (300,000ms)
- **만료 확인**: 페이지 로드 시마다 timestamp 비교
- **만료 시 처리**: 캐시 삭제 후 DB에서 재조회

### 백그라운드 업데이트

```typescript
// 캐시 데이터를 먼저 반환
const cachedData = this.loadFromCache(contentId);

// 백그라운드에서 최신 데이터 업데이트 (await 없이)
this.updateDataInBackground(contentId);

return cachedData;
```

**장점**:
- 빠른 초기 로딩
- 최신 데이터 자동 업데이트
- 사용자 경험 개선

---

## AI 생성 플로우

### Edge Function 구조

**함수 이름**: `generate-free-preview`

**입력**:
```typescript
{
  title: string,              // 콘텐츠 제목
  description: string,        // 콘텐츠 설명
  questionerInfo: string,     // 사주 정보 (이름, 성별, 생년월일, 출생시간)
  questionText: string,       // 질문 텍스트
  questionId: string          // 질문 ID
}
```

**출력**:
```typescript
{
  success: boolean,
  previewText: string,  // AI 생성 답변
  error?: string
}
```

### 병렬 처리

```typescript
// 모든 질문에 대해 병렬로 AI 생성
const results = await Promise.all(
  questions.map(async (question) => {
    const previewText = await this.generatePreview(
      content, 
      sajuData, 
      question
    );
    return {
      ...question,
      preview_text: previewText
    };
  })
);
```

**성능 최적화**:
- 순차 처리 시간: `n * 평균응답시간`
- 병렬 처리 시간: `max(응답시간들)`
- **예시**: 5개 질문 × 3초 = 15초 → 3초로 단축

---

## 사용 가이드

### 1. 새로운 UI 컴포넌트 추가

```typescript
// 1. FreeContentDetailComponents.tsx에 컴포넌트 추가
export function NewComponent({ prop1, prop2 }: NewComponentProps) {
  return (
    <div>
      {/* UI 구현 */}
    </div>
  );
}

// 2. FreeContentDetail.tsx에서 import 및 사용
import { NewComponent } from './FreeContentDetailComponents';

function FreeContentDetail() {
  return (
    <div>
      <NewComponent prop1={value1} prop2={value2} />
    </div>
  );
}
```

### 2. 새로운 비즈니스 로직 추가

```typescript
// 1. freeContentService.ts에 메서드 추가
export class FreeContentService {
  // 기존 메서드들...

  /**
   * 새로운 비즈니스 로직
   */
  public async newBusinessLogic(param: string): Promise<Result> {
    // 로직 구현
  }
}

// 2. 컴포넌트에서 사용
const result = await freeContentService.newBusinessLogic(param);
```

### 3. 캐시 키 변경

```typescript
// freeContentService.ts
private getCacheKey(contentId: string): string {
  return `free_content_detail_${contentId}_v2_cache`; // 버전 추가
}
```

---

## 유지보수 가이드

### 1. 디자인 수정

**타이틀-설명 간격 변경**:
```typescript
// FreeContentDetailComponents.tsx - DescriptionSection
<div className="content-stretch flex flex-col gap-[8px] items-start relative shrink-0 w-full">
  {/* gap-[8px]를 원하는 값으로 변경 */}
</div>
```

**구분선 스타일 변경**:
```typescript
// FreeContentDetail.tsx
<div className="bg-gray-100 h-[1px] w-full mt-[20px] mb-[28px]" />
{/* bg-gray-100, h-[1px] 변경 */}
```

### 2. 캐시 시간 조정

```typescript
// freeContentService.ts
export class FreeContentService {
  private readonly CACHE_EXPIRY = 10 * 60 * 1000; // 5분 → 10분으로 변경
}
```

### 3. AI 생성 에러 처리

```typescript
// 에러 타입별 처리
try {
  const results = await freeContentService.generateAllAnswers(...);
} catch (error) {
  if (error.message.includes('사주 정보')) {
    alert('사주 정보가 올바르지 않습니다.');
  } else if (error.message.includes('AI 생성')) {
    alert('AI 생성에 실패했습니다. 다시 시도해주세요.');
  } else {
    console.error('예상치 못한 오류:', error);
    alert('오류가 발생했습니다.');
  }
}
```

### 4. 로깅 레벨 조정

```typescript
// 개발 환경
if (process.env.NODE_ENV === 'development') {
  console.log('🔍 디버그 정보:', data);
}

// 프로덕션 환경
console.error('❌ 에러:', error); // 에러만 로깅
```

### 5. 성능 모니터링

```typescript
// 성능 측정 추가
const startTime = performance.now();
const data = await freeContentService.loadContentData(contentId);
const endTime = performance.now();
console.log(`⏱️ 로딩 시간: ${endTime - startTime}ms`);
```

---

## 트러블슈팅

### 문제 1: 캐시가 업데이트되지 않음

**원인**: 캐시 키가 변경되지 않음  
**해결**: 캐시 키에 버전 추가 또는 캐시 삭제

```typescript
// 임시 해결: 캐시 삭제
localStorage.removeItem('free_content_detail_${contentId}_cache');
```

### 문제 2: AI 생성이 느림

**원인**: 순차 처리  
**해결**: Promise.all로 병렬 처리 (이미 적용됨)

### 문제 3: 메모리 누수

**원인**: 컴포넌트 언마운트 후 비동기 작업 계속 실행  
**해결**: useEffect cleanup

```typescript
useEffect(() => {
  let isMounted = true;

  const loadData = async () => {
    const data = await fetchData();
    if (isMounted) {
      setData(data);
    }
  };

  loadData();

  return () => {
    isMounted = false; // cleanup
  };
}, []);
```

---

## 버전 히스토리

### v2.0.0 (2024-12-16)
- ✅ 객체 지향 아키텍처 리팩토링
- ✅ Singleton 패턴 적용
- ✅ Custom Hooks 분리
- ✅ UI 컴포넌트 모듈화
- ✅ 문서화 추가
- ✅ 타이틀-설명 간격 8px로 조정

### v1.0.0 (이전 버전)
- 기본 기능 구현
- 캐싱 기능 추가
- AI 생성 기능 추가

---

## 참고 자료

- [React Hooks 공식 문서](https://react.dev/reference/react)
- [TypeScript 공식 문서](https://www.typescriptlang.org/docs/)
- [Supabase 공식 문서](https://supabase.com/docs)
- [Tailwind CSS 공식 문서](https://tailwindcss.com/docs)

---

**문서 작성자**: Figma Make  
**최종 수정일**: 2024-12-16  
**문서 버전**: 2.0.0
