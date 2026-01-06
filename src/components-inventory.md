# Components Inventory

> **최종 업데이트**: 2026-01-06  
> **총 컴포넌트 수**: 50개 (활성화)  
> **프로젝트**: 타로/사주 운세 모바일 웹 서비스

---

## 📋 목차

- [UI 컴포넌트 (8개)](#ui-컴포넌트)
- [인증 관련 (3개)](#인증-관련)
- [결제 관련 (4개)](#결제-관련)
- [무료 콘텐츠 관련 (10개)](#무료-콘텐츠-관련)
- [마스터 콘텐츠 관리 (6개)](#마스터-콘텐츠-관리)
- [사주 정보 관리 (9개)](#사주-정보-관리)
- [타로 콘텐츠 (4개)](#타로-콘텐츠)
- [프로필 및 구매 내역 (4개)](#프로필-및-구매-내역)
- [유틸리티 컴포넌트 (3개)](#유틸리티-컴포넌트)
- [약관 페이지 (3개)](#약관-페이지)
- [에러 처리 (2개)](#에러-처리)
- [백업 컴포넌트 (5개)](#백업된-컴포넌트-사용-중지)

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

### Loading.tsx
- **역할**: 기본 로딩 스피너 컴포넌트
- **사용처**: SajuSelectPage
- **타입**: Presentational Component
- **파일 경로**: `/components/Loading.tsx`

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

---

## 💰 결제 관련

### PaymentNew.tsx
- **역할**: 결제 페이지 (포트원 연동)
- **사용처**: `/product/:id/payment/new` 라우트
- **타입**: Page Component
- **주요 기능**: 
  - 심화 해석판 결제
  - 쿠폰 적용 (웰컴 쿠폰 3000원, 재방문 쿠폰 2000원)
  - 약관 동의
  - PortOne v2 결제 연동
- **파일 경로**: `/components/PaymentNew.tsx`

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

### WelcomeCouponPage.tsx
- **역할**: 가입 축하 쿠폰 안내 페이지
- **사용처**: 신규 가입 플로우
- **타입**: Page Component
- **주요 기능**: 
  - 웰컴 쿠폰 발급 안내
  - Edge Function `/issue-welcome-coupon` 호출
- **파일 경로**: `/components/WelcomeCouponPage.tsx`

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
  - 폴링 (2초마다)
- **파일 경로**: `/components/FreeContentLoading.tsx`

### FreeContentResult.tsx
- **역할**: 무료 콘텐츠 결과 완료 페이지
- **사용처**: AI 운세 생성 완료 후
- **타입**: Page Component
- **주요 기능**: 생성된 운세 결과 표시
- **파일 경로**: `/components/FreeContentResult.tsx`

### FreeProductDetail.tsx
- **역할**: 무료 콘텐츠 상품 상세 정보
- **사용처**: App.tsx ProductDetailPage (type === 'free')
- **타입**: Page Component
- **주요 기능**: 
  - 무료 콘텐츠 소개
  - "무료로 풀이받기" 시작 버튼
  - **iOS Safari 최적화**: `transform-gpu` 적용 (맛보기 카드)
- **파일 경로**: `/components/FreeProductDetail.tsx`
- **최근 업데이트**: 2026-01-06 - iOS Safari 렌더링 최적화

### GlobalAIMonitor.tsx
- **역할**: AI 생성 상태 전역 모니터링 컴포넌트
- **사용처**: App.tsx 전역
- **타입**: Global Component
- **주요 기능**: 
  - AI 생성 상태 실시간 모니터링
  - 자동 리디렉션
- **파일 경로**: `/components/GlobalAIMonitor.tsx`

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
- **파일 경로**: `/components/MasterContentDetail.tsx`

### MasterContentDetailPage.tsx
- **역할**: 마스터 콘텐츠 사용자용 상세 페이지
- **사용처**: `/master/content/detail/:id` 라우트
- **타입**: Page Component
- **주요 기능**: 
  - 사용자에게 보여지는 콘텐츠 상세 페이지
  - 타로 카드 선택 UI 포함 (타로 콘텐츠)
  - **개발 환경 분리**: `IS_DEV_MODE` 플래그로 개발 전용 기능 제어
- **파일 경로**: `/components/MasterContentDetailPage.tsx`
- **최근 업데이트**: 2026-01-06 - 개발/배포 환경 분리 처리

### MasterContentList.tsx
- **역할**: 마스터 콘텐츠 목록 관리 페이지
- **사용처**: `/master/content/list` 라우트
- **타입**: Page Component
- **주요 기능**: 
  - 생성한 콘텐츠 목록 조회
  - 콘텐츠 관리 (수정, 삭제, 배포 상태 변경)
  - 엑셀 업로드 지원
- **파일 경로**: `/components/MasterContentList.tsx`

### MasterContentLoadingPage.tsx
- **역할**: 마스터 콘텐츠 AI 생성 로딩 페이지
- **사용처**: 마스터 콘텐츠 생성 중
- **타입**: Page Component
- **주요 기능**: 
  - AI 썸네일 생성 진행률 표시
  - Google Gemini API 호출 상태
- **파일 경로**: `/components/MasterContentLoadingPage.tsx`

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
- **파일 경로**: `/components/BirthInfoInput.tsx`

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
  - **개발 모드**: localStorage에서 데이터 로드
- **파일 경로**: `/components/SajuSelectPage.tsx`

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

### SajuDetail.tsx
- **역할**: 사주 상세 정보 조회 페이지
- **사용처**: 사주 정보 상세 보기
- **타입**: Page Component
- **주요 기능**: 
  - 사주 정보 상세 조회
  - 수정 기능
- **파일 경로**: `/components/SajuDetail.tsx`

### SajuResultPage.tsx
- **역할**: 사주 운세 결과 페이지
- **사용처**: `/saju/result` 라우트
- **타입**: Page Component
- **주요 기능**: 
  - 사주 기반 운세 결과 표시
  - 질문별 답변 표시
  - 목차 기능 (TableOfContentsBottomSheet)
- **파일 경로**: `/components/SajuResultPage.tsx`

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

---

## 🎴 타로 콘텐츠

### TarotFlowPage.tsx
- **역할**: 타로 콘텐츠 플로우 통합 페이지
- **사용처**: TarotDemo.tsx
- **타입**: Page Component
- **주요 기능**: 
  - 타로 운세 전체 플로우 관리
  - 카드 섞기 → 선택 → 결과 순서 제어
- **파일 경로**: `/components/TarotFlowPage.tsx`

### TarotCardSelection.tsx
- **역할**: 타로 카드 선택 컴포넌트
- **사용처**: MasterContentDetailPage, TarotFlowPage
- **타입**: Feature Component
- **주요 기능**: 
  - 타로 카드 선택 UI (3장)
  - 카드 뒤집기 애니메이션
  - 선택된 카드 정보 전달
- **기술**: Framer Motion 애니메이션
- **파일 경로**: `/components/TarotCardSelection.tsx`

### TarotShufflePage.tsx
- **역할**: 타로 카드 섞기 페이지
- **사용처**: `/tarot/shuffle` 라우트
- **타입**: Page Component
- **주요 기능**: 
  - 타로 카드 섞기 애니메이션
  - 사용자 인터랙션 (터치/클릭)
  - 섞기 완료 후 선택 단계로 이동
- **기술**: Framer Motion 애니메이션
- **파일 경로**: `/components/TarotShufflePage.tsx`

### TarotResultPage.tsx
- **역할**: 타로 운세 결과 페이지
- **사용처**: `/tarot/result` 라우트
- **타입**: Page Component
- **주요 기능**: 
  - 타로 카드 해석 결과 표시
  - 카드별 의미 설명 (과거/현재/미래)
  - AI 생성 해석
- **파일 경로**: `/components/TarotResultPage.tsx`

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
  - **개발 환경 분리**: 
    - UI 테스팅용 직접 이동 버튼
    - 사주 미등록 화면 토글 버튼
    - 에러 페이지 확인 버튼
- **파일 경로**: `/components/ProfilePage.tsx`
- **최근 업데이트**: 2026-01-06 - 개발용 버튼 환경 분리 처리 (3개)

### PurchaseHistoryPage.tsx
- **역할**: 구매 내역 조회 페이지
- **사용처**: `/profile/purchase-history` 라우트
- **타입**: Page Component
- **주요 기능**: 
  - 결제 내역 조회
  - 쿠폰 내역 조회
  - 주문 상세 정보
- **파일 경로**: `/components/PurchaseHistoryPage.tsx`

### ResultCompletePage.tsx
- **역할**: 결과 완료 페이지 (추천 콘텐츠 표시)
- **사용처**: 운세 결과 완료 후
- **타입**: Page Component
- **주요 기능**: 
  - 결과 확인 완료 안내
  - 추천 콘텐츠 표시
- **파일 경로**: `/components/ResultCompletePage.tsx`

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

### ProductDetail.tsx
- **역할**: 상품 상세 페이지 (유료 콘텐츠)
- **사용처**: App.tsx ProductDetailPage (type === 'paid')
- **타입**: Page Component
- **주요 기능**: 
  - 유료 콘텐츠 소개
  - 가격 정보
  - "구매하기" 결제 버튼
- **파일 경로**: `/components/ProductDetail.tsx`

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
- **파일 경로**: `/components/ErrorBoundary.tsx`

---

## 🗂️ 백업된 컴포넌트 (사용 중지)

### ProfilePageWithSaju.tsx
- **상태**: 백업됨 (`/components/_backup/`)
- **사유**: ProfilePage.tsx로 통합됨
- **파일 경로**: `/components/_backup/ProfilePageWithSaju.tsx`

### RelationshipBottomSheet.tsx
- **상태**: 백업됨 (`/components/_backup/`)
- **사유**: 사용처 없음 (개발 중 폐기)
- **파일 경로**: `/components/_backup/RelationshipBottomSheet.tsx`

### CouponBottomSheet.tsx
- **상태**: 백업됨 (`/components/_backup/`)
- **사유**: CouponBottomSheetNew.tsx로 대체됨
- **파일 경로**: `/components/_backup/CouponBottomSheet.tsx`

### ProfileImage.tsx
- **상태**: 백업됨 (`/components/_backup/`)
- **사유**: 실제 사용처 없음 (import만 존재, JSX 미사용)
- **백업 날짜**: 2026-01-06
- **파일 경로**: `/components/_backup/ProfileImage.tsx`

### ProgressiveImage.tsx
- **상태**: 백업됨 (`/components/_backup/`)
- **사유**: 실제 사용처 없음 (import/JSX 모두 없음)
- **백업 날짜**: 2026-01-06
- **파일 경로**: `/components/_backup/ProgressiveImage.tsx`

---

## 📊 통계

- **총 컴포넌트**: 50개
- **���이지 컴포넌트**: 38개
- **UI/유틸리티 컴포넌트**: 14개
- **백업된 컴포넌트**: 5개

### 카테고리별 분포
- UI 컴포넌트: 8개
- 인증 관련: 3개
- 결제 관련: 4개
- 무료 콘텐츠: 10개
- 마스터 콘텐츠 관리: 6개
- 사주 정보 관리: 9개
- 타로 콘텐츠: 4개 (NEW!)
- 프로필 및 구매: 4개
- 유틸리티: 3개
- 약관: 3개
- 에러 처리: 2개

---

## 🎨 디자인 시스템

### shadcn/ui 컴포넌트 (26개)
위치: `/components/ui/`

- accordion.tsx
- alert-dialog.tsx
- alert.tsx
- avatar.tsx
- badge.tsx
- button.tsx
- calendar.tsx
- card.tsx
- checkbox.tsx
- dialog.tsx
- drawer.tsx
- dropdown-menu.tsx
- form.tsx
- input.tsx
- label.tsx
- popover.tsx
- radio-group.tsx
- select.tsx
- separator.tsx
- sheet.tsx
- skeleton.tsx
- switch.tsx
- table.tsx
- tabs.tsx
- textarea.tsx
- toast.tsx (sonner)

### 스켈레톤 컴포넌트 (5개)
위치: `/components/skeletons/`

- FreeContentDetailSkeleton.tsx
- HomeSkeleton.tsx
- PaidContentDetailSkeleton.tsx
- PaymentSkeleton.tsx
- ProfileSkeleton.tsx

---

## 🔄 업데이트 이력

### 2026-01-06
- **개발/배포 환경 분리 처리 완료**
  - LoginPageNew.tsx: 테스트 버튼 2개 `import.meta.env.DEV` 처리
  - ProfilePage.tsx: 개발용 버튼 3개 환경 분리
  - MasterContentDetailPage.tsx: `IS_DEV_MODE` 플래그 적용
- **iOS Safari 렌더링 최적화**
  - FreeProductDetail.tsx: 맛보기 카드에 `transform-gpu` 적용
  - 둥근 모서리 정상 렌더링 확인
- **미사용 컴포넌트 정리**
  - ProfileImage.tsx → `_backup` 폴더로 이동 (import만 존재, JSX 미사용)
  - ProgressiveImage.tsx → `_backup` 폴더로 이동 (import/JSX 모두 없음)
  - App.tsx에서 FreeSajuAddPage import 제거
  - ProfilePage.tsx에서 ProfileImage import 제거
- **타로 서비스 통합**
  - 타로 콘텐츠 섹션 추가 (4개 컴포넌트)
  - TarotFlowPage, TarotCardSelection, TarotShufflePage, TarotResultPage
- **하단 고정 CTA 리팩토링**
  - BottomNavigation.tsx: iOS Safe Area 대응 완료
- **에러 처리 섹션 신규 추가**
  - ErrorPage.tsx, ErrorBoundary.tsx 문서화
- **통계 및 카테고리 업데이트**
  - 총 50개 컴포넌트 유지 (변동 없음)
  - 백업된 컴포넌트: 3개 → 5개

### 2025-12-31
- LoadingPage.tsx: 무료 콘텐츠 이미지 프리로딩 최적화 적용 반영
- TableOfContentsBottomSheet.tsx: 하드코딩 더미 데이터 제거 버그 수정 반영
- 총 50개 활성 컴포넌트 유지

### 2025-12-20
- 초기 문서 생성
- ProfilePageWithSaju.tsx, RelationshipBottomSheet.tsx, CouponBottomSheet.tsx 백업 처리
- 50개 활성 컴포넌트 정리 완료

---

## 📝 관리 가이드

### 새 컴포넌�� 추가 시
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

**문서 버전**: 2.0.0  
**최종 업데이트**: 2026-01-06  
**다음 업데이트**: 새 컴포넌트 추가 또는 주요 변경 시  
**문서 끝**