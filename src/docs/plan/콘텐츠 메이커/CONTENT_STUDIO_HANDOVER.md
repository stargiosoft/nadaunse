# 콘텐츠 스튜디오 인수인계서

> **작성일**: 2026-03-20
> **상태**: 카드뉴스 메이커 완료 / 숏폼 메이커 완료 / 광고 카피 메이커 완료 / 광고 소재 메이커 완료 / CapCut 프로젝트 내보내기 완료 / 숏폼 모션 그래픽 15종 완료 / 숏폼 AI 이미지 배경 완료 / 숏폼 BGM 자동생성 완료 / 트렌드 추적기 완료 / 밈광고영상 메이커 완료 / **Replicate I2V 영상 배경 완료** / **씬별 다이나믹 컬러 완료**

---

## 1. 개요

AI 기반 콘텐츠 제작 허브. **트렌드 추적기**, **카드뉴스 메이커**, **숏폼 메이커**, **밈광고영상 메이커**, **광고 카피 메이커**, **광고 소재 메이커** 기능이 구현되어 있다.

**진입 경로**: `/contents-maker` (콘텐츠 허브) → `/trend-tracker` (트렌드 추적기) / `/card-news` (카드뉴스) / `/short-form` (숏폼) / `/meme-ad` (밈광고영상) / `/ad-copy` (광고 카피) / `/ad-creative` (광고 소재)

---

## 2. 파일 구조

```
src/
├── pages/
│   ├── ContentStudioPage.tsx      # 콘텐츠 허브 (1depth)
│   ├── TrendTrackerPage.tsx       # 트렌드 추적기 (2depth)
│   ├── CardNewsPage.tsx           # 카드뉴스 메이커 (2depth)
│   ├── ShortFormPage.tsx          # 숏폼 메이커 (2depth)
│   ├── MemeAdPage.tsx              # 밈광고영상 메이커 (2depth)
│   ├── AdCopyPage.tsx             # 광고 카피 메이커 (2depth)
│   └── AdCreativePage.tsx         # 광고 소재 메이커 (2depth)
├── shortform/
│   ├── types.ts                   # Scene, ScriptResult, TtsAudio, MotionStyle 타입 (accent_color/glow_color/backgroundVideoUrl 포함)
│   ├── constants.ts               # VIDEO_WIDTH(1080), HEIGHT(1920), FPS(30)
│   ├── renderVideo.ts             # Canvas + WebCodecs + mp4-muxer 브라우저 MP4 렌더링 (이미지/비디오 배경 + 15종 모션 동기화)
│   └── compositions/
│       ├── ShortFormVideo.tsx      # Remotion 영상 루트 컴포지션 (prevScene 전달)
│       ├── SceneRenderer.tsx       # 씬별 배경 (비디오/이미지/그라디언트) + 다이나믹 컬러 + 모션 디스패치 + 전환 효과
│       ├── SubtitleOverlay.tsx     # 자막 워드별 스프링 애니메이션 (**볼드** 노란색 하이라이트)
│       └── motions/               # 모션 그래픽 컴포넌트 (15종)
│           ├── index.ts           # MOTION_REGISTRY (MotionStyle → 컴포넌트 매핑)
│           ├── types.ts           # MotionComponentProps 인터페이스
│           ├── KeywordPopMotion.tsx    # 키워드 스프링 팝인 (기본)
│           ├── TypewriterMotion.tsx    # 타이핑 효과
│           ├── SlideStackMotion.tsx    # 좌우 슬라이드 스택
│           ├── CounterMotion.tsx       # 숫자 카운트업
│           ├── SplitCompareMotion.tsx  # 좌우 비교 분할 + VS
│           ├── RadialBurstMotion.tsx   # 방사형 버스트
│           ├── ListRevealMotion.tsx    # 리스트 순차 등장
│           ├── ZoomImpactMotion.tsx    # 줌인 임팩트 + 충격파
│           ├── GlitchMotion.tsx       # RGB 분리 글리치
│           ├── WaveMotion.tsx         # 웨이브 텍스트
│           ├── SpotlightMotion.tsx    # 스포트라이트 원형 reveal
│           ├── CardFlipMotion.tsx     # 3D 카드 뒤집기
│           ├── ProgressBarMotion.tsx  # 가로 프로그레스 바
│           ├── EmojiRainMotion.tsx    # 이모지 비
│           └── ParallaxLayersMotion.tsx # 패럴랙스 레이어
├── meme-ad/
│   ├── types.ts                   # HookVideoInfo, MemeAdScriptResult 타입
│   ├── constants.ts               # AD_DURATIONS(5/10/15), HOOK_SITES, 제한값
│   ├── renderMemeAdVideo.ts       # 훅 프레임 추출 + 광고 씬 렌더링 + 오디오 믹싱
│   └── compositions/
│       ├── MemeAdVideo.tsx         # Remotion 합성 (훅 Video + 광고 SceneRenderer)
│       └── TransitionOverlay.tsx   # 전환 효과 (fade/flash/glitch/zoom)
├── capcut/
│   └── generateCapcutProject.ts   # CapCut 프로젝트 JSON + TTS mp3 → ZIP 생성

supabase/functions/
├── search-trends/index.ts         # Apify X 트렌딩 + Gemini 주제별 트렌드 분석
├── generate-card-news/index.ts    # Gemini 2.5 Flash → 슬라이드 기획 JSON
├── generate-card-image/index.ts   # Gemini 2.5 Flash Image → 배경 이미지
├── search-stock-image/index.ts    # Unsplash/Pexels 이미지 검색 프록시
├── generate-short-form/index.ts   # Gemini 2.5 Flash → 숏폼 대본 JSON
├── generate-tts/index.ts          # OpenAI TTS → 나레이션 음성 (mp3 base64)
├── generate-bgm/index.ts         # Jamendo API → 무드별 BGM 검색 (mp3 base64)
├── generate-meme-ad/index.ts      # Gemini 2.5 Flash → 밈광고 대본 JSON
├── generate-ad-copy/index.ts      # Gemini 2.5 Flash → 광고 카피 JSON
├── generate-ad-creative/index.ts  # Gemini 2.5 Flash → 광고 소재 기획안 JSON
├── generate-ad-image/index.ts     # Gemini 2.5 Flash Image → 광고 포스터 이미지
└── generate-scene-video/index.ts  # Replicate Predictions API → 씬별 Image-to-Video (Wan/Hailuo/Kling)
```

---

## 3. 트렌드 추적기 — 완료

### 3.1 기능 흐름 (3모드)

