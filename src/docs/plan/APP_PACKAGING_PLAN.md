# 나다운세 앱 패키징 계획서

> **문서 목적**: nadaunse.com을 Android/iOS 앱스토어에 출시하기 위한 상세 기술 계획
> **전략**: Capacitor (React 코드 100% 재사용) | **Google Play 먼저 → Apple App Store 후속**
> **예상 기간**: 3-4주 (Google Play 2주 + Apple 추가 2주)
> **작성일**: 2026-02-04
> **최종 업데이트**: 2026-03-10 (세션 2 종료 시점)

---

## 출시 전략 요약

### Google Play 먼저 출시하는 이유

| | Google Play | Apple App Store |
|---|---|---|
| **운세 앱 심사** | 관대 (제한 없음) | "사주 앱" 거절 사례 있음 (MYPIE 사례) |
| **심사 기간** | 1~7일 | 1~2주 |
| **계정 비용** | $25 (1회) | $99/년 |
| **스토어 문구** | "타로/사주 운세" OK | 리프레이밍 필요 ("성격/기질 분석") |
| **인앱결제** | 외부 PG 허용 | 디지털 콘텐츠 IAP 필수 가능성 |
| **Apple 로그인** | 불필요 | 소셜 로그인 있으면 필수 |

### Apple App Store 심사 리프레이밍 전략

Apple이 "사주 앱"을 거절하므로, **자기이해/성격분석** 프레이밍으로 전환:

| 현재 (웹/Google Play) | Apple 제출용 리프레이밍 |
|---|---|
| 사주 운세 | 동양 명리학 기반 기질/성격 분석 |
| 타로 점 | 심리 셀프케어 / 마인드풀니스 카드 |
| 오늘의 운세 | 오늘의 인사이트 / 데일리 리포트 |
| 궁합 | 관계 성향 분석 |
| 주간 보고서 | 위클리 셀프 리포트 |
| 나다움 태그 | 성격 프로파일링 |

**나다운세가 유리한 점**: "나다움 기록하기", "주간 보고서", "나다움 태그" 등 자기이해 프레임이 이미 존재.

### 인앱결제(IAP) 판단

| 항목 | 판단 |
|---|---|
| **사주/타로 해석 콘텐츠** | 디지털 콘텐츠로 분류될 가능성 높음 → Apple IAP 필수 가능 |
| **현재 결제** | PortOne (카카오페이/카드) - 웹/Android에서 유지 |
| **Apple 대응 옵션** | (A) IAP 새싹 충전 (B) 리더 앱 (앱 내 열람, 웹 결제) (C) 외부 결제 링크 (EU 한정) |
| **추천** | 1차: 외부 PG로 제출 시도 → 거절 시 새싹 IAP 전환 |

---

## 단계별 TODO 리스트

### Step 1: Capacitor 기본 세팅 ✅ 완료
- [x] Capacitor 코어 + CLI 설치
- [x] `npx cap init` 초기화 (appId: `com.stargiosoft.nadaunse`)
- [x] Android 플랫폼 추가 (`npx cap add android`)
- [ ] iOS 플랫폼 추가 (`npx cap add ios`) — Apple 단계에서 진행
- [x] `vite.config.ts` outDir → `dist` 변경
- [x] `capacitor.config.ts` 작성 (서버, 딥링크, 플러그인)
- [x] `src/lib/platform.ts` 생성 (플랫폼 감지 유틸)
- [x] `package.json` Capacitor 스크립트 추가
- [x] `npm run build && npx cap sync` 동작 확인
- [x] Android Studio 설치 + SDK 설정
- [x] 실기기(Samsung SM-N976N) Wi-Fi 디버깅 연결
- [x] 앱 실행 확인 (실기기에서 홈 화면 정상 로드)
- [x] `android/gradle.properties`에 `android.overridePathCheck=true` 추가 (한글 경로 대응)
- [x] `android/local.properties`에 SDK 경로 설정

### Step 2: 핵심 기능 검증 - Android 🔄 진행 중
- [x] 홈 화면 로드 + 페이지 네비게이션 확인
- [x] 카카오 개발자 콘솔 Android 플랫폼 등록 (패키지명: `com.stargiosoft.nadaunse`)
- [x] 카카오 개발자 콘솔 디버그 키 해시 추가 (`NJfwKVNOxSyBBLuUp1XQqD37YU0=`)
- [x] Supabase Redirect URL 추가 (`nadaunse://auth/callback`) — Production 프로젝트에 등록 완료
- [x] `@capacitor/browser` 설치 (Google OAuth용 시스템 브라우저)
- [x] `@capacitor/app` 설치 (딥링크 이벤트 수신)
- [x] AndroidManifest.xml 딥링크 intent-filter 추가 (`nadaunse://auth/callback`)
- [x] `auth.ts` — `signInWithGoogleNative()` 함수 추가 (Custom Tab 방식)
- [x] `auth.ts` — `getGoogleOAuthUrl()` 네이티브 앱 딥링크 분기
- [x] `LoginPageNew.tsx` — 네이티브 앱 Google 로그인 분기 처리
- [x] `App.tsx` — 딥링크 수신 → Supabase 세션 설정 리스너 추가
- [x] `.env.production` 생성 (프로덕션 Supabase 환경변수)
- [x] `build:app` 스크립트 `--mode production` 적용
- [x] `env.ts` — Capacitor 앱에서 DEV=false 처리 (프로덕션 Project ID 기반)
- [ ] **🔴 카카오 로그인 KOE009 에러 해결** — 아래 "다음 세션 TODO" 참조
- [ ] **🔴 Google OAuth 실기기 테스트** — Custom Tab 방식 동작 확인 필요
- [ ] PortOne 결제 WebView 동작 확인
- [ ] 결제 앱 딥링크 설정 (AndroidManifest.xml `<queries>` 태그)
- [ ] 카카오페이 앱 → 나다운세 복귀 테스트
- [ ] 하드웨어 뒤로가기 버튼 동작 확인
- [ ] Safe Area / 상태바 처리

### Step 3: Google Play 출시 (3~5일)
- [ ] Google Play Console 계정 등록 ($25)
- [ ] 앱 아이콘 준비 (512x512) + 스플래시
- [ ] 피처 그래픽 준비 (1024x500)
- [ ] 스크린샷 준비 (최소 5장)
- [ ] 앱 설명 작성 (짧은 80자 + 긴 4000자)
- [ ] 개인정보처리방침 URL 등록
- [ ] 콘텐츠 등급 설문 완료
- [ ] Release 키스토어 생성 + 앱 서명
- [ ] Android App Bundle (.aab) 빌드
- [ ] 내부 테스트 트랙 업로드 + 테스트
- [ ] 프로덕션 트랙 제출
- [ ] 심사 통과 + 출시

