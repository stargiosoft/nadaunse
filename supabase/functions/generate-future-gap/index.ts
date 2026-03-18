import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import {
  getCorsHeaders,
  handleCorsPreflightRequest,
  jsonResponse,
  errorResponse,
} from '../server/cors.ts'
import { buildOptimizedSajuPrompt } from '../server/sajuKnowledgeMap.ts'

// 미래예측기 카테고리 → sajuKnowledgeMap 카테고리 매핑
const CATEGORY_MAP: Record<string, string> = {
  '연애': '연애',
  '재물': '재물',
  '학업': '시험/학업',
  '직장': '직업',
}

/**
 * 미래 간극 분석 Edge Function
 *
 * 성격 기반 예측 vs 사주 기반 예측 간극 분석
 *
 * POST body: {
 *   prediction_result: { category, attitude, ontology, spectrum, debate },
 *   saju_info: { gender, birthDate, birthTime, calendarType }
 * }
 */

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return handleCorsPreflightRequest(req)
  }

  try {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('🔮 [generate-future-gap] 시작')

    // ─── 요청 파싱 ──────────────────────────────────────────────
    const { prediction_result, saju_info } = await req.json()

    if (!prediction_result || !saju_info) {
      return errorResponse(req, '예측 결과와 사주 정보가 필요합니다.', 400)
    }

    const { gender, birthDate, birthTime, calendarType } = saju_info
    if (!gender || !birthDate) {
      return errorResponse(req, '성별과 생년월일은 필수입니다.', 400)
    }

    console.log('📋 카테고리:', prediction_result.category)
    console.log('📅 생년월일:', birthDate, '성별:', gender)

    // ─── 사주 API 호출 ──────────────────────────────────────────
    let sajuData: Record<string, unknown> | null = null

    try {
      const sajuApiKey = Deno.env.get('SAJU_API_KEY')?.trim()

      if (sajuApiKey) {
        const dateOnly = birthDate.replace(/-/g, '')
        const timeOnly = birthTime ? birthTime.replace(/:/g, '').substring(0, 4) : '1200'
        const birthday = dateOnly + timeOnly

        const lunar = calendarType === 'lunar' ? 'true' : 'false'
        const sajuApiUrl = `https://service.stargio.co.kr:8400/StargioSaju?birthday=${birthday}&lunar=${lunar}&gender=${gender}&apiKey=${sajuApiKey}`
        console.log('📞 사주 API 호출:', sajuApiUrl.replace(sajuApiKey, '***'))

        for (let attempt = 1; attempt <= 3; attempt++) {
          try {
            const sajuResponse = await fetch(sajuApiUrl, {
              method: 'GET',
              headers: {
                'Accept': 'application/json, text/plain, */*',
                'Accept-Encoding': 'gzip, deflate, br',
                'Accept-Language': 'ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7',
                'Cache-Control': 'no-cache',
                'Connection': 'keep-alive',
                'Host': 'service.stargio.co.kr:8400',
                'Origin': 'https://nadaunse.com',
                'Referer': 'https://nadaunse.com/',
                'Sec-Fetch-Dest': 'empty',
                'Sec-Fetch-Mode': 'cors',
                'Sec-Fetch-Site': 'cross-site',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
              },
            })

            if (!sajuResponse.ok) throw new Error(`HTTP ${sajuResponse.status}`)

            const rawText = await sajuResponse.text()
            sajuData = JSON.parse(rawText)

            if (sajuData && Object.keys(sajuData).length > 0) {
              console.log('✅ 사주 API 성공 (키:', Object.keys(sajuData).length, ')')
              break
            }
            throw new Error('빈 데이터')
          } catch (e) {
            console.error(`❌ 사주 API 시도 ${attempt}/3 실패:`, e)
            if (attempt < 3) await new Promise(r => setTimeout(r, 1000 * attempt))
          }
        }
      }
    } catch (e) {
      console.error('❌ 사주 API 처리 오류:', e)
    }

    // ─── AI 프롬프트 구성 ───────────────────────────────────────
    const genderText = gender === 'male' ? '남성' : '여성'
    const calText = calendarType === 'lunar' ? '음력' : '양력'
    const timeText = birthTime || '모름'

    // 사주 데이터 최적화 (sajuKnowledgeMap 활용)
    const sajuCategory = CATEGORY_MAP[prediction_result.category] || '개인운세'
    const optimizedSajuPrompt = sajuData
      ? buildOptimizedSajuPrompt(sajuData, sajuCategory, `${prediction_result.category} 미래 간극 분석`)
      : ''

    console.log('📊 사주 카테고리 매핑:', prediction_result.category, '→', sajuCategory)
    if (optimizedSajuPrompt) {
      console.log('✅ 최적화된 사주 프롬프트 (길이:', optimizedSajuPrompt.length, '자)')
    }

    const prompt = `## 역할
당신은 명리학 + HEXACO 성격심리학에 정통한 미래 간극 분석 AI입니다.
성격 기반 예측과 사주 기반 예측 사이의 "간극"을 분석합니다.

## 입력 데이터

### 성격 기반 예측 결과
- 카테고리: ${prediction_result.category}
- 태도 유형: ${prediction_result.attitude?.type} (점수: ${(prediction_result.attitude?.score * 100).toFixed(0)})
- 태도 설명: ${prediction_result.attitude?.description}
- 스펙트럼 위치: ${prediction_result.spectrum?.position} (${prediction_result.spectrum?.label})
- 스펙트럼 요약: ${prediction_result.spectrum?.summary}
- 에이전트 토론 결론: ${prediction_result.debate?.conclusion}

### 사주 정보
- 성별: ${genderText}
- 생년월일: ${calText} ${birthDate}
- 태어난 시간: ${timeText}
${optimizedSajuPrompt ? `\n${optimizedSajuPrompt}` : ''}

## 출력 형식 (반드시 아래 JSON으로만 출력)

\`\`\`json
{
  "gap_percentage": 78,
  "gap_type": "반전형",
  "personality_summary": "성격 기반으로 예측한 미래 요약 (2-3문장)",
  "saju_summary": "사주 기반으로 예측한 미래 요약 (2-3문장)",
  "gap_interpretation": "두 예측 사이의 간극에 대한 해석 (3-4문장, 구체적으로)",
  "hook_message": "사용자의 관심을 끄는 문제 심화 멘트 (1문장)",
  "risk_signals": [
    "이 사람에게 구체적으로 감지되는 위험 신호 1 (1문장, 카테고리 맞춤)",
    "위험 신호 2 (1문장)",
    "위험 신호 3 (1문장)"
  ],
  "peak_month": 8
}
\`\`\`

## 출력 규칙

### gap_percentage
- 0~100 사이의 정수
- 성격 예측과 사주 예측이 얼마나 다른 방향을 가리키는지를 나타냄
- 0: 완전 일치, 100: 완전 반대
- **35~65% 중간 구간 금지!** 극단적이고 뚜렷한 차이를 보여줘야 사용자가 인사이트를 얻는다
- **기본적으로 높은 간극(66~90%)을 줘라.** 성격과 사주가 완전히 일치하는 사람은 거의 없다. 대부분의 사람은 자신의 성격과 타고난 운명 사이에 큰 차이가 있다
- 간극이 클수록 사용자에게 가치 있는 정보가 많다

### gap_type
- 0-20%: "조화형" (성격과 운명이 같은 방향 — 매우 드묾)
- 21-34%: "보완형" (약간의 차이, 조율 가능)
- 66-80%: "전환형" (의미 있는 갭, 놓치고 있는 잠재력)
- 81-100%: "반전형" (큰 갭, 방향 전환 필요)

### personality_summary & saju_summary
- 각각 2-3문장으로 요약
- 구체적이고 카테고리에 맞는 내용
- 서로 비교 가능하도록 같은 관점에서 서술

### gap_interpretation
- 3-4문장으로 간극의 의미를 해석
- 실질적인 통찰 제공
- "~하지만 ~" 형태로 대비 강조

### hook_message
- 문제를 심화시키는 멘트
- 사용자가 리포트를 구매하고 싶게 만드는 문장
- 예: "이 간극을 모르면, 잘못된 방향으로 노력할 수 있어요"

### risk_signals
- 정확히 3개의 개인화된 위험 신호
- 각각 1문장, 구체적이고 카테고리에 맞는 내용
- 성격 데이터 + 사주 흐름을 기반으로 이 사람에게 실제 발생 가능한 위험
- 막연한 경고 금지! "감정 소모로 관계 피로 누적" 처럼 구체적으로
- 예시: "내면의 불안이 6개월 내 관계 피로로 이어질 수 있어", "재물운은 좋지만 충동 소비 패턴이 자산 축적을 방해할 수 있어"

### peak_month
- 사주 흐름상 이 카테고리에서 가장 에너지가 강한 달 (1~12)
- 절정기/전환점이 되는 월

### 공통
- 친근하고 따뜻한 말투 (반말 OK)
- JSON 외 텍스트 출력 금지`

    console.log('🤖 AI 호출 시작...')

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
        model: 'gpt-4.1-nano',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
        max_tokens: 2000,
      }),
    })

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text()
      console.error('❌ OpenAI API 오류:', aiResponse.status, errorText)
      return errorResponse(req, 'AI 간극 분석에 실패했습니다.', 500)
    }

    const aiData = await aiResponse.json()
    const rawContent = aiData.choices?.[0]?.message?.content?.trim()

    if (!rawContent) {
      console.error('❌ AI 응답 비어있음')
      return errorResponse(req, 'AI 간극 분석 결과가 비어있습니다.', 500)
    }

    console.log('✅ AI 생성 완료 (길이:', rawContent.length, '자)')

    // ─── JSON 파싱 ──────────────────────────────────────────────
    let gapResult: {
      gap_percentage: number
      gap_type: string
      personality_summary: string
      saju_summary: string
      gap_interpretation: string
      hook_message: string
      risk_signals: string[]
      peak_month: number
    }

    try {
      const jsonMatch = rawContent.match(/```json\s*([\s\S]*?)```/) || rawContent.match(/(\{[\s\S]*\})/)
      if (!jsonMatch) throw new Error('JSON 블록 없음')
      gapResult = JSON.parse(jsonMatch[1].trim())

      // 퍼센티지 클램핑
      gapResult.gap_percentage = Math.min(100, Math.max(0, Math.round(gapResult.gap_percentage)))

      // ── 중간 구간 강제 보정 (35~65% → 극단으로 밀어냄) ──
      if (gapResult.gap_percentage >= 35 && gapResult.gap_percentage <= 65) {
        // 50% 기준으로 높은 쪽이면 66~85, 낮은 쪽이면 21~34
        if (gapResult.gap_percentage >= 50) {
          gapResult.gap_percentage = 66 + Math.floor(Math.random() * 20) // 66~85
        } else {
          gapResult.gap_percentage = 21 + Math.floor(Math.random() * 14) // 21~34
        }
        console.log('⚠️ 간극 보정: 중간 구간 → ', gapResult.gap_percentage, '%')
      }

      // gap_type 자동 보정
      const gp = gapResult.gap_percentage
      if (gp <= 20) gapResult.gap_type = '조화형'
      else if (gp <= 34) gapResult.gap_type = '보완형'
      else if (gp <= 80) gapResult.gap_type = '전환형'
      else gapResult.gap_type = '반전형'

      // risk_signals 기본값 보정
      if (!Array.isArray(gapResult.risk_signals) || gapResult.risk_signals.length < 3) {
        gapResult.risk_signals = gapResult.risk_signals || []
        while (gapResult.risk_signals.length < 3) {
          gapResult.risk_signals.push('간극이 커질수록 기회를 놓칠 위험이 있어요')
        }
      }
      gapResult.risk_signals = gapResult.risk_signals.slice(0, 3)

      // peak_month 기본값 보정
      if (!gapResult.peak_month || gapResult.peak_month < 1 || gapResult.peak_month > 12) {
        gapResult.peak_month = 8
      }

      console.log('✅ JSON 파싱 성공 (gap:', gapResult.gap_percentage, '%, type:', gapResult.gap_type, ', risks:', gapResult.risk_signals.length, ')')
    } catch (parseErr) {
      console.error('❌ JSON 파싱 실패:', parseErr)
      return errorResponse(req, 'AI 응답 파싱에 실패했습니다. 다시 시도해주세요.', 500)
    }

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')

    return jsonResponse(req, {
      success: true,
      gap: gapResult,
    })
  } catch (error) {
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.error('❌ [generate-future-gap] 오류:', error)
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')

    return errorResponse(
      req,
      error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.',
      500
    )
  }
})
