# 국립국어원 표준국어대사전 API - 성격 형용사 추출 인계서

> **작성일**: 2026-03-17
> **목적**: 나다움 태그 사전(traitTagDictionary.ts)에 쓸 성격 형용사 400개+를 룰베이스로 확보

---

## 1. API 정보

| 항목 | 값 |
|------|-----|
| **엔드포인트** | `https://stdict.korean.go.kr/api/search.do` |
| **인증키 위치** | `.env.local` → `STDICT_API_KEY` |
| **계정** | gksruf813 (stdict.korean.go.kr) |
| **일일 한도** | 50,000건 |
| **키 관리 페이지** | https://stdict.korean.go.kr/openapi/openApiRegister.do |

> ⚠️ API 키는 공개 저장소에 절대 커밋 금지

---

## 2. 추출 전략

### 핵심 원리
- 표준국어대사전 API에서 **품사=형용사(pos=6)** + **뜻풀이 포함검색(target=8, method=include)**
- "성격이 ~하다", "성품이 ~하다" 등의 패턴으로 정의된 형용사를 키워드별로 수집
- `target_code`(사전 고유 ID) 기준으로 중복 제거

### 검색 키워드 30개
```
성격, 성질, 성품, 태도, 마음, 심성, 됨됨이, 사람이, 성미, 심보,
기질, 마음씨, 인품, 품성, 심지, 기상, 도량, 심술, 성정, 성벽,
심사, 품행, 인격, 기개, 기풍, 심성이, 성깔, 천성, 본성, 기질이
```

### 쿼리 예시
```
GET https://stdict.korean.go.kr/api/search.do
  ?key={STDICT_API_KEY}
  &q=성격
  &req_type=json
  &advanced=y
  &pos=6
  &target=8
  &method=include
  &num=100
  &start=1
```

---

## 3. 현재 진행 상태

### 완료
- [x] 국립국어원 회원가입 (gksruf813, gksruf813@daum.net)
- [x] API 키 발급 → `.env.local`에 저장
- [x] 추출 스크립트 작성 (`extract-personality-adjectives.ts`)
- [x] 1차 실행 → 301개 (버그 있었음)
- [x] 버그 수정 후 재실행 → **753개** 추출 (extracted-adjectives.json)
  - 단, 비성격 형용사 다수 포함 → 필터링 필요

### 해결 완료
- [x] 페이지네이션 버그 수정 (optional chaining 추가)
- [x] 결과 없는 키워드 에러 수정

### 남은 이슈
- [ ] **API `num` 최대 100건 제한**: 성질(329건), 태도(333건), 마음(797건) 등에서 100건만 가져옴
  - `start` 파라미터로 페이지네이션하면 되는데, 현재 2페이지부터 item이 빈 배열로 옴
  - API 자체 제한일 수 있음 → 확인 필요
- [ ] **비성격 형용사 필터링 필요**: 753개 중 상당수가 성격과 무관
  - "가깝다"(거리), "가난하다"(경제), "가볍다"(무게) 등
  - 뜻풀이에 "마음"이 포함되어 검색되었으나 성격 형용사가 아닌 것들

### 미완료
- [ ] 비성격 형용사 필터링 (수동 또는 뜻풀이 2차 필터링)
- [ ] extracted-adjectives.json → traitTagDictionary.ts에 병합
  - 기존 사전에 없는 형용사만 추가 (frequency: 0)
  - HEXACO 7개 카테고리 분류 필요 (수동 또는 AI 보조)
- [ ] 비성격 형용사 필터링 (예: "가칫하다"=피부 관련, "개활하다"=지형 관련)
  - 뜻풀이에 성격 키워드가 포함되어도 실제로는 외모/자연/물체 형용사인 경우

---

## 4. 파일 구조

```
src/data/태그 정규화/
├── HANDOVER_태그사전작업.md          # 전체 태그 사전 작업 인계서
├── HANDOVER_국어원API추출.md         # 이 문서
├── traitTagDictionary.ts             # 태그 사전 본체 (HEXACO 분류)
├── extract-personality-adjectives.ts # 추출 스크립트
└── extracted-adjectives.json         # 추출 결과 (301개, 버그 수정 후 재생성 필요)
```

---

## 5. 추출 결과 JSON 구조

```json
{
  "_meta": {
    "source": "국립국어원 표준국어대사전 오픈 API",
    "extractedAt": "2026-03-17T...",
    "totalAdjectives": 301,
    "searchKeywords": ["성격", "성질", ...]
  },
  "adjectives": [
    {
      "word": "강경하다",
      "definition": "성격이나 기질이 꿋꿋하고 굳세다.",
      "origin": "剛勁하다/剛硬하다",
      "link": "https://stdict.korean.go.kr/search/searchView.do?word_no=7732",
      "matchedKeywords": ["성격", "기질"]
    }
  ]
}
```

---

## 6. 이어서 해야 할 작업

1. `extract-personality-adjectives.ts` 페이지네이션 버그 수정
2. 재실행하여 400개+ 확보
3. 비성격 형용사 수동 필터링 (뜻풀이 읽고 판단)
4. traitTagDictionary.ts에 병합:
   - 기존 태그와 매칭되는 것: synonyms에 추가
   - 새로운 것: 새 엔트리 (frequency: 0, 카테고리 분류 필요)
5. HEXACO 카테고리 자동 분류 시도 (뜻풀이 키워드 기반 룰)

---

## 7. API 응답 참고

### 정상 응답 (검색 결과 있음)
```json
{
  "channel": {
    "total": 109,
    "start": 1,
    "num": 10,
    "item": [
      {
        "word": "강경-하다",
        "sup_no": "1",
        "target_code": "7732",
        "pos": "형용사",
        "origin": "剛勁하다/剛硬하다",
        "sense": {
          "definition": "성격이나 기질이 꿋꿋하고 굳세다.",
          "link": "https://stdict.korean.go.kr/...",
          "type": "일반어"
        }
      }
    ]
  }
}
```

### 결과 없음 / 에러
- `channel`이 없거나 `item`이 없을 수 있음 → optional chaining 필수
- 에러 시: `{ "error": { "error_code": "020", "message": "Unregistered key" } }`
