// Supabase Edge Function: 나의 성향 태그 추출 (GPT-4.1-mini)
// 운세 콘텐츠 답변에서 장점 2개, 단점 1개의 성향 키워드를 추출합니다.

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { getCorsHeaders, handleCorsPreflightRequest } from '../server/cors.ts'

interface TraitTag {
  type: '장점' | '단점'
  keywords: string[]
}

interface ExtractTraitTagsRequest {
  // 운세 콘텐츠 질문 및 답변 전문
  contentAnswers: Array<{
    questionText: string
    answerText: string
  }>
  // 사용자가 기존에 저장한 태그 (중복 방지용)
  existingTags?: string[]
  // 사용자가 선택하지 않은 태그 (추출 제외)
  rejectedTags?: string[]
}

interface ExtractTraitTagsResponse {
  success: boolean
  tags?: Array<{
    name: string
    type: 'positive' | 'negative' | 'neutral'
  }>
  rawResponse?: TraitTag[]
  error?: string
}

serve(async (req) => {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    return handleCorsPreflightRequest(req)
  }

  const corsHeaders = getCorsHeaders(req)

  try {
    const { contentAnswers, existingTags = [], rejectedTags = [] }: ExtractTraitTagsRequest = await req.json()

    // 유효성 검증
    if (!contentAnswers || !Array.isArray(contentAnswers) || contentAnswers.length === 0) {
      return new Response(
        JSON.stringify({ success: false, error: '운세 콘텐츠 답변이 필요합니다.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // OpenAI API 키 확인
    const apiKey = Deno.env.get('OPENAI_API_KEY')
    if (!apiKey) {
      return new Response(
        JSON.stringify({ success: false, error: 'OpenAI API 키가 설정되지 않았습니다.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 운세 콘텐츠 답변 전문 구성
    const contentText = contentAnswers.map((qa, index) =>
      `# 질문${index + 1}: ${qa.questionText}\n\n${qa.answerText}`
    ).join('\n\n---\n\n')

    // 기존 태그 문자열 구성
    const existingTagsStr = existingTags.length > 0
      ? JSON.stringify(existingTags)
      : '[]'

    // 거부된 태그 문자열 구성
    const rejectedTagsStr = rejectedTags.length > 0
      ? JSON.stringify(rejectedTags)
      : '[]'

    // 프롬프트 구성
    const prompt = `## **역할**
사람의 장단점을 알려주는 심리 상담자

## **지시 사항**
장점 2개, 단점 1개의 성향 태그를 추출해.
태그는 반드시 "~한", "~적인", "~있는", "~하는" 등의 짧은 형용사로 출력해.
글자수는 7자 이내로 제한하고 형용사는 짧고 간결하게 작성해.
누구에게나 적용될 수 있는 모호한 태그 보단 '나다움'을 느낄 수 있는 구체적이고 개인화된 태그로 추출해.
반드시 '사주 답변'에 명시된 내용을 기반으로 해야 해.
태그는 기질/성질의 의미가 서로 중복되지 않아야 해.

## **좋은 예시**
✅ 성급한, 꼼꼼한, 도전적인, 신중한, 감성적인, 논리적인, 솔직한, 창의적인, 융통성이 있는, 자만하는, 

## **나쁜 예시 (절대 금지)**
❌ 재치 있게 임기응변하는
❌ 실리 중심으로 판단하는
❌ 감정을 직설적으로 표현하는

## **사주 답변**
${contentText}

## **권고 사항**
아래 사용자가 저장한 기존 태그와 의미가 중복되지 않는 태그를 우선해 추출해.
${existingTagsStr}

## **금지 태그**
아래 태그는 사용자가 선택하지 않은 태그야. 이 태그와 동일하거나 의미가 매우 유사한 태그는 절대 추출하지 마.
${rejectedTagsStr}

## **출력 형식**
아래 JSON 형식으로만 응답해:
[
  {
    "type": "장점",
    "keywords": ["장점 태그1", "장점 태그2"]
  },
  {
    "type": "단점",
    "keywords": ["단점 태그1"]
  }
]

## **출력 예시**
[
  {
    "type": "장점",
    "keywords": ["창의적인", "꼼꼼한"]
  },
  {
    "type": "단점",
    "keywords": ["성급한"]
  }
]`

    console.log('🏷️ [extract-trait-tags] OpenAI API 호출 시작 (GPT-4.1-mini)...')
    console.log('📌 [extract-trait-tags] 콘텐츠 답변 수:', contentAnswers.length)
    console.log('📌 [extract-trait-tags] 기존 태그 수:', existingTags.length)
    console.log('📌 [extract-trait-tags] 거부 태그 수:', rejectedTags.length)

    // OpenAI Chat Completions API 호출 (GPT-4.1-mini)
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4.1-mini',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
        max_tokens: 500
      })
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('❌ [extract-trait-tags] OpenAI API 오류:', response.status, errorText)
      return new Response(
        JSON.stringify({
          success: false,
          error: `OpenAI API 오류: ${response.status}`
        }),
        { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const data = await response.json()
    console.log('📦 [extract-trait-tags] OpenAI 응답 구조:', JSON.stringify(data, null, 2))

    // Chat Completions API 응답 파싱
    let responseText = ''

    if (data.choices && data.choices[0]?.message?.content) {
      responseText = data.choices[0].message.content.trim()
    } else {
      console.error('❌ [extract-trait-tags] 알 수 없는 응답 구조:', data)
      throw new Error('예상하지 못한 API 응답 형식입니다.')
    }

    if (!responseText) {
      throw new Error('생성된 텍스트가 비어있습니다.')
    }

    console.log('✅ [extract-trait-tags] 응답 텍스트:', responseText)

    // JSON 파싱 (응답 형태: [...] 배열)
    let parsedTags: TraitTag[]
    try {
      // JSON 배열 부분만 추출 (마크다운 코드블록 등 제거)
      let jsonText = responseText

      // ```json ... ``` 형식 제거
      const codeBlockMatch = responseText.match(/```(?:json)?\s*([\s\S]*?)```/)
      if (codeBlockMatch) {
        jsonText = codeBlockMatch[1].trim()
      }

      // 배열 부분 추출
      const arrayMatch = jsonText.match(/\[[\s\S]*\]/)
      if (arrayMatch) {
        jsonText = arrayMatch[0]
      }

      const parsed = JSON.parse(jsonText)

      if (Array.isArray(parsed)) {
        parsedTags = parsed
      } else if (parsed.tags && Array.isArray(parsed.tags)) {
        // { tags: [...] } 형식도 지원 (fallback)
        parsedTags = parsed.tags
      } else {
        throw new Error('예상하지 못한 응답 형식')
      }
    } catch (parseError) {
      console.error('❌ [extract-trait-tags] JSON 파싱 실패:', parseError)
      console.error('❌ [extract-trait-tags] 원본 텍스트:', responseText)
      throw new Error('JSON 파싱 실패')
    }

    // 태그 변환 (장점 → positive, 단점 → negative)
    const tags: Array<{ name: string; type: 'positive' | 'negative' | 'neutral' }> = []

    for (const item of parsedTags) {
      const tagType = item.type === '장점' ? 'positive' : 'negative'
      for (const keyword of item.keywords) {
        tags.push({
          name: keyword,
          type: tagType
        })
      }
    }

    console.log('✅ [extract-trait-tags] 태그 추출 완료:', tags)

    return new Response(
      JSON.stringify({
        success: true,
        tags,
        rawResponse: parsedTags
      } as ExtractTraitTagsResponse),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('❌ [extract-trait-tags] 함수 실행 오류:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : '알 수 없는 오류'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
