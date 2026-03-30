# 콘텐츠 메이커 CLI 실행 가이드

> Claude Code에서 UI 없이 콘텐츠를 직접 생성하기 위한 참고서
> 스킬 체이닝 + 브랜드 컨텍스트 공유 + 피드백 루프 구조

---

## 1. 시스템 구조

```
[사용자 주제 입력]
       ↓
[1단계: 트렌드 분석]  search-trends
       ↓
[2단계: 스크립트 생성] generate-card-news / generate-short-form / generate-meme-ad
                      generate-ad-copy / generate-ad-creative
       ↓
[3단계: 미디어 생성]  generate-card-image / generate-ad-image / generate-thumbnail-image
                      search-stock-image / generate-tts / generate-bgm / generate-scene-video
       ↓
[4단계: 결과 저장]    마크다운 or JSON → 다음 스킬 입력으로 체이닝
```

**핵심 원칙**: 모든 단계에서 **브랜드 컨텍스트**를 참조하고, **피드백(learnings)**으로 보정된다.

---

## 2. Edge Function 호출 방법

### 환경별 Base URL

| 환경 | URL |
|------|-----|
| Production | `https://kcthtpmxffppfbkjjkub.supabase.co/functions/v1/` |
| Staging | `https://hyltbeewxaqashyivilu.supabase.co/functions/v1/` |

### 공통 호출 패턴

```bash
curl -X POST "${BASE_URL}/<함수명>" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${SUPABASE_ANON_KEY}" \
  -d '{ ... }'
```

---

## 3. 함수별 입출력 스키마

### 3-1. 트렌드 분석

```bash
# search-trends — 3가지 모드
curl -X POST "${BASE_URL}/search-trends" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${ANON_KEY}" \
  -d '{
    "mode": "topic-analysis",      # x-trending | topic-analysis | trending-insights
    "topic": "2026 운세 트렌드",
    "country": "KR"
  }'
```

**출력**: 트렌딩 키워드 + AI 분석 + 근거 소스

### 3-2. 카드뉴스

```bash
# Step 1: 스크립트 생성
curl -X POST "${BASE_URL}/generate-card-news" \
  -d '{
    "topic": "MBTI별 연애 스타일",
    "slideCount": 10,
    "ratio": "9:16"
  }'
# 출력: title, viral_elements, slides[](headline, body, image_prompt, search_keyword, color_scheme)

# Step 2: 슬라이드별 이미지 생성
curl -X POST "${BASE_URL}/generate-card-image" \
  -d '{
    "image_prompt": "editorial photography, Korean young woman...",
    "slide_context": { "headline": "...", "body": "..." },
    "aspect_ratio": "9:16"
  }'
# 출력: base64 PNG
```

### 3-3. 숏폼 영상

```bash
# Step 1: 스크립트
curl -X POST "${BASE_URL}/generate-short-form" \
  -d '{
    "topic": "오늘의 운세가 맞는 이유",
    "duration": 30,
    "platform": "reels",
    "style": "정보전달",
    "videoType": "motion",         # motion | image | video
    "motionTheme": "colorful_pop"  # colorful_pop | pastel_soft | gradient_vivid | dark_impact
  }'
# 출력: scenes[](narration, subtitle, motion_style, accent_color, glow_color, layout)

# Step 2: TTS 생성 (씬별)
curl -X POST "${BASE_URL}/generate-tts" \
  -d '{
    "text": "여러분 오늘 운세 확인하셨나요?",
    "voice": "aria",               # aria | roger | sarah | charlie | laura
    "speed": 1.0
  }'
# 출력: { "audio": "data:audio/mp3;base64,..." }

# Step 3: BGM 생성
curl -X POST "${BASE_URL}/generate-bgm" \
  -d '{
    "mood": "energetic",           # energetic | calm | dramatic | happy | sad | mysterious | romantic | epic
    "duration": 30
  }'
# 출력: { "audioUrl": "https://...", "track": {...} }

# Step 4: (video 타입만) I2V 영상 생성
curl -X POST "${BASE_URL}/generate-scene-video" \
  -d '{
    "action": "submit",
    "image_data_url": "base64...",
    "motion_style": "zoom_in",
    "model": "kling"               # kling | hailuo | wan
  }'
# 출력: { "prediction_id": "..." }

# 폴링
curl -X POST "${BASE_URL}/generate-scene-video" \
  -d '{ "action": "poll", "prediction_id": "..." }'
# 출력: { "status": "succeeded", "video_url": "https://..." }
```