```
[입력 화면]
├── X 실시간 트렌딩 (버튼 클릭)
└── 주제별 트렌드 분석 (키워드 입력 + 분석 버튼)

[X 트렌딩 결과 — 탭 UI]
┌─ [트렌드 탭] ─────────────────┐  ┌─ [AI 분석 탭] ────────────────┐
│ 한국 실시간 트렌딩 50개 리스트   │  │ 오늘의 X 분위기 (한 줄 요약)   │
│ 키워드 탭 → 콘텐츠 만들기       │  │ 카테고리 분류 (3~6개, 태그)    │
│                                │  │ 핵심 인사이트 (3~5개)          │
│                                │  │ 콘텐츠 제작 팁 (2~3개)         │
└────────────────────────────────┘  └────────────────────────────────┘

[주제별 분석 결과]
├── 요약 (2~3문장)
├── 트렌딩 키워드 5~10개 (HOT/WARM/RISING 배지 + 플랫폼 배지)
│   └── 키워드 탭 → 카드뉴스/숏폼/광고카피 만들기
├── 핵심 인사이트 3~5개
└── 콘텐츠 아이디어 3~5개
```

### 3.2 콘텐츠 제작 연동

트렌드 키워드를 탭하면 콘텐츠 제작 도구로 이동하며 주제가 자동 입력됨:
- 카드뉴스: `/card-news?topic={keyword}`
- 숏폼: `/short-form?topic={keyword}`
- 광고 카피: `/ad-copy?product={keyword}`

`useSearchParams`로 query param을 읽어 초기값으로 설정.

### 3.3 기술 스택

| 구성 요소 | 기술 | 역할 |
|-----------|------|------|
| **X 트렌딩** | Apify REST API (`data-slayer/twitter-trends-by-location`) | 한국 실시간 트렌딩 50개 |
| **X 트렌딩 AI 분석** | Gemini 2.5 Flash (JSON 모드) | 트렌딩 키워드 종합 분석 (카테고리/인사이트/팁) |
| **주제 분석** | Gemini 2.5 Flash + Google Search 그라운딩 | 실시간 웹 검색 기반 트렌드 분석 |
| **API 호출** | `fetch(supabaseUrl + '/functions/v1/search-trends')` | 다른 콘텐츠 메이커와 동일 패턴 |
| **텍스트 렌더링** | `renderBoldText()` | `**bold**` 마커 → `<strong>` 변환 |

### 3.4 Edge Function: search-trends

- **역할**: 트렌드 검색 프록시 (3개 모드)
- **입력**: `{ mode, country?, topic? }`
- **모드 분기**:
  - `x-trending`: Apify `run-sync-get-dataset-items` → 정규화된 `TrendItem[]` 반환
  - `trending-insights`: Gemini 2.5 Flash JSON 모드 → 트렌딩 키워드 종합 분석 (카테고리 분류, 인사이트, 콘텐츠 팁)
  - `topic-analysis`: Gemini 2.5 Flash + `google_search` 그라운딩 → 주제별 트렌드 분석 JSON 반환
- **폴백**: Google Search 그라운딩 실패 시 일반 JSON 모드로 재시도
- **JSON 추출**: 마크다운 코드블록 자동 파싱
- **환경변수**: `APIFY_API_TOKEN`, `GOOGLE_API_KEY`
- **배포 옵션**: `--no-verify-jwt`

### 3.5 X 트렌딩 결과 UX

1. X 트렌딩 API 호출 → 키워드 리스트 즉시 표시 (트렌드 탭)
2. **동시에** `trending-insights` 비동기 호출 → AI 분석 탭에 로딩 표시 (`···`)
3. Gemini 응답 완료 → AI 분석 탭 활성화 (카테고리/인사이트/팁)
4. 인사이트 로딩 실패해도 트렌드 리스트는 유지

### 3.6 주제 분석 JSON 구조

```json
{
  "topic": "분석 주제",
  "summary": "트렌드 흐름 요약 (2~3문장)",
  "keywords": [
    {
      "keyword": "트렌딩 키워드",
      "description": "왜 뜨는지 한 줄 설명",
      "platform": "X/인스타/틱톡/유튜브 등",
      "heat": "hot | warm | rising"
    }
  ],
  "insights": ["인사이트 1", "인사이트 2", "인사이트 3"],
  "content_ideas": ["콘텐츠 아이디어 1", "아이디어 2", "아이디어 3"]
}
```

### 3.7 X 트렌딩 인사이트 JSON 구조

```json
{
  "categories": [
    {
      "name": "카테고리명 (예: K-POP)",
      "keywords": ["키워드1", "키워드2"],
      "summary": "이 카테고리 트렌드 한 줄 요약"
    }
  ],
  "top_insights": ["종합 인사이트 1", "인사이트 2"],
  "mood": "현재 X 한국의 전반적인 분위기 한 줄",
  "content_tips": ["콘텐츠 제작 팁 1", "팁 2"]
}
```

### 3.8 비용

| 기능 | 비용 | 비고 |
|------|------|------|
| X 트렌딩 | ~$0.01/회 | Apify Actor (무료 플랜 월 $5 크레딧, ~500회) |
| X 트렌딩 AI 분석 | Gemini API 비용 | 트렌딩 결과 자동 분석 |
| 주제별 분석 | Gemini API 비용 | Google Search 그라운딩 포함 |
| **Apify 무료 플랜** | 월 $5 크레딧 | 카드 미등록 시 한도 초과 자동 차단, 과금 없음 |

---

## 4. 카드뉴스 메이커 — 완료

### 4.1 기능 흐름 (3단계)

```
[Step 1: 입력]         [Step 2: 기획안]        [Step 3: 제작]
주제 텍스트 입력    →   AI 슬라이드 기획     →   이미지 생성 + 다운로드
슬라이드 수 선택        채팅으로 수정 요청       커버 먼저 확인 → 전체 제작
(5/7/10장)             처음으로 / 제작하기       ZIP 다운로드
```

### 4.2 이미지 생성 모드 2가지

| 모드 | 소스 | 특징 |
|------|------|------|
| **Unsplash/Pexels** (기본) | `search-stock-image` Edge Function | 빠름, 무료 사진, attribution 표시 |
| **AI 생성** | `generate-card-image` Edge Function | Gemini Image, 느림, 커스텀 |

### 4.3 제작 프로세스

1. 커버 이미지 먼저 생성 (Unsplash 또는 AI)
2. 사용자가 커버 승인 → 나머지 슬라이드 배치 생성 (3개씩 `Promise.allSettled`)
3. AI 모드에서는 커버 이미지를 `reference_image`로 전달해 톤/스타일 통일
4. 각 슬라이드 hover 시 개별 재생성 가능
5. 전체 완료 후 `html-to-image` + `JSZip`으로 ZIP 다운로드

### 4.4 화면 비율 (7종)

