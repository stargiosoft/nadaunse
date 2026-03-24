# 🔐 마스터 콘텐츠 Edge Function 가이드

## 📌 개요

마스터 콘텐츠 생성 시 RLS(Row Level Security) 정책으로 인해 발생하는 권한 문제를 해결하기 위해 `master-content` Edge Function을 도입했습니다.

### 문제점
- `master_contents` 테이블에 RLS가 활성화되어 있어 클라이언트에서 직접 INSERT 불가
- `master_content_questions` 테이블도 동일한 문제 발생
- 기존 방식: 클라이언트에서 `supabase.from('master_contents').insert()` 호출 → 실패

### 해결책
- `users` Edge Function과 동일한 패턴 적용
- JWT 토큰으로 사용자 인증
- `service_role` 키로 RLS 우회하여 DB 접근
- 트랜잭션 형태로 콘텐츠와 질문을 함께 생성

---

## 🚀 배포 방법

### 1. Supabase CLI 설치 (이미 완료된 경우 스킵)

```bash
brew install supabase/tap/supabase
```

### 2. Supabase 프로젝트 연결

```bash
supabase login
supabase link --project-ref hyltbeewxaqashyivilu
```

### 3. Edge Function 배포

```bash
# 전체 배포 (권장)
supabase functions deploy

# 또는 개별 배포
supabase functions deploy master-content
```

### 4. 배포 확인

```bash
# CLI에서 확인
supabase functions list

# 또는 대시보드에서 확인
# https://supabase.com/dashboard/project/hyltbeewxaqashyivilu/functions
```

---

## 📋 API 명세

### 엔드포인트
```
POST https://hyltbeewxaqashyivilu.supabase.co/functions/v1/master-content
```

### 요청 헤더
```
Authorization: Bearer {JWT_TOKEN}
Content-Type: application/json
```

### 요청 본문
```typescript
{
  action: 'create',
  content_data: {
    content_type: 'paid' | 'free',
    category_main: string,
    category_sub: string,
    title: string,
    questioner_info?: string,
    description?: string,
    user_concern?: string,
    price_original: number,
    price_discount: number,
    discount_rate: number,
    status?: string,           // 기본값: 'loading'
    view_count?: number,       // 기본값: 0
    weekly_clicks?: number     // 기본값: 0
  },
  questions: [
    {
      question_order: number,
      question_text: string,
      question_type: 'saju' | 'tarot'
    }
  ]
}
```

### 성공 응답 (201 Created)
```typescript
{
  success: true,
  content: {
    id: number,
    content_type: 'paid' | 'free',
    category_main: string,
    category_sub: string,
    title: string,
    // ... 기타 master_contents 필드
  },
  message: '마스터 콘텐츠가 성공적으로 생성되었습니다.'
}
```

### 에러 응답
```typescript
// 401 Unauthorized
{
  error: 'Authorization 헤더가 없습니다.'
}
// 또는
{
  error: '유효하지 않은 토큰입니다.'
}

// 400 Bad Request
{
  error: 'content_data가 필요합니다.'
}
// 또는
{
  error: 'questions가 필요합니다.'
}

// 500 Internal Server Error
{
  error: '콘텐츠 저장 실패',
  details: string,
  code: string
}
```

---

## 💡 클라이언트 사용 예시

### MasterContentQuestions.tsx 변경 사항

**이전 (직접 DB 접근 - 실패)**
```typescript
const { data: contentData, error: contentError } = await supabase
  .from('master_contents')
  .insert([insertData])
  .select()
  .single();

if (contentError) {
  alert('저장에 실패했습니다.');
  return;
}

const { error: questionsError } = await supabase
  .from('master_content_questions')
  .insert(questionInserts);
```

**이후 (Edge Function 호출 - 성공)**
```typescript
// 1. JWT 토큰 가져오기
const { data: { session } } = await supabase.auth.getSession();

// 2. Edge Function 호출
const { data: createResult, error: createError } = await supabase.functions.invoke(
  'master-content',
  {
    headers: {
      Authorization: `Bearer ${session.access_token}`,
    },
    body: {
      action: 'create',
      content_data: contentData,
      questions: questionInserts,
    },
  }
);

// 3. 결과 확인
if (createError || !createResult?.success) {
  alert(`저장에 실패했습니다.\n${createError?.message || createResult?.error}`);
  return;
}

console.log('✅ 마스터 콘텐츠 생성 완료:', createResult.content);
```

