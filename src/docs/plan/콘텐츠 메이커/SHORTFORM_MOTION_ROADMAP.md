# 숏폼 모션 그래픽 자동화 로드맵

> **작성일**: 2026-03-20
> **목표**: 숏폼 메이커의 영상 퀄리티를 "그라디언트+자막" 수준에서 프로급 모션 그래픽 수준으로 끌어올리기

---

## 현재 상태 (AS-IS)

```
대본 생성 (Gemini) → TTS (OpenAI) → [BGM (Jamendo)] → [이미지 생성 (Gemini)] → [I2V 영상 변환 (Replicate)] → Remotion 미리보기 → MP4 렌더링
```

| 요소 | 현재 구현 |
|------|----------|
| 배경 (모션 그래픽) | **씬별 다이나믹 컬러 그라디언트** (Gemini accent/glow 자동 생성) + 그리드 + 보케/스파클 + 씬간 색상 블렌딩 |
| 배경 (이미지 기반) | **Replicate I2V 영상 배경** (Wan 2.5/Hailuo Fast/Kling v2.1 선택) / 폴백: Gemini AI 이미지 + Ken Burns |
| 중앙 비주얼 | **AI 자동 선택 모션 컴포넌트 (15종)** — 씬 내용에 맞춰 다양하게 배정 |
| 모션 효과 | 씬 타입별 오버레이 (X마크/체크/파티클) + 떠다니는 도형 + 보케 |
| 자막 | 하단 워드별 스프링 애니메이션 + `**볼드**` 노란색 하이라이트 + 배경 블러 pill |
| 전환 | cut/fade/zoom/slide/blur_in/wipe_left/scale_rotate (7종) + 씬간 색상 블렌딩 |
| 오디오 | 씬별 TTS 나레이션 + **BGM (Jamendo, 볼륨 25%, 페이드인/아웃)** |
| 렌더러 동기화 | **renderVideo.ts가 SceneRenderer.tsx와 완전 동기화** — 15종 모션 + 파티클 + 자막 동일 재현 |

**현재 모션 스타일 15종** (`motion_style` — Gemini가 씬별 자동 선택):

| 스타일 | 효과 | 적합한 씬 |
|--------|------|-----------|
| `keyword_pop` | 키워드 스프링 팝인 (기본) | 강조 단어 |
| `typewriter` | 타이핑 + 깜빡이는 커서 | 설명, 인용문 |
| `slide_stack` | 좌우 교차 슬라이드 + 강조 바 | 목록, 비교 |
| `counter` | 숫자 카운트업 + 원형 프로그레스 | 통계, 수치 |
| `split_compare` | 좌우 분할 + VS 배지 | Before/After |
| `radial_burst` | 방사형 라인 + 중앙 글로우 + 충격파 | 결론, 임팩트 |
| `list_reveal` | 번호 원형 + 순차 등장 + 연결선 | 팁 나열 |
| `zoom_impact` | 줌인 + 충격파 링 + 쉐이크 | 핵심 메시지 |
| `glitch` | RGB 분리 + 스캔라인 + 왜곡 | 경고, 문제 |
| `wave` | 글자별 파도 모션 + HSL 색상 변화 | 감성, 부드러운 |
| `spotlight` | 스포트라이트 원형 reveal + 어둠 마스크 | 공개, 비밀 |
| `card_flip` | 3D 카드 뒤집기 + 플래시 | 반전, 비교 |
| `progress_bar` | 가로 프로그레스 바 + 퍼센트 카운트 | 진행률, 수치 |
| `emoji_rain` | 이모지 비 + 중앙 텍스트 | 감정 폭발, 반응 |
| `parallax_layers` | 패럴랙스 레이어 + 파티클 | 깊이감, 스토리 |

---

## ~~단기~~ — 완료

### ~~1. 씬별 Gemini 이미지 배경 추가~~ — 완료 (2026-03-19)

