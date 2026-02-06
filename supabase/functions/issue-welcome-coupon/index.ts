/**
 * 가입 축하 쿠폰 자동 발급 Edge Function
 *
 * @endpoint POST /issue-welcome-coupon
 * @input { user_id: string }
 * @output { success: boolean, coupons?: UserCoupon[], coupon?: UserCoupon, error?: string }
 *
 * @policy
 * - 할인금액: 5,000원 x 2장 (총 10,000원)
 * - 발급 시점: 회원가입 완료 즉시
 * - 유효기간: 없음 (expired_at = null)
 * - 중복 발급: 불가 (user_id당 1회만)
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

    const { user_id } = await req.json();

    if (!user_id) {
      return new Response(
        JSON.stringify({ success: false, error: 'user_id is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('🎟️ [가입축하쿠폰] 발급 시작:', user_id);

    // 1. "가입축하쿠폰" 마스터 조회
    const { data: coupon, error: couponError } = await supabaseClient
      .from('coupons')
      .select('*')
      .eq('name', '가입축하쿠폰')
      .eq('is_active', true)
      .single();

    if (couponError || !coupon) {
      console.error('❌ [가입축하쿠폰] 쿠폰 조회 실패:', couponError);
      return new Response(
        JSON.stringify({ success: false, error: '쿠폰을 찾을 수 없습니다' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 2. 중복 발급 체크 (이미 가입축하쿠폰이 있는지 확인)
    const { data: existingCoupons, error: checkError } = await supabaseClient
      .from('user_coupons')
      .select('id')
      .eq('user_id', user_id)
      .eq('coupon_id', coupon.id);

    if (checkError) {
      console.error('❌ [가입축하쿠폰] 중복 체크 실패:', checkError);
      return new Response(
        JSON.stringify({ success: false, error: '중복 체크 실패' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (existingCoupons && existingCoupons.length > 0) {
      console.log(`⚠️ [가입축하쿠폰] 이미 ${existingCoupons.length}장 발급됨:`, user_id);
      return new Response(
        JSON.stringify({ success: false, error: '이미 발급된 쿠폰입니다' }),
        { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 3. 쿠폰 2장 발급 (유효기간 없음)
    const couponCount = 2;
    const issuedAt = new Date().toISOString();

    const couponInserts = Array.from({ length: couponCount }, () => ({
      user_id,
      coupon_id: coupon.id,
      is_used: false,
      issued_at: issuedAt,
      expired_at: null, // 유효기간 없음
    }));

    const { data: userCoupons, error: issueError } = await supabaseClient
      .from('user_coupons')
      .insert(couponInserts)
      .select();

    if (issueError) {
      console.error('❌ [가입축하쿠폰] 발급 실패:', issueError);
      return new Response(
        JSON.stringify({ success: false, error: '쿠폰 발급 실패' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`✅ [가입축하쿠폰] ${couponCount}장 발급 성공:`, userCoupons);

    // 발급된 쿠폰들에 마스터 정보 추가
    const couponsWithDetails = userCoupons?.map((uc: any) => ({
      ...uc,
      name: coupon.name,
      discount_amount: coupon.discount_amount,
      description: coupon.description,
    })) || [];

    return new Response(
      JSON.stringify({
        success: true,
        coupons: couponsWithDetails,
        // 하위 호환성을 위해 첫 번째 쿠폰도 coupon으로 제공
        coupon: couponsWithDetails[0] || null,
        count: couponCount,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ [가입축하쿠폰] 예외 발생:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});