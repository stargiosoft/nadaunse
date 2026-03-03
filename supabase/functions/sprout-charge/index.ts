/**
 * 새싹 충전 처리 Edge Function
 *
 * @endpoint POST /sprout-charge
 * @input {
 *   package_id: string,
 *   imp_uid: string,
 *   merchant_uid: string,
 *   pay_method: string,
 *   pg_provider: string
 * }
 * @output { success: boolean, order_id?: string, charged_amount?: number, new_balance?: number, error?: string }
 *
 * @description
 * - 패키지 조회 → process_sprout_charge RPC 호출
 * - JWT 검증 필요 (--no-verify-jwt 불필요)
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
    const authHeader = req.headers.get('Authorization');
    console.log('🌱 [새싹충전] 요청 수신');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ success: false, error: '인증이 필요합니다' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // JWT에서 user_id 추출 (Supabase 게이트웨이가 이미 JWT 서명 검증 완료)
    let userId: string;
    try {
      const jwt = authHeader.replace('Bearer ', '');
      const payload = JSON.parse(atob(jwt.split('.')[1]));
      userId = payload.sub;
      if (!userId) throw new Error('sub claim missing');
      console.log('🌱 [새싹충전] 사용자 확인:', userId);
    } catch {
      return new Response(
        JSON.stringify({ success: false, error: '유효하지 않은 토큰입니다' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // user 객체 호환용
    const user = { id: userId };

    // 요청 본문 파싱
    const { package_id, imp_uid, merchant_uid, pay_method, pg_provider } = await req.json();

    console.log('📦 [새싹충전] 입력 데이터:', {
      user_id: user.id,
      package_id,
      pay_method,
    });

    // 필수 필드 검증
    if (!package_id || !imp_uid || !merchant_uid || !pay_method) {
      return new Response(
        JSON.stringify({ success: false, error: '필수 필드가 누락되었습니다' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Service Role 클라이언트 (패키지 조회용 - RLS 우회)
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    // 패키지 조회
    const { data: pkg, error: pkgError } = await supabaseAdmin
      .from('sprout_packages')
      .select('*')
      .eq('id', package_id)
      .eq('is_active', true)
      .single();

    if (pkgError || !pkg) {
      console.error('❌ [새싹충전] 패키지 조회 실패:', pkgError);
      return new Response(
        JSON.stringify({ success: false, error: '유효하지 않은 패키지입니다' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // process_sprout_charge RPC 호출
    const { data, error } = await supabaseAdmin.rpc('process_sprout_charge', {
      p_user_id: user.id,
      p_base_amount: pkg.base_amount,
      p_bonus_amount: pkg.bonus_amount,
      p_total_amount: pkg.total_amount,
      p_price_krw: pkg.price_krw,
      p_package_name: pkg.name,
      p_imp_uid: imp_uid,
      p_merchant_uid: merchant_uid,
      p_pay_method: pay_method,
      p_pg_provider: pg_provider || 'unknown',
    });

    if (error) {
      console.error('❌ [새싹충전] RPC 호출 실패:', error);
      return new Response(
        JSON.stringify({ success: false, error: '충전 처리에 실패했습니다' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!data.success) {
      console.error('❌ [새싹충전] 트랜잭션 실패:', data.error);
      return new Response(
        JSON.stringify({ success: false, error: data.error }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('✅ [새싹충전] 성공:', {
      order_id: data.order_id,
      charged_amount: data.charged_amount,
      new_balance: data.balance_after,
    });

    return new Response(
      JSON.stringify({
        success: true,
        order_id: data.order_id,
        charged_amount: data.charged_amount,
        new_balance: data.balance_after,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ [새싹충전] 예외 발생:', error);
    return new Response(
      JSON.stringify({ success: false, error: '충전 처리 중 오류가 발생했습니다' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
