// Supabase Edge Function: AI 개인화 구매 가이드 생성 (gpt-4.1-nano)
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7'
import { getCorsHeaders, handleCorsPreflightRequest } from '../server/cors.ts'

serve(async (req) => {
  // CORS preflight
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

    // 2. 병렬 DB 조회
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()

    const fourWeeksAgo = new Date(Date.now() - 28 * 24 * 60 * 60 * 1000).toISOString()

    const [weeklyTagsResult, allTagsResult, paidOrdersResult, freeRecordsResult, contentResult, situationResult] = await Promise.all([
      // a. 최근 7일 confirmed 태그
      supabaseClient
        .from('user_trait_tags')
        .select('tag_name, tag_type')
        .eq('user_id', userId)
        .eq('is_confirmed', true)
        .gte('created_at', sevenDaysAgo),

      // b. 전체 confirmed 태그
      supabaseClient
        .from('user_trait_tags')
        .select('tag_name, tag_type')
        .eq('user_id', userId)
        .eq('is_confirmed', true),

      // c. 최근 7일 유료 콘텐츠 주문
      supabaseClient
        .from('orders')
        .select('master_contents(title)')
        .eq('user_id', userId)
        .eq('status', 'success')
        .gte('created_at', sevenDaysAgo)
        .limit(10),

      // d. 최근 7일 무료 콘텐츠 기록
      supabaseClient
        .from('free_content_records')
        .select('master_contents(title)')
        .eq('user_id', userId)
        .gte('created_at', sevenDaysAgo)
        .limit(10),

      // e. 대상 콘텐츠 정보 + 질문
      supabaseClient
        .from('master_contents')
        .select('title, description, master_content_questions(question_text)')
        .eq('id', contentId)
        .single(),

      // f. 최근 4주 심리 상태
      supabaseClient
        .from('user_situation_summaries')
        .select('situation_summary, created_at')
        .eq('user_id', userId)
        .gte('created_at', fourWeeksAgo)
        .order('created_at', { ascending: true })
    ])

    // 3. 태그 0개 → 즉시 반환
    const allTags = allTagsResult.data || []
    if (allTags.length === 0) {
      console.log('ℹ️ [purchase-guide] 태그 없음 → 스킵')
      return new Response(
        JSON.stringify({ success: false, reason: 'no_tags' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 4. 태그 분류
    const weeklyTags = weeklyTagsResult.data || []
    const weeklyPositive = [...new Set(weeklyTags.filter(t => t.tag_type === 'positive').map(t => t.tag_name))]
    const weeklyNegative = [...new Set(weeklyTags.filter(t => t.tag_type === 'negative').map(t => t.tag_name))]
    const allPositive = [...new Set(allTags.filter(t => t.tag_type === 'positive').map(t => t.tag_name))]
    const allNegative = [...new Set(allTags.filter(t => t.tag_type === 'negative').map(t => t.tag_name))]

    // 콘텐츠 정보
    const contentData = contentResult.data
    if (!contentData) {
      console.error('❌ [purchase-guide] 콘텐츠 조회 실패:', contentResult.error)
      return new Response(
        JSON.stringify({ success: false, error: '콘텐츠를 찾을 수 없습니다' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 이용 콘텐츠 목록
    const paidContents = (paidOrdersResult.data || [])
      .map((o: Record<string, unknown>) => (o.master_contents as Record<string, unknown>)?.title)
      .filter(Boolean)
      .join(', ') || '없음'
    const freeContents = (freeRecordsResult.data || [])
      .map((r: Record<string, unknown>) => (r.master_contents as Record<string, unknown>)?.title)
      .filter(Boolean)
      .join(', ') || '없음'

    const questions = (contentData.master_content_questions || [])
      .map((q: Record<string, unknown>) => q.question_text)
      .join(', ')

    const formatTags = (tags: string[]) => tags.length > 0 ? tags.map(t => `"${t}"`).join(', ') : '없음'

    // 심리 상태 주차별 포맷팅
    let situationStr = '없음'
    const situationData = situationResult.data || []
    if (situationData.length > 0) {
      const now = new Date()
      const weekMap = new Map<number, string>()
      for (const s of situationData) {
        const daysAgo = Math.floor((now.getTime() - new Date(s.created_at).getTime()) / (1000 * 60 * 60 * 24))
        const weekNum = Math.floor(daysAgo / 7) + 1
        if (weekNum >= 1 && weekNum <= 4) {
          weekMap.set(weekNum, s.situation_summary)
        }
      }
      const summaries: string[] = []
      for (let w = 1; w <= 4; w++) {
        if (weekMap.has(w)) summaries.push(`${w}주차: ${weekMap.get(w)!}`)
      }
      if (summaries.length > 0) situationStr = summaries.join('\n')
    }

    // 5. gpt-4.1-nano 호출
    const apiKey = Deno.env.get('OPENAI_API_KEY')
    if (!apiKey) {
      return new Response(
        JSON.stringify({ success: false, error: 'OpenAI API 키가 설정되지 않았습니다' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const prompt = `당신은 운세 서비스의 구매 전환 카피라이터입니다.

이 콘텐츠를 통해 사용자가 어떻게 변화할 수 있는지, 변화된 모습을 팔아주세요.
정보를 나열하지 말고, "이걸 보면 나는 이렇게 달라질 수 있겠다"라고 상상하게 만드세요.

## 사용자 성향
- 강점: ${formatTags(weeklyPositive.length > 0 ? weeklyPositive : allPositive)}
- 단점: ${formatTags(weeklyNegative.length > 0 ? weeklyNegative : allNegative)}

### 질문자의 현재 심리 상태
(1주차가 가장 최신입니다. 최신 주차의 심리 상태를 최우선으로 반영하세요.)
${situationStr}

## 콘텐츠 정보
- 제목: ${contentData.title}
- 설명: ${contentData.description || '없음'}
- 주요 질문: ${questions || '없음'}

## 핵심 원칙
- 정보("~분석해드려요", "~알려드려요")가 아니라 변화("~될 수 있어요", "~바뀔 수 있어요")를 파세요
- 사용자의 성향/단점이 이 콘텐츠를 통해 어떻게 극복·활용되는지 변화 후 모습을 그려주세요
- 성향 키워드 1개를 자연스럽게 녹이되 나열하지 마세요

## 형식
- 정확히 2줄, 줄바꿈(\\n)으로 구분
- 각 줄 30-42자
- 따뜻하고 확신 있는 말투
- 멘트만 출력 (다른 텍스트 없이)

## 좋은 예시 (변화된 모습을 판다)
"늘 고민만 많았던 연애, 이번엔 확신을 갖고\\n먼저 다가갈 수 있는 내가 될 수 있어요."
"매번 참기만 했던 직장 스트레스, 이 운세를 보면\\n당당하게 내 길을 선택하는 내가 되어 있을 거예요."
"우유부단했던 재테크 고민이 사라지고\\n딱 맞는 타이밍에 움직이는 내가 될 수 있어요."

## 나쁜 예시 (정보를 나열한다 - 이렇게 쓰지 마세요)
"승진 가능성 분석과 특정 상사와 동료의 유형별 맞춤 승진 전략을 알려드릴게요." → 정보 나열, 변화 없음
"당신의 숨겨진 치명적 단점을 구체적 순간과 상황별로 분석해 드려요." → 범용 멘트, 변화 없음`

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

    console.log('✅ [purchase-guide] 가이드 생성 완료:', guideText)

    // 6. 성공 응답
    return new Response(
      JSON.stringify({ success: true, guide: guideText }),
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
