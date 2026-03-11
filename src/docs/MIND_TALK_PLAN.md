# 마음톡 기능 개발 계획

> **상태**: MVP v3 구현 완료 (스테이징)
> **최종 업데이트**: 2026-03-10

---

## 1. 개요

### 컨셉
**"나보다 나를 더 잘 아는 AI 친구"**

나다움 데이터(성향 태그, 심리 상황 요약) 기반으로 개인화된 AI 상담 서비스.
일반 대화 / 사주 상담 / 타로 상담 3가지 모드를 제공하며,
AI가 사용자의 심리 데이터를 바탕으로 먼저 말을 걸어주는 **선제 인사** 방식.

### 차별점
- **기존 AI 상담**: 매번 처음부터 상황 설명 필요
- **마음톡**: 나다움 태그 + 4주 심리 흐름이 시스템 프롬프트에 포함 → 맥락 있는 공감
- **3가지 모드**: 일반(일상 대화), 사주(운세 상담), 타로(카드 뽑기 + 해석)

### 탭바 위치
- 하단 탭바 3번째 탭: 홈 | 나다움 | **마음톡** | 프로필
- 탭 아이콘: 말풍선 + 점 3개 SVG

---

## 2. 현재 구현 상태 (v3 - 스테이징)

### 완료된 기능
- [x] 탭바 추가 + 라우팅 (`/maumtalk`)
- [x] DB 테이블 2개 (`mind_talk_conversations`, `mind_talk_messages`)
- [x] **모드 시스템**: 일반/사주/타로 칩 셀렉터 (모드별 색상 테마)
- [x] **AI 선제 인사**: 페이지 진입 시 심리 데이터 기반 첫 인사
- [x] **AI 대화**: Gemini 2.5 Flash SSE 스트리밍
- [x] **모드별 과금**: 일반=무제한 무료, 사주/타로=3회 무료→5새싹/회
- [x] **새싹 차감**: optimistic lock + `sprout_transactions` 기록
- [x] **새싹 부족 시**: `SproutChargingStation` 오버레이 (즉시 충전)
- [x] **타로 카드 뽑기**: 7장 중 3장 선택 → 카드 확인 → AI 해석 오버레이
- [x] 모드별 추천 질문 (대화 시작 도우미)
- [x] 메시지 버블 + 타이핑 인디케이터 + 스트리밍 표시
- [x] 미로그인 안내 화면
- [x] **라운드 시스템**: 새로고침 버튼으로 새 대화 세션 시작 (이전 대화 히스토리 분리)
- [x] **4주 심리 흐름**: 주차별 최신 1건씩 AI에 전달 (`generate-content-answers`와 동일 로직)
- [x] **SSE 버퍼 fix**: 한국어 멀티바이트 잔여분 flush + 잔여 buffer 처리

### 미완료 / TODO
- [ ] 대화 히스토리 열람 (과거 세션 목록)
- [ ] 주간/월간 감정 리포트
- [ ] 나다움 DNA 6축 / 16가지 유형 시스템 프롬프트 반영
- [ ] 대화 세션 요약 저장
- [ ] 대화 속 나다움 태그 자동 추출
- [ ] 알림톡 연동
- [ ] production 배포 (마이그레이션 + Edge Function)

---

## 3. 아키텍처

### 3.1 모드별 동작

| 모드 | 과금 | AI 역할 | 특수 기능 |
|------|------|---------|-----------|
| 일반 (`general`) | 무제한 무료 | 마음 친구 '마음이' (편안한 반말) | 추천 질문 |
| 사주 (`saju`) | 3회 무료 → 5새싹/회 | 사주 상담사 (오행/운세 해석) | 운세 관련 추천 질문 |
| 타로 (`tarot`) | 3회 무료 → 5새싹/회 | 타로 상담사 (카드 해석) | 카드 뽑기 오버레이 |

### 3.2 대화 흐름

```
사용자가 모드 선택 (칩 UI)
    ↓
해당 모드 + 현재 라운드의 대화 세션 조회/생성
    ↓
기존 메시지 있으면 → 로드 & 표시
기존 메시지 없으면 → AI 선제 인사 (심리 데이터 기반)
    ↓
사용자 메시지 입력 → Edge Function 호출
    ↓
[유료 모드 & 무료 소진] → 새싹 잔액 체크 → 부족 시 충전 UI
    ↓
Gemini API SSE 스트리밍 → 실시간 표시
    ↓
[타로 모드] 카드 뽑기 버튼 → 오버레이 → 3장 선택 → AI 해석
    ↓
[새로고침 버튼] → 라운드+1 → 새 대화 세션 시작 (이전 히스토리 분리)
```

### 3.3 AI에 전달되는 데이터

