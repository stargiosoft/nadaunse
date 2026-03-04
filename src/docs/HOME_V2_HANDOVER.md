# 홈 고도화 인수인계서

> **작성일**: 2026-03-04
> **작업 브랜치**: staging
> **배포 상태**: staging push 완료 (Vercel 자동 배포)

---

## 완료된 작업

### Figma Make 퍼블리싱 코드 이관 (UI 셸)

소스: `C:\Users\gksru\Downloads\홈 고도화 (26.03.03)`
타겟: `C:\Users\gksru\나다운세 원본`

**UI 셸만 이관 완료** — 비즈니스 로직 연동은 미진행.

| Phase | 내용 | 상태 |
|-------|------|------|
| 0 | 사전 준비 (fuse.js, PNG 18개, SVG 13개, Lottie, Divider) | 완료 |
| 1 | 공통 유틸리티 (consultStatus.ts, useScrollDirection.ts) | 완료 |
| 2 | 공유 컴포넌트 (TextareaInput, RecommendedCarousel) | 완료 |
| 3 | 페이지 컴포넌트 11개 | 완료 |
| 4 | 라우트 등록 (App.tsx, 10개 신규 + "/" 교체) | 완료 |
| 5 | 빌드 검증 + 문서 업데이트 + staging 배포 | 완료 |

---

## 이관된 파일 전체 목록

### 페이지 (11개)

| 파일 | 라우트 | 스테이징 URL |
|------|--------|-------------|
| `src/pages/HomeScreenNew.tsx` | `/` | https://staging.nadaunse.com/ |
| `src/pages/FortuneAllPage.tsx` | `/best-fortune` | https://staging.nadaunse.com/best-fortune |
| `src/pages/NewFreeFortuneAllPage.tsx` | `/new-free` | https://staging.nadaunse.com/new-free |
| `src/pages/SearchPage.tsx` | `/search` | https://staging.nadaunse.com/search |
| `src/pages/SajuConsultPage.tsx` | `/saju-consult` | https://staging.nadaunse.com/saju-consult |
| `src/pages/SajuConsultLoadingPage.tsx` | `/saju-consult/loading` | https://staging.nadaunse.com/saju-consult/loading |
| `src/pages/SajuConsultResultPage.tsx` | `/saju-consult/result` | https://staging.nadaunse.com/saju-consult/result |
| `src/pages/SajuRecommendedFortunePage.tsx` | `/saju-consult/result/recommended` | https://staging.nadaunse.com/saju-consult/result/recommended |
| `src/pages/TaroConsultPage.tsx` | `/taro-consult` | https://staging.nadaunse.com/taro-consult |
| `src/pages/TaroConsultLoadingPage.tsx` | `/taro-consult/loading` | https://staging.nadaunse.com/taro-consult/loading |
| `src/pages/TaroConsultResultPage.tsx` | `/taro-consult/result` | https://staging.nadaunse.com/taro-consult/result |

### 공유 컴포넌트 / 유틸리티 (5개)

| 파일 | 용도 |
|------|------|
| `src/components/TextareaInput.tsx` | 상담 입력 텍스트 영역 (autoFocus, 글자 수 카운터) |
| `src/components/RecommendedCarousel.tsx` | 결과 페이지 추천 캐러셀 (가로 스크롤) |
| `src/imports/Divider-13-1579.tsx` | 섹션 구분선 |
| `src/lib/consultStatus.ts` | 상담 상태 localStorage 관리 (idle/completed, 일별 초기화) |
| `src/hooks/useScrollDirection.ts` | 스크롤 방향 감지 훅 (RAF 기반, 히스테리시스) |

### 에셋

| 종류 | 개수 | 경로 |
|------|------|------|
| PNG 이미지 | 18개 | `public/home-v2/` |
| SVG 경로 데이터 | 13개 | `src/imports/svg-*.ts` |
| Lottie JSON | 1개 | `src/imports/animated-shape-effect.json` |

### 기타 변경

- `src/App.tsx` — 11개 import 추가, 10개 라우트 추가, `HomePage` → `HomeScreenNew` 교체
- `backup/HomePage.tsx` — 기존 홈 백업
- `package.json` — fuse.js 의존성 추가

---

## 이관 시 적용한 변환 규칙

