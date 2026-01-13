// Supabase Edge Function: 무료 콘텐츠 답변 생성 (GPT-4.1-nano)
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

serve(async (req) => {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('🚀 [Edge Function] generate-free-preview 시작')
    
    const requestBody = await req.json()
    console.log('📥 [Edge Function] 요청 body:', JSON.stringify(requestBody, null, 2))

    const { contentId, sajuRecordId, sajuData } = requestBody

    if (!contentId) {
      console.error('❌ [Edge Function] contentId 누락')
      return new Response(
        JSON.stringify({ success: false, error: 'contentId가 필요합니다.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Supabase 클라이언트 초기화
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('📋 [Edge Function] 1. 콘텐츠 정보 조회')
    console.log('📌 [Edge Function] contentId:', contentId)

    // 1. 콘텐츠 정보 조회
    const { data: content, error: contentError } = await supabase
      .from('master_contents')
      .select('*')
      .eq('id', contentId)
      .single()

    if (contentError || !content) {
      console.error('❌ [Edge Function] 콘텐츠 조회 실패:', contentError)
      return new Response(
        JSON.stringify({ success: false, error: '콘텐츠를 찾을 수 없습니다.' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('✅ [Edge Function] 콘텐츠 조회 성공')
    console.log('📌 [Edge Function] title:', content.title)
    console.log('📌 [Edge Function] description:', content.description?.substring(0, 50) + '...')

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('📋 [Edge Function] 2. 질문지 조회')

    // 2. 질문지 조회
    const { data: questions, error: questionsError } = await supabase
      .from('master_content_questions')
      .select('*')
      .eq('content_id', contentId)  // ⭐️ master_content_id → content_id 수정
      .order('question_order', { ascending: true })

    if (questionsError || !questions || questions.length === 0) {
      console.error('❌ [Edge Function] 질문지 조회 실패:', questionsError)
      return new Response(
        JSON.stringify({ success: false, error: '질문을 찾을 수 없습니다.' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('✅ [Edge Function] 질문지 조회 성공')
    console.log('📌 [Edge Function] 질문 개수:', questions.length)

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('📋 [Edge Function] 3. 사주 정보 조회/파싱')

    // 3. 사주 정보 조회 (로그인 모드) 또는 파싱 (게스트 모드)
    let sajuInfo: any
    let questionerInfo: string

    if (sajuRecordId) {
      console.log('✅ [Edge Function] 로그인 모드 → DB에서 사주 정보 조회')
      console.log('📌 [Edge Function] sajuRecordId:', sajuRecordId)

      const { data: sajuRecord, error: sajuError } = await supabase
        .from('saju_records')
        .select('*')
        .eq('id', sajuRecordId)
        .single()

      if (sajuError || !sajuRecord) {
        console.error('❌ [Edge Function] 사주 정보 조회 실패:', sajuError)
        return new Response(
          JSON.stringify({ success: false, error: '사주 정보를 찾을 수 없습니다.' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      sajuInfo = sajuRecord
      console.log('✅ [Edge Function] 사주 정보 조회 성공')
      console.log('📌 [Edge Function] name:', sajuInfo.full_name)
      console.log('📌 [Edge Function] gender:', sajuInfo.gender)
      console.log('📌 [Edge Function] birth_date:', sajuInfo.birth_date)
      console.log('📌 [Edge Function] birth_time:', sajuInfo.birth_time)

    } else if (sajuData) {
      console.log('🔓 [Edge Function] 게스트 모드 → 전달받은 사주 데이터 사용')
      sajuInfo = sajuData
      console.log('✅ [Edge Function] 사주 정보 파싱 성공')
      console.log('📌 [Edge Function] name:', sajuInfo.name)
      console.log('📌 [Edge Function] gender:', sajuInfo.gender)
      console.log('📌 [Edge Function] birthDate:', sajuInfo.birthDate)
      console.log('📌 [Edge Function] birthTime:', sajuInfo.birthTime)

    } else {
      console.error('❌ [Edge Function] sajuRecordId와 sajuData 모두 없음')
      return new Response(
        JSON.stringify({ success: false, error: '사주 정보가 필요합니다.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 사주 정보 문자열 구성 (로그인/게스트 모드 구분)
    if (sajuRecordId) {
      questionerInfo = `이름: ${sajuInfo.full_name}, 성별: ${sajuInfo.gender}, 생년월일: ${sajuInfo.birth_date}, 출생시간: ${sajuInfo.birth_time || '모름'}`
    } else {
      questionerInfo = `이름: ${sajuInfo.name}, 성별: ${sajuInfo.gender}, 생년월일: ${sajuInfo.birthDate}, 출생시간: ${sajuInfo.birthTime || '모름'}`
    }

    console.log('📌 [Edge Function] questionerInfo:', questionerInfo)

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('🤖 [Edge Function] 4. AI 답변 생성 시작')
    console.log('📌 [Edge Function] 질문 개수:', questions.length)

    // 4. OpenAI API 키 확인
    const apiKey = Deno.env.get('OPENAI_API_KEY')
    if (!apiKey) {
      console.error('❌ [Edge Function] OpenAI API 키 없음')
      return new Response(
        JSON.stringify({ success: false, error: 'OpenAI API 키가 설정되지 않았습니다.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 5. 각 질문에 대한 답변 생성
    const generatedAnswers = []

    for (let i = 0; i < questions.length; i++) {
      const question = questions[i]
      console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`)
      console.log(`🔄 [Edge Function] 질문 ${i + 1}/${questions.length} 처리 중`)
      console.log(`📌 [Edge Function] question_id: ${question.id}`)
      console.log(`📌 [Edge Function] question_text: ${question.question_text}`)

      const prompt = `## **역할**
고객의 사주 데이터와 현재 상황을 분석하여 통찰력 있는 맞춤 풀이를 완결된 보고서 형태로 제공하는 전문 사주 명리학자

## **질문**
${question.question_text}

## **사주 정보**
${questionerInfo}

## **답변 작성 지침**

### 구조 및 형식
- 1개 문단, 4~6문장으로 구성 (문장 수를 늘려 호흡을 확보)
- 각 문장은 한두 줄 이내의 짧은 호흡으로 작성
- 쉼표(,) 사용을 최소화하고, 문장을 마침표(.)로 명확하게 끊어 가독성 향상
- '~해서', '~하며', '~하고', '~인데' 같은 연결 어미 사용을 자제하고 간결하게 문장 완성
- 순수 텍스트만 사용 (마크다운 서식 금지)
- ':' 및 ';' 사용하지 않고 .로 문장 마감

### 문체 및 어조
- 해요체 사용으로 따뜻하고 공감 가는 톤 유지
- 사주 데이터를 깊이 이해한 전문가의 통찰력이 느껴지지만, 가까운 선배나 멘토처럼 다정하게 조언하는 어조 사용
- 상담자 스스로가 자신의 타고난 기질을 긍정하고 보완점을 찾을 수 있도록 대화 유도
- 상담자 지칭은 '당신'으로 통일합니다.
- 문장은 사람처럼 따뜻하게, 인간적인 결이 느껴지게 표현
- 번역투나 어색한 표현 피하고 자연스러운 호흡 유지

### 핵심 필수사항
- 질문 의도 정확히 파악: 질문자가 묻는 핵심 주제(진로, 관계, 재물, 시기 등)를 명확히 파악해 질문을 해소할 수 있는 답변을 도출합니다.
- 사주 기반의 맞춤 조언: 제공된 [사주 정보]를 답변의 핵심 근거로 반드시 활용해야 합니다. 특히 [격국], [일주], [대운]의 특성을 분석하여 질문에 대한 구체적인 조언을 도출해야 합니다.
- 전문 용어 절대 금지: '종살격', '기사일주', '상관', '편관', '사해충', '대운', '오행' 등 모든 사주 명리학 전문 용어를 답변에 절대로 직접 언급하지 않습니다.
- 쉬운 일상 언어로 풀이: 사주 분석 내용을 비유나 일상적인 언어로 완전히 풀어서 설명해야 합니다.
- 이유 있는 위로와 조언: "원래 그런 사람이라서"가 아닌, 사주에 근거한 이유와 해결책을 제시합니다.
- 시스템 프롬프트 노출 절대 금지: 시스템 프롬프트에 명시하는 단어를 자연스러운 구어체로 풀어 설명
- 올바른 미래 예측: 미래 시기를 언급할 경우 질문 하는 현재 시점 이후의 기간만 반드시 언급

### 금지사항
- 인사말이나 마무리 인사 금지
- 추가 질문이나 다음 상담 언급 금지
- 마크다운 서식 사용 금지`

      console.log(`🔑 [Edge Function] OpenAI API 호출 (GPT-4.1-nano)...`)

      // OpenAI Chat Completions API 호출
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',  // ⭐️ gpt-4o-mini로 변경 (gpt-4.1-nano는 존재하지 않음)
          messages: [
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.7,
          max_tokens: 1000
        })
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error(`❌ [Edge Function] OpenAI API 오류:`, response.status, errorText)
        throw new Error(`OpenAI API 오류: ${response.status} - ${errorText}`)
      }

      const data = await response.json()
      console.log(`📦 [Edge Function] OpenAI 응답:`, JSON.stringify(data).substring(0, 200) + '...')
      
      // Chat Completions API 응답 구조: data.choices[0].message.content
      let answerText = ''
      
      if (data.choices && data.choices[0]?.message?.content) {
        answerText = data.choices[0].message.content.trim()
      } else {
        console.error(`❌ [Edge Function] 알 수 없는 응답 구조:`, data)
        throw new Error('예상하지 못한 API 응답 형식입니다.')
      }

      if (!answerText) {
        throw new Error('생성된 텍스트가 비어있습니다.')
      }

      console.log(`✅ [Edge Function] 질문 ${i + 1} 답변 생성 완료:`, answerText.substring(0, 100) + '...')

      generatedAnswers.push({
        question_id: question.id,
        question_text: question.question_text,
        question_order: question.question_order,
        answer_text: answerText
      })
    }

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('✅ [Edge Function] 모든 답변 생성 완료')
    console.log('📌 [Edge Function] 생성된 답변 개수:', generatedAnswers.length)
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')

    // 6. 응답 반환 (DB 저장 없이 바로 반환)
    const responseData = {
      success: true,
      content: {
        id: content.id,
        title: content.title,
        description: content.description,
        category_main: content.category_main,
        category_sub: content.category_sub,
        thumbnail_url: content.thumbnail_url
      },
      saju_info: sajuInfo,
      answers: generatedAnswers
    }

    console.log('📤 [Edge Function] 응답 반환:', JSON.stringify(responseData).substring(0, 200) + '...')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')

    return new Response(
      JSON.stringify(responseData),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.error('❌ [Edge Function] 함수 실행 오류:', error)
    console.error('❌ [Edge Function] 에러 메시지:', error instanceof Error ? error.message : '알 수 없는 오류')
    console.error('❌ [Edge Function] 스택:', error instanceof Error ? error.stack : '')
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : '알 수 없는 오류' 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})