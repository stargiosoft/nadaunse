# 프로덕션 배포 노트 (2026-03-05)

> **staging 커밋**: 최신 ~ `838c5c69` (가장 오래된 미배포)
> **production 현재**: `c0903e1b`
> **변경 파일**: 90개+ (코드 + 문서 + docs 폴더 재구성)

---

## 1. SQL 마이그레이션 (5개) — 먼저 실행

프로덕션 Supabase SQL Editor에서 순서대로 실행:

```
supabase/migrations/20260304_add_longtail_blog_posts.sql           → 롱테일 블로그 포스트 추가
supabase/migrations/20260305_add_mission_reward_rpc.sql            → process_mission_reward RPC (새싹 리워드)
supabase/migrations/20260305_create_anonymous_consult_views.sql    → 비회원 상담 제한 테이블
supabase/migrations/20260305_create_user_consult_daily.sql         → 로그인 유저 상담 일일 제한 테이블
supabase/migrations/20260305_cleanup_user_consult_daily_cron.sql   → pg_cron 일일 자동 정리
```

### 실행 순서
1. `20260304_add_longtail_blog_posts.sql`
2. `20260305_add_mission_reward_rpc.sql`
3. `20260305_create_anonymous_consult_views.sql`
4. `20260305_create_user_consult_daily.sql`
5. `20260305_cleanup_user_consult_daily_cron.sql`

### 검증
```sql
-- process_mission_reward 함수 존재 확인
SELECT routine_name FROM information_schema.routines WHERE routine_name = 'process_mission_reward';

-- anonymous_consult_views 테이블 존재 확인
SELECT tablename FROM pg_tables WHERE tablename = 'anonymous_consult_views';

-- user_consult_daily 테이블 존재 확인
SELECT tablename FROM pg_tables WHERE tablename = 'user_consult_daily';

-- pg_cron 스케줄 확인
SELECT jobname, schedule FROM cron.job WHERE jobname = 'cleanup-user-consult-daily';
```

---

## 2. Edge Functions 배포 (3개 신규 + 2개 수정)

### 신규 함수 (3개)
| 함수 | --no-verify-jwt | 설명 |
|------|----------------|------|
| `grant-mission-sprout` | 불필요 (JWT 필수) | 태그 5개 달성 새싹 30 리워드 |
| `generate-saju-consult` | 불필요 (JWT 필수) | 사주 상담 AI 답변 생성 |
| `generate-tarot-consult` | 불필요 (인증 불필요지만 anon key 사용) | 타로 상담 AI 답변 생성 |

### 수정 함수 (3개)
| 함수 | 변경 내용 |
|------|-----------|
| `generate-content-answers` | 마이너 수정 (8줄) |
| `generate-saju-consult` | flow 동적 영역 + 로그인 유저 일일 제한 |
| `generate-tarot-consult` | 로그인 유저 일일 제한 추가 |

### 배포 명령어
```bash
# 방법 1: deploy 스크립트 사용 (전체 41개 배포)
npm run deploy:prod

# 방법 2: 신규/수정 함수만 개별 배포
npx supabase functions deploy grant-mission-sprout --project-ref kcthtpmxffppfbkjjkub
npx supabase functions deploy generate-saju-consult --project-ref kcthtpmxffppfbkjjkub
npx supabase functions deploy generate-tarot-consult --project-ref kcthtpmxffppfbkjjkub
npx supabase functions deploy generate-content-answers --project-ref kcthtpmxffppfbkjjkub
```

---

## 3. 프론트엔드 배포 (Git merge → Vercel 자동 배포)

```bash
git checkout production
git merge staging
git push origin production
# → Vercel이 자동으로 nadaunse.com 배포
```

---

## 4. 주요 변경 사항 요약

### 🏠 홈 고도화 (가장 큰 변경)
- **HomeScreenNew.tsx**: 기존 HomePage.tsx 교체, DB 연동 완료
- NEW 무료 운세 스와이프, BEST 운세 탭, 검색, 사주/타로 상담
- 신규 페이지 11개, 컴포넌트 3개, 유틸리티 3개
- 에셋: PNG 18개 (public/home-v2/), SVG 13개, Lottie 1개
- 의존성: `fuse.js` 추가

### 🌱 태그 미션 리워드 전환
- 태그 5개 달성 시 미션 쿠폰(12,900원) → **새싹 30개 즉시 지급**으로 변경
- `CompletionCoupon.tsx` 삭제, `/report-completion/:id` 라우트 제거
- 보고서 응원글 "완료" → 항상 `/my-report-list`로 이동

### 🔮 사주/타로 상담 (신규 기능)
- `generate-saju-consult`: GPT-4.1-mini 사주 상담
- `generate-tarot-consult`: GPT-4.1-mini 타로 상담
- 비회원 1회 체험 (fingerprint 기반, `anonymous_consult_views` 테이블)
- 로그인 유저 하루 1회 서버 제한 (`user_consult_daily` 테이블 + pg_cron 일일 정리)
- 사주 상담 '이렇게 흘러가요' 섹션: 고정 3개(일/학업, 인간관계, 재물) → 질문 맞춤 동적 영역

### 📂 docs 폴더 재구성
- `src/docs/` 하위를 `business/`, `deploy/`, `develop/`, `plan/` 으로 분류
- 기존 `★...★.md` 7개 파일 → 하위 폴더로 이동

### 기타
- 무료 상세 페이지 UI 개선
- MasterContentDetailPage 탭바 애니메이션 개선
- 공유 리워드 모달 UI 개선
- LoginBottomSheet props 확장 (범용화)
- SEO: 롱테일 블로그 포스트 추가

---

## 5. 배포 순서 체크리스트

- [ ] 1. SQL 마이그레이션 5개 실행 (프로덕션 Supabase SQL Editor)
- [ ] 2. SQL 검증 쿼리 실행 (테이블 + pg_cron 확인)
- [ ] 3. Edge Functions 배포 (`npm run deploy:prod` 또는 개별 배포)
- [ ] 4. Edge Function 배포 확인 (Supabase Dashboard → Edge Functions)
- [ ] 5. `git checkout production && git merge staging && git push origin production`
- [ ] 6. Vercel 배포 완료 대기
- [ ] 7. 프로덕션 테스트:
  - [ ] 홈 화면 로딩 + 무료/유료 운세 클릭
  - [ ] 사주 상담 체험 (비회원)
  - [ ] 타로 상담 체험 (비회원)
  - [ ] 태그 5개 달성 → 새싹 30 리워드 지급 확인
  - [ ] 보고서 응원글 → "완료" → /my-report-list 이동 확인
  - [ ] 사주 상담 일일 제한 테스트 (로그인 유저 2회 시도 → 차단)
  - [ ] 사주 상담 '이렇게 흘러가요' 동적 영역 확인

---

## 6. 롤백 계획

### 프론트엔드
```bash
git checkout production
git revert HEAD
git push origin production
```

### Edge Functions
이전 버전은 Supabase에서 자동 관리. 문제 시 이전 코드로 재배포.

### SQL
`process_mission_reward` 함수 삭제:
```sql
DROP FUNCTION IF EXISTS process_mission_reward(uuid, integer);
```
`anonymous_consult_views` 테이블 삭제:
```sql
DROP TABLE IF EXISTS anonymous_consult_views;
```
`user_consult_daily` 테이블 + cron 삭제:
```sql
SELECT cron.unschedule('cleanup-user-consult-daily');
DROP TABLE IF EXISTS user_consult_daily;
```

---

**작성일**: 2026-03-05
