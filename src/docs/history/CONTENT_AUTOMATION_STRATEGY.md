# 나다운세 콘텐츠 자동화 전략

> **AI 영상 생성 + 카드뉴스 이미지 + 릴스/숏츠 자동화 종합 전략**
> **최종 업데이트**: 2026-03-10

---

## 1. 전략 개요

### 목표
- 네이버 TV 클립, 인스타 릴스, 틱톡, 유튜브 숏츠에 **주 3~5회** 자동 콘텐츠 게시
- 나다운세 고유 브랜드 비주얼 유지하면서 제작 비용/시간 최소화
- 데이터 기반 콘텐츠 양산 (16유형, 오행, 밸런스 등 구조화된 데이터 활용)

### 핵심 원칙
1. **"운세" 단어 사용 금지** — 앱 심사 제약 (MARKETING_DIRECTION.md 참조)
2. **브랜드 일관성** — AI 범용 콘텐츠가 아닌 나다운세 고유 비주얼
3. **투트랙 운영** — 정보형 양산 콘텐츠 + 브랜드 핵심 콘텐츠 분리
4. **API 자동화 우선** — 수동 작업 최소화, 파이프라인으로 구축

---

## 2. 콘텐츠 유형 분류

### A. 정보형 (양산용, 주 3회)

| 콘텐츠 | 예시 | 목적 |
|--------|------|------|
| 오늘의 사주 한마디 | "목(木) 에너지가 강한 날, 새로운 시작에 좋아요" | 채널 유입, 알고리즘 학습 |
| 유형별 특징 리스트 | "열정적 리더 특징 3가지" | 공감 댓글 유도 |
| MBTI vs 사주 비교 | "ENFP인데 사주로 보니까..." | 호기심 유발 |
| 오행 에너지 해설 | "화(火) 에너지 80%인 사람 특징ㅋㅋ" | 밈/유머 바이럴 |

### B. 브랜드 핵심 (고퀄, 주 1~2회)

| 콘텐츠 | 예시 | 목적 |
|--------|------|------|
| 유형 카드 릴스 | 그라디언트 배경 + 이모지 등장 + 유형명 타이핑 + quote | 브랜드 각인, 스크린샷 공유 |
| 밸런스 애니메이션 | 열정/냉정 바 차오르는 모션 + 비율 표시 | 결과 공유 유도 |
| 오행 레이더차트 | 목화토금수 차트 그려지는 애니메이션 | 시각적 임팩트 |
| DNA 분석 결과 | 6축 레이더 + 최고 축 인사이트 | 서비스 체험 유도 |

---

## 3. 기술 스택 & 도구

### 3-1. 투트랙 도구 구성

```
[트랙 A: 정보형 양산]          [트랙 B: 브랜드 핵심]
simple-shorts-generator        Remotion (React)
+ Gemini (콘텐츠 생성)         + 나다운세 디자인 시스템
+ edge-tts (무료 나레이션)     + 구조화된 JSON 데이터
+ ffmpeg (합성)                + Pika API (이미지 모션 보조)
         ↓                              ↓
         └──────── 자동 게시 ────────────┘
              Meta Graph API / 수동 업로드
```

### 3-2. 도구별 역할

| 도구 | 역할 | 비용 |
|------|------|------|
| **simple-shorts-generator** | 정보형 숏츠 엔드투엔드 생성 (주제 → 완성 영상) | 무료 |
| **Remotion** | 브랜드 콘텐츠 템플릿 기반 영상 렌더링 | 무료 (로컬 렌더) |
| **Gemini API** | 콘텐츠 텍스트 생성 (유형 해설, 오행 해석 등) | 무료 티어 |
| **edge-tts** | 나레이션 음성 생성 | 무료 |
| **ffmpeg** | 영상 합성, 포맷 변환 | 무료 |
| **Grok Imagine** | 유형별 배경 이미지, 일러스트 생성 | 무료 |
| **Pika API** | 정적 이미지 → 모션 영상 변환 (배경 흐름 등) | 유료 (보조용) |
| **Hailuo** | 오행 원소 느낌 다이나믹 배경 소스 생성 | 유료 (보조용) |

### 3-3. AI 영상 생성 도구 용도 정리

