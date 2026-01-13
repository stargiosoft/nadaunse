import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { title, description, questionerInfo } = await req.json()

    const apiKey = Deno.env.get('OPENAI_API_KEY')
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY가 설정되지 않았습니다.')
    }

    const prompt = `[역할]
운세 콘텐츠 썸네일 전문 일러스트 프롬프트 엔지니어

[지시]
운세(사주) 온라인 상품 썸네일용 일러스트 장면 프롬프트를 영문으로 작성해줘.
[사주 상품 설명]을 참고해서 상품의 핵심 메시지를 직관적으로 전달하는 장면을 구성해줘.

[핵심 원칙]
- 썸네일만 보고 0.5초 안에 "이건 OO 관련 운세구나"를 알 수 있어야 함
- 추상적인 운세 도구(사주 차트, 타로 등)만으로 구성하지 말 것
- 상품 주제를 직접 연상시키는 소품과 상황을 창의적으로 조합
- 같은 카테고리라도 매번 다른 시각적 접근 시도

[캐릭터 규칙]
- 주인공은 "새싹이" 마스코트 (sprout mascot character)
- 캐릭터 외형 묘사 금지 (별도 지정됨)
- 동작, 표정, 소품, 앵글만 지정
- "swan", "bird", "cygnet" 단어 사용 금지
- 캐릭터가 상황에 몰입한 자연스러운 동작 연출

[배경 규칙]
- 상품 주제와 감정에 맞는 장소를 창의적으로 선택
- 실내/실외 제한 없음, 상품에 가장 어울리는 공간 우선
- 매번 다른 장소와 구도 시도 (반복 금지)

절대 금지:
- 우주, 별밤, 오로라, 구름 위, 판타지 공간, 물가/호수
- glowing, luminous, ethereal, starry, cosmic, magical, mystical 표현
- 주제와 관련없이 서재/책상 배경 사용
- 주제와 관련없이 cafe,table 단어 사용
- 이미지에 텍스트 표시

[프롬프트 구조]
Scene: [캐릭터의 구체적 동작 - 상품 주제와 직결되는 상황]
Setting: [상품 감정과 어울리는 구체적 장소]
Key props: [상품을 직관적으로 상징하는 소품 2-3개]
Mood: [전체 분위기와 감정 톤]

[사주 상품 설명]
제목: ${title}
설명: ${description || '없음'}
질문자 정보: ${questionerInfo || '없음'}

[출력 형식]
부연 설명 없이 영문 프롬프트만 출력
항목(Scene, Setting, Key props, Mood) 구조 유지`

    console.log('OpenAI Responses API 호출 시작 (gpt-5-nano)')

    const response = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-5-nano',
        input: prompt
      })
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('OpenAI API 에러:', errorText)
      throw new Error(`OpenAI API 에러: ${response.status} - ${errorText}`)
    }

    const data = await response.json()
    console.log('OpenAI 응답 수신 완료')

    const messageOutput = data.output?.find((o: any) => o.type === 'message')
    const imagePrompt = messageOutput?.content?.[0]?.text?.trim()

    if (!imagePrompt) {
      throw new Error('이미지 프롬프트를 생성하지 못했습니다.')
    }

    return new Response(
      JSON.stringify({ success: true, imagePrompt: imagePrompt }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    )

  } catch (error) {
    console.error('에러 발생:', error.message)
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    )
  }
})
