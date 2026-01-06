# 🔮 타로 운세 서비스 - 모바일 웹 애플리케이션

> Figma 디자인 기반 타로/사주 운세 모바일 웹 서비스  
> Supabase + AI 통합 | 무료/유료 콘텐츠 | 결제 연동  
> **최종 업데이트**: 2026-01-06

---

## 🚀 빠른 시작

### 1. 환경 설정

프로젝트 루트에 `.env` 파일 생성:

```bash
# Supabase 연결 정보
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here
```

> 💡 **보안**: AI API 키는 `.env`에 추가하지 않습니다. Supabase Secrets에서 관리됩니다.

### 2. 개발 서버 실행

```bash
npm install
npm run dev
```

### 3. 배포 환경 빌드

```bash
npm run build
# 개발용 UI 요소(테스트 버튼 등)는 자동으로 제외됩니다
```

---

## 📱 프로젝트 특징

### 모바일 최적화
- ✅ 모바일 웹 UI 전용 설계 (특히 iOS Safari 최적화)
- ✅ `transform-gpu`를 활용한 `border-radius` 렌더링 이슈 해결
- ✅ 반응형 레이아웃 (360px ~ 440px 최적화)
- ✅ 하단 고정 CTA 컴포넌트 리팩토링 완료

### 개발/배포 환경 분리
- ✅ `import.meta.env.DEV` 조건으로 개발 전용 UI 요소 분리
- ✅ 테스트 버튼, 디버깅 도구는 배포 시 자동 제외
- ✅ 프로덕션 환경에서 깔끔한 사용자 경험 보장

---

## 📚 사용 기술

### Frontend
- **React 18** + **TypeScript** - 컴포넌트 기반 UI
- **React Router v6** - 클라이언트 사이드 라우팅
- **Tailwind CSS v4.0** - 유틸리티 우선 스타일링
- **Vite** - 빌드 도구 및 개발 서버
- **shadcn/ui** - 재사용 가능한 UI 컴포넌트
- **Framer Motion** - 애니메이션 및 인터랙션

### Backend
- **Supabase** - Auth, Database, Edge Functions
- **PostgreSQL** - 관계형 데이터베이스
- **Row Level Security (RLS)** - 데이터 보안

### AI
- **OpenAI GPT-4o** - 텍스트 생성 (운세 해석)
- **Anthropic Claude-3.5-Sonnet** - 고급 AI 생성
- **Google Gemini** - 이미지 생성 (썸네일)

### Payment & Notification
- **PortOne v2** - 결제 연동
- **TalkDream API** - 카카오 알림톡 발송

### Hosting
- **Figma Make** - 개발 환경
- **Supabase** - 프로덕션 환경

---

## 📁 프로젝트 구조

```
/
├── components/              # React 컴포넌트 (52개)
│   ├── ui/                  # shadcn/ui 재사용 컴포넌트 (26개)
│   ├── skeletons/           # 로딩 스켈레톤 (5개)
│   ├── _backup/             # 백업된 컴포넌트 (사용 중지)
│   └── *.tsx                # 페이지 및 기능 컴포넌트
│
├── pages/                   # 라우트 페이지
│   ├── HomePage.tsx         # 홈 (콘텐츠 목록)
│   ├── AuthCallback.tsx     # OAuth 콜백
│   └── TarotDemo.tsx        # 타로 데모
│
├── lib/                     # 비즈니스 로직
│   ├── supabase.ts          # Supabase 클라이언트
│   ├── auth.ts              # 인증 로직
│   ├── freeContentService.ts # 무료 콘텐츠 서비스
│   ├── masterContentAI.ts   # 유료 콘텐츠 AI
│   ├── coupon.ts            # 쿠폰 관리
│   ├── zodiacUtils.ts       # 띠 계산 유틸
│   └── tarotCards.ts        # 타로 카드 데이터
│
├── supabase/functions/      # Edge Functions (17개)
│   ├── generate-free-preview/        # 무료 콘텐츠 맛보기 생성
│   ├── generate-master-content/      # 유료 콘텐츠 생성
│   ├── generate-saju-answer/         # 사주 운세 생성
│   ├── generate-tarot-answer/        # 타로 운세 생성
│   ├── get-available-coupons/        # 쿠폰 조회
│   ├── issue-welcome-coupon/         # 웰컴 쿠폰 발급
│   ├── issue-revisit-coupon/         # 재방문 쿠폰 발급
│   ├── apply-coupon-to-order/        # 쿠폰 적용
│   ├── send-alimtalk/                # 알림톡 발송
│   ├── users/                        # 사용자 관리
│   └── ...                           # 기타 8개 함수
│
├── styles/
│   └── globals.css          # Tailwind v4.0 토큰 및 전역 스타일
│
├── data/
│   └── products.ts          # 상품 데이터
│
├── utils/
│   ├── analytics.ts         # Google Analytics
│   └── scrollRestoreLogger.ts # 스크롤 복원
│
└── docs/                    # 상세 문서
    ├── AI_ONBOARDING.md     # AI 온보딩 가이드
    ├── PROJECT_CONTEXT.md   # 시스템 아키텍처 (⭐ 핵심)
    ├── DECISIONS.md         # 아키텍처 결정 기록
    ├── DATABASE_SCHEMA.md   # DB 스키마
    ├── components-inventory.md # 컴포넌트 목록 (52개)
    └── ...                  # 기타 문서
```

