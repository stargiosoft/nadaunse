import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { getCorsHeaders, handleCorsPreflightRequest } from '../server/cors.ts';

Deno.serve(async (req) => {
  // Handle CORS preflight requests
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

    // ⭐ Service role 클라이언트 (RLS 우회 - 미션 쿠폰 중복 체크용)
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // ⭐ source_order_id 추가
    const { user_id, source_order_id } = await req.json();

    if (!user_id) {
      return new Response(
        JSON.stringify({ error: 'user_id is required' }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // ⭐ source_order_id 필수 체크
    if (!source_order_id) {
      return new Response(
        JSON.stringify({ error: 'source_order_id is required' }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // 1. 미션 쿠폰 / 재구매 쿠폰 분기 결정
    // - 미션 쿠폰을 아직 받지 않았으면 → 미션 쿠폰(12,900원) 발급
    // - 이미 받았으면 → 재구매 쿠폰(3,000원) 발급

    // 1-1. 미션 쿠폰 마스터 데이터 조회 (⭐ service role로 확실하게 조회)
    const { data: missionCouponData, error: missionCouponError } = await supabaseAdmin
      .from('coupons')
      .select('*')
      .eq('coupon_type', 'mission')
      .maybeSingle();

    if (missionCouponError) {
      console.error('⚠️ 미션 쿠폰 마스터 조회 에러:', missionCouponError);
    }

    // 1-2. 재구매 쿠폰 마스터 데이터 조회
    const { data: revisitCouponData, error: revisitCouponError } = await supabaseAdmin
      .from('coupons')
      .select('*')
      .eq('coupon_type', 'revisit')
      .single();

    if (revisitCouponError || !revisitCouponData) {
      console.error('재구매 쿠폰 조회 실패:', revisitCouponError);
      return new Response(
        JSON.stringify({ error: '재구매 쿠폰을 찾을 수 없습니다' }),
        {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // 1-3. 미션 쿠폰 발급 여부 확인 (⭐ service role로 RLS 우회하여 확실하게 체크)
    let couponToIssue = revisitCouponData; // 기본값: 재구매 쿠폰
    let couponType: 'mission' | 'revisit' = 'revisit';

    if (missionCouponData) {
      const { data: existingMissionCoupon, error: checkMissionError } = await supabaseAdmin
        .from('user_coupons')
        .select('id')
        .eq('user_id', user_id)
        .eq('coupon_id', missionCouponData.id)
        .maybeSingle();

      if (checkMissionError) {
        console.error('⚠️ 미션 쿠폰 존재 여부 체크 에러:', checkMissionError);
        // 에러 시 안전하게 재구매 쿠폰으로 폴백 (미션 쿠폰 중복 발급 방지)
        console.log('⚠️ 에러 발생 → 재구매 쿠폰으로 안전 폴백');
      } else if (!existingMissionCoupon) {
        // 미션 쿠폰을 아직 받지 않음 → 미션 쿠폰 발급
        couponToIssue = missionCouponData;
        couponType = 'mission';
        console.log(`🎯 미션 쿠폰 발급 대상: user_id=${user_id}`);
      } else {
        console.log(`ℹ️ 이미 미션 쿠폰 수령 (id=${existingMissionCoupon.id}) → 재구매 쿠폰 발급: user_id=${user_id}`);
      }
    } else {
      console.log('⚠️ 미션 쿠폰 마스터 데이터 없음 → 재구매 쿠폰으로 폴백');
    }

    // ⭐ 2. 중복 발급 체크: 같은 주문으로 이미 발급받았는지 확인 (service role로 RLS 우회)
    const { data: existingCoupon, error: checkError } = await supabaseAdmin
      .from('user_coupons')
      .select('id')
      .eq('user_id', user_id)
      .eq('coupon_id', couponToIssue.id)
      .eq('source_order_id', source_order_id)
      .maybeSingle();

    if (checkError) {
      console.error('쿠폰 중복 체크 실패:', checkError);
      return new Response(
        JSON.stringify({ error: '쿠폰 발급 확인에 실패했습니다' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // ⭐ 3. 이미 발급된 경우
    if (existingCoupon) {
      console.log(`이미 발급된 쿠폰: user_id=${user_id}, source_order_id=${source_order_id}`);
      return new Response(
        JSON.stringify({
          success: false,
          error: '이 주문에 대한 쿠폰이 이미 발급되었습니다',
          alreadyIssued: true
        }),
        {
          status: 409, // 409 Conflict
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // ⭐ 4. 새로 발급 (source_order_id 포함, service role로 RLS 우회)
    const { data: userCoupon, error: insertError } = await supabaseAdmin
      .from('user_coupons')
      .insert({
        user_id: user_id,
        coupon_id: couponToIssue.id,
        source_order_id: source_order_id,
        is_used: false,
        expired_at: null, // 유효기간 없음
      })
      .select('*')
      .single();

    if (insertError) {
      console.error('쿠폰 발급 실패:', insertError);
      return new Response(
        JSON.stringify({ error: '쿠폰 발급에 실패했습니다' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    console.log(`✅ ${couponType === 'mission' ? '미션' : '재구매'} 쿠폰 발급 완료:`, userCoupon);

    return new Response(
      JSON.stringify({
        success: true,
        coupon: userCoupon,
        couponType,
        discountAmount: couponToIssue.discount_amount,
        message: '쿠폰이 발급되었습니다'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
