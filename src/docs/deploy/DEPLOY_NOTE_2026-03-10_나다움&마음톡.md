# 프로덕션 배포 노트 (2026-03-10)

> **staging 최신**: `a392efa8`
> **production 현재**: `82c6daab`
> **주요 기능**: 나다움 분석 시각화 개선 + 마음톡 v3 (모드 시스템 + 라운드)

---

## 1. SQL 마이그레이션 (4개) — 먼저 실행

프로덕션 Supabase (`kcthtpmxffppfbkjjkub`)에서 순서대로 실행:

### 1-1. 나다움 분석 metadata 컬럼 (이미 적용 완료 확인 필요)

```sql
-- 이미 적용되었을 수 있음. 에러나면 스킵
ALTER TABLE nadaum_analyses ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;
```

### 1-2. 마음톡 테이블 2개 생성

```sql
-- mind_talk_conversations (mode 포함 v2)
CREATE TABLE mind_talk_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_date DATE NOT NULL DEFAULT CURRENT_DATE,
  mode TEXT NOT NULL DEFAULT 'general' CHECK (mode IN ('general', 'saju', 'tarot')),
  round INTEGER NOT NULL DEFAULT 1,
  message_count INTEGER NOT NULL DEFAULT 0,
  free_messages_used INTEGER NOT NULL DEFAULT 0,
  summary TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, session_date, mode, round)
);

-- mind_talk_messages
CREATE TABLE mind_talk_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES mind_talk_conversations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  is_paid BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 인덱스
CREATE INDEX idx_mind_talk_conversations_user_date_mode_round ON mind_talk_conversations(user_id, session_date, mode, round);
CREATE INDEX idx_mind_talk_messages_conv ON mind_talk_messages(conversation_id, created_at);

-- RLS
ALTER TABLE mind_talk_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE mind_talk_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "conv_select" ON mind_talk_conversations FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "msg_select" ON mind_talk_messages FOR SELECT USING (auth.uid() = user_id);
```

### 검증 쿼리

```sql
SELECT tablename FROM pg_tables WHERE tablename LIKE 'mind_talk_%';
-- 결과: mind_talk_conversations, mind_talk_messages

SELECT column_name FROM information_schema.columns
WHERE table_name = 'mind_talk_conversations' AND column_name IN ('mode', 'round');
-- 결과: mode, round

SELECT column_name FROM information_schema.columns
WHERE table_name = 'nadaum_analyses' AND column_name = 'metadata';
-- 결과: metadata
```

---

## 2. Edge Functions 배포 (2개)

### 2-1. 나다움 분석 AI

```bash
npx supabase functions deploy generate-nadaum-analysis --no-verify-jwt --project-ref kcthtpmxffppfbkjjkub
```

- 변경: AI JSON 출력 포맷 (`{ text, score, spectrum }`), metadata JSONB 저장, 캐시 재생성 로직

### 2-2. 마음톡 AI 대화

```bash
npx supabase functions deploy mind-talk-chat --project-ref kcthtpmxffppfbkjjkub
```

- 신규: 모드별 시스템 프롬프트, 새싹 차감, 타로 카드 해석, AI 선제 인사, 라운드 시스템, 4주 심리 흐름
- **`GOOGLE_API_KEY` secret 필수**: production Supabase에 등록되어 있는지 확인

```bash
# secret 확인 (Supabase Dashboard → Edge Functions → Secrets)
# GOOGLE_API_KEY 가 등록되어 있어야 Gemini API 호출 가능
```

---

## 3. 프론트엔드 배포 (Cherry-pick)

**중요**: staging에는 미완성/디버그 코드가 섞여 있으므로 반드시 cherry-pick으로 배포.

### 3-1. 나다움 분석 관련 커밋

```
cf0f5586 fix: getAuthUser() 반환값 디스트럭처링 수정 (나다움 분석 페이지)
3cd67cc1 feat: 오행 도넛 차트, 나다움 유형 카드, 상세 분석 게이지+스펙트럼 추가
bb6b93b4 fix: 나다움 태그 모바일에서 1줄 가로 스크롤로 변경
7c2ece95 fix: metadata 없는 캐시 재생성 + 오행 도넛 디버깅 로그 추가
7f0da175 fix: zodiacCalculator 호출 시그니처 수정 (숫자→문자열)
f2d1e3f0 fix: 띠 이미지 원형 크롭 (object-cover + 풀사이즈)
5fbe1e2b feat: 상세 분석 해금을 친구 초대 기반으로 변경
42adb286 fix: 오행 도넛 안 나오는 문제 수정 (useEffect race condition)
6d5ae7f6 fix: 오행 useEffect cancelled 제거 + 의존성 saju?.id로 변경
bb55ffe4 fix: 오행 PieChart → 수평 바 차트로 교체
8cfe4183 fix: 오행 데이터를 메인 useEffect에서 동기적으로 로드
8bc62b94 debug: 오행 로드 전체 과정 콘솔 로그 추가
```

**주의**: `8bc62b94`, `925e05b6` 는 debug 커밋 (console.log 포함). 배포 전 디버그 로그 제거한 클린 커밋을 만들거나, 이 커밋들을 포함하되 배포 후 별도로 제거해야 함.

### 3-2. 마음톡 관련 커밋

```
e26177c1 feat: 마음톡 MVP (감정 체크인 + AI 채팅)
c18be75e fix: GEMINI_API_KEY → GOOGLE_API_KEY 시크릿 이름 수정
596c8f41 fix: 마음톡 아바타 이미지 교체 + 뒤로가기 버튼 추가
c2d5d021 fix: 마음톡 maxOutputTokens 300→800 (한국어 잘림 수정)
c035555d fix: 무료 횟수 소진 시 입력 비활성화 + FREE_LIMIT_REACHED 응답 처리 수정
b46f14f3 feat: 마음톡 v2 - 모드 시스템 (일반/사주/타로) + 새싹 결제
a392efa8 fix: 마음톡 채팅 스크롤 영역 하단 패딩 추가
```

