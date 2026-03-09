# Components Inventory

> **최종 업데이트**: 2026-03-05
> **총 활성 컴포넌트 수**: 106개
> **UI 컴포넌트 (shadcn/ui)**: 52개
> **프로젝트**: 타로/사주 운세 모바일 웹 서비스
> **필수 문서**: [CLAUDE.md](../CLAUDE.md) - 개발 규칙

---

## 📋 목차

- [UI 컴포넌트 (11개)](#ui-컴포넌트)
- [인증 관련 (4개)](#인증-관련)
- [결제 관련 (6개)](#결제-관련)
- [무료 콘텐츠 관련 (11개)](#무료-콘텐츠-관련)
- [마스터 콘텐츠 관리 (5개)](#마스터-콘텐츠-관리)
- [통계 관리 (1개)](#통계-관리-1개)
- [사주 정보 관리 (9개)](#사주-정보-관리)
- [타로 콘텐츠 (4개)](#타로-콘텐츠)
- [나다움 태그 (3개)](#나다움-태그-3개)
- [주간 보고서 (12개)](#주간-보고서-12개)
- [프로필 및 구매 내역 (3개)](#프로필-및-구매-내역)
- [유틸리티 컴포넌트 (4개)](#유틸리티-컴포넌트)
- [약관 페이지 (3개)](#약관-페이지)
- [에러 처리 (2개)](#에러-처리)
- [공유 리워드 (2개)](#공유-리워드-2개)
- [홈 고도화 (16개)](#홈-고도화-16개)
- [사주/타로 상담 체험 (13개)](#사주타로-상담-체험-13개)

---

## 🎨 UI 컴포넌트

### ArrowLeft.tsx
- **역할**: 뒤로가기 버튼 아이콘 컴포넌트
- **사용처**: MasterContentCreate, MasterContentDetail, MasterContentList, MasterContentQuestions, PurchaseHistoryPage
- **타입**: Presentational Component
- **파일 경로**: `/components/ArrowLeft.tsx`

### CheckboxIcon.tsx
- **역할**: 체크박스 아이콘 컴포넌트 (체크/미체크 상태 표시)
- **사용처**: MasterContentList
- **타입**: Presentational Component
- **파일 경로**: `/components/CheckboxIcon.tsx`

### Footer.tsx
- **역할**: 하단 푸터 (이용약관/개인정보처리방침 링크)
- **사용처**: 전역 레이아웃
- **타입**: Layout Component
- **파일 경로**: `/components/Footer.tsx`

### LoadingPage.tsx
- **역할**: 전체 화면 로딩 페이지 (진행률 표시)
- **사용처**: App.tsx 라우팅
- **타입**: Page Component
- **주요 기능**: 
  - 무료 콘텐츠 이미지 프리로딩 최적화 적용
  - localStorage 캐시 (5분 TTL)
  - 우선순위 프리로딩 (high/low priority)
- **파일 경로**: `/components/LoadingPage.tsx`

### NavigationHeader.tsx
- **역할**: 공통 네비게이션 헤더 (제목 + 뒤로가기)
- **사용처**: 여러 페이지에서 재사용
- **타입**: Layout Component
- **파일 경로**: `/components/NavigationHeader.tsx`

### BottomNavigation.tsx
- **역할**: 하단 네비게이션 바
- **사용처**: 전역 레이아웃
- **타입**: Layout Component
- **주요 기능**: 
  - 홈, 프로필 등 주요 페이지 이동
  - 하단 고정 CTA 리팩토링 완료 (2026-01-06)
  - iOS Safe Area 대응
- **파일 경로**: `/components/BottomNavigation.tsx`

### ConfirmDialog.tsx
- **역할**: 공통 확인/취소 다이얼로그
- **사용처**: 삭제/변경 확인 등
- **타입**: Modal Component
- **파일 경로**: `/components/ConfirmDialog.tsx`

### ButtonSquareButton.tsx
- **역할**: 정사각형 모양 버튼 컴포넌트 (Framer Motion 애니메이션 포함)
- **사용처**: 홈 화면 등
- **타입**: Presentational Component
- **파일 경로**: `/components/ButtonSquareButton.tsx`

### ImageWithFallback.tsx
- **역할**: 이미지 로드 실패 시 fallback SVG 표시하는 공통 이미지 컴포넌트
- **사용처**: 콘텐츠 썸네일, 카드 등 이미지 표시 전역
- **타입**: Presentational Component
- **파일 경로**: `/components/ImageWithFallback.tsx`

### NavigationTabBar.tsx
- **역할**: 마이페이지 탭바 (프로필 | 나의 분석 보고서 탭 전환)
- **사용처**: ProfilePage
- **타입**: Navigation Component
- **파일 경로**: `/components/NavigationTabBar.tsx`

### SEO.tsx
- **역할**: 페이지별 SEO 메타태그 설정 (React Helmet)
- **사용처**: 콘텐츠 상세 페이지 등
- **타입**: Utility Component
- **파일 경로**: `/components/SEO.tsx`

---

## 🔐 인증 관련

### LoginPageNew.tsx
- **역할**: 카카오/구글 로그인 페이지
- **사용처**: `/login/new` 라우트
- **타입**: Page Component
- **주요 기능**: 
  - OAuth 소셜 로그인 통합 (Kakao, Google)
  - **개발 환경 분리**: `import.meta.env.DEV` 조건으로 테스트 버튼 감싸기
- **파일 경로**: `/components/LoginPageNew.tsx`
- **최근 업데이트**: 2026-01-06 - 개발용 테스트 버튼 환경 분리 처리

### ExistingAccountPageNew.tsx
- **역할**: 기존 계정 연동 안내 페이지
- **사용처**: 계정 중복 시 안내
- **타입**: Page Component
- **주요 기능**: 계정 병합 안내 및 처리
- **파일 경로**: `/components/ExistingAccountPageNew.tsx`

### SessionExpiredDialog.tsx
- **역할**: 세션 만료 안내 다이얼로그
- **사용처**: 전역 세션 관리
- **타입**: Modal Component
- **주요 기능**: 자동 로그아웃 안내 및 재로그인 유도
- **파일 경로**: `/components/SessionExpiredDialog.tsx`

### PendingTagsCheckPage (App.tsx 내부)
- **역할**: 회원가입 후 사주/무료콘텐츠/태그 자동 저장 처리
- **사용처**: `/pending-tags-check` 라우트 (AuthCallback에서 리다이렉트)
- **타입**: Page Component (App.tsx 내부 정의)
- **주요 기능**:
  - `cached_saju_info` → `saju_records` 테이블 저장
  - localStorage 무료 콘텐츠 결과 → `free_content_records` 테이블 저장
  - `phone_number` 있으면 태그 저장 후 홈 이동
  - `phone_number` 없으면 나다움 기록하기 페이지로 이동 (바텀시트 오픈)
- **관련 함수**: `clearUserCaches()` (pending_trait_tags 있으면 cached_saju_info 보존)
- **파일 경로**: `/App.tsx` (내부 함수 컴포넌트)
- **추가 날짜**: 2026-01-30

---

## 💰 결제 관련

### PaymentNew.tsx
- **역할**: 결제 페이지 (포트원 연동)
- **사용처**: `/product/:id/payment/new` 라우트
- **타입**: Page Component
- **주요 기능**:
  - 심화 해석판 결제
  - 쿠폰 적용 (웰컴 쿠폰 5000원, 재방문 쿠폰 3000원, 미션성공 쿠폰 12900원)
  - 0원 결제 최적화 (불필요한 로딩 제거)
  - 약관 동의
  - PortOne v2 결제 연동
  - 결제 오버레이 감지 (보이는 요소만 감지)
- **최근 개선** (2026-01-16):
  - `display: none` iframe 무시하여 정확한 결제 화면 감지
  - 0원 결제 시 "결제 페이지로 이동중" 로딩 제거
  - visibility 체크 로직 추가 (offsetParent, display, visibility)
- **파일 경로**: `/components/PaymentNew.tsx`

### AlimtalkInfoInputPage.tsx
- **역할**: 알림톡 전화번호 입력 페이지
- **사용처**: `/alimtalk-info/:orderId` 라우트
- **타입**: Page Component
- **주요 기능**:
  - 유료 콘텐츠 구매 후 전화번호 미등록 사용자 대상
  - 사주 정보에 전화번호 업데이트
  - 캐시 무효화: `primary_saju` + `saju_records_cache` + `saju_cache_checked` 삭제
  - 주문 소유자 검증 (다른 계정 주문 접근 방지)
  - 뒤로가기 시 상품 상세 페이지로 이동
- **파일 경로**: `/components/AlimtalkInfoInputPage.tsx`
- **추가 날짜**: 2026-01-19
- **최근 업데이트**: 2026-03-03 - 캐시 무효화 시 `saju_cache_checked` 삭제 추가

### PaymentComplete.tsx
- **역할**: 결제 완료 페이지
- **사용처**: `/payment/complete` 라우트
- **타입**: Page Component
- **주요 기능**: 
  - 결제 완료 안내
  - 카카오 알림톡 발송 (TalkDream API)
  - 다음 단계 안내 (사주 입력/선택)
- **파일 경로**: `/components/PaymentComplete.tsx`

### CouponBottomSheetNew.tsx
- **역할**: 쿠폰 선택 바텀시트 (신버전)
- **사용처**: PaymentNew.tsx
- **타입**: Modal Component
- **주요 기능**: 
  - 사용 가능한 쿠폰 목록 표시
  - 쿠폰 선택 및 적용
  - 할인 금액 미리보기
- **파일 경로**: `/components/CouponBottomSheetNew.tsx`

### SproutChargingStation.tsx
- **역할**: 새싹 충전소 (패키지 선택, PortOne 결제, 잔액 충전)
- **사용처**: `/sprout-charging` 라우트
- **타입**: Page Component
- **주요 기능**:
  - 새싹 충전 패키지 목록 표시 (sprout_packages 테이블)
  - PortOne v1 결제 연동 (`m_redirect_url` 모바일 리다이렉트 지원)
  - 잔액 충전 처리 (sprout-charge Edge Function)
  - 새싹 잔액 표시
  - `redirectPayment` prop으로 모바일 결제 복귀 시 자동 처리
- **파일 경로**: `/components/SproutChargingStation.tsx`
- **관련 훅**: `useSproutBalance` (`/hooks/useSproutBalance.ts`) - 사용자 새싹 잔액 조회
- **추가 날짜**: 2026-02-26
- **최근 업데이트**: 2026-03-03 - 모바일 결제 `m_redirect_url` + 리다이렉트 처리 추가

### WelcomeCouponPage.tsx
- **역할**: 가입 축하 쿠폰 안내 페이지
- **사용처**: 신규 가입 플로우
- **타입**: Page Component
- **주요 기능**:
  - 웰컴 쿠폰 발급 안내
  - Edge Function `/issue-welcome-coupon` 호출
- **파일 경로**: `/components/WelcomeCouponPage.tsx`
- **최근 업데이트**: 2026-01-16 - 캐릭터/타이틀 수직 중앙 정렬 (pb-[160px])

---

## 🆓 무료 콘텐츠 관련

### FreeBirthInfoInput.tsx
- **역할**: 무료 콘텐츠용 사주 정보 입력 페이지
- **사용처**: `/product/:id/birthinfo` 라우트 (무료 콘텐츠)
- **타입**: Page Component
- **주요 기능**: 
  - 로그아웃 사용자: localStorage 캐시 (휘발성)
  - 로그인 사용자: DB 저장 (영구)
  - 음력/양력 선택
  - 띠 자동 계산
- **파일 경로**: `/components/FreeBirthInfoInput.tsx`

### FreeSajuSelectPage.tsx
- **역할**: 무료 콘텐츠용 사주 선택 페이지
- **사용처**: `/product/:id/free-saju-select` 라우트
- **타입**: Page Component
- **주요 기능**:
  - 로그인 사용자의 저장된 사주 목록 조회
  - 대표 사주 우선 표시
  - **개발 모드**: localStorage에서 데이터 로드 (프론트 UI 테스트용)
- **파일 경로**: `/components/FreeSajuSelectPage.tsx`
- **최근 업데이트**: 2026-01-16 - SajuManagementPage와 동일한 UI로 스타일링 통일
  - 섹션 타이틀 font-semibold 적용
  - 섹션 타이틀-프로필 카드 간격 6px
  - 사주 목록 간격 1px로 조정 (SajuManagementPage와 동일)

### FreeSajuSelectPageWrapper.tsx
- **역할**: FreeSajuSelectPage URL 파라미터 래퍼
- **사용처**: 라우팅 계층
- **타입**: Wrapper Component
- **주요 기능**: URL 파라미터 전달 및 상태 관리
- **파일 경로**: `/components/FreeSajuSelectPageWrapper.tsx`

### FreeSajuDetail.tsx
- **역할**: 무료 콘텐츠용 사주 상세 정보 페이지
- **사용처**: 무료 콘텐츠 플로우
- **타입**: Page Component
- **주요 기능**: 
  - 선택한 사주 정보 확인
  - AI 운세 생성 시작
- **파일 경로**: `/components/FreeSajuDetail.tsx`

### FreeContentDetail.tsx
- **역할**: 무료 콘텐츠 상세 페이지 (메인 로직)
- **사용처**: `/master/content/detail/:id` 라우트 (무료 콘텐츠)
- **타입**: Page Component
- **주요 기능**:
  - AI 운세 생성 요청 (Edge Function `/generate-free-preview`)
  - localStorage 캐시 관리
  - 결과 표시
- **비즈니스 로직**: `FreeContentService` 싱글톤 클래스 사용
- **파일 경로**: `/components/FreeContentDetail.tsx`
- **최근 업데이트**: 2026-01-16 - 광고 배너 하단 250px 여백 추가 (inline style)

### FreeContentDetailComponents.tsx
- **역할**: 무료 콘텐츠 상세 UI 컴포넌트 모음
- **사용처**: FreeContentDetail.tsx
- **타입**: Component Library
- **주요 기능**: 재사용 가능한 UI 컴포넌트 집합
- **파일 경로**: `/components/FreeContentDetailComponents.tsx`

### FreeContentLoading.tsx
- **역할**: 무료 콘텐츠 AI 생성 로딩 페이지
- **사용처**: AI 운세 생성 중
- **타입**: Page Component
- **주요 기능**:
  - 진행률 표시
  - 생성 상태 안내
  - DAILY_LIMIT_REACHED 서버 응답 처리
- **파일 경로**: `/components/FreeContentLoading.tsx`

### LoginBottomSheet.tsx
- **역할**: 비회원 일일 제한 도달 시 로그인 유도 바텀시트
- **사용처**: FreeContentDetail.tsx
- **타입**: Modal Component (createPortal + AnimatePresence)
- **주요 기능**:
  - 잠금 아이콘 + "로그인하면 무제한 이용 가능" 메시지
  - "로그인 하기" 버튼 → `/login/new` 이동
  - 드래그 닫기 (80px threshold)
  - body scroll lock + theme-color 딤 처리
- **파일 경로**: `/components/LoginBottomSheet.tsx`
- **추가 날짜**: 2026-02-06

### CardContent.tsx
- **역할**: 무료 콘텐츠 카드 가로 스크롤 리스트
- **사용처**: HomePage (무료 체험판 섹션)
- **타입**: Presentational Component
- **주요 기능**:
  - 무료 콘텐츠 6개 기본 노출
  - 페이지네이션 (더보기 클릭 시 6개씩 추가 로드)
  - weekly_clicks 기준 인기순 정렬
  - 로딩 스켈레톤 UI
- **파일 경로**: `/components/CardContent.tsx`
- **최근 업데이트**: 2026-01-30 - 4개→6개 노출, 페이지네이션 추가, 태그 색상 변경

### GlobalAIMonitor.tsx
- **역할**: AI 생성 상태 전역 모니터링 컴포넌트
- **사용처**: App.tsx 전역
- **타입**: Global Component
- **주요 기능**: 
  - AI 생성 상태 실시간 모니터링
  - 자동 리디렉션
- **파일 경로**: `/components/GlobalAIMonitor.tsx`

### ContentTags.tsx
- **역할**: 콘텐츠 태그 표시 (New, 심화/무료, 읽어봄)
- **사용처**: 홈 화면, 유료/무료 콘텐츠 상세 페이지
- **타입**: Presentational Component
- **파일 경로**: `/components/ContentTags.tsx`

---

## 📝 마스터 콘텐츠 관리

### MasterContentCreate.tsx
- **역할**: 마스터 콘텐츠 생성 페이지 (기본정보)
- **사용처**: `/master/content/create` 라우트
- **타입**: Page Component
- **주요 기능**: 
  - 제목, 설명, 카테고리 입력
  - 가격 설정 (원가, 할인가, 할인율)
  - 무료/유료 구분
- **파일 경로**: `/components/MasterContentCreate.tsx`

### MasterContentQuestions.tsx
- **역할**: 마스터 콘텐츠 질문지 작성 페이지
- **사용처**: `/master/content/create/questions` 라우트
- **타입**: Page Component
- **주요 기능**: 
  - AI 프롬프트용 질문지 작성
  - 질문 개수 설정 (기본 10개)
- **파일 경로**: `/components/MasterContentQuestions.tsx`

### MasterContentDetail.tsx
- **역할**: 마스터 콘텐츠 상세/수정 페이지 (관리자용)
- **사용처**: 마스터 콘텐츠 관리
- **타입**: Page Component
- **주요 기능**:
  - 생성된 콘텐츠 조회
  - 콘텐츠 수정
  - **이미지 캐시 버스팅**: `imageCacheBuster` state로 썸네일 URL에 `?v=${timestamp}` 추가
  - **질문 변경 감지**: `originalQuestions` state로 질문 변경 여부 체크, 변경 없으면 DELETE 스킵 (FK constraint 방지)
- **파일 경로**: `/components/MasterContentDetail.tsx`
- **최근 업데이트**: 2026-01-14 - 질문 변경 감지 로직 추가 (FK constraint 에러 방지)

### MasterContentDetailPage.tsx
- **역할**: 마스터 콘텐츠 사용자용 상세 페이지
- **사용처**: `/master/content/detail/:id` 라우트
- **타입**: Page Component
- **주요 기능**:
  - 사용자에게 보여지는 콘텐츠 상세 페이지
  - 타로 카드 선택 UI 포함 (타로 콘텐츠)
  - **개발 환경 분리**: `IS_DEV_MODE` 플래그로 개발 전용 기능 제어
  - **스크롤 탭바 애니메이션**: 스크롤 다운 시 탭바 숨김, 스크롤 업 시 표시 (Framer Motion `height: 0 ↔ auto`)
  - **운세 구성 / 이용안내 / 환불 정책**: 아코디언 UI (AnimatePresence)
- **파일 경로**: `/components/MasterContentDetailPage.tsx`
- **최근 업데이트**: 2026-03-04 - 스크롤 탭바 애니메이션, UI 스타일링 개선

### MasterContentList.tsx
- **역할**: 마스터 콘텐츠 목록 관리 페이지
- **사용처**: `/master/content/list` 라우트
- **타입**: Page Component
- **주요 기능**:
  - 생성한 콘텐츠 목록 조회
  - 콘텐츠 관리 (수정, 삭제, 배포 상태 변경)
  - 엑셀 업로드 지원
  - **실시간 이미지 캐시 버스팅**: INSERT/UPDATE/폴링 시 타임스탬프 파라미터 추가
- **파일 경로**: `/components/MasterContentList.tsx`
- **최근 업데이트**: 2026-01-13 - 실시간 썸네일 업데이트 캐시 버스팅 추가

### ~~MasterContentLoadingPage.tsx~~ (삭제됨)
- **상태**: 파일 삭제됨 (AI 썸네일 생성 로딩 기능이 다른 컴포넌트로 통합)

---

## 📊 통계 관리 (1개)

### StatsDashboard.tsx
- **역할**: Master 계정 전용 통계 대시보드
- **사용처**: `/master/stats` 라우트
- **타입**: Page Component
- **주요 기능**:
  - **GA 전체 고객 통계**: Google Analytics 4 API 연동 (get-ga-stats Edge Function)
    - 전체 사용자수, 신규 사용자, 재방문 고객, 재방문율
  - **회원가입 고객 통계**: Supabase 직접 조회
    - 신규/재방문 고객, 회원가입율
    - 무료/유료 콘텐츠 이용율
    - 회원 태그 저장율
    - 태그 확인율 (콘텐츠 건 기준, source_type별)
  - **기간 필터**: 오늘, 7일, 30일, 90일, 전체 기간 (GA 기준 오늘 제외)
  - **스크롤**: `flex-1 overflow-y-auto overscroll-contain` 패턴 적용
- **파일 경로**: `/components/StatsDashboard.tsx`
- **관련 서비스**: `/lib/statsService.ts` (통계 조회 로직)
- **최근 업데이트**: 2026-02-02 - GA 통합, 태그 확인율 콘텐츠 건 기준 변경

---

## 👤 사주 정보 관리

### BirthInfoInput.tsx
- **역할**: 결제용 사주 정보 입력 페이지
- **사용처**: `/product/:id/birthinfo` 라우트 (유료 콘텐츠)
- **타입**: Page Component
- **주요 기능**:
  - 유료 콘텐츠 결제 후 사주 정보 입력
  - DB 저장 (orders.saju_record_id 연결)
  - 음력/양력, 띠 자동 계산
  - **사주 API 직접 호출**: `fetchSajuData()` 후 Edge Function에 전달
- **파일 경로**: `/components/BirthInfoInput.tsx`
- **최근 업데이트**: 2026-01-13 - 사주 API 프론트엔드 직접 호출 방식으로 변경

### SajuInputPage.tsx
- **역할**: 프로필용 내 사주 정보 입력 페이지
- **사용처**: `/profile/saju/input` 라우트
- **타입**: Page Component
- **주요 기능**: 
  - 프로필에서 본인 사주 정보 등록
  - DB 저장 (saju_records 테이블)
  - 대표 사주 자동 설정
- **파일 경로**: `/components/SajuInputPage.tsx`

### SajuAddPage.tsx
- **역할**: 관계 사주 추가 페이지 (연인/가족 등)
- **사용처**: `/profile/saju/add` 라우트
- **타입**: Page Component
- **주요 기능**: 
  - 타인의 사주 정보 추가
  - 관계 설정 (배우자, 자녀, 부모 등)
- **파일 경로**: `/components/SajuAddPage.tsx`

### SajuSelectPage.tsx
- **역할**: 결제용 사주 선택 페이지
- **사용처**: `/product/:id/saju-select` 라우트
- **타입**: Page Component
- **주요 기능**:
  - 유료 콘텐츠 결제 후 사주 선택
  - DB 조회 (saju_records)
  - 대표 사주 우선 표시
  - 전화번호 미등록 시 AlimtalkInfoInputPage 리다이렉트 (이동 전 `primary_saju` 캐시 설정)
  - **사주 API 직접 호출**: 선택 후 `fetchSajuData()` 실행 후 Edge Function에 전달
  - **개발 모드**: localStorage에서 데이터 로드
- **파일 경로**: `/components/SajuSelectPage.tsx`
- **최근 업데이트**: 2026-03-03 - 전화번호 리다이렉트 전 `primary_saju` 캐시 설정 추가

### SajuManagementPage.tsx
- **역할**: 사주 정보 관리 메인 페이지
- **사용처**: `/profile/saju` 라우트
- **타입**: Page Component
- **주요 기능**:
  - 저장된 사주 목록 조회
  - 사주 수정/삭제
  - 대표 사주 설정
  - Kebab 메뉴 UI
- **파일 경로**: `/components/SajuManagementPage.tsx`
- **최근 업데이트**: 2026-01-19 - 구분자 렌더링 방식 변경
  - SVG → CSS div로 전환 (모바일 렌더링 일관성 확보)
  - 높이 h-[6px], borderRadius 0.5px 적용
  - 섹션 타이틀 font-semibold, 프로필 이름 font-medium
  - 닉네임-생년월일 간격 축소 (-mb-[8px], -mt-[4px])
  - Info Container 하단 마진 8px (이미지 정렬)
  - 섹션 타이틀-프로필 카드 간격 6px
  - 함께 보는 사주 리스트 간격 1px

### SajuDetail.tsx
- **역할**: 사주 상세 정보 조회 페이지
- **사용처**: 사주 정보 상세 보기
- **타입**: Page Component
- **주요 기능**: 
  - 사주 정보 상세 조회
  - 수정 기능
- **파일 경로**: `/components/SajuDetail.tsx`

### ~~SajuResultPage.tsx~~ (백업됨)
- **상태**: `_backup/`으로 이동 (UnifiedResultPage로 대체됨)

### SajuKebabMenu.tsx
- **역할**: 사주 관리 케밥 메뉴 드롭다운
- **사용처**: SajuManagementPage
- **타입**: UI Component
- **주요 기능**: 
  - 수정 메뉴
  - 삭제 메뉴
  - 대표사주 설정 메뉴
- **파일 경로**: `/components/SajuKebabMenu.tsx`

### PrimarySajuChangeDialog.tsx
- **역할**: 대표 사주 변경 확인 다이얼로그
- **사용처**: SajuManagementPage
- **타입**: Modal Component
- **주요 기능**:
  - 대표 사주 변경 확인
  - Database Trigger로 다른 사주 자동 업데이트
- **파일 경로**: `/components/PrimarySajuChangeDialog.tsx`

### SajuCard.tsx
- **역할**: 사주 정보 카드 공통 컴포넌트
- **사용처**: FreeSajuSelectPage, SajuSelectPage, SajuManagementPage
- **타입**: Presentational Component
- **주요 기능**:
  - 프로필 이미지 (띠 동물)
  - 이름, 생년월일 표시
  - 띠|별자리|성별 정보 표시 (구분자: CSS div)
  - 라디오 버튼 선택 UI
  - 케밥 메뉴 버튼 (옵션)
- **파일 경로**: `/components/SajuCard.tsx`
- **추가 날짜**: 2026-01-07
- **최근 업데이트**: 2026-01-19 - 구분자 렌더링 방식 변경
  - SVG → CSS div로 전환 (모바일 렌더링 일관성 확보)
  - 높이 h-[6px], borderRadius 0.5px 적용
  - 프로필 이름 font-medium 적용
  - 닉네임-생년월일 간격 축소 (-mb-[8px], -mt-[4px])
  - Info Container 하단 마진 8px (프로필 이미지와 정렬)
  - 프로필 이미지 위치 조정 (-ml-[11px] pl-[1px] mr-[-3px])

---

## 🎴 타로 콘텐츠 (4개)

### TarotShufflePage.tsx
- **역할**: 타로 셔플 페이지 (라우트 컴포넌트)
- **사용처**: `/tarot/shuffle` 라우트
- **타입**: Page Component
- **주요 기능**:
  - TarotGame 컴포넌트 호스팅
  - 세션 체크 및 리다이렉트
  - order_results에서 질문 텍스트 로드
  - 뒤로가기 핸들링 (구매내역 또는 홈으로)
- **기술**: React Router, Supabase Auth
- **파일 경로**: `/components/TarotShufflePage.tsx`

### TarotGame.tsx
- **역할**: 타로 카드 섞기 + 선택 통합 컴포넌트
- **사용처**: TarotShufflePage, TestTarotPage 내부
- **타입**: Feature Component
- **주요 기능**:
  - 카드 섞기 애니메이션 (21장 카드 부채꼴 배열)
  - 카드 선택 UI (1장 선택)
  - 카드 뒤집기 애니메이션
  - 반응형 스케일링 (440px 기준)
  - **배경 이미지 처리**: `/public/tarot-shuffle-background.jpg` (CSP 대응)
  - **모바일 최적화**:
    - iOS Safari/Chrome 주소창 아래까지 배경 표시
    - body 배경 동적 설정 (모바일: 배경 이미지, 데스크톱: 흰색)
    - Safari 테마 색상 동적 변경 (`#267973`)
    - 스크롤 차단 (`position: fixed`)
  - **이미지 프리로딩**: sessionStorage 캐시 활용
- **기술**: Framer Motion 애니메이션
- **파일 경로**: `/components/TarotGame.tsx`
- **최근 업데이트**: 2026-01-21 - 배경 이미지 CSP 수정, 모바일 전체 화면 배경 대응

### ~~TarotResultPage.tsx~~ (백업됨)
- **상태**: `_backup/`으로 이동 (UnifiedResultPage로 대체됨)

### UnifiedResultPage.tsx
- **역할**: 사주/타로 통합 결과 페이지
- **사용처**: `/result` 라우트
- **타입**: Page Component
- **주요 기능**:
  - 사주/타로 결과 통합 표시 (SajuResultPage + TarotResultPage 통합)
  - 타로 카드 이미지 + AI 해석 표시
  - 목차 바텀시트 (TableOfContentsBottomSheet)
  - 나다움 기록하기 (CheckRecordMe) 연동
  - 계정 불일치 감지 (알림톡 링크 접속 시)
- **파일 경로**: `/components/UnifiedResultPage.tsx`

### TestTarotPage.tsx
- **역할**: 테스트용 타로 셔플 페이지 (로그인 불필요)
- **사용처**: `/test/tarot` 라우트
- **타입**: Page Component
- **주요 기능**:
  - TarotGame 컴포넌트 호스팅
  - 로그인/세션 체크 없이 바로 접근 가능
  - iOS Safari viewport 높이 처리
  - 상단 네비게이션 고정
- **용도**: 개발/테스트 환경에서 타로 UI 확인용
- **파일 경로**: `/pages/TestTarotPage.tsx`
- **추가일**: 2026-01-21

### 레거시 (백업됨)
- `TarotFlowPage.tsx` → `_backup/` (미사용)
- `TarotCardSelection.tsx` → `_backup/` (미사용)
- `TarotDemo.tsx` → `_backup/` (TarotFlowPage 의존으로 미사용)

---

## 🏷️ 나다움 태그 (3개)

### NadaumTags.tsx
- **역할**: 나다움 태그 빈 상태 페이지
- **사용처**: 프로필 → 나다움 태그 (태그 없을 때)
- **타입**: Page Component
- **주요 기능**:
  - 빈 상태 안내 (EmptyContentSection)
  - "태그 쌓기 좋은 운세" 추천 섹션 (가로 스크롤)
  - 상단 네비게이션 (뒤로가기, 홈)
- **파일 경로**: `/components/NadaumTags.tsx`
- **추가일**: 2026-01-29

### NadaumTagsList.tsx
- **역할**: 나다움 태그 목록 페이지 (메인)
- **사용처**: `/profile/nadaum-tags` 라우트
- **타입**: Page Component
- **주요 기능**:
  - "오늘의 한 줄 위로" 랜덤 문구 (92개 중 1개)
  - 태그 탭 전환 (강한 모습/섬세한 모습)
  - 태그 삭제/복원 (Optimistic UI + Toast 2.2초)
  - 캐싱 시스템 (localStorage, 5분 만료)
  - 동기적 캐시 초기화 (로딩 플래시 방지)
- **파일 경로**: `/components/NadaumTagsList.tsx`
- **추가일**: 2026-01-29
- **관련 데이터**: `src/data/comfortQuotes.ts` (92개 위로 문구)

### comfortQuotes.ts (데이터)
- **역할**: "오늘의 한 줄 위로" 92개 문구 상수 배열
- **사용처**: NadaumTagsList.tsx
- **타입**: Data Constant
- **주요 기능**:
  - 로딩 0ms (번들 포함)
  - `as const` 타입 안전성
- **파일 경로**: `/data/comfortQuotes.ts`
- **추가일**: 2026-01-29

---

## 📊 주간 보고서 (11개)

### MyReportList.tsx
- **역할**: 주간 보고서 목록 페이지 + UI (병합됨)
- **사용처**: `/my-report-list` 라우트
- **타입**: Page Component
- **주요 기능**:
  - 이번 주 태그 수 요약 (WeeklyTagSummary)
  - 월별 보고서 목록 (MonthlySection 아코디언)
  - 주차별 카드 (ReportCard)
  - 응원글 표시 및 수정 링크
  - 캐싱 시스템 (localStorage, 5분 만료)
  - 동기적 캐시 초기화 (로딩 플래시 방지)
  - 관리자 패널: 실패 보고서 조회/재발송 (selfContinue fire-and-forget)
  - **iOS 스와이프 대응**: 홈 이동 시 `navigate('/', { replace: true })` 사용 (3곳)
  - **보고서 생성 상태 영속화**: sessionStorage (5분 만료) + 10초 폴링
  - **현재 주차 보고서 감지**: DB 조회로 "이번 주 보고서가 도착했어요" 안내
  - **바텀시트 애니메이션**: framer-motion spring + drag-to-dismiss (createPortal)
- **파일 경로**: `/components/MyReportList.tsx`
- **추가일**: 2026-01-29
- **최근 업데이트**: 2026-02-24 - 생성 상태 sessionStorage 영속화, 폴링, 현재 주차 감지, 바텀시트 애니메이션

### ReportWeeklyDetail.tsx
- **역할**: 주간 운세 요약 페이지
- **사용처**: `/report-weekly-detail/:id` 라우트
- **타입**: Page Component
- **주요 기능**:
  - 운세 요약 카드 (AI 생성)
  - 이전/다음 네비게이션
  - 타로 뽑기 여부에 따른 다음 페이지 분기
- **파일 경로**: `/components/ReportWeeklyDetail.tsx`
- **추가일**: 2026-01-29

### ReportWeeklyTarot.tsx
- **역할**: 타로 카드 셔플 & 뽑기 페이지
- **사용처**: `/report-weekly-tarot/:id` 라우트
- **타입**: Page Component
- **주요 기능**:
  - TarotGame 컴포넌트 사용 (slotCount: 3)
  - 3장 카드 선택 후 결과 페이지로 이동
  - 보고서당 1회만 뽑기 가능
- **파일 경로**: `/components/ReportWeeklyTarot.tsx`
- **추가일**: 2026-01-29

### ReportWeeklyTarotResult.tsx
- **역할**: 타로 카드 해석 결과 페이지
- **사용처**: `/report-weekly-tarot-result/:id` 라우트
- **타입**: Page Component
- **주요 기능**:
  - 선택된 3장 카드 표시
  - 카드별 AI 해석 (flip 애니메이션)
  - user_viewed = true로 업데이트
- **파일 경로**: `/components/ReportWeeklyTarotResult.tsx`
- **추가일**: 2026-01-29

### ReportWeeklyMindCare.tsx
- **역할**: 마음 처방 페이지
- **사용처**: `/report-weekly-mind-care/:id` 라우트
- **타입**: Page Component
- **주요 기능**:
  - 마음 처방 카드 (AI 생성)
  - 다음 주 목표 리스트 (GoalsSection)
  - Framer Motion 애니메이션
- **파일 경로**: `/components/ReportWeeklyMindCare.tsx`
- **추가일**: 2026-01-29

### ReportWeeklyMemo.tsx
- **역할**: 나 응원하기 페이지 (작성/보기)
- **사용처**: `/report-weekly-memo/:id` 라우트
- **타입**: Page Component
- **주요 기능**:
  - write 모드: 응원글 작성 (최초)
  - view 모드: 응원글 보기 (다시보기)
  - 저장 시 my_report_cache 무효화
  - 120자 제한
- **파일 경로**: `/components/ReportWeeklyMemo.tsx`
- **추가일**: 2026-01-29

### ReportWeeklyMemoEdit.tsx
- **역할**: 응원글 수정 페이지 (보고서 보기 화면에서)
- **사용처**: 보고서 보기 화면에서 응원글 수정
- **타입**: Page Component
- **주요 기능**:
  - 기존 응원글 수정
  - 인라인 버튼 (108px × 38px, 텍스트 에어리어 밑에 배치)
  - 타이틀: "수정하기"
  - "나에게 쓰는 한마디" 헤더만 표시
  - X 버튼 없음
- **파일 경로**: `/components/ReportWeeklyMemoEdit.tsx`
- **추가일**: 2026-01-29
- **최근 업데이트**: 2026-02-10 - UI 개선 (InlineButtons, 서브타이틀 제거, X 버튼 제거)

### ReportWeeklyMemoQuickEdit.tsx
- **역할**: 응원글 빠른 수정 페이지 (보고서 리스트에서)
- **사용처**: `/report-weekly/:id/cheer-edit` 라우트 (보고서 리스트에서 연필 아이콘 클릭)
- **타입**: Page Component
- **주요 기능**:
  - 보고서 리스트에서 이번 주 응원글 빠른 수정
  - 인라인 버튼 (108px × 38px, 텍스트 에어리어 밑에 배치)
  - 타이틀: "수정하기"
  - "나에게 쓰는 한마디" 헤더만 표시 (서브타이틀 없음)
  - X 버튼 없음
  - 저장 시 캐시 무효화 (my_report_cache_v3)
  - 120자 제한
- **파일 경로**: `/components/ReportWeeklyMemoQuickEdit.tsx`
- **추가일**: 2026-02-10

### ~~CompletionCoupon.tsx~~ (삭제됨)
- **상태**: 파일 삭제됨 (2026-03-05, 새싹 리워드로 대체)
- **대체**: `grant-mission-sprout` Edge Function + `CheckRecordMe.tsx` 내 새싹 리워드 로직

### MyReportEmpty.tsx
- **역할**: 보고서 없을 때 초기 빈 상태 화면
- **사용처**: MyReportList (보고서 0개일 때)
- **타입**: Presentational Component
- **파일 경로**: `/components/MyReportEmpty.tsx`

### WeeklyReportLoading.tsx
- **역할**: 주간 보고서 전체 화면 로딩 페이지
- **사용처**: 보고서 다시보기 / 알림톡 링크 진입 시
- **타입**: Page Component
- **주요 기능**: FreeContentLoading.tsx 스타일과 동일한 전체 화면 로딩
- **파일 경로**: `/components/WeeklyReportLoading.tsx`

### ReceiveMyAnalysis.tsx
- **역할**: "나의 분석 받기" 카드 스와이프 컴포넌트
- **사용처**: 프로필 또는 보고서 관련 페이지
- **타입**: Interactive Component
- **주요 기능**: Framer Motion 드래그 인터랙션
- **파일 경로**: `/components/ReceiveMyAnalysis.tsx`

---

## 👥 프로필 및 구매 내역

### ProfilePage.tsx
- **역할**: 프로필 페이지 (통합 버전)
- **사용처**: `/profile` 라우트
- **타입**: Page Component
- **주요 기능**:
  - 사용자 프로필 정보
  - 사주 정보 관리 링크
  - 구매 내역 링크
  - 로그아웃
  - **Footer 레이아웃**:
    - min-height wrapper로 Footer가 항상 하단에 위치
    - 로그아웃과 Footer 사이 최소 130px 간격 유지
    - 콘텐츠가 짧으면 spacer가 늘어나서 Footer를 하단에 고정
    - Footer 아래 빈 공간 없음 (스크롤 영역 내 Footer 배치)
- **파일 경로**: `/components/ProfilePage.tsx`
- **최근 업데이트**: 2026-03-03 - `hasValidCache` 강화: `primary_saju` 실제 존재 시에만 API 스킵 (`saju_cache_checked` 플래그만으로 불가)

### PurchaseHistoryPage.tsx
- **역할**: 운세 기록 조회 페이지 (유료 + 무료)
- **사용처**: `/purchase-history` 라우트
- **타입**: Page Component
- **주요 기능**:
  - 심화 해석판 탭: 유료 콘텐츠 구매 내역 (orders 테이블)
  - 무료 체험판 탭: 무료 콘텐츠 이용 기록 (free_content_records 테이블)
  - 주문 상세 정보
- **파일 경로**: `/components/PurchaseHistoryPage.tsx`
- **최근 업데이트**: 2026-01-28 - 무료 체험판 탭 추가, 퍼블리싱 수정 (탭-아이콘 간격 48px, 카드 간격 10px inline style)

### PurchaseFailure.tsx
- **역할**: 결제 실패 페이지
- **사용처**: 결제 실패 시
- **타입**: Page Component
- **주요 기능**: 
  - 결제 실패 안내
  - 재시도 안내
- **파일 경로**: `/components/PurchaseFailure.tsx`

---

## 🛠️ 유틸리티 컴포넌트

### FileUploadDialog.tsx
- **역할**: 파일 업로드 다이얼로그
- **사용처**: MasterContentList
- **타입**: Modal Component
- **주요 기능**: 
  - 이미지/파일 업로드 UI
  - 엑셀 파일 업로드 지원
- **파일 경로**: `/components/FileUploadDialog.tsx`

### TableOfContentsBottomSheet.tsx
- **역할**: 목차 바텀시트 (콘텐츠 내비게이션)
- **사용처**: 콘텐츠 상세 페이지 (SajuResultPage)
- **타입**: Modal Component
- **주요 기능**:
  - 긴 콘텐츠의 목차 네비게이션
  - 질문별 스크롤 이동
  - **버그 수정**: 하드코딩 더미 데이터 제거 (2025-12-31)
- **파일 경로**: `/components/TableOfContentsBottomSheet.tsx`

### CheckRecordMe.tsx
- **역할**: 나다움 태그 기록하기 페이지
- **사용처**: 무료/유료 콘텐츠 결과 후 나다움 기록
- **타입**: Page Component
- **주요 기능**:
  - GPT-5-nano가 추출한 태그 표시 (장점 2개, 단점 1개)
  - 사용자 태그 선택 UI
  - 전화번호 입력 바텀시트 (미등록 시)
  - `user_trait_tags` 테이블에 직접 INSERT하여 DB 저장
  - 미선택 태그를 `users.rejected_tags`에 누적 저장 (다음 추출 시 제외)
  - TagCouponBottomSheet 연동 (태그 5개 모으기 프로모션)
- **Props**:
  - `contentId?: string` - 콘텐츠 ID
  - `orderId?: string` - 주문 ID (유료 콘텐츠용)
  - `tags?: { name: string; type: 'positive' | 'negative' | 'neutral' }[]` - 추출된 태그
  - `sourceType?: 'free_content' | 'paid_content'` - 출처 유형
  - `onBack?: () => void` - 뒤로가기 콜백
  - `onHome?: () => void` - 홈으로 이동 콜백
  - `onSkip?: () => void` - 건너뛰기 콜백
  - `onComplete?: () => void` - 저장 완료 콜백
- **파일 경로**: `/components/CheckRecordMe.tsx`
- **최근 업데이트**: 2026-02-09 - rejected_tags 저장 로직 추가, TagCouponBottomSheet 연동

### TagCouponBottomSheet.tsx
- **역할**: 태그 쿠폰 안내 바텀시트
- **사용처**: CheckRecordMe.tsx
- **타입**: Modal Component
- **주요 기능**:
  - 프로모션 모드: 태그 5개 모으면 무료 이용권 지급 안내
  - 태그 모으기 유도 모드: 남은 태그 수 안내 (remainingTags prop)
  - Framer Motion 애니메이션
- **Props**:
  - `isOpen: boolean` - 바텀시트 열림 상태
  - `onClose: () => void` - 닫기 콜백
  - `onOverlayClick?: () => void` - 외부 클릭 콜백
  - `onSelectTag: () => void` - 태그 선택하기 버튼 콜백
  - `remainingTags?: number` - 남은 태그 수 (1~4)
- **파일 경로**: `/components/TagCouponBottomSheet.tsx`
- **추가일**: 2026-02-09


---

## 📄 약관 페이지

### TermsPage.tsx
- **역할**: 통합 약관 동의 페이지
- **사용처**: `/terms` 라우트
- **타입**: Page Component
- **주요 기능**: 
  - 이용약관 동의
  - 개인정보처리방침 동의
  - 마케팅 수신 동의 (선택)
- **파일 경로**: `/components/TermsPage.tsx`

### TermsOfServicePage.tsx
- **역할**: 이용약관 상세 페이지
- **사용처**: `/terms-of-service` 라우트
- **타입**: Page Component
- **주요 기능**: 이용약관 전체 내용 표시
- **파일 경로**: `/components/TermsOfServicePage.tsx`

### PrivacyPolicyPage.tsx
- **역할**: 개인정보처리방침 상세 페이지
- **사용처**: `/privacy-policy` 라우트
- **타입**: Page Component
- **주요 기능**: 개인정보처리방침 전체 내용 표시
- **파일 경로**: `/components/PrivacyPolicyPage.tsx`

---

## 🚨 에러 처리

### ErrorPage.tsx
- **역할**: 공통 에러 페이지
- **사용처**: 404, 500, 503 등 모든 에러 상황
- **타입**: Page Component
- **주요 기능**: 
  - 에러 타입별 다른 UI 표시
  - 404 (페이지 없음)
  - 500 (서버 오류)
  - 503 (서비스 과부하)
  - 인터넷 연결 끊김
  - **개발 환경**: DEV 모드 표시
- **파일 경로**: `/components/ErrorPage.tsx`

### ErrorBoundary.tsx
- **역할**: React 에러 바운더리
- **사용처**: App.tsx 전역
- **타입**: Error Boundary Component
- **주요 기능**:
  - React 컴포넌트 에러 catch
  - 에러 발생 시 ErrorPage 표시
  - 에러 정보 로깅
  - **Sentry 연동**: `captureException`으로 에러 자동 전송 (2026-01-07)
- **파일 경로**: `/components/ErrorBoundary.tsx`
- **최근 업데이트**: 2026-01-07 - Sentry 에러 모니터링 연동

---

## 공유 리워드 (2개)

### ShareRewardModal.tsx
- **역할**: 공유 리워드 바텀시트 모달
- **사용처**: MasterContentDetailPage (유료 상세)
- **타입**: Drawer (vaul)
- **주요 기능**:
  - 로그인 유저: 카카오 공유 + 링크 복사 + 리워드 진행 상황
  - 비로그인 유저: 로그인 유도 CTA
- **파일 경로**: `/components/ShareRewardModal.tsx`

### ShareRewardInfoPage.tsx
- **역할**: 공유 리워드 안내 페이지
- **사용처**: ShareRewardModal "자세히 보기" 링크
- **타입**: Page Component
- **주요 기능**:
  - 3단계 참여 방법 안내
  - 피보나치 회차별 리워드 테이블
  - 유의사항 안내
- **파일 경로**: `/components/ShareRewardInfoPage.tsx`
- **라우트**: `/share-reward-info`

---

## 홈 고도화 (16개)

> Figma Make 퍼블리싱 코드 이관 (2026-03-04) → DB 연동 완료 (2026-03-05).

### 페이지 (11개)

1. **HomeScreenNew.tsx** (/)
   - **역할**: 홈 화면 (기존 HomePage.tsx 교체)
   - 무료 상담 카드, NEW 무료 운세 스와이프, BEST 운세 탭+스와이프, 검색 바, 푸터
   - **파일 경로**: `/pages/HomeScreenNew.tsx`

2. **FortuneAllPage.tsx** (/best-fortune)
   - **역할**: BEST 운세 전체보기 (탭, 심화/무료 체크박스 필터, 정렬, FeaturedCard+RowCard)
   - **주요 상태**: `filterPaid` (심화), `filterFree` (무료) — 미선택 시 전체 표시
   - **파일 경로**: `/pages/FortuneAllPage.tsx`

3. **NewFreeFortuneAllPage.tsx** (/new-free)
   - **역할**: NEW 무료 운세 전체보기
   - **파일 경로**: `/pages/NewFreeFortuneAllPage.tsx`

4. **SearchPage.tsx** (/search)
   - **역할**: 운세 퍼지 검색 (fuse.js)
   - **파일 경로**: `/pages/SearchPage.tsx`

5. **SajuConsultPage.tsx** (/saju-consult)
   - **역할**: 사주 상담 입력 (TextareaInput, 이탈 확인 모달)
   - **파일 경로**: `/pages/SajuConsultPage.tsx`

6. **SajuConsultLoadingPage.tsx** (/saju-consult/loading)
   - **역할**: 사주 상담 로딩 (Lottie 애니메이션, 1.8초 자동 이동)
   - **파일 경로**: `/pages/SajuConsultLoadingPage.tsx`

7. **SajuConsultResultPage.tsx** (/saju-consult/result)
   - **역할**: 사주 상담 결과 (섹션별 stagger 애니메이션)
   - **파일 경로**: `/pages/SajuConsultResultPage.tsx`

8. **SajuRecommendedFortunePage.tsx** (/saju-consult/result/recommended)
   - **역할**: 이어서 보기 좋은 운세 목록
   - **파일 경로**: `/pages/SajuRecommendedFortunePage.tsx`

9. **TaroConsultPage.tsx** (/taro-consult)
   - **역할**: 타로 상담 입력
   - **파일 경로**: `/pages/TaroConsultPage.tsx`

10. **TaroConsultLoadingPage.tsx** (/taro-consult/loading)
    - **역할**: 타로 상담 로딩
    - **파일 경로**: `/pages/TaroConsultLoadingPage.tsx`

11. **TaroConsultResultPage.tsx** (/taro-consult/result)
    - **역할**: 타로 상담 결과 (3D 카드 플립, 글로우, 플라잉 카드 오버레이)
    - **파일 경로**: `/pages/TaroConsultResultPage.tsx`

### 공유 컴포넌트 (3개)

12. **TextareaInput.tsx**
    - **역할**: 상담 입력 텍스트 영역 (autoFocus, 글자 수 카운터)
    - **파일 경로**: `/components/TextareaInput.tsx`

13. **RecommendedCarousel.tsx**
    - **역할**: 결과 페이지 추천 캐러셀 (가로 스크롤)
    - **파일 경로**: `/components/RecommendedCarousel.tsx`

14. **Divider-13-1579.tsx**
    - **역할**: 섹션 구분선
    - **파일 경로**: `/imports/Divider-13-1579.tsx`

### 유틸리티 (2개)

15. **consultStatus.ts**
    - **역할**: 상담 상태 localStorage 관리 (idle/completed, 일별 초기화)
    - **파일 경로**: `/lib/consultStatus.ts`

16. **useScrollDirection.ts**
    - **역할**: 스크롤 방향 감지 훅 (RAF 기반, 히스테리시스)
    - **파일 경로**: `/hooks/useScrollDirection.ts`

---

## 🔮 사주/타로 상담 체험 (13개)

> 비회원/회원 대상 사주·타로 AI 상담 체험 기능 (2026-03-05 추가).

### 페이지 (7개)

1. **SajuConsultPage.tsx** (/saju-consult)
   - **역할**: 사주 상담 질문 입력
   - **파일 경로**: `/pages/SajuConsultPage.tsx`

2. **SajuConsultLoadingPage.tsx** (/saju-consult/loading)
   - **역할**: 사주 상담 로딩 (Lottie 애니메이션)
   - **파일 경로**: `/pages/SajuConsultLoadingPage.tsx`

3. **SajuConsultResultPage.tsx** (/saju-consult/result)
   - **역할**: 사주 상담 결과 (6개 섹션)
   - **파일 경로**: `/pages/SajuConsultResultPage.tsx`

4. **SajuRecommendedFortunePage.tsx** (/saju-consult/result/recommended)
   - **역할**: 추천 운세 전체보기
   - **파일 경로**: `/pages/SajuRecommendedFortunePage.tsx`

5. **TaroConsultPage.tsx** (/taro-consult)
   - **역할**: 타로 상담 질문 입력
   - **파일 경로**: `/pages/TaroConsultPage.tsx`

6. **TaroConsultLoadingPage.tsx** (/taro-consult/loading)
   - **역할**: 타로 상담 로딩 (Lottie 애니메이션)
   - **파일 경로**: `/pages/TaroConsultLoadingPage.tsx`

7. **TaroConsultResultPage.tsx** (/taro-consult/result)
   - **역할**: 타로 상담 결과 (카드 플립 + 4개 섹션)
   - **파일 경로**: `/pages/TaroConsultResultPage.tsx`

### 공유 컴포넌트 (2개)

8. **RecommendedCarousel.tsx**
   - **역할**: 추천 콘텐츠 캐러셀 (가로 스크롤)
   - **파일 경로**: `/components/RecommendedCarousel.tsx`

9. **TextareaInput.tsx**
   - **역할**: 상담 입력 텍스트 영역
   - **파일 경로**: `/components/TextareaInput.tsx`

### 서비스 (3개)

10. **consultStatus.ts**
    - **역할**: 상담 상태 localStorage 관리
    - **파일 경로**: `/lib/consultStatus.ts`

11. **consultLimitService.ts**
    - **역할**: 비회원 상담 1회 제한
    - **파일 경로**: `/lib/consultLimitService.ts`

12. **consultRecommendationService.ts**
    - **역할**: AI 카테고리 기반 동적 추천 조회
    - **파일 경로**: `/lib/consultRecommendationService.ts`

### 훅 (1개)

13. **useScrollDirection.ts**
    - **역할**: 스크롤 방향 감지 (RAF 기반)
    - **파일 경로**: `/hooks/useScrollDirection.ts`

---

## 📊 통계

- **총 활성 컴포넌트**: 106개

### 카테고리별 분포
- UI 컴포넌트: 11개
- 인증 관련: 4개
- 결제 관련: 6개
- 무료 콘텐츠: 11개
- 마스터 콘텐츠 관리: 5개
- 통계 관리: 1개
- 사주 정보 관리: 9개
- 타로 콘텐츠: 4개
- 나다움 태그: 3개
- 주간 보고서: 11개
- 프로필 및 구매: 3개
- 유틸리티: 4개
- 약관: 3개
- 에러 처리: 2개
- 공유 리워드: 2개
- 홈 고도화: 16개
- 사주/타로 상담 체험: 13개

---

## 🎨 디자인 시스템

### Toast 시스템
- **UI 컴포넌트**: `/components/ui/Toast.tsx`
  - `type`: `positive | warning | negative | info`
  - `variant`: `dark` (기본) | `light`
  - dark variant: 배경 `rgba(0,0,0,0.40)` + `blur(24px)`, 패딩 `6px 11px 6px 8px`, 아이콘 23px
  - light variant: 배경 `rgba(245,243,239,0.95)`, 패딩 `12px 20px 12px 16px`, 아이콘 32px
  - 등장 애니메이션: `toast-animate-enter` (아래→위 slide + scale 0.82→1)
- **헬퍼 유틸**: `/lib/toast.tsx`
  - `toast.success / error / warning / info` — 커스텀 토스트 호출
  - `toast.setBottomOffset(ctaHeight)` — CTA 버튼 위에 토스트 배치 (CTA 높이 + 12px)
  - `toast.resetBottomOffset()` — 기본 위치(하단 20px)로 복원
  - CSS 변수 `--toast-bottom-offset` (`:root`)으로 동적 위치 제어
- **위치**: Sonner v2 기본 포지셔닝 사용, `bottom` 만 CSS 오버라이드

### shadcn/ui 컴포넌트 (52개)
위치: `/components/ui/`

- Radio.tsx
- Toast.tsx
- accordion.tsx
- alert-dialog.tsx
- alert.tsx
- aspect-ratio.tsx
- avatar.tsx
- badge.tsx
- breadcrumb.tsx
- button.tsx
- calendar.tsx
- card.tsx
- carousel.tsx
- chart.tsx
- checkbox.tsx
- collapsible.tsx
- command.tsx
- context-menu.tsx
- dialog.tsx
- drawer.tsx
- dropdown-menu.tsx
- FlowerPotIcon.tsx
- form.tsx
- hover-card.tsx
- input-otp.tsx
- input.tsx
- label.tsx
- LoadingWithMessage.tsx
- menubar.tsx
- navigation-menu.tsx
- PageLoader.tsx
- pagination.tsx
- popover.tsx
- progress.tsx
- radio-group.tsx
- resizable.tsx
- scroll-area.tsx
- SearchPillIcon.tsx
- select.tsx
- separator.tsx
- sheet.tsx
- sidebar.tsx
- skeleton.tsx
- slider.tsx
- sonner.tsx
- switch.tsx
- table.tsx
- tabs.tsx
- textarea.tsx
- toggle-group.tsx
- toggle.tsx
- tooltip.tsx

### 스켈레톤 컴포넌트 (5개)
위치: `/components/skeletons/`

- FreeContentDetailSkeleton.tsx
- HomeSkeleton.tsx
- PaidContentDetailSkeleton.tsx
- PaymentSkeleton.tsx
- ProfileSkeleton.tsx

---

## 🔄 업데이트 이력

### 2026-03-05
- **사주/타로 상담 체험 섹션 추가** (93 → 106개 활성)
  - 페이지 7개, 공유 컴포넌트 2개, 서비스 3개, 훅 1개
  - 신규 서비스: consultLimitService.ts (비회원 상담 1회 제한), consultRecommendationService.ts (AI 카테고리 기반 동적 추천 조회)
- **CompletionCoupon.tsx 삭제** (94 → 93개 활성)
  - 미션 쿠폰 → 새싹 30개 리워드로 대체 (`grant-mission-sprout` Edge Function)
  - CheckRecordMe.tsx 내 새싹 리워드 로직으로 이동

### 2026-03-04
- **홈 고도화 이관** (78 → 94개 활성)
  - Figma Make 퍼블리싱 코드 이관: 페이지 11개, 공유 컴포넌트 3개, 유틸리티 2개
  - HomePage.tsx → backup/ 이동, HomeScreenNew.tsx로 교체
  - 에셋: PNG 18개 (public/home-v2/), SVG 13개, Lottie JSON 1개
  - 의존성: fuse.js 추가

### 2026-02-12
- **인벤토리 현행화** (75개 활성, 52개 UI)
  - 누락 컴포넌트 10개 추가: ButtonSquareButton, ContentTags, FreeContentResult, ImageWithFallback, MyReportEmpty, NavigationTabBar, ReceiveMyAnalysis, SEO, UnifiedResultPage, WeeklyReportLoading
  - shadcn/ui 전체 목록 52개로 갱신 (FlowerPotIcon, LoadingWithMessage, PageLoader, SearchPillIcon 등 추가)
  - SajuResultPage, TarotResultPage → 백업 처리 (UnifiedResultPage로 대체됨)
  - MasterContentLoadingPage → 삭제 처리 (파일 삭제됨)

### 2026-02-10
- **ReportWeeklyMemoQuickEdit.tsx 컴포넌트 추가**
  - 보고서 리스트에서 응원글 빠른 수정 전용 페이지
  - ReportWeeklyMemoEdit.tsx와 분리 (보고서 보기 vs 리스트)
  - 인라인 버튼 레이아웃 (108px × 38px)
  - 타이틀 "수정하기", 서브타이틀 없음, X 버튼 없음
- **ReportWeeklyMemoEdit.tsx UI 개선**
  - BottomButtons → InlineButtons로 변경
  - 서브타이틀 제거 ("한 주 동안 애쓴..." 삭제)
  - X 버튼 제거
  - 타이틀 "수정하기"로 변경
- **통계 업데이트**
  - 총 컴포넌트: 71개 → 72개 (ReportWeeklyMemoQuickEdit 추가)
  - 주간 보고서: 8개 → 9개

### 2026-02-09
- **TagCouponBottomSheet.tsx 추가**
  - 태그 쿠폰 안내 바텀시트 (프로모션 모드 / 태그 모으기 유도 모드)
  - CheckRecordMe.tsx에서 사용
- **CheckRecordMe.tsx rejected_tags 연동**
  - 미선택 태그를 `users.rejected_tags`에 누적 저장
  - TagCouponBottomSheet 연동 (태그 5개 프로모션)
  - `save-trait-tags` Edge Function 삭제 → 클라이언트 직접 INSERT로 변경
- **통계 업데이트**
  - 총 컴포넌트: 55개 → 56개 (TagCouponBottomSheet 추가)
  - 유틸리티: 2개 → 3개

---

## 📝 관리 가이드

### 새 컴포넌트 추가 시
1. 해당 카테고리에 컴포넌트 정보 추가
2. 통계 섹션 업데이트
3. 업데이트 이력에 변경 사항 기록

### 컴포넌트 정보 포함 사항
- **역할**: 컴포넌트의 주요 목적
- **사용처**: 어디서 사용되는지
- **타입**: Page/UI/Modal/Feature Component
- **주요 기능**: 핵심 기능 나열
- **파일 경로**: 정확한 파일 위치
- **최근 업데이트**: 중요한 변경사항 (선택)

### 백업 처리 기준
1. 더 이상 사용하지 않는 컴포넌트
2. 다른 컴포넌트로 대체된 경우
3. `/components/_backup/`으로 이동
4. 백업 섹션에 사유 기록

---

**문서 버전**: 3.1.0
**최종 업데이트**: 2026-03-05
**다음 업데이트**: 새 컴포넌트 추가 또는 주요 변경 시
**문서 끝**