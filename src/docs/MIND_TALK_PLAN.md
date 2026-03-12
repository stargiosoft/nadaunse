# 마음톡 기능 개발 계획

> **상태**: v3 프로덕션 배포 완료
> **최종 업데이트**: 2026-03-12

---

## 1. 개요

### 컨셉
**"나보다 나를 더 잘 아는 AI 친구"**

나다움 데이터(성향 태그, 심리 상황 요약, 나다움 분석) 기반으로 개인화된 AI 상담 서비스.
일반 대화 / 사주 상담 / 타로 상담 3가지 모드를 제공하며,
AI가 사용자의 심리 데이터를 바탕으로 먼저 말을 걸어주는 **선제 인사** 방식.

### 차별점
- **기존 AI 상담**: 매번 처음부터 상황 설명 필요
- **마음톡**: 나다움 태그 + 4주 심리 흐름 + 나다움 분석이 시스템 프롬프트에 포함 → 맥락 있는 공감
- **3가지 모드**: 일반(일상 대화), 사주(운세 상담), 타로(카드 뽑기 + 해석)

### 탭바 위치
- 하단 탭바 3번째 탭: 홈 | 나다움 | **마음톡** | 프로필
- 탭 아이콘: 말풍선 + 점 3개 SVG

---

## 2. 현재 구현 상태 (v3 - 프로덕션)

### 완료된 기능
- [x] 탭바 추가 + 라우팅 (`/maumtalk`)
- [x] DB 테이블 2개 (`mind_talk_conversations`, `mind_talk_messages`)
- [x] **모드 시스템**: 일반/사주/타로 칩 셀렉터 (모드별 색상 테마)
- [x] **AI 선제 인사**: 페이지 진입 시 심리 데이터 기반 첫 인사
- [x] **AI 대화**: Gemini 2.5 Flash SSE 스트리밍 (RAF throttle 최적화)
- [x] **모드별 과금**: 일반=무제한 무료, 사주/타로=3회 무료→5새싹/회
- [x] **새싹 차감**: optimistic lock + `sprout_transactions` 기록
- [x] **새싹 부족 시**: `SproutChargingStation` 오버레이 (즉시 충전)
- [x] **타로 카드 뽑기**: 7장 중 1장 선택 → AI 해석 (인라인 CTA 버튼)
- [x] **AI 후속 질문**: 응답 끝에 `---SUGGESTIONS---` 마커로 2~3개 개인화된 질문 생성
- [x] **부분 마커 보호**: `---SUG` 등 불완전 마커가 채팅에 노출되지 않도록 holdBuffer 처리
- [x] 모드별 추천 질문 (대화 시작 도우미) + AI 후속 질문 동적 전환
- [x] 메시지 버블 + 타이핑 인디케이터 + 스트리밍 표시
- [x] 미로그인 안내 화면
- [x] **라운드 시스템**: 새로고침 버튼으로 새 대화 세션 시작 (이전 대화 히스토리 분리)
- [x] **4주 심리 흐름**: 주차별 최신 1건씩 AI에 전달
- [x] **나다움 분석 컨텍스트**: 5개 카테고리(연애/성격/금전/직업/건강) 분석 텍스트 AI에 전달
- [x] **사주 모드 상세 사주 데이터**: Stargio API 경량화 18개 필드 전달
- [x] **DB 쿼리 병렬화**: Promise.all로 6개 쿼리 동시 실행
- [x] **프로덕션 배포 완료** (Edge Function + Vercel + DB)

### 미완료 / TODO
- [ ] 대화 히스토리 열람 (과거 세션 목록)
- [ ] 주간/월간 감정 리포트
- [ ] 대화 세션 요약 저장
- [ ] 대화 속 나다움 태그 자동 추출
- [ ] 알림톡 연동

---

## 3. 모드별 상세 비교

### 3.1 응답 구조

| 항목 | 일반 (general) | 사주 (saju) | 타로 (tarot) |
|------|---------------|-------------|-------------|
| **AI 역할** | 마음 친구 '마음이' | 사주 상담사 | 타로 상담사 |
| **톤** | 편안한 반말 | 따뜻하고 친근한 반말 | 따뜻하고 신비로운 반말 |
| **응답 길이** | 2~3문장 | 3~6문장 | 3~6문장 |
| **과금** | 무제한 무료 | 3회 무료 → 5새싹/회 | 3회 무료 → 5새싹/회 |
| **특수 기능** | - | 상세 사주 데이터 활용 | 카드 뽑기 + 해석 |

### 3.2 응답 스타일 규칙

| 규칙 | 일반 | 사주 | 타로 |
|------|------|------|------|
| 감정적일 때 공감 | O | O | O |
| 일반 질문엔 바로 본론 | O | O | O |
| 앵무새 반복 금지 ("~묻는구나") | O | O | O |
| 이름 호출 | X (사용 안 함) | X (사용 안 함) | X (사용 안 함) |
| 단정적 조언 자제 | O | O | O |

