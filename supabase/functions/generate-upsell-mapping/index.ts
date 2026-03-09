// Supabase Edge Function: 업셀링 자동 매핑 (GPT-4.1-nano)
// 무료 콘텐츠 생성 시 같은 대분류 유료 콘텐츠 중 최적 매핑 + 후킹 멘트 자동 생성
// generate-master-content에서 내부 호출 (--no-verify-jwt)

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7'
import { getCorsHeaders, handleCorsPreflightRequest } from '../server/cors.ts'

interface UpsellMappingRequest {
  contentId: string
}

interface AiResponse {
  selectedContentId: string
  hookText: string
  strategy: string
}

serve(async (req) => {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    return handleCorsPreflightRequest(req)
  }

  const corsHeaders = getCorsHeaders(req)

  try {
    const { contentId }: UpsellMappingRequest = await req.json()

    if (!contentId) {
      return new Response(
        JSON.stringify({ success: false, error: 'contentId가 필요합니다.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`🔗 [upsell-mapping] 시작: ${contentId}`)

    // Supabase 클라이언트 생성
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // 1. 무료 콘텐츠 정보 조회
    const { data: freeContent, error: freeError } = await supabase
      .from('master_contents')
      .select('id, title, description, category_main, category_sub, content_type')
      .eq('id', contentId)
      .single()

    if (freeError || !freeContent) {
      console.error('❌ [upsell-mapping] 콘텐츠 조회 실패:', freeError)
      return new Response(
        JSON.stringify({ success: false, error: '콘텐츠를 찾을 수 없습니다.' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 2. 검증: 무료 콘텐츠만 처리
    if (freeContent.content_type !== 'free') {
      console.log('⏭️ [upsell-mapping] 무료 콘텐츠가 아닙니다. 스킵.')
      return new Response(
        JSON.stringify({ success: false, skipped: true, reason: '무료 콘텐츠가 아닙니다.' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 3. 검증: '기타' 카테고리 스킵
    if (freeContent.category_main === '기타') {
      console.log('⏭️ [upsell-mapping] 기타 카테고리입니다. 스킵.')
      return new Response(
        JSON.stringify({ success: false, skipped: true, reason: '기타 카테고리는 매핑 대상이 아닙니다.' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 4. 무료 콘텐츠의 질문 조회
    const { data: freeQuestions } = await supabase
      .from('master_content_questions')
      .select('question_text, question_order')
      .eq('content_id', contentId)
      .order('question_order', { ascending: true })

    // 5. 유료 콘텐츠 후보 조회 (중분류 우선 → 대분류 폴백)
    // 5-1. 같은 category_sub 먼저 조회
    const { data: subCandidates, error: subError } = await supabase
      .from('master_contents')
      .select('id, title, description, category_sub')
      .eq('category_main', freeContent.category_main)
      .eq('category_sub', freeContent.category_sub)
      .eq('content_type', 'paid')
      .eq('status', 'deployed')
      .limit(20)

    if (subError) {
      console.error('❌ [upsell-mapping] 중분류 유료 콘텐츠 조회 실패:', subError)
    }

    let paidCandidates = subCandidates || []

    // 5-2. 중분류 후보가 없으면 대분류 전체에서 조회
    if (paidCandidates.length === 0) {
      console.log('ℹ️ [upsell-mapping] 같은 중분류 유료 없음 → 대분류로 폴백')
      const { data: mainCandidates, error: mainError } = await supabase
        .from('master_contents')
        .select('id, title, description, category_sub')
        .eq('category_main', freeContent.category_main)
        .neq('category_sub', freeContent.category_sub)
        .eq('content_type', 'paid')
        .eq('status', 'deployed')
        .limit(20)

      if (mainError) {
        console.error('❌ [upsell-mapping] 대분류 유료 콘텐츠 조회 실패:', mainError)
        return new Response(
          JSON.stringify({ success: false, error: '유료 콘텐츠 조회 실패' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      paidCandidates = mainCandidates || []
    }

    if (paidCandidates.length === 0) {
      console.log('⏭️ [upsell-mapping] 매핑 가능한 유료 콘텐츠가 없습니다.')
      return new Response(
        JSON.stringify({ success: false, skipped: true, reason: '매핑 가능한 유료 콘텐츠가 없습니다.' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const matchLevel = (subCandidates && subCandidates.length > 0) ? '중분류' : '대분류'
    console.log(`📋 [upsell-mapping] 유료 후보 ${paidCandidates.length}개 발견 (${matchLevel} 매칭)`)

    // 6. 각 후보의 질문 조회
    const candidateIds = paidCandidates.map(c => c.id)
    const { data: paidQuestions } = await supabase
      .from('master_content_questions')
      .select('content_id, question_text, question_order')
      .in('content_id', candidateIds)
      .order('question_order', { ascending: true })

    // 후보 정보에 질문 매핑
    const candidatesWithQuestions = paidCandidates.map(candidate => ({
      id: candidate.id,
      title: candidate.title,
      description: candidate.description,
      categorySub: candidate.category_sub,
      questions: (paidQuestions || [])
        .filter(q => q.content_id === candidate.id)
        .map(q => q.question_text),
    }))

    // 7. OpenAI API 호출
    const apiKey = Deno.env.get('OPENAI_API_KEY')
    if (!apiKey) {
      console.error('❌ [upsell-mapping] OpenAI API 키 미설정')
      return new Response(
        JSON.stringify({ success: false, error: 'OpenAI API 키가 설정되지 않았습니다.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const freeQuestionsText = (freeQuestions || [])
      .map(q => q.question_text)
      .join('\n')

    const candidatesText = candidatesWithQuestions.map((c, i) =>
      `[${i + 1}] ID: ${c.id}\n제목: ${c.title}\n소개: ${c.description}\n소분류: ${c.categorySub}\n질문: ${c.questions.join(' / ')}`
    ).join('\n\n')

    const prompt = `## 역할
운세 콘텐츠 업셀링 매핑 전문가

## 입력

### 무료 콘텐츠
- 제목: ${freeContent.title}
- 소개: ${freeContent.description}
- 대분류: ${freeContent.category_main}
- 중분류: ${freeContent.category_sub}
- 질문:
${freeQuestionsText}

### 유료 콘텐츠 후보
${candidatesText}

## 매핑 기준
- 테마적 연관성 최우선 (같은 category_sub 우선 고려)

## 후킹 멘트 원칙
멘트마다 사용한 전략을 반드시 명시하세요.

### 행동경제학 기반 전략
1. 손실 회피 (Loss Aversion): 잃는 두려움 자극 - 예: "놓치면 후회", "이대로 가면 위험해요"
2. 구체적 숫자 (Specific Numbers): 신뢰도와 예측 가능성 향상 - 예: "3가지 신호", "90% 확률", "5년 안에"
3. 타겟 지목 (Cocktail Party Effect): 내 이야기처럼 느끼게 함 - 예: "30대 직장인이라면", "짝사랑 중인 너"
4. 간편성/행동 경량화 (Low Friction): 낮은 진입장벽 + 가벼운 동사 - "딱 3초면", "내 결과 확인하기" (❌ "가입/신청/등록" → ✅ "시작/확인/받기")
4. 비교 및 소외 불안 (FOMO & Social Comparison): '나만 뒤처지는 것 아닌가' 조바심 유발 - 예: "요즘 또래들은 다 아는", "나만 놓치고 있는"
6. 인정욕구 및 우월감 (Ego Appeal & Prestige): 특별해지고 싶은 심리 - 예: "상위 1%만 타고난 사주", "당신만 몰랐던 진짜 잠재력"
7. 확실성 효과 (Certainty Effect): 크지만 불확실한 것보다 작아도 확실한 보상이 강력 - 예: "100% 확인 가능한", "누구나 알 수 있는"

### 카피 유형별 전략
- 문제점/결핍 후벼파기형: 고객이 외면하던 진짜 문제를 직면하게 만듦
- 비교/경쟁 자극형: 타인과의 차이를 부각해 은근한 경쟁심 자극
- 경고/파국 암시형: 방치했을 때 벌어질 최악의 상황으로 불안감 증폭
- 이익 약속형: 확실하고 구체적인 보상 제시
- 호기심 유발형: 결론을 숨긴 채 궁금증을 최고조로 끌어올림
- 해결책/구원 제시형: 불안에 빠진 유저에게 확실한 솔루션 제공
- 질문/테스트 유도형: '나는 어떨까?' 자기 객관화 욕구 자극
- 행동 촉구형: 더 늦기 전에 당장 확인하라는 강한 지시

## 후킹 멘트 작성 규칙
- 15~30자 (한글 기준)
- 부드러운 어미 (~있어요/~보여요)
- 매핑된 유료 콘텐츠의 질문 내용 기반으로 작성
- "유료"/"결제"/"상담" 단어 절대 금지

## 출력
반드시 아래 JSON 형식으로만 응답하세요. 다른 텍스트 없이 JSON만 출력하세요.
{"selectedContentId": "선택한 유료 콘텐츠 ID", "hookText": "후킹 멘트", "strategy": "사용한 전략명"}`

    console.log('🤖 [upsell-mapping] GPT-4.1-nano 호출 시작...')

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4.1-nano',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
        max_tokens: 300,
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('❌ [upsell-mapping] OpenAI API 오류:', response.status, errorText)
      return new Response(
        JSON.stringify({ success: false, error: 'AI 호출 실패' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const data = await response.json()

    let responseText = ''
    if (data.choices && data.choices[0]?.message?.content) {
      responseText = data.choices[0].message.content.trim()
    } else {
      console.error('❌ [upsell-mapping] 알 수 없는 응답 구조:', data)
      return new Response(
        JSON.stringify({ success: false, error: '예상하지 못한 API 응답 형식' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('📦 [upsell-mapping] AI 응답:', responseText)

    // 8. JSON 파싱
    let aiResult: AiResponse
    try {
      let jsonText = responseText

      // ```json ... ``` 형식 제거
      const codeBlockMatch = responseText.match(/```(?:json)?\s*([\s\S]*?)```/)
      if (codeBlockMatch) {
        jsonText = codeBlockMatch[1].trim()
      }

      aiResult = JSON.parse(jsonText)
    } catch (parseError) {
      console.error('❌ [upsell-mapping] JSON 파싱 실패:', parseError)
      return new Response(
        JSON.stringify({ success: false, error: 'AI 응답 파싱 실패' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 9. 선택된 ID 검증: 후보 목록에 존재하는지 확인
    const isValidId = candidateIds.includes(aiResult.selectedContentId)
    if (!isValidId) {
      console.error('❌ [upsell-mapping] 잘못된 ID 선택:', aiResult.selectedContentId)
      return new Response(
        JSON.stringify({ success: false, error: '유효하지 않은 콘텐츠 ID가 선택됨' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 10. DB 업데이트
    const { error: updateError } = await supabase
      .from('master_contents')
      .update({
        recommended_paid_content_id: aiResult.selectedContentId,
        upsell_hook_text: aiResult.hookText,
      })
      .eq('id', contentId)

    if (updateError) {
      console.error('❌ [upsell-mapping] DB 업데이트 실패:', updateError)
      return new Response(
        JSON.stringify({ success: false, error: 'DB 업데이트 실패' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`✅ [upsell-mapping] 완료! 매핑: ${aiResult.selectedContentId}, 멘트: ${aiResult.hookText}, 전략: ${aiResult.strategy}`)

    return new Response(
      JSON.stringify({
        success: true,
        recommendedPaidContentId: aiResult.selectedContentId,
        hookText: aiResult.hookText,
        strategy: aiResult.strategy,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('❌ [upsell-mapping] 예외:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : '알 수 없는 오류',
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
