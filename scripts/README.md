# Edge Functions 배포 스크립트

## 스크립트 목록

| 스크립트 | 설명 |
|----------|------|
| `deploy-production.bat` | 프로덕션 전체 배포 (24개 함수) |
| `deploy-staging.bat` | 스테이징 전체 배포 (24개 함수) |
| `deploy-core.bat` | 핵심 함수만 배포 (4개, 환경 선택) |

## 사용 방법

### 방법 1: 배치 파일 직접 실행
```bash
# 프로덕션 전체 배포
scripts\deploy-production.bat

# 스테이징 전체 배포
scripts\deploy-staging.bat

# 핵심 함수만 배포 (환경 선택 가능)
scripts\deploy-core.bat
```

### 방법 2: npm scripts 사용
```bash
# 프로덕션 전체 배포
npm run deploy:prod

# 스테이징 전체 배포
npm run deploy:staging

# 프로덕션 핵심 함수만 (한 줄 명령)
npm run deploy:prod:core
```

## ⚠️ 중요: --no-verify-jwt 필수 함수

아래 함수들은 `generate-content-answers`에서 **내부 호출**되므로 반드시 `--no-verify-jwt` 플래그로 배포해야 합니다:

| 함수 | 이유 |
|------|------|
| `generate-saju-answer` | 사주 답변 생성 (내부 호출) |
| `generate-tarot-answer` | 타로 답변 생성 (내부 호출) |
| `send-alimtalk` | 알림톡 발송 (내부 호출) |

### 왜 --no-verify-jwt가 필요한가?

```
generate-content-answers (프론트엔드에서 호출)
    │
    ├── Authorization: Bearer {USER_JWT}  ← 사용자 JWT로 인증
    │
    └── 내부적으로 다른 함수 호출 시
        │
        └── Authorization: Bearer {SERVICE_ROLE_KEY}  ← Service Role Key 사용
            │
            └── ❌ JWT 검증 실패 (Service Role Key는 JWT가 아님)
```

**해결**: 내부 호출되는 함수는 JWT 검증을 비활성화 (`--no-verify-jwt`)

## 환경 정보

| 환경 | Project Ref | 용도 |
|------|-------------|------|
| Production | `kcthtpmxffppfbkjjkub` | nadaunse.com |
| Staging | `hyltbeewxaqashyivilu` | 테스트/Preview |

## 배포된 Edge Functions (24개)

### AI 생성 (10개)
- `generate-content-answers` - 유료 콘텐츠 답변 생성 (진입점)
- `generate-saju-answer` - 사주 답변 생성 (**--no-verify-jwt**)
- `generate-tarot-answer` - 타로 답변 생성 (**--no-verify-jwt**)
- `generate-free-preview` - 무료 콘텐츠 생성
- `generate-saju-preview` - 사주 미리보기
- `generate-tarot-preview` - 타로 미리보기
- `generate-master-content` - 마스터 콘텐츠 생성
- `generate-image-prompt` - 이미지 프롬프트 생성
- `generate-thumbnail` - 썸네일 생성
- `extract-trait-tags` - 나다움 태그 추출

### 쿠폰 관리 (4개)
- `get-available-coupons` - 사용 가능 쿠폰 조회
- `apply-coupon-to-order` - 쿠폰 적용
- `issue-welcome-coupon` - 웰컴 쿠폰 발급
- `issue-revisit-coupon` - 재방문 쿠폰 발급

### 결제/환불 (3개)
- `payment-webhook` - 결제 웹훅
- `process-payment` - 결제 처리
- `process-refund` - 환불 처리

### 알림 (2개)
- `send-alimtalk` - 알림톡 발송 (**--no-verify-jwt**)
- `send-report-alimtalk` - 보고서 알림톡

### 주간 보고서 (2개)
- `generate-weekly-report` - 주간 보고서 생성
- `generate-weekly-reports-batch` - 주간 보고서 일괄 생성

### 기타 (3개)
- `generate-sitemap` - 사이트맵 생성
- `sentry-slack-webhook` - Sentry → Slack 알림
- `users` - 사용자 관리

## 문제 해결

### "Invalid JWT" 에러 발생 시
```bash
# 내부 호출 함수들 재배포
npx supabase functions deploy generate-saju-answer --no-verify-jwt --project-ref kcthtpmxffppfbkjjkub
npx supabase functions deploy generate-tarot-answer --no-verify-jwt --project-ref kcthtpmxffppfbkjjkub
npx supabase functions deploy send-alimtalk --no-verify-jwt --project-ref kcthtpmxffppfbkjjkub
```

### 특정 함수만 배포하기
```bash
# 프로덕션
npx supabase functions deploy [함수명] --project-ref kcthtpmxffppfbkjjkub

# 스테이징
npx supabase functions deploy [함수명] --project-ref hyltbeewxaqashyivilu
```
