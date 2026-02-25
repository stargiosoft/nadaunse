# 초개인화 시스템 리팩토링 - 프로덕션 배포 가이드

> **스테이징 배포 완료**: 2026-02-25
> **프로덕션 배포 완료**: 2026-02-25

---

## 변경 요약

개인화 조건을 확장하고, 콘텐츠 이용 내역 기반으로 심리 상태를 실시간 추출하여 개인화 커버리지를 대폭 향상.

- **기존**: 확인된 태그 1개 이상인 사용자만 개인화 (~30%)
- **변경**: 태그 1개+ **OR** 최근 1주 콘텐츠 이용 기록 존재 시 개인화 활성화
- **신규**: gpt-4.1-nano로 콘텐츠 이용 패턴에서 심리 상태 실시간 추출
- **신규**: `user_situation_summaries` 테이블로 weekly_report + content_answer 심리 상태 통합 관리
- **개선**: 심리 흐름을 주차별(1~4주차) 최신 1건만 AI에게 전달, "1주차=최신" 명시 안내

---

## 상세 변경 내역

### generate-content-answers (핵심)
- 초개인화 조건: 태그 1개+ **OR** 최근 1주 콘텐츠 이용 기록 존재
- 콘텐츠 이용 내역 조회: `free_content_records` + `orders` (최근 1주)
- gpt-4.1-nano로 심리 상태 추출 → `user_situation_summaries` 저장
- 심리 흐름 조회: `weekly_reports` → `user_situation_summaries` 통합 테이블로 변경
- 주차별 그룹핑: 같은 주에 여러 건이면 가장 최신 1건만 전달

### generate-saju-answer / generate-tarot-answer
- 개인화 발동 조건: `pData && (태그 있음)` → `pData` (존재하면 무조건 적용)
- `PersonalizationData` 타입에 `currentSituationSummary` 추가
- 심리 상태 프롬프트: `currentSituationSummary` 우선, fallback으로 `recentSituationSummaries`
- 주차 포맷: `1주차: ...`, `2주차: ...` 형식
- AI 안내 문구: "(1주차가 가장 최신입니다. 최신 주차의 심리 상태를 최우선으로 반영하여 풀이하십시오.)"

### generate-weekly-report
- 기존 `weekly_reports` 저장 유지 + `user_situation_summaries`에도 INSERT 추가

---

## 배포 순서 (반드시 순서대로)

### Step 1. DB 마이그레이션

프로덕션 Supabase SQL Editor 또는 MCP로 실행:

**파일**: `supabase/migrations/20260225_create_user_situation_summaries.sql`

내용:
1. `user_situation_summaries` 테이블 생성
2. 인덱스 생성
3. RLS 정책 설정
4. **기존 `weekly_reports.situation_summary` 데이터 이관** (INSERT ... SELECT)

```bash
# Supabase MCP로 실행 시
# project_id: kcthtpmxffppfbkjjkub (프로덕션)
# 마이그레이션 파일 내용 전체를 apply_migration으로 실행
```

### Step 2. Edge Functions 배포

```bash
npm run deploy:prod
```

변경된 함수 4개:
| 함수 | 변경 내용 |
|------|-----------|
| `generate-content-answers` | 초개인화 조건 확장, nano 심리 추출, 주차별 그룹핑, 새 테이블 저장/조회 |
| `generate-saju-answer` | 개인화 발동 조건 완화, 주차 포맷 + 최신 우선 안내 프롬프트 |
| `generate-tarot-answer` | 동일 (사주와 같은 변경) |
| `generate-weekly-report` | `user_situation_summaries`에 INSERT 추가 |

### Step 3. 배포 후 검증

1. **테이블 확인**: `SELECT COUNT(*) FROM user_situation_summaries;` → 기존 weekly_reports 데이터 이관 확인
2. **유료 콘텐츠 구매 테스트**: 태그 없는 사용자로 구매 → 개인화 활성화 + nano 추출 로그 확인
3. **Edge Function 로그 키워드**: `초개인화 조건`, `gpt-4.1-nano`, `user_situation_summaries`, `주차별`

---

## 수정된 파일 목록

| 파일 | 변경 유형 |
|------|-----------|
| `supabase/migrations/20260225_create_user_situation_summaries.sql` | 신규 |
| `supabase/functions/generate-content-answers/index.ts` | 수정 (핵심) |
| `supabase/functions/generate-saju-answer/index.ts` | 수정 |
| `supabase/functions/generate-tarot-answer/index.ts` | 수정 |
| `supabase/functions/generate-weekly-report/index.ts` | 수정 |
| `src/DATABASE_SCHEMA.md` | 업데이트 |

---

## 롤백 방법

Edge Functions만 롤백하면 됨 (테이블은 남겨도 무해):

```bash
# git에서 이전 커밋의 함수 코드 복원 후
npm run deploy:prod
```

테이블까지 완전 롤백 시:

```sql
DROP TABLE IF EXISTS public.user_situation_summaries;
```
