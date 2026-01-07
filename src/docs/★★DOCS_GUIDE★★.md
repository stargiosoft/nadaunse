# 📚 프로젝트 핵심 문서 가이드

> **최종 업데이트**: 2026-01-06

---

## 📋 문서 요약표

| 문서 | 용도 | 타겟 |
|------|------|------|
| **README.md** | 빠른 시작 | 개발자 |
| **AI_ONBOARDING.md** | AI 작업 가이드 | AI |
| **PROJECT_CONTEXT.md** | 아키텍처 + 디버깅 | AI + 개발자 |
| **DECISIONS.md** | 설계 결정 기록 | 개발자 |
| **DATABASE_SCHEMA.md** | DB 스키마 | 개발자 |
| **components-inventory.md** | 컴포넌트 목록 (52개) | 개발자 |
| **supabase/EDGE_FUNCTIONS_GUIDE.md** | Edge Functions (17개) | 개발자 |
| **supabase/DATABASE_TRIGGERS_AND_FUNCTIONS.md** | DB Triggers & Functions | 개발자 |
| **supabase/RLS_POLICIES.md** | RLS 정책 (26개) | 개발자 |

---

## 📖 문서 상세

### 1. README.md

**용도**: 빠른 시작 가이드

**타겟**: 신규 개발자

**내용**:
- 프로젝트 개요 및 설치 방법
- 환경 설정 (Supabase, Edge Functions)
- 5분 안에 개발 환경 구축 가능
- 핵심 기능 요약 (무료/유료 콘텐츠, 사주 관리)

**언제 읽나요?** 처음 프로젝트를 시작할 때 가장 먼저 읽는 문서

---

### 2. AI_ONBOARDING.md

**용도**: AI 작업 인수인계 가이드

**타겟**: AI (필독!)

**내용**:
- AI가 작업을 시작하기 전 반드시 알아야 할 핵심 규칙
- 코딩 컨벤션 (Tailwind, TypeScript, 파일 구조)
- 금지 사항 및 주의사항
- 5분 안에 작업 준비 완료

**언제 읽나요?** 새로운 AI가 프로젝트 작업을 인수받을 때 가장 먼저 읽어야 함

---

### 3. PROJECT_CONTEXT.md

**용도**: AI 디버깅 + 전체 아키텍처

**타겟**: AI, 개발자

**내용**:
- 프로젝트 전체 시스템 구조
- 무료/유료 콘텐츠 플로우
- 사주 정보 관리 시스템
- 쿠폰 시스템 아키텍처
- 주요 버그 패턴 및 해결책
- AI에게 디버깅 요청 시 함께 제공하는 컨텍스트 문서

**언제 읽나요?**
- 시스템 전체 구조를 이해하고 싶을 때
- 버그 발생 시 AI에게 전달할 때
- 신규 기능 개발 전 아키텍처 파악할 때

---

### 4. DECISIONS.md

**용도**: 아키텍처 결정 기록 (ADR)

**타겟**: 개발자

**내용**:
- "왜 이렇게 설계했는가?" 질문에 대한 답변
- 주요 기술 스택 선택 이유
- 트레이드오프 및 대안 검토 내용
- 과거 의사결정 맥락 보존

**언제 읽나요?**
- "왜 Supabase를 사용했지?" 같은 질문이 생길 때
- 리팩토링 전 원래 의도를 확인하고 싶을 때
- 새로운 팀원에게 설계 철학을 설명할 때

---

### 5. DATABASE_SCHEMA.md

**용도**: DB 스키마 상세

**타겟**: 개발자

**내용**:
- 모든 테이블 구조 (컬럼, 타입, 제약조건)
- Row Level Security (RLS) 정책
- 테이블 간 관계 (Foreign Keys)
- 인덱스 및 성능 최적화 정보

**언제 읽나요?**
- 데이터베이스 쿼리 작성할 때
- 새 테이블 추가 또는 마이그레이션 작업 시
- RLS 정책 수정이 필요할 때

---

### 6. components-inventory.md

**용도**: 컴포넌트 목록 (52개)

**타겟**: 개발자

**내용**:
- 모든 React 컴포넌트 분류별 정리
- 페이지별 컴포넌트 (홈, 프로필, 결제 등)
- UI 컴포넌트 (shadcn/ui)
- Skeleton 로딩 컴포넌트
- 각 컴포넌트의 파일 위치

**언제 읽나요?**
- "프로필 페이지 컴포넌트가 어디 있지?" 찾을 때
- 비슷한 기능의 컴포넌트 재사용하고 싶을 때
- 전체 컴포넌트 구조를 파악하고 싶을 때

---

### 7. supabase/EDGE_FUNCTIONS_GUIDE.md

**용도**: Edge Functions 가이드 (17개)

**타겟**: 개발자

**내용**:
- 모든 Edge Functions의 역할 및 용도
- 입력 파라미터 및 출력 형식
- AI 생성 함수 (GPT-4o, Claude-3.5-Sonnet)
- 쿠폰 시스템 함수
- 알림톡 발송 함수
- 각 함수의 배포 방법 및 테스트 가이드

