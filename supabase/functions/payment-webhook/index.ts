/**
 * 결제 웹훅 Edge Function (PortOne/아임포트)
 *
 * @endpoint POST /payment-webhook
 * @input { imp_uid: string, merchant_uid: string, status: string }
 * @output { success: boolean, message?: string, error?: string }
 *
 * @description
 * - PortOne(아임포트) 서버에서 결제 완료 시 호출
 * - imp_uid로 결제 정보 검증
 * - DB 주문 상태 업데이트
 *
 * @security
 * - PortOne API로 결제 금액 검증 (위변조 방지)
 * - 중복 처리 방지 (이미 완료된 주문 스킵)
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

// CORS 헤더
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// PortOne API 엔드포인트
const PORTONE_API_URL = 'https://api.iamport.kr';

interface PortOnePayment {
  imp_uid: string;
  merchant_uid: string;
  amount: number;
  status: string;
  pay_method: string;
  pg_provider: string;
  buyer_email?: string;
  buyer_name?: string;
}

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
    console.error('PortOne 토큰 발급 실패:', data);
    throw new Error(`PortOne 인증 실패: ${data.message}`);
  }

  return data.response.access_token;
}

/**
 * PortOne 결제 정보 조회
 */
async function getPaymentInfo(impUid: string, accessToken: string): Promise<PortOnePayment> {
  const response = await fetch(`${PORTONE_API_URL}/payments/${impUid}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
    },
  });

  const data = await response.json();

  if (data.code !== 0) {
    console.error('결제 정보 조회 실패:', data);
    throw new Error(`결제 정보 조회 실패: ${data.message}`);
  }

  return data.response;
}

Deno.serve(async (req) => {
  // CORS 프리플라이트 처리
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    console.log('💳 [결제웹훅] 요청 수신');

    // Supabase 클라이언트 (Service Role Key 사용)
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    // 요청 본문 파싱
    const { imp_uid, merchant_uid, status } = await req.json();

    console.log('📦 [결제웹훅] 수신 데이터:', { imp_uid, merchant_uid, status });

    if (!imp_uid) {
      return new Response(
        JSON.stringify({ success: false, error: 'imp_uid is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 1. PortOne API로 결제 검증
    console.log('🔍 [결제웹훅] PortOne 결제 검증 시작');
    const accessToken = await getPortOneAccessToken();
    const paymentInfo = await getPaymentInfo(imp_uid, accessToken);

    console.log('✅ [결제웹훅] PortOne 결제 정보:', {
      imp_uid: paymentInfo.imp_uid,
      merchant_uid: paymentInfo.merchant_uid,
      amount: paymentInfo.amount,
      status: paymentInfo.status,
    });

    // 2. 결제 상태 확인
    if (paymentInfo.status !== 'paid') {
      console.log('⚠️ [결제웹훅] 결제 미완료 상태:', paymentInfo.status);
      return new Response(
        JSON.stringify({
          success: false,
          error: `결제 미완료 상태: ${paymentInfo.status}`,
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 3. DB에서 주문 조회 (merchant_uid로)
    const { data: order, error: orderError } = await supabaseAdmin
      .from('orders')
      .select('*')
      .eq('merchant_uid', paymentInfo.merchant_uid)
      .single();

    if (orderError || !order) {
      console.error('❌ [결제웹훅] 주문 조회 실패:', orderError);
      return new Response(
        JSON.stringify({ success: false, error: '주문을 찾을 수 없습니다' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 4. 금액 검증 (위변조 방지)
    if (order.paid_amount !== paymentInfo.amount) {
      console.error('🚨 [결제웹훅] 금액 불일치!', {
        expected: order.paid_amount,
        actual: paymentInfo.amount,
      });

      // 금액 불일치 시 주문 상태를 failed로 업데이트
      await supabaseAdmin
        .from('orders')
        .update({
          pstatus: 'failed',
          updated_at: new Date().toISOString(),
        })
        .eq('id', order.id);

      return new Response(
        JSON.stringify({
          success: false,
          error: '결제 금액이 일치하지 않습니다',
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 5. 이미 처리된 주문인지 확인
    if (order.pstatus === 'completed') {
      console.log('ℹ️ [결제웹훅] 이미 처리된 주문:', order.id);
      return new Response(
        JSON.stringify({ success: true, message: '이미 처리된 주문입니다' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 6. 주문 상태 업데이트
    const { error: updateError } = await supabaseAdmin
      .from('orders')
      .update({
        pstatus: 'completed',
        imp_uid: paymentInfo.imp_uid,
        pg_provider: paymentInfo.pg_provider,
        pay_method: paymentInfo.pay_method,
        webhook_verified_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', order.id);

    if (updateError) {
      console.error('❌ [결제웹훅] 주문 업데이트 실패:', updateError);
      return new Response(
        JSON.stringify({ success: false, error: '주문 상태 업데이트 실패' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('✅ [결제웹훅] 결제 검증 및 주문 업데이트 완료:', {
      orderId: order.id,
      impUid: paymentInfo.imp_uid,
      amount: paymentInfo.amount,
    });

    return new Response(
      JSON.stringify({
        success: true,
        message: '결제 검증 완료',
        orderId: order.id,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ [결제웹훅] 예외 발생:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
