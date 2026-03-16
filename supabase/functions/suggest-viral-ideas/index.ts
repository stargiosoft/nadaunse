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
      generationConfig: { temperature: 1.3, maxOutputTokens: 4096, responseMimeType: 'application/json', thinkingConfig: { thinkingBudget: 1024 } },
    }),
  })
  if (!res.ok) {
    const errText = await res.text()
    throw new Error(`Gemini API 오류 ${res.status}: ${errText.slice(0, 200)}`)
  }
  const data = await res.json()
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

// ─── 바이럴 레퍼런스 풀 (카테고리별) ────────────────────────────
const VIRAL_POOL = {
  slot_machine: {
    identity: [
      '내 도화살이 학점이라면?',
      '나는 갑분싸 기질일까?',
      '내 추구미와 도달가능미 간극은?',
      '내 관종력 / TMI력 / 손절미 점수',
      '내 MBTI가 사주로 보면 진짜일까?',
      'AI가 본 내 첫인상 vs 실제 성격',
      '내 멘탈 강도 등급',
      '나는 고양이상? 강아지상?',
      '내 인생 장르 / 사주로 본 나의 부캐',
      '내 빌런력은 몇 %?',
      '사주로 본 내 전투력 (만 단위)',
      '내가 아이돌이라면 어떤 포지션?',
      '좀비 사태 발발! 내 생존 포지션은?',
      '사주로 본 내 도파민 중독 유형',
      '나는 어떤 유형의 유령/드라마 캐릭터?',
    ],
    social: [
      '반에서 내 포지션 / 내 찐친 유지력',
      '나한테 고백하면 성공률?',
      '읽씹 당했을 때 내 반응은?',
      '내 밀당력 등급 (직진 vs 밀당 마스터)',
      '사주로 본 나의 이상형 유형',
      '내가 환승연애에 출연한다면 롤은?',
      '팩폭기 vs 공감요정, 내 주둥이 전투력',
      '팀플 폭파범? 버스기사? 내 팀플 운명',
    ],
    lifestyle: [
      '사주로 본 내 금수저 확률',
      '내가 부자 되는 나이는?',
      '조선시대 내 직업 / 전생 테스트',
      '사주로 본 내 N잡 적성',
      '미래 남편 얼굴은?',
      '시발비용 탕진잼 vs 짠테크 성향',
      '사주로 본 내 시험운 등급 (S~F)',
      '내가 유튜버라면 어떤 채널?',
      '사주로 본 내 최악의 직장 상사 유형',
      '나는 몇 번 결혼할 팔자?',
    ],
  },
  compatibility: [
    '최애와 나의 궁합은?',
    '얘는 악연일까 귀인일까?',
    '우리 찐친 궁합',
    '우리 사이, 내가 더 좋아하는 사람은?',
    '이 사람이 나한테 호감 있을 확률은?',
    '이 사람과 해외여행 가면 절교할 확률?',
    '우리가 헤어질 확률은?',
  ],
  adult: [
    '미래 남편 꼬춘 쿠키 계급도',
    '내 명기력',
    '내 침대력 등급 (S~F)',
    '낮져밤이 지수',
    '숨겨진 나의 플러팅 치명타 부위',
  ],
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return handleCorsPreflightRequest(req)
  const corsHeaders = getCorsHeaders(req)

  try {
    const body = await req.json().catch(() => ({}))
    const category: string | null = body.category || null

    // 1. 기존 테스트 제목 조회 (중복 방지)
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
      `• ${r.title}`
    ).join('\n')

    // 2. 카테고리별 레퍼런스 구성
    let refExamples: string
    let categoryFocus: string

    if (category === 'compatibility') {
      refExamples = VIRAL_POOL.compatibility.map(t => `• ${t}`).join('\n')
      categoryFocus = `**궁합형** 전용. 두 사람 사주를 입력받아 관계/케미를 분석하는 테스트.
바이럴 핵심: 상대방에게 결과를 들이밀기 위해 공유할 수밖에 없는 구조.
민감하지만 못 참는 주제(호감 확률, 헤어질 확률 등)로 호기심 자극.
type은 반드시 "compatibility".`
    } else if (category === 'adult') {
      refExamples = VIRAL_POOL.adult.map(t => `• ${t}`).join('\n')
      categoryFocus = `**19금 마라맛** 전용. 성인 대상 자극적이면서 유머러스한 테스트.
카톡 친한 친구들 단톡방에서 폭탄처럼 던지는 킬러 콘텐츠.
아슬아슬하지만 노골적이지 않은 선을 지킴. 등급/수치화로 직관적 결과.
type은 반드시 "adult".`
    } else {
      // slot_machine 또는 전체
      const pool = VIRAL_POOL.slot_machine
      const allSlot = [...pool.identity, ...pool.social, ...pool.lifestyle]
      // 랜덤으로 12개 선택해서 매번 다른 레퍼런스 제공
      const shuffled = allSlot.sort(() => Math.random() - 0.5).slice(0, 12)
      refExamples = shuffled.map(t => `• ${t}`).join('\n')
      categoryFocus = category === 'slot_machine'
        ? `**운테(슬롯머신)형** 전용. 본인 사주만 입력해서 결과를 보는 테스트.
3가지 서브 카테고리를 골고루 섞어:
① 정체성/성격 (나에 대한 과몰입: 빌런력, 전투력, 아이돌 포지션 등)
② 관계/사회성 (단톡방 공유 킬러: 밀당력, 팀플 운명, 주둥이 전투력 등)
③ 현실/라이프스타일 (돈·직업·미래: 금수저 확률, 시험운, 유튜버 채널 등)
type은 반드시 "slot_machine".`
        : `3가지 유형을 골고루 섞어 추천:
① slot_machine (본인 사주 → 결과)
② compatibility (두 사람 궁합)
③ adult (19금 마라맛)`
    }

    const systemPrompt = `너는 에브리타임·인스타·틱톡에서 바이럴되는 사주 테스트 기획 전문가야.
Z세대(10대 후반~20대)가 바로 클릭하는 아이디어만 만들어.

## 제목 작성 규칙 (가장 중요!)

### 좋은 제목 예시 (이런 스타일로!)
- "미래 남편 얼굴은?"
- "내 금수저 확률"
- "나는 고양이상? 강아지상?"
- "내 멘탈 강도 등급"
- "내 빌런력은 몇 %?"
- "나는 몇 번 결혼할 팔자?"
- "전생에 내 직업은?"
- "내가 아이돌이면 포지션?"

### 핵심: **직관적이고 심플하게**
- **15자 이내**, 누구나 1초 만에 이해하는 쉬운 말
- 밈·신조어·커뮤니티 용어 쓰지 마 — 중학생도 바로 이해하는 일상 단어만
- "실화?", "각 잡았다", "리트라이" 같은 인터넷 용어도 쓰지 마
- "사주로 보는", "사주로 본" 넣지 마
- "너/니" 2인칭 금지 → "내"로 시작하거나 지칭 없이
- 이모지 금지
- 물음표(?)를 적극 활용 — 호기심 유발

### 이런 건 절대 하지 마
- "내 인생 리트라이 각 실화?" ❌ (밈 투성이, 뭔 말인지 모름)
- "내 단톡방 답장 시간은?" ❌ (사주랑 관련 없고 재미없음)
- "내 시험운 로또 번호 실화?" ❌ (억지스럽고 의미불명)
- "사주로 보는 나의 ○○" ❌ (올드한 운세 느낌)
- "내 ○○ 유형은?" ❌ (밋밋)
- 누가 봐도 안 눌러볼 것 같은 지루한 주제 ❌

## 카테고리
${categoryFocus}

## 결과 포맷 (아이디어에 가장 맞는 걸 선택)
- **image_focus**: 시각적 결과가 핵심 (미래 얼굴, 동물상, 캐릭터 비주얼)
- **percentage**: 확률/수치 ("87%", "12%")
- **score**: 점수 기반 ("95점"). 특수 단위도 가능 ("53만", "3번")
- **ranking**: 게임식 등급/티어 ("SSS급", "F급", "전설")
- **grade**: 학점 컨셉 ("A+", "C0", "F")
- **type**: 유형명/포지션이 핵심 ("브레인", "메인보컬", "고기방패")

## 응답 형식
JSON 배열 3개. title은 반드시 15자 이내!
[
  { "title": "후킹 제목", "type": "slot_machine|compatibility|adult", "resultFormat": "image_focus|percentage|score|ranking|grade|type" }
]`

    const userPrompt = `## 레퍼런스 (이 수준의 바이럴 아이디어를 만들어!)
${refExamples}

${existingTitles ? `## 이미 있는 테스트 (절대 겹치지 마!)
${existingTitles}

` : ''}위 레퍼런스 수준으로 Z세대가 즉시 클릭할 바이럴 아이디어 3개. 레퍼런스를 그대로 베끼지 말고 같은 수준의 새로운 아이디어를 만들어!`

    const raw = await callGemini(systemPrompt, userPrompt)
    const ideas = parseJSON<Array<{ title: string; type: string; resultFormat: string }>>(raw)

    // 카테고리 강제 보정
    const result = ideas.slice(0, 3).map(idea => {
      if (category && idea.type !== category) {
        return { ...idea, type: category }
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