**언제 읽나요?**
- Edge Function 작업할 때
- "쿠폰 조회 API 어떻게 호출하지?" 찾을 때
- 서버리스 함수 추가 또는 수정할 때

---

### 8. supabase/DATABASE_TRIGGERS_AND_FUNCTIONS.md

**용도**: Database Triggers & Functions

**타겟**: 개발자

**내용**:
- 5개 Database Triggers 상세 설명
- 5개 Database Functions 전체 SQL 정의
- Trigger-Function 매핑 관계
- `updated_at` 자동 갱신 패턴
- 띠(Zodiac) 계산 함수
- 사용자 자동 생성 트리거

**언제 읽나요?**
- "updated_at이 자동으로 갱신되는 이유가 뭐지?" 궁금할 때
- 새 트리거 추가 또는 수정할 때
- Database 레벨 자동화 로직을 이해하고 싶을 때

---

### 9. supabase/RLS_POLICIES.md ⭐ NEW

**용도**: RLS (Row Level Security) 정책 가이드 (26개)

**타겟**: 개발자

**내용**:
- 9개 테이블의 26개 RLS 정책 상세
- 테이블별 정책 조건 (USING, WITH CHECK)
- 역할(Role) 설명 (anon, authenticated, service_role)
- Staging ↔ Production 정책 동기화 가이드
- 정책 이관 SQL 스크립트 위치

**언제 읽나요?**
- "왜 이 데이터가 조회 안 되지?" 권한 문제 디버깅 시
- 새 테이블에 RLS 정책 추가할 때
- Staging/Production 간 정책 동기화할 때

---

## 🚀 시나리오별 문서 활용법

### 🆕 처음 프로젝트 시작할 때
→ **README.md** (5분)

### 🤖 새로운 AI가 작업 인수받을 때
→ **AI_ONBOARDING.md** (5분) + **PROJECT_CONTEXT.md** (3분)

### 🐛 버그 발생 시
→ **PROJECT_CONTEXT.md** + 버그 증상 + 로그를 AI에게 전달

### 🏗️ 아키텍처 이해할 때
→ **PROJECT_CONTEXT.md** + **DECISIONS.md**

### 🗄️ DB 작업할 때
→ **DATABASE_SCHEMA.md** + **DATABASE_TRIGGERS_AND_FUNCTIONS.md**

### 🔒 RLS/권한 문제 디버깅 시
→ **supabase/RLS_POLICIES.md**

### 🔍 컴포넌트 찾을 때
→ **components-inventory.md**

### ⚡ Edge Function 작업 시
→ **supabase/EDGE_FUNCTIONS_GUIDE.md**

### 🔧 Database 자동화 작업 시
→ **supabase/DATABASE_TRIGGERS_AND_FUNCTIONS.md**

---

## 📌 문서 업데이트 규칙

**언제 업데이트하나요?**

| 변경사항 | 업데이트할 문서 |
|----------|----------------|
| 새 컴포넌트 추가 | components-inventory.md |
| 새 Edge Function 배포 | supabase/EDGE_FUNCTIONS_GUIDE.md |
| DB 스키마 변경 | DATABASE_SCHEMA.md |
| Trigger/Function 추가 | supabase/DATABASE_TRIGGERS_AND_FUNCTIONS.md |
| RLS 정책 추가/변경 | supabase/RLS_POLICIES.md |
| 중요한 설계 결정 | DECISIONS.md |
| 시스템 아키텍처 변경 | PROJECT_CONTEXT.md |

**업데이트는 누가 하나요?**
개발자 또는 AI가 변경사항 발생 시 즉시 업데이트

---

## ✅ 문서 완성도 체크리스트

현재 프로젝트는 **9개 핵심 문서**가 모두 완비되어 있습니다.

- ✅ README.md - 빠른 시작 가이드
- ✅ AI_ONBOARDING.md - AI 온보딩
- ✅ PROJECT_CONTEXT.md - 전체 아키텍처
- ✅ DECISIONS.md - 설계 결정 기록
- ✅ components-inventory.md - 컴포넌트 목록
- ✅ DATABASE_SCHEMA.md - DB 스키마
- ✅ supabase/EDGE_FUNCTIONS_GUIDE.md - Edge Functions
- ✅ supabase/DATABASE_TRIGGERS_AND_FUNCTIONS.md - Triggers & Functions
- ✅ supabase/RLS_POLICIES.md - RLS 정책

---

## 📂 문서 파일 위치

```
나다운세 원본/
├── README.md
├── CLAUDE.md                    # Claude Code 규칙
└── src/
    ├── AI_ONBOARDING.md
    ├── PROJECT_CONTEXT.md
    ├── DECISIONS.md
    ├── DATABASE_SCHEMA.md
    ├── components-inventory.md
    ├── DOCS_GUIDE.md            # 이 문서
    └── supabase/
        ├── EDGE_FUNCTIONS_GUIDE.md
        ├── DATABASE_TRIGGERS_AND_FUNCTIONS.md
        ├── RLS_POLICIES.md      # RLS 정책
        ├── functions/           # Edge Functions 코드
        └── migrations/          # DB 마이그레이션
```