### 3-3. Cherry-pick 명령어

```bash
git checkout production

# 나다움 분석 (오래된 순서대로)
git cherry-pick cf0f5586 3cd67cc1 bb6b93b4 7c2ece95 7f0da175 f2d1e3f0 5fbe1e2b 42adb286 6d5ae7f6 bb55ffe4 8cfe4183 8bc62b94

# 마음톡 (오래된 순서대로)
git cherry-pick e26177c1 c18be75e 596c8f41 c2d5d021 c035555d b46f14f3 a392efa8

git push origin production

# cherry-pick 후 역머지 (히스토리 동기화)
git checkout staging
git merge production
git push origin staging
```

**충돌 가능성**: `NadaumAnalysisPage.tsx`, `App.tsx`, `BottomTabBar.tsx`에서 충돌 가능. 충돌 시 staging 버전 유지.

---

## 4. 주요 변경 사항 요약

### 나다움 분석 시각화 개선

| 항목 | 설명 |
|------|------|
| 나다움 유형 카드 | MBTI 스타일 16유형 + 그라디언트 + 명언 + 공유 |
| 오행 에너지 차트 | 만세력 API `발달오행` 기반 수평 바 차트 (한자 키 지원) |
| 상세 분석 게이지 | ScoreGauge (반원형 0-100) + SpectrumBar (2축 스펙트럼) |
| 태그 1줄 스크롤 | 가로 스크롤 + shrink-0 |
| 상세 해금 → 초대 | 친구 초대 0/1/2/3/4명 기반 해금 (ShareRewardModal 재사용) |
| Edge Function | AI JSON 포맷 + metadata JSONB 저장 |

### 마음톡 v3 (신규 기능)

| 항목 | 설명 |
|------|------|
| 3가지 모드 | 일반(무료 무제한), 사주(3회 무료→5새싹), 타로(3회 무료→5새싹) |
| AI 선제 인사 | 심리 데이터 기반 첫 인사 |
| Gemini 2.5 Flash | SSE 스트리밍 대화 |
| 타로 카드 뽑기 | 7장 중 3장 선택 → AI 해석 오버레이 |
| 새싹 결제 | 잔액 부족 시 SproutChargingStation 오버레이 |
| 탭바 추가 | 홈 > 나다움 > **마음톡** > 프로필 |
| 라운드 시스템 | 새로고침 버튼으로 새 대화 세션 시작, 모드 전환 시 라운드 유지 |
| 4주 심리 흐름 | `user_situation_summaries` 주차별 최신 1건씩 AI에 전달 |
| SSE 버퍼 fix | 한국어 멀티바이트 flush + 잔여 buffer 처리 |

---

## 5. 배포 전 확인 사항

- [ ] 디버그 console.log 제거 (`NadaumAnalysisPage.tsx` 라인 297~318)
- [ ] staging에서 마음톡 전체 플로우 테스트 완료
- [ ] staging에서 나다움 상세 분석 score/spectrum 표시 확인
- [ ] production Supabase에 `GOOGLE_API_KEY` secret 등록 확인

---

## 6. 배포 순서 체크리스트

- [ ] 1. SQL 마이그레이션 실행 (nadaum_analyses metadata + mind_talk 2개 테이블 + round 컬럼)
- [ ] 2. SQL 검증 쿼리 실행
- [ ] 3. Edge Functions 배포 (`generate-nadaum-analysis` + `mind-talk-chat`)
- [ ] 4. `GOOGLE_API_KEY` secret 확인
- [ ] 5. 디버그 로그 제거 커밋 (NadaumAnalysisPage console.log)
- [ ] 6. Cherry-pick → production push
- [ ] 7. Vercel 배포 완료 대기
- [ ] 8. 역머지 (staging ← production)
- [ ] 9. 프로덕션 테스트:
  - [ ] 나다움 분석 페이지: 유형 카드 + 오행 바 차트 + 태그 스크롤
  - [ ] 나다움 상세 분석: ScoreGauge + SpectrumBar 표시
  - [ ] 상세 해금 → 친구 초대 모달
  - [ ] 마음톡 진입 → AI 선제 인사
  - [ ] 모드 전환 (일반/사주/타로)
  - [ ] 일반 모드: 무제한 무료 대화
  - [ ] 사주/타로 모드: 3회 무료 → 4회째 새싹 차감 확인
  - [ ] 새싹 부족 시 충전 UI 표시
  - [ ] 타로 카드 뽑기 → AI 해석
  - [ ] 새로고침 버튼 → 새 라운드 시작 (이전 대화 안 보임)
  - [ ] 새 라운드에서 모드 전환 → 이전 라운드 대화 안 보임

---

## 7. 롤백 계획

### 프론트엔드
```bash
git checkout production
git revert HEAD~N..HEAD  # cherry-pick한 커밋 수만큼
git push origin production
```

### Edge Functions
이전 코드로 재배포:
```bash
# git stash 또는 이전 커밋 checkout 후
npx supabase functions deploy generate-nadaum-analysis --no-verify-jwt --project-ref kcthtpmxffppfbkjjkub
npx supabase functions deploy mind-talk-chat --project-ref kcthtpmxffppfbkjjkub
```

### SQL (마음톡 테이블 제거)
```sql
DROP TABLE IF EXISTS mind_talk_messages;
DROP TABLE IF EXISTS mind_talk_conversations;
```

---

**작성일**: 2026-03-10
