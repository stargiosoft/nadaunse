# Supabase 환경 설정 가이드

본 문서는 Staging과 Production 환경을 분리하여 관리하는 방법을 설명합니다.

---

## 📌 환경 구성

### Production 환경
- **Project Name**: nadaunse-production
- **Project ID**: `hyltbeewxaqashyivilu`
- **URL**: `https://hyltbeewxaqashyivilu.supabase.co`
- **Anon Key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

### Staging 환경
- **Project Name**: nadaunse-staging
- **Project ID**: `kcthtpmxffppfbkjjkub`
- **URL**: `https://kcthtpmxffppfbkjjkub.supabase.co`
- **Anon Key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

---

## 🔧 자동 환경 전환 시스템

### 현재 설정

`/utils/supabase/info.tsx` 파일에서 **Vite의 `import.meta.env.MODE`**를 기반으로 자동 전환됩니다.

```typescript
const ENV = import.meta.env.MODE; // 'development', 'staging', 'production'

export const projectId = ENV === 'production' 
  ? PRODUCTION_PROJECT_ID 
  : STAGING_PROJECT_ID;
```

### 환경 전환 방법

#### 1️⃣ **개발 환경 (Figma Make)**
```bash
# 자동으로 'development' 모드로 실행 → Staging 연결
npm run dev
```
✅ **결과**: `kcthtpmxffppfbkjjkub` (Staging)

#### 2️⃣ **Staging 테스트**
```bash
# Staging 모드로 명시적 실행
npm run dev -- --mode staging
```
✅ **결과**: `kcthtpmxffppfbkjjkub` (Staging)

#### 3️⃣ **Production 빌드**
```bash
# Production 빌드
npm run build

# Production 프리뷰
npm run preview
```
✅ **결과**: `hyltbeewxaqashyivilu` (Production)

---

## 📂 파일 구조

```
/utils/supabase/info.tsx   # Supabase 환경 자동 전환 로직
/lib/supabase.ts            # Supabase 클라이언트 초기화
/.env.example               # 환경 변수 예시 파일
```

---

## 🔍 현재 환경 확인 방법

### 브라우저 콘솔 확인

앱 실행 시 콘솔에서 현재 연결된 환경을 확인할 수 있습니다:

```
🌍 [Supabase] 현재 환경: development
📌 [Supabase] Project ID: kcthtpmxffppfbkjjkub
📌 [Supabase] Environment: Staging
```

또는

```
🌍 [Supabase] 현재 환경: production
📌 [Supabase] Project ID: hyltbeewxaqashyivilu
📌 [Supabase] Environment: Production
```

---

## ⚠️ 주의사항

### 1. 환경 변수 우선순위

현재 시스템은 **Vite의 MODE**를 기준으로 동작합니다:

- `development` → Staging
- `staging` → Staging
- `production` → Production

### 2. Edge Functions 배포

Edge Functions는 각 환경별로 **별도 배포**가 필요합니다.

#### Staging 배포
```bash
# Staging 프로젝트 연결
supabase link --project-ref kcthtpmxffppfbkjjkub

# Edge Functions 배포
supabase functions deploy
```

#### Production 배포
```bash
# Production 프로젝트 연결
supabase link --project-ref hyltbeewxaqashyivilu

# Edge Functions 배포
supabase functions deploy
```

### 3. Secrets 설정

각 환경별로 **별도의 Secrets**를 설정해야 합니다.

#### Staging Secrets
```bash
supabase secrets set OPENAI_API_KEY=sk-proj-... --project-ref kcthtpmxffppfbkjjkub
supabase secrets set ANTHROPIC_API_KEY=sk-ant-... --project-ref kcthtpmxffppfbkjjkub
supabase secrets set PORTONE_API_KEY=... --project-ref kcthtpmxffppfbkjjkub
```

#### Production Secrets
```bash
supabase secrets set OPENAI_API_KEY=sk-proj-... --project-ref hyltbeewxaqashyivilu
supabase secrets set ANTHROPIC_API_KEY=sk-ant-... --project-ref hyltbeewxaqashyivilu
supabase secrets set PORTONE_API_KEY=... --project-ref hyltbeewxaqashyivilu
```

---

## 🚀 배포 전 체크리스트

### Staging 배포 전
- [ ] `/utils/supabase/info.tsx`에서 Staging 설정 확인
- [ ] Edge Functions Staging 배포 완료
- [ ] Staging Secrets 설정 완료
- [ ] Database Triggers/Functions 동기화 완료
- [ ] 브라우저 콘솔에서 환경 확인

### Production 배포 전
- [ ] `/utils/supabase/info.tsx`에서 Production 설정 확인
- [ ] Edge Functions Production 배포 완료
- [ ] Production Secrets 설정 완료
- [ ] Database 백업 완료
- [ ] Staging에서 충분한 테스트 완료
- [ ] 브라우저 콘솔에서 환경 확인

---

## 🔄 환경 동기화

### Database Schema 동기화

Staging과 Production의 스키마를 동기화하려면:

1. **Staging에서 Schema 내보내기**
```bash
supabase db dump --project-ref kcthtpmxffppfbkjjkub > staging_schema.sql
```

2. **Production에 적용**
```bash
psql -h db.hyltbeewxaqashyivilu.supabase.co -U postgres < staging_schema.sql
```

### Triggers & Functions 동기화

현재 Staging과 Production은 **동일한 Triggers & Functions**를 사용하고 있습니다.
변경 사항이 있을 경우 `/supabase/DATABASE_TRIGGERS_AND_FUNCTIONS.md` 문서를 참고하세요.

---

## 🐛 트러블슈팅

### 문제: 잘못된 환경에 연결됨

**해결방법**:
1. 브라우저 콘솔에서 현재 환경 확인
2. `import.meta.env.MODE` 값 확인
3. 필요시 `npm run dev -- --mode staging` 또는 `npm run build` 재실행

### 문제: Edge Function 호출 실패

**해결방법**:
1. Edge Functions가 해당 환경에 배포되었는지 확인
2. Secrets가 설정되었는지 확인
3. `supabase functions logs <function-name> --tail` 로그 확인

---

## 📚 관련 문서

- [Database Triggers & Functions](/supabase/DATABASE_TRIGGERS_AND_FUNCTIONS.md)
- [Edge Functions 가이드](/supabase/EDGE_FUNCTIONS_GUIDE.md)
- [프로젝트 컨텍스트](/PROJECT_CONTEXT.md)