### 3.3 모드별 AI에 전달되는 데이터

| 데이터 | 일반 | 사주 | 타로 | 소스 |
|--------|------|------|------|------|
| 나다움 태그 (상위 15개) | O | O | O | `user_trait_tags` |
| 4주 심리 흐름 (주차별 최신 1건) | O | O | O | `user_situation_summaries` |
| 나다움 분석 요약 (5개 카테고리) | O | O | O | `nadaum_analyses` |
| 대화 히스토리 (최근 10건) | O | O | O | `mind_talk_messages` |
| **상세 사주 데이터 (경량화 18개 필드)** | X | **O** | X | Stargio API |

### 3.4 사주 모드 — 경량화 사주 데이터

Stargio 통합 사주 API 응답에서 18개 핵심 필드만 추출하여 토큰 절약:

| 카테고리 | 필드 |
|----------|------|
| 핵심 사주 | 격국, 격국설명, 일주, 일주설명 |
| 사주 구성 | 천간, 지지, 십성, 십이운성 |
| 운세 흐름 | 대운, 대운수, 세운 |
| 오행 | 발달오행, 오행비율 |
| 용신 | 용신, 용신설명, 희신 |
| 해석 | 성격, 적성, 건강 |
| 시기별 운세 | 올해운세, 이달운세, 오늘운세 |

> 상세: [SAJU_API_LIGHTWEIGHT.md](./develop/SAJU_API_LIGHTWEIGHT.md)

### 3.5 타로 모드 — 카드 뽑기 흐름

```
사용자 고민 입력 → AI 답변 (카드 뽑기 유도)
    ↓
AI 응답에 카드 뽑기 키워드 감지 → 인라인 CTA 버튼 표시
    ↓
카드 뽑기 오버레이 (7장 중 1장 선택)
    ↓
선택된 카드 → Edge Function에 전달 (meta.type: 'tarot_cards')
    ↓
AI가 카드 이름 + 핵심 의미 → 상황 맞춤 해석
```

**카드 뽑기 CTA 키워드**: `카드를 뽑`, `뽑아봐`, `뽑아보`, `골라봐`, `카드를 보`, `들여다볼`, `직접 뽑` 등
**카드 이름**: 영어 원문 필수 (번역 금지)

---

## 4. AI 후속 질문 (Suggestions) 시스템

### 동작 원리
1. AI 응답 본문 완성 후 `---SUGGESTIONS---` 마커 출력
2. 마커 뒤에 `질문1|질문2|질문3` 형태로 2~3개 질문 생성
3. 백엔드: `holdBuffer`로 부분 마커 보류, 완전한 마커 확인 후 suggestions 이벤트 전송
4. 프론트: `stripSuggestions`로 스트리밍 중 마커/부분 마커 제거

### SSE 이벤트 순서
```
data: {"text": "답변 내용..."}   ← 여러 청크
data: {"suggestions": ["질문1", "질문2", "질문3"]}
data: [DONE]
```

### 부분 마커 보호
- 백엔드: `\n---` 이후 텍스트를 `holdBuffer`에 보류, `---SUGGESTIONS---` 완성 확인 후 처리
- 프론트: 정규식으로 `\n---`, `\n---S`, `\n---SUG...` 등 부분 마커 실시간 제거
- DB 저장: `cleanResponse` (마커 제거된 본문만 저장)

---

## 5. 파일 구조

### 프론트엔드

| 파일 | 역할 |
|------|------|
| `src/pages/MindTalkPage.tsx` | 메인 페이지 (모드 셀렉터 + 채팅 + 타로 오버레이 + 새싹 충전 + AI 후속 질문) |
| `src/lib/tarotCards.ts` | 78장 타로 덱 데이터 + 랜덤 뽑기 유틸 |
| `src/components/BottomTabBar.tsx` | 탭바에 마음톡 탭 추가 |
| `src/App.tsx` | `/maumtalk` 라우팅 |
| `public/maumi-avatar.png` | AI 아바타 이미지 |

### 백엔드

| 파일 | 역할 |
|------|------|
| `supabase/functions/mind-talk-chat/index.ts` | AI 대화 Edge Function (모드별 프롬프트 + 사주 API + 새싹 차감 + SSE + suggestions) |
| `supabase/functions/server/cors.ts` | CORS 헤더 공용 모듈 |

### DB 마이그레이션

| 파일 | 내용 | 적용 |
|------|------|------|
| `20260310_mind_talk_tables.sql` | 2개 테이블 생성 + RLS + 인덱스 | ✅ staging + production |
| `20260310_mind_talk_v2.sql` | mode 컬럼 추가 + UNIQUE 제약 변경 | ✅ staging + production |
| `20260310_mind_talk_v3_round.sql` | round 컬럼 추가 + UNIQUE 제약 변경 | ✅ staging + production |