**구현 완료 내역**:
- [x] ShortFormPage에 Phase A-2 (이미지 생성) 추가 — `videoType === 'image'` 시 TTS 후 자동 실행
- [x] `generate-card-image` Edge Function 재활용 (slide_context + aspect_ratio: 9:16)
- [x] 2개씩 병렬 처리 (`Promise.allSettled`) — 429 방지
- [x] SceneRenderer에 Remotion `<Img>` + Ken Burns (줌 1.0→1.15 + 패닝)
- [x] 다크 오버레이 (0.4) + 비네팅으로 텍스트 가독성 확보
- [x] renderVideo.ts Canvas 렌더러에도 ImageBitmap 프리로드 + Ken Burns 드로잉
- [x] 이미지 생성 실패 시 기존 그라디언트 폴백 (backgroundImageUrl 없으면 자동)
- [x] Phase A-2 UI (스피너 + 진행률 표시)

**구현 파일**: `ShortFormPage.tsx`, `SceneRenderer.tsx`, `renderVideo.ts`
**비용**: 씬당 ~$0.01 (Gemini Image), 6씬 기준 ~$0.06/영상

---

### ~~2. AI 기반 모션 스타일 자동 선택~~ — 완료 (2026-03-19, 15종 확장 2026-03-20)

**구현 완료 내역**:
- [x] `types.ts`에 `MotionStyle` (15종), `SceneLayout` 타입 추가
- [x] Scene 타입에 `motion_style`, `layout`, `icon`, `accent_color`, `glow_color`, `backgroundImageUrl`, `backgroundVideoUrl` 필드 추가
- [x] `generate-short-form` Edge Function에서 `videoType === 'motion'` 시 프롬프트에 모션 스타일 규칙 + 색상 팔레트 주입
- [x] Gemini가 씬별로 최적 `motion_style` + `layout` + `icon` + `accent_color` + `glow_color` 자동 선택
- [x] "연속 2개 씬에 같은 motion_style 금지" 규칙으로 시각적 다양성 보장
- [x] **15개** 모션 컴포넌트 구현 (`src/shortform/compositions/motions/`)
- [x] `MOTION_REGISTRY`로 동적 디스패치 — SceneRenderer에서 `scene.motion_style`로 컴포넌트 자동 선택
- [x] **다이나믹 컬러**: `accent_color`/`glow_color`로 씬별 고유 색상 팔레트 (배경 그라디언트 자동 파생)
- [x] **씬간 색상 블렌딩**: `prevScene` 전달 → 처음 15프레임 동안 색상 보간 (부드러운 전환)
- [x] `renderVideo.ts` 완전 동기화 — Canvas에서 15종 모션 + 파티클 + 자막 스프링 동일 재현
- [x] 기존 대본(motion_style 없음)은 `keyword_pop` 폴백으로 하위 호환

**구현 파일**:
```
src/shortform/types.ts                          # MotionStyle (15종), SceneLayout, accent_color/glow_color
src/shortform/compositions/motions/types.ts     # MotionComponentProps 인터페이스
src/shortform/compositions/motions/index.ts     # MOTION_REGISTRY 레지스트리 (15종)
src/shortform/compositions/motions/KeywordPopMotion.tsx
src/shortform/compositions/motions/TypewriterMotion.tsx
src/shortform/compositions/motions/SlideStackMotion.tsx
src/shortform/compositions/motions/CounterMotion.tsx
src/shortform/compositions/motions/SplitCompareMotion.tsx
src/shortform/compositions/motions/RadialBurstMotion.tsx
src/shortform/compositions/motions/ListRevealMotion.tsx
src/shortform/compositions/motions/ZoomImpactMotion.tsx
src/shortform/compositions/motions/GlitchMotion.tsx
src/shortform/compositions/motions/WaveMotion.tsx
src/shortform/compositions/motions/SpotlightMotion.tsx     # 신규
src/shortform/compositions/motions/CardFlipMotion.tsx      # 신규
src/shortform/compositions/motions/ProgressBarMotion.tsx   # 신규
src/shortform/compositions/motions/EmojiRainMotion.tsx     # 신규
src/shortform/compositions/motions/ParallaxLayersMotion.tsx # 신규
src/shortform/compositions/SceneRenderer.tsx    # 다이나믹 컬러 + 씬간 블렌딩 + Video 배경
src/shortform/renderVideo.ts                    # 15종 모션 Canvas 동기화 + 비디오 프레임 추출
supabase/functions/generate-short-form/index.ts # 15종 모션 + accent/glow 색상 프롬프트
```

