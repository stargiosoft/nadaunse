# 📦 Edge Functions 코드 요약

## 🎯 전체 구조

### 공통 CORS 헤더
```typescript
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}
```

---

## 🔐 인증 & 데이터 관리

### users (사용자 조회/생성)

**경로**: `/supabase/functions/users/index.ts`

**목적**: RLS를 우회하여 사용자 생성/조회 (service_role 권한)

**인증**: JWT 토큰 (Authorization 헤더)

**입력**:
```typescript
{
  action: 'get_or_create' | 'get' | 'create',
  user_data?: {
    email?: string,
    name?: string,
    avatar_url?: string,
    provider?: string,
    nickname?: string,
    profile_image?: string
  }
}
```

**응답**:
```typescript
{
  success: true,
  user: {
    id: string,
    email: string,
    nickname: string,
    provider: string,
    provider_id: string,
    profile_image: string,
    is_new: boolean
  }
}
```

**특징**:
- JWT 검증 후 service_role로 DB 접근
- RLS 정책 우회
- get_or_create로 자동 생성 지원

---

### master-content (마스터 콘텐츠 생성)

**경로**: `/supabase/functions/master-content/index.ts`

**목적**: RLS를 우회하여 마스터 콘텐츠 및 질문 생성 (service_role 권한)

**인증**: JWT 토큰 (Authorization 헤더)

**입력**:
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
    status?: string,
    view_count?: number,
    weekly_clicks?: number
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

**응답**:
```typescript
{
  success: true,
  content: {
    id: number,
    // ... master_contents 테이블 모든 필드
  },
  message: '마스터 콘텐츠가 성공적으로 생성되었습니다.'
}
```

**특징**:
- JWT 검증 후 service_role로 DB 접근
- RLS 정책 우회
- master_contents와 master_content_questions를 트랜잭션처럼 처리
- 질문 저장 실패 시 콘텐츠 자동 롤백

---

## 🤖 AI 생성 Functions

## 1️⃣ generate-saju-preview (GPT-5.1)

**경로**: `/supabase/functions/generate-saju-preview/index.ts`

**입력**:
```typescript
{ title, description, questionerInfo, questionText }
```

**API 호출**:
```typescript
{
  model: 'gpt-5.1',
  input: prompt,
  reasoning: { effort: 'low' },
  text: { verbosity: 'low' }
}
```

**응답 구조**:
```typescript
data.output_text  // GPT-5.1 전용
```

---

## 2️⃣ generate-tarot-preview (GPT-4.1)

**경로**: `/supabase/functions/generate-tarot-preview/index.ts`

**입력**:
```typescript
{ questionerInfo, questionText }
```

**API 호출**:
```typescript
{
  model: 'gpt-4.1',
  input: prompt
}
```

**응답 구조**:
```typescript
data.output[0].content[0].text  // GPT-4.1 전용
```

---

## 3️⃣ generate-image-prompt (GPT-5-nano)

**경로**: `/supabase/functions/generate-image-prompt/index.ts`

**입력**:
```typescript
{ title, description, contentType }
```

**API 호출**:
```typescript
{
  model: 'gpt-5-nano',
  input: prompt
}
```

**응답 구조**:
```typescript
data.output[0].content[0].text  // GPT-5-nano 전용
```

---

## 4️⃣ generate-thumbnail (Gemini 2.5)

**경로**: `/supabase/functions/generate-thumbnail/index.ts`

**입력**:
```typescript
{ imagePrompt, referenceImageBase64? }
```

**API 호출**:
```typescript
{
  contents: [{
    parts: [
      { inlineData: { mimeType: 'image/png', data: base64 } },
      { text: fullPrompt }
    ]
  }]
}
```

**응답 구조**:
```typescript
part.inlineData.data  // Gemini 전용 (camelCase)
```

**특징**: Supabase Storage에서 레퍼런스 이미지 자동 다운로드

---

## 🔐 환경 변수

```typescript
OPENAI_API_KEY          // OpenAI API (GPT 모델)
GOOGLE_API_KEY          // Google API (Gemini 모델)
REFERENCE_SWAN_IMAGE_URL // 레퍼런스 이미지 URL
```

---

## 📊 모델별 비교

| 모델 | API | 응답 구조 | 용도 |
|------|-----|----------|------|
| GPT-5.1 | `/v1/responses` | `output_text` | 사주 미리보기 |
| GPT-4.1 | `/v1/responses` | `output[0].content[0].text` | 타로 미리보기 |
| GPT-5-nano | `/v1/responses` | `output[0].content[0].text` | 이미지 프롬프트 |
| Gemini 2.5 | `/v1beta/.../generateContent` | `inlineData.data` | 썸네일 생성 |