### 3-4. 밈 광고 영상

```bash
curl -X POST "${BASE_URL}/generate-meme-ad" \
  -d '{
    "brandInfo": "나다운세 - AI 사주/타로 서비스, Z세대 타겟",
    "adDuration": 30,
    "hookDuration": 5,
    "videoType": "motion"
  }'
# 출력: scenes[], hashtags, bgm_mood, viral_elements
```

### 3-5. 광고 카피

```bash
curl -X POST "${BASE_URL}/generate-ad-copy" \
  -d '{
    "product": "나다운세 프리미엄 사주 리포트",
    "target": "20대 초반 취준생",
    "goalAction": "무료 체험 시작",
    "ctaLocation": "인스타그램 피드",
    "copyCount": 5
  }'
# 출력: product_summary, viral_elements, copies[](headline, subtext, cta_button, strategies)
```

### 3-6. 광고 소재 디자인

```bash
curl -X POST "${BASE_URL}/generate-ad-creative" \
  -d '{
    "product": "나다운세 나다움 유형 테스트",
    "target": "10대 후반~20대 초반",
    "channel": "인스타그램",
    "ratio": "1:1"
  }'
# 출력: viral_elements, options[A/B/C](strategy, design_specs, image_prompt)
```

### 3-7. 썸네일

```bash
curl -X POST "${BASE_URL}/generate-thumbnail-image" \
  -d '{
    "prompt": "young Korean woman surprised face, fortune telling concept",
    "aspect_ratio": "16:9",
    "reference_mode": "style_only"  # style_only | style_and_character
  }'
# 출력: base64 PNG
```

---

## 4. 스킬 체이닝 레시피

### 레시피 A: 트렌드 → 카드뉴스 풀세트

```
1. search-trends (topic-analysis) → 트렌드 키워드 추출
2. generate-card-news (트렌드 키워드 기반) → 10장 스크립트
3. generate-card-image (슬라이드별) → 10장 이미지
4. generate-thumbnail-image → 썸네일 1장
```

### 레시피 B: 트렌드 → 숏폼 풀세트

```
1. search-trends (x-trending) → 실시간 핫토픽
2. generate-short-form (핫토픽 기반) → 씬별 스크립트
3. generate-tts (씬별 나레이션) → 음성 파일들
4. generate-bgm (분위기 매칭) → 배경 음악
5. (video 타입) generate-scene-video (씬별) → 배경 영상
```

### 레시피 C: 광고 풀패키지

```
1. generate-ad-copy → 카피 5종
2. generate-ad-creative → 디자인 A/B/C
3. generate-ad-image (크리에이티브별) → 포스터 이미지
4. generate-meme-ad → 밈 광고 스크립트 (영상용)
```

---

## 5. 브랜드 컨텍스트 (모든 스킬 공유)

모든 콘텐츠 생성 시 아래 맥락을 반영해야 한다.

### 브랜드 정체성

| 항목 | 값 |
|------|---|
| **핵심 가치** | 자기 긍정 — "그럭저럭, 하지만 가장 나답게" |
| **타겟** | 1020 Z세대 (15~24세), 핵심: 10대 후반 + 20대 초중반 |
| **포지셔닝** | MBTI의 대안 — 사주 기반 AI 성격 분석 + 16가지 나다움 유형 |
| **핵심 메시지** | "너는 너의 시간대에 잘 맞춰 가고 있어" |
| **캐릭터** | 아기 백조 — 가능성 중인 상태 |

### 톤 & 보이스

| 콘텐츠 유형 | 톤 | 역할 |
|------------|-----|------|
| 무료 콘텐츠 | 친근하되 전문적, 단정적 (~이에요) | 맛보기 상담사 |
| 유료 콘텐츠 | 전문적, 권위적, 초개인화 | 전문 명리학자 |
| SNS/광고 | 구어체, 호기심 자극, 공감 | 또래 친구 |