| 도구 | 나다운세 용도 | 우선순위 |
|------|-------------|----------|
| **Pika** | 유형 카드 이미지에 미묘한 모션 추가 (숏폼 특화, API 지원) | 높음 |
| **Hailuo** | 불/물/나무/금속/흙 오행 배경 소스 생성 | 중간 |
| **Kling 2.0** | 유형별 실사풍 인물 영상 (퀄리티 업그레이드용) | 낮음 |
| **Midjourney Video** | 16유형 일관된 스타일 애니메이션 (브랜드 톤 유지) | 낮음 |
| **Grok Imagine** | 무료 이미지 양산 (배경, 일러스트) | 높음 |

---

## 4. 카드뉴스 이미지 자동화

### 4-1. 파이프라인

```
[데이터 소스]                    [이미지 생성]              [출력]
나다움 16유형 JSON ──────→ 템플릿 엔진 ──────→ 카드 이미지 (1080x1920)
오행 에너지 비율 ──────→   (Canvas API /     ──────→ 인스타 피드용 (1080x1080)
밸런스 비율 ──────────→    Satori + sharp)   ──────→ OG Image (1200x630)
오늘의 인사이트 텍스트 ─→                     ──────→ 네이버 TV 썸네일
```

### 4-2. 카드뉴스 템플릿 종류

| 템플릿 | 구성 | 데이터 |
|--------|------|--------|
| **유형 카드** | 그라디언트 배경 + 이모지 + 유형명 + 부제 + quote | `computeNadaumType()` 16종 |
| **밸런스 카드** | 열정🔥/냉정🧊 바 + 비율 숫자 + 인사이트 | 밸런스 비율 데이터 |
| **오행 카드** | 오행 아이콘 5개 + 비율 바 + 최고 에너지 해설 | 만세력 목화토금수 |
| **오늘의 한마디** | 미니멀 배경 + 날짜 + 사주 인사이트 텍스트 | Gemini 생성 텍스트 |
| **VS 비교** | 좌우 분할 + MBTI vs 사주 유형 | 유형 매핑 데이터 |

### 4-3. 기술 구현 옵션

| 방식 | 장점 | 단점 |
|------|------|------|
| **Satori + sharp** (Vercel 방식) | JSX로 디자인, 서버사이드 렌더링, OG Image 겸용 | 복잡한 애니메이션 불가 |
| **Canvas API (Node)** | 자유도 높음, 로컬 실행 | 코드량 많음 |
| **Remotion Still** | React 컴포넌트 그대로 이미지 출력 | Remotion 의존 |
| **Figma API + Export** | 디자이너 협업 용이 | API 호출 제한 |

**추천**: **Remotion Still** — 영상 템플릿과 이미지 템플릿을 하나의 React 컴포넌트로 관리

---

## 5. 밈 GIF 자동 생성 (API 불필요)

### 5-1. 개요

밈 수준의 GIF는 AI 모션 API 없이 **Remotion만으로 완전 자동화** 가능.
나다운세 React 컴포넌트/데이터를 그대로 재활용하므로 추가 비용 없음.

### 5-2. 밈 GIF 유형

| 유형 | 예시 | 애니메이션 |
|------|------|-----------|
| **오행 에너지 밈** | "화(火) 80%인 사람 특징ㅋㅋ" | 🔥 이모지 바운스 + 바 차오르기 |
| **유형 등장** | "열정적 리더 등장!" | 텍스트 타이핑 + 이모지 확대 |
| **밸런스 비교** | "열정 vs 냉정 당신은?" | 좌우 바 동시 차오르기 + 비율 숫자 |
| **MBTI vs 사주** | "ENFP인데 사주로 보면..." | 좌우 카드 슬라이드 + 텍스트 페이드 |
| **오늘의 한마디** | "오늘은 금(金) 에너지의 날" | 배경 그라디언트 전환 + 텍스트 등장 |

### 5-3. 사용 가능한 애니메이션 효과

- 텍스트: 타이핑, 페이드인, 확대/축소, 슬라이드
- 이모지: 바운스, 흔들림(wiggle), 회전, 팝업
- 차트: 바 채우기, 숫자 카운트업
- 배경: 그라디언트 전환, 컬러 시프트
- 전환: 페이드, 슬라이드, 스케일

### 5-4. 기술 구현

**Remotion GIF 렌더링**:
```bash
# 단일 밈 GIF
npx remotion render MemeOhang --codec=gif --image-format=png out/ohang-fire.gif

# ffmpeg로 최적화 (용량 축소)
ffmpeg -i out/ohang-fire.gif -vf "fps=15,scale=540:-1:flags=lanczos" -loop 0 out/ohang-fire-opt.gif
```

