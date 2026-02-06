# SEO 가이드 - 나다운세

> **검색엔진 최적화(SEO) 설정 및 관리 가이드**
> **최종 업데이트**: 2026-02-06

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

---

## 메타 태그 설정

### 위치
`/index.html`

### 현재 설정된 메타 태그

```html
<!-- 기본 메타 정보 -->
<title>나다운세 - 무료운세 사주 타로 궁합 | AI 사주풀이 · 신년운세</title>
<meta name="description" content="무료운세, 사주, 타로, 궁합, 신년운세를 AI로 정확하게 풀어드립니다. 사주팔자, 띠별운세, 오늘의운세, 별자리운세, 사주풀이까지 나다운세에서 무료로 만나보세요." />
<meta name="keywords" content="나다운세, 운세, 무료사주, 무료운세, 신년운세, 사주, 타로, 궁합, 오늘의운세, 띠별오늘의운세, 띠별운세, AI 운세, 별자리운세, 챗지피티사주, 챗gpt사주, 사주GPT, 신점, 사주팔자, 사주풀이, 인터넷사주, 자기이해" />
<meta name="robots" content="index,follow" />
<meta name="author" content="나다운세" />

<!-- Canonical URL -->
<link rel="canonical" href="https://nadaunse.com/" />

<!-- Open Graph -->
<meta property="og:type" content="website" />
<meta property="og:site_name" content="나다운세" />
<meta property="og:title" content="나다운세 - 무료운세 사주 타로 궁합 | AI 사주풀이 · 신년운세" />
<meta property="og:description" content="무료운세, 사주, 타로, 궁합, 신년운세를 AI로 정확하게 풀어드립니다. 사주팔자, 띠별운세, 오늘의운세, 별자리운세, 사주풀이까지 나다운세에서 무료로 만나보세요." />
<meta property="og:url" content="https://nadaunse.com/" />
<meta property="og:image" content="https://hyltbeewxaqashyivilu.supabase.co/storage/v1/object/public/assets/OG%20image/OG%20KakaoTalk.png" />

<!-- Twitter Card -->
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="나다운세 - 무료운세 사주 타로 궁합 | AI 사주풀이 · 신년운세" />
<meta name="twitter:description" content="무료운세, 사주, 타로, 궁합, 신년운세를 AI로 정확하게 풀어드립니다. 사주팔자, 띠별운세, 오늘의운세, 별자리운세, 사주풀이까지 나다운세에서 무료로 만나보세요." />
```

### JSON-LD 구조화 데이터

```json
// WebSite
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

// FAQPage (리치 스니펫)
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    { "name": "나다운세에서 무료운세를 볼 수 있나요?", ... },
    { "name": "AI 사주풀이는 어떻게 작동하나요?", ... },
    { "name": "타로점과 사주 중 어떤 것을 선택해야 하나요?", ... }
  ]
}

// Organization (구글 검색 로고용)
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
  }
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
Disallow: /login
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

---

## sitemap.xml 설정

### 자동 생성
Vercel 빌드 시 자동 생성됨

### 포함되는 페이지
- 홈페이지 (`/`) - priority: 1.0
- 상품 페이지 (`/product/{id}`) - priority: 0.9
- 무료 콘텐츠 (`/free/{id}`) - priority: 0.8
- 정적 페이지 (이용약관, 개인정보처리방침) - priority: 0.3

---

## 검색엔진별 설정

### 네이버 서치어드바이저

**현재 상태** (2026-01-26 기준):
- ✅ 사이트 등록 완료
- ✅ 소유권 인증 완료
- ✅ 사이트맵 제출 완료
- ✅ HTTPS 리다이렉션 정상
- ✅ 보안 인증서 정상

**인증 방법**: HTML 파일 또는 메타 태그

```html
<!-- 네이버 인증 (필요 시 index.html에 추가) -->
<meta name="naver-site-verification" content="인증코드" />
```

### 구글 Search Console

**현재 상태** (2026-01-26 기준):
- ✅ 사이트 등록 완료
- ✅ 소유권 인증 완료
- ✅ 사이트맵 제출 완료
- ✅ 검색 결과에 노출 중

**성과 데이터**:
| 지표 | 값 |
|------|-----|
| 총 클릭수 | 4 |
| 총 노출수 | 11 |
| 평균 CTR | 36.4% |
| 평균 게재순위 | 4.8위 |

**주요 검색어**: "나다운세" (4 클릭)

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

### SEO 개선 작업
- [ ] 콘텐츠별 메타 태그 동적 설정
- [ ] 네이버 블로그/카페 백링크 확보
- [ ] IndexNow 프로토콜 적용 검토

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

### 동작 방식
1. `vite build` 완료 후 `scripts/prerender.mjs` 자동 실행
2. Supabase REST API로 `master_contents` 테이블에서 deployed 콘텐츠 조회
3. `build/index.html`을 템플릿으로 사용하여 페이지별 HTML 생성:
   - `/terms-of-service`, `/privacy-policy`: 정적 메타 태그 주입
   - `/product/{id}`: 유료 콘텐츠 메타 태그 + Product JSON-LD 주입
   - `/free/content/{id}`: 무료 콘텐츠 메타 태그 주입 (제목에 `[무료]` 접두사)
4. Vercel은 **정적 파일 > rewrites** 우선순위이므로 추가 설정 불필요

### 환경변수
- `VITE_SUPABASE_PROJECT_ID`: Supabase URL 구성에 사용
- `VITE_SUPABASE_ANON_KEY`: API 인증에 사용

### 에러 처리
Supabase 조회 실패 시 경고만 출력하고 빌드는 성공 처리 (기존 SPA 동작 유지).

### 생성되는 파일 구조
```
build/
├── index.html                     (홈 - 기존 그대로)
├── terms-of-service/index.html    (이용약관)
├── privacy-policy/index.html      (개인정보처리방침)
├── product/{id}/index.html        (유료 콘텐츠)
└── free/content/{id}/index.html   (무료 콘텐츠)
```

---

## 변경 이력

| 날짜 | 변경 내용 |
|------|----------|
| 2026-02-06 | **빌드 타임 프리렌더 적용** - `scripts/prerender.mjs` 추가, 빌드 시 콘텐츠별 고유 메타 태그 주입된 정적 HTML 생성 (Google/Naver 크롤러 대응) |
| 2026-02-06 | **SEO 키워드 다양화 개선** - title/description/keywords 전면 개편, FAQPage JSON-LD 추가, SEO.tsx 기본값 강화, 페이지별 keywords 추가 (HomePage, FreeContentDetail, MasterContentDetailPage) |
| 2026-01-26 | 초기 SEO 설정 완료 (메타 태그, JSON-LD, 로고) |
| 2026-01-26 | 네이버 서치어드바이저 등록 확인 |
| 2026-01-26 | 구글 Search Console 등록 확인 (4 클릭, 11 노출, CTR 36.4%) |
