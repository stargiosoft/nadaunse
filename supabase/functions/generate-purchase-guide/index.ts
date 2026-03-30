// Supabase Edge Function: AI 개인화 구매 가이드 생성 (gpt-4.1-nano)
// 3-tier PAS: 사주+태그 → 태그만 → 범용 바넘
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7'
import { getCorsHeaders, handleCorsPreflightRequest } from '../server/cors.ts'

// 사주 API에서 PAS 카피에 필요한 4개 필드만 추출
interface SajuEssence {
  nickname: string     // 물상론.닉네임 (예: "한겨울의 흙")
  constitution: string // 격구분 (예: "종살격")
  strength: string     // 사주강약 (예: "신강")
  yongshin: string     // 용신오행 요약
}

async function fetchSajuEssence(
  birthDate: string,
  birthTime: string,
  gender: string,
  calendarType: string
): Promise<SajuEssence | null> {
  const sajuApiKey = Deno.env.get('SAJU_API_KEY')?.trim()
  if (!sajuApiKey) return null

  const datePart = birthDate.includes('T') ? birthDate.split('T')[0] : birthDate.split(' ')[0]
  const dateOnly = datePart.replace(/-/g, '')
  const timeOnly = (birthTime || '12:00').replace(/:/g, '').substring(0, 4)
  const birthday = dateOnly + timeOnly
  const lunar = calendarType === 'lunar' ? 'true' : 'false'

  const url = `https://service.stargio.co.kr:8400/StargioSaju?birthday=${birthday}&lunar=${lunar}&gender=${gender}&apiKey=${sajuApiKey}`

  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      const res = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json, text/plain, */*',
          'Accept-Encoding': 'gzip, deflate, br',
          'Accept-Language': 'ko-KR,ko;q=0.9',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
          'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)',
        },
      })

      if (!res.ok) {
        if (attempt < 2) { await new Promise(r => setTimeout(r, 1000)); continue }
        return null
      }

      const data = await res.json()
      if (!data || typeof data !== 'object') return null

      // 4개 핵심 필드만 추출
      const mulSangRon = data['물상론'] as Record<string, unknown> | undefined
      const yongShinOhHaeng = data['용신오행'] as Record<string, string[]> | undefined

      let yongshinStr = ''
      if (yongShinOhHaeng) {
        const parts: string[] = []
        if (yongShinOhHaeng['용신']?.length) parts.push(`용신: ${yongShinOhHaeng['용신'].join(',')}`)
        if (yongShinOhHaeng['희신']?.length) parts.push(`희신: ${yongShinOhHaeng['희신'].join(',')}`)
        yongshinStr = parts.join(' / ')
      }

      return {
        nickname: (mulSangRon?.['닉네임'] as string) || '',
        constitution: (data['격구분'] as string) || '',
        strength: (data['사주강약'] as string) || '',
        yongshin: yongshinStr,
      }
    } catch (e) {
      console.warn(`⚠️ [purchase-guide] 사주 API ${attempt}차 시도 실패:`, e)
      if (attempt < 2) await new Promise(r => setTimeout(r, 1000))
    }
  }
  return null
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return handleCorsPreflightRequest(req)
  }

  const corsHeaders = getCorsHeaders(req)

  try {
    // 1. JWT 인증 (로그인 유저만)
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser()

    if (authError || !user) {
      console.error('❌ [purchase-guide] 인증 실패:', authError)
      return new Response(
        JSON.stringify({ success: false, error: '인증이 필요합니다' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const userId = user.id
    const { contentId } = await req.json()

    if (!contentId) {
      return new Response(
        JSON.stringify({ success: false, error: 'contentId가 필요합니다' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`📝 [purchase-guide] 시작 - userId: ${userId}, contentId: ${contentId}`)

    // 2. 병렬 DB 조회 (태그 + 콘텐츠 + 대표 사주)
    const [allTagsResult, contentResult, sajuResult] = await Promise.all([
      supabaseClient
        .from('user_trait_tags')
        .select('tag_name, tag_type')
        .eq('user_id', userId)
        .eq('is_confirmed', true),

      supabaseClient
        .from('master_contents')
        .select('title, description, master_content_questions(question_text)')
        .eq('id', contentId)
        .single(),

      supabaseClient
        .from('saju_records')
        .select('birth_date, birth_time, gender, calendar_type')
        .eq('user_id', userId)
        .eq('is_primary', true)
        .single()
    ])

    // 콘텐츠 정보 필수
    const contentData = contentResult.data
    if (!contentData) {
      console.error('❌ [purchase-guide] 콘텐츠 조회 실패:', contentResult.error)
      return new Response(
        JSON.stringify({ success: false, error: '콘텐츠를 찾을 수 없습니다' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const questions = (contentData.master_content_questions || [])
      .map((q: Record<string, unknown>) => q.question_text)
      .join(', ')

    // 3. Tier 판별
    const allTags = allTagsResult.data || []
    const allPositive = [...new Set(allTags.filter(t => t.tag_type === 'positive').map(t => t.tag_name))]
    const allNegative = [...new Set(allTags.filter(t => t.tag_type === 'negative').map(t => t.tag_name))]
    const hasTags = allTags.length > 0
    const sajuRecord = sajuResult.data

    // 사주 API 호출 (대표 사주가 있을 때만)
    let sajuEssence: SajuEssence | null = null
    if (sajuRecord?.birth_date) {
      sajuEssence = await fetchSajuEssence(
        sajuRecord.birth_date,
        sajuRecord.birth_time || '',
        sajuRecord.gender,
        sajuRecord.calendar_type || 'solar'
      )
      if (sajuEssence) {
        console.log(`✅ [purchase-guide] 사주 핵심 추출: ${sajuEssence.nickname} / ${sajuEssence.constitution}`)
      }
    }

    const tier = sajuEssence && hasTags ? 1 : hasTags ? 2 : 3
    console.log(`📊 [purchase-guide] Tier ${tier} (사주: ${!!sajuEssence}, 태그: ${hasTags})`)

    // 4. 프롬프트 구성
    const formatTags = (tags: string[]) => tags.length > 0 ? tags.map(t => `"${t}"`).join(', ') : '없음'

    let userContext = ''

    if (tier === 1) {
      // Tier 1: 사주 + 태그
      userContext = `## 사주 핵심 정보
- 사주 별명: ${sajuEssence!.nickname}
- 격국: ${sajuEssence!.constitution}
- 체질: ${sajuEssence!.strength}
- 용신/희신: ${sajuEssence!.yongshin}

## 성향 태그
- 강점: ${formatTags(allPositive)}
- 약점: ${formatTags(allNegative)}

## 지시
사주 별명과 격국을 PAS 비유의 핵심 소재로 사용하세요.
용신/희신 오행을 "부족한 기운", "필요한 흐름"으로 번역하세요.
성향 태그는 사주 해석을 뒷받침하는 근거로 자연스럽게 녹이세요.`
    } else if (tier === 2) {
      // Tier 2: 태그만 (바넘 효과 스타일)
      userContext = `## 성향 태그
- 강점: ${formatTags(allPositive)}
- 약점: ${formatTags(allNegative)}

## 지시
성향 태그를 사주 언어로 번역해서 PAS 카피를 작성하세요.
실제 사주를 본 것처럼 자연스러운 사주 비유를 사용하되, 구체적인 격국이나 오행은 언급하지 마세요.
"흐름", "기운", "매듭", "길목" 같은 범용 사주 비유를 활용하세요.`
    } else {
      // Tier 3: 둘 다 없음 (범용 바넘)
      userContext = `## 지시
사용자 정보가 없으므로 바넘효과(누구에게나 해당되는 듯한 보편적 진단)를 활용하세요.
"지금 시기", "현재 흐름", "내면의 잠재력" 같은 보편적이지만 개인적으로 느껴지는 표현을 사용하세요.
구체적인 성향이나 격국은 언급하지 말고, 누구나 공감할 수 있는 사주적 비유로 작성하세요.`
    }

    const prompt = `당신은 사주/운세 전문 상담사이자 PAS 카피라이터입니다.
스레드에서 운세 상담해주는 사람처럼, 현재 흐름을 진단한 뒤 호기심과 긴장감을 극대화하세요.

${userContext}

## 콘텐츠 정보 (★ 반드시 PAS에 녹여야 할 핵심 주제)
- 제목: ${contentData.title}
- 설명: ${contentData.description || '없음'}
- 주요 질문: ${questions || '없음'}

## 최우선 원칙
콘텐츠 제목과 질문에 나온 구체적 키워드(승진, 이별, 재물, 궁합, 건강 등)를 Problem/Agitate에 반드시 포함하세요.
추상적인 "흐름", "원석" 비유만으로는 안 됩니다. 사용자가 "이거 내 상황이잖아"라고 느껴야 합니다.

## PAS 구조 (반드시 이 순서로)

### 1단계: Problem (콘텐츠 주제 + 사주적 진단) — 1~2문장
콘텐츠 주제에 맞는 구체적 상황을 짚고 사주 비유로 진단하세요.
- 예) 승진 콘텐츠 → "승진 기회가 눈앞에 있는데 자꾸 빗나가는 흐름이에요"
- 예) 연애 콘텐츠 → "마음은 확실한데 상대의 진심이 읽히지 않는 형국이에요"
- 예) 재물 콘텐츠 → "돈이 들어올 길목은 열려 있는데 자꾸 새는 구멍이 보여요"

### 2단계: Agitate (문제 증폭 + 호기심) — 2~3문장
진단한 문제를 더 깊이 파고들어 "이대로 두면 안 되겠다"는 긴장감을 만드세요.
- 능력/마음이 부족한 게 아니라 타이밍/방향/순서가 어긋나 있다는 프레이밍
- 콘텐츠 주제에 맞는 구체적 손실/위험 언급 (승진 → "다음 기회는 언제 올지", 연애 → "지금 놓치면")
- "구체적인 시기", "결정적인 열쇠"가 존재한다는 암시로 호기심 증폭

### 3단계: Solution (해결책 제시) — 1문장
이 콘텐츠에서 그 답을 찾을 수 있음을 자연스럽게 연결하세요.
- "유료", "결제", "구매", "상담" 단어 절대 금지

## 말투 규칙
- ~예요/~이에요/~있어요/~거예요 (부드러운 존댓말)
- 사주 비유는 1~2개만. 비유 과잉 금지

## 형식 (★ 매우 중요)
- 3~4줄, 줄바꿈(\\n)으로 구분
- 한 문장 최대 25자. 짧고 끊어서.
- 전체 80~120자
- 멘트만 출력 (다른 텍스트, 라벨, 번호 없이)
- ","로 이어붙이지 말고 "."으로 끊으세요

## 좋은 예시 (짧고 구체적)
"승진할 실력은 충분해요.\\n근데 윗사람 운이 지금 엇갈리고 있어요.\\n밀어야 할 타이밍이 따로 있어요.\\n여기서 확인할 수 있어요."

"상대 마음은 있어요.\\n근데 다가가는 순서가 틀어져 있어요.\\n지금 놓치면 다음 기회는 멀어요.\\n언제 움직여야 하는지 답이 있어요."

"돈 들어올 길목은 열려 있어요.\\n근데 새는 구멍을 모르고 있어요.\\n재물이 터지는 시기가 정해져 있어요.\\n그 타이밍을 여기서 알 수 있어요."

## 나쁜 예시 (이렇게 쓰지 마세요)
"전남친 결혼식에 에르메스 들고 갈 내 팔자가 말하는 것은 바로 부의 잠재력인데, 지금 흐름이 찬란한 기회와 마주하는 순간을 놓치기 쉬운 시기예요." → 한 문장이 너무 길고, 쉼표로 계속 이어붙임. 읽기 힘듦
"잠재력의 원석이 다듬어지지 않은 채 길목에 머물러 있는 형국이에요." → 주제가 뭔지 모름, 추상적
"사주 분석 결과 전환점이 예상됩니다." → Agitate 없음, 호기심 0`

    // 5. gpt-4.1-nano 호출
    const apiKey = Deno.env.get('OPENAI_API_KEY')
    if (!apiKey) {
      return new Response(
        JSON.stringify({ success: false, error: 'OpenAI API 키가 설정되지 않았습니다' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('🔑 [purchase-guide] OpenAI API 호출 시작 (gpt-4.1-nano)...')

    const response = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4.1-nano',
        input: prompt,
      })
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('❌ [purchase-guide] OpenAI API 오류:', response.status, errorText)
      return new Response(
        JSON.stringify({ success: false, error: `OpenAI API 오류: ${response.status}` }),
        { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const data = await response.json()

    // OpenAI Responses API 응답 파싱
    let guideText = ''

    const messageOutput = data.output?.find((o: Record<string, unknown>) => o.type === 'message')
    if (messageOutput?.content?.[0]?.text) {
      guideText = messageOutput.content[0].text.trim()
    } else if (data.output_text) {
      guideText = data.output_text.trim()
    } else if (data.output && data.output[0]?.content?.[0]?.text) {
      guideText = data.output[0].content[0].text.trim()
    } else if (data.choices && data.choices[0]?.message?.content) {
      guideText = data.choices[0].message.content.trim()
    } else {
      console.error('❌ [purchase-guide] 알 수 없는 응답 구조:', data)
      throw new Error('예상하지 못한 API 응답 형식입니다.')
    }

    if (!guideText) {
      throw new Error('생성된 텍스트가 비어있습니다.')
    }

    console.log(`✅ [purchase-guide] Tier ${tier} 가이드 생성 완료:`, guideText)

    return new Response(
      JSON.stringify({ success: true, guide: guideText, tier }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('❌ [purchase-guide] 예외 발생:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : '알 수 없는 오류'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
