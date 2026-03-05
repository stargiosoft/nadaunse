// Supabase Edge Function: 타로 상담 답변 생성 (GPT-4.1-mini)
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7'
import { getCorsHeaders, handleCorsPreflightRequest } from '../server/cors.ts'

// 78장 타로 덱
const TAROT_DECK = [
  // 메이저 아르카나 (22장)
  "The Fool", "The Magician", "The High Priestess", "The Empress", "The Emperor",
  "The Hierophant", "The Lovers", "The Chariot", "Strength", "The Hermit",
  "Wheel of Fortune", "Justice", "The Hanged Man", "Death", "Temperance",
  "The Devil", "The Tower", "The Star", "The Moon", "The Sun", "Judgement", "The World",
  // 마이너 아르카나 - Wands (14장)
  "Ace of Wands", "Two of Wands", "Three of Wands", "Four of Wands", "Five of Wands",
  "Six of Wands", "Seven of Wands", "Eight of Wands", "Nine of Wands", "Ten of Wands",
  "Page of Wands", "Knight of Wands", "Queen of Wands", "King of Wands",
  // 마이너 아르카나 - Cups (14장)
  "Ace of Cups", "Two of Cups", "Three of Cups", "Four of Cups", "Five of Cups",
  "Six of Cups", "Seven of Cups", "Eight of Cups", "Nine of Cups", "Ten of Cups",
  "Page of Cups", "Knight of Cups", "Queen of Cups", "King of Cups",
  // 마이너 아르카나 - Swords (14장)
  "Ace of Swords", "Two of Swords", "Three of Swords", "Four of Swords", "Five of Swords",
  "Six of Swords", "Seven of Swords", "Eight of Swords", "Nine of Swords", "Ten of Swords",
  "Page of Swords", "Knight of Swords", "Queen of Swords", "King of Swords",
  // 마이너 아르카나 - Pentacles (14장)
  "Ace of Pentacles", "Two of Pentacles", "Three of Pentacles", "Four of Pentacles", "Five of Pentacles",
  "Six of Pentacles", "Seven of Pentacles", "Eight of Pentacles", "Nine of Pentacles", "Ten of Pentacles",
  "Page of Pentacles", "Knight of Pentacles", "Queen of Pentacles", "King of Pentacles"
]

// 랜덤 타로 카드 선택
function getRandomTarotCard(): string {
  const randomIndex = Math.floor(Math.random() * TAROT_DECK.length)
  return TAROT_DECK[randomIndex]
}

// 타로 카드 이미지 URL 매핑
function getTarotCardImageUrl(cardName: string, supabaseUrl: string): string {
  // 1. 괄호와 한글 제거 (예: "King of Wands (완드 왕)" → "King of Wands")
  let fileName = cardName.replace(/\s*\(.*?\)/g, '').trim()

  // 2. 메이저 아르카나의 숫자 제거 (예: "0. The Fool" → "The Fool")
  fileName = fileName.replace(/^\d+\.\s*/, '')

  // 3. 확장자 추가
  const fileNameWithExt = `${fileName}.webp`

  // 4. URL 인코딩 (공백 → %20)
  const encodedFileName = encodeURIComponent(fileNameWithExt)
  const encodedFolder = encodeURIComponent('tarot cards')

  return `${supabaseUrl}/storage/v1/object/public/assets/${encodedFolder}/${encodedFileName}`
}

