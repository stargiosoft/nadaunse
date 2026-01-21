/**
 * 주문에 쿠폰 적용 (사용 처리) Edge Function
 * 
 * @endpoint POST /apply-coupon-to-order
 * @input { user_coupon_id: string, order_id: string }
 * @output { success: boolean, error?: string }
 * 
 * @logic
 * 1. user_coupons 업데이트:
 *    - is_used = true
 *    - used_at = now()
 *    - used_order_id = order_id
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { getCorsHeaders, handleCorsPreflightRequest } from '../server/cors.ts';

Deno.serve(async (req) => {
  // CORS 프리플라이트 처리
  if (req.method === 'OPTIONS') {
    return handleCorsPreflightRequest(req);
  }

  const corsHeaders = getCorsHeaders(req);

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    const { user_coupon_id, order_id } = await req.json();

    if (!user_coupon_id || !order_id) {
      return new Response(
        JSON.stringify({ success: false, error: 'user_coupon_id and order_id are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('🎟️ [쿠폰사용] 시작:', { user_coupon_id, order_id });

    // 1. 쿠폰 존재 여부 및 사용 가능 여부 확인
    const { data: userCoupon, error: fetchError } = await supabaseClient
      .from('user_coupons')
      .select('*')
      .eq('id', user_coupon_id)
      .single();

    if (fetchError || !userCoupon) {
      console.error('❌ [쿠폰사용] 쿠폰 조회 실패:', fetchError);
      return new Response(
        JSON.stringify({ success: false, error: '쿠폰을 찾을 수 없습니다' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (userCoupon.is_used) {
      console.error('⚠️ [쿠폰사용] 이미 사용된 쿠폰:', user_coupon_id);
      return new Response(
        JSON.stringify({ success: false, error: '이미 사용된 쿠폰입니다' }),
        { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 2. 쿠폰 사용 처리
    const { error: updateError } = await supabaseClient
      .from('user_coupons')
      .update({
        is_used: true,
        used_at: new Date().toISOString(),
        used_order_id: order_id,
      })
      .eq('id', user_coupon_id);

    if (updateError) {
      console.error('❌ [쿠폰사용] 업데이트 실패:', updateError);
      return new Response(
        JSON.stringify({ success: false, error: '쿠폰 사용 처리 실패' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('✅ [쿠폰사용] 성공:', user_coupon_id);

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ [쿠폰사용] 예외 발생:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});