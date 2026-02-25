# SEO 가이드 - 나다운세

> **검색엔진 최적화(SEO) 설정 및 관리 가이드**
> **최종 업데이트**: 2026-02-24

---

## 현재 SEO 설정 현황

### 등록된 검색엔진

| 검색엔진 | 등록 상태 | 관리 URL |
|----------|----------|----------|
| **네이버** | ✅ 등록됨 | [서치어드바이저](https://searchadvisor.naver.com/console/site/summary?site=https%3A%2F%2Fnadaunse.com) |
| **구글** | ✅ 등록됨 | [Search Console](https://search.google.com/search-console) |

### SEO 필수 파일

| 파일 | URL | 상태 |
|------|-----|------|
| robots.txt | https://nadaunse.com/robots.txt | ✅ |
| sitemap.xml | https://nadaunse.com/sitemap.xml | ✅ |
| rss.xml | https://nadaunse.com/rss.xml | ✅ (2026-02-24 추가) |

---

## 메타 태그 설정

### 위치
`/index.html`

### 현재 설정된 메타 태그

```html
<!-- 기본 메타 정보 -->
<title>나다운세 - 무료운세 사주 타로 궁합 | AI 사주풀이 · 신년운세</title>
<meta name="description" content="무료운세, 사주, 타로, 궁합, 신년운세를 AI로 정확하게 풀어드립니다. 사주팔자, 오늘의운세, 사주풀이까지 나다운세에서 만나보세요." />
<meta name="keywords" content="나다운세, 운세, 무료사주, 무료운세, 신년운세, 사주, 타로, 궁합, 오늘의운세, 띠별오늘의운세, 띠별운세, AI 운세, 별자리운세, 챗지피티사주, 챗gpt사주, 사주GPT, 신점, 사주팔자, 사주풀이, 인터넷사주, 자기이해" />
<meta name="robots" content="index,follow" />
<meta name="author" content="나다운세" />

<!-- 검색엔진 인증 -->
<meta name="naver-site-verification" content="8644df672025dac3aa852950dc53e0a1c776d9b2" />

<!-- Canonical URL -->
<link rel="canonical" href="https://nadaunse.com/" />

<!-- Open Graph -->
<meta property="og:type" content="website" />
<meta property="og:site_name" content="나다운세" />
<meta property="og:title" content="나다운세 - 무료운세 사주 타로 궁합 | AI 사주풀이 · 신년운세" />
<meta property="og:description" content="무료운세, 사주, 타로, 궁합, 신년운세를 AI로 정확하게 풀어드립니다. 사주팔자, 오늘의운세, 사주풀이까지 나다운세에서 만나보세요." />
<meta property="og:url" content="https://nadaunse.com/" />
<meta property="og:image" content="https://hyltbeewxaqashyivilu.supabase.co/storage/v1/object/public/assets/OG%20image/OG%20KakaoTalk.png" />

<!-- Twitter Card -->
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="나다운세 - 무료운세 사주 타로 궁합 | AI 사주풀이 · 신년운세" />
<meta name="twitter:description" content="무료운세, 사주, 타로, 궁합, 신년운세를 AI로 정확하게 풀어드립니다. 사주팔자, 오늘의운세, 사주풀이까지 나다운세에서 만나보세요." />
```

> **⚠️ description 80자 제한**: 네이버 서치어드바이저 권장 길이. 2026-02-24에 기존 82자 → ~60자로 축소

### JSON-LD 구조화 데이터

> **⚠️ 홈페이지 전용**: WebSite, FAQPage, Organization JSON-LD는 **홈페이지(`/`)에만** 포함됩니다.
> 다른 페이지에서는 `prerender.mjs`의 `isHomePage` 파라미터로 템플릿의 기존 JSON-LD가 자동 제거됩니다. (2026-02-24 적용)

```json
// WebSite (홈페이지 전용)
{
  "@context": "https://schema.org",
  "@type": "WebSite",
  "name": "나다운세",
  "alternateName": ["nadaunse", "나다운 운세", "나다운세 운세", "AI운세"],
  "url": "https://nadaunse.com",
  "description": "무료운세, 사주, 타로, 궁합, 신년운세를 AI로 정확하게 풀어드립니다.",
  "inLanguage": "ko-KR",
  "keywords": "무료운세, 사주, 타로, 궁합, AI 운세, 사주풀이, 신년운세, 띠별운세, 오늘의운세"
}

// FAQPage - 리치 스니펫 (홈페이지 전용)
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    { "name": "나다운세에서 무료운세를 볼 수 있나요?", ... },
    { "name": "AI 사주풀이는 어떻게 작동하나요?", ... },
    { "name": "타로점과 사주 중 어떤 것을 선택해야 하나요?", ... }
  ]
}

// Organization - 구글 검색 로고용 (홈페이지 전용)
{
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "나다운세",
  "url": "https://nadaunse.com",
  "logo": {
    "@type": "ImageObject",
    "url": "https://hyltbeewxaqashyivilu.supabase.co/storage/v1/object/public/assets/search%20logo.png",
    "width": 512,
    "height": 512
  },
  "sameAs": ["http://pf.kakao.com/_xbxkLHn"]
}

// Article (블로그 상세 - 프리렌더 + 클라이언트 사이드 SEO.tsx)
{
  "@context": "https://schema.org",
  "@type": "Article",
  "headline": "글 제목",
  "description": "글 설명",
  "image": "썸네일 URL",
  "datePublished": "2026-02-20T...",
  "author": { "@type": "Organization", "name": "나다운세" },
  "publisher": { "@type": "Organization", "name": "나다운세", "url": "https://nadaunse.com" },
  "mainEntityOfPage": "https://nadaunse.com/blog/{slug}"
}
```

---

## 이미지 자산

### SEO 관련 이미지 (Supabase Storage)

| 용도 | 파일명 | 크기 | URL |
|------|--------|------|-----|
| 구글 검색 로고 | search logo.png | 512x512 | `assets/search%20logo.png` |
| OG 이미지 (카카오톡) | OG KakaoTalk.png | 800x400 | `assets/OG%20image/OG%20KakaoTalk.png` |
| OG 이미지 (트위터) | OG X (Twitter).png | - | `assets/OG%20image/OG%20X%20(Twitter).png` |
| 파비콘 | Favicon.png | - | `assets/Favicon.png` |

### 저장 위치
- **Supabase Storage**: `hyltbeewxaqashyivilu` (Staging - assets 공용)

---

## robots.txt 설정

### 위치
`/public/robots.txt`

### 인덱싱 허용/제외 페이지

```txt
User-agent: *
Allow: /

# 인덱싱 제외 경로
Disallow: /free
Allow: /free/content/
Disallow: /login
Allow: /terms-of-service
Disallow: /terms
Disallow: /signup
Disallow: /auth/
Disallow: /payment/
Disallow: /loading
Disallow: /free-loading
Disallow: /welcome-coupon
Disallow: /alimtalk/
Disallow: /master/
Disallow: /saju/
Disallow: /profile
Disallow: /purchase-history
Disallow: /error/
Disallow: /test/

# 결제/결과 페이지 제외
Disallow: /*/payment
Disallow: /*/birthinfo
Disallow: /*/saju-select
Disallow: /*/result

Sitemap: https://nadaunse.com/sitemap.xml
```

> **⚠️ robots.txt 접두사 매칭 주의**: `Disallow: /terms`는 `/terms`로 시작하는 모든 URL을 차단합니다.
> `/terms-of-service`가 차단되지 않도록 `Allow: /terms-of-service`를 반드시 `Disallow: /terms` 위에 배치해야 합니다.
> (Google은 더 구체적인 경로가 우선하지만, 순서를 맞추는 것이 다른 크롤러 호환성에 안전합니다.)

---

## sitemap.xml 설정

### 자동 생성
`scripts/prerender.mjs`가 빌드 시 Supabase에서 deployed 콘텐츠를 조회하여 자동 생성

### 포함되는 페이지
- 홈페이지 (`/`) - priority: 1.0, lastmod: 빌드일
- 유료 콘텐츠 (`/product/{id}`) - priority: 0.9, lastmod: 빌드일
- 무료 콘텐츠 (`/free/content/{id}`) - priority: 0.8, lastmod: 빌드일
- **만세력** (`/manse`) - priority: 0.8, lastmod: 빌드일 **(2026-02-24 추가)**
- **블로그 목록** (`/blog`) - priority: 0.7, lastmod: 빌드일
- **블로그 상세** (`/blog/{slug}`) - priority: 0.7, lastmod: published_at
- 정적 페이지 (이용약관, 개인정보처리방침) - priority: 0.3

> **lastmod 날짜**: 2026-02-24에 모든 sitemap 항목에 `<lastmod>` 추가. 블로그는 `published_at` 사용, 나머지는 빌드일 사용.

---

## 검색엔진별 설정

### 네이버 서치어드바이저

**현재 상태** (2026-02-24 기준):
- ✅ 사이트 등록 완료 (2026-02-24 새 계정으로 재등록)
- ✅ 소유권 인증 완료 (HTML 메타 태그 방식)
- ✅ 사이트맵 제출 완료
- ✅ RSS 피드 제출 완료
- ✅ HTTPS 리다이렉션 정상
- ✅ 보안 인증서 정상

**사이트 진단 결과** (2026-02-24):
| 항목 | 수치 | 비고 |
|------|------|------|
| 색인 | 73 페이지 | 이전 12 → 73으로 증가 |
| 수집제한 | 1 | |
| SEO 경고 | 32건 | description 동일(16) + alt 누락(16) → 수정 완료 |

**SEO 경고 수정 내역** (2026-02-24):
- `<meta name="description">` 동일: **16건** → 콘텐츠 description fallback 개선 (유료/무료 차별화)
- Alt 속성 누락: **16건** → ProfilePage.tsx 7건 (`aria-hidden="true"`), MyReportList.tsx 3건 (의미 있는 alt 텍스트)
- Description 80자 초과: **index.html + prerender.mjs** 둘 다 축소 (~60자)

**성과 데이터** (최근 30일, 2026-02-24 기준):
| 지표 | 값 |
|------|-----|
| 총 클릭수 | 9 |
| 총 노출수 | 77 |
| 평균 CTR | 11.7% |

**인증 방법**: HTML 메타 태그

```html
<!-- 네이버 인증 (index.html에 적용됨) -->
<meta name="naver-site-verification" content="8644df672025dac3aa852950dc53e0a1c776d9b2" />
```

### 구글 Search Console

**현재 상태** (2026-02-24 기준):
- ✅ 사이트 등록 완료
- ✅ 소유권 인증 완료
- ✅ 사이트맵 제출 완료
- ✅ 검색 결과에 노출 중

**성과 데이터** (최근 28일, 2026-02-24 기준):
| 지표 | 값 |
|------|-----|
| 총 클릭수 | 75 |
| 총 노출수 | 180 |
| 평균 CTR | - |
| 평균 게재순위 | - |

**주요 검색어**: "나다운세" + 블로그 롱테일 키워드 유입 시작

```html
<!-- 구글 인증 (필요 시 index.html에 추가) -->
<meta name="google-site-verification" content="인증코드" />
```

---

## SEO 체크리스트

### 새 페이지 추가 시
- [ ] sitemap.xml에 자동 포함되는지 확인
- [ ] robots.txt에서 차단되지 않았는지 확인
- [ ] 페이지별 title, description 설정 (React Helmet 등)

### 정기 점검 (월 1회)
- [ ] 네이버 서치어드바이저 노출/클릭 확인
- [ ] 구글 Search Console 인덱싱 상태 확인
- [ ] 사이트맵 오류 확인
- [ ] 크롤링 오류 확인

### SEO 개선 작업 (완료)
- [x] 콘텐츠별 메타 태그 동적 설정 → **prerender로 해결 (2026-02-10)**
- [x] 무료 콘텐츠 canonical URL 수정 (`/product/` → `/free/content/`) **(2026-02-10)**
- [x] 이미지 alt 속성 누락 수정 (네이버 진단 5건) → **(2026-02-12)**
- [x] IndexNow 프로토콜 적용 → **Edge Function 생성 (2026-02-12)**
- [x] 홈페이지 프리렌더 + ItemList JSON-LD 추가 **(2026-02-12)**
- [x] BreadcrumbList JSON-LD 추가 (콘텐츠 페이지) **(2026-02-12)**
- [x] SEO body 강화 (article 태그, 내부 링크, h1/h2 구조) **(2026-02-12)**
- [x] 블로그(운세 콘텐츠) 기능 구현 **(2026-02-20)** → 아래 섹션 참고
- [x] 홈페이지 → 블로그 내부 링크 (BlogPreviewSection, 홈 스크롤 하단) **(2026-02-20)**
- [x] 블로그 상세 관련 글 추천 (같은 카테고리 view_count 순 3개, fallback: 최신순) **(2026-02-20)**
- [x] 블로그 본문 상호 링크 — cross-links "함께 읽어보세요" DOM 삽입 **(2026-02-20)**
- [x] blog-content CSS 검수 + `index.css` 반영 (테이블, 코드블록, 중첩 리스트 추가) **(2026-02-20)**
- [x] 블로그 링크 `<a href>` 크롤러 지원 변환 (BlogList/BlogDetail/HomePage) **(2026-02-20)**
- [x] Article JSON-LD 클라이언트 지원 (`SEO.tsx` article prop) **(2026-02-20)**
- [x] Organization sameAs 카카오톡 채널 URL 추가 **(2026-02-20)**
- [x] 이미지 loading 속성 추가 (hero: eager, 하단 썸네일: lazy) **(2026-02-20)**
- [x] 프리렌더 빌드 + 프로덕션 배포 **(2026-02-24)**
- [x] Google Search Console 사이트맵 재제출 **(2026-02-24)**
- [x] 네이버 서치어드바이저 사이트맵 + RSS 재제출 **(2026-02-24)**
- [x] 네이버 사이트 인증 코드 발급 + `index.html` 메타 태그 적용 **(2026-02-24)**
- [x] `/manse` sitemap 추가 **(2026-02-24)**
- [x] JSON-LD 중복 제거 — 홈페이지 외 페이지에서 WebSite/FAQPage/Organization 제거 (`isHomePage` 파라미터) **(2026-02-24)**
- [x] sitemap `<lastmod>` 날짜 추가 — 블로그: published_at, 기타: 빌드일 **(2026-02-24)**
- [x] RSS 2.0 피드 생성 (`/rss.xml`) **(2026-02-24)**
- [x] 이미지 alt 속성 수정 16건 (ProfilePage 7건 `aria-hidden`, MyReportList 3건 의미 있는 alt) **(2026-02-24)**
- [x] 콘텐츠 description fallback 개선 — 유료/무료 차별화 **(2026-02-24)**
- [x] description 80자 제한 준수 — index.html + prerender.mjs 축소 **(2026-02-24)**
- [x] robots.txt `Disallow: /terms` → `/terms-of-service` 차단 버그 수정 (`Allow: /terms-of-service` 추가) **(2026-02-25)**
- [x] Edge Function sitemap `/manse` priority 0.6 → 0.8 + lastmod 추가 (prerender와 일치) **(2026-02-25)**

### SEO TODO (미완료) - 우선순위순

#### 🔴 높음 (즉시 효과)
- [ ] **IndexNow로 블로그 URL 일괄 제출** — Edge Function 호출하여 `/blog` + 24개 slug URL 제출 (Bing, 네이버 즉시 인덱싱)

#### 🟢 낮음 (여유 있을 때)
- [ ] **FAQ 구조화 데이터** — 일부 블로그 글에 FAQPage JSON-LD 추가 (검색결과 리치 스니펫 노출)
- [ ] **네이버 블로그/카페 백링크 확보** — 외부 링크를 통한 도메인 권위 향상
- [ ] **블로그 OG 이미지 자동 생성** — 글별 고유 OG 이미지 (현재는 공통 이미지 사용)

---

## 경쟁사 분석

### 키워드: "나다운세" 검색 결과 (2026-01-26)

| 순위 | 사이트 | 비고 |
|------|--------|------|
| 1 | stargio.co.kr | 예전 서비스 (구글 캐시) |
| 2 | nadaunse.com | **현재 서비스** |
| 3 | stargio.co.kr/monthly | "나다운세" 브랜드명 미사용 |

### 개선 방향
1. stargio.co.kr보다 높은 도메인 권위 확보 필요
2. "나다운세" 브랜드 키워드 집중 공략
3. 백링크 및 콘텐츠 마케팅 강화

---

## 참고 자료

- [네이버 웹마스터 가이드](https://searchadvisor.naver.com/guide)
- [구글 검색 센터](https://developers.google.com/search)
- [Schema.org 구조화 데이터](https://schema.org/)
- [Open Graph Protocol](https://ogp.me/)

---

## 빌드 타임 프리렌더 (Prerender)

### 개요
SPA(CSR)에서는 모든 페이지가 동일한 `index.html`의 메타 태그를 공유하여, 검색엔진 크롤러가 페이지별 고유 메타 태그를 인식하지 못합니다. 이를 해결하기 위해 빌드 시 Supabase에서 콘텐츠 목록을 가져와 페이지별 고유 메타 태그가 주입된 정적 HTML을 생성합니다.

### 빌드 스크립트
```json
"build": "vite build && node scripts/prerender.mjs"
```

### 동작 방식
1. `vite build` 완료 후 `scripts/prerender.mjs` 자동 실행
2. Supabase REST API로 `master_contents` + `blog_posts` 테이블에서 콘텐츠 조회
3. `build/index.html`을 템플릿으로 사용하여 페이지별 HTML 생성:
   - `/` (홈페이지): ItemList JSON-LD + 콘텐츠 목록 SEO body (**`isHomePage: true` → 템플릿 JSON-LD 보존**)
   - `/terms-of-service`, `/privacy-policy`: 정적 메타 태그 주입
   - `/product/{id}`: 유료 콘텐츠 메타 태그 + Product JSON-LD + BreadcrumbList JSON-LD
   - `/free/content/{id}`: 무료 콘텐츠 메타 태그 + BreadcrumbList JSON-LD (제목에 `[무료]` 접두사)
   - `/blog`, `/blog/{slug}`: 블로그 목록/상세 HTML
4. 콘텐츠 페이지는 article 태그로 감싸고, 관련 콘텐츠 내부 링크를 포함
5. **`isHomePage` 파라미터**: 홈페이지 외 페이지에서 템플릿의 기존 JSON-LD(WebSite, FAQPage, Organization) 자동 제거 (2026-02-24)
6. **sitemap.xml 생성**: 모든 페이지에 `<lastmod>` 포함 (블로그: published_at, 기타: 빌드일)
7. **rss.xml 생성**: 블로그 최신 50개 포스트를 RSS 2.0 형식으로 생성 (2026-02-24)
8. Vercel은 **정적 파일 > rewrites** 우선순위이므로 추가 설정 불필요

### 환경변수
- `VITE_SUPABASE_PROJECT_ID`: Supabase URL 구성에 사용
- `VITE_SUPABASE_ANON_KEY`: API 인증에 사용

### 주의사항: canonical URL 매핑
프리렌더가 생성하는 canonical과 React 컴포넌트의 canonical이 반드시 일치해야 함:

| 페이지 타입 | canonical URL | 컴포넌트 |
|-------------|--------------|----------|
| 유료 콘텐츠 | `/product/{id}` | `MasterContentDetailPage.tsx` |
| 무료 콘텐츠 | `/free/content/{id}` | `FreeContentDetail.tsx` |

### 에러 처리
- Supabase 조회 실패 시 경고만 출력하고 빌드는 성공 처리 (기존 SPA 동작 유지)
- 로컬 빌드 시 환경변수 미설정이면 콘텐츠 프리렌더 스킵 (정적 페이지만 생성)

### 생성되는 파일 구조
```
build/
├── index.html                     (홈 - ItemList JSON-LD + 콘텐츠 목록, isHomePage=true)
├── terms-of-service/index.html    (이용약관)
├── privacy-policy/index.html      (개인정보처리방침)
├── product/{id}/index.html        (유료 콘텐츠 - Product + BreadcrumbList JSON-LD)
├── free/content/{id}/index.html   (무료 콘텐츠 - BreadcrumbList JSON-LD)
├── blog/index.html                (블로그 목록 - ItemList JSON-LD)
├── blog/{slug}/index.html         (블로그 상세 - Article + BreadcrumbList JSON-LD)
├── sitemap.xml                    (사이트맵 - lastmod 포함)
└── rss.xml                        (RSS 2.0 피드 - 블로그 최신 50개)
```

---

## IndexNow 프로토콜

### 개요
IndexNow는 웹사이트가 검색엔진에 URL 변경을 즉시 알릴 수 있는 프로토콜입니다. 콘텐츠 배포/업데이트 시 네이버, Bing, Yandex에 즉시 인덱싱을 요청합니다.

### 지원 검색엔진
- **네이버** (searchadvisor.naver.com)
- **Bing** (bing.com)
- **Yandex** (yandex.com)
- ⚠️ **구글은 IndexNow 미지원** → Google Search Console에서 별도로 URL 검사 요청 필요

### Edge Function
- **파일**: `supabase/functions/index-now/index.ts`
- **환경변수**: `INDEXNOW_API_KEY` (Supabase Dashboard에서 설정)
- **키 파일**: `public/{api-key}.txt` (빌드 시 public 폴더에 배포)

### 설정 절차

1. **API 키 생성**
   - [IndexNow 키 생성기](https://www.bing.com/indexnow/getstarted)에서 키 생성
   - 또는 직접 32자 이상의 영숫자 문자열 생성

2. **키 파일 배포**
   - `public/indexnow-key.txt` 파일 내용을 실제 API 키로 교체
   - 파일명도 `public/{실제API키}.txt`로 변경
   - 빌드 후 `https://nadaunse.com/{API키}.txt`로 접근 가능한지 확인

3. **환경변수 설정**
   ```bash
   # Supabase Dashboard → Settings → Edge Functions → Environment Variables
   INDEXNOW_API_KEY=실제API키값
   ```

4. **Edge Function 배포**
   ```bash
   npx supabase functions deploy index-now --project-ref kcthtpmxffppfbkjjkub
   ```

### 사용 방법

```bash
# 단일 URL 제출
curl -X POST https://kcthtpmxffppfbkjjkub.supabase.co/functions/v1/index-now \
  -H "Authorization: Bearer {SUPABASE_ANON_KEY}" \
  -H "Content-Type: application/json" \
  -d '{"urls": ["/product/123", "/free/content/456"]}'

# 전체 사이트 제출 (빌드 후)
curl -X POST https://kcthtpmxffppfbkjjkub.supabase.co/functions/v1/index-now \
  -H "Authorization: Bearer {SUPABASE_ANON_KEY}" \
  -H "Content-Type: application/json" \
  -d '{"urls": ["/", "/product/1", "/product/2", "/free/content/1"]}'
```

### 호출 타이밍
- 새 콘텐츠 배포 후 (master_contents deploy 시)
- 빌드 완료 후 (Vercel 배포 완료 시)
- 기존 콘텐츠 업데이트 후

---

## 네이버 수집 요청 절차

### 사이트맵 재제출
1. [네이버 서치어드바이저](https://searchadvisor.naver.com/console/site/summary?site=https%3A%2F%2Fnadaunse.com) 접속
2. **요청** → **사이트맵 제출** → `https://nadaunse.com/sitemap.xml` 입력
3. 제출 후 수집 상태 모니터링 (보통 1-3일 소요)

### 주요 URL 수집 요청
1. **요청** → **웹 페이지 수집** → URL 입력
2. 우선 수집 요청할 URL:
   - `https://nadaunse.com/` (홈페이지)
   - 유료 콘텐츠 상위 5개 URL
   - 무료 콘텐츠 상위 3개 URL
3. ⚠️ 하루 수집 요청 제한: 일반 10건, 주요 URL 10건

### 프리렌더 빌드 후 체크리스트
1. `npx vite build` 실행 (prerender.mjs 자동 실행)
2. `build/index.html`에 ItemList JSON-LD 포함 확인
3. `build/product/*/index.html`에 BreadcrumbList JSON-LD 포함 확인
4. Vercel 배포 완료 확인
5. 네이버 사이트맵 재제출
6. 주요 URL 수집 요청 (홈페이지 + 주요 콘텐츠)
7. IndexNow Edge Function으로 전체 URL 제출
8. 1-3일 후 네이버 서치어드바이저에서 색인 변화 확인

---

## 블로그(운세 콘텐츠) SEO

### 개요
SEO 개선의 핵심 전략으로, 롱테일 키워드 유입을 확보하기 위한 정보성 콘텐츠 페이지입니다.
현재 "사주", "타로" 등 일반 키워드로 검색 노출이 0인 상태에서, 블로그 콘텐츠를 통해 검색 유입을 만드는 것이 목적입니다.

### 구현 현황 (2026-02-20)

| 항목 | 상태 | 내용 |
|------|------|------|
| DB 테이블 | ✅ | `blog_posts` (production + staging) |
| RLS | ✅ | 누구나 published 글 읽기 가능 (크롤러 대응) |
| 프론트엔드 | ✅ | `BlogListPage.tsx` + `BlogDetailPage.tsx` |
| 라우팅 | ✅ | `/blog` (목록), `/blog/:slug` (상세), 비로그인 접근 가능 |
| 프리렌더 | ✅ | `prerender.mjs`에 블로그 목록/상세 HTML 생성 로직 포함 |
| JSON-LD | ✅ | 목록: ItemList, 상세: Article + BreadcrumbList |
| sitemap | ✅ | `/blog` + `/blog/{slug}` URL 자동 포함 |
| GA 트래킹 | ✅ | 블로그 목록 페이지뷰 이벤트 전송 |
| 조회수 | ✅ | `view_count` + `weekly_views` + `last_weekly_views` (pg_cron 매주 리셋) |
| CSS | ✅ | `div.blog-content` 스타일 (`index.css`에 직접 포함, 테이블/코드블록/중첩 리스트 지원) |
| 관련 글 추천 | ✅ | 블로그 상세 하단, 같은 카테고리 view_count 순 3개 (fallback: 최신순) |
| 본문 상호 링크 | ✅ | "함께 읽어보세요" cross-links, DOM 삽입 방식 (크롤러 인식 `<a href>`) |
| 홈→블로그 내부 링크 | ✅ | `BlogPreviewSection` — 홈 스크롤 끝에서 최근 블로그 3개 표시 |
| 크롤러 링크 지원 | ✅ | 모든 블로그 링크 `<a href>` + `e.preventDefault()` + `navigate()` 패턴 |
| Article JSON-LD (CSR) | ✅ | `SEO.tsx` article prop → 블로그 상세에서 클라이언트 렌더링 |
| 이미지 loading 속성 | ✅ | hero: `eager`, 하단 썸네일: `lazy` |
| 프로필 메뉴 | ✅ | "운세 콘텐츠" 메뉴 추가 |

### ⚠️ blog-content CSS 주의사항
- `src/styles/globals.css`는 Tailwind 소스 파일로, 앱에서 직접 import되지 않음
- **실제 로드되는 CSS**: `src/index.css` (main.tsx에서 import)
- blog-content 스타일은 `index.css` 끝에 직접 추가되어 있음
- globals.css 수정 시 반드시 index.css에도 동일하게 반영해야 함

### 콘텐츠 현황 (총 24개)

| 카테고리 | 수량 | 대표 키워드 |
|---------|------|------------|
| saju (사주) | 18개 | 일간별 성격, 십성, 오행, 대운, 궁합, 연애운, 재물운, 직업적성, 건강운, 바람사주, 반려동물궁합, 12지지, 신살, 자미두수 |
| tarot (타로) | 3개 | 메이저아르카나, 원카드리딩, 스프레드 종류 |
| tip (꿀팁) | 3개 | 신년운세, MBTI vs 사주, 띠별운세 |

### 블로그 관련 파일

| 파일 | 역할 |
|------|------|
| `src/components/BlogListPage.tsx` | 블로그 목록 (localStorage 캐시 5분, `<a href>` 크롤러 지원) |
| `src/components/BlogDetailPage.tsx` | 블로그 상세 (관련 글 추천, cross-links, Article JSON-LD, 이미지 loading) |
| `src/components/SEO.tsx` | `article` prop으로 Article JSON-LD 스키마 렌더링 |
| `src/pages/HomePage.tsx` | `BlogPreviewSection` — 홈 하단 블로그 3개 미리보기 |
| `src/index.css` | `.blog-content` HTML 스타일링 (**⚠️ globals.css 아닌 index.css에 직접 포함**) |
| `src/styles/globals.css` | `.blog-content` 소스 (참고용, 실제 로드는 index.css) |
| `scripts/prerender.mjs` | 블로그 프리렌더 + sitemap 생성 + 홈페이지 블로그 링크 |
| `supabase/migrations/20260220_create_blog_posts.sql` | 참고용 SQL |

### DB 스키마: `blog_posts`

```sql
id UUID PRIMARY KEY
title TEXT NOT NULL
slug TEXT NOT NULL UNIQUE        -- URL 경로 (/blog/{slug})
excerpt TEXT                     -- 발췌 (목록 표시용)
content TEXT NOT NULL             -- HTML 본문
thumbnail_url TEXT               -- 썸네일 이미지 URL
category TEXT                    -- 'saju', 'tarot', 'tip'
tags TEXT[]                      -- 태그 배열
meta_title TEXT                  -- SEO title (없으면 title 사용)
meta_description TEXT            -- SEO description (없으면 excerpt 사용)
view_count INTEGER DEFAULT 0     -- 총 조회수
weekly_views INTEGER DEFAULT 0   -- 이번주 조회수
last_weekly_views INTEGER DEFAULT 0  -- 저번주 조회수
status TEXT DEFAULT 'draft'      -- 'draft' | 'published'
published_at TIMESTAMPTZ
created_at TIMESTAMPTZ DEFAULT now()
updated_at TIMESTAMPTZ DEFAULT now()
```

### RPC 함수
- `increment_blog_view_count(post_id UUID)` — `view_count + 1`, `weekly_views + 1` 동시 증가 (`SECURITY DEFINER`)
- `reset_blog_weekly_views()` — 수동 리셋 (테스트용)

### pg_cron 스케줄
- `blog-weekly-views-reset` — 매주 월요일 00:00 KST (`0 15 * * 0` UTC)
- `weekly_views → last_weekly_views` 이동 후 0 리셋 (`master_contents`와 동일 패턴)

### 크롤러 친화 링크 패턴

블로그 관련 모든 링크는 크롤러가 인식할 수 있도록 `<a href>` 태그를 사용합니다.
SPA 내비게이션을 유지하면서 크롤러에게 링크를 노출하는 패턴:

```tsx
// ✅ 크롤러 + SPA 모두 지원
<a
  href="/blog/slug"
  onClick={(e) => { e.preventDefault(); navigate('/blog/slug'); }}
  style={{ textDecoration: 'none', color: 'inherit' }}
>
  카드 내용
</a>

// ❌ 크롤러 인식 불가 (기존 방식)
<div onClick={() => navigate('/blog/slug')}>카드 내용</div>
```

적용된 파일: `BlogListPage.tsx`, `BlogDetailPage.tsx`, `HomePage.tsx`

### 콘텐츠 추가 방법
Supabase SQL로 직접 삽입 (관리 UI 없음):

```sql
INSERT INTO blog_posts (title, slug, excerpt, content, category, tags, meta_title, meta_description, status, published_at)
VALUES (
  '제목',
  'url-slug',
  '발췌문',
  '<h2>소제목</h2><p>본문 HTML...</p>',
  'saju',  -- 또는 'tarot', 'tip'
  ARRAY['태그1', '태그2'],
  'SEO용 제목 (검색결과 표시)',
  'SEO용 설명 (검색결과 표시)',
  'published',
  NOW()
);
```

### 프리렌더 배포 절차
1. `npx vite build` (prerender.mjs 자동 실행 → 블로그 HTML + sitemap 생성)
2. Vercel 배포 (git push → 자동 배포)
3. Google Search Console 사이트맵 재제출
4. 네이버 서치어드바이저 사이트맵 재제출 + 주요 URL 수집 요청
5. IndexNow Edge Function으로 블로그 URL 일괄 제출

---

## 변경 이력

| 날짜 | 변경 내용 |
|------|----------|
| 2026-02-25 | **Google Search Console 색인 문제 수정** - robots.txt `Disallow: /terms`가 `/terms-of-service` 차단하는 버그 수정 (`Allow: /terms-of-service` 추가), Edge Function sitemap `/manse` priority 0.6→0.8 + lastmod 추가 (prerender와 정합성) |
| 2026-02-24 | **SEO 종합 개선** - `/manse` sitemap 추가, JSON-LD 중복 제거 (홈페이지 외 WebSite/FAQPage/Organization 제거, `isHomePage` 파라미터), sitemap `<lastmod>` 날짜 추가, RSS 2.0 피드 생성 (`/rss.xml`), 네이버 서치어드바이저 새 계정 재등록 (인증 메타 태그 `index.html` 적용), 이미지 alt 속성 16건 수정 (ProfilePage `aria-hidden` 7건, MyReportList 의미 있는 alt 3건), 콘텐츠 description fallback 유료/무료 차별화, description 80자 제한 준수 (index.html + prerender.mjs 축소), 사이트맵/RSS 네이버 재제출 |
| 2026-02-20 | **SEO 내부 링크 강화** - 홈→블로그 내부 링크 (BlogPreviewSection), 관련 글 추천 (같은 카테고리 view_count 순), 본문 cross-links ("함께 읽어보세요"), blog-content CSS 검수 + index.css 반영, 모든 블로그 링크 `<a href>` 크롤러 지원 변환, Article JSON-LD 클라이언트 지원 (SEO.tsx), Organization sameAs 카카오톡 채널 추가, 이미지 loading 속성 (eager/lazy) |
| 2026-02-20 | **블로그(운세 콘텐츠) 기능 구현** - BlogListPage/BlogDetailPage 생성, /blog /blog/:slug 라우트 추가, blog-content CSS, prerender 블로그 지원 (Article + ItemList + BreadcrumbList JSON-LD), sitemap 블로그 URL 추가, GA 페이지뷰 트래킹, blog_posts 테이블 (weekly_views/last_weekly_views + pg_cron 리셋), 콘텐츠 24개 작성 (스레드/트위터 트렌드 분석 기반 롱테일 키워드) |
| 2026-02-12 | **SEO 즉시 강화 작업** - 홈페이지 프리렌더 (ItemList JSON-LD + 콘텐츠 목록), BreadcrumbList JSON-LD 추가, SEO body 강화 (article 태그, 내부 링크, h1/h2 구조), IndexNow Edge Function 생성, 이미지 alt 속성 5건 수정 |
| 2026-02-10 | **prerender 파이프라인 활성화** - `package.json` 빌드에 prerender 연결, 무료 콘텐츠 canonical URL 수정 (`/product/` → `/free/content/`). 네이버 진단: description 동일 12건, 색인 12/220+ |
| 2026-02-06 | **빌드 타임 프리렌더 적용** - `scripts/prerender.mjs` 추가, 빌드 시 콘텐츠별 고유 메타 태그 주입된 정적 HTML 생성 (Google/Naver 크롤러 대응) |
| 2026-02-06 | **SEO 키워드 다양화 개선** - title/description/keywords 전면 개편, FAQPage JSON-LD 추가, SEO.tsx 기본값 강화, 페이지별 keywords 추가 (HomePage, FreeContentDetail, MasterContentDetailPage) |
| 2026-01-26 | 초기 SEO 설정 완료 (메타 태그, JSON-LD, 로고) |
| 2026-01-26 | 네이버 서치어드바이저 등록 확인 |
| 2026-01-26 | 구글 Search Console 등록 확인 (4 클릭, 11 노출, CTR 36.4%) |
