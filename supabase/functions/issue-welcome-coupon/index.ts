/**
 * 가입 축하 쿠폰 자동 발급 Edge Function
 * 
 * @endpoint POST /issue-welcome-coupon
 * @input { user_id: string }
 * @output { success: boolean, coupon?: UserCoupon, error?: string }
 * 
 * @policy
 * - 할인금액: 5,000원
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

    // 2. 중복 발급 체크
    const { data: existingCoupon, error: checkError } = await supabaseClient
      .from('user_coupons')
      .select('id')
      .eq('user_id', user_id)
      .eq('coupon_id', coupon.id)
      .maybeSingle();

    if (checkError) {
      console.error('❌ [가입축하쿠폰] 중복 체크 실패:', checkError);
      return new Response(
        JSON.stringify({ success: false, error: '중복 체크 실패' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (existingCoupon) {
      console.log('⚠️ [가입축하쿠폰] 이미 발급됨:', user_id);
      return new Response(
        JSON.stringify({ success: false, error: '이미 발급된 쿠폰입니다' }),
        { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 3. 쿠폰 발급 (유효기간 없음)
    const { data: userCoupon, error: issueError } = await supabaseClient
      .from('user_coupons')
      .insert({
        user_id,
        coupon_id: coupon.id,
        is_used: false,
        issued_at: new Date().toISOString(),
        expired_at: null, // 유효기간 없음
      })
      .select()
      .single();

    if (issueError) {
      console.error('❌ [가입축하쿠폰] 발급 실패:', issueError);
      return new Response(
        JSON.stringify({ success: false, error: '쿠폰 발급 실패' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('✅ [가입축하쿠폰] 발급 성공:', userCoupon);

    return new Response(
      JSON.stringify({ 
        success: true, 
        coupon: {
          ...userCoupon,
          name: coupon.name,
          discount_amount: coupon.discount_amount,
          description: coupon.description,
        }
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