serve(async (req) => {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    return handleCorsPreflightRequest(req)
  }

  const corsHeaders = getCorsHeaders(req)

  try {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('🚀 [Edge Function] generate-tarot-consult 시작')

    const requestBody = await req.json()
    const { question, userId } = requestBody

    // 입력 검증
    if (!question || typeof question !== 'string' || question.trim().length === 0) {
      console.error('❌ [Edge Function] question 누락 또는 빈 문자열')
      return new Response(
        JSON.stringify({ success: false, error: '질문을 입력해주세요.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (question.length > 300) {
      console.error('❌ [Edge Function] question 길이 초과:', question.length)
      return new Response(
        JSON.stringify({ success: false, error: '질문은 300자 이내로 입력해주세요.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // ⭐ 비회원 상담 체험 1회 제한 (fingerprint 기반)
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

    if (!userId) {
      console.log('🔒 [Edge Function] 비회원 타로 상담 → fingerprint 체크')

      const supabase = createClient(supabaseUrl, supabaseServiceKey)

      // fingerprint 생성 (SHA-256(IP+UA))
      const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
        || req.headers.get('x-real-ip')
        || req.headers.get('cf-connecting-ip')
        || 'unknown'
      const userAgent = req.headers.get('user-agent') || 'unknown'

      const encoder = new TextEncoder()
      const data = encoder.encode(ip + userAgent)
      const hashBuffer = await crypto.subtle.digest('SHA-256', data)
      const hashArray = Array.from(new Uint8Array(hashBuffer))
      const fingerprint = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')

      console.log('📌 [Edge Function] fingerprint:', fingerprint.substring(0, 16) + '...')

      // 이미 사용했는지 확인
      const { count, error: countError } = await supabase
        .from('anonymous_consult_views')
        .select('*', { count: 'exact', head: true })
        .eq('fingerprint', fingerprint)

      if (countError) {
        console.warn('⚠️ [Edge Function] anonymous_consult_views 조회 실패:', countError)
      } else if ((count ?? 0) >= 1) {
        console.log('🚫 [Edge Function] 비회원 상담 체험 제한 도달 → CONSULT_LIMIT_REACHED')
        return new Response(
          JSON.stringify({ success: false, error: 'CONSULT_LIMIT_REACHED' }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // 사용 기록 INSERT (성공 시 아래에서 진행)
      const { error: insertError } = await supabase
        .from('anonymous_consult_views')
        .insert({ fingerprint, consult_type: 'taro' })

      if (insertError) {
        // UNIQUE 제약 위반 = 이미 사용한 fingerprint
        if (insertError.code === '23505') {
          console.log('🚫 [Edge Function] fingerprint 중복 → CONSULT_LIMIT_REACHED')
          return new Response(
            JSON.stringify({ success: false, error: 'CONSULT_LIMIT_REACHED' }),
            { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }
        console.warn('⚠️ [Edge Function] anonymous_consult_views INSERT 실패:', insertError)
        // INSERT 실패해도 서비스 가용성 우선으로 계속 진행
      } else {
        console.log('✅ [Edge Function] 비회원 상담 체험 기록 완료')
      }
    }

    // OpenAI API 키 확인
    const apiKey = Deno.env.get('OPENAI_API_KEY')
    if (!apiKey) {
      console.error('❌ [Edge Function] OpenAI API 키 없음')
      return new Response(
        JSON.stringify({ success: false, error: 'AI 서비스가 일시적으로 불가합니다.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 랜덤 타로 카드 선택
    const selectedCard = getRandomTarotCard()
    console.log('🃏 [Edge Function] 선택된 타로 카드:', selectedCard)

    // OpenAI Chat Completions API 호출
    const prompt = `## 역할
고객의 현재 고민을 타로 카드를 통해 분석하여 통찰력 있는 맞춤 상담을 제공하는 전문 타로 리더.
반드시 지정된 JSON 형식으로만 응답한다.

## 질문
${question.trim()}

## 타로 정보
스프레드: 1카드 스프레드
타로카드: ${selectedCard}

## 응답 형식
반드시 아래 JSON 형식으로만 응답하라. JSON 외의 텍스트는 절대 포함하지 마라.

\`\`\`json
{
  "cardMessage": "이 카드가 질문자에게 전하는 메시지. 3~4문장. 해요체.",
  "currentFlow": "지금 질문자에게 흐르고 있는 에너지와 흐름. 2~3문장. 해요체.",
  "actionAdvice": "구체적으로 이렇게 움직여보라는 실천 조언. 2~3문장. 해요체.",
  "dailySentence": "오늘 하루를 위한 핵심 한 문장. 짧고 임팩트 있게."
}
\`\`\`

## 각 필드 작성 가이드

### cardMessage (카드가 전하는 메시지)
- 선택된 타로 카드의 의미를 질문자의 고민에 맞게 해석
- 카드가 상징하는 에너지가 질문자의 상황에 어떻게 작용하는지 설명
- 추상적 표현보다 구체적 상황으로 풀어 설명

### currentFlow (지금 흐름은)
- 현재 질문자 주변에 흐르는 에너지를 카드를 통해 읽어냄
- 지금 시점에서 주의 깊게 볼 부분을 안내

### actionAdvice (이렇게 움직여보세요)
- 카드가 제시하는 방향에 따른 구체적이고 실천 가능한 행동 조언
- 질문자가 바로 실행할 수 있는 수준의 조언

### dailySentence (오늘을 위한 한 문장)
- 오늘 하루 마음에 새길 짧은 문장
- 카드의 핵심 메시지를 한 줄로 압축

## 문체 및 어조
- 해요체 사용으로 따뜻하고 친근한 톤 유지
- 좋은 얘기만 하기보단 솔직한 얘기를 통해 진정성 있는 상담 진행
- 상담자 지칭은 '당신'으로 통일
- 타로 전문 용어는 쉬운 말로 풀어 설명
- 구체적인 상황과 예시 중심으로 설명
- 순수 텍스트만 사용 (마크다운 서식 금지)
- ':' 및 ';' 사용하지 않고 .로 문장 마감

## 금지사항
- 인사말이나 마무리 인사 금지
- 추가 질문이나 다음 상담 언급 금지
- 마크다운 서식 사용 금지`

    console.log('🤖 [Edge Function] OpenAI API 호출 시작 (gpt-4.1-mini)')

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
        max_tokens: 2000
      })
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('❌ [Edge Function] OpenAI API 오류:', response.status)
      throw new Error(`OpenAI API 오류: ${response.status} - ${errorText}`)
    }

    const aiResponse = await response.json()

    let rawContent = ''
    if (aiResponse.choices && aiResponse.choices[0]?.message?.content) {
      rawContent = aiResponse.choices[0].message.content.trim()
    } else {
      throw new Error('예상하지 못한 API 응답 형식입니다.')
    }

    console.log('✅ [Edge Function] AI 응답 수신 완료, 길이:', rawContent.length)

    // JSON 파싱 (코드 블록 래핑 제거 후 파싱)
    let parsedResult: {
      cardMessage: string
      currentFlow: string
      actionAdvice: string
      dailySentence: string
    }

    try {
      const jsonStr = rawContent.replace(/^```(?:json)?\s*/, '').replace(/\s*```$/, '').trim()
      parsedResult = JSON.parse(jsonStr)
    } catch {
      console.error('❌ [Edge Function] JSON 파싱 실패, raw:', rawContent.substring(0, 200))
      throw new Error('AI 응답 JSON 파싱에 실패했습니다.')
    }

    // 필수 필드 검증
    if (!parsedResult.cardMessage || !parsedResult.currentFlow || !parsedResult.actionAdvice || !parsedResult.dailySentence) {
      console.error('❌ [Edge Function] 필수 필드 누락:', Object.keys(parsedResult))
      throw new Error('AI 응답에 필수 필드가 누락되었습니다.')
    }

    // 타로 카드 이미지 URL 생성
    const imageUrl = getTarotCardImageUrl(selectedCard, supabaseUrl)

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('✅ [Edge Function] 타로 상담 답변 생성 완료')
    console.log('📤 [Edge Function] 응답 반환 완료')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')

    return new Response(
      JSON.stringify({
        success: true,
        result: parsedResult,
        tarotCard: selectedCard,
        imageUrl
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.error('❌ [Edge Function] 함수 실행 오류:', error)
    console.error('❌ [Edge Function] 에러 메시지:', error instanceof Error ? error.message : '알 수 없는 오류')
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')

    return new Response(
      JSON.stringify({
        success: false,
        error: '상담 결과를 생성하지 못했습니다. 잠시 후 다시 시도해주세요.'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
