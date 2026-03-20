// Supabase Edge Function: AI 밈광고 대본 생성 (Gemini 2.5 Flash)
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { getCorsHeaders, handleCorsPreflightRequest } from '../server/cors.ts'

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return handleCorsPreflightRequest(req)
  }

  const corsHeaders = getCorsHeaders(req)

  try {
    const { brandInfo, adDuration, hookDuration, revision } = await req.json()

    if (!brandInfo?.trim()) {
      return new Response(JSON.stringify({ error: '브랜드/제품 정보를 입력해주세요' }), {
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

    const dur = adDuration || 15
    const hookDur = hookDuration || 3

    const totalDuration = hookDur + dur

    const prompt = `당신은 밈 광고 영상 대본 전문 작가입니다.

★ 핵심 컨셉:
이 영상은 "밈 후크 + 브랜드 광고" 구조입니다.
- 앞부분 (${hookDur}초): 사용자가 직접 업로드한 재밌는/충격적인 밈 영상 클립
- 뒷부분 (${dur}초): 당신이 작성할 브랜드 광고 대본 ← 이것만 작성

밈 클립이 시선을 잡은 직후 바로 광고가 나오므로, 첫 씬의 자연스러운 연결이 매우 중요합니다.

브랜드/제품 정보: "${brandInfo}"
형식: 세로 9:16 숏폼 바이럴 광고 (릴스/쇼츠/틱톡 공용)
광고 부분 길이: ${dur}초
전체 영상 길이: ${totalDuration}초 (밈 ${hookDur}초 + 광고 ${dur}초)

다음 JSON 형식으로 광고 대본을 작성해주세요:

{
  "title": "영상 제목 (30자 이내)",
  "hook": "밈에서 광고로 넘어가는 연결 멘트 (한 문장)",
  "total_duration": ${dur},
  "ad_duration": ${dur},
  "scenes": [
    {
      "scene_number": 1,
      "duration": 3,
      "type": "intro",
      "narration": "나레이션 텍스트",
      "subtitle": "화면 자막 (**강조**)",
      "visual": "화면 설명",
      "transition": "fade",
      "motion_style": "zoom_impact",
      "layout": "center",
      "icon": "🔥"
    }
  ],
  "hashtags": ["해시태그1", "해시태그2", "...최대10개"],
  "bgm_mood": "추천 BGM 분위기",
  "thumbnail_text": "썸네일 텍스트 (8자 이내)"
}

★ 대본 작성 규칙:
1. 첫 씬(intro): 밈에서 자연스럽게 이어지는 전환. "근데 진짜 이거 아세요?", "그런데 말입니다" 등 밈의 웃음/충격에서 광고로 전환
2. 씬 구성: ${dur <= 5 ? '2~3개' : dur <= 10 ? '3~4개' : '4~5개'} 씬. 각 씬 2~4초
3. 나레이션: 자연스러운 구어체, 1초에 약 3~4음절
4. 자막: 핵심 키워드만 (나레이션의 20~30%)
5. 마지막 씬: 강한 CTA (클릭/팔로우/구매 유도)
6. 전체 duration 합이 ${dur}초와 일치하도록
7. JSON만 반환

★ 씬 타입: intro, benefit, feature, testimonial, offer, cta
★ 모션 스타일 (motion_style):
- keyword_pop: 키워드 팝인 (강조)
- typewriter: 타이핑 (설명)
- slide_stack: 좌우 슬라이드 (목록/비교)
- counter: 숫자 카운트업 (수치)
- split_compare: 좌우 비교 — ★자막에 **A** vs **B** 대비 키워드 2개 필수
- radial_burst: 방사형 (임팩트)
- list_reveal: 순차 등장 (팁)
- zoom_impact: 줌인 (핵심 메시지)
- glitch: 글리치 (경고/충격)
- wave: 웨이브 (감성)
- confetti_burst: 컨페티 폭발 (축하/CTA/성공)
- sparkle_trail: 스파클 궤적 (솔루션/팁/긍정)
- pulse_ring: 펄스 파동 (강조/에너지/각성)
연속 2개 씬에 같은 motion_style 금지!
★ split_compare/counter/progress_bar 사용 시 자막에 반드시 대응하는 볼드 키워드를 넣을 것!

★ 광고 전략 (행동경제학):
- 손실 회피: "안 쓰면 손해"
- 구체적 숫자: "3일 만에 효과"
- 사회적 증거: "10만 명이 선택한"
- FOMO: "오늘까지만 이 가격"
- 간편성: "딱 1분이면"`

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
      console.error('[generate-meme-ad] Gemini error:', errText)
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
    console.error('[generate-meme-ad] Error:', err)
    return new Response(JSON.stringify({ error: `생성 실패: ${(err as Error).message}` }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
