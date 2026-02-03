// Supabase Edge Function: 주간 보고서 소유자 정보 조회
// 알림톡 링크로 접속 시 계정 불일치 확인용

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { getCorsHeaders, handleCorsPreflightRequest } from '../server/cors.ts'

serve(async (req) => {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    return handleCorsPreflightRequest(req)
  }

  const corsHeaders = getCorsHeaders(req)

  try {
    const { reportId } = await req.json()

    if (!reportId) {
      return new Response(
        JSON.stringify({ success: false, error: 'reportId가 필요합니다.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Service Role Key로 Supabase 클라이언트 생성 (RLS 우회)
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Supabase 환경변수가 설정되지 않았습니다.')
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false }
    })

    console.log('🔍 [get-report-owner] 보고서 소유자 조회:', reportId)

    // 1. 보고서 조회 (Service Role로 RLS 우회)
    const { data: report, error: reportError } = await supabase
      .from('weekly_reports')
      .select('id, user_id, status')
      .eq('id', reportId)
      .single()

    if (reportError || !report) {
      console.log('📭 [get-report-owner] 보고서 없음:', reportId)
      return new Response(
        JSON.stringify({
          success: true,
          exists: false,
          owner: null
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 2. 소유자 정보 조회
    const { data: owner, error: ownerError } = await supabase
      .from('users')
      .select('id, email, phone_number, login_provider')
      .eq('id', report.user_id)
      .single()

    if (ownerError || !owner) {
      console.log('❌ [get-report-owner] 소유자 정보 없음:', report.user_id)
      return new Response(
        JSON.stringify({
          success: true,
          exists: true,
          owner: null
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 3. 소유자 정보 마스킹
    let maskedEmail = ''
    if (owner.email) {
      const [localPart, domain] = owner.email.split('@')
      if (localPart.length > 2) {
        maskedEmail = localPart.substring(0, 2) + '***@' + domain
      } else {
        maskedEmail = localPart[0] + '***@' + domain
      }
    }

    let maskedPhone = ''
    if (owner.phone_number) {
      // 010-1234-5678 → 010-****-5678
      const phone = owner.phone_number.replace(/-/g, '')
      if (phone.length >= 7) {
        maskedPhone = phone.substring(0, 3) + '-****-' + phone.substring(phone.length - 4)
      }
    }

    console.log('✅ [get-report-owner] 소유자 정보 반환:', {
      reportId,
      loginProvider: owner.login_provider,
      hasMaskedEmail: !!maskedEmail,
      hasMaskedPhone: !!maskedPhone
    })

    return new Response(
      JSON.stringify({
        success: true,
        exists: true,
        owner: {
          loginProvider: owner.login_provider || 'unknown',
          maskedEmail,
          maskedPhone
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('❌ [get-report-owner] 오류:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : '알 수 없는 오류'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
