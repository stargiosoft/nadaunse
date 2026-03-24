# 🚀 Supabase Edge Functions 배포 가이드

## ✅ Edge Functions 목록

```
/supabase/functions/
├── 🔐 인증 & 데이터 관리
│   ├── users/index.ts                      ✅ 사용자 조회/생성 (RLS 우회)
│   └── master-content/index.ts             ✅ 마스터 콘텐츠 생성 (RLS 우회)
│
└── 🤖 AI 생성
    ├── generate-saju-preview/index.ts      ✅ GPT-5.1 (사주 미리보기)
    ├── generate-tarot-preview/index.ts     ✅ GPT-4.1 (타로 미리보기)
    ├── generate-image-prompt/index.ts      ✅ GPT-5-nano (이미지 프롬프트)
    └── generate-thumbnail/index.ts         ✅ Gemini 2.5 (썸네일 생성)
```

---

## 🚀 빠른 배포 (3단계)

### 1️⃣ Supabase 연결
```bash
supabase login
supabase link --project-ref hyltbeewxaqashyivilu
```

### 2️⃣ Secrets 설정
```bash
supabase secrets set OPENAI_API_KEY=your-key-here
supabase secrets set GOOGLE_API_KEY=your-key-here
supabase secrets set REFERENCE_SWAN_IMAGE_URL=https://hyltbeewxaqashyivilu.supabase.co/storage/v1/object/public/assets/ref.png.png
```

### 3️⃣ 배포
```bash
supabase functions deploy
```

---

## ✅ 배포 확인

### 터미널
```bash
supabase functions list
```

### Supabase Dashboard
```
https://supabase.com/dashboard/project/hyltbeewxaqashyivilu/functions
```

---

## 🧪 테스트

### 실시간 로그
```bash
supabase functions logs generate-saju-preview --tail
```

### 브라우저
1. https://nadaunsae.com
2. 마스터 콘텐츠 수정
3. "예시 다시 만들기" 클릭

---

## 📊 함수별 상세

| 함수 | 모델 | 입력 | 출력 |
|------|------|------|------|
| `generate-saju-preview` | GPT-5.1 | title, description, questionerInfo, questionText | previewText |
| `generate-tarot-preview` | GPT-4.1 | questionerInfo, questionText | previewText |
| `generate-image-prompt` | GPT-5-nano | title, description, contentType | imagePrompt |
| `generate-thumbnail` | Gemini 2.5 | imagePrompt, referenceImageBase64 | imageUrl |