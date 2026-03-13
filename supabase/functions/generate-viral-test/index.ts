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
const SIPSUNG_TYPES = ['비견', '겁재', '식신', '상관', '편재', '정재', '편관', '정관', '편인', '정인'] as const

// ─── Gemini 호출 헬퍼 ────────────────────────────────────────────
async function callGemini(systemPrompt: string, userPrompt: string): Promise<string> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${GEMINI_API_KEY}`
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: userPrompt }] }],
      systemInstruction: { parts: [{ text: systemPrompt }] },
      generationConfig: { temperature: 0.9, maxOutputTokens: 12000, responseMimeType: 'application/json', thinkingConfig: { thinkingBudget: 2048 } },
    }),
  })
  if (!res.ok) {
    const errText = await res.text()
    throw new Error(`Gemini API 오류 ${res.status}: ${errText.slice(0, 200)}`)
  }
  const data = await res.json()
  // Gemini 2.5 Flash thinking 모델: thought part 제외, 실제 응답 part만 추출
  const parts = data.candidates?.[0]?.content?.parts || []
  const raw = parts.filter((p: { text?: string; thought?: boolean }) => p.text && !p.thought).pop()?.text
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
    const { idea, creatorId, hasReferenceImage, testId: existingTestId, category } = await req.json()
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

    // ─── 공통 톤앤매너 ─────────────────────────────────────────
    const COMMON_TONE = `## 톤앤매너 (초중요! 반드시 지켜!)
- **MZ세대/알파세대 말투**: 딱딱하고 올드한 설명 금지. 커뮤니티에서 쓰는 말투로.
- **밈/유행어 적극 활용**: "지박령", "빌런", "갓생", "럭키비키", "어쩔티비", "ZONE", "플래그", "레드플래그", "그린플래그" 등
- **자극적이고 웃긴 표현**: "소름돋는 현실 고증", "ㅋㅋ 소름", "ㄹㅇ 찐", "개웃김", "미쳤다"
- **과장과 드라마**: 평범한 결과도 드라마틱하게 포장. 결과 하나하나가 캡쳐 각이 나와야 함
- 절대 금지: "~한 타입이에요", "~을 가진 분이시네요", "~한 매력을 풍깁니다" 같은 올드한 운세 말투

## 후킹 제목 작성 비법
- **호기심 갭**: "___가 ___라는 거 실화?" — 바로 클릭하게
- **숫자로 구체화**: "상위 3%만", "100명 중 1명"
- **감정 폭발**: "소름돋는", "충격", "난리남", "미쳤다"
- **반말 OK, 단 "너/니" 직접 지칭은 쓰지 마**: 어색하고 부담스러움. 지칭 없이 자연스럽게.
- 금지 예시: "바람기 테스트" ❌ → "불륜 지수 측정기 🔥" ✅
- 금지: "니 전생", "너 바람기" 등 2인칭 직접 호출

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
- 각 결과가 캡쳐됐을 때 "ㅋㅋㅋㅋ 이거 봐" 반응이 나올 정도로 웃기거나 자극적이어야 함

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
"운세", "사주", "팔자", "천간", "일간", "십성", "비견", "겁재" 등 전통 용어 노출 금지. 내면적으로 사주 특성을 반영하되 자연스러운 성격/유형/관계로 포장.`

    // ─── 일반 테스트 (slot_machine / adult) 프롬프트 ──────────
    const normalPlanningPrompt = `너는 10대~20대 타겟 SNS 바이럴 테스트 기획자야. 에브리타임, 인스타, 틱톡에서 폭발적으로 공유되는 콘텐츠만 만들어.

## 핵심 역할
사용자의 아이디어를 SNS에서 폭발적으로 공유되는 바이럴 테스트로 바꿔.

${COMMON_TONE}