**GIF 스펙**:
- 해상도: 540x960 (9:16) 또는 540x540 (1:1, 인스타 피드)
- FPS: 12~15 (밈은 낮은 FPS가 오히려 자연스러움)
- 길이: 2~5초
- 용량 목표: 5MB 이하 (SNS 업로드 제한 고려)

**Remotion 컴포지션 구조**:
```
nadaunse-video/src/compositions/memes/
├── MemeOhang.tsx          → 오행 에너지 밈
├── MemeTypeReveal.tsx     → 유형 등장 밈
├── MemeBalance.tsx        → 밸런스 비교 밈
├── MemeVsCompare.tsx      → MBTI vs 사주 밈
└── MemeDailyQuote.tsx     → 오늘의 한마디 밈
```

### 5-5. 활용처

| 채널 | 용도 |
|------|------|
| 인스타 스토리/피드 | 카드뉴스 대신 GIF로 주목도 ↑ |
| 틱톡 댓글/커뮤니티 | 밈 GIF 공유 → 바이럴 |
| 카카오톡 공유 | 결과 공유 시 GIF 첨부 |
| 서비스 내 | 나다움 분석 결과를 GIF로 저장/공유 |

---

## 6. AI 영상 자동화 파이프라인

### 6-1. 트랙 A: 정보형 숏츠 (simple-shorts-generator)

```bash
# 설치
git clone https://github.com/Daewooki/simple-shorts-generator
pip install -r requirements.txt

# 실행 (주제만 입력)
python main.py --topic "화(火) 에너지가 강한 사람의 3가지 특징"
```

**커스터마이징 (config)**:
- 테마 색상: 나다운세 브랜드 컬러
- TTS 음성: 한국어 여성 (ko-KR-SunHiNeural)
- 읽기 속도: 1.1x
- 배경: 오행 관련 이미지 또는 Grok Imagine으로 생성한 소스
- 자막 스타일: 나다운세 폰트/색상

**자동화 스케줄**:
```
월/수/금 오전 9시 → Gemini로 주제 3개 생성 → 영상 3개 자동 렌더
```

### 6-2. 트랙 B: 브랜드 릴스 (Remotion)

```
[프로젝트 구조]
nadaunse-video/
├── src/
│   ├── compositions/
│   │   ├── TypeCardReel.tsx        → 유형 카드 릴스 (16종)
│   │   ├── BalanceReel.tsx         → 열정/냉정 밸런스 애니메이션
│   │   ├── OhangReel.tsx          → 오행 에너지 차트 애니메이션
│   │   ├── DnaRadarReel.tsx       → DNA 레이더차트 애니메이션
│   │   ├── VsCompareReel.tsx      → MBTI vs 사주 비교
│   │   └── DailyInsightReel.tsx   → 오늘의 사주 한마디
│   ├── components/
│   │   ├── GradientBackground.tsx → 그라디언트 배경 (유형별 색상)
│   │   ├── TypeEmoji.tsx          → 이모지 등장 애니메이션
│   │   ├── TypingText.tsx         → 타이핑 효과
│   │   ├── BarFillAnimation.tsx   → 바 차오르는 애니메이션
│   │   └── RadarChart.tsx         → 레이더차트 드로잉
│   ├── data/
│   │   ├── types.json             → 16유형 데이터
│   │   ├── ohang.json             → 오행 해설 데이터
│   │   └── balance.json           → 밸런스 인사이트 데이터
│   └── styles/
│       └── brand.ts               → 나다운세 브랜드 컬러/폰트
├── render.ts                      → 배치 렌더링 스크립트
└── package.json
```

**렌더링 자동화**:
```bash
# 16유형 카드 릴스 전체 렌더
npx remotion render TypeCardReel --props='{"typeIndex":0}' out/type-0.mp4
# ... 반복 또는 배치 스크립트

# 배치 렌더 (render.ts)
npx ts-node render.ts --composition=TypeCardReel --all
```

**영상 스펙**:
- 해상도: 1080x1920 (9:16 세로)
- 길이: 15~30초
- FPS: 30
- 포맷: MP4 (H.264)

### 6-3. 이미지 모션 보강 (Pika API)

```
[정적 유형 카드 이미지]
        ↓
  Pika API 호출
  (motion: "subtle background flow", duration: 4s)
        ↓
  [모션이 추가된 4초 클립]
        ↓
  ffmpeg로 나레이션 합성 → 완성 릴스
```