---

## 🎯 핵심 기능

### 1. 무료 콘텐츠
- ✅ **로그아웃 사용자도 이용 가능**
- ✅ localStorage 캐시 (휘발성)
- ✅ 로그인 시 DB 저장 옵션
- ✅ AI 맛보기 생성 (미리보기)

### 2. 유료 콘텐츠 (심화 해석판)
- ✅ **로그인 필수**
- ✅ PortOne 결제 연동
- ✅ 쿠폰 시스템 (웰컴 쿠폰, 재방문 쿠폰)
- ✅ DB 영구 저장
- ✅ 카카오 알림톡 발송

### 3. 사주 정보 관리
- ✅ 본인 사주 정보 등록
- ✅ 관계 사주 추가 (연인, 가족 등)
- ✅ 대표 사주 설정
- ✅ 프로필 페이지 통합 관리
- ✅ 음력/양력 계산 및 띠 자동 계산

### 4. 타로 서비스
- ✅ 타로 카드 섞기 애니메이션
- ✅ 카드 선택 인터랙션
- ✅ AI 타로 해석 생성

### 5. 마스터 콘텐츠 관리 (관리자)
- ✅ 콘텐츠 생성 (기본 정보 + 질문지)
- ✅ AI 썸네일 자동 생성
- ✅ 콘텐츠 수정 및 삭제
- ✅ 엑셀 업로드 지원

---

## 🗄️ Supabase 설정

### A. Edge Functions 배포

```bash
# Supabase CLI 설치
brew install supabase/tap/supabase

# 로그인 & 연결
supabase login
supabase link --project-ref YOUR_PROJECT_REF

# 전체 배포
supabase functions deploy

# 개별 함수 배포
supabase functions deploy generate-master-content
```

### B. Secrets 설정

Supabase Dashboard > Edge Functions > Settings > Secrets:

```bash
# AI API Keys
OPENAI_API_KEY=sk-proj-...
ANTHROPIC_API_KEY=sk-ant-...
GOOGLE_API_KEY=...

# Payment
PORTONE_API_KEY=...
PORTONE_STORE_ID=...

# Notification
KAKAO_ALIMTALK_API_KEY=...
TALKDREAM_AUTH_TOKEN=...

# Supabase
SUPABASE_SERVICE_ROLE_KEY=...
```

---

## 📖 상세 문서

| 문서 | 용도 | 타겟 |
|------|------|------|
| **[AI_ONBOARDING.md](./AI_ONBOARDING.md)** | 🤖 **AI 작업 인수인계 가이드** | **AI (필독!)** |
| **[PROJECT_CONTEXT.md](./PROJECT_CONTEXT.md)** | AI 디버깅 + 전체 아키텍처 | AI, 개발자 |
| **[DECISIONS.md](./DECISIONS.md)** | 아키텍처 결정 기록 | 개발자 |
| **[DATABASE_SCHEMA.md](./DATABASE_SCHEMA.md)** | DB 스키마 상세 | 개발자 |
| **[components-inventory.md](./components-inventory.md)** | 컴포넌트 목록 (52개) | 개발자 |
| **[supabase/EDGE_FUNCTIONS_GUIDE.md](./supabase/EDGE_FUNCTIONS_GUIDE.md)** | Edge Functions 가이드 (17개) | 개발자 |
| **[supabase/DATABASE_TRIGGERS_AND_FUNCTIONS.md](./supabase/DATABASE_TRIGGERS_AND_FUNCTIONS.md)** | Database Triggers & Functions | 개발자 |

---

## 📚 문서 사용 가이드

### **🆕 처음 프로젝트 시작할 때**

```bash
cat README.md  # 5분 안에 설치 & 실행
```

### **🤖 새로운 AI가 작업 인수받을 때**

```bash
cat AI_ONBOARDING.md     # 5분 - 작업 시작 가이드
cat PROJECT_CONTEXT.md   # 3분 - 시스템 전체 이해
# → 즉시 작업 시작 가능!
```

### **🐛 버그 발생 시**

```markdown
AI에게 전달:
1. PROJECT_CONTEXT.md 전체 내용
2. 버그 증상 + 로그
3. → AI가 근본 원인 분석 + 수정 코드 제공
```

### **🏗️ 아키텍처 이해할 때**

```bash
cat PROJECT_CONTEXT.md  # 전체 시스템 구조 파악
cat DECISIONS.md        # "왜 이렇게?" 대답 확인
```

