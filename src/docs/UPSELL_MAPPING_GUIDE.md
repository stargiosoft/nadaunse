# 업셀링 자동 매핑 (generate-upsell-mapping)

> **최종 업데이트**: 2026-03-06

---

## 개요

무료 콘텐츠 생성 시 AI(GPT-4.1-nano)가 자동으로:
1. 같은 대분류(category_main)의 유료 콘텐츠 중 최적 매핑 선택
2. 후킹 멘트(upsell_hook_text) 생성
3. `master_contents` 테이블에 저장

---

## 호출 플로우

```
[프론트엔드]
  "콘텐츠 만들기" (MasterContentQuestions)
  "파일로 등록하기" (FileUploadDialog)
        │
        ▼
generate-master-content (JWT 인증)
        │
        ├── Step 1: generate-image-prompt (이미지 프롬프트)
        ├── Step 2: generate-thumbnail (썸네일 생성)
        ├── Step 3: DB에서 질문 조회
        ├── Step 4-A [무료]: generate-upsell-mapping ← 여기
        ├── Step 4-B [유료]: generate-saju/tarot-preview
        └── Step 5: status = 'ready'
```

### 핵심 포인트
- `generate-master-content`에서 **내부 fetch**로 호출 (프론트 변경 없음)
- `--no-verify-jwt` 배포 (내부 호출이므로 JWT 불필요)
- **try-catch**로 감싸져 있어 실패해도 콘텐츠 생성에 영향 없음

---

## generate-upsell-mapping 내부 로직

```
1. contentId로 무료 콘텐츠 정보 조회
   → content_type !== 'free' → 스킵
   → category_main === '기타' → 스킵

2. 무료 콘텐츠의 질문(questions) 조회

3. 같은 category_main의 유료 콘텐츠 후보 조회
   → content_type='paid', status='deployed', 최대 20개
   → 후보 0개 → 스킵

4. 각 후보의 질문도 조회

5. GPT-4.1-nano 호출
   → 무료 콘텐츠 정보 + 유료 후보 목록 전달
   → JSON 응답: { selectedContentId, hookText, strategy }

6. 응답 검증
   → selectedContentId가 후보 목록에 존재하는지 확인
   → JSON 파싱 실패 시 코드블록 제거 후 재파싱

7. master_contents UPDATE
   → recommended_paid_content_id = selectedContentId
   → upsell_hook_text = hookText
```

---

## DB 컬럼

| 컬럼 | 타입 | 설명 |
|------|------|------|
| `recommended_paid_content_id` | uuid | 추천 유료 콘텐츠 ID (FK) |
| `upsell_hook_text` | text | 후킹 멘트 (15~30자) |

---

## 스킵 조건 (정상 동작)

| 조건 | 로그 |
|------|------|
| 유료 콘텐츠 | `무료 콘텐츠가 아닙니다. 스킵.` |
| category_main = '기타' | `기타 카테고리입니다. 스킵.` |
| 유료 후보 0개 | `매핑 가능한 유료 콘텐츠가 없습니다.` |

---

## 테스트 방법

### 1. 정상 케이스
1. 관리자 페이지에서 "콘텐츠 만들기"로 무료 콘텐츠 1개 생성
   - category_main: '연애', '재물', '직장' 등 (기타 제외)
   - 같은 category_main에 `status='deployed'`인 유료 콘텐츠가 1개 이상 있어야 함
2. 생성 완료 후 DB 확인:
   ```sql
   SELECT id, title, recommended_paid_content_id, upsell_hook_text
   FROM master_contents
   WHERE id = '<생성된 콘텐츠 ID>';
   ```
3. 두 컬럼이 NULL이 아니면 성공

### 2. 파일 업로드 케이스
1. "파일로 등록하기"로 무료 콘텐츠 업로드
2. 동일하게 DB 확인

### 3. 스킵 케이스
1. category_main = '기타'인 무료 콘텐츠 생성
2. DB에서 두 컬럼이 NULL이면 정상

### 4. 프론트 확인
- 생성된 무료 콘텐츠 결과 화면에서 후킹 멘트 + 추천 유료 콘텐츠 카드 표시 확인

---

## 디버깅

### 로그 확인
```bash
# 스테이징
npx supabase functions logs generate-upsell-mapping --project-ref hyltbeewxaqashyivilu

# 프로덕션
npx supabase functions logs generate-upsell-mapping --project-ref kcthtpmxffppfbkjjkub

# generate-master-content 쪽 로그 (호출부)
npx supabase functions logs generate-master-content --project-ref hyltbeewxaqashyivilu
```

### 주요 로그 패턴

| 로그 | 의미 |
|------|------|
| `[upsell-mapping] 시작: <id>` | 함수 진입 |
| `유료 후보 N개 발견` | 후보 조회 성공 |
| `GPT-4.1-nano 호출 시작` | AI 호출 직전 |
| `AI 응답: {...}` | AI 원본 응답 |
| `완료! 매핑: <id>, 멘트: <text>` | 성공 |
| `업셀링 매핑 실패 (무시)` | generate-master-content 쪽 catch (함수 호출 자체 실패) |

### 자주 발생할 수 있는 문제

| 증상 | 원인 | 해결 |
|------|------|------|
| 두 컬럼 모두 NULL | AI 호출 실패 또는 스킵 조건 해당 | 로그에서 스킵 사유 확인 |
| hookText가 부자연스러움 | AI 품질 이슈 | 프롬프트 조정 또는 수동 수정 |
| 잘못된 유료 콘텐츠 매핑 | AI 판단 오류 | 관리자 페이지에서 수동 변경 |
| `OpenAI API 오류: 429` | Rate limit | 잠시 후 재시도 (수동 트리거 필요) |
| `JSON 파싱 실패` | AI가 비정상 형식 응답 | 로그에서 원본 응답 확인 |
| `유효하지 않은 콘텐츠 ID` | AI가 후보 목록에 없는 ID 반환 | 로그 확인, 재실행 시 보통 해결됨 |

### 수동 재실행 (실패 시)

DB에서 직접 NULL로 남아있는 경우, Edge Function을 수동 호출:
```bash
curl -X POST \
  'https://<PROJECT_REF>.supabase.co/functions/v1/generate-upsell-mapping' \
  -H 'Content-Type: application/json' \
  -d '{"contentId": "<콘텐츠 UUID>"}'
```

---

## 관련 파일

| 파일 | 역할 |
|------|------|
| `supabase/functions/generate-upsell-mapping/index.ts` | Edge Function 본체 |
| `supabase/functions/generate-master-content/index.ts` (295행) | 호출부 (무료 분기) |
| `scripts/deploy-production.bat` | 프로덕션 배포 스크립트 |
| `scripts/deploy-staging.bat` | 스테이징 배포 스크립트 |

---

## 배포

```bash
# 스테이징
npx supabase functions deploy generate-upsell-mapping --no-verify-jwt --project-ref hyltbeewxaqashyivilu

# 프로덕션
npx supabase functions deploy generate-upsell-mapping --no-verify-jwt --project-ref kcthtpmxffppfbkjjkub

# generate-master-content도 함께 재배포 (호출부 변경)
npx supabase functions deploy generate-master-content --project-ref hyltbeewxaqashyivilu
npx supabase functions deploy generate-master-content --project-ref kcthtpmxffppfbkjjkub
```