| ID | 플랫폼 | 비율 | 해상도 |
|----|--------|------|--------|
| `ig-portrait` | Instagram | 4:5 | 1080×1350 |
| `ig-square` | Instagram | 1:1 | 1080×1080 |
| `ig-story` | Instagram | 9:16 | 1080×1920 |
| `x-feed` | X (Twitter) | 16:9 | 1200×675 |
| `yt-thumb` | YouTube | 16:9 | 1280×720 |
| `naver-blog` | Naver | 3:4 | 900×1200 |
| `linkedin` | LinkedIn | 1:1 | 1080×1080 |

---

## 4. 숏폼 메이커 — 완료

### 4.1 기능 흐름 (3단계, 6페이즈)

```
[Step 1: 입력]           [Step 2: 대본 검토]       [Step 3: 영상 제작]
주제 텍스트 입력      →   AI 대본 확인           →   Phase A: TTS 나레이션 생성
영상 길이 선택             씬별 타임라인              Phase A+: BGM 검색 (Jamendo, 선택 시)
(10/15/30초)              채팅으로 수정 요청          Phase A-2: AI 배경 이미지 생성 (이미지 타입만)
플랫폼 선택                해시태그/BGM/썸네일         Phase A-3: Replicate I2V 영상 배경 변환 (이미지 타입만)
(릴스/쇼츠/틱톡)           처음으로 / 영상 만들기      Phase B: Remotion 미리보기
영상 타입 선택                                        Phase C: MP4 렌더링
(이미지 기반/모션 그래픽)                              Phase D: 다운로드 (MP4/TXT/CapCut)
I2V 모델 선택 (이미지 타입 시)
(Wan 2.5 / Hailuo Fast / Kling v2.1)
BGM 선택 (드롭다운)
(없음/밝고 경쾌한/차분한/긴장감/감성/힙한/신나는/동기부여/미스터리)
```

### 4.1.1 영상 타입 선택 (2종) — 모두 구현 완료

| 타입 | 설명 | 상태 |
|------|------|------|
| **이미지 기반** (기본값) | 씬별 Gemini AI 이미지 → Replicate I2V 영상 배경 (폴백: Ken Burns) | **구현 완료** |
| **모션 그래픽** | AI 자동 선택 모션 스타일 (15종) + 다이나믹 컬러 팔레트 | **구현 완료** |

- `videoType` 파라미터를 Edge Function에 전달
  - `motion`: 프롬프트에 `motion_style`, `layout`, `icon`, `accent_color`, `glow_color` 필드 추가 → Gemini가 씬별 최적 모션 + 색상 자동 선택
  - `image`: TTS 생성 후 Phase A-2에서 `generate-card-image` 재활용하여 씬별 9:16 배경 이미지 생성 → Phase A-3에서 Replicate I2V로 영상 변환
- I2V 모델 선택 (UI 버튼): Wan 2.5 (~$0.60/영상, 기본) / Hailuo Fast (~$0.90/영상) / Kling v2.1 (~$2.10/영상)

### 4.2 기술 스택

| 구성 요소 | 기술 | 역할 |
|-----------|------|------|
| **대본 생성** | Gemini 2.5 Flash | 씬별 나레이션+자막+비주얼 JSON |
| **나레이션 TTS** | OpenAI TTS (`tts-1`, voice: `nova`) | 씬별 mp3 음성 생성 |
| **배경음악 BGM** | Jamendo API v3.0 | 무드별 로열티 프리 BGM 검색 (CC 라이선스) |
| **영상 배경 I2V** | Replicate Predictions API (Wan 2.5 / Hailuo Fast / Kling v2.1) | 이미지 → 5초 AI 영상 변환 |
| **영상 미리보기** | Remotion `@remotion/player` | 브라우저 내 실시간 재생 |
| **영상 렌더링** | Canvas + WebCodecs + `mp4-muxer` | 브라우저에서 MP4 인코딩 (15종 모션 동기화) |

### 4.3 영상 사양

- **해상도**: 1080×1920 (9:16 세로)
- **FPS**: 30
- **비디오 코덱**: H.264 (avc1.640028, High Profile Level 4.0), 4Mbps
- **오디오 코덱**: AAC (mp4a.40.2), 128kbps, mono 44100Hz
- **브라우저 요구사항**: Chrome/Edge (WebCodecs API 필수) — PC 전용 내부 도구

### 4.4 영상 구성 요소

| 요소 | 이미지 기반 | 모션 그래픽 |
|------|------------|------------|
| **배경** | Replicate I2V 영상 배경 (이미지 → 5초 AI 영상) + 다크 오버레이 + 비네팅 / 폴백: Gemini AI 이미지 + Ken Burns | 씬 타입별 다크 그라디언트 + 그리드 패턴 + 레이디얼 글로우 |
| **모션** | keyword_pop 등 15종 (motion_style 미지정 시 기본) | **AI 자동 선택 15종** (Gemini가 씬별 최적 스타일 + 색상 배정) |
| **자막** | 하단 중앙, `**볼드**` 마커 → 노란색 강조, 스프링 애니메이션 | (동일) |
| **전환** | cut/fade/zoom/slide/blur_in/wipe_left/scale_rotate (7종, 씬별 `transition` 값 기반) + 씬간 색상 블렌딩 | (동일) |
| **오디오** | 씬별 TTS 나레이션 + BGM (Jamendo, 볼륨 25%, 페이드인/아웃) | (동일) |
| **아이콘** | 기본 테마 아이콘 | Gemini가 씬별 `icon` 이모지 자동 선택 |
| **오버레이** | 숨김 (이미지 배경이 비주얼 역할) | X마크/체크/파티클 (씬 타입별) + 떠다니는 도형 |

### 4.5 대본 JSON 구조

```json
{
  "title": "영상 제목",
  "hook": "첫 3초 후킹 멘트",
  "total_duration": 30,
  "scenes": [
    {
      "scene_number": 1,
      "duration": 3,
      "type": "hook",
      "narration": "나레이션 텍스트",
      "subtitle": "화면 자막 (**강조**)",
      "visual": "화면 설명",
      "transition": "cut",
      "motion_style": "zoom_impact",
      "layout": "center",
      "icon": "🔥"
    }
  ],
  "hashtags": ["해시태그1", "해시태그2"],
  "bgm_mood": "밝고 경쾌한",
  "thumbnail_text": "썸네일 텍스트"
}
```

**모션 그래픽 타입 전용 필드** (`videoType === 'motion'` 시에만 생성):
- `motion_style`: 15종 중 1개 (keyword_pop/typewriter/slide_stack/counter/split_compare/radial_burst/list_reveal/zoom_impact/glitch/wave/spotlight/card_flip/progress_bar/emoji_rain/parallax_layers)
- `layout`: center/top_heavy/bottom_heavy/split_left/split_right
- `icon`: 씬 내용에 맞는 이모지 1개
- `accent_color`: 씬 분위기에 맞는 HEX 색상 (예: `#FF6B6B`) — Gemini 자동 선택
- `glow_color`: 글로우/배경 HEX 색상 — accent와 유사 톤

