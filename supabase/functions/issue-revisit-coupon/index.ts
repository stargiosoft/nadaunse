import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { getCorsHeaders, handleCorsPreflightRequest } from '../server/cors.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return handleCorsPreflightRequest(req);
  }

  const corsHeaders = getCorsHeaders(req);

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { user_id, source_order_id } = await req.json();

    if (!user_id || !source_order_id) {
      return new Response(
        JSON.stringify({ error: 'user_id and source_order_id are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 🚀 1차 병렬: 보고서 태그 수 + 미션 쿠폰 마스터 동시 조회
    const [reportResult, missionResult] = await Promise.all([
      supabaseAdmin.from('weekly_reports').select('tag_count').eq('id', source_order_id).maybeSingle(),
      supabaseAdmin.from('coupons').select('*').eq('coupon_type', 'mission').maybeSingle(),
    ]);

    const tagCount = reportResult.data?.tag_count ?? 0;
    console.log(`🏷️ 보고서 ${source_order_id} 태그 수: ${tagCount}`);

    if (tagCount < 5) {
      return new Response(
        JSON.stringify({ success: false, error: '태그 5개 이상 모아야 미션 쿠폰을 받을 수 있습니다', tagCount }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!missionResult.data) {
      return new Response(
        JSON.stringify({ error: '미션 쿠폰을 찾을 수 없습니다' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const missionCoupon = missionResult.data;

    // 🚀 2차 병렬: 미션 쿠폰 수령 여부 + 같은 보고서 중복 발급 동시 체크
    const [issuedResult, duplicateResult] = await Promise.all([
      supabaseAdmin.from('user_coupons').select('id').eq('user_id', user_id).eq('coupon_id', missionCoupon.id).maybeSingle(),
      supabaseAdmin.from('user_coupons').select('id').eq('user_id', user_id).eq('coupon_id', missionCoupon.id).eq('source_order_id', source_order_id).maybeSingle(),
    ]);

    if (issuedResult.error) {
      console.error('⚠️ 미션 쿠폰 체크 에러:', issuedResult.error);
      return new Response(
        JSON.stringify({ error: '쿠폰 확인에 실패했습니다' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (issuedResult.data) {
      console.log(`ℹ️ 이미 미션 쿠폰 수령: user_id=${user_id}`);
      return new Response(
        JSON.stringify({ success: false, error: '이미 미션 쿠폰을 받았습니다', alreadyIssued: true }),
        { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (duplicateResult.data) {
      console.log(`ℹ️ 이미 발급된 쿠폰: source_order_id=${source_order_id}`);
      return new Response(
        JSON.stringify({ success: false, error: '이 보고서에 대한 쿠폰이 이미 발급되었습니다', alreadyIssued: true }),
        { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ⭐ 미션 쿠폰 발급
    const { data: userCoupon, error: insertError } = await supabaseAdmin
      .from('user_coupons')
      .insert({
        user_id,
        coupon_id: missionCoupon.id,
        source_order_id,
        is_used: false,
        expired_at: null,
      })
      .select('*')
      .single();

    if (insertError) {
      console.error('쿠폰 발급 실패:', insertError);
      return new Response(
        JSON.stringify({ error: '쿠폰 발급에 실패했습니다' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`✅ 미션 쿠폰 발급 완료: user_id=${user_id}, tag_count=${tagCount}`);

    return new Response(
      JSON.stringify({
        success: true,
        coupon: userCoupon,
        couponType: 'mission',
        discountAmount: missionCoupon.discount_amount,
        message: '미션 쿠폰이 발급되었습니다',
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
