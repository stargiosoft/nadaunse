// Supabase Edge Function: 나의 성향 태그 추출
// 1차: 룰베이스 (태그 사전 어간 매칭) → 2차: AI 폴백 (GPT-4.1-mini)

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { getCorsHeaders, handleCorsPreflightRequest } from '../server/cors.ts'
import {
  POSITIVE_TAGS,
  NEGATIVE_TAGS,
  CANONICAL_TAG_SET,
  getTagPolarity,
  matchTagsFromText,
} from '../server/traitTagData.ts'

interface TraitTag {
  type: '장점' | '단점'
  keywords: string[]
}

interface ExtractTraitTagsRequest {
  contentAnswers: Array<{
    questionText: string
    answerText: string
  }>
  existingTags?: string[]
  rejectedTags?: string[]
}

interface ExtractTraitTagsResponse {
  success: boolean
  tags?: Array<{
    name: string
    type: 'positive' | 'negative' | 'neutral'
  }>
  rawResponse?: TraitTag[]
  method?: 'rule-based' | 'ai-fallback'
  error?: string
}

// AI 폴백용 프롬프트 태그 목록 (한 번만 생성)
const POSITIVE_TAGS_STR = POSITIVE_TAGS.join(', ')
const NEGATIVE_TAGS_STR = NEGATIVE_TAGS.join(', ')

