/**
 * 환불 처리 Edge Function (PortOne/아임포트)
 *
 * @endpoint POST /process-refund
 * @input {
 *   order_id: string,
 *   refund_amount: number,
 *   refund_reason: string
 * }
 * @output { success: boolean, refund_amount?: number, error?: string }
 *
 * @description
 * - PortOne 환불 API 호출
 * - DB 주문 상태 업데이트 (refunded)
 * - 사용된 쿠폰 복원
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

// CORS 헤더
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// PortOne API 엔드포인트
const PORTONE_API_URL = 'https://api.iamport.kr';

/**
 * PortOne 액세스 토큰 발급
 */
async function getPortOneAccessToken(): Promise<string> {
  const apiKey = Deno.env.get('PORTONE_API_KEY');
  const apiSecret = Deno.env.get('PORTONE_API_SECRET');

  if (!apiKey || !apiSecret) {
    throw new Error('PortOne API 키가 설정되지 않았습니다');
  }

  const response = await fetch(`${PORTONE_API_URL}/users/getToken`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      imp_key: apiKey,
      imp_secret: apiSecret,
    }),
  });

  const data = await response.json();

  if (data.code !== 0) {
    throw new Error(`PortOne 인증 실패: ${data.message}`);
  }

  return data.response.access_token;
}

/**
 * PortOne 환불 요청
 */
async function requestRefund(
  impUid: string,
  amount: number,
  reason: string,
  accessToken: string
): Promise<{ success: boolean; message?: string }> {
  const response = await fetch(`${PORTONE_API_URL}/payments/cancel`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`,
    },
    body: JSON.stringify({
      imp_uid: impUid,
      amount: amount,
      reason: reason,
    }),
  });

  const data = await response.json();

  if (data.code !== 0) {
    return { success: false, message: data.message };
  }

  return { success: true };
}

Deno.serve(async (req) => {
  // CORS 프리플라이트 처리
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    console.log('💸 [환불처리] 요청 수신');

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

    // Service Role 클라이언트 (RLS 우회)
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    // 사용자 인증 확인
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();

    if (authError || !user) {
      console.error('❌ [환불처리] 인증 실패:', authError);
      return new Response(
        JSON.stringify({ success: false, error: '인증이 필요합니다' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 요청 본문 파싱
    const { order_id, refund_amount, refund_reason } = await req.json();

    console.log('📦 [환불처리] 입력 데이터:', {
      order_id,
      refund_amount,
      refund_reason,
    });

    // 필수 필드 검증
    if (!order_id || !refund_amount || !refund_reason) {
      return new Response(
        JSON.stringify({ success: false, error: '필수 필드가 누락되었습니다' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 1. 주문 조회
    const { data: order, error: orderError } = await supabaseAdmin
      .from('orders')
      .select('*')
      .eq('id', order_id)
      .eq('user_id', user.id)
      .single();

    if (orderError || !order) {
      console.error('❌ [환불처리] 주문 조회 실패:', orderError);
      return new Response(
        JSON.stringify({ success: false, error: '주문을 찾을 수 없습니다' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 2. 주문 상태 검증
    if (order.pstatus === 'refunded') {
      return new Response(
        JSON.stringify({ success: false, error: '이미 환불 처리된 주문입니다' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (order.pstatus !== 'completed') {
      return new Response(
        JSON.stringify({ success: false, error: '완료된 주문만 환불할 수 있습니다' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 3. PortOne 환불 API 호출
    console.log('🔍 [환불처리] PortOne 환불 요청 시작');
    const accessToken = await getPortOneAccessToken();
    const refundResult = await requestRefund(
      order.imp_uid,
      refund_amount,
      refund_reason,
      accessToken
    );

    if (!refundResult.success) {
      console.error('❌ [환불처리] PortOne 환불 실패:', refundResult.message);
      return new Response(
        JSON.stringify({ success: false, error: `환불 실패: ${refundResult.message}` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('✅ [환불처리] PortOne 환불 성공');

    // 4. DB 업데이트 (PostgreSQL Function 사용)
    const { data: dbResult, error: dbError } = await supabaseAdmin.rpc('process_refund', {
      p_order_id: order_id,
      p_user_id: user.id,
      p_refund_amount: refund_amount,
      p_refund_reason: refund_reason,
    });

    if (dbError) {
      console.error('❌ [환불처리] DB 업데이트 실패:', dbError);
      // PortOne에서는 환불됐지만 DB 업데이트 실패
      // 수동 처리 필요 알림
      return new Response(
        JSON.stringify({
          success: false,
          error: 'DB 업데이트 실패. 관리자에게 문의하세요.',
          portone_refunded: true,
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!dbResult.success) {
      console.error('❌ [환불처리] 트랜잭션 실패:', dbResult.error);
      return new Response(
        JSON.stringify({ success: false, error: dbResult.error }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('✅ [환불처리] 완료:', {
      order_id: dbResult.order_id,
      refund_amount: dbResult.refund_amount,
      coupon_restored: dbResult.coupon_restored,
    });

    return new Response(
      JSON.stringify({
        success: true,
        order_id: dbResult.order_id,
        refund_amount: dbResult.refund_amount,
        coupon_restored: dbResult.coupon_restored,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ [환불처리] 예외 발생:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