| 데이터 | 소스 테이블 | 용도 |
|--------|------------|------|
| 나다움 태그 (상위 15개) | `user_trait_tags` | 성격 맥락 |
| 심리 상황 요약 (4주치, 주차별 최신 1건) | `user_situation_summaries` | 심리 흐름 맥락 |
| 대화 히스토리 (현재 라운드, 최근 20건) | `mind_talk_messages` | 대화 연속성 |

---

## 4. 파일 구조

### 프론트엔드

| 파일 | 역할 | 상태 |
|------|------|------|
| `src/pages/MindTalkPage.tsx` | 메인 페이지 (모드 셀렉터 + 채팅 + 타로 오버레이 + 새싹 충전) | ✅ 구현 |
| `src/components/BottomTabBar.tsx` | 탭바에 마음톡 탭 추가 | ✅ 구현 |
| `src/App.tsx` | `/maumtalk` 라우팅 | ✅ 구현 |
| `public/maumi-avatar.png` | AI 아바타 이미지 (브랜드 파비콘) | ✅ 배치 |

### 백엔드

| 파일 | 역할 | 상태 |
|------|------|------|
| `supabase/functions/mind-talk-chat/index.ts` | AI 대화 Edge Function (모드별 프롬프트 + 새싹 차감 + SSE) | ✅ 구현 |
| `supabase/functions/server/cors.ts` | CORS 헤더 공용 모듈 | ✅ 기존 |

### DB 마이그레이션

| 파일 | 내용 | 적용 |
|------|------|------|
| `supabase/migrations/20260310_mind_talk_tables.sql` | 2개 테이블 생성 + RLS + 인덱스 | ✅ staging |
| `supabase/migrations/20260310_mind_talk_v2.sql` | mode 컬럼 추가 + UNIQUE 제약 변경 | ✅ staging |
| `supabase/migrations/20260310_mind_talk_v3_round.sql` | round 컬럼 추가 + UNIQUE 제약 변경 | ✅ staging |

---

## 5. DB 스키마

### `mind_talk_conversations` - 대화 세션

| 컬럼명 | 타입 | 설명 |
|--------|------|------|
| id | uuid | PK |
| user_id | uuid | FK → users.id |
| session_date | date | 세션 날짜 |
| **mode** | **text** | **general/saju/tarot (v2 추가)** |
| **round** | **integer** | **대화 라운드 (v3 추가, default 1)** |
| message_count | integer | 메시지 수 |
| free_messages_used | integer | 무료 메시지 사용 수 |
| summary | text | AI 대화 요약 (nullable) |
| created_at / updated_at | timestamptz | |

**UNIQUE**: `(user_id, session_date, mode, round)` | **RLS**: 본인 SELECT

### `mind_talk_messages` - 개별 메시지

| 컬럼명 | 타입 | 설명 |
|--------|------|------|
| id | uuid | PK |
| conversation_id | uuid | FK → conversations.id |
| user_id | uuid | FK → users.id |
| role | text | user / assistant |
| content | text | 메시지 내용 |
| is_paid | boolean | 새싹 차감 메시지 여부 |
| created_at | timestamptz | |

**인덱스**: `(conversation_id, created_at)` | **RLS**: 본인 SELECT

---

## 6. Edge Function 상세 (`mind-talk-chat`)

### 요청 파라미터
```json
{
  "message": "사용자 메시지 (nullable)",
  "conversation_id": "기존 대화 ID (nullable)",
  "mode": "general | saju | tarot",
  "round": 1,
  "meta": {
    "type": "greeting | tarot_cards",
    "cards": ["The Tower", "Eight of Swords", "The Star"],
    "question": "사용자 질문 (타로용)"
  }
}
```

### 응답 (SSE 스트림)
```
data: {"conversation_id": "uuid", "free_messages_used": 1, "mode": "general"}
data: {"text": "안녕"}
data: {"text": ", 오늘"}
data: {"text": " 어떤 하루"}
...
data: [DONE]
```

새싹 차감 시 추가:
```
data: {"conversation_id": "...", "free_messages_used": 4, "mode": "saju", "new_sprout_balance": 1480}
```

### 에러 응답 (JSON, Content-Type: application/json)
- `{"error": "INSUFFICIENT_SPROUTS", "current_balance": 0, "required": 5}`
- `{"error": "SPROUT_DEDUCTION_FAILED"}`
- `{"error": "Unauthorized"}`

### 새싹 차감 로직
1. 유료 모드(saju/tarot) & 무료 3회 소진 시에만
2. `users.sprout_balance` 조회 → 5새싹 이상인지 확인
3. Optimistic lock: `UPDATE users SET sprout_balance = balance - 5 WHERE sprout_balance = {원래값}`
4. `sprout_transactions` INSERT (type: 'deduct', description: '마음톡 사주/타로 상담')
5. 부족 시 `INSUFFICIENT_SPROUTS` 반환 → 프론트에서 충전 UI 표시

