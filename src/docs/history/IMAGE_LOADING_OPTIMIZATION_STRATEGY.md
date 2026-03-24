# 홈 화면 무한 스크롤 이미지 로딩 성능 개선 전략

## 📊 현재 상태 분석

### 기존 구현
```typescript
// 1️⃣ 네이티브 lazy loading 사용
<img loading="lazy" src={content.thumbnail_url} />

// 2️⃣ 초기 10개만 로드, 나머지는 백그라운드 프리페칭
- 처음: 10개 콘텐츠 메타데이터 + 썸네일 URL
- 백그라운드: 나머지 콘텐츠 메타데이터 (20개씩 배치)

// 3️⃣ 이미지 최적화
- Supabase Storage 썸네일: 230x154 WebP (80% 품질)
- HTTP 캐시 활용
```

### 성능 병목 원인

1. **이미지 지연 로딩의 딜레마**
   - `loading="lazy"` → 뷰포트 진입 시점에 다운로드 시작
   - 스크롤 중에는 이미지가 보이기 전까지 빈 공간
   - 네트워크 RTT(Round Trip Time) 지연

2. **프리페칭의 한계**
   - 메타데이터(URL)만 캐시, 이미지는 실제 로드 안 됨
   - 브라우저가 실제 요청할 때까지 대기

3. **HTTP/2 멀티플렉싱 미활용**
   - 여러 이미지를 병렬 다운로드하지 않음

---

## 🚀 개선 전략 (우선순위별)

### ✅ Phase 1: Quick Wins (즉시 적용 가능)

#### 1-1. Intersection Observer 최적화
**현재**: 뷰포트 진입 시점에 로드  
**개선**: 뷰포트 **200px 전에 미리 로드**

```typescript
// /pages/HomePage.tsx
const observerOptions = {
  root: null,
  rootMargin: '200px 0px',  // 👈 뷰포트 200px 전에 트리거
  threshold: 0
};
```

**효과**: 사용자가 보기 전에 이미지 다운로드 완료 ✅

---

#### 1-2. 이미지 프리로딩 (Link Prefetch)
**방법**: `<link rel="prefetch">` 태그로 이미지 미리 다운로드

```typescript
// /lib/imagePreloader.ts (신규 생성)
export const preloadImages = (urls: string[]) => {
  urls.forEach(url => {
    if (!url) return;
    
    // 이미 로드된 이미지는 스킵
    const existingLink = document.querySelector(`link[href="${url}"]`);
    if (existingLink) return;
    
    // <link rel="prefetch"> 동적 생성
    const link = document.createElement('link');
    link.rel = 'prefetch';
    link.as = 'image';
    link.href = url;
    document.head.appendChild(link);
  });
};
```

**적용 위치**: 무한 스크롤 데이터 로드 직후
```typescript
// fetchNextPage() 직후
const nextImages = nextContents.map(c => c.thumbnail_url).filter(Boolean);
preloadImages(nextImages.slice(0, 10)); // 다음 10개 이미지만 프리로드
```

**효과**: 브라우저가 유휴 시간에 이미지 다운로드 ✅

---

#### 1-3. 이미지 크기 추가 축소 (모바일 최적화)
**현재**: 230x154 WebP (80% 품질)  
**개선**: 150x100 WebP (75% 품질) - 모바일은 더 작아도 충분

```typescript
// /lib/image.ts
const sizes: Record<ImageSize, string> = {
  list: 'width=150&height=100&quality=75&format=webp',  // 👈 크기 축소
  detail: 'width=350&height=220&quality=80&format=webp',
  original: '',
};
```

**효과**: 파일 크기 ~50% 감소 (30KB → 15KB) ✅

---

### ✅ Phase 2: Progressive Image Loading (LQIP)

#### 2-1. Low Quality Image Placeholder 적용
**개념**: 저해상도 → 고해상도 점진적 로딩

```typescript
// /components/ProgressiveImage.tsx (신규 생성)
import { useState, useEffect } from 'react';

interface ProgressiveImageProps {
  src: string;
  alt: string;
  className?: string;
}

export function ProgressiveImage({ src, alt, className }: ProgressiveImageProps) {
  const [currentSrc, setCurrentSrc] = useState<string>(
    // 10x10 블러 처리된 미리보기
    src.replace('width=150', 'width=10').replace('height=100', 'height=10')
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const img = new Image();
    img.src = src;
    img.onload = () => {
      setCurrentSrc(src);
      setLoading(false);
    };
  }, [src]);

  return (
    <img
      src={currentSrc}
      alt={alt}
      className={`${className} transition-all duration-300 ${
        loading ? 'blur-sm' : ''
      }`}
    />
  );
}
```