## 응답 JSON
{
  "template_type": "slot_machine" | "compatibility" | "adult",
  "title": "후킹 제목 (20자 이내)",
  "description": "테스트 한줄 설명 (40자 이내, 공유/단톡방 언급 금지, 테스트 내용 자체를 호기심 유발하게)",
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

    // ─── 궁합 테스트 (compatibility) 프롬프트 ─────────────────
    const compatibilityPlanningPrompt = `너는 10대~20대 타겟 SNS 바이럴 궁합 테스트 기획자야. 에브리타임, 인스타, 틱톡에서 폭발적으로 공유되는 궁합 콘텐츠만 만들어.

## 핵심 역할
사용자의 아이디어를 SNS에서 폭발적으로 공유되는 "두 사람 궁합 테스트"로 바꿔.
테스트 참여자는 본인 생년월일 + 상대방 생년월일을 입력하면 결과가 나옴.

## 궁합 테스트 특화 규칙
- 결과는 "두 사람의 관계"를 묘사해야 함 (한 사람만의 특성 X)
- **비대칭 관계**: A→B 결과와 B→A 결과가 다를 수 있음. "나한텐 네가 ○○인데, 너한텐 내가 △△래ㅋㅋ" = 공유 욕구 폭발
- 10가지 관계 유형 각각에 재미있는 이름을 붙여

## 10가지 관계 유형 (내부 키)
관계 유형은 두 사람의 에너지 궁합으로 결정됨 (사주 용어 노출 금지!):
1. **비견**: 완전 동질 — 같은 에너지끼리 만남 (동지 but 양보 없음)
2. **겁재**: 끌리는데 경쟁 — 밀당의 끝판왕, 치고박고 (경계 관계)
3. **식신**: 편안한 힐링 — 같이 있으면 스트레스 해소 (나태 주의)
4. **상관**: 자극+도전 — 서로 성장시키지만 말로 상처도 (독설 주의)
5. **편재**: 넓은 세계 — 같이 다니면 인맥 확장 (산만+바람기 주의)
6. **정재**: 안정+신뢰 — 믿고 의지하는 관계 (지루할 수 있음)
7. **편관**: 카리스마+압박 — 위축되지만 존경 (스트레스 주의)
8. **정관**: 멘토+존경 — 바른길 안내자 (부담+눈치)
9. **편인**: 신비+독특 — 예측불가 케어 (집착 주의)
10. **정인**: 무한 서포트 — 무조건 내 편 (과보호+잔소리)

## 점수 분포 (중요! 좋은 것만 나오면 재미없음)
- 좋은 관계 (80~95점): 3~4개 (정재, 정인, 식신 등)
- 보통 관계 (50~70점): 3~4개 (비견, 상관 등)
- 안 좋은 관계 (15~45점): 2~3개 (겁재, 편관 등)
- 안 좋은 결과도 웃기게! "최악이지만 캡쳐각" 이 핵심

${COMMON_TONE}

## 응답 JSON
{
  "template_type": "compatibility",
  "title": "후킹 제목 (20자 이내)",
  "description": "테스트 한줄 설명 (40자 이내, 공유/단톡방 언급 금지, 테스트 내용 자체를 호기심 유발하게)",
  "is_adult": false,
  "result_format": "score" | "percentage" | "image_focus" | "ranking",
  "results": [
    {
      "relation_type": "비견",
      "result_title": "밈/유행어 기반 관계 유형 제목 (이모지 포함)",
      "result_description": "1~2줄. 두 사람 관계 묘사. MZ 말투. 캡쳐 각.",
      "score": 85,
      "result_label": "result_format에 맞는 라벨"
    }
  ]
}

results는 반드시 10개 (비견,겁재,식신,상관,편재,정재,편관,정관,편인,정인). score는 15~95 골고루. 같은 점수 없이.`

    // ─── 1차 기획: 카테고리가 지정되면 바로 해당 프롬프트 사용 ─────
    let plan: PlanResult
    let isCompatibility: boolean

    if (category === 'compatibility') {
      // 궁합 카테고리 지정 → 바로 궁합 프롬프트 사용 (1회 호출)
      console.log('💑 [Step 1] 궁합 카테고리 지정 → 십성 기반 기획')
      const compatRaw = await callGemini(
        compatibilityPlanningPrompt,
        `다음 아이디어로 바이럴 궁합 테스트를 기획해:\n\n"${idea}"`
      )
      plan = parseJSON<PlanResult>(compatRaw)
      plan.template_type = 'compatibility'
      isCompatibility = true
    } else if (category === 'adult') {
      // 19금 카테고리 지정 → 일반 프롬프트 + is_adult 강제
      console.log('🔞 [Step 1] 19금 카테고리 지정')
      const adultRaw = await callGemini(
        normalPlanningPrompt,
        `다음 아이디어로 바이럴 19금 성인 테스트를 기획해. 반드시 is_adult: true로 설정하고, 성인 대상의 자극적이면서도 유머러스한 소재로:\n\n"${idea}"`
      )
      plan = parseJSON<PlanResult>(adultRaw)
      plan.is_adult = true
      plan.template_type = 'adult'
      isCompatibility = false
    } else if (category === 'slot_machine') {
      // 운테 카테고리 지정 → 일반 프롬프트, 궁합 제외
      console.log('🎰 [Step 1] 운테 카테고리 지정')
      const slotRaw = await callGemini(
        normalPlanningPrompt,
        `다음 아이디어로 바이럴 테스트를 기획해. 반드시 template_type은 "slot_machine"으로 (궁합 아님, 본인 사주만 입력):\n\n"${idea}"`
      )
      plan = parseJSON<PlanResult>(slotRaw)
      plan.template_type = 'slot_machine'
      isCompatibility = false
    } else {
      // 카테고리 미지정 (전체) → 기존 로직: AI가 자동 판별
      const firstPassRaw = await callGemini(
        normalPlanningPrompt,
        `다음 아이디어로 바이럴 테스트를 기획해:\n\n"${idea}"`
      )
      const firstPass = parseJSON<PlanResult>(firstPassRaw)
      isCompatibility = firstPass.template_type === 'compatibility'

      if (isCompatibility) {
        console.log('💑 [Step 1] 궁합 테스트 감지 → 십성 기반 재기획')
        const compatRaw = await callGemini(
          compatibilityPlanningPrompt,
          `다음 아이디어로 바이럴 궁합 테스트를 기획해:\n\n"${idea}"`
        )
        plan = parseJSON<PlanResult>(compatRaw)
        plan.template_type = 'compatibility'
      } else {
        plan = firstPass
      }
    }
    console.log('📦 [Step 1] 기획 결과:', JSON.stringify(plan).slice(0, 300))

    interface PlanResult {
      template_type: string
      title: string
      description: string
      is_adult: boolean
      result_format: string
      results: Array<{
        day_master?: string
        relation_type?: string
        result_title: string
        result_description: string
        score: number
        result_label: string
      }>
    }

    // 누락된 결과 보충
    if (isCompatibility) {
      // 궁합: 십성 10개 보충
      const existingRT = plan.results.map(r => r.relation_type)
      for (const st of SIPSUNG_TYPES) {
        if (!existingRT.includes(st)) {
          plan.results.push({
            relation_type: st,
            result_title: `${st} 유형`,
            result_description: '곧 업데이트될 예정이에요!',
            score: Math.floor(Math.random() * 80) + 15,
            result_label: plan.result_format === 'percentage' ? `${Math.floor(Math.random() * 80) + 15}%` : `${Math.floor(Math.random() * 80) + 15}점`,
          })
        }
      }
    } else {
      // 일반: 일간 10개 보충
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
    }

    // ═══════════════════════════════════════════════════════════════
    // STEP 2: 이미지 가이드 에이전트
    // ═══════════════════════════════════════════════════════════════
    console.log('🎨 [Step 2] 이미지 가이드 에이전트 시작')

    const hasRef = !!hasReferenceImage

    // 궁합 vs 일반: result_prompts 키 예시가 다름
    const resultPromptKeys = isCompatibility
      ? `"비견": "...", "겁재": "...", "식신": "...", "상관": "...", "편재": "...", "정재": "...", "편관": "...", "정관": "...", "편인": "...", "정인": "..."`
      : `"갑": "...", "을": "...", "병": "...", "정": "...", "무": "...", "기": "...", "경": "...", "신": "...", "임": "...", "계": "..."`

    const imageGuideSystemPrompt = hasRef
    ? `너는 바이럴 테스트 이미지 프롬프트 작성자야.
사용자가 레퍼런스 이미지를 첨부했다. 이미지 생성 모델이 레퍼런스에서 주체(사람/동물/캐릭터 등)와 화풍을 직접 파악한다.
너는 레퍼런스에 뭐가 그려져 있는지 모르므로, 주체를 특정하지 마.

## 너의 역할
각 프롬프트에 **상황, 감정, 행동, 소품**만 영어로 작성해. 주체가 뭔지는 레퍼런스 이미지가 결정한다.
${isCompatibility ? '\n## 궁합 테스트 특화\n이미지는 "두 캐릭터의 관계/상호작용"을 표현해야 함. 한 캐릭터만 나오면 안 됨.\n각 관계 유형별로 두 캐릭터 사이의 감정/거리감/상호작용이 확실히 달라야 함.\n' : ''}
## 프롬프트 작성 규칙 (매우 중요!)
- 영어로 작성
- **"A person", "A man", "A woman", "A character" 등 주체를 지정하는 단어 절대 금지!**
- 대신 주어 없이 행동/감정/상황으로 시작: "Gazing at a poster with a lovesick expression, hand to cheek" / "Standing confidently with arms crossed, smug grin"
- 또는 "The subject"로 시작: "The subject looking shocked while holding a phone"
- 스타일/화풍/톤/색감 관련 지시어 금지 (illustration, cartoon, anime, pastel, realistic 등 모두 금지)
- 각 프롬프트에 구체적인 감정 키워드 필수 포함 (exhausted, shocked, smug, panicked, lovestruck 등)
- 10장의 가장 큰 차이는 감정/표정/행동이어야 함
- 모든 이미지에 텍스트 포함 금지 (No text, no Korean text, no letters)

## 썸네일 프롬프트
- 테스트의 핵심 호기심을 한 장에 담아
- 정사각형(1:1)

## 결과 이미지 프롬프트
- 세로형(3:4)
- 10장 각각 확실히 다른 감정/상황
- result_title의 감정/상황을 행동과 표정으로 시각화

## 응답 JSON
{
  "style_guide": "The image generation model will infer the style directly from the provided reference image.",
  "thumbnail_prompt": "영어 — 주체 지정 금지, 상황/감정만",
  "result_prompts": {
    ${resultPromptKeys}
  }
}`
    : `너는 한국 10대~20대 타겟 바이럴 테스트 전문 아트 디렉터야. 에브리타임/인스타 테스트에서 공유되는 이미지 스타일을 잘 알아.

## 역할
1. 전체 비주얼 톤 & 스타일 가이드 작성
2. 썸네일 이미지 프롬프트 작성
3. 10개 결과별 이미지 프롬프트 작성

## 기본 스타일
**B급 병맛 / 한국 커뮤니티 밈 스타일 필수!**
- 심플한 흰색 blob 캐릭터 또는 졸라맨 스타일 (두꺼운 검정 아웃라인, 최소한의 디테일)
- 과장된 웃긴 표정 (놀람, 당황, 찡긋, 혀 내밀기 등)
- 파스텔 또는 단색 배경 (분홍, 하늘색, 흰색)
- 의도적으로 허접하고 귀여운 그림체 — 한국 인터넷 테스트 밈 느낌
- 절대 금지: 세련된 일러스트, 리얼리스틱, 정교한 디테일, 예쁜 애니 캐릭터
- 참고: 한국 바이럴 테스트 이미지들 (졸라맨, 흰 동글이 캐릭터, 만두 캐릭터 등)
${isCompatibility ? '\n## 궁합 테스트 특화\n이미지에는 반드시 "두 캐릭터"가 등장해야 함. 두 캐릭터 사이의 관계/상호작용을 표현.\n각 관계 유형별로 두 캐릭터의 감정/거리감/포즈가 확실히 달라야 함.\n예: 찐친=어깨동무, 밀당=한쪽이 도망, 압박=한쪽이 작아짐\n' : ''}
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
    ${resultPromptKeys}
  }
}`

    const planSummary = JSON.stringify({
      title: plan.title,
      description: plan.description,
      result_format: plan.result_format,
      results: plan.results.slice(0, 10).map(r => ({
        ...(isCompatibility ? { relation_type: r.relation_type } : { day_master: r.day_master }),
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
    const resultsToInsert = plan.results.slice(0, 10).map(r => {
      const key = isCompatibility ? r.relation_type! : r.day_master!
      return {
        test_id: testId,
        day_master: isCompatibility ? null : r.day_master,
        relation_type: isCompatibility ? r.relation_type : null,
        element: isCompatibility ? null : (DAY_MASTER_ELEMENT[r.day_master!] || '토'),
        result_title: r.result_title,
        result_description: r.result_description,
        score: Math.max(15, Math.min(95, r.score || 50)),
        result_label: r.result_label || null,
        image_prompt: guide.result_prompts?.[key] || null,
      }
    })

    const { error: resultsError } = await supabase
      .from('viral_test_results')
      .insert(resultsToInsert)

    if (resultsError) {
      console.error('❌ viral_test_results INSERT 실패:', resultsError)
      throw new Error('결과 저장에 실패했습니다.')
    }

    console.log('✅ [Step 1+2] 기획+가이드 완료:', testId, plan.title)

    // 이미지 생성은 프론트에서 명시적으로 호출 (자동 생성 제거)

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
