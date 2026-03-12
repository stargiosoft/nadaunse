// Supabase Edge Function: 바이럴 테스트 AI 생성 (Gemini 2.5 Flash)
// --no-verify-jwt 배포 필수
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7'
import { getCorsHeaders, handleCorsPreflightRequest } from '../server/cors.ts'

const GEMINI_API_KEY = Deno.env.get('GOOGLE_API_KEY')!
const MODEL = 'gemini-2.5-flash'

// 일간 → 오행 매핑
const DAY_MASTER_ELEMENT: Record<string, string> = {
  '갑': '목', '을': '목',
  '병': '화', '정': '화',
  '무': '토', '기': '토',
  '경': '금', '신': '금',
  '임': '수', '계': '수',
}

const DAY_MASTERS = ['갑', '을', '병', '정', '무', '기', '경', '신', '임', '계'] as const

serve(async (req) => {
  if (req.method === 'OPTIONS') return handleCorsPreflightRequest(req)
  const corsHeaders = getCorsHeaders(req)

  try {
    const { idea, creatorId } = await req.json()

    if (!idea || typeof idea !== 'string' || idea.trim().length < 2) {
      return new Response(
        JSON.stringify({ success: false, error: '아이디어를 입력해주세요.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    console.log('🎯 바이럴 테스트 생성 시작:', idea)

    // slug 생성 (한글 → 영문 변환 간소화)
    const slug = `test-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`

    // 1. viral_tests 레코드 먼저 생성 (status: generating)
    const { data: test, error: insertError } = await supabase
      .from('viral_tests')
      .insert({
        creator_id: creatorId || null,
        template_type: 'slot_machine', // AI가 추천하면 업데이트
        title: idea.slice(0, 50),
        idea_input: idea,
        status: 'generating',
        slug,
      })
      .select('id')
      .single()

    if (insertError || !test) {
      console.error('❌ viral_tests INSERT 실패:', insertError)
      throw new Error('테스트 생성에 실패했습니다.')
    }

    const testId = test.id
    console.log('✅ viral_tests 생성:', testId)

    // 2. Gemini로 테스트 콘텐츠 생성
    const systemPrompt = `너는 바이럴 심리/운세 테스트 콘텐츠 전문 기획자야.
사용자의 아이디어를 받아서 SNS에서 폭발적으로 공유될 테스트 콘텐츠를 만들어.

중요 규칙:
- "운세", "사주", "팔자" 등 전통 운세 용어를 절대 사용하지 마
- 10개 유형은 내면적으로 10천간(갑을병정무기경신임계)의 특성을 반영하되, 사주 용어는 절대 노출하지 마
- 각 유형의 점수(score)는 15~95 사이로 골고루 분포시켜 (같은 점수 없이)
- 결과 제목은 임팩트 있고 공유하고 싶게 만들어
- 결과 설명은 3~4문장, 공감 가능하고 재미있게
- 19금 콘텐츠는 is_adult: true로 설정
- template_type: "slot_machine"(개인 테스트), "compatibility"(궁합 테스트), "adult"(성인 콘텐츠)

응답 형식 (JSON만, 마크다운 없이):
{
  "template_type": "slot_machine" | "compatibility" | "adult",
  "title": "후킹되는 테스트 제목 (20자 이내)",
  "description": "테스트 설명 (40자 이내)",
  "is_adult": false,
  "results": [
    {
      "day_master": "갑",
      "result_title": "결과 유형 제목",
      "result_description": "3~4문장의 재미있는 결과 설명",
      "score": 85
    }
  ]
}

results 배열에는 반드시 10개 일간(갑,을,병,정,무,기,경,신,임,계)이 모두 포함되어야 해.`

    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${GEMINI_API_KEY}`

    const geminiResponse = await fetch(geminiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: `다음 아이디어로 바이럴 테스트를 만들어줘:\n\n"${idea}"` }]
        }],
        systemInstruction: { parts: [{ text: systemPrompt }] },
        generationConfig: {
          temperature: 0.9,
          maxOutputTokens: 4000,
          responseMimeType: 'application/json',
        },
      }),
    })

    if (!geminiResponse.ok) {
      const errText = await geminiResponse.text()
      console.error('❌ Gemini API 오류:', geminiResponse.status, errText)

      await supabase.from('viral_tests').update({ status: 'failed' }).eq('id', testId)
      throw new Error(`AI 생성 실패: ${geminiResponse.status}`)
    }

    const geminiData = await geminiResponse.json()
    const rawText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text
    if (!rawText) {
      await supabase.from('viral_tests').update({ status: 'failed' }).eq('id', testId)
      throw new Error('AI 응답이 비어있습니다.')
    }

    console.log('📦 Gemini 원문:', rawText.slice(0, 200))

    let generated: {
      template_type: string
      title: string
      description: string
      is_adult: boolean
      results: Array<{
        day_master: string
        result_title: string
        result_description: string
        score: number
      }>
    }

    try {
      generated = JSON.parse(rawText)
    } catch {
      // JSON 블록 추출 시도
      const match = rawText.match(/\{[\s\S]*\}/)
      if (!match) {
        await supabase.from('viral_tests').update({ status: 'failed' }).eq('id', testId)
        throw new Error('AI 응답 JSON 파싱 실패')
      }
      generated = JSON.parse(match[0])
    }

    // 검증: 10개 일간 모두 있는지
    const dayMasters = generated.results.map(r => r.day_master)
    const missing = DAY_MASTERS.filter(dm => !dayMasters.includes(dm))
    if (missing.length > 0) {
      console.warn('⚠️ 누락된 일간:', missing)
      // 누락된 일간에 대한 기본 결과 추가
      for (const dm of missing) {
        generated.results.push({
          day_master: dm,
          result_title: `${dm}형 유형`,
          result_description: '곧 업데이트될 예정이에요!',
          score: Math.floor(Math.random() * 80) + 15,
        })
      }
    }

    // 3. viral_tests 업데이트
    await supabase.from('viral_tests').update({
      template_type: generated.template_type || 'slot_machine',
      title: generated.title,
      description: generated.description,
      is_adult: generated.is_adult || false,
      status: 'review',
      updated_at: new Date().toISOString(),
    }).eq('id', testId)

    // 4. viral_test_results INSERT (10개)
    const resultsToInsert = generated.results.slice(0, 10).map(r => ({
      test_id: testId,
      day_master: r.day_master,
      element: DAY_MASTER_ELEMENT[r.day_master] || '토',
      result_title: r.result_title,
      result_description: r.result_description,
      score: Math.max(15, Math.min(95, r.score || 50)),
    }))

    const { error: resultsError } = await supabase
      .from('viral_test_results')
      .insert(resultsToInsert)

    if (resultsError) {
      console.error('❌ viral_test_results INSERT 실패:', resultsError)
      throw new Error('결과 저장에 실패했습니다.')
    }

    console.log('✅ 테스트 생성 완료:', testId, generated.title)

    // 5. 이미지 생성 비동기 호출 (fire-and-forget)
    fetch(`${supabaseUrl}/functions/v1/generate-viral-test-images`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ testId }),
    }).catch(err => console.error('⚠️ 이미지 생성 호출 실패 (무시):', err))

    return new Response(
      JSON.stringify({
        success: true,
        testId,
        slug,
        title: generated.title,
        description: generated.description,
        templateType: generated.template_type,
        isAdult: generated.is_adult,
        results: generated.results,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('❌ 함수 실행 오류:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : '알 수 없는 오류',
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
