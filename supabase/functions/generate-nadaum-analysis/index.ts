import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import {
  getCorsHeaders,
  handleCorsPreflightRequest,
  jsonResponse,
  errorResponse,
} from '../server/cors.ts'

/**
 * 나다움 분석 생성 Edge Function
 *
 * 사용자의 성향 태그 + 사주 정보를 기반으로 카테고리별 분석을 AI로 생성
 * 결과는 nadaum_analyses 테이블에 캐싱 (user_id + category UNIQUE)
 *
 * POST body: { category: 'love' | 'nature' | 'money' | 'career' | 'health' }
 * Response: { success: true, analysis: { category, analysis_text, tag_count } }
 */

// ─── Category 설정 ────────────────────────────────────────────────

interface CategoryConfig {
  title: string
  prompt: string
  minTags: number
}

const CATEGORIES: Record<string, CategoryConfig> = {
  love: {
    title: '연애·궁합 분석',
    minTags: 5,
    prompt: `## 역할
당신은 명리학과 성격 심리학에 정통한 연애 상담 전문가입니다.

## 지시 사항
사용자의 사주 정보와 성향 태그를 종합하여 연애·궁합 분석을 작성하세요.

## 분석 항목 (아래 순서대로 작성)
1. **연애 성향** - 사주와 태그에서 드러나는 연애 스타일 (2~3문장)
2. **이상형 분석** - 사주 오행 균형과 태그 기반 어울리는 상대 유형 (2~3문장)
3. **연애 강점** - 관계에서 빛나는 점 (2~3문장)
4. **연애 주의점** - 관계에서 조심할 점 (2~3문장)
5. **궁합 포인트** - 잘 맞는 사주/성향 조합 힌트 (2~3문장)

## 형식
- 각 항목을 **제목**과 본문으로 구분
- 친근하고 따뜻한 말투 (반말 OK)
- 순수 텍스트만, 마크다운 서식 금지
- 전체 800~1200자`,
  },
  nature: {
    title: '기질·성격 분석',
    minTags: 5,
    prompt: `## 역할
당신은 명리학과 성격 유형론에 정통한 기질 분석 전문가입니다.

## 지시 사항
사용자의 사주 정보와 성향 태그를 종합하여 기질·성격 심층 분석을 작성하세요.

## 분석 항목
1. **핵심 기질** - 사주 오행에서 드러나는 타고난 기질 (2~3문장)
2. **성격 강점 TOP 3** - 태그에서 가장 두드러지는 강점 (각 1~2문장)
3. **성격 보완점** - 부정 태그에서 보이는 조심할 점 (2~3문장)
4. **대인관계 스타일** - 사람들과의 관계 패턴 (2~3문장)
5. **성장 포인트** - 더 나은 나를 위한 조언 (2~3문장)

## 형식
- 각 항목을 **제목**과 본문으로 구분
- 친근하고 따뜻한 말투
- 순수 텍스트만, 마크다운 서식 금지
- 전체 800~1200자`,
  },
  money: {
    title: '재물·금전 분석',
    minTags: 8,
    prompt: `## 역할
당신은 명리학 재물운 분석과 금전 심리 전문가입니다.

## 지시 사항
사용자의 사주 정보와 성향 태그를 종합하여 재물·금전 분석을 작성하세요.

## 분석 항목
1. **재물 성향** - 사주에서 보이는 돈과의 관계 패턴 (2~3문장)
2. **수입 스타일** - 돈을 버는 방식과 강점 (2~3문장)
3. **소비 패턴** - 태그에서 보이는 소비 성향 (2~3문장)
4. **재테크 적성** - 어울리는 재테크/투자 스타일 (2~3문장)
5. **금전 조언** - 재물운을 높이기 위한 실질적 팁 (2~3문장)

## 형식
- 각 항목을 **제목**과 본문으로 구분
- 친근하고 따뜻한 말투
- 순수 텍스트만, 마크다운 서식 금지
- 전체 800~1200자`,
  },
  career: {
    title: '직업·적성 분석',
    minTags: 12,
    prompt: `## 역할
당신은 명리학 적성 분석과 커리어 코칭 전문가입니다.

## 지시 사항
사용자의 사주 정보와 성향 태그를 종합하여 직업·적성 분석을 작성하세요.

## 분석 항목
1. **업무 스타일** - 사주와 태그에서 보이는 일하는 방식 (2~3문장)
2. **적성 분야 TOP 3** - 어울리는 직업/분야 구체적 제시 (각 1~2문장)
3. **직장 내 강점** - 동료/상사에게 인정받는 포인트 (2~3문장)
4. **커리어 주의점** - 직장에서 조심할 점 (2~3문장)
5. **성장 전략** - 커리어 발전을 위한 구체적 조언 (2~3문장)

## 형식
- 각 항목을 **제목**과 본문으로 구분
- 친근하고 따뜻한 말투
- 순수 텍스트만, 마크다운 서식 금지
- 전체 800~1200자`,
  },
  health: {
    title: '건강·체질 분석',
    minTags: 15,
    prompt: `## 역할
당신은 명리학 오행 체질 분석과 건강 관리 전문가입니다.

## 지시 사항
사용자의 사주 정보와 성향 태그를 종합하여 건강·체질 분석을 작성하세요.

## 분석 항목
1. **오행 체질** - 사주 오행 분포에서 보이는 체질 특성 (2~3문장)
2. **강한 부분** - 건강하게 유지되는 영역 (2~3문장)
3. **주의 부분** - 신경 써야 할 건강 영역 (2~3문장)
4. **스트레스 패턴** - 태그에서 보이는 스트레스 해소 방식 (2~3문장)
5. **건강 관리 팁** - 체질에 맞는 실질적 건강 관리법 (2~3문장)

## 형식
- 각 항목을 **제목**과 본문으로 구분
- 친근하고 따뜻한 말투
- 순수 텍스트만, 마크다운 서식 금지
- 전체 800~1200자
- 의학적 진단이 아닌 명리학 기반 참고 정보임을 명시`,
  },
}