---

## 중기

### 3. CapCut 프로젝트 export 기능

**개요**: 대본+TTS를 CapCut 프로젝트 파일(`draft_content.json`)로 변환하여 사용자가 CapCut에서 열어 편집할 수 있도록 함

**핵심 인사이트**: CapCut의 프로젝트 파일은 평문 JSON. 수천 개의 내장 모션 그래픽/이펙트/전환 효과를 활용할 수 있음. 렌더링은 CapCut이 담당하므로 브라우저 제약 없음.

**플로우**:
```
대본 생성 → TTS 생성 → [CapCut으로 내보내기] 버튼
→ Edge Function에서 draft_content.json 생성
→ TTS mp3 파일들 + JSON을 ZIP으로 묶어 다운로드
→ 사용자가 CapCut 프로젝트 폴더에 압축 해제
→ CapCut에서 열어서 모션 그래픽/이펙트 적용 + 미세 편집
```

**기술 스택**:
- **JSON 생성**: Edge Function 또는 브라우저에서 `draft_content.json` 구성
- **참고 라이브러리**: pyCapCut (Python, 391 stars), capcut-api (TypeScript)
- **파일 구조**: `draft_content.json` + `draft_meta_info.json` + TTS mp3 파일들

**draft_content.json 핵심 구조**:
```json
{
  "canvas_config": { "height": 1920, "width": 1080 },
  "fps": 30.0,
  "duration": 30000000,
  "materials": {
    "audios": [...],      // TTS mp3 참조
    "texts": [...],       // 씬별 자막
    "transitions": [...]  // 전환 효과
  },
  "tracks": [
    { "type": "audio", "segments": [...] },
    { "type": "text", "segments": [...] }
  ],
  "version": 360000
}
```

**제약사항**:
| 항목 | 상태 |
|------|------|
| 공식 API | 없음 — 리버스 엔지니어링 기반 |
| 법적 리스크 | 개인 사용 OK, 상용 서비스는 불확실 |
| 이펙트 ID | CapCut 내장 resource_id 카탈로그 필요 |
| 파일 경로 | 로컬 절대경로 필수 (사용자 환경 의존) |
| 플랫폼 | 데스크톱(Win/Mac) 전용. 모바일은 클라우드 싱크 |
| 호환성 | CapCut 업데이트 시 깨질 수 있음 |

**난이도**: 중간
**포지셔닝**: 내부 도구/개인 사용 용도로 제공. 상용 서비스 노출 시 법적 검토 필요.

---

### ~~4. BGM 자동생성 (Jamendo API)~~ — 완료 (2026-03-20)

**구현 완료 내역**:
- [x] `generate-bgm` Edge Function 신규 (Jamendo API v3.0 무드별 검색)
- [x] 무드 → 태그 매핑 (예: "밝고 경쾌한" → `happy+upbeat+energetic`)
- [x] Step 1에 BGM 드롭다운 (9개 무드 옵션: 없음/밝고 경쾌한/차분한/긴장감/감성/힙한/신나는/동기부여/미스터리)
- [x] ShortFormPage Phase A+ BGM 생성 단계 추가 (TTS 완료 후, 이미지 생성 전)
- [x] Remotion 컴포지션에 BGM `<Audio>` 트랙 추가 (볼륨 25%)
- [x] renderVideo.ts에서 TTS + BGM 오디오 믹싱 (Web Audio API OfflineAudioContext)
- [x] BGM 볼륨 25% + 페이드인(1초) + 페이드아웃(2초) + 클리핑 방지
- [x] BGM 실패 시에도 영상 제작 계속 진행 (그레이스풀 디그레이드)
- [x] 미리보기에 BGM 트랙 정보 표시 (곡명, 아티스트, CC License)

