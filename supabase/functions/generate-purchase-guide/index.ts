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

    const prompt = `당신은 운세 서비스의 구매 전환 카피라이터입니다.

사용자의 성향과 콘텐츠 주제를 결합하여, "이건 나한테 필요한 콘텐츠다"라고 느끼게 만드는 후킹 멘트 2줄을 작성하세요.

## 사용자 성향
- 최근 강점: ${formatTags(weeklyPositive.length > 0 ? weeklyPositive : allPositive)}
- 최근 단점: ${formatTags(weeklyNegative.length > 0 ? weeklyNegative : allNegative)}

## 콘텐츠 정보
- 제목: ${contentData.title}
- 설명: ${contentData.description || '없음'}
- 주요 질문: ${questions || '없음'}

## 최근 이용 콘텐츠
[유료] ${paidContents}
[무료] ${freeContents}

## 규칙
1. 첫째 줄: 사용자의 성향 키워드를 자연스럽게 녹여서 콘텐츠 주제와 연결 (예: "완벽주의 성향이 강한 님이 연애에서 놓치기 쉬운 타이밍과")
2. 둘째 줄: 무료에서는 절대 볼 수 없는 유료 전용 가치를 구체적으로 제시 (시기, 장소, 방법, 상대 유형, 맞춤 전략 등)
3. 성향 키워드를 1~2개 자연스럽게 문장에 녹일 것 (나열 금지, "~한 님이", "~한 성향이라" 등 자연스러운 표현)
4. 콘텐츠 제목/주제를 반드시 반영할 것
5. 친근하고 따뜻한 말투 ("~알려드려요", "~풀어볼게요", "~짚어드릴게요")
6. 각 줄 35-45자, 줄바꿈(\\n)으로 구분
7. 안내 멘트만 출력 (다른 텍스트 없이)

## 좋은 예시
"완벽주의 성향이 강한 님이 연애에서 놓치기 쉬운 타이밍과\\n구체적인 만남 장소, 피해야 할 상대 유형까지 풀어볼게요."
"감성적이면서 신중한 님의 2025년 재물 흐름이 바뀌는 시기와\\n돈이 새는 습관, 지금 잡아야 할 투자 타이밍을 짚어드릴게요."

## 나쁜 예시 (이렇게 쓰지 마세요)
"당신의 숨겨진 치명적 단점을 구체적 순간과 상황별로 분석해 드려요." → 누구에게나 해당되는 범용 멘트, 성향/주제 연결 없음`

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
