import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import {
  getCorsHeaders,
  handleCorsPreflightRequest,
  jsonResponse,
  errorResponse,
} from '../server/cors.ts'

/**
 * 궁합 시뮬레이션 Edge Function
 *
 * 두 가지 모드:
 * 1. mode: 'create_invite' — A의 예측 결과 저장 + match_code 생성
 * 2. mode: 'analyze' — B의 예측 결과 + match_code → 궁합 분석 생성
 *
 * POST body:
 * - create_invite: { mode: 'create_invite', category, prediction_result }
 * - analyze: { mode: 'analyze', match_code, prediction_result }
 */

function generateMatchCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // 혼동 문자 제외 (I,O,0,1)
  let code = ''
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)]
  }
  return code
}

const CATEGORY_LABELS: Record<string, string> = {
  '연애': '연애 미래',
  '재물': '재물 미래',
  '학업': '학업 미래',
  '직장': '직장 미래',
  '커리어': '커리어 미래',
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return handleCorsPreflightRequest(req)
  }

  try {
    const { mode, category, prediction_result, match_code } = await req.json()

    // Supabase 서비스 역할 클라이언트 (RLS 우회)
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // ─── Mode 1: 초대 생성 ─────────────────────────────────────────
    if (mode === 'create_invite') {
      if (!category || !prediction_result) {
        return errorResponse(req, 'category와 prediction_result가 필요합니다.', 400)
      }

      // 유니크 match_code 생성 (충돌 시 재시도)
      let code = ''
      for (let attempt = 0; attempt < 5; attempt++) {
        code = generateMatchCode()
        const { data: existing } = await supabase
          .from('compatibility_invites')
          .select('id')
          .eq('match_code', code)
          .single()
        if (!existing) break
      }

      const { error: insertError } = await supabase
        .from('compatibility_invites')
        .insert({
          match_code: code,
          category,
          inviter_prediction: prediction_result,
        })

      if (insertError) {
        console.error('❌ 초대 저장 실패:', insertError)
        return errorResponse(req, '초대 생성에 실패했습니다.', 500)
      }

      console.log(`✅ 궁합 초대 생성: ${code} (${category})`)

      return jsonResponse(req, {
        success: true,
        match_code: code,
      })
    }

    // ─── Mode 2: 궁합 분석 ─────────────────────────────────────────
    if (mode === 'analyze') {
      if (!match_code || !prediction_result) {
        return errorResponse(req, 'match_code와 prediction_result가 필요합니다.', 400)
      }

      // 초대 조회
      const { data: invite, error: fetchError } = await supabase
        .from('compatibility_invites')
        .select('*')
        .eq('match_code', match_code)
        .single()

      if (fetchError || !invite) {
        return errorResponse(req, '유효하지 않은 초대 코드입니다.', 404)
      }

      // 만료 체크
      if (new Date(invite.expires_at) < new Date()) {
        return errorResponse(req, '만료된 초대입니다. 새로운 궁합 분석을 요청해주세요.', 410)
      }

      // 이미 분석 완료된 경우 → 기존 결과 반환
      if (invite.compatibility_result) {
        return jsonResponse(req, {
          success: true,
          compatibility: invite.compatibility_result,
          inviter_category: invite.category,
          already_completed: true,
        })
      }

      // B의 결과 저장
      await supabase
        .from('compatibility_invites')
        .update({ invitee_prediction: prediction_result })
        .eq('match_code', match_code)

      // ─── AI 궁합 분석 ────────────────────────────────────────────
      const openaiKey = Deno.env.get('OPENAI_API_KEY')
      if (!openaiKey) {
        return errorResponse(req, 'AI 설정 오류', 500)
      }

      const inviterPred = invite.inviter_prediction
      const inviteePred = prediction_result
      const cat = invite.category
      const catLabel = CATEGORY_LABELS[cat] || cat

      const systemPrompt = `너는 두 사람의 성격 기반 미래 예측 결과를 비교하여 궁합을 분석하는 전문가야.
두 사람의 IPIP-HEXACO 기반 태도 유형과 AI 예측 결과를 비교 분석해줘.
결과는 반드시 JSON으로만 응답해.`

      const userPrompt = `## 카테고리: ${catLabel}

## A의 예측 결과
- 태도 유형: ${inviterPred.attitude?.type} (${inviterPred.attitude?.description})
- 스펙트럼: ${inviterPred.spectrum?.label} (위치: ${inviterPred.spectrum?.position})
- 스펙트럼 요약: ${inviterPred.spectrum?.summary}
- 토론 결론: ${inviterPred.debate?.conclusion}

## B의 예측 결과
- 태도 유형: ${inviteePred.attitude?.type} (${inviteePred.attitude?.description})
- 스펙트럼: ${inviteePred.spectrum?.label} (위치: ${inviteePred.spectrum?.position})
- 스펙트럼 요약: ${inviteePred.spectrum?.summary}
- 토론 결론: ${inviteePred.debate?.conclusion}

## 분석 요청
두 사람의 ${catLabel} 관련 궁합을 분석해줘.

다음 JSON 형식으로만 응답해:
{
  "compatibility_score": (0~100 정수, 70 이상이면 좋은 궁합),
  "compatibility_type": "(한 단어 유형명, 예: 보완형 파트너, 동반성장형, 자극적 조합, 안정 추구형 등)",
  "resonance_points": ["두 사람이 공명하는 점 1", "공명점 2", "공명점 3"],
  "friction_points": ["마찰이 생길 수 있는 점 1", "마찰점 2"],
  "future_scenario": "(두 사람의 ${catLabel} 관계가 어떻게 흘러갈지 3-4문장 시나리오. 구체적이고 생생하게.)",
  "advice": "(관계를 위한 실용적 조언 2-3문장)"
}

주의:
- compatibility_score는 두 사람의 태도 유형 조합에 따라 현실적으로 산정
- 같은 유형이면 공감은 높지만 성장 자극이 부족할 수 있음
- 반대 유형이면 보완적이지만 충돌 가능성 있음
- resonance_points는 정확히 3개, friction_points는 정확히 2개
- future_scenario는 ${catLabel} 맥락에 맞게 구체적으로
- advice는 두 사람 모두에게 도움이 되는 실용적 조언`

      console.log(`🤖 궁합 분석 시작: ${match_code} (${cat})`)
      console.log(`  A: ${inviterPred.attitude?.type} / B: ${inviteePred.attitude?.type}`)

      const aiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${openaiKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-4.1-nano',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
          temperature: 0.8,
          max_tokens: 1000,
        }),
      })

      if (!aiResponse.ok) {
        const errText = await aiResponse.text()
        console.error('❌ OpenAI 오류:', errText)
        return errorResponse(req, 'AI 분석에 실패했습니다.', 500)
      }

      const aiData = await aiResponse.json()
      const rawContent = aiData.choices?.[0]?.message?.content || ''

      // JSON 파싱
      let compatibility
      try {
        // ```json ... ``` 블록 추출
        const jsonMatch = rawContent.match(/```(?:json)?\s*([\s\S]*?)```/)
        let jsonStr = jsonMatch ? jsonMatch[1].trim() : rawContent.trim()

        // JSON 블록이 없으면 첫 { ~ 마지막 } 추출
        if (!jsonStr.startsWith('{')) {
          const firstBrace = jsonStr.indexOf('{')
          const lastBrace = jsonStr.lastIndexOf('}')
          if (firstBrace !== -1 && lastBrace > firstBrace) {
            jsonStr = jsonStr.substring(firstBrace, lastBrace + 1)
          }
        }

        compatibility = JSON.parse(jsonStr)

        // 점수 클램핑
        compatibility.compatibility_score = Math.min(100, Math.max(0, compatibility.compatibility_score))

        console.log(`✅ 궁합 분석 완료: ${compatibility.compatibility_score}점 (${compatibility.compatibility_type})`)
      } catch (parseErr) {
        console.error('❌ JSON 파싱 실패:', parseErr, rawContent)
        return errorResponse(req, '궁합 분석 결과 파싱에 실패했습니다.', 500)
      }

      // DB에 결과 저장
      const { error: updateError } = await supabase
        .from('compatibility_invites')
        .update({ compatibility_result: compatibility })
        .eq('match_code', match_code)

      if (updateError) {
        console.error('❌ 궁합 결과 저장 실패:', updateError)
      }

      return jsonResponse(req, {
        success: true,
        compatibility,
        inviter_category: invite.category,
      })
    }

    // ─── Mode 3: 결과 조회 (A가 나중에 확인) ───────────────────────
    if (mode === 'get_result') {
      if (!match_code) {
        return errorResponse(req, 'match_code가 필요합니다.', 400)
      }

      const { data: invite, error: fetchError } = await supabase
        .from('compatibility_invites')
        .select('*')
        .eq('match_code', match_code)
        .single()

      if (fetchError || !invite) {
        return errorResponse(req, '유효하지 않은 초대 코드입니다.', 404)
      }

      if (!invite.compatibility_result) {
        return jsonResponse(req, {
          success: true,
          status: 'waiting',
          category: invite.category,
        })
      }

      return jsonResponse(req, {
        success: true,
        status: 'completed',
        compatibility: invite.compatibility_result,
        inviter_category: invite.category,
        inviter_prediction: invite.inviter_prediction,
        invitee_prediction: invite.invitee_prediction,
      })
    }

    return errorResponse(req, '유효하지 않은 mode입니다. (create_invite | analyze | get_result)', 400)
  } catch (error) {
    console.error('❌ [generate-future-compatibility] 오류:', error)
    return errorResponse(
      req,
      error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.',
      500
    )
  }
})
