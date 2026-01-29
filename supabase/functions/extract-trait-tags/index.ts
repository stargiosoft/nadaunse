// Supabase Edge Function: 나의 성향 태그 추출 (GPT-5-nano)
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
    const { contentAnswers, existingTags = [] }: ExtractTraitTagsRequest = await req.json()

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

    // 프롬프트 구성
    const prompt = `## **역할**
사람의 장단점을 알려주는 심리 상담자

## **지시 사항**
장점 2개, 단점 1개의 키워드를 추출해.
누구에게나 적용될 수 있는 모호한 키워드 보단 '나다움'을 느낄 수 있는 구체적이고 개인화된 키워드로 추출해.
반드시 '사주 답변'에 명시된 내용을 기반으로 해야 해.
키워드는 기질/성질의 의미가 서로 중복되지 않아야 해.
키워드는 반드시 3개만 추출해.
키워드당 글자수는 12자가 절대 넘지 않아야해.

## **사주 답변**
${contentText}

## **권고 사항**
아래 사용자가 저장한 기존 키워드와 의미가 중복되지 않는 키워드를 우선해 추출해.
${existingTagsStr}

## **출력 형식**
키워드는 반드시 형용사 형태로 출력하고 아래 JSON 형식으로만 응답해:
[
  {
    "type": "장점",
    "keywords": ["장점 키워드1", "장점 키워드2"]
  },
  {
    "type": "단점",
    "keywords": ["단점 키워드1"]
  }
]

## **출력 예시**
[
  {
    "type": "장점",
    "keywords": ["문제 해결력이 있는", "창의적인"]
  },
  {
    "type": "단점",
    "keywords": ["질투심이 많은"]
  }
]`

    console.log('🏷️ [extract-trait-tags] OpenAI API 호출 시작 (GPT-5-nano)...')
    console.log('📌 [extract-trait-tags] 콘텐츠 답변 수:', contentAnswers.length)
    console.log('📌 [extract-trait-tags] 기존 태그 수:', existingTags.length)

    // OpenAI Responses API 호출 (GPT-5-nano)
    // ⚠️ JSON Schema는 최상위 type이 object여야 함
    const response = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-5-nano',
        input: prompt,
        text: {
          format: {
            type: 'json_schema',
            name: 'trait_tags',
            schema: {
              type: 'object',
              properties: {
                tags: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      type: { type: 'string', enum: ['장점', '단점'] },
                      keywords: { type: 'array', items: { type: 'string' } }
                    },
                    required: ['type', 'keywords'],
                    additionalProperties: false
                  }
                }
              },
              required: ['tags'],
              additionalProperties: false
            },
            strict: true
          }
        }
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

    // 응답 파싱
    let responseText = ''

    const messageOutput = data.output?.find((o: any) => o.type === 'message')
    if (messageOutput?.content?.[0]?.text) {
      responseText = messageOutput.content[0].text.trim()
    } else if (data.output_text) {
      responseText = data.output_text.trim()
    } else if (data.output && data.output[0]?.content?.[0]?.text) {
      responseText = data.output[0].content[0].text.trim()
    } else if (data.choices && data.choices[0]?.message?.content) {
      responseText = data.choices[0].message.content.trim()
    } else {
      console.error('❌ [extract-trait-tags] 알 수 없는 응답 구조:', data)
      throw new Error('예상하지 못한 API 응답 형식입니다.')
    }

    if (!responseText) {
      throw new Error('생성된 텍스트가 비어있습니다.')
    }

    console.log('✅ [extract-trait-tags] 응답 텍스트:', responseText)

    // JSON 파싱 (응답 형태: { tags: [...] })
    let parsedTags: TraitTag[]
    try {
      const parsed = JSON.parse(responseText)
      // 최상위가 object이고 tags 배열이 있는 경우
      if (parsed.tags && Array.isArray(parsed.tags)) {
        parsedTags = parsed.tags
      } else if (Array.isArray(parsed)) {
        // 배열로 직접 온 경우 (fallback)
        parsedTags = parsed
      } else {
        throw new Error('예상하지 못한 응답 형식')
      }
    } catch (parseError) {
      console.error('❌ [extract-trait-tags] JSON 파싱 실패:', parseError)
      // JSON 부분만 추출 시도
      const jsonMatch = responseText.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0])
        parsedTags = parsed.tags || []
      } else {
        throw new Error('JSON 파싱 실패')
      }
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