**용도**: Remotion 애니메이션이 부족할 때, 정적 이미지에 생동감 추가

---

## 7. 게시 자동화

### 7-1. 플랫폼별 스펙

| 플랫폼 | 비율 | 최대 길이 | 게시 방법 |
|--------|------|----------|----------|
| 인스타 릴스 | 9:16 | 90초 | Meta Graph API |
| 틱톡 | 9:16 | 60초 | TikTok API / 수동 |
| 유튜브 숏츠 | 9:16 | 60초 | YouTube Data API |
| 네이버 TV 클립 | 9:16 | 60초 | 수동 업로드 (API 미지원) |

### 7-2. 자동 게시 파이프라인

```
[렌더 완료된 영상 파일]
        ↓
  게시 스크립트 (Node.js / Python)
        ↓
  ┌─ Meta Graph API → 인스타 릴스 (자동)
  ├─ YouTube Data API → 숏츠 (자동)
  ├─ TikTok Content Posting API → 틱톡 (자동)
  └─ 네이버 TV → 수동 업로드 (알림만)
```

### 7-3. 스케줄링

| 요일 | 콘텐츠 | 트랙 |
|------|--------|------|
| 월 | 오늘의 사주 한마디 | A (정보형) |
| 화 | 유형 카드 릴스 (16유형 순환) | B (브랜드) |
| 수 | 오행 에너지 해설 | A (정보형) |
| 목 | 밸런스/DNA 애니메이션 | B (브랜드) |
| 금 | MBTI vs 사주 비교 | A (정보형) |

---

## 8. 실행 로드맵

### Phase 1: 빠른 시작 (1~2주)

- [ ] simple-shorts-generator 설치 + 나다운세 config 커스터마이징
- [ ] Grok Imagine으로 오행/유형 배경 이미지 20장 생성
- [ ] 정보형 숏츠 5개 테스트 제작 → 네이버 TV 클립 + 틱톡 업로드
- [ ] 채널 키워드/설명 세팅 완료

### Phase 2: Remotion 브랜드 콘텐츠 (2~4주)

- [ ] Remotion 프로젝트 세팅 (nadaunse-video 별도 레포)
- [ ] TypeCardReel 템플릿 1종 완성 → 16유형 데이터 주입 테스트
- [ ] BalanceReel, OhangReel 템플릿 추가
- [ ] 배치 렌더링 스크립트 작성
- [ ] Remotion Still로 카드뉴스 이미지 자동 생성 파이프라인

### Phase 3: 완전 자동화 (4~6주)

- [ ] Gemini API 연동 → 주제 자동 생성
- [ ] Meta Graph API 연동 → 릴스 자동 게시
- [ ] YouTube Data API 연동 → 숏츠 자동 게시
- [ ] 주간 스케줄러 (cron 또는 GitHub Actions)
- [ ] Pika API 연동 → 이미지 모션 보강 (선택)

### Phase 4: 최적화 (지속)

- [ ] 조회수/참여율 기반 콘텐츠 유형 A/B 테스트
- [ ] 고성과 템플릿 추가 제작
- [ ] 댓글 반응 기반 주제 자동 선정 (Gemini 분석)
- [ ] OG Image 자동 생성 → 서비스 내 공유 카드 연동

---

## 9. 비용 요약

| 항목 | 월 비용 |
|------|---------|
| simple-shorts-generator (Gemini + edge-tts + ffmpeg) | 무료 |
| Remotion (로컬 렌더링) | 무료 |
| Grok Imagine (이미지 생성) | 무료 |
| Pika API (이미지 모션, 선택) | ~$30/월 |
| Meta Graph API / YouTube API | 무료 |
| **합계** | **무료 ~ $30/월** |

---

## 10. 참고 자료

| 리소스 | URL |
|--------|-----|
| simple-shorts-generator | https://github.com/Daewooki/simple-shorts-generator |
| Remotion 공식 | https://www.remotion.dev/ |
| Remotion Skills (AI 영상 생성) | https://www.remotion.dev/skills |
| Pika API | https://pika.art/ |
| Grok Imagine | https://x.ai/ |
| Meta Graph API (릴스 게시) | https://developers.facebook.com/docs/instagram-platform |
| YouTube Data API | https://developers.google.com/youtube/v3 |
| edge-tts | https://github.com/rany2/edge-tts |
| MARKETING_DIRECTION.md | 마케팅 방향성 (카피 규칙, 바이럴 전략) |

---

**최종 업데이트**: 2026-03-10
