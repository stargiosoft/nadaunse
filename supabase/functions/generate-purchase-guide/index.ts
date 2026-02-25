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

    const [weeklyTagsResult, allTagsResult, paidOrdersResult, freeRecordsResult, contentResult] = await Promise.all([
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
        .single()
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

    // 5. gpt-4.1-nano 호출
    const apiKey = Deno.env.get('OPENAI_API_KEY')
    if (!apiKey) {
      return new Response(
        JSON.stringify({ success: false, error: 'OpenAI API 키가 설정되지 않았습니다' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const prompt = `당신은 운세 서비스의 구매 안내 카피라이터입니다.

아래 사용자의 개인화 정보와 유료 콘텐츠 정보를 바탕으로,
이 사용자가 이 콘텐츠를 구매하면 얻을 수 있는 구체적인 benefit을 2줄로 작성하세요.

## 개인화 정보
### 질문자가 직접 선택한 기질/성향
- 최근 1주간 강점: ${formatTags(weeklyPositive)}
- 최근 1주간 단점: ${formatTags(weeklyNegative)}
- 누적 강점: ${formatTags(allPositive)}
- 누적 단점: ${formatTags(allNegative)}

### 최근 1주간 이용한 콘텐츠
[유료] ${paidContents}
[무료] ${freeContents}

## 유료 콘텐츠 정보
- 제목: ${contentData.title}
- 설명: ${contentData.description || '없음'}
- 주요 질문: ${questions || '없음'}

## 규칙
- 사용자의 성향/기질에 맞춰 이 콘텐츠가 왜 도움이 되는지 구체적으로 설명 (성향/기질 키워드를 직접 언급하지 말고 맞춤 광고 멘트로 작성)
- 무료에서는 얻을 수 없는 구체적 정보(시기, 장소, 방법, 상대 특징 등)를 강조
- 친근하고 따뜻한 말투 ("~알려드려요", "~풀어볼게요")
- 정확히 2줄, 각 줄 35-45자
- 줄바꿈(\\n)으로 구분
- 안내 메시지만 출력 (다른 텍스트 없이)`

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