**이미지 기반 타입 전용** (클라이언트에서 추가):
- `backgroundImageUrl`: Phase A-2에서 생성된 이미지 data URL (Scene 객체에 동적 첨부)
- `backgroundVideoUrl`: Phase A-3에서 Replicate I2V로 생성된 영상 URL (CDN)

---

## 5. 밈광고영상 메이커 — 완료

### 5.1 개요

밈 후크 영상(사용자 업로드) + AI 광고 대본을 합성하여 바이럴 광고 영상을 제작. Introhook.com 컨셉 — 시선을 잡는 밈 클립 후 브랜드 광고가 이어지는 구조.

### 5.2 기능 흐름 (3단계)

```
[Step 1: 입력]                    [Step 2: 광고 대본]              [Step 3: 영상 제작]
훅 영상 업로드 (1~10초 MP4)    →   AI 광고 대본 생성            →   Phase A: TTS 나레이션 생성
외부 사이트 링크 CTA               씬별 나레이션/자막              Phase A-2: AI 배경 이미지 생성
브랜드/제품 정보 입력              채팅으로 수정 요청              Phase B: Remotion 미리보기
광고 길이 (5/10/15초)              처음으로 / 영상 만들기           (훅 + 전환효과 + 광고)
플랫폼 (릴스/쇼츠/틱톡)                                          Phase C: MP4 렌더링
전환 효과 (fade/flash/glitch/zoom)                               Phase D: 다운로드 (MP4/TXT)
```

### 5.3 핵심 구성

| 요소 | 설명 |
|------|------|
| **훅 영상** | 사용자 업로드 MP4 (1~10초, 최대 50MB), 드래그&드롭 지원 |
| **외부 사이트 CTA** | Transitional Hooks, VideoHooks.app, AISEO, VideoHooks.art, ViralHooks.org |
| **광고 대본** | Gemini가 브랜드 정보 기반으로 생성 (밈→광고 자연스러운 전환 멘트 포함) |
| **전환 효과** | 4종 — fade(페이드), flash(플래시), glitch(글리치), zoom(줌) |
| **Remotion 미리보기** | `<Video>` 컴포넌트로 훅 재생 + `SceneRenderer` 재사용 |
| **MP4 렌더링** | 훅 프레임 추출(`createImageBitmap`) + 광고 씬 Canvas + 오디오 믹싱 |

### 5.4 기술 구현

- **훅 영상 프레임 추출**: `<video>` → `video.currentTime` 시크 → `createImageBitmap()` → cover-fit으로 1080×1920 매핑
- **훅 오디오 추출**: `fetch(objectURL)` → `AudioContext.decodeAudioData()` (오디오 없으면 무시)
- **전환 렌더링**: 훅 마지막 프레임에서 검정 페이드아웃 → 광고 첫 프레임 페이드인
- **광고 씬**: 숏폼 메이커의 `SceneRenderer`, `SubtitleOverlay`, 모션 컴포넌트 전체 재사용
- **오디오 믹싱**: 훅 오디오 + TTS + BGM을 `OfflineAudioContext`로 합성

### 5.5 광고 대본 JSON 구조

```json
{
  "title": "영상 제목",
  "hook": "밈→광고 연결 멘트",
  "total_duration": 10,
  "ad_duration": 10,
  "scenes": [
    {
      "scene_number": 1,
      "duration": 3,
      "type": "intro",
      "narration": "나레이션",
      "subtitle": "자막 (**강조**)",
      "visual": "화면 설명",
      "transition": "fade",
      "motion_style": "zoom_impact",
      "layout": "center",
      "icon": "🔥"
    }
  ],
  "hashtags": ["해시태그1"],
  "bgm_mood": "BGM 분위기",
  "thumbnail_text": "썸네일"
}
```

### 5.6 씬 타입

`intro` (밈→광고 전환) / `benefit` / `feature` / `testimonial` / `offer` / `cta`

### 5.7 제약사항

| 항목 | 상태 |
|------|------|
| 훅 영상 형식 | MP4/WebM/QuickTime (브라우저 디코딩 가능한 포맷) |
| 프레임 추출 속도 | 5초 훅 = 150프레임, 추출에 5~10초 소요 |
| 메모리 | 훅 ImageBitmap + 광고 이미지 합산 시 큰 훅은 메모리 부담 |
| Chrome/Edge 전용 | WebCodecs API 필수 |
| 훅 영상 해상도 | 자동 cover-fit (중앙 크롭) — 원본 비율 무관 |

---

## 6. 광고 카피 메이커 — 완료

### 6.1 기능 흐름 (2단계)

```
[Step 1: 입력]                    [Step 2: 결과]
제품/서비스 입력 (필수)        →   카피 카드 리스트
타겟 고객 입력 (선택)              각 카피: 헤드라인 + 보조문구 + CTA 버튼
목표 행동 선택                     톤 배지 + 전략 태그 + 설명
(클릭/가입/구매/문의/다운/예약)     개별 복사 / 전체 복사
CTA 위치 선택                      채팅으로 수정 요청
(버튼/배너/팝업/인앱/SNS/이메일)    처음으로 / 다시 생성하기
카피 개수 선택 (3/5/8개)
```

### 6.2 광고 전략 체계 (10가지)

| 분류 | 전략 | 예시 |
|------|------|------|
| 행동경제학 | 1. 손실 회피 | "놓치면 후회" |
| 행동경제학 | 2. 구체적 숫자 | "3가지 신호", "90% 확률" |
| 행동경제학 | 3. 타겟 지목 | "30대 직장인이라면" |
| 행동경제학 | 4. 간편성/즉각성 | "딱 3초면" |
| 카피 유형 | 5. 문제점 자극형 | "아직도 야근하세요?" |
| 카피 유형 | 6. 이익 약속형 | "업무 시간 50% 단축" |
| 카피 유형 | 7. 호기심 유발형 | "1%만 아는 비밀" |
| 카피 유형 | 8. 해결책 제시형 | "이렇게 하면 됩니다" |
| 카피 유형 | 9. 질문 유도형 | "궁금한 게 있으신가요?" |
| 카피 유형 | 10. 행동 촉구형 | "지금 바로 시작하기" |

### 6.3 카피 JSON 구조

```json
{
  "product_summary": "제품/서비스 한 줄 요약",
  "copies": [
    {
      "id": 1,
      "headline": "메인 카피 (20자 이내)",
      "subtext": "보조 설명 문구 (30자 이내)",
      "cta_button": "버튼 텍스트 (10자 이내)",
      "strategies": ["1. 손실 회피"],
      "explanation": "전략 선택 이유 한 줄",
      "tone": "자극적 | 따뜻한 | 유머러스 | 긴급한 | 신뢰감"
    }
  ]
}
```

### 6.4 주요 기능

