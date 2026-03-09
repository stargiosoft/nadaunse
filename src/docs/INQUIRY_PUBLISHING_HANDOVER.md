# 문의 기능 퍼블리싱 인수인계서

> **작성일**: 2026-03-09
> **대상 파일**: InquiryWritePage, InquiryListPage, MasterInquiryPage
> **디자인 기준**: `src/docs/develop/★PUBLISHING_GUIDE★.md`

---

## 1. 현재 상태 요약

### 완료된 작업

| 항목 | 상태 | 비고 |
|------|------|------|
| DB 마이그레이션 | ✅ 완료 | Staging + Production 모두 적용 |
| RLS 정책 | ✅ 완료 | 유저 본인 조회/삽입, 마스터 전체 조회/수정 |
| InquiryWritePage.tsx | ✅ 퍼블리싱 가이드 적용 | 카테고리 스와이프 추가 |
| InquiryListPage.tsx | ✅ 퍼블리싱 가이드 적용 | |
| MasterInquiryPage.tsx | ✅ 퍼블리싱 가이드 적용 | |
| App.tsx 라우팅 | ✅ 완료 | 3개 라우트 + Wrapper 함수 |
| ProfilePage.tsx 메뉴 연결 | ✅ 완료 | 의견 전달하기 → /inquiry, 마스터 문의 관리 추가 |
| 빌드 | ✅ 통과 | |

### 알려진 퍼블리싱 이슈 (다음 세션에서 확인 필요)

| 이슈 | 파일 | 설명 |
|------|------|------|
| 카테고리 버튼 글자 깨짐 | InquiryWritePage.tsx | `flex-wrap` → `overflow-x-auto` + `shrink-0`으로 수정했으나 **실기기 확인 필요** |
| iOS Safari 렌더링 | 전체 | `overflow: hidden` + `border-radius` 조합에 `transform-gpu` 누락 여부 확인 |
| 터치 인터랙션 | 전체 | onMouseDown/Up/Leave + onTouchStart/End 패턴 실기기 동작 확인 |
| 스크롤바 숨김 | InquiryWritePage, MasterInquiryPage | `scrollbarWidth: 'none'` — WebKit에서 `::-webkit-scrollbar` CSS 필요할 수 있음 |

---

## 2. 파일별 상세

### InquiryWritePage.tsx (`/inquiry/write`)
- **기능**: 고객 문의 작성 (카테고리 선택, 제목, 내용)
- **레이아웃**: `fixed inset-0` → `max-w-[440px]` → `flex flex-col`
- **네비게이션**: ArrowLeft + "문의하기" 타이틀 + 빈 44px 우측 영역
- **카테고리 필터**: 좌우 스와이프 (`overflow-x-auto`, `shrink-0`, `scrollbarWidth: 'none'`)
- **입력 필드**: 56px 높이, `#e7e7e7` border, 16px borderRadius
- **하단 CTA**: boxShadow 고정 버튼, `#41a09e` 활성/`#f8f8f8` 비활성
- **글자수 표시**: 제목 0/100, 내용 0/2000

### InquiryListPage.tsx (`/inquiry`)
- **기능**: 고객 본인 문의 목록 조회 (아코디언 펼치기)
- **네비게이션**: ArrowLeft + "문의 내역" + Plus 아이콘 (문의 작성으로 이동)
- **빈 상태**: 아이콘 + "아직 문의 내역이 없어요" + "문의하기" 버튼
- **카드**: 16px borderRadius, `#e7e7e7` border, 펼침 시 `#d4d4d4`
- **답변 표시**: `#f0f8f8` 배경, dot + "운영팀 답변" 라벨
- **상태 뱃지**: pending(`#f9f9f9`/`#848484`), replied(`#f0f8f8`/`#368683`), closed(`#f9f9f9`/`#b7b7b7`)

### MasterInquiryPage.tsx (`/master/inquiries`)
- **기능**: 마스터 전체 문의 관리 (답변 작성, 종료 처리)
- **네비게이션**: ArrowLeft + "문의 관리" + 빈 44px
- **통계 바**: "전체 N건 (대기 N건)"
- **필터 탭**: 전체/답변 대기/답변 완료/종료 — 좌우 스와이프
- **카드**: pending 시 `#ffe0b2` border 강조
- **사용자 표시**: `users.nickname || users.email || '(알 수 없음)'`
- **답변 입력**: textarea (16px borderRadius, `#e7e7e7` border) + 답변 등록/종료 버튼
- **버튼**: 48px 높이, 16px borderRadius, touch 핸들러 적용

---

## 3. 라우팅 구조 (App.tsx)

```
/inquiry          → InquiryListPageWrapper (useLoginRequired)
/inquiry/write    → InquiryWritePageWrapper (useLoginRequired)
/master/inquiries → MasterInquiryPageWrapper (useMasterAuth)
```

ProfilePage.tsx 메뉴 연결:
- "의견 전달하기" → `navigate('/inquiry', { state: { canGoBack: true } })`
- "문의 관리" (마스터 전용) → `navigate('/master/inquiries', { state: { canGoBack: true } })`

---

## 4. DB 스키마

**테이블**: `customer_inquiries`

| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | uuid (PK) | |
| user_id | uuid (FK → auth.users) | 문의 작성자 |
| category | text | general, bug, payment, suggestion, other |
| title | text | |
| content | text | |
| status | text | pending, replied, closed |
| reply | text | 마스터 답변 |
| replied_at | timestamptz | |
| replied_by | uuid (FK → auth.users) | |
| created_at | timestamptz | |
| updated_at | timestamptz | trigger 자동 갱신 |

**RLS 정책**: 유저 본인만 SELECT/INSERT, 마스터(`is_master=true`)만 전체 SELECT/UPDATE

**마이그레이션 파일**: `supabase/migrations/20260309_customer_inquiries.sql`

---

## 5. 디자인 시스템 체크리스트

다음 세션에서 실기기 확인 시 체크:

- [ ] `fixed inset-0` 레이아웃 — iOS bounce 방지 정상 작동
- [ ] 카테고리/필터 버튼 — 글자 잘림 없이 스와이프 정상
- [ ] 스크롤바 숨김 — iOS Safari, Android Chrome 모두 확인
- [ ] 입력 필드 포커스 — 키보드 올라올 때 레이아웃 깨짐 없는지
- [ ] 하단 CTA 버튼 — 키보드 위에 정상 표시
- [ ] 터치 인터랙션 — scale(0.99) + 색상 변경 체감
- [ ] 아코디언 펼치기 — 부드러운 전환 (transition 추가 검토)
- [ ] `transform-gpu` 필요 여부 — `overflow: hidden` + `border-radius` 조합 확인
- [ ] 폰트 — 모든 텍스트가 inline style로 `Pretendard Variable, sans-serif` 적용
- [ ] 색상 통일 — primary `#41a09e`, accent `#368683`, Tailwind arbitrary color 미사용

---

## 6. 미완료 문서 업데이트

| 문서 | 내용 |
|------|------|
| DATABASE_SCHEMA.md | customer_inquiries 테이블 추가 |
| RLS_POLICIES.md | 4개 정책 추가 |
| DATABASE_TRIGGERS_AND_FUNCTIONS.md | updated_at 트리거 추가 |
| components-inventory.md | InquiryWritePage, InquiryListPage, MasterInquiryPage 추가 |