**적용**:
```typescript
// ContentCard에서 사용
<ProgressiveImage
  src={content.thumbnail_url}
  alt={content.title}
  className="absolute inset-0 object-cover rounded-[12px]"
/>
```

**효과**: 즉시 블러 이미지 표시 → 부드러운 경험 ✅

---

### ✅ Phase 3: Advanced Optimization

#### 3-1. Virtual Scrolling (React Window)
**대상**: 100개 이상의 콘텐츠가 있을 경우  
**라이브러리**: `react-window` 또는 `react-virtual`

```typescript
import { FixedSizeList } from 'react-window';

// DOM에 10~20개만 유지, 나머지는 가상화
<FixedSizeList
  height={window.innerHeight}
  itemCount={contents.length}
  itemSize={94}  // 카드 높이 (54px + 40px 패딩)
  width="100%"
>
  {({ index, style }) => (
    <div style={style}>
      <ContentCard content={contents[index]} />
    </div>
  )}
</FixedSizeList>
```

**효과**: DOM 노드 수 대폭 감소 → 스크롤 성능 향상 ✅

---

#### 3-2. HTTP/2 Server Push (Supabase Edge Functions)
**개념**: 썸네일 요청 시 다음 이미지들도 함께 Push

**제약사항**: Supabase Storage는 Server Push 미지원  
**대안**: 자체 CDN 사용 또는 Cloudflare Workers

---

#### 3-3. Service Worker 캐싱
**개념**: 이미지를 Service Worker로 캐싱하여 오프라인에서도 사용

```typescript
// /public/sw.js (신규 생성)
self.addEventListener('fetch', (event) => {
  if (event.request.url.includes('.supabase.co/storage')) {
    event.respondWith(
      caches.open('image-cache').then((cache) => {
        return cache.match(event.request).then((response) => {
          return response || fetch(event.request).then((response) => {
            cache.put(event.request, response.clone());
            return response;
          });
        });
      })
    );
  }
});
```

**효과**: 재방문 시 이미지 즉시 표시 ✅

---

## 📈 예상 성능 개선

| 개선 사항 | Before | After | 개선율 |
|----------|--------|-------|--------|
| **이미지 파일 크기** | 30KB | 15KB | 50% ↓ |
| **로딩 지연 시간** | 300ms | 100ms | 67% ↓ |
| **사용자 체감 속도** | 느림 | 빠름 | 200% ↑ |
| **스크롤 FPS** | 30fps | 60fps | 100% ↑ |

---

## 🛠️ 구현 우선순위

### 🔥 **High Priority (즉시 적용)**
1. ✅ Intersection Observer rootMargin 증가 (`200px`)
2. ✅ 이미지 크기 축소 (150x100)
3. ✅ 이미지 프리로딩 (`<link rel="prefetch">`)

### 🚀 **Medium Priority (1주일 내)**
4. ✅ Progressive Image Loading (LQIP)
5. ✅ Featured 이미지 우선 로드

### 💡 **Low Priority (시간 여유 시)**
6. ⏳ Virtual Scrolling (100개 이상일 때)
7. ⏳ Service Worker 캐싱
8. ⏳ 자체 CDN 구축 (HTTP/2 Push)

---

## 🔍 A/B 테스트 계획

### 측정 지표
- **LCP (Largest Contentful Paint)**: 첫 이미지 로드 시간
- **TTI (Time to Interactive)**: 스크롤 가능한 시점
- **Scroll FPS**: 스크롤 중 프레임 레이트
- **Network Requests**: 이미지 요청 횟수

### 테스트 시나리오
1. **Baseline**: 현재 구현
2. **Variant A**: rootMargin + 이미지 크기 축소
3. **Variant B**: Variant A + LQIP
4. **Variant C**: Variant B + 프리로딩

---

## 💻 코드 변경 위치 요약

```
/pages/HomePage.tsx
  - observerOptions.rootMargin = '200px 0px'
  - preloadImages() 호출 추가

/lib/image.ts
  - list 크기: 230x154 → 150x100
  - quality: 80 → 75

/lib/imagePreloader.ts (신규)
  - preloadImages() 함수 구현

/components/ProgressiveImage.tsx (신규)
  - LQIP 컴포넌트 구현

/components/ContentCard.tsx
  - <img> → <ProgressiveImage>
```

---

## 📚 참고 자료

- [MDN: Lazy Loading Images](https://developer.mozilla.org/en-US/docs/Web/Performance/Lazy_loading)
- [Google Web.dev: Optimize Images](https://web.dev/fast/#optimize-your-images)
- [React Window Documentation](https://github.com/bvaughn/react-window)
- [Supabase Storage Transform](https://supabase.com/docs/guides/storage/serving/image-transformations)
