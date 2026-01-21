/**
 * 결제 처리 Edge Function
 *
 * @endpoint POST /process-payment
 * @input {
 *   content_id: string,
 *   paid_amount: number,
 *   pay_method: string,
 *   imp_uid: string,
 *   merchant_uid: string,
 *   pg_provider: string,
 *   user_coupon_id?: string
 * }
 * @output { success: boolean, order_id?: string, error?: string }
 *
 * @description
 * - 주문 생성 + 쿠폰 사용을 단일 트랜잭션으로 처리
 * - PostgreSQL Function(process_payment_complete) 호출
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
    console.log('💳 [결제처리] 요청 수신');

    // Supabase 클라이언트 (사용자 인증 컨텍스트)
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    // 사용자 인증 확인
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();

    if (authError || !user) {
      console.error('❌ [결제처리] 인증 실패:', authError);
      return new Response(
        JSON.stringify({ success: false, error: '인증이 필요합니다' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 요청 본문 파싱
    const {
      content_id,
      paid_amount,
      pay_method,
      imp_uid,
      merchant_uid,
      pg_provider,
      user_coupon_id,
    } = await req.json();

    console.log('📦 [결제처리] 입력 데이터:', {
      user_id: user.id,
      content_id,
      paid_amount,
      pay_method,
      user_coupon_id: user_coupon_id || 'none',
    });

    // 필수 필드 검증
    if (!content_id || !paid_amount || !pay_method || !imp_uid || !merchant_uid) {
      return new Response(
        JSON.stringify({ success: false, error: '필수 필드가 누락되었습니다' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // PostgreSQL Function 호출 (트랜잭션)
    const { data, error } = await supabaseClient.rpc('process_payment_complete', {
      p_user_id: user.id,
      p_content_id: content_id,
      p_paid_amount: paid_amount,
      p_pay_method: pay_method,
      p_imp_uid: imp_uid,
      p_merchant_uid: merchant_uid,
      p_pg_provider: pg_provider || 'unknown',
      p_user_coupon_id: user_coupon_id || null,
    });

    if (error) {
      console.error('❌ [결제처리] RPC 호출 실패:', error);
      return new Response(
        JSON.stringify({ success: false, error: error.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // PostgreSQL Function 결과 확인
    if (!data.success) {
      console.error('❌ [결제처리] 트랜잭션 실패:', data.error);
      return new Response(
        JSON.stringify({ success: false, error: data.error }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('✅ [결제처리] 성공:', {
      order_id: data.order_id,
      coupon_discount: data.coupon_discount,
    });

    return new Response(
      JSON.stringify({
        success: true,
        order_id: data.order_id,
        coupon_discount: data.coupon_discount,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ [결제처리] 예외 발생:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