- **톤 배지**: 5가지 톤별 색상 구분 (자극적=빨강, 따뜻한=주황, 유머러스=노랑, 긴급한=분홍, 신뢰감=파랑)
- **복사 기능**: 개별 카피 복사 + 전체 카피 한 번에 복사
- **채팅 수정**: 기존 결과를 revision 파라미터로 전달하여 수정
- **CTA 미리보기**: 각 카피 카드에 실제 버튼 형태로 CTA 텍스트 표시

---

## 7. 광고 소재 메이커 — 완료

### 7.1 기능 흐름 (3단계)

```
[Step 1: 입력]              [Step 2: 기획안]           [Step 3: 이미지 생성]
제품/서비스 입력 (필수)   →  3개 옵션(A/B/C) 표시   →  선택한 옵션 이미지 생성
타겟 고객 입력 (선택)        전략·카피·디자인·컬러       개별/전체 생성
광고 채널 선택 (7채널)       채팅으로 수정 요청          재생성 / 다운로드
이미지 비율 선택             옵션 선택 → 이미지 생성      기획안 수정으로 돌아가기
목표 행동 선택
```

### 7.2 지원 광고 채널 (7개)

| 채널 | 비율 옵션 |
|------|-----------|
| **인스타그램** | 피드 세로 4:5 (1080×1350) · 피드 정사각 1:1 (1080×1080) · 스토리/릴스 9:16 (1080×1920) |
| **메타 (페이스북)** | 피드 가로 1.91:1 (1200×628) · 피드 정사각 1:1 (1080×1080) · 스토리 9:16 (1080×1920) |
| **GDN (구글)** | 반응형 가로 1.91:1 (1200×628) · 반응형 정사각 1:1 (1200×1200) · 반응형 세로 4:5 (960×1200) |
| **카카오모먼트** | 배너 가로 1.91:1 (1200×628) · 배너 정사각 1:1 (1080×1080) |
| **네이버 GFA** | 배너 가로 1.91:1 (1200×628) · 배너 정사각 1:1 (1080×1080) |
| **유튜브** | 썸네일 16:9 (1280×720) · 범퍼 광고 16:9 (1920×1080) |
| **틱톡** | 피드 세로 9:16 (1080×1920) |

### 7.3 광고 전략 체계

| 분류 | 전략 |
|------|------|
| 행동경제학 | 손실 회피, 구체적 숫자, 타겟 지목, 간편성/즉각성, FOMO, 인정욕구 |
| 카피 유형 | 문제점 자극형, 비교/경쟁 자극형, 경고/파국 암시형, 이익 약속형, 호기심 유발형, 해결책 제시형, 질문/테스트 유도형, 행동 촉구형 |

### 7.4 디자인 선택지 체계

| 요소 | 옵션 |
|------|------|
| 배경 | Bold Solid Color / Soft Gradient / Minimal Texture |
| 메인 비주얼 | Hand+Phone / Hand+Product / Illustration / Product Arrangement / Photo Person / 3D Object |
| 장식 | Cute Minimal 3D / Subtle Sparkles / Graphic Shapes / Minimal Icons / None |
| 텍스트 | Bold Direct / Label Box / Mixed Hierarchy / 3D Typography |

### 7.5 기획안 JSON 구조

```json
{
  "options": [
    {
      "id": "A",
      "strategy_name": "전략명",
      "strategy_description": "기획 의도 한 줄",
      "headline": "메인 카피 (15자 이내)",
      "subtext": "서브 카피",
      "cta_text": "CTA 버튼 텍스트",
      "design": {
        "background": "배경 스타일",
        "main_visual": "비주얼 스타일",
        "decorative": "장식 스타일",
        "typography": "텍스트 스타일",
        "colors": { "main": "#HEX", "sub": "#HEX", "point": "#HEX" }
      },
      "image_prompt": "Narrative-style 영문 프롬프트 (한 문단)"
    }
  ]
}
```

### 7.6 이미지 생성 사양

- **규격**: 채널·비율 선택에 따라 동적 (기본 1080×1350px, 4:5)
- **AI**: Gemini 2.5 Flash Image (`responseModalities: ['TEXT', 'IMAGE']`)
- **프롬프트**: Narrative-style 영문 한 문단 (한글 헤드라인·CTA 포함)
- **AI 티 방지**: 자연스러운 조명/텍스처 사용, neon/floating/cosmic 금지
- **429 재시도**: 3회, 10초/20초/30초 간격

---

## 8. Edge Functions 상세

### 8.1 generate-card-news

- **역할**: 주제 → 슬라이드 기획 JSON 생성
- **AI**: Gemini 2.5 Flash (`responseMimeType: 'application/json'`)
- **입력**: `{ topic, slideCount, ratio }`
- **출력**: `{ title, slides: [{ slide_number, type, headline, subtext?, body?, image_prompt, search_keyword, color_scheme }] }`
- **프롬프트 특징**: 행동경제학 카피 전략 8가지 + AI 클리셰 방지 가이드 포함
- **환경변수**: `GOOGLE_API_KEY`
- **배포 옵션**: `--no-verify-jwt`

### 8.2 generate-card-image

- **역할**: 이미지 프롬프트 → 배경 이미지 (base64 PNG)
- **AI**: Gemini 2.5 Flash Image (`responseModalities: ['TEXT', 'IMAGE']`)
- **입력**: `{ image_prompt?, aspect_ratio?, reference_image?, slide_context? }`
- **재생성**: `slide_context` 전달 시 프롬프트를 자체 구성 (headline, body, type, topic 기반)
- **429 재시도**: 3회, 10초/20초/30초 간격
- **환경변수**: `GOOGLE_API_KEY`
- **배포 옵션**: `--no-verify-jwt`

### 8.3 search-stock-image

- **역할**: Unsplash → Pexels 폴백 이미지 검색 프록시
- **방식**: GET 요청, query params (`query`, `page`, `orientation`)
- **Unsplash 준수사항**:
  - `photo.urls.regular` 핫링크 사용 ✅
  - `photo.id/download` 다운로드 트리거 호출 ✅
  - "Photo by [Name] on Unsplash" attribution + utm 링크 ✅
- **환경변수**: `UNSPLASH_ACCESS_KEY`, `PEXELS_API_KEY`
- **배포 옵션**: `--no-verify-jwt`
- **Unsplash 상태**: 개발 모드 (50req/hour). 프로덕션 신청 시 5,000req/hour

### 8.4 generate-short-form