### Step 4: Apple App Store 준비 (1~2주, 병행)
- [ ] Apple Developer 계정 등록 ($99/년)
- [ ] **Apple 로그인 구현** (소셜 로그인 있으면 필수)
- [ ] iOS 빌드 + 실기기 테스트
- [ ] 카카오 개발자 콘솔 iOS 플랫폼 등록 (Bundle ID)
- [ ] Info.plist 결제 앱 URL Scheme 추가
- [ ] iOS 전용 테스트 (Safe Area, 스와이프 뒤로가기, 키보드)
- [ ] **스토어 메타데이터 리프레이밍** ("성격/기질 분석" 포지셔닝)
- [ ] 스크린샷 준비 (iPhone 6.5", 5.5")
- [ ] 앱 내 "운세" 문구 → iOS 분기 처리 검토 (필요 시)
- [ ] 인앱결제 전략 결정 (외부 PG 시도 or IAP 구현)
- [ ] App Store Connect 앱 생성 + 정보 입력
- [ ] Xcode Archive → 업로드
- [ ] 심사 제출 (리뷰어 노트에 서비스 성격 설명)

### Step 5: 출시 후 (지속)
- [ ] 푸시 알림 구현 (FCM/APNs)
- [ ] Live Update 설정 (앱스토어 재심사 없이 웹 코드 업데이트)
- [ ] 앱 전용 프로모션 / 딥링크 마케팅
- [ ] 사용자 피드백 수집 + 개선

---

## 다음 세션 TODO (우선순위)

### 🔴 P0: 카카오 로그인 KOE009 해결
카카오 로그인 시 `kauth.kakao.com`에서 **KOE009 (앱 관리자 설정 오류)** 발생.

**원인 후보:**
1. 카카오 개발자 콘솔 → **카카오 로그인** 메뉴 → **활성화 상태** 확인 필요
2. JavaScript 키의 **사이트 도메인**에 Capacitor WebView origin 미등록
   - Capacitor WebView의 origin은 `http://localhost` 또는 `capacitor://localhost`
   - 카카오 콘솔 → 앱 설정 → 플랫폼 → Web → 사이트 도메인에 추가 필요
3. **Redirect URI** 미설정 — 카카오 로그인 → Redirect URI에 `http://localhost` 등록 필요

**조치:**
1. 카카오 개발자 콘솔 (`https://developers.kakao.com/console/app/1087703`) 접속
2. **제품 설정 → 카카오 로그인** → 활성화 ON 확인
3. **카카오 로그인 → Redirect URI** 확인/추가
4. **앱 설정 → 플랫폼 → Web** → 사이트 도메인에 `http://localhost` 추가
5. 변경 후 앱에서 카카오 로그인 재테스트

### 🔴 P0: Google OAuth 실기기 테스트
- `signInWithGoogleNative()` → Custom Tab(시스템 브라우저)에서 Google 로그인 → 딥링크 복귀 동작 확인
- Google Cloud Console에서 Android 앱 추가 설정은 불필요할 수 있음 (Supabase가 중계)
- 만약 에러 시: Google Cloud Console (`plucky-order-381214` 프로젝트) → OAuth 2.0 클라이언트 확인

### 🟡 P1: 프로덕션 빌드 상태 확인
- `--mode production`으로 빌드하면 `.env.production` 사용됨 (프로덕션 Supabase)
- `env.ts`에서 `VITE_SUPABASE_PROJECT_ID === 'kcthtpmxffppfbkjjkub'`이면 DEV=false
- 앱에서 [개발용] 버튼이 숨겨지는지 확인 필요
- **확인 후 실기기 재배포**: `npm run build:app` → Android Studio Run

### 🟡 P1: 결제 앱 딥링크 (AndroidManifest.xml `<queries>`)
결제 앱(카카오페이, 토스 등)이 설치된 경우 앱 실행을 위해 `<queries>` 태그 필요:
```xml
<queries>
  <package android:name="com.kakao.talk" />
  <package android:name="viva.republica.toss" />
  <package android:name="com.kftc.bankpay.android" />
</queries>
```

### 🟢 P2: 하드웨어 뒤로가기 + 상태바
- Android 하드웨어 뒤로가기 시 React Router 히스토리 뒤로가기 동작 확인
- 상태바 색상/스타일 처리 (`@capacitor/status-bar`)

---

## 기술 참조

### 생성/수정된 파일 목록

| 파일 | 상태 | 설명 |
|------|------|------|
| `capacitor.config.ts` | 신규 | Capacitor 설정 |
| `src/lib/platform.ts` | 신규 | 플랫폼 감지 유틸 (isNativeApp, isAndroid, isIOS) |
| `.env.production` | 신규 | 프로덕션 환경변수 (앱 빌드용) |
| `android/` | 신규 | Android 네이티브 프로젝트 (자동 생성) |
| `android/gradle.properties` | 수정 | `android.overridePathCheck=true` 추가 |
| `android/local.properties` | 신규 | SDK 경로 설정 |
| `android/app/src/main/AndroidManifest.xml` | 수정 | 딥링크 intent-filter 추가 |
| `vite.config.ts` | 수정 | `outDir: 'dist'` |
| `package.json` | 수정 | Capacitor 스크립트 + `@capacitor/browser`, `@capacitor/app` 의존성 |
| `src/lib/auth.ts` | 수정 | `signInWithGoogleNative()` 추가, `getGoogleOAuthUrl()` 딥링크 분기 |
| `src/lib/env.ts` | 수정 | 프로덕션 Project ID 기반 DEV/isProduction 판별 추가 |
| `src/components/LoginPageNew.tsx` | 수정 | 네이티브 앱 Google 로그인 분기 |
| `src/App.tsx` | 수정 | Capacitor 딥링크 리스너 (Google OAuth 콜백) |

### 디버그 키 정보
- **키 해시 (Base64)**: `NJfwKVNOxSyBBLuUp1XQqD37YU0=`
- **SHA-1**: `34:97:F0:29:53:4E:C5:2C:81:04:BB:94:A7:55:D0:A8:3D:FB:61:4D`
- **기존 키 해시**: `xUcy65nXqa1zn3LusqvPY/cIdY8=`