serve(async (req) => {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    return handleCorsPreflightRequest(req)
  }

  try {
    // ─── 인증 확인 ────────────────────────────────────────────
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return errorResponse(req, '인증이 필요합니다.', 401)
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // 유저 확인
    const supabaseAnon = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: authHeader } },
    })
    const { data: { user }, error: authError } = await supabaseAnon.auth.getUser()
    if (authError || !user) {
      return errorResponse(req, '인증이 유효하지 않습니다.', 401)
    }

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('🚀 [generate-nadaum-analysis] 시작')
    console.log('📥 user_id:', user.id)

    // ─── 요청 파싱 ────────────────────────────────────────────
    const { category, forceRefresh } = await req.json()

    if (!category || !CATEGORIES[category]) {
      return errorResponse(req, '유효하지 않은 카테고리입니다.', 400)
    }

    const config = CATEGORIES[category]
    console.log('📋 카테고리:', category, '(' + config.title + ')')

    // ─── 캐시 확인 (forceRefresh가 아니면) ─────────────────────
    if (!forceRefresh) {
      const { data: cached } = await supabase
        .from('nadaum_analyses')
        .select('*')
        .eq('user_id', user.id)
        .eq('category', category)
        .single()

      if (cached) {
        console.log('✅ 캐시 히트 (tag_count:', cached.tag_count, ')')

        // 태그 수가 크게 변했으면 재생성 (10개 이상 차이)
        const { count: currentTagCount } = await supabase
          .from('user_trait_tags')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .eq('is_confirmed', true)

        if (currentTagCount && Math.abs(currentTagCount - cached.tag_count) < 10) {
          return jsonResponse(req, {
            success: true,
            analysis: {
              category: cached.category,
              analysis_text: cached.analysis_text,
              tag_count: cached.tag_count,
              created_at: cached.created_at,
              is_cached: true,
            },
          })
        }
        console.log('⚠️ 태그 수 변화 감지, 재생성 (이전:', cached.tag_count, '현재:', currentTagCount, ')')
      }
    }

    // ─── 사용자 데이터 조회 (병렬) ────────────────────────────
    const [tagsResult, sajuResult, summaryResult] = await Promise.all([
      supabase
        .from('user_trait_tags')
        .select('tag_name, tag_type')
        .eq('user_id', user.id)
        .eq('is_confirmed', true),
      supabase
        .from('saju_records')
        .select('full_name, gender, birth_date, birth_time, calendar_type, zodiac')
        .eq('user_id', user.id)
        .eq('is_primary', true)
        .single(),
      supabase
        .from('user_situation_summaries')
        .select('situation_summary')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(3),
    ])

    const tags = tagsResult.data || []
    const saju = sajuResult.data
    const summaries = summaryResult.data || []

    console.log('📊 태그:', tags.length, '개 | 사주:', saju ? '있음' : '없음', '| 요약:', summaries.length, '개')

    // 최소 태그 수 확인
    if (tags.length < config.minTags) {
      return errorResponse(req, `태그가 ${config.minTags}개 이상 필요합니다. (현재 ${tags.length}개)`, 400)
    }

    // ─── 태그 정리 ────────────────────────────────────────────
    const positiveTags = tags.filter(t => t.tag_type === 'positive').map(t => t.tag_name)
    const negativeTags = tags.filter(t => t.tag_type === 'negative').map(t => t.tag_name)
    const neutralTags = tags.filter(t => t.tag_type === 'neutral').map(t => t.tag_name)

    // 빈도 기반 상위 태그 추출
    const getTopTags = (tagList: string[], limit: number) => {
      const freq = new Map<string, number>()
      for (const t of tagList) freq.set(t, (freq.get(t) || 0) + 1)
      return [...freq.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, limit)
        .map(([name, count]) => `${name}(${count}회)`)
    }

    const topPositive = getTopTags(positiveTags, 8)
    const topNegative = getTopTags(negativeTags, 5)

    // ─── 사주 정보 텍스트 ─────────────────────────────────────
    let sajuInfo = '사주 정보 없음'
    if (saju) {
      const d = new Date(saju.birth_date)
      const cal = saju.calendar_type === 'lunar' ? '음력' : '양력'
      const gen = saju.gender === 'male' ? '남성' : '여성'
      sajuInfo = `이름: ${saju.full_name}, 성별: ${gen}, 생년월일: ${cal} ${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일, 태어난 시간: ${saju.birth_time || '모름'}, 띠: ${saju.zodiac || '모름'}`
    }

    // ─── 상황 요약 ────────────────────────────────────────────
    const situationText = summaries.length > 0
      ? summaries.map(s => s.situation_summary).join('\n')
      : '최근 상황 정보 없음'

    // ─── AI 프롬프트 구성 ──────────────────────────────────────
    const fullPrompt = `${config.prompt}

## 사주 정보
${sajuInfo}

## 성향 태그 (긍정)
${topPositive.join(', ') || '없음'}

## 성향 태그 (보완점)
${topNegative.join(', ') || '없음'}

## 최근 관심사/상황
${situationText}

## 주의사항
- 사용자 이름은 언급하지 마세요
- "당신은" 대신 "너는" 같은 친근한 표현 사용
- 구체적이고 실질적인 분석을 제공하세요
- 긍정적이되 현실적인 톤 유지
- 각 항목 제목은 대괄호로 감싸세요: [제목]`

    console.log('🤖 AI 호출 시작...')

    // ─── OpenAI 호출 ──────────────────────────────────────────
    const apiKey = Deno.env.get('OPENAI_API_KEY')
    if (!apiKey) {
      return errorResponse(req, 'AI 서비스 설정 오류', 500)
    }

    const aiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4.1-mini',
        messages: [{ role: 'user', content: fullPrompt }],
        temperature: 0.7,
        max_tokens: 2000,
      }),
    })

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text()
      console.error('❌ OpenAI API 오류:', aiResponse.status, errorText)
      return errorResponse(req, 'AI 분석 생성에 실패했습니다.', 500)
    }

    const aiData = await aiResponse.json()
    const analysisText = aiData.choices?.[0]?.message?.content?.trim()

    if (!analysisText) {
      console.error('❌ AI 응답 비어있음')
      return errorResponse(req, 'AI 분석 결과가 비어있습니다.', 500)
    }

    console.log('✅ AI 생성 완료 (길이:', analysisText.length, '자)')

    // ─── DB 저장 (upsert) ──────────────────────────────────────
    const { error: upsertError } = await supabase
      .from('nadaum_analyses')
      .upsert(
        {
          user_id: user.id,
          category,
          analysis_text: analysisText,
          tag_count: tags.length,
          model_used: 'gpt-4.1-mini',
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id,category' }
      )

    if (upsertError) {
      console.error('❌ DB 저장 실패:', upsertError)
      // 저장 실패해도 결과는 반환 (Graceful Degradation)
    } else {
      console.log('✅ DB 저장 성공')
    }

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')

    return jsonResponse(req, {
      success: true,
      analysis: {
        category,
        analysis_text: analysisText,
        tag_count: tags.length,
        created_at: new Date().toISOString(),
        is_cached: false,
      },
    })
  } catch (error) {
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.error('❌ [generate-nadaum-analysis] 오류:', error)
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')

    return errorResponse(
      req,
      error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.',
      500
    )
  }
})