---

## 6. DB 스키마

### `mind_talk_conversations` - 대화 세션

| 컬럼명 | 타입 | 설명 |
|--------|------|------|
| id | uuid | PK |
| user_id | uuid | FK → users.id |
| session_date | date | 세션 날짜 |
| mode | text | general/saju/tarot |
| round | integer | 대화 라운드 (default 1) |
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

## 7. Edge Function 상세 (`mind-talk-chat`)

### 요청 파라미터
```json
{
  "message": "사용자 메시지 (nullable)",
  "conversation_id": "기존 대화 ID (nullable)",
  "mode": "general | saju | tarot",
  "round": 1,
  "meta": {
    "type": "greeting | tarot_cards",
    "cards": ["The Tower"],
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
data: {"suggestions": ["질문1", "질문2", "질문3"]}
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

### 처리 흐름
```
요청 수신 → 인증 확인 → 대화 세션 조회/생성
    → [유료 모드] 일일 무료 사용량 서버 검증 → 새싹 차감
    → 사용자 메시지 저장
    → 컨텍스트 로드 (태그 + 심리흐름 + 나다움분석 + 히스토리 + [사주모드] 사주API)
    → 시스템 프롬프트 구성 → Gemini API SSE 호출
    → holdBuffer로 부분 마커 보호하며 스트리밍 전송
    → suggestions 파싱 → suggestions 이벤트 전송
    → AI 응답 저장 (cleanResponse) → [DONE]
```

### AI 모델
- **Gemini 2.5 Flash** (`gemini-2.5-flash`)
- temperature: 0.85, maxOutputTokens: 800, topP: 0.95

---

## 8. 수익화 모델

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

## 9. 안전 가이드라인

### AI 응답 제한 (모든 모드 공통)
- 의학적 진단/약물 추천/치료 조언 절대 금지
- 자해/자살 언급 감지 시 즉시 안내:
  > "지금 많이 힘들구나. 전문 상담사와 이야기하면 도움이 될 거야.
  > 자살예방상담전화 1393, 정신건강위기상담전화 1577-0199로 연락해봐."
- "~해야 한다" 식의 단정적 조언 자제
- 법적/재무 조언 금지

---

## 10. 알려진 이슈 & 개선 과제

| 이슈 | 상태 | 설명 |
|------|------|------|
| 타로 카드 이미지 로딩 | 확인 필요 | Supabase Storage에서 카드 이미지 로드. 느릴 수 있음 |
| 모드 전환 시 인사 중복 | 처리됨 | `greetedModesRef`로 날짜+모드+라운드별 1회만 인사 |
| production 배포 | **완료** | Edge Function + Vercel + DB 모두 배포됨 |
| `---SUG` 마커 노출 | **수정됨** | holdBuffer + 부분 마커 정규식으로 방지 |
| 기계적 공감 반복 | **수정됨** | 감정적일 때만 공감, 일반 질문은 바로 본론 |
| 이름 호출 어색함 | **수정됨** | 이름 호출 완전 제거, "너"로 통일 |

---

## 11. 배포 체크리스트

### 스테이징 (완료)
- [x] DB 마이그레이션 적용
- [x] Edge Function 배포
- [x] Git push → Vercel 자동 배포

### 프로덕션 (완료)
- [x] DB 마이그레이션 적용 (3개 SQL)
- [x] Edge Function 배포 (`--no-verify-jwt`)
- [x] `GOOGLE_API_KEY` secret 등록
- [x] Cherry-pick + staging 동기화 배포

---

## 12. 비용 추정 (Gemini 2.5 Flash)

| 항목 | 토큰 | 단가 | 월 비용 (1000 DAU 기준) |
|------|------|------|-------------------------|
| 일반 대화 (5회/일 평균) | ~800/회 | Input $0.15/1M, Output $0.60/1M | ~$3 |
| 사주/타로 (1회/일 평균) | ~1000/회 | 동일 | ~$1 |
| **합계** | | | **~$4/월** |

*Gemini Flash는 GPT-4o 대비 약 1/10 비용. 유료 대화는 새싹 수익으로 상쇄.*

---

## 참고 문서
- [SAJU_API_LIGHTWEIGHT.md](./develop/SAJU_API_LIGHTWEIGHT.md) - 사주 API 경량화 전략
- [PUBLISHING_GUIDE](./develop/★PUBLISHING_GUIDE★.md) - 퍼블리싱 규칙
- [DATABASE_SCHEMA.md](./DATABASE_SCHEMA.md) - DB 스키마
- [EDGE_FUNCTIONS_GUIDE.md](../../supabase/EDGE_FUNCTIONS_GUIDE.md) - Edge Functions 가이드
- [★SECURITY★.md](./develop/★SECURITY★.md) - 보안 가이드
