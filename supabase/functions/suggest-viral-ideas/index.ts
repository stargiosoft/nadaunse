// Supabase Edge Function: 바이럴 테스트 아이디어 AI 추천
// viral_tests 기존 제목 참고 → 중복 없는 Z세대 바이럴 아이디어 3개 추천
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7'
import { getCorsHeaders, handleCorsPreflightRequest } from '../server/cors.ts'

const GEMINI_API_KEY = Deno.env.get('GOOGLE_API_KEY')!
const MODEL = 'gemini-2.5-flash'

async function callGemini(systemPrompt: string, userPrompt: string): Promise<string> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${GEMINI_API_KEY}`
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: userPrompt }] }],
      systemInstruction: { parts: [{ text: systemPrompt }] },
      generationConfig: { temperature: 1.2, maxOutputTokens: 4096, responseMimeType: 'application/json', thinkingConfig: { thinkingBudget: 1024 } },
    }),
  })
  if (!res.ok) {
    const errText = await res.text()
    throw new Error(`Gemini API 오류 ${res.status}: ${errText.slice(0, 200)}`)
  }
  const data = await res.json()
  // Gemini 2.5 Flash는 thinking 모델 — 첫 part가 thought일 수 있음
  // text가 있는 마지막 part에서 실제 응답 추출
  // Gemini 2.5 Flash thinking 모델: thought part 제외, 실제 응답 part만 추출
  const parts = data.candidates?.[0]?.content?.parts || []
  const raw = parts.filter((p: { text?: string; thought?: boolean }) => p.text && !p.thought).pop()?.text
  if (!raw) throw new Error('Gemini 응답이 비어있습니다.')
  return raw
}

function parseJSON<T>(raw: string): T {
  try { return JSON.parse(raw) } catch {}
  const cleaned = raw.replace(/```json?\s*/g, '').replace(/```\s*/g, '')
  try { return JSON.parse(cleaned) } catch {}
  const match = cleaned.match(/\[[\s\S]*\]/)
  if (!match) throw new Error('JSON 파싱 실패')
  const sanitized = match[0]
    .replace(/,\s*([\]}])/g, '$1')
    .replace(/[\x00-\x1f\x7f]/g, ' ')
  return JSON.parse(sanitized)
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return handleCorsPreflightRequest(req)
  const corsHeaders = getCorsHeaders(req)

  try {
    // 0. 카테고리 파라미터 파싱
    const body = await req.json().catch(() => ({}))
    const category: string | null = body.category || null  // 'slot_machine' | 'compatibility' | 'adult' | null

    // 1. 기존 테스트 제목 조회
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )
    const { data: existing } = await supabaseAdmin
      .from('viral_tests')
      .select('title, idea_input')
      .not('status', 'eq', 'failed')
      .order('created_at', { ascending: false })
      .limit(50)

    const existingTitles = (existing || []).map((r: { title: string; idea_input: string }) =>
      `• ${r.title} (원본: ${r.idea_input})`
    ).join('\n')

    // 2. 카테고리별 프롬프트 구성
    const categoryGuides: Record<string, { typeConstraint: string; typeLabel: string; focus: string; examples: string }> = {
      slot_machine: {
        typeConstraint: '모든 아이디어의 type은 반드시 "slot_machine"이어야 해.',
        typeLabel: '슬롯머신형 (정체성·성격·현실·라이프스타일)',
        focus: `본인의 사주만 입력받아 재미있는 결과를 보여주는 테스트야.
크게 3가지 서브 카테고리가 있어:
- **정체성 & 성격**: 나에 대한 과몰입 (빌런력, 전투력, MBTI+사주, 멘탈 등급, 도파민 중독 유형 등)
- **관계 & 사회성**: 단톡방 공유 킬러 (밀당력, 팀플 운명, 주둥이 전투력, 읽씹 반응 등)
- **현실 & 라이프스타일**: 돈·직업·미래 (금수저 확률, N잡 적성, 시험운 등급, 유튜버 채널 등)`,
        examples: `참고할 만한 인기 테스트 아이디어:
- 내 빌런력은 몇 %?
- 사주로 본 내 전투력 (만 단위)
- 내가 아이돌이라면 어떤 포지션?
- 좀비 사태 발발! 내 생존 포지션은?
- 내 도파민 중독 유형
- 내 밀당력 등급 (직진 vs 밀당 마스터)
- 팩폭기 vs 공감요정, 내 주둥이 전투력
- 팀플 폭파범? 버스기사? 내 팀플 운명
- 시발비용 탕진잼 vs 짠테크 성향
- 사주로 본 내 시험운 등급 (S~F)
- 내가 유튜버라면 어떤 채널?
- 나는 몇 번 결혼할 팔자?`,
      },
      compatibility: {
        typeConstraint: '모든 아이디어의 type은 반드시 "compatibility"이어야 해.',
        typeLabel: '궁합형 (두 사람 정보 입력)',
        focus: `본인 + 상대방 사주를 입력받아 두 사람의 궁합/케미/관계를 분석하는 테스트야.
바이럴의 핵심은 상대방에게 결과를 들이밀기 위해 공유할 수밖에 없는 구조.
- 연애 궁합, 찐친 궁합, 최애(아이돌) 궁합, 가족/동료 궁합 등 다양한 관계 커버
- 민감하지만 못 참는 주제 (헤어질 확률, 호감 확률 등)로 호기심 자극`,
        examples: `참고할 만한 인기 궁합 아이디어:
- 최애와 나의 궁합은?
- 얘는 악연일까 귀인일까?
- 우리 찐친 궁합
- 우리 사이, 내가 더 좋아하는 사람은?
- 이 사람이 나한테 호감 있을 확률은?
- 이 사람과 해외여행 가면 절교할 확률?
- 우리가 헤어질 확률은?`,
      },
      adult: {
        typeConstraint: '모든 아이디어의 type은 반드시 "adult"이어야 해.',
        typeLabel: '19금 마라맛 (성인 전용)',
        focus: `성인 대상의 자극적이면서도 유머러스한 19금 테스트야.
카톡 단톡방에서 친한 친구들끼리 은밀하게 공유하는 킬러 콘텐츠.
- 노골적이지 않으면서도 아슬아슬한 재미
- 등급/수치화로 직관적인 결과 (침대력 S등급, 플러팅 치명타 부위 등)
- 호기심 200% 자극하는 금기 주제`,
        examples: `참고할 만한 인기 19금 아이디어:
- 미래 남편 꼬춘 쿠키 계급도
- 내 명기력
- 내 침대력 등급 (S~F)
- 낮져밤이 지수
- 숨겨진 나의 '플러팅' 치명타 부위`,
      },
    }

    const guide = category ? categoryGuides[category] : null

    const systemPrompt = `너는 1020 Z세대(10대 후반~20대 초반)를 타겟으로 한 사주 기반 바이럴 테스트 기획자야.

## 역할
사용자의 사주(생년월일시)를 입력받아 재미있는 결과를 보여주는 바이럴 테스트 아이디어를 추천해.

## 핵심 원칙
1. **바이럴 필수**: 결과를 캡처해서 인스타 스토리·카톡 단톡방에 공유하고 싶을 정도로 재미있어야 함
2. **Z세대 언어**: 10대·20대가 쓰는 밈, 유행어, 신조어를 적극 활용 (예: 느좋, 갑분싸, 손절미, 관종, 추구미, 감다살 등)
3. **자기탐색 프레임**: 단순 운세가 아닌 "나를 알아가는 재미" 또는 '궁합 캐미 발견 기회'로 포지셔닝
4. **짧고 임팩트**: 제목은 15자 이내, 한눈에 "이거 해봐야겠다" 느낌
5. **공유 욕구 자극**: 점수·등급·비율·이미지 등 캡처하고 싶은 결과 형태
${guide ? `
## 카테고리 제한
이번 요청은 **${guide.typeLabel}** 카테고리 전용이야.
${guide.typeConstraint}

## 이 카테고리 특성
${guide.focus}

## 레퍼런스 아이디어
${guide.examples}
` : `
## 테스트 유형
- 슬롯머신형: 본인 사주만 입력 → 점수/확률/등급/이미지 결과
- 궁합형: 본인 + 상대방 사주 → 궁합 점수/유형
- 성인용: 19금 소재 (자극적이지만 유머러스)
`}
## 결과 포맷 종류
- image_focus: 이미지 중심 결과 (미래 남편 얼굴, 전생 모습 등)
- percentage: % 표시 (바람끼 82%, 관종력 95%)
- score: 점수제 (0~100점)
- ranking: 등급/티어 (S/A/B/C/D)

## 응답 형식
반드시 JSON 배열로 정확히 3개의 아이디어를 추천해:
[
  {
    "title": "15자 이내 후킹 제목",
    "type": "${guide ? (category === 'adult' ? 'adult' : category === 'compatibility' ? 'compatibility' : 'slot_machine') : 'slot_machine | compatibility | adult'}",
    "resultFormat": "image_focus | percentage | score | ranking"
  }
]`

    const categoryLabel = guide
      ? `\n\n** 중요: "${guide.typeLabel}" 카테고리 아이디어만 추천해. 다른 유형은 절대 포함하지 마. **`
      : ''

    const userPrompt = existingTitles
      ? `아래는 이미 만들어진 테스트 제목 목록이야. 이것들과 절대 겹치지 않는, 완전히 새로운 아이디어 3개를 추천해줘.
트렌디하고, Z세대가 "이거 뭐야 해봐야겠다ㅋㅋ" 하면서 바로 클릭할 만한 소재로!${categoryLabel}

=== 기존 테스트 ===
${existingTitles}

새로운 아이디어 3개를 JSON 배열로 추천해줘.`
      : `사주 기반 바이럴 테스트 아이디어 3개를 추천해줘. Z세대가 "이거 뭐야ㅋㅋ 해봐야겠다" 하면서 바로 클릭할 만한 소재로!${categoryLabel} JSON 배열로 응답해.`

    const raw = await callGemini(systemPrompt, userPrompt)
    const ideas = parseJSON<Array<{ title: string; type: string; resultFormat: string }>>(raw)

    // 카테고리 필터링: AI가 잘못된 type을 반환했을 경우 강제 보정
    const result = ideas.slice(0, 3).map(idea => {
      if (category && idea.type !== (category === 'adult' ? 'adult' : category)) {
        return { ...idea, type: category === 'adult' ? 'adult' : category }
      }
      return idea
    })

    return new Response(JSON.stringify({ ideas: result }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    console.error('suggest-viral-ideas 오류:', err)
    return new Response(
      JSON.stringify({ error: (err as Error).message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  }
})
