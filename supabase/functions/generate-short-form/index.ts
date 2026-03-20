// Supabase Edge Function: AI 숏폼 대본 생성 (Gemini 2.5 Flash)
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { getCorsHeaders, handleCorsPreflightRequest } from '../server/cors.ts'

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return handleCorsPreflightRequest(req)
  }

  const corsHeaders = getCorsHeaders(req)

  try {
    const { topic, duration, platform, videoType, revision } = await req.json()

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
    const plat = platform || 'reels'

    const platformGuide: Record<string, string> = {
      reels: '인스타 릴스 (세로 9:16, 15~90초, 자막 필수, 첫 3초가 핵심)',
      shorts: '유튜브 쇼츠 (세로 9:16, 60초 이하, 정보형 콘텐츠 강점)',
      tiktok: '틱톡 (세로 9:16, 15~60초, 트렌드 음악 활용, 빠른 전환)',
    }

    const isMotionType = videoType === 'motion'

    const motionFields = isMotionType ? `
      "motion_style": "모션 그래픽 스타일 (아래 15가지 중 택1)",
      "layout": "레이아웃 (center/top_heavy/bottom_heavy/split_left/split_right)",
      "icon": "씬 내용에 맞는 이모지 1개",` : ''

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

★ 전환 효과 (transition) — 7가지:
cut, fade, zoom, slide, blur_in, wipe_left, scale_rotate
다양하게 섞어 사용. 연속 같은 전환 금지.` : ''

    const prompt = `당신은 숏폼 영상 대본 전문 작가이자 SNS 바이럴 콘텐츠 기획자입니다.

주제: "${topic}"
플랫폼: ${platformGuide[plat] || platformGuide.reels}
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