- **역할**: 주제 → 숏폼 영상 대본 JSON 생성
- **AI**: Gemini 2.5 Flash (`responseMimeType: 'application/json'`)
- **입력**: `{ topic, duration, platform, videoType?, revision? }`
- **출력**: `{ title, hook, total_duration, scenes, hashtags, bgm_mood, thumbnail_text }`
- **프롬프트 특징**: 행동경제학 후킹 전략 5가지 + 자막 스타일 가이드 + 플랫폼별 최적화
- **videoType 분기**: `motion` 시 프롬프트에 모션 스타일 15종 + 색상 팔레트 8계열 + 전환 7종 규칙 추가 → 씬별 `motion_style`, `layout`, `icon`, `accent_color`, `glow_color` 필드 생성
- **환경변수**: `GOOGLE_API_KEY`
- **배포 옵션**: `--no-verify-jwt`

### 8.5 generate-tts

- **역할**: 텍스트 → 나레이션 음성 (mp3 base64)
- **AI**: OpenAI TTS (`tts-1` 모델)
- **입력**: `{ text, voice?, speed? }`
- **출력**: `{ audio: "data:audio/mp3;base64,..." }`
- **기본 설정**: voice=`nova` (한국어 적합), speed=`1.0`
- **환경변수**: `OPENAI_API_KEY`
- **배포 옵션**: `--no-verify-jwt`
- **비용**: ~$0.005/30초 대본 (300자 기준)

### 8.6 generate-bgm

- **역할**: 무드 키워드 → 로열티 프리 BGM 검색 + mp3 base64 반환
- **API**: Jamendo API v3.0 (REST, OAuth 불필요 — Client ID만 사용)
- **입력**: `{ mood, duration? }`
- **출력**: `{ audio: "data:audio/mp3;base64,...", track: { id, name, artist, duration, license, url } }`
- **검색 로직**:
  1. 무드 → 태그 매핑 (예: "밝고 경쾌한" → `happy+upbeat+energetic`)
  2. instrumental 우선, 인기순 정렬, 상위 5곡 중 랜덤 선택
  3. 검색 실패 시 단일 태그 폴백 검색
- **무드 옵션** (9종): 없음, 밝고 경쾌한, 차분하고 편안한, 긴장감 있는, 감성적인, 힙한/트렌디, 신나는, 동기부여, 미스터리
- **오디오 믹싱**: 볼륨 25% + 페이드인(1초) + 페이드아웃(2초)
- **환경변수**: `JAMENDO_CLIENT_ID`
- **배포 옵션**: `--no-verify-jwt`
- **비용**: 무료 (월 35,000 요청, 비상업적)
- **라이선스**: Creative Commons (비상업 무료, 상업용 별도)

### 8.7 generate-meme-ad

- **역할**: 브랜드 정보 → 밈광고 대본 JSON 생성 (광고 부분만)
- **AI**: Gemini 2.5 Flash (`responseMimeType: 'application/json'`)
- **입력**: `{ brandInfo, adDuration, platform, hookDuration }`
- **출력**: `{ title, hook, total_duration, ad_duration, scenes, hashtags, bgm_mood, thumbnail_text }`
- **프롬프트 특징**: 밈→광고 자연스러운 전환 + 행동경제학 전략 5가지 + 모션 스타일 10종 자동 선택
- **씬 타입**: intro, benefit, feature, testimonial, offer, cta
- **환경변수**: `GOOGLE_API_KEY`
- **배포 옵션**: `--no-verify-jwt`

### 8.8 generate-ad-copy

- **역할**: 제품 정보 → 광고 카피 JSON 생성
- **AI**: Gemini 2.5 Flash (`responseMimeType: 'application/json'`)
- **입력**: `{ product, target?, goalAction?, ctaLocation?, copyCount?, revision? }`
- **출력**: `{ product_summary, copies: [{ id, headline, subtext, cta_button, strategies, explanation, tone }] }`
- **프롬프트 특징**: 행동경제학 전략 4가지 + 카피 유형 전략 6가지 + AI 클리셰 방지 가이드
- **수정 요청**: `revision` 파라미터에 기존 결과 + 수정 요청 텍스트 전달
- **환경변수**: `GOOGLE_API_KEY`
- **배포 옵션**: `--no-verify-jwt`

### 8.9 generate-ad-creative

- **역할**: 제품 정보 → 광고 소재 기획안 3개 옵션 JSON 생성
- **AI**: Gemini 2.5 Flash (`responseMimeType: 'application/json'`)
- **입력**: `{ product, target?, goalAction?, revision? }`
- **출력**: `{ options: [{ id, strategy_name, strategy_description, headline, subtext, cta_text, design, image_prompt }] }`
- **프롬프트 특징**: 행동경제학 전략 6가지 + 카피 유형 8가지 + 디자인 선택지 체계 + AI 티 방지 가이드 + Narrative-style 이미지 프롬프트 생성
- **환경변수**: `GOOGLE_API_KEY`
- **배포 옵션**: `--no-verify-jwt`

### 8.10 generate-ad-image

- **역할**: Narrative-style 영문 프롬프트 → 광고 포스터 이미지 (base64 PNG)
- **AI**: Gemini 2.5 Flash Image (`responseModalities: ['TEXT', 'IMAGE']`)
- **입력**: `{ image_prompt, reference_image? }`
- **출력**: `{ image: "base64...", mimeType: "image/png" }`
- **고정 사양**: 4:5 비율 (1080×1350px)
- **429 재시도**: 3회, 10초/20초/30초 간격
- **환경변수**: `GOOGLE_API_KEY`
- **배포 옵션**: `--no-verify-jwt`

### 8.11 generate-scene-video

- **역할**: Replicate Image-to-Video 비동기 프록시 (submit/poll 2단계)
- **API**: Replicate Predictions API (REST)
- **입력 (submit)**: `{ action: 'submit', model?, image_data_url, prompt }`
- **입력 (poll)**: `{ action: 'poll', request_id }`
- **출력 (submit)**: `{ request_id }`
- **출력 (poll)**: `{ status: 'IN_QUEUE'|'IN_PROGRESS'|'COMPLETED'|'FAILED', video_url? }`
- **모델 선택**: `wan` (기본, `wan-video/wan-2.5-i2v`, 최저가) / `hailuo` (`minimax/hailuo-2.3-fast`, 가성비) / `kling` (`kwaivgi/kling-v2.1`, 고품질)
- **비용**: Wan ~$0.10/씬, Hailuo ~$0.15/씬, Kling ~$0.35/씬
- **환경변수**: `REPLICATE_API_TOKEN`
- **배포 옵션**: `--no-verify-jwt`

---

## 9. Supabase Secrets (등록 완료)

| Secret | Staging | Production |
|--------|---------|------------|
| `GOOGLE_API_KEY` | ✅ | ✅ |
| `UNSPLASH_ACCESS_KEY` | ✅ | ✅ |
| `PEXELS_API_KEY` | ✅ | ✅ |
| `OPENAI_API_KEY` | ✅ | ✅ |
| `JAMENDO_CLIENT_ID` | ✅ | ✅ |
| `APIFY_API_TOKEN` | ✅ | ✅ |
| `REPLICATE_API_TOKEN` | ✅ | ✅ |