**구현 파일**:
```
supabase/functions/generate-bgm/index.ts       # Jamendo API 검색 + mp3 base64 반환
src/shortform/types.ts                          # BgmAudio, BgmMood, BGM_MOODS 타입/상수
src/pages/ShortFormPage.tsx                     # BGM 드롭다운 UI + Phase A+ + 믹싱 연동
src/shortform/compositions/ShortFormVideo.tsx   # Remotion BGM 오디오 트랙
src/shortform/renderVideo.ts                    # TTS + BGM PCM 믹싱
```

**기술 선택 — Suno 대신 Jamendo를 선택한 이유**:
| | Jamendo | Suno AI |
|---|---|---|
| 비용 | **무료** (월 35,000건) | ~$0.05/곡 |
| 품질 | 실제 아티스트 음악 | AI 생성 |
| 구현 난이도 | **낮음** (REST 검색) | 중간 (비동기 생성) |
| 라이선스 | CC (비상업 무료) | 유료 플랜 시 상업 OK |
| 속도 | **즉시** (검색+다운로드) | 30초~1분 생성 대기 |

**비용**: 무료 (Jamendo 비상업적 사용)
**환경변수**: `JAMENDO_CLIENT_ID` (Staging/Production 모두 설정 완료)

---

### ~~5. Replicate Image-to-Video 씬별 AI 영상 배경~~ — 완료 (2026-03-20)

**구현 완료 내역**:
- [x] `generate-scene-video` Edge Function 신규 (Replicate Predictions API 연동)
- [x] 2단계 비동기 패턴: submit(prediction 생성) → poll(상태 확인) → video_url 반환
- [x] 모델 3종: Wan 2.5 I2V (기본, 최저가) / Hailuo 2.3 Fast (가성비) / Kling v2.1 (고품질)
- [x] ShortFormPage Phase A-3 추가 (이미지 생성 후 → 영상 변환 → 미리보기)
- [x] 2개씩 배치 제출 + 5초 간격 병렬 폴링 (최대 5분)
- [x] SceneRenderer에 Remotion `<Video>` 배경 지원 (Ken Burns 불필요 — AI 모션)
- [x] renderVideo.ts에서 HTMLVideoElement 프레임 추출 (seek + createImageBitmap)
- [x] 영상 생성 실패 시 이미지 배경으로 그레이스풀 폴백
- [x] Scene 타입에 `backgroundVideoUrl` 필드 추가

**구현 파일**:
```
supabase/functions/generate-scene-video/index.ts  # Replicate Predictions submit/poll
src/shortform/types.ts                            # backgroundVideoUrl 필드
src/pages/ShortFormPage.tsx                        # Phase A-3 + videoGenProgress
src/shortform/compositions/SceneRenderer.tsx       # Video 배경 렌더링
src/shortform/renderVideo.ts                       # 비디오 프레임 추출 + Canvas 드로잉
```

**비용**: Wan ~$0.10/씬 (~$0.60/영상) / Hailuo ~$0.15/씬 (~$0.90/영상) / Kling ~$0.35/씬 (~$2.10/영상)
**환경변수**: `REPLICATE_API_TOKEN` (Staging ✅ / Production ✅ — 설정 완료)
**배포**: `npx supabase functions deploy generate-scene-video --no-verify-jwt`

---

## 장기

### 6. Hera API 연동

**개요**: Hera(hera.video)는 YC 투자 스타트업으로, 텍스트 프롬프트에서 코드 기반 모션 그래픽을 생성하는 전문 도구. "AI 모션 디자이너"를 표방.

**특징**:
- 프롬프트 → 모션 그래픽 코드 생성 (픽셀 생성이 아닌 코드 생성)
- 모든 파라미터 세밀 조정 가능
- Enterprise API 제공
- $29/월부터

**통합 방식**:
```
대본 생성 → 씬별 visual + subtitle → Hera API 호출
→ Hera가 모션 그래픽 영상 생성
→ 씬별 영상을 이어붙여 최종 MP4
```

**검토 필요사항**:
- [ ] Hera Enterprise API 접근 가능 여부 확인
- [ ] 한국어 텍스트 렌더링 지원 여부
- [ ] 영상 출력 포맷 및 해상도 옵션
- [ ] API 응답 시간 및 비용 구조
- [ ] 우리 대본 JSON 형식과의 매핑 방법