| 항목 | From | To |
|------|------|----|
| 라우터 | `from 'react-router'` | `from 'react-router-dom'` |
| SVG import | `../../imports/svg-*` | `../imports/svg-*` |
| 이미지 | `import img from 'figma:asset/[hash].png'` | `const img = '/home-v2/[name].png'` (string 상수) |
| 상담 유틸 | `from '../App'` | `from '../lib/consultStatus'` |
| 환경 감지 | `import.meta.env.DEV` | `import { DEV } from '../lib/env'` |
| 컴포넌트 경로 | `./TextareaInput`, `./RecommendedCarousel` | `../components/TextareaInput`, `../components/RecommendedCarousel` |
| Divider | `../../imports/Divider-13-1579` | `../imports/Divider-13-1579` |

### PNG 해시 → 파일명 매핑

| 해시 (앞 8자) | 파일명 |
|--------------|--------|
| c4c7e5a9 | card-1.png |
| 83384252 | card-2.png |
| 933bee4a | card-3.png |
| 87a126fb | card-4.png |
| 6012c1d6 | card-5.png |
| 4f0140c4 | card-6.png |
| cd6216e8 | card-7.png |
| 95bf0da4 | card-8.png |
| 6cafc87e | card-9.png |
| 10b38516 | card-10.png |
| 3c67672d | card-11.png |
| 0725c833 | card-12.png |
| 0f929051 | card-13.png |
| fcd04bbc | card-14.png |
| bada0ef4 | thumbnail.png |
| 7b851936 | result-thumbnail.png |
| f3218940 | taro-card-back.png |
| 2ced5a86 | taro-card-front.png |

---

## 다음 단계 (미완료 작업)

### 1. 비즈니스 로직 연동 (핵심)

현재 모든 페이지는 **하드코딩된 더미 데이터**로 동작. 실제 서비스 연동 필요:

| 페이지 | 연동 항목 |
|--------|----------|
| `HomeScreenNew.tsx` | 사용자 이름 (현재 "홍길동님" 하드코딩), BEST/NEW 운세 목록 API, 상담 상태 실시간 연동 |
| `FortuneAllPage.tsx` | 운세 콘텐츠 목록 API, 탭별 필터링, 조회수 실시간 데이터 |
| `NewFreeFortuneAllPage.tsx` | 무료 운세 콘텐츠 목록 API |
| `SearchPage.tsx` | 검색 대상 데이터를 API에서 가져오기 (현재 `FortuneAllPage`의 `ALL_ITEMS` 하드코딩) |
| `SajuConsultPage/ResultPage` | 사주 상담 AI 생성 연동 (Edge Function), 결과 데이터 표시 |
| `TaroConsultResultPage` | 타로 카드 데이터 연동, AI 해석 결과 표시 |
| `RecommendedCarousel` | 추천 콘텐츠 API 연동, 카드 클릭 시 상세 페이지 이동 |

### 2. 프로덕션 배포 검토

- staging에서 UI 검증 후 production 브랜치에 머지
- 기존 HomePage.tsx의 스크롤 복원 로직이 HomeScreenNew에는 없음 — 필요 시 구현
- 기존 홈에서 사용하던 컴포넌트(BottomNavigation 등)가 HomeScreenNew에는 미포함

### 3. DEV 전용 코드 정리

- `TaroConsultResultPage.tsx` — "DEV 카드 초기화" 버튼 (프로덕션 배포 전 `DEV` 가드 확인)
- `HomeScreenNew.tsx` — FreeConsultationSection의 "Dev" 토글 버튼 (이미 `DEV` 가드 적용됨)

### 4. 이미지 최적화

- `public/home-v2/` PNG 18개가 비압축 원본 (총 ~8.5MB)
- WebP 변환 또는 이미지 CDN 적용 검토

---

## 업데이트된 문서

| 문서 | 변경 사항 |
|------|----------|
| `src/PROJECT_CONTEXT.md` | Quick Reference에 "홈 고도화" 섹션 추가, 스크롤 복원 참조 업데이트 |
| `src/components-inventory.md` | 홈 고도화 카테고리 16개 추가 (78→94개), 업데이트 이력 |
| `src/DECISIONS.md` | "홈 고도화 — Figma Make 이관" ADR 추가 |

---

## 참고 사항

- 이관 계획 전문: `.claude/plans/radiant-sauteeing-moonbeam.md`
- 기존 홈 백업: `backup/HomePage.tsx` (1,885줄)
- 소스 코드 원본: `C:\Users\gksru\Downloads\홈 고도화 (26.03.03)\src\app\`
