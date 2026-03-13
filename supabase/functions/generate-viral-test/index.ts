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
    const { idea, creatorId, referenceImage, testId: existingTestId } = await req.json()
    if (!idea || typeof idea !== 'string' || idea.trim().length < 2) {
      return new Response(
        JSON.stringify({ success: false, error: '아이디어를 입력해주세요.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    let testId: string
    let slug: string

    if (existingTestId) {
      // 기획 다시하기: 기존 테스트 재활용
      const { data: existing } = await supabase
        .from('viral_tests')
        .select('id, slug')
        .eq('id', existingTestId)
        .single()
      if (!existing) throw new Error('테스트를 찾을 수 없습니다.')

      testId = existing.id
      slug = existing.slug

      // 기존 결과 삭제
      await supabase.from('viral_test_results').delete().eq('test_id', testId)
      // 기존 이미지 삭제 (Storage)
      const { data: files } = await supabase.storage.from('assets').list(`viral-tests/${testId}`)
      if (files && files.length > 0) {
        await supabase.storage.from('assets').remove(files.map(f => `viral-tests/${testId}/${f.name}`))
      }
      // 상태 업데이트
      await supabase.from('viral_tests').update({
        status: 'generating',
        idea_input: idea,
        thumbnail_url: null,
        updated_at: new Date().toISOString(),
      }).eq('id', testId)

      console.log('♻️ 기획 다시하기:', testId)
    } else {
      // 새 테스트 생성
      slug = `test-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`

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
      testId = test.id
      console.log('✅ viral_tests 생성:', testId)
    }

    // ═══════════════════════════════════════════════════════════════
    // STEP 1: 기획 에이전트
    // ═══════════════════════════════════════════════════════════════
    console.log('🧠 [Step 1] 기획 에이전트 시작')

    const planningSystemPrompt = `너는 10대~20대 타겟 SNS 바이럴 테스트 기획자야. 에브리타임, 인스타, 틱톡에서 폭발적으로 공유되는 콘텐츠만 만들어.

## 핵심 역할
사용자의 아이디어를 "캡쳐해서 단톡방에 공유하지 않고는 못 배기는" 테스트로 바꿔.

## 톤앤매너 (초중요! 반드시 지켜!)
- **MZ세대/알파세대 말투**: 딱딱하고 올드한 설명 금지. 커뮤니티에서 쓰는 말투로.
- **밈/유행어 적극 활용**: "지박령", "빌런", "갓생", "럭키비키", "어쩔티비", "ZONE", "플래그", "레드플래그", "그린플래그" 등
- **자극적이고 웃긴 표현**: "소름돋는 현실 고증", "ㅋㅋ 소름", "ㄹㅇ 찐", "개웃김", "미쳤다"
- **과장과 드라마**: 평범한 결과도 드라마틱하게 포장. 결과 하나하나가 캡쳐 각이 나와야 함
- 절대 금지: "~한 타입이에요", "~을 가진 분이시네요", "~한 매력을 풍깁니다" 같은 올드한 운세 말투

## 후킹 제목 작성 비법
- **호기심 갭**: "너 ___가 ___라는 거 알아?" — 바로 클릭하게
- **숫자로 구체화**: "상위 3%만", "100명 중 1명"
- **감정 폭발**: "소름돋는", "충격", "난리남", "미쳤다"
- **반말/직접 호출**: "너", "니" — 친구가 카톡으로 보내는 느낌
- 금지 예시: "바람기 테스트" ❌ → "불륜 지수 측정기 🔥" ✅
- 금지 예시: "미래 남편 얼굴은?" ❌ → "니 미래 남편 얼굴, 소름돋게 미리보기 👀" ✅

## result_format 결정 기준
아이디어의 본질을 파악해서 유저가 진짜 보고 싶은 결과 형식을 결정해:
- **"image_focus"**: 외모/얼굴/동물/캐릭터 등 **시각적 결과**가 핵심 (예: 미래 남편 얼굴, 전생 모습)
- **"percentage"**: 확률/수치 (예: 불륜 지수, 금수저 확률, 인싸력)
- **"score"**: 점수+유형 분류 (예: 연애 유형, 성격 테스트)
- **"ranking"**: 순위/등급 (예: 전생 신분, 이세계 직업)

## result_title 작성 규칙 (핵심!)
- 밈/커뮤니티 용어 필수 사용. 재미없는 한자어 조합 금지.
- 좋은 예시: "안심 ZONE 지박령 😇", "스멀스멀 불륜의 향기 👃", "전신을 휘감은 불륜의 향기 🔥", "일편단심 순애보 💕"
- 나쁜 예시: "듬직한 리더형 남편 🤵‍♂️", "다정한 감성파 남편", "강인한 리더형" ← 이런 거 절대 금지!
- 각 결과가 단톡방에 공유됐을 때 "ㅋㅋㅋㅋ 이거 봐" 반응이 나올 정도로 웃기거나 자극적이어야 함

## result_label 작성 규칙
result_format에 따라:
- image_focus: 핵심 키워드 밈으로 (예: "지박령", "플래그 만렙")
- percentage: "87%", "12%" 등 확률값
- score: "95점", "72점" 등 점수
- ranking: "SSS급", "F급", "전설" 등 게임스러운 등급

## result_description 작성 규칙 (중요!)
- 1~2줄로 짧고 임팩트 있게. 장문 설명 금지.
- 친구한테 결과 알려주는 말투: "ㄹㅇ 이 사람 옆에 있으면 딴 생각 할 겨를이 없음ㅋㅋ"
- 공감 + 웃음 + 약간의 자극이 핵심
- 올드한 운세 톤 절대 금지: "뚜렷한 이목구비와 강인한 턱선을 가진" ← 이런 거 NO

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
      "result_title": "밈/유행어 기반 유형 제목 (이모지 포함)",
      "result_description": "1~2줄. MZ 말투. 캡쳐 각 나오게.",
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

    const hasReferenceImage = !!referenceImage

    const imageGuideSystemPrompt = `너는 한국 10대~20대 타겟 바이럴 테스트 전문 아트 디렉터야. 에브리타임/인스타 테스트에서 공유되는 이미지 스타일을 잘 알아.

## 역할
1. 전체 비주얼 톤 & 스타일 가이드 작성
2. 썸네일 이미지 프롬프트 작성
3. 10개 결과별 이미지 프롬프트 작성

## 기본 스타일 (레퍼런스 이미지가 없을 때 필수!)
${hasReferenceImage ? '⚠️ 사용자가 레퍼런스 이미지를 첨부했으므로, 레퍼런스 스타일을 따르는 프롬프트를 작성해. 아래 기본 스타일은 무시해도 됨.' : `**B급 병맛 / 한국 커뮤니티 밈 스타일 필수!**
- 심플한 흰색 blob 캐릭터 또는 졸라맨 스타일 (두꺼운 검정 아웃라인, 최소한의 디테일)
- 과장된 웃긴 표정 (놀람, 당황, 찡긋, 혀 내밀기 등)
- 파스텔 또는 단색 배경 (분홍, 하늘색, 흰색)
- 의도적으로 허접하고 귀여운 그림체 — 한국 인터넷 테스트 밈 느낌
- 절대 금지: 세련된 일러스트, 리얼리스틱, 정교한 디테일, 예쁜 애니 캐릭터
- 참고: 한국 바이럴 테스트 이미지들 (졸라맨, 흰 동글이 캐릭터, 만두 캐릭터 등)`}

## 이미지 프롬프트 작성 규칙
- 영어로 작성 (Gemini Image 모델용)
- 구체적이고 시각적으로 묘사 (추상적 표현 금지)
- 테스트의 result_format에 따라 이미지 성격이 달라야 함:
  - image_focus: 결과의 주인공(캐릭터)이 중심. 각 유형별로 표정/행동/소품이 확실히 다르게.
  - percentage/score/ranking: 유형의 성격을 상징하는 캐릭터 행동. 표정과 포즈로 차별화.
- 모든 이미지에 텍스트 포함 금지 (No text, no Korean text, no letters)
- 스타일 통일: 같은 테스트의 모든 이미지는 같은 캐릭터/화풍

## 썸네일 프롬프트
- 테스트의 핵심 호기심을 한 장에 담아
- 정사각형(1:1), 작은 사이즈에서도 식별 가능
- 밈 느낌이 나도록

## 결과 이미지 프롬프트
- 세로형(3:4), 결과 카드에 들어갈 메인 비주얼
- 10장 각각 확실히 다른 비주얼 (캐릭터 표정/행동/소품/배경색으로 구분)
- result_title의 감정/상황을 캐릭터 행동으로 시각화

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
      body: JSON.stringify({
        testId,
        ...(referenceImage && { referenceImage }),
      }),
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
