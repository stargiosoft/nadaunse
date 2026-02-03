// Supabase Edge Function: 주문 소유자 정보 조회
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
    const { orderId } = await req.json()

    if (!orderId) {
      return new Response(
        JSON.stringify({ success: false, error: 'orderId가 필요합니다.' }),
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

    console.log('🔍 [get-order-owner] 주문 소유자 조회:', orderId)

    // 1. 주문 조회 (Service Role로 RLS 우회)
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('id, user_id, status')
      .eq('id', orderId)
      .single()

    if (orderError || !order) {
      console.log('📭 [get-order-owner] 주문 없음:', orderId)
      return new Response(
        JSON.stringify({
          success: true,
          exists: false,
          owner: null
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 2. Auth에서 소유자 정보 조회 (auth.admin.getUserById 사용)
    const { data: authUser, error: authError } = await supabase.auth.admin.getUserById(order.user_id)

    if (authError || !authUser?.user) {
      console.log('❌ [get-order-owner] Auth 소유자 정보 없음:', order.user_id, authError)
      return new Response(
        JSON.stringify({
          success: true,
          exists: true,
          owner: null
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const user = authUser.user
    const loginProvider = user.app_metadata?.provider || 'unknown'

    // 3. 소유자 정보 마스킹
    let maskedEmail = ''
    if (user.email) {
      const [localPart, domain] = user.email.split('@')
      if (localPart.length > 2) {
        maskedEmail = localPart.substring(0, 2) + '***@' + domain
      } else {
        maskedEmail = localPart[0] + '***@' + domain
      }
    }

    let maskedPhone = ''
    if (user.phone) {
      // 010-1234-5678 → 010-****-5678
      const phone = user.phone.replace(/-/g, '')
      if (phone.length >= 7) {
        maskedPhone = phone.substring(0, 3) + '-****-' + phone.substring(phone.length - 4)
      }
    }

    console.log('✅ [get-order-owner] 소유자 정보 반환:', {
      orderId,
      loginProvider,
      hasMaskedEmail: !!maskedEmail,
      hasMaskedPhone: !!maskedPhone
    })

    return new Response(
      JSON.stringify({
        success: true,
        exists: true,
        owner: {
          loginProvider,
          maskedEmail,
          maskedPhone
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('❌ [get-order-owner] 오류:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : '알 수 없는 오류'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
