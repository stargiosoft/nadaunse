// Supabase Edge Function: AI 숏폼 대본 생성 (Gemini 2.5 Flash)
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { getCorsHeaders, handleCorsPreflightRequest } from '../server/cors.ts'

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return handleCorsPreflightRequest(req)
  }

  const corsHeaders = getCorsHeaders(req)

  try {
    const { topic, duration, platform, style, videoType, motionTheme, revision } = await req.json()

    if (!topic?.trim()) {
      return new Response(JSON.stringify({ error: '주제를 입력해주세요' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const apiKey = Deno.env.get('GOOGLE_API_KEY')
    if (!apiKey) {
      return new Response(JSON.stringify({ error: 'GOOGLE_API_KEY not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const dur = duration || 30
    const st = style || platform || 'informative'

    const styleGuide: Record<string, string> = {
      informative: '정보 전달형: 핵심 팩트·수치 중심, 체계적 구성(리스트/비교), 신뢰감 있는 톤, 자막에 숫자·데이터 강조',
      storytelling: '스토리텔링형: 기승전결 서사 구조, 감정 이입 유도, 공감 포인트 배치, 점진적 몰입감, 드라마틱한 전환',
      viral: '바이럴형: 충격적 후킹, 빠른 전환, 논쟁/호기심 유발, FOMO·손실회피 극대화, 공유 욕구 자극, 자극적 자막',
      // legacy platform values → fallback
      reels: '인스타 릴스 스타일: 자막 필수, 첫 3초 후킹 핵심, 감각적 전환',
      shorts: '유튜브 쇼츠 스타일: 정보형 콘텐츠 강점, 체계적 구성',
      tiktok: '틱톡 스타일: 트렌드 활용, 빠른 전환, 바이럴 요소',
    }

    const isMotionType = videoType === 'motion'

    const motionFields = isMotionType ? `
      "motion_style": "모션 그래픽 스타일 (아래 15가지 중 택1)",
      "layout": "레이아웃 (center/top_heavy/bottom_heavy/split_left/split_right)",
      "icon": "씬 내용에 맞는 이모지 1개",
      "accent_color": "#hex (씬 강조색, 아래 색상 가이드 참고)",
      "glow_color": "#hex (발광색, accent와 유사하되 약간 밝거나 다른 톤)",` : ''

    const motionRules = isMotionType ? `

★ 모션 그래픽 스타일 규칙 (motion_style) — 15가지:
- keyword_pop: 키워드가 크게 팝인 (기본, 강조할 단어 1~3개가 있을 때)
- typewriter: 타이핑 효과 (설명/인용문/대화체 씬)
- slide_stack: 좌우에서 슬라이드하며 쌓기 (목록/비교 씬)
- counter: 숫자 카운트업 + 원형 프로그레스 링 (수치/통계가 핵심인 씬)
- split_compare: 좌우 분할 비교 (Before/After, 좋은것/나쁜것)
- radial_burst: 중앙에서 네온 방사형 버스트 (임팩트/놀라움/결론)
- list_reveal: 번호 매긴 항목이 순차 등장 (팁 나열, 이유 나열)
- zoom_impact: 줌인 + 카메라 플래시 (핵심 메시지, 결론)
- glitch: 글리치/VHS 왜곡 효과 (문제 제기, 경고, 충격적 사실)
- wave: 글자가 파도처럼 출렁 (감성적, 부드러운 씬)
- spotlight: 어둠 속 스포트라이트 원형 reveal (비밀, 핵심 발견, 놀라운 사실)
- card_flip: 3D 카드 뒤집기 (반전, 질문→답, Before/After)
- progress_bar: 가로 프로그레스 바 + 퍼센트 (달성률, 비율, 통계)
- emoji_rain: 이모지 비 + 중앙 텍스트 (감성, 축하, 강조)
- parallax_layers: 3단 패럴랙스 레이어 (스토리텔링, 설명, 흐름)

중요: 연속 2개 씬에 같은 motion_style 금지! 시각적 다양성을 위해 다양하게 배분.
씬 내용에 가장 어울리는 스타일 선택. 15가지를 골고루 활용할 것.

★ 씬별 색상 팔레트 (accent_color, glow_color):
씬 분위기에 맞는 색상 조합을 선택. 연속 씬이 같은 색상이면 단조로우니 다양하게!
${motionTheme === 'colorful_pop' ? `비주얼 스타일: 컬러풀 팝 — 밝은 배경 위에 선명하고 채도 높은 플랫 컬러.
- 코랄 레드: accent "#FF6B6B", glow "#FF8E8E" (임팩트, 후킹)
- 틸 그린: accent "#4ECDC4", glow "#6ED8D0" (신선, 긍정)
- 로열 퍼플: accent "#7C3AED", glow "#9B6BF7" (창의, CTA)
- 선셋 오렌지: accent "#FF8C42", glow "#FFB066" (에너지, 활력)
- 오션 블루: accent "#2563EB", glow "#4B83F0" (신뢰, 정보)
- 핫 핑크: accent "#EC4899", glow "#F472B6" (감성, 바이럴)
밝은 배경이므로 충분히 진한 색상 사용. 파스텔은 피할 것.`
: motionTheme === 'pastel_soft' ? `비주얼 스타일: 파스텔 소프트 — 부드럽고 따뜻한 파스텔 톤.
- 라벤더: accent "#A78BFA", glow "#C4B5FD" (감성, 편안)
- 로즈 핑크: accent "#F9A8D4", glow "#FBCFE8" (사랑, 공감)
- 민트: accent "#6EE7B7", glow "#A7F3D0" (신선, 성장)
- 스카이: accent "#7DD3FC", glow "#BAE6FD" (차분, 신뢰)
- 피치: accent "#FDBA74", glow "#FED7AA" (따뜻, 활력)
- 라일락: accent "#C084FC", glow "#D8B4FE" (창의, 영감)
부드럽고 눈이 편한 파스텔 톤 사용. 너무 진한 색 피할 것.`
: motionTheme === 'gradient_vivid' ? `비주얼 스타일: 그라디언트 비비드 — 화려한 컬러 그라디언트 배경 위 밝은 텍스트.
- 핫 핑크: accent "#FF6B9D", glow "#FF8FB8" (바이럴, 임팩트)
- 일렉트릭 퍼플: accent "#A855F7", glow "#C084FC" (창의, CTA)
- 시안: accent "#22D3EE", glow "#67E8F9" (트렌디, 테크)
- 골든 옐로우: accent "#FBBF24", glow "#FCD34D" (성공, 밝음)
- 라임: accent "#84CC16", glow "#A3E635" (신선, 성장)
- 화이트: accent "#FFFFFF", glow "#F0F0FF" (깔끔한 강조)
그라디언트 배경과 대비되는 밝은 색상 위주. 흰색도 적극 활용.`
: motionTheme === 'dark_impact' ? `비주얼 스타일: 다크 임팩트 — 딥 네이비 배경 위에 강렬한 대비.
- 코랄/핑크: accent "#FF4D6A", glow "#FF6B8A" (가장 자주 사용, 임팩트)
- 핫핑크: accent "#FF2D78", glow "#FF5A93" (강렬한 후킹)
- 시안: accent "#00D4FF", glow "#4DDBFF" (대비, 정보)
- 화이트 골드: accent "#FFD700", glow "#FFED4A" (프리미엄)
- 네온 그린: accent "#00FF88", glow "#33FF99" (성장, 해결)
- 일렉트릭 퍼플: accent "#BF5AF2", glow "#D98EF7" (창의, CTA)
큰 텍스트가 핵심이므로 채도 높은 색상 위주로 선택.`
: `비주얼 스타일: 블랙 네온 — 순수 블랙 배경 위 네온 컬러.
- 네온 그린: accent "#00FF88", glow "#33FF99" (신선, 테크, 성장)
- 네온 시안: accent "#00FFFF", glow "#33FFFF" (미래, 테크)
- 네온 마젠타: accent "#FF00FF", glow "#FF33FF" (창의, 임팩트)
- 일렉트릭 블루: accent "#0088FF", glow "#33AAFF" (신뢰, 정보)
- 네온 옐로우: accent "#FFFF00", glow "#FFFF44" (경고, 주의)
- 네온 레드: accent "#FF0044", glow "#FF3366" (긴급, 후킹)
네온 사인 같은 강렬한 채도의 색상만 사용.`}
위 조합을 참고하되, 씬 내용에 맞게 자유롭게 조합 가능. 반드시 #hex 6자리 포맷.

★ 전환 효과 (transition) — 7가지:
cut, fade, zoom, slide, blur_in, wipe_left, scale_rotate
다양하게 섞어 사용. 연속 같은 전환 금지.` : ''

    const prompt = `당신은 숏폼 영상 대본 전문 작가이자 SNS 바이럴 콘텐츠 기획자입니다.

주제: "${topic}"
스타일: ${styleGuide[st] || styleGuide.informative}
목표 길이: 약 ${dur}초

다음 JSON 형식으로 숏폼 영상 대본을 작성해주세요:

{
  "title": "영상 제목 (30자 이내, 검색/추천 최적화)",
  "hook": "첫 3초 후킹 멘트 (시청자를 붙잡는 한 문장)",
  "total_duration": ${dur},
  "scenes": [
    {
      "scene_number": 1,
      "duration": 3,
      "type": "hook",
      "narration": "나레이션 텍스트 (읽는 속도 기준 해당 초 분량)",
      "subtitle": "화면에 표시될 자막 (짧고 임팩트 있게, 10자 이내)",
      "visual": "화면 설명 (어떤 영상/이미지를 보여줄지)",
      "transition": "전환 효과 (cut/fade/zoom/slide/blur_in/wipe_left/scale_rotate)"${motionFields ? ',' : ''}${motionFields}
    }
  ],
  "hashtags": ["관련해시태그1", "관련해시태그2", "...최대10개"],
  "bgm_mood": "추천 BGM 분위기 (예: 밝고 경쾌한, 긴장감 있는, 잔잔한)",
  "thumbnail_text": "썸네일에 넣을 텍스트 (8자 이내, 강렬한 후킹)"
}

★ 대본 작성 규칙:
1. 첫 번째 씬(hook): 반드시 3초 이내. "~하면 큰일납니다", "이거 모르면 손해", "딱 1분만 투자하세요" 등 시청 유지를 위한 강한 후킹
2. 씬 전환: ${dur}초 기준 ${dur <= 15 ? '3~4개' : dur <= 30 ? '5~7개' : '7~10개'} 씬으로 구성. 각 씬은 2~5초
3. 나레이션: 자연스러운 구어체, 1초에 약 3~4음절 기준으로 분량 조절
4. 자막: 화면에 표시할 핵심 키워드만. 나레이션 전체를 자막으로 넣지 말 것
5. 마지막 씬: CTA (팔로우/좋아요/댓글/공유 유도) 또는 여운 남기기
6. visual: 구체적으로 어떤 화면을 촬영/편집할지 설명 (예: "데스크 위 노트북 클로즈업", "텍스트 애니메이션: 숫자 카운트업")
7. 전체 duration 합이 목표 길이(${dur}초)와 일치하도록
8. JSON만 반환, 마크다운/설명 없이

★ 후킹 전략 (행동경제학 기반):
- 손실 회피: "이거 안 하면 손해봅니다"
- 구체적 숫자: "3가지만 기억하세요"
- FOMO: "요즘 다들 이렇게 합니다"
- 호기심 유발: "결과가 충격적이었습니다"
- 타겟 지목: "20대라면 무조건 봐야 할"

★ 자막 스타일 가이드:
- 핵심 키워드만 크게 (나레이션의 20~30%만 자막화)
- 숫자/통계는 반드시 자막에 포함
- 강조 단어: 색상 변경 또는 크기 키우기 표시 (예: "**강조단어**")
- 이모지 적절히 활용${motionRules}`

    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            responseMimeType: 'application/json',
            temperature: 0.85,
          },
        }),
      }
    )

    if (!geminiRes.ok) {
      const errText = await geminiRes.text()
      console.error('[generate-short-form] Gemini error:', errText)
      return new Response(JSON.stringify({ error: `Gemini API 오류: ${geminiRes.status}` }), {
        status: 502,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const geminiData = await geminiRes.json()
    const text = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text

    if (!text) {
      return new Response(JSON.stringify({ error: 'Gemini 응답이 비어있습니다' }), {
        status: 502,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const result = JSON.parse(text)

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    console.error('[generate-short-form] Error:', err)
    return new Response(JSON.stringify({ error: `생성 실패: ${(err as Error).message}` }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