---

## 10. 라우팅

```tsx
// App.tsx
<Route path="/contents-maker" element={<ContentStudioPage />} />  // 콘텐츠 허브
<Route path="/trend-tracker" element={<TrendTrackerPage />} />     // 트렌드 추적기
<Route path="/card-news" element={<CardNewsPage />} />             // 카드뉴스 메이커
<Route path="/short-form" element={<ShortFormPage />} />           // 숏폼 메이커
<Route path="/meme-ad" element={<MemeAdPage />} />                 // 밈광고영상 메이커
<Route path="/ad-copy" element={<AdCopyPage />} />                 // 광고 카피 메이커
<Route path="/ad-creative" element={<AdCreativePage />} />         // 광고 소재 메이커
```

- 인증 가드 없음 — 비로그인 사용자도 접근 가능

---

## 11. 의존성

```json
// 카드뉴스
"jszip": "^3.x",          // ZIP 다운로드
"html-to-image": "^1.x",  // DOM → PNG 변환

// 숏폼
"remotion": "4.0.379",              // Remotion 코어
"@remotion/player": "4.0.379",     // 브라우저 미리보기 Player
"@remotion/media-utils": "4.0.379", // 오디오 유틸리티
"mp4-muxer": "5.2.2"               // Canvas + WebCodecs → MP4 인코딩
```

---

## 12. 디자인 시스템 적용 현황

- 440px 모바일 레이아웃 (`max-w-[440px]`)
- NavigationHeader 패턴 (52px, ArrowLeft, fixed)
- CTA 버튼 패턴 (56px 높이, 16px radius, `#48b2af`)
- 입력 필드 패턴 (16px radius, `#e7e7e7` border)
- 타이포그래피 토큰 (Pretendard Variable, inline style)
- iOS Safari: `transform-gpu` + `overflow-hidden` 대응
- 색상: `#48b2af` primary, `#151515` text, `#e7e7e7` border 등

---

## 13. 배포 명령어

```bash
# Edge Functions (11개 모두 --no-verify-jwt 필수)
npx supabase functions deploy search-trends --no-verify-jwt --project-ref <PROJECT_ID>
npx supabase functions deploy generate-card-news --no-verify-jwt --project-ref <PROJECT_ID>
npx supabase functions deploy generate-card-image --no-verify-jwt --project-ref <PROJECT_ID>
npx supabase functions deploy search-stock-image --no-verify-jwt --project-ref <PROJECT_ID>
npx supabase functions deploy generate-short-form --no-verify-jwt --project-ref <PROJECT_ID>
npx supabase functions deploy generate-tts --no-verify-jwt --project-ref <PROJECT_ID>
npx supabase functions deploy generate-bgm --no-verify-jwt --project-ref <PROJECT_ID>
npx supabase functions deploy generate-meme-ad --no-verify-jwt --project-ref <PROJECT_ID>
npx supabase functions deploy generate-ad-copy --no-verify-jwt --project-ref <PROJECT_ID>
npx supabase functions deploy generate-ad-creative --no-verify-jwt --project-ref <PROJECT_ID>
npx supabase functions deploy generate-ad-image --no-verify-jwt --project-ref <PROJECT_ID>
npx supabase functions deploy generate-scene-video --no-verify-jwt --project-ref <PROJECT_ID>

# 프론트엔드: staging/production 브랜치 push → Vercel 자동 배포
```

---

## 14. 알려진 제한사항

| 항목 | 상태 | 비고 |
|------|------|------|
| Unsplash 프로덕션 승인 | ⚠️ 미신청 | 현재 50req/hour 제한. 스크린샷 첨부 후 신청 필요 |
| 이미지+텍스트 합성 | ⚠️ 브라우저만 | 서버사이드 합성(Puppeteer) 미구현. 현재 DOM 오버레이 방식 |
| 다운로드 품질 | `pixelRatio: 2` | 6에서 2로 낮춤 (속도 우선). 필요시 조정 가능 |
| CSP 제한 | ⚠️ | Unsplash/Pexels 이미지 URL이 CSP `img-src`에 없음 |
| 숏폼 영상 렌더링 | ⚠️ Chrome/Edge 전용 | WebCodecs API 필요. Safari/Firefox 미지원. PC 내부 도구 전용 |
| ~~숏폼 영상 비주얼~~ | ✅ 해결됨 | 이미지 기반: Replicate I2V 영상 배경 (폴백: Ken Burns) / 모션 그래픽: 15종 모션 + 다이나믹 컬러 + 씬간 블렌딩 |
| CapCut 내보내기 | 프로젝트 파일만 | 공식 API 없어서 자동 편집/렌더링 불가. 수동으로 CapCut에서 열어야 함 |
| ~~영상 타입 선택~~ | ✅ 해결됨 | 이미지 기반 + 모션 그래픽 모두 완전 구현 |
| 이미지 배경 생성 시간 | ⚠️ 느림 | 씬당 5~15초, 6씬 기준 30~90초 (2개씩 병렬). 429 재시도 시 더 길어질 수 있음 |
| 이미지 배경 메모리 | ⚠️ | 씬별 base64 이미지 (1~5MB), 10씬 시 최대 50MB. data URL 방식 |
| BGM Jamendo API | ⚠️ 비상업적 | 월 35,000 요청 무료. 상업적 사용 시 Jamendo 라이선싱 필요 |
| BGM 곡 길이 | ⚠️ | Jamendo 곡이 영상보다 길 수 있음 (자동 트리밍 없이 페이드아웃으로 처리) |
| 밈광고 훅 프레임 추출 | ⚠️ 느림 | 5초 훅 = 150프레임, 추출 5~10초 소요. `<video>` 시크 방식 |
| 밈광고 훅 메모리 | ⚠️ | 150 ImageBitmap + 광고 이미지 합산 시 메모리 부담 가능 |

---

## 15. CapCut 프로젝트 내보내기 — 완료

### 13.1 개요

TTS 나레이션 + 자막을 CapCut 프로젝트 파일(`draft_content.json`)로 변환하여 ZIP 다운로드. 사용자가 CapCut 데스크톱에서 열어 이펙트/전환/모션 그래픽을 직접 추가 편집하는 **반자동** 워크플로우.

**핵심 제약**: CapCut은 공식 API가 없어서 프로그래밍으로 자동 편집(이펙트 적용, 렌더링, 내보내기)을 할 수 **없음**. 리버스 엔지니어링 기반 프로젝트 파일 생성까지가 한계.

### 13.2 구현 파일

- **`src/capcut/generateCapcutProject.ts`** — CapCut JSON 생성 + ZIP 번들링 (브라우저에서 실행)
- ShortFormPage Phase B/D에 "CapCut 내보내기" 버튼 추가