### **🗄️ DB 작업할 때**

```bash
cat DATABASE_SCHEMA.md  # 테이블 구조, RLS 정책 확인
cat supabase/DATABASE_TRIGGERS_AND_FUNCTIONS.md  # 트리거/함수
```

### **🔍 컴포넌트 찾을 때**

```bash
cat components-inventory.md  # 52개 컴포넌트 분류별 위치
# 예: "프로필 페이지 어디?" → 4. 프로필 섹션
```

### **⚡ Edge Function 작업 시**

```bash
cat supabase/EDGE_FUNCTIONS_GUIDE.md  # 17개 함수 역할/입출력
# 예: "쿠폰 조회 어떻게?" → get-available-coupons 섹션
```

---

## 🤖 새로운 AI가 작업을 받았다면?

**👉 [AI_ONBOARDING.md](./AI_ONBOARDING.md) 먼저 읽기! (5분 투자 필수)**

---

## 🆘 버그 발생 시

1. **[PROJECT_CONTEXT.md](./PROJECT_CONTEXT.md)** 전체 내용을 AI에게 제공
2. 버그 증상, 로그, 관련 파일 정보 추가
3. AI가 근본 원인 분석 + 수정 코드 제공

---

## 🐛 문제 해결

### Edge Function 호출 실패
```bash
# 환경변수 확인
supabase secrets list

# 함수 재배포
supabase functions deploy

# 로그 확인
supabase functions logs generate-master-content --tail
```

### CORS 오류
- Edge Functions 코드에 CORS 헤더 포함됨
- 문제 지속 시 Supabase 프로젝트 설정 확인

### iOS Safari 렌더링 이슈
- `overflow: hidden`과 `border-radius` 조합 시 문제
- 해결: `transform-gpu` 클래스 추가

### 개발/배포 환경 UI 차이
- 개발 전용 버튼이 배포에서 보임: `import.meta.env.DEV` 체크 확인
- 빌드 시 자동으로 제거되므로 수동 처리 불필요

---

## 💰 비용 관리

### Supabase
- **무료**: Edge Functions 500K 요청/월, DB 500MB
- **Pro**: $25/월 (8GB DB, 2M Edge Functions)

### AI API
- OpenAI GPT-4o: $0.005/1K tokens (입력), $0.015/1K tokens (출력)
- Anthropic Claude-3.5-Sonnet: $0.003/1K tokens (입력), $0.015/1K tokens (출력)
- Google Gemini: 이미지 생성 사용량 기반

### PortOne 결제
- 거래 수수료: 3.3% + 부가세

---

## 🔐 보안

### API 키 보호
- ✅ 클라이언트 코드에 API 키 없음
- ✅ Supabase Secrets로 서버 측 관리
- ✅ `.env` 파일은 Git 제외 (.gitignore)

### Row Level Security (RLS)
- ✅ 대부분 테이블에 RLS 정책 적용 (`saju_records`, `orders`, `coupons` 등)
- ✅ 일부 테이블은 Edge Function에서 Service Role Key로 권한 제어
  - `users` 테이블: `users` Edge Function으로 접근 제어
  - `master_contents` 테이블: `master-content` Edge Function으로 접근 제어
- ✅ 사용자는 자신의 데이터만 접근 가능
- 📖 상세 정책은 [DATABASE_SCHEMA.md](./DATABASE_SCHEMA.md) 참고

---

## 📊 프로젝트 통계

- **총 컴포넌트**: 52개
  - 페이지 컴포넌트: 38개
  - UI/유틸리티: 14개
- **Edge Functions**: 17개
  - AI 생성: 8개 (47%)
  - 쿠폰 관리: 4개 (24%)
  - 사용자 관리: 2개 (12%)
  - 알림: 1개 (6%)
  - 서버 인프라: 2개 (12%)
- **Database Triggers**: 5개
- **Database Functions**: 5개

---

## 📞 지원

- **아키텍처 질문**: [PROJECT_CONTEXT.md](./PROJECT_CONTEXT.md) 참고
- **DB 스키마**: [DATABASE_SCHEMA.md](./DATABASE_SCHEMA.md) 참고
- **버그 리포트**: AI에게 PROJECT_CONTEXT.md + 로그 제공
- **개발 가이드**: [AI_ONBOARDING.md](./AI_ONBOARDING.md) 참고

---

## 🔄 최근 업데이트 (2026-01-06)

- ✅ 개발용 UI 요소 `import.meta.env.DEV` 조건 처리 완료
- ✅ iOS Safari `border-radius` 렌더링 이슈 해결 (`transform-gpu`)
- ✅ 하단 고정 CTA 컴포넌트 리팩토링 완료
- ✅ 모바일 웹 UI 최적화 지속 진행
- ✅ README.md 현행화 (컴포넌트 52개, Edge Functions 17개 반영)

---

Made with ❤️ for production-ready AI services
