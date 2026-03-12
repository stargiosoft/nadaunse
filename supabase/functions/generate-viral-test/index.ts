// Supabase Edge Function: 바이럴 테스트 AI 생성 — 3단계 에이전트 파이프라인
// Step 1: 기획 에이전트 (아이디어 분석 → 후킹 제목 + 결과 포맷 + 10유형)
// Step 2: 이미지 가이드 에이전트 (비주얼 스타일 + 썸네일/결과별 이미지 프롬프트)
// Step 3: 이미지 생성 비동기 호출
// --no-verify-jwt 배포 필수
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7'
import { getCorsHeaders, handleCorsPreflightRequest } from '../server/cors.ts'

const GEMINI_API_KEY = Deno.env.get('GOOGLE_API_KEY')!
const MODEL = 'gemini-2.5-flash'

const DAY_MASTER_ELEMENT: Record<string, string> = {
  '갑': '목', '을': '목', '병': '화', '정': '화', '무': '토',
  '기': '토', '경': '금', '신': '금', '임': '수', '계': '수',
}
const DAY_MASTERS = ['갑', '을', '병', '정', '무', '기', '경', '신', '임', '계'] as const

// ─── Gemini 호출 헬퍼 ────────────────────────────────────────────
async function callGemini(systemPrompt: string, userPrompt: string): Promise<string> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${GEMINI_API_KEY}`
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: userPrompt }] }],
      systemInstruction: { parts: [{ text: systemPrompt }] },
      generationConfig: { temperature: 0.9, maxOutputTokens: 12000, responseMimeType: 'application/json' },
    }),
  })
  if (!res.ok) {
    const errText = await res.text()
    throw new Error(`Gemini API 오류 ${res.status}: ${errText.slice(0, 200)}`)
  }
  const data = await res.json()
  const raw = data.candidates?.[0]?.content?.parts?.[0]?.text
  if (!raw) throw new Error('Gemini 응답이 비어있습니다.')
  return raw
}

// ─── JSON 파싱 (마크다운 제거 + 정제) ────────────────────────────
function parseJSON<T>(raw: string): T {
  try { return JSON.parse(raw) } catch {}
  const cleaned = raw.replace(/```json?\s*/g, '').replace(/```\s*/g, '')
  try { return JSON.parse(cleaned) } catch {}
  const match = cleaned.match(/\{[\s\S]*\}/)
  if (!match) throw new Error('JSON 파싱 실패')
  const sanitized = match[0]
    .replace(/,\s*([\]}])/g, '$1')
    .replace(/[\x00-\x1f\x7f]/g, ' ')
  return JSON.parse(sanitized)
}

// ═══════════════════════════════════════════════════════════════════
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

    const slug = `test-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`

    // DB 레코드 생성 (status: generating)
    const { data: test, error: insertError } = await supabase
      .from('viral_tests')
      .insert({
        creator_id: creatorId || null,
        template_type: 'slot_machine',
        title: idea.slice(0, 50),
        idea_input: idea,
        status: 'generating',
        slug,
      })
      .select('id')
      .single()

    if (insertError || !test) throw new Error('테스트 생성에 실패했습니다.')
    const testId = test.id
    console.log('✅ viral_tests 생성:', testId)

    // ═══════════════════════════════════════════════════════════════
    // STEP 1: 기획 에이전트
    // ═══════════════════════════════════════════════════════════════
    console.log('🧠 [Step 1] 기획 에이전트 시작')

    const planningSystemPrompt = `너는 SNS 바이럴 테스트 콘텐츠 기획 전문가야. 10년차 콘텐츠 마케터 출신이야.

## 핵심 역할
사용자의 아이디어를 분석해서 "클릭하지 않고는 못 배기는" 테스트를 기획해.

## 후킹 제목 작성 비법 (필수 적용!)
- **호기심 갭**: "당신의 ___는 ___일까?" — 답을 알고 싶게 만들어
- **구체적 숫자**: "10가지 유형 중", "상위 3%만"
- **감정 자극**: "소름돋는", "충격적인", "은밀한"
- **2인칭 직접 호출**: "너의", "당신의" — 나한테 말하는 느낌
- **반전/의외성**: 예상을 뒤엎는 각도에서 접근
- 절대로 평범하거나 설명적인 제목 금지 ("바람기 테스트" ❌ → "은밀한 연애 DNA 분석기" ✅)

## result_format 결정 기준 (매우 중요!)
아이디어의 본질을 파악해서 유저가 진짜 보고 싶은 결과 형식을 결정해:
- **"image_focus"**: 외모/얼굴/동물/캐릭터 등 **시각적 결과**가 핵심일 때 (예: 미래 남편 얼굴, 전생 모습, 나를 닮은 동물)
- **"percentage"**: 확률/수치가 핵심일 때 (예: 바람기 확률, 금수저 확률, 인싸력)
- **"score"**: 점수+유형 분류가 핵심일 때 (예: 연애 유형, 성격 테스트, MBTI 스타일)
- **"ranking"**: 순위/등급이 핵심일 때 (예: 전생 신분, 이세계 직업 등급)

## result_label 작성 규칙
result_format에 따라 각 결과의 label을 다르게:
- image_focus: 핵심 키워드 (예: "도시적 남자", "순둥이 강아지")
- percentage: "87%", "12%" 등 확률값
- score: "95점", "72점" 등 점수
- ranking: "S급", "A급", "상위 1%" 등 등급

## 결과 설명 작성
- result_format이 image_focus이면: 시각적 특징 묘사 중심 (외모, 분위기, 특징)
- result_format이 percentage이면: "왜 이 확률인지" 이유 분석 중심
- result_format이 score/ranking이면: 유형 특성 + 공감 포인트

## 사주 용어 절대 금지
"운세", "사주", "팔자", "천간", "일간" 등 전통 용어 노출 금지. 내면적으로 10천간 특성을 반영하되 자연스러운 성격/유형으로 포장.

## 응답 JSON
{
  "template_type": "slot_machine" | "compatibility" | "adult",
  "title": "후킹 제목 (20자 이내)",
  "description": "테스트 한줄 설명 (40자 이내)",
  "is_adult": false,
  "result_format": "score" | "percentage" | "image_focus" | "ranking",
  "results": [
    {
      "day_master": "갑",
      "result_title": "유형 제목 (이모지 포함)",
      "result_description": "3~5문장. result_format에 맞는 톤으로.",
      "score": 85,
      "result_label": "result_format에 맞는 라벨"
    }
  ]
}

results는 반드시 10개 (갑,을,병,정,무,기,경,신,임,계). score는 15~95 골고루. 같은 점수 없이.`

    const planRaw = await callGemini(
      planningSystemPrompt,
      `다음 아이디어로 바이럴 테스트를 기획해:\n\n"${idea}"`
    )
    console.log('📦 [Step 1] 기획 결과:', planRaw.slice(0, 300))

    interface PlanResult {
      template_type: string
      title: string
      description: string
      is_adult: boolean
      result_format: string
      results: Array<{
        day_master: string
        result_title: string
        result_description: string
        score: number
        result_label: string
      }>
    }
    const plan = parseJSON<PlanResult>(planRaw)

    // 누락된 일간 보충
    const existingDM = plan.results.map(r => r.day_master)
    for (const dm of DAY_MASTERS) {
      if (!existingDM.includes(dm)) {
        plan.results.push({
          day_master: dm,
          result_title: `${dm}형 유형`,
          result_description: '곧 업데이트될 예정이에요!',
          score: Math.floor(Math.random() * 80) + 15,
          result_label: plan.result_format === 'percentage' ? `${Math.floor(Math.random() * 80) + 15}%` : `${Math.floor(Math.random() * 80) + 15}점`,
        })
      }
    }

    // ═══════════════════════════════════════════════════════════════
    // STEP 2: 이미지 가이드 에이전트
    // ═══════════════════════════════════════════════════════════════
    console.log('🎨 [Step 2] 이미지 가이드 에이전트 시작')

    const imageGuideSystemPrompt = `너는 바이럴 콘텐츠 전문 아트 디렉터야. 테스트 기획안을 보고 이미지 가이드라인을 작성해.

## 역할
1. 전체 비주얼 톤 & 스타일 가이드 작성
2. 썸네일 이미지 프롬프트 작성
3. 10개 결과별 이미지 프롬프트 작성

## 이미지 프롬프트 작성 규칙
- 영어로 작성 (Gemini Image 모델용)
- 구체적이고 시각적으로 묘사 (추상적 표현 금지)
- 테스트의 result_format에 따라 이미지 성격이 달라야 함:
  - image_focus: 결과의 주인공(얼굴/캐릭터/동물)이 중심. 각 유형별로 외모/분위기가 확실히 다르게.
  - percentage/score/ranking: 유형의 성격/분위기를 상징하는 일러스트. 캐릭터의 표정과 행동으로 차별화.
- 모든 이미지에 텍스트 포함 금지 (No text)
- 스타일 통일: 같은 테스트의 모든 이미지는 같은 화풍
- 인물이 포함되면: 한국인 기준, 현대적 일러스트 스타일

## 썸네일 프롬프트
- 테스트의 핵심 호기심을 한 장에 담아
- SNS 피드에서 눈에 띄는 강렬한 색감
- 정사각형(1:1), 작은 사이즈에서도 식별 가능

## 결과 이미지 프롬프트
- 세로형(3:4), 결과 카드에 들어갈 메인 비주얼
- 10장 각각 확실히 다른 비주얼 (같아 보이면 안 됨)
- result_title과 result_description의 핵심을 시각화

## 응답 JSON
{
  "style_guide": "전체 비주얼 스타일 가이드 (2~3문장, 한국어)",
  "thumbnail_prompt": "영어 이미지 프롬프트",
  "result_prompts": {
    "갑": "영어 이미지 프롬프트",
    "을": "...",
    "병": "...",
    "정": "...",
    "무": "...",
    "기": "...",
    "경": "...",
    "신": "...",
    "임": "...",
    "계": "..."
  }
}`

    const planSummary = JSON.stringify({
      title: plan.title,
      description: plan.description,
      result_format: plan.result_format,
      results: plan.results.slice(0, 10).map(r => ({
        day_master: r.day_master,
        result_title: r.result_title,
        result_description: r.result_description.slice(0, 80),
        result_label: r.result_label,
      })),
    })

    const guideRaw = await callGemini(
      imageGuideSystemPrompt,
      `다음 테스트 기획안의 이미지 가이드라인을 작성해:\n\n${planSummary}`
    )
    console.log('📦 [Step 2] 이미지 가이드 결과:', guideRaw.slice(0, 300))

    interface ImageGuide {
      style_guide: string
      thumbnail_prompt: string
      result_prompts: Record<string, string>
    }
    const guide = parseJSON<ImageGuide>(guideRaw)

    // ═══════════════════════════════════════════════════════════════
    // DB 저장
    // ═══════════════════════════════════════════════════════════════
    console.log('💾 [DB] 기획+가이드 저장')

    // viral_tests 업데이트
    await supabase.from('viral_tests').update({
      template_type: plan.template_type || 'slot_machine',
      title: plan.title,
      description: plan.description,
      is_adult: plan.is_adult || false,
      result_format: plan.result_format || 'score',
      thumbnail_prompt: guide.thumbnail_prompt || null,
      image_style_guide: guide.style_guide || null,
      status: 'review',
      updated_at: new Date().toISOString(),
    }).eq('id', testId)

    // viral_test_results INSERT (10개)
    const resultsToInsert = plan.results.slice(0, 10).map(r => ({
      test_id: testId,
      day_master: r.day_master,
      element: DAY_MASTER_ELEMENT[r.day_master] || '토',
      result_title: r.result_title,
      result_description: r.result_description,
      score: Math.max(15, Math.min(95, r.score || 50)),
      result_label: r.result_label || null,
      image_prompt: guide.result_prompts?.[r.day_master] || null,
    }))

    const { error: resultsError } = await supabase
      .from('viral_test_results')
      .insert(resultsToInsert)

    if (resultsError) {
      console.error('❌ viral_test_results INSERT 실패:', resultsError)
      throw new Error('결과 저장에 실패했습니다.')
    }

    console.log('✅ [Step 1+2] 기획+가이드 완료:', testId, plan.title)

    // ═══════════════════════════════════════════════════════════════
    // STEP 3: 이미지 생성 비동기 호출 (fire-and-forget)
    // ═══════════════════════════════════════════════════════════════
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
        title: plan.title,
        description: plan.description,
        templateType: plan.template_type,
        isAdult: plan.is_adult,
        resultFormat: plan.result_format,
        results: plan.results.slice(0, 10),
        imageStyleGuide: guide.style_guide,
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