// 룰베이스 최소 요구: positive 2개 + negative 1개
const MIN_POSITIVE = 2
const MIN_NEGATIVE = 1

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return handleCorsPreflightRequest(req)
  }

  const corsHeaders = getCorsHeaders(req)

  try {
    const { contentAnswers, existingTags = [], rejectedTags = [] }: ExtractTraitTagsRequest = await req.json()

    if (!contentAnswers || !Array.isArray(contentAnswers) || contentAnswers.length === 0) {
      return new Response(
        JSON.stringify({ success: false, error: '운세 콘텐츠 답변이 필요합니다.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 운세 콘텐츠 전문 구성
    const contentText = contentAnswers.map((qa, index) =>
      `# 질문${index + 1}: ${qa.questionText}\n\n${qa.answerText}`
    ).join('\n\n---\n\n')

    // ────────────────────────────────────────
    // 1차: 룰베이스 매칭
    // ────────────────────────────────────────
    const { positive, negative } = matchTagsFromText(contentText, existingTags, rejectedTags)

    console.log(`🏷️ [extract-trait-tags] 룰베이스 매칭: positive ${positive.length}개, negative ${negative.length}개`)
    if (positive.length > 0) {
      console.log('  📌 positive top5:', positive.slice(0, 5).map(m => `${m.canonical}(${m.score})`).join(', '))
    }
    if (negative.length > 0) {
      console.log('  📌 negative top3:', negative.slice(0, 3).map(m => `${m.canonical}(${m.score})`).join(', '))
    }

    if (positive.length >= MIN_POSITIVE && negative.length >= MIN_NEGATIVE) {
      // 룰베이스 성공 → AI 호출 없이 반환
      const selectedPositive = positive.slice(0, MIN_POSITIVE)
      const selectedNegative = negative.slice(0, MIN_NEGATIVE)

      const tags = [
        ...selectedPositive.map(m => ({ name: m.canonical, type: 'positive' as const })),
        ...selectedNegative.map(m => ({ name: m.canonical, type: 'negative' as const })),
      ]

      const rawResponse: TraitTag[] = [
        { type: '장점', keywords: selectedPositive.map(m => m.canonical) },
        { type: '단점', keywords: selectedNegative.map(m => m.canonical) },
      ]

      console.log('✅ [extract-trait-tags] 룰베이스 완료:', tags.map(t => `${t.name}(${t.type})`).join(', '))

      return new Response(
        JSON.stringify({ success: true, tags, rawResponse, method: 'rule-based' } as ExtractTraitTagsResponse),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // ────────────────────────────────────────
    // 2차: AI 폴백 (룰베이스 부족 시)
    // ────────────────────────────────────────
    console.log('⚠️ [extract-trait-tags] 룰베이스 부족 → AI 폴백 시작')

    const apiKey = Deno.env.get('OPENAI_API_KEY')
    if (!apiKey) {
      return new Response(
        JSON.stringify({ success: false, error: 'OpenAI API 키가 설정되지 않았습니다.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const existingTagsStr = existingTags.length > 0 ? JSON.stringify(existingTags) : '[]'
    const rejectedTagsStr = rejectedTags.length > 0 ? JSON.stringify(rejectedTags) : '[]'

    const prompt = `## **역할**
사람의 장단점을 알려주는 심리 상담자

## **지시 사항**
아래 **태그 사전**에서 장점 2개, 단점 1개를 선택해.
반드시 사전에 있는 태그만 그대로 출력해. 사전에 없는 태그를 만들지 마.
누구에게나 적용될 수 있는 모호한 태그보단 '나다움'을 느낄 수 있는 구체적이고 개인화된 태그를 선택해.
반드시 '사주 답변'에 명시된 내용을 기반으로 해야 해.
선택한 태그는 기질/성질의 의미가 서로 중복되지 않아야 해.

## **장점 태그 사전** (여기서 2개 선택)
${POSITIVE_TAGS_STR}

## **단점 태그 사전** (여기서 1개 선택)
${NEGATIVE_TAGS_STR}

## **사주 답변**
${contentText}

## **기존 태그** (의미 중복 피하기)
${existingTagsStr}

## **금지 태그** (선택 불가)
${rejectedTagsStr}

## **출력 형식**
아래 JSON 형식으로만 응답해:
[
  {
    "type": "장점",
    "keywords": ["장점태그1", "장점태그2"]
  },
  {
    "type": "단점",
    "keywords": ["단점태그1"]
  }
]`

    console.log('🏷️ [extract-trait-tags] OpenAI API 호출 (GPT-4.1-mini, 사전 기반 폴백)...')

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4.1-mini',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.5,
        max_tokens: 500
      })
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('❌ [extract-trait-tags] OpenAI API 오류:', response.status, errorText)
      return new Response(
        JSON.stringify({ success: false, error: `OpenAI API 오류: ${response.status}` }),
        { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const data = await response.json()

    let responseText = ''
    if (data.choices && data.choices[0]?.message?.content) {
      responseText = data.choices[0].message.content.trim()
    } else {
      throw new Error('예상하지 못한 API 응답 형식입니다.')
    }

    if (!responseText) {
      throw new Error('생성된 텍스트가 비어있습니다.')
    }

    console.log('✅ [extract-trait-tags] AI 응답:', responseText)

    // JSON 파싱
    let parsedTags: TraitTag[]
    try {
      let jsonText = responseText
      const codeBlockMatch = responseText.match(/```(?:json)?\s*([\s\S]*?)```/)
      if (codeBlockMatch) jsonText = codeBlockMatch[1].trim()
      const arrayMatch = jsonText.match(/\[[\s\S]*\]/)
      if (arrayMatch) jsonText = arrayMatch[0]

      const parsed = JSON.parse(jsonText)
      parsedTags = Array.isArray(parsed) ? parsed : parsed.tags ?? []
    } catch {
      console.error('❌ [extract-trait-tags] JSON 파싱 실패, 원본:', responseText)
      throw new Error('JSON 파싱 실패')
    }

    // AI 태그 검증: 사전에 있는 것만 수용, 미등록은 거부
    const validAiPositive: string[] = []
    const validAiNegative: string[] = []

    for (const item of parsedTags) {
      for (const keyword of item.keywords) {
        const trimmed = keyword.trim()
        if (CANONICAL_TAG_SET.has(trimmed)) {
          const polarity = getTagPolarity(trimmed)
          if (polarity === 'positive') validAiPositive.push(trimmed)
          else validAiNegative.push(trimmed)
        } else {
          console.warn(`⚠️ [extract-trait-tags] AI 사전 미등록 태그 거부: "${trimmed}"`)
        }
      }
    }

    console.log(`📌 [extract-trait-tags] AI 유효 태그: positive ${validAiPositive.length}개, negative ${validAiNegative.length}개`)

    // AI 유효 태그 + 룰베이스 보충으로 최종 조합
    const exclude = new Set([...existingTags, ...rejectedTags])
    const finalPositive: string[] = [...validAiPositive]
    const finalNegative: string[] = [...validAiNegative]

    // 부족한 positive를 룰베이스에서 보충
    for (const match of positive) {
      if (finalPositive.length >= 2) break
      if (!finalPositive.includes(match.canonical) && !exclude.has(match.canonical)) {
        finalPositive.push(match.canonical)
      }
    }

    // 부족한 negative를 룰베이스에서 보충
    for (const match of negative) {
      if (finalNegative.length >= 1) break
      if (!finalNegative.includes(match.canonical) && !exclude.has(match.canonical)) {
        finalNegative.push(match.canonical)
      }
    }

    // 최종 조합: 2 positive + 1 negative, negative 없으면 positive 3개
    const tags: Array<{ name: string; type: 'positive' | 'negative' | 'neutral' }> = []

    if (finalNegative.length >= 1) {
      // 정상: 2 positive + 1 negative
      for (const name of finalPositive.slice(0, 2)) {
        tags.push({ name, type: 'positive' })
      }
      for (const name of finalNegative.slice(0, 1)) {
        tags.push({ name, type: 'negative' })
      }
    } else {
      // negative 없음: positive top 3
      console.warn('⚠️ [extract-trait-tags] negative 태그 없음 → positive 3개로 대체')
      for (const name of finalPositive.slice(0, 3)) {
        tags.push({ name, type: 'positive' })
      }
    }

    const rawResponse: TraitTag[] = [
      { type: '장점', keywords: tags.filter(t => t.type === 'positive').map(t => t.name) },
      { type: '단점', keywords: tags.filter(t => t.type === 'negative').map(t => t.name) },
    ]

    console.log('✅ [extract-trait-tags] AI+룰베이스 병합 완료:', tags.map(t => `${t.name}(${t.type})`).join(', '))

    return new Response(
      JSON.stringify({
        success: true,
        tags,
        rawResponse,
        method: 'ai-fallback',
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