### 바이럴 공식

- **7대 본능 조합**: 오만+시기, 나태+탐욕, 분노+나태, 음욕+시기, 탐식+나태
- **행동경제학 8대 훅**: 단일메시지집중 / 손실회피 / 구체적숫자 / 타겟지목 / 간편성 / FOMO / 인정욕구 / 또래동조
- **카피 6유형**: 질문유도 / 비교자극 / 문제후벼파기 / 호기심유발 / 시의성강조 / 또래공유유도

### 타겟 페르소나

| 페르소나 | 윤하은 (18세 고3) | 이지안 (24세 취준생) |
|---------|------------------|-------------------|
| 고민 | 정체성, 진로, 친구 관계 | 진로, 관계, 자기 확신 |
| 이용 시간 | 밤 10시~새벽 1시 | 낮~저녁 |
| 공유 채널 | 인스타, 틱톡 | 유튜브, 인스타 |
| 결제 패턴 | 무료 + 소액(새싹) | 유료 전환 가능 |

---

## 6. 피드백 루프 (Learnings)

### 구조

```
스킬 실행 → 결과물 → 사용자 피드백 → learnings에 기록 → 다음 실행에 반영
```

### 피드백 기록 규칙

CLAUDE.md 또는 스킬 지침에 아래 규칙을 추가:

```
피드백을 받으면 learnings 섹션에 기록하라:
- 날짜 + 스킬명 + 구체적 피드백 내용
- 3회 이상 반복된 피드백은 스킬 지침 자체를 수정
```

### 피드백 예시

```markdown
## 카드뉴스
- 03/27: 슬라이드 텍스트가 너무 길다. 본문 50자 이내
- 03/27: 이미지 프롬프트에 "Korean" 명시해야 한국인 나옴

## 숏폼
- 03/27: 30초 기준 씬 5개가 적당. 7개는 너무 빠름
- 03/27: aria 보이스가 나다운세 톤에 가장 맞음

## 광고 카피
- 03/27: CTA는 무조건 1개만. 선택지 주면 클릭률 떨어짐
```

---

## 7. 주의사항

### 이미지 생성 안티패턴

```
❌ 절대 넣지 말 것                    ✅ 대신 사용
floating icons/holograms          → grounded objects, real spaces
neon circuits, robot hands        → natural lighting, film grain
AI-looking glossy renders         → editorial photography feel
text in images                    → "no text, no letters" 명시
```

### 모션 자막 규칙 (숏폼 CRITICAL)

모션 스타일별로 자막 형식이 정해져 있다. 틀리면 **빈 화면** 렌더링.

| motion_style | 자막 필수 형식 |
|-------------|--------------|
| `split_compare` | `**A값** vs **B값**` |
| `counter` | `**숫자%**` 포함 |
| `keyword_pop` | `**키워드**` 볼드 1~2개 |
| `list_reveal` | `**항목1**, **항목2**, **항목3**` |

### API 제한

| 서비스 | 제한 |
|--------|------|
| Unsplash | 개발 모드 50req/hour |
| Jamendo BGM | 비상업적 무료, 월 35,000 요청 |
| ElevenLabs TTS | 플랜별 글자 수 제한 |
| Replicate I2V | 종량제 과금 |

---

## 8. 참고 문서

| 문서 | 위치 |
|------|------|
| 콘텐츠 스튜디오 인수인계서 | `src/docs/plan/콘텐츠 메이커/CONTENT_STUDIO_HANDOVER.md` |
| 브랜딩 전략 | `src/docs/business/★BRANDING_STRATEGY★.md` |
| 콘텐츠 전략 | `src/docs/business/★NADAUNSE_CONTENT_STRATEGY★.md` |
| 고객 페르소나 | `src/docs/marketing/CUSTOMER_PERSONA.md` |
| 디자인 시스템 | `src/docs/develop/★DESIGN_SYSTEM★.md` |
| 하네스 엔지니어링 | `src/docs/develop/HARNESS_ENGINEERING.md` |

---

*최종 업데이트: 2026-03-27*