**난이도**: 중간 (API 연동 자체는 쉬우나 서비스 검증 필요)

---

### 7. 자체 모션 그래픽 템플릿 엔진

**개요**: Remotion 기반으로 재사용 가능한 모션 그래픽 템플릿 시스템 구축. 씬 타입/키워드에 따라 적절한 템플릿을 자동 매칭.

**구성 요소**:

| 요소 | 설명 |
|------|------|
| 템플릿 라이브러리 | 30~50개 Remotion 컴포넌트 (SVG 아이콘+애니메이션) |
| 키워드→템플릿 매핑 | AI(Gemini)가 씬 내용 분석 → 적합한 템플릿 ID 선택 |
| 파라미터 시스템 | 색상, 텍스트, 크기, 타이밍을 동적으로 주입 |
| 에디터 UI | 사용자가 템플릿 선택/교체 가능한 인터페이스 |

**템플릿 카테고리 예시**:
- 감정: 하트, 별, 이모지 폭발, 눈물, 분노
- 관계: 두 사람 실루엣, 연결선, 거리감
- 경고: X마크, 경고 삼각형, 깨지는 유리
- 긍정: 체크마크, 별 모으기, 레벨업
- 숫자: 카운트다운, 리스트 번호, 퍼센트 차트
- 비교: vs 대결, 저울, 화살표
- 기타: 돋보기, 전구, 열쇠, 지도

**난이도**: 매우 높음 (디자인 리소스 + 개발 시간 대량 소요)
**장점**: 완전한 제어, 외부 의존성 없음, 일관된 브랜드 비주얼

---

## 우선순위 매트릭스

```
                    낮은 비용 ←────────────────→ 높은 비용
                    │                                    │
  높은 퀄리티       │  ~~③CapCut~~ ✅   ⑥Hera API        │
  향상             │  ~~①이미지~~ ✅   ~~⑤AI 영상~~ ✅   │
                    │  ~~②모션~~ ✅     ⑦자체 엔진        │
                    │  ~~④BGM~~ ✅                        │
  낮은 퀄리티       │                                    │
  향상             │                                    │
```

**★ 다음 추천**: ⑥ Hera API — 코드 기반 모션 그래픽 전문 도구로 모션 타입 다양성 대폭 향상

---

## 참고 리서치

### Mirra 분석
- mirra.my는 SNS 마케팅 자동화 플랫폼 (대본 생성 + 스케줄링)
- 영상 렌더링 자체는 별도 엔진 사용 추정
- "Claude Code로 CapCut 프로젝트 파일을 직접 생성" 방식이 커뮤니티에서 화제

### CapCut 프로젝트 파일 기술 조사
- 프로젝트 = 폴더 (draft_content.json + draft_meta_info.json)
- 시간 단위: 마이크로초 (1초 = 1,000,000)
- 구조: materials(소재 정의) + tracks(타임라인 배치)
- 오픈소스: pyCapCut(391★), pyJianYingDraft(2,848★), capcut-mate(490★)
- CapCut 데스크톱은 평문 JSON (Jianying 6+는 암호화)
- 공식 API 없음, 리버스 엔지니어링 기반

### AI 영상 생성 API 시장 (2026)
- **Replicate** (현재 사용): 선불 크레딧, Wan/Hailuo/Kling 등 다수 I2V 모델 호스팅
- fal.ai: 600+ 모델 통합 API (법인카드 결제 불가로 미사용)
- 최저가: Wan 2.5 I2V (~$0.10/씬, Replicate)
- 가성비: Hailuo 2.3 Fast (~$0.15/씬, Replicate)
- 고품질: Kling v2.1 (~$0.35/씬, Replicate)
- 최고 품질: Google Veo 3.1 (~$0.75/초)
- 모션 그래픽 전문: Hera ($29/월~, YC 투자)

---

**최종 업데이트**: 2026-03-20 (①②이미지+모션 15종+다이나믹 컬러 완료, ③CapCut 완료, ④BGM 완료, ⑤I2V: fal.ai→Replicate 전환 완료 / 모델 3종 Wan·Hailuo·Kling / 영상 길이 10·15·30초)