### 테스트 기기
- Samsung SM-N976N (Wi-Fi 디버깅)

---

## 목차

1. [현재 상태 분석](#1-현재-상태-분석)
2. [패키징 옵션 비교](#2-패키징-옵션-비교)
3. [권장 전략: Capacitor](#3-권장-전략-capacitor)
4. [상세 구현 로드맵](#4-상세-구현-로드맵)
5. [외부 서비스 연동 가이드](#5-외부-서비스-연동-가이드)
6. [파일 수정 상세](#6-파일-수정-상세)
7. [앱스토어 배포 가이드](#7-앱스토어-배포-가이드)
8. [테스트 체크리스트](#8-테스트-체크리스트)
9. [트러블슈팅](#9-트러블슈팅)
10. [향후 확장 계획](#10-향후-확장-계획)

---

## 1. 현재 상태 분석

### 1.1 기술 스택 현황

| 분류 | 기술 | 버전 | 앱 패키징 영향 |
|------|------|------|---------------|
| **Frontend** | React | 18.3.1 | Capacitor 완전 호환 |
| **빌드 도구** | Vite | 6.4.1 | outDir 설정 필요 |
| **스타일** | Tailwind CSS | 4.1 | 변경 없음 |
| **라우팅** | React Router | 7.11.0 | 변경 없음 |
| **상태관리** | React Hooks | - | 변경 없음 |
| **Backend** | Supabase | - | 변경 없음 (API 호출) |
| **배포** | Vercel | - | 웹 버전 유지, 앱은 별도 |

### 1.2 PWA 상태

현재 PWA 기능이 **미설정**되어 있습니다:

| 항목 | 상태 | 필요 여부 |
|------|------|----------|
| `manifest.json` | ❌ 없음 | Capacitor 사용 시 불필요 |
| `service-worker.js` | ❌ 없음 | Capacitor 사용 시 불필요 |
| `vite-plugin-pwa` | ❌ 미설치 | Capacitor 사용 시 불필요 |
| Apple Touch Icon | ✅ 설정됨 | 유지 |

### 1.3 네이티브 API 사용 현황

```
현재 사용 중인 네이티브 기능: 없음
```

| 기능 | 사용 여부 | vercel.json 설정 | Capacitor 영향 |
|------|----------|-----------------|---------------|
| 카메라 | ❌ 미사용 | `camera=()` 차단 | 변경 불필요 |
| 마이크 | ❌ 미사용 | `microphone=()` 차단 | 변경 불필요 |
| 위치정보 | ❌ 미사용 | `geolocation=()` 차단 | 변경 불필요 |
| 푸시 알림 | ❌ 미사용 | - | 향후 추가 가능 |

### 1.4 외부 서비스 연동 현황

| 서비스 | 구현 위치 | 현재 방식 | 앱 호환성 |
|--------|----------|----------|----------|
| **PortOne 결제** | `PaymentNew.tsx` | iframe 오버레이 | ✅ WebView 동작 (딥링크 필요) |
| **카카오 로그인** | `auth.ts`, `LoginPageNew.tsx` | 웹 팝업 (`throughTalk: false`) | ✅ WebView 동작 |
| **카카오 알림톡** | `send-alimtalk/index.ts` | Edge Function 서버 호출 | ✅ 영향 없음 |
| **Supabase Auth** | `supabase.ts` | PKCE OAuth | ✅ 리다이렉트 URL 추가 필요 |
| **사주 API** | Edge Function | 서버 직접 호출 | ✅ 영향 없음 |
| **AI API** | Edge Function | 서버 직접 호출 | ✅ 영향 없음 |

### 1.5 현재 빌드 설정

**vite.config.ts 현재 설정:**
```typescript
export default defineConfig({
  plugins: [react()],
  build: {
    target: 'esnext',
    outDir: 'build',  // Capacitor는 'dist' 권장
  },
  server: {
    port: 3000,
  }
});
```

---

## 2. 패키징 옵션 비교

### 2.1 옵션별 상세 비교

| 항목 | PWA | Capacitor | TWA | React Native |
|------|-----|-----------|-----|--------------|
| **구현 기간** | 1-2일 | 2-3주 | 3-5일 | 2-3개월 |
| **코드 재사용** | 100% | 100% | 100% | 0% (재작성) |
| **App Store** | ❌ 불가 | ✅ 가능 | ❌ 불가 | ✅ 가능 |
| **Play Store** | ❌ 불가 | ✅ 가능 | ✅ 가능 | ✅ 가능 |
| **PortOne 결제** | 그대로 | 딥링크 설정 | 그대로 | 재구현 |
| **카카오 로그인** | 그대로 | 그대로/네이티브 | 그대로 | 재구현 |
| **푸시 알림** | Web Push (iOS 제한) | 네이티브 완전 지원 | Web Push | 네이티브 완전 지원 |
| **오프라인 지원** | Service Worker | 플러그인 필요 | Service Worker | 네이티브 |
| **앱 업데이트** | 즉시 (웹) | 스토어 재배포 | 즉시 (웹) | 스토어 재배포 |
| **유지보수 비용** | 매우 낮음 | 중간 | 낮음 | 높음 |

### 2.2 옵션별 장단점 상세

#### PWA (Progressive Web App)
```
장점:
- 구현 가장 빠름 (1-2일)
- 앱스토어 심사 불필요
- 코드 수정 최소화
- 즉시 업데이트 가능

단점:
- 앱스토어 등록 불가능 → 발견성 낮음
- iOS 푸시 알림 제한 (iOS 16.4+ 필요)
- "홈 화면에 추가" 사용자 인지도 낮음
- 앱처럼 보이지 않음
```

#### Capacitor (권장) ⭐
```
장점:
- React 코드 100% 재사용
- iOS/Android 앱스토어 모두 등록 가능
- 네이티브 플러그인 생태계 (푸시, 딥링크 등)
- WebView 기반이라 웹과 동일한 동작 보장
- Vercel 웹 버전 동시 운영 가능 (듀얼 배포)
- Ionic 팀 공식 지원 (활발한 커뮤니티)

단점:
- 앱스토어 심사 필요 (1-2주)
- 앱 업데이트 시 재배포 필요
- 결제 PG 앱 딥링크 설정 필요
```

#### TWA (Trusted Web Activity)
```
장점:
- Play Store 등록 가능
- PWA 기반이라 코드 수정 최소
- 주소창 없이 네이티브 앱처럼 보임

단점:
- Android 전용 (iOS 불가)
- iOS는 별도 솔루션 필요 (Capacitor 등)
- Chrome 기반 제한
```

#### React Native / Expo
```
장점:
- 진정한 네이티브 성능
- 네이티브 기능 완전 접근
- 앱스토어 최적화

단점:
- 완전 재작성 필요 (69개 컴포넌트, 41개 페이지)
- 웹/앱 코드베이스 분리 → 유지보수 2배
- Tailwind → NativeWind 변환 필요
- 개발 기간 2-3개월
```

### 2.3 선정 결론

**Capacitor 선정 이유:**
1. 앱스토어 등록 필수 요구사항 충족 (iOS + Android)
2. 기존 코드 100% 재사용으로 개발 비용 최소화
3. 결제/로그인 등 핵심 기능 WebView에서 동작
4. 향후 푸시 알림 등 네이티브 기능 확장 가능
5. 웹 버전 동시 운영으로 사용자 접점 유지

---

## 3. 권장 전략: Capacitor

### 3.1 Capacitor 개요

**Capacitor**는 Ionic 팀이 개발한 크로스 플랫폼 네이티브 런타임입니다.

```
웹 앱 (React/Vue/Angular)
       ↓
   Capacitor
       ↓
  ┌─────┴─────┐
  ↓           ↓
iOS App   Android App
(WKWebView) (WebView)
```

### 3.2 아키텍처

```
나다운세 앱 아키텍처
====================

┌─────────────────────────────────────────────────────┐
│                   React 앱 (기존 코드)                │
│  ┌──────────────────────────────────────────────┐   │
│  │  Components (69개) + Pages (41개)            │   │
│  │  Tailwind CSS + React Router                 │   │
│  └──────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────┐
│                 Capacitor Bridge                     │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  │
│  │ App Plugin  │  │ HTTP Plugin │  │ 딥링크 설정  │  │
│  └─────────────┘  └─────────────┘  └─────────────┘  │
└─────────────────────────────────────────────────────┘
           ↓                               ↓
┌──────────────────────┐    ┌──────────────────────┐
│     iOS Native       │    │   Android Native     │
│  ┌────────────────┐  │    │  ┌────────────────┐  │
│  │   WKWebView    │  │    │  │    WebView     │  │
│  │   (Safari)     │  │    │  │   (Chrome)     │  │
│  └────────────────┘  │    │  └────────────────┘  │
│  Xcode 프로젝트       │    │  Android Studio     │
└──────────────────────┘    └──────────────────────┘
           ↓                               ↓
     App Store 배포                 Play Store 배포
```

### 3.3 배포 전략

```
듀얼 배포 전략
=============

                 나다운세 React 코드
                         │
         ┌───────────────┼───────────────┐
         ↓               ↓               ↓
    웹 배포          iOS 배포       Android 배포
   (Vercel)       (App Store)    (Play Store)
         │               │               │
         ↓               ↓               ↓
   nadaunse.com    나다운세 앱      나다운세 앱
                   (iPhone)      (Android)

장점:
- 웹 사용자 기존 유지
- 앱스토어 검색으로 신규 사용자 획득
- 동일한 코드베이스로 유지보수 효율화
```

---

## 4. 상세 구현 로드맵

### Phase 1: Capacitor 기본 설정 (3-5일)

#### 4.1.1 Capacitor 설치

```bash
# 1. Capacitor 코어 설치
npm install @capacitor/core @capacitor/cli

# 2. Capacitor 초기화
npx cap init "나다운세" "com.stargiosoft.nadaunse" --web-dir=dist

# 3. iOS/Android 플랫폼 추가
npm install @capacitor/ios @capacitor/android
npx cap add ios
npx cap add android
```

#### 4.1.2 capacitor.config.ts 생성

```typescript
// capacitor.config.ts
import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.stargiosoft.nadaunse',
  appName: '나다운세',
  webDir: 'dist',

  // 서버 설정
  server: {
    // 외부 URL 허용 (결제, OAuth 등)
    allowNavigation: [
      'https://*.iamport.kr',
      'https://*.kakaopay.com',
      'https://*.kakao.com',
      'https://*.inicis.com',
      'https://*.tosspayments.com',
      'https://*.supabase.co',
      'https://nadaunse.com'
    ],
    // iOS에서 localhost 대신 실제 서버 사용 (선택)
    // url: 'https://nadaunse.com',
    // cleartext: false
  },

  // iOS 설정
  ios: {
    contentInset: 'automatic',
    allowsLinkPreview: false,
    scrollEnabled: true,
    // 상태바 스타일
    preferredContentMode: 'mobile',
    // 스킴 설정 (딥링크용)
    scheme: 'nadaunse'
  },

  // Android 설정
  android: {
    allowMixedContent: false,
    captureInput: true,
    webContentsDebuggingEnabled: false, // 프로덕션에서는 false
    // 스킴 설정 (딥링크용)
    // 앱 링크는 AndroidManifest.xml에서 설정
  },

  // 플러그인 설정
  plugins: {
    // HTTP 플러그인 (CORS 우회)
    CapacitorHttp: {
      enabled: true
    },
    // 스플래시 스크린
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      backgroundColor: '#ffffff',
      showSpinner: false,
      splashFullScreen: true,
      splashImmersive: true
    }
  }
};

export default config;
```

#### 4.1.3 vite.config.ts 수정

```typescript
// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    extensions: ['.js', '.jsx', '.ts', '.tsx', '.json'],
    alias: {
      '@': path.resolve(__dirname, './src'),
      // 기존 alias 유지...
    }
  },
  build: {
    target: 'esnext',
    outDir: 'dist',  // ⚠️ 'build' → 'dist' 변경 (Capacitor 기본값)
    sourcemap: false, // 프로덕션 빌드 시
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
        }
      }
    }
  },
  server: {
    port: 3000,
    open: true,
  }
});
```

#### 4.1.4 package.json 스크립트 추가

```json
{
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "build:web": "vite build",

    "// Capacitor 스크립트": "",
    "cap:sync": "npx cap sync",
    "cap:copy": "npx cap copy",
    "cap:open:ios": "npx cap open ios",
    "cap:open:android": "npx cap open android",

    "// 앱 빌드 스크립트": "",
    "build:app": "npm run build && npm run cap:sync",
    "run:ios": "npm run build:app && npx cap run ios",
    "run:android": "npm run build:app && npx cap run android",

    "// 기존 스크립트 유지": "",
    "deploy:prod": "scripts\\deploy-production.bat",
    "deploy:staging": "scripts\\deploy-staging.bat"
  }
}
```

#### 4.1.5 앱 아이콘 및 스플래시 스크린

**필요한 이미지 리소스:**

| 플랫폼 | 용도 | 크기 | 파일명 |
|--------|------|------|--------|
| iOS | App Icon | 1024x1024 | `AppIcon.png` |
| Android | App Icon | 512x512 | `ic_launcher.png` |
| iOS/Android | Splash | 2732x2732 | `splash.png` |

**자동 생성 도구:**
```bash
# @capacitor/assets 사용 (권장)
npm install -D @capacitor/assets

# 아이콘/스플래시 자동 생성
# resources/icon.png (1024x1024) 준비 후:
npx capacitor-assets generate
```

**리소스 폴더 구조:**
```
resources/
├── icon.png           # 1024x1024 앱 아이콘 원본
├── splash.png         # 2732x2732 스플래시 원본
├── icon-foreground.png # (선택) Android Adaptive Icon
└── icon-background.png # (선택) Android Adaptive Icon
```

---

### Phase 2: 결제 시스템 연동 (3-5일)

#### 4.2.1 PortOne 결제 WebView 호환성

**현재 구현 방식 (PaymentNew.tsx):**
```typescript
// PortOne iframe 오버레이 감지
const allIframes = document.querySelectorAll('iframe');
allIframes.forEach(iframe => {
  const src = iframe.getAttribute('src') || '';
  if (isVisible && (
    src.includes('iamport') ||
    src.includes('kakaopay') ||
    src.includes('service.iamport.kr')
  )) {
    // 결제 창 감지 로직
  }
});
```

**WebView 호환성:**
- ✅ iframe 기반 결제창은 WebView에서 기본 동작
- ⚠️ 카카오페이/토스 앱 연동 시 딥링크 설정 필요

#### 4.2.2 결제 앱 딥링크 설정

**iOS (ios/App/App/Info.plist):**
```xml
<key>LSApplicationQueriesSchemes</key>
<array>
  <!-- 카카오페이 -->
  <string>kakaotalk</string>
  <string>kakaokompassauth</string>
  <string>kakaolink</string>
  <string>kakaoplus</string>
  <!-- 토스 -->
  <string>supertoss</string>
  <!-- 기타 PG -->
  <string>kftc-bankpay</string>
  <string>ispmobile</string>
  <string>shinhan-sr-ansimclick</string>
  <string>kb-acp</string>
  <string>mpocket.online.ansimclick</string>
  <string>lottesmartpay</string>
  <string>lotteappcard</string>
  <string>cloudpay</string>
  <string>nhappcardansimclick</string>
  <string>citispay</string>
  <string>ciaborae001</string>
  <string>shinslogin</string>
  <string>smshinhanansimclick</string>
</array>
```

**Android (android/app/src/main/AndroidManifest.xml):**
```xml
<manifest>
  <queries>
    <!-- 카카오페이 -->
    <package android:name="com.kakao.talk" />
    <!-- 토스 -->
    <package android:name="viva.republica.toss" />
    <!-- 기타 PG 앱들 -->
    <package android:name="com.kftc.bankpay.android" />
    <package android:name="kvp.jjy.MispAndroid320" />
  </queries>

  <application>
    <!-- 기존 설정 -->

    <!-- 결제 완료 후 앱 복귀를 위한 딥링크 -->
    <activity>
      <intent-filter>
        <action android:name="android.intent.action.VIEW" />
        <category android:name="android.intent.category.DEFAULT" />
        <category android:name="android.intent.category.BROWSABLE" />
        <data android:scheme="nadaunse" />
      </intent-filter>
    </activity>
  </application>
</manifest>
```

#### 4.2.3 PaymentNew.tsx 앱 환경 분기 (선택)

```typescript
// src/lib/platform.ts
import { Capacitor } from '@capacitor/core';

export const isNativeApp = () => Capacitor.isNativePlatform();
export const getPlatform = () => Capacitor.getPlatform(); // 'ios' | 'android' | 'web'

// PaymentNew.tsx에서 사용
import { isNativeApp } from '../lib/platform';

// 앱 환경에서 추가 처리 (필요 시)
if (isNativeApp()) {
  // 앱 전용 결제 콜백 URL 설정 등
}
```

---

### Phase 3: 카카오 로그인 테스트 (2-3일)

#### 4.3.1 현재 구현 분석

**auth.ts 카카오 로그인:**
```typescript
// 현재 방식: 웹 팝업 (throughTalk: false)
window.Kakao.Auth.login({
  throughTalk: false,  // 카카오톡 앱 대신 웹 팝업
  success: (authObj) => {
    // 사용자 정보 조회 후 Supabase 로그인
  }
});
```

**LoginPageNew.tsx 카카오 SDK 로드:**
```typescript
const script = document.createElement('script');
script.src = 'https://developers.kakao.com/sdk/js/kakao.js';
// ...
window.Kakao.init('da0e07cca0c104a3b59f79a24911587c');
```

#### 4.3.2 WebView 호환성

| 항목 | 상태 | 설명 |
|------|------|------|
| 웹 팝업 로그인 | ✅ 동작 | `throughTalk: false`로 웹에서 처리 |
| 카카오 SDK | ✅ 로드됨 | JavaScript SDK WebView에서 동작 |
| OAuth 리다이렉트 | ⚠️ 확인 필요 | WebView 내 리다이렉트 테스트 |

#### 4.3.3 카카오 개발자 설정 업데이트

**카카오 개발자 콘솔 설정 추가:**
1. 내 애플리케이션 → 앱 설정 → 플랫폼
2. iOS/Android 플랫폼 추가:

| 플랫폼 | 설정값 |
|--------|--------|
| **iOS** | Bundle ID: `com.stargiosoft.nadaunse` |
| **Android** | 패키지명: `com.stargiosoft.nadaunse` |
| **Android** | 키 해시: (아래 명령으로 생성) |

**Android 키 해시 생성:**
```bash
# Debug 키 해시
keytool -exportcert -alias androiddebugkey -keystore ~/.android/debug.keystore -storepass android -keypass android | openssl sha1 -binary | openssl base64

# Release 키 해시 (프로덕션)
keytool -exportcert -alias <your-key-alias> -keystore <your-keystore-path> | openssl sha1 -binary | openssl base64
```

#### 4.3.4 (선택) 네이티브 카카오 SDK 플러그인

앱에서 카카오톡 앱 연동을 원할 경우:

```bash
# Capacitor 카카오 로그인 플러그인
npm install @nicepayments/capacitor-kakao-login
npx cap sync
```

```typescript
// 네이티브 SDK 사용 시 (선택)
import { KakaoLogin } from '@nicepayments/capacitor-kakao-login';

const loginWithKakaoNative = async () => {
  if (isNativeApp()) {
    // 네이티브 SDK 사용
    const result = await KakaoLogin.login();
    // Supabase 로그인 연동
  } else {
    // 기존 웹 방식
    signInWithKakao();
  }
};
```

---

### Phase 4: 앱스토어 배포 (1-2주)

#### 4.4.1 사전 준비

**공통 준비 사항:**
| 항목 | 설명 | 준비 상태 |
|------|------|----------|
| 앱 이름 | 나다운세 | ✅ |
| 앱 설명 (짧은) | 나의 다양한 모습을 발견하는 타로/사주 운세 | 작성 필요 |
| 앱 설명 (긴) | 상세 기능 설명 (500자 이상) | 작성 필요 |
| 스크린샷 | iOS 6.5", 5.5" / Android 각 5장 | 준비 필요 |
| 프라이버시 정책 URL | 필수 | 기존 URL 또는 신규 작성 |
| 앱 카테고리 | 라이프스타일 / 엔터테인먼트 | 선택 |

#### 4.4.2 iOS App Store 배포

**1. Apple Developer 계정:**
- 비용: $99/년
- URL: https://developer.apple.com/programs/

**2. Xcode 설정:**
```bash
# iOS 프로젝트 열기
npx cap open ios
```

**Xcode에서 설정:**
- Signing & Capabilities → Team 선택
- Bundle Identifier: `com.stargiosoft.nadaunse`
- Version: 1.0.0
- Build: 1

**3. App Store Connect:**
1. 앱 생성 (Bundle ID 연결)
2. 앱 정보 입력 (이름, 설명, 스크린샷)
3. 빌드 업로드 (Xcode → Product → Archive → Distribute)
4. 심사 제출

**4. 심사 예상 기간:**
- 첫 제출: 1-2주
- 업데이트: 1-3일

**5. 심사 주의사항:**
| 항목 | 체크 |
|------|------|
| 인앱 결제 여부 | ⚠️ 사주/타로 해석은 디지털 콘텐츠 → IAP 필수 가능성. 1차: 외부 PG로 제출 시도 |
| 개인정보 수집 | ✅ (프라이버시 정책 링크 필수) |
| Apple 로그인 | ✅ **필수** (카카오/Google 소셜 로그인 있으므로 Apple 로그인 추가 필수) |
| 콘텐츠 등급 | 4+ (전체 이용가) |
| 앱 포지셔닝 | ⚠️ "운세/점술" → "명리학 기반 성격/기질 분석" 리프레이밍 필수 |
| 카테고리 | 라이프스타일 (점술 카테고리 X) |
| 리뷰어 노트 | "자기이해/성격분석 서비스" 설명 작성 필수 |

#### 4.4.3 Google Play Store 배포

**1. Google Play Console 계정:**
- 비용: $25 (1회)
- URL: https://play.google.com/console

**2. Android Studio 설정:**
```bash
# Android 프로젝트 열기
npx cap open android
```

**Android Studio에서:**
- Build → Generate Signed Bundle/APK
- Android App Bundle (.aab) 선택
- 키스토어 생성 또는 기존 사용

**3. Play Console:**
1. 앱 생성
2. 앱 정보 입력
3. 콘텐츠 등급 설문
4. 프로덕션 트랙에 .aab 업로드
5. 출시

**4. 심사 예상 기간:**
- 첫 제출: 1-7일
- 업데이트: 몇 시간 ~ 3일

---

## 5. 외부 서비스 연동 가이드

### 5.1 PortOne 결제 연동 상세

**현재 동작 방식:**
```
사용자 결제 버튼 클릭
       ↓
IMP.request_pay() 호출
       ↓
PortOne iframe 오버레이 표시
       ↓
┌─────────────────────────────────────┐
│  결제 수단 선택 (카카오페이/카드)      │
│            ↓                        │
│  ┌──────────┬──────────┐            │
│  │ 카카오페이 │   카드    │            │
│  └──────────┴──────────┘            │
│            ↓                        │
│  (앱에서) 카카오페이 앱 실행           │
│  또는 카드사 앱 실행                  │
│            ↓                        │
│  결제 완료 후 나다운세 앱 복귀         │
└─────────────────────────────────────┘
       ↓
결제 완료 콜백
       ↓
PaymentComplete 페이지
```

**앱에서 주의사항:**
1. 결제 앱 실행 후 **복귀 시나리오** 테스트 필수
2. `capacitor.config.ts`의 `allowNavigation`에 PG 도메인 추가
3. iOS `Info.plist`에 PG 앱 URL 스킴 추가
4. Android `AndroidManifest.xml`에 앱 복귀 딥링크 설정

### 5.2 카카오 로그인 연동 상세

**현재 동작 방식:**
```
카카오 로그인 버튼 클릭
       ↓
Kakao.Auth.login({ throughTalk: false })
       ↓
카카오 로그인 웹 팝업 (WebView 내)
       ↓
사용자 로그인/동의
       ↓
카카오 액세스 토큰 획득
       ↓
Kakao.API.request('/v2/user/me')
       ↓
사용자 정보 (email, nickname, profile_image)
       ↓
Supabase signInWithPassword
(카카오 ID 기반 이메일 + 비밀번호)
       ↓
로그인 완료
```

**앱에서 설정:**
1. 카카오 개발자 콘솔에 iOS/Android 플랫폼 등록
2. Bundle ID / 패키지명 / 키 해시 설정
3. WebView에서 팝업 허용 확인

### 5.3 Supabase Auth 연동 상세

**OAuth 리다이렉트 URL 추가 (Supabase Dashboard):**
```
기존:
- https://nadaunse.com/auth/callback

추가 필요:
- nadaunse://auth/callback (앱 딥링크용)
- capacitor://localhost/auth/callback (Capacitor 개발용)
```

**supabase.ts 수정 (필요 시):**
```typescript
// 앱 환경에서 리다이렉트 URL 동적 설정
const getRedirectUrl = () => {
  if (Capacitor.isNativePlatform()) {
    return 'nadaunse://auth/callback';
  }
  return `${window.location.origin}/auth/callback`;
};
```

---

## 6. 파일 수정 상세

### 6.1 신규 생성 파일

| 파일 | 용도 | 위치 |
|------|------|------|
| `capacitor.config.ts` | Capacitor 설정 | 프로젝트 루트 |
| `ios/` | iOS 네이티브 프로젝트 | 자동 생성 |
| `android/` | Android 네이티브 프로젝트 | 자동 생성 |
| `resources/icon.png` | 앱 아이콘 원본 | resources/ |
| `resources/splash.png` | 스플래시 원본 | resources/ |
| `src/lib/platform.ts` | 플랫폼 감지 유틸 | src/lib/ |

### 6.2 수정 필요 파일

| 파일 | 수정 내용 | 영향도 |
|------|----------|--------|
| `vite.config.ts` | `outDir: 'dist'` | 낮음 |
| `package.json` | Capacitor 스크립트 추가 | 낮음 |
| `vercel.json` | 웹 배포에는 영향 없음 | 없음 |
| `src/lib/supabase.ts` | (선택) 앱 리다이렉트 URL | 낮음 |
| `src/lib/auth.ts` | (선택) 앱 환경 분기 | 낮음 |

### 6.3 수정하지 않는 파일

| 파일 | 이유 |
|------|------|
| `src/components/PaymentNew.tsx` | WebView에서 기존 로직 동작 |
| `src/components/LoginPageNew.tsx` | WebView에서 기존 로직 동작 |
| `supabase/functions/*` | 서버사이드라 영향 없음 |
| `src/styles/globals.css` | 스타일 변경 불필요 |

---

## 7. 앱스토어 배포 가이드

### 7.1 iOS App Store 체크리스트

```
[ ] Apple Developer 계정 등록 ($99/년)
[ ] App Store Connect에서 앱 생성
[ ] 앱 아이콘 준비 (1024x1024)
[ ] 스크린샷 준비 (iPhone 6.5", 5.5")
[ ] 앱 설명 작성 (한국어/영어)
[ ] 프라이버시 정책 URL 등록
[ ] 키워드 설정
[ ] Xcode에서 Archive 생성
[ ] App Store Connect에 업로드
[ ] 심사 제출
[ ] 심사 통과 후 출시
```

### 7.2 Google Play Store 체크리스트

```
[ ] Google Play Console 계정 등록 ($25)
[ ] 앱 생성
[ ] 앱 아이콘 준비 (512x512)
[ ] 피처 그래픽 준비 (1024x500)
[ ] 스크린샷 준비 (최소 2장)
[ ] 앱 설명 작성 (짧은 설명 80자, 긴 설명 4000자)
[ ] 개인정보처리방침 URL 등록
[ ] 콘텐츠 등급 설문 완료
[ ] 앱 서명 키 설정
[ ] Android App Bundle (.aab) 업로드
[ ] 출시
```

### 7.3 스토어 메타데이터

#### Google Play (운세 프레이밍 OK)

**앱 이름:**
```
나다운세 - 타로/사주 운세
```

**짧은 설명 (80자):**
```
나의 다양한 모습을 발견하는 AI 기반 타로/사주 운세 서비스
```

**긴 설명 (권장 500자 이상):**
```
🌟 나다운세 - 나의 다양한 모습을 발견하세요

나다운세는 AI 기반의 개인 맞춤형 타로/사주 운세 서비스입니다.

✨ 주요 기능
• AI가 분석하는 정확한 사주 풀이
• 매일 새로운 타로 카드 리딩
• 나만의 성향 태그 수집
• 주간 분석 보고서 발행
• 카카오페이 간편 결제

🔮 무료 콘텐츠
• 오늘의 운세
• 타로 한 장 뽑기
• 궁합 테스트

💝 나다움 찾기
운세 결과에서 발견한 나의 성향 태그를 모아보세요.
강한 모습, 섬세한 모습... 다양한 나를 발견할 수 있어요.

📊 주간 보고서
한 주간 모은 태그를 바탕으로 AI가 분석해주는
'나 보고서'를 매주 받아보세요.

오늘도 당신답게, 나다운세와 함께하세요 🌱
```

**키워드:**
```
운세, 타로, 사주, 점, 오늘의운세, 무료운세, 궁합, AI운세, 성격테스트
```

#### Apple App Store (리프레이밍 필수)

**앱 이름:**
```
나다운세 - 나다움 성격 분석
```

**부제:**
```
명리학 기반 기질 분석과 셀프케어
```

**짧은 설명:**
```
동양 명리학과 AI로 발견하는 나만의 성격 프로파일
```

**긴 설명 (리프레이밍):**
```
🌟 나다운세 - 나의 다양한 모습을 발견하세요

나다운세는 동양 명리학과 AI를 결합한 성격/기질 분석 서비스입니다.

✨ 주요 기능
• AI 기반 성격/기질 심층 분석
• 타로 카드를 활용한 심리 셀프케어
• 나만의 성향 태그 프로파일링
• 주간 셀프 리포트 발행

🧠 자기이해 도구
• 오늘의 인사이트
• 마인드풀니스 카드 리딩
• 관계 성향 분석

💝 나다움 찾기
분석 결과에서 발견한 성향 태그를 모아보세요.
강한 모습, 섬세한 모습... 다양한 나를 발견할 수 있어요.

📊 위클리 셀프 리포트
한 주간 쌓인 성격 데이터를 바탕으로 AI가 분석해주는
'나 보고서'를 매주 받아보세요.

오늘도 당신답게, 나다운세와 함께하세요 🌱
```

**키워드:**
```
성격분석, 기질, 명리학, MBTI, 셀프케어, 타로, 성향, 자기이해, 마인드풀니스
```

**리뷰어 노트 (심사 시 작성):**
```
나다운세는 동양 명리학 이론을 기반으로 사용자의 성격과 기질을 분석하는
자기이해 서비스입니다. MBTI나 애니어그램과 유사하게, 명리학적 데이터를
활용하여 사용자가 자신의 성향을 탐색하고 이해할 수 있도록 돕습니다.
타로 카드는 심리 셀프케어 도구로 활용되며, 미래 예측이 아닌
현재 심리 상태에 대한 인사이트를 제공합니다.
```

---

## 8. 테스트 체크리스트

### 8.1 기본 기능 테스트

```
[ ] 앱 설치 및 실행
[ ] 스플래시 스크린 표시
[ ] 홈 화면 로드
[ ] 페이지 네비게이션 (React Router)
[ ] 뒤로가기 버튼 동작
[ ] 외부 링크 열기 (인앱 브라우저 vs 외부 브라우저)
```

### 8.2 로그인 테스트

```
[ ] 카카오 로그인 - 웹 팝업 동작
[ ] 카카오 로그인 - 로그인 성공 후 앱 복귀
[ ] Google 로그인 - OAuth 리다이렉트
[ ] 로그아웃 동작
[ ] 세션 유지 (앱 재시작 후)
```

### 8.3 결제 테스트

```
[ ] 결제 페이지 진입
[ ] 쿠폰 선택/적용
[ ] 카카오페이 결제
    [ ] 결제창 표시
    [ ] 카카오페이 앱 실행 (설치된 경우)
    [ ] 결제 완료 후 앱 복귀
    [ ] 결제 완료 페이지 표시
[ ] 신용카드 결제
    [ ] 카드사 앱 실행
    [ ] 결제 완료 후 앱 복귀
[ ] 결제 취소 시 동작
```

### 8.4 콘텐츠 테스트

```
[ ] 무료 콘텐츠 목록 로드
[ ] 무료 콘텐츠 결과 표시
[ ] 유료 콘텐츠 결과 표시
[ ] 태그 추출 및 저장
[ ] 나다움 태그 목록 표시
[ ] 주간 보고서 조회
```

### 8.5 iOS 전용 테스트

```
[ ] Safe Area 처리 (노치, 홈 인디케이터)
[ ] 상태바 스타일
[ ] 스와이프 뒤로가기 동작
[ ] 키보드 표시/숨김
```

### 8.6 Android 전용 테스트

```
[ ] 하드웨어 뒤로가기 버튼
[ ] 앱 전환 후 복귀
[ ] 다양한 화면 크기 대응
```

---

## 9. 트러블슈팅

### 9.1 결제 관련

**문제: 카카오페이 앱에서 결제 후 복귀 안 됨**
```
원인: 딥링크 설정 누락
해결:
1. iOS: Info.plist에 URL Scheme 추가
2. Android: AndroidManifest.xml에 intent-filter 추가
3. capacitor.config.ts의 scheme 설정 확인
```

**문제: 결제창이 새 창으로 열림**
```
원인: WebView에서 target="_blank" 처리
해결:
1. capacitor.config.ts의 allowNavigation에 도메인 추가
2. 또는 PortOne 설정에서 popup 대신 redirect 방식 사용
```

### 9.2 로그인 관련

**문제: 카카오 로그인 팝업이 안 열림**
```
원인: WebView 팝업 차단
해결:
1. throughTalk: false 확인
2. 카카오 개발자 콘솔에 플랫폼 등록 확인
3. 키 해시 (Android) / Bundle ID (iOS) 확인
```

**문제: OAuth 리다이렉트 후 앱 복귀 안 됨**
```
원인: 리다이렉트 URL 미등록
해결:
1. Supabase Dashboard → Authentication → URL Configuration
2. Site URL에 nadaunse:// 스킴 추가
3. Redirect URLs에 앱 콜백 URL 추가
```

### 9.3 빌드 관련

**문제: iOS 빌드 실패 - Signing 오류**
```
해결:
1. Xcode → Signing & Capabilities
2. Team 선택 (Apple Developer 계정)
3. Automatically manage signing 체크
```

**문제: Android 빌드 - minSdk 오류**
```
해결:
android/app/build.gradle에서:
minSdkVersion 22 이상으로 설정
```

### 9.4 일반 문제

**문제: 흰 화면만 표시됨**
```
해결:
1. npm run build 확인
2. capacitor.config.ts의 webDir 경로 확인 ('dist')
3. npx cap sync 실행
4. 개발자 도구로 콘솔 에러 확인
```

**문제: API 호출 실패 (CORS)**
```
해결:
1. capacitor.config.ts에서 CapacitorHttp 플러그인 활성화
2. 또는 프록시 설정
3. 서버의 CORS 설정 확인
```

---

## 10. 향후 확장 계획

### 10.1 Phase 2 기능 (향후)

| 기능 | 설명 | 구현 난이도 |
|------|------|-----------|
| **푸시 알림** | FCM/APNs 연동 | 중 |
| **앱 내 업데이트** | Live Update (Appflow) | 중 |
| **오프라인 지원** | 캐시 + 오프라인 모드 | 높음 |
| **위젯** | 오늘의 운세 위젯 | 높음 |
| **Apple 로그인** | App Store **필수** (소셜 로그인 있으므로) | 중 |

### 10.2 푸시 알림 구현 (예정)

```bash
# Capacitor Push Notifications 플러그인
npm install @capacitor/push-notifications
npx cap sync
```

**필요 설정:**
1. Firebase 프로젝트 생성 (FCM)
2. iOS APNs 인증서/키 설정
3. Supabase에 FCM 토큰 저장 테이블 추가
4. Edge Function에서 푸시 발송 로직 추가

### 10.3 Live Update (CodePush 대안)

앱스토어 재심사 없이 웹 코드 업데이트:

```bash
# Ionic Appflow 또는 capacitor-live-update
npm install @nicepayments/capacitor-live-update
```

**장점:**
- 긴급 버그 수정 즉시 배포
- 앱스토어 심사 대기 없음

**제한:**
- 네이티브 코드 변경은 불가
- 심각한 기능 변경은 스토어 재심사 권장

---

## 변경 이력

| 날짜 | 버전 | 변경 내용 |
|------|------|----------|
| 2026-02-04 | 1.0 | 최초 작성 |
| 2026-03-10 | 2.0 | Google Play 우선 전략으로 변경, Apple 심사 리프레이밍 전략 추가, 단계별 TODO 리스트 추가, Apple 로그인 필수 반영, IAP 판단 추가, 스토어 메타데이터 Apple/Google 분리 |
| 2026-03-10 | 2.1 | 세션 2 진행 기록: Step 1 완료, Step 2 진행 중 상태 반영. Capacitor 설치~실기기 실행, 카카오/Google OAuth 코드 수정, .env.production 생성, env.ts 프로덕션 판별 수정, 다음 세션 TODO 추가 |

---

## 참고 문서

- [Capacitor 공식 문서](https://capacitorjs.com/docs)
- [PortOne (아임포트) 모바일 연동 가이드](https://docs.iamport.kr/)
- [카카오 로그인 iOS/Android 가이드](https://developers.kakao.com/docs/latest/ko/kakaologin/common)
- [Apple App Store 심사 가이드라인](https://developer.apple.com/app-store/review/guidelines/)
- [Google Play 개발자 정책 센터](https://play.google.com/about/developer-content-policy/)