### 모드별 시스템 프롬프트 핵심

| 모드 | AI 역할 | 톤 | 특수 규칙 |
|------|---------|-----|-----------|
| general | 마음 친구 '마음이' | 편안한 반말 | 1~3문장, 공감 중심 |
| saju | 사주 상담사 | 친근한 반말 | 오행/음양/천간지지 활용, 2~4문장 |
| tarot | 타로 상담사 | 신비로운 반말 | [타로 카드 선택] 태그로 카드 해석, 2~4문장 |

### AI 모델
- **Gemini 2.5 Flash** (`gemini-2.5-flash`)
- temperature: 0.85, maxOutputTokens: 800, topP: 0.95
- Secret: `GOOGLE_API_KEY` (Supabase secrets에 등록 필요)

---

## 7. 수익화 모델

| 구분 | 일반 | 사주 | 타로 |
|------|------|------|------|
| 무료 | 무제한 | 하루 3회 | 하루 3회 |
| 유료 | - | 5새싹/회 | 5새싹/회 |
| 새싹 부족 시 | - | 충전 UI 표시 | 충전 UI 표시 |

**설계 의도**:
- 일반 대화 무제한 → 유저 유입 & 습관 형성
- 사주/타로는 전문 상담 가치 → 유료화 자연스러움
- 3회 무료로 충분히 가치 체험 후 결제 유도

---

## 8. 안전 가이드라인

### AI 응답 제한 (모든 모드 공통)
- 의학적 진단/약물 추천/치료 조언 절대 금지
- 자해/자살 언급 감지 시 즉시 안내:
  > "지금 많이 힘들구나. 전문 상담사와 이야기하면 도움이 될 거야.
  > 자살예방상담전화 1393, 정신건강위기상담전화 1577-0199로 연락해봐."
- "~해야 한다" 식의 단정적 조언 자제
- 법적/재무 조언 금지

---

## 9. 알려진 이슈 & 개선 과제

| 이슈 | 상태 | 설명 |
|------|------|------|
| 타로 카드 이미지 로딩 | 확인 필요 | Supabase Storage에서 카드 이미지 로드. 느릴 수 있음 |
| 모드 전환 시 인사 중복 | 처리됨 | `greetedModesRef`로 날짜+모드+라운드별 1회만 인사 |
| production 미배포 | 대기 | 스테이징 테스트 완료 후 cherry-pick으로 배포 |

---

## 10. 배포 체크리스트

### 스테이징 (완료)
- [x] DB 마이그레이션 적용 (MCP tool)
- [x] Edge Function 배포 (`supabase functions deploy mind-talk-chat --project-ref hyltbeewxaqashyivilu`)
- [x] Git push → Vercel 자동 배포

### 프로덕션 (미완료)
- [ ] DB 마이그레이션 적용: `20260310_mind_talk_tables.sql` + `20260310_mind_talk_v2.sql` + `20260310_mind_talk_v3_round.sql`
  - project-ref: `kcthtpmxffppfbkjjkub`
- [ ] Edge Function 배포: `supabase functions deploy mind-talk-chat --project-ref kcthtpmxffppfbkjjkub`
- [ ] `GOOGLE_API_KEY` secret 확인 (production Supabase에 등록 필요)
- [ ] Cherry-pick 배포 (staging → production)
  - 관련 커밋: `e26177c1` (MVP), `c18be75e` ~ `c035555d` (수정들), `b46f14f3` (v2), `a392efa8` (스크롤 fix)

---

## 11. 비용 추정 (Gemini 2.5 Flash)

| 항목 | 토큰 | 단가 | 월 비용 (1000 DAU 기준) |
|------|------|------|-------------------------|
| 일반 대화 (5회/일 평균) | ~800/회 | Input $0.15/1M, Output $0.60/1M | ~$3 |
| 사주/타로 (1회/일 평균) | ~1000/회 | 동일 | ~$1 |
| **합계** | | | **~$4/월** |

*Gemini Flash는 GPT-4o 대비 약 1/10 비용. 유료 대화는 새싹 수익으로 상쇄.*

---

## 참고 문서
- [PUBLISHING_GUIDE](./develop/★PUBLISHING_GUIDE★.md) - 퍼블리싱 규칙 (인라인 스타일, iOS Safari 등)
- [DATABASE_SCHEMA.md](../DATABASE_SCHEMA.md) - DB 스키마
- [EDGE_FUNCTIONS_GUIDE.md](../../supabase/EDGE_FUNCTIONS_GUIDE.md) - Edge Functions 가이드
- [★SECURITY★.md](./★SECURITY★.md) - 보안 가이드