---

## 🔒 보안 특징

### JWT 인증
- 모든 요청에 유효한 JWT 토큰 필수
- `supabase.auth.getSession()`으로 토큰 자동 획득
- Edge Function 내부에서 `getUser(token)`으로 검증

### Service Role 권한
- Edge Function은 `SUPABASE_SERVICE_ROLE_KEY` 사용
- RLS 정책을 우회하여 DB 접근 가능
- 클라이언트에서는 service_role 키에 절대 접근 불가

### 트랜잭션 보장
- `master_contents` 생성 성공 후 `master_content_questions` 생성
- 질문 저장 실패 시 콘텐츠 자동 삭제 (롤백)
- 데이터 일관성 보장

---

## 🧪 테스트 방법

### 1. 브라우저에서 테스트
1. 마스터 권한으로 로그인
2. 마스터 콘텐츠 만들기 페이지 접속
3. 기본 정보 입력 → 다음
4. 질문지 입력 → 저장하기
5. 개발자 도구 > Console 확인:
   ```
   📦 Edge Function 호출 데이터: {...}
   ✅ 마스터 콘텐츠 생성 완료: {...}
   ```

### 2. Edge Function 로그 확인
```bash
# 실시간 로그 모니터링
supabase functions logs master-content --tail

# 출력 예시:
# ✅ JWT 검증 성공 - User ID: xxx
# 📝 마스터 콘텐츠 데이터: {...}
# ✅ 콘텐츠 저장 완료: {...}
# 📝 질문 데이터: [...]
# ✅ 질문 저장 완료
```

### 3. 데이터베이스 확인
```sql
-- 마스터 콘텐츠 확인
SELECT * FROM master_contents ORDER BY created_at DESC LIMIT 1;

-- 질문 확인
SELECT * FROM master_content_questions 
WHERE content_id = {생성된_콘텐츠_ID} 
ORDER BY question_order;
```

---

## 🐛 문제 해결

### "Authorization 헤더가 없습니다" 오류
- 원인: JWT 토큰이 전달되지 않음
- 해결: `supabase.auth.getSession()` 호출 확인
- 확인: 사용자가 로그인 상태인지 체크

### "유효하지 않은 토큰입니다" 오류
- 원인: JWT 토큰이 만료되었거나 손상됨
- 해결: 로그아웃 후 다시 로그인
- 확인: `localStorage.getItem('supabase.auth.token')` 확인

### "콘텐츠 저장 실패" 오류
- 원인: 필수 필드 누락 또는 타입 불일치
- 해결: `content_data` 객체의 모든 필수 필드 확인
- 로그: Edge Function 로그에서 상세 에러 확인

### "질문 저장 실패" 오류
- 원인: `questions` 배열이 비어있거나 형식 오류
- 해결: 질문 배열에 최소 1개 이상의 질문 포함
- 자동 롤백: 콘텐츠도 자동 삭제됨

---

## 📊 users vs master-content 비교

| 항목 | users | master-content |
|------|-------|----------------|
| **목적** | 사용자 생성/조회 | 마스터 콘텐츠 생성 |
| **테이블** | `users` | `master_contents`, `master_content_questions` |
| **액션** | `get`, `create`, `get_or_create` | `create` |
| **트랜잭션** | 단일 테이블 | 2개 테이블 (롤백 지원) |
| **인증** | JWT 토큰 | JWT 토큰 |
| **권한** | service_role | service_role |
| **응답** | `{ success, user }` | `{ success, content, message }` |

---

## 🎯 다음 단계

### ✅ 완료됨
- Edge Function 코드 작성
- MasterContentQuestions.tsx 수정
- 문서 업데이트

### ⏳ TODO
1. Edge Function 배포 (`supabase functions deploy`)
2. 브라우저에서 테스트
3. RLS 정책 검토 (master_contents, master_content_questions)
4. 프로덕션 환경 테스트

---

## 📚 관련 문서

- [Edge Functions 배포 가이드](/docs/DEPLOYMENT_GUIDE.md)
- [Edge Functions 요약](/docs/EDGE_FUNCTIONS_SUMMARY.md)
- [Users Edge Function 코드](/supabase/functions/users/index.ts)
- [Master Content Edge Function 코드](/supabase/functions/master-content/index.ts)

---

Made with 🔐 for secure master content creation