### 13.3 ZIP 내부 구조

```
capcut_project/
├── draft_content.json     # CapCut 프로젝트 파일 (타임라인, 트랙, 소재)
├── draft_meta_info.json   # 프로젝트 메타 정보
└── tts/
    ├── scene_001.mp3      # 씬 1 TTS 나레이션
    ├── scene_002.mp3      # 씬 2 TTS 나레이션
    └── ...
```

### 13.4 CapCut 프로젝트 구성

| 트랙 | 내용 | 위치 |
|------|------|------|
| **Audio** | 씬별 TTS mp3 (순차 배치) | 타임라인 전체 |
| **Text** | 씬별 자막 (흰색, 검정 외곽선) | 하단 중앙 (`y: -0.8`) |

- **시간 단위**: 마이크로초 (1초 = 1,000,000)
- **ID 형식**: 32자 hex UUID (crypto.getRandomValues)
- **오디오 경로**: 상대 경로 `tts/scene_001.mp3` (사용자가 프로젝트 폴더에 압축 해제 후 사용)
- **자막 텍스트**: `**볼드**` 마커 제거한 클린 텍스트 + stroke(외곽선) 적용

### 13.5 사용 방법

1. 숏폼 메이커에서 대본 생성 → TTS 생성 완료
2. Phase B(미리보기) 또는 Phase D(완료)에서 "CapCut 내보내기" 클릭
3. ZIP 파일 다운로드
4. CapCut 프로젝트 폴더에 압축 해제
   - Windows: `C:\Users\<user>\AppData\Local\CapCut\User Data\Projects\com.lveditor.draft\`
5. CapCut 데스크톱에서 프로젝트 열기
6. 이펙트, 전환, 배경, 모션 그래픽 등 수동 편집 후 내보내기

### 13.6 제약사항

| 항목 | 상태 |
|------|------|
| 자동 편집/렌더링 | 불가능 — 공식 API 없음 |
| 이펙트/전환 자동 적용 | 불가능 — resource_id 카탈로그 없음 |
| 오디오 경로 | 상대 경로 사용 — 사용자가 올바른 위치에 압축 해제 필요 |
| CapCut 버전 호환성 | 리버스 엔지니어링 기반 — 업데이트 시 깨질 수 있음 |
| 플랫폼 | 데스크톱(Win/Mac) 전용 |
| 법적 리스크 | 개인 사용 OK, 상용 서비스 법적 검토 필요 |

---

## 16. 숏폼 모션 그래픽 개선 현황

> **상세 로드맵**: [`SHORTFORM_MOTION_ROADMAP.md`](./SHORTFORM_MOTION_ROADMAP.md) 참고

### 현재 숏폼 영상 구성

| 요소 | 이미지 기반 | 모션 그래픽 |
|------|------------|------------|
| 배경 | Replicate I2V 영상 배경 (폴백: Gemini 이미지 + Ken Burns) | 다이나믹 컬러 그라디언트 + 그리드 + 보케/스파클 |
| 중앙 비주얼 | 모션 스타일 기본(keyword_pop) | **AI 자동 선택 18종 모션 + 씬별 다이나믹 컬러** |
| 모션 효과 | 떠다니는 도형 (축소) | 오버레이 (X마크/체크/파티클) + 떠다니는 도형 |
| 자막 | 하단 프로스트 글래스 pill + `**볼드**` 노란색 하이라이트 | (동일) |
| 전환 | cut/fade/zoom/slide | (동일) |
| 오디오 | 씬별 TTS 나레이션 (OpenAI nova) | (동일) |

### 개선 로드맵

| 단계 | 항목 | 설명 | 상태 |
|------|------|------|------|
| ~~단기~~ | ~~씬별 Gemini 이미지 배경~~ | `generate-card-image` 재활용 → Ken Burns 배경 | **완료** |
| ~~단기~~ | ~~AI 모션 스타일 자동 선택~~ | 15종 모션 컴포넌트 + Gemini 자동 배정 + 다이나믹 컬러 | **완료** |
| ~~중기~~ | ~~CapCut 프로젝트 export~~ | `draft_content.json` 생성 → ZIP 다운로드 | **완료** |
| ~~중기~~ | ~~BGM 자동생성 (Jamendo)~~ | 무드별 BGM 검색 → TTS와 믹싱 (볼륨 25%) | **완료** |
| ~~중기~~ | ~~Replicate I2V 영상 배경~~ | 이미지 → 5초 AI 영상 (Wan/Hailuo/Kling 선택) | **완료** |
| ~~중기~~ | ~~모션 3종 추가 + Lottie 인프라~~ | confetti_burst/sparkle_trail/pulse_ring + @remotion/lottie + premountFor + Spring 프리셋 | **완료** |
| **중기** | 영상 편집 자동화 API | Creatomate/Shotstack 등 외부 API로 완전 자동 렌더링 | TODO |
| **중기** | Remotion 업그레이드 + TransitionSeries | 4.0.379→최신, @remotion/transitions 공식 전환 시스템 도입 | TODO |
| **중기** | TTS 오디오 리액티브 비주얼 | visualizeAudio()로 음성/BGM 반응형 배경 글로우/파티클 | TODO |
| **장기** | Lottie 모션 파일 연동 | LottieFiles/After Effects에서 JSON 가져와 모션 오버레이 | TODO |
| **장기** | 렌더링 통합 (Remotion 서버 렌더) | @remotion/renderer로 Preview↔MP4 이중 렌더링 해소 | TODO |
| **장기** | Hera API 연동 | 텍스트→모션 그래픽 전문 API (YC 투자, $29/월~) | TODO |
| **장기** | 자체 모션 그래픽 템플릿 엔진 | 30~50개 Remotion 템플릿 + AI 자동 매칭 | TODO |

### 영상 편집 완전 자동화 옵션 (CapCut 대안)

CapCut은 공식 API가 없어 자동화 불가. 완전 자동화가 필요하면:

| 방법 | 자동화 수준 | 비용 | 비고 |
|------|------------|------|------|
| **현재 Remotion** | 완전 자동 | 무료 | 브라우저 렌더링, 모션 퀄리티 제한 |
| **CapCut 프로젝트** | 반자동 | 무료 | 파일 생성만, 수동 편집 필요 |
| **Creatomate API** | 완전 자동 | 유료 | 템플릿 기반 영상 렌더링 SaaS |
| **Shotstack API** | 완전 자동 | 유료 | JSON→영상 렌더링 API |
| **FFmpeg 서버** | 완전 자동 | 서버 비용 | 직접 구축, 모션 제한적 |

---

**최종 업데이트**: 2026-03-20 (모션 18종으로 확장: confetti_burst/sparkle_trail/pulse_ring 추가 + @remotion/lottie 인프라 + premountFor 프리로드 + SPRING_PRESETS 표준화 5종)
